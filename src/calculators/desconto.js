import { chainedDiscount } from '../calc/everyday.js';
import { brl, row, pct, frac, val } from './_shared.js';

export const meta = {
  slug: 'desconto',
  category: 'dia-a-dia',
  icon: 'tag',
  short: 'Desconto',
  h1: 'Calculadora de desconto',
  title: 'Calculadora de Desconto: preço final, economia e % de desconto',
  description: 'Calcule o preço com desconto, quanto você economiza, o percentual de desconto entre dois preços e o efeito de descontos acumulados (como 10% + 5%).',
  lead: 'Descubra o preço final com desconto, o percentual real de uma promoção ou o total de descontos acumulados.',
  card: 'Preço final, economia e descontos acumulados.',
  keywords: ['desconto', 'calcular desconto', 'preco com desconto', 'porcentagem de desconto', 'promocao', 'black friday'],
  related: ['porcentagem', 'a-vista-ou-parcelado', 'aumento-percentual', 'parcelamento'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    {
      name: 'mode',
      label: 'O que você quer saber?',
      type: 'radio',
      default: 'final',
      options: [
        { value: 'final', label: 'Preço com desconto' },
        { value: 'rate', label: 'Qual foi o desconto (%)' },
      ],
    },
    { name: 'price', label: 'Preço original', type: 'money', default: 499.9, min: 0.01, width: 'half' },
    { name: 'd1', label: 'Desconto', type: 'percent', default: 15, min: 0, max: 100, width: 'half', showIf: (v) => v.mode === 'final' },
    { name: 'd2', label: 'Desconto adicional', type: 'percent', min: 0, max: 100, required: false, width: 'half', showIf: (v) => v.mode === 'final', help: 'Ex.: cupom ou pagamento à vista sobre o preço já com desconto.' },
    { name: 'final', label: 'Preço com desconto', type: 'money', default: 399.9, min: 0, width: 'half', showIf: (v) => v.mode === 'rate' },
  ],
  validate(v) {
    if (v.mode === 'rate' && v.final > v.price) return { final: 'O preço com desconto deve ser menor ou igual ao preço original.' };
    return null;
  },
  compute(v) {
    if (v.mode === 'rate') {
      const r = 1 - v.final / v.price;
      return { hero: { label: r >= 0 ? 'Desconto de' : 'Aumento de', value: pct(Math.abs(r)), tone: 'neutral', sub: `Economia de ${brl(v.price - v.final)}` } };
    }
    const rates = [frac(v.d1), frac(val(v.d2))].filter((x) => x > 0);
    const r = chainedDiscount(v.price, rates);
    return {
      hero: { label: 'Preço final', value: brl(r.final), sub: `Você economiza ${brl(r.savings)}` },
      cards: rates.length > 1 ? [{ label: 'Desconto total equivalente', value: pct(r.totalRate), sub: 'Não é a soma dos percentuais' }] : [],
      sections: [{ rows: [row('Preço original', v.price), row('Desconto', r.savings, 'minus'), row('Preço final', r.final, 'total')] }],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'formulas',
        title: 'Como calcular desconto',
        html: `<div class="formula">Preço final = preço × (1 − desconto ÷ 100)
Desconto % = (1 − preço final ÷ preço original) × 100
Descontos acumulados: preço × (1 − d₁) × (1 − d₂)</div>
<div class="example"><p>${h.brl(499.9)} com 15% de desconto: <strong>${ex.hero.value}</strong> (${ex.hero.sub.toLowerCase()}).</p></div>`,
      },
      {
        id: 'acumulados',
        title: 'Descontos acumulados não somam',
        html: `<p>"15% + 10% no Pix" não significa 25% de desconto: o segundo desconto incide sobre o preço já reduzido, e o total equivalente é 23,5%. Antes de comprar parcelado, compare também com a ${h.link('a-vista-ou-parcelado', 'calculadora à vista ou parcelado')}.</p>`,
      },
    ],
    faq: [{ q: 'Como saber se a promoção é real?', a: '<p>Compare com o histórico de preços do produto (sites comparadores mostram) e calcule o desconto real a partir do preço praticado antes da promoção, não do "preço de" anunciado.</p>' }],
    limitations: [],
  };
}
