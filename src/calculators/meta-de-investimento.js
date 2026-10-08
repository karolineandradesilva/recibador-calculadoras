import { contributionForTarget, compoundInterest } from '../calc/finance.js';
import { brl, row, val } from './_shared.js';
import { rateFields, monthlyRateFrom, rateLabel, termFields, monthsFrom, validateTerm, TOO_LARGE } from './_rates.js';

export const meta = {
  slug: 'meta-de-investimento',
  category: 'financas',
  icon: 'target',
  short: 'Meta de investimento',
  h1: 'Calculadora de meta: quanto investir por mês',
  title: 'Quanto Investir por Mês para Atingir uma Meta? Calcule',
  description: 'Descubra quanto você precisa investir por mês para juntar um valor em determinado prazo, considerando o rendimento e o que você já tem guardado.',
  lead: 'Defina o valor que quer juntar e o prazo: a calculadora mostra o aporte mensal necessário.',
  card: 'Aporte mensal para juntar um valor no prazo.',
  keywords: ['meta financeira', 'quanto investir por mes', 'juntar dinheiro', 'aporte mensal', 'objetivo'],
  related: ['juros-compostos', 'reserva-de-emergencia', 'independencia-financeira', 'investimentos'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'target', label: 'Quanto quer juntar', type: 'money', default: 100000, min: 1, width: 'half' },
    { name: 'initial', label: 'Quanto já tem', type: 'money', default: 10000, min: 0, required: false, width: 'half' },
    ...rateFields({ def: 10, period: 'year', label: 'Rendimento esperado' }),
    ...termFields({ def: 5, unit: 'year' }),
  ],
  validate: validateTerm,
  compute(v) {
    const months = monthsFrom(v);
    const i = monthlyRateFrom(v);
    const pmt = contributionForTarget({ target: v.target, principal: val(v.initial), monthlyRate: i, months });
    const sim = compoundInterest({ principal: val(v.initial), monthlyContribution: pmt, monthlyRate: i, months });
    if (!Number.isFinite(sim.total) || !Number.isFinite(pmt) || sim.total > 1e15) return TOO_LARGE;
    return {
      hero: { label: 'Aporte mensal necessário', value: brl(pmt), sub: pmt === 0 ? 'O que você já tem alcança a meta sozinho' : `Durante ${months} meses, a ${rateLabel(i)}` },
      cards: [
        { label: 'Total dos aportes', value: brl(sim.invested) },
        { label: 'Juros ganhos', value: brl(sim.interest), tone: 'plus' },
      ],
      bars: [
        { label: 'Seu dinheiro', value: sim.invested, tone: 3 },
        { label: 'Juros', value: sim.interest, tone: 'net' },
      ],
      sections: [{ rows: [row('Meta', v.target), row('Valor final projetado', sim.total, 'total')] }],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'formula',
        title: 'Como o aporte é calculado',
        html: `<div class="formula">PMT = [Meta − Inicial × (1 + i)ⁿ] × i ÷ [(1 + i)ⁿ − 1]</div>
<p>A fórmula desconta o quanto o valor que você já tem vai render sozinho e calcula a parcela mensal que, com juros compostos, completa a meta no prazo.</p>
<div class="example"><p>Para juntar ${h.brl(100000)} em 5 anos, tendo ${h.brl(10000)} e rendimento de 10% ao ano: <strong>${ex.hero.value} por mês</strong>. Os juros contribuem com ${ex.cards[1].value}.</p></div>`,
      },
      {
        id: 'dicas',
        title: 'Dicas',
        html: `<ul><li>Use uma taxa <strong>real</strong> (acima da inflação) se a meta é em valores de hoje — por exemplo, comprar algo que custa R$ 100 mil hoje.</li><li>Aumente os aportes junto com os reajustes salariais.</li><li>Para metas de longo prazo, como aposentadoria, use a ${h.link('independencia-financeira', 'calculadora de independência financeira')}.</li></ul>`,
      },
    ],
    faq: [{ q: 'Qual taxa de rendimento devo usar?', a: '<p>Para metas de curto prazo, use o rendimento líquido de aplicações conservadoras. Para prazos longos, seja conservador e use uma taxa real (descontada a inflação) de 3% a 5% ao ano.</p>' }],
    limitations: ['Aportes no fim de cada mês e taxa constante, sem impostos.'],
  };
}
