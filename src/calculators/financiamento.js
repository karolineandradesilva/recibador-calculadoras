import { amortization } from '../calc/finance.js';
import { brl, row, val } from './_shared.js';
import { rateFields, monthlyRateFrom, rateLabel, termFields, monthsFrom, validateTerm, TOO_LARGE } from './_rates.js';

export const meta = {
  slug: 'financiamento',
  category: 'financas',
  icon: 'home',
  short: 'Financiamento (Price e SAC)',
  h1: 'Calculadora de financiamento: tabela Price e SAC',
  title: 'Simulador de Financiamento: Tabela Price x SAC com parcelas',
  description: 'Simule financiamento de imóvel ou veículo pela tabela Price ou SAC: valor da primeira e da última parcela, total de juros e tabela de amortização completa.',
  lead: 'Compare os sistemas Price e SAC e veja parcelas, juros totais e a tabela de amortização mês a mês.',
  card: 'Parcelas, juros e amortização em Price ou SAC.',
  keywords: ['financiamento', 'tabela price', 'sac', 'simulador financiamento', 'amortizacao', 'financiamento imovel', 'financiamento carro'],
  related: ['parcelamento', 'a-vista-ou-parcelado', 'juros-compostos', 'valor-presente-futuro'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'price', label: 'Valor do bem', type: 'money', default: 400000, min: 1, width: 'half' },
    { name: 'down', label: 'Entrada', type: 'money', default: 80000, min: 0, required: false, width: 'half' },
    ...rateFields({ def: 11.5, period: 'year' }),
    ...termFields({ def: 360, unit: 'month' }),
    {
      name: 'system',
      label: 'Sistema de amortização',
      type: 'radio',
      default: 'sac',
      options: [
        { value: 'sac', label: 'SAC (parcelas decrescentes)' },
        { value: 'price', label: 'Price (parcelas fixas)' },
      ],
    },
    { name: 'fees', label: 'Seguros e taxas mensais', type: 'money', default: 0, min: 0, required: false, advanced: true, help: 'Seguro MIP/DFI, taxa de administração etc. (valor fixo aproximado).' },
  ],
  validate(v) {
    if (val(v.down) >= v.price) return { down: 'A entrada deve ser menor que o valor do bem.' };
    if (monthsFrom(v) > 600) return { term: 'Use um prazo de até 600 meses.' };
    return null;
  },
  compute(v) {
    const principal = v.price - val(v.down);
    const months = monthsFrom(v);
    const i = monthlyRateFrom(v);
    const r = amortization({ principal, monthlyRate: i, months, system: v.system, monthlyFees: val(v.fees) });
    if (!Number.isFinite(r.totalPaid) || r.totalPaid > 1e15) return TOO_LARGE;
    const other = amortization({ principal, monthlyRate: i, months, system: v.system === 'sac' ? 'price' : 'sac', monthlyFees: val(v.fees) });
    const otherName = v.system === 'sac' ? 'Price' : 'SAC';
    return {
      hero: { label: v.system === 'sac' ? 'Primeira parcela' : 'Parcela fixa', value: brl(r.first), sub: v.system === 'sac' ? `Diminui até ${brl(r.last)} na última` : `${months} parcelas` },
      cards: [
        { label: 'Valor financiado', value: brl(principal) },
        { label: 'Total de juros', value: brl(r.totalInterest), tone: 'minus' },
        { label: 'Total pago', value: brl(r.totalPaid + val(v.down)), sub: 'Com a entrada' },
      ],
      sections: [
        {
          title: `Comparação com ${otherName}`,
          rows: [
            row(`Primeira parcela no ${otherName}`, other.first),
            row(`Juros totais no ${otherName}`, other.totalInterest),
            row('Diferença de juros', other.totalInterest - r.totalInterest, other.totalInterest > r.totalInterest ? 'plus' : 'minus', other.totalInterest > r.totalInterest ? `Você economiza com ${v.system.toUpperCase()}` : `${otherName} sai mais barato no total`),
          ],
        },
        { rows: [row('Taxa usada', rateLabel(i), 'muted')] },
      ],
      table: {
        caption: 'Tabela de amortização',
        columns: ['Mês', 'Parcela', 'Juros', 'Amortização', 'Saldo devedor'],
        rows: r.rows.map((x) => [String(x.period), brl(x.installment), brl(x.interest), brl(x.amortization), brl(x.balance)]),
      },
      notes: ['Simulação sem correção do saldo pela TR ou IPCA. Em financiamentos imobiliários, o saldo devedor costuma ser corrigido mensalmente.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'price-x-sac',
        title: 'Tabela Price x SAC',
        html: `${h.table(['', 'SAC', 'Price'], [
          ['Parcela', 'começa maior e diminui', 'fixa do início ao fim'],
          ['Amortização', 'constante', 'cresce ao longo do tempo'],
          ['Juros totais', 'menores', 'maiores'],
          ['Indicado para', 'quem aguenta parcelas iniciais maiores', 'quem precisa de parcela menor no início'],
        ])}
<div class="formula">SAC:   amortização = valor financiado ÷ n;  parcela = amortização + juros sobre o saldo
Price: parcela = PV × i ÷ [1 − (1 + i)^−n]</div>`,
      },
      {
        id: 'exemplo',
        title: 'Exemplo',
        html: `<div class="example"><p>Imóvel de ${h.brl(400000)} com ${h.brl(80000)} de entrada, 11,5% ao ano, 360 meses, pelo SAC: primeira parcela de <strong>${ex.hero.value}</strong> (${ex.hero.sub.toLowerCase()}) e ${ex.cards[1].value} de juros no total.</p></div>`,
      },
      {
        id: 'cet',
        title: 'Atenção ao Custo Efetivo Total (CET)',
        html: `<p>A taxa de juros nominal não é o custo real. Bancos cobram seguros obrigatórios (morte e invalidez, danos ao imóvel), tarifas de avaliação e, no crédito imobiliário, correção do saldo pela TR ou pelo IPCA. Peça sempre o <strong>CET</strong>, que reúne todos esses custos, e use a ${h.link('parcelamento', 'calculadora de parcelamento')} para descobrir a taxa real de uma proposta a partir das parcelas.</p>`,
      },
    ],
    faq: [
      { q: 'Vale a pena amortizar o financiamento?', a: '<p>Em geral, sim, quando a taxa do financiamento é maior que o rendimento líquido que você obteria investindo o dinheiro. Amortizar reduzindo o prazo economiza mais juros do que reduzindo a parcela.</p>' },
      { q: 'Por que o SAC é comum no crédito imobiliário?', a: '<p>O SAC reduz o saldo devedor mais rápido, o que diminui o risco para quem empresta e os juros totais pagos. Por isso é muito usado em financiamentos de imóveis.</p>' },
    ],
    limitations: ['Não considera correção monetária do saldo, seguros variáveis, IOF nem tarifas.', 'Para simulações oficiais, use o simulador do banco e compare o CET.'],
  };
}
