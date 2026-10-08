// Date helpers working on ISO strings ("YYYY-MM-DD") in UTC, so results never
// depend on the visitor's time zone.

export function parseISO(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
}

export function toISO(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Adds calendar months keeping the day when possible (31/01 + 1 month = 28 or 29/02). */
export function addMonths(date, months) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const last = daysInMonth(y + Math.floor(m / 12), ((m % 12) + 12) % 12);
  return new Date(Date.UTC(y, m, Math.min(day, last)));
}

export function addYears(date, years) {
  return addMonths(date, years * 12);
}

export function daysInMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Whole years between two dates (anniversary based). */
export function fullYearsBetween(start, end) {
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  if (addYears(start, years) > end) years -= 1;
  return Math.max(0, years);
}

/**
 * Twelfths ("avos") for vacation: one per full month from `start`, plus one
 * when the remaining fraction has 15 days or more (CLT, art. 146, parágrafo
 * único). `end` is inclusive.
 */
export function vacationTwelfths(start, endInclusive) {
  if (endInclusive < start) return 0;
  const end = addDays(endInclusive, 1);
  let months = 0;
  while (months < 12 && addMonths(start, months + 1) <= end) months += 1;
  if (months >= 12) return 12;
  const rest = diffDays(addMonths(start, months), end);
  return rest >= 15 ? months + 1 : months;
}

/**
 * Twelfths of the 13th salary within a calendar year: each month in which the
 * employee worked 15 days or more counts (Lei 4.090/1962, art. 1º, §2º).
 */
export function thirteenthTwelfths(year, startInclusive, endInclusive) {
  let count = 0;
  for (let m = 0; m < 12; m += 1) {
    const first = new Date(Date.UTC(year, m, 1));
    const last = new Date(Date.UTC(year, m, daysInMonth(year, m)));
    const from = startInclusive > first ? startInclusive : first;
    const to = endInclusive < last ? endInclusive : last;
    if (to < from) continue;
    if (diffDays(from, to) + 1 >= 15) count += 1;
  }
  return count;
}

export function isLastDayOfMonth(date) {
  return date.getUTCDate() === daysInMonth(date.getUTCFullYear(), date.getUTCMonth());
}

/** Easter Sunday (Meeus/Jones/Butcher algorithm). */
export function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * National holidays (Lei 662/1949, Lei 6.802/1980, Lei 14.759/2023) and,
 * optionally, the federal "pontos facultativos" most companies observe.
 */
export function nationalHolidays(year, { includeOptional = false } = {}) {
  const fixed = [
    ['01-01', 'Confraternização Universal'],
    ['04-21', 'Tiradentes'],
    ['05-01', 'Dia do Trabalho'],
    ['09-07', 'Independência do Brasil'],
    ['10-12', 'Nossa Senhora Aparecida'],
    ['11-02', 'Finados'],
    ['11-15', 'Proclamação da República'],
    ['11-20', 'Dia Nacional de Zumbi e da Consciência Negra'],
    ['12-25', 'Natal'],
  ];
  const list = fixed.map(([md, name]) => ({ date: `${year}-${md}`, name, optional: false }));
  const e = easter(year);
  list.push({ date: toISO(addDays(e, -2)), name: 'Sexta-feira Santa', optional: false });
  if (includeOptional) {
    list.push({ date: toISO(addDays(e, -48)), name: 'Carnaval (ponto facultativo)', optional: true });
    list.push({ date: toISO(addDays(e, -47)), name: 'Carnaval (ponto facultativo)', optional: true });
    list.push({ date: toISO(addDays(e, 60)), name: 'Corpus Christi (ponto facultativo)', optional: true });
  }
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

export function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
