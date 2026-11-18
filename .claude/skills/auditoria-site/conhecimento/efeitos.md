# Efeitos: custo, como medir e como ficam no modo leve

Uma ficha por efeito. O marcador `<!-- efeito: id -->` é o mesmo id que o `descobrir.js` mostra; efeito sem ficha
aparece lá como NOVO. Ficha nova: copie o formato, meça antes de escrever e marque `confirmado (medido)` ou
`observação (não medida)`.

Formato: **Custo** (onde pesa: processador, placa de vídeo, rede) · **Medir** (como confirmar que é ele) · **Modo
leve** (versão parada mais próxima do visual) · **Cuidados** (defeitos conhecidos) · **Visto em**.

---

<!-- efeito: modo-leve -->
## Modo leve (o sistema, não um efeito)
- **O que é:** classe `leve` no `<html>` que desliga/para o que pesa em aparelho fraco. Sem ele, o aparelho fraco roda
  tudo. **Obrigatório em todo site** (SKILL.md, passo 0b).
- **Detecção oficial:** `modelos/modo-leve.js` (cópia universal do `js/desempenho.js` do portfólio). No `<head>`, antes
  do CSS, sem `defer`. Pistas: placa de vídeo sem aceleração ou da lista de placas fracas, teste de processador
  (< 350 = fraco), até 2 núcleos/2 GB (fora do Safari), economia de dados/2G; perfil guardado 30 dias; rede de
  segurança: duas janelas seguidas de 2 s com mediana acima de 40 ms (< 25 fps) liga no meio do uso. Evento
  `leve:liga`; `?leve=1`, `?leve=0`, `?leve=info`.
- **Por que um modelo único (visto: Maria Festinha, o dono reclamou que o leve não ligava no celular):** o site tinha
  detecção própria, no `main.js` (com `defer`, depois da 1ª pintura), só com memória ≤ 2 GB / núcleos ≤ 2 (quase
  nenhum celular atual), "sem placa de vídeo" (todo celular tem), bateria baixa (só Android) e fluidez pela mediana;
  sem teste de processador, sem lista de placas fracas, sem lembrar a decisão. Trocado pelo modelo: o site passou a
  ligar o modo leve antes de desenhar, e os aparelhos fracos simulados ficaram mais leves ainda
  (travadas 0,17-0,22 s, antes 0,3-0,9 s).
- **Testar a detecção:** abrir com `prepararModo(p, 'normal')` (finge placa de vídeo, inclusive
  `failIfMajorPerformanceCaveat`) em celular/PC bom → tem que ficar normal; sem fingir → liga com motivo `gpu`.
  O teste de processador com a lentidão simulada do Chrome dá ~360-380 no "fraco" (perto do limite de 350): o teste
  não reproduz bem um celular fraco real; no aparelho, confira com `?leve=info`. Num PC sem placa de vídeo, a rede de
  segurança liga sozinha ("fps") porque a tela grande é desenhada no processador.
- **Cuidados:** todo efeito confere a classe ao começar e escuta `leve:liga`; mudou um script colado no `<head>`,
  recalcule o hash da CSP.
- **Visto em:** portfólio (original), Maria Festinha (instalado). — confirmado

<!-- efeito: scroll-scrub -->
## Animações presas à rolagem (GSAP ScrollTrigger com `scrub`/`onUpdate`)
- **Custo:** processador, a cada quadro de rolagem, para cada gatilho ativo; escreve estilos e força recálculo se algo
  medir posição depois (ver `causas.md`, layout forçado). Muitas (10+) somadas pesam em aparelho fraco.
- **Medir:** `descobrir.js` conta os gatilhos; perfil de JS mostra o tempo do GSAP (`render`, `_renderCSSTransforms`).
  Para medir o teto: `desempenho.js --js="ScrollTrigger.getAll().forEach(t=>{t.animation&&t.animation.progress(1);t.kill()})"`.
  No Maria Festinha (13 gatilhos), desligar todos rendeu pouco (12,7 → 11,4 s; depois das outras correções,
  1,9 → 1,1 s): ataque primeiro letras, quadros e iframes.
- **Modo leve:** estado final direto (sem `scrub`) ou entrada simples (`opacity`/`transform`) disparada uma vez.
- **Visto em:** portfólio (8), Maria Festinha (13). — confirmado (medido)

<!-- efeito: scroll-pin -->
## Seção presa na tela enquanto rola (ScrollTrigger `pin`)
- **Custo:** processador (recalcula posições); risco de a página pular se o cálculo ficar velho (fontes, imagens).
- **Medir:** CLS no `desempenho.js`; `ScrollTrigger.refresh()` depois de fontes/imagens.
- **Modo leve:** geralmente pode ficar (é estrutura), mas sem animações presas dentro dele.
- **Visto em:** — observação (não medida)

<!-- efeito: rolagem-suave -->
## Rolagem suave (Lenis, Locomotive)
- **Custo:** processador; cada quadro chama `scrollTo` (que aparece caro no perfil, mas é o trabalho normal de mover).
- **Medir:** desligar no modo leve e medir. No Maria Festinha, duas vezes (antes e depois das outras correções),
  tirar o Lenis diminuiu as travadas longas mas **subiu o quadro médio** (~30 → ~40 ms): a rolagem nativa em
  saltos repinta mais por quadro. Não é a primeira coisa a desligar.
- **Modo leve:** manter, salvo se a medição mostrar ganho nos dois números (travadas e quadro médio).
- **Visto em:** portfólio, Maria Festinha. — confirmado (medido)

<!-- efeito: webgl-3d -->
## 3D/WebGL (three.js ou canvas WebGL)
- **Custo:** placa de vídeo e memória; montar a cena pode travar 0,5-1,5 s.
- **Medir:** no teste o custo sai exagerado (sem placa de vídeo, `GLES2::ReadPixels`): esconda o canvas com `--css`
  para medir o resto. O custo real só num aparelho.
