// Legal parameters in force during 2026.
//
// Every number here comes from an official source listed next to it. When a
// rule changes, copy this file to the new year (e.g. 2027.js), update the
// values and sources, register it in ./index.js and run `npm test`: the
// freshness test fails once `validUntil` is in the past, so an outdated table
// can never be published silently.

const SOURCES = {
  minimumWage: {
    label: 'Decreto nº 12.797/2025 — salário mínimo de R$ 1.621,00',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/D12797.htm',
  },
  inss: {
    label: 'INSS — Tabela de contribuição mensal (Portaria Interministerial MPS/MF nº 13/2026)',
    url: 'https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal',
  },
  irrf: {
    label: 'Receita Federal — Tabelas do Imposto de Renda 2026',
    url: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026',
  },
  irrfReduction: {
    label: 'Lei nº 15.270/2025 — redução do IR para rendimentos até R$ 7.350,00',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15270.htm',
  },
  clt: {
    label: 'Consolidação das Leis do Trabalho (Decreto-Lei nº 5.452/1943)',
    url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  },
  noticePeriod: {
    label: 'Lei nº 12.506/2011 — aviso prévio proporcional',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12506.htm',
  },
  thirteenth: {
    label: 'Lei nº 4.090/1962 e Lei nº 4.749/1965 — gratificação de Natal (13º salário)',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l4090.htm',
  },
  fgts: {
    label: 'Lei nº 8.036/1990 — Fundo de Garantia do Tempo de Serviço',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm',
  },
  constitution: {
    label: 'Constituição Federal, art. 7º',
    url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
  },
  unemployment: {
    label: 'Ministério do Trabalho e Emprego — Seguro-Desemprego',
    url: 'https://www.gov.br/trabalho-e-emprego/pt-br/servicos/trabalhador/seguro-desemprego',
  },
  unemploymentLaw: {
    label: 'Lei nº 7.998/1990 — Programa do Seguro-Desemprego',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l7998.htm',
  },
  familyAllowance: {
    label: 'INSS — Salário-família',
    url: 'https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia',
  },
  mei: {
    label: 'Portal do Empreendedor — MEI',
    url: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor',
  },
  simples: {
    label: 'Lei Complementar nº 123/2006 — Simples Nacional (Anexos I a V)',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  },
  employerContributions: {
    label: 'Lei nº 8.212/1991 — contribuições da empresa à Seguridade Social',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  },
  plr: {
    label: 'Receita Federal — Tabela de tributação exclusiva da PLR',
    url: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026',
  },
  investments: {
    label: 'Lei nº 11.033/2004 — IR sobre aplicações financeiras',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm',
  },
  iof: {
    label: 'Decreto nº 6.306/2007 — IOF (tabela regressiva de resgates)',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/decreto/d6306.htm',
  },
  savings: {
    label: 'Lei nº 8.177/1991, art. 12 — remuneração da poupança',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8177.htm',
  },
  fgtsAnniversary: {
    label: 'Lei nº 13.932/2019 — saque-aniversário do FGTS',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13932.htm',
  },
  latePayment: {
    label: 'Código de Defesa do Consumidor, art. 52, §1º (multa de mora de até 2%)',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm',
  },
  bcb: {
    label: 'Banco Central do Brasil — Sistema Gerenciador de Séries Temporais (SGS)',
    url: 'https://www3.bcb.gov.br/sgspub/',
  },
};

