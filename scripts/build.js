// Static site build: bundles the browser code with esbuild and renders every
// page to dist/. No framework; templates are plain functions.
import { build as esbuild, transform } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE, CATEGORIES } from '../src/config/site.js';
import { CALCULATORS, POPULAR } from '../src/calculators/index.js';
import { INSTITUTIONAL_PAGES } from '../src/pages/institutional.js';
import { CURRENT as P } from '../src/data/params/index.js';
import { brl, dateLabel, num, pct } from '../src/lib/format.js';
import { esc } from '../src/ui/render.js';
import { calculatorPage, catalogPage, categoryPage, homePage, institutionalPage, notFoundPage } from '../src/templates/pages.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const TMP = path.join(ROOT, '.build');

const started = Date.now();
const buildDate = new Date().toISOString().slice(0, 10);

function checkRegistry() {
  const slugs = new Set();
  const reserved = new Set([...CATEGORIES.map((c) => c.slug), ...INSTITUTIONAL_PAGES.map((p) => p.slug), 'calculadoras', 'assets', 'og']);
  for (const c of CALCULATORS) {
    const { meta, ui, content } = c;
    if (!meta?.slug || !ui?.compute || typeof content !== 'function') throw new Error(`Calculadora incompleta: ${meta?.slug}`);
    if (slugs.has(meta.slug) || reserved.has(meta.slug)) throw new Error(`Slug duplicado: ${meta.slug}`);
    if (!CATEGORIES.some((cat) => cat.slug === meta.category)) throw new Error(`Categoria inválida em ${meta.slug}`);
    if (meta.title.length > 70) console.warn(`[build] título longo (${meta.title.length}) em ${meta.slug}`);
    if (meta.description.length < 110 || meta.description.length > 165) console.warn(`[build] description com ${meta.description.length} caracteres em ${meta.slug}`);
    slugs.add(meta.slug);
  }
  for (const c of CALCULATORS) {
    for (const r of c.meta.related ?? []) {
      if (slugs.has(r)) continue;
      if (process.env.RECIBADOR_DRAFT) console.warn(`[build] relacionada inexistente "${r}" em ${c.meta.slug}`);
      else throw new Error(`Relacionada inexistente "${r}" em ${c.meta.slug}`);
    }
  }
}

// Central Bank data changes daily. Instead of bundling it (which would change
// the JS file hashes every day and break HTML cached at the edge), the browser
// bundles read it from an inline <script> that each page carries.
const inlineDataPlugin = {
  name: 'inline-data',
  setup(b) {
    b.onResolve({ filter: /data\/(indices|rates)\.json$/ }, (args) => ({ path: path.basename(args.path, '.json'), namespace: 'rdata' }));
    b.onLoad({ filter: /.*/, namespace: 'rdata' }, (args) => ({
      contents: `const d = globalThis.__RD && globalThis.__RD[${JSON.stringify(args.path)}];\nif (!d) throw new Error('Dados do Banco Central indisponíveis nesta página.');\nexport default d;\n`,
      loader: 'js',
    }));
  },
};

async function dataNeeds(calc) {
  const src = await readFile(path.join(ROOT, 'src/calculators', calc.file), 'utf8');
  const needs = [];
  if (src.includes("'./_indices.js'")) needs.push('indices');
  if (src.includes("'./_rates.js'")) needs.push('rates');
  return needs;
}

async function bundle() {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(path.join(TMP, 'entries'), { recursive: true });
  const entryPoints = { site: path.join(ROOT, 'src/client/site.js'), home: path.join(ROOT, 'src/client/home.js') };
  for (const c of CALCULATORS) {
    const file = path.join(TMP, 'entries', `${c.meta.slug}.js`);
    const src = `import { ui } from ${JSON.stringify(path.join(ROOT, 'src/calculators', c.file))};
import { mount } from ${JSON.stringify(path.join(ROOT, 'src/client/calculator.js'))};
mount(ui, ${JSON.stringify({ slug: c.meta.slug, title: c.meta.h1 })});
`;
    await writeFile(file, src);
    entryPoints[`calc-${c.meta.slug}`] = file;
  }
  const result = await esbuild({
    entryPoints,
    bundle: true,
    splitting: true,
    format: 'esm',
    minify: true,
    target: ['es2021', 'chrome90', 'safari15', 'firefox90'],
    outdir: path.join(DIST, 'assets/js'),
    entryNames: '[name]-[hash]',
    chunkNames: 'c/[hash]',
    metafile: true,
    legalComments: 'none',
    treeShaking: true,
    logLevel: 'warning',
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [inlineDataPlugin],
  });
  const assets = { site: '', home: '', calculators: {} };
  for (const [out, info] of Object.entries(result.metafile.outputs)) {
    if (!info.entryPoint) continue;
    const url = `/${path.relative(DIST, path.join(ROOT, out)).split(path.sep).join('/')}`;
    const name = path.basename(info.entryPoint, '.js');
    if (info.entryPoint.endsWith('src/client/site.js')) assets.site = url;
    else if (info.entryPoint.endsWith('src/client/home.js')) assets.home = url;
    else assets.calculators[name] = url;
  }
  const sizes = Object.values(result.metafile.outputs).map((o) => o.bytes);
  console.log(`[build] js: ${sizes.length} arquivos, maior ${(Math.max(...sizes) / 1024).toFixed(1)} KB`);
  return assets;
}

async function css() {
  const raw = await readFile(path.join(ROOT, 'src/styles/main.css'), 'utf8');
  const { code } = await transform(raw, { loader: 'css', minify: true, target: ['chrome100', 'safari15', 'firefox100'] });
  return code.trim();
}

