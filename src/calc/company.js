// Small business and self-employed calculations: Simples Nacional, MEI,
// pró-labore, PJ x CLT, FGTS helpers and pricing.
import { CURRENT } from '../data/params/index.js';
import { round2 } from '../lib/format.js';
import { inssEmployee, inssIndividual, irrfMonthly } from './tax.js';
import { netSalary } from './labor.js';

/* ------------------------------------------------------------------ */
/* Simples Nacional                                                    */
/* ------------------------------------------------------------------ */

/** Effective rate: (RBT12 × nominal − deduction) / RBT12 (LC 123/2006, art. 18, §1º-A). */
export function simplesEffectiveRate(rbt12, annex, p = CURRENT) {
  const table = p.simples.annexes[annex];
  if (!table) throw new Error(`Anexo inválido: ${annex}`);
  // Companies in their first 12 months annualize the revenue; callers pass it ready.
  const base = Math.max(rbt12, 0.01);
  const bracketIndex = table.findIndex((b) => base <= b.upTo);
  const idx = bracketIndex === -1 ? table.length - 1 : bracketIndex;
  const b = table[idx];
  const effective = Math.max(0, (base * b.rate - b.deduction) / base);
  return { effective, nominal: b.rate, deduction: b.deduction, bracket: idx + 1, overLimit: rbt12 > p.simples.revenueLimit };
}

/** Picks annex III or V for "fator R" activities. */
export function annexByFactorR(payroll12, rbt12, p = CURRENT) {
  const factor = rbt12 > 0 ? payroll12 / rbt12 : 0;
  return { factor, annex: factor >= p.simples.factorRThreshold ? 'III' : 'V' };
}

export function simplesDas({ monthlyRevenue, rbt12, annex }, p = CURRENT) {
  const r = simplesEffectiveRate(rbt12, annex, p);
  return { ...r, das: round2(monthlyRevenue * r.effective) };
}

/* ------------------------------------------------------------------ */
/* MEI                                                                 */
/* ------------------------------------------------------------------ */

export const MEI_ACTIVITIES = {
  commerce: 'Comércio ou indústria',
  services: 'Prestação de serviços',
  both: 'Comércio e serviços',
  trucker: 'Caminhoneiro (cargas)',
  truckerServices: 'Caminhoneiro + serviços',
};

export function meiDas({ activity }, p = CURRENT) {
  const trucker = activity === 'trucker' || activity === 'truckerServices';
  const inss = round2(p.minimumWage * (trucker ? p.mei.truckerInssRate : p.mei.inssRate));
  const icms = activity === 'services' ? 0 : p.mei.icms;
  const iss = activity === 'services' || activity === 'both' || activity === 'truckerServices' ? p.mei.iss : 0;
  return { inss, icms, iss, total: round2(inss + icms + iss), trucker };
}

/** Annual MEI revenue limit, proportional in the opening year (R$ 6.750/month). */
export function meiLimit({ activity, monthsActive = 12, revenue }, p = CURRENT) {
  const trucker = activity === 'trucker' || activity === 'truckerServices';
  const annual = trucker ? p.mei.truckerAnnualRevenueLimit : p.mei.annualRevenueLimit;
  const months = Math.min(12, Math.max(1, Math.floor(monthsActive)));
  const limit = round2((annual / 12) * months);
  const excess = Math.max(0, revenue - limit);
  const excessRate = limit > 0 ? excess / limit : 0;
  let status = 'ok';
  if (excess > 0) status = excessRate <= p.mei.toleranceRate ? 'tolerance' : 'over';
  return { limit, used: limit > 0 ? revenue / limit : 0, excess: round2(excess), excessRate, status, monthlyAverageLimit: round2(annual / 12) };
}

/* ------------------------------------------------------------------ */
/* Pró-labore                                                          */
/* ------------------------------------------------------------------ */

