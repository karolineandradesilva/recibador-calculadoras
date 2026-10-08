// Labor calculations (CLT). Pure functions: no DOM, no I/O.
import { CURRENT } from '../data/params/index.js';
import { round2 } from '../lib/format.js';
import {
  addDays, addYears, diffDays, fullYearsBetween, isLastDayOfMonth, parseISO,
  thirteenthTwelfths, toISO, vacationTwelfths,
} from '../lib/dates.js';
import { inssEmployee, irrfMonthly, irrfThirteenth } from './tax.js';

const sum = (...values) => round2(values.reduce((a, b) => a + (b || 0), 0));

/* ------------------------------------------------------------------ */
/* Net salary                                                          */
/* ------------------------------------------------------------------ */

/**
 * @param {object} input
 * @param {number} input.gross gross monthly salary (taxable)
 * @param {number} [input.dependents]
 * @param {number} [input.alimony] court-ordered alimony withheld by the employer
 * @param {number} [input.privatePension] private pension contributions (deductible)
 * @param {number} [input.transportCost] monthly cost of commuting (vale-transporte)
 * @param {number} [input.otherDiscounts] health plan, meal, loans, etc.
 */
export function netSalary(input, p = CURRENT) {
  const {
    gross, dependents = 0, alimony = 0, privatePension = 0, transportCost = 0, otherDiscounts = 0,
  } = input;
  const inss = inssEmployee(gross, p);
  const irrf = irrfMonthly({ taxableIncome: gross, inss: inss.value, dependents, alimony, privatePension }, p);
  // Employer may withhold up to 6% of the base salary for vale-transporte (Lei 7.418/1985, art. 4º).
  const transport = round2(Math.min(transportCost, gross * 0.06));
  const discounts = sum(inss.value, irrf.value, alimony, privatePension, transport, otherDiscounts);
  const net = round2(gross - discounts);
  return {
    gross: round2(gross),
    inss,
    irrf,
    transport,
    alimony: round2(alimony),
    privatePension: round2(privatePension),
    otherDiscounts: round2(otherDiscounts),
    discounts,
    net,
    fgts: round2(gross * p.fgts.rate),
    netRatio: gross > 0 ? net / gross : 0,
  };
}

/** Finds the gross salary that results in the desired net salary (bisection). */
export function grossFromNet(input, p = CURRENT) {
  const { net: target } = input;
  if (!(target > 0)) return null;
  const netOf = (gross) => netSalary({ ...input, gross }, p).net;
  let lo = target;
  let hi = target * 2 + 1000;
  while (netOf(hi) < target) hi *= 2;
  for (let i = 0; i < 80; i += 1) {
    const mid = (lo + hi) / 2;
    if (netOf(mid) < target) lo = mid;
    else hi = mid;
  }
  // Smallest gross in cents whose net reaches the target.
  let gross = round2(hi);
  while (gross > 0.01 && netOf(round2(gross - 0.01)) >= target) gross = round2(gross - 0.01);
  while (netOf(gross) < target) gross = round2(gross + 0.01);
  return { gross, detail: netSalary({ ...input, gross }, p) };
}

/* ------------------------------------------------------------------ */
/* Vacation                                                            */
/* ------------------------------------------------------------------ */

/** Vacation days according to unjustified absences (CLT, art. 130). */
export function vacationDaysByAbsences(absences) {
  if (absences <= 5) return 30;
  if (absences <= 14) return 24;
  if (absences <= 23) return 18;
  if (absences <= 32) return 12;
  return 0;
}

/**
 * Vacation pay for an employee who takes vacation while employed.
 * @param {object} input
 * @param {number} input.salary
 * @param {number} [input.variableAverage] average of overtime, commissions etc.
 * @param {number} [input.absences] unjustified absences in the accrual period
 * @param {number} [input.soldDays] days converted into "abono pecuniário"
 * @param {number} [input.dependents]
 * @param {boolean} [input.advanceThirteenth] first installment of the 13th paid with vacation
 */
