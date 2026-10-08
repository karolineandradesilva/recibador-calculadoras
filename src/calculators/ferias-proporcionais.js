import { proportionalVacation } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { addDays, parseISO, vacationTwelfths, toISO } from '../lib/dates.js';
import { dateLabel } from '../lib/format.js';
import { brl, row, salaryField, variableField, val } from './_shared.js';

export const meta = {
  slug: 'ferias-proporcionais',
  category: 'trabalho',
  icon: 'sun',
  short: 'Férias proporcionais',
  h1: 'Calculadora de férias proporcionais',
  title: `Férias Proporcionais ${P.year}: calcule avos e valor com 1/3`,
  description: 'Calcule as férias proporcionais na saída da empresa: quantos avos você tem, o valor com o terço constitucional e quando há direito, conforme a CLT.',
  lead: 'Saiu (ou vai sair) da empresa antes de completar o período de férias? Descubra quantos avos você acumulou e quanto vai receber.',
  card: 'Avos acumulados e valor com 1/3 na rescisão.',
  keywords: ['ferias proporcionais', 'avos de ferias', 'rescisao ferias', 'ferias indenizadas'],
  related: ['rescisao-trabalhista', 'ferias', 'decimo-terceiro-proporcional', 'aviso-previo'],
  sources: ['clt', 'constitution'],
  legal: true,
};

const y = P.year;