export function proLabore({ amount, dependents = 0, employerPaysCpp = false }, p = CURRENT) {
  const inss = inssIndividual(amount, p.inss.individualToCompanyRate, p);
  const irrf = irrfMonthly({ taxableIncome: amount, inss: inss.value, dependents }, p);
  const cpp = employerPaysCpp ? round2(amount * p.employer.cpp) : 0;
  const net = round2(amount - inss.value - irrf.value);
  return { inss, irrf, net, cpp, companyCost: round2(amount + cpp) };
}

/* ------------------------------------------------------------------ */
/* CLT x PJ                                                            */
/* ------------------------------------------------------------------ */

/**
 * Yearly comparison. CLT counts 12 net salaries, net 13th, the vacation third
 * and FGTS deposits. PJ counts the revenue minus Simples Nacional tax,
 * pró-labore INSS/IRRF, accountant fees and benefits the professional must
 * now pay alone.
 */
export function cltVsPj(input, p = CURRENT) {
  const {
    cltSalary, cltBenefits = 0, dependents = 0, pjRevenue, pjAnnex = 'factorR', proLaboreShare = 0.28,
    accountant = 0, pjOwnCosts = 0,
  } = input;

  // CLT side.
  const monthly = netSalary({ gross: cltSalary, dependents }, p);
  const thirteenthInss = inssEmployee(cltSalary, p);
  const thirteenthIr = irrfMonthly({ taxableIncome: cltSalary, inss: thirteenthInss.value, dependents, allowSimplified: false }, p);
  const thirteenthNet = cltSalary - thirteenthInss.value - thirteenthIr.value;
  const vacationThird = cltSalary / 3;
  const vacationInss = inssEmployee(cltSalary + vacationThird, p);
  const vacationIr = irrfMonthly({ taxableIncome: cltSalary + vacationThird, inss: vacationInss.value, dependents }, p);
  // Vacation month replaces one salary: the extra is the net of (salary + 1/3) minus the regular net.
  const vacationExtraNet = cltSalary + vacationThird - vacationInss.value - vacationIr.value - monthly.net;
  const fgtsYear = cltSalary * p.fgts.rate * (13 + 1 / 3);
  const cltYear = monthly.net * 12 + thirteenthNet + vacationExtraNet + fgtsYear + cltBenefits * 12;

  // PJ side.
  const rbt12 = pjRevenue * 12;
  const proLaboreAmount = Math.max(p.minimumWage, pjRevenue * proLaboreShare);
  let annex = pjAnnex;
  if (pjAnnex === 'factorR') annex = annexByFactorR(proLaboreAmount * 12, rbt12, p).annex;
  const das = simplesDas({ monthlyRevenue: pjRevenue, rbt12, annex }, p);
  const pl = proLabore({ amount: proLaboreAmount, dependents, employerPaysCpp: annex === 'IV' }, p);
  const pjMonthlyNet = pjRevenue - das.das - pl.inss.value - pl.irrf.value - pl.cpp - accountant - pjOwnCosts;
  const pjYear = pjMonthlyNet * 12;

  return {
    clt: {
      monthlyNet: monthly.net,
      thirteenthNet: round2(thirteenthNet),
      vacationExtraNet: round2(vacationExtraNet),
      fgtsYear: round2(fgtsYear),
      benefitsYear: round2(cltBenefits * 12),
      year: round2(cltYear),
      monthlyEquivalent: round2(cltYear / 12),
    },
    pj: {
      annex,
      effectiveRate: das.effective,
      das: das.das,
      proLabore: round2(proLaboreAmount),
      proLaboreInss: pl.inss.value,
      proLaboreIrrf: pl.irrf.value,
      cpp: pl.cpp,
      accountant: round2(accountant),
      ownCosts: round2(pjOwnCosts),
      monthlyNet: round2(pjMonthlyNet),
      year: round2(pjYear),
    },
    difference: round2(pjYear - cltYear),
  };
}

/** PJ monthly revenue that matches the CLT package (bisection). */
export function pjBreakEven(input, p = CURRENT) {
  let lo = 0;
  let hi = Math.max(1000, input.cltSalary * 4);
  const diff = (rev) => cltVsPj({ ...input, pjRevenue: rev }, p).difference;
  while (diff(hi) < 0 && hi < 1e8) hi *= 2;
  for (let i = 0; i < 80; i += 1) {
    const mid = (lo + hi) / 2;
    if (diff(mid) < 0) lo = mid;
    else hi = mid;
  }
  return round2(hi);
}

