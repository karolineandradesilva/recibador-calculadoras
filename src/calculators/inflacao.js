import { accumulated } from '../calc/indices.js';
import { brl, row, pct } from './_shared.js';
import { SERIES, monthOptions, latestMonth, monthLabel, nextMonth, UPDATED_AT } from './_indices.js';
import { dateLabel } from '../lib/format.js';

export const meta = {
  slug: 'inflacao',
  category: 'indices',
  icon: 'chart',
  short: 'Inflação e poder de compra',
  h1: 'Calculadora de inflação e poder de compra (IPCA)',
  title: 'Calculadora de Inflação: quanto o dinheiro perdeu de valor (IPCA)',
  description: 'Descubra quanto a inflação oficial (IPCA) corroeu o poder de compra de um valor ao longo do tempo e quanto seria preciso hoje para comprar o mesmo que antes.',
  lead: 'Veja quanto o seu dinheiro perdeu de valor com a inflação e se um salário ou rendimento acompanhou o IPCA.',
  card: 'Perda de poder de compra pelo IPCA.',
  keywords: ['inflacao', 'poder de compra', 'ipca acumulado', 'quanto valia', 'perda salarial', 'inflacao acumulada'],
  related: ['correcao-monetaria', 'reajuste-salarial', 'reajuste-aluguel', 'rendimento-poupanca'],
  sources: ['bcb'],
  legal: false,
  dynamicData: true,
};

const last = latestMonth('ipca');

export const ui = {
  fields: [
    { name: 'amount', label: 'Valor no passado', type: 'money', default: 3000, min: 0.01 },
    { name: 'from', label: 'Desde', type: 'select', default: nextMonth(last, -119), options: monthOptions({ from: '2000-01' }), width: 'half' },
    { name: 'to', label: 'Até', type: 'select', default: last, options: monthOptions({ from: '2000-01' }), width: 'half' },
    { name: 'now', label: 'Valor atual (opcional)', type: 'money', min: 0, required: false, help: 'Ex.: o salário de hoje, para comparar com a inflação.' },
  ],
  validate(v) {
    if (v.from > v.to) return { to: 'O mês final deve ser igual ou posterior ao inicial.' };
    if (v.to > latestMonth('ipca')) return { to: `O IPCA mais recente é de ${monthLabel(latestMonth('ipca'))}.` };
    return null;
  },
  compute(v) {
    const acc = accumulated(SERIES.ipca, v.from, v.to);
    if (!acc.valid) return { error: acc.reason };
    const equivalent = v.amount * acc.factor;
    const lostPower = 1 - 1 / acc.factor;
    const sections = [
      {
        rows: [
          row(`Valor em ${monthLabel(v.from)}`, v.amount),
          row('IPCA acumulado', pct(acc.rate)),
          row(`Equivalente em ${monthLabel(v.to)}`, equivalent, 'total'),
        ],
      },
    ];
    let alert = null;
    if (Number.isFinite(v.now) && v.now > 0) {
      const real = v.now / equivalent - 1;
      sections.push({ title: 'Comparação com o valor atual', rows: [row('Valor atual informado', v.now), row('Ganho ou perda real', pct(real), real >= 0 ? 'plus' : 'minus')] });
      alert = real >= 0 ? { tone: 'ok', text: `O valor atual superou a inflação em ${pct(real)}.` } : { tone: 'warn', text: `O valor atual ficou ${pct(-real)} abaixo da inflação do período.` };
    }
    return {
      hero: { label: 'Para comprar o mesmo hoje, seria preciso', value: brl(equivalent), sub: `IPCA de ${pct(acc.rate)} em ${acc.months} meses` },
      alert,
      cards: [{ label: 'Perda de poder de compra', value: pct(lostPower), tone: 'minus', sub: `${brl(v.amount)} hoje compram o que ${brl(v.amount / acc.factor)} compravam` }],
      sections,
      notes: [`IPCA do IBGE, via Banco Central, atualizado em ${dateLabel(UPDATED_AT)}.`],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-funciona',
        title: 'Como medir a perda de poder de compra',
        html: `<p>A inflação faz o mesmo dinheiro comprar menos. O IPCA, calculado pelo IBGE, é a inflação oficial do Brasil e mede a variação de preços de uma cesta de consumo das famílias.</p>
<div class="formula">Equivalente hoje = valor antigo × (1 + IPCA acumulado)
Perda de poder de compra = 1 − 1 ÷ (1 + IPCA acumulado)</div>
<div class="example"><p>${h.brl(3000)} de dez anos atrás equivalem hoje a <strong>${ex.hero.value}</strong> (${ex.hero.sub}). A perda de poder de compra foi de ${ex.cards[0].value}.</p></div>`,
      },
      {
        id: 'usos',
        title: 'Usos práticos',
        html: `<ul><li><strong>Salário:</strong> informe o salário antigo e o atual para ver se houve ganho real. Para simular um reajuste, use a ${h.link('reajuste-salarial', 'calculadora de reajuste salarial')}.</li>
<li><strong>Investimentos:</strong> um rendimento abaixo do IPCA significa perda real, mesmo com saldo maior.</li>
<li><strong>Preços:</strong> compare quanto um produto deveria custar hoje se tivesse acompanhado a inflação.</li></ul>`,
      },
    ],
    faq: [{ q: 'Qual a diferença entre IPCA e INPC?', a: '<p>O IPCA considera famílias com renda de 1 a 40 salários mínimos; o INPC, de 1 a 5 salários mínimos. O INPC é usado no reajuste do salário mínimo e dos benefícios do INSS.</p>' }],
    limitations: ['A inflação de cada pessoa depende do que ela consome; o IPCA é uma média nacional.'],
  };
}
