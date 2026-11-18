# Armadilhas do ambiente de teste

O teste roda num servidor sem placa de vídeo, com Chrome e WebKit do Playwright. Algumas coisas que ele mostra não
são do site; outras ele não consegue mostrar. Antes de corrigir ou descartar um aviso, confira aqui.

## Instalar o WebKit (Safari) na 1ª vez da sessão — 2026-11-10
- **Status:** confirmado
- **Sintoma:** sem as dependências, **toda página trava** no WebKit (`Page crashed`), até o portfólio; uma página
  simples (`data:text/html,...`) abre. Parece defeito do site e não é.
- **Correção:** os três comandos, nesta ordem (fora do repositório):
  ```bash
  PLAYWRIGHT_BROWSERS_PATH=<scratchpad>/pw-webkit node $(node -e "console.log(require.resolve('playwright').replace(/index.js$/,''))")cli.js install webkit
  apt-get update
  PLAYWRIGHT_BROWSERS_PATH=<scratchpad>/pw-webkit node $(node -e "console.log(require.resolve('playwright').replace(/index.js$/,''))")cli.js install-deps webkit
  ```
  O `install-deps` traz os plugins de mídia (GStreamer) que a lista manual de `apt-get` não tinha.

## Sem placa de vídeo: o site cai no modo leve sozinho — 2026-11-10
- **Status:** confirmado
- **Sintoma:** com detecção automática o site fica no modo leve (motivo "gpu"/"sem placa de vídeo"); pedindo o modo
  normal, alguns sites entram no leve **depois** de abrir, pelo medidor de fluidez (motivo "fps").
- **O que fazer:** os scripts forçam o modo fingindo o aparelho (`fingirAparelho` no `comum.js`). Sempre confira o
  modo na linha `==` do `desempenho.js` antes de comparar números. O `descobrir.js` avisa quando isso acontece.

## WebGL sai exagerado no teste — 2026-11-10
- **Status:** confirmado
- **Sintoma:** no modo normal, site com canvas WebGL dá `META NÃO` até no computador bom (visto: portfólio, crachá 3D,
  travadas somando 4,6 s; `GLES2::ReadPixels` no rastro).
- **O que fazer:** medir o resto escondendo o canvas (`--css="canvas.x{display:none!important}"`). O custo real do
  3D só num aparelho.

## Windows: usar o Chrome instalado, não o "headless shell" do Playwright — 2026-11-13
- **Status:** confirmado (medido)
- **Sintoma:** no Windows, layouts de 0,5–2 s até em página simples (acessibilidade.html: 1 s para 420 objetos);
  todos os aparelhos, até o PC bom, parecem travar no carregamento. Visita de aquecimento não resolve.
- **Causa:** o `chromium_headless_shell` do Playwright monta texto/fontes muito devagar nesse ambiente.
- **Correção (já automática no `comum.js`: no Windows os scripts usam o Chrome instalado; `AUD_NAVEGADOR=playwright`
  volta ao do Playwright):** `chromium.launch({ channel: 'chrome' })` (Chrome instalado): o mesmo layout cai para 2–19 ms. Com o
  Chrome real há placa de vídeo, então a detecção automática dá "normal"; force `--modo=leve` para medir o leve.
- **Playwright ausente:** instale numa pasta de rascunho a versão que bate com o Chromium em cache
  (`ms-playwright/chromium-1148` = playwright@1.49.1) e use `NODE_PATH=<pasta>/node_modules`.
- **Abertura da página:** o `desempenho.js` só mede depois da abertura. Para a hero, marque eventos
  (DOMContentLoaded, "marca aparece", fim da entrada) junto das travadas longas: travada antes da tela aparecer não é
  travada da animação.

## Régua do teste: comparar com um site conhecido — 2026-11-10
- **Status:** confirmado
- **Quando:** números ruins demais em tudo. Rode o mesmo `desempenho.js` no portfólio (que passa): se ele também
  piorar, é o servidor de teste (processos em paralelo, máquina lenta), não o site.
- **Referência:** portfólio no computador fraco (modo leve) ≈ 5 travadas, soma ≈ 0,26 s.

## Alarmes falsos conhecidos — 2026-11-10
- **Status:** confirmado
- `producao.js` "script sem hash" em `<script type="application/ld+json">` (dados estruturados): não é executado, a
  CSP não se aplica. O script já ignora tipos que não são JavaScript.
- `responsivo.js` "texto cortado" em `.sr-only`/`.visually-hidden`: texto só para leitores de tela, escondido de
  propósito.
- `cliente.js` "#top parou a nullpx da seção": `href="#top"` sem elemento `id="top"` leva ao topo pela regra do HTML.
  Confira se volta a `scrollY = 0`.
