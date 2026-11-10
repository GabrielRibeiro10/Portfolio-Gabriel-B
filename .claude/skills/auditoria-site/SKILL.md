---
name: auditoria-site
description: Auditoria completa do site antes de entregar ou publicar - desempenho em aparelhos bons, médios e fracos (celular, tablet, PC, monitor), varredura de bugs e erros, teste como cliente (tocar, clicar, rolar, girar a tela) e responsividade em todos os tamanhos, corrigindo o que achar. Use quando pedirem para revisar o site, tirar bugs, travadas ou lag, deixar mais rápido/fluido, testar em celular fraco ou PC fraco, conferir responsividade, checar o site contra as leis (LGPD, CDC, acessibilidade, direitos autorais), ou "deixar pronto para o cliente".
---

# Auditoria do site (desempenho, bugs, cliente, responsividade)

Objetivo: o site abre e roda liso em **qualquer aparelho** (celular, tablet, PC, monitor; bom, médio e fraco), sem erro,
sem travada, sem nada quebrado na tela, e tudo funciona do jeito que um cliente usaria. Encontrar, **corrigir** e provar
com números e imagens. Não basta listar problemas: corrija, meça de novo e só então dê por resolvido.

## Como o site trata aparelhos fracos (ler antes de mexer)

- `js/desempenho.js` liga o **modo leve** (`<html class="leve">`, motivo em `data-leve`) antes da primeira pintura,
  igual para celular e PC: placa de vídeo fraca ou sem aceleração (`gpu`), processador lento (`cpu`), pouca memória ou
  poucos núcleos (`aparelho`), economia de dados (`dados`) e, durante o uso, mediana abaixo de ~25 fps por 4 s (`fps`,
  dispara o evento `gr:leve`). `?leve=0` força o normal, `?leve=1` força o leve.
- No modo leve tudo que pesa desliga (fundos animados, onda do FAQ, crachá 3D vira desenhado, vídeos, parallax,
  desfoques, Lenis). **Todo efeito novo precisa** checar `leve()` ao começar **e** parar no evento `gr:leve` (o modo pode
  ligar no meio do uso) e respeitar `prefers-reduced-motion`.
- **Limite do teste (importante):** o navegador de teste não tem placa de vídeo. Os tempos medidos refletem o
  processador, mas **não** o custo dos efeitos que rodam na placa de vídeo (vidro fosco `backdrop-filter`, desfoque
  `filter: blur`, máscaras, `mix-blend-mode`). Num celular fraco de verdade são esses que travam a rolagem. Por isso o
  passo 2b (`pesados.js`) é obrigatório: **uma seção só está "ok" se passar no tempo E não tiver efeito de GPU de risco
  ligado no modo leve.** Já aconteceu: a faixa "Seu negócio tem uma história" passou no tempo (21-26 ms) e travava em
  celular fraco por causa de 13 etiquetas com `backdrop-filter`.
- Com detecção automática o navegador de teste cai no modo leve (`gpu`) - isso simula o aparelho fraco de verdade. Para medir o modo normal use `--modo=normal`. Custo de WebGL (`GLES2::ReadPixels`) é
  exagerado aqui; para avaliar o resto, esconda o canvas com `--css=".cracha-canvas{display:none!important}"`.

## Passo a passo

Rode a partir da raiz do repositório. Suba um servidor local se não houver um:

```bash
curl -s -o /dev/null localhost:8123 || (nohup python3 -m http.server 8123 >/dev/null 2>&1 &)
```

Scripts em `.claude/skills/auditoria-site/scripts/` (Playwright, já instalado no ambiente). Todos aceitam
`--base=` (padrão `http://localhost:8123`). Aparelhos: `celular-bom`, `celular-medio`, `celular-fraco`,
`celular-deitado`, `tablet-bom`, `tablet-fraco`, `pc-bom`, `pc-medio`, `pc-fraco`, `monitor-grande`
(fraco = processador 6x mais lento, médio = 3x). Comandos longos: rode em segundo plano ou com timeout alto.

