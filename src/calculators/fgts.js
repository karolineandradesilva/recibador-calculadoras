import { fgtsProjection } from '../calc/company.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, salaryField, val } from './_shared.js';

export const meta = {
  slug: 'fgts',
  category: 'impostos',
  icon: 'piggy',
  short: 'FGTS',
  h1: 'Calculadora de FGTS',
  title: `Calculadora de FGTS ${P.year}: depósito mensal e saldo estimado`,
  description: 'Calcule o depósito mensal do FGTS (8% do salário) e estime o saldo acumulado ao longo do tempo, com rendimento de 3% ao ano e a multa de 40% em caso de demissão.',
  lead: 'Veja quanto a empresa deposita por mês no seu FGTS e quanto você deve acumular ao longo dos anos.',
  card: 'Depósito mensal de 8% e saldo projetado.',
  keywords: ['fgts', 'deposito fgts', 'saldo fgts', '8%', 'fundo de garantia', 'quanto tenho de fgts'],
  related: ['multa-fgts', 'saque-aniversario-fgts', 'rescisao-trabalhista', 'salario-liquido'],
  sources: ['fgts'],
  legal: true,
};

export const ui = {
  fields: [
    salaryField(),
    { name: 'months', label: 'Período', type: 'integer', default: 24, min: 1, max: 600, suffix: 'meses', width: 'half' },
    { name: 'balance', label: 'Saldo atual', type: 'money', default: 0, min: 0, required: false, width: 'half' },
    {
      name: 'type',
      label: 'Tipo de contrato',
      type: 'radio',
      default: 'regular',
      options: [
        { value: 'regular', label: 'Empregado (8%)' },
        { value: 'apprentice', label: 'Aprendiz (2%)' },
      ],
    },
  ],
  compute(v) {
    const r = fgtsProjection({ salary: v.salary, months: v.months, currentBalance: val(v.balance), apprentice: v.type === 'apprentice' });
    return {
      hero: { label: 'Saldo estimado do FGTS', value: brl(r.balance), sub: `Em ${v.months} ${v.months === 1 ? 'mês' : 'meses'}` },
      cards: [
        { label: 'Depósito mensal', value: brl(r.monthlyDeposit) },
        { label: 'Multa de 40% (se demitido)', value: brl(r.fine40), tone: 'plus' },
      ],
      sections: [
        {
          rows: [
            val(v.balance) ? row('Saldo inicial', v.balance) : null,
            row('Depósitos no período (inclui 13º)', r.deposits, 'plus'),
            row('Rendimento (3% a.a.)', r.yieldValue, 'plus'),
            row('Saldo estimado', r.balance, 'total'),
          ],
        },
      ],
      notes: ['Estimativa sem TR e sem distribuição de lucros do FGTS, que costumam elevar um pouco o rendimento.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-funciona',
        title: 'Como funciona o FGTS',
        html: `<p>O Fundo de Garantia do Tempo de Serviço é um depósito mensal feito pela empresa, <strong>sem desconto no salário</strong>, em uma conta da Caixa vinculada ao contrato de trabalho. A empresa deposita 8% da remuneração (2% para aprendizes e 8% + 3,2% de indenização compensatória para domésticos) até o dia 20 do mês seguinte, inclusive sobre o 13º e sobre as férias gozadas.</p>
<div class="formula">Depósito mensal = remuneração × 8%
Saldo = saldo anterior × (1 + rendimento) + depósito</div>
<div class="example"><p>Salário de ${h.brl(3500)}: depósito de ${ex.cards[0].value} por mês. Em 24 meses, o saldo estimado é de <strong>${ex.hero.value}</strong>.</p></div>`,
      },
      {
        id: 'rendimento',
        title: 'Quanto o FGTS rende',
        html: '<p>Por lei, as contas rendem 3% ao ano mais a TR (Lei 8.036/1990, art. 13). Desde 2024, por decisão do STF (ADI 5090), a remuneração total não pode ficar abaixo do IPCA; quando fica, o Conselho Curador complementa com distribuição de lucros. Por isso, esta calculadora mostra uma estimativa conservadora.</p>',
      },
      {
        id: 'saque',
        title: 'Quando é possível sacar',
        html: `<ul><li>Demissão sem justa causa (com multa de 40%) ou acordo (80% do saldo e multa de 20%). Veja a ${h.link('multa-fgts', 'calculadora da multa')}.</li>
<li>Saque-aniversário, para quem optar. Veja a ${h.link('saque-aniversario-fgts', 'calculadora do saque-aniversário')}.</li>
<li>Compra da casa própria, aposentadoria, doenças graves, calamidades e conta inativa por 3 anos, entre outras hipóteses do art. 20 da Lei 8.036/1990.</li></ul>`,
      },
    ],
    faq: [
      { q: 'O FGTS é descontado do meu salário?', a: '<p>Não. É uma obrigação da empresa, paga além do salário.</p>' },
      { q: 'Como consultar o saldo real?', a: '<p>Pelo aplicativo FGTS da Caixa, que mostra os depósitos mês a mês. Se algum mês não foi depositado, procure o RH e, se necessário, denuncie ao Ministério do Trabalho.</p>' },
    ],
    limitations: ['Projeção com salário constante e sem TR; depósitos sobre férias e horas extras não são incluídos.'],
  };
}
