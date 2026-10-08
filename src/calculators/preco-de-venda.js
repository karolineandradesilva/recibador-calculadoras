import { sellingPrice } from '../calc/company.js';
import { brl, row, pct, frac, val, num } from './_shared.js';

export const meta = {
  slug: 'preco-de-venda',
  category: 'negocios',
  icon: 'tag',
  short: 'Preço de venda',
  h1: 'Calculadora de preço de venda',
  title: 'Calculadora de Preço de Venda com Impostos, Taxas e Lucro',
  description: 'Forme o preço de venda a partir do custo, impostos, despesas, taxa de cartão, comissão e margem de lucro desejada, pelo método do markup divisor.',
  lead: 'Calcule o preço certo para cobrir custos, impostos e taxas e ainda garantir a margem de lucro que você quer.',
  card: 'Preço com impostos, taxas e margem garantida.',
  keywords: ['preco de venda', 'formacao de preco', 'precificacao', 'markup divisor', 'quanto cobrar', 'precificar produto'],
  related: ['markup', 'margem-de-lucro', 'ponto-de-equilibrio', 'simples-nacional', 'lucro-do-negocio'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'cost', label: 'Custo unitário', type: 'money', default: 60, min: 0.01, help: 'Custo de aquisição ou produção (mercadoria, matéria-prima, embalagem, frete de compra).' },
    { name: 'tax', label: 'Impostos sobre a venda', type: 'percent', default: 6, min: 0, max: 90, width: 'half', help: 'Ex.: alíquota efetiva do Simples.' },
    { name: 'expenses', label: 'Despesas fixas', type: 'percent', default: 15, min: 0, max: 90, width: 'half', help: 'Aluguel, salários etc. como % do faturamento.' },
    { name: 'card', label: 'Taxa de cartão/marketplace', type: 'percent', default: 4, min: 0, max: 90, width: 'half', required: false },
    { name: 'commission', label: 'Comissão de vendas', type: 'percent', default: 0, min: 0, max: 90, width: 'half', required: false },
    { name: 'margin', label: 'Margem de lucro desejada', type: 'percent', default: 15, min: 0, max: 95 },
  ],
  validate(v) {
    const total = v.tax + v.expenses + val(v.card) + val(v.commission) + v.margin;
    if (total >= 100) return { margin: `A soma dos percentuais (${String(Math.round(total * 100) / 100).replace('.', ',')}%) precisa ser menor que 100%.` };
    return null;
  },
  compute(v) {
    const r = sellingPrice({ cost: v.cost, taxRate: frac(v.tax), expenseRate: frac(v.expenses), marginRate: frac(v.margin), cardFee: frac(val(v.card)), commission: frac(val(v.commission)) });
    if (!r.valid) return { error: `A soma dos percentuais (${pct(r.totalRate, 1)}) precisa ser menor que 100%. Reduza a margem ou as despesas.` };
    return {
      hero: { label: 'Preço de venda', value: brl(r.price), sub: `Markup de ${num(r.markup, 2)}× sobre o custo` },
      cards: [
        { label: 'Lucro por unidade', value: brl(r.profit), tone: 'plus' },
        { label: 'Margem sobre o preço', value: pct(frac(v.margin), 1) },
      ],
      bars: [
        { label: 'Custo', value: v.cost, tone: 3 },
        { label: 'Impostos', value: r.taxes, tone: 'tax' },
        { label: 'Despesas e taxas', value: r.expenses + r.fees, tone: 'other' },
        { label: 'Lucro', value: r.profit, tone: 'net' },
      ],
      sections: [
        {
          title: 'Para onde vai cada venda',
          rows: [
            row('Preço de venda', r.price, 'strong'),
            row('Custo', v.cost, 'minus'),
            row('Impostos', r.taxes, 'minus'),
            row('Despesas fixas', r.expenses, 'minus'),
            r.fees ? row('Taxas e comissão', r.fees, 'minus') : null,
            row('Lucro líquido', r.profit, 'total'),
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
        id: 'metodo',
        title: 'O método do markup divisor',
        html: `<p>O erro mais comum na precificação é somar percentuais ao custo ("custo + 30%"). Como impostos, taxas e a margem incidem sobre o <strong>preço de venda</strong>, e não sobre o custo, o certo é dividir:</p>
<div class="formula">Preço = custo ÷ [1 − (impostos + despesas + taxas + comissão + margem)]</div>
<div class="example"><p>Custo de ${h.brl(60)}, impostos de 6%, despesas de 15%, taxa de cartão de 4% e margem de 15%: preço = 60 ÷ (1 − 0,40) = <strong>${ex.hero.value}</strong>. O lucro por unidade é de ${ex.cards[0].value}.</p></div>
<p>Se você somasse 40% ao custo, cobraria ${h.brl(84)} — e o lucro seria quase zero.</p>`,
      },
      {
        id: 'como-estimar',
        title: 'Como estimar cada percentual',
        html: `<ul><li><strong>Impostos:</strong> no Simples Nacional, use a alíquota efetiva da ${h.link('simples-nacional', 'calculadora do Simples')}. MEI paga valor fixo, então use 0% aqui e inclua o DAS nas despesas.</li>
<li><strong>Despesas fixas:</strong> some as despesas do mês (aluguel, salários, contador, sistemas) e divida pelo faturamento médio.</li>
<li><strong>Taxas:</strong> maquininha, marketplace, frete grátis subsidiado e plataformas de pagamento.</li>
<li><strong>Margem:</strong> o lucro líquido que sobra para o negócio. Compare margem e markup na ${h.link('markup', 'calculadora de markup')}.</li></ul>`,
      },
    ],
    faq: [
      { q: 'Qual a diferença entre markup e margem?', a: '<p>Markup é quanto você multiplica o custo para chegar ao preço. Margem é quanto do preço sobra como lucro. Um markup de 2× (100% sobre o custo) corresponde a uma margem bruta de 50%.</p>' },
      { q: 'E se o preço ficar acima do mercado?', a: '<p>Revise custos e despesas, negocie com fornecedores ou aceite uma margem menor em alguns produtos. Saber o preço mínimo viável evita vender com prejuízo sem perceber.</p>' },
    ],
    limitations: ['Considera percentuais constantes sobre o preço; despesas fixas variam com o volume de vendas.'],
  };
}
