import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  simpleInterest, compoundInterest, pmt, amortization, rateFromInstallments, annualToMonthly,
  monthlyToAnnual, fixedIncome, iofRate, incomeTaxRateByDays, savingsMonthlyRate, latePayment,
  contributionForTarget, monthsToTarget,
} from '../src/calc/finance.js';
import { accumulated, correct, rentAdjustment, nextMonth } from '../src/calc/indices.js';
import {
  simplesEffectiveRate, annexByFactorR, meiDas, meiLimit, proLabore, cltVsPj, pjBreakEven,
  fgtsAnniversary, fgtsProjection, sellingPrice, marginFromPrice, breakEven, freelancerRate,
} from '../src/calc/company.js';
import {
  percentOf, whatPercent, variation, chainedDiscount, ruleOfThree, fuelChoice, tripCost,
  businessDays, addBusinessDays,
} from '../src/calc/everyday.js';
import { easter, nationalHolidays } from '../src/lib/dates.js';
import { parseNumber, brl, round2, parseHours, hoursLabel } from '../src/lib/format.js';

const close = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

test('number parsing (pt-BR)', () => {
  assert.equal(parseNumber('1.234,56'), 1234.56);
  assert.equal(parseNumber('R$ 1.500'), 1500);
  assert.equal(parseNumber('1234.5'), 1234.5);
  assert.equal(parseNumber('10%'), 10);
  assert.equal(parseNumber('1.234.567'), 1234567);
  assert.equal(parseNumber('-3,5'), -3.5);
  assert.ok(Number.isNaN(parseNumber('abc')));
  assert.ok(Number.isNaN(parseNumber('')));
  assert.equal(brl(1234.5), 'R$ 1.234,50');
  assert.equal(brl(-0.001), 'R$ 0,00');
  assert.equal(round2(1.005), 1.01);
  assert.equal(round2(-1.005), -1.01);
});

test('hours parsing', () => {
  assert.equal(parseHours('08:30'), 8.5);
  assert.equal(parseHours('8h30'), 8.5);
  assert.equal(parseHours('7,5'), 7.5);
  assert.ok(Number.isNaN(parseHours('8:75')));
  assert.equal(hoursLabel(8.5), '8h30');
  assert.equal(hoursLabel(-1.25), '-1h15');
});

test('simple and compound interest', () => {
  assert.equal(simpleInterest({ principal: 1000, rate: 0.02, periods: 12 }).interest, 240);
  const c = compoundInterest({ principal: 1000, monthlyRate: 0.01, months: 12 });
  close(c.total, 1126.83);
  const withContrib = compoundInterest({ principal: 0, monthlyContribution: 100, monthlyRate: 0, months: 24 });
  assert.equal(withContrib.total, 2400);
});

test('rate conversion round-trip', () => {
  close(monthlyToAnnual(annualToMonthly(0.12)), 0.12, 1e-12);
  close(annualToMonthly(0.12682503), 0.01, 1e-7);
});

test('Price and SAC amortization', () => {
  close(pmt(10000, 0.01, 12), 888.49);
  const price = amortization({ principal: 10000, monthlyRate: 0.01, months: 12, system: 'price' });
  assert.equal(price.rows.at(-1).balance, 0);
  close(price.totalPaid, 888.49 * 12, 0.1);
  const sac = amortization({ principal: 12000, monthlyRate: 0.01, months: 12, system: 'sac' });
  assert.equal(sac.first, 1120);
  assert.equal(sac.last, 1010);
  assert.ok(sac.totalInterest < price.totalInterest * 1.2);
});

test('implicit interest rate of installments', () => {
  const r = rateFromInstallments(10000, 888.49, 12);
  close(r, 0.01, 1e-5);
  close(rateFromInstallments(1000, 100, 10), 0, 1e-9);
  assert.ok(Number.isNaN(rateFromInstallments(1000, 50, 10)));
  // With down payment (first installment today).
  const due = rateFromInstallments(1000, 105, 10, 1);
  assert.ok(due > 0);
});