- **Modo leve:** versão desenhada/imagem parada; montar a cena só com o navegador parado (`requestIdleCallback`).
- **Cuidados:** Safari pode deixar o canvas em branco (ver `safari-iphone.md`).
- **Visto em:** portfólio (crachá 3D). — confirmado (medido)

<!-- efeito: canvas -->
## Canvas 2D animado
- **Custo:** processador (desenho) e memória (canvas grande × `devicePixelRatio`).
- **Medir:** perfil de JS (função que desenha); `--css` escondendo o canvas **não** para o JS — use uma flag.
- **Modo leve:** menos quadros por segundo, resolução menor, ou imagem parada. **Se o canvas mostra vídeo ou quadros
  presos à rolagem, não para:** ver `sequencia-quadros`.
- **Cuidados:** Safari em branco (ver `safari-iphone.md`).
- **Visto em:** Maria Festinha (abertura). — observação

<!-- efeito: sequencia-quadros -->
## Sequência de quadros trocada pela rolagem (centenas de imagens, GSAP ScrollTrigger)
- **Regra do dono:** é vídeo, **não congela nem some no modo leve**: fica mais leve.
- **Custo:** rede (megabytes: 477 quadros ≈ 11-21 MB no computador) e processador (baixar, decodificar, desenhar a cada
  quadro de rolagem). Pesa mais em tela grande (PC).
- **Medir:** `erros.js` mostra o peso por aparelho; perfil de JS mostra `fetch`/`blob`/`createImageBitmap`; contar
  requisições de quadros com a página parada (~6 s) e depois de rolar.
- **Modo leve (versão leve, andando):** 1 a cada 4 quadros (se os quadros foram interpolados 4×, é o ritmo do vídeo
  original), canvas em 60% da resolução (o navegador amplia), menos quadros na memória (20 em vez de 40) e menos
  decodificações ao mesmo tempo (2 em vez de 4), e **sem pré-download**: só baixa o que a rolagem pede. Se o modo
  ligar no meio, o motor passa a usar esses valores na hora (ler o modo a cada passo, não só ao iniciar).
- **Cuidados:** procure **pré-carregamentos com tempo** ("quem fica X s no site já baixa tudo"): no Maria Festinha
  um `setTimeout` de 4,5 s depois do `load` baixava os 477 quadros mesmo no modo leve.
- **Números (Maria Festinha, computador fraco, modo leve):** congelado 0,2 s de travadas (não vale: o dono quer o vídeo
  andando); andando com 1/4 dos quadros em resolução 1x: 4,5 s; com 1/4 dos quadros em 60%: **0,4-0,5 s** (META ok).
  Tablet e celular fracos: 0,07-0,2 s.
- **Visto em:** Maria Festinha (só no computador e tablet; no celular o site usa um vídeo). — confirmado (medido)

<!-- efeito: video-fundo -->
## Vídeo de fundo ou vídeo dentro do site (autoplay, mudo, em loop)
- **Regra do dono:** **não some nem para no modo leve**: fica mais leve.
- **Custo:** rede e decodificação contínua.
- **Medir:** peso no `erros.js`; conferir que pausa fora da tela (`IntersectionObserver`).
- **Modo leve (versão leve, tocando):** arquivo de resolução menor (ex.: 720p em vez de 960p/1080p), tocar só com a
  seção na tela e pausar fora dela, sem pré-carregar antes de chegar perto. Com economia de dados ligada, pode
  começar pelo pôster e tocar ao chegar na seção.
- **Cuidados:** iPhone exige `muted` + `playsinline`; modo economia bloqueia autoplay (ver `safari-iphone.md`).
  Não esconder com `html.leve video { display: none }` (visto no portfólio, retirado).
- **Números (portfólio, modo leve com os vídeos dos projetos tocando em 720p):** computador fraco 0,11 s, celular fraco
  0,13 s de travadas (META ok).
- **Visto em:** portfólio (vídeos dos projetos), Maria Festinha (vídeo da abertura no celular). — confirmado (medido)
- **Vídeo gravado em pé (celular, Instagram) no fundo do computador** [REPROVADO pelo cliente em 2026-11-16: usar o recorte deitado, ver correção no fim do arquivo]: recortar uma faixa deitada e esticar
  (720x1280 → 1280x720) amplia 3,5x e fica borrado. Melhor: montar **num arquivo só** (ffmpeg) o mesmo vídeo
  desfocado cobrindo a tela + o vídeo nítido em pé na altura toda, de um lado (o texto fica do outro). Um só vídeo
  decodificando, nítido, ~7 MB para 16 s em 1920x1080. No celular usa o arquivo em pé direto. — confirmado (visto,
  WR Eventos, 2026-11-16)
- **Escolher o arquivo (em pé/deitado, normal/leve) por script:** com CSP `script-src 'self'` não dá script inline;
  um arquivo pequeno logo depois do `<video>` define `src` e `poster` antes de baixar. `<source media>` em vídeo não é
  confiável. — observação · 2026-11-16

<!-- efeito: iframe-externo -->
## Iframe de outro site (mapa, vídeo, widget)
- **Custo:** rede e processador do outro site; o Google Maps roda o próprio JavaScript **o tempo todo** (aparece como
  `map.js` no perfil de JS, medindo posições a cada quadro). Cookies de terceiros (LGPD, ver skill `juridico` A8).
- **Modo leve:** imagem/mapa ilustrado no lugar do iframe (se o site já tem uma versão para o celular, use a mesma),
  ou carregar só ao clicar, o que também resolve cookies antes do aceite.
