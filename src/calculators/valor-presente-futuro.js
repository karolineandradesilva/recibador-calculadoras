import { futureValue, presentValue } from '../calc/finance.js';
import { brl, row } from './_shared.js';
import { rateFields, monthlyRateFrom, rateLabel, termFields, monthsFrom, validateTerm, TOO_LARGE } from './_rates.js';

export const meta = {
  slug: 'valor-presente-futuro',
  category: 'financas',
  icon: 'chart',
  short: 'Valor presente e futuro',
  h1: 'Calculadora de valor presente e valor futuro',
  title: 'Calculadora de Valor Presente e Valor Futuro (VP e VF)',
  description: 'Calcule o valor futuro de uma quantia aplicada a juros compostos ou traga um valor futuro para o presente (valor presente), com taxa mensal ou anual.',
  lead: 'Quanto um valor de hoje vale no futuro — ou quanto um valor futuro vale hoje — a uma taxa de juros.',
  card: 'VF = VP × (1 + i)ⁿ e o caminho inverso.',
  keywords: ['valor presente', 'valor futuro', 'vp', 'vf', 'desconto composto', 'matematica financeira'],
  related: ['juros-compostos', 'inflacao', 'a-vista-ou-parcelado', 'meta-de-investimento'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    {
      name: 'mode',
      label: 'O que você quer calcular?',
      type: 'radio',
      default: 'future',
      options: [
        { value: 'future', label: 'Valor futuro' },
        { value: 'present', label: 'Valor presente' },
      ],
    },
    { name: 'amount', label: 'Valor conhecido', type: 'money', default: 10000, min: 0.01, help: 'Valor de hoje (para calcular o futuro) ou valor futuro (para calcular o presente).' },
    ...rateFields({ def: 10, period: 'year' }),
    ...termFields({ def: 5, unit: 'year' }),
  ],
  validate: validateTerm,
  compute(v) {
    const n = monthsFrom(v);
    const i = monthlyRateFrom(v);
    const out = v.mode === 'future' ? futureValue(v.amount, i, n) : presentValue(v.amount, i, n);
    if (!Number.isFinite(out) || out > 1e15 || (out > 0 && out < 0.005)) return TOO_LARGE;
    return {
      hero: { label: v.mode === 'future' ? 'Valor futuro' : 'Valor presente', value: brl(out), sub: `${n} meses a ${rateLabel(i)}` },
      sections: [
        {
          rows: [
            row(v.mode === 'future' ? 'Valor presente' : 'Valor futuro', v.amount),
            row(v.mode === 'future' ? 'Juros acumulados' : 'Desconto pelos juros', Math.abs(out - v.amount), v.mode === 'future' ? 'plus' : 'minus'),
            row(v.mode === 'future' ? 'Valor futuro' : 'Valor presente', out, 'total'),
          ],
        },
      ],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'formulas',
        title: 'Fórmulas',
        html: `<div class="formula">VF = VP × (1 + i)ⁿ
VP = VF ÷ (1 + i)ⁿ</div>
<p>A taxa i e o prazo n devem estar na mesma unidade. A calculadora trabalha em meses e converte taxas anuais pela equivalência composta.</p>
<div class="example"><p>${h.brl(10000)} hoje, a 10% ao ano, valem <strong>${ex.hero.value}</strong> daqui a 5 anos.</p></div>`,
      },
      {
        id: 'usos',
        title: 'Para que serve',
        html: `<ul><li><strong>Comparar valores em datas diferentes:</strong> receber R$ 10 mil hoje ou R$ 12 mil daqui a 2 anos?</li>
<li><strong>Descontar dívidas:</strong> quanto vale hoje um título que paga um valor fixo no futuro.</li>
<li><strong>Inflação:</strong> usando a inflação como taxa, o valor presente mostra o poder de compra de um valor futuro. Para índices oficiais, use a ${h.link('inflacao', 'calculadora de inflação')}.</li></ul>`,
      },
    ],
    faq: [{ q: 'Qual taxa usar para trazer um valor a valor presente?', a: '<p>A taxa de oportunidade: o rendimento que você obteria em um investimento de risco parecido. Para comparações de poder de compra, use a inflação esperada.</p>' }],
    limitations: ['Considera capitalização mensal e taxa constante.'],
  };
}
