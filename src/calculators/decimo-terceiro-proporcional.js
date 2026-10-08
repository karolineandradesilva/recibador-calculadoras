import { thirteenth } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { parseISO, thirteenthTwelfths, daysInMonth, diffDays } from '../lib/dates.js';
import { brl, row, inssHint, irrfHint, salaryField, dependentsField, variableField, val, MONTH_OPTIONS } from './_shared.js';

export const meta = {
  slug: 'decimo-terceiro-proporcional',
  category: 'trabalho',
  icon: 'gift',
  short: '13º proporcional',
  h1: 'Calculadora de 13º salário proporcional',
  title: `13º Proporcional ${P.year}: avos pela data de admissão ou saída`,
  description: 'Calcule o 13º salário proporcional a partir da data de admissão ou de saída: avos mês a mês pela regra dos 15 dias, valor bruto, INSS, IR e líquido.',
  lead: 'Informe quando começou (ou terminou) o trabalho no ano e veja quantos avos de 13º você tem, mês a mês.',
  card: 'Avos pela regra dos 15 dias e valor líquido.',
  keywords: ['13 proporcional', 'decimo terceiro proporcional', 'avos', 'admissao', 'demissao'],
  related: ['decimo-terceiro', 'rescisao-trabalhista', 'ferias-proporcionais', 'aviso-previo'],
  sources: ['thirteenth', 'inss', 'irrf', 'irrfReduction'],
  legal: true,
};

const y = P.year;

export const ui = {
  fields: [
    salaryField(),
    { name: 'start', label: 'Data de início no ano', type: 'date', default: `${y}-03-17`, width: 'half', help: 'Data de admissão, ou 01/01 se já trabalhava antes.' },
    { name: 'end', label: 'Data final', type: 'date', default: `${y}-12-31`, width: 'half', help: 'Último dia trabalhado (com aviso indenizado) ou 31/12.', after: 'start', sameYear: true, afterMessage: 'A data final deve ser igual ou posterior à data de início.' },
    dependentsField(),
    variableField(),
  ],
  validate(v) {
    const a = parseISO(v.start);
    const b = parseISO(v.end);
    if (!a || !b) return null;
    if (b < a) return { end: 'A data final deve ser posterior à data de início.' };
    if (a.getUTCFullYear() !== b.getUTCFullYear()) return { end: 'As duas datas devem estar no mesmo ano.' };
    return null;
  },
  compute(v) {
    const a = parseISO(v.start);
    const b = parseISO(v.end);
    const year = a.getUTCFullYear();
    const tw = thirteenthTwelfths(year, a, b);
    const r = thirteenth({ salary: v.salary, variableAverage: val(v.variable), twelfths: tw, dependents: val(v.dependents) });
    const months = [];
    for (let m = 0; m < 12; m += 1) {
      const first = new Date(Date.UTC(year, m, 1));
      const last = new Date(Date.UTC(year, m, daysInMonth(year, m)));
      const from = a > first ? a : first;
      const to = b < last ? b : last;
      const days = to < from ? 0 : diffDays(from, to) + 1;
      if (days > 0) months.push([MONTH_OPTIONS[m].label, String(days), days >= 15 ? 'Conta' : 'Não conta']);
    }
    return {
      hero: { label: '13º proporcional líquido', value: brl(r.net), sub: `${tw}/12 avos — bruto de ${brl(r.gross)}` },
      sections: [
        {
          rows: [
            row(`13º bruto (${tw}/12)`, r.gross, 'plus'),
            row('INSS', r.inss.value, 'minus', inssHint(r.inss)),
            row('IRRF', r.irrf.value, 'minus', irrfHint(r.irrf)),
            row('13º líquido', r.net, 'total'),
          ],
        },
      ],
      table: { caption: 'Avos mês a mês', columns: ['Mês', 'Dias trabalhados', 'Avo'], rows: months, open: true },
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'regra-dos-15-dias',
        title: 'A regra dos 15 dias',
        html: `<p>O 13º proporcional é pago a quem não trabalhou o ano inteiro: quem foi admitido durante o ano, quem saiu da empresa (exceto por justa causa) ou quem teve o contrato encerrado. Para cada mês do ano em que trabalhou <strong>15 dias ou mais</strong>, o empregado ganha 1/12 do 13º (Lei 4.090/1962, art. 1º, §2º).</p>
<p>A contagem é feita por mês do calendário, e não por períodos de 30 dias. Quem foi admitido em 17 de março trabalhou 15 dias em março (17 a 31), então março conta. Admitido em 18 de março, são só 14 dias e março não conta.</p>`,
      },
      {
        id: 'como-calcular',
        title: 'Como calcular',
        html: `<div class="formula">13º proporcional = (salário + médias) ÷ 12 × avos
Líquido = 13º proporcional − INSS − IRRF</div>
<div class="example"><p>Exemplo: admissão em ${h.dateLabel(`${h.P.year}-03-17`)}, salário de ${h.brl(3500)}. São ${ex.hero.sub}. Líquido: <strong>${ex.hero.value}</strong>.</p></div>`,
      },
      {
        id: 'quando-recebe',
        title: 'Quando o 13º proporcional é pago',
        html: `<ul><li><strong>Admitido no ano:</strong> recebe nas datas normais (1ª parcela até 30/11 e 2ª até 20/12), já proporcional.</li>
<li><strong>Saída da empresa:</strong> recebe junto com a rescisão. Se a dispensa foi sem justa causa com aviso indenizado, os dias do aviso contam para os avos — some-os à data final. A ${h.link('aviso-previo', 'calculadora de aviso prévio')} mostra a data projetada.</li>
<li><strong>Justa causa:</strong> não há direito ao 13º proporcional (Lei 4.090/1962, art. 3º).</li></ul>`,
      },
    ],
    faq: [
      { q: 'Quem trabalhou só 1 mês recebe 13º?', a: '<p>Sim. Se trabalhou 15 dias ou mais naquele mês, recebe 1/12 do 13º.</p>' },
      { q: 'O aviso prévio indenizado conta para o 13º?', a: '<p>Sim. O aviso prévio, mesmo indenizado, integra o tempo de serviço (CLT, art. 487, §1º) e pode acrescentar avos ao 13º e às férias proporcionais.</p>' },
    ],
    limitations: ['As duas datas devem estar no mesmo ano; para períodos que atravessam o ano, calcule cada ano separadamente.', 'Faltas injustificadas que reduzam um mês a menos de 15 dias trabalhados devem ser descontadas manualmente das datas.'],
  };
}
