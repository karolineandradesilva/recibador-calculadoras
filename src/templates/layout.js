import { SITE, CATEGORIES } from '../config/site.js';
import { esc } from '../ui/render.js';
import { icon, LOGO_MARK } from './icons.js';

export function searchBox({ id, big = false, placeholder = 'Buscar calculadora…' }) {
  return `<form class="search${big ? ' search--big' : ''}" role="search" data-search action="/calculadoras/">
  <label class="sr-only" for="${id}">Buscar calculadora</label>
  <input id="${id}" type="search" name="q" placeholder="${esc(placeholder)}" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="${id}-list" aria-autocomplete="list" enterkeyhint="search">
  <ul class="search__results" id="${id}-list" role="listbox" data-search-results hidden></ul>
</form>`;
}

function header(current) {
  const link = (href, label, cat, active) =>
    `<li><a href="${href}" data-cat="${cat ?? 'all'}"${active ? ' aria-current="page"' : ''}><span class="nav__dot" aria-hidden="true"></span>${esc(label)}</a></li>`;
  const links = CATEGORIES.map((c) => link(`/${c.slug}/`, c.short, c.slug, current === c.slug)).join('') + link('/calculadoras/', 'Todas', null, current === 'all');
  const mobileLinks = link('/', 'Início', 'home', current === 'home') + CATEGORIES.map((c) => link(`/${c.slug}/`, c.name, c.slug, current === c.slug)).join('') + link('/calculadoras/', 'Todas as calculadoras', null, current === 'all');
  return `<header class="site-header">
  <div class="wrap site-header__bar">
    <a class="logo" href="/" aria-label="Recibador — página inicial">${LOGO_MARK}<span>Recibador</span></a>
    <nav class="nav" aria-label="Categorias"><ul>${links}</ul></nav>
    <div class="header-search">${searchBox({ id: 'q-head' })}</div>
    <button class="menu-btn" type="button" data-menu-open aria-expanded="false" aria-controls="mobile-nav" aria-label="Abrir menu">${icon('menu')}</button>
  </div>
</header>
<div class="mnav" id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu" hidden>
  <div class="mnav__bar wrap">
    <a class="logo" href="/" aria-label="Recibador — página inicial">${LOGO_MARK}<span>Recibador</span></a>
    <button class="menu-btn" type="button" data-menu-close aria-label="Fechar menu">${icon('close')}</button>
  </div>
  <div class="mnav__body wrap">
    ${searchBox({ id: 'q-nav' })}
    <nav aria-label="Categorias"><ul class="mnav__list">${mobileLinks}</ul></nav>
  </div>
</div>`;
}

function footer({ calculatorsByCategory, buildYear }) {
  const cols = CATEGORIES.slice(0, 3)
    .map(
      (c) => `<div><h2>${esc(c.name)}</h2><ul>${(calculatorsByCategory[c.slug] ?? [])
        .slice(0, 6)
        .map((k) => `<li><a href="/${k.meta.slug}/">${esc(k.meta.short)}</a></li>`)
        .join('')}<li><a href="/${c.slug}/">Ver todas →</a></li></ul></div>`,
    )
    .join('');
  const consentLink = SITE.gaId || SITE.adsenseClient ? '<li><button type="button" class="linkish" data-consent-open>Preferências de cookies</button></li>' : '';
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="logo" href="/">${LOGO_MARK}<span>Recibador</span></a>
        <p>${esc(SITE.tagline)} Calculadoras gratuitas com as regras oficiais, dados atualizados todos os dias e cada conta explicada.</p>
      </div>
      ${cols}
      <div><h2>Recibador</h2><ul>
        <li><a href="/sobre/">Sobre</a></li>
        <li><a href="/metodologia/">Metodologia</a></li>
        <li><a href="/avisos/">Avisos e limitações</a></li>
        <li><a href="/contato/">Contato</a></li>
        <li><a href="/privacidade/">Privacidade</a></li>
        <li><a href="/cookies/">Cookies</a></li>
        <li><a href="/termos/">Termos de uso</a></li>
        ${consentLink}
      </ul></div>
    </div>
    <div class="footer-bottom">
      <p>© <span data-year>${buildYear}</span> Recibador. Ferramenta gratuita de apoio; os resultados são estimativas e não substituem orientação profissional.</p>
      <p><a href="/calculadoras/">Todas as calculadoras</a> · <a href="/metodologia/">Metodologia</a></p>
    </div>
  </div>
</footer>`;
}

function consentBanner() {
  if (!SITE.gaId && !SITE.adsenseClient) return '';
  return `<div class="consent" data-consent hidden role="region" aria-label="Preferências de cookies">
  <p>Usamos cookies para medir a audiência${SITE.adsenseClient ? ' e exibir anúncios' : ''}. Os seus cálculos nunca saem do seu navegador. <a href="/cookies/">Saiba mais</a>.</p>
  <div class="consent__actions">
    <button type="button" class="btn btn--ghost btn--sm" data-consent-choice="reject">Recusar</button>
    <button type="button" class="btn btn--primary btn--sm" data-consent-choice="accept">Aceitar</button>
  </div>
</div>`;
}

function analyticsHead() {
  let html = '';
  if (SITE.cfBeaconToken) {
    html += `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${SITE.cfBeaconToken}"}'></script>`;
  }
  if (SITE.gaId) {
    html += `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});try{if(localStorage.getItem('recibador-consent-v1')==='granted')gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'})}catch(e){}gtag('js',new Date());gtag('config','${SITE.gaId}',{anonymize_ip:true});</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${SITE.gaId}"></script>`;
  }
  if (SITE.adsenseClient) {
    html += `<meta name="google-adsense-account" content="${SITE.adsenseClient}">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsenseClient}" crossorigin="anonymous"></script>`;
  }
  return html;
}

