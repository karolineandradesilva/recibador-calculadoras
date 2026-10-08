import { rentAdjustment } from '../calc/indices.js';
import { brl, row, pct } from './_shared.js';
import { SERIES, INDEX_INFO, indexOptions, monthOptions, latestMonth, monthLabel, nextMonth, UPDATED_AT } from './_indices.js';
import { dateLabel } from '../lib/format.js';

export const meta = {
  slug: 'reajuste-aluguel',
  category: 'indices',
  icon: 'home',
  short: 'Reajuste de aluguel',
  h1: 'Calculadora de reajuste de aluguel (IGP-M e IPCA)',
  title: 'Reajuste de Aluguel pelo IGP-M ou IPCA: calcule o novo valor',
  description: 'Calcule o reajuste anual do aluguel pelo IGP-M, IPCA ou outro índice do contrato, com o acumulado de 12 meses do Banco Central e o novo valor a pagar.',
  lead: 'Escolha o índice do contrato e o mês do reajuste para ver o acumulado de 12 meses e o novo aluguel.',
  card: 'Novo aluguel pelo acumulado de 12 meses.',
  keywords: ['reajuste aluguel', 'igpm aluguel', 'ipca aluguel', 'aumento aluguel', 'acumulado 12 meses', 'contrato de locacao'],
  related: ['correcao-monetaria', 'inflacao', 'financiamento', 'porcentagem'],
  sources: ['bcb'],
  extraSources: [{ label: 'Lei nº 8.245/1991 — Lei do Inquilinato', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8245.htm' }],
  legal: false,
  dynamicData: true,
};

const last = latestMonth('igpm');

export const ui = {
  fields: [
    { name: 'rent', label: 'Aluguel atual', type: 'money', default: 2500, min: 0.01 },
    { name: 'index', label: 'Índice do contrato', type: 'select', default: 'igpm', options: indexOptions(['igpm', 'ipca', 'inpc', 'igpdi']), width: 'half' },
    { name: 'month', label: 'Mês do reajuste', type: 'select', default: nextMonth(last, 1), options: monthOptions({ from: '2001-01', extraFuture: 2 }), width: 'half', help: 'Mês de aniversário do contrato.' },
    { name: 'floor', label: 'Não reduzir o aluguel se o índice for negativo', type: 'checkbox', default: true, help: 'Muitos contratos preveem que o aluguel não diminui com deflação.' },
  ],
  compute(v) {
    const r = rentAdjustment(SERIES[v.index], { rent: v.rent, adjustmentMonth: v.month, floorAtZero: v.floor });
    if (!r.valid) return { error: r.reason };
    const name = INDEX_INFO[v.index].short;
    return {
      hero: { label: 'Novo aluguel', value: brl(r.newRent), sub: `${name} acumulado em 12 meses: ${pct(r.rate)}` },
      alert: r.negativeIgnored ? { tone: 'info', text: `O ${name} acumulado foi negativo (${pct(r.rate)}). Com a opção marcada, o aluguel se mantém.` } : null,
      cards: [
        { label: 'Aumento mensal', value: brl(r.difference), tone: r.difference > 0 ? 'minus' : undefined },
        { label: 'A mais em 12 meses', value: brl(r.difference * 12) },
      ],
      sections: [
        {
          rows: [
            row('Aluguel atual', v.rent),
            row('Período do índice', `${monthLabel(r.start)} a ${monthLabel(r.end)}`),
            row(`${name} acumulado`, pct(r.rate)),
            row('Novo aluguel', r.newRent, 'total'),
          ],
        },
      ],
      notes: [`Dados do Banco Central atualizados em ${dateLabel(UPDATED_AT)}. Confira no contrato qual índice e qual período de apuração valem.`],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-calcular',
        title: 'Como calcular o reajuste do aluguel',
        html: `<p>Pela Lei do Inquilinato, o aluguel pode ser reajustado uma vez a cada 12 meses, pelo índice previsto no contrato. O percentual é o <strong>acumulado do índice nos 12 meses anteriores</strong> ao aniversário do contrato. Como os índices são divulgados no fim do mês ou no mês seguinte, usa-se o último acumulado de 12 meses disponível.</p>
<div class="formula">Acumulado 12 meses = (1 + i₁) × (1 + i₂) × … × (1 + i₁₂) − 1
Novo aluguel = aluguel atual × (1 + acumulado)</div>
<div class="example"><p>Aluguel de ${h.brl(2500)} reajustado pelo IGP-M: <strong>${ex.hero.value}</strong> (${ex.hero.sub}).</p></div>`,
      },
      {
        id: 'igpm-ou-ipca',
        title: 'IGP-M ou IPCA?',
        html: `<p>O IGP-M foi por décadas o "índice do aluguel", mas é muito influenciado por câmbio e commodities e pode disparar ou ficar negativo. Por isso, muitos contratos novos usam o IPCA, a inflação oficial ao consumidor. Na renovação, é possível negociar a troca de índice. Compare os índices na ${h.link('correcao-monetaria', 'calculadora de correção monetária')}.</p>`,
      },
    ],
    faq: [
      { q: 'O proprietário pode aplicar um reajuste maior que o índice?', a: '<p>Durante o contrato, não: vale o índice combinado. Após três anos de contrato ou de acordo, qualquer das partes pode pedir a revisão judicial do aluguel para ajustá-lo ao valor de mercado (Lei 8.245/1991, art. 19).</p>' },
      { q: 'E se o índice acumulado for negativo?', a: '<p>Depende do contrato. Alguns preveem redução; muitos estabelecem que o aluguel se mantém. A calculadora permite as duas opções.</p>' },
    ],
    limitations: ['Usa o acumulado dos 12 meses anteriores ao mês do reajuste (ou o último disponível). Alguns contratos usam outro período de apuração.'],
  };
}
