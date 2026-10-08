import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  netSalary, grossFromNet, vacation, vacationDaysByAbsences, proportionalVacation, thirteenth,
  noticeDays, termination, overtime, nightPremium, unemploymentInsurance, familyAllowance,
  employeeCost, dsr, workedHours,
} from '../src/calc/labor.js';
import { parseISO, vacationTwelfths, thirteenthTwelfths } from '../src/lib/dates.js';

test('net salary R$ 3.000 without dependents', () => {
  const r = netSalary({ gross: 3000 });
  assert.equal(r.inss.value, 248.6);
  assert.equal(r.irrf.value, 0);
  assert.equal(r.net, 2751.4);
  assert.equal(r.fgts, 240);
});

test('net salary R$ 6.000', () => {
  const r = netSalary({ gross: 6000 });
  assert.equal(r.net, 4973.39);
});

test('vale-transporte is capped at 6% of the salary', () => {
  assert.equal(netSalary({ gross: 2000, transportCost: 500 }).transport, 120);
  assert.equal(netSalary({ gross: 2000, transportCost: 80 }).transport, 80);
});

test('gross from net is the inverse of net salary', () => {
  for (const target of [1500, 2751.4, 4200, 5000, 6543.21, 12000, 30000]) {
    const r = grossFromNet({ net: target });
    assert.ok(r.detail.net >= target, `net ${r.detail.net} < ${target}`);
    assert.ok(r.detail.net - target < 0.02, `overshoot for ${target}: ${r.detail.net}`);
  }
  assert.equal(grossFromNet({ net: 0 }), null);
});

test('vacation days by absences (CLT art. 130)', () => {
  assert.equal(vacationDaysByAbsences(0), 30);
  assert.equal(vacationDaysByAbsences(5), 30);
  assert.equal(vacationDaysByAbsences(6), 24);
  assert.equal(vacationDaysByAbsences(15), 18);
  assert.equal(vacationDaysByAbsences(24), 12);
  assert.equal(vacationDaysByAbsences(33), 0);
});

test('vacation of 30 days on R$ 3.000', () => {
  const r = vacation({ salary: 3000 });
  assert.equal(r.vacationPay, 3000);
  assert.equal(r.vacationThird, 1000);
  assert.equal(r.gross, 4000);
  // INSS on 4000: 121,575 + 115,3656 + 1097,16×12% = 368,60
  assert.equal(r.inss.value, 368.6);
  assert.equal(r.net, round(4000 - 368.6 - r.irrf.value));
});

test('selling 10 days: allowance is not taxed', () => {
  const r = vacation({ salary: 3000, soldDays: 10 });
  assert.equal(r.enjoyedDays, 20);
  assert.equal(r.vacationPay, 2000);
  assert.equal(r.allowance, 1000);
  assert.equal(r.allowanceThird, 333.33);
  // Only (2000 + 666,67) is taxed by INSS.
  assert.equal(r.inss.base, 2666.67);
});

test('cannot sell more than 1/3 of the entitled days', () => {
  assert.equal(vacation({ salary: 3000, soldDays: 15 }).soldDays, 10);
  assert.equal(vacation({ salary: 3000, soldDays: 15, absences: 10 }).soldDays, 8);
});

test('proportional vacation', () => {
  const r = proportionalVacation({ salary: 2400, twelfths: 6 });
  assert.equal(r.value, 1200);
  assert.equal(r.third, 400);
  assert.equal(r.total, 1600);
  assert.equal(r.days, 15);
});

test('13th salary R$ 3.000 full year', () => {
  const r = thirteenth({ salary: 3000 });
  assert.equal(r.gross, 3000);
  assert.equal(r.first, 1500);
  assert.equal(r.inss.value, 248.6);
  // Legal base 2751,40 → 7,5% − 182,16 = 24,20, then fully reduced by Lei 15.270.
  assert.equal(r.irrf.value, 0);
  assert.equal(r.second, round(3000 - 1500 - 248.6));
});

