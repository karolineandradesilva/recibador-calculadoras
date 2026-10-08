import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inssEmployee, irrfMonthly, irrfPlr, irrfReduction, irrfThirteenth, inssIndividual } from '../src/calc/tax.js';
import { CURRENT as P } from '../src/data/params/index.js';

test('INSS: first bracket only', () => {
  assert.equal(inssEmployee(1621).value, 121.58);
  assert.equal(inssEmployee(1000).value, 75);
});

test('INSS: progressive slices for R$ 3.000', () => {
  // 1621×7,5% + 1281,84×9% + 97,16×12% = 248,5998
  const r = inssEmployee(3000);
  assert.equal(r.value, 248.6);
  assert.equal(r.slices.length, 3);
});

test('INSS: ceiling contribution is R$ 988,09', () => {
  assert.equal(inssEmployee(P.inss.ceiling).value, 988.09);
  assert.equal(inssEmployee(20000).value, 988.09);
  assert.equal(inssEmployee(20000).capped, true);
});

test('INSS: zero and negative salaries', () => {
  assert.equal(inssEmployee(0).value, 0);
  assert.equal(inssEmployee(-50).value, 0);
});

test('IRRF: R$ 3.000 is exempt (simplified discount + reduction)', () => {
  const inss = inssEmployee(3000).value;
  assert.equal(irrfMonthly({ taxableIncome: 3000, inss }).value, 0);
});

test('IRRF: R$ 5.000 pays zero thanks to Lei 15.270', () => {
  const inss = inssEmployee(5000).value;
  const r = irrfMonthly({ taxableIncome: 5000, inss });
  assert.equal(r.taxBeforeReduction, 312.89);
  assert.equal(r.reduction, 312.89);
  assert.equal(r.value, 0);
});

test('IRRF: R$ 6.000 gets the partial reduction', () => {
  const inss = inssEmployee(6000).value; // 641,51
  assert.equal(inss, 641.51);
  const r = irrfMonthly({ taxableIncome: 6000, inss });
  assert.equal(r.method, 'legal');
  assert.equal(r.taxBeforeReduction, 564.85);
  assert.equal(r.reduction, 179.75);
  assert.equal(r.value, 385.1);
});

test('IRRF: reduction ends at R$ 7.350', () => {
  assert.equal(irrfReduction(7350, 1000), 0);
  assert.equal(irrfReduction(7351, 1000), 0);
  assert.equal(irrfReduction(10000, 1000), 0);
  // Just above R$ 5.000 the reduction is ~R$ 312,89.
  assert.equal(irrfReduction(5000.01, 1000), 312.89);
});

test('IRRF: reduction never exceeds the tax', () => {
  assert.equal(irrfReduction(3000, 20), 20);
  assert.equal(irrfReduction(6000, 50), 50);
});

test('IRRF: high income without reduction', () => {
  const inss = inssEmployee(15000).value;
  const r = irrfMonthly({ taxableIncome: 15000, inss });
  // base 14011,91 × 27,5% − 908,73 = 2944,55
  assert.equal(r.base, 14011.91);
  assert.equal(r.value, 2944.55);
  assert.equal(r.reduction, 0);
});

test('IRRF: dependents reduce the legal base', () => {
  const inss = inssEmployee(10000).value;
  const none = irrfMonthly({ taxableIncome: 10000, inss });
  const two = irrfMonthly({ taxableIncome: 10000, inss, dependents: 2 });
  assert.ok(Math.abs((none.value - two.value) - 2 * 189.59 * 0.275) <= 0.011);
});

test('IRRF on 13th: legal deductions only, reduction applies', () => {
  const inss = inssEmployee(4000).value;
  const r = irrfThirteenth({ gross: 4000, inss });
  assert.equal(r.method, 'legal');
  assert.equal(r.value, 0);
});

test('PLR: exempt up to R$ 8.214,40 and cumulative in the year', () => {
  assert.equal(irrfPlr({ amount: 8000 }).value, 0);
  // 12000 × 15% − 1360,25 = 439,75
  assert.equal(irrfPlr({ amount: 12000 }).value, 439.75);
  const second = irrfPlr({ amount: 4000, previousInYear: 8000, previousTaxWithheld: 0 });
  assert.equal(second.value, 439.75);
});

test('Brackets are continuous (no jump between bracket limits)', () => {
  for (const table of [P.irrf.monthly, P.irrf.plr]) {
    for (let i = 0; i < table.length - 1; i += 1) {
      const limit = table[i].upTo;
      const below = limit * table[i].rate - table[i].deduction;
      const above = limit * table[i + 1].rate - table[i + 1].deduction;
      assert.ok(Math.abs(below - above) < 0.02, `discontinuity at ${limit}`);
    }
  }
});

test('Individual INSS (20%) is capped at the ceiling', () => {
  assert.equal(inssIndividual(20000, 0.2).value, 1695.11);
  assert.equal(inssIndividual(1621, 0.2).value, 324.2);
});

function round(n) {
  return Math.round(n * 100) / 100;
}
