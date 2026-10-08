import { CURRENT as P } from '../data/params/index.js';
import { brl, row, salaryField } from './_shared.js';
import { num } from '../lib/format.js';

export const meta = {
  slug: 'salario-por-hora',
  category: 'trabalho',
  icon: 'clock',
  short: 'Salário por hora',
  h1: 'Calculadora de salário por hora',
  title: `Salário por Hora ${P.year}: valor da hora, do dia e do minuto`,
  description: 'Descubra quanto vale a sua hora de trabalho a partir do salário mensal e da jornada semanal, usando o divisor da CLT, além do valor por dia e por minuto.',
  lead: 'Converta o salário mensal em valor por hora, por dia e por minuto, com o divisor correto para a sua jornada.',
  card: 'Valor da hora, do dia e do minuto de trabalho.',
  keywords: ['valor da hora', 'salario hora', 'quanto ganho por hora', 'divisor 220', 'salario por dia'],
  related: ['hora-extra', 'salario-proporcional', 'adicional-noturno', 'valor-hora-freelancer'],
  sources: ['clt'],
  legal: false,
};

export const ui = {
  fields: [
    salaryField({ label: 'Salário mensal' }),
    { name: 'weekly', label: 'Horas por semana', type: 'number', default: 44, min: 1, max: 60, width: 'half', help: 'Jornada contratual (44 é o máximo da CLT).' },
    { name: 'days', label: 'Dias trabalhados por semana', type: 'integer', default: 5, min: 1, max: 7, width: 'half' },
  ],
  compute(v) {
    const divisor = v.weekly * 5;
    const hourly = v.salary / divisor;
    const daily = v.salary / 30;
    const workday = (v.weekly / v.days) * hourly;
    return {
      hero: { label: 'Valor da sua hora', value: brl(hourly), sub: `Divisor ${num(divisor, divisor % 1 ? 1 : 0)} (jornada de ${num(v.weekly, v.weekly % 1 ? 1 : 0)}h semanais × 5)` },
      cards: [
        { label: 'Por dia (salário ÷ 30)', value: brl(daily) },
        { label: 'Por dia de trabalho', value: brl(workday), sub: `${num(v.weekly / v.days, 1)}h por dia` },
        { label: 'Por minuto', value: brl(hourly / 60) },
      ],
      sections: [
        {
          rows: [
            row('Salário mensal', v.salary),
            row('Horas mensais (divisor)', `${num(divisor, divisor % 1 ? 1 : 0)} horas`),
            row('Valor da hora', hourly, 'total'),
            row('Hora extra a 50%', hourly * 1.5, 'muted'),
            row('Hora extra a 100%', hourly * 2, 'muted'),
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
        title: 'Como calcular o valor da hora',
        html: `<p>Na CLT, o valor da hora é obtido dividindo o salário mensal pelo <strong>divisor</strong> da jornada. O divisor representa as horas pagas em um mês, incluindo o descanso semanal remunerado, e é calculado multiplicando a jornada semanal por 5.</p>
<div class="formula">Divisor = horas semanais × 5
Valor da hora = salário mensal ÷ divisor
Valor do dia = salário mensal ÷ 30</div>
${h.table(['Jornada semanal', 'Divisor'], [['44 horas', '220'], ['40 horas', '200'], ['36 horas', '180'], ['30 horas', '150'], ['20 horas', '100']])}
<div class="example"><p>Salário de ${h.brl(3500)} e jornada de 44 horas: ${h.brl(3500)} ÷ 220 = <strong>${ex.hero.value}</strong> por hora.</p></div>`,
      },
      {
        id: 'por-que-5',
        title: 'Por que multiplicar por 5?',
        html: '<p>Um mês tem, em média, 4,2857 semanas (30 ÷ 7). Multiplicando por 44 horas, chega-se a cerca de 188,6 horas trabalhadas. Somando o descanso semanal remunerado (um dia de descanso a cada seis trabalhados, que equivale a 1/6 das horas), o total fica em 220 horas. O fator 5 é um atalho para essa conta, consolidado pela jurisprudência (Súmula 431 do TST).</p>',
      },
      {
        id: 'usos',
        title: 'Para que serve',
        html: `<ul><li>Base para ${h.link('hora-extra', 'horas extras')}, ${h.link('adicional-noturno', 'adicional noturno')} e faltas.</li><li>Comparar propostas com jornadas diferentes.</li><li>Para trabalho autônomo, use a ${h.link('valor-hora-freelancer', 'calculadora de valor da hora para freelancer')}, que considera impostos, custos e férias.</li></ul>`,
      },
    ],
    faq: [
      { q: 'Quanto vale a hora de quem ganha um salário mínimo?', a: `<p>Com jornada de 44 horas, ${h.brl(h.P.minimumWage)} ÷ 220 = ${h.brl(h.P.minimumWage / 220)} por hora.</p>` },
      { q: 'O divisor de quem trabalha 40 horas é 200?', a: '<p>Sim. Para jornadas de 40 horas semanais, a Súmula 431 do TST fixa o divisor 200.</p>' },
    ],
    limitations: ['Algumas categorias têm divisores próprios definidos em convenção coletiva.'],
  };
}
