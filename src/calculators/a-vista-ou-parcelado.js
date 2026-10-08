import { annualToMonthly, annuityPV, rateFromInstallments } from '../calc/finance.js';
import { brl, row, pct, frac } from './_shared.js';
import { LATEST } from './_rates.js';

export const meta = {
  slug: 'a-vista-ou-parcelado',
  category: 'financas',
  icon: 'scale',
  short: 'À vista ou parcelado?',
  h1: 'Calculadora: vale mais a pena pagar à vista ou parcelado?',
  title: 'À Vista ou Parcelado? Calcule a opção mais vantajosa',
  description: 'Compare pagar à vista com desconto ou parcelar sem juros, considerando quanto o seu dinheiro renderia aplicado. Descubra a opção que sai mais barata de verdade.',
  lead: 'Desconto à vista ou parcelas sem juros? Informe as duas ofertas e o rendimento do seu dinheiro para ver qual sai mais barata.',
  card: 'Desconto à vista x parcelas, com o rendimento.',
  keywords: ['a vista ou parcelado', 'vale a pena parcelar', 'desconto a vista', 'parcelar sem juros', 'compra'],
  related: ['parcelamento', 'desconto', 'investimentos', 'juros-compostos'],
  sources: [],
  legal: false,
  dynamicData: true,
};

const cdi = LATEST.cdi.value;

export const ui = {
  fields: [
    { name: 'cash', label: 'Preço à vista', type: 'money', default: 2850, min: 0.01, width: 'half' },
    { name: 'installment', label: 'Valor da parcela', type: 'money', default: 300, min: 0.01, width: 'half' },
    { name: 'n', label: 'Número de parcelas', type: 'integer', default: 10, min: 1, max: 120, width: 'half' },
    { name: 'yield', label: 'Rendimento do dinheiro', type: 'percent', default: Math.round(cdi * 0.85 * 10) / 10, min: 0, max: 100, width: 'half', suffix: '% a.a.', help: `Ex.: CDB a 100% do CDI após IR. CDI atual: ${String(cdi).replace('.', ',')}% a.a.` },
  ],
  compute(v) {
    const i = annualToMonthly(frac(v.yield));
    const pv = annuityPV(v.installment, i, v.n);
    const total = v.installment * v.n;
    const saving = pv - v.cash;
    const implicit = total > v.cash ? rateFromInstallments(v.cash, v.installment, v.n) : 0;
    const best = saving > 0 ? 'cash' : 'installments';
    return {
      hero: {
        label: 'Melhor opção',
        value: best === 'cash' ? 'Pagar à vista' : 'Parcelar',
        tone: 'neutral',
        sub: `Economia de ${brl(Math.abs(saving))} em valores de hoje`,
      },
      cards: [
        { label: 'Desconto à vista', value: pct(1 - v.cash / total), sub: `${brl(total - v.cash)} a menos` },
        { label: 'Custo das parcelas hoje', value: brl(pv), sub: `Descontado a ${pct(i)} a.m.` },
        { label: 'Juros embutidos', value: total > v.cash ? `${pct(implicit)} a.m.` : '—' },
      ],
      sections: [
        {
          rows: [
            row('Preço à vista', v.cash),
            row(`Total parcelado (${v.n}× ${brl(v.installment)})`, total),
            row('Valor presente das parcelas', pv, null, 'Quanto você precisaria aplicar hoje para pagar todas'),
            row(best === 'cash' ? 'Vantagem de pagar à vista' : 'Vantagem de parcelar', Math.abs(saving), 'total'),
          ],
        },
      ],
      notes: [best === 'cash' ? 'O desconto à vista vale mais do que o rendimento que você teria deixando o dinheiro aplicado.' : 'Deixar o dinheiro aplicado e pagar as parcelas rende mais do que o desconto à vista. Isso só vale se você realmente mantiver o dinheiro investido.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-funciona',
        title: 'Como a comparação funciona',
        html: `<p>Um real hoje vale mais que um real daqui a seis meses, porque pode render nesse período. Por isso, comparar só o "total parcelado" com o preço à vista está errado. A calculadora traz todas as parcelas para o valor de hoje, descontando o rendimento que o seu dinheiro teria, e compara com o preço à vista.</p>
<div class="formula">Valor presente das parcelas = Parcela × [1 − (1 + i)^−n] ÷ i
Se preço à vista < valor presente → pague à vista
Se preço à vista > valor presente → parcele e deixe o dinheiro rendendo</div>
<div class="example"><p>Exemplo: ${h.brl(2850)} à vista ou 10× de ${h.brl(300)} (${h.brl(3000)}). Com o dinheiro rendendo cerca de 85% do CDI líquido: <strong>${ex.hero.value}</strong> — ${ex.hero.sub.toLowerCase()}.</p></div>`,
      },
      {
        id: 'qual-taxa',
        title: 'Qual rendimento usar',
        html: `<p>Use o rendimento <strong>líquido</strong> (após o IR) da aplicação onde o dinheiro realmente ficaria: poupança, CDB, Tesouro Selic. A calculadora já sugere uma taxa próxima de um CDB a 100% do CDI após o imposto, com base no CDI publicado pelo Banco Central (${String(cdi).replace('.', ',')}% a.a.). Compare aplicações na ${h.link('investimentos', 'calculadora de investimentos')}.</p>`,
      },
    ],
    faq: [
      { q: 'Parcelado sem juros é sempre melhor?', a: '<p>Só se o preço à vista for igual ao total parcelado. Quando há desconto à vista, os "sem juros" escondem uma taxa, que a calculadora mostra em "Juros embutidos".</p>' },
      { q: 'E se eu não tiver o dinheiro aplicado?', a: '<p>Então a comparação é outra: parcelar evita usar a reserva de emergência ou tomar empréstimo. Evite usar o rotativo do cartão para pagar parcelas: ele costuma ter juros muito altos.</p>' },
    ],
    limitations: ['Considera parcelas mensais iguais, a primeira daqui a um mês, e rendimento constante.'],
  };
}
