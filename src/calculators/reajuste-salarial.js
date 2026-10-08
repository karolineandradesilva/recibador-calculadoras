import { netSalary } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, pct, salaryField, dependentsField, val, frac } from './_shared.js';

export const meta = {
  slug: 'reajuste-salarial',
  category: 'trabalho',
  icon: 'trending',
  short: 'Reajuste salarial',
  h1: 'Calculadora de reajuste e aumento salarial',
  title: `Reajuste Salarial ${P.year}: novo salário, líquido e retroativo`,
  description: 'Calcule o novo salário após um reajuste percentual ou descubra o percentual de aumento. Veja quanto muda no líquido e o valor retroativo a receber.',
  lead: 'Aplique o percentual do dissídio ou da promoção e veja o novo salário bruto, o novo líquido e quanto você tem a receber de retroativo.',
  card: 'Novo salário, ganho no líquido e retroativo.',
  keywords: ['reajuste salarial', 'aumento de salario', 'dissidio', 'retroativo', 'percentual de aumento', 'promocao'],
  related: ['salario-liquido', 'aumento-percentual', 'correcao-monetaria', 'inflacao'],
  sources: ['inss', 'irrf', 'irrfReduction'],
  legal: true,
};

export const ui = {
  fields: [
    {
      name: 'mode',
      label: 'O que você sabe?',
      type: 'radio',
      default: 'percent',
      options: [
        { value: 'percent', label: 'O percentual' },
        { value: 'newSalary', label: 'O novo salário' },
      ],
    },
    salaryField({ label: 'Salário atual (bruto)' }),
    { name: 'rate', label: 'Reajuste', type: 'percent', default: 5.5, min: -100, max: 1000, width: 'half', showIf: (v) => v.mode === 'percent' },
    { name: 'newSalary', label: 'Novo salário (bruto)', type: 'money', default: 3800, min: 0.01, width: 'half', showIf: (v) => v.mode === 'newSalary' },
    { name: 'months', label: 'Meses de retroativo', type: 'integer', default: 0, min: 0, max: 24, required: false, width: 'half', help: 'Meses entre a data-base e o pagamento.' },
    dependentsField({ advanced: true }),
  ],
  compute(v) {
    const before = v.salary;
    const after = v.mode === 'percent' ? before * (1 + frac(v.rate)) : v.newSalary;
    const rate = after / before - 1;
    const d = val(v.dependents);
    const n0 = netSalary({ gross: before, dependents: d });
    const n1 = netSalary({ gross: after, dependents: d });
    const months = val(v.months);
    const retro = (after - before) * months;
    const netGain = n1.net - n0.net;
    return {
      hero: { label: 'Novo salário bruto', value: brl(after), sub: `${rate >= 0 ? 'Aumento' : 'Redução'} de ${pct(Math.abs(rate))} (${brl(after - before)})` },
      cards: [
        { label: 'Líquido antes', value: brl(n0.net) },
        { label: 'Líquido depois', value: brl(n1.net), tone: 'plus' },
        { label: 'Ganho no líquido', value: brl(netGain), sub: n0.net > 0 ? `${pct(netGain / n0.net)} a mais no bolso` : '' },
      ],
      sections: [
        {
          rows: [
            row('Salário bruto atual', before),
            row('Novo salário bruto', after, 'strong'),
            row('Diferença bruta mensal', after - before, 'plus'),
            row('Diferença líquida mensal', netGain, 'plus', 'Após INSS e IR'),
            months ? row(`Retroativo bruto (${months} ${months === 1 ? 'mês' : 'meses'})`, retro, 'total', 'Mais reflexos em férias, 13º e FGTS, se for o caso') : null,
          ],
        },
      ],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-calcular',
        title: 'Como calcular o reajuste',
        html: `<div class="formula">Novo salário = salário atual × (1 + reajuste ÷ 100)
Percentual = (novo salário ÷ salário atual − 1) × 100
Retroativo = (novo − atual) × meses desde a data-base</div>
<div class="example"><p>Salário de ${h.brl(3500)} com reajuste de 5,5%: ${ex.hero.value} (${ex.hero.sub.toLowerCase()}). No líquido, o ganho é de ${ex.cards[2].value}.</p></div>`,
      },
      {
        id: 'bruto-x-liquido',
        title: 'Por que o aumento no líquido é menor',
        html: `<p>INSS e Imposto de Renda são progressivos: quanto maior o salário, maior a fatia descontada. Por isso, um aumento de 10% no bruto quase nunca vira 10% no líquido. Em ${h.P.year}, há ainda um efeito importante entre ${h.brl(h.P.irrf.reduction.zeroTaxUpTo)} e ${h.brl(h.P.irrf.reduction.phaseOutUpTo)}: nessa faixa, a redução do IR da Lei 15.270/2025 diminui à medida que o salário sobe, então parte do aumento é absorvida pelo imposto.</p>`,
      },
      {
        id: 'dissidio',
        title: 'Dissídio, data-base e inflação',
        html: `<p>O reajuste anual da categoria é negociado na data-base, em acordo ou convenção coletiva, e muitas vezes tem como referência o INPC acumulado em 12 meses. Para saber se o reajuste repôs a inflação, compare com a ${h.link('inflacao', 'calculadora de inflação')}. Quando a convenção é assinada depois da data-base, as diferenças dos meses anteriores são pagas como retroativo.</p>`,
      },
    ],
    faq: [
      { q: 'Retroativo tem desconto de INSS e IR?', a: '<p>Sim. As diferenças salariais retroativas são remuneração e sofrem INSS e IR. Dependendo da forma de pagamento, o IR pode seguir a regra de rendimentos recebidos acumuladamente (RRA).</p>' },
      { q: 'O reajuste pode ser menor que a inflação?', a: '<p>Pode. A lei não obriga a reposição integral da inflação para salários acima do mínimo; o percentual é definido em negociação coletiva ou pela empresa.</p>' },
    ],
    limitations: ['O retroativo é mostrado em valor bruto e sem reflexos em férias, 13º e FGTS.'],
  };
}
