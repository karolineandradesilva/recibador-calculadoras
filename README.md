# Recibador — Calcule o que é seu.

Portal brasileiro de calculadoras gratuitas de trabalho, impostos, finanças e
contas do dia a dia, publicado em **https://recibador.com.br**.

> Este repositório é o novo Recibador (portal de calculadoras). O antigo SaaS de
> emissão de recibos vive em outro repositório (`recibador`) e não é usado aqui.

## Arquitetura

```
GitHub (este repositório)
  └─ GitHub Actions: testes → build → validação → GitHub Pages
        └─ Cloudflare (proxy, cache na borda, HTTPS, redirects)
              └─ recibador.com.br   (recibador.com → 301 para .com.br)
```

- **Site 100% estático**, gerado por um gerador próprio em Node (sem framework).
  A única dependência é o `esbuild`, usado para empacotar e minificar o JS.
- **Cálculos no navegador**: nenhum dado digitado sai do aparelho do usuário.
- **Mesmo código no servidor e no cliente**: a página já vem com um resultado de
  exemplo renderizado (bom para SEO e para quem está sem JavaScript), e o mesmo
  renderizador atualiza o resultado ao vivo.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `src/data/params/2026.js` | **Todas as regras legais do ano** (INSS, IRRF, salário mínimo, FGTS, MEI, Simples, seguro-desemprego…), com fonte e vigência |
| `src/data/indices.json`, `rates.json` | Índices e taxas do Banco Central, atualizados todo dia pelo GitHub Actions |
| `src/calc/` | Funções puras de cálculo (testadas) |
| `src/calculators/` | Uma calculadora por arquivo: metadados de SEO, campos, cálculo e conteúdo |
| `src/ui/` | Renderização, parsing e validação compartilhados entre build e navegador |
| `src/client/` | JavaScript do navegador (runtime das calculadoras, busca, consentimento) |
| `src/templates/`, `src/pages/` | Layout, páginas de categoria, home, institucionais e 404 |
| `src/styles/main.css` | Design system (inline em cada página) |
| `src/static/` | Favicons, fontes (OFL), imagem de compartilhamento |
| `scripts/` | Build, servidor local, validação, atualização de índices e monitor de fontes |
| `test/` | Testes (`node --test`) |

## Comandos

```bash
npm install
npm test            # testes de cálculo, validação, vigência das tabelas e fuzz em todas as calculadoras
npm run build       # gera dist/
npm run validate    # confere links, SEO, canonical, JSON-LD, sitemap e robots em dist/
npm run dev         # build + servidor local em http://localhost:4321
npm run update:indices   # baixa os índices do Banco Central
npm run monitor:sources  # verifica mudanças nas páginas oficiais
```

## Como o site se mantém atualizado

1. **Diariamente** (`deploy.yml`, 06h15 de Brasília): baixa IPCA, INPC, IGP-M,
   IGP-DI, INCC, Selic, CDI, TR, poupança e PTAX do Banco Central, roda todos os
   testes, gera e publica o site. O ano do rodapé e o `lastmod` do sitemap
   acompanham automaticamente.
2. **Semanalmente** (`monitor.yml`): compara as páginas oficiais da Receita
   Federal, do INSS e do MTE com a última leitura e **abre uma issue** quando os
   valores mudam ou quando a tabela do próximo ano é publicada. Em dezembro, abre
   um lembrete anual.
3. **Trava de segurança**: o teste `legal parameters are within their validity
   window` falha 20 dias após o fim da vigência das tabelas. Assim o site nunca é
   republicado com regras vencidas sem que alguém revise.

### Virada de ano (checklist)

1. Copie `src/data/params/2026.js` para `2027.js` e atualize valores e fontes:
   salário mínimo, tabela do INSS e teto, IRRF e redução, dedução por
   dependente, desconto simplificado, salário-família, seguro-desemprego, MEI.
2. Registre o novo ano em `src/data/params/index.js`.
3. Atualize os casos esperados em `test/` (INSS máximo, faixas etc.).
4. `npm test && npm run build && npm run validate` e faça o push.

## Integrações (variáveis do repositório)

Defina em *Settings → Secrets and variables → Actions → Variables*. Enquanto
estiverem vazias, nada é carregado (nem banner de cookies):

| Variável | Uso |
| --- | --- |
| `RECIBADOR_GA_ID` | Google Analytics 4 (`G-XXXXXXX`), com Consent Mode v2 |
| `RECIBADOR_ADSENSE_CLIENT` | AdSense (`ca-pub-…`); também gera o `ads.txt` |
| `RECIBADOR_AD_SLOT_RESULT`, `_CONTENT`, `_SIDEBAR` | IDs dos blocos de anúncio |

Eventos enviados ao GA4: `calculator_start`, `calculator_complete`,
`calculator_copy`, `calculator_print`, `calculator_reset`, `share`, `search` e
`select_content` (cliques internos, para medir o CTR entre calculadoras).

## Adicionar uma calculadora

1. Crie `src/calculators/minha-calculadora.js` exportando `meta`, `ui` e
   `content` (veja qualquer calculadora existente como modelo).
2. Registre-a em `src/calculators/index.js`.
3. `npm test` já valida padrões, entradas aleatórias e entradas absurdas.

## Licenças

Código e textos: © Recibador. Fontes Inter e Bricolage Grotesque: SIL Open Font
License 1.1 (`src/static/fonts/`).
