import { brl, row, pct, frac } from './_shared.js';

export const meta = {
  slug: 'aumento-percentual',
  category: 'dia-a-dia',
  icon: 'trending',
  short: 'Aumento percentual',
  h1: 'Calculadora de aumento percentual',
  title: 'Calculadora de Aumento Percentual: novo valor ou % de aumento',
  description: 'Calcule o novo valor depois de um aumento percentual, descubra o percentual de aumento entre dois valores ou encontre o valor original antes do aumento.',
  lead: 'Aplique um aumento, descubra de quanto foi o aumento ou volte ao valor original.',
  card: 'Novo valor, % de aumento ou valor original.',
  keywords: ['aumento percentual', 'acrescimo', 'quanto aumentou', 'valor com aumento', 'reajuste'],
  related: ['porcentagem', 'desconto', 'reajuste-salarial', 'reajuste-aluguel'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    {
      name: 'mode',
      label: 'O que você quer saber?',
      type: 'select',
      default: 'apply',
      options: [
        { value: 'apply', label: 'Valor depois do aumento' },
        { value: 'rate', label: 'Qual foi o aumento (%)' },
        { value: 'original', label: 'Valor antes do aumento' },
      ],
    },
    { name: 'value', label: 'Valor', type: 'money', default: 1250, min: 0.01, width: 'half', help: 'Valor original (ou final, para descobrir o original).' },
    { name: 'rate', label: 'Aumento', type: 'percent', default: 8, min: -99.99, max: 100000, width: 'half', showIf: (v) => v.mode !== 'rate' },
    { name: 'final', label: 'Valor final', type: 'money', default: 1400, min: 0, width: 'half', showIf: (v) => v.mode === 'rate' },
  ],
  compute(v) {
    if (v.mode === 'apply') {
      const r = v.value * (1 + frac(v.rate));
      return { hero: { label: 'Valor com aumento', value: brl(r), sub: `${brl(v.value)} + ${pct(frac(v.rate))}` }, sections: [{ rows: [row('Valor original', v.value), row('Acréscimo', r - v.value, 'plus'), row('Novo valor', r, 'total')] }] };
    }
    if (v.mode === 'rate') {
      const r = v.final / v.value - 1;
      return { hero: { label: r >= 0 ? 'Aumento de' : 'Redução de', value: pct(Math.abs(r)), tone: 'neutral', sub: `De ${brl(v.value)} para ${brl(v.final)} (${brl(v.final - v.value)})` } };
    }
    const r = v.value / (1 + frac(v.rate));
    return { hero: { label: 'Valor antes do aumento', value: brl(r), sub: `${brl(v.value)} ÷ ${(1 + frac(v.rate)).toFixed(4).replace('.', ',')}` }, notes: ['Para "tirar" um aumento, divida pelo fator — não subtraia o mesmo percentual.'] };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'formulas',
        title: 'Fórmulas',
        html: `<div class="formula">Novo valor = valor × (1 + aumento ÷ 100)
Aumento % = (final ÷ inicial − 1) × 100
Valor original = valor final ÷ (1 + aumento ÷ 100)</div>
<div class="example"><p>${h.brl(1250)} com aumento de 8%: <strong>${ex.hero.value}</strong>.</p></div>
<p>Atenção: se um produto de ${h.brl(108)} já inclui 8% de aumento, o original é 108 ÷ 1,08 = ${h.brl(100)}, e não 108 − 8% = ${h.brl(99.36)}.</p>`,
      },
      {
        id: 'aplicacoes',
        title: 'Onde usar',
        html: `<p>Reajustes de preços, mensalidades, planos e contratos. Para salários, a ${h.link('reajuste-salarial', 'calculadora de reajuste salarial')} mostra também o efeito no líquido; para aluguel, use a ${h.link('reajuste-aluguel', 'de reajuste de aluguel')}, que já busca o índice oficial.</p>`,
      },
    ],
    faq: [{ q: 'Dois aumentos de 10% dão 20%?', a: '<p>Não: dão 21%, porque o segundo aumento incide sobre o valor já aumentado (1,1 × 1,1 = 1,21).</p>' }],
    limitations: [],
  };
}
