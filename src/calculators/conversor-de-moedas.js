import { brl, row, frac, val } from './_shared.js';
import { LATEST } from './_rates.js';
import { dateLabel, num } from '../lib/format.js';

export const meta = {
  slug: 'conversor-de-moedas',
  category: 'indices',
  icon: 'dollar',
  short: 'Dólar e euro (com IOF)',
  h1: 'Conversor de dólar e euro com IOF e spread',
  title: 'Conversor Dólar e Euro Hoje (PTAX) com IOF do Cartão',
  description: 'Converta dólar e euro para real pela cotação PTAX do Banco Central e estime o custo real de compras internacionais no cartão, com IOF e spread do banco.',
  lead: 'Converta pela cotação oficial do Banco Central e veja quanto uma compra no exterior custa de verdade no cartão.',
  card: 'Cotação PTAX e custo real no cartão com IOF.',
  keywords: ['dolar hoje', 'euro hoje', 'conversor', 'ptax', 'iof cartao', 'compra internacional', 'cotacao'],
  related: ['porcentagem', 'a-vista-ou-parcelado', 'inflacao'],
  sources: ['bcb'],
  extraSources: [{ label: 'Banco Central — cotações e boletins (PTAX)', url: 'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes' }],
  legal: false,
  dynamicData: true,
};

const RATES = { usd: LATEST.usd, eur: LATEST.eur };

export const ui = {
  fields: [
    { name: 'currency', label: 'Moeda', type: 'radio', default: 'usd', options: [{ value: 'usd', label: 'Dólar (US$)' }, { value: 'eur', label: 'Euro (€)' }] },
    { name: 'amount', label: 'Valor na moeda estrangeira', type: 'number', default: 100, min: 0.01, decimals: 2 },
    { name: 'rate', label: 'Cotação (R$)', type: 'number', min: 0.01, required: false, width: 'half', decimals: 4, help: 'Deixe vazio para usar a PTAX do Banco Central.' },
    { name: 'iof', label: 'IOF', type: 'percent', default: 3.5, min: 0, max: 10, width: 'half', help: 'Cartão de crédito, débito e pré-pago no exterior.' },
    { name: 'spread', label: 'Spread do banco', type: 'percent', default: 4, min: 0, max: 20, advanced: true, help: 'Margem que o emissor do cartão cobra sobre a cotação (em geral de 2% a 6%).' },
  ],
  compute(v) {
    const ref = RATES[v.currency];
    const quote = Number.isFinite(v.rate) && v.rate > 0 ? v.rate : ref.value;
    const symbol = v.currency === 'usd' ? 'US$' : '€';
    const commercial = v.amount * quote;
    const withSpread = commercial * (1 + frac(val(v.spread)));
    const iof = withSpread * frac(v.iof);
    const total = withSpread + iof;
    return {
      hero: { label: 'Valor em reais (cotação)', value: brl(commercial), sub: `${symbol} ${num(v.amount)} × ${num(quote, 4)}` },
      cards: [
        { label: 'Custo estimado no cartão', value: brl(total), tone: 'minus', sub: 'Com spread e IOF' },
        { label: 'Cotação efetiva', value: `R$ ${num(total / v.amount, 4)}` },
      ],
      sections: [
        {
          rows: [
            row('Pela cotação', commercial),
            row(`Spread (${num(val(v.spread), 1)}%)`, withSpread - commercial, 'minus'),
            row(`IOF (${num(v.iof, 2)}%)`, iof, 'minus'),
            row('Total estimado na fatura', total, 'total'),
          ],
        },
      ],
      notes: [`PTAX de venda do Banco Central de ${dateLabel(ref.date)}: R$ ${num(ref.value, 4)}. Na fatura, vale a cotação do emissor do cartão no dia de cada compra.`],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'ptax',
        title: 'O que é a PTAX',
        html: `<p>A PTAX é a taxa de câmbio de referência calculada pelo Banco Central a partir das operações do mercado interbancário. Ela é usada em contratos, na declaração do Imposto de Renda e como base por muitos bancos. A cotação deste conversor é atualizada automaticamente todos os dias úteis.</p>
<div class="example"><p>US$ 100 pela PTAX: <strong>${ex.hero.value}</strong>. No cartão de crédito, com spread de 4% e IOF de 3,5%, a compra sai por cerca de ${ex.cards[0].value}.</p></div>`,
      },
      {
        id: 'custo-real',
        title: 'Quanto custa de verdade comprar no exterior',
        html: `<div class="formula">Custo = valor × cotação × (1 + spread) × (1 + IOF)</div>
<ul><li><strong>IOF:</strong> desde 2025, a alíquota sobre compras internacionais com cartão (crédito, débito e pré-pago) e compra de moeda é de 3,5% (Decreto nº 12.499/2025). Confira a regra vigente na data da compra.</li>
<li><strong>Spread:</strong> diferença entre a cotação do banco e a de referência. Contas globais e cartões de bancos digitais costumam ter spreads menores.</li>
<li><strong>Data da cotação:</strong> pelas regras do Banco Central, a conversão no cartão de crédito usa a cotação do dia de cada compra, e o emissor deve divulgar diariamente a taxa que pratica.</li></ul>`,
      },
    ],
    faq: [
      { q: 'A PTAX é a cotação que vou pagar?', a: '<p>Não exatamente. Bancos e casas de câmbio aplicam a sua própria cotação, que inclui uma margem (spread). Use o campo "Spread" para estimar o custo real.</p>' },
      { q: 'Compras em sites internacionais pagam imposto de importação?', a: '<p>Sim, conforme as regras da Receita Federal para remessas internacionais, além do ICMS estadual. Este conversor não calcula esses tributos.</p>' },
    ],
    limitations: ['A cotação é a PTAX de venda do último dia útil disponível; o mercado varia ao longo do dia.', 'Não inclui imposto de importação nem ICMS de compras internacionais.'],
  };
}
