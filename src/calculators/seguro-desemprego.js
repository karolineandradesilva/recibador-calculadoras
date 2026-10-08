import { unemploymentInsurance } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, val } from './_shared.js';

export const meta = {
  slug: 'seguro-desemprego',
  category: 'trabalho',
  icon: 'shield',
  short: 'Seguro-desemprego',
  h1: 'Calculadora de seguro-desemprego',
  title: `Seguro-Desemprego ${P.year}: valor da parcela e quantas parcelas`,
  description: `Calcule o valor das parcelas do seguro-desemprego em ${P.year} pela média dos últimos salários e descubra quantas parcelas você recebe conforme o tempo trabalhado.`,
  lead: 'Informe os últimos salários e o tempo trabalhado para saber o valor de cada parcela e quantas parcelas você deve receber.',
  card: 'Valor e número de parcelas pela tabela oficial.',
  keywords: ['seguro desemprego', 'parcelas', 'valor do seguro', 'quantas parcelas', 'tabela seguro desemprego'],
  related: ['rescisao-trabalhista', 'aviso-previo', 'multa-fgts', 'fgts'],
  sources: ['unemployment', 'unemploymentLaw'],
  legal: true,
};

const u = P.unemploymentInsurance;

export const ui = {
  fields: [
    { name: 's1', label: 'Último salário', type: 'money', default: 3000, min: 0.01, width: 'third' },
    { name: 's2', label: 'Penúltimo', type: 'money', default: 3000, min: 0, required: false, width: 'third' },
    { name: 's3', label: 'Antepenúltimo', type: 'money', default: 2800, min: 0, required: false, width: 'third' },
    {
      name: 'request',
      label: 'Qual solicitação é esta?',
      type: 'radio',
      numeric: true,
      default: 1,
      options: [
        { value: 1, label: '1ª vez' },
        { value: 2, label: '2ª vez' },
        { value: 3, label: '3ª vez ou mais' },
      ],
    },
    { name: 'months', label: 'Meses trabalhados nos últimos 36 meses', type: 'integer', default: 26, min: 0, max: 36, help: 'Some os meses com carteira assinada (contando contratos anteriores).' },
  ],
  compute(v) {
    const r = unemploymentInsurance({ salaries: [v.s1, val(v.s2), val(v.s3)], request: v.request, monthsWorked: v.months });
    const bracketText = { 1: '80% da média', 2: `${brl(u.secondBracketFixed)} + 50% do que passar de ${brl(u.firstBracketUpTo)}`, 3: 'teto do benefício' }[r.bracket];
    if (!r.eligible) {
      return {
        hero: { label: 'Valor da parcela', value: brl(r.installment), tone: 'neutral', sub: bracketText },
        alert: { tone: 'warn', text: `Para a ${v.request === 3 ? '3ª solicitação ou mais' : `${v.request}ª solicitação`}, é preciso ter trabalhado pelo menos ${r.minimumMonths} meses no período exigido. Pelos dados informados, o direito não está garantido.` },
      };
    }
    return {
      hero: { label: 'Valor de cada parcela', value: brl(r.installment), sub: bracketText },
      cards: [
        { label: 'Número de parcelas', value: String(r.installments) },
        { label: 'Total a receber', value: brl(r.total), tone: 'plus' },
      ],
      sections: [
        {
          rows: [
            row('Média salarial considerada', r.average),
            row('Valor da parcela', r.installment, 'strong', r.installment === u.floor ? 'Piso: salário mínimo' : r.installment === u.ceiling ? 'Teto do benefício' : undefined),
            row('Parcelas', String(r.installments)),
            row('Total estimado', r.total, 'total'),
          ],
        },
      ],
      notes: ['O pedido deve ser feito entre o 7º e o 120º dia após a dispensa, pelo app Carteira de Trabalho Digital ou pelo portal gov.br.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'tabela',
        title: `Tabela do seguro-desemprego ${h.P.year}`,
        html: `${h.table(['Média salarial', 'Valor da parcela'], [
          [`até ${h.brl(u.firstBracketUpTo)}`, '80% da média (nunca menos que o salário mínimo)'],
          [`de ${h.brl(u.firstBracketUpTo + 0.01)} a ${h.brl(u.secondBracketUpTo)}`, `${h.brl(u.secondBracketFixed)} + 50% do que exceder ${h.brl(u.firstBracketUpTo)}`],
          [`acima de ${h.brl(u.secondBracketUpTo)}`, `${h.brl(u.ceiling)} (teto)`],
        ])}
<p>Nenhuma parcela pode ser menor que o salário mínimo (${h.brl(u.floor)}). A média considera os salários dos <strong>últimos 3 meses</strong> anteriores à dispensa; se houver menos, usa-se a média dos meses disponíveis.</p>`,
      },
      {
        id: 'parcelas',
        title: 'Quantas parcelas você recebe',
        html: `${h.table(['Solicitação', 'Carência mínima', '6 a 11 meses', '12 a 23 meses', '24 meses ou mais'], [
          ['1ª', '12 meses nos últimos 18', '—', '4 parcelas', '5 parcelas'],
          ['2ª', '9 meses nos últimos 12', '3 parcelas (9 a 11)', '4 parcelas', '5 parcelas'],
          ['3ª ou mais', '6 meses imediatamente anteriores', '3 parcelas', '4 parcelas', '5 parcelas'],
        ])}
<p>Os meses de trabalho são contados nos últimos 36 meses anteriores à dispensa (Lei 7.998/1990, art. 4º, com redação da Lei 13.134/2015).</p>`,
      },
      {
        id: 'exemplo',
        title: 'Exemplo',
        html: `<div class="example"><p>Últimos salários de ${h.brl(3000)}, ${h.brl(3000)} e ${h.brl(2800)}, primeira solicitação, 26 meses trabalhados: parcela de <strong>${ex.hero.value}</strong>, ${ex.cards[0].value} parcelas, total de ${ex.cards[1].value}.</p></div>`,
      },
      {
        id: 'quem-tem-direito',
        title: 'Quem tem direito',
        html: `<ul><li>Dispensado <strong>sem justa causa</strong> (inclusive rescisão indireta).</li><li>Sem renda própria suficiente para a família e sem receber benefício previdenciário de prestação continuada (exceto pensão por morte e auxílio-acidente).</li><li>Que cumpra a carência da tabela acima.</li></ul>
<p>Não tem direito quem pede demissão, quem é dispensado por justa causa ou quem faz acordo pelo art. 484-A da CLT. Veja todas as verbas da saída na ${h.link('rescisao-trabalhista', 'calculadora de rescisão')}.</p>`,
      },
    ],
    faq: [
      { q: 'O seguro-desemprego tem desconto?', a: '<p>Não há desconto de INSS nem de Imposto de Renda sobre as parcelas do seguro-desemprego.</p>' },
      { q: 'Posso trabalhar como MEI e receber o seguro?', a: '<p>Ter CNPJ ativo pode ser interpretado como renda própria e levar ao bloqueio do benefício. Se o MEI não gera renda, é possível recorrer, comprovando a situação.</p>' },
      { q: 'Quando o seguro-desemprego é reajustado?', a: '<p>Os valores da tabela são reajustados anualmente pelo INPC, e o piso acompanha o salário mínimo.</p>' },
    ],
    limitations: ['A contagem de meses trabalhados e de solicitações anteriores depende dos registros oficiais; o resultado é uma estimativa.', 'Empregados domésticos, pescadores artesanais e trabalhadores resgatados têm regras próprias.'],
  };
}
