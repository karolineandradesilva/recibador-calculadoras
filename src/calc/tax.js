// Payroll taxes: INSS (employee) and IRRF (monthly, 13th salary, PLR).
import { CURRENT } from '../data/params/index.js';
import { round2 } from '../lib/format.js';

/**
 * Progressive INSS for employees. Each bracket rate applies only to the slice
 * of the salary inside it. Salaries above the ceiling pay the ceiling value.
 */
export function inssEmployee(salary, p = CURRENT) {
  const base = Math.max(0, Math.min(salary, p.inss.ceiling));
  let previous = 0;
  let total = 0;
  const slices = [];
  for (const bracket of p.inss.employee) {
    if (base <= previous) break;
    const top = Math.min(base, bracket.upTo);
    const slice = top - previous;
    const value = slice * bracket.rate;
    slices.push({ from: previous, to: top, rate: bracket.rate, base: round2(slice), value: round2(value) });
    total += value;
    previous = bracket.upTo;
  }
  const value = round2(total);
  return {
    value,
    base: round2(base),
    capped: salary > p.inss.ceiling,
    effectiveRate: salary > 0 ? value / salary : 0,
    slices,
  };
}

function progressiveTax(base, table) {
  if (base <= 0) return { tax: 0, rate: 0, deduction: 0 };
  const bracket = table.find((b) => base <= b.upTo) ?? table[table.length - 1];
  const tax = Math.max(0, base * bracket.rate - bracket.deduction);
  return { tax: round2(tax), rate: bracket.rate, deduction: bracket.deduction };
}

/** Lei 15.270/2025 monthly reduction, limited to the tax due. */
export function irrfReduction(taxableIncome, taxBeforeReduction, p = CURRENT) {
  const r = p.irrf.reduction;
  let reduction = 0;
  if (taxableIncome <= r.zeroTaxUpTo) {
    reduction = Math.min(r.maxReduction, taxBeforeReduction);
  } else if (taxableIncome <= r.phaseOutUpTo) {
    reduction = Math.max(0, r.constant - r.factor * taxableIncome);
  }
  return round2(Math.min(reduction, taxBeforeReduction));
}

/**
 * Monthly IRRF on wages.
 *
 * @param {object} input
 * @param {number} input.taxableIncome gross taxable income of the month
 * @param {number} input.inss official social security withheld
 * @param {number} [input.dependents]
 * @param {number} [input.alimony] court-ordered alimony paid
 * @param {number} [input.privatePension] contributions to private pension (PGBL/funds)
 * @param {boolean} [input.allowSimplified] whether the simplified discount may be used
 * @param {boolean} [input.applyReduction] Lei 15.270 reduction (monthly incidence and 13th)
 */
export function irrfMonthly(input, p = CURRENT) {
  const {
    taxableIncome,
    inss = 0,
    dependents = 0,
    alimony = 0,
    privatePension = 0,
    allowSimplified = true,
    applyReduction = true,
  } = input;

  const legalDeductions = inss + dependents * p.irrf.dependentDeduction + alimony + privatePension;
  const legalBase = Math.max(0, taxableIncome - legalDeductions);
  const legal = progressiveTax(legalBase, p.irrf.monthly);

  let method = 'legal';
  let base = legalBase;
  let chosen = legal;
  let deductions = legalDeductions;

  if (allowSimplified) {
    const simplifiedBase = Math.max(0, taxableIncome - p.irrf.simplifiedDiscount);
    const simplified = progressiveTax(simplifiedBase, p.irrf.monthly);
    if (simplified.tax < legal.tax) {
      method = 'simplified';
      base = simplifiedBase;
      chosen = simplified;
      deductions = p.irrf.simplifiedDiscount;
    }
  }

  const reduction = applyReduction ? irrfReduction(taxableIncome, chosen.tax, p) : 0;
  const value = round2(Math.max(0, chosen.tax - reduction));

  return {
    value,
    base: round2(base),
    method,
    deductions: round2(deductions),
    rate: chosen.rate,
    taxBeforeReduction: chosen.tax,
    reduction,
    effectiveRate: taxableIncome > 0 ? value / taxableIncome : 0,
  };
}

/**
 * IRRF on the 13th salary: exclusive withholding with its own base. Only legal
 * deductions are used (conservative premise), and the Lei 15.270 reduction
 * applies by express provision (art. 3º-A, §3º of Lei 9.250 as amended).
 */
export function irrfThirteenth({ gross, inss, dependents = 0, alimony = 0 }, p = CURRENT) {
  return irrfMonthly(
    { taxableIncome: gross, inss, dependents, alimony, allowSimplified: false, applyReduction: true },
    p,
  );
}

/** IRRF on profit sharing (PLR), exclusive table, cumulative within the year. */
export function irrfPlr({ amount, previousInYear = 0, previousTaxWithheld = 0, alimony = 0 }, p = CURRENT) {
  const totalBase = Math.max(0, amount + previousInYear - alimony);
  const total = progressiveTax(totalBase, p.irrf.plr);
  const value = round2(Math.max(0, total.tax - previousTaxWithheld));
  return { value, base: round2(totalBase), rate: total.rate, totalTaxYear: total.tax };
}

/** INSS for self-employed / company partners. */
export function inssIndividual(amount, rate, p = CURRENT) {
  const base = Math.min(Math.max(amount, 0), p.inss.ceiling);
  return { value: round2(base * rate), base: round2(base), capped: amount > p.inss.ceiling };
}
