import { inssEmployee, irrfMonthly } from '../calc/tax.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, pct, row, dependentsField, val } from './_shared.js';

export const meta = {
  slug: 'imposto-de-renda',
  category: 'impostos',
  icon: 'receipt',
  short: 'Imposto de Renda (IRRF)',
  h1: 'Calculadora de Imposto de Renda retido na fonte',
  title: `Calculadora de IRRF ${P.year}: isenção até R$ 5 mil e redução`,
  description: `Calcule o Imposto de Renda retido na fonte em ${P.year} com a tabela progressiva, dependentes, desconto simplificado e a redução da Lei 15.270 (isenção até R$ 5 mil).`,
  lead: 'Calcule o IR mensal sobre salários, pró-labore ou aposentadoria, com a nova isenção para quem ganha até R$ 5 mil.',
  card: 'Tabela mensal, deduções e nova isenção até R$ 5 mil.',
  keywords: ['imposto de renda', 'irrf', 'ir na fonte', 'tabela ir', 'isencao 5 mil', 'lei 15270', 'deducao dependente'],
  related: ['salario-liquido', 'inss', 'plr', 'pro-labore', 'decimo-terceiro'],
  sources: ['irrf', 'irrfReduction'],
  legal: true,
};

export const ui = {
  fields: [
    { name: 'income', label: 'Rendimento tributável mensal', type: 'money', default: 6000, min: 0.01, help: 'Salário bruto, pró-labore, aluguel recebido de pessoa jurídica etc.' },
    { name: 'autoInss', label: 'Calcular INSS de empregado automaticamente', type: 'checkbox', default: true },
    { name: 'inss', label: 'INSS pago no mês', type: 'money', default: 0, min: 0, required: false, showIf: (v) => !v.autoInss },
    dependentsField(),
    { name: 'alimony', label: 'Pensão alimentícia', type: 'money', default: 0, min: 0, required: false, advanced: true, width: 'half' },
    { name: 'pension', label: 'Previdência privada (PGBL)', type: 'money', default: 0, min: 0, required: false, advanced: true, width: 'half' },
  ],
  compute(v) {
    const inss = v.autoInss ? inssEmployee(v.income).value : val(v.inss);
    const r = irrfMonthly({ taxableIncome: v.income, inss, dependents: val(v.dependents), alimony: val(v.alimony), privatePension: val(v.pension) });
    const bracket = P.irrf.monthly.find((b) => r.base <= b.upTo);
    return {
      hero: { label: 'Imposto de Renda do mês', value: brl(r.value), sub: r.value ? `Alíquota efetiva de ${pct(r.effectiveRate)}` : r.reduction ? 'Zerado pela redução da Lei 15.270/2025' : 'Isento' },
      cards: [
        { label: 'Base de cálculo', value: brl(r.base), sub: r.method === 'simplified' ? 'Desconto simplificado' : 'Deduções legais' },
        { label: 'Alíquota da faixa', value: bracket.rate ? pct(bracket.rate, 1) : 'Isento' },
        { label: 'Redução (Lei 15.270)', value: brl(r.reduction), tone: r.reduction ? 'plus' : undefined },
      ],
      sections: [
        {
          rows: [
            row('Rendimento tributável', v.income),
            row(r.method === 'simplified' ? 'Desconto simplificado' : 'Deduções (INSS, dependentes, pensão, previdência)', r.deductions, 'minus'),
            row('Base de cálculo', r.base, 'strong'),
            row(`Imposto pela tabela (${pct(r.rate, 1)} − parcela a deduzir)`, r.taxBeforeReduction),
            r.reduction ? row('Redução da Lei 15.270/2025', r.reduction, 'minus') : null,
            row('IRRF a reter', r.value, 'total'),
          ],
        },
      ],
    };
  },
};

