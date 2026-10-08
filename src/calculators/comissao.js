import { dsr, netSalary } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, dependentsField, val, frac, pct } from './_shared.js';

export const meta = {
  slug: 'comissao',
  category: 'trabalho',
  icon: 'tag',
  short: 'Comissão de vendas',
  h1: 'Calculadora de comissão de vendas',
  title: `Calculadora de Comissão ${P.year}: valor, DSR e salário líquido`,
  description: 'Calcule a comissão sobre vendas, o reflexo no DSR, o total bruto com o salário fixo e o líquido após INSS e IR. Serve para comissionista puro ou misto.',
  lead: 'Informe as vendas e o percentual de comissão para ver quanto você recebe, com DSR e descontos.',
  card: 'Comissão sobre vendas, DSR e líquido.',
  keywords: ['comissao', 'comissao de vendas', 'vendedor', 'comissionista', 'percentual de comissao'],
  related: ['dsr', 'salario-liquido', 'porcentagem', 'preco-de-venda'],
  sources: ['clt', 'inss', 'irrf'],
  legal: true,
};

export const ui = {
  fields: [
    { name: 'sales', label: 'Total vendido no mês', type: 'money', default: 60000, min: 0 },
    { name: 'rate', label: 'Percentual de comissão', type: 'percent', default: 3, min: 0, max: 100, width: 'half' },
    { name: 'fixed', label: 'Salário fixo', type: 'money', default: 1621, min: 0, required: false, width: 'half', help: 'Deixe zero para comissionista puro.' },
    { name: 'withDsr', label: 'Calcular DSR sobre a comissão', type: 'checkbox', default: true },
    { name: 'working', label: 'Dias úteis no mês', type: 'integer', default: 26, min: 1, max: 31, width: 'half', showIf: (v) => v.withDsr },
    { name: 'rest', label: 'Domingos e feriados', type: 'integer', default: 4, min: 0, max: 15, width: 'half', showIf: (v) => v.withDsr },
    dependentsField({ advanced: true }),
  ],
  compute(v) {
    const commission = v.sales * frac(v.rate);
    const dsrValue = v.withDsr ? dsr({ variable: commission, workingDays: v.working, restDays: v.rest }) : 0;
    let gross = val(v.fixed) + commission + dsrValue;
    const notes = [];
    // Pure commission workers are guaranteed at least the minimum wage (CF art. 7º, VII).
    if (gross < P.minimumWage) {
      notes.push(`O total ficou abaixo do salário mínimo (${brl(P.minimumWage)}). A lei garante ao comissionista pelo menos o mínimo, e a empresa deve complementar a diferença.`);
      gross = P.minimumWage;
    }
    const n = netSalary({ gross, dependents: val(v.dependents) });
    return {
      hero: { label: 'Comissão do mês', value: brl(commission + dsrValue), sub: `${pct(frac(v.rate))} de ${brl(v.sales)}${dsrValue ? ' + DSR' : ''}` },
      cards: [
        { label: 'Total bruto', value: brl(gross) },
        { label: 'Líquido estimado', value: brl(n.net), tone: 'plus' },
      ],
      sections: [
        {
          rows: [
            val(v.fixed) ? row('Salário fixo', v.fixed, 'plus') : null,
            row('Comissão', commission, 'plus'),
            dsrValue ? row('DSR sobre comissão', dsrValue, 'plus') : null,
            row('Total bruto', gross, 'strong'),
            row('INSS', n.inss.value, 'minus'),
            row('IRRF', n.irrf.value, 'minus'),
            row('Líquido estimado', n.net, 'total'),
          ],
        },
      ],
      notes,
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-calcular',
        title: 'Como calcular a comissão',
        html: `<div class="formula">Comissão = total vendido × percentual
DSR = comissão ÷ dias úteis × domingos e feriados
Bruto = salário fixo + comissão + DSR</div>
<div class="example"><p>Vendas de ${h.brl(60000)} com comissão de 3%, salário fixo de ${h.brl(1621)}: comissão com DSR de <strong>${ex.hero.value}</strong>, total bruto de ${ex.cards[0].value} e líquido estimado de ${ex.cards[1].value}.</p></div>`,
      },
      {
        id: 'regras',
        title: 'Regras para comissionistas',
        html: `<ul><li><strong>Salário mínimo garantido:</strong> mesmo o comissionista puro deve receber pelo menos o salário mínimo (ou o piso da categoria) no mês.</li>
<li><strong>DSR:</strong> as comissões refletem no descanso semanal remunerado (Súmula 27 do TST). Veja a ${h.link('dsr', 'calculadora de DSR')}.</li>
<li><strong>Integração:</strong> comissões entram na média de férias, 13º e aviso prévio, e na base de INSS, IR e FGTS.</li>
<li><strong>Venda cancelada:</strong> a comissão é devida quando a venda é concluída; o estorno por inadimplência do cliente é, em regra, vedado (Lei 3.207/1957, art. 7º, só admite estorno em caso de insolvência do comprador).</li></ul>`,
      },
    ],
    faq: [
      { q: 'Comissão tem desconto de INSS e IR?', a: '<p>Sim. A comissão é salário e entra na base do INSS, do Imposto de Renda e do FGTS.</p>' },
      { q: 'Como calcular a porcentagem de comissão sobre a meta?', a: `<p>Use a ${h.link('porcentagem', 'calculadora de porcentagem')} para descobrir quanto um valor representa de outro.</p>` },
    ],
    limitations: ['Considera comissão simples sobre o total vendido; comissões escalonadas por faixas de meta devem ser calculadas por faixa.'],
  };
}
