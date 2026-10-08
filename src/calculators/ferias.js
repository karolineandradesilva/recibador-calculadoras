import { vacation, vacationDaysByAbsences } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, inssHint, irrfHint, salaryField, dependentsField, variableField, val } from './_shared.js';

export const meta = {
  slug: 'ferias',
  category: 'trabalho',
  icon: 'sun',
  short: 'Férias',
  h1: 'Calculadora de férias',
  title: `Calculadora de Férias ${P.year}: valor líquido com 1/3, INSS e IR`,
  description: `Calcule o valor das suas férias com o terço constitucional, abono pecuniário (venda de 10 dias), adiantamento do 13º, INSS e IRRF de ${P.year}.`,
  lead: 'Veja quanto você recebe ao tirar férias: o valor bruto, o terço constitucional, os descontos e o líquido que cai na conta.',
  card: 'Valor das férias com 1/3, venda de dias e descontos.',
  keywords: ['ferias', 'terco de ferias', '1/3', 'abono pecuniario', 'quanto recebo de ferias'],
  related: ['venda-de-ferias', 'ferias-proporcionais', 'decimo-terceiro', 'salario-liquido', 'rescisao-trabalhista'],
  sources: ['clt', 'constitution', 'inss', 'irrf', 'irrfReduction'],
  legal: true,
};

// Days of rest that still fit after the days sold and the absence cut.
const restLimit = (v) => vacationDaysByAbsences(val(v.absences)) - val(v.sold);

