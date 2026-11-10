# Segurança — Portfólio Gabriel Ribeiro

## Auditoria de 2026-11-10

### Arquitetura
- Site estático (HTML, CSS e JavaScript puros, sem build e sem `package.json`), hospedado na Vercel (`vercel.json`).
- Sem backend, banco de dados, login, formulários, uploads, pagamentos ou IA.
- Bibliotecas servidas do próprio domínio (`js/vendor/`): GSAP 3.12.5 + ScrollTrigger 3.12.5, Lenis 1.3.26, three.js r170.
- Terceiros: Google Fonts (CSS e fontes); links de saída para WhatsApp (`wa.me`), GitHub e sites de clientes.
- Fora do ar por `.vercelignore`: `*.md`, `.claude/`, `.gitignore`, `.vercelignore`.

### Escopo
Aplicável: headers HTTP e CSP, XSS no DOM, links externos, exposição de arquivos e segredos, dependências, armazenamento no navegador.
Não aplicável: banco/RLS, autenticação e sessões, CSRF, SSRF, uploads, pagamentos/webhooks, rate limiting, segurança de IA (o site não tem nada disso).

### Verificações e resultados
| Item | Resultado |
|---|---|
| Headers no site publicado (`curl -I`) | Iguais ao `vercel.json`: CSP, HSTS, `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, COOP, CORP |
| CSP | `script-src 'self'` + hash do único script inline (hash recalculado e conferido); sem `unsafe-eval`, sem `on*=` no HTML, `object-src`/`frame-src` `'none'`, `frame-ancestors 'none'` |
| CSP bloqueando algo legítimo | Playwright no site publicado (5 páginas, com rolagem): nenhuma violação de CSP e nenhum erro de JS |
| XSS no DOM | `innerHTML` só em `js/main.js` e `js/cracha.js`, sempre com texto fixo do próprio HTML/JS; texto de usuário entra por `textContent`. O parâmetro `?leve=` só é comparado com `'0'`/`'1'` |
| Links `target="_blank"` | Todos com `rel="noopener"` |
| Arquivos sensíveis no ar | `/.env`, `/.git/config`, `/vercel.json`, `/.claude/...` → 404 |
| Segredos no repositório | Nenhum (busca por chave/token/senha; nenhum `.env` no histórico do Git) |
| Dependências | Consulta à base OSV: nenhuma vulnerabilidade conhecida para gsap 3.12.5, three 0.170.0, lenis 1.3.26 |
| Armazenamento no navegador | `localStorage`/`sessionStorage` guardam só o perfil de desempenho (modo leve), sem dados pessoais |

### Achados
- **Crítico / Alto / Médio:** nenhum.
- **Baixo:** `style-src-attr 'unsafe-inline'` na CSP. Necessário para as animações (GSAP escreve `style=""`); libera só atributos de estilo, scripts continuam bloqueados. Mantido.
- **Informativo:** a Vercel envia `Access-Control-Allow-Origin: *`. Sem cookies nem dados privados, não há risco; o CORP `same-origin` já impede outros sites de embutir os arquivos.
- **Informativo:** o Google Fonts recebe o IP do visitante. Já está declarado em `privacidade.html`. Hospedar as fontes no próprio site eliminaria esse terceiro (e permitiria tirar o Google da CSP).
- **Informativo:** o HSTS usa `includeSubDomains; preload`. Hoje (subdomínio `vercel.app`) não tem efeito colateral; ao usar um domínio próprio, todos os subdomínios dele vão exigir HTTPS.

### Correções
Nenhuma: não foi encontrado risco confirmado que precisasse de mudança.

### Limitações
- Semgrep não está instalado; não foi rodado.
- Não há `package.json`, então não existe `npm audit`; as versões das bibliotecas foram lidas dos próprios arquivos e conferidas na OSV.
- Configurações da conta e do projeto na Vercel (acesso da equipe, proteção de deploys de preview, domínios) não foram verificadas.

### Recomendações
- Ao atualizar uma biblioteca em `js/vendor/`, consultar a OSV/GitHub Advisories para a nova versão.
- Ao mudar o script inline de `index.html`, recalcular o hash na CSP do `vercel.json`.
- Se um dia entrar formulário, backend ou login, refazer esta auditoria com o escopo novo.
