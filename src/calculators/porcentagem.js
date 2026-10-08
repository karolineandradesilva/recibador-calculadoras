import { percentOf, whatPercent, variation } from '../calc/everyday.js';
import { num } from '../lib/format.js';

export const meta = {
  slug: 'porcentagem',
  category: 'dia-a-dia',
  icon: 'percent',
  short: 'Porcentagem',
  h1: 'Calculadora de porcentagem',
  title: 'Calculadora de Porcentagem: X% de Y, quanto % é e variação',
  description: 'Calcule porcentagem de forma rápida: quanto é X% de um valor, quantos por cento um número representa de outro e a variação percentual entre dois valores.',
  lead: 'Três contas de porcentagem em uma só página: X% de um valor, quanto % um número representa e a variação entre dois valores.',
  card: 'X% de Y, quanto % é e variação percentual.',
  keywords: ['porcentagem', 'calcular porcentagem', 'quanto e x por cento', 'variacao percentual', 'percentual', '%'],
  related: ['aumento-percentual', 'desconto', 'regra-de-tres', 'markup'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    {
      name: 'mode',
      label: 'Qual conta?',
      type: 'select',
      default: 'of',
      options: [
        { value: 'of', label: 'Quanto é X% de um valor' },
        { value: 'what', label: 'X é quantos % de Y' },
        { value: 'change', label: 'Variação % entre valores' },
      ],
    },
    { name: 'a', label: 'Percentual (X)', type: 'number', default: 15, width: 'half', decimals: undefined },
    { name: 'b', label: 'Valor (Y)', type: 'number', default: 280, width: 'half' },
  ],
  onChange(v, form) {
    const labels = {
      of: ['Percentual (X)', 'Valor (Y)'],
      what: ['Parte (X)', 'Total (Y)'],
      change: ['Valor inicial', 'Valor final'],
    }[v.mode];
    form.querySelector('#f-a-label').firstChild.textContent = labels[0];
    form.querySelector('#f-b-label').firstChild.textContent = labels[1];
  },
  validate(v) {
    if ((v.mode === 'what' || v.mode === 'change') && v[v.mode === 'what' ? 'b' : 'a'] === 0) return { [v.mode === 'what' ? 'b' : 'a']: 'O valor não pode ser zero nesta conta.' };
    return null;
  },
  compute(v) {
    if (v.mode === 'of') {
      const r = percentOf(v.a, v.b);
      return { hero: { label: `${num(v.a, dec(v.a))}% de ${num(v.b, dec(v.b))}`, value: num(r, dec(r, 2)), tone: 'neutral' }, notes: [`Conta: ${num(v.b, dec(v.b))} × ${num(v.a, dec(v.a))} ÷ 100 = ${num(r, dec(r, 2))}`] };
    }
    if (v.mode === 'what') {
      const r = whatPercent(v.a, v.b);
      return { hero: { label: `${num(v.a, dec(v.a))} representa de ${num(v.b, dec(v.b))}`, value: `${num(r, dec(r, 2))}%`, tone: 'neutral' }, notes: [`Conta: ${num(v.a, dec(v.a))} ÷ ${num(v.b, dec(v.b))} × 100 = ${num(r, dec(r, 2))}%`] };
    }
    const r = variation(v.a, v.b);
    return {
      hero: { label: r >= 0 ? 'Aumento' : 'Redução', value: `${r >= 0 ? '+' : '−'}${num(Math.abs(r), dec(r, 2))}%`, tone: 'neutral', sub: `De ${num(v.a, dec(v.a))} para ${num(v.b, dec(v.b))}` },
      notes: [`Conta: (${num(v.b, dec(v.b))} − ${num(v.a, dec(v.a))}) ÷ ${num(Math.abs(v.a), dec(v.a))} × 100`],
    };
  },
};

function dec(n, max = 4) {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0;
  const s = String(Math.abs(n)).split('.')[1] ?? '';
  return Math.min(max, s.length);
}

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'formulas',
        title: 'Fórmulas de porcentagem',
        html: `${h.table(['Pergunta', 'Conta', 'Exemplo'], [
          ['Quanto é X% de Y?', 'Y × X ÷ 100', '15% de 280 = 42'],
          ['X é quantos % de Y?', 'X ÷ Y × 100', '42 de 280 = 15%'],
          ['Variação de A para B', '(B − A) ÷ A × 100', 'de 80 para 100 = +25%'],
        ])}
<p>Dica de cabeça: 10% é só "andar a vírgula" uma casa (10% de 280 = 28); 5% é metade disso (14); some para ter 15% (42).</p>`,
      },
      {
        id: 'armadilhas',
        title: 'Armadilhas comuns',
        html: `<ul><li><strong>Subir e descer não se anulam:</strong> aumentar 20% e depois reduzir 20% resulta em 4% a menos (100 → 120 → 96).</li><li><strong>Pontos percentuais x porcentagem:</strong> uma taxa que vai de 10% para 12% subiu 2 pontos percentuais, ou 20%.</li><li>Para aumentos e descontos, use as calculadoras de ${h.link('aumento-percentual', 'aumento percentual')} e de ${h.link('desconto', 'desconto')}.</li></ul>`,
      },
    ],
    faq: [{ q: 'Como calcular porcentagem na calculadora do celular?', a: '<p>Para 15% de 280, digite 280 × 15 ÷ 100. Para saber quantos % 42 é de 280, digite 42 ÷ 280 × 100.</p>' }],
    limitations: [],
  };
}
