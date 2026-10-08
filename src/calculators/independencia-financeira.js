import { annualToMonthly, contributionForTarget, monthsToTarget } from '../calc/finance.js';
import { brl, row, pct, val, frac } from './_shared.js';

export const meta = {
  slug: 'independencia-financeira',
  category: 'financas',
  icon: 'target',
  short: 'Independência financeira',
  h1: 'Calculadora de independência financeira e aposentadoria',
  title: 'Independência Financeira: quanto juntar para viver de renda',
  description: 'Calcule o patrimônio necessário para viver de renda com a taxa de retirada segura e quanto investir por mês para chegar lá, em valores reais (acima da inflação).',
  lead: 'Descubra quanto patrimônio você precisa para viver de renda e quanto investir por mês para chegar lá.',
  card: 'Patrimônio para viver de renda e aporte mensal.',
  keywords: ['independencia financeira', 'viver de renda', 'aposentadoria', 'regra dos 4%', 'fire', 'patrimonio'],
  related: ['meta-de-investimento', 'juros-compostos', 'investimentos', 'inflacao'],
  sources: [],
  legal: false,
};

export const ui = {
  fields: [
    { name: 'income', label: 'Renda mensal desejada (em valores de hoje)', type: 'money', default: 8000, min: 1 },
    { name: 'withdrawal', label: 'Taxa de retirada anual', type: 'percent', default: 4, min: 0.5, max: 15, width: 'half', help: 'A "regra dos 4%" é a referência mais conhecida.' },
    { name: 'real', label: 'Rendimento real até lá', type: 'percent', default: 5, min: 0, max: 30, width: 'half', suffix: '% a.a.', help: 'Acima da inflação.' },
    { name: 'saved', label: 'Patrimônio atual', type: 'money', default: 50000, min: 0, required: false, width: 'half' },
    { name: 'years', label: 'Em quantos anos', type: 'integer', default: 20, min: 1, max: 70, width: 'half' },
  ],
  compute(v) {
    const target = (v.income * 12) / frac(v.withdrawal);
    const i = annualToMonthly(frac(v.real));
    const months = v.years * 12;
    const pmt = contributionForTarget({ target, principal: val(v.saved), monthlyRate: i, months });
    return {
      hero: { label: 'Patrimônio necessário', value: brl(target), sub: `Renda de ${brl(v.income)}/mês retirando ${pct(frac(v.withdrawal), 1)} ao ano` },
      cards: [
        { label: 'Aporte mensal necessário', value: brl(pmt), sub: `Por ${v.years} anos` },
        { label: 'Já acumulado', value: `${Math.min(100, Math.round((val(v.saved) / target) * 1000) / 10).toString().replace('.', ',')}%` },
      ],
      sections: [
        {
          rows: [
            row('Renda anual desejada', v.income * 12),
            row('Patrimônio-alvo', target, 'strong'),
            row('Patrimônio atual', val(v.saved)),
            row('Aporte mensal (valores de hoje)', pmt, 'total'),
          ],
        },
      ],
      notes: ['Todos os valores estão em reais de hoje: reajuste os aportes pela inflação todo ano.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'como-funciona',
        title: 'A lógica de viver de renda',
        html: `<p>A independência financeira acontece quando os rendimentos do patrimônio cobrem o seu custo de vida. A conta mais simples usa uma <strong>taxa de retirada</strong>: o percentual do patrimônio que você pode sacar por ano sem esgotá-lo.</p>
<div class="formula">Patrimônio necessário = renda anual desejada ÷ taxa de retirada
Ex.: R$ 96.000 por ano ÷ 4% = R$ 2.400.000</div>
<div class="example"><p>Para ${h.brl(8000)} por mês com retirada de 4%: <strong>${ex.hero.value}</strong>. Com ${h.brl(50000)} já investidos, 20 anos e rendimento real de 5% ao ano: ${ex.cards[0].value} por mês.</p></div>`,
      },
      {
        id: 'regra-dos-4',
        title: 'Sobre a regra dos 4%',
        html: '<p>A regra dos 4% vem de estudos com dados históricos do mercado americano (como o "Trinity Study"), em que retiradas de 4% ao ano, corrigidas pela inflação, sustentaram carteiras por 30 anos na maioria dos cenários. Para horizontes mais longos ou para quem quer mais segurança, taxas de 3% a 3,5% são mais prudentes. No Brasil, com juros reais historicamente mais altos, há quem use taxas um pouco maiores — mas com mais risco.</p>',
      },
      {
        id: 'inss',
        title: 'E o INSS?',
        html: `<p>Se você terá aposentadoria do INSS, desconte o benefício esperado da renda desejada antes de calcular. Por exemplo: querendo R$ 8 mil e contando com R$ 3 mil do INSS, o patrimônio precisa gerar R$ 5 mil. Para outras metas, use a ${h.link('meta-de-investimento', 'calculadora de meta de investimento')}.</p>`,
      },
    ],
    faq: [{ q: 'Por que usar rendimento real?', a: '<p>Porque a renda desejada está em valores de hoje. Usando o rendimento acima da inflação, todo o cálculo fica em poder de compra atual.</p>' }],
    limitations: ['Modelo simplificado: não considera impostos sobre os rendimentos, variação de retornos nem mudanças de custo de vida.', 'Não é recomendação de investimento.'],
  };
}
