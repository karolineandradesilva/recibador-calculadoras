import { netSalary } from '../calc/labor.js';
import { inssEmployee } from '../calc/tax.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, pct, row, inssHint, irrfHint, salaryField, dependentsField, val } from './_shared.js';

export const meta = {
  slug: 'salario-liquido',
  category: 'trabalho',
  icon: 'wallet',
  short: 'Salário líquido',
  h1: 'Calculadora de salário líquido',
  title: `Calculadora de Salário Líquido ${P.year}: INSS e IRRF atualizados`,
  description: `Descubra quanto cai na conta: salário líquido com INSS, IRRF (com a isenção até R$ 5 mil), dependentes, vale-transporte e outros descontos. Tabelas ${P.year}.`,
  lead: 'Digite o salário bruto e veja na hora quanto você recebe de fato, com cada desconto explicado.',
  card: 'Quanto cai na conta depois de INSS, IR e descontos.',
  keywords: ['salario liquido', 'liquido', 'contracheque', 'holerite', 'desconto', 'quanto vou receber', 'bruto para liquido'],
  related: ['salario-bruto', 'inss', 'imposto-de-renda', 'custo-de-funcionario', 'reajuste-salarial', 'clt-x-pj'],
  sources: ['inss', 'irrf', 'irrfReduction'],
  legal: true,
};

export const ui = {
  fields: [
    salaryField(),
    dependentsField(),
    {
      name: 'transport',
      label: 'Custo do vale-transporte',
      type: 'money',
      default: 0,
      min: 0,
      required: false,
      width: 'half',
      help: 'Valor mensal das passagens. O desconto máximo é 6% do salário.',
    },
    { name: 'alimony', label: 'Pensão alimentícia', type: 'money', default: 0, min: 0, required: false, advanced: true, width: 'half', help: 'Descontada em folha por decisão judicial; reduz a base do IR.' },
    { name: 'pension', label: 'Previdência privada', type: 'money', default: 0, min: 0, required: false, advanced: true, width: 'half', help: 'Contribuição a fundo de pensão ou PGBL descontada em folha.' },
    { name: 'other', label: 'Outros descontos', type: 'money', default: 0, min: 0, required: false, advanced: true, help: 'Plano de saúde, vale-refeição, empréstimo consignado, faltas etc.' },
  ],
  validate(v) {
    if (val(v.alimony) + val(v.pension) + val(v.other) >= v.salary) return { other: 'Os descontos informados são maiores que o salário.' };
    return null;
  },
  compute(v) {
    const r = netSalary({
      gross: v.salary,
      dependents: val(v.dependents),
      transportCost: val(v.transport),
      alimony: val(v.alimony),
      privatePension: val(v.pension),
      otherDiscounts: val(v.other),
    });
    const taxes = r.inss.value + r.irrf.value;
    return {
      hero: { label: 'Salário líquido', value: brl(r.net), sub: `${pct(r.netRatio, 1)} do salário bruto` },
      cards: [
        { label: 'INSS', value: brl(r.inss.value), tone: 'minus' },
        { label: 'IRRF', value: brl(r.irrf.value), tone: 'minus' },
        { label: 'FGTS (pago pela empresa)', value: brl(r.fgts), sub: 'Não sai do seu salário' },
      ],
      bars: [
        { label: 'Líquido', value: r.net, tone: 'net' },
        { label: 'Impostos', value: taxes, tone: 'tax' },
        { label: 'Outros descontos', value: r.discounts - taxes, tone: 'other' },
      ],
      sections: [
        {
          title: 'Demonstrativo',
          rows: [
            row('Salário bruto', r.gross),
            row('INSS', r.inss.value, 'minus', inssHint(r.inss)),
            row('Imposto de Renda (IRRF)', r.irrf.value, 'minus', irrfHint(r.irrf)),
            r.transport ? row('Vale-transporte', r.transport, 'minus', 'Até 6% do salário') : null,
            r.alimony ? row('Pensão alimentícia', r.alimony, 'minus') : null,
            r.privatePension ? row('Previdência privada', r.privatePension, 'minus') : null,
            r.otherDiscounts ? row('Outros descontos', r.otherDiscounts, 'minus') : null,
            row('Salário líquido', r.net, 'total'),
          ],
        },
      ],
    };
  },
};

