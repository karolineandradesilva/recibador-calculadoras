// Institutional and legal pages. Plain HTML strings; dates mark the last
// substantive revision of each text.
import { SITE } from '../config/site.js';
import { CURRENT as P } from '../data/params/index.js';
import { dateLabel } from '../lib/format.js';

const UPDATED = '2026-10-08';
const mail = `<a href="mailto:${SITE.email}">${SITE.email}</a>`;
const analyticsOn = Boolean(SITE.gaId);
const adsOn = Boolean(SITE.adsenseClient);

const sourceList = () =>
  Object.values(P.sources)
    .map((s) => `<li><a href="${s.url}" rel="noopener" target="_blank">${s.label}</a></li>`)
    .join('');

export const INSTITUTIONAL_PAGES = [
  {
    slug: 'sobre',
    title: 'Sobre o Recibador',
    description: 'Conheça o Recibador: calculadoras gratuitas de trabalho, impostos e finanças com regras oficiais, cálculos explicados e foco em privacidade.',
    updated: UPDATED,
    html: `<p class="lead">O Recibador reúne calculadoras gratuitas para as contas que mais pesam no bolso dos brasileiros: salário, férias, rescisão, impostos, juros, investimentos e preços. O lema resume a proposta: <strong>calcule o que é seu</strong>.</p>
<h2>O que nos guia</h2>
<ul>
<li><strong>Regras oficiais.</strong> Tabelas de INSS, Imposto de Renda, salário mínimo, FGTS e demais parâmetros vêm de fontes oficiais — leis, decretos, portarias e páginas da Receita Federal, do INSS e do Ministério do Trabalho — e são citadas em cada calculadora.</li>
<li><strong>Conta explicada.</strong> Cada página mostra a fórmula, um exemplo resolvido, as premissas e as limitações. Você entende o resultado, não apenas o recebe.</li>
<li><strong>Dados atualizados automaticamente.</strong> Índices de inflação, CDI, Selic, poupança e câmbio são obtidos diariamente da API pública do Banco Central.</li>
<li><strong>Privacidade.</strong> Os valores digitados são calculados no seu próprio navegador e não são enviados a nenhum servidor.</li>
<li><strong>Rapidez e acessibilidade.</strong> Páginas leves, que funcionam bem no celular, com navegação por teclado e leitores de tela.</li>
</ul>
<h2>Qualidade dos cálculos</h2>
<p>As regras de cálculo ficam separadas da interface e são verificadas por testes automatizados, com casos reais e situações-limite, a cada alteração do site. Quando uma tabela oficial muda, os parâmetros são atualizados em um único lugar, e o site não é publicado com tabelas vencidas. Saiba mais na <a href="/metodologia/">metodologia</a>.</p>
<h2>O que o Recibador não é</h2>
<p>O Recibador é uma ferramenta de apoio. Não prestamos consultoria jurídica, contábil, trabalhista, tributária ou financeira, e os resultados não substituem o cálculo oficial do empregador, do contador, do banco ou de um advogado. Leia os <a href="/avisos/">avisos e limitações</a>.</p>
<h2>Como o site se mantém</h2>
<p>O Recibador é gratuito e não exige cadastro. O site poderá exibir anúncios para cobrir custos, sempre separados do conteúdo e sem prejudicar o uso das calculadoras.</p>
<h2>Fale com a gente</h2>
<p>Encontrou um erro, tem uma sugestão ou sentiu falta de uma calculadora? Escreva para ${mail}. Correções de cálculo têm prioridade.</p>`,
  },
  {
    slug: 'metodologia',
    title: 'Metodologia dos cálculos',
    description: 'Como o Recibador calcula: fontes oficiais, tabelas vigentes, arredondamentos, premissas, atualização automática de índices e testes automatizados.',
    updated: UPDATED,
    html: `<p class="lead">Esta página explica de onde vêm os números do Recibador, como eles são aplicados e como garantimos que continuem corretos.</p>
<h2>1. Fontes</h2>
<p>Usamos exclusivamente fontes primárias e oficiais. Os parâmetros legais em vigor (regras de ${P.year}, revisadas em ${dateLabel(P.reviewedAt)}) estão baseados em:</p>
<ul class="sources">${sourceList()}</ul>
<p>Índices de preços (IPCA, INPC, IGP-M, IGP-DI, INCC), taxas (Selic, CDI, TR, poupança) e cotações (PTAX do dólar e do euro) são obtidos diariamente do Sistema Gerenciador de Séries Temporais (SGS) do Banco Central, que republica os dados oficiais do IBGE, da FGV e do próprio BC.</p>
<h2>2. Parâmetros centralizados e com validade</h2>
<p>Todas as alíquotas, faixas e valores legais ficam em um único arquivo de parâmetros por ano, com data de início e fim de vigência e a fonte de cada valor. Quando as tabelas mudam (normalmente em janeiro), um novo arquivo é criado. Um teste automático impede a publicação do site se os parâmetros estiverem vencidos.</p>
<h2>3. Monitoramento das fontes</h2>
<p>Uma rotina automática verifica semanalmente as páginas oficiais da Receita Federal e do INSS e abre um alerta para revisão manual quando detecta mudanças. Mudanças legais são sempre revisadas por uma pessoa antes de entrarem no site.</p>
<h2>4. Arredondamento</h2>
<p>Os valores monetários são arredondados ao centavo em cada etapa em que a legislação ou a prática de folha de pagamento também arredonda (por exemplo, INSS e IRRF). Taxas e fatores de correção são calculados com todas as casas decimais disponíveis e arredondados apenas na exibição. Pequenas diferenças de centavos em relação a outros sistemas podem ocorrer.</p>
<h2>5. Premissas comuns</h2>
<ul>
<li><strong>Mês comercial:</strong> nos cálculos trabalhistas, o mês tem 30 dias (salário do dia = salário ÷ 30).</li>
<li><strong>Divisor de horas:</strong> jornada semanal × 5 (220 para 44 horas), conforme a jurisprudência do TST.</li>
<li><strong>INSS e IRRF de verbas isoladas:</strong> férias, saldo de salário e 13º são calculados como se fossem o único rendimento do mês, salvo indicação em contrário.</li>
<li><strong>IRRF:</strong> a calculadora escolhe entre as deduções legais e o desconto simplificado a opção que resulta em menos imposto, como determina a Receita; para o 13º, usa apenas deduções legais (critério conservador). A redução da Lei 15.270/2025 é aplicada sobre os rendimentos tributáveis brutos.</li>
<li><strong>Juros:</strong> compostos e mensais, salvo quando a calculadora indica outra convenção (como juros de mora simples).</li>
<li><strong>Renda fixa:</strong> CDI composto em 252 dias úteis por ano; dias corridos convertidos de forma aproximada.</li>
<li><strong>Correção monetária:</strong> composição das variações mensais, incluindo o mês inicial e o final (mesma convenção da Calculadora do Cidadão do Banco Central).</li>
</ul>
<p>As premissas específicas de cada ferramenta estão na seção "Limitações e premissas" da própria página.</p>
<h2>6. Testes</h2>
<p>As funções de cálculo são testadas automaticamente com casos conferidos manualmente (por exemplo, o desconto máximo do INSS e a isenção do IR até R$ 5.000), com testes de continuidade das tabelas progressivas e com centenas de combinações aleatórias de entrada em todas as calculadoras, para garantir que nenhuma produza resultado inválido. Os testes rodam a cada atualização do site e a cada atualização diária de dados.</p>
<h2>7. Correções</h2>
<p>Se você identificar uma divergência, envie para ${mail} o nome da calculadora, os valores digitados e o resultado esperado, com a fonte se possível. Analisamos todos os relatos e registramos as correções.</p>`,
  },
  {
    slug: 'avisos',
    title: 'Avisos e limitações',
    description: 'Avisos importantes sobre o uso das calculadoras do Recibador: resultados estimativos, ausência de aconselhamento profissional e responsabilidade do usuário.',
    updated: UPDATED,
    html: `<p class="lead">O Recibador é uma ferramenta gratuita de apoio ao entendimento de cálculos financeiros, trabalhistas e tributários. Leia com atenção antes de usar os resultados para tomar decisões.</p>
<h2>Resultados são estimativas</h2>
<p>Todos os resultados são <strong>estimativas</strong> produzidas a partir das informações que você digita e de regras gerais da legislação e da matemática financeira, conforme descrito em cada página e na <a href="/metodologia/">metodologia</a>. Eles podem diferir dos valores efetivamente devidos ou recebidos em razão de, entre outros fatores:</p>
<ul>
<li>convenções e acordos coletivos, regulamentos de empresa e cláusulas contratuais;</li>
<li>decisões judiciais, súmulas e entendimentos administrativos que mudam com o tempo;</li>
<li>informações incompletas ou incorretas digitadas pelo usuário;</li>
<li>situações específicas não contempladas (estabilidades, afastamentos, múltiplos vínculos, regimes especiais, entre outras);</li>
<li>alterações legais posteriores à última revisão das regras;</li>
<li>arredondamentos e convenções de cálculo diferentes das usadas por empregadores, bancos e órgãos públicos;</li>
<li>variações futuras de taxas, índices e cotações.</li>
</ul>
<h2>Não é aconselhamento profissional</h2>
<p>O conteúdo do Recibador tem caráter <strong>exclusivamente informativo e educativo</strong>. Ele não constitui aconselhamento ou consultoria jurídica, contábil, trabalhista, tributária, previdenciária, financeira ou de investimentos, nem recomendação de compra ou venda de qualquer produto. O uso do site não cria relação profissional de nenhuma natureza. Para decisões importantes — assinar uma rescisão, negociar um contrato, declarar impostos, contratar um financiamento ou investir —, consulte o RH, um contador, um advogado ou outro profissional habilitado, e confira os valores nas fontes oficiais.</p>
<h2>Sem garantia de exatidão</h2>
<p>Trabalhamos para manter os cálculos corretos e atualizados, com fontes oficiais e testes automatizados. Ainda assim, <strong>não garantimos</strong> que os resultados estejam livres de erros, que reflitam a regra aplicável ao seu caso concreto ou que o site esteja sempre disponível. Dados de terceiros (como índices e cotações do Banco Central) são exibidos como recebidos e podem conter atrasos ou revisões.</p>
<h2>Responsabilidade pelo uso</h2>
<p>As decisões tomadas com base nos resultados são de responsabilidade exclusiva de quem as toma. Na máxima extensão permitida pela legislação, o Recibador não se responsabiliza por perdas ou danos decorrentes do uso ou da impossibilidade de uso das calculadoras e do conteúdo. Nada neste aviso afasta direitos que a lei assegura ao consumidor e que não possam ser renunciados. Veja também os <a href="/termos/">termos de uso</a>.</p>
<h2>Encontrou um erro?</h2>
<p>Ajude-nos a melhorar: envie os detalhes para ${mail}.</p>`,
  },
  {
    slug: 'contato',
    title: 'Contato',
    description: 'Fale com o Recibador: dúvidas, sugestões de calculadoras, relato de erros nos cálculos e solicitações sobre privacidade e dados pessoais.',
    updated: UPDATED,
    html: `<p class="lead">Quer relatar um erro, sugerir uma calculadora ou falar sobre privacidade? Escreva para ${mail}.</p>
<h2>Para relatar um erro de cálculo</h2>
<p>Informe, se possível:</p>
<ul><li>o endereço da calculadora;</li><li>os valores que você digitou (ou o link gerado pelo botão "Compartilhar");</li><li>o resultado que você esperava e a fonte (contracheque, termo de rescisão, norma oficial).</li></ul>
<p>Não envie documentos com dados pessoais sensíveis, como CPF, número de conta ou holerite completo — os números relevantes bastam.</p>
<h2>Importante</h2>
<p>Não prestamos consultoria individual nem analisamos casos concretos. Para orientação sobre a sua situação, procure o RH da empresa, um contador, um advogado, o sindicato da categoria ou os canais oficiais (Receita Federal, INSS, Ministério do Trabalho).</p>
<h2>Privacidade e dados pessoais</h2>
<p>Pedidos relacionados à Lei Geral de Proteção de Dados (LGPD) também podem ser enviados para ${mail}. Veja a <a href="/privacidade/">política de privacidade</a>.</p>`,
  },
  {
    slug: 'privacidade',
    title: 'Política de Privacidade',
    description: 'Como o Recibador trata dados pessoais: cálculos feitos no seu navegador, dados de navegação, cookies, terceiros, direitos do titular e contato, conforme a LGPD.',
    updated: UPDATED,
    html: `<p class="lead">Esta política explica quais dados o Recibador trata, por que e como você pode exercer seus direitos, conforme a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).</p>
<h2>1. O essencial</h2>
<ul>
<li><strong>Os valores que você digita nas calculadoras não saem do seu dispositivo.</strong> Os cálculos são feitos no seu navegador. Não armazenamos salários, datas ou quaisquer valores informados.</li>
<li>Não pedimos cadastro, nome, CPF ou e-mail para usar o site.</li>
<li>O botão "Compartilhar" coloca os valores no próprio link (após o símbolo #). Essa parte do endereço não é enviada ao servidor; ela só é vista por quem recebe o link que você decidir compartilhar.</li>
</ul>
<h2>2. Dados tratados</h2>
<h3>Dados técnicos de acesso</h3>
<p>Como qualquer site, a infraestrutura que hospeda e entrega o Recibador (GitHub Pages e Cloudflare) recebe automaticamente dados técnicos das requisições — endereço IP, data e hora, página acessada, navegador e sistema operacional — para entregar o conteúdo, garantir a segurança e prevenir abusos. Base legal: legítimo interesse (art. 7º, IX, da LGPD) e cumprimento de obrigação legal de guarda de registros de acesso (Marco Civil da Internet, art. 15), quando aplicável.</p>
<h3>Medição de audiência</h3>
<p>Usamos o Cloudflare Web Analytics, que mede visitas e desempenho das páginas <strong>sem cookies</strong> e sem identificar o visitante.${analyticsOn ? ' Também usamos o Google Analytics 4, que utiliza cookies apenas se você consentir no aviso de cookies; sem consentimento, ele opera em modo restrito, sem cookies de análise.' : ' Caso outras ferramentas de medição que usem cookies venham a ser adotadas, elas só serão ativadas com o seu consentimento, e esta política será atualizada.'}</p>
<h3>Publicidade</h3>
<p>${adsOn ? 'O site exibe anúncios do Google AdSense. O Google e seus parceiros podem usar cookies para exibir anúncios com base em visitas anteriores a este e a outros sites. Anúncios personalizados dependem do seu consentimento. Você pode gerenciar a personalização em <a href="https://adssettings.google.com" rel="noopener" target="_blank">Configurações de anúncios do Google</a> e saber mais em <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">Como o Google usa dados de sites parceiros</a>.' : 'No momento, o site não exibe anúncios. Se passar a exibir (por exemplo, pelo Google AdSense), anúncios personalizados e cookies de publicidade dependerão do seu consentimento, e esta política será atualizada antes da ativação.'}</p>
<h3>Contato por e-mail</h3>
<p>Se você nos escrever, tratamos o seu endereço de e-mail e o conteúdo da mensagem apenas para responder e, se for o caso, corrigir o problema relatado. Base legal: legítimo interesse e, quando aplicável, exercício regular de direitos.</p>
<h2>3. Armazenamento local</h2>
<p>O site pode guardar no seu navegador (armazenamento local) a sua escolha no aviso de cookies, para não perguntar de novo. Esse dado não é enviado a nós.</p>
<h2>4. Compartilhamento e transferência internacional</h2>
<p>Não vendemos dados. Os dados técnicos são tratados pelos provedores de infraestrutura e, quando ativados, de medição e publicidade (Cloudflare, GitHub/Microsoft e Google), que podem processá-los fora do Brasil, com salvaguardas contratuais previstas em suas políticas, nos termos do art. 33 da LGPD.</p>
<h2>5. Retenção</h2>
<p>Não mantemos bancos de dados de usuários. Registros técnicos são mantidos pelos provedores pelo período definido em suas políticas e pela legislação. E-mails recebidos são mantidos pelo tempo necessário para o atendimento.</p>
<h2>6. Seus direitos</h2>
<p>Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, eliminação, portabilidade e informações sobre compartilhamento, além de revogar consentimentos a qualquer momento (art. 18 da LGPD), pelo e-mail ${mail}. Você também pode recusar ou apagar cookies nas configurações do navegador e alterar sua escolha no link "Preferências de cookies" do rodapé, quando disponível. Se entender necessário, pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).</p>
<h2>7. Crianças e adolescentes</h2>
<p>O site não é direcionado a crianças e não coleta intencionalmente dados de menores.</p>
<h2>8. Segurança</h2>
<p>O site é servido exclusivamente por HTTPS e não processa dados pessoais digitados nas calculadoras em servidores.</p>
<h2>9. Alterações</h2>
<p>Esta política pode ser atualizada. A data da última revisão aparece no topo da página. Mudanças relevantes, como a ativação de novas ferramentas, serão refletidas aqui antes de entrarem em vigor.</p>
<h2>10. Contato</h2>
<p>Encarregado e canal de atendimento: ${mail}.</p>`,
  },
  {
    slug: 'cookies',
    title: 'Política de Cookies',
    description: 'Quais cookies e tecnologias semelhantes o Recibador usa, para que servem e como você pode aceitar, recusar ou alterar suas preferências a qualquer momento.',
    updated: UPDATED,
    html: `<p class="lead">Cookies são pequenos arquivos que um site guarda no seu navegador. Esta página explica quais tecnologias o Recibador usa.</p>
<h2>Necessários</h2>
<p>O Recibador não exige cookies para funcionar. Guardamos apenas, no armazenamento local do navegador, a sua escolha sobre cookies (quando o aviso é exibido). A Cloudflare, que protege e entrega o site, pode definir cookies técnicos de segurança (por exemplo, para filtrar tráfego automatizado), sem finalidade de publicidade.</p>
<h2>Medição de audiência</h2>
<p>O Cloudflare Web Analytics mede visitas e desempenho <strong>sem usar cookies</strong>.${analyticsOn ? ' O Google Analytics 4 só grava cookies de análise (como _ga) se você aceitar no aviso de cookies.' : ''}</p>
<h2>Publicidade</h2>
<p>${adsOn ? 'O Google AdSense pode usar cookies (como __gads e IDE) para exibir e medir anúncios. Anúncios personalizados dependem do seu consentimento; sem ele, podem ser exibidos anúncios não personalizados.' : 'O site não exibe anúncios no momento. Caso passe a exibir, cookies de publicidade só serão usados conforme o seu consentimento.'}</p>
<h2>Como gerenciar</h2>
<ul>
<li>${analyticsOn || adsOn ? 'Use o link "Preferências de cookies" no rodapé para mudar a sua escolha a qualquer momento.' : 'Quando houver ferramentas que dependam de consentimento, um aviso permitirá aceitar ou recusar, e o rodapé terá o link "Preferências de cookies".'}</li>
<li>Você também pode bloquear ou apagar cookies nas configurações do seu navegador.</li>
</ul>
<p>Mais detalhes na <a href="/privacidade/">política de privacidade</a>.</p>`,
  },
  {
    slug: 'termos',
    title: 'Termos de Uso',
    description: 'Termos de uso do Recibador: condições de uso das calculadoras gratuitas, natureza estimativa dos resultados, limitação de responsabilidade e propriedade intelectual.',
    updated: UPDATED,
    html: `<p class="lead">Ao usar o Recibador (recibador.com.br), você concorda com estes termos. Se não concordar, não utilize o site.</p>
<h2>1. O serviço</h2>
<p>O Recibador oferece, gratuitamente e sem cadastro, calculadoras e conteúdos informativos sobre temas trabalhistas, tributários, financeiros e do dia a dia. O serviço é fornecido "no estado em que se encontra" e pode ser alterado, suspenso ou descontinuado a qualquer momento, no todo ou em parte, sem aviso prévio.</p>
<h2>2. Natureza dos resultados</h2>
<p>Os resultados são <strong>estimativas</strong> baseadas nos dados informados pelo usuário e nas regras e premissas descritas em cada página. Eles têm finalidade exclusivamente informativa e educativa, <strong>não constituem aconselhamento profissional</strong> de nenhuma natureza (jurídico, contábil, trabalhista, tributário, previdenciário, financeiro ou de investimentos) e não substituem cálculos oficiais nem a orientação de profissional habilitado. Leia os <a href="/avisos/">avisos e limitações</a>.</p>
<h2>3. Responsabilidades do usuário</h2>
<ul>
<li>Informar os dados corretamente e conferir os resultados antes de usá-los em qualquer decisão.</li>
<li>Consultar as fontes oficiais e profissionais habilitados sempre que a decisão envolver direitos, obrigações ou valores relevantes.</li>
<li>Não utilizar o site para fins ilícitos, não tentar comprometer sua segurança ou disponibilidade e não realizar coleta automatizada massiva de conteúdo.</li>
</ul>
<h2>4. Limitação de responsabilidade</h2>
<p>Empregamos esforços razoáveis para manter as informações corretas e atualizadas, mas não garantimos a ausência de erros, a adequação dos resultados a casos concretos ou a disponibilidade contínua do site. Na máxima extensão permitida pela legislação aplicável, o Recibador e seus responsáveis não respondem por danos diretos ou indiretos, lucros cessantes ou perdas decorrentes do uso, da interpretação ou da impossibilidade de uso das calculadoras e do conteúdo, nem por decisões tomadas com base neles. Esta cláusula não afasta direitos irrenunciáveis previstos no Código de Defesa do Consumidor.</p>
<h2>5. Links e conteúdo de terceiros</h2>
<p>O site contém links para fontes oficiais e outros sites, e pode exibir anúncios de terceiros. Não controlamos e não nos responsabilizamos pelo conteúdo, pelas ofertas ou pelas práticas de privacidade desses terceiros.</p>
<h2>6. Propriedade intelectual</h2>
<p>Os textos, a marca, o design e o código do Recibador são protegidos pela legislação de direitos autorais e de propriedade industrial. É permitido citar trechos curtos e compartilhar links, com indicação da fonte. A reprodução integral ou comercial depende de autorização. Normas e dados oficiais citados pertencem aos respectivos órgãos.</p>
<h2>7. Privacidade</h2>
<p>O tratamento de dados pessoais segue a <a href="/privacidade/">política de privacidade</a> e a <a href="/cookies/">política de cookies</a>.</p>
<h2>8. Alterações dos termos</h2>
<p>Estes termos podem ser atualizados a qualquer momento. A versão vigente é sempre a publicada nesta página, com a data da última atualização.</p>
<h2>9. Lei aplicável e foro</h2>
<p>Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do usuário para dirimir eventuais controvérsias, nos termos do Código de Defesa do Consumidor.</p>
<h2>10. Contato</h2>
<p>${mail}</p>`,
  },
];
