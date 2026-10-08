import { meiDas, meiLimit, MEI_ACTIVITIES } from '../calc/company.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, pct, row } from './_shared.js';

export const meta = {
  slug: 'das-mei',
  category: 'impostos',
  icon: 'building',
  short: 'DAS do MEI e limite',
  h1: 'Calculadora do DAS MEI e do limite de faturamento',
  title: `DAS MEI ${P.year}: valor mensal e limite de faturamento`,
  description: `Veja o valor do DAS do MEI em ${P.year} para comércio, serviços ou caminhoneiro e confira se o seu faturamento está dentro do limite anual, inclusive proporcional.`,
  lead: 'Descubra quanto o MEI paga por mês e se o faturamento do ano está dentro do limite permitido.',
  card: 'Valor do boleto mensal e limite de R$ 81 mil.',
  keywords: ['das mei', 'mei', 'boleto mei', 'limite mei', '81 mil', 'faturamento mei', 'microempreendedor'],
  related: ['simples-nacional', 'inss-autonomo', 'pro-labore', 'clt-x-pj'],
  sources: ['mei', 'inss', 'minimumWage'],
  legal: true,
};

export const ui = {
  fields: [
    { name: 'activity', label: 'Atividade', type: 'select', default: 'services', options: Object.entries(MEI_ACTIVITIES).map(([value, label]) => ({ value, label })) },
    { name: 'revenue', label: 'Faturamento no ano (até agora ou previsto)', type: 'money', default: 54000, min: 0, width: 'half' },
    { name: 'months', label: 'Meses de atividade no ano', type: 'integer', default: 12, min: 1, max: 12, width: 'half', help: 'No ano de abertura, conte os meses desde a abertura (fração conta como mês inteiro).' },
  ],
  compute(v) {
    const das = meiDas({ activity: v.activity });
    const lim = meiLimit({ activity: v.activity, monthsActive: v.months, revenue: v.revenue });
    const alert = {
      ok: { tone: 'ok', text: `Dentro do limite: ${pct(lim.used, 1)} de ${brl(lim.limit)} utilizados.` },
      tolerance: { tone: 'warn', text: `Excesso de ${brl(lim.excess)} (até 20% do limite). Você paga um DAS complementar sobre o excesso e passa a ser microempresa a partir de 1º de janeiro do ano seguinte.` },
      over: { tone: 'warn', text: `Excesso de ${brl(lim.excess)}, acima de 20% do limite. O desenquadramento é retroativo a janeiro (ou à abertura), com tributação pelo Simples Nacional sobre todo o faturamento. Procure um contador.` },
    }[lim.status];
    return {
      hero: { label: 'DAS mensal', value: brl(das.total), sub: MEI_ACTIVITIES[v.activity] },
      alert,
      cards: [
        { label: 'DAS no ano', value: brl(das.total * 12) },
        { label: 'Limite de faturamento', value: brl(lim.limit), sub: v.months < 12 ? `${v.months} × ${brl(lim.monthlyAverageLimit)}` : 'Anual' },
      ],
      sections: [
        {
          title: 'Composição do DAS',
          rows: [
            row(`INSS (${das.trucker ? '12%' : '5%'} do salário mínimo)`, das.inss),
            das.icms ? row('ICMS', das.icms) : null,
            das.iss ? row('ISS', das.iss) : null,
            row('Total mensal', das.total, 'total'),
          ],
        },
      ],
      notes: ['O DAS vence no dia 20 de cada mês e é pago mesmo nos meses sem faturamento.'],
    };
  },
};

export function content(ex, h) {
  const p = h.P;
  const rows = Object.entries(MEI_ACTIVITIES).map(([k, label]) => {
    const d = meiDas({ activity: k });
    return [label, h.brl(d.inss), d.icms ? h.brl(d.icms) : '—', d.iss ? h.brl(d.iss) : '—', `<strong>${h.brl(d.total)}</strong>`];
  });
  return {
    sections: [
      {
        id: 'valores',
        title: `Valor do DAS MEI em ${p.year}`,
        html: `${h.table(['Atividade', 'INSS', 'ICMS', 'ISS', 'Total'], rows)}
<p>O INSS do MEI é de 5% do salário mínimo (${h.brl(p.minimumWage)}), ou 12% para o MEI caminhoneiro. O ICMS (R$ 1) vale para comércio e indústria, e o ISS (R$ 5) para serviços. Como o salário mínimo muda todo ano, o DAS também muda em janeiro.</p>`,
      },
      {
        id: 'limite',
        title: 'Limite de faturamento',
        html: `<p>O limite do MEI é de <strong>${h.brl(p.mei.annualRevenueLimit)} por ano</strong> (${h.brl(p.mei.truckerAnnualRevenueLimit)} para o MEI caminhoneiro). No ano de abertura, o limite é proporcional: ${h.brl(p.mei.annualRevenueLimit / 12)} por mês de atividade, contando o mês de abertura como inteiro.</p>
${h.table(['Situação', 'Consequência'], [['Faturamento até o limite', 'Continua MEI'], ['Excesso de até 20%', 'DAS complementar sobre o excesso e desenquadramento a partir do ano seguinte'], ['Excesso acima de 20%', 'Desenquadramento retroativo, com Simples Nacional sobre todo o faturamento do ano']])}
<div class="example"><p>Exemplo: prestador de serviços com faturamento anual de ${h.brl(54000)} paga <strong>${ex.hero.value}</strong> por mês e está dentro do limite.</p></div>`,
      },
    ],
    faq: [
      { q: 'O MEI paga Imposto de Renda?', a: '<p>A empresa MEI não paga IR além do DAS. Já a pessoa física pode ter de declarar IR: parte do lucro do MEI é isenta (8% do faturamento para comércio, 16% para transporte de passageiros e 32% para serviços, além das despesas comprovadas), e o restante é tributável.</p>' },
      { q: 'Posso ter um MEI e trabalhar com carteira assinada?', a: '<p>Sim, desde que o contrato CLT permita e não haja conflito com o empregador. Atenção: ter um MEI pode afetar o seguro-desemprego.</p>' },
      { q: 'O que acontece se eu não pagar o DAS?', a: '<p>Incidem multa e juros, o tempo sem pagamento não conta para benefícios do INSS e, após dívidas acumuladas, o CNPJ pode ser cancelado e o débito inscrito em dívida ativa.</p>' },
    ],
    limitations: ['Não calcula o DAS complementar sobre o excesso de faturamento.', 'Para quem já ultrapassou o limite, use a calculadora do Simples Nacional.'],
    extraSources: [{ label: 'Lei Complementar nº 123/2006, art. 18-A (MEI)', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm' }],
  };
}