test('IOF and IR regressive tables', () => {
  assert.equal(iofRate(1), 0.96);
  assert.equal(iofRate(29), 0.03);
  assert.equal(iofRate(30), 0);
  assert.equal(incomeTaxRateByDays(180), 0.225);
  assert.equal(incomeTaxRateByDays(181), 0.2);
  assert.equal(incomeTaxRateByDays(721), 0.15);
});

test('CDB vs LCI', () => {
  const cdb = fixedIncome({ amount: 10000, days: 365, kind: 'cdi', cdiPercent: 1, cdiAnnual: 0.1365 });
  close(cdb.gross, 1365, 2);
  assert.equal(cdb.irRate, 0.175);
  const lci = fixedIncome({ amount: 10000, days: 365, kind: 'cdi', cdiPercent: 0.9, cdiAnnual: 0.1365, taxExempt: true });
  assert.equal(lci.ir, 0);
  assert.ok(lci.net > 0);
});

test('savings rule', () => {
  close(savingsMonthlyRate({ selicAnnual: 0.1375, trMonthly: 0 }), 0.005, 1e-12);
  const low = savingsMonthlyRate({ selicAnnual: 0.07, trMonthly: 0 });
  close(low, annualToMonthly(0.049), 1e-12);
});

test('late payment', () => {
  const r = latePayment({ amount: 1000, daysLate: 15, fineRate: 0.02, monthlyInterest: 0.01 });
  assert.equal(r.fine, 20);
  assert.equal(r.interest, 5);
  assert.equal(r.total, 1025);
});

test('savings goal', () => {
  const c = contributionForTarget({ target: 12000, monthlyRate: 0, months: 12 });
  assert.equal(c, 1000);
  assert.equal(monthsToTarget({ target: 1000, monthlyContribution: 100, monthlyRate: 0 }), 10);
  assert.equal(monthsToTarget({ target: 1000, monthlyContribution: 0, monthlyRate: 0 }), Infinity);
});

test('index accumulation', () => {
  const s = { '2026-01': 1, '2026-02': 1, '2026-03': -0.5 };
  const a = accumulated(s, '2026-01', '2026-03');
  close(a.rate, 1.01 * 1.01 * 0.995 - 1, 1e-12);
  assert.equal(accumulated(s, '2026-01', '2026-04').valid, false);
  assert.equal(correct(s, 100, '2026-01', '2026-02').corrected, 102.01);
  assert.equal(nextMonth('2026-12'), '2027-01');
  assert.equal(nextMonth('2026-01', -1), '2025-12');
});

test('rent adjustment uses 12 months before the anniversary', () => {
  const s = {};
  for (let i = 0; i < 24; i += 1) s[nextMonth('2025-01', i)] = 0.5;
  const r = rentAdjustment(s, { rent: 2000, adjustmentMonth: '2026-06' });
  assert.equal(r.start, '2025-06');
  assert.equal(r.end, '2026-05');
  close(r.newRent, 2000 * 1.005 ** 12);
  const neg = {};
  for (let i = 0; i < 24; i += 1) neg[nextMonth('2025-01', i)] = -0.2;
  const rn = rentAdjustment(neg, { rent: 2000, adjustmentMonth: '2026-06' });
  assert.equal(rn.newRent, 2000);
  assert.equal(rn.negativeIgnored, true);
});

test('Simples Nacional effective rate', () => {
  const r = simplesEffectiveRate(360000, 'III');
  close(r.effective, (360000 * 0.112 - 9360) / 360000, 1e-12);
  assert.equal(simplesEffectiveRate(100000, 'I').effective, 0.04);
  assert.equal(annexByFactorR(30000, 100000).annex, 'III');
  assert.equal(annexByFactorR(20000, 100000).annex, 'V');
});

test('MEI DAS 2026', () => {
  assert.equal(meiDas({ activity: 'commerce' }).total, 82.05);
  assert.equal(meiDas({ activity: 'services' }).total, 86.05);
  assert.equal(meiDas({ activity: 'both' }).total, 87.05);
  assert.equal(meiDas({ activity: 'trucker' }).total, 195.52);
  assert.equal(meiLimit({ activity: 'services', monthsActive: 12, revenue: 81000 }).status, 'ok');
  assert.equal(meiLimit({ activity: 'services', monthsActive: 12, revenue: 90000 }).status, 'tolerance');
  assert.equal(meiLimit({ activity: 'services', monthsActive: 12, revenue: 100000 }).status, 'over');
  assert.equal(meiLimit({ activity: 'services', monthsActive: 6, revenue: 0 }).limit, 40500);
});

