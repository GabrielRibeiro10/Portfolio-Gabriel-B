// Alfinete do selo "Bônus" (item 06 de "O que eu entrego"). Quando o fio chega no item (js/main.js põe
// .is-on no li.bonus):
// 1. o selo é colocado: sobe de leve e chega meio torto, como se estivesse sendo segurado;
// 2. o alfinete 3D (img/alfinete-*.webp, renderizados em three.js) vem de perto da tela, maior por causa da
//    perspectiva, e desce acelerando; a sombra começa longe e borrada e vai chegando e ficando nítida
//    conforme ele se aproxima do selo (luz do alto à esquerda);
// 3. a agulha entra no selo; no impacto o selo é apertado contra a faixa e o alfinete dá um pequeno recuo;
// 4. o selo balança preso no alfinete até parar (mola com amortecimento) e depois reage de leve ao mouse
//    passando por cima, a um toque e aos trancos da rolagem, como uma etiqueta pendurada de verdade.
// Se a rolagem volta e o fio sai do item, tudo some; quando ele chega de novo, a cena se repete.
// Sem JS ou com "menos movimento" fica o estado final do css/style.css (preso e parado).
(() => {
  const li = document.querySelector('.about-areas ol.is-live > li.bonus');
  const badge = li && li.querySelector('.bonus-badge');
  // parado (estado final do css): sem fio vivo (modo leve ou "menos movimento", js/main.js) ou com "menos movimento"
  if (!badge || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('leve')) return;
  const tag = badge.querySelector('.bonus-tag');
  const pin = badge.querySelector('.bonus-pin');
  const head = pin.querySelector('.pin-head'), needle = pin.querySelector('.pin-needle'), shadow = pin.querySelector('.pin-shadow');
  const layers = [tag, head, needle, shadow];

  // camadas de 48×60 px: a agulha toca o selo em y=46,8 e aparece até ~8,4 px abaixo; o eixo do alfinete
  // projetado na tela vai do contato para a cabeça (para cima e um pouco para a direita)
  const BOX = 60, CY = 46.8, NEEDLE = 8.4, AX = 0.264, AY = -0.964;
  const TRAVEL = 70, DRIFT = 26;             // de onde ele vem (px): ao longo do eixo e de lado
  // linha do tempo (ms)
  const TAG_IN = 460, FALL_AT = 170, FALL = 520, HIT = FALL_AT + FALL;
  const HELD = -9, REST = -4, KNOCK = 30;    // ângulo segurado / preso (graus) e o tranco do impacto (graus/s)
  const W0 = 2 * Math.PI * 1.7, K = W0 * W0, C = 2 * 0.2 * W0;   // mola do balanço: ~1,7 Hz, pouco amortecida

  let t0 = 0, raf = 0, last = 0, state = 'hidden', fading = 0;   // hidden → playing → still
  let th = REST, om = 0;                     // ângulo do selo (graus) e velocidade (graus/s)
  const ready = Promise.all([head, needle, shadow].map((im) => (im.decode ? im.decode().catch(() => {}) : null)));

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const outCubic = (x) => 1 - Math.pow(1 - x, 3);
  const outBack = (x) => 1 + 2.6 * Math.pow(x - 1, 3) + 1.6 * Math.pow(x - 1, 2);

  const setTag = (y, rot, sc, op) => {
    tag.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(4)})`;
    tag.style.opacity = op.toFixed(3);
  };
  const setPin = (dx, dy, sc, rot, op) => {
    head.style.transform = needle.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
    head.style.opacity = needle.style.opacity = op.toFixed(3);
  };
  const setShadow = (dx, dy, sc, blur, op) => {
    shadow.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
    shadow.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
    shadow.style.opacity = op.toFixed(3);
  };
  const setNeedle = (out) => {   // out: 1 = agulha toda de fora, 0 = toda dentro do selo
    needle.style.visibility = out > 0 ? 'visible' : 'hidden';
    needle.style.clipPath = out < 1 ? `inset(0 0 ${(BOX - CY - NEEDLE * out).toFixed(2)}px 0)` : 'none';
  };
  const start = () => {          // tudo pronto lá no alto, invisível
    setTag(-12, -18, .92, 0);
    setPin(AX * TRAVEL + DRIFT, AY * TRAVEL, 2.15, 26, 0);
    setShadow(44, 58, 1.35, 9, 0);
    setNeedle(1);
  };

  const frame = () => {
    raf = 0;
    const now = performance.now(), t = now - t0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    // ---- selo ----
    let y = 0, sc = 1, op = 1;
    if (t < HIT) {
      const u = clamp(t / TAG_IN);
      y = -12 * (1 - outBack(u)); op = clamp(t / 200); sc = .92 + .08 * outCubic(u);
      th = -18 + (HELD + 18) * outCubic(u); om = 0;
    } else {
      if (state === 'playing') { state = 'still'; om = KNOCK; }  // fincou: o tranco tira o selo do lugar
      // balanço em volta do alfinete: θ'' = -K(θ - REST) - Cθ' (passos curtos, estável em qualquer fps)
      const n = Math.ceil(dt / 0.004), h = dt / n;
      for (let i = 0; i < n; i++) { om += (-K * (th - REST) - C * om) * h; th += om * h; }
      const d = t - HIT;
      sc = 1 - .045 * Math.exp(-d / 80) * Math.cos(d / 26);   // apertado contra a faixa, e volta
    }
    setTag(y, th, sc, op);
    // ---- alfinete e sombra ----
    if (t < FALL_AT) start();
    else if (t < HIT) {
      const u = (t - FALL_AT) / FALL, hgt = 1 - u * u;          // altura: cai acelerando (gravidade)
      const D = TRAVEL * hgt;
      setPin(AX * D + DRIFT * hgt * hgt, AY * D, 1 + 1.15 * hgt, 26 * Math.pow(hgt, 1.4), clamp(u * 7));
      setShadow(44 * hgt, 58 * hgt, 1 + .35 * hgt, 9 * hgt, (1 - .72 * hgt) * clamp(u * 5));
      setNeedle(clamp(D / NEEDLE));                             // a agulha entra nos últimos pixels
    } else {
      const d = t - HIT, k = Math.exp(-d / 70);
      setPin(0, 0, 1 - .04 * k * Math.cos(d / 30), 3 * Math.exp(-d / 140) * Math.sin(d / 34), 1);   // recuo do impacto
      setShadow(0, 0, 1 - .02 * k, 0, 1);
      setNeedle(0);
    }
    // segue enquanto a cena roda ou o selo balança; parado, dorme até o próximo empurrão
    if (t < HIT + 600 || Math.abs(th - REST) > 0.015 || Math.abs(om) > 0.06) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const play = () => {
    clearTimeout(fading);
    layers.forEach((el) => { el.style.transition = 'none'; });
    cancelAnimationFrame(raf); raf = 0;
    start();
    state = 'playing';
    ready.then(() => {
      if (state !== 'playing' || !li.classList.contains('is-on')) return;
      t0 = performance.now(); last = 0;
      raf = requestAnimationFrame(frame);
    });
  };
  const hide = () => {           // o fio saiu do item: some suave e volta para o alto depois
    state = 'hidden';
    cancelAnimationFrame(raf); raf = 0;
    layers.forEach((el) => { el.style.transition = 'opacity .3s ease'; el.style.opacity = '0'; });
    clearTimeout(fading);
    fading = setTimeout(() => { if (state === 'hidden') { layers.forEach((el) => { el.style.transition = 'none'; }); start(); } }, 320);
  };

  // empurrões depois de preso: o mouse arrasta o selo pela velocidade de lado, um toque dá um peteleco,
  // e os trancos da rolagem (mudança brusca de velocidade) chacoalham de leve
  let onScreen = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(badge);
  else onScreen = true;
  const kick = (w) => {
    if (state !== 'still' || performance.now() - t0 < HIT || !onScreen) return;   // fora da tela não balança (nem gasta)
    om = clamp(om + w, -170, 170);
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  };
  let px = null;
  badge.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { if (px !== null) kick((e.clientX - px) * 0.9); px = e.clientX; } });
  badge.addEventListener('pointerleave', () => { px = null; });
  badge.addEventListener('pointerdown', (e) => { kick(e.pointerType === 'mouse' ? 70 : 110); });
  let sy = scrollY, sv = 0, st = performance.now();
  addEventListener('scroll', () => {
    const now = performance.now(), v = (scrollY - sy) / Math.max(8, now - st);   // px/ms
    if (Math.abs(v - sv) > 0.8) kick(clamp((sv - v) * 22, -45, 45));
    sv = v; sy = scrollY; st = now;
  }, { passive: true });

  // modo leve ligado no meio do uso: para a animação e volta para o estado final do css (preso e parado)
  document.addEventListener('gr:leve', () => {
    state = 'off'; cancelAnimationFrame(raf); raf = 0; clearTimeout(fading);
    layers.forEach((el) => el.removeAttribute('style'));
    badge.classList.remove('pin-live');
  }, { once: true });

  // o fio chega / sai do item
  badge.classList.add('pin-live');
  start();
  let on = li.classList.contains('is-on');
  if (on) play();
  new MutationObserver(() => {
    const now = li.classList.contains('is-on');
    if (now === on || state === 'off') return;
    on = now;
    if (on) play(); else hide();
  }).observe(li, { attributes: true, attributeFilter: ['class'] });
})();
