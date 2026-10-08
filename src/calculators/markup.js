import { brl, row, pct, frac, num } from './_shared.js';

export const meta = {
  slug: 'markup',
  category: 'negocios',
  icon: 'percent',
  short: 'Markup x margem',
  h1: 'Calculadora de markup e conversão markup x margem',
  title: 'Calculadora de Markup: converta markup em margem e vice-versa',
  description: 'Converta markup em margem de lucro e margem em markup, calcule o multiplicador e o preço a partir do custo. Entenda de vez a diferença entre os dois.',
  lead: 'Descubra o markup para a margem que você quer — ou a margem real de um markup — e o preço a partir do custo.',
  card: 'Converta markup em margem e ache o preço.',
  keywords: ['markup', 'markup x margem', 'converter markup', 'multiplicador', 'markup multiplicador'],
  related: ['preco-de-venda', 'margem-de-lucro', 'lucro-do-negocio', 'porcentagem'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    {
      name: 'mode',
      label: 'Você sabe',
      type: 'radio',
      default: 'margin',
      options: [
        { value: 'margin', label: 'A margem desejada' },
        { value: 'markup', label: 'O markup' },
      ],
    },
    { name: 'margin', label: 'Margem sobre o preço', type: 'percent', default: 40, min: 0, max: 99.99, showIf: (v) => v.mode === 'margin' },
    { name: 'markup', label: 'Markup sobre o custo', type: 'percent', default: 100, min: 0, max: 100000, showIf: (v) => v.mode === 'markup' },
    { name: 'cost', label: 'Custo (opcional)', type: 'money', min: 0, required: false, help: 'Para calcular o preço de venda.' },
  ],
  compute(v) {
    let margin;
    let markup;
    if (v.mode === 'margin') {
      margin = frac(v.margin);
      markup = margin / (1 - margin);
    } else {
      markup = frac(v.markup);
      margin = markup / (1 + markup);
    }
    const multiplier = 1 + markup;
    const hasCost = Number.isFinite(v.cost) && v.cost > 0;
    return {
      hero: v.mode === 'margin'
        ? { label: 'Markup necessário', value: pct(markup, 1), sub: `Multiplicador de ${num(multiplier, 4)}×` }
        : { label: 'Margem correspondente', value: pct(margin, 1), sub: `Multiplicador de ${num(multiplier, 4)}×` },
      cards: hasCost ? [{ label: 'Preço de venda', value: brl(v.cost * multiplier) }, { label: 'Lucro por unidade', value: brl(v.cost * markup), tone: 'plus' }] : [],
      sections: [{ rows: [row('Margem sobre o preço', pct(margin, 2)), row('Markup sobre o custo', pct(markup, 2)), row('Multiplicador', `${num(multiplier, 4)}×`, 'total')] }],
    };
  },
};

export function content(ex, h) {
  const rows = [10, 20, 25, 30, 40, 50, 60].map((m) => {
    const mk = m / (100 - m);
    return [`${m}%`, h.pct(mk, 1), `${h.num(1 + mk, 2)}×`];
  });
  return {
    sections: [
      {
        id: 'diferenca',
        title: 'Markup e margem não são a mesma coisa',
        html: `<p>O <strong>markup</strong> é calculado sobre o custo; a <strong>margem</strong>, sobre o preço de venda. Por isso, os percentuais nunca coincidem: para ter 40% de margem, o markup precisa ser de ${ex.hero.value}.</p>
<div class="formula">Markup = margem ÷ (1 − margem)
Margem = markup ÷ (1 + markup)
Preço = custo × (1 + markup)</div>
${h.table(['Margem desejada', 'Markup necessário', 'Multiplicador'], rows)}`,
      },
      {
        id: 'preco-completo',
        title: 'Markup com impostos e despesas',
        html: `<p>Esta conversão considera só custo e lucro bruto. Para incluir impostos, taxas e despesas fixas no preço, use o markup divisor da ${h.link('preco-de-venda', 'calculadora de preço de venda')}.</p>`,
      },
    ],
    faq: [{ q: 'Markup de 100% significa margem de 100%?', a: '<p>Não. Markup de 100% significa vender pelo dobro do custo, o que dá uma margem bruta de 50%. Margem de 100% é impossível, pois exigiria custo zero.</p>' }],
    limitations: ['Margens e markups brutos, sem impostos e despesas.'],
  };
}
