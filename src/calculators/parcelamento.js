import { pmt, rateFromInstallments, monthlyToAnnual } from '../calc/finance.js';
import { brl, row, pct, val } from './_shared.js';
import { rateFields, monthlyRateFrom } from './_rates.js';

export const meta = {
  slug: 'parcelamento',
  category: 'financas',
  icon: 'calculator',
  short: 'Parcelamento e juros embutidos',
  h1: 'Calculadora de parcelamento e juros embutidos',
  title: 'Calculadora de Parcelamento: valor da parcela e juros embutidos',
  description: 'Calcule o valor das parcelas de uma compra ou empréstimo com juros, ou descubra a taxa de juros escondida em um parcelamento a partir do valor à vista.',
  lead: 'Descubra o valor da parcela para uma taxa de juros ou a taxa real embutida em uma oferta parcelada.',
  card: 'Valor da parcela ou a taxa escondida na oferta.',
  keywords: ['parcelamento', 'juros embutidos', 'taxa de juros', 'valor da parcela', 'emprestimo', 'cdc', 'descobrir taxa'],
  related: ['a-vista-ou-parcelado', 'financiamento', 'juros-compostos', 'desconto'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    {
      name: 'mode',
      label: 'O que você quer descobrir?',
      type: 'radio',
      default: 'rate',
      options: [
        { value: 'rate', label: 'A taxa de juros embutida' },
        { value: 'installment', label: 'O valor da parcela' },
      ],
    },
    { name: 'cash', label: 'Valor à vista (ou valor emprestado)', type: 'money', default: 2400, min: 0.01 },
    { name: 'n', label: 'Número de parcelas', type: 'integer', default: 12, min: 1, max: 600, width: 'half' },
    { name: 'installment', label: 'Valor de cada parcela', type: 'money', default: 249.9, min: 0.01, width: 'half', showIf: (v) => v.mode === 'rate' },
    ...rateFields({ def: 2.99, period: 'month' }).map((f) => ({ ...f, showIf: (v) => v.mode === 'installment' })),
    { name: 'firstNow', label: 'Primeira parcela paga no ato (1 + n−1)', type: 'checkbox', default: false },
  ],
  compute(v) {
    const due = v.firstNow ? 1 : 0;
    if (v.mode === 'rate') {
      const total = v.installment * v.n;
      if (total < v.cash - 0.005) {
        return { hero: { label: 'Taxa de juros', value: 'Desconto', tone: 'neutral', sub: `A soma das parcelas (${brl(total)}) é menor que o valor à vista` } };
      }
      const i = rateFromInstallments(v.cash, v.installment, v.n, due);
      return {
        hero: { label: 'Juros embutidos', value: `${pct(i)} ao mês`, tone: i > 0.0001 ? 'warn' : 'neutral', sub: `${pct(monthlyToAnnual(i))} ao ano` },
        cards: [
          { label: 'Total parcelado', value: brl(total) },
          { label: 'Juros pagos', value: brl(total - v.cash), tone: 'minus' },
          { label: 'Acréscimo sobre o à vista', value: pct(total / v.cash - 1) },
        ],
        notes: i < 0.0001 ? ['Parcelamento sem juros: a soma das parcelas é igual ao valor à vista.'] : ['Para comparar com outras ofertas, use sempre a taxa mensal ou anual efetiva.'],
      };
    }
    const i = monthlyRateFrom(v);
    let p = pmt(v.cash, i, v.n);
    if (due) p /= 1 + i;
    const total = p * v.n;
    return {
      hero: { label: 'Valor da parcela', value: brl(p), sub: `${v.n}× a ${pct(i)} ao mês` },
      cards: [
        { label: 'Total pago', value: brl(total) },
        { label: 'Juros', value: brl(total - v.cash), tone: 'minus' },
      ],
      sections: [{ rows: [row('Valor financiado', v.cash), row('Juros totais', total - v.cash, 'minus'), row('Total', total, 'total')] }],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'juros-escondidos',
        title: 'Como descobrir os juros escondidos',
        html: `<p>"12× de R$ 249,90 ou R$ 2.400 à vista" parece pouca diferença, mas esconde uma taxa de juros. A calculadora encontra a taxa que iguala o valor à vista ao valor presente das parcelas — o mesmo método usado pelas calculadoras financeiras (taxa interna de retorno).</p>
<div class="formula">Valor à vista = Parcela × [1 − (1 + i)^−n] ÷ i
(resolvido numericamente para encontrar i)</div>
<div class="example"><p>${h.brl(2400)} à vista ou 12× de ${h.brl(249.9)}: juros de <strong>${ex.hero.value}</strong> (${ex.hero.sub}). No total, ${ex.cards[1].value} a mais.</p></div>`,
      },
      {
        id: 'entrada',
        title: 'Primeira parcela no ato',
        html: '<p>Quando a primeira parcela é paga no momento da compra ("1 + 11"), o comprador financia um valor menor por menos tempo, e a taxa real é maior do que parece. Marque a opção correspondente para que o cálculo considere o pagamento antecipado.</p>',
      },
      {
        id: 'comparar',
        title: 'Parcelar ou pagar à vista?',
        html: `<p>Se a loja oferece desconto à vista, ou se o dinheiro pode render enquanto você paga as parcelas, a resposta muda. A ${h.link('a-vista-ou-parcelado', 'calculadora à vista ou parcelado')} compara as duas opções considerando o rendimento do seu dinheiro.</p>`,
      },
    ],
    faq: [
      { q: 'O que é CET?', a: '<p>O Custo Efetivo Total inclui juros, tarifas, seguros e impostos (IOF). Em empréstimos e financiamentos, a instituição é obrigada a informá-lo. Se você informar o valor líquido recebido e as parcelas, esta calculadora mostra um custo muito próximo do CET.</p>' },
      { q: 'Juros do cartão de crédito parcelado são altos?', a: '<p>O parcelamento da fatura costuma ter taxas muito altas. Compare a taxa encontrada aqui com a de um empréstimo pessoal ou consignado.</p>' },
    ],
    limitations: ['Considera parcelas iguais e mensais; não inclui IOF, tarifas ou seguros, a menos que já estejam embutidos nas parcelas informadas.'],
  };
}
