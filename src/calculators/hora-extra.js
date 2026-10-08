import { overtime } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { hoursLabel } from '../lib/format.js';
import { brl, row, salaryField, val, frac } from './_shared.js';

export const meta = {
  slug: 'hora-extra',
  category: 'trabalho',
  icon: 'clock',
  short: 'Hora extra',
  h1: 'Calculadora de hora extra',
  title: `Calculadora de Hora Extra ${P.year}: 50%, 100% e reflexo no DSR`,
  description: 'Calcule o valor das horas extras com adicional de 50%, 100% ou percentual da sua convenção, inclusive o reflexo no descanso semanal remunerado (DSR).',
  lead: 'Informe o salário, a jornada e as horas extras do mês para saber quanto elas valem, com o reflexo no DSR.',
  card: 'Valor das horas a 50%, 100% e reflexo no DSR.',
  keywords: ['hora extra', 'horas extras', '50%', '100%', 'adicional', 'dsr', 'valor da hora extra'],
  related: ['dsr', 'banco-de-horas', 'adicional-noturno', 'salario-por-hora', 'horas-trabalhadas'],
  sources: ['clt', 'constitution'],
  legal: true,
};

export const ui = {
  fields: [
    salaryField(),
    {
      name: 'divisor',
      label: 'Jornada semanal',
      type: 'select',
      numeric: true,
      default: 220,
      options: [
        { value: 220, label: '44 horas (divisor 220)' },
        { value: 200, label: '40 horas (divisor 200)' },
        { value: 180, label: '36 horas (divisor 180)' },
        { value: 150, label: '30 horas (divisor 150)' },
      ],
    },
    { name: 'h50', label: 'Horas extras a 50%', type: 'hours', default: '10:00', required: false, width: 'half', help: 'Ex.: 10 ou 10:30.' },
    { name: 'h100', label: 'Horas extras a 100%', type: 'hours', default: '', required: false, width: 'half', help: 'Domingos e feriados, em geral.' },
    { name: 'dsr', label: 'Incluir reflexo no DSR', type: 'checkbox', default: true },
    { name: 'workdays', label: 'Dias úteis no mês', type: 'integer', default: 26, min: 1, max: 31, width: 'half', showIf: (v) => v.dsr, help: 'Segunda a sábado, sem feriados.' },
    { name: 'restdays', label: 'Domingos e feriados', type: 'integer', default: 4, min: 0, max: 15, width: 'half', showIf: (v) => v.dsr },
    { name: 'customH', label: 'Horas com outro adicional', type: 'hours', default: '', required: false, advanced: true, width: 'half' },
    { name: 'customRate', label: 'Outro adicional', type: 'percent', default: 70, min: 0, max: 300, advanced: true, width: 'half', required: false },
    { name: 'additions', label: 'Adicionais fixos no salário', type: 'money', default: 0, min: 0, required: false, advanced: true, help: 'Periculosidade, insalubridade e outros adicionais que integram o valor da hora.' },
  ],
  validate(v) {
    if (!(val(v.h50) > 0 || val(v.h100) > 0 || val(v.customH) > 0)) return { h50: 'Informe ao menos uma quantidade de horas extras.' };
    return null;
  },
  compute(v) {
    const r = overtime({
      salary: v.salary,
      monthlyHours: v.divisor,
      hours50: val(v.h50),
      hours100: val(v.h100),
      customHours: val(v.customH),
      customRate: frac(val(v.customRate, 0)),
      includeDsr: v.dsr,
      workingDays: val(v.workdays, 26),
      restDays: val(v.restdays, 4),
      additions: val(v.additions),
    });
    return {
      hero: { label: 'Total de horas extras', value: brl(r.total), sub: v.dsr ? 'Com reflexo no DSR' : 'Sem reflexo no DSR' },
      cards: [
        { label: 'Valor da hora normal', value: brl(r.hourly) },
        { label: 'Hora extra a 50%', value: brl(r.hourlyExact * 1.5) },
        { label: 'Hora extra a 100%', value: brl(r.hourlyExact * 2) },
      ],
      sections: [
        {
          rows: [
            r.v50 ? row(`${hoursLabel(val(v.h50))} a 50%`, r.v50, 'plus') : null,
            r.v100 ? row(`${hoursLabel(val(v.h100))} a 100%`, r.v100, 'plus') : null,
            r.vCustom ? row(`${hoursLabel(val(v.customH))} a ${val(v.customRate)}%`, r.vCustom, 'plus') : null,
            r.dsr ? row('Reflexo no DSR', r.dsr, 'plus', 'Horas extras ÷ dias úteis × domingos e feriados') : null,
            row('Total bruto', r.total, 'total'),
          ],
        },
      ],
      notes: ['As horas extras entram na base do INSS, do IR e do FGTS do mês.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-calcular',
        title: 'Como calcular a hora extra',
        html: `<p>A hora extra é a hora trabalhada além da jornada contratada. A Constituição garante um adicional de <strong>no mínimo 50%</strong> sobre a hora normal (art. 7º, XVI). Convenções coletivas costumam prever percentuais maiores, e o trabalho em domingos e feriados não compensados é pago em dobro (100%).</p>
<div class="formula">Valor da hora = (salário + adicionais fixos) ÷ divisor
Hora extra 50% = valor da hora × 1,5
Hora extra 100% = valor da hora × 2
DSR = total das horas extras ÷ dias úteis × domingos e feriados</div>
<p>O <strong>divisor</strong> depende da jornada semanal: 220 para 44 horas, 200 para 40 horas, 180 para 36 horas e 150 para 30 horas (jornada semanal × 5).</p>`,
      },
      {
        id: 'exemplo',
        title: 'Exemplo resolvido',
        html: `<div class="example"><p>Salário de ${h.brl(3500)}, jornada de 44 horas, 10 horas extras a 50% em um mês com 26 dias úteis e 4 domingos:</p><ul>
<li>Valor da hora: ${ex.cards[0].value}; hora extra a 50%: ${ex.cards[1].value}</li>
<li>10 horas a 50%: ${ex.sections[0].rows[0].value}</li>
<li>Reflexo no DSR: ${ex.sections[0].rows.find((r) => r?.label === 'Reflexo no DSR').value}</li>
<li><strong>Total: ${ex.hero.value}</strong></li></ul></div>`,
      },
      {
        id: 'regras',
        title: 'Regras importantes',
        html: `<ul><li><strong>Limite:</strong> no máximo 2 horas extras por dia (CLT, art. 59).</li>
<li><strong>DSR:</strong> horas extras habituais refletem no descanso semanal remunerado (Súmula 172 do TST e Lei 605/1949). Veja a ${h.link('dsr', 'calculadora de DSR')}.</li>
<li><strong>Banco de horas:</strong> as horas podem ser compensadas em vez de pagas, se houver acordo. Veja a ${h.link('banco-de-horas', 'calculadora de banco de horas')}.</li>
<li><strong>Integração:</strong> horas extras habituais entram na média das férias, do 13º e do aviso prévio.</li></ul>`,
      },
    ],
    faq: [
      { q: 'Hora extra no sábado é 50% ou 100%?', a: '<p>Depende. Para quem trabalha de segunda a sexta, o sábado costuma ser dia útil não trabalhado, e a hora extra é de 50% (ou o percentual da convenção). Domingos e feriados não compensados são pagos com 100%.</p>' },
      { q: 'Como lançar 10 horas e 30 minutos?', a: '<p>Digite 10:30 ou 10h30. Também é possível usar decimais: 10,5.</p>' },
      { q: 'Adicional noturno entra na hora extra noturna?', a: `<p>Sim. Para hora extra feita à noite, o adicional noturno integra a base de cálculo da hora extra. Para o adicional em si, use a ${h.link('adicional-noturno', 'calculadora de adicional noturno')}.</p>` },
    ],
    limitations: ['Usa o divisor padrão da jornada; algumas categorias têm divisores próprios por convenção ou decisão judicial.', 'O reflexo no DSR depende de as horas extras serem habituais.'],
  };
}
