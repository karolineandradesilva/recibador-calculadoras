// Shared interest-rate fields: value + period (monthly or yearly).
import { annualToMonthly, monthlyToAnnual } from '../calc/finance.js';
import rates from '../data/rates.json' with { type: 'json' };
import { pct } from '../lib/format.js';

export const LATEST = rates.latest;
export const RATES_UPDATED = rates.updatedAt;

export const rateFields = ({ name = 'rate', label = 'Taxa de juros', def = 1, period = 'month', extra = {} } = {}) => [
  { name, label, type: 'percent', default: def, min: 0, max: 1000, width: 'half', ...extra },
  {
    name: `${name}Period`,
    label: 'Período da taxa',
    type: 'select',
    default: period,
    options: [
      { value: 'month', label: 'ao mês' },
      { value: 'year', label: 'ao ano' },
    ],
    width: 'half',
  },
];

/** Returns the monthly effective rate as a fraction. */
export function monthlyRateFrom(v, name = 'rate') {
  const r = v[name] / 100;
  return v[`${name}Period`] === 'year' ? annualToMonthly(r) : r;
}

export function rateLabel(monthly) {
  return `${pct(monthly)} a.m. (${pct(monthlyToAnnual(monthly))} a.a.)`;
}

export const termFields = ({ def = 24, unit = 'month' } = {}) => [
  { name: 'term', label: 'Prazo', type: 'integer', default: def, min: 1, max: 1200, width: 'half' },
  {
    name: 'termUnit',
    label: 'Unidade',
    type: 'select',
    default: unit,
    options: [
      { value: 'month', label: 'meses' },
      { value: 'year', label: 'anos' },
    ],
    width: 'half',
  },
];

export const monthsFrom = (v) => (v.termUnit === 'year' ? v.term * 12 : v.term);

/** Validation shared by calculators with a term: at most 100 years. */
export function validateTerm(v) {
  if (Number.isFinite(v.term) && monthsFrom(v) > 1200) return { term: 'Use um prazo de até 100 anos (1.200 meses).' };
  return null;
}

export const TOO_LARGE = { error: 'Os valores informados geram um número grande demais para calcular. Reduza a taxa ou o prazo.' };