test('13th twelfths: 15 days rule', () => {
  // Admitted on 2026-03-17: March has 15 days (17..31) → counts.
  assert.equal(thirteenthTwelfths(2026, parseISO('2026-03-17'), parseISO('2026-12-31')), 10);
  // Admitted on 2026-03-18: March has 14 days → does not count.
  assert.equal(thirteenthTwelfths(2026, parseISO('2026-03-18'), parseISO('2026-12-31')), 9);
});

test('vacation twelfths: 15 days rule', () => {
  assert.equal(vacationTwelfths(parseISO('2026-01-10'), parseISO('2026-04-24')), 4);
  assert.equal(vacationTwelfths(parseISO('2026-01-10'), parseISO('2026-04-23')), 3);
  assert.equal(vacationTwelfths(parseISO('2025-01-01'), parseISO('2025-12-31')), 12);
});

test('proportional notice (Lei 12.506)', () => {
  assert.equal(noticeDays(parseISO('2026-01-01'), parseISO('2026-10-01')).days, 30);
  assert.equal(noticeDays(parseISO('2020-01-01'), parseISO('2026-01-01')).days, 48);
  assert.equal(noticeDays(parseISO('1990-01-01'), parseISO('2026-01-01')).days, 90);
  // One day before the anniversary does not count the year.
  assert.equal(noticeDays(parseISO('2020-01-02'), parseISO('2026-01-01')).days, 45);
});

test('termination without cause, indemnified notice', () => {
  const r = termination({
    salary: 3000, admission: '2024-03-01', termination: '2026-08-20', reason: 'dismissal', notice: 'indemnified', fgtsBalance: 7000,
  });
  // 2 full years → 36 days notice; projection to 2026-09-25.
  assert.equal(r.proportionalNotice, 36);
  assert.equal(r.projectedEnd, '2026-09-25');
  const get = (k) => r.items.find((i) => i.key === k)?.value ?? 0;
  assert.equal(get('balance'), 2000);
  assert.equal(get('notice'), 3600);
  // 13th: jan..sep (Sept has 25 days) = 9/12.
  assert.equal(r.thirteenthTwelfths, 9);
  assert.equal(get('thirteenth'), 2250);
  // Vacation: period started 2026-03-01 → 03-01..09-25 = 6 months + 25 days = 7/12.
  assert.equal(r.vacationTwelfths, 7);
  assert.equal(get('vacation'), 1750);
  assert.equal(get('vacationThird'), 583.33);
  assert.equal(r.fgts.fineRate, 0.4);
  // FGTS deposit on balance + notice + 13th = 7850 × 8% = 628
  assert.equal(r.fgts.deposit, 628);
  assert.equal(r.fgts.fine, round((7000 + 628) * 0.4));
  assert.equal(r.unemploymentEligible, true);
  assert.equal(r.net, round(r.earnings - r.discounts));
});

test('termination for cause: only balance and overdue vacation', () => {
  const r = termination({
    salary: 3000, admission: '2024-03-01', termination: '2026-08-20', reason: 'cause', overdueVacations: 1,
  });
  const keys = r.items.filter((i) => i.kind === 'earning').map((i) => i.key);
  assert.deepEqual(keys.sort(), ['balance', 'overdueVacation', 'overdueVacationThird'].sort());
  assert.equal(r.fgts.fine, 0);
  assert.equal(r.fgts.withdrawal, 0);
});

test('resignation without serving notice discounts 30 days', () => {
  const r = termination({
    salary: 3000, admission: '2025-01-10', termination: '2026-06-30', reason: 'resignation', notice: 'notServed',
  });
  const d = r.items.find((i) => i.key === 'noticeDiscount');
  assert.equal(d.value, 3000);
  assert.equal(r.items.find((i) => i.key === 'balance').value, 3000);
});

test('agreement: half notice, 20% fine and 80% withdrawal', () => {
  const r = termination({
    salary: 4000, admission: '2023-05-01', termination: '2026-05-31', reason: 'agreement', notice: 'indemnified', fgtsBalance: 10000,
  });
  assert.equal(r.proportionalNotice, 39);
  assert.equal(r.items.find((i) => i.key === 'notice').value, round((4000 / 30) * 19.5));
  assert.equal(r.fgts.fineRate, 0.2);
  assert.equal(r.fgts.withdrawal, round(r.fgts.balanceForFine * 0.8 + r.fgts.fine));
});

