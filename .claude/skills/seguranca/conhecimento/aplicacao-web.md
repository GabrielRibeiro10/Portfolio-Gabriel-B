# Aplicação web, APIs e infraestrutura

Use este formato para cada registro:

## [Título curto] — AAAA-MM-DD
- **Status:** confirmado e testado / observação não validada
- **Aplicabilidade:** tecnologias e condições relevantes
- **Causa raiz:** descrição genérica, sem dados confidenciais
- **Regra preventiva:** o que verificar em projetos futuros
- **Abordagem de correção:** orientação genérica
- **Validação:** teste realizado e resultado, ou limitação
- **Limitações:** quando não se aplica

## Site estático na Vercel com build publica arquivos do repositório — 2026-11-10
- **Status:** confirmado e testado
- **Aplicabilidade:** Vercel com `buildCommand` e `outputDirectory: "."` (site estático servido da raiz do repositório). Sem build, a Vercel já não serve o `vercel.json`, mas continua servindo outros arquivos não ignorados.
- **Causa raiz:** com a raiz como saída, todo arquivo do repositório que não está no `.vercelignore` vira URL pública: `README.md` e outros `.md` (anotações internas, relatórios como `docs/SEGURANCA.md`), `vercel.json`, `.gitignore`, `.vercelignore`.
- **Regra preventiva:** em todo site estático, pedir `/README.md`, `/vercel.json`, `/.gitignore`, `/.vercelignore`, `/.env`, `/.git/config` e `/docs/` no site publicado e esperar 404.
- **Abordagem de correção:** `.vercelignore` com `*.md`, `.gitignore`, `.vercelignore` (e pastas internas, como `.claude`); para o `vercel.json` com build, terminar o `buildCommand` com `rm -f vercel.json` (a configuração já foi lida antes do build e os headers continuam valendo).
- **Validação:** deploy de prévia (branch): os arquivos passaram a dar 404 e as páginas continuaram com status 200 e com todos os headers de segurança.
- **Limitações:** não colocar `vercel.json` no `.vercelignore` sem testar numa prévia; não se aplica a frameworks que geram uma pasta de saída própria (`dist/`, `out/`).

## Hash órfão na CSP — 2026-11-10
- **Status:** confirmado e testado
- **Aplicabilidade:** CSP com hashes `sha256-` para scripts inline ou handlers (`'unsafe-hashes'`).
- **Causa raiz:** o script inline muda ou sai do HTML e o hash antigo fica na CSP, liberando um script que ninguém mais conhece.
- **Regra preventiva:** recalcular o SHA-256 de cada `<script>` inline (exceto `application/ld+json`, que não executa) e de cada atributo `on*=`; todo hash da CSP precisa corresponder a um deles.
- **Abordagem de correção:** remover os hashes sem correspondência.
- **Validação:** navegador automático com a CSP nova: nenhuma violação de CSP nem erro de JS.
- **Limitações:** confira todas as páginas que recebem a mesma CSP antes de remover um hash.
