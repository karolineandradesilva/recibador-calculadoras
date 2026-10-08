// Downloads official series from the Central Bank (SGS) and writes
// src/data/indices.json. Runs daily in GitHub Actions; a change triggers a new
// deploy. Fails loudly (non-zero exit) if a series cannot be validated, so a
// broken API response never overwrites good data.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/data/indices.json');
// Small file with only the latest rates, so calculators that need just the
// Selic/CDI/dollar do not ship the full monthly series to the browser.
const OUT_RATES = path.join(ROOT, 'src/data/rates.json');

const MONTHLY = { ipca: 433, inpc: 188, igpm: 189, igpdi: 190, incc: 192};
const LATEST = {
  selic: { sgs: 432, label: 'Meta Selic (% a.a.)' },
  cdi: { sgs: 4389, label: 'CDI anualizado base 252 (% a.a.)' },
  tr: { sgs: 226, label: 'TR mensal (%)' },
  savings: { sgs: 195, label: 'Rendimento mensal da poupança (%)' },
  usd: { sgs: 1, label: 'Dólar comercial PTAX — venda (R$)' },
  eur: { sgs: 21619, label: 'Euro PTAX — venda (R$)' },
};

const API = (sgs, query) => `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${sgs}/dados?formato=json${query}`;

async function fetchJson(url, attempts = 4) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'recibador.com.br indices updater' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Unexpected payload');
      return data;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error(`${url}: ${lastError.message}`);
}

const toMonth = (br) => {
  const [, m, y] = br.split('/');
  return `${y}-${m}`;
};
const toISO = (br) => {
  const [d, m, y] = br.split('/');
  return `${y}-${m}-${d}`;
};

async function monthlySeries(sgs) {
  const data = await fetchJson(API(sgs, '&dataInicial=01/01/2000'));
  const out = {};
  for (const row of data) {
    const v = Number(row.valor);
    if (!Number.isFinite(v)) continue;
    out[toMonth(row.data)] = v;
  }
  return out;
}

async function latestValue(sgs) {
  const data = await fetchJson(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${sgs}/dados/ultimos/1?formato=json`);
  const row = data[data.length - 1];
  const v = Number(row.valor);
  if (!Number.isFinite(v)) throw new Error(`SGS ${sgs}: invalid value`);
  return { value: v, date: toISO(row.data) };
}

function validateMonthly(name, series, previous) {
  const keys = Object.keys(series).sort();
  if (keys.length < 60) throw new Error(`${name}: too few months (${keys.length})`);
  for (const k of keys) {
    if (Math.abs(series[k]) > 30) throw new Error(`${name}: implausible value ${series[k]} in ${k}`);
  }
  if (previous) {
    const prevKeys = Object.keys(previous);
    if (keys.length < prevKeys.length - 1) throw new Error(`${name}: series shrank (${prevKeys.length} -> ${keys.length})`);
  }
}

async function main() {
  let previous = null;
  try {
    previous = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    // First run.
  }

  const monthly = {};
  for (const [name, sgs] of Object.entries(MONTHLY)) {
    try {
      const s = await monthlySeries(sgs);
      validateMonthly(name, s, previous?.monthly?.[name]);
      monthly[name] = s;
    } catch (err) {
      if (!previous?.monthly?.[name]) throw err;
      console.warn(`[indices] keeping previous ${name}: ${err.message}`);
      monthly[name] = previous.monthly[name];
    }
  }

  const latest = {};
  for (const [name, { sgs, label }] of Object.entries(LATEST)) {
    try {
      latest[name] = { label, ...(await latestValue(sgs)) };
    } catch (err) {
      if (!previous?.latest?.[name]) throw err;
      console.warn(`[indices] keeping previous ${name}: ${err.message}`);
      latest[name] = previous.latest[name];
    }
  }
  if (!(latest.selic.value > 0 && latest.selic.value < 60)) throw new Error('Selic out of range');
  if (!(latest.usd.value > 1 && latest.usd.value < 30)) throw new Error('USD out of range');

  const payload = { monthly, latest };
  const sameData = previous && JSON.stringify({ monthly: previous.monthly, latest: previous.latest }) === JSON.stringify(payload);
  if (sameData) {
    console.log('[indices] no changes');
    return;
  }
  const updatedAt = new Date().toISOString();
  const out = { source: 'Banco Central do Brasil — SGS', updatedAt, ...payload };
  await writeFile(OUT, `${JSON.stringify(out)}\n`);
  await writeFile(OUT_RATES, `${JSON.stringify({ updatedAt, latest }, null, 1)}\n`);
  console.log('[indices] updated', Object.fromEntries(Object.entries(monthly).map(([k, v]) => [k, Object.keys(v).sort().at(-1)])));
}

main().catch((err) => {
  console.error('[indices] failed:', err.message);
  process.exit(1);
});
