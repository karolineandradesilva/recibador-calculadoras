// Post-build validation of dist/: every page has the SEO essentials, internal
// links and assets resolve, JSON-LD parses, sitemap and robots are coherent,
// titles and descriptions are unique. Exits non-zero on any error.
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const SITE = 'https://recibador.com.br';
const errors = [];
const warnings = [];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const exists = async (p) => stat(p).then(() => true, () => false);

function resolveUrl(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return null;
  if (clean.endsWith('/')) return path.join(DIST, clean, 'index.html');
  return path.join(DIST, clean);
}

const files = await walk(DIST);
const pages = files.filter((f) => f.endsWith('.html'));
const titles = new Map();
const descriptions = new Map();

for (const file of pages) {
  const rel = `/${path.relative(DIST, file)}`.replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');
  const is404 = rel === '/404.html';
  const get = (re) => html.match(re)?.[1];

  const title = get(/<title>([^<]*)<\/title>/);
  const desc = get(/<meta name="description" content="([^"]*)"/);
  const canonical = get(/<link rel="canonical" href="([^"]*)"/);
  const h1s = html.match(/<h1[\s>]/g) ?? [];

  if (!title) errors.push(`${rel}: sem <title>`);
  if (!desc) errors.push(`${rel}: sem meta description`);
  if (h1s.length !== 1) errors.push(`${rel}: ${h1s.length} <h1>`);
  if (!html.includes('<html lang="pt-BR">')) errors.push(`${rel}: lang ausente`);
  if (!html.includes('name="viewport"')) errors.push(`${rel}: sem viewport`);
  if (!is404) {
    if (canonical !== `${SITE}${rel}`) errors.push(`${rel}: canonical incorreto (${canonical})`);
    if (titles.has(title)) errors.push(`${rel}: título duplicado com ${titles.get(title)}`);
    if (descriptions.has(desc)) errors.push(`${rel}: description duplicada com ${descriptions.get(desc)}`);
    titles.set(title, rel);
    descriptions.set(desc, rel);
    if (!html.includes('property="og:image"')) errors.push(`${rel}: sem og:image`);
  } else if (!html.includes('noindex')) {
    errors.push('404.html deve ter noindex');
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      if (!data['@context'] || !data['@type']) errors.push(`${rel}: JSON-LD sem @context/@type`);
    } catch (err) {
      errors.push(`${rel}: JSON-LD inválido (${err.message})`);
    }
  }

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|data:|#)/.test(href)) {
      if (href.startsWith('http://')) warnings.push(`${rel}: link sem HTTPS ${href}`);
      continue;
    }
    if (!href.startsWith('/')) {
      errors.push(`${rel}: link relativo ${href}`);
      continue;
    }
    const target = resolveUrl(href);
    if (target && !(await exists(target))) errors.push(`${rel}: link quebrado ${href}`);
  }

  if (/NaN|undefined|\[object Object\]/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) {
    errors.push(`${rel}: texto inválido (NaN/undefined) no HTML`);
  }
  if ((html.match(/<img(?![^>]*alt=)/g) ?? []).length) errors.push(`${rel}: imagem sem alt`);
}

// Sitemap.
const sitemap = await readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const loc of locs) {
  if (!loc.startsWith(`${SITE}/`)) errors.push(`sitemap: URL fora do domínio ${loc}`);
  const target = resolveUrl(loc.replace(SITE, ''));
  if (!(await exists(target))) errors.push(`sitemap: URL inexistente ${loc}`);
}
const indexable = pages.filter((p) => !p.endsWith('404.html')).length;
if (locs.length !== indexable) errors.push(`sitemap: ${locs.length} URLs, mas ${indexable} páginas indexáveis`);

const robots = await readFile(path.join(DIST, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) errors.push('robots.txt sem sitemap');
if (!(await exists(path.join(DIST, 'CNAME')))) errors.push('CNAME ausente');

const sizes = await Promise.all(pages.map(async (p) => [(await stat(p)).size, p]));
for (const [size, p] of sizes) if (size > 350_000) warnings.push(`${path.relative(DIST, p)}: HTML grande (${Math.round(size / 1024)} KB)`);

for (const w of warnings) console.warn(`[validate] aviso: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`[validate] ERRO: ${e}`);
  console.error(`[validate] ${errors.length} erro(s)`);
  process.exit(1);
}
console.log(`[validate] OK — ${pages.length} páginas, ${locs.length} URLs no sitemap`);
