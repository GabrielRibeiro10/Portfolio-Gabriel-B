# Safari / iPhone

O Chrome do teste não mostra estes defeitos. No iPhone todo navegador (Chrome, Instagram, WhatsApp) usa o Safari por
baixo. Conferir com `iphone.js` (motor do Safari, todos os iPhones e iPads) e, antes de entregar, num iPhone de verdade.

## Canvas ou vídeo aparece em branco, sem erro — 2026-11-10
- **Status:** confirmado (visto em sites anteriores); checagem genérica no `iphone.js`
- **Onde se aplica:** qualquer `<canvas>` (2D ou WebGL) e `<video>` grande.
- **Causa:** o Safari tem limite de memória de canvas e devolve canvas em branco sem erro; vídeo sem `muted` +
  `playsinline` não toca sozinho; modo economia de energia bloqueia autoplay.
- **Como conferir:** o `iphone.js` rola até cada canvas/vídeo grande e mede a foto (lisa demais = em branco).
- **Correção:** canvas no tamanho da tela (não maior), `devicePixelRatio` limitado a 1-2 no iOS, não ler pixels
  (`getImageData`) de canvas grande; vídeo com `muted`, `playsinline`, pôster, e tocar no primeiro toque se o autoplay
  for bloqueado.

## 3D em CSS mostra a face de trás por cima — 2026-11-10
- **Status:** confirmado (medido) — visto em: portfólio (notebook dos Projetos mostrava a tampa cinza no lugar da tela)
- **Onde se aplica:** `transform-style: preserve-3d` com `backface-visibility: hidden` (cartões que viram, tampas,
  cubos).
- **Causa:** o Safari ignora `backface-visibility: hidden` dentro de `preserve-3d` e desenha a face de trás.
- **Correção:** esconder a face de trás com `visibility: hidden` quando o objeto está virado/aberto (não confiar em
  `backface-visibility`). Checagem específica no `iphone.js` (bloco do notebook).

## Foto some de cartão 3D (WebGL) — 2026-11-10
- **Status:** confirmado (medido) — visto em: portfólio (crachá 3D com cartão branco no iPhone 13 Pro Max)
- **Causa:** limite de memória de canvas; `getImageData` em canvas grande falha em branco.
- **Correção:** usar a imagem já pronta (ex.: foto já em P&B em arquivo) em vez de processar pixels; `setPixelRatio`
  até 1 no iOS; se a foto não carregar, cair na versão sem 3D. Checagem específica no `iphone.js` (bloco do crachá).

## "glTexStorage2D: Texture is immutable" ao desmontar o 3D — 2026-11-12
- **Status:** confirmado (medido) — visto em: portfólio (crachá 3D, three.js, em quase todos os iPhones do teste)
- **Onde se aplica:** WebGL/three.js que é desmontado no meio do uso (modo leve ligando por lentidão, troca de seção,
  limpeza ao sair) com `renderer.dispose()`.
- **Sintoma:** o `iphone.js` acusa `WebGL: INVALID_OPERATION: glTexStorage2D: Texture is immutable` como erro; na tela
  nada quebra (o 3D já foi trocado pela versão parada). Só aparece quando o modo leve liga **depois** de montar o 3D
  (com `?leve=0` travado, não aparece).
- **Causa:** depois do `dispose()`, um quadro do laço já agendado (`requestAnimationFrame`) ou um reajuste de posição
  (resize, título terminando de entrar) ainda chama a função de desenho; o three.js reenvia as texturas e o Safari
  recusa alocar de novo uma textura imutável.
- **Como achar:** no WebKit, envolver `texStorage2D` (e `texImage2D`) com `getError()` + pilha (`addInitScript`); a
  pilha aponta para o `render` do three.js chamado pelo laço do site.
- **Correção:** uma marca `dead` ligada no desmonte; o laço (`frame`) e o desenho (`draw`) retornam na hora se ela
  estiver ligada. Declarar a marca **antes** da primeira chamada de desenho (senão dá erro de variável usada antes de
  existir).
- **Números:** iPhone 6 e 13 no teste: 2 → 0 avisos; crachá 3D no PC (modo normal) igual, sem erros.

## Imagem muito alta numa "tela" (captura de site rolando) pisca/monta aos pedaços no celular fraco — 2026-11-13
- **Status:** observação (relatada pelo dono num celular fraco; não reproduz no teste, que decodifica imagem rápido)
- **Onde:** captura de página inteira (ex.: 720×5000 px) dentro de um mockup de notebook/celular, com animação de
  rolagem e `will-change: transform`.
- **Causa provável:** a camada fica maior que o limite de textura das placas fracas (720×5000 em tela 2x ≈ 1440×10000)
  e é desenhada em faixas; e a imagem entra antes de terminar de decodificar.
- **Correção (portfólio):** esconder a imagem até `img.decode()` (com trava de 2,5 s), começar a baixar junto com o vídeo
  (não `loading="lazy"` em cima da hora), e tirar animação/`will-change` quando o vídeo cobre a imagem e no modo leve.
- **Como conferir:** classes `.is-ready` na imagem e `animation: none; will-change: auto` com o vídeo tocando. A
  confirmação mesmo é num celular fraco de verdade.