export const ui = {
  fields: [
    salaryField(),
    { name: 'start', label: 'Início do período', type: 'date', default: `${y - 1}-11-03`, width: 'half', help: 'Data de admissão ou do último aniversário do contrato.' },
    { name: 'end', label: 'Último dia de trabalho', type: 'date', default: `${y}-08-20`, width: 'half', after: 'start', afterMessage: 'A saída deve ser igual ou posterior ao início do período aquisitivo.', maxSpanDays: 366 * 3, spanMessage: 'O período aquisitivo tem no máximo 12 meses. Informe o início do período atual, não a data de admissão antiga.' },
    {
      name: 'reason',
      label: 'Motivo da saída',
      type: 'select',
      default: 'dismissal',
      options: [
        { value: 'dismissal', label: 'Dispensa sem justa causa' },
        { value: 'resignation', label: 'Pedido de demissão' },
        { value: 'agreement', label: 'Acordo (art. 484-A)' },
        { value: 'contractEnd', label: 'Fim de contrato a prazo' },
        { value: 'cause', label: 'Dispensa por justa causa' },
      ],
    },
    {
      name: 'notice',
      label: 'Dias de aviso prévio indenizado',
      type: 'integer',
      default: 0,
      min: 0,
      max: 90,
      required: false,
      help: 'O aviso indenizado conta como tempo de serviço e pode somar um avo. Veja a calculadora de aviso prévio.',
      showIf: (v) => v.reason === 'dismissal' || v.reason === 'agreement',
    },
    variableField(),
  ],
  validate(v) {
    const a = parseISO(v.start);
    const b = parseISO(v.end);
    if (a && b && b < a) return { end: 'A data de saída deve ser posterior ao início do período.' };
    return null;
  },
  compute(v) {
    if (v.reason === 'cause') {
      return {
        hero: { label: 'Férias proporcionais', value: brl(0), tone: 'warn' },
        alert: { tone: 'warn', text: 'Na dispensa por justa causa não há direito a férias proporcionais (Súmula 171 do TST). Férias vencidas e não gozadas continuam devidas, com 1/3.' },
      };
    }
    const start = parseISO(v.start);
    let end = parseISO(v.end);
    const projected = (v.reason === 'dismissal' || v.reason === 'agreement') ? val(v.notice) : 0;
    end = addDays(end, projected);
    let tw = vacationTwelfths(start, end);
    const fullPeriod = tw >= 12;
    tw = Math.min(tw, 12);
    const r = proportionalVacation({ salary: v.salary, variableAverage: val(v.variable), twelfths: tw });
    return {
      hero: { label: 'Férias proporcionais + 1/3', value: brl(r.total), sub: `${tw}/12 avos — equivale a ${String(r.days).replace('.', ',')} dias` },
      alert: fullPeriod ? { tone: 'info', text: 'O período aquisitivo foi completado: esses 12 avos correspondem a férias vencidas (integrais), também devidas com 1/3.' } : null,
      sections: [
        {
          rows: [
            row(`Férias proporcionais (${tw}/12)`, r.value, 'plus'),
            row('1/3 constitucional', r.third, 'plus'),
            row('Total', r.total, 'total'),
          ],
        },
        {
          title: 'Período considerado',
          rows: [
            row('Início do período aquisitivo', dateLabel(v.start)),
            row(projected ? 'Fim com projeção do aviso' : 'Fim do período', dateLabel(toISO(end))),
          ],
        },
      ],
      notes: ['Férias pagas na rescisão são indenizadas: não há desconto de INSS nem de Imposto de Renda sobre elas.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'o-que-sao',
        title: 'O que são férias proporcionais',
        html: `<p>A cada 12 meses de trabalho (o <strong>período aquisitivo</strong>), o empregado ganha direito a 30 dias de férias. Se o contrato termina antes de completar esse período, ele recebe as <strong>férias proporcionais</strong>: 1/12 das férias para cada mês trabalhado, mais o terço constitucional.</p>
<p>Conta-se um avo por mês completo desde o início do período aquisitivo, e a fração final de 15 dias ou mais também vale um avo (CLT, art. 146, parágrafo único).</p>`,
      },
      {
        id: 'como-calcular',
        title: 'Como calcular',
        html: `<div class="formula">Avos = meses completos desde o início do período (+1 se sobrar 15 dias ou mais)
Férias proporcionais = (salário + médias) ÷ 12 × avos
Total = férias proporcionais + 1/3</div>
<div class="example"><p>Exemplo: salário de ${h.brl(3500)}, período aquisitivo iniciado em ${h.dateLabel(`${h.P.year - 1}-11-03`)} e saída em ${h.dateLabel(`${h.P.year}-08-20`)} — ${ex.hero.sub}. Valor com 1/3: <strong>${ex.hero.value}</strong>.</p></div>`,
      },
      {
        id: 'quem-tem-direito',
        title: 'Quem tem direito',
        html: `${h.table(['Motivo da saída', 'Férias proporcionais'], [
          ['Dispensa sem justa causa', 'Sim, com 1/3'],
          ['Pedido de demissão', 'Sim, com 1/3, mesmo com menos de 1 ano (Súmula 261 do TST)'],
          ['Acordo (art. 484-A)', 'Sim, com 1/3, integralmente'],
          ['Fim de contrato por prazo determinado', 'Sim, com 1/3'],
          ['Justa causa', 'Não (Súmula 171 do TST)'],
        ])}
<p>O aviso prévio indenizado integra o tempo de serviço (CLT, art. 487, §1º). Por isso, ao informar os dias de aviso, a calculadora projeta a data de saída e pode somar mais um avo. Para o cálculo completo da saída, use a ${h.link('rescisao-trabalhista', 'calculadora de rescisão')}.</p>`,
      },
    ],
    faq: [
      { q: 'Tem desconto de INSS e IR nas férias proporcionais?', a: '<p>Não. Férias indenizadas na rescisão (vencidas ou proporcionais, com o terço) não sofrem desconto de INSS nem de Imposto de Renda.</p>' },
      { q: 'Quem pede demissão com menos de 1 ano recebe férias proporcionais?', a: '<p>Sim. Segundo a Súmula 261 do TST, o empregado que se demite antes de completar 12 meses tem direito às férias proporcionais com 1/3.</p>' },
      { q: 'Como saber a data de início do período aquisitivo?', a: '<p>O primeiro período começa na data de admissão. Os seguintes começam no mesmo dia e mês da admissão, a cada ano. Por exemplo: admitido em 03/11/2022, o período atual começou em 03/11/2025.</p>' },
    ],
    limitations: [
      'Faltas injustificadas no período podem reduzir os dias de férias (CLT, art. 130); a calculadora considera o direito integral.',
      'Férias vencidas de períodos anteriores devem ser calculadas à parte (veja a calculadora de rescisão).',
    ],
  };
}
