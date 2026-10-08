import { thirteenth } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, inssHint, irrfHint, salaryField, dependentsField, variableField, val } from './_shared.js';

export const meta = {
  slug: 'decimo-terceiro',
  category: 'trabalho',
  icon: 'gift',
  short: '13º salário',
  h1: 'Calculadora de 13º salário',
  title: `Calculadora de 13º Salário ${P.year}: 1ª e 2ª parcela líquidas`,
  description: `Calcule o 13º salário de ${P.year}: valor da primeira e da segunda parcela, desconto de INSS e IR (com a nova isenção) e o líquido total que você vai receber.`,
  lead: 'Descubra o valor da 1ª parcela (até 30 de novembro), da 2ª parcela (até 20 de dezembro) e o total líquido do seu 13º.',
  card: 'Primeira e segunda parcela com INSS e IR.',
  keywords: ['13 salario', 'decimo terceiro', 'primeira parcela', 'segunda parcela', 'gratificacao natalina'],
  related: ['decimo-terceiro-proporcional', 'ferias', 'salario-liquido', 'plr', 'rescisao-trabalhista'],
  sources: ['thirteenth', 'inss', 'irrf', 'irrfReduction'],
  legal: true,
};

export const ui = {
  fields: [
    salaryField(),
    {
      name: 'months',
      label: 'Meses trabalhados no ano',
      type: 'select',
      numeric: true,
      default: 12,
      options: Array.from({ length: 12 }, (_, i) => ({ value: 12 - i, label: `${12 - i} ${12 - i === 1 ? 'mês' : 'meses'}` })),
      width: 'half',
      help: 'Conte os meses com 15 dias ou mais de trabalho.',
    },
    dependentsField(),
    variableField(),
    { name: 'advance', label: '1ª parcela já recebida (valor)', type: 'money', min: 0, required: false, advanced: true, help: 'Se recebeu um valor diferente de metade (por exemplo, nas férias), informe aqui.' },
  ],
  validate(v) {
    const gross = ((v.salary + val(v.variable)) / 12) * v.months;
    if (Number.isFinite(v.advance) && v.advance > gross) return { advance: 'O adiantamento não pode ser maior que o 13º bruto.' };
    return null;
  },
  compute(v) {
    const r = thirteenth({
      salary: v.salary,
      variableAverage: val(v.variable),
      twelfths: v.months,
      dependents: val(v.dependents),
      advancePaid: Number.isFinite(v.advance) ? v.advance : null,
    });
    return {
      hero: { label: '13º salário líquido', value: brl(r.net), sub: `${r.twelfths}/12 avos — bruto de ${brl(r.gross)}` },
      cards: [
        { label: '1ª parcela (até 30/11)', value: brl(r.first), sub: 'Sem descontos' },
        { label: '2ª parcela (até 20/12)', value: brl(r.second), sub: 'Com INSS e IR' },
      ],
      sections: [
        {
          title: 'Demonstrativo',
          rows: [
            row(`13º bruto (${r.twelfths}/12)`, r.gross, 'plus'),
            row('INSS', r.inss.value, 'minus', inssHint(r.inss)),
            row('IRRF', r.irrf.value, 'minus', irrfHint(r.irrf)),
            row('13º líquido', r.net, 'total'),
          ],
        },
        {
          title: 'Parcelas',
          rows: [
            row('1ª parcela (adiantamento)', r.first, null, 'Metade do bruto, sem descontos'),
            row('2ª parcela', r.second, 'strong', 'Bruto − 1ª parcela − INSS − IRRF'),
          ],
        },
      ],
    };
  },
};

export function content(ex, h) {
  const p = h.P;
  return {
    sections: [
      {
        id: 'como-calcular',
        title: 'Como calcular o 13º salário',
        html: `<p>O 13º salário (gratificação natalina) equivale a 1/12 da remuneração de dezembro por mês trabalhado no ano. Meses com <strong>15 dias ou mais</strong> de trabalho contam como mês inteiro (Lei 4.090/1962).</p>
<div class="formula">13º bruto = (salário + média de adicionais) ÷ 12 × meses trabalhados
1ª parcela = 13º bruto ÷ 2                (sem descontos)
2ª parcela = 13º bruto − 1ª parcela − INSS − IRRF</div>
<p>O INSS é calculado sobre o 13º inteiro, com a tabela progressiva. O Imposto de Renda é retido <strong>exclusivamente na fonte</strong>, separado do salário de dezembro, e desde ${p.year} recebe a mesma redução da Lei 15.270/2025: quem tem 13º de até ${h.brl(p.irrf.reduction.zeroTaxUpTo)} não paga IR sobre ele.</p>`,
      },
      {
        id: 'exemplo',
        title: 'Exemplo resolvido',
        html: `<div class="example"><p>Salário de ${h.brl(3500)}, ano completo, sem dependentes:</p><ul>
<li>13º bruto: ${h.brl(3500)}</li><li>1ª parcela: ${ex.cards[0].value}</li>
<li>INSS: ${ex.sections[0].rows[1].value}; IRRF: ${ex.sections[0].rows[2].value}</li>
<li>2ª parcela: ${ex.cards[1].value}</li><li><strong>Total líquido: ${ex.hero.value}</strong></li></ul></div>`,
      },
      {
        id: 'prazos',
        title: 'Prazos de pagamento',
        html: `${h.table(['Parcela', 'Prazo', 'Descontos'], [
          ['1ª parcela', 'entre 1º de fevereiro e 30 de novembro (ou nas férias, se pedido em janeiro)', 'nenhum'],
          ['2ª parcela', 'até 20 de dezembro', 'INSS e IRRF sobre o valor total'],
        ])}
<p>Se o dia 30 de novembro ou 20 de dezembro cair em fim de semana ou feriado, a empresa deve antecipar o pagamento. Na rescisão, o 13º proporcional é pago junto com as demais verbas — veja a ${h.link('rescisao-trabalhista', 'calculadora de rescisão')}.</p>`,
      },
    ],
    faq: [
      { q: 'Quem foi contratado durante o ano recebe 13º?', a: `<p>Sim, de forma proporcional: 1/12 por mês com 15 dias ou mais trabalhados. Use a ${h.link('decimo-terceiro-proporcional', 'calculadora de 13º proporcional')} para contar os avos a partir da data de admissão.</p>` },
      { q: 'Horas extras entram no 13º?', a: '<p>Sim. A média das horas extras, comissões e adicionais habituais do ano integra o 13º (Súmula 45 do TST). Informe a média em "Mais opções".</p>' },
      { q: 'Faltas reduzem o 13º?', a: '<p>Faltas injustificadas podem fazer um mês ficar com menos de 15 dias trabalhados; nesse caso, o mês não conta. Faltas justificadas não reduzem o 13º.</p>' },
      { q: 'Por que o desconto do IR do 13º é diferente do salário?', a: '<p>Porque o 13º tem tributação exclusiva: o imposto é calculado só sobre ele, com a tabela mensal, as deduções de INSS e dependentes e a redução da Lei 15.270/2025.</p>' },
    ],
    limitations: [
      'Para o IR do 13º, a calculadora usa apenas as deduções legais (INSS e dependentes), sem o desconto simplificado, que é a forma de cálculo mais conservadora.',
      'Não considera pensão alimentícia sobre o 13º.',
      'A média de adicionais deve ser informada pelo usuário.',
    ],
  };
}
