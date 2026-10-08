import { cltVsPj, pjBreakEven } from '../calc/company.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, pct, dependentsField, val } from './_shared.js';

export const meta = {
  slug: 'clt-x-pj',
  category: 'negocios',
  icon: 'briefcase',
  short: 'CLT x PJ',
  h1: 'Calculadora CLT x PJ',
  title: `CLT x PJ ${P.year}: compare propostas e veja o equivalente`,
  description: `Compare uma proposta CLT com uma PJ no Simples Nacional: líquido anual, 13º, férias, FGTS, impostos do PJ, pró-labore e o faturamento PJ equivalente em ${P.year}.`,
  lead: 'Coloque as duas propostas lado a lado — com 13º, férias, FGTS e impostos do PJ — e descubra qual paga mais de verdade.',
  card: 'Ganho anual real e faturamento PJ equivalente.',
  keywords: ['clt x pj', 'clt ou pj', 'pj vale a pena', 'comparar proposta', 'quanto cobrar pj', 'equivalente pj'],
  related: ['salario-liquido', 'custo-de-funcionario', 'simples-nacional', 'pro-labore', 'valor-hora-freelancer'],
  sources: ['simples', 'inss', 'irrf', 'fgts'],
  legal: true,
};

export const ui = {
  fields: [
    { name: 'clt', label: 'Salário bruto CLT', type: 'money', default: 8000, min: 1, width: 'half' },
    { name: 'benefits', label: 'Benefícios CLT por mês', type: 'money', default: 800, min: 0, required: false, width: 'half', help: 'VR, VA, plano de saúde pago pela empresa etc.' },
    { name: 'pj', label: 'Faturamento mensal PJ', type: 'money', default: 12000, min: 1 },
    {
      name: 'annex',
      label: 'Tributação do PJ',
      type: 'select',
      default: 'factorR',
      options: [
        { value: 'factorR', label: 'Fator R (Anexo III)' },
        { value: 'III', label: 'Simples — Anexo III' },
        { value: 'V', label: 'Simples — Anexo V' },
      ],
    },
    { name: 'accountant', label: 'Contador e custos', type: 'money', default: 350, min: 0, required: false, width: 'half' },
    { name: 'own', label: 'Benefícios pagos pelo PJ', type: 'money', default: 600, min: 0, required: false, width: 'half', help: 'Plano de saúde, previdência etc.' },
    dependentsField({ advanced: true }),
  ],
  compute(v) {
    const input = { cltSalary: v.clt, cltBenefits: val(v.benefits), dependents: val(v.dependents), pjRevenue: v.pj, pjAnnex: v.annex, accountant: val(v.accountant), pjOwnCosts: val(v.own) };
    const r = cltVsPj(input);
    const breakEven = pjBreakEven(input);
    const better = r.difference >= 0 ? 'PJ' : 'CLT';
    return {
      hero: { label: 'Melhor proposta no ano', value: better, tone: 'neutral', sub: `${brl(Math.abs(r.difference))} a mais por ano (${brl(Math.abs(r.difference) / 12)}/mês)` },
      cards: [
        { label: 'CLT: total no ano', value: brl(r.clt.year), sub: `${brl(r.clt.monthlyEquivalent)}/mês equivalente` },
        { label: 'PJ: total no ano', value: brl(r.pj.year), sub: `${brl(r.pj.monthlyNet)}/mês líquido` },
        { label: 'PJ equivalente à CLT', value: brl(breakEven), tone: 'plus', sub: 'Faturamento mensal mínimo' },
      ],
      sections: [
        {
          title: 'CLT (por ano)',
          rows: [
            row('12 salários líquidos', r.clt.monthlyNet * 12),
            row('13º líquido', r.clt.thirteenthNet),
            row('1/3 de férias (líquido)', r.clt.vacationExtraNet),
            row('FGTS depositado', r.clt.fgtsYear, null, '8% sobre 13,33 salários'),
            r.clt.benefitsYear ? row('Benefícios', r.clt.benefitsYear) : null,
            row('Total CLT', r.clt.year, 'total'),
          ],
        },
        {
          title: `PJ — Anexo ${r.pj.annex} (por mês)`,
          rows: [
            row('Faturamento', v.pj),
            row(`DAS (${pct(r.pj.effectiveRate)})`, r.pj.das, 'minus'),
            row(`INSS sobre pró-labore de ${brl(r.pj.proLabore)}`, r.pj.proLaboreInss, 'minus'),
            r.pj.proLaboreIrrf ? row('IR sobre pró-labore', r.pj.proLaboreIrrf, 'minus') : null,
            r.pj.accountant ? row('Contador e custos', r.pj.accountant, 'minus') : null,
            r.pj.ownCosts ? row('Benefícios por conta própria', r.pj.ownCosts, 'minus') : null,
            row('Líquido mensal', r.pj.monthlyNet, 'total'),
          ],
        },
      ],
      notes: ['O PJ não tem férias remuneradas, 13º, FGTS, seguro-desemprego nem estabilidades: considere guardar para os meses sem faturamento.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-comparar',
        title: 'Como comparar CLT e PJ corretamente',
        html: `<p>Comparar o salário CLT com o faturamento PJ, mês a mês, é o erro mais comum. O correto é comparar o <strong>total anual</strong>:</p>
<ul><li><strong>CLT:</strong> 12 salários líquidos + 13º + terço de férias + FGTS (8% ao mês, inclusive sobre 13º e férias) + benefícios.</li>
<li><strong>PJ:</strong> 12 faturamentos − impostos do Simples − INSS e IR do pró-labore − contador − custos que a empresa pagava (plano de saúde, por exemplo).</li></ul>
<div class="example"><p>CLT de ${h.brl(8000)} com ${h.brl(800)} de benefícios contra PJ de ${h.brl(12000)} por mês no Anexo III: CLT soma ${ex.cards[0].value} por ano, PJ soma ${ex.cards[1].value}. Melhor: <strong>${ex.hero.value}</strong>. Para empatar com a CLT, o PJ precisa faturar ${ex.cards[2].value} por mês.</p></div>`,
      },
      {
        id: 'fator-r',
        title: 'Fator R e pró-labore',
        html: `<p>Profissionais de tecnologia, consultoria, engenharia e outras atividades intelectuais costumam ser tributados no Anexo V (a partir de 15,5%). Se a folha de pagamento — incluindo o pró-labore — for de pelo menos 28% do faturamento, a empresa vai para o Anexo III (a partir de 6%). Por isso, a opção padrão considera pró-labore de 28%. Simule na ${h.link('simples-nacional', 'calculadora do Simples Nacional')} e na ${h.link('pro-labore', 'de pró-labore')}.</p>`,
      },
      {
        id: 'alem-do-dinheiro',
        title: 'Além do dinheiro',
        html: '<ul><li><strong>CLT:</strong> seguro-desemprego, multa de 40% do FGTS, aviso prévio, licenças remuneradas, estabilidade em alguns casos.</li><li><strong>PJ:</strong> flexibilidade e possibilidade de atender vários clientes, mas sem renda nas férias e em afastamentos, a menos que você se prepare.</li><li><strong>Pejotização:</strong> se houver subordinação, horário fixo e pessoalidade, a relação pode ser reconhecida como vínculo de emprego.</li></ul>',
      },
    ],
    faq: [
      { q: 'Quanto pedir como PJ para valer a pena?', a: '<p>Em geral, entre 1,4 e 1,7 vez o salário CLT, dependendo dos benefícios e do anexo do Simples. O resultado "PJ equivalente" mostra o mínimo para empatar.</p>' },
      { q: 'E a distribuição de lucros?', a: '<p>No exemplo, o que sobra depois do pró-labore é distribuído como lucro, isento de IR até R$ 50 mil por mês por empresa (regra da Lei 15.270/2025 a partir de 2026).</p>' },
    ],
    limitations: ['Considera Simples Nacional, pró-labore de 28% (ou um salário mínimo, o que for maior) e lucro distribuído sem IR.', 'Não considera MEI, Lucro Presumido, ISS fixo de profissões regulamentadas ou o imposto mínimo para altas rendas.', 'O FGTS é somado como patrimônio, embora só possa ser sacado em situações específicas.'],
  };
}
