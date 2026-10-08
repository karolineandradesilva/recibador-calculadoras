// Everyday math: percentages, rule of three, fuel, trips, business days.
import { round2 } from '../lib/format.js';
import { addDays, diffDays, nationalHolidays, parseISO, toISO } from '../lib/dates.js';

export function percentOf(percent, value) {
  return (percent / 100) * value;
}

export function whatPercent(part, whole) {
  return whole !== 0 ? (part / whole) * 100 : NaN;
}

export function variation(from, to) {
  return from !== 0 ? ((to - from) / Math.abs(from)) * 100 : NaN;
}

/** Successive discounts: 10% + 5% is 14.5%, not 15%. */
export function chainedDiscount(price, rates) {
  let value = price;
  for (const r of rates) value *= 1 - r;
  return { final: round2(value), totalRate: price > 0 ? 1 - value / price : 0, savings: round2(price - value) };
}

/** Direct or inverse rule of three: a is to b as c is to x. */
export function ruleOfThree({ a, b, c, inverse = false }) {
  if (inverse) return a * b / c;
  return (b * c) / a;
}

/** Ethanol pays off when its price is up to 70% of gasoline (or the real consumption ratio). */
export function fuelChoice({ ethanolPrice, gasolinePrice, ethanolKmL = null, gasolineKmL = null }) {
  const ratio = ethanolPrice / gasolinePrice;
  const threshold = ethanolKmL && gasolineKmL ? ethanolKmL / gasolineKmL : 0.7;
  const costEthanol = ethanolKmL ? ethanolPrice / ethanolKmL : null;
  const costGasoline = gasolineKmL ? gasolinePrice / gasolineKmL : null;
  return {
    ratio,
    threshold,
    best: ratio <= threshold + 1e-9 ? 'ethanol' : 'gasoline',
    costEthanol,
    costGasoline,
    usingConsumption: Boolean(ethanolKmL && gasolineKmL),
  };
}

export function tripCost({ distance, kmPerLiter, fuelPrice, tolls = 0, other = 0, people = 1, roundTrip = false }) {
  const km = roundTrip ? distance * 2 : distance;
  const liters = km / kmPerLiter;
  const fuel = liters * fuelPrice;
  const total = fuel + tolls + other;
  return {
    km,
    liters,
    fuel: round2(fuel),
    total: round2(total),
    perPerson: round2(total / Math.max(1, people)),
    perKm: km > 0 ? total / km : 0,
  };
}

/**
 * Business days between two dates (both inclusive), excluding weekends and
 * national holidays. Saturdays can be treated as working days.
 */
export function businessDays({ start, end, saturdays = false, includeOptional = false, extraHolidays = [] }) {
  const a = parseISO(start);
  const b = parseISO(end);
  if (!a || !b || b < a) return { valid: false };
  const holidaySet = new Map();
  for (let y = a.getUTCFullYear(); y <= b.getUTCFullYear(); y += 1) {
    for (const h of nationalHolidays(y, { includeOptional })) holidaySet.set(h.date, h.name);
  }
  for (const h of extraHolidays) holidaySet.set(h, 'Feriado local');
  let business = 0;
  let weekend = 0;
  const holidaysHit = [];
  const total = diffDays(a, b) + 1;
  for (let i = 0; i < total; i += 1) {
    const d = addDays(a, i);
    const dow = d.getUTCDay();
    const iso = toISO(d);
    const isWeekend = dow === 0 || (dow === 6 && !saturdays);
    if (isWeekend) {
      weekend += 1;
      continue;
    }
    if (holidaySet.has(iso)) {
      holidaysHit.push({ date: iso, name: holidaySet.get(iso) });
      continue;
    }
    business += 1;
  }
  return { valid: true, total, business, weekend, holidays: holidaysHit };
}

/** Adds N business days to a date (the start date itself is not counted). */
export function addBusinessDays({ start, days, saturdays = false, includeOptional = false }) {
  let d = parseISO(start);
  if (!d) return null;
  const cache = new Map();
  const isHoliday = (date) => {
    const y = date.getUTCFullYear();
    if (!cache.has(y)) cache.set(y, new Set(nationalHolidays(y, { includeOptional }).map((h) => h.date)));
    return cache.get(y).has(toISO(date));
  };
  let added = 0;
  const step = days >= 0 ? 1 : -1;
  while (added < Math.abs(days)) {
    d = addDays(d, step);
    const dow = d.getUTCDay();
    if (dow === 0 || (dow === 6 && !saturdays) || isHoliday(d)) continue;
    added += 1;
  }
  return toISO(d);
}
