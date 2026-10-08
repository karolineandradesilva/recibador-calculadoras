import { simpleInterest } from '../calc/finance.js';
import { brl, row, frac } from './_shared.js';
import { pct } from '../lib/format.js';

export const meta = {
  slug: 'juros-simples',
  category: 'financas',
  icon: 'percent',
  short: 'Juros simples',
  h1: 'Calculadora de juros simples',
  title: 'Calculadora de Juros Simples: fórmula J = C × i × t',
  description: 'Calcule juros simples e montante a partir do capital, da taxa e do prazo, e compare com o resultado em juros compostos no mesmo período.',
  lead: 'Calcule os juros e o montante em juros simples e veja a diferença para os juros compostos.',
  card: 'J = C × i × t e comparação com compostos.',
  keywords: ['juros simples', 'formula juros simples', 'montante', 'capital', 'taxa'],
  related: ['juros-compostos', 'juros-de-atraso', 'valor-presente-futuro', 'porcentagem'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'capital', label: 'Capital', type: 'money', default: 10000, min: 0.01 },
    { name: 'rate', label: 'Taxa de juros', type: 'percent', default: 2, min: 0, max: 1000, width: 'half' },
    { name: 'unit', label: 'Período', type: 'select', default: 'month', options: [{ value: 'day', label: 'ao dia' }, { value: 'month', label: 'ao mês' }, { value: 'year', label: 'ao ano' }], width: 'half', help: 'A taxa e o prazo usam a mesma unidade.' },
    { name: 'periods', label: 'Prazo (na mesma unidade da taxa)', type: 'number', default: 12, min: 0.01, max: 100000 },
  ],
  compute(v) {
    const i = frac(v.rate);
    const s = simpleInterest({ principal: v.capital, rate: i, periods: v.periods });
    const compound = v.capital * (1 + i) ** v.periods;
    const unit = { day: 'dias', month: 'meses', year: 'anos' }[v.unit];
    return {
      hero: { label: 'Juros', value: brl(s.interest), sub: `${pct(i)} × ${String(v.periods).replace('.', ',')} ${unit} sobre ${brl(v.capital)}` },
      cards: [
        { label: 'Montante (simples)', value: brl(s.total), tone: 'plus' },
        { label: 'Montante se fosse composto', value: brl(compound) },
      ],
      sections: [{ rows: [row('Capital', v.capital), row('Juros simples', s.interest, 'plus'), row('Montante', s.total, 'total'), row('Diferença para juros compostos', compound - s.total, 'muted')] }],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'formula',
        title: 'Fórmula dos juros simples',
        html: `<div class="formula">J = C × i × t
M = C + J = C × (1 + i × t)</div>
<p>C é o capital, i é a taxa (em decimal: 2% = 0,02) e t é o prazo, na mesma unidade da taxa. Nos juros simples, os juros de cada período são sempre calculados sobre o capital inicial.</p>
<div class="example"><p>${h.brl(10000)} a 2% ao mês por 12 meses: J = 10.000 × 0,02 × 12 = <strong>${ex.hero.value}</strong>. Em juros compostos, o montante seria ${ex.cards[1].value}.</p></div>`,
      },
      {
        id: 'onde-se-usa',
        title: 'Onde os juros simples aparecem',
        html: `<p>No dia a dia brasileiro, juros simples aparecem principalmente nos <strong>juros de mora</strong> de contas atrasadas (geralmente 1% ao mês, proporcional aos dias) e em alguns cálculos judiciais. Financiamentos, empréstimos, cartão de crédito e investimentos usam juros compostos. Para contas em atraso, use a ${h.link('juros-de-atraso', 'calculadora de juros de atraso')}.</p>`,
      },
    ],
    faq: [
      { q: 'Como converter a taxa para outro período nos juros simples?', a: '<p>Nos juros simples, basta multiplicar ou dividir: 2% ao mês equivalem a 24% ao ano. Nos compostos, a conversão é exponencial.</p>' },
    ],
    limitations: ['Usa a convenção de taxa e prazo na mesma unidade; para dias, considere o número de dias corridos.'],
  };
}
