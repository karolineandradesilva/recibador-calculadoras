// Page templates: calculator, category, catalog, home, institutional, 404.
import { SITE, CATEGORIES } from '../config/site.js';
import { CURRENT as P } from '../data/params/index.js';
import { dateLabel } from '../lib/format.js';
import { esc, renderFields, renderResult } from '../ui/render.js';
import { parsedDefaults, rawDefaults } from '../ui/values.js';
import { adSlot, breadcrumb, breadcrumbLd, layout, searchBox } from './layout.js';
import { icon } from './icons.js';

const catBySlug = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

export function card(calc, track = 'card') {
  return `<a class="card" href="/${calc.meta.slug}/" data-track="${track}" data-cat="${calc.meta.category}"><span class="card__icon">${icon(calc.meta.icon)}</span><span><span class="card__title">${esc(
    calc.meta.short,
  )}</span><span class="card__desc">${esc(calc.meta.card ?? calc.meta.lead)}</span></span></a>`;
}


/* ------------------------------------------------------------------ */

export function calculatorPage(calc, ctx) {
  const { meta, ui } = calc;
  const cat = catBySlug[meta.category];
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: cat.name, path: `/${cat.slug}/` },
    { name: meta.short, path: `/${meta.slug}/` },
  ];
  const values = rawDefaults(ui.fields);
  const parsed = parsedDefaults(ui.fields);
  const example = ui.compute(parsed);
  const c = calc.content(example, ctx.helpers);

  const sections = [...c.sections];
  if (c.limitations?.length) {
    sections.push({
      id: 'limitacoes',
      title: 'Limitações e premissas',
      html: `<ul>${c.limitations.map((l) => `<li>${l}</li>`).join('')}</ul>`,
    });
  }
  const sourceList = (meta.sources ?? []).map((k) => P.sources[k]).filter(Boolean);
  sourceList.push(...(meta.extraSources ?? []), ...(c.extraSources ?? []));
  if (sourceList.length) {
    sections.push({
      id: 'fontes',
      title: 'Fontes oficiais',
      html: `<ul class="sources">${sourceList
        .map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`)
        .join('')}</ul>${meta.legal ? `<p>Regras revisadas em ${dateLabel(P.reviewedAt)}, com tabelas vigentes em ${P.year}.</p>` : ''}`,
    });
  }
  const toc = sections.length > 3
    ? `<nav class="toc" aria-label="Nesta página"><p>Nesta página</p><ol>${sections
        .map((s) => `<li><a href="#${s.id}">${esc(s.title)}</a></li>`)
        .join('')}${c.faq?.length ? '<li><a href="#perguntas-frequentes">Perguntas frequentes</a></li>' : ''}</ol></nav>`
    : '';

  const article = sections
    .map((s, i) => `<section aria-labelledby="${s.id}"><h2 id="${s.id}">${esc(s.title)}</h2>${s.html}</section>${i === 1 ? adSlot('inContent') : ''}`)
    .join('');
  const faq = c.faq?.length
    ? `<section class="faq" aria-labelledby="perguntas-frequentes"><h2 id="perguntas-frequentes">Perguntas frequentes</h2>${c.faq
        .map((q) => `<details><summary>${esc(q.q)}</summary><div class="faq__a">${q.a}</div></details>`)
        .join('')}</section>`
    : '';

  const related = (meta.related ?? []).map((s) => ctx.bySlug[s]).filter(Boolean);
  const sameCategory = ctx.calculatorsByCategory[meta.category].filter((k) => k.meta.slug !== meta.slug && !meta.related?.includes(k.meta.slug));

  const updated = meta.updated ?? ctx.buildDate;
  const badges = [
    meta.legal ? `<span class="badge badge--brand">${icon('shield')}Regras oficiais de ${P.year}</span>` : '',
    `<span class="badge">${icon('calendar')}Atualizada em ${dateLabel(updated)}</span>`,
    '<span class="badge">Gratuita e sem cadastro</span>',
  ].join('');

  const disclaimer = meta.legal
    ? `Estimativa com base nas regras vigentes em ${P.year}. Não substitui o cálculo oficial do empregador, do contador ou de um advogado. <a href="/avisos/">Avisos e limitações</a>.`
    : 'Resultado matemático e estimativo, para apoio à decisão. Confira condições reais com a instituição ou o profissional responsável. <a href="/avisos/">Avisos e limitações</a>.';

  const body = `<div class="wrap" data-cat="${meta.category}">
${breadcrumb(crumbs)}
<header class="page-head">
  <p class="eyebrow">${esc(cat.name)}</p>
  <h1>${esc(meta.h1)}</h1>
  <p class="lead">${meta.lead}</p>
  <div class="badges">${badges}</div>
</header>
<div class="calc-layout">
  <div>
    <div class="calc" data-calc>
      <div class="calc__grid">
        <form class="calc__form" novalidate aria-label="${esc(meta.short)}: dados para o cálculo">
          ${renderFields(ui.fields, values, parsed)}
          <div class="calc__actions">
            <button type="submit" class="btn btn--primary"><span class="eq" aria-hidden="true"><i></i><i></i></span>Calcular</button>
            <button type="button" class="btn btn--ghost" data-action="reset" aria-label="Limpar todos os campos">${icon('refresh')}<span>Limpar</span></button>
          </div>
        </form>
        <div class="calc__result" tabindex="-1" aria-labelledby="res-title">
          <h2 class="sr-only" id="res-title">Resultado</h2>
          <p class="print-only"><strong>${esc(meta.h1)}</strong> — recibador.com.br</p>
          <div data-result aria-live="polite">${renderResult(example)}</div>
          <p class="sr-only" data-status role="status"></p>
          <div class="result-tools">
            ${meta.share === false ? '' : `<button type="button" class="btn btn--ghost btn--sm" data-action="share">${icon('share')}<span>Compartilhar</span></button>`}
            <button type="button" class="btn btn--ghost btn--sm" data-action="copy">${icon('copy')}<span>Copiar</span></button>
            <button type="button" class="btn btn--ghost btn--sm" data-action="print">${icon('print')}<span>Imprimir</span></button>
          </div>
          <p class="result-disclaimer">${disclaimer}</p>
        </div>
      </div>
    </div>
    ${adSlot('afterResult')}
    <article class="article">
      ${c.intro ? `<div class="article__intro">${c.intro}</div>` : ''}
      ${toc}
      ${article}
      ${faq}
      <div class="disclaimer-box">${icon('info')}<p><strong>Importante:</strong> o Recibador é uma ferramenta gratuita de apoio. Os resultados são estimativas baseadas nas informações digitadas e nas regras gerais descritas acima; convenções coletivas, decisões judiciais e situações específicas podem alterar os valores. Para decisões, confirme com o RH, um contador ou um advogado. Veja <a href="/avisos/">avisos e limitações</a> e a <a href="/metodologia/">metodologia</a>.</p></div>
    </article>
  </div>
  <aside class="aside" aria-label="Calculadoras relacionadas">
    ${related.length ? `<div class="panel"><h2>Relacionadas</h2><ul class="link-list">${related.map((r) => `<li><a href="/${r.meta.slug}/" data-track="related_sidebar">${esc(r.meta.short)}</a></li>`).join('')}</ul></div>` : ''}
    <div class="panel"><h2>${esc(cat.name)}</h2><ul class="link-list">${sameCategory.slice(0, 8).map((r) => `<li><a href="/${r.meta.slug}/" data-track="category_sidebar">${esc(r.meta.short)}</a></li>`).join('')}<li><a href="/${cat.slug}/">Todas de ${esc(cat.short.toLowerCase())}</a></li></ul></div>
    ${adSlot('sidebar')}
  </aside>
</div>
${related.length ? `<section class="section related-section" aria-labelledby="rel"><div class="section__head"><h2 id="rel">Continue calculando</h2></div><div class="cards">${related.slice(0, 6).map((r) => card(r, 'related_bottom')).join('')}</div></section>` : ''}
</div>`;

  const url = `${SITE.url}/${meta.slug}/`;
  const jsonLd = [
    breadcrumbLd(crumbs),
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: meta.h1,
      url,
      description: meta.description,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requer JavaScript para recalcular; o resultado de exemplo funciona sem JavaScript.',
      inLanguage: 'pt-BR',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
      dateModified: updated,
      publisher: { '@id': `${SITE.url}/#organization` },
    },
  ];
  if (c.faq?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faq.map((q) => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: { '@type': 'Answer', text: q.a.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() },
      })),
    });
  }

  return layout(
    {
      path: `/${meta.slug}/`,
      title: meta.title,
      ogTitle: meta.h1,
      description: meta.description,
      body,
      jsonLd,
      scripts: [ctx.assets.calculators[meta.slug]],
      current: meta.category,
      modified: updated,
    },
    ctx,
  );
}