- `cliente.js` "não clicável (Timeout)" em link dentro de card que entra animando: o toque tentou durante a animação.
  Confira com `document.elementFromPoint` no centro do link depois de parado.
- Antes de descartar qualquer aviso, **confirme no navegador** e só então anote aqui.

## Abertura longa: teste olha antes da página ficar pronta — 2026-11-12
- **Status:** confirmado
- **Sintoma:** no aparelho fraco o `cliente.js` acha só 1 alvo na 1ª tela e testa 0 links; o `responsivo.js` acusa
  "toque pequeno" num ícone (ex.: 15x15) que depois tem tamanho normal.
- **Causa:** a abertura (logo, letras, ícones nascendo em escala 0,3) ainda está rodando; num processador 6x mais lento
  ela termina ~6-10 s depois de carregar. Visto: portfólio (abertura com a marca + trava de rolagem até ela pousar).
- **O que fazer:** `cliente.js --espera=12000` nos aparelhos fracos (novo parâmetro). Para "toque pequeno", meça o
  elemento depois da abertura (`getBoundingClientRect` ~9 s depois) antes de corrigir.

## Rodando no Windows (fora do servidor Linux) — 2026-11-12
- **Status:** confirmado
- **Playwright:** não vem instalado. Instale numa pasta fora do repositório (`npm install playwright` no scratchpad,
  `npx playwright install chromium webkit`) e rode com `NODE_PATH=<pasta>\node_modules` e `PLAYWRIGHT_BROWSERS_PATH`
  apontando para os navegadores (no Windows, com Chrome e WebKit na mesma pasta, pode exportar para todos os scripts).
  Não precisa de `install-deps`.
- **Servidor:** `python -m http.server` caiu no meio do `iphone.js` ("Could not connect to server" em dezenas de
  aparelhos = alarme falso). Use `npx http-server . -p 8123 -a 127.0.0.1 -c-1` e passe `--base=http://127.0.0.1:8123`
  (`localhost` pode resolver para `::1` e não achar o servidor).
- **`producao.js` "script colado sem hash" (falso):** o git do Windows grava os arquivos com quebra de linha CRLF
  (`core.autocrlf=true`); o hash do script muda, mas o site no ar (publicado do repositório, LF) bate com o
  `vercel.json`. Confira o hash no HTML **publicado** antes de mexer. Pelo mesmo motivo, a 404 no iPhone acusou
  "stylesheet bloqueado" só no teste local; aberta no ar no WebKit, sem bloqueio.
- **Placa de vídeo:** o Chrome do Windows sem tela aceita `--enable-gpu --use-angle=d3d11`: dá para medir custo de
  placa de vídeo de verdade (o servidor Linux não consegue). Use para efeitos de brilho/máscara/blur.

## Medições
- Não rode duas medições de desempenho ao mesmo tempo (uma rouba processador da outra).
- `pesados.js`: leia a lista inteira; não corte com `head` (itens pequenos de risco ALTO ficam no fim).
- Para achar quem chama uma função cara (ex.: `getBoundingClientRect`), use o perfil de JS do Chrome (CDP
  `Profiler.start/stop`) e some o tempo por chamador (ver `causas.md`).
- O `producao.js` quebrava quando uma página fechava com requisição pendente (sequência de quadros); corrigido com
  `try/catch` no `route`.
- Servidores locais (`python3 -m http.server`) podem cair entre comandos longos: confira com `curl` antes de medir.
- `PLAYWRIGHT_BROWSERS_PATH` (pasta do WebKit) **só** nos comandos do `iphone.js` e do `producao.js`. Exportado para
  todos, os scripts que usam o Chrome não acham o navegador e quebram (`Executable doesn't exist`).

## Ferramentas para medir efeito por efeito — 2026-11-10
- **Status:** confirmado
- `desempenho.js --js="..."` roda um trecho no navegador depois de carregar: desliga um efeito de JS sem mexer no
  site (ex.: matar os ScrollTriggers, ver `efeitos.md`). `--css` continua para CSS. Esconder um canvas com `--css`
  **não** para o JavaScript que desenha nele.
- A API de camadas do Chrome (`LayerTree`) não responde no navegador sem tela do teste: para "camadas demais", use o
  `Layerize`/`Commit` do `causas.js`.
- Quadro médio entre 22 e ~26 ms **com zero travadas** em aparelho bom/médio: o navegador mede em quadros de 16,7 ou
  33,3 ms, então alguns quadros de 33 ms puxam a média para cima sem a pessoa sentir. Anote no relatório, mas a
  prioridade é o aparelho fraco e as travadas. — observação
