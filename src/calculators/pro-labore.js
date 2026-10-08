import { proLabore } from '../calc/company.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, inssHint, irrfHint, dependentsField, val } from './_shared.js';

export const meta = {
  slug: 'pro-labore',
  category: 'impostos',
  icon: 'briefcase',
  short: 'Pró-labore',
  h1: 'Calculadora de pró-labore',
  title: `Calculadora de Pró-labore ${P.year}: INSS de 11%, IR e custo`,
  description: `Calcule o pró-labore líquido do sócio com INSS de 11% (até o teto), Imposto de Renda de ${P.year} com a nova redução e o custo para a empresa conforme o regime.`,
  lead: 'Descubra quanto o sócio recebe de pró-labore líquido e quanto ele custa para a empresa.',
  card: 'INSS de 11%, IR e custo para a empresa.',
  keywords: ['pro labore', 'pró-labore', 'retirada do socio', 'inss socio', '11%', 'fator r'],
  related: ['simples-nacional', 'clt-x-pj', 'inss-autonomo', 'imposto-de-renda'],
  sources: ['inss', 'irrf', 'irrfReduction', 'employerContributions'],
  legal: true,
};

export const ui = {
  fields: [
    { name: 'amount', label: 'Valor do pró-labore', type: 'money', default: P.minimumWage, min: 0.01 },
    {
      name: 'regime',
      label: 'Regime da empresa',
      type: 'select',
      default: 'simples',
      options: [
        { value: 'simples', label: 'Simples Nacional (Anexos I, II, III ou V)' },
        { value: 'iv', label: 'Simples Nacional — Anexo IV' },
        { value: 'general', label: 'Lucro Presumido ou Real' },
      ],
    },
    dependentsField(),
  ],
  compute(v) {
    const employerPaysCpp = v.regime !== 'simples';
    const r = proLabore({ amount: v.amount, dependents: val(v.dependents), employerPaysCpp });
    return {
      hero: { label: 'Pró-labore líquido', value: brl(r.net) },
      cards: [
        { label: 'INSS do sócio (11%)', value: brl(r.inss.value), tone: 'minus' },
        { label: 'IRRF', value: brl(r.irrf.value), tone: 'minus' },
        { label: 'Custo para a empresa', value: brl(r.companyCost), sub: employerPaysCpp ? 'Com 20% de INSS patronal' : 'Sem INSS patronal no Simples' },
      ],
      sections: [
        {
          rows: [
            row('Pró-labore bruto', v.amount),
            row('INSS (11%)', r.inss.value, 'minus', r.inss.capped ? 'Limitado ao teto' : undefined),
            row('IRRF', r.irrf.value, 'minus', irrfHint(r.irrf)),
            row('Líquido', r.net, 'total'),
            r.cpp ? row('INSS patronal (20%)', r.cpp, 'muted', 'Pago pela empresa') : null,
          ],
        },
      ],
      notes: ['O pró-labore não tem FGTS. Lucros distribuídos ao sócio, quando apurados corretamente, são outra forma de remuneração.'],
    };
  },
};

export function content(ex, h) {
  const p = h.P;
  return {
    sections: [
      {
        id: 'o-que-e',
        title: 'O que é o pró-labore',
        html: `<p>Pró-labore é a remuneração do sócio que trabalha na empresa. Diferente da distribuição de lucros, ele é obrigatório para o sócio administrador, entra na contabilidade como despesa e garante a contribuição ao INSS, que dá direito à aposentadoria e aos benefícios previdenciários.</p>
<div class="formula">INSS do sócio = 11% do pró-labore (limitado a 11% do teto de ${h.brl(p.inss.ceiling)})
IRRF = tabela mensal sobre (pró-labore − INSS − dependentes), com a redução da Lei 15.270
Líquido = pró-labore − INSS − IRRF</div>
<div class="example"><p>Pró-labore de um salário mínimo (${h.brl(p.minimumWage)}) em empresa do Simples: INSS de ${ex.cards[0].value}, IR de ${ex.cards[1].value} e líquido de <strong>${ex.hero.value}</strong>.</p></div>`,
      },
      {
        id: 'custo-empresa',
        title: 'Custo para a empresa',
        html: `${h.table(['Regime', 'INSS patronal sobre o pró-labore'], [['Simples Nacional (Anexos I, II, III e V)', 'não há (já incluído no DAS)'], ['Simples Nacional (Anexo IV)', '20%, pago à parte'], ['Lucro Presumido ou Real', '20%']])}
<p>Para empresas de serviços sujeitas ao Fator R, o pró-labore entra na folha de salários e pode levar a tributação do Anexo V para o Anexo III. Simule na ${h.link('simples-nacional', 'calculadora do Simples Nacional')}.</p>`,
      },
    ],
    faq: [
      { q: 'O pró-labore pode ser menor que o salário mínimo?', a: '<p>Não. A contribuição ao INSS deve ser feita sobre, no mínimo, um salário mínimo.</p>' },
      { q: 'Lucro distribuído paga imposto?', a: '<p>Até 2025, a distribuição de lucros era isenta. A partir de 2026, a Lei 15.270/2025 prevê retenção de 10% sobre lucros acima de R$ 50 mil por mês pagos por uma mesma empresa a uma pessoa física, além de um imposto mínimo para rendas anuais acima de R$ 600 mil. Abaixo desses valores, continua sem IR.</p>' },
    ],
    limitations: ['Não considera outros vínculos do sócio que já atinjam o teto do INSS.'],
  };
}
