import { workedHours } from '../calc/labor.js';
import { hoursLabel, num } from '../lib/format.js';
import { row, val } from './_shared.js';

export const meta = {
  slug: 'horas-trabalhadas',
  category: 'trabalho',
  icon: 'clock',
  short: 'Horas trabalhadas',
  h1: 'Calculadora de horas trabalhadas',
  title: 'Calculadora de Horas Trabalhadas: entrada, almoço e saída',
  description: 'Some as horas trabalhadas no dia a partir dos horários de entrada, intervalo e saída, compare com a jornada contratada e projete o total da semana e do mês.',
  lead: 'Informe os horários do ponto e veja as horas trabalhadas no dia, o saldo em relação à jornada e a projeção da semana e do mês.',
  card: 'Some o ponto do dia e veja extras ou faltas.',
  keywords: ['horas trabalhadas', 'calcular horas', 'ponto', 'jornada', 'entrada saida', 'somar horas'],
  related: ['banco-de-horas', 'hora-extra', 'adicional-noturno', 'dias-uteis'],
  sources: ['clt'],
  legal: false,
  share: true,
};

export const ui = {
  fields: [
    { name: 'in1', label: 'Entrada', type: 'time', default: '08:00', width: 'half' },
    { name: 'out1', label: 'Saída para intervalo', type: 'time', default: '12:00', width: 'half', required: false },
    { name: 'in2', label: 'Volta do intervalo', type: 'time', default: '13:00', width: 'half', required: false },
    { name: 'out2', label: 'Saída', type: 'time', default: '17:48', width: 'half' },
    { name: 'journey', label: 'Jornada diária contratada', type: 'hours', default: '8:48', width: 'half', help: '44h semanais em 5 dias = 8h48.' },
    { name: 'days', label: 'Dias por semana', type: 'integer', default: 5, min: 1, max: 7, width: 'half' },
  ],
  validate(v) {
    const hasBreak = Number.isFinite(v.out1) || Number.isFinite(v.in2);
    if (hasBreak && !(Number.isFinite(v.out1) && Number.isFinite(v.in2))) return { in2: 'Preencha a saída e a volta do intervalo (ou deixe os dois vazios).' };
    if (v.in1 === v.out2) return { out2: 'A saída deve ser diferente da entrada.' };
    if (hasBreak) {
      // Positions inside the shift, measured from the entry (handles overnight shifts).
      const pos = (t) => (t - v.in1 + 24) % 24;
      const shift = pos(v.out2);
      if (!(pos(v.out1) > 0 && pos(v.out1) < pos(v.in2) && pos(v.in2) < shift)) return { in2: 'O intervalo precisa estar entre a entrada e a saída, com a volta depois da saída para o intervalo.' };
    }
    return null;
  },
  compute(v) {
    const hasBreak = Number.isFinite(v.out1) && Number.isFinite(v.in2);
    const periods = hasBreak ? [[v.in1, v.out1], [v.in2, v.out2]] : [[v.in1, v.out2]];
    const total = workedHours(periods);
    const breakTime = hasBreak ? workedHours([[v.out1, v.in2]]) : 0;
    const diff = total - val(v.journey);
    const notes = [];
    if (total > 6 && breakTime < 1) notes.push('Jornadas acima de 6 horas exigem intervalo mínimo de 1 hora (CLT, art. 71).');
    if (total > 4 && total <= 6 && breakTime < 0.25) notes.push('Jornadas entre 4 e 6 horas exigem intervalo de 15 minutos.');
    if (total > 10) notes.push('A jornada ultrapassou 10 horas, o limite com horas extras (8 + 2) da CLT.');
    return {
      hero: { label: 'Horas trabalhadas no dia', value: hoursLabel(total), tone: 'neutral', sub: hasBreak ? `Intervalo de ${hoursLabel(breakTime)}` : 'Sem intervalo' },
      cards: [
        { label: diff >= 0 ? 'Horas a mais no dia' : 'Horas a menos no dia', value: hoursLabel(Math.abs(diff)), tone: diff > 0 ? 'plus' : diff < 0 ? 'minus' : undefined },
        { label: 'Projeção na semana', value: hoursLabel(total * v.days), sub: `${v.days} dias` },
        { label: 'Projeção no mês', value: hoursLabel((total * v.days * 30) / 7), sub: 'Média de 4,29 semanas' },
      ],
      sections: [
        {
          rows: [
            row('Horas trabalhadas', `${hoursLabel(total)} (${num(total, 2)} h)`),
            row('Jornada contratada', hoursLabel(val(v.journey))),
            row('Saldo do dia', `${diff >= 0 ? '+' : '−'}${hoursLabel(Math.abs(diff))}`, 'total'),
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
        html: `<p>Digite os horários como aparecem no ponto: entrada, saída para o almoço, volta e saída. Se não houve intervalo, deixe os dois campos do meio vazios. Turnos que passam da meia-noite (por exemplo, das 22h às 5h) são calculados corretamente.</p>
<div class="example"><p>Entrada às 8h, almoço das 12h às 13h e saída às 17h48: <strong>${ex.hero.value}</strong> trabalhadas, exatamente a jornada de 44 horas semanais distribuídas em 5 dias.</p></div>`,
      },
      {
        id: 'como-somar-horas',
        title: 'Como somar horas sem errar',
        html: `<p>Horas não seguem a base 10: 60 minutos formam uma hora. Por isso, 8h30 + 1h45 = 10h15, e não 9h75. A calculadora converte tudo para minutos, soma e converte de volta.</p>
<div class="formula">Horas do dia = (saída do intervalo − entrada) + (saída − volta do intervalo)
Decimal: 8h30 = 8,5 horas · 8h48 = 8,8 horas</div>
<p>Para transformar o saldo em dinheiro, use a ${h.link('hora-extra', 'calculadora de hora extra')} ou a ${h.link('banco-de-horas', 'de banco de horas')}.</p>`,
      },
      {
        id: 'regras',
        title: 'Regras da jornada na CLT',
        html: '<ul><li>Jornada normal de até 8 horas por dia e 44 horas por semana (Constituição, art. 7º, XIII).</li><li>Até 2 horas extras por dia (CLT, art. 59).</li><li>Intervalo de 1 a 2 horas para jornadas acima de 6 horas e de 15 minutos para jornadas entre 4 e 6 horas (art. 71).</li><li>Descanso de 11 horas entre uma jornada e outra (art. 66).</li><li>Variações de até 5 minutos na marcação do ponto, limitadas a 10 minutos por dia, não são computadas (art. 58, §1º).</li></ul>',
      },
    ],
    faq: [
      { q: 'Quanto é 8h48 em decimal?', a: '<p>8,8 horas (48 ÷ 60 = 0,8).</p>' },
      { q: 'O intervalo de almoço conta como hora trabalhada?', a: '<p>Não. O intervalo para repouso e alimentação não é computado na jornada (CLT, art. 71, §2º).</p>' },
    ],
    limitations: ['Calcula um dia por vez; a projeção semanal e mensal assume dias iguais.', 'Não aplica a tolerância de 5 minutos do art. 58 da CLT.'],
  };
}
