// Shared helpers for calculators that use monthly price indices.
import indices from '../data/indices.json' with { type: 'json' };
import { INDEX_INFO, firstMonth, lastMonth, nextMonth } from '../calc/indices.js';
import { shortMonthLabel, monthLabel } from '../lib/format.js';

export const SERIES = indices.monthly;
export const UPDATED_AT = indices.updatedAt;

export const indexOptions = (keys = Object.keys(INDEX_INFO)) => keys.map((k) => ({ value: k, label: INDEX_INFO[k].label }));

/** Month options for a select, newest first, limited to months with data in any series. */
export function monthOptions({ from = '2000-01', extraFuture = 0 } = {}) {
  const last = Object.values(SERIES).map(lastMonth).sort().at(-1);
  const end = nextMonth(last, extraFuture);
  const out = [];
  for (let ym = end; ym >= from; ym = nextMonth(ym, -1)) out.push({ value: ym, label: monthLabel(ym).replace(/^./, (c) => c.toUpperCase()) });
  return out;
}

export const latestMonth = (key) => lastMonth(SERIES[key]);
export const earliestMonth = (key) => firstMonth(SERIES[key]);
export { INDEX_INFO, shortMonthLabel, monthLabel, nextMonth };