1. **Erros e rede** (todas as páginas `*.html`):
   `node .claude/skills/auditoria-site/scripts/erros.js`
   Tem que sair "sem erros, falhas ou rolagem lateral". Vídeo em `ERR_ABORTED` é download em pedaços (já ignorado).

2. **Desempenho por seção** em todos os aparelhos, detecção automática:
   `node .claude/skills/auditoria-site/scripts/desempenho.js`
   e o modo normal em aparelhos médios (os que rodam todos os efeitos):
   `node .claude/skills/auditoria-site/scripts/desempenho.js --modo=normal --aparelhos=celular-medio,pc-medio --css=".cracha-canvas{display:none!important}"`
   Metas: quadro médio ≤ ~22 ms nos bons/médios e ≤ ~35 ms nos fracos; nada marcado `!!`; travadas longas
   (soma) poucas e nenhuma > 150 ms fora do carregamento; CLS < 0,05.

2b. **Efeitos de placa de vídeo** (o que o passo 2 não consegue medir), no celular e no PC:
   `node .claude/skills/auditoria-site/scripts/pesados.js` e `node .claude/skills/auditoria-site/scripts/pesados.js --largura=1366`
   Meta: **nenhuma linha `!! LEVE: liga` com risco ALTO** (vidro fosco em algo que rola com a página: troque por fundo
   semitransparente, para todo mundo, o visual fica igual). Risco médio ligado no modo leve em área grande que se mexe
   (anima, tem parallax, muda com a rolagem): desligue em `html.leve ...`. Efeito parado só custa na primeira pintura.
   Olhe com atenção redobrada as seções que o usuário reclamar, mesmo que os números estejam bons.

3. **Achar a causa** de cada seção marcada `!!` ou `~`:
   `node .claude/skills/auditoria-site/scripts/causas.js --secao=#id-da-secao --aparelho=celular-fraco`
   Confirme a causa desligando a suspeita (`desempenho.js --css="..."`) antes de mexer no código.

4. **Teste como cliente** (tocar/clicar em tudo, links internos, rolar gravando, girar a tela, voltar/avançar):
   `node .claude/skills/auditoria-site/scripts/cliente.js --fotos=<scratchpad>/cliente`
   `node .claude/skills/auditoria-site/scripts/montagem.js <scratchpad>/cliente`
   **Olhe as pranchas** (Read nas imagens): animação pela metade, elemento sumido, sobreposto, piscando, crachá solto do
   título, texto por cima de texto, faixa de cor errada, emenda entre seções. Repita com `--aparelhos=celular-fraco,pc-fraco`.

5. **Responsividade** (15 tamanhos de 320 a 2560 px, celular deitado incluso, todas as páginas):
   `node .claude/skills/auditoria-site/scripts/responsivo.js --fotos=<scratchpad>/resp`
   Tem que sair "responsividade ok". Olhe também algumas fotos (320, 390, 768, 1366, 2560) para problemas que regra
   nenhuma pega (espaço estranho, elemento desalinhado, imagem esticada).

5b. **Todos os iPhones e iPads (Safari) — obrigatório antes de entregar.** O Chrome do teste NÃO mostra os
   defeitos do Safari, e no iPhone todo navegador (Chrome, Instagram, WhatsApp) usa o Safari por baixo.
   `iphone.js` abre o site no motor do Safari em **todos os iPhones que o Playwright conhece** (iPhone 6 ao 17:
   SE, Mini, Plus, Pro, Pro Max, Air), em pé e deitado, e nos iPads, e confere **sozinho**, medindo as cores na foto
   da tela: erros, rolagem lateral, notebook mostrando o site (e não o retângulo cinza) e crachá com a foto.
   `PLAYWRIGHT_BROWSERS_PATH=<scratchpad>/pw-webkit node .claude/skills/auditoria-site/scripts/iphone.js --deitado --fotos=<scratchpad>/iphone`
   `PLAYWRIGHT_BROWSERS_PATH=<scratchpad>/pw-webkit node .claude/skills/auditoria-site/scripts/iphone.js --grupo=ipads --fotos=<scratchpad>/iphone`
   Um modelo só: `--aparelhos="iPhone 13 Pro Max"`. Tem que terminar com "ok em todos". Olhe também algumas fotos
   (`montagem.js`). Efeito novo em 3D, canvas ou vídeo: acrescente a checagem dele no `iphone.js`.
   Na primeira vez da sessão instale o WebKit (fora do repositório) e as bibliotecas que ele pedir:
   `PLAYWRIGHT_BROWSERS_PATH=<scratchpad>/pw-webkit node $(node -e "console.log(require.resolve('playwright').replace(/index.js$/,''))")cli.js install webkit`
   `apt-get install -y libgtk-4-1 libgraphene-1.0-0 libevent-2.1-7 libgstreamer-gl1.0-0 libgstreamer-plugins-bad1.0-0 libavif16 libwayland-server0 libmanette-0.2-0 libenchant-2-2 libsecret-1-0 libgles2`
   Limite: o simulador usa o motor do Safari mas não o limite de memória de canvas nem a placa de vídeo do iPhone;
   peça ao dono para abrir num iPhone de verdade antes de entregar.

