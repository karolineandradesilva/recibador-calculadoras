import { dsr } from '../calc/labor.js';
import { businessDays } from '../calc/everyday.js';
import { CURRENT as P } from '../data/params/index.js';
import { daysInMonth } from '../lib/dates.js';
import { brl, row, MONTH_OPTIONS } from './_shared.js';

export const meta = {
  slug: 'dsr',
  category: 'trabalho',
  icon: 'calendar',
  short: 'DSR (descanso semanal remunerado)',
  h1: 'Calculadora de DSR sobre horas extras e comissões',
  title: `Calculadora de DSR ${P.year}: reflexo de horas extras e comissões`,
  description: 'Calcule o DSR (descanso semanal remunerado) sobre horas extras, comissões e adicionais, com os dias úteis e os domingos e feriados de qualquer mês.',
  lead: 'Escolha o mês e informe o valor variável (horas extras, comissões, adicional noturno) para calcular o reflexo no descanso semanal remunerado.',
  card: 'Reflexo de extras e comissões no descanso semanal.',
  keywords: ['dsr', 'descanso semanal remunerado', 'reflexo dsr', 'dsr horas extras', 'dsr comissao'],
  related: ['hora-extra', 'comissao', 'adicional-noturno', 'dias-uteis'],
  sources: ['clt'],
  extraSources: [{ label: 'Lei nº 605/1949 — repouso semanal remunerado', url: 'https://www.planalto.gov.br/ccivil_03/leis/l0605.htm' }],
  legal: true,
};

function monthDays(year, month) {
  const last = daysInMonth(year, month - 1);
  const mm = String(month).padStart(2, '0');
  const r = businessDays({ start: `${year}-${mm}-01`, end: `${year}-${mm}-${last}`, saturdays: true });
  return { working: r.business, rest: last - r.business };
}

const now = new Date();

export const ui = {
  fields: [
    { name: 'variable', label: 'Total variável do mês', type: 'money', default: 600, min: 0.01, help: 'Soma das horas extras, comissões ou adicionais variáveis.' },
    { name: 'month', label: 'Mês', type: 'select', numeric: true, default: 9, options: MONTH_OPTIONS, width: 'half' },
    { name: 'year', label: 'Ano', type: 'integer', default: P.year, min: 2000, max: 2100, width: 'half' },
    { name: 'manual', label: 'Informar dias manualmente', type: 'checkbox', default: false, advanced: true },
    { name: 'working', label: 'Dias úteis', type: 'integer', default: 25, min: 1, max: 31, advanced: true, width: 'half', showIf: (v) => v.manual },
    { name: 'rest', label: 'Domingos e feriados', type: 'integer', default: 5, min: 0, max: 31, advanced: true, width: 'half', showIf: (v) => v.manual },
  ],
  compute(v) {
    const days = v.manual ? { working: v.working, rest: v.rest } : monthDays(v.year, v.month);
    const value = dsr({ variable: v.variable, workingDays: days.working, restDays: days.rest });
    return {
      hero: { label: 'DSR a receber', value: brl(value), sub: `${days.working} dias úteis e ${days.rest} domingos e feriados` },
      sections: [
        {
          rows: [
            row('Valor variável do mês', v.variable),
            row('Dias úteis (segunda a sábado)', String(days.working)),
            row('Domingos e feriados', String(days.rest)),
            row('DSR', value, 'total', 'Variável ÷ dias úteis × domingos e feriados'),
            row('Total com DSR', v.variable + value, 'strong'),
          ],
        },
      ],
      notes: v.manual ? [] : ['Feriados considerados: somente nacionais. Inclua feriados estaduais e municipais informando os dias manualmente.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'o-que-e',
        title: 'O que é o DSR',
        html: `<p>O descanso semanal remunerado é o dia de folga pago, preferencialmente aos domingos, garantido pela Lei 605/1949. Para quem recebe salário fixo mensal, o DSR já está embutido no salário. Mas quando há <strong>remuneração variável</strong> — horas extras, comissões, adicional noturno habitual —, ela também precisa refletir nos dias de descanso.</p>`,
      },
      {
        id: 'como-calcular',
        title: 'Como calcular o reflexo no DSR',
        html: `<div class="formula">DSR = (valor variável do mês ÷ dias úteis) × domingos e feriados</div>
<p>Para esse cálculo, o sábado é considerado <strong>dia útil</strong> (ainda que não trabalhado), e entram como dias de descanso os domingos e os feriados do mês.</p>
<div class="example"><p>Variável de ${h.brl(600)} em setembro de ${h.P.year}: ${ex.hero.sub}. DSR = <strong>${ex.hero.value}</strong>.</p></div>`,
      },
      {
        id: 'quem-tem-direito',
        title: 'Quem tem direito',
        html: `<ul><li>Quem faz <strong>horas extras habituais</strong> (Súmula 172 do TST). Veja a ${h.link('hora-extra', 'calculadora de hora extra')}.</li>
<li><strong>Comissionistas</strong>, puros ou mistos (Súmula 27 do TST). Veja a ${h.link('comissao', 'calculadora de comissão')}.</li>
<li>Quem recebe adicional noturno ou outros adicionais variáveis de forma habitual.</li></ul>
<p>Faltas injustificadas na semana podem fazer o empregado perder o DSR daquela semana.</p>`,
      },
    ],
    faq: [
      { q: 'Sábado conta como dia útil para o DSR?', a: '<p>Sim. Para o cálculo do reflexo, os dias úteis são de segunda a sábado, mesmo para quem não trabalha aos sábados.</p>' },
      { q: 'O DSR sobre horas extras integra férias e 13º?', a: '<p>Sim. Desde a OJ 394 da SDI-1 do TST, revista em 2023 (IRR 10169-57.2013.5.05.0024), o aumento do DSR pelas horas extras repercute nas demais verbas para fatos a partir de 20/03/2023.</p>' },
    ],
    limitations: ['Considera apenas feriados nacionais. Feriados estaduais e municipais podem ser incluídos pelo modo manual.'],
  };
}
