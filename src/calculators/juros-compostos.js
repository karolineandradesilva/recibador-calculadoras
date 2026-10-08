import { compoundInterest } from '../calc/finance.js';
import { brl, row, val } from './_shared.js';
import { rateFields, monthlyRateFrom, rateLabel, termFields, monthsFrom, validateTerm, TOO_LARGE } from './_rates.js';

export const meta = {
  slug: 'juros-compostos',
  category: 'financas',
  icon: 'trending',
  short: 'Juros compostos',
  h1: 'Calculadora de juros compostos',
  title: 'Calculadora de Juros Compostos com Aportes Mensais',
  description: 'Simule juros compostos com valor inicial e aportes mensais: veja o montante final, o total investido, os juros ganhos e a evolução ano a ano.',
  lead: 'Veja o poder dos juros sobre juros: simule um valor inicial, aportes mensais e a taxa, e acompanhe a evolução do patrimônio.',
  card: 'Montante com aportes mensais e evolução.',
  keywords: ['juros compostos', 'juros sobre juros', 'montante', 'aporte mensal', 'simulador de investimento'],
  related: ['juros-simples', 'meta-de-investimento', 'investimentos', 'valor-presente-futuro', 'independencia-financeira'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'initial', label: 'Valor inicial', type: 'money', default: 5000, min: 0, width: 'half' },
    { name: 'monthly', label: 'Aporte mensal', type: 'money', default: 500, min: 0, required: false, width: 'half' },
    ...rateFields({ def: 10, period: 'year' }),
    ...termFields({ def: 10, unit: 'year' }),
  ],
  validate(v) {
    if (!(v.initial > 0 || val(v.monthly) > 0)) return { initial: 'Informe um valor inicial ou um aporte mensal.' };
    return validateTerm(v);
  },
  compute(v) {
    const months = monthsFrom(v);
    const i = monthlyRateFrom(v);
    const r = compoundInterest({ principal: v.initial, monthlyContribution: val(v.monthly), monthlyRate: i, months });
    if (!Number.isFinite(r.total) || r.total > 1e15) return TOO_LARGE;
    const unit = r.step === 12 ? 'Ano' : 'Mês';
    return {
      hero: { label: 'Montante final', value: brl(r.total), sub: `Em ${months} meses, a ${rateLabel(i)}` },
      cards: [
        { label: 'Total investido', value: brl(r.invested) },
        { label: 'Juros ganhos', value: brl(r.interest), tone: 'plus' },
      ],
      bars: [
        { label: 'Investido', value: r.invested, tone: 3 },
        { label: 'Juros', value: r.interest, tone: 'net' },
      ],
      table: {
        caption: `Evolução ${r.step === 12 ? 'ano a ano' : 'mês a mês'}`,
        columns: [unit, 'Investido', 'Juros', 'Saldo'],
        rows: r.rows.map((x) => [String(r.step === 12 ? Math.ceil(x.period / 12) : x.period), brl(x.invested), brl(x.interest), brl(x.balance)]),
      },
      notes: ['Valores brutos, sem imposto de renda, taxas ou inflação.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'formula',
        title: 'Fórmula dos juros compostos',
        html: `<p>Nos juros compostos, os juros de cada período são somados ao capital e passam a render juros também. Com o tempo, o crescimento deixa de ser linear e se torna exponencial.</p>
<div class="formula">M = C × (1 + i)ⁿ
Com aportes mensais (PMT) no fim de cada mês:
M = C × (1 + i)ⁿ + PMT × [(1 + i)ⁿ − 1] ÷ i</div>
<p>Onde C é o capital inicial, i a taxa por período e n o número de períodos. A taxa e o prazo precisam estar na mesma unidade: a calculadora converte taxas anuais em mensais pela equivalência <code>(1 + a)^(1/12) − 1</code>.</p>`,
      },
      {
        id: 'exemplo',
        title: 'Exemplo',
        html: `<div class="example"><p>${h.brl(5000)} iniciais + ${h.brl(500)} por mês, a 10% ao ano, durante 10 anos: montante de <strong>${ex.hero.value}</strong>. Foram investidos ${ex.cards[0].value}, e os juros somaram ${ex.cards[1].value}.</p></div>`,
      },
      {
        id: 'dicas',
        title: 'Como interpretar',
        html: `<ul><li><strong>Tempo é o fator mais poderoso:</strong> dobrar o prazo mais do que dobra os juros.</li>
<li><strong>Taxa real:</strong> para saber o ganho de poder de compra, use uma taxa já descontada da inflação.</li>
<li><strong>Impostos:</strong> em aplicações de renda fixa, o IR incide sobre o rendimento. Compare produtos reais na ${h.link('investimentos', 'calculadora de investimentos')}.</li>
<li>Para saber quanto investir por mês para chegar a um valor, use a ${h.link('meta-de-investimento', 'calculadora de meta')}.</li></ul>`,
      },
    ],
    faq: [
      { q: 'Qual a diferença entre juros simples e compostos?', a: `<p>Nos simples, os juros incidem sempre sobre o capital inicial. Nos compostos, incidem sobre o saldo acumulado. Compare na ${h.link('juros-simples', 'calculadora de juros simples')}.</p>` },
      { q: '1% ao mês é igual a 12% ao ano?', a: '<p>Não. Em juros compostos, 1% ao mês equivale a 12,68% ao ano, porque os juros de cada mês também rendem.</p>' },
    ],
    limitations: ['Taxa constante durante todo o período e aportes sempre no fim do mês.'],
  };
}
