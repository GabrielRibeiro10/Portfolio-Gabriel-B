# Índice da base de conhecimento

## Site novo (`novo-site.md`)
- lista de prevenção: tudo que já deu problema, virado regra de começo de projeto · 2026-11-13 · ler antes de criar qualquer site

Atualize a cada entrada nova (arquivo · título · data · status).

## Efeitos (`efeitos.md`)
- modo-leve · detecção oficial = modelos/modo-leve.js (obrigatório em todo site) · 2026-11-10 · confirmado
- scroll-scrub · animações presas à rolagem · 2026-11-10 · confirmado
- scroll-pin · seção presa enquanto rola · 2026-11-10 · observação
- rolagem-suave · Lenis/Locomotive (tirar não melhorou) · 2026-11-10 · confirmado
- webgl-3d · 3D/WebGL · 2026-11-10 · confirmado
- canvas · canvas 2D animado · 2026-11-10 · observação
- sequencia-quadros · quadros presos à rolagem: no modo leve ANDA, mais leve (1/4 dos quadros, 60%) · 2026-11-10 · confirmado
- video-fundo · vídeo de fundo/dentro do site: no modo leve TOCA, mais leve (720p, só na tela) · 2026-11-10 · confirmado
- iframe-externo · mapa/vídeo/widget de outro site (Google Maps roda JS o tempo todo) · 2026-11-10 · confirmado
- backdrop-filter · vidro fosco (pior caso no celular fraco; atrás de fundo opaco não aparece) · 2026-11-10 · confirmado
- filter-blur · desfoque · 2026-11-10 · observação
- mask · máscara (animada por JS: desenhar uma vez no modo leve) · 2026-11-10 · confirmado
- mix-blend · mistura de cores · 2026-11-10 · observação
- animacao-infinita · animações CSS em loop (brilho que redesenha → girar/deslizar) · 2026-11-12 · confirmado
- texto-letra-a-letra · texto quebrado em letras (maior peso do Maria Festinha) · 2026-11-10 · confirmado
- css-3d · 3D em CSS · 2026-11-10 · confirmado
- sticky · position: sticky · 2026-11-10 · observação
- muitas-camadas · will-change demais · 2026-11-10 · observação
- foto-com-pontos · foto de fundo com luzes/objeto presos a pontos dela; ponto fora da tela: segurar no canto; arte em pé no celular com <picture> · 2026-11-13 · confirmado
- fitas-cruzadas · fitas andando, desfoque sem filter, playbackRate negativo para no começo · 2026-11-13 · confirmado
- objeto-que-viaja · objeto que sai do topo e para numa seção de baixo · 2026-11-13 · confirmado

## Causas de travada (`causas.md`)
- tabela rápida (16 sintomas → causa → correção) · 2026-11-10 · confirmado
- leitura de posição depois de escrita (layout forçado) · 2026-11-10 · confirmado
- aparelho fraco lento em tudo: como achar o que pesa · 2026-11-10 · confirmado
- peça presa a elemento com parallax sai do lugar (translate contado 2x) · 2026-11-11 · confirmado
- peça que acompanha animação por tempo fixo fica para trás em aparelho lento · 2026-11-11 · confirmado
- brilho que redesenha em vez de mover (fio de luz girando, faixa de brilho) · 2026-11-12 · confirmado
- página demora a aparecer: Google Fonts + peso fora da tela no meio da abertura · 2026-11-13 · confirmado

## Safari / iPhone (`safari-iphone.md`)
- canvas ou vídeo em branco sem erro · 2026-11-10 · confirmado
- 3D em CSS mostra a face de trás · 2026-11-10 · confirmado
- foto some de cartão 3D (WebGL) · 2026-11-10 · confirmado
- imagem muito alta numa "tela" monta aos pedaços no celular fraco · 2026-11-13 · observação
- glTexStorage2D: Texture is immutable ao desmontar o 3D (draw depois do dispose) · 2026-11-12 · confirmado