/* ------------------------------------------------------------------ */

export function categoryPage(cat, ctx) {
  const calcs = ctx.calculatorsByCategory[cat.slug];
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: cat.name, path: `/${cat.slug}/` },
  ];
  const others = CATEGORIES.filter((c) => c.slug !== cat.slug);
  const body = `<div class="wrap" data-cat="${cat.slug}">
${breadcrumb(crumbs)}
<header class="page-head">
  <p class="eyebrow">${calcs.length} calculadoras</p>
  <h1>Calculadoras de ${esc(cat.name.toLowerCase())}</h1>
  <p class="lead">${esc(cat.intro)}</p>
</header>
<div class="cards">${calcs.map((k) => card(k, 'category')).join('')}</div>
${adSlot('inContent')}
<section class="section" aria-labelledby="outras"><div class="section__head"><h2 id="outras">Outras categorias</h2></div>
<div class="quick">${others.map((c) => `<a class="chip" data-cat="${c.slug}" href="/${c.slug}/">${esc(c.name)}</a>`).join('')}</div></section>
</div>`;
  return layout(
    {
      path: `/${cat.slug}/`,
      title: `Calculadoras de ${cat.name} ${P.year} — Recibador`,
      description: `${cat.description} Grátis, sem cadastro e com o cálculo explicado.`,
      body,
      current: cat.slug,
      jsonLd: [
        breadcrumbLd(crumbs),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `Calculadoras de ${cat.name}`,
          url: `${SITE.url}/${cat.slug}/`,
          inLanguage: 'pt-BR',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: calcs.map((k, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE.url}/${k.meta.slug}/`, name: k.meta.h1 })),
          },
        },
      ],
    },
    ctx,
  );
}

export function catalogPage(ctx) {
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: 'Todas as calculadoras', path: '/calculadoras/' },
  ];
  const body = `<div class="wrap">
${breadcrumb(crumbs)}
<header class="page-head">
  <h1>Todas as calculadoras</h1>
  <p class="lead">${ctx.calculators.length} calculadoras gratuitas, organizadas por assunto. Use a busca para ir direto ao que você precisa.</p>
  <div style="max-width:560px">${searchBox({ id: 'q-all', big: true, placeholder: 'Ex.: rescisão, férias, juros compostos' })}</div>
</header>
${CATEGORIES.map(
  (c) => `<section class="section" data-cat="${c.slug}" aria-labelledby="c-${c.slug}"><div class="section__head"><h2 id="c-${c.slug}">${esc(c.name)}</h2><a href="/${c.slug}/">Ver categoria →</a></div><div class="cards">${ctx.calculatorsByCategory[c.slug]
    .map((k) => card(k, 'catalog'))
    .join('')}</div></section>`,
).join('')}
</div>`;
  return layout(
    {
      path: '/calculadoras/',
      title: `Todas as calculadoras (${ctx.calculators.length}) — Recibador`,
      description: 'Lista completa de calculadoras gratuitas do Recibador: trabalho, impostos, juros, investimentos, inflação, negócios e contas do dia a dia.',
      body,
      current: 'all',
      jsonLd: [breadcrumbLd(crumbs)],
    },
    ctx,
  );
}

/* ------------------------------------------------------------------ */

export function homePage(ctx) {
  const popular = ctx.popular.slice(0, 12).map((s) => ctx.bySlug[s]).filter(Boolean);
  const quick = ['rescisao-trabalhista', 'ferias', 'decimo-terceiro', 'porcentagem', 'juros-compostos', 'clt-x-pj']
    .map((s) => ctx.bySlug[s])
    .filter(Boolean);
  const body = `<div class="wrap">
<section class="home-hero" aria-labelledby="hero-title">
  <div>
    <p class="eyebrow">Grátis · regras oficiais de ${P.year}</p>
    <h1 id="hero-title">Calcule o que é <em>seu</em>.</h1>
    <p class="lead">Salário, férias, rescisão, impostos, juros e investimentos. Respostas em segundos, com a conta explicada e as fontes oficiais.</p>
    ${searchBox({ id: 'q-home', big: true, placeholder: 'O que você quer calcular?' })}
    <div class="quick" aria-label="Atalhos">${quick.map((k) => `<a class="chip" data-cat="${k.meta.category}" href="/${k.meta.slug}/" data-track="home_chip">${esc(k.meta.short)}</a>`).join('')}</div>
  </div>
  <form class="demo" data-demo aria-labelledby="demo-title" novalidate>
    <p class="demo__tag" id="demo-title"><i aria-hidden="true"></i>Salário líquido ao vivo</p>
    <label for="demo-salary">Seu salário bruto</label>
    <div class="demo__input"><span aria-hidden="true">R$</span><input id="demo-salary" name="salary" type="text" inputmode="decimal" autocomplete="off" value="3.500,00" aria-describedby="demo-out"></div>
    <p class="demo__eq">você recebe</p>
    <p class="demo__out" id="demo-out" aria-live="polite" data-demo-net>R$ 3.191,40</p>
    <dl class="demo__rows">
      <div><dt>INSS</dt><dd data-demo-inss>R$ 308,60</dd></div>
      <div><dt>IR</dt><dd data-demo-irrf>R$ 0,00</dd></div>
      <div><dt>FGTS</dt><dd data-demo-fgts>R$ 280,00</dd></div>
    </dl>
    <a class="demo__cta" href="/salario-liquido/" data-track="home_demo">Ver demonstrativo completo →</a>
  </form>
</section>

<div class="stats" role="list">
  <div class="stat" role="listitem"><b>${ctx.calculators.length}</b><span>calculadoras gratuitas</span></div>
  <div class="stat" role="listitem"><b>${P.year}</b><span>tabelas oficiais de INSS, IR e FGTS</span></div>
  <div class="stat" role="listitem"><b>Diário</b><span>índices e taxas do Banco Central</span></div>
  <div class="stat" role="listitem"><b>0</b><span>cadastros — seus dados ficam no seu aparelho</span></div>
</div>

<section class="section" aria-labelledby="pop"><div class="section__head"><h2 id="pop">Mais usadas</h2><a href="/calculadoras/">Ver todas as ${ctx.calculators.length} →</a></div>
<div class="cards">${popular.map((k) => card(k, 'home_popular')).join('')}</div></section>

<section class="section" aria-labelledby="cats"><div class="section__head"><h2 id="cats">Por assunto</h2></div>
<div class="cat-grid">${CATEGORIES.map(
    (c) => `<div class="cat" data-cat="${c.slug}"><h3><a href="/${c.slug}/">${esc(c.name)}</a></h3><p>${esc(c.description)}</p><ul>${ctx.calculatorsByCategory[c.slug]
      .slice(0, 8)
      .map((k) => `<li><a href="/${k.meta.slug}/" data-track="home_category">${esc(k.meta.short)}</a></li>`)
      .join('')}</ul></div>`,
  ).join('')}</div></section>

<section class="section" aria-labelledby="why"><div class="section__head"><h2 id="why">Feito para você confiar</h2></div>
<div class="trust">
  <div class="trust__item">${icon('shield')}<h3>Regras oficiais</h3><p>INSS, Imposto de Renda, salário mínimo e demais tabelas de ${P.year} vêm de leis, portarias e páginas oficiais, citadas em cada calculadora.</p></div>
  <div class="trust__item">${icon('refresh')}<h3>Sempre atualizado</h3><p>Inflação, CDI, Selic, poupança e câmbio são atualizados automaticamente todos os dias com dados do Banco Central.</p></div>
  <div class="trust__item">${icon('file')}<h3>Conta explicada</h3><p>Fórmula, exemplo resolvido, premissas e limitações em cada página. Você entende o resultado, não só recebe um número.</p></div>
  <div class="trust__item">${icon('check')}<h3>Testado e privado</h3><p>Centenas de testes automáticos a cada atualização. E os valores que você digita nunca saem do seu navegador.</p></div>
</div></section>

<section class="band" aria-labelledby="band-title">
  <div><h2 id="band-title">Qual conta você precisa fazer hoje?</h2><p>Busque entre ${ctx.calculators.length} calculadoras de trabalho, impostos, finanças e dia a dia.</p></div>
  ${searchBox({ id: 'q-band', big: true, placeholder: 'Ex.: seguro-desemprego' })}
</section>
</div>`;
  return layout(
    {
      path: '/',
      title: `Recibador — Calculadoras de salário, rescisão, impostos e juros ${P.year}`,
      ogTitle: 'Recibador — Calcule o que é seu.',
      description: SITE.description,
      body,
      current: 'home',
      scripts: [ctx.assets.home],
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': `${SITE.url}/#organization`,
          name: 'Recibador',
          url: `${SITE.url}/`,
          logo: `${SITE.url}/icon-512.png`,
          email: SITE.email,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': `${SITE.url}/#website`,
          name: 'Recibador',
          alternateName: 'Recibador — Calcule o que é seu.',
          url: `${SITE.url}/`,
          inLanguage: 'pt-BR',
          publisher: { '@id': `${SITE.url}/#organization` },
        },
      ],
    },
    ctx,
  );
}

