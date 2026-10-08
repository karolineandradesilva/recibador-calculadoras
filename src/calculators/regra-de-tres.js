import { ruleOfThree } from '../calc/everyday.js';
import { num } from '../lib/format.js';

export const meta = {
  slug: 'regra-de-tres',
  category: 'dia-a-dia',
  icon: 'calculator',
  short: 'Regra de três',
  h1: 'Calculadora de regra de três',
  title: 'Calculadora de Regra de Três Simples: direta e inversa',
  description: 'Resolva regra de três simples direta ou inversamente proporcional em segundos, com a conta montada e exemplos práticos com dinheiro, receitas e prazos.',
  lead: 'Se A está para B, então C está para quanto? Resolva regra de três direta ou inversa.',
  card: 'Direta ou inversa, com a conta montada.',
  keywords: ['regra de tres', 'regra de 3', 'proporcao', 'diretamente proporcional', 'inversamente proporcional'],
  related: ['porcentagem', 'preco-de-venda', 'custo-de-viagem', 'salario-proporcional'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    {
      name: 'kind',
      label: 'Tipo',
      type: 'radio',
      default: 'direct',
      options: [
        { value: 'direct', label: 'Direta' },
        { value: 'inverse', label: 'Inversa' },
      ],
      help: 'Direta: quando um aumenta, o outro aumenta. Inversa: quando um aumenta, o outro diminui.',
    },
    { name: 'a', label: 'A', type: 'number', default: 3, width: 'half' },
    { name: 'b', label: 'está para B', type: 'number', default: 45, width: 'half' },
    { name: 'c', label: 'assim como C', type: 'number', default: 7, width: 'half' },
  ],
  validate(v) {
    if (v.kind === 'direct' && v.a === 0) return { a: 'A não pode ser zero.' };
    if (v.kind === 'inverse' && v.c === 0) return { c: 'C não pode ser zero.' };
    return null;
  },
  compute(v) {
    const x = ruleOfThree({ a: v.a, b: v.b, c: v.c, inverse: v.kind === 'inverse' });
    const d = (n) => (Number.isInteger(n) ? 0 : Math.min(6, (String(n).split('.')[1] ?? '').length));
    const xs = num(x, Number.isInteger(x) ? 0 : 4).replace(/(,\d*?)0+$/, '$1').replace(/,$/, '');
    return {
      hero: { label: 'está para X =', value: xs, tone: 'neutral' },
      notes: [v.kind === 'direct'
        ? `X = B × C ÷ A = ${num(v.b, d(v.b))} × ${num(v.c, d(v.c))} ÷ ${num(v.a, d(v.a))}`
        : `X = A × B ÷ C = ${num(v.a, d(v.a))} × ${num(v.b, d(v.b))} ÷ ${num(v.c, d(v.c))}`],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-montar',
        title: 'Como montar a regra de três',
        html: `<div class="formula">A ——— B
C ——— X

Direta:  X = B × C ÷ A
Inversa: X = A × B ÷ C</div>
<div class="example"><p><strong>Direta:</strong> se 3 kg custam R$ 45, quanto custam 7 kg? X = 45 × 7 ÷ 3 = <strong>R$ ${ex.hero.value}</strong>.</p>
<p><strong>Inversa:</strong> se 4 pessoas fazem um serviço em 6 dias, 8 pessoas fazem em X = 4 × 6 ÷ 8 = 3 dias.</p></div>`,
      },
      {
        id: 'direta-ou-inversa',
        title: 'Direta ou inversa?',
        html: `<p>Pergunte: "se um aumentar, o outro aumenta?" Se sim, é direta (quantidade e preço, distância e combustível). Se o outro diminui, é inversa (velocidade e tempo, trabalhadores e prazo). Para percentuais, a ${h.link('porcentagem', 'calculadora de porcentagem')} é mais direta.</p>`,
      },
    ],
    faq: [{ q: 'Porcentagem é regra de três?', a: '<p>Sim: "X% de Y" é uma regra de três direta em que 100 está para Y assim como X está para o resultado.</p>' }],
    limitations: ['Regra de três simples (duas grandezas). Para a composta, resolva em etapas.'],
  };
}
