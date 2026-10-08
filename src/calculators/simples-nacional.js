import { annexByFactorR, simplesDas } from '../calc/company.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, pct, row, val } from './_shared.js';

export const meta = {
  slug: 'simples-nacional',
  category: 'impostos',
  icon: 'building',
  short: 'Simples Nacional (DAS)',
  h1: 'Calculadora do Simples Nacional',
  title: `Calculadora do Simples Nacional ${P.year}: alíquota efetiva e DAS`,
  description: 'Calcule a alíquota efetiva e o valor do DAS no Simples Nacional pelos Anexos I a V, com a receita dos últimos 12 meses e o Fator R para serviços.',
  lead: 'Informe o faturamento do mês, a receita dos últimos 12 meses e o anexo para ver a alíquota efetiva e o DAS.',
  card: 'Alíquota efetiva, Fator R e valor do DAS.',
  keywords: ['simples nacional', 'das', 'aliquota efetiva', 'fator r', 'anexo iii', 'anexo v', 'rbt12'],
  related: ['das-mei', 'pro-labore', 'clt-x-pj', 'preco-de-venda'],
  sources: ['simples'],
  legal: true,
};

export const ui = {
  fields: [
    { name: 'monthly', label: 'Faturamento do mês', type: 'money', default: 20000, min: 0.01, width: 'half' },
    { name: 'rbt12', label: 'Receita dos últimos 12 meses (RBT12)', type: 'money', default: 240000, min: 0.01, width: 'half', help: 'Soma dos 12 meses anteriores ao mês de apuração.' },
    {
      name: 'annex',
      label: 'Anexo',
      type: 'select',
      default: 'factorR',
      options: [
        { value: 'I', label: 'Anexo I — comércio' },
        { value: 'II', label: 'Anexo II — indústria' },
        { value: 'III', label: 'Anexo III — serviços (ex.: manutenção, agências)' },
        { value: 'IV', label: 'Anexo IV — serviços (ex.: limpeza, obras, advocacia)' },
        { value: 'V', label: 'Anexo V — serviços (ex.: auditoria, publicidade)' },
        { value: 'factorR', label: 'Serviços sujeitos ao Fator R (III ou V)' },
      ],
    },
    { name: 'payroll', label: 'Folha de salários dos últimos 12 meses', type: 'money', default: 72000, min: 0, width: 'half', showIf: (v) => v.annex === 'factorR', help: 'Salários, pró-labore, 13º, encargos (INSS patronal e FGTS).' },
  ],
  compute(v) {
    let annex = v.annex;
    let factor = null;
    if (annex === 'factorR') {
      const fr = annexByFactorR(val(v.payroll), v.rbt12);
      annex = fr.annex;
      factor = fr.factor;
    }
    const r = simplesDas({ monthlyRevenue: v.monthly, rbt12: v.rbt12, annex });
    return {
      hero: { label: 'DAS do mês', value: brl(r.das), sub: `Alíquota efetiva de ${pct(r.effective)} — Anexo ${annex}` },
      alert: r.overLimit ? { tone: 'warn', text: `A receita de 12 meses passou do limite do Simples Nacional (${brl(P.simples.revenueLimit)}).` } : factor !== null ? { tone: 'info', text: `Fator R de ${pct(factor, 1)} — ${factor >= P.simples.factorRThreshold ? 'igual ou acima de 28%: tributação pelo Anexo III' : 'abaixo de 28%: tributação pelo Anexo V'}.` } : null,
      cards: [
        { label: 'Faixa', value: `${r.bracket}ª` },
        { label: 'Alíquota nominal', value: pct(r.nominal, 1) },
        { label: 'Parcela a deduzir', value: brl(r.deduction) },
      ],
      sections: [{ rows: [row('Faturamento do mês', v.monthly), row(`Alíquota efetiva (${pct(r.effective)})`, r.das, 'minus'), row('DAS a pagar', r.das, 'total')] }],
      notes: r.bracket === 6 ? ['Na 6ª faixa, o ICMS e o ISS deixam de ser recolhidos no DAS e passam a ser pagos à parte.'] : [],
    };
  },
};

export function content(ex, h) {
  const a = h.P.simples.annexes;
  const fmt = (t) => t.map((b, i) => [`${i + 1}ª faixa: até ${h.brl(b.upTo)}`, h.pct(b.rate, 1), h.brl(b.deduction)]);
  return {
    sections: [
      {
        id: 'como-calcular',
        title: 'Como calcular a alíquota efetiva',
        html: `<p>No Simples Nacional, a alíquota da tabela (nominal) não é a que você paga. A alíquota efetiva é calculada com a receita bruta dos últimos 12 meses (RBT12):</p>
<div class="formula">Alíquota efetiva = (RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12
DAS = faturamento do mês × alíquota efetiva</div>
<div class="example"><p>Serviço sujeito ao Fator R, faturamento de ${h.brl(20000)} no mês, RBT12 de ${h.brl(240000)} e folha de ${h.brl(72000)} (Fator R de 30%): ${ex.hero.sub}, DAS de <strong>${ex.hero.value}</strong>.</p></div>`,
      },
      {
        id: 'fator-r',
        title: 'Fator R: Anexo III ou V',
        html: `<p>Algumas atividades de serviço (como consultoria, desenvolvimento de software, engenharia e medicina) são tributadas pelo Anexo III se o <strong>Fator R</strong> — a razão entre a folha de salários dos últimos 12 meses (incluindo pró-labore e encargos) e a RBT12 — for de pelo menos 28%. Abaixo disso, vão para o Anexo V, bem mais caro. Por isso, muitos prestadores ajustam o ${h.link('pro-labore', 'pró-labore')} para atingir 28%.</p>`,
      },
      {
        id: 'tabelas',
        title: 'Tabelas dos anexos',
        html: `<h3>Anexo I — Comércio</h3>${h.table(['Receita bruta em 12 meses', 'Alíquota', 'Dedução'], fmt(a.I))}
<h3>Anexo II — Indústria</h3>${h.table(['Receita bruta em 12 meses', 'Alíquota', 'Dedução'], fmt(a.II))}
<h3>Anexo III — Serviços</h3>${h.table(['Receita bruta em 12 meses', 'Alíquota', 'Dedução'], fmt(a.III))}
<h3>Anexo IV — Serviços</h3>${h.table(['Receita bruta em 12 meses', 'Alíquota', 'Dedução'], fmt(a.IV))}
<p>No Anexo IV, a contribuição patronal ao INSS (20% + RAT) é paga à parte, fora do DAS.</p>
<h3>Anexo V — Serviços</h3>${h.table(['Receita bruta em 12 meses', 'Alíquota', 'Dedução'], fmt(a.V))}`,
      },
    ],
    faq: [
      { q: 'E no primeiro ano da empresa?', a: '<p>Nos primeiros 12 meses, a RBT12 é estimada: multiplica-se a média mensal do faturamento já obtido por 12 (no primeiro mês, o próprio faturamento do mês × 12).</p>' },
      { q: 'A reforma tributária muda o Simples em 2026?', a: '<p>Em 2026, a CBS e o IBS ainda estão em fase de teste e não alteram o cálculo do DAS. As mudanças para empresas do Simples ocorrem gradualmente a partir de 2027.</p>' },
    ],
    limitations: ['Não considera a segregação de receitas (por exemplo, com ICMS-ST ou monofásico) nem sublimites estaduais.', 'O enquadramento correto no anexo depende do CNAE e deve ser confirmado com um contador.'],
  };
}
