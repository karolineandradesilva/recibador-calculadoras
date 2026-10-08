// Financial math: interest, loans, investments. Pure functions.
import { CURRENT } from '../data/params/index.js';
import { round2 } from '../lib/format.js';

/** Converts an annual effective rate to a monthly one and vice versa. */
export const annualToMonthly = (annual) => (1 + annual) ** (1 / 12) - 1;
export const monthlyToAnnual = (monthly) => (1 + monthly) ** 12 - 1;
export const annualToDaily252 = (annual) => (1 + annual) ** (1 / 252) - 1;

export function simpleInterest({ principal, rate, periods }) {
  const interest = principal * rate * periods;
  return { interest: round2(interest), total: round2(principal + interest) };
}

/**
 * Compound growth with optional monthly contributions made at the end of each
 * month. Returns a yearly (or monthly for short terms) evolution table.
 */
export function compoundInterest({ principal = 0, monthlyContribution = 0, monthlyRate, months }) {
  let balance = principal;
  let invested = principal;
  const rows = [];
  const step = months > 36 ? 12 : 1;
  for (let m = 1; m <= months; m += 1) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    invested += monthlyContribution;
    if (m % step === 0 || m === months) {
      rows.push({ period: m, invested: round2(invested), interest: round2(balance - invested), balance: round2(balance) });
    }
  }
  return {
    total: round2(balance),
    invested: round2(invested),
    interest: round2(balance - invested),
    rows,
    step,
  };
}

/** Installment of an amortizing loan (Price system / equal installments). */
export function pmt(principal, rate, n) {
  if (n <= 0) return 0;
  if (rate === 0) return principal / n;
  return (principal * rate) / (1 - (1 + rate) ** -n);
}

export function presentValue(future, rate, n) {
  return future / (1 + rate) ** n;
}

export function futureValue(present, rate, n) {
  return present * (1 + rate) ** n;
}

/** Present value of `n` equal installments, first one due after one period. */
export function annuityPV(installment, rate, n) {
  if (rate === 0) return installment * n;
  return installment * ((1 - (1 + rate) ** -n) / rate);
}

/**
 * Finds the periodic rate that makes `n` installments of `installment` worth
 * `principal` today (internal rate of return). `due` = 1 when the first
 * installment is paid at the act of purchase (entrada).
 */