5c. **Como no ar: regras de segurança da Vercel + página 404 — obrigatório antes de publicar.** O `vercel.json`
   manda ao navegador regras de segurança (a principal é a CSP, uma "lista de convidados": só carrega script,
   estilo, fonte e imagem do próprio site e do Google Fonts). No teste local elas não existem: o que elas bloqueiam
   funciona aqui e quebra no ar, sem aviso.
   `PLAYWRIGHT_BROWSERS_PATH=<scratchpad>/pw-webkit node .claude/skills/auditoria-site/scripts/producao.js --fotos=<scratchpad>/producao`
   Abre cada página no PC, no celular e no iPhone **com as regras do ar** e acusa bloqueios; confere se todo
   `<script>` colado na página tem o hash liberado no `vercel.json` e se não há `<style>` na página; e testa a 404
   num link quebrado na raiz e dentro de pasta (estilo carregando, `noindex`, botão para o início).
   Tem que terminar com "ok". Ao mudar um script colado na página, recalcule o hash e atualize o `vercel.json`.
   Fonte, imagem ou script de outro endereço: libere o endereço no `vercel.json` (o mínimo possível) antes de usar.

5d. **Auditoria jurídica** (depois das etapas técnicas), com a skill `juridico` (`.claude/skills/juridico/`):
   1. Leia `.claude/skills/juridico/CHECKLIST.md` inteiro (é curto).
   2. Responda a tabela "Primeiro: classifique o site" e aplique só os blocos que valem para ele.
   3. Cheque cada item no código e no site publicado.
   4. Só se um item ficar em dúvida, abra o artigo citado em `.claude/skills/juridico/leis/` (busque por `**Art. N`).
      Nunca leia uma lei inteira.
   5. Escreva o relatório no formato da seção 2 do checklist, separando ALTA e MÉDIA.
   6. Deixe claro no relatório que é uma checagem técnica de conformidade, não parecer jurídico.
   Para atualizar as leis: `.claude/skills/juridico/ATUALIZAR.md`.

6. **Corrigir, medir de novo, comparar** (antes/depois com números), rodar de novo 1, 4 e 5 para garantir que nada
   quebrou, e só então fazer commit e publicar (siga as regras de git da sessão).

## Causas que já apareceram neste site (e a correção)

