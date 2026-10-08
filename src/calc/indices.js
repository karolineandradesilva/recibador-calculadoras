// Monetary correction with official price indices (data from the Central
// Bank SGS API, refreshed daily by scripts/update-indices.js).
import { round2 } from '../lib/format.js';

export const INDEX_INFO = {
  ipca: { label: 'IPCA (IBGE)', short: 'IPCA', sgs: 433 },
  inpc: { label: 'INPC (IBGE)', short: 'INPC', sgs: 188 },
  igpm: { label: 'IGP-M (FGV)', short: 'IGP-M', sgs: 189 },
  igpdi: { label: 'IGP-DI (FGV)', short: 'IGP-DI', sgs: 190 },
  incc: { label: 'INCC-DI (FGV)', short: 'INCC', sgs: 192 },
};

/** "2026-03" -> next month "2026-04". */
export function nextMonth(ym, delta = 1) {
  const [y, m] = ym.split('-').map(Number);
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}

export function monthsBetween(a, b) {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

/**
 * Accumulated variation from `from` to `to` (both inclusive), compounding the
 * monthly rates. Mirrors the BCB "Calculadora do Cidadão" convention.
 * @param {Record<string, number>} series month -> percent (e.g. {"2026-01": 0.33})
 */
export function accumulated(series, from, to) {
  if (monthsBetween(from, to) < 0) return { valid: false, reason: 'O mês final deve ser igual ou posterior ao inicial.' };
  let factor = 1;
  const missing = [];
  const used = [];
  for (let ym = from; monthsBetween(ym, to) >= 0; ym = nextMonth(ym)) {
    const v = series[ym];
    if (v == null) {
      missing.push(ym);
      continue;
    }
    used.push([ym, v]);
    factor *= 1 + v / 100;
  }
  if (missing.length) return { valid: false, missing, reason: 'Há meses sem índice divulgado no período escolhido.' };
  return { valid: true, factor, rate: factor - 1, months: used.length, used };
}

export function correct(series, amount, from, to) {
  const acc = accumulated(series, from, to);
  if (!acc.valid) return acc;
  return { ...acc, corrected: round2(amount * acc.factor), difference: round2(amount * acc.factor - amount) };
}

/** Last month with data in a series. */
export function lastMonth(series) {
  const keys = Object.keys(series).sort();
  return keys[keys.length - 1];
}

export function firstMonth(series) {
  return Object.keys(series).sort()[0];
}

/**
 * Rent adjustment: accumulated index of the 12 months published before the
 * adjustment month. If the index for the month right before is not yet
 * published, the window moves back one month (common contract practice).
 */
export function rentAdjustment(series, { rent, adjustmentMonth, floorAtZero = true }) {
  let end = nextMonth(adjustmentMonth, -1);
  const last = lastMonth(series);
  if (monthsBetween(last, end) > 0) end = last;
  const start = nextMonth(end, -11);
  const acc = accumulated(series, start, end);
  if (!acc.valid) return acc;
  const applied = floorAtZero ? Math.max(0, acc.rate) : acc.rate;
  return {
    ...acc,
    start,
    end,
    applied,
    newRent: round2(rent * (1 + applied)),
    difference: round2(rent * applied),
    negativeIgnored: floorAtZero && acc.rate < 0,
  };
}
