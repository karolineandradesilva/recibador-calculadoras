import { freelancerRate } from '../calc/company.js';
import { brl, row, frac, val, num } from './_shared.js';

export const meta = {
  slug: 'valor-hora-freelancer',
  category: 'negocios',
  icon: 'clock',
  short: 'Valor da hora (freelancer)',
  h1: 'Calculadora de valor da hora para freelancer e autônomo',
  title: 'Quanto Cobrar por Hora? Calculadora para Freelancer e Autônomo',
  description: 'Descubra quanto cobrar por hora como freelancer, autônomo ou PJ, considerando a renda desejada, impostos, custos, horas faturáveis e semanas de férias por ano.',
  lead: 'Calcule o valor mínimo da sua hora para pagar impostos, custos e ainda tirar férias com a renda que você quer.',
  card: 'Hora mínima com impostos, custos e férias.',
  keywords: ['valor da hora', 'quanto cobrar', 'freelancer', 'autonomo', 'preco por hora', 'hora tecnica'],
  related: ['clt-x-pj', 'das-mei', 'inss-autonomo', 'preco-de-venda', 'salario-por-hora'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'income', label: 'Renda líquida desejada por mês', type: 'money', default: 7000, min: 1 },
    { name: 'costs', label: 'Custos mensais do trabalho', type: 'money', default: 900, min: 0, required: false, help: 'Equipamentos, softwares, internet, coworking, contador, previdência, plano de saúde.' },
    { name: 'tax', label: 'Impostos sobre o faturamento', type: 'percent', default: 6, min: 0, max: 60, width: 'half', help: 'Ex.: 6% no Simples Anexo III; MEI tem custo fixo (use 0% e some o DAS aos custos).' },
    { name: 'hours', label: 'Horas faturáveis por semana', type: 'number', default: 30, min: 1, max: 80, width: 'half', help: 'Só horas cobradas de clientes, sem prospecção e administração.' },
    { name: 'weeksOff', label: 'Semanas sem trabalhar por ano', type: 'integer', default: 6, min: 0, max: 40, help: 'Férias, feriados e imprevistos.' },
  ],
  compute(v) {
    const r = freelancerRate({ desiredIncome: v.income, monthlyCosts: val(v.costs), taxRate: frac(val(v.tax)), hoursPerWeek: v.hours, weeksOff: val(v.weeksOff) });
    if (!r.valid) return { error: 'Revise as horas e os impostos informados.' };
    return {
      hero: { label: 'Cobre no mínimo', value: `${brl(r.rate)} por hora`, sub: `Diária de 8 horas: ${brl(r.dayRate)}` },
      cards: [
        { label: 'Faturamento mensal necessário', value: brl(r.monthlyRevenue) },
        { label: 'Horas faturáveis por mês', value: `${num(r.billableHoursMonth, 0)} h`, sub: 'Média, já descontadas as férias' },
      ],
      sections: [{ rows: [row('Renda desejada', v.income), row('Custos', val(v.costs)), row('Impostos', r.monthlyRevenue * frac(val(v.tax))), row('Faturamento mensal', r.monthlyRevenue, 'total')] }],
      notes: ['Esse é o valor mínimo para atingir a renda. Considere o valor de mercado e o valor que você gera para o cliente.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'formula',
        title: 'Como calcular o valor da hora',
        html: `<div class="formula">Necessidade anual = (renda desejada + custos) × 12
Faturamento anual = necessidade ÷ (1 − impostos)
Horas faturáveis no ano = horas por semana × (52 − semanas de folga)
Valor da hora = faturamento anual ÷ horas faturáveis</div>
<div class="example"><p>Renda de ${h.brl(7000)}, custos de ${h.brl(900)}, impostos de 6%, 30 horas faturáveis por semana e 6 semanas de folga: <strong>${ex.hero.value}</strong>.</p></div>`,
      },
      {
        id: 'erros',
        title: 'Erros comuns',
        html: `<ul><li><strong>Dividir o salário CLT por 160 horas:</strong> ignora impostos, custos, férias e as horas não faturáveis. Compare com a ${h.link('salario-por-hora', 'hora CLT')} e com a ${h.link('clt-x-pj', 'calculadora CLT x PJ')}.</li><li><strong>Contar 40 horas faturáveis:</strong> prospecção, propostas, reuniões e administração ocupam boa parte do tempo.</li><li><strong>Esquecer a previdência:</strong> sem INSS em dia, não há aposentadoria nem auxílios. Veja a ${h.link('inss-autonomo', 'calculadora de INSS para autônomos')}.</li></ul>`,
      },
    ],
    faq: [{ q: 'Quantas horas faturáveis são realistas?', a: '<p>Para a maioria dos freelancers, entre 20 e 30 horas por semana. O restante vai para vendas, atendimento, gestão e estudo.</p>' }],
    limitations: ['Valor mínimo baseado em custos; não considera preço de mercado ou valor percebido.'],
  };
}
