// Field validation shared by the browser runtime, the build and the tests.
// Every calculator gets these generic checks for free; calculators add
// domain-specific rules through `ui.validate(values)`.
import { num, dateLabel } from '../lib/format.js';
import { parseISO, diffDays } from '../lib/dates.js';

const DATE_MIN = '1940-01-01';
const DATE_MAX = '2100-12-31';
const MAX_SPAN_DAYS = 70 * 366;

// Sensible upper bounds when a field does not declare its own `max`.
const DEFAULT_MAX = { money: 1_000_000_000, number: 1_000_000_000, percent: 1000, integer: 1_000_000, hours: 744 };

const resolve = (x, values) => (typeof x === 'function' ? x(values) : x);
const fmt = (n) => num(n, Number.isInteger(n) ? 0 : 2);

/** Returns an error message or '' for a single field. */
export function validateField(field, value, values) {
  if (field.showIf && !field.showIf(values)) return '';
  const optional = field.required === false;
  const empty = value === null || value === undefined || value === '';
  if (empty) return optional ? '' : field.requiredMessage ?? 'Preencha este campo.';

  switch (field.type) {
    case 'money':
    case 'number':
    case 'percent':
    case 'integer':
    case 'hours': {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return field.type === 'hours' ? 'Use o formato 08:30 ou um número de horas.' : 'Digite apenas números (ex.: 1.234,56).';
      }
      if (!Number.isFinite(value)) return 'Valor inválido.';
      const min = resolve(field.min, values) ?? (field.type === 'percent' ? -100 : 0);
      const max = resolve(field.max, values) ?? DEFAULT_MAX[field.type];
      if (value < min) return min === 0 ? 'O valor não pode ser negativo.' : `O valor mínimo é ${fmt(min)}.`;
      if (value > max) return `O valor máximo é ${fmt(max)}.`;
      if (field.type === 'integer' && !Number.isInteger(value)) return 'Use um número inteiro.';
      return '';
    }
    case 'time':
      if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value >= 24) return 'Horário inválido. Use o formato 08:30.';
      return '';
    case 'date': {
      const d = parseISO(value);
      if (!d) return 'Data inválida.';
      const minISO = resolve(field.minDate, values) ?? DATE_MIN;
      const maxISO = resolve(field.maxDate, values) ?? DATE_MAX;
      if (value < minISO) return `Informe uma data a partir de ${dateLabel(minISO)}.`;
      if (value > maxISO) return `Informe uma data até ${dateLabel(maxISO)}.`;
      if (field.after) {
        const other = parseISO(values[field.after]);
        if (other) {
          if (field.strictlyAfter ? d <= other : d < other) return field.afterMessage ?? 'Esta data deve ser posterior à data inicial.';
          if (diffDays(other, d) > (field.maxSpanDays ?? MAX_SPAN_DAYS)) return field.spanMessage ?? 'O intervalo entre as datas é grande demais.';
          if (field.sameYear && other.getUTCFullYear() !== d.getUTCFullYear()) return 'As duas datas devem estar no mesmo ano.';
        }
      }
      return '';
    }
    case 'select':
    case 'radio': {
      const opts = typeof field.options === 'function' ? field.options(values) : field.options;
      if (!opts.some((o) => String(o.value) === String(value))) return 'Escolha uma opção válida.';
      return '';
    }
    default:
      return '';
  }
}

/** Validates every field and the calculator's own rules. */
export function validateAll(ui, values) {
  const errors = {};
  // Errors that involve more than one field are shown even if the user has
  // not touched the field that carries them.
  const relational = new Set();
  for (const f of ui.fields) {
    const e = validateField(f, values[f.name], values);
    if (e) {
      errors[f.name] = e;
      if (f.after) relational.add(f.name);
    }
  }
  if (!Object.keys(errors).length && ui.validate) {
    const extra = ui.validate(values) || {};
    for (const [k, v] of Object.entries(extra)) {
      if (!v) continue;
      errors[k] = v;
      relational.add(k);
    }
  }
  Object.defineProperty(errors, 'relational', { value: relational, enumerable: false });
  return errors;
}
