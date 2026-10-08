import { breakEven } from '../calc/company.js';
import { brl, row, pct, num } from './_shared.js';

export const meta = {
  slug: 'ponto-de-equilibrio',
  category: 'negocios',
  icon: 'scale',
  short: 'Ponto de equilíbrio',
  h1: 'Calculadora de ponto de equilíbrio',
  title: 'Ponto de Equilíbrio: quanto vender para não ter prejuízo',
  description: 'Calcule o ponto de equilíbrio do negócio: quantas unidades e quanto de faturamento são necessários para cobrir os custos fixos, com a margem de contribuição.',
  lead: 'Descubra quanto você precisa vender por mês para pagar todas as contas — a partir daí, é lucro.',
  card: 'Unidades e faturamento para cobrir os custos.',
  keywords: ['ponto de equilibrio', 'break even', 'quanto preciso vender', 'margem de contribuicao', 'custo fixo'],
  related: ['lucro-do-negocio', 'preco-de-venda', 'margem-de-lucro', 'custo-de-funcionario'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'fixed', label: 'Custos fixos mensais', type: 'money', default: 15000, min: 0.01 },
    { name: 'price', label: 'Preço de venda unitário', type: 'money', default: 80, min: 0.01, width: 'half' },
    { name: 'variable', label: 'Custo variável unitário', type: 'money', default: 45, min: 0, width: 'half', help: 'Mercadoria, impostos e taxas por unidade.' },
  ],
  validate(v) {
    if (v.variable >= v.price) return { variable: 'O custo variável precisa ser menor que o preço de venda; do contrário, cada venda dá prejuízo.' };
    return null;
  },
  compute(v) {
    const r = breakEven({ fixedCosts: v.fixed, price: v.price, variableCost: v.variable });
    if (!r.valid) return { error: 'O preço precisa ser maior que o custo variável: hoje cada venda dá prejuízo.' };
    return {
      hero: { label: 'Ponto de equilíbrio', value: `${num(r.unitsRounded, 0)} unidades/mês`, tone: 'neutral', sub: `Faturamento mínimo de ${brl(r.revenue)}` },
      cards: [
        { label: 'Margem de contribuição', value: brl(r.contribution), sub: `${pct(r.contributionMargin, 1)} do preço` },
        { label: 'Por dia (30 dias)', value: `${num(Math.ceil(r.unitsRounded / 30), 0)} unidades` },
      ],
      sections: [{ rows: [row('Custos fixos', v.fixed), row('Contribuição por unidade', r.contribution), row('Unidades necessárias', num(r.units, 1)), row('Faturamento de equilíbrio', r.revenue, 'total')] }],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'formula',
        title: 'Fórmula do ponto de equilíbrio',
        html: `<div class="formula">Margem de contribuição = preço − custo variável
Ponto de equilíbrio (unidades) = custos fixos ÷ margem de contribuição
Ponto de equilíbrio (R$) = unidades × preço</div>
<div class="example"><p>Custos fixos de ${h.brl(15000)}, preço de ${h.brl(80)} e custo variável de ${h.brl(45)}: cada venda contribui com ${ex.cards[0].value}. Ponto de equilíbrio: <strong>${ex.hero.value}</strong> (${ex.hero.sub.toLowerCase()}).</p></div>`,
      },
      {
        id: 'como-usar',
        title: 'Como usar o resultado',
        html: `<ul><li>Abaixo do ponto de equilíbrio, o negócio tem prejuízo; acima, cada unidade adicional gera lucro igual à margem de contribuição.</li><li>Para reduzir o ponto de equilíbrio: aumente o preço, reduza custos variáveis ou corte custos fixos.</li><li>Inclua impostos e taxas por venda no custo variável. Use a ${h.link('preco-de-venda', 'calculadora de preço de venda')} para revisar a precificação.</li></ul>`,
      },
    ],
    faq: [{ q: 'E quando vendo vários produtos?', a: '<p>Use a margem de contribuição média ponderada pelo mix de vendas, ou calcule em faturamento: custos fixos ÷ percentual médio de margem de contribuição.</p>' }],
    limitations: ['Considera preço e custos constantes e um único produto (ou um produto médio).'],
  };
}