export function vacation(input, p = CURRENT) {
  const {
    salary, variableAverage = 0, absences = 0, soldDays = 0, dependents = 0, advanceThirteenth = false,
  } = input;
  const entitledDays = vacationDaysByAbsences(absences);
  const maxSell = Math.floor(entitledDays / 3);
  const sold = Math.min(Math.max(0, Math.floor(soldDays)), maxSell);
  const enjoyed = entitledDays - sold;
  const base = salary + variableAverage;
  const daily = base / 30;

  const vacationPay = round2(daily * enjoyed);
  const vacationThird = round2(vacationPay * p.labor.vacationBonusFraction);
  const allowance = round2(daily * sold);
  const allowanceThird = round2(allowance * p.labor.vacationBonusFraction);
  const advance = advanceThirteenth ? round2(base / 2) : 0;

  const taxable = vacationPay + vacationThird;
  const inss = inssEmployee(taxable, p);
  const irrf = irrfMonthly({ taxableIncome: taxable, inss: inss.value, dependents }, p);

  const gross = sum(vacationPay, vacationThird, allowance, allowanceThird, advance);
  const discounts = sum(inss.value, irrf.value);
  return {
    entitledDays,
    enjoyedDays: enjoyed,
    soldDays: sold,
    maxSellDays: maxSell,
    base: round2(base),
    vacationPay,
    vacationThird,
    allowance,
    allowanceThird,
    advance,
    inss,
    irrf,
    gross,
    discounts,
    net: round2(gross - discounts),
  };
}

/** Proportional vacation (+1/3) for a given number of twelfths. */
export function proportionalVacation({ salary, variableAverage = 0, twelfths }, p = CURRENT) {
  const t = Math.min(12, Math.max(0, Math.floor(twelfths)));
  const base = salary + variableAverage;
  const value = round2((base / 12) * t);
  const third = round2(value * p.labor.vacationBonusFraction);
  return { twelfths: t, days: (30 / 12) * t, value, third, total: sum(value, third) };
}

/* ------------------------------------------------------------------ */
/* 13th salary                                                         */
/* ------------------------------------------------------------------ */

export function thirteenth(input, p = CURRENT) {
  const { salary, variableAverage = 0, twelfths = 12, dependents = 0, advancePaid = null } = input;
  const t = Math.min(12, Math.max(0, Math.floor(twelfths)));
  const base = salary + variableAverage;
  const gross = round2((base / 12) * t);
  // First installment: half of the gross, without discounts (Lei 4.749/1965, art. 2º).
  const first = advancePaid ?? round2(gross / 2);
  const inss = inssEmployee(gross, p);
  const irrf = irrfThirteenth({ gross, inss: inss.value, dependents }, p);
  const second = round2(gross - first - inss.value - irrf.value);
  return {
    twelfths: t,
    gross,
    first,
    second,
    inss,
    irrf,
    net: round2(gross - inss.value - irrf.value),
  };
}

/* ------------------------------------------------------------------ */
/* Notice period                                                       */
/* ------------------------------------------------------------------ */

/** Proportional notice days (Lei 12.506/2011): 30 + 3 per full year, max 90. */
export function noticeDays(admission, termination, p = CURRENT) {
  const years = fullYearsBetween(admission, termination);
  const days = Math.min(p.labor.noticeMaxDays, p.labor.noticeBaseDays + p.labor.noticeDaysPerYear * years);
  return { years, days };
}

/* ------------------------------------------------------------------ */
/* Termination (rescisão)                                              */
/* ------------------------------------------------------------------ */

export const TERMINATION_REASONS = {
  dismissal: 'Dispensa sem justa causa',
  resignation: 'Pedido de demissão',
  agreement: 'Acordo entre as partes (art. 484-A)',
  cause: 'Dispensa por justa causa',
  contractEnd: 'Término de contrato por prazo determinado',
};

