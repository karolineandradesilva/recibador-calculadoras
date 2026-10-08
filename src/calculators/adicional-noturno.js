import { nightPremium } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { hoursLabel, num } from '../lib/format.js';
import { brl, row, salaryField, frac } from './_shared.js';

export const meta = {
  slug: 'adicional-noturno',
  category: 'trabalho',
  icon: 'moon',
  short: 'Adicional noturno',
  h1: 'Calculadora de adicional noturno',
  title: `Adicional Noturno ${P.year}: 20% e hora noturna reduzida`,
  description: 'Calcule o adicional noturno de 20% (urbano) ou 25% (rural), já considerando a hora noturna reduzida de 52 minutos e 30 segundos prevista na CLT.',
  lead: 'Trabalha entre 22h e 5h? Calcule o adicional noturno do mês, com a hora reduzida que transforma 7 horas de relógio em 8 horas pagas.',
  card: '20% sobre as horas entre 22h e 5h, com hora reduzida.',
  keywords: ['adicional noturno', 'hora noturna', 'trabalho noturno', '22h as 5h', '52 minutos'],
  related: ['hora-extra', 'salario-por-hora', 'dsr', 'salario-liquido'],
  sources: ['clt'],
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
        { value: 210, label: '12x36 (divisor 210)' },
      ],
      width: 'half',
    },
    { name: 'hours', label: 'Horas noturnas no mês', type: 'hours', default: '140:00', min: 0.01, max: 217, width: 'half', help: 'Horas reais trabalhadas entre 22h e 5h (no máximo 7 por dia).' },
    {
      name: 'type',
      label: 'Tipo de trabalho',
      type: 'radio',
      default: 'urban',
      options: [
        { value: 'urban', label: 'Urbano (20%)' },
        { value: 'rural', label: 'Rural (25%)' },
      ],
    },
    { name: 'rate', label: 'Percentual da convenção', type: 'percent', required: false, min: 0, max: 200, advanced: true, help: 'Preencha se a sua convenção coletiva prevê adicional maior.' },
  ],
  compute(v) {
    const rural = v.type === 'rural';
    const r = nightPremium({
      salary: v.salary,
      monthlyHours: v.divisor,
      clockHours: v.hours,
      rural,
      rate: Number.isFinite(v.rate) ? frac(v.rate) : undefined,
    });
    return {
      hero: { label: 'Adicional noturno no mês', value: brl(r.premium), sub: `${num(r.premiumRate * 100, 0)}% sobre ${hoursLabel(r.paidHours)} pagas` },
      cards: [
        { label: 'Valor da hora normal', value: brl(r.hourly) },
        { label: 'Adicional por hora', value: brl(r.perHour) },
        { label: 'Horas pagas', value: hoursLabel(r.paidHours), sub: rural ? 'Hora de 60 minutos' : `${hoursLabel(r.clockHours)} de relógio` },
      ],
      sections: [
        {
          rows: [
            row('Horas trabalhadas (relógio)', hoursLabel(r.clockHours)),
            rural ? null : row('Horas noturnas pagas (52min30s)', hoursLabel(r.paidHours), null, `+ ${hoursLabel(r.extraReducedHours)} pela hora reduzida`),
            row('Adicional noturno', r.premium, 'total'),
          ],
        },
      ],
      notes: [rural ? 'No trabalho rural, o horário noturno é das 21h às 5h (lavoura) ou das 20h às 4h (pecuária), sem hora reduzida (Lei 5.889/1973).' : 'O adicional noturno integra a base do INSS, do IR e do FGTS, e reflete em férias, 13º e DSR quando habitual.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'regras',
        title: 'Regras do adicional noturno',
        html: `<p>Para o trabalhador urbano, o trabalho noturno é o realizado entre <strong>22h e 5h</strong>. Ele tem duas vantagens previstas no art. 73 da CLT:</p>
<ul><li><strong>Adicional de 20%</strong> sobre a hora diurna (ou o percentual maior da convenção coletiva);</li>
<li><strong>Hora reduzida:</strong> cada hora noturna tem 52 minutos e 30 segundos. Assim, 7 horas de relógio equivalem a 8 horas noturnas pagas.</li></ul>
<div class="formula">Horas pagas = horas de relógio × 60 ÷ 52,5
Adicional = valor da hora × 20% × horas pagas</div>`,
      },
      {
        id: 'exemplo',
        title: 'Exemplo',
        html: `<div class="example"><p>Salário de ${h.brl(3500)}, jornada de 44 horas e 140 horas de relógio no período noturno: ${ex.cards[2].value} pagas, com adicional de ${ex.cards[1].value} por hora. <strong>Adicional do mês: ${ex.hero.value}</strong>.</p></div>`,
      },
      {
        id: 'prorrogacao',
        title: 'Prorrogação da jornada noturna',
        html: `<p>Se a jornada começa à noite e se estende depois das 5h, as horas seguintes também recebem o adicional noturno (Súmula 60, II, do TST). Na escala 12x36 noturna, o mesmo entendimento costuma ser aplicado. Se houver horas extras nesse período, veja a ${h.link('hora-extra', 'calculadora de hora extra')}.</p>`,
      },
    ],
    faq: [
      { q: 'Quanto é a hora noturna?', a: '<p>52 minutos e 30 segundos para o trabalhador urbano. Cada 7 horas de relógio entre 22h e 5h valem 8 horas de trabalho.</p>' },
      { q: 'O adicional noturno é pago nas férias?', a: '<p>Sim, quando habitual. A média do adicional noturno integra férias, 13º, aviso prévio e o DSR.</p>' },
      { q: 'Empregado doméstico recebe adicional noturno?', a: '<p>Sim. A Lei Complementar 150/2015 garante adicional de 20% e hora reduzida das 22h às 5h.</p>' },
    ],
    limitations: ['Não calcula automaticamente o horário noturno a partir das entradas e saídas: informe o total de horas trabalhadas entre 22h e 5h.', 'Algumas categorias (como petroleiros e vigilantes) têm regras próprias.'],
  };
}