- **Números (Maria Festinha, modo leve):** junto com as outras correções, foi o passo que levou os três aparelhos
  fracos à meta (computador fraco 1,3-1,9 s → 0,7-0,9 s).
- **Cuidados:** liberar o endereço no `frame-src` da CSP.
- **Visto em:** Maria Festinha (Google Maps no computador). — observação

<!-- efeito: backdrop-filter -->
## Vidro fosco (`backdrop-filter`)
- **Custo:** placa de vídeo, refeito a cada quadro quando o elemento ou o fundo se mexe. **Pior caso para celular
  fraco**, e o teste não mede (só o `pesados.js` aponta).
- **Modo leve:** fundo semitransparente (`rgba(...)`). Se o elemento rola com a página, troque **para todo mundo**: o
  visual fica quase igual.
- **Cuidados:** leia a lista inteira do `pesados.js`: botões pequenos com vidro fosco aparecem no fim (visto: Maria
  Festinha, `a.btn.btn-outline` continuava com vidro no modo leve; trocado por fundo branco 68% para todo mundo).
- **Vidro fosco atrás de fundo opaco** (cores sem transparência): o desfoque não aparece, mas a placa de vídeo calcula
  mesmo assim. Tire para todo mundo, sem mudar nada na tela (visto: Maria Festinha, barra de diferenciais da abertura,
  risco ALTO no computador). Antes de tirar, confira se todas as camadas do `background` são opacas.
- **Visto em:** portfólio (13 etiquetas travavam celular fraco), Maria Festinha. — confirmado

<!-- efeito: filter-blur -->
## Desfoque (`filter: blur`)
- **Custo:** placa de vídeo; grande e se mexendo é caro.
- **Modo leve:** desligar ou trocar por imagem já desfocada.
- **Visto em:** portfólio, Maria Festinha. — observação

<!-- efeito: mask -->
## Máscara (`mask-image`)
- **Custo:** placa de vídeo; área grande animada é cara.
- **Modo leve:** desligar a animação da máscara ou a máscara. Animação feita por JS (variável CSS mudada a cada
  passo): desenhar cada elemento uma vez quando aparece e não atualizar mais (visto: neon da abertura do Maria
  Festinha).
- **Cuidados:** o `pesados.js` continua listando a máscara depois de parada (ele não distingue parado de animado):
  confira no código que ela não muda mais no modo leve.
- **Visto em:** portfólio, Maria Festinha (faixas de neon da abertura). — confirmado (código)

<!-- efeito: mix-blend -->
## Mistura de cores (`mix-blend-mode`)
- **Custo:** placa de vídeo (obriga a compor camadas juntas).
- **Modo leve:** `normal`, com a cor já ajustada.
- **Visto em:** portfólio, Maria Festinha. — observação

<!-- efeito: animacao-infinita -->
## Animações CSS em loop infinito
- **Custo:** pintura contínua se animam `box-shadow`/`filter`/degradê (inclusive ângulo de `conic-gradient` por
  `@property` e `background-position`); barato se só `transform`/`opacity`.
- **Medir:** `document.getAnimations()` com `iterations === Infinity`; `Paint` alto no `causas.js` com a página parada;
  o custo real só aparece com placa de vídeo (trace com `GPUTask`, ver `causas.md`, "Brilho que redesenha").
- **Correção para todos (mesmo visual):** desenhar o degradê uma vez num filho e girar/deslizar com `transform`.
  Portfólio: placa de vídeo da hero 190 → 37 ms em 3 s.
- **Modo leve:** parar (`animation: none`) ou deixar só `transform`/`opacity`. Pausar com a aba em segundo plano.
- **Visto em:** portfólio, Maria Festinha. — confirmado (medido, 2026-11-12)

<!-- efeito: texto-letra-a-letra -->
## Texto quebrado em letras/palavras animadas
- **Custo:** centenas de elementos mudando `style` a cada quadro, cada letra animada vira uma camada (no rastro do
  `causas.js`: `Layerize` alto e `span` de letra no topo da lista "Elementos mudados"). Com giro 3D e `filter` por
  letra é pior. **Foi o maior peso do Maria Festinha**: um parágrafo inteiro letra a letra (~4.600 mudanças de estilo
  em ~35 quadros) mais os títulos que "desdobram".
- **Medir:** `causas.js --secao=#id` (procure `span.*-char` com milhares de mudanças).
- **Modo leve:** texto inteiro de uma vez: não quebrar em letras se o modo leve já está ligado; se ligou depois de
  quebrar, pôr todas as letras no estado final na hora de revelar. Animação de letras dentro de sequência presa à
  rolagem: só opacidade (sem giro 3D nem `filter`). Leitores de tela: `aria-label`/`.sr-only` com o texto inteiro.
- **Números (Maria Festinha, modo leve, travadas somadas):** celular fraco 7,3 s → 1,9 s; computador fraco
  12,7 s → 6,0 s; tablet fraco 6,9 s → 2,8 s (só com esta mudança).
- **Abertura da primeira tela (portfólio, 2026-11-12):** o teste começa a rolar durante a abertura, então letras do
  título + palavras do painel caem na medição da 1ª seção (`section.panel` no PC fraco 39 ms, `META NÃO`). Modo leve
  sem tirar o efeito: título **linha por linha** com a mesma máscara (`.line` em vez de `.char`, sem giro) e
  parágrafos entrando **inteiros** (`y` + `opacity`). PC fraco 39 → 34 ms; celular fraco 33 → 20 ms; tablet fraco
  32 → 21 ms. O estado final fica igual ao do modo normal (conferido por foto).
- **Visto em:** portfólio, Maria Festinha. — confirmado (medido)

<!-- efeito: css-3d -->
## 3D em CSS (`preserve-3d`, perspectiva)
- **Custo:** placa de vídeo (camadas 3D).
- **Cuidados:** Safari desenha a face de trás por cima (ver `safari-iphone.md`).
- **Visto em:** portfólio (notebook). — confirmado

