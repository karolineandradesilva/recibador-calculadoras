import { fgtsAnniversary } from '../calc/company.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, pct, row } from './_shared.js';

export const meta = {
  slug: 'saque-aniversario-fgts',
  category: 'impostos',
  icon: 'gift',
  short: 'Saque-aniversário do FGTS',
  h1: 'Calculadora do saque-aniversário do FGTS',
  title: `Saque-Aniversário FGTS ${P.year}: quanto você pode sacar`,
  description: 'Descubra quanto você pode sacar no saque-aniversário do FGTS, pela tabela de alíquotas e parcela adicional da Lei 13.932/2019, e quanto fica na conta.',
  lead: 'Informe o saldo total do FGTS e veja o valor do saque-aniversário deste ano.',
  card: 'Valor do saque anual pela tabela oficial.',
  keywords: ['saque aniversario', 'fgts', 'saque anual', 'antecipacao saque aniversario'],
  related: ['fgts', 'multa-fgts', 'rescisao-trabalhista'],
  sources: ['fgtsAnniversary'],
  legal: true,
};

export const ui = {
  fields: [{ name: 'balance', label: 'Saldo total do FGTS (todas as contas)', type: 'money', default: 7800, min: 0.01 }],
  compute(v) {
    const r = fgtsAnniversary(v.balance);
    return {
      hero: { label: 'Valor do saque-aniversário', value: brl(r.value), sub: `${pct(r.rate, 0)} do saldo${r.extra ? ` + ${brl(r.extra)}` : ''}` },
      sections: [
        {
          rows: [
            row('Saldo total', v.balance),
            row('Valor do saque', r.value, 'plus'),
            row('Permanece na conta', r.remaining, 'total'),
          ],
        },
      ],
      notes: ['O saque fica disponível a partir do 1º dia útil do mês de aniversário, por 90 dias.'],
    };
  },
};

export function content(ex, h) {
  const t = h.P.fgts.anniversaryWithdrawal;
  return {
    sections: [
      {
        id: 'tabela',
        title: 'Tabela do saque-aniversário',
        html: `${h.table(['Saldo total do FGTS', 'Alíquota', 'Parcela adicional'], t.map((b, i) => [
          i === 0 ? `até ${h.brl(b.upTo)}` : b.upTo === Infinity ? `acima de ${h.brl(t[i - 1].upTo)}` : `de ${h.brl(t[i - 1].upTo + 0.01)} a ${h.brl(b.upTo)}`,
          h.pct(b.rate, 0),
          b.extra ? h.brl(b.extra) : '—',
        ]))}
<div class="formula">Saque = saldo × alíquota + parcela adicional</div>
<div class="example"><p>Saldo de ${h.brl(7800)}: <strong>${ex.hero.value}</strong> (${ex.hero.sub}).</p></div>`,
      },
      {
        id: 'pros-e-contras',
        title: 'Vale a pena aderir?',
        html: `<p>O saque-aniversário libera um valor todo ano, mas tem um custo importante: <strong>se você for demitido sem justa causa, não poderá sacar o saldo</strong> — só a multa de 40%. Além disso, quem desiste da modalidade só volta ao saque-rescisão depois de 25 meses.</p>
<p>Ele faz mais sentido para quem tem estabilidade no emprego e um saldo alto parado. Antes de aderir para pegar a "antecipação" em bancos, compare a taxa de juros cobrada com outras formas de crédito na ${h.link('parcelamento', 'calculadora de parcelamento')}.</p>`,
      },
    ],
    faq: [
      { q: 'O saldo considerado é de todas as contas?', a: '<p>Sim. A alíquota é aplicada sobre a soma dos saldos de todas as contas do FGTS (ativas e inativas) do trabalhador.</p>' },
      { q: 'O saque-aniversário tem IR?', a: '<p>Não. Os saques do FGTS não são tributados.</p>' },
    ],
    limitations: ['O valor efetivo é calculado pela Caixa sobre o saldo do último dia do mês anterior ao de aniversário.'],
  };
}
