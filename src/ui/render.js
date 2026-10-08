// HTML rendering shared by the static build (server-side) and the browser
// runtime, so the pre-rendered page and the live result look identical.
import { num } from '../lib/format.js';

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const attr = (name, value) => (value === undefined || value === null || value === false ? '' : value === true ? ` ${name}` : ` ${name}="${esc(value)}"`);

/** Formats a raw field value for display inside its input. */
export function displayValue(field, value) {
  if (value === undefined || value === null || value === '') return '';
  if (field.type === 'money') return Number.isFinite(value) ? num(value, 2) : String(value);
  if (field.type === 'percent' || field.type === 'number') {
    if (!Number.isFinite(value)) return String(value);
    const digits = field.decimals ?? (Number.isInteger(value) ? 0 : Math.min(4, (String(value).split('.')[1] || '').length));
    return num(value, digits);
  }
  return String(value);
}

function options(field, values) {
  return typeof field.options === 'function' ? field.options(values) : field.options;
}

function fieldControl(field, value, values, id) {
  const describedBy = [field.help ? `${id}-help` : '', `${id}-error`].filter(Boolean).join(' ');
  const common = `${attr('id', id)}${attr('name', field.name)}${attr('aria-describedby', describedBy)}`;
  switch (field.type) {
    case 'select':
      return `<div class="select"><select${common}>${options(field, values)
        .map((o) => `<option value="${esc(o.value)}"${String(o.value) === String(value) ? ' selected' : ''}>${esc(o.label)}</option>`)
        .join('')}</select></div>`;
    case 'radio':
      return `<div class="segmented" role="radiogroup" aria-labelledby="${id}-label">${options(field, values)
        .map(
          (o, i) => `<label class="segmented__item"><input type="radio" name="${esc(field.name)}" value="${esc(o.value)}"${
            String(o.value) === String(value) ? ' checked' : ''
          }${i === 0 ? attr('id', id) : ''}><span>${esc(o.label)}</span></label>`,
        )
        .join('')}</div>`;
    case 'checkbox':
      return `<label class="switch"><input type="checkbox"${common}${value ? ' checked' : ''}><span class="switch__track" aria-hidden="true"></span><span class="switch__label">${esc(field.label)}</span></label>`;
    case 'date':
      return `<input class="input" type="date"${common}${attr('value', value)}${attr('min', field.min)}${attr('max', field.max)}>`;
    case 'time':
      return `<input class="input" type="time"${common}${attr('value', value)}>`;
    default: {
      const isMoney = field.type === 'money';
      const inputmode = field.type === 'integer' ? 'numeric' : field.type === 'hours' ? 'text' : 'decimal';
      const prefix = isMoney ? '<span class="affix affix--pre" aria-hidden="true">R$</span>' : field.prefix ? `<span class="affix affix--pre" aria-hidden="true">${esc(field.prefix)}</span>` : '';
      const suffix = field.type === 'percent' && !field.suffix ? '<span class="affix affix--suf" aria-hidden="true">%</span>' : field.suffix ? `<span class="affix affix--suf" aria-hidden="true">${esc(field.suffix)}</span>` : '';
      const longSuffix = (field.suffix ?? '').length > 2;
      const cls = `input${prefix ? ' input--pre' : ''}${suffix ? (longSuffix ? ' input--suf-long' : ' input--suf') : ''}`;
      return `<div class="input-wrap">${prefix}<input class="${cls}" type="text" inputmode="${inputmode}" autocomplete="off"${common}${attr(
        'value',
        displayValue(field, value),
      )}${attr('placeholder', field.placeholder)}${field.required === false ? '' : ' aria-required="true"'}>${suffix}</div>`;
    }
  }
}

export function renderField(field, values, parsed = values, prefix = 'f') {
  const id = `${prefix}-${field.name}`;
  const value = values[field.name];
  const hidden = field.showIf && !field.showIf(parsed);
  const width = field.width === 'half' ? ' field--half' : field.width === 'third' ? ' field--third' : '';
  const label =
    field.type === 'checkbox'
      ? ''
      : `<label class="field__label" id="${id}-label"${field.type === 'radio' ? '' : ` for="${id}"`}>${esc(field.label)}${
          field.required === false && field.type !== 'select' ? ' <span class="field__opt">opcional</span>' : ''
        }</label>`;
  return `<div class="field${width}" data-field="${esc(field.name)}"${hidden ? ' hidden' : ''}>${label}${fieldControl(
    field,
    value,
    parsed,
    id,
  )}${field.help ? `<p class="field__help" id="${id}-help">${field.help}</p>` : ''}<p class="field__error" id="${id}-error" role="alert"></p></div>`;
}