/* ------------------------------------------------------------------ */
/* FGTS                                                                */
/* ------------------------------------------------------------------ */

/** Projects an FGTS balance with monthly deposits and 3% a.a. (TR not included). */
export function fgtsProjection({ salary, months, currentBalance = 0, apprentice = false }, p = CURRENT) {
  const rate = apprentice ? p.fgts.apprenticeRate : p.fgts.rate;
  const monthlyYield = (1 + p.fgts.annualYield) ** (1 / 12) - 1;
  const deposit = salary * rate;
  let balance = currentBalance;
  let deposits = 0;
  for (let m = 0; m < months; m += 1) {
    balance = balance * (1 + monthlyYield) + deposit;
    deposits += deposit;
  }
  // 13th salary deposit once per full year.
  const thirteenthDeposits = Math.floor(months / 12) * deposit;
  balance += thirteenthDeposits;
  deposits += thirteenthDeposits;
  return {
    monthlyDeposit: round2(deposit),
    deposits: round2(deposits),
    yieldValue: round2(balance - currentBalance - deposits),
    balance: round2(balance),
    fine40: round2(balance * p.fgts.fineWithoutCause),
  };
}

export function fgtsAnniversary(balance, p = CURRENT) {
  const b = p.fgts.anniversaryWithdrawal.find((x) => balance <= x.upTo);
  const value = balance > 0 ? round2(balance * b.rate + b.extra) : 0;
  return { value, rate: b.rate, extra: b.extra, remaining: round2(balance - value) };
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

/** Selling price by markup divisor: price = cost / (1 − (taxes + expenses + margin)). */
export function sellingPrice({ cost, taxRate = 0, expenseRate = 0, marginRate = 0, cardFee = 0, commission = 0 }) {
  const totalRate = taxRate + expenseRate + marginRate + cardFee + commission;
  if (totalRate >= 1) return { valid: false, totalRate };
  const price = cost / (1 - totalRate);
  return {
    valid: true,
    price: round2(price),
    markup: cost > 0 ? price / cost : 0,
    totalRate,
    taxes: round2(price * taxRate),
    expenses: round2(price * expenseRate),
    fees: round2(price * (cardFee + commission)),
    profit: round2(price * marginRate),
  };
}

export function marginFromPrice({ price, cost }) {
  const profit = price - cost;
  return {
    profit: round2(profit),
    margin: price > 0 ? profit / price : 0,
    markup: cost > 0 ? profit / cost : 0,
    multiplier: cost > 0 ? price / cost : 0,
  };
}

export function breakEven({ fixedCosts, price, variableCost }) {
  const contribution = price - variableCost;
  if (contribution <= 0) return { valid: false, contribution };
  const units = fixedCosts / contribution;
  return {
    valid: true,
    contribution: round2(contribution),
    contributionMargin: price > 0 ? contribution / price : 0,
    units,
    unitsRounded: Math.ceil(units - 1e-9),
    revenue: round2(Math.ceil(units - 1e-9) * price),
  };
}

/** Hourly rate a freelancer needs to charge. */
export function freelancerRate({ desiredIncome, monthlyCosts = 0, taxRate = 0, hoursPerWeek, weeksOff = 4 }) {
  const workingWeeks = 52 - weeksOff;
  const billableHoursYear = hoursPerWeek * workingWeeks;
  if (!(billableHoursYear > 0) || taxRate >= 1) return { valid: false };
  const annualNeed = (desiredIncome + monthlyCosts) * 12;
  const revenueNeeded = annualNeed / (1 - taxRate);
  const rate = revenueNeeded / billableHoursYear;
  return {
    valid: true,
    rate: round2(rate),
    dayRate: round2(rate * 8),
    monthlyRevenue: round2(revenueNeeded / 12),
    billableHoursMonth: billableHoursYear / 12,
  };
}