export function rateFromInstallments(principal, installment, n, due = 0) {
  if (!(principal > 0 && installment > 0 && n > 0)) return NaN;
  if (installment * n < principal - 1e-9) return NaN;
  const value = (r) => annuityPV(installment, r, n) * (due ? 1 + r : 1) - principal;
  let lo = 0;
  let hi = 1;
  while (value(hi) > 0 && hi < 1e6) hi *= 2;
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2;
    if (value(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Amortization schedule: 'price' (equal installments) or 'sac' (constant amortization). */
export function amortization({ principal, monthlyRate, months, system = 'price', monthlyFees = 0 }) {
  const rows = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPaid = 0;
  const fixed = pmt(principal, monthlyRate, months);
  const sacAmort = principal / months;
  for (let k = 1; k <= months; k += 1) {
    const interest = balance * monthlyRate;
    const amort = system === 'price' ? fixed - interest : sacAmort;
    const installment = amort + interest + monthlyFees;
    balance = Math.max(0, balance - amort);
    totalInterest += interest;
    totalPaid += installment;
    rows.push({
      period: k,
      installment: round2(installment),
      interest: round2(interest),
      amortization: round2(amort),
      balance: round2(balance),
    });
  }
  return {
    rows,
    first: rows[0]?.installment ?? 0,
    last: rows[rows.length - 1]?.installment ?? 0,
    totalInterest: round2(totalInterest),
    totalPaid: round2(totalPaid),
  };
}

/** Months needed to reach `target` with contributions (returns Infinity if never). */
export function monthsToTarget({ target, principal = 0, monthlyContribution, monthlyRate }) {
  if (principal >= target) return 0;
  let balance = principal;
  for (let m = 1; m <= 1200; m += 1) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    if (balance >= target) return m;
  }
  return Infinity;
}

/** Monthly contribution needed to reach `target` in `months`. */
export function contributionForTarget({ target, principal = 0, monthlyRate, months }) {
  const fvPrincipal = principal * (1 + monthlyRate) ** months;
  const remaining = target - fvPrincipal;
  if (remaining <= 0) return 0;
  if (monthlyRate === 0) return remaining / months;
  return (remaining * monthlyRate) / ((1 + monthlyRate) ** months - 1);
}

/* ------------------------------------------------------------------ */
/* Fixed income                                                        */
/* ------------------------------------------------------------------ */

export function incomeTaxRateByDays(days, p = CURRENT) {
  return p.investments.incomeTax.find((b) => days <= b.upToDays).rate;
}

/** IOF on redemptions in the first 29 days (regressive table, Decreto 6.306/2007). */
export function iofRate(days) {
  if (days >= 30) return 0;
  const table = [96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3];
  return table[Math.max(1, days) - 1] / 100;
}

/** Approximates business days in a calendar span (252 per 365). */
export const businessDaysIn = (calendarDays) => Math.round((calendarDays * 252) / 365);

/**
 * Fixed income simulation.
 * @param {object} input
 * @param {number} input.amount
 * @param {number} input.days calendar days
 * @param {'cdi'|'pre'|'savings'} input.kind
 * @param {number} [input.cdiPercent] e.g. 1.1 for 110% of CDI
 * @param {number} [input.cdiAnnual] annual CDI rate
 * @param {number} [input.preAnnual] annual fixed rate
 * @param {boolean} [input.taxExempt] LCI/LCA/LIG/CRI/CRA/debêntures incentivadas
 * @param {number} [input.savingsMonthly] monthly savings rate (already including TR)
 */
export function fixedIncome(input, p = CURRENT) {
  const { amount, days, kind, cdiPercent = 1, cdiAnnual = 0, preAnnual = 0, taxExempt = false, savingsMonthly = 0 } = input;
  let gross;
  if (kind === 'savings') {
    // Savings pay only on full monthly anniversaries.
    const months = Math.floor(days / 30.4375 + 1e-9);
    gross = amount * ((1 + savingsMonthly) ** months - 1);
  } else {
    const bd = businessDaysIn(days);
    const daily = kind === 'cdi' ? annualToDaily252(cdiAnnual) * cdiPercent : annualToDaily252(preAnnual);
    gross = amount * ((1 + daily) ** bd - 1);
  }
  const exempt = kind === 'savings' || taxExempt;
  const iof = exempt && kind === 'savings' ? 0 : gross * iofRate(days);
  const irRate = exempt ? 0 : incomeTaxRateByDays(days, p);
  const ir = (gross - iof) * irRate;
  const net = gross - iof - ir;
  const years = days / 365;
  return {
    gross: round2(gross),
    iof: round2(iof),
    irRate,
    ir: round2(ir),
    net: round2(net),
    final: round2(amount + net),
    netAnnual: years > 0 ? (1 + net / amount) ** (1 / years) - 1 : 0,
  };
}

/** Monthly savings rate from the Selic target and TR (Lei 8.177/1991, art. 12). */
export function savingsMonthlyRate({ selicAnnual, trMonthly = 0 }, p = CURRENT) {
  if (selicAnnual > p.investments.savingsSelicThreshold) {
    return (1 + p.investments.savingsMonthlyRate) * (1 + trMonthly) - 1;
  }
  const base = annualToMonthly(selicAnnual * p.investments.savingsSelicShare);
  return (1 + base) * (1 + trMonthly) - 1;
}

/* ------------------------------------------------------------------ */
/* Late payment                                                        */
/* ------------------------------------------------------------------ */

/** Fine + simple pro-rata default interest. */
export function latePayment({ amount, daysLate, fineRate, monthlyInterest }) {
  if (daysLate <= 0) return { fine: 0, interest: 0, total: round2(amount), daysLate: 0 };
  const fine = amount * fineRate;
  const interest = amount * monthlyInterest * (daysLate / 30);
  return { fine: round2(fine), interest: round2(interest), total: round2(amount + fine + interest), daysLate };
}
