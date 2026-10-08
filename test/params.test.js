import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRENT as P } from '../src/data/params/index.js';
import { readFileSync } from 'node:fs';

// Fails once the tables are outdated so a stale year is never deployed
// silently. Grace period: new tables are usually published in early January.
const GRACE_DAYS = 20;

test('legal parameters are within their validity window', () => {
  const limit = new Date(`${P.validUntil}T23:59:59Z`);
  limit.setUTCDate(limit.getUTCDate() + GRACE_DAYS);
  assert.ok(
    new Date() <= limit,
    `Parâmetros de ${P.year} venceram em ${P.validUntil}. Crie src/data/params/${P.year + 1}.js com as tabelas oficiais novas.`,
  );
});

test('every parameter source has a label and an https url', () => {
  for (const [key, s] of Object.entries(P.sources)) {
    assert.ok(s.label, `${key} without label`);
    assert.match(s.url, /^https:\/\//, `${key} without https url`);
  }
});

test('INSS brackets are increasing and end at the ceiling', () => {
  const b = P.inss.employee;
  for (let i = 1; i < b.length; i += 1) assert.ok(b[i].upTo > b[i - 1].upTo);
  assert.equal(b[b.length - 1].upTo, P.inss.ceiling);
  assert.equal(b[0].upTo, P.minimumWage);
});

test('values derived from the minimum wage stay consistent', () => {
  assert.equal(P.unemploymentInsurance.floor, P.minimumWage);
  // 80% of the first bracket limit equals the fixed part of the second bracket.
  const u = P.unemploymentInsurance;
  assert.ok(Math.abs(u.firstBracketUpTo * u.firstBracketRate - u.secondBracketFixed) < 0.01);
  assert.ok(Math.abs(u.secondBracketFixed + (u.secondBracketUpTo - u.firstBracketUpTo) * u.secondBracketRate - u.ceiling) < 0.01);
});

test('Simples Nacional brackets 1 to 5 are continuous', () => {
  // The 6th bracket is discontinuous by design (ICMS/ISS are paid outside
  // the DAS above the R$ 3,6 million sub-limit).
  for (const [annex, table] of Object.entries(P.simples.annexes)) {
    for (let i = 0; i < table.length - 2; i += 1) {
      const x = table[i].upTo;
      const a = x * table[i].rate - table[i].deduction;
      const b = x * table[i + 1].rate - table[i + 1].deduction;
      assert.ok(Math.abs(a - b) < 1, `Anexo ${annex} discontinuity at ${x}`);
    }
  }
});

test('indices data is present and recent', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/indices.json', import.meta.url)));
  for (const k of ['ipca', 'inpc', 'igpm', 'igpdi', 'incc']) {
    const months = Object.keys(data.monthly[k]).sort();
    assert.ok(months.length > 200, `${k} too short`);
    const [y, m] = months.at(-1).split('-').map(Number);
    const ageMonths = (new Date().getUTCFullYear() - y) * 12 + (new Date().getUTCMonth() + 1 - m);
    assert.ok(ageMonths <= 4, `${k} last month ${months.at(-1)} is too old`);
  }
  assert.ok(data.latest.usd.value > 1);
});
