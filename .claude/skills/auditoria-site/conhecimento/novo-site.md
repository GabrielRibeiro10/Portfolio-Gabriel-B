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
- Desfocado que se mexe: `text-shadow`/`box-shadow` desenhados uma vez em vez de `filter: blur` animado; animação
  CSS com `playbackRate` negativo: adiantar `currentTime` antes (senão para no começo). → `efeitos.md` (fitas-cruzadas)
- Animar só `transform`/`opacity`; `will-change` só no que se move e só enquanto se move.
- Medir posição (`getBoundingClientRect`) no começo do quadro, nunca depois de escrever estilos. → `causas.md`
- Efeito parado fora da tela: `IntersectionObserver` pausa (`animation-play-state`/laço parado).
- **Imagem muito alta dentro de um mockup (notebook, celular):** só mostrar depois de `img.decode()`, baixar junto
  com o vídeo da tela, sem animação nem `will-change` quando o vídeo cobre e no modo leve. → `safari-iphone.md`

- **Coisa presa a um ponto da foto de fundo:** caixa com a proporção da foto cobrindo a tela (não `object-fit` sozinho);
  ponto fora da tela em tela estreita → segurar no canto, nunca trocar de lugar; em tela em pé, conferir por foto
  que não cobre rosto, mãos nem o botão. → `efeitos.md` (foto-com-pontos)
- **Foto de fundo grande no topo:** peça ao cliente a versão em pé para celular e troque com `<picture>` + `preload`
  com `media`; não confie no recorte da foto deitada. → `efeitos.md` (foto-com-pontos)

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
- Vídeo de fundo gravado em pé: no computador, gerar uma versão DEITADA (16:9) recortando cada cena (crop + scale lanczos + `setsar=1`). NÃO usar "em pé nítido sobre ele mesmo desfocado": o cliente vê isso como "vídeo de celular no PC" e reprova. → `efeitos.md`
- Efeitos "de câmera" (REC, cantos, contador de cenas) por cima do vídeo: o cliente reprovou; não propor sem perguntar.
- Topo no celular: nome da empresa sozinho no alto; frase + botão de orçamento numa barra fina embaixo do título (linha em cima, frase à esquerda, botão com seta à direita), deixando o meio livre para o vídeo/foto.
- Barra de atalhos no pé da tela: `fixed` + classe ligada por IntersectionObserver na lista (`rootMargin -99% 0 0 0`),
  nunca `sticky` como último filho da seção (fica solta no fim). → `efeitos.md`
- Botão flutuante do WhatsApp some sobre seções de tela cheia com controles no pé (carrossel, setas, número). → `efeitos.md`
- Toda seção nova tem padding de cima E de baixo próprio (cliente reclamou de seção "grudada" na de cima com padding-top 0).
- Degradê (mask) em fotos que correm: no máximo ~4% nas pontas. → `efeitos.md`
- Nada de "chips" com bolinha numerada nem etiqueta em caixinha colorida: o cliente chama de "cara de IA". Listas de
  etapas/itens viram índice editorial (linhas finas, "(01)", serifa) e rótulos sobre foto viram "N° 01 —" + nome grande
  em itálico. → `efeitos.md`
- Espaçamento entre seções por variáveis desde o começo (`--sec` e `--head`), nunca um clamp diferente em cada seção;
  conferir somando padding de baixo + de cima de cada par. → `efeitos.md`
- Sem travessão "—" nos textos e sem tracinho decorativo curto perto de rótulos (cliente: "cara de IA"). → `efeitos.md`
- Seção de etapas/processo: nada de 4 cartões iguais com ícone; usar a tipografia do próprio site (nome grande,
  linhas finas, número "(01)") e um único efeito de rolagem. Sem rótulo pequeno acima do título. → `efeitos.md`
- GSAP 3.15+: usar `gsap.matchMedia()`, nunca `ScrollTrigger.matchMedia` (não dispara e não dá erro). → `efeitos.md`
- Efeito de rolagem presa no PC: o CSS base deve ser a versão que funciona sem ele (arrastar no celular, modo leve) e
  o modo preso entra por uma classe no <html> que o JS liga. → `efeitos.md`
- Cinza de texto secundário com no mínimo 4,5:1 sobre TODOS os fundos claros do site (testar papel e papel-2). → `efeitos.md`
- Prova social e certificados: só com dado real; sem dado, usar foto real + nomes já públicos, nunca selo inventado. → `efeitos.md`
- Trilho horizontal preso: itens de largura fixa, pin normal (não transform), item ativo no onUpdate do tween e
  margens em vw dentro do trilho (nunca variável com %). → `efeitos.md`
- Pedido de "mais profissional/mais bonito" numa parte que o cliente aprovou: manter o modelo e refinar com efeitos; não trocar layout nem tema sem perguntar (efeitos.md, 2026-11-18).
- Listas curtas (como funciona, etapas): sem linhas entre itens, sem "(01)" e sem contador "01 / 05"; marcador discreto (losango pequeno) e uma fonte por linha (efeitos.md, 2026-11-18).
- Pular até um ponto de seção presa: calcular pela posição real na tela (getBoundingClientRect), nunca somando offsetLeft de pai e filho; animar a rolagem pelo GSAP. Dica de interação conforme o modo (preso = "role", livre = "arraste") (efeitos.md, 2026-11-18).
- Vídeo curto dentro de etapa/painel: WebP animado com capa parada + troca de src só com o painel aberto e versão menor no celular (efeitos.md, 2026-11-18).
- Abertura animada: a foto/título principal (o LCP) precisa aparecer na primeira pintura, por trás ou junto da abertura; escondê-la até a animação acabar trava a nota do PageSpeed perto de 80 (efeitos.md, 2026-11-18).
- Logo/ícone: arquivo no tamanho exibido × 3 no máximo; se a mesma imagem é <img> e máscara CSS, pôr crossorigin="anonymous" na <img> para baixar uma vez (efeitos.md, 2026-11-18).