test('termination rejects invalid dates', () => {
  assert.throws(() => termination({ salary: 1, admission: '2026-05-01', termination: '2026-04-01', reason: 'dismissal' }));
});

test('overtime 50% and 100% on 220 hours', () => {
  const r = overtime({ salary: 2200, hours50: 10, hours100: 2 });
  assert.equal(r.hourly, 10);
  assert.equal(r.v50, 150);
  assert.equal(r.v100, 40);
  assert.equal(r.total, 190);
});

test('DSR on overtime', () => {
  assert.equal(dsr({ variable: 260, workingDays: 26, restDays: 4 }), 40);
  const r = overtime({ salary: 2200, hours50: 10, includeDsr: true, workingDays: 25, restDays: 5 });
  assert.equal(r.dsr, 30);
});

test('night premium with reduced hour', () => {
  const r = nightPremium({ salary: 2200, clockHours: 7 });
  assert.equal(r.paidHours, 8);
  assert.equal(r.premium, 16);
  const rural = nightPremium({ salary: 2200, clockHours: 8, rural: true });
  assert.equal(rural.premium, 20);
});

test('unemployment insurance brackets', () => {
  assert.equal(unemploymentInsurance({ salaries: [1621, 1621, 1621], request: 1, monthsWorked: 12 }).installment, 1621);
  assert.equal(unemploymentInsurance({ salaries: [2000, 2000, 2000], request: 1, monthsWorked: 12 }).installment, 1621);
  assert.equal(unemploymentInsurance({ salaries: [2222.17], request: 1, monthsWorked: 12 }).installment, 1777.74);
  assert.equal(unemploymentInsurance({ salaries: [3000, 3000, 3000], request: 1, monthsWorked: 30 }).installment, 2166.66);
  assert.equal(unemploymentInsurance({ salaries: [9000, 9000, 9000], request: 1, monthsWorked: 30 }).installment, 2518.65);
});

test('unemployment insurance installments by request', () => {
  assert.equal(unemploymentInsurance({ salaries: [3000], request: 1, monthsWorked: 11 }).eligible, false);
  assert.equal(unemploymentInsurance({ salaries: [3000], request: 1, monthsWorked: 12 }).installments, 4);
  assert.equal(unemploymentInsurance({ salaries: [3000], request: 1, monthsWorked: 24 }).installments, 5);
  assert.equal(unemploymentInsurance({ salaries: [3000], request: 2, monthsWorked: 9 }).installments, 3);
  assert.equal(unemploymentInsurance({ salaries: [3000], request: 2, monthsWorked: 12 }).installments, 4);
  assert.equal(unemploymentInsurance({ salaries: [3000], request: 3, monthsWorked: 6 }).installments, 3);
  assert.equal(unemploymentInsurance({ salaries: [3000], request: 3, monthsWorked: 5 }).eligible, false);
});

test('family allowance', () => {
  assert.equal(familyAllowance({ income: 1900, children: 2 }).total, 135.08);
  assert.equal(familyAllowance({ income: 2000, children: 2 }).total, 0);
});

test('employee cost in Simples Nacional and general regime', () => {
  const s = employeeCost({ salary: 3000, regime: 'simples' });
  // 3000 + 250 + 333,33 + 8% × 3583,33
  assert.equal(s.monthly, round(3000 + 250 + 333.33 + 286.67));
  const g = employeeCost({ salary: 3000, regime: 'general', rat: 0.02 });
  assert.ok(g.monthly > s.monthly);
  assert.equal(round(g.employerRate), 0.28);
});

test('worked hours with overnight shift', () => {
  assert.equal(workedHours([[8, 12], [13, 17.5]]), 8.5);
  assert.equal(workedHours([[22, 5]]), 7);
});

function round(n) {
  return Math.round(n * 100) / 100;
}
