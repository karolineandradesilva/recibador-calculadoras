// Number helpers shared by the build (Node) and the browser.

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DEC = (digits) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const DEC2 = DEC(2);

/** Rounds to cents, half away from zero, tolerant to binary float noise. */
export function round2(value) {
  if (!Number.isFinite(value)) return value;
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * 100 + 1e-7)) / 100;
}

export function roundTo(value, digits) {
  const f = 10 ** digits;
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * f + 1e-7)) / f;
}

export function brl(value) {
  if (!Number.isFinite(value)) return '—';
  // Avoid "-R$ 0,00".
  const v = Math.abs(value) < 0.005 ? 0 : value;
  return BRL.format(v).replace(/ /g, ' ');
}

export function num(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  return (digits === 2 ? DEC2 : DEC(digits)).format(value);
}

export function pct(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  return `${num(value * 100, digits)}%`;
}

/** Parses Brazilian formatted numbers: "1.234,56", "1234,56", "1234.56", "R$ 10". */
export function parseNumber(input) {
  if (typeof input === 'number') return input;
  if (input == null) return NaN;
  let s = String(input).trim().replace(/R\$|%|\s/g, '');
  if (s === '') return NaN;
  const negative = s.startsWith('-');
  s = s.replace(/^-/, '');
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if ((s.match(/\./g) || []).length > 1) {
    s = s.replace(/\./g, '');
  } else if (/^\d{1,3}\.\d{3}$/.test(s)) {
    // "1.500" in pt-BR means one thousand five hundred.
    s = s.replace('.', '');
  }
  if (!/^\d*\.?\d*$/.test(s) || s === '.') return NaN;
  const n = Number(s);
  return negative ? -n : n;
}

/** Formats hours as "8h30". Accepts decimal hours. */
export function hoursLabel(decimalHours) {
  if (!Number.isFinite(decimalHours)) return '—';
  const negative = decimalHours < 0;
  const totalMinutes = Math.round(Math.abs(decimalHours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${negative ? '-' : ''}${h}h${String(m).padStart(2, '0')}`;
}

/** Parses "08:30" / "8h30" / "8,5" into decimal hours. */
export function parseHours(input) {
  if (input == null) return NaN;
  const s = String(input).trim().toLowerCase();
  if (s === '') return NaN;
  const m = s.match(/^(-?)(\d{1,4})\s*(?:[:h])\s*(\d{1,2})?\s*(?:min|m)?$/);
  if (m) {
    const minutes = m[3] ? Number(m[3]) : 0;
    if (minutes >= 60) return NaN;
    const v = Number(m[2]) + minutes / 60;
    return m[1] ? -v : v;
  }
  return parseNumber(s);
}

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function monthName(index) {
  return MONTHS[index];
}

/** "2026-03" -> "março de 2026". */
export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} de ${y}`;
}

export function shortMonthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1].slice(0, 3)}/${y}`;
}

/** "2026-10-08" -> "08/10/2026". */
export function dateLabel(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function plural(n, singular, pluralForm) {
  return `${num(n, 0)} ${n === 1 ? singular : pluralForm}`;
}