/**
 * @param {object} page
 * @param {string} page.path URL path starting and ending with "/"
 * @param {string} page.title full <title>
 * @param {string} page.description
 * @param {string} page.body main HTML
 * @param {object[]} [page.jsonLd]
 * @param {string[]} [page.scripts] module script URLs
 * @param {string} [page.current] active nav item
 * @param {boolean} [page.noindex]
 * @param {string} [page.ogType]
 * @param {string} [page.ogImage]
 */
export function layout(page, ctx) {
  const canonical = `${SITE.url}${page.path}`;
  const ogImage = page.ogImage ?? `${SITE.url}/og/recibador.png`;
  const jsonLd = (page.jsonLd ?? [])
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`)
    .join('\n');
  const inlineData = ctx.pageData ? `<script>window.__RD=${JSON.stringify(ctx.pageData).replace(/</g, '\\u003c')}</script>\n` : '';
  const scripts = inlineData + [ctx.assets.site, ...(page.scripts ?? [])]
    .map((s) => `<script type="module" src="${s}"></script>`)
    .join('\n');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
${page.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'}
${page.noindex && page.path === '/404.html' ? '' : `<link rel="canonical" href="${canonical}">`}
<meta name="theme-color" content="${SITE.themeColor}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1513" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:site_name" content="Recibador">
<meta property="og:locale" content="pt_BR">
<meta property="og:type" content="${page.ogType ?? 'website'}">
<meta property="og:title" content="${esc(page.ogTitle ?? page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Recibador — Calcule o que é seu.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.ogTitle ?? page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${ogImage}">
${page.modified ? `<meta property="article:modified_time" content="${page.modified}">` : ''}
<link rel="preload" href="/fonts/bricolage-grotesque-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
<style>${ctx.css}</style>
${analyticsHead()}
${jsonLd}
${scripts}
</head>
<body>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
${header(page.current)}
<main id="conteudo" tabindex="-1">
${page.body}
</main>
${footer(ctx)}
${consentBanner()}
</body>
</html>
`;
}

export function breadcrumb(items) {
  return `<nav class="crumbs" aria-label="Você está em"><ol>${items
    .map((it, i) => (i === items.length - 1 ? `<li aria-current="page">${esc(it.name)}</li>` : `<li><a href="${it.path}">${esc(it.name)}</a></li>`))
    .join('')}</ol></nav>`;
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.path}`,
    })),
  };
}

/** AdSense slot. Renders nothing until the publisher ID and slot ID exist. */
export function adSlot(kind) {
  const slot = SITE.adSlots[kind];
  if (!SITE.adsenseClient || !slot) return '';
  const cls = kind === 'sidebar' ? 'ad ad--sidebar' : 'ad';
  return `<aside class="${cls}" aria-label="Publicidade"><span class="ad__label">Publicidade</span><ins class="adsbygoogle" data-ad-client="${SITE.adsenseClient}" data-ad-slot="${slot}"${
    kind === 'sidebar' ? '' : ' data-ad-format="auto" data-full-width-responsive="true"'
  }></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></aside>`;
}
