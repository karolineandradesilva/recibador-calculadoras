import { brl, row, pct, frac, val } from './_shared.js';

export const meta = {
  slug: 'lucro-do-negocio',
  category: 'negocios',
  icon: 'coins',
  short: 'Lucro do negócio',
  h1: 'Calculadora de lucro líquido do negócio',
  title: 'Calculadora de Lucro Líquido: faturamento, custos e margem',
  description: 'Calcule o lucro líquido mensal do negócio a partir do faturamento, custo das vendas, impostos, taxas e despesas fixas, com margem líquida e resultado anual.',
  lead: 'Monte o resultado do mês — faturamento, custos, impostos e despesas — e descubra quanto o negócio realmente lucra.',
  card: 'Resultado do mês, margem líquida e projeção anual.',
  keywords: ['lucro liquido', 'lucro da empresa', 'dre simples', 'resultado do mes', 'margem liquida', 'calcular lucro'],
  related: ['margem-de-lucro', 'preco-de-venda', 'ponto-de-equilibrio', 'simples-nacional'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'revenue', label: 'Faturamento do mês', type: 'money', default: 50000, min: 0.01 },
    { name: 'cogs', label: 'Custo das mercadorias ou serviços vendidos', type: 'money', default: 22000, min: 0, required: false },
    { name: 'tax', label: 'Impostos sobre a venda', type: 'percent', default: 8, min: 0, max: 90, width: 'half', required: false },
    { name: 'fees', label: 'Taxas de cartão', type: 'percent', default: 3, min: 0, max: 90, width: 'half', required: false },
    { name: 'fixed', label: 'Despesas fixas do mês', type: 'money', default: 12000, min: 0, required: false, help: 'Aluguel, salários, pró-labore, contador, sistemas, marketing.' },
  ],
  compute(v) {
    const taxes = v.revenue * frac(val(v.tax));
    const fees = v.revenue * frac(val(v.fees));
    const gross = v.revenue - val(v.cogs);
    const contribution = gross - taxes - fees;
    const profit = contribution - val(v.fixed);
    const margin = profit / v.revenue;
    return {
      hero: { label: profit >= 0 ? 'Lucro líquido do mês' : 'Prejuízo do mês', value: brl(profit), tone: profit < 0 ? 'warn' : undefined, sub: `Margem líquida de ${pct(margin, 1)}` },
      cards: [
        { label: 'Margem de contribuição', value: pct(contribution / v.revenue, 1) },
        { label: 'Resultado em 12 meses', value: brl(profit * 12), tone: profit >= 0 ? 'plus' : 'minus' },
      ],
      sections: [
        {
          title: 'Demonstrativo simplificado',
          rows: [
            row('Faturamento', v.revenue, 'strong'),
            row('Custo das vendas', val(v.cogs), 'minus'),
            row('Lucro bruto', gross),
            row('Impostos', taxes, 'minus'),
            row('Taxas', fees, 'minus'),
            row('Margem de contribuição', contribution),
            row('Despesas fixas', val(v.fixed), 'minus'),
            row('Lucro líquido', profit, 'total'),
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
        id: 'estrutura',
        title: 'Como calcular o lucro líquido',
        html: `<div class="formula">Lucro bruto = faturamento − custo das vendas
Margem de contribuição = lucro bruto − impostos − taxas
Lucro líquido = margem de contribuição − despesas fixas
Margem líquida = lucro líquido ÷ faturamento</div>
<div class="example"><p>Faturamento de ${h.brl(50000)}, custo de ${h.brl(22000)}, impostos de 8%, taxas de 3% e despesas fixas de ${h.brl(12000)}: lucro de <strong>${ex.hero.value}</strong> (${ex.hero.sub.toLowerCase()}).</p></div>`,
      },
      {
        id: 'cuidados',
        title: 'Cuidados comuns',
        html: `<ul><li><strong>Inclua o pró-labore</strong> nas despesas fixas: o trabalho do dono também custa. Calcule-o na ${h.link('pro-labore', 'calculadora de pró-labore')}.</li><li><strong>Separe as contas</strong> da empresa e as pessoais.</li><li><strong>Faturamento não é lucro:</strong> uma margem líquida de 5% significa R$ 5 de lucro a cada R$ 100 vendidos.</li><li>Descubra quanto precisa vender para não ter prejuízo na ${h.link('ponto-de-equilibrio', 'calculadora de ponto de equilíbrio')}.</li></ul>`,
      },
    ],
    faq: [{ q: 'Lucro é o mesmo que dinheiro em caixa?', a: '<p>Não. O lucro é contábil; o caixa depende de prazos de recebimento, pagamento a fornecedores, estoque e investimentos. Um negócio lucrativo pode ficar sem caixa.</p>' }],
    limitations: ['Demonstrativo gerencial simplificado (regime de competência aproximado); não substitui a contabilidade.'],
  };
}
