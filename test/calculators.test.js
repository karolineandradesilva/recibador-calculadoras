// Smoke and fuzz tests for every calculator definition: default inputs must
// produce a valid result, and random valid inputs must never produce NaN,
// "undefined" or a crash.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CALCULATORS } from '../src/calculators/index.js';
import { parsedDefaults, parseValue } from '../src/ui/values.js';
import { validateAll } from '../src/ui/validate.js';
import { renderResult, resultToText } from '../src/ui/render.js';

const BAD = /NaN|undefined|Infinity|\[object Object\]|null/;

function checkResult(slug, result, values) {
  assert.ok(result && typeof result === 'object', `${slug}: no result`);
  const html = renderResult(result);
  const text = resultToText(result, slug);
  assert.ok(!BAD.test(html), `${slug}: bad output ${html.match(BAD)?.[0]} for ${JSON.stringify(values)}`);
  assert.ok(!BAD.test(text), `${slug}: bad text output for ${JSON.stringify(values)}`);
}

function fieldValue(f, rnd, values) {
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  switch (f.type) {
    case 'money': {
      const min = f.min ?? 0;
      const max = Math.min(f.max ?? 1e6, 1e6);
      return Math.round((min + rnd() ** 2 * (max - min)) * 100) / 100 || min || 1;
    }
    case 'percent':
    case 'number': {
      const min = f.min ?? 0;
      const max = Math.min(f.max ?? 1000, 1000);
      return Math.round((min + rnd() * (max - min)) * 100) / 100;
    }
    case 'integer': {
      const min = f.min ?? 0;
      const max = Math.max(min, Math.min(f.max ?? 100, min + 400));
      return Math.floor(min + rnd() * (max - min + 1));
    }
    case 'checkbox':
      return rnd() > 0.5;
    case 'select':
    case 'radio': {
      const opts = typeof f.options === 'function' ? f.options(values) : f.options;
      const o = pick(opts);
      return f.numeric ? Number(o.value) : o.value;
    }
    case 'hours':
      return Math.round(rnd() * 200 * 4) / 4;
    case 'time':
      return Math.round(rnd() * 24 * 4) / 4 % 24;
    case 'date': {
      const y = 2018 + Math.floor(rnd() * 9);
      const m = 1 + Math.floor(rnd() * 12);
      const d = 1 + Math.floor(rnd() * 28);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    default:
      return f.default;
  }
}

// Deterministic PRNG (mulberry32).
function prng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

for (const calc of CALCULATORS) {
  const { slug } = calc.meta;

  test(`${slug}: default values produce a result`, () => {
    const values = parsedDefaults(calc.ui.fields);
    const errors = validateAll(calc.ui, values);
    assert.ok(!Object.keys(errors).length, `${slug}: defaults fail validation ${JSON.stringify(errors)}`);
    const result = calc.ui.compute(values);
    assert.ok(!result.error, `${slug}: ${result.error}`);
    assert.ok(result.hero, `${slug}: missing hero`);
    checkResult(slug, result, values);
  });

  test(`${slug}: random valid inputs never break`, () => {
    const rnd = prng(slug.length * 7919);
    for (let i = 0; i < 400; i += 1) {
      const values = parsedDefaults(calc.ui.fields);
      for (const f of calc.ui.fields) values[f.name] = fieldValue(f, rnd, values);
      // Optional fields are sometimes left empty.
      for (const f of calc.ui.fields) if (f.required === false && rnd() < 0.3) values[f.name] = null;
      const errors = validateAll(calc.ui, values);
      if (Object.keys(errors).length) continue;
      let result;
      try {
        result = calc.ui.compute(values);
      } catch (err) {
        // Explicit domain errors are acceptable; crashes are not.
        assert.fail(`${slug}: threw "${err.message}" for ${JSON.stringify(values)}`);
      }
      if (result.error) continue;
      checkResult(slug, result, values);
    }
  });

  test(`${slug}: content and metadata are complete`, () => {
    const m = calc.meta;
    assert.ok(m.title && m.h1 && m.description && m.lead && m.short && m.card, `${slug}: missing metadata`);
    assert.ok(m.description.length >= 110 && m.description.length <= 165, `${slug}: description length ${m.description.length}`);
    assert.ok(m.title.length <= 70, `${slug}: title length ${m.title.length}`);
  });
}

// Absurd inputs must always be rejected with a message, never computed.
const ABSURD = {
  money: ['-1', 'abc', '1e400', '9999999999999', '12,34,56'],
  number: ['abc', '1e400', '--5'],
  percent: ['abc', '-500', '99999'],
  integer: ['-3', 'abc', '2,5', '99999999'],
  hours: ['8:75', 'abc', '-2', '99999'],
  time: ['25:00', 'abc'],
  date: ['2026-02-31', '2026-13-01', '1800-01-01', '2300-01-01', 'abc'],
};

for (const calc of CALCULATORS) {
  const { slug } = calc.meta;
  test(`${slug}: absurd inputs are rejected`, () => {
    for (const f of calc.ui.fields) {
      const bad = ABSURD[f.type];
      if (!bad) continue;
      for (const raw of bad) {
        const values = parsedDefaults(calc.ui.fields);
        values[f.name] = parseValue(f, raw);
        if (f.showIf && !f.showIf(values)) continue;
        const errors = validateAll(calc.ui, values);
        // Some "absurd" strings are valid for optional fields with wide ranges; they must still compute safely.
        if (!errors[f.name] && !Object.keys(errors).length) {
          const result = calc.ui.compute(values);
          checkResult(slug, result, values);
          assert.ok(!['1e400', 'abc', '8:75', '25:00', '2026-02-31', '2026-13-01'].includes(raw), `${slug}.${f.name}: accepted "${raw}"`);
        }
      }
    }
  });

  test(`${slug}: reversed date ranges are rejected`, () => {
    for (const f of calc.ui.fields.filter((x) => x.type === 'date' && x.after)) {
      const values = parsedDefaults(calc.ui.fields);
      if (f.showIf && !f.showIf(values)) continue;
      const start = values[f.after];
      const d = new Date(`${start}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 1);
      values[f.name] = d.toISOString().slice(0, 10);
      const errors = validateAll(calc.ui, values);
      assert.ok(errors[f.name], `${slug}: ${f.name} before ${f.after} was accepted`);
    }
  });
}
