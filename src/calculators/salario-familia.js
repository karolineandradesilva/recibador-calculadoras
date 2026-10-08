import { familyAllowance } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row } from './_shared.js';

export const meta = {
  slug: 'salario-familia',
  category: 'trabalho',
  icon: 'users',
  short: 'Salário-família',
  h1: 'Calculadora de salário-família',
  title: `Salário-Família ${P.year}: valor da cota e limite de renda`,
  description: `Veja se você tem direito ao salário-família em ${P.year} e quanto recebe por filho de até 14 anos, conforme o limite de remuneração da portaria oficial.`,
  lead: 'Descubra se a sua remuneração dá direito ao salário-família e quanto você recebe por filho.',
  card: 'Cota por filho e limite de renda do ano.',
  keywords: ['salario familia', 'cota', 'filhos', 'beneficio inss', 'baixa renda'],
  related: ['salario-liquido', 'imposto-de-renda', 'inss'],
  sources: ['familyAllowance', 'inss'],
  legal: true,
};

const fa = P.familyAllowance;

export const ui = {
  fields: [
    { name: 'income', label: 'Remuneração bruta mensal', type: 'money', default: 1800, min: 0.01 },
    { name: 'children', label: 'Filhos ou equiparados até 14 anos (ou com deficiência, qualquer idade)', type: 'integer', default: 2, min: 0, max: 20 },
  ],
  compute(v) {
    const r = familyAllowance({ income: v.income, children: v.children });
    if (!r.eligible) {
      return {
        hero: { label: 'Salário-família', value: brl(0), tone: 'neutral', sub: 'Sem direito com esta remuneração' },
        alert: { tone: 'warn', text: `O benefício é pago apenas a quem recebe até ${brl(fa.incomeLimit)} por mês em ${P.year}.` },
      };
    }
    return {
      hero: { label: 'Salário-família por mês', value: brl(r.total), sub: `${v.children} × ${brl(fa.quota)}` },
      sections: [
        {
          rows: [
            row('Remuneração', v.income),
            row('Limite de remuneração', fa.incomeLimit, 'muted'),
            row('Cota por filho', fa.quota),
            row('Total mensal', r.total, 'total'),
          ],
        },
      ],
      notes: ['Pai e mãe empregados com direito recebem cada um a sua cota.', 'O valor é pago junto com o salário e não tem desconto de INSS, IR ou FGTS.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'valores',
        title: `Valores do salário-família em ${h.P.year}`,
        html: `${h.table(['Remuneração mensal', 'Cota por filho'], [[`até ${h.brl(fa.incomeLimit)}`, h.brl(fa.quota)], [`acima de ${h.brl(fa.incomeLimit)}`, 'sem direito']])}
<p>Valores definidos pela Portaria Interministerial MPS/MF nº 13/2026. Não há proporcionalidade: quem passa do limite, mesmo que por pouco, não recebe naquele mês.</p>
<div class="example"><p>Remuneração de ${h.brl(1800)} e 2 filhos de até 14 anos: <strong>${ex.hero.value}</strong> por mês.</p></div>`,
      },
      {
        id: 'quem-tem-direito',
        title: 'Quem tem direito',
        html: '<ul><li>Empregados com carteira assinada, empregados domésticos e trabalhadores avulsos com remuneração dentro do limite.</li><li>Aposentados por invalidez, por idade ou em gozo de auxílio por incapacidade, com renda dentro do limite.</li><li>Não têm direito: contribuintes individuais, MEI e segurados facultativos.</li></ul><p>É preciso apresentar a certidão de nascimento, o cartão de vacinação (até 6 anos) e o comprovante de frequência escolar (a partir dos 7 anos).</p>',
      },
    ],
    faq: [
      { q: 'Horas extras contam para o limite?', a: '<p>Sim. A remuneração do mês, incluindo horas extras e adicionais, é comparada ao limite. Em um mês com muitas extras, a cota pode deixar de ser paga.</p>' },
      { q: 'Quem paga o salário-família?', a: '<p>A empresa paga junto com o salário e compensa o valor no recolhimento do INSS. Para aposentados, o próprio INSS paga.</p>' },
    ],
    limitations: ['Se a pessoa tem mais de um emprego, os salários são somados para comparar com o limite.'],
  };
}
