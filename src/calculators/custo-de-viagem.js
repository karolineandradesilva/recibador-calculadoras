import { tripCost } from '../calc/everyday.js';
import { brl, row, val } from './_shared.js';
import { num } from '../lib/format.js';

export const meta = {
  slug: 'custo-de-viagem',
  category: 'dia-a-dia',
  icon: 'car',
  short: 'Custo de viagem de carro',
  h1: 'Calculadora de custo de viagem de carro',
  title: 'Custo de Viagem de Carro: combustível, pedágio e divisão',
  description: 'Calcule o custo de uma viagem de carro com combustível, pedágios e outras despesas, ida e volta, e quanto cada pessoa paga ao dividir a conta.',
  lead: 'Some combustível, pedágios e outros gastos da viagem e veja quanto fica para cada pessoa.',
  card: 'Combustível, pedágios e quanto cada um paga.',
  keywords: ['custo de viagem', 'gasto de combustivel', 'quanto gasta de gasolina', 'pedagio', 'dividir viagem'],
  related: ['alcool-ou-gasolina', 'regra-de-tres', 'porcentagem'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'distance', label: 'Distância (só ida)', type: 'number', default: 430, min: 1, max: 100000, suffix: 'km', width: 'half' },
    { name: 'consumption', label: 'Consumo do carro', type: 'number', default: 11.5, min: 0.5, max: 60, suffix: 'km/l', width: 'half' },
    { name: 'price', label: 'Preço do combustível (litro)', type: 'money', default: 6.29, min: 0.01, width: 'half' },
    { name: 'tolls', label: 'Pedágios (total)', type: 'money', default: 85, min: 0, required: false, width: 'half' },
    { name: 'roundTrip', label: 'Ida e volta', type: 'checkbox', default: true },
    { name: 'people', label: 'Pessoas para dividir', type: 'integer', default: 3, min: 1, max: 50, width: 'half' },
    { name: 'other', label: 'Outros gastos', type: 'money', default: 0, min: 0, required: false, width: 'half', help: 'Estacionamento, lanches.' },
  ],
  compute(v) {
    const r = tripCost({ distance: v.distance, kmPerLiter: v.consumption, fuelPrice: v.price, tolls: val(v.tolls), other: val(v.other), people: v.people, roundTrip: v.roundTrip });
    return {
      hero: { label: 'Custo total da viagem', value: brl(r.total), sub: v.people > 1 ? `${brl(r.perPerson)} por pessoa` : `${num(r.km, 0)} km rodados` },
      cards: [
        { label: 'Combustível', value: brl(r.fuel), sub: `${num(r.liters, 1)} litros` },
        { label: 'Custo por km', value: brl(r.perKm) },
      ],
      sections: [{ rows: [row('Distância total', `${num(r.km, 0)} km`), row('Combustível', r.fuel), val(v.tolls) ? row('Pedágios', val(v.tolls)) : null, val(v.other) ? row('Outros', val(v.other)) : null, row('Total', r.total, 'total')] }],
      notes: v.roundTrip ? ['Pedágios informados como total da viagem (ida e volta).'] : [],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-calcular',
        title: 'Como calcular o gasto com combustível',
        html: `<div class="formula">Litros = distância ÷ consumo (km/l)
Combustível = litros × preço por litro
Total = combustível + pedágios + outros gastos</div>
<div class="example"><p>Viagem de 430 km (ida e volta), carro que faz 11,5 km/l, gasolina a ${h.brl(6.29)} e ${h.brl(85)} de pedágios, para 3 pessoas: <strong>${ex.hero.value}</strong> (${ex.hero.sub}).</p></div>`,
      },
      {
        id: 'dicas',
        title: 'Dicas para economizar',
        html: `<ul><li>Na estrada, o consumo costuma ser 10% a 20% melhor que na cidade — use o consumo rodoviário.</li><li>Calibre os pneus e evite excesso de peso.</li><li>Compare etanol e gasolina antes de abastecer na ${h.link('alcool-ou-gasolina', 'calculadora álcool ou gasolina')}.</li></ul>`,
      },
    ],
    faq: [{ q: 'Como saber o consumo do meu carro?', a: '<p>Encha o tanque, zere o hodômetro parcial, rode normalmente e, no próximo abastecimento completo, divida os quilômetros rodados pelos litros colocados.</p>' }],
    limitations: ['Não inclui desgaste, manutenção, depreciação ou seguro do veículo.'],
  };
}
