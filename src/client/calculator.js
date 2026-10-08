// Browser runtime for every calculator page. Reads the form described by the
// calculator's `ui` definition, validates, computes and renders the result
// instantly. State lives in the URL hash so results can be shared or reloaded
// without ever reaching a server.
import { parseNumber } from '../lib/format.js';
import { parseValue } from '../ui/values.js';
import { validateAll } from '../ui/validate.js';
import { displayValue, renderResult, resultToText } from '../ui/render.js';
import { track } from './track.js';
import { animateValue, moneyFromText } from './animate.js';

const DEBOUNCE_MS = 160;

function readRaw(form, field) {
  if (field.type === 'radio') {
    const checked = form.querySelector(`input[name="${field.name}"]:checked`);
    return checked ? checked.value : '';
  }
  const el = form.elements.namedItem(field.name);
  if (!el) return undefined;
  if (field.type === 'checkbox') return el.checked;
  return el.value;
}

export function mount(ui, { slug, title }) {
  const root = document.querySelector('[data-calc]');
  if (!root) return;
  const form = root.querySelector('form');
  const out = root.querySelector('[data-result]');
  const status = root.querySelector('[data-status]');
  const fields = ui.fields;
  const byName = Object.fromEntries(fields.map((f) => [f.name, f]));
  const touched = new Set();
  let timer = 0;
  let lastResult = null;
  let completedTracked = false;
  let userInteracted = false;

  const collect = () => {
    const values = {};
    for (const f of fields) values[f.name] = parseValue(f, readRaw(form, f));
    return values;
  };

  const setError = (name, message) => {
    const wrap = form.querySelector(`[data-field="${name}"]`);
    if (!wrap) return;
    const err = wrap.querySelector('.field__error');
    const input = wrap.querySelector('input, select');
    err.textContent = message;
    wrap.classList.toggle('has-error', Boolean(message));
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  };

  const syncVisibility = (values) => {
    for (const f of fields) {
      if (!f.showIf) continue;
      const wrap = form.querySelector(`[data-field="${f.name}"]`);
      if (wrap) wrap.hidden = !f.showIf(values);
    }
    if (ui.onChange) ui.onChange(values, form);
  };

  const validate = (values, showAll) => {
    const errors = validateAll(ui, values);
    for (const f of fields) {
      const show = showAll || touched.has(f.name) || (touched.size > 0 && errors.relational.has(f.name));
      setError(f.name, show ? errors[f.name] ?? '' : '');
    }
    return errors;
  };

  const writeHash = (values) => {
    const params = new URLSearchParams();
    for (const f of fields) {
      const v = readRaw(form, f);
      if (v === '' || v === undefined || v === false) continue;
      params.set(f.name, v === true ? '1' : v);
    }
    history.replaceState(null, '', `#${params.toString()}`);
    return values;
  };

  const run = ({ showAll = false, fromUser = true } = {}) => {
    const values = collect();
    syncVisibility(values);
    const errors = validate(values, showAll);
    if (Object.keys(errors).length) {
      if (showAll) {
        status.textContent = 'Revise os campos destacados.';
        const first = form.querySelector('.has-error input, .has-error select');
        if (first) first.focus();
      }
      root.classList.add('is-stale');
      return null;
    }
    let result;
    try {
      result = ui.compute(values);
    } catch (err) {
      result = { error: err.message || 'Não foi possível calcular com esses dados.' };
    }
    root.classList.remove('is-stale');
    const prevHero = moneyFromText(out.querySelector('.hero-value__value')?.textContent ?? '');
    out.innerHTML = renderResult(result);
    const heroEl = out.querySelector('.hero-value__value');
    const nextHero = moneyFromText(heroEl?.textContent ?? '');
    if (fromUser && prevHero !== null && nextHero !== null) animateValue(heroEl, prevHero, nextHero);
    lastResult = result;
    status.textContent = result.hero ? `${result.hero.label}: ${result.hero.value}` : 'Resultado atualizado.';
    if (fromUser) {
      writeHash(values);
      if (!completedTracked && !result.error && userInteracted) {
        completedTracked = true;
        track('calculator_complete', { calculator: slug });
      }
    }
    return result;
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => run(), DEBOUNCE_MS);
  };

  form.addEventListener('input', (e) => {
    if (!userInteracted) {
      userInteracted = true;
      track('calculator_start', { calculator: slug });
    }
    if (e.target.name) touched.add(e.target.name);
    schedule();
  });
  form.addEventListener('change', (e) => {
    if (e.target.name) touched.add(e.target.name);
    schedule();
  });
  form.addEventListener(
    'blur',
    (e) => {
      const f = byName[e.target.name];
      if (!f) return;
      touched.add(f.name);
      if (['money', 'percent', 'number'].includes(f.type)) {
        const v = parseNumber(e.target.value);
        if (Number.isFinite(v)) e.target.value = displayValue(f, v);
      }
      run();
    },
    true,
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    userInteracted = true;
    for (const f of fields) touched.add(f.name);
    const result = run({ showAll: true });
    if (result && !result.error) {
      const rect = out.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.6 || rect.top < 0) {
        out.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }
      out.focus({ preventScroll: true });
    }
  });

  // Actions.
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'reset') {
      form.reset();
      touched.clear();
      history.replaceState(null, '', location.pathname);
      run({ fromUser: false });
      track('calculator_reset', { calculator: slug });
    } else if (action === 'print') {
      track('calculator_print', { calculator: slug });
      window.print();
    } else if (action === 'copy') {
      const text = resultToText(lastResult, title);
      if (text) {
        await copy(text);
        flash(btn, 'Copiado!');
        track('calculator_copy', { calculator: slug });
      }
    } else if (action === 'share') {
      writeHash(collect());
      const url = location.href;
      track('share', { method: navigator.share ? 'native' : 'link', content_type: 'calculator', item_id: slug });
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch {
          // Cancelled by the user.
        }
      } else {
        await copy(url);
        flash(btn, 'Link copiado!');
      }
    }
  });

  // Restore state from the URL hash.
  if (location.hash.length > 1) {
    const params = new URLSearchParams(location.hash.slice(1));
    let restored = false;
    for (const [k, v] of params) {
      const f = byName[k];
      if (!f) continue;
      restored = true;
      if (f.type === 'radio') {
        const r = form.querySelector(`input[name="${k}"][value="${CSS.escape(v)}"]`);
        if (r) r.checked = true;
      } else if (f.type === 'checkbox') {
        form.elements.namedItem(k).checked = v === '1';
      } else {
        const el = form.elements.namedItem(k);
        if (el) el.value = v;
      }
    }
    // Checkboxes absent from the hash were unchecked.
    if (restored) {
      for (const f of fields) {
        if (f.type === 'checkbox' && !params.has(f.name)) form.elements.namedItem(f.name).checked = false;
      }
      run({ fromUser: false, showAll: true });
    }
  } else {
    syncVisibility(collect());
  }
  root.classList.add('is-ready');
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

function flash(btn, label) {
  const span = btn.querySelector('span') ?? btn;
  const original = span.textContent;
  span.textContent = label;
  setTimeout(() => {
    span.textContent = original;
  }, 1800);
}