export function renderFields(fields, values, parsed = values) {
  const main = fields.filter((f) => !f.advanced);
  const advanced = fields.filter((f) => f.advanced);
  let html = `<div class="fields">${main.map((f) => renderField(f, values, parsed)).join('')}</div>`;
  if (advanced.length) {
    html += `<details class="more"><summary>Mais opções</summary><div class="fields">${advanced.map((f) => renderField(f, values, parsed)).join('')}</div></details>`;
  }
  return html;
}

const TONE_CLASS = { plus: 'is-plus', minus: 'is-minus', total: 'is-total', muted: 'is-muted', strong: 'is-strong' };

function renderRows(rows) {
  return `<dl class="rows">${rows
    .filter(Boolean)
    .map(
      (r) => `<div class="row ${TONE_CLASS[r.tone] ?? ''}"><dt>${esc(r.label)}${r.hint ? `<small>${esc(r.hint)}</small>` : ''}</dt><dd>${
        r.tone === 'minus' && !String(r.value).startsWith('−') ? '− ' : ''
      }${esc(r.value)}</dd></div>`,
    )
    .join('')}</dl>`;
}

function renderBars(bars) {
  const total = bars.reduce((a, b) => a + Math.max(0, b.value), 0);
  if (!(total > 0)) return '';
  return `<div class="bar" role="img" aria-label="${esc(
    bars.map((b) => `${b.label}: ${num((b.value / total) * 100, 1)}%`).join('; '),
  )}">${bars
    .filter((b) => b.value > 0)
    .map((b, i) => `<span class="bar__seg bar__seg--${b.tone ?? i}" style="width:${((b.value / total) * 100).toFixed(2)}%"></span>`)
    .join('')}</div><ul class="legend">${bars
    .filter((b) => b.value > 0)
    .map((b, i) => `<li><i class="dot dot--${b.tone ?? i}"></i>${esc(b.label)} <b>${num((b.value / total) * 100, 1)}%</b></li>`)
    .join('')}</ul>`;
}

function renderTable(t) {
  const head = `<thead><tr>${t.columns.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>`;
  const body = `<tbody>${t.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody>`;
  const table = `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(t.caption)}"><table><caption class="sr-only">${esc(t.caption)}</caption>${head}${body}</table></div>`;
  return t.open
    ? `<div class="result__table"><h3 class="result__sub">${esc(t.caption)}</h3>${table}</div>`
    : `<details class="result__table"><summary>${esc(t.caption)}</summary>${table}</details>`;
}

/** Renders a calculator result object into HTML. */
export function renderResult(r) {
  if (!r) return '';
  if (r.error) return `<div class="notice notice--error" role="alert">${esc(r.error)}</div>`;
  let html = '';
  if (r.hero) {
    html += `<div class="hero-value${r.hero.tone ? ` hero-value--${r.hero.tone}` : ''}"><p class="hero-value__label">${esc(r.hero.label)}</p><p class="hero-value__value" data-copy>${esc(
      r.hero.value,
    )}</p>${r.hero.sub ? `<p class="hero-value__sub">${esc(r.hero.sub)}</p>` : ''}</div>`;
  }
  if (r.alert) html += `<div class="notice notice--${r.alert.tone ?? 'info'}">${esc(r.alert.text)}</div>`;
  if (r.cards?.length) {
    html += `<div class="kpis">${r.cards
      .map((c) => `<div class="kpi${c.tone ? ` kpi--${c.tone}` : ''}"><p class="kpi__label">${esc(c.label)}</p><p class="kpi__value">${esc(c.value)}</p>${c.sub ? `<p class="kpi__sub">${esc(c.sub)}</p>` : ''}</div>`)
      .join('')}</div>`;
  }
  if (r.bars?.length) html += renderBars(r.bars);
  for (const s of r.sections ?? []) {
    if (!s || !s.rows?.length) continue;
    html += `<section class="result__section">${s.title ? `<h3 class="result__sub">${esc(s.title)}</h3>` : ''}${renderRows(s.rows)}</section>`;
  }
  for (const t of r.tables ?? (r.table ? [r.table] : [])) html += renderTable(t);
  if (r.notes?.length) html += `<ul class="result__notes">${r.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`;
  return html;
}

/** Plain-text version of a result, used by "copiar resultado". */
export function resultToText(r, title) {
  if (!r || r.error) return '';
  const lines = [title];
  if (r.hero) lines.push(`${r.hero.label}: ${r.hero.value}`);
  for (const c of r.cards ?? []) lines.push(`${c.label}: ${c.value}`);
  for (const s of r.sections ?? []) {
    if (!s?.rows?.length) continue;
    if (s.title) lines.push('', s.title);
    for (const row of s.rows.filter(Boolean)) lines.push(`${row.label}: ${row.tone === 'minus' && row.value !== 'R$ 0,00' ? '−' : ''}${row.value}`);
  }
  return lines.join('\n');
}
