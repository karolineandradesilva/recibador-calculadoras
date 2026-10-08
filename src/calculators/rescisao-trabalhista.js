import { termination, TERMINATION_REASONS } from '../calc/labor.js';
import { CURRENT as P } from '../data/params/index.js';
import { parseISO } from '../lib/dates.js';
import { dateLabel } from '../lib/format.js';
import { brl, row, salaryField, dependentsField, variableField, val } from './_shared.js';

export const meta = {
  slug: 'rescisao-trabalhista',
  category: 'trabalho',
  icon: 'door',
  short: 'Rescisão trabalhista',
  h1: 'Calculadora de rescisão trabalhista',
  title: `Calculadora de Rescisão ${P.year}: verbas, FGTS e multa de 40%`,
  description: `Calcule a rescisão completa: saldo de salário, aviso prévio proporcional, 13º e férias proporcionais, férias vencidas, FGTS, multa de 40%, INSS e IR de ${P.year}.`,
  lead: 'Simule todas as verbas da saída da empresa — demissão sem justa causa, pedido de demissão, acordo ou justa causa — e veja o total líquido e o FGTS a sacar.',
  card: 'Todas as verbas da saída, FGTS e multa de 40%.',
  keywords: ['rescisao', 'demissao', 'verbas rescisorias', 'acerto', 'pedido de demissao', 'justa causa', 'acordo', 'multa 40'],
  related: ['aviso-previo', 'multa-fgts', 'seguro-desemprego', 'ferias-proporcionais', 'decimo-terceiro-proporcional', 'fgts'],
  sources: ['clt', 'noticePeriod', 'thirteenth', 'fgts', 'inss', 'irrf'],
  legal: true,
};

const y = P.year;

const NOTICE_OPTIONS = {
  dismissal: [
    { value: 'indemnified', label: 'Indenizado' },
    { value: 'worked', label: 'Trabalhado' },
  ],
  agreement: [
    { value: 'indemnified', label: 'Indenizado (metade)' },
    { value: 'worked', label: 'Trabalhado' },
  ],
  resignation: [
    { value: 'worked', label: 'Trabalhado' },
    { value: 'waived', label: 'Dispensado pela empresa' },
    { value: 'notServed', label: 'Não cumprido (desconto)' },
  ],
};

