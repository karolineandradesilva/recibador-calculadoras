// Guardrails for Central Bank data. Every daily refresh is compared with the
// data already published; anything that looks wrong blocks the deploy (the
// workflow fails and opens an issue) instead of reaching visitors.

// Largest plausible monthly variation for a NEW month, in percent. Historical
// extremes since 2000 stay below these (IGP-M peaked at 4.34% in Oct/2020).
export const MONTHLY_LIMITS = { ipca: 3, inpc: 3, igpm: 6, igpdi: 6, incc: 5 };

// Past months are final for these indices; only rounding noise is tolerated.
const REVISION_TOLERANCE = 0.011;
const MAX_NEW_MONTHS = 2;

const nextYm = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
};

/** Returns a list of problems (empty when the update looks sane). */
export function checkMonthlyUpdate(name, next, prev) {
  const problems = [];
  const limit = MONTHLY_LIMITS[name] ?? 5;
  if (!prev) {
    for (const [ym, v] of Object.entries(next)) if (Math.abs(v) > 30) problems.push(`${name} ${ym}: valor implausível ${v}%`);
    return problems;
  }
  const prevKeys = Object.keys(prev).sort();
  const nextKeys = Object.keys(next).sort();

  for (const ym of prevKeys) {
    if (!(ym in next)) {
      problems.push(`${name} ${ym}: mês já publicado sumiu da série`);
      continue;
    }
    if (Math.abs(next[ym] - prev[ym]) > REVISION_TOLERANCE) {
      problems.push(`${name} ${ym}: valor histórico mudou de ${prev[ym]}% para ${next[ym]}%`);
    }
  }

  const added = nextKeys.filter((ym) => !(ym in prev));
  if (added.length > MAX_NEW_MONTHS) problems.push(`${name}: ${added.length} meses novos de uma vez (máximo ${MAX_NEW_MONTHS})`);
  let expected = nextYm(prevKeys.at(-1));
  for (const ym of added) {
    if (ym !== expected) problems.push(`${name}: mês novo fora de sequência (${ym}, esperado ${expected})`);
    expected = nextYm(ym);
    const v = next[ym];
    if (!Number.isFinite(v)) problems.push(`${name} ${ym}: valor não numérico`);
    else if (Math.abs(v) > limit) problems.push(`${name} ${ym}: variação de ${v}% acima do limite de ±${limit}%`);
  }
  return problems;
}

const RANGES = {
  selic: [0.5, 60],
  cdi: [0.5, 60],
  tr: [-1, 2],
  savings: [0, 2],
  usd: [1, 30],
  eur: [1, 30],
};

/** Daily rates: absolute ranges plus day-over-day jumps. */
export function checkLatestUpdate(next, prev) {
  const problems = [];
  for (const [k, [lo, hi]] of Object.entries(RANGES)) {
    const v = next[k]?.value;
    if (!Number.isFinite(v) || v < lo || v > hi) problems.push(`${k}: valor ${v} fora da faixa ${lo}–${hi}`);
  }
  if (Number.isFinite(next.cdi?.value) && Number.isFinite(next.selic?.value) && Math.abs(next.cdi.value - next.selic.value) > 2) {
    problems.push(`CDI (${next.cdi.value}%) distante da Selic (${next.selic.value}%)`);
  }
  if (prev) {
    for (const k of ['usd', 'eur']) {
      const a = prev[k]?.value;
      const b = next[k]?.value;
      if (a && b && Math.abs(b / a - 1) > 0.1) problems.push(`${k}: salto de ${(((b / a) - 1) * 100).toFixed(1)}% em relação ao último valor`);
    }
    for (const k of ['selic', 'cdi']) {
      const a = prev[k]?.value;
      const b = next[k]?.value;
      if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(b - a) > 3) problems.push(`${k}: mudou ${(b - a).toFixed(2)} p.p. de uma vez`);
    }
  }
  return problems;
}
