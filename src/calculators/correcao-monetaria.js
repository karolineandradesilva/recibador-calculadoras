import { correct } from '../calc/indices.js';
import { brl, row, pct } from './_shared.js';
import { SERIES, INDEX_INFO, indexOptions, monthOptions, latestMonth, monthLabel, nextMonth, UPDATED_AT } from './_indices.js';
import { dateLabel } from '../lib/format.js';

export const meta = {
  slug: 'correcao-monetaria',
  category: 'indices',
  icon: 'trending',
  short: 'Correção monetária',
  h1: 'Calculadora de correção monetária (IPCA, IGP-M, INPC)',
  title: 'Correção Monetária pelo IPCA, IGP-M e INPC: índices atualizados',
  description: 'Corrija valores pela inflação com IPCA, INPC, IGP-M, IGP-DI ou INCC, usando as séries oficiais do Banco Central atualizadas automaticamente todos os dias.',
  lead: 'Atualize um valor do passado para hoje (ou entre quaisquer meses) com o índice oficial que você escolher.',
  card: 'Atualize valores por IPCA, IGP-M, INPC e outros.',
  keywords: ['correcao monetaria', 'atualizar valor', 'ipca', 'igpm', 'inpc', 'indice', 'corrigir valor', 'calculadora do cidadao'],
  related: ['inflacao', 'reajuste-aluguel', 'juros-de-atraso', 'reajuste-salarial'],
  sources: ['bcb'],
  extraSources: [
    { label: 'IBGE — IPCA e INPC', url: 'https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html' },
    { label: 'FGV IBRE — IGP-M, IGP-DI e INCC', url: 'https://portalibre.fgv.br/' },
  ],
  legal: false,
  dynamicData: true,
};

const last = latestMonth('ipca');

export const ui = {
  fields: [
    { name: 'amount', label: 'Valor a corrigir', type: 'money', default: 1000, min: 0.01 },
    { name: 'index', label: 'Índice', type: 'select', default: 'ipca', options: indexOptions() },
    { name: 'from', label: 'Mês inicial', type: 'select', default: nextMonth(last, -59), options: monthOptions(), width: 'half' },
    { name: 'to', label: 'Mês final', type: 'select', default: last, options: monthOptions(), width: 'half' },
  ],
  validate(v) {
    if (v.from > v.to) return { to: 'O mês final deve ser igual ou posterior ao inicial.' };
    const lastIdx = latestMonth(v.index);
    if (v.to > lastIdx) return { to: `O ${INDEX_INFO[v.index].short} mais recente divulgado é de ${monthLabel(lastIdx)}.` };
    return null;
  },
  compute(v) {
    const r = correct(SERIES[v.index], v.amount, v.from, v.to);
    if (!r.valid) return { error: r.reason };
    return {
      hero: { label: 'Valor corrigido', value: brl(r.corrected), sub: `${INDEX_INFO[v.index].short} acumulado de ${pct(r.rate)}` },
      cards: [
        { label: 'Correção', value: brl(r.difference), tone: r.difference >= 0 ? 'plus' : 'minus' },
        { label: 'Fator de correção', value: r.factor.toFixed(7).replace('.', ',') },
        { label: 'Meses', value: String(r.months) },
      ],
      table: {
        caption: 'Índice mês a mês',
        columns: ['Mês', 'Variação', 'Acumulado'],
        rows: (() => {
          let acc = 1;
          return r.used.map(([ym, val]) => {
            acc *= 1 + val / 100;
            return [monthLabel(ym), pct(val / 100), pct(acc - 1)];
          });
        })(),
      },
      notes: [`Correção de ${monthLabel(v.from)} a ${monthLabel(v.to)}, inclusive. Dados do Banco Central atualizados em ${dateLabel(UPDATED_AT)}.`],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-funciona',
        title: 'Como a correção é calculada',
        html: `<p>A correção monetária compõe as variações mensais do índice no período escolhido, incluindo o mês inicial e o mês final — a mesma convenção da Calculadora do Cidadão do Banco Central.</p>
<div class="formula">Fator = (1 + i₁) × (1 + i₂) × … × (1 + iₙ)
Valor corrigido = valor × fator</div>
<div class="example"><p>${h.brl(1000)} corrigidos pelo IPCA nos últimos 60 meses com dados: <strong>${ex.hero.value}</strong> (${ex.hero.sub}).</p></div>`,
      },
      {
        id: 'indices',
        title: 'Qual índice usar',
        html: `${h.table(['Índice', 'Quem calcula', 'Uso mais comum'], [
          ['IPCA', 'IBGE', 'Inflação oficial; metas do Banco Central, contratos, títulos públicos'],
          ['INPC', 'IBGE', 'Salário mínimo, reajustes salariais, benefícios do INSS'],
          ['IGP-M', 'FGV', 'Aluguéis antigos, tarifas, contratos de serviços'],
          ['IGP-DI', 'FGV', 'Contratos e indicadores macroeconômicos'],
          ['INCC-DI', 'FGV', 'Contratos de construção e imóveis na planta'],
        ])}
<p>Use o índice previsto no contrato ou na decisão. Para reajustar aluguel, há uma calculadora específica: ${h.link('reajuste-aluguel', 'reajuste de aluguel')}.</p>`,
      },
      {
        id: 'atualizacao',
        title: 'Dados sempre atualizados',
        html: '<p>As séries são baixadas diariamente da API pública do Sistema Gerenciador de Séries Temporais (SGS) do Banco Central. Quando o IBGE ou a FGV divulgam um novo mês, ele aparece aqui automaticamente.</p>',
      },
    ],
    faq: [
      { q: 'Por que o resultado difere um pouco de outras calculadoras?', a: '<p>Diferenças pequenas surgem de convenções: incluir ou não o mês inicial, usar números-índice ou variações e arredondar o fator. Esta calculadora inclui os dois meses e compõe as variações oficiais com todas as casas decimais publicadas.</p>' },
      { q: 'Correção monetária é o mesmo que juros?', a: '<p>Não. A correção só repõe a perda de poder de compra. Juros remuneram o capital. Em dívidas, ambos podem ser cobrados.</p>' },
    ],
    limitations: ['Não aplica juros nem pro rata de dias dentro do mês.', 'Para cálculos judiciais, verifique as tabelas e regras do tribunal (como a taxa legal da Lei 14.905/2024).'],
  };
}
