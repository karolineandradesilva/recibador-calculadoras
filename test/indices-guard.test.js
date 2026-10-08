import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLatestUpdate, checkMonthlyUpdate } from '../scripts/lib/indices-guard.js';

const prev = { '2026-06': 0.16, '2026-07': 0.07, '2026-08': -0.32 };

test('accepts a normal new month', () => {
  assert.deepEqual(checkMonthlyUpdate('ipca', { ...prev, '2026-09': 0.44 }, prev), []);
});

test('accepts an unchanged series', () => {
  assert.deepEqual(checkMonthlyUpdate('ipca', { ...prev }, prev), []);
});

test('blocks an implausible new month', () => {
  const p = checkMonthlyUpdate('ipca', { ...prev, '2026-09': 4.5 }, prev);
  assert.equal(p.length, 1);
  assert.match(p[0], /acima do limite/);
});

test('IGP-M tolerates larger but still plausible swings', () => {
  assert.deepEqual(checkMonthlyUpdate('igpm', { ...prev, '2026-09': 4.34 }, prev), []);
  assert.equal(checkMonthlyUpdate('igpm', { ...prev, '2026-09': 9 }, prev).length, 1);
});

test('blocks changes to already published months', () => {
  const p = checkMonthlyUpdate('ipca', { ...prev, '2026-07': 0.7 }, prev);
  assert.match(p[0], /valor histórico mudou/);
});

test('ignores rounding noise in history', () => {
  assert.deepEqual(checkMonthlyUpdate('ipca', { ...prev, '2026-07': 0.071 }, prev), []);
});

test('blocks removed months, gaps and bursts of new months', () => {
  const { '2026-06': _, ...rest } = prev;
  assert.match(checkMonthlyUpdate('ipca', rest, prev)[0], /sumiu/);
  assert.match(checkMonthlyUpdate('ipca', { ...prev, '2026-10': 0.3 }, prev)[0], /fora de sequência/);
  assert.match(checkMonthlyUpdate('ipca', { ...prev, '2026-09': 0.1, '2026-10': 0.1, '2026-11': 0.1 }, prev)[0], /meses novos/);
});

const rates = {
  selic: { value: 13.75 }, cdi: { value: 13.65 }, tr: { value: 0.15 }, savings: { value: 0.65 }, usd: { value: 5.01 }, eur: { value: 5.6 },
};

test('accepts sane daily rates', () => {
  assert.deepEqual(checkLatestUpdate(rates, rates), []);
  assert.deepEqual(checkLatestUpdate({ ...rates, usd: { value: 5.3 } }, rates), []);
});

test('blocks absurd or jumping daily rates', () => {
  assert.equal(checkLatestUpdate({ ...rates, usd: { value: 50 } }, rates).length >= 1, true);
  assert.match(checkLatestUpdate({ ...rates, usd: { value: 6.2 } }, rates)[0], /salto/);
  assert.match(checkLatestUpdate({ ...rates, selic: { value: 18 }, cdi: { value: 17.9 } }, rates)[0], /p\.p\./);
  assert.match(checkLatestUpdate({ ...rates, cdi: { value: 9 } }, rates)[0], /distante/);
  assert.equal(checkLatestUpdate({ ...rates, usd: { value: NaN } }, rates).length, 1);
});