async function writePage(urlPath, html) {
  const file = urlPath.endsWith('.html') ? path.join(DIST, urlPath) : path.join(DIST, urlPath, 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html.replace(/\n\s*\n/g, '\n'));
}

function sitemap(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${SITE.url}${e.path}</loc><lastmod>${e.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}

async function main() {
  checkRegistry();
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const [assets, styles] = await Promise.all([bundle(), css()]);

  const bySlug = Object.fromEntries(CALCULATORS.map((c) => [c.meta.slug, c]));
  const calculatorsByCategory = Object.fromEntries(CATEGORIES.map((c) => [c.slug, CALCULATORS.filter((k) => k.meta.category === c.slug)]));
  const ctx = {
    assets,
    css: styles,
    calculators: CALCULATORS,
    bySlug,
    calculatorsByCategory,
    popular: POPULAR,
    buildDate,
    buildYear: Number(buildDate.slice(0, 4)),
    helpers: {
      brl,
      num,
      pct,
      P,
      esc,
      dateLabel,
      link: (slug, text) => {
        if (!bySlug[slug] && !process.env.RECIBADOR_DRAFT) throw new Error(`Link interno para calculadora inexistente: ${slug}`);
        return `<a href="/${slug}/">${text}</a>`;
      },
      // Content tables stack into cards on narrow screens (see .table--stack).
      table: (columns, rows) => {
        const label = (i) => esc(String(columns[i]).replace(/<[^>]+>/g, ''));
        return `<div class="table-wrap table--stack"><table><thead><tr>${columns.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row" data-label="${label(i)}">${c}</th>` : `<td data-label="${label(i)}">${c}</td>`)).join('')}</tr>`)
          .join('')}</tbody></table></div>`;
      },
    },
  };

  const sitemapEntries = [{ path: '/', lastmod: buildDate }, { path: '/calculadoras/', lastmod: buildDate }];

  await writePage('/', homePage(ctx));
  await writePage('/calculadoras/', catalogPage(ctx));
  for (const cat of CATEGORIES) {
    await writePage(`/${cat.slug}/`, categoryPage(cat, ctx));
    sitemapEntries.push({ path: `/${cat.slug}/`, lastmod: buildDate });
  }
  const DATA = {
    indices: JSON.parse(await readFile(path.join(ROOT, 'src/data/indices.json'), 'utf8')),
    rates: JSON.parse(await readFile(path.join(ROOT, 'src/data/rates.json'), 'utf8')),
  };
  for (const calc of CALCULATORS) {
    const needs = await dataNeeds(calc);
    ctx.pageData = needs.length ? Object.fromEntries(needs.map((k) => [k, DATA[k]])) : null;
    await writePage(`/${calc.meta.slug}/`, calculatorPage(calc, ctx));
    ctx.pageData = null;
    // Pages that depend on daily data change with every data update.
    const lastmod = calc.meta.dynamicData ? buildDate : calc.meta.updated ?? buildDate;
    sitemapEntries.push({ path: `/${calc.meta.slug}/`, lastmod });
  }
  for (const page of INSTITUTIONAL_PAGES) {
    await writePage(`/${page.slug}/`, institutionalPage(page, ctx));
    sitemapEntries.push({ path: `/${page.slug}/`, lastmod: page.updated ?? buildDate });
  }
  await writePage('/404.html', notFoundPage(ctx));

  // Search index (loaded on demand by the search box).
  const catName = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));
  const popularity = Object.fromEntries(POPULAR.map((s, i) => [s, POPULAR.length - i]));
  const index = CALCULATORS.map((c) => ({
    t: c.meta.short,
    d: c.meta.card ?? '',
    c: catName[c.meta.category],
    k: (c.meta.keywords ?? []).join(' '),
    u: `/${c.meta.slug}/`,
    p: popularity[c.meta.slug] ?? 0,
  }));
  await writeFile(path.join(DIST, 'search-index.json'), JSON.stringify(index));

  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap(sitemapEntries));
  await writeFile(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /search-index.json\n\nSitemap: ${SITE.url}/sitemap.xml\n`,
  );
  await writeFile(path.join(DIST, 'CNAME'), 'recibador.com.br\n');
  await writeFile(path.join(DIST, '.nojekyll'), '');
  if (SITE.adsenseClient) {
    const pub = SITE.adsenseClient.replace(/^ca-/, '');
    await writeFile(path.join(DIST, 'ads.txt'), `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
  }
  await writeFile(
    path.join(DIST, 'site.webmanifest'),
    JSON.stringify({
      name: 'Recibador — Calcule o que é seu.',
      short_name: 'Recibador',
      description: SITE.description,
      lang: 'pt-BR',
      start_url: '/?utm_source=pwa',
      scope: '/',
      display: 'standalone',
      background_color: '#f7f6f1',
      theme_color: SITE.themeColor,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
  );
  await mkdir(path.join(DIST, '.well-known'), { recursive: true });
  const expires = new Date(Date.now() + 330 * 86400000).toISOString().replace(/\.\d+Z$/, 'Z');
  await writeFile(
    path.join(DIST, '.well-known/security.txt'),
    `Contact: mailto:${SITE.email}\nExpires: ${expires}\nPreferred-Languages: pt, en\nCanonical: ${SITE.url}/.well-known/security.txt\n`,
  );

  // Static files (favicons, OG images).
  const staticDir = path.join(ROOT, 'src/static');
  if (existsSync(staticDir) && (await readdir(staticDir)).length) await cp(staticDir, DIST, { recursive: true });

  await rm(TMP, { recursive: true, force: true });
  console.log(
    `[build] ${CALCULATORS.length} calculadoras, ${sitemapEntries.length} URLs no sitemap, regras de ${P.year} — ${Date.now() - started} ms`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