test('pró-labore', () => {
  const r = proLabore({ amount: 5000 });
  assert.equal(r.inss.value, 550);
  assert.ok(r.irrf.value >= 0);
  assert.equal(r.net, round2(5000 - 550 - r.irrf.value));
});

test('CLT x PJ is consistent', () => {
  const r = cltVsPj({ cltSalary: 8000, pjRevenue: 12000, accountant: 300 });
  assert.ok(r.clt.year > 8000 * 12 * 0.7);
  assert.ok(['III', 'V'].includes(r.pj.annex));
  const be = pjBreakEven({ cltSalary: 8000, accountant: 300 });
  close(cltVsPj({ cltSalary: 8000, pjRevenue: be, accountant: 300 }).difference, 0, 1);
});

test('FGTS anniversary withdrawal', () => {
  assert.equal(fgtsAnniversary(400).value, 200);
  assert.equal(fgtsAnniversary(3000).value, 1050);
  assert.equal(fgtsAnniversary(25000).value, 4150);
});

test('FGTS projection', () => {
  const r = fgtsProjection({ salary: 2500, months: 12 });
  assert.equal(r.monthlyDeposit, 200);
  assert.ok(r.balance > 2600 && r.balance < 2700);
});

test('pricing helpers', () => {
  const p = sellingPrice({ cost: 60, taxRate: 0.06, expenseRate: 0.14, marginRate: 0.2 });
  assert.equal(p.price, 100);
  assert.equal(sellingPrice({ cost: 60, marginRate: 1 }).valid, false);
  const m = marginFromPrice({ price: 100, cost: 60 });
  close(m.margin, 0.4);
  close(m.markup, 0.6667, 1e-4);
  const be = breakEven({ fixedCosts: 10000, price: 50, variableCost: 30 });
  assert.equal(be.unitsRounded, 500);
  assert.equal(breakEven({ fixedCosts: 1, price: 10, variableCost: 10 }).valid, false);
  const f = freelancerRate({ desiredIncome: 8000, monthlyCosts: 1000, taxRate: 0.1, hoursPerWeek: 30, weeksOff: 4 });
  close(f.rate, (9000 * 12) / 0.9 / (30 * 48));
});

test('everyday math', () => {
  assert.equal(percentOf(15, 200), 30);
  assert.equal(whatPercent(30, 200), 15);
  assert.equal(variation(100, 125), 25);
  assert.equal(variation(100, 80), -20);
  close(chainedDiscount(100, [0.1, 0.05]).totalRate, 0.145, 1e-12);
  assert.equal(ruleOfThree({ a: 2, b: 10, c: 5 }), 25);
  assert.equal(ruleOfThree({ a: 4, b: 6, c: 8, inverse: true }), 3);
  assert.equal(fuelChoice({ ethanolPrice: 4.2, gasolinePrice: 6 }).best, 'ethanol');
  assert.equal(fuelChoice({ ethanolPrice: 4.3, gasolinePrice: 6 }).best, 'gasoline');
  assert.equal(tripCost({ distance: 100, kmPerLiter: 10, fuelPrice: 6, people: 2, roundTrip: true }).perPerson, 60);
});

test('Easter and national holidays', () => {
  assert.equal(easter(2026).toISOString().slice(0, 10), '2026-04-05');
  assert.equal(easter(2027).toISOString().slice(0, 10), '2027-03-28');
  const h = nationalHolidays(2026).map((x) => x.date);
  assert.ok(h.includes('2026-04-03'));
  assert.ok(h.includes('2026-11-20'));
  assert.equal(h.length, 10);
});

test('business days', () => {
  // October 2026: 22 weekdays, 12/10 (Monday) is a holiday → 21.
  const r = businessDays({ start: '2026-10-01', end: '2026-10-31' });
  assert.equal(r.business, 21);
  assert.equal(addBusinessDays({ start: '2026-10-09', days: 1 }), '2026-10-13');
});