export function content(ex, h) {
  const p = h.P;
  return {
    sections: [
      {
        id: 'como-usar',
        title: 'Como usar a calculadora',
        html: `<ol>
<li>Digite o <strong>salário bruto</strong> que consta na carteira ou no contrato (antes de qualquer desconto).</li>
<li>Informe quantos <strong>dependentes</strong> você declarou para o Imposto de Renda. Cada um reduz a base de cálculo em ${h.brl(p.irrf.dependentDeduction)}.</li>
<li>Se usa vale-transporte, informe o custo mensal das passagens. Em <em>Mais opções</em> você inclui pensão alimentícia, previdência privada e outros descontos.</li>
</ol>
<p>O resultado aparece enquanto você digita. Use <strong>Compartilhar</strong> para enviar a simulação ou <strong>Imprimir</strong> para guardar uma cópia.</p>`,
      },
      {
        id: 'como-calcular',
        title: `Como calcular o salário líquido em ${p.year}`,
        html: `<p>O salário líquido é o salário bruto menos os descontos obrigatórios (INSS e Imposto de Renda) e os descontos autorizados (vale-transporte, plano de saúde etc.). A ordem importa, porque o INSS reduz a base do Imposto de Renda:</p>
<div class="formula">1) INSS = soma de cada faixa da tabela progressiva
2) Base do IR = bruto − INSS − dependentes − pensão − previdência
   (ou bruto − ${h.brl(p.irrf.simplifiedDiscount)}, se o desconto simplificado for melhor)
3) IR = base × alíquota − parcela a deduzir − redução da Lei 15.270
4) Líquido = bruto − INSS − IR − outros descontos</div>
<h3>Tabela do INSS ${p.year} (empregados)</h3>
${h.table(['Salário de contribuição', 'Alíquota'], p.inss.employee.map((b, i, a) => [i === 0 ? `até ${h.brl(b.upTo)}` : `de ${h.brl(a[i - 1].upTo + 0.01)} a ${h.brl(b.upTo)}`, h.pct(b.rate, 1).replace(',0%', '%')]))}
<p>A alíquota de cada faixa incide apenas sobre a parte do salário dentro dela. Por isso o desconto real (alíquota efetiva) é sempre menor que a alíquota da última faixa. O desconto máximo em ${p.year} é de ${h.brl(inssEmployee(p.inss.ceiling).value)}, para salários a partir do teto de ${h.brl(p.inss.ceiling)}.</p>
<h3>Imposto de Renda: isenção até R$ 5 mil</h3>
<p>Desde janeiro de 2026, a Lei 15.270/2025 criou uma redução do imposto mensal: quem tem rendimentos tributáveis de até <strong>${h.brl(p.irrf.reduction.zeroTaxUpTo)}</strong> por mês fica com IR zerado, e entre ${h.brl(p.irrf.reduction.zeroTaxUpTo + 0.01)} e ${h.brl(p.irrf.reduction.phaseOutUpTo)} a redução diminui gradualmente. A tabela progressiva continua valendo; a redução é aplicada depois, sobre o imposto calculado.</p>`,
      },
      {
        id: 'exemplo',
        title: 'Exemplo resolvido',
        html: `<div class="example"><p>Salário bruto de <strong>${h.brl(3500)}</strong>, sem dependentes e sem outros descontos:</p>
<ul><li>INSS: ${ex.sections[0].rows.find((r) => r?.label === 'INSS').value}</li>
<li>Imposto de Renda: ${ex.sections[0].rows.find((r) => r?.label?.startsWith('Imposto')).value} (rendimento abaixo de R$ 5 mil)</li>
<li><strong>Salário líquido: ${ex.hero.value}</strong></li></ul></div>
<p>Além disso, a empresa deposita ${ex.cards[2].value} de FGTS por mês em uma conta vinculada no seu nome. Esse valor não é descontado do salário.</p>`,
      },
      {
        id: 'interpretacao',
        title: 'Como interpretar o resultado',
        html: `<p>O valor líquido calculado é o que você deve ver no contracheque em um mês normal, sem horas extras, faltas ou adicionais. Se o valor recebido for diferente, as causas mais comuns são:</p>
<ul><li>horas extras, adicional noturno, comissões ou faltas no mês;</li>
<li>descontos de benefícios (plano de saúde, refeição, coparticipação) ou de empréstimo consignado;</li>
<li>adiantamento salarial (o "vale") pago no meio do mês;</li>
<li>pagamento proporcional no mês de admissão ou de férias.</li></ul>
<p>Para saber quanto pedir de salário para receber um líquido específico, use a ${h.link('salario-bruto', 'calculadora de salário bruto')}.</p>`,
      },
    ],
    faq: [
      { q: 'Quem ganha até R$ 5 mil ainda paga Imposto de Renda?', a: `<p>Não sobre o salário mensal. Desde janeiro de ${p.year}, a redução da Lei 15.270/2025 zera o IR retido de quem tem rendimentos tributáveis de até R$ 5.000 por mês. O INSS continua sendo descontado normalmente.</p>` },
      { q: 'O FGTS é descontado do salário?', a: '<p>Não. O FGTS (8% do salário) é pago pela empresa, além do salário, e depositado em uma conta da Caixa no seu nome. Ele não aparece como desconto no contracheque.</p>' },
      { q: 'Qual é o desconto máximo do vale-transporte?', a: '<p>6% do salário-base (Lei 7.418/1985). Se as passagens custarem menos que isso, o desconto é limitado ao custo real das passagens.</p>' },
      { q: 'Por que a calculadora usou o desconto simplificado?', a: `<p>A lei permite substituir as deduções legais (INSS, dependentes, pensão e previdência) por um desconto fixo de ${h.brl(p.irrf.simplifiedDiscount)}. A calculadora compara as duas opções e usa a que resulta em menos imposto, como fazem as folhas de pagamento.</p>` },
      { q: 'Plano de saúde reduz o Imposto de Renda na fonte?', a: '<p>Não. Despesas médicas só são dedutíveis na declaração anual. Na folha mensal, apenas INSS, dependentes, pensão judicial e previdência complementar reduzem a base.</p>' },
    ],
    limitations: [
      'Considera um mês completo, sem faltas, horas extras ou adicionais variáveis.',
      'Não inclui contribuição sindical, descontos de benefícios específicos da empresa nem retenções de convênios, exceto quando informados em "Outros descontos".',
      'Para quem tem 65 anos ou mais, a parcela isenta de aposentadoria não se aplica a salários e não é considerada.',
      'O IR anual pode ser diferente do retido na fonte: a declaração de ajuste considera todos os rendimentos e deduções do ano.',
    ],
  };
}
