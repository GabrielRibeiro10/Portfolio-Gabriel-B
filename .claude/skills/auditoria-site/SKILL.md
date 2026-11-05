---
name: auditoria-site
description: Auditoria completa do site antes de entregar ou publicar - desempenho em aparelhos bons, médios e fracos (celular, tablet, PC, monitor), varredura de bugs e erros, teste como cliente (tocar, clicar, rolar, girar a tela) e responsividade em todos os tamanhos, corrigindo o que achar. Use quando pedirem para revisar o site, tirar bugs, travadas ou lag, deixar mais rápido/fluido, testar em celular fraco ou PC fraco, conferir responsividade, ou "deixar pronto para o cliente".
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
- O navegador de teste não tem placa de vídeo: com detecção automática ele cai no modo leve (`gpu`) - isso simula o
  aparelho fraco de verdade. Para medir o modo normal use `--modo=normal`. Custo de WebGL (`GLES2::ReadPixels`) é
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
| alvo de toque < 24 px | link de texto pequeno | área invisível com `::after { position:absolute; inset:-12px -6px }` (o elemento precisa ter `position`; não sobrescreva `position: absolute` existente) |

## Regras

- Não mude o visual sem necessidade: a correção de desempenho deve ficar igual na tela (compare fotos antes/depois).
- Nunca resolva desligando a animação para todo mundo; desligue só no modo leve / `prefers-reduced-motion`, ou
  troque por uma técnica barata com o mesmo resultado.
- Toda correção tem que ser **medida de novo** com o mesmo aparelho e mostrada em números.
- Relatório final em linguagem simples para o dono do site: o que estava errado (sintoma que a pessoa sentiria),
  o que foi feito, números antes/depois, o que foi conferido (aparelhos, tamanhos, testes) e o que ainda depende de
  testar num aparelho de verdade (WebGL, vídeos, iOS Safari).
