import { employeeCost } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { brl, row, num, salaryField, val, frac } from './_shared.js';

export const meta = {
  slug: 'custo-de-funcionario',
  category: 'negocios',
  icon: 'users',
  short: 'Custo de funcionário',
  h1: 'Calculadora de custo de funcionário CLT',
  title: `Custo de Funcionário CLT ${P.year}: encargos, 13º, férias e FGTS`,
  description: 'Calcule quanto custa um funcionário CLT para a empresa: salário, 13º, férias com 1/3, FGTS, INSS patronal, RAT e benefícios, no Simples ou no Presumido.',
  lead: 'Descubra o custo real de contratar com carteira assinada — por mês e por ano — conforme o regime tributário da empresa.',
  card: 'Salário + encargos + benefícios por mês e ano.',
  keywords: ['custo de funcionario', 'encargos trabalhistas', 'quanto custa contratar', 'custo clt', 'folha de pagamento'],
  related: ['clt-x-pj', 'salario-liquido', 'simples-nacional', 'ponto-de-equilibrio'],
  sources: ['employerContributions', 'fgts', 'clt'],
  legal: true,
};

export const ui = {
  fields: [
    salaryField(),
    {
      name: 'regime',
      label: 'Regime tributário da empresa',
      type: 'select',
      default: 'simples',
      options: [
        { value: 'simples', label: 'Simples Nacional (Anexos I, II, III e V)' },
        { value: 'simplesIV', label: 'Simples Nacional — Anexo IV' },
        { value: 'general', label: 'Lucro Presumido ou Lucro Real' },
      ],
    },
    { name: 'rat', label: 'RAT ajustado (RAT × FAP)', type: 'percent', default: 2, min: 0.5, max: 6, width: 'half', showIf: (v) => v.regime !== 'simples' },
    { name: 'transport', label: 'Custo do vale-transporte', type: 'money', default: 220, min: 0, required: false, width: 'half' },
    { name: 'meal', label: 'Vale-refeição/alimentação', type: 'money', default: 600, min: 0, required: false, width: 'half' },
    { name: 'health', label: 'Plano de saúde e outros', type: 'money', default: 0, min: 0, required: false, width: 'half' },
    { name: 'fine', label: 'Provisionar multa de 40% do FGTS', type: 'checkbox', default: false, advanced: true },
  ],
  compute(v) {
    const r = employeeCost({
      salary: v.salary, regime: v.regime, rat: frac(val(v.rat, 2)), transportCost: val(v.transport), meal: val(v.meal), health: val(v.health), includeFineProvision: v.fine,
    });
    return {
      hero: { label: 'Custo mensal para a empresa', value: brl(r.monthly), sub: `${num(r.multiplier, 2)}× o salário` },
      cards: [
        { label: 'Custo anual', value: brl(r.annual) },
        { label: 'Encargos e provisões', value: brl(r.monthly - v.salary), tone: 'minus' },
      ],
      sections: [{ title: 'Composição mensal', rows: [...r.items.map((i) => row(i.label, i.value)), row('Total', r.monthly, 'total')] }],
      notes: ['13º e férias aparecem como provisão mensal (1/12 por mês), pois são pagos uma vez por ano.'],
    };
  },
};

export function content(ex, h) {
  return {
    sections: [
      {
        id: 'composicao',
        title: 'O que compõe o custo de um funcionário',
        html: `${h.table(['Item', 'Simples (I, II, III, V)', 'Simples (IV)', 'Presumido / Real'], [
          ['13º salário', '1/12 por mês', '1/12 por mês', '1/12 por mês'],
          ['Férias + 1/3', '1/12 + 1/3 por mês', 'idem', 'idem'],
          ['FGTS', '8%', '8%', '8%'],
          ['INSS patronal (CPP)', 'incluído no DAS', '20%', '20%'],
          ['RAT/GILRAT × FAP', 'incluído no DAS', '0,5% a 6%', '0,5% a 6%'],
          ['Terceiros (Sistema S, salário-educação, Incra)', 'isento', 'isento', '5,8% (varia por atividade)'],
        ])}
<p>Os encargos incidem também sobre o 13º e as férias. Benefícios como vale-refeição e plano de saúde, em regra, não têm encargos quando seguem as regras do PAT e da legislação.</p>`,
      },
      {
        id: 'exemplo',
        title: 'Exemplo',
        html: `<div class="example"><p>Salário de ${h.brl(3500)} em empresa do Simples (Anexo III), com ${h.brl(220)} de transporte e ${h.brl(600)} de vale-refeição: custo de <strong>${ex.hero.value}</strong> por mês (${ex.hero.sub}) e ${ex.cards[0].value} por ano.</p></div>
<p>Para comparar com uma contratação PJ, veja a ${h.link('clt-x-pj', 'calculadora CLT x PJ')}.</p>`,
      },
    ],
    faq: [
      { q: 'Um funcionário custa o dobro do salário?', a: '<p>Depende do regime e dos benefícios. No Simples Nacional (sem Anexo IV), o custo costuma ficar entre 1,4 e 1,7 vez o salário. No Lucro Presumido ou Real, entre 1,7 e 2 vezes.</p>' },
      { q: 'O que é o FAP?', a: '<p>O Fator Acidentário de Prevenção ajusta a alíquota do RAT (1%, 2% ou 3%, conforme o risco da atividade) entre 0,5 e 2, de acordo com o histórico de acidentes da empresa.</p>' },
    ],
    limitations: ['Não inclui custos de admissão e demissão (exames, aviso prévio, multa efetiva), horas extras, adicionais ou convenções coletivas.', 'A alíquota de terceiros varia conforme o FPAS da atividade.'],
  };
}