<!-- efeito: sticky -->
## Elementos fixos ao rolar (`position: sticky`)
- **Custo:** baixo sozinho; caro se tiver efeitos pesados dentro (eles ficam na tela por mais tempo).
- **Visto em:** portfólio, Maria Festinha. — observação

<!-- efeito: muitas-camadas -->
## Muitas camadas (`will-change` em dezenas de elementos)
- **Custo:** memória da placa de vídeo e tempo de `Commit`/`Layerize` no rastro.
- **Modo leve / correção:** `will-change` só durante a animação, ou só nos elementos que de fato se movem.
- **Visto em:** — observação

<!-- efeito: foto-com-pontos -->
## Foto de fundo com coisas presas a pontos dela (luzes animadas, objeto em cima de um detalhe)
- **Como fazer:** não use `object-fit: cover` na `<img>` sozinha (não dá para saber onde cada ponto da foto caiu).
  Faça uma caixa com a proporção da foto (`aspect-ratio: L / A`), `width: max(100%, calc(100svh * L / A))`, centrada
  com `translate`; a foto e os enfeites ficam dentro dela em `%` da foto, e o JS mede o ponto com
  `getBoundingClientRect` de um marcador invisível. Em tela em pé, desloque o centro (`--fx`) para o rosto/assunto.
- **Cuidados (visto: WR Eventos, 2026-11-13):** em telas mais estreitas que a foto (1024×768, celular) o ponto sai
  da tela. Não troque a peça de lugar quando isso acontece (foi o erro: a regra "fora da tela → vai para o meio"
  jogou o extintor de 1024 px para cima das cadeiras); **segure no canto** (`cx = min(cx, largura − parte da peça)`)
  e só em tela em pé use um lugar próprio, conferido por foto, que não cubra rosto, mãos nem o botão principal.
- **Arte própria para tela em pé (melhor que recortar a de deitado):** `<picture>` com
  `<source media="(max-aspect-ratio: 1/1)">`, dois `preload` com `media` (`(min-aspect-ratio: 1001/1000)` e
  `(max-aspect-ratio: 1/1)`, para não baixar as duas) e, na mesma media query, a caixa troca de proporção e os pontos
  ganham outros `%`. Valores que mudam por foto (inclinação da peça) vão como variável CSS no marcador (`--rot`) e o JS
  lê com `getComputedStyle`, assim não há duas regras de tela no JS. Em celular de 360 px a base da peça encostou no
  botão: em tela em pé deixe a peça passar mais da borda direita (segurar em 25% do tamanho, não 32%). — 2026-11-13,
  confirmado (foto em 390, 360 e 768 px em pé)
- **Luzes de palco em cima da foto:** feixes = degradê desenhado uma vez + `clip-path` de cone, girando com
  `transform` em volta da fonte (`transform-origin: 50% 0`); brilho = degradê radial pulsando `opacity`/`scale`;
  fumaça = degradê radial grande deslizando. Sem `mix-blend-mode` (vermelho com transparência sobre fundo escuro já
  parece luz). Pausar com `animation-play-state` quando a seção sai da tela; modo leve: parado.
- **Visto em:** WR Eventos (topo). — confirmado (medido: posições por foto em 1600, 1366, 1024 e 390 px)

<!-- efeito: objeto-que-viaja -->
## Objeto que sai do topo e para numa seção de baixo (GSAP, preso à rolagem)
- **Como fazer:** o objeto **mora no lugar onde para** (sem JS ele simplesmente está lá). O JS mede a diferença até
  o ponto de partida (centro e tamanho) e anima `x/y/rotation/scale` desse deslocamento até zero, com
  `start: 0` e `end` = rolagem em que o lugar final chega ao meio da tela. Medir com o `transform` zerado, de novo em
  `ScrollTrigger.addEventListener('refreshInit', ...)`, valores em função + `invalidateOnRefresh`.
- **Cuidados:** `scrub: true` (sem atraso) para não descolar da rolagem; entrada da peça num filho (`img`) para não
  brigar com o `transform` da rolagem; `will-change` só enquanto o gatilho está ativo; a seção do lugar final não pode
  ter `overflow: hidden`.
- **Modo leve:** a peça fica parada no ponto de partida (um `transform` só, refeito no `resize`).
- **Visto em:** WR Eventos (extintor do topo até "Quem somos"). — confirmado (medido por foto em 4 telas)

<!-- efeito: fitas-cruzadas -->
## Fitas cruzadas andando (faixa de isolamento, uma nítida e uma desfocada)
- **Como fazer barato:** fita parada e girada (`rotate`), só o trilho de texto anda (`@keyframes` com
  `translateX(-50%)`, conteúdo repetido 2x). Desfoque **sem `filter: blur`** (que redesenharia a cada quadro): fita com
  bordas de `box-shadow` da mesma cor e texto `color: transparent` + `text-shadow` (desenhado uma vez, depois só
  desliza). Fica por cima da troca de seção (escura → clara) com margem negativa de metade da altura em cima e embaixo
  (não muda a altura da página) e `overflow-x: clip`. Texto e botão do topo sobem a mesma metade para não ficarem
  embaixo da fita.
- **Acelera e vira com a rolagem:** `element.getAnimations()[0].playbackRate` = sentido × (1 + velocidade), voltando
  suave no `gsap.ticker` só enquanto a fita está na tela. **Cuidado:** animação CSS com `playbackRate` negativo
  **para ao chegar no começo** — adiante o relógio uma vez (`a.currentTime = 36e6`). Medido: descendo 3,5×, subindo
  −2,7×, depois volta a ±1 e continua andando.
