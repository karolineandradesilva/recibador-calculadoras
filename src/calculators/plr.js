import { irrfPlr } from '../calc/tax.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, pct, val } from './_shared.js';

export const meta = {
  slug: 'plr',
  category: 'trabalho',
  icon: 'coins',
  short: 'PLR (participação nos lucros)',
  h1: 'Calculadora de PLR e Imposto de Renda',
  title: `Calculadora de PLR ${P.year}: Imposto de Renda e valor líquido`,
  description: 'Calcule o Imposto de Renda sobre a PLR (participação nos lucros) pela tabela exclusiva da Receita, com isenção até R$ 8.214,40 e soma das parcelas do ano.',
  lead: 'Descubra quanto vai sobrar da sua PLR depois do Imposto de Renda, considerando as parcelas já recebidas no ano.',
  card: 'IR pela tabela exclusiva da PLR e valor líquido.',
  keywords: ['plr', 'participacao nos lucros', 'imposto plr', 'tabela plr', 'bonus'],
  related: ['decimo-terceiro', 'salario-liquido', 'imposto-de-renda'],
  sources: ['plr'],
  extraSources: [{ label: 'Lei nº 10.101/2000 — participação nos lucros ou resultados', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10101.htm' }],
  legal: true,
};

export const ui = {
  fields: [
    { name: 'amount', label: 'Valor bruto da PLR', type: 'money', default: 12000, min: 0.01 },
    { name: 'previous', label: 'PLR já recebida no ano', type: 'money', default: 0, min: 0, required: false, width: 'half' },
    { name: 'previousTax', label: 'IR já retido sobre ela', type: 'money', default: 0, min: 0, required: false, width: 'half' },
    { name: 'alimony', label: 'Pensão alimentícia sobre a PLR', type: 'money', default: 0, min: 0, required: false, advanced: true },
  ],
  validate(v) {
    if (val(v.alimony) > v.amount) return { alimony: 'A pensão não pode ser maior que a PLR.' };
    if (val(v.previousTax) > val(v.previous)) return { previousTax: 'O IR retido não pode ser maior que a PLR já recebida.' };
    return null;
  },
  compute(v) {
    const r = irrfPlr({ amount: v.amount, previousInYear: val(v.previous), previousTaxWithheld: val(v.previousTax), alimony: val(v.alimony) });
    const net = v.amount - r.value - val(v.alimony);
    return {
      hero: { label: 'PLR líquida', value: brl(net), sub: `IR de ${brl(r.value)} (${pct(r.value / v.amount)} desta parcela)` },
      sections: [
        {
          rows: [
            row('PLR bruta', v.amount, 'plus'),
            val(v.previous) ? row('Base acumulada no ano', r.base, 'muted') : null,
            row('Imposto de Renda', r.value, 'minus', r.rate ? `Faixa de ${pct(r.rate, 1)}` : 'Faixa isenta'),
            val(v.alimony) ? row('Pensão alimentícia', v.alimony, 'minus') : null,
            row('PLR líquida', net, 'total'),
          ],
        },
      ],
      notes: ['A PLR não tem desconto de INSS nem depósito de FGTS (Lei 10.101/2000, art. 3º).'],
    };
  },
};

export function content(ex, h) {
  const t = h.P.irrf.plr;
  return {
    sections: [
      {
        id: 'tabela',
        title: 'Tabela do Imposto de Renda sobre a PLR',
        html: `${h.table(['Valor anual da PLR', 'Alíquota', 'Parcela a deduzir'], t.map((b, i) => [
          i === 0 ? `até ${h.brl(b.upTo)}` : b.upTo === Infinity ? `acima de ${h.brl(t[i - 1].upTo)}` : `de ${h.brl(t[i - 1].upTo + 0.01)} a ${h.brl(b.upTo)}`,
          b.rate ? h.pct(b.rate, 1) : 'isento',
          b.deduction ? h.brl(b.deduction) : '—',
        ]))}
<p>A PLR tem <strong>tributação exclusiva na fonte</strong>, com tabela própria e anual, separada do salário. Quando há mais de um pagamento no mesmo ano, os valores são somados, o imposto é recalculado sobre o total e desconta-se o que já foi retido.</p>`,
      },
      {
        id: 'como-calcular',
        title: 'Como calcular',
        html: `<div class="formula">IR = (PLR do ano × alíquota − parcela a deduzir) − IR já retido no ano
PLR líquida = PLR bruta − IR</div>
<div class="example"><p>PLR de ${h.brl(12000)}, sem pagamentos anteriores no ano: ${ex.hero.sub.toLowerCase()}. Líquido: <strong>${ex.hero.value}</strong>.</p></div>`,
      },
    ],
    faq: [
      { q: 'A isenção de R$ 5 mil vale para a PLR?', a: '<p>Não. A redução da Lei 15.270/2025 vale para os rendimentos mensais e para o 13º. A PLR continua com sua tabela exclusiva, que já tem uma faixa isenta própria.</p>' },
      { q: 'PLR entra na declaração anual?', a: '<p>Sim, como rendimento sujeito à tributação exclusiva/definitiva. Ela não altera o imposto a pagar ou a restituir da declaração.</p>' },
      { q: 'Bônus é a mesma coisa que PLR?', a: '<p>Não. Bônus e gratificações são salário: têm INSS, FGTS e IR pela tabela mensal. Só tem tributação exclusiva a PLR paga conforme a Lei 10.101/2000, com acordo ou programa negociado.</p>' },
    ],
    limitations: ['Considera a tabela da PLR vigente desde maio de 2025, mantida em 2026.'],
  };
}