/**
 * @param {object} input
 * @param {number} input.salary
 * @param {number} [input.variableAverage]
 * @param {string} input.admission ISO date
 * @param {string} input.termination ISO date (last day worked)
 * @param {'dismissal'|'resignation'|'agreement'|'cause'|'contractEnd'} input.reason
 * @param {'indemnified'|'worked'|'waived'|'notServed'} [input.notice]
 * @param {number} [input.overdueVacations] full overdue vacation periods not taken
 * @param {boolean} [input.overdueDouble] overdue vacation past the concession period (paid double)
 * @param {number|null} [input.fgtsBalance] FGTS balance for termination purposes
 * @param {number} [input.dependents]
 * @param {boolean} [input.thirteenthAdvancePaid] first 13th installment already paid this year
 */
export function termination(input, p = CURRENT) {
  const {
    salary, variableAverage = 0, reason, notice = 'indemnified', overdueVacations = 0,
    overdueDouble = false, fgtsBalance = null, dependents = 0, thirteenthAdvancePaid = false,
  } = input;
  const admission = parseISO(input.admission);
  const end = parseISO(input.termination);
  if (!admission || !end || end < admission) throw new Error('Datas inválidas');

  const base = salary + variableAverage;
  const daily = base / 30;
  const items = [];
  const add = (key, label, value, kind, extra = {}) => {
    if (Math.abs(value) < 0.005) return;
    items.push({ key, label, value: round2(value), kind, ...extra });
  };

  // Notice period.
  const { years, days: proportionalNotice } = noticeDays(admission, end, p);
  let noticeIndemnified = 0;
  let projectionDays = 0;
  let noticeDiscount = 0;
  if (reason === 'dismissal' && notice === 'indemnified') {
    noticeIndemnified = proportionalNotice;
    projectionDays = proportionalNotice;
  } else if (reason === 'dismissal' && notice === 'worked') {
    // 30 days worked; the proportional extra (Lei 12.506) is paid as indemnity.
    noticeIndemnified = proportionalNotice - 30;
    projectionDays = noticeIndemnified;
  } else if (reason === 'agreement' && notice === 'indemnified') {
    noticeIndemnified = proportionalNotice / 2;
    projectionDays = proportionalNotice;
  } else if (reason === 'resignation' && notice === 'notServed') {
    noticeDiscount = 30;
  }
  const projectedEnd = addDays(end, projectionDays);

  // Salary balance: days worked in the last month (30-day commercial month).
  const balanceDays = isLastDayOfMonth(end) ? 30 : Math.min(end.getUTCDate(), 30);
  add('balance', `Saldo de salário (${balanceDays} dias)`, daily * balanceDays, 'earning');
  add('notice', `Aviso prévio indenizado (${round2(noticeIndemnified)} dias)`, daily * noticeIndemnified, 'earning');

  const hasProportional = reason !== 'cause';

  // 13th salary, including the notice projection.
  let thirteenthValue = 0;
  let thirteenthTw = 0;
  if (hasProportional) {
    const year = projectedEnd.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    thirteenthTw = thirteenthTwelfths(year, admission > yearStart ? admission : yearStart, projectedEnd);
    // When the projection crosses into a new year, the twelfths of the
    // previous year are also due if the termination year differs.
    if (end.getUTCFullYear() !== year) {
      const prevStart = new Date(Date.UTC(end.getUTCFullYear(), 0, 1));
      const prevTw = thirteenthTwelfths(end.getUTCFullYear(), admission > prevStart ? admission : prevStart, new Date(Date.UTC(end.getUTCFullYear(), 11, 31)));
      thirteenthTw += prevTw;
    }
    thirteenthValue = (base / 12) * thirteenthTw;
    add('thirteenth', `13º salário proporcional (${thirteenthTw}/12)`, thirteenthValue, 'earning');
  }

  // Overdue vacations.
  const overdueCount = Math.max(0, Math.floor(overdueVacations));
  if (overdueCount > 0) {
    const multiplier = overdueDouble ? 2 : 1;
    const v = base * overdueCount * multiplier;
    add('overdueVacation', `Férias vencidas${overdueDouble ? ' em dobro' : ''} (${overdueCount} período${overdueCount > 1 ? 's' : ''})`, v, 'earning');
    add('overdueVacationThird', '1/3 constitucional sobre férias vencidas', v / 3, 'earning');
  }

  // Proportional vacation of the current accrual period (with projection).
  let vacationTw = 0;
  if (hasProportional) {
    const periods = fullYearsBetween(admission, projectedEnd);
    const periodStart = addYears(admission, periods);
    vacationTw = vacationTwelfths(periodStart, projectedEnd);
    const v = (base / 12) * vacationTw;
    add('vacation', `Férias proporcionais (${vacationTw}/12)`, v, 'earning');
    add('vacationThird', '1/3 constitucional sobre férias proporcionais', v / 3, 'earning');
  }

  // Discounts.
  const balanceValue = daily * balanceDays;
  const inssSalary = inssEmployee(balanceValue, p);
  add('inssSalary', 'INSS sobre saldo de salário', inssSalary.value, 'discount');
  const irrfSalary = irrfMonthly({ taxableIncome: balanceValue, inss: inssSalary.value, dependents }, p);
  add('irrfSalary', 'IRRF sobre saldo de salário', irrfSalary.value, 'discount');

  const inss13 = inssEmployee(round2(thirteenthValue), p);
  add('inss13', 'INSS sobre 13º salário', inss13.value, 'discount');
  const irrf13 = irrfThirteenth({ gross: round2(thirteenthValue), inss: inss13.value, dependents }, p);
  add('irrf13', 'IRRF sobre 13º salário', irrf13.value, 'discount');

  if (thirteenthAdvancePaid && thirteenthValue > 0) {
    const year = end.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const twUntilNov = thirteenthTwelfths(year, admission > yearStart ? admission : yearStart, new Date(Date.UTC(year, 10, 30)));
    add('advance13', 'Adiantamento do 13º já recebido', (base / 12) * twUntilNov / 2, 'discount');
  }
  if (noticeDiscount > 0) {
    add('noticeDiscount', 'Aviso prévio não cumprido (desconto)', daily * noticeDiscount, 'discount');
  }

  const earnings = sum(...items.filter((i) => i.kind === 'earning').map((i) => i.value));
  const discounts = sum(...items.filter((i) => i.kind === 'discount').map((i) => i.value));

  // FGTS on the termination payments: salary balance, indemnified notice and 13th.
  const fgtsDeposit = round2((balanceValue + daily * noticeIndemnified + thirteenthValue) * p.fgts.rate);
  const monthsWorked = Math.max(1, Math.round(diffDays(admission, end) / 30.4375));
  const fgtsEstimated = fgtsBalance == null;
  const balanceForFine = round2((fgtsBalance ?? base * p.fgts.rate * monthsWorked) + fgtsDeposit);
  let fineRate = 0;
  if (reason === 'dismissal') fineRate = p.fgts.fineWithoutCause;
  if (reason === 'agreement') fineRate = p.fgts.fineMutualAgreement;
  const fgtsFine = round2(balanceForFine * fineRate);

  let fgtsWithdrawal = 0;
  if (reason === 'dismissal' || reason === 'contractEnd') fgtsWithdrawal = round2(balanceForFine + fgtsFine);
  if (reason === 'agreement') fgtsWithdrawal = round2(balanceForFine * 0.8 + fgtsFine);

  return {
    reason,
    yearsOfService: years,
    proportionalNotice,
    projectedEnd: toISO(projectedEnd),
    items,
    earnings,
    discounts,
    net: round2(earnings - discounts),
    fgts: {
      deposit: fgtsDeposit,
      balanceForFine,
      estimated: fgtsEstimated,
      fineRate,
      fine: fgtsFine,
      withdrawal: fgtsWithdrawal,
    },
    thirteenthTwelfths: thirteenthTw,
    vacationTwelfths: vacationTw,
    unemploymentEligible: reason === 'dismissal',
  };
}

