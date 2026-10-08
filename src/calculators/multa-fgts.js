import { CURRENT as P } from '../data/params/index.js';
import { brl, row, val } from './_shared.js';
import { round2 } from '../lib/format.js';

export const meta = {
  slug: 'multa-fgts',
  category: 'impostos',
  icon: 'piggy',
  short: 'Multa de 40% do FGTS',
  h1: 'Calculadora da multa de 40% do FGTS',
  title: `Multa de 40% do FGTS ${P.year}: calcule o valor na demissão`,
  description: 'Calcule a multa rescisória do FGTS: 40% na demissão sem justa causa ou 20% no acordo, sobre o saldo para fins rescisórios mais os depósitos da rescisão.',
  lead: 'Informe o saldo do FGTS para fins rescisórios e veja o valor da multa e o total disponível para saque.',
  card: '40% (ou 20% no acordo) e total para saque.',
  keywords: ['multa 40', 'multa fgts', 'multa rescisoria', 'fgts demissao', 'saque fgts'],
  related: ['rescisao-trabalhista', 'fgts', 'seguro-desemprego', 'aviso-previo'],
  sources: ['fgts'],
  legal: true,
};

export const ui = {
  fields: [
    { name: 'balance', label: 'Saldo para fins rescisórios', type: 'money', default: 12500, min: 0.01, help: 'No app FGTS, é o total depositado no contrato, com correções (inclui valores já sacados no saque-aniversário).' },
    { name: 'deposit', label: 'Depósito do mês da rescisão', type: 'money', default: 0, min: 0, required: false, help: 'FGTS sobre saldo de salário, aviso indenizado e 13º, se ainda não depositado.' },
    {
      name: 'reason',
      label: 'Tipo de saída',
      type: 'radio',
      default: 'dismissal',
      options: [
        { value: 'dismissal', label: 'Sem justa causa (40%)' },
        { value: 'agreement', label: 'Acordo (20%)' },
      ],
    },
    { name: 'withdrawn', label: 'Valor já sacado no saque-aniversário', type: 'money', default: 0, min: 0, required: false, advanced: true },
  ],
  validate(v) {
    if (val(v.withdrawn) > v.balance + val(v.deposit)) return { withdrawn: 'O valor sacado não pode ser maior que o saldo para fins rescisórios.' };
    return null;
  },
  compute(v) {
    const base = v.balance + val(v.deposit);
    const rate = v.reason === 'agreement' ? P.fgts.fineMutualAgreement : P.fgts.fineWithoutCause;
    const fine = round2(base * rate);
    const available = Math.max(0, base - val(v.withdrawn));
    const anniversary = val(v.withdrawn) > 0;
    const withdrawal = v.reason === 'agreement' ? available * 0.8 + fine : anniversary ? fine : available + fine;
    return {
      hero: { label: `Multa de ${Math.round(rate * 100)}% do FGTS`, value: brl(fine), sub: `Sobre ${brl(base)}` },
      cards: [{ label: 'Disponível para saque', value: brl(withdrawal), tone: 'plus' }],
      sections: [
        {
          rows: [
            row('Saldo para fins rescisórios', v.balance),
            val(v.deposit) ? row('Depósito da rescisão', v.deposit, 'plus') : null,
            row(`Multa (${Math.round(rate * 100)}%)`, fine, 'plus'),
            anniversary ? row('Saldo atual na conta', available, 'muted') : null,
            row('Total para saque', withdrawal, 'total', anniversary && v.reason === 'dismissal' ? 'Quem optou pelo saque-aniversário saca só a multa' : v.reason === 'agreement' ? '80% do saldo + multa' : 'Saldo + multa'),
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
        title: 'Como a multa é calculada',
        html: `<p>Na dispensa sem justa causa, a empresa paga ao empregado uma indenização de <strong>40%</strong> sobre o total dos depósitos do FGTS feitos durante o contrato, com atualização monetária e juros (Lei 8.036/1990, art. 18, §1º). No acordo do art. 484-A da CLT, a multa cai para <strong>20%</strong>.</p>
<div class="formula">Multa = (saldo para fins rescisórios + depósitos da rescisão) × 40%</div>
<p>O saldo para fins rescisórios considera todos os depósitos do contrato, mesmo os que já foram sacados (por exemplo, no saque-aniversário ou para compra de imóvel).</p>
<div class="example"><p>Saldo de ${h.brl(12500)}: multa de <strong>${ex.hero.value}</strong>; com a dispensa sem justa causa, o total para saque é de ${ex.cards[0].value}.</p></div>`,
      },
      {
        id: 'saque-aniversario',
        title: 'Quem optou pelo saque-aniversário',
        html: `<p>Quem está no saque-aniversário e é demitido sem justa causa recebe a multa de 40% normalmente, mas <strong>não pode sacar o saldo</strong> da conta: ele fica bloqueado e segue disponível só para os saques anuais e as demais hipóteses legais. Veja a ${h.link('saque-aniversario-fgts', 'calculadora do saque-aniversário')}.</p>`,
      },
    ],
    faq: [
      { q: 'A multa de 40% tem desconto de IR?', a: '<p>Não. A multa rescisória do FGTS é isenta de Imposto de Renda e de INSS.</p>' },
      { q: 'Quem paga a multa?', a: '<p>A empresa, que deposita o valor na conta do FGTS do empregado junto com o depósito da rescisão. Desde 2020, não há mais a contribuição adicional de 10% que a empresa pagava ao governo.</p>' },
      { q: 'Pedido de demissão tem multa?', a: '<p>Não. No pedido de demissão e na justa causa não há multa nem saque do FGTS.</p>' },
    ],
    limitations: ['O valor exato depende do saldo para fins rescisórios informado no extrato do FGTS.'],
  };
}
