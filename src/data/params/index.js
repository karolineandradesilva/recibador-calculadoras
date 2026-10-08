import params2026 from './2026.js';

// Register every year here. The newest entry is used by default.
const BY_YEAR = { 2026: params2026 };

export const CURRENT = params2026;

export function paramsFor(year) {
  return BY_YEAR[year] ?? CURRENT;
}

export function availableYears() {
  return Object.keys(BY_YEAR).map(Number).sort();
}
