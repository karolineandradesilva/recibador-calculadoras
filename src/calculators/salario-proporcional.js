import { netSalary } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, salaryField, dependentsField, val } from './_shared.js';

export const meta = {
  slug: 'salario-proporcional',
  category: 'trabalho',
  icon: 'calendar',
  short: 'Salário por dia (proporcional)',
  h1: 'Calculadora de salário proporcional aos dias trabalhados',
  title: `Salário Proporcional ${P.year}: salário por dia trabalhado`,
  description: 'Calcule o salário proporcional aos dias trabalhados no mês de admissão, de saída ou com faltas, com o valor bruto por dia e o líquido estimado.',
  lead: 'Entrou ou saiu no meio do mês? Teve faltas? Calcule o salário proporcional aos dias trabalhados.',
  card: 'Salário dos dias trabalhados na admissão, saída ou faltas.',
  keywords: ['salario proporcional', 'salario por dia', 'dias trabalhados', 'saldo de salario', 'faltas'],
  related: ['salario-por-hora', 'salario-liquido', 'rescisao-trabalhista', 'dsr'],
  sources: ['clt', 'inss', 'irrf'],
  legal: true,
};

export const ui = {
  fields: [
    salaryField(),
    { name: 'days', label: 'Dias a receber no mês', type: 'integer', default: 18, min: 0, max: 31, width: 'half', help: 'Dias corridos de contrato no mês (sábados, domingos e feriados incluídos).' },
    { name: 'absences', label: 'Faltas injustificadas', type: 'integer', default: 0, min: 0, max: 31, width: 'half', required: false },
    { name: 'dsrLost', label: 'Descansos semanais perdidos', type: 'integer', default: 0, min: 0, max: 5, required: false, advanced: true, width: 'half', help: 'Falta injustificada na semana pode fazer perder o DSR (Lei 605/1949).' },
    dependentsField({ advanced: true }),
  ],
  validate(v) {
    if (val(v.absences) + val(v.dsrLost) > v.days) return { absences: 'As faltas não podem superar os dias do mês.' };
    return null;
  },
  compute(v) {
    const daily = v.salary / 30;
    const paidDays = Math.min(30, v.days) - val(v.absences) - val(v.dsrLost);
    const gross = Math.max(0, daily * paidDays);
    const net = netSalary({ gross, dependents: val(v.dependents) });
    return {
      hero: { label: 'Salário proporcional bruto', value: brl(gross), sub: `${paidDays} de 30 dias` },
      cards: [
        { label: 'Valor do dia', value: brl(daily) },
        { label: 'Líquido estimado', value: brl(net.net), tone: 'plus', sub: 'Após INSS e IR' },
      ],
      sections: [
        {
          rows: [
            row(`Salário de ${Math.min(30, v.days)} dias`, daily * Math.min(30, v.days), 'plus'),
            val(v.absences) ? row(`Faltas (${v.absences})`, daily * v.absences, 'minus') : null,
            val(v.dsrLost) ? row(`DSR perdido (${v.dsrLost})`, daily * v.dsrLost, 'minus') : null,
            row('Bruto proporcional', gross, 'strong'),
            row('INSS', net.inss.value, 'minus'),
            row('IRRF', net.irrf.value, 'minus'),
            row('Líquido estimado', net.net, 'total'),
          ],
        },
      ],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-calcular',
        title: 'Como calcular o salário proporcional',
        html: `<p>Para o empregado mensalista, a CLT considera o mês comercial de <strong>30 dias</strong>, independentemente de o mês ter 28, 29 ou 31 dias. O salário do dia é o salário mensal dividido por 30, e o proporcional é esse valor multiplicado pelos dias de contrato no mês.</p>
<div class="formula">Valor do dia = salário ÷ 30
Proporcional = valor do dia × (dias no mês − faltas − DSR perdidos)</div>
<div class="example"><p>Admissão no dia 13 de um mês de 30 dias: 18 dias a receber. Com salário de ${h.brl(3500)}, o proporcional é de <strong>${ex.hero.value}</strong> (dia de ${ex.cards[0].value}).</p></div>`,
      },
      {
        id: 'quando-usar',
        title: 'Quando usar',
        html: `<ul><li><strong>Mês de admissão:</strong> conte do dia da admissão até o fim do mês, incluindo fins de semana.</li>
<li><strong>Mês de saída:</strong> o saldo de salário vai até o último dia trabalhado. Para a rescisão completa, use a ${h.link('rescisao-trabalhista', 'calculadora de rescisão')}.</li>
<li><strong>Faltas injustificadas:</strong> cada falta desconta um dia. Se a falta acontecer na semana, a empresa também pode descontar o descanso semanal remunerado daquela semana.</li></ul>`,
      },
    ],
    faq: [
      { q: 'No mês de 31 dias, quem trabalhou o mês todo recebe 31 dias?', a: '<p>Não. O mensalista recebe o salário integral (30 dias comerciais), seja o mês de 28 ou de 31 dias.</p>' },
      { q: 'Quem entra no dia 1º de fevereiro recebe proporcional?', a: '<p>Não. Trabalhando o mês inteiro, recebe o salário integral, mesmo que fevereiro tenha 28 dias.</p>' },
    ],
    limitations: ['O líquido é estimado como se o proporcional fosse o único rendimento do mês.', 'Para quem recebe por hora (horista), o cálculo é feito pelas horas trabalhadas mais o DSR.'],
  };
}
