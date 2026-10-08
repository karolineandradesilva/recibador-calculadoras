import { noticeDays } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { addDays, parseISO, toISO } from '../lib/dates.js';
import { dateLabel } from '../lib/format.js';
import { brl, row, salaryField, variableField, val } from './_shared.js';

export const meta = {
  slug: 'aviso-previo',
  category: 'trabalho',
  icon: 'calendar',
  short: 'Aviso prévio',
  h1: 'Calculadora de aviso prévio proporcional',
  title: `Aviso Prévio Proporcional ${P.year}: dias, valor e data final`,
  description: 'Calcule os dias de aviso prévio proporcional (30 + 3 por ano, até 90), o valor do aviso indenizado e a data em que o contrato termina com a projeção.',
  lead: 'Descubra quantos dias de aviso prévio você tem, quanto vale o aviso indenizado e até quando o contrato vai, oficialmente.',
  card: '30 + 3 dias por ano, valor e data projetada.',
  keywords: ['aviso previo', 'aviso proporcional', 'aviso indenizado', 'aviso trabalhado', 'lei 12506'],
  related: ['rescisao-trabalhista', 'seguro-desemprego', 'multa-fgts', 'ferias-proporcionais'],
  sources: ['noticePeriod', 'clt'],
  legal: true,
};

const y = P.year;

export const ui = {
  fields: [
    salaryField(),
    { name: 'admission', label: 'Data de admissão', type: 'date', default: `${y - 7}-05-02`, width: 'half' },
    { name: 'notice', label: 'Data do aviso', type: 'date', default: `${y}-09-30`, width: 'half', help: 'Dia em que a dispensa foi comunicada.', after: 'admission', afterMessage: 'O aviso deve ser igual ou posterior à data de admissão.', maxSpanDays: 60 * 366, spanMessage: 'Contrato com mais de 60 anos: confira as datas.' },
    {
      name: 'mode',
      label: 'Tipo de aviso',
      type: 'radio',
      default: 'indemnified',
      options: [
        { value: 'indemnified', label: 'Indenizado' },
        { value: 'worked', label: 'Trabalhado' },
      ],
    },
    variableField(),
  ],
  validate(v) {
    const a = parseISO(v.admission);
    const b = parseISO(v.notice);
    if (a && b && b < a) return { notice: 'A data do aviso deve ser posterior à admissão.' };
    return null;
  },
  compute(v) {
    const admission = parseISO(v.admission);
    const notice = parseISO(v.notice);
    const { years, days } = noticeDays(admission, notice);
    const daily = (v.salary + val(v.variable)) / 30;
    // The notice period counts from the day after the communication (Súmula 380 do TST).
    const endDate = toISO(addDays(notice, days));
    const extra = Math.max(0, days - 30);
    const sections = [];
    if (v.mode === 'indemnified') {
      sections.push({
        rows: [
          row(`Aviso prévio indenizado (${days} dias)`, daily * days, 'plus', 'Sem INSS e IR; com FGTS'),
          row('Data final projetada do contrato', dateLabel(endDate), null, 'Usada para 13º, férias e anotação na carteira'),
        ],
      });
    } else {
      sections.push({
        rows: [
          row('Dias trabalhados de aviso', '30 dias', null, 'Com redução de 2h/dia ou 7 dias corridos de folga'),
          extra ? row(`Dias proporcionais indenizados (${extra})`, daily * extra, 'plus', 'Pagos em dinheiro na rescisão') : null,
          row('Último dia de trabalho', dateLabel(toISO(addDays(notice, 30)))),
          extra ? row('Data final projetada', dateLabel(endDate)) : null,
        ],
      });
    }
    return {
      hero: { label: 'Dias de aviso prévio', value: `${days} dias`, tone: 'neutral', sub: `30 dias + ${days - 30} pelos ${years} ${years === 1 ? 'ano completo' : 'anos completos'} de serviço` },
      cards: v.mode === 'indemnified' ? [{ label: 'Valor do aviso', value: brl(daily * days), tone: 'plus' }] : [],
      sections,
      notes: ['O aviso proporcional de mais de 30 dias é um direito do empregado dispensado; quem pede demissão cumpre 30 dias.'],
    };
  },
};

export function content(ex, h) {
  const rows = [];
  for (let y = 0; y <= 20; y += 1) rows.push([y === 0 ? 'menos de 1 ano' : `${y} ${y === 1 ? 'ano' : 'anos'}`, `${Math.min(90, 30 + 3 * y)} dias`]);
  return {
    sections: [
      {
        id: 'regra',
        title: 'Como funciona o aviso prévio proporcional',
        html: `<p>A Lei 12.506/2011 garante ao empregado dispensado sem justa causa um aviso prévio de <strong>30 dias</strong>, mais <strong>3 dias por ano completo</strong> de serviço na mesma empresa, até o máximo de <strong>90 dias</strong>. O acréscimo começa a contar a partir do primeiro ano completo (Nota Técnica 184/2012 do Ministério do Trabalho).</p>
<div class="formula">Dias de aviso = 30 + 3 × anos completos   (máximo 90)
Valor indenizado = (salário + médias) ÷ 30 × dias de aviso</div>
<div class="example"><p>Exemplo: admissão em ${h.dateLabel(`${h.P.year - 7}-05-02`)} e aviso em ${h.dateLabel(`${h.P.year}-09-30`)} — <strong>${ex.hero.value}</strong> (${ex.hero.sub}). Com salário de ${h.brl(3500)}, o aviso indenizado vale ${ex.cards[0].value}.</p></div>`,
      },
      {
        id: 'tabela',
        title: 'Tabela de dias por tempo de serviço',
        html: h.table(['Tempo completo de serviço', 'Aviso prévio'], rows),
      },
      {
        id: 'trabalhado-ou-indenizado',
        title: 'Aviso trabalhado ou indenizado',
        html: `<ul><li><strong>Indenizado:</strong> a empresa dispensa o cumprimento e paga os dias em dinheiro. Esse valor não tem INSS nem IR, mas tem FGTS, e os dias projetam o contrato para frente, gerando mais avos de 13º e férias.</li>
<li><strong>Trabalhado:</strong> o empregado trabalha 30 dias, com direito a reduzir 2 horas da jornada diária ou faltar 7 dias corridos (CLT, art. 488). Os dias proporcionais acima de 30 são indenizados.</li>
<li><strong>Pedido de demissão:</strong> o empregado deve cumprir 30 dias (a proporcionalidade não se aplica a ele, segundo o TST). Se não cumprir, a empresa pode descontar o salário correspondente.</li></ul>
<p>Para todas as verbas da saída, use a ${h.link('rescisao-trabalhista', 'calculadora de rescisão')}.</p>`,
      },
    ],
    faq: [
      { q: 'Quem tem 1 ano e 11 meses de empresa tem quantos dias?', a: '<p>33 dias: só os anos completos contam para o acréscimo de 3 dias.</p>' },
      { q: 'O aviso prévio conta como tempo de serviço?', a: '<p>Sim. Mesmo indenizado, o período do aviso integra o tempo de serviço para todos os efeitos (CLT, art. 487, §1º), inclusive para 13º, férias e anotação da data de saída na carteira (OJ 82 da SDI-1 do TST).</p>' },
      { q: 'Quando começa a contar o aviso?', a: '<p>No dia seguinte ao da comunicação (Súmula 380 do TST).</p>' },
    ],
    limitations: ['Considera dispensa sem justa causa. Convenções coletivas podem prever regras mais benéficas (por exemplo, aviso maior para empregados mais velhos).'],
  };
}
