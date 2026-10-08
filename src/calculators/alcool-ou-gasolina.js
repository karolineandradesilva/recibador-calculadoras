import { fuelChoice } from '../calc/everyday.js';
import { brl, row, pct } from './_shared.js';
import { num } from '../lib/format.js';

export const meta = {
  slug: 'alcool-ou-gasolina',
  category: 'dia-a-dia',
  icon: 'fuel',
  short: 'Álcool ou gasolina',
  h1: 'Calculadora: álcool ou gasolina, qual compensa?',
  title: 'Álcool ou Gasolina? Calcule qual compensa abastecer (70%)',
  description: 'Descubra se compensa abastecer com etanol ou gasolina pela regra dos 70% ou, melhor ainda, pelo consumo real do seu carro, com o custo por quilômetro de cada um.',
  lead: 'Informe os preços no posto e descubra qual combustível sai mais barato por quilômetro rodado.',
  card: 'Regra dos 70% ou consumo real do seu carro.',
  keywords: ['alcool ou gasolina', 'etanol ou gasolina', '70%', 'qual compensa', 'combustivel', 'flex'],
  related: ['custo-de-viagem', 'porcentagem', 'regra-de-tres'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'ethanol', label: 'Preço do etanol (litro)', type: 'money', default: 4.19, min: 0.01, width: 'half' },
    { name: 'gasoline', label: 'Preço da gasolina (litro)', type: 'money', default: 6.29, min: 0.01, width: 'half' },
    { name: 'kmE', label: 'Consumo com etanol', type: 'number', min: 0.1, max: 60, required: false, width: 'half', suffix: 'km/l', advanced: true },
    { name: 'kmG', label: 'Consumo com gasolina', type: 'number', min: 0.1, max: 60, required: false, width: 'half', suffix: 'km/l', advanced: true },
  ],
  validate(v) {
    const e = Number.isFinite(v.kmE);
    const g = Number.isFinite(v.kmG);
    if (e !== g) return { [e ? 'kmG' : 'kmE']: 'Informe o consumo com os dois combustíveis (ou deixe os dois vazios).' };
    return null;
  },
  compute(v) {
    const hasConsumption = Number.isFinite(v.kmE) && Number.isFinite(v.kmG);
    const r = fuelChoice({ ethanolPrice: v.ethanol, gasolinePrice: v.gasoline, ethanolKmL: hasConsumption ? v.kmE : null, gasolineKmL: hasConsumption ? v.kmG : null });
    const best = r.best === 'ethanol' ? 'Etanol' : 'Gasolina';
    const sections = [{ rows: [row('Etanol ÷ gasolina', pct(r.ratio, 1)), row('Limite para o etanol compensar', pct(r.threshold, 1), null, r.usingConsumption ? 'Pelo consumo do seu carro' : 'Regra dos 70%')] }];
    if (r.usingConsumption) {
      sections.push({ title: 'Custo por quilômetro', rows: [row('Etanol', `${brl(r.costEthanol)}/km`), row('Gasolina', `${brl(r.costGasoline)}/km`), row('Economia a cada 1.000 km', Math.abs(r.costEthanol - r.costGasoline) * 1000, 'total')] });
    }
    return {
      hero: { label: 'Compensa abastecer com', value: best, tone: 'neutral', sub: `O etanol custa ${num(r.ratio * 100, 1)}% do preço da gasolina` },
      sections,
      notes: r.usingConsumption ? [] : ['Para um resultado mais preciso, informe o consumo real do seu carro em "Mais opções".'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'regra-70',
        title: 'A regra dos 70%',
        html: `<p>O etanol rende, em média, cerca de 70% do que a gasolina rende por litro. Por isso, ele compensa quando custa <strong>até 70% do preço da gasolina</strong>.</p>
<div class="formula">Se preço do etanol ÷ preço da gasolina ≤ 0,70 → etanol
Se for maior que 0,70 → gasolina</div>
<div class="example"><p>Etanol a ${h.brl(4.19)} e gasolina a ${h.brl(6.29)}: ${ex.hero.sub.toLowerCase()}. Compensa: <strong>${ex.hero.value}</strong>.</p></div>`,
      },
      {
        id: 'consumo-real',
        title: 'Use o consumo do seu carro',
        html: `<p>Motores modernos podem ter rendimento relativo entre 65% e 75%. Se você sabe o consumo do seu carro com cada combustível (no manual, na etiqueta do Inmetro ou medindo no dia a dia), informe em "Mais opções": a calculadora troca a regra dos 70% pela proporção real e mostra o custo por quilômetro. Para planejar uma viagem, use a ${h.link('custo-de-viagem', 'calculadora de custo de viagem')}.</p>`,
      },
    ],
    faq: [{ q: 'Posso misturar etanol e gasolina no tanque?', a: '<p>Em carros flex, sim. O resultado da mistura fica entre os dois rendimentos.</p>' }],
    limitations: ['Considera apenas o custo por quilômetro; não considera desempenho, partida a frio ou manutenção.'],
  };
}