export default {
  year: 2026,
  validFrom: '2026-01-01',
  validUntil: '2026-12-31',
  reviewedAt: '2026-10-08',
  sources: SOURCES,

  minimumWage: 1621.0,

  inss: {
    // Empregado, empregado doméstico e trabalhador avulso: progressive brackets.
    employee: [
      { upTo: 1621.0, rate: 0.075 },
      { upTo: 2902.84, rate: 0.09 },
      { upTo: 4354.27, rate: 0.12 },
      { upTo: 8475.55, rate: 0.14 },
    ],
    ceiling: 8475.55,
    // Contribuinte individual, facultativo e MEI.
    individualRate: 0.2,
    simplifiedRate: 0.11,
    lowIncomeRate: 0.05,
    // Contribuinte individual que presta serviço a empresa (ex.: pró-labore).
    individualToCompanyRate: 0.11,
  },

  irrf: {
    monthly: [
      { upTo: 2428.8, rate: 0, deduction: 0 },
      { upTo: 2826.65, rate: 0.075, deduction: 182.16 },
      { upTo: 3751.05, rate: 0.15, deduction: 394.16 },
      { upTo: 4664.68, rate: 0.225, deduction: 675.49 },
      { upTo: Infinity, rate: 0.275, deduction: 908.73 },
    ],
    dependentDeduction: 189.59,
    simplifiedDiscount: 607.2,
    retiredOver65Exemption: 1903.98,
    // Lei 15.270/2025: monthly reduction computed on taxable income.
    reduction: {
      zeroTaxUpTo: 5000.0,
      maxReduction: 312.89,
      phaseOutUpTo: 7350.0,
      constant: 978.62,
      factor: 0.133145,
    },
    // PLR: exclusive withholding table (in force since May/2025).
    plr: [
      { upTo: 8214.4, rate: 0, deduction: 0 },
      { upTo: 9922.28, rate: 0.075, deduction: 616.08 },
      { upTo: 13167.0, rate: 0.15, deduction: 1360.25 },
      { upTo: 16380.38, rate: 0.225, deduction: 2347.78 },
      { upTo: Infinity, rate: 0.275, deduction: 3166.8 },
    ],
  },

  fgts: {
    rate: 0.08,
    apprenticeRate: 0.02,
    domesticIndemnityRate: 0.032,
    fineWithoutCause: 0.4,
    fineMutualAgreement: 0.2,
    // Statutory remuneration of FGTS accounts: 3% a.a. + TR (Lei 8.036, art. 13).
    annualYield: 0.03,
    // Saque-aniversário (Lei 13.932/2019, anexo).
    anniversaryWithdrawal: [
      { upTo: 500.0, rate: 0.5, extra: 0 },
      { upTo: 1000.0, rate: 0.4, extra: 50 },
      { upTo: 5000.0, rate: 0.3, extra: 150 },
      { upTo: 10000.0, rate: 0.2, extra: 650 },
      { upTo: 15000.0, rate: 0.15, extra: 1150 },
      { upTo: 20000.0, rate: 0.1, extra: 1900 },
      { upTo: Infinity, rate: 0.05, extra: 2900 },
    ],
  },

  labor: {
    // Divisor for a 44-hour week (CLT, art. 64): 220 hours/month.
    defaultMonthlyHours: 220,
    overtimeMinimumPremium: 0.5,
    nightPremiumUrban: 0.2,
    nightPremiumRural: 0.25,
    // Urban night hour is 52min30s (CLT, art. 73, §1º).
    nightHourMinutes: 52.5,
    vacationBonusFraction: 1 / 3,
    noticeBaseDays: 30,
    noticeDaysPerYear: 3,
    noticeMaxDays: 90,
  },

  unemploymentInsurance: {
    floor: 1621.0,
    ceiling: 2518.65,
    firstBracketUpTo: 2222.17,
    firstBracketRate: 0.8,
    secondBracketUpTo: 3703.99,
    secondBracketFixed: 1777.74,
    secondBracketRate: 0.5,
  },

  familyAllowance: {
    quota: 67.54,
    incomeLimit: 1980.38,
  },

  mei: {
    inssRate: 0.05,
    truckerInssRate: 0.12,
    icms: 1.0,
    iss: 5.0,
    annualRevenueLimit: 81000.0,
    truckerAnnualRevenueLimit: 251600.0,
    // Exceeding the limit by up to 20% keeps taxation as ME from the next year.
    toleranceRate: 0.2,
  },

  // Simples Nacional, LC 123/2006 annexes (RBT12 brackets).
  simples: {
    annexes: {
      I: [
        { upTo: 180000, rate: 0.04, deduction: 0 },
        { upTo: 360000, rate: 0.073, deduction: 5940 },
        { upTo: 720000, rate: 0.095, deduction: 13860 },
        { upTo: 1800000, rate: 0.107, deduction: 22500 },
        { upTo: 3600000, rate: 0.143, deduction: 87300 },
        { upTo: 4800000, rate: 0.19, deduction: 378000 },
      ],
      II: [
        { upTo: 180000, rate: 0.045, deduction: 0 },
        { upTo: 360000, rate: 0.078, deduction: 5940 },
        { upTo: 720000, rate: 0.1, deduction: 13860 },
        { upTo: 1800000, rate: 0.112, deduction: 22500 },
        { upTo: 3600000, rate: 0.147, deduction: 85500 },
        { upTo: 4800000, rate: 0.3, deduction: 720000 },
      ],
      III: [
        { upTo: 180000, rate: 0.06, deduction: 0 },
        { upTo: 360000, rate: 0.112, deduction: 9360 },
        { upTo: 720000, rate: 0.135, deduction: 17640 },
        { upTo: 1800000, rate: 0.16, deduction: 35640 },
        { upTo: 3600000, rate: 0.21, deduction: 125640 },
        { upTo: 4800000, rate: 0.33, deduction: 648000 },
      ],
      IV: [
        { upTo: 180000, rate: 0.045, deduction: 0 },
        { upTo: 360000, rate: 0.09, deduction: 8100 },
        { upTo: 720000, rate: 0.102, deduction: 12420 },
        { upTo: 1800000, rate: 0.14, deduction: 39780 },
        { upTo: 3600000, rate: 0.22, deduction: 183780 },
        { upTo: 4800000, rate: 0.33, deduction: 828000 },
      ],
      V: [
        { upTo: 180000, rate: 0.155, deduction: 0 },
        { upTo: 360000, rate: 0.18, deduction: 4500 },
        { upTo: 720000, rate: 0.195, deduction: 9900 },
        { upTo: 1800000, rate: 0.205, deduction: 17100 },
        { upTo: 3600000, rate: 0.23, deduction: 62100 },
        { upTo: 4800000, rate: 0.305, deduction: 540000 },
      ],
    },
    // Fator R: payroll / revenue >= 28% moves annex V activities to annex III.
    factorRThreshold: 0.28,
    revenueLimit: 4800000,
  },

  employer: {
    // Companies outside Simples Nacional (or in annex IV).
    cpp: 0.2,
    ratOptions: [0.01, 0.02, 0.03],
    thirdParties: 0.058,
  },

  investments: {
    // Regressive income tax on fixed income (Lei 11.033/2004, art. 1º).
    incomeTax: [
      { upToDays: 180, rate: 0.225 },
      { upToDays: 360, rate: 0.2 },
      { upToDays: 720, rate: 0.175 },
      { upToDays: Infinity, rate: 0.15 },
    ],
    // Savings: 0.5% a.m. + TR while Selic target > 8.5% a.a.
    savingsSelicThreshold: 0.085,
    savingsMonthlyRate: 0.005,
    savingsSelicShare: 0.7,
  },

  latePayment: {
    maxConsumerFine: 0.02,
    // Common contractual cap for default interest (Código Civil art. 406 + praxis).
    typicalMonthlyInterest: 0.01,
  },
};
