import { marginFromPrice } from '../calc/company.js';
import { brl, row, pct, num } from './_shared.js';

export const meta = {
  slug: 'margem-de-lucro',
  category: 'negocios',
  icon: 'chart',
  short: 'Margem de lucro',
  h1: 'Calculadora de margem de lucro',
  title: 'Calculadora de Margem de Lucro: margem bruta e markup',
  description: 'Calcule a margem de lucro de um produto ou serviço a partir do preço e do custo: lucro em reais, margem sobre o preço, markup sobre o custo e multiplicador.',
  lead: 'Informe preço e custo para ver o lucro, a margem sobre a venda e o markup sobre o custo.',
  card: 'Lucro, margem sobre a venda e markup.',
  keywords: ['margem de lucro', 'margem bruta', 'calcular margem', 'lucro percentual', 'margem de contribuicao'],
  related: ['markup', 'preco-de-venda', 'lucro-do-negocio', 'ponto-de-equilibrio'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'price', label: 'Preço de venda', type: 'money', default: 150, min: 0.01, width: 'half' },
    { name: 'cost', label: 'Custo', type: 'money', default: 90, min: 0, width: 'half' },
  ],
  compute(v) {
    const r = marginFromPrice({ price: v.price, cost: v.cost });
    const loss = r.profit < 0;
    return {
      hero: { label: 'Margem de lucro', value: pct(r.margin, 1), tone: loss ? 'warn' : undefined, sub: `${loss ? 'Prejuízo' : 'Lucro'} de ${brl(Math.abs(r.profit))} por venda` },
      cards: [
        { label: 'Markup sobre o custo', value: pct(r.markup, 1) },
        { label: 'Multiplicador', value: `${num(r.multiplier, 2)}×` },
      ],
      sections: [{ rows: [row('Preço', v.price), row('Custo', v.cost, 'minus'), row('Lucro bruto', r.profit, 'total')] }],
      notes: ['Margem bruta: não desconta impostos, taxas e despesas fixas. Para o preço completo, use a calculadora de preço de venda.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'formulas',
        title: 'Fórmulas',
        html: `<div class="formula">Lucro = preço − custo
Margem = lucro ÷ preço × 100
Markup = lucro ÷ custo × 100</div>
<div class="example"><p>Produto vendido por ${h.brl(150)} com custo de ${h.brl(90)}: lucro de ${h.brl(60)}, margem de <strong>${ex.hero.value}</strong> e markup de ${ex.cards[0].value}.</p></div>`,
      },
      {
        id: 'bruta-liquida',
        title: 'Margem bruta x margem líquida',
        html: `<p>A margem calculada aqui é a <strong>bruta</strong>: só considera o custo direto do produto. A margem <strong>líquida</strong> desconta também impostos, taxas e despesas fixas — e é ela que mostra se o negócio dá lucro. Calcule-a na ${h.link('lucro-do-negocio', 'calculadora de lucro do negócio')} ou forme o preço completo na ${h.link('preco-de-venda', 'calculadora de preço de venda')}.</p>`,
      },
    ],
    faq: [{ q: 'Uma margem de 30% é boa?', a: '<p>Depende do setor. Supermercados trabalham com margens líquidas baixas e alto giro; serviços e produtos de nicho costumam ter margens maiores. Compare com empresas do mesmo segmento.</p>' }],
    limitations: ['Calcula a margem bruta unitária.'],
  };
}
