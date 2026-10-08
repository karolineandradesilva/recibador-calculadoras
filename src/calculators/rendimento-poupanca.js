import { compoundInterest, monthlyToAnnual } from '../calc/finance.js';
import { brl, row, pct, val } from './_shared.js';
import { LATEST } from './_rates.js';
import { dateLabel } from '../lib/format.js';

export const meta = {
  slug: 'rendimento-poupanca',
  category: 'financas',
  icon: 'piggy',
  short: 'Rendimento da poupança',
  h1: 'Calculadora de rendimento da poupança',
  title: 'Rendimento da Poupança Hoje: simule quanto rende por mês',
  description: 'Simule quanto rende a poupança com a taxa atual divulgada pelo Banco Central, com depósito inicial e mensal, e compare com o rendimento do CDI.',
  lead: 'Veja quanto o seu dinheiro rende na poupança com a taxa atual, com depósitos mensais.',
  card: 'Rendimento com a taxa atual do Banco Central.',
  keywords: ['poupanca', 'rendimento poupanca', 'quanto rende', 'poupanca hoje', 'taxa poupanca'],
  related: ['investimentos', 'juros-compostos', 'reserva-de-emergencia', 'inflacao'],
  sources: ['savings', 'bcb'],
  legal: false,
  dynamicData: true,
};

const rate = LATEST.savings.value;

export const ui = {
  fields: [
    { name: 'initial', label: 'Depósito inicial', type: 'money', default: 5000, min: 0, width: 'half' },
    { name: 'monthly', label: 'Depósito mensal', type: 'money', default: 300, min: 0, required: false, width: 'half' },
    { name: 'months', label: 'Prazo', type: 'integer', default: 24, min: 1, max: 600, suffix: 'meses', width: 'half' },
    { name: 'rate', label: 'Rendimento mensal', type: 'percent', default: rate, min: 0, max: 10, width: 'half', help: `Atual: ${String(rate).replace('.', ',')}% (BCB).` },
  ],
  validate(v) {
    if (!(v.initial > 0 || val(v.monthly) > 0)) return { initial: 'Informe um depósito inicial ou mensal.' };
    return null;
  },
  compute(v) {
    const i = v.rate / 100;
    const r = compoundInterest({ principal: v.initial, monthlyContribution: val(v.monthly), monthlyRate: i, months: v.months });
    return {
      hero: { label: 'Saldo final', value: brl(r.total), sub: `Em ${v.months} meses, a ${pct(i, 4)} ao mês (${pct(monthlyToAnnual(i))} ao ano)` },
      cards: [
        { label: 'Total depositado', value: brl(r.invested) },
        { label: 'Rendimento', value: brl(r.interest), tone: 'plus', sub: 'Isento de IR' },
      ],
      table: {
        caption: r.step === 12 ? 'Evolução ano a ano' : 'Evolução mês a mês',
        columns: [r.step === 12 ? 'Ano' : 'Mês', 'Depositado', 'Rendimento', 'Saldo'],
        rows: r.rows.map((x) => [String(r.step === 12 ? x.period / 12 : x.period), brl(x.invested), brl(x.interest), brl(x.balance)]),
      },
      notes: [`Taxa de referência do Banco Central em ${dateLabel(LATEST.savings.date)}. A poupança rende só no aniversário mensal de cada depósito.`],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'regra',
        title: 'Como a poupança rende',
        html: `${h.table(['Selic (meta)', 'Rendimento da poupança'], [['acima de 8,5% ao ano', '0,5% ao mês + TR'], ['igual ou abaixo de 8,5% ao ano', '70% da Selic + TR']])}
<p>Com a Selic atual de ${String(LATEST.selic.value).replace('.', ',')}% ao ano, vale a primeira regra. O rendimento mais recente divulgado pelo Banco Central é de <strong>${String(rate).replace('.', ',')}% ao mês</strong>. O dinheiro rende apenas na data de aniversário: um depósito feito no dia 10 rende no dia 10 do mês seguinte, e quem saca antes perde o rendimento do mês.</p>
<div class="example"><p>${h.brl(5000)} iniciais + ${h.brl(300)} por mês durante 24 meses: saldo de <strong>${ex.hero.value}</strong>, com ${ex.cards[1].value} de rendimento.</p></div>`,
      },
      {
        id: 'comparar',
        title: 'Poupança x outras aplicações',
        html: `<p>A poupança é isenta de IR e tem liquidez, mas costuma render menos que um CDB de liquidez diária a 100% do CDI ou que o Tesouro Selic, mesmo depois do imposto. Compare na ${h.link('investimentos', 'calculadora de investimentos')} e verifique se o rendimento está acima da inflação na ${h.link('inflacao', 'calculadora de inflação')}.</p>`,
      },
    ],
    faq: [
      { q: 'A poupança tem Imposto de Renda?', a: '<p>Não, para pessoas físicas o rendimento da poupança é isento.</p>' },
      { q: 'A poupança tem garantia?', a: '<p>Sim, pelo FGC, até R$ 250 mil por CPF por instituição.</p>' },
    ],
    limitations: ['Usa uma taxa mensal constante; na prática, a TR e a regra da Selic podem mudar ao longo do tempo.'],
  };
}