export const ui = {
  fields: [
    salaryField(),
    { name: 'admission', label: 'Data de admissão', type: 'date', default: `${y - 3}-02-06`, width: 'half' },
    { name: 'termination', label: 'Último dia trabalhado', type: 'date', default: `${y}-09-18`, width: 'half', after: 'admission', afterMessage: 'A saída deve ser igual ou posterior à data de admissão.', maxSpanDays: 60 * 366, spanMessage: 'Contrato com mais de 60 anos: confira as datas.' },
    {
      name: 'reason',
      label: 'Motivo da rescisão',
      type: 'select',
      default: 'dismissal',
      options: Object.entries(TERMINATION_REASONS).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'notice',
      label: 'Aviso prévio',
      type: 'select',
      default: 'indemnified',
      options: (v) => NOTICE_OPTIONS[v.reason] ?? NOTICE_OPTIONS.dismissal,
      showIf: (v) => Boolean(NOTICE_OPTIONS[v.reason]),
    },
    {
      name: 'overdue',
      label: 'Férias vencidas',
      type: 'select',
      numeric: true,
      default: 0,
      options: [
        { value: 0, label: 'Nenhuma' },
        { value: 1, label: '1 período' },
        { value: 2, label: '2 períodos' },
      ],
      width: 'half',
    },
    dependentsField({ width: 'half' }),
    { name: 'double', label: 'Férias vencidas fora do prazo (em dobro)', type: 'checkbox', default: false, showIf: (v) => v.overdue > 0, help: 'Quando o período de concessão de 12 meses já passou sem as férias serem dadas (CLT, art. 137).' },
    { name: 'fgts', label: 'Saldo do FGTS para fins rescisórios', type: 'money', min: 0, required: false, advanced: true, help: 'Consulte no app FGTS. Se vazio, estimamos 8% do salário por mês trabalhado, sem rendimentos.' },
    variableField(),
    { name: 'advance13', label: 'Já recebi a 1ª parcela do 13º neste ano', type: 'checkbox', default: false, advanced: true },
  ],
  onChange(v, form) {
    // Keep the notice options in sync with the reason.
    const select = form.elements.namedItem('notice');
    if (!select || !NOTICE_OPTIONS[v.reason]) return;
    const opts = NOTICE_OPTIONS[v.reason];
    const current = select.value;
    const signature = opts.map((o) => o.value).join();
    if (select.dataset.sig === signature) return;
    select.dataset.sig = signature;
    select.innerHTML = opts.map((o) => `<option value="${o.value}">${o.label}</option>`).join('');
    select.value = opts.some((o) => o.value === current) ? current : opts[0].value;
  },
  validate(v) {
    const a = parseISO(v.admission);
    const b = parseISO(v.termination);
    if (a && b && b < a) return { termination: 'A data de saída deve ser posterior à admissão.' };
    return null;
  },
  compute(v) {
    const r = termination({
      salary: v.salary,
      variableAverage: val(v.variable),
      admission: v.admission,
      termination: v.termination,
      reason: v.reason,
      notice: NOTICE_OPTIONS[v.reason] ? v.notice : 'none',
      overdueVacations: v.overdue,
      overdueDouble: v.double,
      fgtsBalance: Number.isFinite(v.fgts) ? v.fgts : null,
      dependents: val(v.dependents),
      thirteenthAdvancePaid: v.advance13,
    });
    const earnings = r.items.filter((i) => i.kind === 'earning');
    const discounts = r.items.filter((i) => i.kind === 'discount');
    const exempt = new Set(['notice', 'vacation', 'vacationThird', 'overdueVacation', 'overdueVacationThird']);
    const fgtsRows = [
      row('Depósito de FGTS sobre a rescisão', r.fgts.deposit, null, '8% sobre saldo, aviso e 13º'),
      row(`Saldo para fins rescisórios${r.fgts.estimated ? ' (estimado)' : ''}`, r.fgts.balanceForFine),
    ];
    if (r.fgts.fineRate > 0) fgtsRows.push(row(`Multa de ${Math.round(r.fgts.fineRate * 100)}% do FGTS`, r.fgts.fine, 'plus', 'Paga pela empresa na conta do FGTS'));
    fgtsRows.push(row('Disponível para saque', r.fgts.withdrawal, 'total', r.reason === 'agreement' ? 'Até 80% do saldo + multa de 20%' : r.fgts.withdrawal ? 'Saldo + multa' : 'Sem direito a saque nesta modalidade'));

    const notes = [];
    if (r.unemploymentEligible) notes.push('Na dispensa sem justa causa você pode ter direito ao seguro-desemprego. Veja a calculadora de seguro-desemprego.');
    if (r.reason === 'agreement') notes.push('No acordo do art. 484-A não há direito ao seguro-desemprego.');
    notes.push('O pagamento das verbas deve ocorrer em até 10 dias corridos após o fim do contrato (CLT, art. 477, §6º).');
    if (r.projectedEnd !== v.termination) notes.push(`Com a projeção do aviso prévio, o contrato termina oficialmente em ${dateLabel(r.projectedEnd)}.`);

    return {
      hero: { label: 'Total líquido da rescisão', value: brl(r.net), sub: `+ ${brl(r.fgts.withdrawal)} de FGTS para saque` },
      cards: [
        { label: 'Verbas brutas', value: brl(r.earnings), tone: 'plus' },
        { label: 'Descontos', value: brl(r.discounts), tone: 'minus' },
        { label: 'Aviso prévio', value: `${r.proportionalNotice} dias`, sub: `${r.yearsOfService} ${r.yearsOfService === 1 ? 'ano completo' : 'anos completos'}` },
      ],
      sections: [
        { title: 'Verbas', rows: earnings.map((i) => row(i.label, i.value, 'plus', exempt.has(i.key) ? 'Sem INSS e IR' : undefined)) },
        { title: 'Descontos', rows: discounts.map((i) => row(i.label, i.value, 'minus')) },
        { rows: [row('Total líquido a receber', r.net, 'total')] },
        { title: 'FGTS', rows: fgtsRows },
      ],
      notes,
    };
  },
};

