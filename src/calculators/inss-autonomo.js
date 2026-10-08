import { inssIndividual } from '../calc/tax.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row } from './_shared.js';

export const meta = {
  slug: 'inss-autonomo',
  category: 'impostos',
  icon: 'shield',
  short: 'INSS autônomo e facultativo',
  h1: 'Calculadora de INSS para autônomo e facultativo',
  title: `INSS Autônomo e Facultativo ${P.year}: 20%, 11% ou 5%`,
  description: `Calcule a contribuição ao INSS de autônomos, contribuintes individuais e facultativos em ${P.year}: plano normal de 20%, simplificado de 11% ou baixa renda de 5%.`,
  lead: 'Calcule quanto pagar de INSS na GPS como autônomo, profissional liberal, dona de casa ou estudante.',
  card: 'Plano normal, simplificado ou baixa renda.',
  keywords: ['inss autonomo', 'contribuinte individual', 'facultativo', 'gps', 'carne inss', '11%', '20%'],
  related: ['inss', 'das-mei', 'pro-labore', 'valor-hora-freelancer'],
  sources: ['inss'],
  legal: true,
};

const PLANS = {
  normal: { label: 'Plano normal (20%)', rate: P.inss.individualRate },
  simplified: { label: 'Plano simplificado (11% do mínimo)', rate: P.inss.simplifiedRate },
  lowIncome: { label: 'Facultativo de baixa renda (5% do mínimo)', rate: P.inss.lowIncomeRate },
};

export const ui = {
  fields: [
    { name: 'plan', label: 'Plano de contribuição', type: 'select', default: 'normal', options: Object.entries(PLANS).map(([value, p]) => ({ value, label: p.label })) },
    { name: 'income', label: 'Valor sobre o qual contribuir', type: 'money', default: 4000, min: P.minimumWage, max: 100000000, showIf: (v) => v.plan === 'normal', help: `Entre o salário mínimo (${brl(P.minimumWage)}) e o teto (${brl(P.inss.ceiling)}).` },
  ],
  compute(v) {
    const plan = PLANS[v.plan];
    const base = v.plan === 'normal' ? v.income : P.minimumWage;
    const r = inssIndividual(base, plan.rate);
    return {
      hero: { label: 'Contribuição mensal (GPS)', value: brl(r.value), sub: plan.label },
      alert: r.capped ? { tone: 'info', text: `Valor limitado ao teto de ${brl(P.inss.ceiling)}.` } : null,
      sections: [
        {
          rows: [
            row('Salário de contribuição', r.base),
            row('Alíquota', `${Math.round(plan.rate * 100)}%`),
            row('Contribuição', r.value, 'total'),
          ],
        },
      ],
      notes: [
        v.plan === 'normal' ? 'O plano de 20% dá direito a todos os benefícios, inclusive aposentadoria por tempo de contribuição pelas regras de transição e uso no cálculo pela média.' : 'Os planos de 11% e 5% não dão direito à aposentadoria por tempo de contribuição. É possível complementar a diferença depois.',
        'O vencimento é no dia 15 do mês seguinte à competência.',
      ],
    };
  },
};

export function content(ex, h) {
  const p = h.P;
  return {
    sections: [
      {
        id: 'planos',
        title: `Planos de contribuição em ${p.year}`,
        html: `${h.table(['Plano', 'Quem pode', 'Alíquota', 'Valor mensal'], [
          ['Normal', 'Autônomos, profissionais liberais e facultativos', '20% sobre o valor escolhido', `${h.brl(p.minimumWage * 0.2)} a ${h.brl(p.inss.ceiling * 0.2)}`],
          ['Simplificado', 'Autônomo sem prestação de serviço a empresas e facultativo', '11% do salário mínimo', h.brl(p.minimumWage * 0.11)],
          ['Baixa renda', 'Facultativo sem renda própria, de família inscrita no CadÚnico', '5% do salário mínimo', h.brl(p.minimumWage * 0.05)],
        ])}
<div class="example"><p>Autônomo que quer contribuir sobre ${h.brl(4000)} no plano normal: <strong>${ex.hero.value}</strong> por mês.</p></div>`,
      },
      {
        id: 'prestador',
        title: 'Autônomo que presta serviço para empresas',
        html: `<p>Quando o autônomo presta serviço a uma pessoa jurídica, a empresa retém <strong>11%</strong> sobre o valor do serviço (limitado ao teto) e recolhe em nome dele. Se as retenções do mês não atingirem o teto, o profissional pode completar com GPS própria. Para o sócio de empresa, veja a ${h.link('pro-labore', 'calculadora de pró-labore')}; para MEI, a ${h.link('das-mei', 'do DAS MEI')}.</p>`,
      },
    ],
    faq: [
      { q: 'Qual o código da GPS?', a: '<p>Os mais comuns são 1007 (contribuinte individual, plano normal mensal), 1163 (individual, plano simplificado), 1406 (facultativo, plano normal), 1473 (facultativo, simplificado) e 1929 (facultativo de baixa renda). Confirme no site do INSS.</p>' },
      { q: 'Posso contribuir sobre um valor maior para ter aposentadoria maior?', a: '<p>Sim, no plano de 20% você escolhe o salário de contribuição entre o mínimo e o teto. O valor do benefício considera a média de todas as contribuições.</p>' },
    ],
    limitations: ['Não calcula juros e multa de contribuições em atraso.'],
  };
}