- Mudou o CSS e o navegador de teste continua mostrando o visual velho (mesmo recarregando): o link usa marca de
  versão fixa (`style.css?v=6`) e o navegador guarda o arquivo. Suba a marca (`?v=7`) a cada mudança de CSS/JS; isso
  também é o que faz o celular do cliente pegar a versão nova. — confirmado (medido: fonte continuou 28px até subir a
  marca) · 2026-11-16
- Print com `chrome --headless --screenshot --virtual-time-budget` saiu com o **vídeo de fundo preto** depois que a
  página passou a usar `requestVideoFrameCallback`/`IntersectionObserver` no vídeo; no navegador de verdade o vídeo
  tocava (currentTime andando, readyState 4). Para conferir vídeo, use o navegador real (painel/Chrome), não o print
  com tempo virtual. — confirmado (medido) · 2026-11-16

## Escape de CSS (`content: "\2192"`) estraga quando passa pelo terminal — confirmado · 2026-11-16
- Escrever `\2192` via `sed`, `python -c` ou heredoc no Git Bash virou um byte de controle + "92" (a seta aparecia
  como "92" no botão). Para escapes com barra invertida, editar com a ferramenta de edição de arquivo ou com um
  script `.py` salvo em arquivo; depois conferir com `od -c` ou no navegador.

## PowerShell 5.1 `Set-Content -Encoding utf8` grava BOM no começo do arquivo — confirmado · 2026-11-17
- Trocar a marca `?v=` no index.html com `Get-Content | .Replace() | Set-Content -Encoding utf8` deixou o arquivo com
  BOM (`EF BB BF`) e git diff marcou a primeira linha. Fazer essas trocas com a ferramenta de edição ou `sed -i` no
  bash; se já gravou, tirar com `sed -i '1s/^\xEF\xBB\xBF//' arquivo`.

## Painel do navegador do app parado (requestAnimationFrame) — 2026-11-18 · confirmado
- No navegador embutido do app, com a janela de fora visível, o rAF caiu para ~0 quadros: rolagem suave e GSAP não
  andavam e parecia bug do site. Conferir com `gsap.ticker.frame` antes/depois; se não anda, testar animação/clique
  no Playwright sem janela (NODE_PATH para o playwright do rascunho), que roda normal.


## Rolagem suave (Lenis) ignora scrollTo/WheelEvent do console — 2026-11-18 · confirmado
- Com Lenis, `window.scrollTo`, `scrollIntoView` e `WheelEvent` disparado por script não movem a seção presa de
  forma confiável (o painel não troca e parece bug do site). Testar com a roda de verdade: ação `scroll` do navegador.

## API do PageSpeed sem chave esgota; WebKit no Windows não mede desempenho — 2026-11-18 · confirmado
- A API pública do PageSpeed (sem chave) dá "Quota exceeded" por dia: usar pagespeed.web.dev no navegador e ler o
  relatório por textContent (as tabelas ficam fechadas; innerText vem vazio).
- WebKit do Playwright no Windows (sem GPU) dá todos os quadros longos e FCP de 6 s até no localhost: serve para
  ver o que o Safari baixa (srcset, formato), não para medir travada ou tempo. Medir Safari de verdade num iPhone.
- Nota do PageSpeed varia (81 → 77 sem piorar nada): comparar pelas partes do LCP, não só pela nota.

## Detecção embutida no <head> e modo "auto" no Windows — 2026-11-18 · confirmado
- `descobrir.js` só reconhecia `<script src=".../desempenho.js|modo-leve.js">`; com a detecção copiada para dentro
  do HTML (para não bloquear a pintura) acusava "NÃO tem". Corrigido: reconhece `<script>` embutido com o código do
  modelo (grPerfil/gr-perfil-v/leve:liga/grLeve).
- No Windows o teste usa o Chrome real (placa de vídeo forte): no modo "auto", até o celular-fraco (CPU 6x) fica no
  modo normal. Para medir o que o aparelho fraco recebe, use `--modo=leve`; a detecção se confere com `?leve=info`
  num celular de verdade.

## Processador do PC a 100% invalida a comparação de tempos — 2026-11-18 · confirmado
- Duas medições seguidas deram quadros piores em TODAS as seções (até nas não mexidas: rodapé 22 → 55 ms); o
  Windows estava com a CPU a 100% por outros programas. Antes de comparar números, conferir a carga
  (`Get-CimInstance Win32_Processor | Measure LoadPercentage`). Sem PC livre, provar a correção pelo que não depende
  de velocidade: contagem de mudanças de estilo do `causas.js` e posição dos elementos antes/depois de rolar.
