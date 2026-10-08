import { addBusinessDays, businessDays } from '../calc/everyday.js';
import { CURRENT as P } from '../data/params/index.js';
import { nationalHolidays, parseISO } from '../lib/dates.js';
import { dateLabel } from '../lib/format.js';
import { row } from './_shared.js';

export const meta = {
  slug: 'dias-uteis',
  category: 'trabalho',
  icon: 'calendar',
  short: 'Dias úteis',
  h1: 'Calculadora de dias úteis',
  title: `Calculadora de Dias Úteis ${P.year}: entre datas e com feriados`,
  description: 'Conte os dias úteis entre duas datas, descontando fins de semana e feriados nacionais, ou descubra a data final somando um número de dias úteis.',
  lead: 'Conte dias úteis entre duas datas ou some dias úteis a uma data, já descontando os feriados nacionais.',
  card: 'Conte dias úteis entre datas, com feriados.',
  keywords: ['dias uteis', 'contar dias', 'prazo', 'feriados', 'dias corridos', 'data final'],
  related: ['dsr', 'horas-trabalhadas', 'juros-de-atraso', 'aviso-previo'],
  sources: [],
  extraSources: [
    { label: 'Lei nº 662/1949 — feriados nacionais', url: 'https://www.planalto.gov.br/ccivil_03/leis/l0662.htm' },
    { label: 'Lei nº 14.759/2023 — Dia Nacional de Zumbi e da Consciência Negra', url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14759.htm' },
  ],
  legal: false,
};

const y = P.year;

export const ui = {
  fields: [
    {
      name: 'mode',
      label: 'O que você quer fazer?',
      type: 'radio',
      default: 'count',
      options: [
        { value: 'count', label: 'Contar entre datas' },
        { value: 'add', label: 'Somar dias úteis' },
      ],
    },
    { name: 'start', label: 'Data inicial', type: 'date', default: `${y}-10-01`, width: 'half' },
    { name: 'end', label: 'Data final', type: 'date', default: `${y}-12-31`, width: 'half', showIf: (v) => v.mode === 'count', after: 'start', afterMessage: 'A data final deve ser igual ou posterior à inicial.', maxSpanDays: 30 * 366, spanMessage: 'Use um intervalo de até 30 anos.' },
    { name: 'days', label: 'Dias úteis a somar', type: 'integer', default: 15, min: 1, max: 3650, width: 'half', showIf: (v) => v.mode === 'add' },
    { name: 'saturday', label: 'Contar sábado como dia útil', type: 'checkbox', default: false },
    { name: 'optional', label: 'Descontar Carnaval e Corpus Christi (pontos facultativos)', type: 'checkbox', default: false },
  ],
  validate(v) {
    if (v.mode !== 'count') return null;
    const a = parseISO(v.start);
    const b = parseISO(v.end);
    if (a && b && b < a) return { end: 'A data final deve ser igual ou posterior à inicial.' };
    if (a && b && (b - a) / 86400000 > 3650 * 3) return { end: 'Use um intervalo de até 30 anos.' };
    return null;
  },
  compute(v) {
    if (v.mode === 'add') {
      const end = addBusinessDays({ start: v.start, days: v.days, saturdays: v.saturday, includeOptional: v.optional });
      return {
        hero: { label: 'Data final', value: dateLabel(end), tone: 'neutral', sub: `${v.days} dias úteis após ${dateLabel(v.start)}` },
        notes: ['A data inicial não é contada (como na contagem de prazos: exclui-se o dia do começo).', 'Feriados estaduais e municipais não são considerados.'],
      };
    }
    const r = businessDays({ start: v.start, end: v.end, saturdays: v.saturday, includeOptional: v.optional });
    return {
      hero: { label: 'Dias úteis', value: String(r.business), tone: 'neutral', sub: `de ${dateLabel(v.start)} a ${dateLabel(v.end)} (incluindo as duas datas)` },
      cards: [
        { label: 'Dias corridos', value: String(r.total) },
        { label: v.saturday ? 'Domingos' : 'Sábados e domingos', value: String(r.weekend) },
        { label: 'Feriados em dias úteis', value: String(r.holidays.length) },
      ],
      sections: r.holidays.length
        ? [{ title: 'Feriados descontados', rows: r.holidays.map((h) => row(h.name, dateLabel(h.date))) }]
        : [],
      notes: ['Feriados estaduais e municipais não são considerados.'],
    };
  },
};

export function content(ex, h) {
  const list = nationalHolidays(h.P.year, { includeOptional: true });
  const weekday = (iso) => ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][parseISO(iso).getUTCDay()];
  return {
    sections: [
      {
        id: 'como-funciona',
        title: 'Como a contagem funciona',
        html: `<p>No modo <strong>contar entre datas</strong>, a calculadora percorre cada dia do intervalo (incluindo a data inicial e a final) e descarta sábados, domingos e feriados nacionais. No modo <strong>somar dias úteis</strong>, ela parte da data inicial (sem contá-la) e avança até completar o número de dias úteis pedido — o mesmo critério usado na contagem de prazos.</p>
<div class="example"><p>De ${h.dateLabel(`${h.P.year}-10-01`)} a ${h.dateLabel(`${h.P.year}-12-31`)}: <strong>${ex.hero.value} dias úteis</strong>, com ${ex.cards[2].value} feriados nacionais caindo em dias de semana.</p></div>`,
      },
      {
        id: 'feriados',
        title: `Feriados nacionais de ${h.P.year}`,
        html: `${h.table(['Data', 'Dia', 'Feriado'], list.map((x) => [h.dateLabel(x.date), weekday(x.date), x.name]))}
<p>Carnaval e Corpus Christi são pontos facultativos no calendário federal, mas são feriados em vários estados e municípios. Marque a opção correspondente se a sua cidade ou empresa não trabalha nesses dias. A Páscoa é calculada automaticamente para cada ano.</p>`,
      },
    ],
    faq: [
      { q: 'Sábado é dia útil?', a: '<p>Para a CLT e para o cálculo do DSR, sim. Para bancos e para a maioria dos prazos administrativos e processuais, não. Use a opção "Contar sábado como dia útil" conforme o seu caso.</p>' },
      { q: 'A calculadora serve para prazos processuais?', a: '<p>Ela ajuda na estimativa, mas prazos judiciais seguem regras próprias (suspensões, recesso forense de 20/12 a 20/01 e feriados locais do tribunal). Confirme sempre no calendário do tribunal.</p>' },
      { q: 'Quantos dias úteis tem um mês?', a: '<p>Em geral, de 20 a 23 dias úteis de segunda a sexta, dependendo do mês e dos feriados.</p>' },
    ],
    limitations: ['Não considera feriados estaduais e municipais, recesso forense ou feriados bancários específicos.'],
  };
}
