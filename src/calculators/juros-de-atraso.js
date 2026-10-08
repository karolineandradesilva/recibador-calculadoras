import { latePayment } from '../calc/finance.js';
import { CURRENT as P } from '../data/params/index.js';
import { diffDays, parseISO } from '../lib/dates.js';
import { brl, row, frac, pct } from './_shared.js';

export const meta = {
  slug: 'juros-de-atraso',
  category: 'financas',
  icon: 'alert',
  short: 'Multa e juros de atraso',
  h1: 'Calculadora de multa e juros por atraso',
  title: 'Multa e Juros de Atraso: calcule o valor do boleto vencido',
  description: 'Calcule o valor atualizado de um boleto ou conta em atraso com multa de 2% e juros de mora de 1% ao mês proporcionais aos dias, ou com os percentuais do contrato.',
  lead: 'Informe o valor, o vencimento e a data de pagamento para saber quanto pagar de multa e juros.',
  card: 'Boleto vencido: multa de 2% + juros pro rata.',
  keywords: ['juros de atraso', 'multa atraso', 'boleto vencido', 'juros de mora', '2% multa 1% juros', 'conta atrasada'],
  related: ['juros-simples', 'dias-uteis', 'correcao-monetaria', 'parcelamento'],
  sources: ['latePayment'],
  legal: false,
};

const y = P.year;

export const ui = {
  fields: [
    { name: 'amount', label: 'Valor original', type: 'money', default: 850, min: 0.01 },
    { name: 'due', label: 'Vencimento', type: 'date', default: `${y}-08-10`, width: 'half' },
    { name: 'paid', label: 'Data do pagamento', type: 'date', default: `${y}-09-25`, width: 'half', after: 'due', afterMessage: 'O pagamento deve ser na data do vencimento ou depois.', maxSpanDays: 20 * 366, spanMessage: 'Atraso de mais de 20 anos: confira as datas.' },
    { name: 'fine', label: 'Multa', type: 'percent', default: 2, min: 0, max: 100, width: 'half' },
    { name: 'interest', label: 'Juros de mora', type: 'percent', default: 1, min: 0, max: 100, width: 'half', suffix: '% a.m.' },
  ],
  validate(v) {
    const a = parseISO(v.due);
    const b = parseISO(v.paid);
    if (a && b && b < a) return { paid: 'A data de pagamento deve ser posterior ao vencimento.' };
    return null;
  },
  compute(v) {
    const days = diffDays(parseISO(v.due), parseISO(v.paid));
    const r = latePayment({ amount: v.amount, daysLate: days, fineRate: frac(v.fine), monthlyInterest: frac(v.interest) });
    if (days <= 0) return { hero: { label: 'Valor a pagar', value: brl(v.amount), sub: 'Sem atraso' } };
    return {
      hero: { label: 'Valor atualizado', value: brl(r.total), sub: `${days} ${days === 1 ? 'dia' : 'dias'} de atraso` },
      sections: [
        {
          rows: [
            row('Valor original', v.amount),
            row(`Multa (${pct(frac(v.fine), 1)})`, r.fine, 'plus'),
            row(`Juros (${pct(frac(v.interest), 1)} a.m. × ${days}/30)`, r.interest, 'plus'),
            row('Total a pagar', r.total, 'total'),
          ],
        },
      ],
      alert: frac(v.fine) > P.latePayment.maxConsumerFine ? { tone: 'warn', text: 'Em relações de consumo (contas, compras, mensalidades), a multa por atraso é limitada a 2% (CDC, art. 52, §1º).' } : null,
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-calcular',
        title: 'Como calcular multa e juros de atraso',
        html: `<p>A maioria dos boletos usa dois encargos: uma <strong>multa</strong> fixa, cobrada uma única vez, e <strong>juros de mora</strong>, proporcionais ao tempo de atraso.</p>
<div class="formula">Multa = valor × percentual da multa
Juros = valor × taxa mensal × dias de atraso ÷ 30
Total = valor + multa + juros</div>
<div class="example"><p>Conta de ${h.brl(850)} vencida em ${h.dateLabel(`${h.P.year}-08-10`)} e paga em ${h.dateLabel(`${h.P.year}-09-25`)}, com multa de 2% e juros de 1% ao mês: <strong>${ex.hero.value}</strong> (${ex.hero.sub}).</p></div>`,
      },
      {
        id: 'limites',
        title: 'Limites legais',
        html: `<ul><li><strong>Multa:</strong> até 2% nas relações de consumo (CDC, art. 52, §1º). Condomínios também são limitados a 2% (Código Civil, art. 1.336, §1º).</li>
<li><strong>Juros de mora:</strong> o padrão contratual é 1% ao mês. Desde 2024, quando o contrato não define a taxa, aplica-se a taxa legal do Código Civil (Selic menos IPCA, Lei 14.905/2024).</li>
<li><strong>Correção monetária:</strong> alguns contratos preveem também atualização pela inflação. Calcule-a na ${h.link('correcao-monetaria', 'calculadora de correção monetária')}.</li></ul>`,
      },
    ],
    faq: [
      { q: 'Se o vencimento cai no fim de semana, posso pagar no dia útil seguinte?', a: '<p>Sim. Boletos vencidos em dia não útil podem ser pagos no primeiro dia útil seguinte sem encargos.</p>' },
      { q: 'Cartão de crédito segue essa regra?', a: '<p>Não. O atraso no cartão envolve juros do rotativo e encargos próprios, muito maiores. Consulte o contrato e a fatura.</p>' },
    ],
    limitations: ['Usa juros simples proporcionais (pro rata die) com mês de 30 dias, sem correção monetária.', 'Tributos federais, estaduais e municipais em atraso têm regras próprias (Selic e multas específicas).'],
  };
}
