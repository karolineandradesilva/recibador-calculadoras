import { fixedIncome, incomeTaxRateByDays } from '../calc/finance.js';
import { brl, row, pct, frac } from './_shared.js';
import { LATEST } from './_rates.js';
import { dateLabel } from '../lib/format.js';

export const meta = {
  slug: 'investimentos',
  category: 'financas',
  icon: 'coins',
  short: 'CDB, LCI, LCA e poupança',
  h1: 'Calculadora de investimentos: CDB x LCI/LCA x poupança',
  title: 'Simulador CDB x LCI/LCA x Poupança: rendimento líquido',
  description: 'Compare o rendimento líquido de CDB, LCI, LCA e poupança com o CDI e a Selic atualizados pelo Banco Central, já descontando Imposto de Renda e IOF.',
  lead: 'Compare aplicações de renda fixa lado a lado, com o CDI atual e o Imposto de Renda pelo prazo.',
  card: 'Rendimento líquido com CDI atualizado e IR.',
  keywords: ['cdb', 'lci', 'lca', 'poupanca', 'cdi', 'renda fixa', 'rendimento', 'simulador investimento', 'quanto rende'],
  related: ['rendimento-poupanca', 'juros-compostos', 'reserva-de-emergencia', 'meta-de-investimento'],
  sources: ['investments', 'iof', 'savings', 'bcb'],
  legal: false,
  dynamicData: true,
};

const cdi = LATEST.cdi.value;

export const ui = {
  fields: [
    { name: 'amount', label: 'Valor investido', type: 'money', default: 10000, min: 1 },
    { name: 'days', label: 'Prazo', type: 'integer', default: 365, min: 1, max: 36500, suffix: 'dias', width: 'half', help: 'Dias corridos até o resgate.' },
    { name: 'cdi', label: 'CDI ao ano', type: 'percent', default: cdi, min: 0, max: 100, width: 'half', help: `Atual: ${String(cdi).replace('.', ',')}% (BCB).` },
    { name: 'cdbPct', label: 'CDB rende (% do CDI)', type: 'percent', default: 105, min: 0, max: 300, width: 'half' },
    { name: 'lciPct', label: 'LCI/LCA rende (% do CDI)', type: 'percent', default: 90, min: 0, max: 300, width: 'half' },
  ],
  compute(v) {
    const base = { amount: v.amount, days: v.days, kind: 'cdi', cdiAnnual: frac(v.cdi) };
    const cdb = fixedIncome({ ...base, cdiPercent: frac(v.cdbPct) });
    const lci = fixedIncome({ ...base, cdiPercent: frac(v.lciPct), taxExempt: true });
    const savings = fixedIncome({ amount: v.amount, days: v.days, kind: 'savings', savingsMonthly: LATEST.savings.value / 100 });
    const options = [
      ['CDB', cdb],
      ['LCI/LCA', lci],
      ['Poupança', savings],
    ].sort((a, b) => b[1].net - a[1].net);
    const [bestName, best] = options[0];
    const irRate = incomeTaxRateByDays(v.days);
    const lciEquivalent = frac(v.lciPct) / (1 - irRate);
    return {
      hero: { label: 'Melhor rendimento líquido', value: `${bestName}: ${brl(best.net)}`, sub: `Saldo final de ${brl(best.final)}` },
      cards: options.map(([name, r]) => ({ label: name, value: brl(r.final), sub: `${pct(r.netAnnual)} a.a. líquido` })),
      sections: [
        {
          title: `CDB a ${String(v.cdbPct).replace('.', ',')}% do CDI`,
          rows: [row('Rendimento bruto', cdb.gross, 'plus'), cdb.iof ? row('IOF', cdb.iof, 'minus') : null, row(`Imposto de Renda (${pct(cdb.irRate, 1)})`, cdb.ir, 'minus'), row('Rendimento líquido', cdb.net, 'total')],
        },
        {
          title: `LCI/LCA a ${String(v.lciPct).replace('.', ',')}% do CDI`,
          rows: [row('Rendimento (isento de IR)', lci.gross, 'plus'), lci.iof ? row('IOF', lci.iof, 'minus') : null, row('Rendimento líquido', lci.net, 'total'), row('Equivale a um CDB de', `${pct(lciEquivalent, 1)} do CDI`, 'muted', 'Considerando o IR deste prazo')],
        },
        {
          title: 'Poupança',
          rows: [row(`Rendimento (${String(LATEST.savings.value).replace('.', ',')}% ao mês, isento)`, savings.net, 'total')],
        },
      ],
      notes: [`CDI e poupança: dados do Banco Central atualizados em ${dateLabel(LATEST.cdi.date)}. Simulação com taxa constante no período.`],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-calcular',
        title: 'Como o rendimento é calculado',
        html: `<p>Aplicações pós-fixadas rendem um percentual do <strong>CDI</strong>, a taxa dos empréstimos entre bancos, que acompanha a Selic. O rendimento é diário, em dias úteis (252 por ano):</p>
<div class="formula">Fator diário = (1 + CDI)^(1/252) − 1, multiplicado pelo % do CDI
Rendimento bruto = valor × [(1 + fator diário)^dias úteis − 1]
Rendimento líquido = bruto − IOF − IR</div>
<div class="example"><p>${h.brl(10000)} por 365 dias, CDB a 105% e LCI a 90% do CDI: o melhor é <strong>${ex.hero.value}</strong>.</p></div>`,
      },
      {
        id: 'impostos',
        title: 'Imposto de Renda e IOF',
        html: `${h.table(['Prazo da aplicação', 'Alíquota de IR'], [['até 180 dias', '22,5%'], ['de 181 a 360 dias', '20%'], ['de 361 a 720 dias', '17,5%'], ['acima de 720 dias', '15%']])}
<p>O IR incide apenas sobre o rendimento e é retido no resgate. LCI, LCA e poupança são isentas para pessoas físicas. Resgates em menos de 30 dias pagam também IOF regressivo (96% do rendimento no 1º dia, zerando no 30º).</p>`,
      },
      {
        id: 'escolher',
        title: 'Como escolher',
        html: `<ul><li><strong>Compare sempre o líquido:</strong> uma LCI a 90% do CDI pode render mais que um CDB a 105%, dependendo do prazo.</li>
<li><strong>Garantia:</strong> CDB, LCI e LCA têm cobertura do FGC até R$ 250 mil por CPF e instituição.</li>
<li><strong>Liquidez:</strong> LCI e LCA têm prazo mínimo de carência; para a reserva de emergência, prefira liquidez diária. Veja a ${h.link('reserva-de-emergencia', 'calculadora de reserva de emergência')}.</li></ul>`,
      },
    ],
    faq: [
      { q: 'Por que a poupança rende 0,5% ao mês + TR?', a: '<p>Enquanto a Selic está acima de 8,5% ao ano, a poupança rende 0,5% ao mês mais a TR. Com a Selic igual ou abaixo de 8,5%, passa a render 70% da Selic mais a TR (Lei 8.177/1991, art. 12).</p>' },
      { q: 'O CDI usado é atualizado?', a: '<p>Sim. O valor sugerido é obtido automaticamente do Banco Central, mas você pode alterá-lo para simular cenários.</p>' },
    ],
    limitations: ['Não considera taxas de custódia, variações futuras do CDI nem aplicações prefixadas ou atreladas à inflação.', 'A conversão de dias corridos em dias úteis é aproximada (252/365).', 'Não é recomendação de investimento.'],
  };
}
