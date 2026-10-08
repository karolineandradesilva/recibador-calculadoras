import { annualToMonthly, monthsToTarget } from '../calc/finance.js';
import { brl, row, val, frac } from './_shared.js';
import { LATEST } from './_rates.js';

export const meta = {
  slug: 'reserva-de-emergencia',
  category: 'financas',
  icon: 'shield',
  short: 'Reserva de emergência',
  h1: 'Calculadora de reserva de emergência',
  title: 'Calculadora de Reserva de Emergência: quanto guardar e em quanto tempo',
  description: 'Descubra o valor ideal da sua reserva de emergência conforme o seu tipo de renda e quanto tempo leva para formá-la guardando um valor por mês.',
  lead: 'Calcule o tamanho ideal da sua reserva e em quantos meses você chega lá.',
  card: 'Quanto guardar e em quantos meses.',
  keywords: ['reserva de emergencia', 'fundo de emergencia', 'quanto guardar', 'colchao financeiro'],
  related: ['meta-de-investimento', 'investimentos', 'rendimento-poupanca', 'independencia-financeira'],
  sources: [],
  legal: false,
  dynamicData: true,
};

const PROFILES = {
  public: { label: 'Renda estável', months: 3 },
  clt: { label: 'CLT', months: 6 },
  variable: { label: 'Autônomo ou PJ', months: 12 },
};

export const ui = {
  fields: [
    { name: 'expenses', label: 'Gastos essenciais por mês', type: 'money', default: 4000, min: 1, help: 'Moradia, alimentação, contas, transporte, saúde e dívidas.' },
    { name: 'profile', label: 'Tipo de renda', type: 'select', default: 'clt', options: Object.entries(PROFILES).map(([value, p]) => ({ value, label: `${p.label} (${p.months} meses)` })) },
    { name: 'saved', label: 'Quanto já tem guardado', type: 'money', default: 2000, min: 0, required: false, width: 'half' },
    { name: 'monthly', label: 'Pode guardar por mês', type: 'money', default: 800, min: 0, required: false, width: 'half' },
    { name: 'yield', label: 'Rendimento líquido', type: 'percent', default: Math.round(LATEST.cdi.value * 0.82 * 10) / 10, min: 0, max: 50, suffix: '% a.a.', advanced: true },
  ],
  compute(v) {
    const p = PROFILES[v.profile];
    const target = v.expenses * p.months;
    const saved = val(v.saved);
    const missing = Math.max(0, target - saved);
    const months = monthsToTarget({ target, principal: saved, monthlyContribution: val(v.monthly), monthlyRate: annualToMonthly(frac(val(v.yield))) });
    const timeText = months === 0 ? 'Reserva completa!' : Number.isFinite(months) ? `${months} ${months === 1 ? 'mês' : 'meses'} para completar` : 'Informe quanto pode guardar por mês';
    return {
      hero: { label: 'Reserva ideal', value: brl(target), sub: `${p.months} meses de gastos essenciais` },
      cards: [
        { label: 'Falta guardar', value: brl(missing), tone: missing ? 'minus' : 'plus' },
        { label: 'Prazo', value: Number.isFinite(months) ? (months === 0 ? 'Pronto' : `${months} meses`) : '—', sub: timeText },
      ],
      sections: [
        {
          rows: [
            row('Meta', target),
            row('Já guardado', saved, 'plus'),
            row('Progresso', `${Math.min(100, Math.round((saved / target) * 100))}%`, 'total'),
          ],
        },
      ],
      notes: ['Deixe a reserva em aplicação de baixo risco e liquidez diária, como Tesouro Selic ou CDB com liquidez diária de banco sólido.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'quanto',
        title: 'Quanto ter na reserva',
        html: `<p>A reserva de emergência cobre imprevistos — perda de renda, saúde, conserto do carro — sem recorrer a empréstimos. A recomendação mais usada por planejadores financeiros é guardar de <strong>3 a 12 meses de gastos essenciais</strong>, conforme a estabilidade da renda:</p>
${h.table(['Perfil', 'Meses de gastos'], Object.values(PROFILES).map((p) => [p.label, String(p.months)]))}
<div class="example"><p>Gastos essenciais de ${h.brl(4000)} e emprego CLT: reserva de <strong>${ex.hero.value}</strong>. Com ${h.brl(2000)} guardados e ${h.brl(800)} por mês, o prazo é de ${ex.cards[1].value}.</p></div>`,
      },
      {
        id: 'onde-guardar',
        title: 'Onde guardar',
        html: `<ul><li><strong>Segurança:</strong> títulos públicos (Tesouro Selic) ou CDB de grandes bancos com FGC.</li><li><strong>Liquidez diária:</strong> você precisa do dinheiro no mesmo dia ou no dia seguinte.</li><li><strong>Rendimento:</strong> pelo menos o CDI, para não perder para a inflação.</li></ul>
<p>Depois de montar a reserva, defina metas maiores com a ${h.link('meta-de-investimento', 'calculadora de metas')}.</p>`,
      },
    ],
    faq: [{ q: 'Poupança serve para reserva de emergência?', a: `<p>Serve, mas costuma render menos que alternativas com a mesma segurança e liquidez. Compare na ${h.link('investimentos', 'calculadora de investimentos')}.</p>` }],
    limitations: ['As faixas de meses são referências gerais de planejamento financeiro, não regras.'],
  };
}