export function content(ex, h) {
  const p = h.P;
  return {
    intro: `<p>Esta calculadora reúne todas as verbas da rescisão do contrato CLT em um só lugar e mostra o que é tributado, o que é isento e quanto do FGTS fica disponível. O exemplo inicial simula uma dispensa sem justa causa de quem ganha ${h.brl(3500)}, com aviso indenizado: total líquido de <strong>${ex.hero.value}</strong> e ${ex.hero.sub.replace('+ ', '')}.</p>`,
    sections: [
      {
        id: 'verbas-por-tipo',
        title: 'Quais verbas você recebe em cada tipo de rescisão',
        html: h.table(
          ['Verba', 'Sem justa causa', 'Pedido de demissão', 'Acordo (484-A)', 'Justa causa'],
          [
            ['Saldo de salário', 'Sim', 'Sim', 'Sim', 'Sim'],
            ['Aviso prévio indenizado', 'Sim', 'Não (pode ser descontado)', 'Metade', 'Não'],
            ['13º proporcional', 'Sim', 'Sim', 'Sim', 'Não'],
            ['Férias vencidas + 1/3', 'Sim', 'Sim', 'Sim', 'Sim'],
            ['Férias proporcionais + 1/3', 'Sim', 'Sim', 'Sim', 'Não'],
            ['Multa do FGTS', '40%', 'Não', '20%', 'Não'],
            ['Saque do FGTS', 'Total', 'Não', 'Até 80%', 'Não'],
            ['Seguro-desemprego', 'Sim, se cumprir os requisitos', 'Não', 'Não', 'Não'],
          ],
        ),
      },
      {
        id: 'como-calcular',
        title: 'Como cada verba é calculada',
        html: `<h3>Saldo de salário</h3><p>Dias trabalhados no mês da saída × salário ÷ 30. Se a saída for no último dia do mês, o saldo é o salário integral.</p>
<h3>Aviso prévio proporcional</h3><p>30 dias + 3 dias por ano completo de serviço, até 90 dias (Lei 12.506/2011). Quando indenizado, é pago em dinheiro e <strong>projeta</strong> o fim do contrato, somando avos de 13º e de férias. Veja a ${h.link('aviso-previo', 'calculadora de aviso prévio')}.</p>
<h3>13º salário proporcional</h3><p>1/12 por mês do ano com 15 dias ou mais trabalhados, incluindo a projeção do aviso.</p>
<h3>Férias</h3><p>Vencidas: um salário + 1/3 por período completo não tirado (em dobro se o prazo de concessão passou). Proporcionais: 1/12 por mês do período aquisitivo atual, mais 1/3.</p>
<h3>FGTS e multa</h3><p>A empresa deposita 8% sobre saldo de salário, aviso prévio indenizado e 13º. A multa de 40% (ou 20% no acordo) incide sobre todos os depósitos do contrato, com correção. Veja a ${h.link('multa-fgts', 'calculadora da multa do FGTS')}.</p>
<div class="formula">Total líquido = saldo + aviso + 13º + férias + 1/3
              − INSS (saldo e 13º) − IRRF (saldo e 13º) − outros descontos</div>`,
      },
      {
        id: 'impostos',
        title: 'O que tem desconto de INSS e IR',
        html: `${h.table(['Verba', 'INSS', 'IRRF', 'FGTS'], [
          ['Saldo de salário', 'Sim', 'Sim', 'Sim'],
          ['Aviso prévio indenizado', 'Não', 'Não', 'Sim'],
          ['13º salário', 'Sim (separado)', 'Sim (exclusivo na fonte)', 'Sim'],
          ['Férias indenizadas + 1/3', 'Não', 'Não', 'Não'],
          ['Multa de 40% do FGTS', 'Não', 'Não', '—'],
        ])}<p>O desconto de IR sobre saldo e 13º considera a tabela de ${p.year} e a redução da Lei 15.270/2025.</p>`,
      },
      {
        id: 'prazos',
        title: 'Prazos e documentos',
        html: `<ul><li><strong>Pagamento:</strong> até 10 dias corridos após o término do contrato, qualquer que seja a modalidade (CLT, art. 477, §6º). O atraso gera multa de um salário a favor do empregado (§8º).</li>
<li><strong>Documentos:</strong> termo de rescisão (TRCT), guias para o saque do FGTS e, quando houver direito, a comunicação para o seguro-desemprego, que hoje é feita pelo eSocial.</li>
<li><strong>Homologação:</strong> desde a Reforma Trabalhista de 2017, não é mais obrigatória no sindicato.</li></ul>`,
      },
    ],
    faq: [
      { q: 'Quem pede demissão tem direito a quê?', a: '<p>Saldo de salário, 13º proporcional, férias vencidas e proporcionais com 1/3. Não há multa do FGTS, saque do FGTS nem seguro-desemprego. Se não cumprir o aviso de 30 dias, a empresa pode descontar o valor correspondente.</p>' },
      { q: 'Como funciona o acordo do art. 484-A?', a: '<p>Na rescisão por acordo, o empregado recebe metade do aviso prévio indenizado, metade da multa do FGTS (20%) e as demais verbas integralmente. Pode sacar até 80% do FGTS, mas não tem direito ao seguro-desemprego.</p>' },
      { q: 'O aviso prévio trabalhado reduz a jornada?', a: '<p>Sim. Na dispensa pela empresa, o empregado pode reduzir 2 horas por dia ou faltar 7 dias corridos no fim do aviso, sem desconto (CLT, art. 488).</p>' },
      { q: 'Onde vejo o saldo do FGTS?', a: '<p>No aplicativo FGTS, da Caixa. Informe o saldo em "Mais opções" para que a multa seja calculada com o valor real.</p>' },
      { q: 'A calculadora considera a multa por atraso?', a: '<p>Não. Se a empresa atrasar o pagamento além dos 10 dias, é devida uma multa equivalente a um salário (CLT, art. 477, §8º), que não está incluída no resultado.</p>' },
    ],
    limitations: [
      'O saldo do FGTS, se não informado, é estimado sem correção, sem juros e sem o histórico real de salários; para a multa exata, informe o saldo do extrato.',
      'Não inclui horas extras, adicionais ou comissões do mês da saída, exceto pela média informada.',
      'Não considera indenizações de contratos por prazo determinado rompidos antes do fim (CLT, arts. 479 e 480), estabilidades, rescisão indireta nem verbas previstas em convenção coletiva.',
      'INSS e IR sobre o saldo de salário são calculados como se fossem o único rendimento do mês.',
      'O 13º relativo ao aviso indenizado foi tratado como base de INSS, conforme o entendimento da Receita Federal; há decisões judiciais em sentido diverso.',
    ],
  };
}