- **Modo leve:** só a animação CSS, mais lenta, sem o efeito da rolagem.
- **Visto em:** WR Eventos (embaixo do topo). — confirmado (medido)

<!-- efeito: visor-camera -->
## Visor de câmera sobre vídeo de fundo (cantos, REC, tempo de gravação, cenas)
- **O que é:** cantos finos, "● REC" piscando, tempo HH:MM:SS:QQ correndo e barras das cenas enchendo junto com o vídeo.
- **Custo:** quase nada: troca de texto e `transform: scaleX` por quadro do vídeo (`requestVideoFrameCallback`, com
  `requestAnimationFrame` de reserva), parado quando o vídeo pausa; o REC é `steps(1)` em `opacity`.
- **Modo leve:** fica igual (é barato). `prefers-reduced-motion`: REC sem piscar.
- **Cuidados:** posições das cenas = (duração do trecho − transição) × índice; no celular as barras ficam curtas para
  não encostar no texto do alto.
- **Visto em:** WR Eventos (topo). — observação · 2026-11-16


## Correção 2026-11-16 — vídeo em pé no PC e visor de câmera (confirmado, pedido do cliente)
- **Vídeo em pé no PC:** a versão "em pé nítido sobre ele mesmo desfocado" foi REPROVADA ("no PC tá com vídeo de
  mobile"). Fazer um arquivo deitado próprio: `crop=LARGURA:LARGURA*9/16:0:(ih-oh)*0.42,scale=1280:720:flags=lanczos,setsar=1,unsharp=5:5:0.6`
  (leve: 960x540, crf 25). Sem `setsar=1` o vídeo sai com 1283 px de largura. Subir `?v=` no src do vídeo e na capa.
- **Visor de câmera (REC/cantos/cenas):** reprovado e removido. Não usar mais sem o cliente pedir.

## Barra presa no pé da tela (sticky bottom) sobra solta no fim da seção — confirmado (medido) · 2026-11-17
- Sintoma: barra de atalhos (`position: sticky; bottom`) como último filho da seção acompanha a rolagem, mas quando a
  seção acaba ela "solta" e fica parada numa faixa vazia entre o último cartão e a seção seguinte. O cliente vê isso
  como "botões bugados no final das fotos".
- Correção: `position: fixed` (centrada com `left: 50%` + translate), escondida por padrão (opacity 0 + translateY) e
  mostrada por uma classe no `<html>`. Quem liga a classe é um IntersectionObserver na LISTA (não na seção) com
  `rootMargin: '-99% 0px 0px 0px'`: só fica ligada enquanto a lista cruza o pé da tela. Assim a barra desce e some
  junto com o último item, sem ocupar espaço no layout.

## Botão flutuante do WhatsApp por cima de carrossel em tela cheia — confirmado · 2026-11-17
- Em seção de tela cheia com setas/número no pé (portfólio em cartões), o botão redondo fixo cobre o número e as
  setas, principalmente no celular. Esconder o flutuante enquanto a seção ocupa o meio da tela
  (`top < 75% da tela && bottom > 25%`).

## Colunas de fotos que correm (carrossel vertical) com máscara de degradê — observação · 2026-11-17
- Máscara `linear-gradient` de 11% em cima e embaixo apagou fotos demais: o cliente achou o degradê "forte".
  Usar 4% (só para a foto não cortar seco). Velocidade boa: ~60 s por volta no PC, ~34 s no celular (90/48 s
  pareciam lentos para o cliente).

## "Cara de IA": chips com bolinha numerada e etiqueta vermelha em caixa — REPROVADO pelo cliente · 2026-11-17
- Reprovado: passos em "pílulas" brancas com borda e um círculo preto numerado (1, 2, 3), e etiqueta do serviço numa
  caixinha vermelha em caixa alta no canto da foto. O cliente achou genérico, "cara de IA".
- No lugar (aprovado para teste, padrão awwwards): índice editorial — linhas finas em cima e embaixo de cada item,
  número entre parênteses "(01)" pequeno em vermelho, nome em serifa ~20px; no hover a linha enche de preto de baixo
  para cima (scaleY num ::after), o texto clareia e anda ~14px. Nome do serviço sobre a foto: "N° 01" com um traço
  fino e o nome grande em itálico serifado no pé da imagem (acima de qualquer barra fixa), sem caixa de fundo.

## Índice "(01)" com linhas entre itens e contador "01 / 05 ·" também REPROVADOS · 2026-11-18
- O índice editorial que tinha sido aprovado para teste (linhas finas entre itens, "(01)" vermelho, contador
  "01 / 05 · Prevenção" em itálico + barra + ponto acima do título) foi reprovado depois: "não gosto dos travessões,
  de algumas fontes e da numeração; quero algo bonito e mais limpo".
- No lugar: lista sem linhas e sem números, gap ~10px, losango vermelho de 6px (quadrado girado 45°, o mesmo motivo das
  rosas dos ventos) antes de cada item em serifa; hover: losango gira e texto fica vermelho. Rótulo "Como funciona" em
  cinza. Contador acima do título removido (o nome do serviço já estava na foto). Regra: evitar misturar 3 estilos
  numa linha só (itálico serifado + barra + caixa alta espaçada); menos sinais gráficos = mais limpo. · observação

## Lista curta como "página que vira": um item por vez, letra a letra · 2026-11-18 · observação
- Pedido do cliente para o "Como funciona" (tirar cara de IA): rótulo em itálico serifado vermelho, sem caixa alta
  espaçada; no lugar da lista, um item por vez em serifa grande (30–44px PC, 27px celular); as letras entram uma a uma
  virando (rotationX -100 → 0, yPercent 55 → 0, scale .45 → 1, stagger ~0.028, expo.out) e saem para cima (rotationX
  100, scale 1.15, power2.in); troca a cada ~2,6 s; embaixo os itens em letra pequena, o da vez vermelho com sublinhado
  que enche no tempo da troca (clicável no PC). Lista real fica escondida só visualmente (leitor de tela).
- Desempenho: roda só com o cartão na tela (ScrollTrigger onToggle liga/desliga o delayedCall); modo leve = lista
  parada com losangos. Letras em `inline-block` dentro de palavras `nowrap` (não quebra no meio da palavra).

## Trilho de etapas: navegação por nomes, profundidade nas fotos e dois bugs · 2026-11-18 · confirmado (medido)
- "01 / 04" trocado pelos nomes das etapas clicáveis (botões, aria-current) com a barra de progresso embaixo; número
  nos painéis removido. Fotos: moldura 8% mais larga que o painel e translateX ao contrário do trilho (−6% a +6%, lido
  de todos os rects antes de escrever); foto aberta afasta devagar (scale 1.14 → 1.01 em 7 s). Selos em serifa itálica
  com losango, sem caixa alta espaçada nem ✓.
- Bug 1: ir até a etapa calculando com `offsetLeft` do painel + `offsetLeft` do trilho somava a margem duas vezes e
  caía uma etapa adiante. Usar a posição real: `tx = x_atual - (rect.left + rect.width/2 - innerWidth/2)`.
- Bug 2: dica "Arraste para o lado" aparecia no celular com o trilho preso (lá se ROLA a página). Com pin, sempre
  "Role para avançar".
- `scrollTo({behavior:'smooth'})` não é confiável para pular até um ponto do pin: animar a rolagem pelo GSAP
  (objeto {y} + onUpdate scrollTo).
- WhatsApp flutuante cobria o último nome da barra de etapas: esconder sobre a seção (como no portfólio).

## Espaço entre seções desigual e grande demais — confirmado (medido) · 2026-11-17
- Cada seção tinha seu próprio `clamp()` de padding; entre duas seções claras do mesmo fundo o vão somava 270–330px no
  PC (padding de baixo de uma + de cima da outra), e variava de uma troca para outra. Cliente: "vários espaçamentos".
- Correção: duas variáveis no `:root` e todas as seções usando só elas:
  `--sec: clamp(56px, 6.5vw, 100px)` (respiro em cima e embaixo de cada seção → ~190px entre seções no PC, ~112px no
  celular) e `--head: clamp(40px, 4.6vw, 68px)` (título → conteúdo). Exceções: seção logo depois de algo que invade
  (fitas cruzadas) soma o tamanho da invasão; vizinhas de uma faixa/marquee grande usam `--sec * .6`; seção depois de
  bloco escuro de tela cheia usa `--sec * 1.2`.
- Medir rápido no console: somar `paddingBottom` da seção + `paddingTop` da seguinte para cada par.

## Tracinhos decorativos ("travessões") = cara de IA — REPROVADO pelo cliente · 2026-11-17
- Tracinho curto de 18–46px antes/depois de rótulo ("—— N° 01", traço acima do local, traço embaixo do nome da
  empresa no topo, traço nos cartões) e travessão "—" no texto: o cliente lê como genérico/IA. Não usar.
  Linhas de divisão de largura inteira (entre itens, entre blocos) continuam ok.

## Seção de etapas/processo sem cara de template (skill impeccable "bolder") — observação · 2026-11-17
- O que a skill impeccable aponta como genérico (e estava na seção "Como trabalhamos"): rótulo pequeno acima do
  título, 4 cartões iguais com ícone + título + texto, borda colorida grossa (>1px) ao lado de texto, "✓" de teclado
  como ícone (usar SVG desenhado), brilho colorido sem sombra real (box-shadow 0 0 Npx).
- Versão "bolder": etapas em linhas finas, nome de cada etapa gigante em serifa VAZADA (-webkit-text-stroke, a mesma
  letra vazada que o site já usa na faixa grande); ao rolar, ScrollTrigger com toggleClass: passou = preto (.on,
  start 'top 58%', end 'max'), cruzando a linha = vermelho itálico (.cur). Modo leve/sem JS: nomes pretos.
- Regra da skill: "mais ousado" = subir a seção ao nível das jogadas fortes que o resto do site já tem, sem cor,
  fonte ou efeito novos. Ferramenta: `impeccable.cmd context` e, no fim, `impeccable.cmd detect --json`.

## Cartões presos com zoom (scroll-pin) também no celular — observação · 2026-11-17
- Pedido do cliente: o efeito do PC (cada capítulo é um cartão do tamanho da tela, preso no alto com sticky, que
  entra em scale .74 com cantos arredondados e cresce até 100%) igual no celular.
- Como coube: no celular o cartão vira coluna (foto 40% em cima, texto embaixo), as fotos extras somem, a fonte do
  título cai para ~9vw, a lista "como funciona" fica com linhas de 6-8px. Celular baixo (640-720px): o parágrafo
  some e a foto cai para 36%. Abaixo de 640px de altura volta ao modo empilhado (não cabe).
- No celular o zoom começa em .84 (em .74 sobra fundo demais na tela estreita). Deixar ~90px embaixo do texto
  quando houver barra fixa no pé, senão o botão de orçamento encosta nela.
- No JS, a mesma media query do CSS no gsap.matchMedia: '(min-width: 901px), (max-width: 900px) and (min-height: 640px)'.
- Teste: com o painel do navegador escondido as animações ficam lentas (rAF reduzido) e o print sai no meio da
  entrada; medir com getBoundingClientRect e `gsap.globalTimeline.timeScale(20)` em vez de confiar no print.

## Painéis que abrem em rolagem horizontal (processo/etapas) — observação · 2026-11-17
- Pedido do cliente depois de reprovar a lista tipográfica: "painéis que abrem, mas em rolagem horizontal", fácil no
  celular.
- Base (celular, modo leve, sem JS): trilho com `overflow-x: auto` + `scroll-snap-type: x mandatory`, painéis de 80vw;
  IntersectionObserver com `root: trilho, threshold: .6` põe `.open` no painel parado (foto sai do P&B escuro para a
  cor e assenta do zoom; o texto sobe). Toque num painel fechado: `trilho.scrollTo(left)`.
- Computador: classe `html.pr-pinned` ligada pelo JS; seção presa (pin, pinType transform), o conjunto
  título + painéis + fim anda em x; painel fechado 148px com o nome em pé (writing-mode: vertical-rl + rotate 180),
  aberto ~46vw (transição de width 1s). A etapa aberta vem do progresso (`floor(progress * n)`), não da posição
  medida (medir com larguras mudando dá vai-e-volta).
- Como o CSS base já é o modo arrastável, modo leve e sem JS funcionam sem regra extra.

## GSAP 3.15: `ScrollTrigger.matchMedia` não roda mais — confirmado (medido) · 2026-11-17
- Existe como função, mas o callback nunca é chamado (nenhum erro no console). Usar `gsap.matchMedia().add(query, fn)`,
  que devolve a limpeza do mesmo jeito.

## Variável usada dentro de start() precisa existir antes da abertura — confirmado · 2026-11-17
- Quando a abertura é pulada (segunda visita, modo leve), `start()` roda na hora, antes do resto do arquivo. Um
  `var x = (function(){...})()` declarado depois ainda vale `undefined` ali. Montar esses objetos antes do código da
  abertura.

## Seção de confiança sem inventar prova — observação · 2026-11-17
- Cliente pediu "equipe treinada / certificações" e "clientes" sem mandar certificados nem logos. Feito só com o
  que é verdade e já está no site: foto real de treinamento, frase do FAQ ("em constante treinamento"), frentes de
  atuação, e nomes de eventos/órgãos já citados no portfólio, nas fitas e nas dúvidas ("Onde a WR já esteve", em
  texto, sem logo de terceiros). Certificado (NBR, registro) e logo de cliente só com o arquivo/dado vindo da empresa.

## Cinza de texto secundário reprovado no contraste — confirmado (medido) · 2026-11-17
- `#77706c` sobre papel `#f4f0ea` = 4,28:1 (abaixo de 4,5). `#68615c` = 5,36:1 no papel e 4,73:1 no `#e9e2d8`.
- O detector do impeccable acusou "#0f0d0d sobre #0f0d0d", mas na página renderizada nenhum texto estava assim
  (conferido elemento por elemento): alarme falso da leitura estática do CSS.

## Fotos em trilho horizontal (painéis, carrossel que anda em x) com loading="lazy" abrem pretas — confirmado · 2026-11-17
- O lazy do navegador só baixa quando a foto entra na tela; num trilho que anda com transform ela entra no último
  instante e o painel abre preto. Perto da seção (IntersectionObserver com rootMargin ~1200px), trocar
  `img.loading = 'eager'` em todas as fotos do trilho.

## Higgsfield no plano gratuito (para gerar foto de site) — confirmado · 2026-11-17
- `gpt_image_2_6` e `recraft_v4_1` recusam com "Requires basic plan or higher". `z_image` funciona no gratuito
  (1536x2048 em 3:4, foto realista boa), mas aceita UM pedido por vez (em lote dá 429 rate_limit_reached):
  mandar um, esperar terminar, mandar o próximo.
- Conferir cada imagem: a IA inventa texto embaralhado em papéis/camisetas; cortar (ffmpeg crop) antes de usar.
  No alt, marcar "(imagem ilustrativa)" quando a cena não é da empresa de verdade.
- 2026-11-18 (WR, pedido do dono): fotos SEM rosto. O z_image ignora "no face": funciona pedir pessoa DE COSTAS
  ("seen from behind, back of the head only"), vista de cima só com as mãos (flat lay) ou cortar do pescoço para baixo
  depois. Público ao fundo saiu nítido: desfocar com Pillow (GaussianBlur 26 + máscara que deixa nítidos só a equipe;
  rádios e objetos perto de rostos com máscara JUSTA, senão sobra rosto nítido do lado). Texto em camisa saiu certo
  ("BRIGADISTA", "WR EVENTOS / PARTICIPAÇÕES E NEGÓCIOS"). 0,15 crédito por foto. · confirmado

## Linhas de números como bússola (motivo da cidade litorânea) — observação · 2026-11-17
- Linha de cima = escala de bússola: dois gradients no ::after (marca grande a cada 96px, pequena a cada 12px) com o
  mesmo scaleX que desenha a linha; divisórias verticais com marcas por um gradient repeat-y. Rosa dos ventos SVG
  (ponta norte vermelha, círculo da cor do fundo para "cortar" a linha) em cada cruzamento; o <li> precisa de
  overflow: visible senão a rosa corta ao meio. Números viram rumos (N 000°, L 090°...). Bússola grande com agulha
  em scrub (rotate 205° → 0) e coordenadas da cidade. Em SVG, girar com `transform-box: view-box` + origin 50% 50%.

## "Deixar mais profissional" = refinar o MESMO modelo, nunca trocar — REPROVADO trocar · 2026-11-18
- Pedido do cliente: "ficou bom essa parte, mas dá pra deixar MUITO mais profissional, estilo Awwwards, me surpreenda".
  Foi feita uma seção nova (fundo escuro, palco preso, mostrador gigante girando): REPROVADA ("devia ficar do mesmo
  modelo, só mais bonito com efeitos diferenciados"). Regra: quando o cliente diz que a parte ficou boa, manter layout,
  cores, textos e ideia; acrescentar acabamento e efeitos por cima. Na dúvida, perguntar antes de trocar o modelo.
- O que foi aprovado para teste na seção de números como bússola (visto em: WR): aro da bússola se desenhando
  (`pathLength="1"` + `stroke-dashoffset`), escala girando ao contrário, agulha com `elastic.out` procurando o norte;
  coordenadas contando até o valor; depois dos números, a agulha visita N/L/S/O e cada coluna acende na sua vez (classe
  `.is-on`: faixa, número itálico vermelho, rosa girando até o rumo via `--b` por coluna, marca triangular correndo na
  escala); no PC o hover faz o mesmo e interrompe a volta automática. Modo leve: estado final parado.
- Armadilha GSAP: `timeline.call()` no tempo 0 de uma linha do tempo pausada não dispara com `play(0)`, e
  `delay()` numa linha já criada pausada não a fez andar; usar `gsap.delayedCall(n, () => tl.play())` e chamadas em
  0.05 em vez de 0. Agulha SVG: `svgOrigin: '0 0'` em todo tween (viewBox centrado em 0,0). · confirmado (medido)
- Cliente achou que os efeitos sozinhos "não mudaram nada no visual": o que ele vê é o DESENHO. Pedido seguinte foi
  "bússola mais realista e bonita". Feito em SVG puro (sem imagem): aro de latão com dois degradês lineares (claro/escuro
  invertidos = chanfro), mostrador creme em degradê radial escurecendo na borda, marcas de grau a cada 5° (maiores a
  cada 30°), rosa de 16 pontas com duas facetas por ponta (clara/escura), agulha com facetas e `feDropShadow`, pino de
  latão radial, vidro (degradê radial branco no canto + arco de reflexo) e `box-shadow` redondo no div (sem filtro no
  SVG inteiro). Rosa sem vermelho quando há agulha vermelha (os dois vermelhos competiam). Tamanho 96–136px.
- Bug: `transform-box: view-box; transform-origin: 50% 50%` no CSS da agulha + `filter` no mesmo `<g>` = agulha girando
  fora do eixo. Tirar o transform-origin do CSS e usar só `svgOrigin` no GSAP. · confirmado (medido)

## Trilho horizontal preso à rolagem "bugado" — confirmado (medido) · 2026-11-17
Quatro causas no mesmo efeito (seção de etapas da WR):
1. Painel que muda de LARGURA (148px → 720px) enquanto o trilho anda em x: tudo à direita dá tranco a cada troca e
   o comprimento do trilho muda no meio. Painéis com largura fixa; "abrir" = cor/zoom/texto, sem mexer no layout.
2. `pinType: 'transform'` com rolagem suave (Lenis) treme. Usar o pin normal (fixed) + `anticipatePin: 1`.
3. Escolher o painel ativo no `onUpdate` do ScrollTrigger com scrub: ele dispara antes do x alcançar a rolagem e
   pega o painel anterior (o último nunca acendia). Escolher no `onUpdate` do próprio tween.
4. Variável de margem com % (`--gut: max(24px, calc((100% - 1320px)/2))`) dentro de um trilho `width: max-content`:
   o % não tem base, a largura calculada dá 0 e a conta do trilho sobra (o último cartão passava da tela no fim).
   Dentro do trilho, margem em vw (`--vg: max(24px, calc((100vw - 1320px)/2))`) e `flex: none` nos filhos.

## Testar efeito de rolagem com o painel do navegador escondido — confirmado · 2026-11-17
- Painel escondido = requestAnimationFrame parado: GSAP/ScrollTrigger não atualizam, transições CSS e
  IntersectionObserver não rodam, o print sai velho. Dá para medir assim mesmo: `window.scrollTo(...)`,
  `ScrollTrigger.update()` e um laço chamando `gsap.ticker.tick()` a cada 16ms; depois ler getBoundingClientRect
  e `gsap.getProperty(el, 'x')`. Nunca esperar com requestAnimationFrame no console (trava 45s).

## Vídeo como WebP animado que só toca numa etapa — 2026-11-18 · confirmado (medido)
- WebP animado não pausa nem volta ao início. Para tocar só quando um painel/etapa está aberto: `<img>` com a capa
  (1º quadro, ~100 KB) e `data-anim`; ao abrir, pré-carregar com `new Image()` e trocar o `src` (recomeça do 1º
  quadro); ao sair, voltar o `src` para a capa. Versão menor para celular (`data-anim-m`).
- Tamanho medido (8 s, 720x1280): 720px/20fps ≈ 8,4 MB (pesado demais); 540px/15fps q60 ≈ 3,9 MB (PC);
  360px/15fps q55 ≈ 2,1 MB (celular). ffmpeg: `-vf fps=15,scale=540:-2:flags=lanczos -c:v libwebp -q:v 60 -compression_level 6 -loop 0 -an`.
- Em seção presa (pin) com rolagem suave (Lenis), conferir "seção na tela" no evento scroll com getBoundingClientRect;
  o IntersectionObserver na seção não ligou o vídeo nesse caso.

## Abertura animada que esconde a foto principal derruba a nota do PageSpeed — 2026-11-18 · confirmado (medido)
- Portfólio: logo 900px mostrada a 179px (baixada 2x: <img> e máscara CSS em modos diferentes), foto da hero sem
  srcset e script síncrono no <head>. Corrigido (logo 540px + crossorigin="anonymous" nas <img> para dividir o
  download com a máscara; srcset 800w/1024w com preload imagesrcset; script embutido com hash no CSP). O download
  da foto caiu para 40 ms, mas a nota ficou em 77–81: o LCP (4,5–5,6 s) é a foto aparecendo DEPOIS da abertura da
  marca (opacidade 0 até a animação). Conta do celular do Lighthouse: 412px × DPR 1,75 = 721px (versão de 720 não
  serve; usar 800). Para nota 90+ a foto principal precisa estar visível já na primeira pintura.
