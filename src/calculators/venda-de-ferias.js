import { vacation } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, salaryField, dependentsField, variableField, val } from './_shared.js';

export const meta = {
  slug: 'venda-de-ferias',
  category: 'trabalho',
  icon: 'sun',
  short: 'Venda de 10 dias de férias',
  h1: 'Calculadora de venda de férias (abono pecuniário)',
  title: `Venda de Férias ${P.year}: quanto rende vender 10 dias`,
  description: 'Vale a pena vender 10 dias de férias? Compare o líquido com e sem o abono pecuniário, que é isento de INSS e de Imposto de Renda, e veja a diferença.',
  lead: 'Compare quanto você recebe tirando 30 dias de férias e vendendo até 10 dias. O abono pecuniário é isento de INSS e IR.',
  card: 'Compare 30 dias de férias com 20 + 10 vendidos.',
  keywords: ['vender ferias', 'abono pecuniario', 'vender 10 dias', 'ferias vendidas'],
  related: ['ferias', 'salario-liquido', 'decimo-terceiro', 'ferias-proporcionais'],
  sources: ['clt', 'inss', 'irrf'],
  legal: true,
};

export const ui = {
  fields: [
    salaryField(),
    { name: 'days', label: 'Dias a vender', type: 'integer', default: 10, min: 1, max: 10, width: 'half', help: 'No máximo 1/3 das férias (10 dias, para quem tem 30).' },
    dependentsField(),
    variableField(),
  ],
  compute(v) {
    const base = { salary: v.salary, variableAverage: val(v.variable), dependents: val(v.dependents) };
    const full = vacation({ ...base, soldDays: 0 });
    const sold = vacation({ ...base, soldDays: v.days });
    const daily = (v.salary + val(v.variable)) / 30;
    // Selling days means working them: the salary of those days is received too.
    const workedDays = daily * sold.soldDays;
    const extra = sold.net - full.net;
    return {
      hero: { label: 'Você recebe a mais ao vender', value: brl(sold.allowance + sold.allowanceThird), sub: `${sold.soldDays} dias de abono + 1/3, sem INSS e IR` },
      cards: [
        { label: 'Líquido das férias (30 dias)', value: brl(full.net) },
        { label: `Líquido com ${sold.soldDays} dias vendidos`, value: brl(sold.net), tone: 'plus' },
      ],
      sections: [
        {
          title: `Férias de ${sold.enjoyedDays} dias + abono`,
          rows: [
            row(`Férias (${sold.enjoyedDays} dias)`, sold.vacationPay, 'plus'),
            row('1/3 das férias', sold.vacationThird, 'plus'),
            row(`Abono pecuniário (${sold.soldDays} dias)`, sold.allowance, 'plus', 'Isento'),
            row('1/3 do abono', sold.allowanceThird, 'plus', 'Isento'),
            row('INSS', sold.inss.value, 'minus'),
            row('IRRF', sold.irrf.value, 'minus'),
            row('Líquido no pagamento das férias', sold.net, 'total'),
          ],
        },
        {
          title: 'Comparação no mês',
          rows: [
            row('Diferença no pagamento das férias', extra, extra >= 0 ? 'plus' : 'minus'),
            row(`Salário dos ${sold.soldDays} dias trabalhados`, workedDays, 'muted', 'Recebido no contracheque seguinte, com os descontos normais'),
          ],
        },
      ],
      notes: ['Vender férias significa trabalhar esses dias: além do abono, você recebe o salário normal deles no contracheque.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-funciona',
        title: 'Como funciona a venda de férias',
        html: `<p>O <strong>abono pecuniário</strong> (CLT, art. 143) permite ao empregado converter até um terço das férias em dinheiro. Quem tem 30 dias pode vender até 10: descansa 20 dias e trabalha os outros 10, recebendo por eles duas vezes — o abono (com 1/3) e o salário normal dos dias trabalhados.</p>
<p>É um direito do empregado: a empresa não pode obrigar nem recusar, desde que o pedido seja feito até 15 dias antes do fim do período aquisitivo. Nas férias coletivas, a venda depende de acordo coletivo (art. 143, §2º).</p>`,
      },
      {
        id: 'como-calcular',
        title: 'Como calcular',
        html: `<div class="formula">Valor do dia = (salário + médias) ÷ 30
Abono = valor do dia × dias vendidos
1/3 do abono = abono ÷ 3
Férias = valor do dia × dias de descanso (+ 1/3, com INSS e IR)</div>
<div class="example"><p>Com salário de ${h.brl(3500)} e 10 dias vendidos, o abono com 1/3 é de <strong>${ex.hero.value}</strong>. No pagamento das férias, o líquido passa de ${ex.cards[0].value} para ${ex.cards[1].value}.</p></div>`,
      },
      {
        id: 'vale-a-pena',
        title: 'Vale a pena vender?',
        html: `<p>Do ponto de vista financeiro, costuma compensar: o abono e o seu terço são <strong>isentos de INSS e de Imposto de Renda</strong> (CLT, art. 144, e Lei 8.212/1991, art. 28, §9º; a Receita Federal deixou de tributar o abono após decisões reiteradas do STJ), e você ainda recebe o salário dos dias trabalhados. O custo é o descanso: 20 dias em vez de 30. A decisão depende da sua situação e das suas prioridades.</p>
<p>Considere vender quando precisar de dinheiro extra ou de quitar dívidas caras. Se o descanso for importante para a sua saúde ou se você já vem acumulando cansaço, os 30 dias podem valer mais do que o dinheiro.</p>`,
      },
    ],
    faq: [
      { q: 'Posso vender 15 dias de férias?', a: '<p>Não. O limite legal é de um terço do período de férias a que você tem direito — 10 dias para quem tem 30 dias.</p>' },
      { q: 'O abono de férias tem desconto de INSS e IR?', a: '<p>Não. O abono pecuniário e o terço sobre ele não integram o salário para fins de INSS e não são tributados pelo Imposto de Renda.</p>' },
      { q: 'A empresa pode me obrigar a vender férias?', a: '<p>Não. A conversão é uma faculdade do empregado. Exigir a venda é irregular.</p>' },
    ],
    limitations: [
      'INSS e IR são calculados apenas sobre o pagamento das férias, como se fosse o único rendimento do mês.',
      'Não considera faltas no período aquisitivo; com faltas, o número de dias de férias (e o máximo vendável) diminui.',
    ],
  };
}