/* ------------------------------------------------------------------ */

export function institutionalPage(page, ctx) {
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: page.title, path: `/${page.slug}/` },
  ];
  const body = `<div class="wrap">
${breadcrumb(crumbs)}
<article class="prose">
  <h1>${esc(page.title)}</h1>
  ${page.updated ? `<p class="badges"><span class="badge">${icon('calendar')}Atualizado em ${dateLabel(page.updated)}</span></p>` : ''}
  ${page.html}
</article>
</div>`;
  return layout(
    {
      path: `/${page.slug}/`,
      title: `${page.title} — Recibador`,
      description: page.description,
      body,
      jsonLd: [breadcrumbLd(crumbs)],
    },
    ctx,
  );
}

export function notFoundPage(ctx) {
  const popular = ctx.popular.slice(0, 9).map((s) => ctx.bySlug[s]).filter(Boolean);
  const body = `<div class="wrap">
<section class="notfound">
  <p class="notfound__code">404</p>
  <h1>Essa página não existe (ou mudou de lugar).</h1>
  <p class="lead">O endereço pode ter sido digitado errado ou a página foi removida. Busque a calculadora que você procura:</p>
  ${searchBox({ id: 'q-404', big: true, placeholder: 'Ex.: salário líquido, férias, juros' })}
  <p style="margin-top:18px"><a class="btn btn--primary" href="/">Ir para a página inicial</a></p>
</section>
<section class="section" aria-labelledby="sugestoes"><div class="section__head"><h2 id="sugestoes">Calculadoras mais usadas</h2><a href="/calculadoras/">Ver todas →</a></div>
<div class="cards">${popular.map((k) => card(k, '404')).join('')}</div></section>
<section class="section" aria-labelledby="cats404"><div class="section__head"><h2 id="cats404">Categorias</h2></div>
<div class="quick">${CATEGORIES.map((c) => `<a class="chip" data-cat="${c.slug}" href="/${c.slug}/">${esc(c.name)}</a>`).join('')}</div></section>
</div>`;
  return layout(
    {
      path: '/404.html',
      title: 'Página não encontrada — Recibador',
      description: 'A página procurada não foi encontrada. Busque entre as calculadoras gratuitas do Recibador.',
      body,
      noindex: true,
    },
    ctx,
  );
}