export function content(ex, h) {
  const p = h.P;
  const t = p.irrf.monthly;
  const r = p.irrf.reduction;
  return {
    sections: [
      {
        id: 'tabela',
        title: `Tabela do Imposto de Renda ${p.year} (mensal)`,
        html: `${h.table(['Base de cálculo', 'Alíquota', 'Parcela a deduzir'], t.map((b, i) => [
          i === 0 ? `até ${h.brl(b.upTo)}` : b.upTo === Infinity ? `acima de ${h.brl(t[i - 1].upTo)}` : `de ${h.brl(t[i - 1].upTo + 0.01)} até ${h.brl(b.upTo)}`,
          b.rate ? h.pct(b.rate, 1) : 'isento',
          b.deduction ? h.brl(b.deduction) : '—',
        ]))}
<p>Dedução por dependente: ${h.brl(p.irrf.dependentDeduction)}. Desconto simplificado mensal (opcional, substitui as deduções legais): ${h.brl(p.irrf.simplifiedDiscount)}.</p>`,
      },
      {
        id: 'reducao',
        title: 'A nova redução: isenção até R$ 5 mil',
        html: `<p>A Lei 15.270/2025 manteve a tabela progressiva, mas criou uma <strong>redução</strong> do imposto, aplicada depois do cálculo normal, conforme os rendimentos tributáveis do mês:</p>
${h.table(['Rendimentos tributáveis no mês', 'Redução do imposto'], [
  [`até ${h.brl(r.zeroTaxUpTo)}`, `até ${h.brl(r.maxReduction)}, de modo que o imposto fique zerado`],
  [`de ${h.brl(r.zeroTaxUpTo + 0.01)} a ${h.brl(r.phaseOutUpTo)}`, `${h.brl(r.constant)} − ${String(r.factor).replace('.', ',')} × rendimentos`],
  [`acima de ${h.brl(r.phaseOutUpTo)}`, 'sem redução'],
])}
<p>A redução nunca é maior que o imposto calculado e vale também para o 13º salário. Ela é calculada sobre os rendimentos tributáveis (o bruto), e não sobre a base após deduções.</p>`,
      },
      {
        id: 'como-calcular',
        title: 'Passo a passo do cálculo',
        html: `<div class="formula">1) Base = rendimento − INSS − dependentes − pensão − previdência
   (ou rendimento − ${h.brl(p.irrf.simplifiedDiscount)}, se for mais vantajoso)
2) Imposto = base × alíquota − parcela a deduzir
3) IRRF = imposto − redução da Lei 15.270</div>
<div class="example"><p>Rendimento de ${h.brl(6000)}, sem dependentes: base de ${ex.cards[0].value}, alíquota de ${ex.cards[1].value}, imposto pela tabela de ${ex.sections[0].rows[3].value} e redução de ${ex.cards[2].value}. <strong>IRRF: ${ex.hero.value}</strong>.</p></div>`,
      },
    ],
    faq: [
      { q: 'Quem ganha R$ 5 mil por mês fica isento?', a: '<p>Na retenção mensal, sim: o IR fica zerado para rendimentos tributáveis de até R$ 5.000. Na declaração anual de 2027 (ano-calendário 2026), há uma redução equivalente para rendimentos anuais de até R$ 60 mil.</p>' },
      { q: 'O que é o desconto simplificado mensal?', a: `<p>Uma dedução fixa de ${h.brl(p.irrf.simplifiedDiscount)} que pode substituir as deduções legais (INSS, dependentes, pensão e previdência). A fonte pagadora deve usar a opção mais vantajosa.</p>` },
      { q: 'Aposentado com 65 anos ou mais tem isenção extra?', a: `<p>Sim. Até ${h.brl(p.irrf.retiredOver65Exemption)} por mês de aposentadoria ou pensão é isento para quem tem 65 anos ou mais. Esta calculadora não aplica essa parcela automaticamente.</p>` },
    ],
    limitations: ['Calcula a retenção mensal; o imposto da declaração anual considera todos os rendimentos e deduções do ano.', 'Não aplica a parcela isenta de aposentados com 65 anos ou mais nem isenções por doença grave.', 'Para PLR, use a calculadora específica (tabela exclusiva).'],
  };
}