export const ui = {
  fields: [
    salaryField(),
    { name: 'days', label: 'Dias de férias', type: 'integer', default: 30, min: 5, max: 30, width: 'half', help: 'Dias de descanso que você vai tirar agora. Para férias divididas, informe só este período.' },
    { name: 'sold', label: 'Dias vendidos', type: 'integer', default: 0, min: 0, max: 10, width: 'half', required: false, help: 'Abono pecuniário: até 1/3 das férias (10 dias, para quem tem 30).' },
    dependentsField(),
    { name: 'absences', label: 'Faltas no período', type: 'integer', default: 0, min: 0, max: 365, width: 'half', help: 'Faltas injustificadas no período aquisitivo. Mais de 5 reduzem os dias de férias.' },
    variableField(),
    { name: 'advance', label: 'Receber a 1ª parcela do 13º junto', type: 'checkbox', default: false, advanced: true },
  ],
  onChange(v, form) {
    // Selling days takes them out of the rest: if the days typed no longer
    // fit, bring them down to the maximum (unless the user is typing there).
    const el = form.elements.namedItem('days');
    const limit = restLimit(v);
    if (el && document.activeElement !== el && Number.isFinite(v.days) && limit >= 5 && v.days > limit) el.value = String(limit);
  },
  validate(v) {
    const entitled = vacationDaysByAbsences(val(v.absences));
    if (entitled === 0) return null;
    const maxSell = Math.floor(entitled / 3);
    if (val(v.sold) > maxSell) return { sold: `Com ${entitled} dias de direito, dá para vender no máximo ${maxSell}.` };
    const limit = entitled - val(v.sold);
    if (v.days > limit) {
      return { days: val(v.sold) ? `Com ${val(v.sold)} dias vendidos, sobram no máximo ${limit} dias de descanso.` : `Pelas faltas, o direito é de ${entitled} dias de férias.` };
    }
    return null;
  },
  compute(v) {
    const r = vacation({
      salary: v.salary,
      variableAverage: val(v.variable),
      absences: val(v.absences),
      soldDays: val(v.sold),
      days: v.days,
      dependents: val(v.dependents),
      advanceThirteenth: v.advance,
    });
    if (r.entitledDays === 0) {
      return { hero: { label: 'Férias', value: 'Sem direito', tone: 'warn' }, alert: { tone: 'warn', text: 'Com mais de 32 faltas injustificadas no período aquisitivo, o empregado perde o direito às férias desse período (CLT, art. 130).' } };
    }
    const parts = [`${r.enjoyedDays} de descanso`];
    if (r.soldDays) parts.push(`${r.soldDays} vendidos`);
    if (r.remainingDays) parts.push(`${r.remainingDays} para outro período`);
    const soldTotal = r.allowance + r.allowanceThird;
    let gain = 0;
    if (r.soldDays) {
      const without = vacation({ salary: v.salary, variableAverage: val(v.variable), absences: val(v.absences), soldDays: 0, days: r.enjoyedDays + r.soldDays, dependents: val(v.dependents), advanceThirteenth: v.advance });
      gain = r.net - without.net;
    }
    const notes = ['O pagamento deve ser feito até 2 dias antes do início das férias (CLT, art. 145).'];
    if (r.soldDays) notes.push(`Vender férias é trabalhar esses ${r.soldDays} dias: além do abono, o salário deles vem no contracheque normal, com os descontos de sempre.`);
    if (r.remainingDays) notes.push('Férias divididas: até 3 períodos, um deles com pelo menos 14 dias e os outros com pelo menos 5 (CLT, art. 134, §1º). INSS e IR são calculados só sobre este período.');
    return {
      hero: { label: 'Valor líquido das férias', value: brl(r.net), sub: `${r.entitledDays} dias de direito: ${parts.join(' + ')}` },
      alert: r.entitledDays < 30 ? { tone: 'warn', text: `Por causa das faltas, o direito é de ${r.entitledDays} dias de férias (CLT, art. 130).` } : null,
      cards: [
        { label: `Férias (${r.enjoyedDays} dias) + 1/3`, value: brl(r.vacationPay + r.vacationThird) },
        r.soldDays ? { label: `Venda de ${r.soldDays} dias + 1/3`, value: brl(soldTotal), sub: gain > 0 ? `Sem INSS e IR · ${brl(gain)} a mais que tirar ${r.enjoyedDays + r.soldDays} dias` : 'Sem INSS e IR', tone: 'plus' } : null,
        { label: 'Total bruto', value: brl(r.gross) },
        { label: 'Descontos', value: brl(r.discounts), tone: 'minus' },
      ].filter(Boolean),
      sections: [
        {
          title: 'Demonstrativo',
          rows: [
            row(`Férias (${r.enjoyedDays} dias de descanso)`, r.vacationPay, 'plus'),
            row('1/3 constitucional das férias', r.vacationThird, 'plus'),
            r.soldDays ? row(`Venda de ${r.soldDays} dias (abono pecuniário)`, r.allowance, 'plus', 'Isento de INSS e IR') : null,
            r.soldDays ? row(`1/3 sobre os ${r.soldDays} dias vendidos`, r.allowanceThird, 'plus', 'Isento de INSS e IR') : null,
            r.advance ? row('Adiantamento do 13º (1ª parcela)', r.advance, 'plus', 'Sem descontos agora') : null,
            row('INSS', r.inss.value, 'minus', inssHint(r.inss)),
            row('IRRF', r.irrf.value, 'minus', irrfHint(r.irrf)),
            row('Valor líquido', r.net, 'total'),
          ],
        },
      ],
      notes,
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-usar',
        title: 'Como usar',
        html: `<ol><li>Informe o salário bruto. Se você recebe horas extras, comissões ou adicionais com frequência, coloque a média em <em>Mais opções</em>: ela integra as férias.</li>
<li>Informe quantos dias de descanso vai tirar (30, ou o período desta parte, se as férias forem divididas) e quantos dias vai vender (abono pecuniário, até 10).</li>
<li>Informe os dependentes para o IR e eventuais faltas injustificadas no período aquisitivo.</li></ol>`,
      },
      {
        id: 'como-calcular',
        title: 'Como calcular as férias',
        html: `<p>As férias correspondem ao salário dos dias de descanso, acrescido de <strong>um terço</strong> (art. 7º, XVII, da Constituição). Sobre esse total incidem INSS e Imposto de Renda, calculados separadamente do salário do mês.</p>
<div class="formula">Férias = (salário + média de adicionais) ÷ 30 × dias de descanso
1/3 = férias ÷ 3
Abono = (salário + médias) ÷ 30 × dias vendidos  (+ 1/3, sem INSS e IR)
Líquido = férias + 1/3 + abono − INSS − IRRF</div>
<h3>Faltas reduzem os dias de férias</h3>
${h.table(['Faltas injustificadas no período aquisitivo', 'Dias de férias'], [['até 5', '30'], ['de 6 a 14', '24'], ['de 15 a 23', '18'], ['de 24 a 32', '12'], ['mais de 32', 'perde o direito']])}
<p>Fonte: CLT, art. 130. Faltas justificadas (atestado médico, licenças legais) não entram nessa conta.</p>`,
      },
      {
        id: 'exemplo',
        title: 'Exemplo resolvido',
        html: `<div class="example"><p>Salário de <strong>${h.brl(3500)}</strong>, 30 dias de férias, sem dependentes:</p>
<ul>${ex.sections[0].rows.filter(Boolean).map((r) => `<li>${r.label}: ${r.tone === 'minus' ? '− ' : ''}${r.value}</li>`).join('')}</ul></div>`,
      },
      {
        id: 'prazos',
        title: 'Prazos e regras importantes',
        html: `<ul><li><strong>Pagamento:</strong> até 2 dias antes do início das férias (CLT, art. 145). Se atrasar, o STF considerou inconstitucional o pagamento em dobro automático (ADPF 501), mas o atraso ainda pode gerar outras consequências.</li>
<li><strong>Fracionamento:</strong> com a concordância do empregado, as férias podem ser divididas em até 3 períodos, sendo um de pelo menos 14 dias e os demais de pelo menos 5 dias (art. 134, §1º).</li>
<li><strong>Início:</strong> as férias não podem começar nos 2 dias que antecedem feriado ou o descanso semanal remunerado (art. 134, §3º).</li>
<li><strong>Venda de dias:</strong> o pedido de abono deve ser feito até 15 dias antes do fim do período aquisitivo (art. 143, §1º). Veja a ${h.link('venda-de-ferias', 'calculadora de venda de férias')}.</li></ul>`,
      },
    ],
    faq: [
      { q: 'O terço de férias tem desconto de INSS e IR?', a: '<p>Sim. O terço constitucional das férias gozadas entra na base do INSS e do Imposto de Renda junto com o valor das férias. Já o abono pecuniário (dias vendidos) e o seu terço são isentos de INSS e IR.</p>' },
      { q: 'Por que o salário do mês seguinte vem menor?', a: '<p>Porque as férias são pagas antecipadamente. No mês em que elas terminam, o contracheque traz apenas os dias trabalhados depois do retorno, e os dias de férias aparecem como já pagos.</p>' },
      { q: 'Horas extras entram no cálculo das férias?', a: '<p>Sim, quando habituais. A média das horas extras, comissões e adicionais do período aquisitivo integra a remuneração das férias (CLT, art. 142, §§ 5º e 6º). Informe essa média em "Mais opções".</p>' },
      { q: 'Posso pedir o adiantamento do 13º nas férias?', a: '<p>Sim. O empregado pode pedir, em janeiro, que a primeira parcela do 13º seja paga junto com as férias (Lei 4.749/1965, art. 2º, §2º). Ela vem sem descontos; INSS e IR são cobrados na segunda parcela.</p>' },
    ],
    limitations: [
      'INSS e IR são calculados apenas sobre as férias, como se fossem o único rendimento do mês. Na prática, a folha pode somar o salário dos dias trabalhados no mesmo mês.',
      'Médias de adicionais devem ser informadas pelo usuário; a calculadora não apura médias de 12 meses.',
      'Convenções coletivas podem garantir valores maiores (por exemplo, abono de férias adicional).',
    ],
  };
}