/* ------------------------------------------------------------------ */
/* Hours                                                               */
/* ------------------------------------------------------------------ */

/** Monthly hour divisor from the weekly workload (weekly × 5). */
export function monthlyDivisor(weeklyHours) {
  return weeklyHours * 5;
}

export function hourlyRate({ salary, monthlyHours }) {
  return monthlyHours > 0 ? salary / monthlyHours : 0;
}

/** DSR reflex on variable pay (Lei 605/1949, art. 7º). */
export function dsr({ variable, workingDays, restDays }) {
  if (!(workingDays > 0)) return 0;
  return round2((variable / workingDays) * restDays);
}

export function overtime(input, p = CURRENT) {
  const {
    salary, monthlyHours = p.labor.defaultMonthlyHours, hours50 = 0, hours100 = 0,
    customHours = 0, customRate = 0, includeDsr = false, workingDays = 26, restDays = 4,
    additions = 0,
  } = input;
  const hourly = (salary + additions) / monthlyHours;
  const v50 = round2(hourly * 1.5 * hours50);
  const v100 = round2(hourly * 2 * hours100);
  const vCustom = round2(hourly * (1 + customRate) * customHours);
  const totalOvertime = sum(v50, v100, vCustom);
  const dsrValue = includeDsr ? dsr({ variable: totalOvertime, workingDays, restDays }) : 0;
  return {
    hourly: round2(hourly),
    hourlyExact: hourly,
    v50,
    v100,
    vCustom,
    totalOvertime,
    dsr: dsrValue,
    total: sum(totalOvertime, dsrValue),
  };
}

