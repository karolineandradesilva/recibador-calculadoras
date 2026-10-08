import { CURRENT as P } from '../data/params/index.js';
import { hoursLabel } from '../lib/format.js';
import { brl, row, salaryField, val, frac } from './_shared.js';

export const meta = {
  slug: 'banco-de-horas',
  category: 'trabalho',
  icon: 'clock',
  short: 'Banco de horas',
  h1: 'Calculadora de banco de horas',
  title: `Banco de Horas ${P.year}: saldo e valor se for pago como extra`,
  description: 'Some créditos e débitos do banco de horas, veja o saldo final e quanto ele vale em dinheiro se não for compensado no prazo e precisar ser pago como hora extra.',
  lead: 'Lance as horas a mais e a menos, veja o saldo e quanto ele vale se precisar ser pago como hora extra.',
  card: 'Saldo de horas e valor se for pago como extra.',
  keywords: ['banco de horas', 'saldo de horas', 'compensacao de horas', 'horas negativas', 'credito de horas'],
  related: ['hora-extra', 'horas-trabalhadas', 'salario-por-hora', 'dsr'],
  sources: ['clt'],
  legal: true,
};

export const ui = {
  fields: [
    { name: 'credit', label: 'Horas a mais (crédito)', type: 'hours', default: '18:40', width: 'half', help: 'Total de horas trabalhadas além da jornada.' },
    { name: 'debit', label: 'Horas a menos (débito)', type: 'hours', default: '6:15', required: false, width: 'half', help: 'Saídas antecipadas, folgas compensadas etc.' },
    salaryField({ label: 'Salário mensal' }),
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
      ],
      width: 'half',
    },
    { name: 'rate', label: 'Adicional de hora extra', type: 'percent', default: 50, min: 50, max: 300, width: 'half' },
  ],
  compute(v) {
    const balance = v.credit - val(v.debit);
    const hourly = v.salary / v.divisor;
    const asOvertime = Math.max(0, balance) * hourly * (1 + frac(v.rate));
    const positive = balance >= 0;
    return {
      hero: {
        label: 'Saldo do banco de horas',
        value: hoursLabel(balance),
        tone: positive ? undefined : 'warn',
        sub: positive ? 'Horas a seu favor' : 'Horas que você deve à empresa',
      },
      cards: positive
        ? [
            { label: 'Se pago como hora extra', value: brl(asOvertime), tone: 'plus' },
            { label: 'Equivale a', value: `${(balance / (v.divisor / 30)).toFixed(1).replace('.', ',')} dias`, sub: 'de jornada média' },
          ]
        : [{ label: 'Valor das horas negativas', value: brl(Math.abs(balance) * hourly), tone: 'minus', sub: 'Pela hora normal, sem adicional' }],
      sections: [
        {
          rows: [
            row('Créditos', hoursLabel(v.credit)),
            row('Débitos', hoursLabel(val(v.debit))),
            row('Saldo', hoursLabel(balance), 'total'),
            row('Valor da hora normal', hourly, 'muted'),
          ],
        },
      ],
      notes: [
        'Saldo positivo não compensado no prazo do acordo deve ser pago como hora extra (CLT, art. 59, §3º).',
        'Na rescisão, o saldo positivo é pago; o saldo negativo, em regra, só pode ser descontado se houver previsão no acordo.',
      ],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-funciona',
        title: 'Como funciona o banco de horas',
        html: `<p>No banco de horas, as horas trabalhadas além da jornada não são pagas como extras: elas viram crédito para serem compensadas com folgas ou saídas antecipadas. O art. 59 da CLT prevê três modalidades:</p>
${h.table(['Modalidade', 'Prazo para compensar'], [['Acordo individual escrito', 'até 6 meses'], ['Acordo ou convenção coletiva', 'até 1 ano'], ['Acordo tácito ou escrito, para compensação no mesmo mês', 'dentro do mês']])}
<p>Se o prazo terminar com saldo positivo, as horas devem ser pagas como extras, com o adicional de pelo menos 50%.</p>`,
      },
      {
        id: 'como-calcular',
        title: 'Como calcular o saldo',
        html: `<div class="formula">Saldo = horas a mais − horas a menos
Valor do saldo = saldo × (salário ÷ divisor) × (1 + adicional)</div>
<div class="example"><p>Com 18h40 de crédito e 6h15 de débito, o saldo é de <strong>${ex.hero.value}</strong>. Com salário de ${h.brl(3500)} e adicional de 50%, ele vale ${ex.cards[0].value} se for pago como hora extra.</p></div>
<p>Lance horas e minutos no formato 08:30 ou 8h30. Para somar as horas de cada dia de trabalho, use a ${h.link('horas-trabalhadas', 'calculadora de horas trabalhadas')}.</p>`,
      },
    ],
    faq: [
      { q: 'A empresa pode descontar horas negativas na rescisão?', a: '<p>Depende do que prevê o acordo de banco de horas. Sem previsão expressa, a jurisprudência costuma impedir o desconto, porque o risco da atividade é do empregador.</p>' },
      { q: 'Hora no banco vale 1 por 1?', a: '<p>Em regra, sim, mas convenções coletivas podem prever que cada hora extra valha mais de uma hora de folga (por exemplo, 1h30 para cada hora trabalhada em domingo).</p>' },
    ],
    limitations: ['Não verifica o limite diário de 10 horas de jornada nem o prazo de compensação do seu acordo.'],
  };
}
