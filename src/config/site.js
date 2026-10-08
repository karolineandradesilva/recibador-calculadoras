// Central site configuration. IDs for third-party services stay empty until
// the accounts exist; every integration is skipped while its ID is empty, so
// the site never loads a script (or shows a consent banner) it does not need.
export const SITE = {
  name: 'Recibador',
  tagline: 'Calcule o que é seu.',
  url: 'https://recibador.com.br',
  locale: 'pt_BR',
  lang: 'pt-BR',
  themeColor: '#0b5d43',
  email: 'contato@recibador.com.br',
  description:
    'Calculadoras gratuitas de salário, férias, rescisão, 13º, impostos, juros e investimentos, com as regras oficiais em vigor e explicação de cada cálculo.',

  // Cloudflare Web Analytics (cookieless) site token. Public by design.
  cfBeaconToken: '0da4609bd16b41fdb0a939402526dd3d',
  // Google Analytics 4 measurement ID (G-XXXXXXX). Empty = disabled.
  gaId: process.env.RECIBADOR_GA_ID ?? '',
  // Google AdSense publisher ID (ca-pub-XXXXXXXXXXXXXXXX). Empty = disabled.
  adsenseClient: process.env.RECIBADOR_ADSENSE_CLIENT ?? '',
  // Ad slot IDs created in AdSense (display units). Empty = slot not rendered.
  adSlots: {
    afterResult: process.env.RECIBADOR_AD_SLOT_RESULT ?? '',
    inContent: process.env.RECIBADOR_AD_SLOT_CONTENT ?? '',
    sidebar: process.env.RECIBADOR_AD_SLOT_SIDEBAR ?? '',
  },
};

export const CATEGORIES = [
  {
    slug: 'trabalho',
    name: 'Trabalho e salário',
    short: 'Trabalho',
    description: 'Salário líquido, férias, 13º, rescisão, horas extras e tudo o que envolve o contrato CLT.',
    intro:
      'Calculadoras para quem trabalha com carteira assinada: do salário líquido do mês à rescisão completa, sempre com as tabelas oficiais de INSS e IRRF em vigor.',
  },
  {
    slug: 'impostos',
    name: 'Impostos e contribuições',
    short: 'Impostos',
    description: 'INSS, Imposto de Renda, FGTS, MEI, Simples Nacional e pró-labore.',
    intro:
      'Entenda quanto é descontado e quanto é recolhido. Cada calculadora mostra a faixa aplicada, a alíquota efetiva e a fonte oficial da regra.',
  },
  {
    slug: 'financas',
    name: 'Juros e investimentos',
    short: 'Finanças',
    description: 'Juros simples e compostos, financiamento, parcelamento, CDB, poupança e metas.',
    intro:
      'Simule empréstimos, compras parceladas e investimentos com matemática transparente. Taxas do CDI, Selic e poupança atualizadas automaticamente a partir do Banco Central.',
  },
  {
    slug: 'indices',
    name: 'Inflação e correção',
    short: 'Índices',
    description: 'Correção monetária por IPCA, IGP-M e INPC, reajuste de aluguel e conversão de moedas.',
    intro:
      'Corrija valores e reajuste contratos com os índices oficiais publicados pelo IBGE e pela FGV, obtidos diariamente do Banco Central.',
  },
  {
    slug: 'negocios',
    name: 'Empresa e vendas',
    short: 'Negócios',
    description: 'Preço de venda, margem, markup, ponto de equilíbrio, custo de funcionário e PJ x CLT.',
    intro:
      'Ferramentas para quem vende, presta serviço ou contrata: forme preços com lucro de verdade e saiba quanto custa cada decisão.',
  },
  {
    slug: 'dia-a-dia',
    name: 'Contas do dia a dia',
    short: 'Dia a dia',
    description: 'Porcentagem, descontos, regra de três, combustível, viagens e dias úteis.',
    intro: 'As contas rápidas que aparecem toda hora — resolvidas em segundos, com a conta explicada.',
  },
];

export const INSTITUTIONAL = [
  { slug: 'sobre', title: 'Sobre o Recibador' },
  { slug: 'metodologia', title: 'Metodologia dos cálculos' },
  { slug: 'avisos', title: 'Avisos e limitações' },
  { slug: 'contato', title: 'Contato' },
  { slug: 'privacidade', title: 'Política de Privacidade' },
  { slug: 'cookies', title: 'Política de Cookies' },
  { slug: 'termos', title: 'Termos de Uso' },
];