| Sintoma no `causas.js` | Causa | Correção |
|---|---|---|
| `UpdateLayoutTree` alto e um elemento com centenas de filhos mudando `style` a cada quadro | variável CSS (`--x`) mudada no pai de uma seção inteira (herda para todos os filhos) | aplicar o valor direto no elemento que se move (`translate`/`transform`), ou `@property` com `inherits: false` |
| `Layout` alto, elemento mudando `style` a cada quadro | animar `top/left/width/height` | `transform: translate...` + `will-change: transform` |
| `Paint` alto com algo parado na tela | `box-shadow`/`filter`/degradê animado em loop infinito | deixar fixo, ou animar `opacity` de uma camada com a sombra |
| elemento animando em seção que já saiu da tela | loop de `requestAnimationFrame` ou ouvinte de `scroll` global sem limite | `IntersectionObserver`: só anima/escuta perto da tela; parar o loop quando assenta |
| função JS rodando a cada quadro sem nada mudar | `getBoundingClientRect`/medições em loop "por garantia" | rodar só enquanto algo de fato se move; guardar medidas e refazer só no `resize` |
| travada de 0,5-1,5 s ao chegar numa seção | biblioteca pesada (three.js) montando no meio da rolagem | montar quando o navegador estiver parado depois do carregamento (`requestIdleCallback`) |
| toque não faz nada no celular | bloco grande e invisível por cima (z-index/contexto de empilhamento) | `pointer-events: none` no bloco e `auto` nos filhos; conferir com `cliente.js` |
| tempo bom no teste, mas a seção trava num celular fraco de verdade | vidro fosco (`backdrop-filter`) em etiquetas/cartões que rolam com a página; a placa refaz o desfoque a cada quadro | fundo semitransparente (`rgba(255,255,255,.13)`) no lugar do vidro; achar com `pesados.js` |
| CLS alto (página "pula") só em aparelho fraco | um script muda o layout de uma seção depois de carregar (ex.: liga um carrossel/galeria e a altura muda); no fraco o script roda ~2 s depois e empurra o resto | ligar o modo no `<head>` (classe no `<html>` antes da primeira pintura) e dar ao bloco altura natural pelo CSS, sem medir no JS |
| **iPhone: vídeo/captura do projeto não aparece** (retângulo cinza no notebook), no Chrome tudo certo | Safari ignora `backface-visibility: hidden` dentro de `transform-style: preserve-3d` e desenha a face de trás (tampa por fora) por cima da tela aberta | esconder a face de trás com `visibility: hidden` quando o objeto está aberto/virado (não confiar em backface-visibility); conferir com `iphone.js` |
| **iPhone: foto some do crachá 3D** (cartão branco) | Safari tem limite de memória de canvas e devolve canvas em branco sem erro; `getImageData` em canvas grande falha | não ler pixels em canvas (`getImageData`): usar a imagem já pronta (ex.: foto já em P&B em arquivo); `setPixelRatio` até 1 no iOS; se a foto não carregar, cair na versão sem 3D |
| funciona no teste e quebra no ar (efeito some, fonte não carrega, script não roda) | a CSP do `vercel.json` bloqueia: `<script>` colado na página sem hash, `<style>` na página, arquivo de outro endereço | mover para arquivo `.js`/`.css` do site, ou liberar o hash/endereço no `vercel.json`; conferir com `producao.js` |
| link quebrado mostra página sem estilo | 404.html com caminho relativo (`css/...`): dentro de pasta ele procura `/pasta/css/...` | caminhos absolutos (`/css/...`, `/img/...`) na 404 |
| alvo de toque < 24 px | link de texto pequeno | área invisível com `::after { position:absolute; inset:-12px -6px }` (o elemento precisa ter `position`; não sobrescreva `position: absolute` existente) |

## Regras

- Não mude o visual sem necessidade: a correção de desempenho deve ficar igual na tela (compare fotos antes/depois).
- Nunca resolva desligando a animação para todo mundo; desligue só no modo leve / `prefers-reduced-motion`, ou
  troque por uma técnica barata com o mesmo resultado.
- Toda correção tem que ser **medida de novo** com o mesmo aparelho e mostrada em números.
- Não declare o site pronto sem o passo 5b (iPhone/Safari): ele já escondeu o vídeo dos projetos e a foto do crachá
  num iPhone 13 Pro Max enquanto o Chrome mostrava tudo certo.
- Não declare "sem lag" só pelos tempos: rode `pesados.js` e diga no relatório o que depende de placa de vídeo.
- Efeito novo criado no site: antes de publicar, rode `pesados.js` e, se usar vidro fosco, desfoque, máscara ou
  mistura de cores, decida na hora como ele fica no modo leve.
- Relatório final em linguagem simples para o dono do site: o que estava errado (sintoma que a pessoa sentiria),
  o que foi feito, números antes/depois, o que foi conferido (aparelhos, tamanhos, testes) e o que ainda depende de
  testar num aparelho de verdade (WebGL, vídeos, iOS Safari).