export function nightPremium(input, p = CURRENT) {
  const {
    salary, monthlyHours = p.labor.defaultMonthlyHours, clockHours, rural = false, rate,
  } = input;
  const premiumRate = rate ?? (rural ? p.labor.nightPremiumRural : p.labor.nightPremiumUrban);
  const hourly = salary / monthlyHours;
  const paidHours = rural ? clockHours : (clockHours * 60) / p.labor.nightHourMinutes;
  const premium = round2(hourly * premiumRate * paidHours);
  return {
    hourly: round2(hourly),
    premiumRate,
    clockHours,
    paidHours,
    extraReducedHours: paidHours - clockHours,
    premium,
    perHour: round2(hourly * premiumRate),
  };
}

/* ------------------------------------------------------------------ */
/* Unemployment insurance                                              */
/* ------------------------------------------------------------------ */

/**
 * @param {object} input
 * @param {number[]} input.salaries last salaries (up to 3) before dismissal
 * @param {1|2|3} input.request 1st, 2nd or 3rd+ request
 * @param {number} input.monthsWorked months with employment in the reference window
 */
export function unemploymentInsurance(input, p = CURRENT) {
  const { salaries, request, monthsWorked } = input;
  const valid = salaries.filter((s) => s > 0).slice(0, 3);
  const average = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  const u = p.unemploymentInsurance;
  let installment;
  let bracket;
  if (average <= u.firstBracketUpTo) {
    installment = average * u.firstBracketRate;
    bracket = 1;
  } else if (average <= u.secondBracketUpTo) {
    installment = u.secondBracketFixed + (average - u.firstBracketUpTo) * u.secondBracketRate;
    bracket = 2;
  } else {
    installment = u.ceiling;
    bracket = 3;
  }
  installment = round2(Math.min(u.ceiling, Math.max(u.floor, installment)));

  // Lei 7.998/1990, art. 3º and 4º (wording of Lei 13.134/2015).
  const minimum = { 1: 12, 2: 9, 3: 6 }[request];
  const eligible = monthsWorked >= minimum;
  let count = 0;
  if (eligible) {
    if (request === 1) count = monthsWorked >= 24 ? 5 : 4;
    else if (monthsWorked >= 24) count = 5;
    else if (monthsWorked >= 12) count = 4;
    else count = 3;
  }
  return {
    average: round2(average),
    bracket,
    installment,
    eligible,
    minimumMonths: minimum,
    installments: count,
    total: round2(installment * count),
  };
}

