// Site-wide behavior: navigation, search, consent, internal link tracking.
import { track } from './track.js';

const CONSENT_KEY = 'recibador-consent-v1';

function storage(action, key, value) {
  try {
    if (action === 'get') return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: behave as "no choice yet".
  }
  return null;
}

/* Footer year stays correct even if a build is older than New Year. */
for (const el of document.querySelectorAll('[data-year]')) el.textContent = String(new Date().getFullYear());

/* Mobile navigation. */
const menuBtn = document.querySelector('[data-menu-toggle]');
const nav = document.getElementById('site-nav');
if (menuBtn && nav) {
  const setOpen = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.documentElement.classList.toggle('nav-open', open);
  };
  menuBtn.addEventListener('click', () => setOpen(menuBtn.getAttribute('aria-expanded') !== 'true'));
  // Closing on navigation keeps the back/forward cache from restoring an open menu.
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  window.addEventListener('pageshow', () => setOpen(false));
  // Leaving the mobile breakpoint with the menu open must not leave the page locked.
  matchMedia('(min-width: 1000px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.documentElement.classList.contains('nav-open')) {
      setOpen(false);
      menuBtn.focus();
    }
  });
}

/* Search (index loaded on demand). */
let indexPromise = null;
const loadIndex = () => {
  indexPromise ??= fetch('/search-index.json').then((r) => r.json()).catch(() => []);
  return indexPromise;
};
const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function score(item, terms) {
  const title = normalize(item.t);
  const hay = normalize(`${item.t} ${item.c} ${item.k} ${item.d}`);
  let s = 0;
  for (const t of terms) {
    if (!hay.includes(t)) return 0;
    s += title.includes(t) ? 3 : 1;
    if (title.startsWith(t)) s += 2;
  }
  return s + (item.p || 0) * 0.01;
}

function setupSearch(box) {
  const input = box.querySelector('input[type="search"]');
  const list = box.querySelector('[data-search-results]');
  if (!input || !list) return;
  let active = -1;
  const render = async () => {
    const q = normalize(input.value.trim());
    const index = await loadIndex();
    if (!q) {
      list.innerHTML = '';
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      return;
    }
    const terms = q.split(/\s+/).filter(Boolean);
    const hits = index
      .map((i) => [score(i, terms), i])
      .filter(([s]) => s > 0)
      .sort((a, b) => b[0] - a[0])
      .slice(0, 8);
    active = -1;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    list.innerHTML = hits.length
      ? hits
          .map(
            ([, i], n) => `<li role="option" id="${list.id}-${n}"><a href="${i.u}" data-track="search_result"><strong>${i.t}</strong><span>${i.c}</span></a></li>`,
          )
          .join('')
      : '<li class="search__empty">Nenhuma calculadora encontrada. Tente “salário”, “férias” ou “juros”.</li>';
  };
  input.addEventListener('focus', loadIndex, { once: true });
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    const items = [...list.querySelectorAll('a')];
    if (!items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((a, i) => a.parentElement.classList.toggle('is-active', i === active));
      input.setAttribute('aria-activedescendant', items[active].parentElement.id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      (items[active] ?? items[0]).click();
    }
  });
  box.addEventListener('submit', (e) => {
    e.preventDefault();
    const first = list.querySelector('a');
    if (first) first.click();
  });
  input.addEventListener('blur', () => {
    if (input.value.trim().length > 2) track('search', { search_term: input.value.trim().slice(0, 60) });
  });
}
document.querySelectorAll('[data-search]').forEach(setupSearch);

/* Internal CTR: links marked with data-track send a select_content event. */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-track]');
  if (!a) return;
  track('select_content', { content_type: a.dataset.track, item_id: a.getAttribute('href') });
});

/* Consent (only present when analytics or ads are configured). */
const banner = document.querySelector('[data-consent]');
function applyConsent(granted) {
  if (typeof window.gtag !== 'function') return;
  const v = granted ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    analytics_storage: v,
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
  });
}
if (banner) {
  const choice = storage('get', CONSENT_KEY);
  if (choice) applyConsent(choice === 'granted');
  else banner.hidden = false;
  banner.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-consent-choice]');
    if (!btn) return;
    const granted = btn.dataset.consentChoice === 'accept';
    storage('set', CONSENT_KEY, granted ? 'granted' : 'denied');
    applyConsent(granted);
    banner.hidden = true;
  });
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-consent-open]')) return;
  e.preventDefault();
  if (banner) banner.hidden = false;
});

/* Print: expand collapsed tables and options so they appear on paper. */
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('[data-calc] details:not([open])').forEach((d) => {
    d.dataset.printOpened = '1';
    d.open = true;
  });
});
window.addEventListener('afterprint', () => {
  document.querySelectorAll('[data-print-opened]').forEach((d) => {
    d.open = false;
    delete d.dataset.printOpened;
  });
});
