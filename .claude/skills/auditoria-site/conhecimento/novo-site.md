# Site novo: nascer certo

Tudo que já deu problema em sites anteriores, virado regra para o começo do projeto. Leia **antes de escrever o
primeiro arquivo** de um site novo. Cada item aponta para a entrada da base que explica o porquê.

**Toda correção feita em qualquer site acrescenta aqui a regra que teria evitado o problema** (ver "Aprendizado" no
`SKILL.md` e `~/.claude/CLAUDE.md`).

## Carregamento e primeira tela
- **Fontes no próprio site**, não no Google Fonts: `fonts/*.woff2` (só o conjunto latino; fonte variável = um arquivo
  para todos os pesos), `@font-face` com `font-display: swap` no CSS principal, `preload` só da fonte do texto.
  Fonte reserva com `size-adjust` igual à da fonte (nada pula quando ela chega). Assim a política de privacidade não
  precisa citar o Google. → `causas.md` (Google Fonts atrasando a primeira tela)
- **Nada pesado fora da tela durante a abertura:** 3D, vídeos e bibliotecas grandes ligam por um aviso de "a entrada
  terminou" (evento), nunca por tempo fixo nem no meio da animação. → `causas.md`
- Imagem principal da primeira tela com `preload` + `fetchpriority="high"`; nada mais com prioridade alta.
- 404 com caminhos absolutos (`/css/...`, `/fonts/...`). → `causas.md`

## Modo leve desde o primeiro dia
- Copie `modelos/modo-leve.js` para `js/modo-leve.js` e carregue no `<head>` **sem** `defer`, antes do CSS.
  → `efeitos.md` (modo-leve)
- Todo efeito nasce com: checar a classe `leve`, parar no evento de modo leve ligando no meio do uso e respeitar
  `prefers-reduced-motion`.
- **Vídeo nunca some nem congela no modo leve:** fica mais leve (720p, só toca na tela). → `efeitos.md`
- Texto letra a letra, parallax, `scrub`, brilhos em loop: já escreva a versão parada do modo leve junto.
  → `efeitos.md`

## Efeitos que custam caro (escolha a versão barata de cara)
- Nada de vidro fosco (`backdrop-filter`) em algo que rola com a página: fundo semitransparente. → `efeitos.md`
- Brilho/fio de luz: desenhar o degradê uma vez e só **girar/deslizar** (`transform`), nunca animar o degradê.
  → `causas.md`
- Animar só `transform`/`opacity`; `will-change` só no que se move e só enquanto se move.
- Medir posição (`getBoundingClientRect`) no começo do quadro, nunca depois de escrever estilos. → `causas.md`
- Efeito parado fora da tela: `IntersectionObserver` pausa (`animation-play-state`/laço parado).
- **Imagem muito alta dentro de um mockup (notebook, celular):** só mostrar depois de `img.decode()`, baixar junto
  com o vídeo da tela, sem animação nem `will-change` quando o vídeo cobre e no modo leve. → `safari-iphone.md`

## Safari / iPhone
- 3D em CSS: esconder a face de trás com `visibility: hidden` (o Safari ignora `backface-visibility` com
  `preserve-3d`). → `safari-iphone.md`
- Canvas no tamanho da tela, `devicePixelRatio` limitado a 2; não ler pixels de canvas grande (use imagem já pronta,
  ex.: foto P&B em arquivo). → `safari-iphone.md`
- 3D (three.js): marca `dead` no desmonte para o laço parar de desenhar. → `safari-iphone.md`

## Compatibilidade de JavaScript
- API nova com formato de argumento novo (ex.: `isPointInFill(new DOMPoint(...))`): teste uma vez com `try` e tenha o
  formato antigo de plano B (`createSVGPoint()`), senão navegadores um pouco mais antigos dão erro em toda visita.

## Regras do ar (Vercel)
- CSP no `vercel.json` desde o começo: só `'self'` para fonte/estilo/script; script colado na página só com hash.
  → `causas.md`
- CSS/JS com cache longo: marca de versão (`?v=`) em todas as páginas, inclusive na 404. → `causas.md`

## Teste (para não perder tempo)
- No Windows, os scripts usam o Chrome instalado (o navegador do Playwright é até 50x mais lento para montar a
  página). → `ambiente-de-teste.md`
- Abertura/primeira tela: `scripts/abertura.js` (quando a página aparece e as travadas antes e durante a entrada).
- Diga em que modo o site ficou antes de comparar números: Chrome com placa de vídeo fica no modo normal.
