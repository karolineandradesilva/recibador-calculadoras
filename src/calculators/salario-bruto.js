import { grossFromNet } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, pct, row, inssHint, irrfHint, dependentsField, val } from './_shared.js';

export const meta = {
  slug: 'salario-bruto',
  category: 'trabalho',
  icon: 'wallet',
  short: 'Salário bruto (líquido → bruto)',
  h1: 'Calculadora de salário bruto a partir do líquido',
  title: `Salário Bruto a partir do Líquido ${P.year}: calcule o inverso`,
  description: `Quer receber um valor líquido específico? Descubra o salário bruto necessário, já considerando INSS, IRRF de ${P.year}, dependentes e vale-transporte.`,
  lead: 'Informe quanto quer receber na conta e descubra qual salário bruto pedir na proposta ou na negociação.',
  card: 'Quanto pedir de bruto para receber o líquido desejado.',
  keywords: ['bruto', 'liquido para bruto', 'inverso', 'proposta', 'negociar salario', 'pretensao salarial'],
  related: ['salario-liquido', 'clt-x-pj', 'reajuste-salarial', 'custo-de-funcionario'],
  sources: ['inss', 'irrf', 'irrfReduction'],
  legal: true,
};

export const ui = {
  fields: [
    { name: 'net', label: 'Salário líquido desejado', type: 'money', default: 5000, min: 1, max: 5000000, requiredMessage: 'Informe o líquido que deseja receber.' },
    dependentsField(),
    { name: 'transport', label: 'Custo do vale-transporte', type: 'money', default: 0, min: 0, required: false, width: 'half', help: 'Opcional. O desconto é de até 6% do salário.' },
    { name: 'other', label: 'Outros descontos fixos', type: 'money', default: 0, min: 0, required: false, advanced: true, help: 'Plano de saúde, refeição ou outros descontos mensais que você quer cobrir.' },
  ],
  compute(v) {
    const r = grossFromNet({ net: v.net, dependents: val(v.dependents), transportCost: val(v.transport), otherDiscounts: val(v.other) });
    const d = r.detail;
    return {
      hero: { label: 'Salário bruto necessário', value: brl(r.gross), sub: `Para receber ${brl(d.net)} líquidos por mês` },
      cards: [
        { label: 'Total de descontos', value: brl(d.discounts), tone: 'minus' },
        { label: 'Peso dos descontos', value: pct(d.discounts / r.gross, 1), sub: 'sobre o bruto' },
      ],
      sections: [
        {
          title: 'Conferência',
          rows: [
            row('Salário bruto', r.gross),
            row('INSS', d.inss.value, 'minus', inssHint(d.inss)),
            row('Imposto de Renda', d.irrf.value, 'minus', irrfHint(d.irrf)),
            d.transport ? row('Vale-transporte', d.transport, 'minus') : null,
            d.otherDiscounts ? row('Outros descontos', d.otherDiscounts, 'minus') : null,
            row('Salário líquido', d.net, 'total'),
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
        id: 'para-que-serve',
        title: 'Para que serve',
        html: `<p>Em processos seletivos e negociações, as empresas quase sempre falam em <strong>salário bruto</strong>, mas o que importa no dia a dia é o valor <strong>líquido</strong>. Esta calculadora faz a conta ao contrário: você informa o líquido que precisa e ela encontra o bruto que, depois de INSS e Imposto de Renda, chega a esse valor.</p>
<p>É útil para responder à pergunta de pretensão salarial, comparar propostas e avaliar se um aumento compensa. Para o caminho normal (do bruto para o líquido), use a ${h.link('salario-liquido', 'calculadora de salário líquido')}.</p>`,
      },
      {
        id: 'como-funciona',
        title: 'Como o cálculo funciona',
        html: `<p>Não existe uma fórmula direta do líquido para o bruto, porque o INSS e o IR são progressivos e o IR ainda tem a redução da Lei 15.270/2025 entre ${h.brl(p.irrf.reduction.zeroTaxUpTo)} e ${h.brl(p.irrf.reduction.phaseOutUpTo)}. Por isso, a calculadora usa um método numérico: testa salários brutos até encontrar o menor valor, ao centavo, cujo líquido é igual ou superior ao desejado.</p>
<div class="formula">Encontrar o menor B tal que:
B − INSS(B) − IRRF(B) − outros descontos ≥ líquido desejado</div>
<p>O resultado é conferido no demonstrativo ao lado: aplicando os descontos sobre o bruto encontrado, você chega ao líquido pedido.</p>`,
      },
      {
        id: 'exemplo',
        title: 'Exemplo',
        html: `<div class="example"><p>Para receber <strong>${h.brl(5000)}</strong> líquidos por mês, sem dependentes, é preciso um salário bruto de <strong>${ex.hero.value}</strong>. Os descontos somam ${ex.cards[0].value} (${ex.cards[1].value} do bruto).</p></div>
<p>Repare que, perto da faixa de R$ 5 mil a R$ 7,35 mil, um aumento no bruto pode render menos no líquido do que parece, porque a redução do IR diminui conforme o salário sobe.</p>`,
      },
    ],
    faq: [
      { q: 'Por que o líquido do resultado pode passar alguns centavos do valor pedido?', a: '<p>O salário bruto é procurado ao centavo, e os descontos são arredondados ao centavo. O resultado é o menor bruto que garante pelo menos o líquido desejado.</p>' },
      { q: 'Devo pedir o bruto calculado em uma entrevista?', a: '<p>Ele é um bom ponto de partida. Lembre-se de considerar benefícios (vale-refeição, plano de saúde, PLR) e o custo dos descontos que a empresa pode fazer, como a coparticipação do plano de saúde.</p>' },
      { q: 'A calculadora serve para PJ?', a: `<p>Não. Para comparar uma proposta PJ com uma CLT, use a ${h.link('clt-x-pj', 'calculadora CLT x PJ')}.</p>` },
    ],
    limitations: [
      'Considera um mês cheio, sem horas extras, faltas ou adicionais.',
      'Não considera pensão alimentícia ou previdência privada.',
      'O IR anual pode diferir do retido na fonte.',
    ],
  };
}