## Ambiente de teste (`ambiente-de-teste.md`)
- instalar WebKit (install-deps) · 2026-11-10 · confirmado
- Windows: usar Chrome instalado (headless shell 50x mais lento no layout) · 2026-11-13 · confirmado
- sem placa de vídeo: site cai no modo leve sozinho · 2026-11-10 · confirmado
- WebGL exagerado no teste · 2026-11-10 · confirmado
- régua: comparar com site conhecido · 2026-11-10 · confirmado
- alarmes falsos conhecidos · 2026-11-10 · confirmado
- dicas de medição · 2026-11-10 · confirmado
- ferramentas para medir efeito por efeito (--js, camadas, quadro médio) · 2026-11-10 · confirmado
- abertura longa: teste olha antes da página ficar pronta (cliente.js --espera) · 2026-11-12 · confirmado
- rodando no Windows (Playwright, servidor, CRLF no hash, placa de vídeo) · 2026-11-12 · confirmado
- CSS velho no teste: subir a marca ?v= a cada mudança (ambiente-de-teste.md) · 2026-11-16 · confirmado
- vídeo em pé no fundo do PC: recortar deitado 16:9, nunca desfocado + nítido (cliente reprovou) (efeitos.md) · 2026-11-16 · confirmado
- print headless com vídeo sai preto: conferir vídeo no navegador real (ambiente-de-teste.md) · 2026-11-16 · confirmado
- visor de câmera sobre vídeo de fundo: REPROVADO pelo cliente, removido (efeitos.md) · 2026-11-16 · confirmado
- seta "\2192" do CSS virou "92": escapes com barra só por arquivo .py ou editor (ambiente-de-teste.md) · 2026-11-16 · confirmado
- barra sticky no pé sobra solta no fim da seção → fixed + IntersectionObserver na lista (efeitos.md) · 2026-11-17 · confirmado
- WhatsApp flutuante cobrindo setas/número de carrossel em tela cheia → esconder sobre a seção (efeitos.md) · 2026-11-17 · confirmado
- degradê das fotos que correm: 4% nas pontas; velocidade ~60 s PC / ~34 s celular (efeitos.md) · 2026-11-17 · observação
- PowerShell Set-Content utf8 grava BOM: editar com ferramenta ou sed (ambiente-de-teste.md) · 2026-11-17 · confirmado
- chips numerados e etiqueta em caixinha = "cara de IA" (reprovado) → índice editorial "(01)" e "N° 01" + itálico (efeitos.md) · 2026-11-17 · confirmado
- espaçamento entre seções: --sec e --head únicos; vão de ~190px PC / ~112px celular (efeitos.md) · 2026-11-17 · confirmado
- tracinhos curtos e travessão "—" = cara de IA (reprovado) (efeitos.md) · 2026-11-17 · confirmado
- seção de processo sem cartões: nomes gigantes vazados que enchem ao rolar (impeccable bolder) (efeitos.md) · 2026-11-17 · observação
- cartões presos com zoom no celular: coluna foto 40% + texto compacto; <640px de altura volta ao empilhado (efeitos.md) · 2026-11-17 · observação
- painéis que abrem em rolagem horizontal: base arrastável + html.pr-pinned no PC (efeitos.md) · 2026-11-17 · observação
- GSAP 3.15: ScrollTrigger.matchMedia não dispara; usar gsap.matchMedia (efeitos.md) · 2026-11-17 · confirmado
- objeto usado em start() montado antes da abertura (efeitos.md) · 2026-11-17 · confirmado
- seção de confiança só com prova real (foto de treinamento + nomes já públicos) (efeitos.md) · 2026-11-17 · observação
- cinza secundário #68615c (5,4:1); detector "preto sobre preto" foi alarme falso (efeitos.md) · 2026-11-17 · confirmado
- fotos em trilho horizontal com lazy abrem pretas: eager perto da seção (efeitos.md) · 2026-11-17 · confirmado
- Higgsfield gratuito: só z_image, um pedido por vez; cortar texto falso (efeitos.md) · 2026-11-17 · confirmado
- números como bússola: escala nas linhas, rosa dos ventos nos cruzamentos, agulha em scrub (efeitos.md) · 2026-11-17 · observação
- trilho horizontal preso bugado: 4 causas (largura que muda, pinType transform, onUpdate errado, % sem base) (efeitos.md) · 2026-11-17 · confirmado
- testar rolagem com painel escondido: gsap.ticker.tick() em laço (efeitos.md) · 2026-11-17 · confirmado
- "mais profissional" = refinar o mesmo modelo (trocar foi reprovado); bússola viva: aro desenha, agulha elástica, volta pelos rumos (efeitos.md) · 2026-11-18 · confirmado
- bússola realista em SVG (latão, mostrador, rosa com facetas, vidro); agulha fora do eixo com transform-origin CSS + filter (efeitos.md) · 2026-11-18 · confirmado
- índice "(01)" com linhas e contador "01 / 05 ·" reprovados → lista limpa com losango (efeitos.md) · 2026-11-18 · observação
- lista curta como "página que vira" (letras virando uma a uma, um item por vez) (efeitos.md) · 2026-11-18 · observação
- trilho de etapas: nomes clicáveis, profundidade nas fotos, bug offsetLeft somado 2x, dica errada no celular (efeitos.md) · 2026-11-18 · confirmado
- fotos sem rosto no Higgsfield: de costas / só mãos / cortar; desfocar público com máscara justa (efeitos.md) · 2026-11-18 · confirmado
- painel do app com rAF parado: testar animação no Playwright (ambiente-de-teste.md) · 2026-11-18 · confirmado
- WebP animado que só toca no painel aberto: capa + troca de src, tamanhos medidos (efeitos.md) · 2026-11-18 · confirmado
- Lenis ignora scrollTo/WheelEvent do console: testar com a roda de verdade (ambiente-de-teste.md) · 2026-11-18 · confirmado
- abertura que esconde o LCP trava o PageSpeed em ~80; logo 2x (img + máscara); DPR 1,75 → versão 800px (efeitos.md) · 2026-11-18 · confirmado
- API do PageSpeed esgota; WebKit no Windows não mede tempo; nota varia (ambiente-de-teste.md) · 2026-11-18 · confirmado
- SVG decorativo com máscaras trava ~1 s ao entrar; no leve vira foto WebP de 8 KB (causas.md) · 2026-11-18 · confirmado
- descobrir.js reconhece detecção embutida; modo auto no Windows fica normal (ambiente-de-teste.md) · 2026-11-18 · confirmado
- parallax de vários elementos pesa no fraco; parar no leve e matar se ligar no meio (causas.md) · 2026-11-18 · confirmado
- CPU do PC a 100% estraga a comparação; provar pela contagem de mudanças (ambiente-de-teste.md) · 2026-11-18 · confirmado
