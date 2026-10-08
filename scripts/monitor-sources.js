// Watches the official pages that define the legal tables used by the site.
// When the relevant content changes (or when a new year is approaching), it
// prints a report and exits with code 2 so the GitHub workflow opens an issue
// for human review. It never edits the parameters by itself: legal values are
// always reviewed by a person before being published.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRENT as P } from '../src/data/params/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE = path.join(ROOT, 'src/data/source-state.json');

const WATCH = [
  { key: 'irrf', url: P.sources.irrf.url, label: 'Receita Federal — tabelas do IR' },
  { key: 'inss', url: P.sources.inss.url, label: 'INSS — tabela de contribuição' },
  { key: 'familyAllowance', url: P.sources.familyAllowance.url, label: 'INSS — salário-família' },
  { key: 'unemployment', url: P.sources.unemployment.url, label: 'MTE — seguro-desemprego' },
  { key: 'nextYearIrrf', url: `https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/${P.year + 1}`, label: `Receita Federal — tabelas de ${P.year + 1}`, existence: true },
];

/** Extracts a stable fingerprint: every money/percent value on the page. */
function fingerprint(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
  const numbers = text.match(/R\$\s?\d{1,3}(?:\.\d{3})*,\d{2}|\d{1,3},\d{1,2}\s?%/g) ?? [];
  const unique = [...new Set(numbers)].sort();
  return { hash: createHash('sha256').update(unique.join('|')).digest('hex').slice(0, 16), sample: unique.slice(0, 40) };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (recibador.com.br source monitor)', Accept: 'text/html' }, redirect: 'follow' });
  return { status: res.status, body: res.ok ? await res.text() : '' };
}

async function main() {
  let state = {};
  try {
    state = JSON.parse(await readFile(STATE, 'utf8'));
  } catch {
    // First run: record the baseline.
  }
  const alerts = [];
  const next = { ...state };
  for (const w of WATCH) {
    try {
      const { status, body } = await fetchText(w.url);
      if (w.existence) {
        const exists = status === 200 && /tabela/i.test(body);
        if (exists && !state[w.key]?.exists) alerts.push(`A página "${w.label}" foi publicada: ${w.url}. Prepare src/data/params/${P.year + 1}.js.`);
        next[w.key] = { exists, checkedAt: new Date().toISOString() };
        continue;
      }
      if (status !== 200) {
        alerts.push(`Não foi possível ler "${w.label}" (HTTP ${status}): ${w.url}. Verifique se o endereço mudou.`);
        continue;
      }
      const fp = fingerprint(body);
      if (state[w.key]?.hash && state[w.key].hash !== fp.hash) {
        alerts.push(`O conteúdo de "${w.label}" mudou: ${w.url}\nValores encontrados agora: ${fp.sample.join(', ')}`);
      }
      next[w.key] = { hash: fp.hash, sample: fp.sample, checkedAt: new Date().toISOString() };
    } catch (err) {
      alerts.push(`Erro ao verificar "${w.label}": ${err.message}`);
    }
  }

  // Yearly reminder: from December on, the next year's tables must be prepared.
  const now = new Date();
  if (now.getUTCMonth() === 11 || now.getUTCFullYear() > P.year) {
    alerts.push(`Lembrete anual: as regras publicadas são de ${P.year}. Verifique salário mínimo, INSS, IRRF, salário-família, seguro-desemprego e MEI de ${P.year + 1} assim que forem oficializados.`);
  }

  await writeFile(STATE, `${JSON.stringify(next, null, 2)}\n`);
  if (alerts.length) {
    const report = alerts.map((a) => `- ${a}`).join('\n');
    console.log(report);
    await writeFile(path.join(ROOT, '.source-alerts.md'), `${report}\n`);
    process.exit(2);
  }
  console.log('[monitor] nenhuma mudança nas fontes oficiais');
}

main();