export function familyAllowance({ income, children }, p = CURRENT) {
  const eligible = income > 0 && income <= p.familyAllowance.incomeLimit;
  const n = Math.max(0, Math.floor(children));
  return {
    eligible,
    quota: p.familyAllowance.quota,
    limit: p.familyAllowance.incomeLimit,
    total: eligible ? round2(p.familyAllowance.quota * n) : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Employer cost                                                       */
/* ------------------------------------------------------------------ */

/**
 * @param {object} input
 * @param {number} input.salary
 * @param {'simples'|'simplesIV'|'general'} input.regime
 * @param {number} [input.rat] RAT/GILRAT rate (1%, 2% or 3%), adjusted by FAP
 * @param {number} [input.transportCost] monthly commuting cost
 * @param {number} [input.meal] meal/food allowance paid by the company
 * @param {number} [input.health] health plan and other benefits
 * @param {boolean} [input.includeFineProvision] provision for the 40% FGTS fine
 */
export function employeeCost(input, p = CURRENT) {
  const {
    salary, regime = 'simples', rat = 0.02, transportCost = 0, meal = 0, health = 0,
    includeFineProvision = false,
  } = input;
  const thirteenthProvision = salary / 12;
  const vacationProvision = salary / 12 + salary / 12 / 3;
  const remuneration = salary + thirteenthProvision + vacationProvision;

  let employerRate = 0;
  if (regime === 'simplesIV') employerRate = p.employer.cpp + rat;
  if (regime === 'general') employerRate = p.employer.cpp + rat + p.employer.thirdParties;
  const contributions = remuneration * employerRate;
  const fgts = remuneration * p.fgts.rate;
  const fineProvision = includeFineProvision ? salary * p.fgts.rate * p.fgts.fineWithoutCause : 0;
  const transport = Math.max(0, transportCost - salary * 0.06);

  const items = [
    { label: 'Salário', value: round2(salary) },
    { label: 'Provisão de 13º salário', value: round2(thirteenthProvision) },
    { label: 'Provisão de férias + 1/3', value: round2(vacationProvision) },
    { label: 'FGTS (8%) sobre salário, 13º e férias', value: round2(fgts) },
  ];
  if (contributions > 0) {
    items.push({ label: `INSS patronal, RAT e terceiros (${round2(employerRate * 100)}%)`, value: round2(contributions) });
  }
  if (fineProvision > 0) items.push({ label: 'Provisão para multa de 40% do FGTS', value: round2(fineProvision) });
  if (transport > 0) items.push({ label: 'Vale-transporte (parte da empresa)', value: round2(transport) });
  if (meal > 0) items.push({ label: 'Vale-refeição / alimentação', value: round2(meal) });
  if (health > 0) items.push({ label: 'Plano de saúde e outros benefícios', value: round2(health) });

  const monthly = sum(...items.map((i) => i.value));
  return {
    items,
    monthly,
    annual: round2(monthly * 12),
    multiplier: salary > 0 ? monthly / salary : 0,
    employerRate,
  };
}

/* ------------------------------------------------------------------ */
/* Time sheet                                                          */
/* ------------------------------------------------------------------ */

/** Worked hours for a day given entry/exit times in decimal hours. Handles overnight shifts. */
export function workedHours(periods) {
  let total = 0;
  for (const [start, end] of periods) {
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    let d = end - start;
    if (d < 0) d += 24;
    total += d;
  }
  return total;
}
