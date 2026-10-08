import { inssEmployee } from '../calc/tax.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, pct, row, salaryField } from './_shared.js';

export const meta = {
  slug: 'inss',
  category: 'impostos',
  icon: 'shield',
  short: 'INSS',
  h1: 'Calculadora de INSS',
  title: `Calculadora de INSS ${P.year}: desconto pela tabela progressiva`,
  description: `Calcule o desconto de INSS de ${P.year} sobre o salário pela tabela progressiva oficial, faixa por faixa, com a alíquota efetiva e o teto de contribuição.`,
  lead: 'Veja quanto é descontado de INSS do seu salário, faixa por faixa, com a alíquota efetiva real.',
  card: 'Desconto faixa a faixa e alíquota efetiva.',
  keywords: ['inss', 'desconto inss', 'tabela inss', 'contribuicao previdenciaria', 'aliquota inss', 'teto inss'],
  related: ['salario-liquido', 'imposto-de-renda', 'inss-autonomo', 'pro-labore'],
  sources: ['inss'],
  legal: true,
};

export const ui = {
  fields: [salaryField({ label: 'Salário de contribuição (bruto)' })],
  compute(v) {
    const r = inssEmployee(v.salary);
    return {
      hero: { label: 'Desconto de INSS', value: brl(r.value), sub: `Alíquota efetiva de ${pct(r.effectiveRate)}` },
      alert: r.capped ? { tone: 'info', text: `O salário passa do teto de ${brl(P.inss.ceiling)}: o desconto fica limitado ao valor máximo.` } : null,
      table: {
        caption: 'Cálculo faixa a faixa',
        open: true,
        columns: ['Faixa', 'Base na faixa', 'Alíquota', 'Contribuição'],
        rows: r.slices.map((s, i) => [`${i + 1}ª faixa`, brl(s.base), pct(s.rate, 1), brl(s.value)]),
      },
      sections: [
        {
          rows: [row('Total de INSS', r.value, 'total'), row('Salário após o INSS', v.salary - r.value, 'muted')],
        },
      ],
    };
  },
};

export function content(ex, h) {
  const p = h.P;
  const b = p.inss.employee;
  return {
    sections: [
      {
        id: 'tabela',
        title: `Tabela do INSS ${p.year}`,
        html: `${h.table(['Salário de contribuição', 'Alíquota'], b.map((x, i) => [i === 0 ? `até ${h.brl(x.upTo)}` : `de ${h.brl(b[i - 1].upTo + 0.01)} até ${h.brl(x.upTo)}`, h.pct(x.rate, 1)]))}
<p>Tabela para empregados, empregados domésticos e trabalhadores avulsos, válida a partir da competência de janeiro de ${p.year} (Portaria Interministerial MPS/MF nº 13/2026). O teto de contribuição é ${h.brl(p.inss.ceiling)}.</p>`,
      },
      {
        id: 'como-calcular',
        title: 'Como calcular o INSS (progressivo)',
        html: `<p>Desde 2020, o INSS do empregado é <strong>progressivo</strong>: cada alíquota incide apenas sobre a parte do salário que está dentro da sua faixa, e os resultados são somados.</p>
<div class="formula">INSS = Σ (parte do salário em cada faixa × alíquota da faixa)</div>
<div class="example"><p>Salário de ${h.brl(3500)}:</p><ul>${ex.table.rows.map((r) => `<li>${r[0]}: ${r[1]} × ${r[2]} = ${r[3]}</li>`).join('')}</ul><p><strong>Total: ${ex.hero.value}</strong> — ${ex.hero.sub.toLowerCase()}.</p></div>
<p>Isso explica por que ninguém paga 14% sobre o salário inteiro: mesmo no teto, a alíquota efetiva fica abaixo de 12%.</p>`,
      },
      {
        id: 'outros-segurados',
        title: 'Autônomos, MEI e facultativos',
        html: `<p>Contribuintes individuais e facultativos não usam a tabela progressiva: pagam 20% sobre o valor declarado (entre o salário mínimo e o teto), 11% no plano simplificado ou 5% no caso de MEI e facultativo de baixa renda. Veja a ${h.link('inss-autonomo', 'calculadora de INSS para autônomos')}.</p>`,
      },
    ],
    faq: [
      { q: 'Qual é o desconto máximo de INSS em 2026?', a: `<p>${h.brl(inssEmployee(p.inss.ceiling).value)}, para salários a partir de ${h.brl(p.inss.ceiling)}.</p>` },
      { q: 'O INSS incide sobre férias e 13º?', a: '<p>Sim, sobre as férias gozadas com o terço e sobre o 13º (calculado separadamente). Não incide sobre férias indenizadas, abono pecuniário, aviso prévio indenizado e PLR.</p>' },
      { q: 'Quem tem dois empregos paga INSS nos dois?', a: '<p>Sim, mas a soma das contribuições respeita o teto. O empregado deve informar os outros vínculos às empresas para evitar recolhimento acima do limite.</p>' },
    ],
    limitations: ['Considera um único vínculo de emprego no mês.'],
  };
}
