// Segmentos: cartões em leque (efeito do "card fan carousel", refeito sem React, nos cartões que já existem: mesmas
// fotos e textos). Sete cartões abertos em leque, o do meio na frente; passar o mouse num cartão levanta ele e afasta
// os vizinhos; as setas, os pontinhos, o teclado (← →), arrastar de lado e tocar num cartão trocam o do centro (um sai
// por uma ponta e outro entra pela outra). A chegada continua a mesma de antes: na primeira vez que a seção aparece
// os cartões chegam deslizando da direita e sobem, do centro para as pontas. Movimento todo no GSAP (transform e
// opacity). "Menos movimento" ou sem GSAP: fica a grade/carrossel de antes.
(() => {
  const ni = document.querySelector('.nichos');
  const grid = ni && ni.querySelector('.nc-grid');
  const ctrl = ni && ni.querySelector('.nc-ctrl');
  const { gsap } = window;
  if (!grid || !ctrl || !gsap || !document.documentElement.classList.contains('nc-gal-on')) {
    document.documentElement.classList.remove('nc-gal-on');   // sem GSAP: volta a grade (js/main.js cuida do carrossel)
    return;
  }
  const cards = [...grid.querySelectorAll(':scope > .nc-card')];
  const N = cards.length;
  if (N < 3) return;
  const [prev, next] = ctrl.querySelectorAll('.nc-arrow');
  const num = ctrl.querySelector('.nc-count b'), name = ctrl.querySelector('.nc-count em');

  ni.classList.add('nc-gal', 'nc-fan');
  grid.setAttribute('tabindex', '0');
  grid.setAttribute('role', 'region');
  grid.setAttribute('aria-roledescription', 'carrossel');
  grid.setAttribute('aria-label', 'Segmentos: use as setas para trocar');

  // pontinhos entre as setas (um por segmento)
  const dotsRow = document.createElement('span');
  dotsRow.className = 'nc-pips';
  dotsRow.setAttribute('aria-hidden', 'true');
  const pips = cards.map(() => dotsRow.appendChild(document.createElement('i')));
  ctrl.querySelector('.nc-count').prepend(dotsRow);

  // ----- posições do leque (mesmos números do componente: x e y em rem, rotação em graus) -----
  const MAX = 7, HALF = 3;
  const FAN = [
    { rot: -21, scale: 0.7756, x: -30, y: 7.3, z: 1 },
    { rot: -14, scale: 0.8498, x: -22, y: 4.0, z: 2 },
    { rot: -7, scale: 0.9346, x: -11, y: 1.3, z: 3 },
    { rot: 0, scale: 1, x: 0, y: 0, z: 10 },
    { rot: 7, scale: 0.9346, x: 11, y: 1.3, z: 3 },
    { rot: 14, scale: 0.8498, x: 22, y: 4.0, z: 2 },
    { rot: 21, scale: 0.7756, x: 30, y: 7.3, z: 1 },
  ];
  const paged = N > MAX;
  const SLOTS = paged ? MAX : N;
  const slotCfg = (slot) => {
    if (paged) return FAN[slot];
    const c = N >> 1, d = (slot - c) / c, a = Math.abs(d);
    return { rot: d * 21, scale: 1 - 0.2244 * a * a, x: d * 30, y: a * a * 7.3, z: 10 - Math.abs(slot - c) };
  };
  const wrap = (v) => ((v % N) + N) % N;

  // largura: o mesmo escalonamento por tela do componente, e nunca mais largo que a faixa
  let kx = 1, ky = 1, cw = 300, ch = 500, vw = 1200;
  const measure = () => {
    vw = grid.clientWidth || innerWidth;
    cw = cards[0].offsetWidth || 300;
    ch = Math.max(...cards.map((c) => c.offsetHeight)) || 500;
    const w = innerWidth;
    const m = w < 480 ? 0.28 : w < 640 ? 0.38 : w < 768 ? 0.5 : w < 1024 ? 0.75 : 1;
    const room = vw / 2 - (cw * 0.7756) / 2 - 12;   // até onde o centro do cartão da ponta pode ir
    kx = 16 * Math.min(m, Math.max(0, room) / (30 * 16));
    ky = 16 * Math.min(1, (innerHeight * 0.9) / (ch + 140));   // tela baixa: o leque desce menos
  };

  let center = paged ? HALF : N >> 1;   // índice do cartão no meio
  const visibleMap = (c) => {
    const map = new Map();
    if (!paged) { cards.forEach((_, i) => map.set(i, i)); return map; }
    for (let s = 0; s < MAX; s++) map.set(wrap(c + s - HALF), s);
    return map;
  };
  let map = visibleMap(center);
  const target = (slot, dx = 0, dy = 0, drot = 0, sc = 1) => {
    const f = slotCfg(slot);
    return { x: f.x * kx + dx, y: f.y * ky + dy, rotation: f.rot + drot, scale: f.scale * sc, zIndex: f.z };
  };

  const label = () => {
    num.textContent = String(center + 1).padStart(2, '0');
    name.textContent = cards[center].querySelector('h3').textContent;
    cards.forEach((c, k) => c.classList.toggle('is-center', k === center));
    pips.forEach((p, k) => p.classList.toggle('on', k === center));
  };

  let busy = true, started = false, hovered = null, leaveT = 0;

  // ----- hover: o cartão sobe e cresce um pouco, os vizinhos abrem espaço -----
  const layout = (hot, instant) => {
    const cs = SLOTS >> 1;
    map.forEach((slot, k) => {
      let dx = 0, dy = 0, drot = 0, sc = 1, delay = Math.abs(slot - cs) * 0.02;
      if (hot !== null) {
        const dist = Math.abs(slot - hot);
        delay = dist * 0.02;
        if (slot === hot) { dy = -2.5 * ky; sc = 1.08; }
        else {
          const norm = cs > 0 ? (slot - cs) / cs : 0;
          const push = 8 * (1 - Math.abs(norm)) * (1 + 0.2 * Math.max(0, 3 - dist));
          const side = slot < hot ? -1 : 1;
          dx = side * push * kx; drot = (side * 3) / (dist + 1);
          if (slot === SLOTS - 1 && hot < cs) dy -= ky;
          if (slot === 0 && hot > cs) dy -= ky;
        }
      }
      const { zIndex, ...pos } = target(slot, dx, dy, drot, sc);
      if (instant) gsap.set(cards[k], { ...pos, zIndex, opacity: 1 });
      else { gsap.set(cards[k], { zIndex }); gsap.to(cards[k], { ...pos, duration: 0.5, delay, ease: 'elastic.out(1,.75)', overwrite: 'auto' }); }
    });
  };

  // ----- trocar o do centro: quem sai vai pela ponta, quem entra vem pela outra -----
  const goTo = (c) => {
    c = wrap(c);
    if (busy || c === center) return;
    const fwd = wrap(c - center) <= N / 2;   // caminho mais curto
    busy = true; hovered = null;
    const before = map;
    center = c; map = visibleMap(center); label();
    const far = 30 * kx + cw;   // fora da ponta do leque
    let left = map.size;
    const done = () => { if (--left <= 0) busy = false; };
    cards.forEach((card, k) => {
      const slot = map.get(k), was = before.has(k);
      if (slot !== undefined) {
        const t = target(slot);
        if (!was) {
          gsap.set(card, { x: fwd ? far : -far, y: t.y, rotation: fwd ? 30 : -30, scale: 0.5, opacity: 0, zIndex: t.zIndex });
          gsap.to(card, { ...t, opacity: 1, duration: 0.6, ease: 'power2.out', overwrite: true, onComplete: done });
        } else {
          gsap.to(card, { ...t, opacity: 1, duration: 0.5, ease: 'power2.out', overwrite: true, onComplete: done });
        }
      } else if (was) {
        gsap.to(card, { x: fwd ? -far : far, opacity: 0, scale: 0.5, rotation: fwd ? -30 : 30, zIndex: 0, duration: 0.4, ease: 'power2.in', overwrite: true });
      }
    });
  };
  const step = (d) => goTo(center + d);

  // ----- posição inicial (escondidos) e a chegada de sempre -----
  const place = () => {
    cards.forEach((card, k) => {
      const slot = map.get(k);
      if (slot === undefined) gsap.set(card, { x: 0, y: 0, rotation: 0, scale: 0.5, opacity: 0, zIndex: 0 });
      else gsap.set(card, { ...target(slot), opacity: started ? 1 : 0 });
    });
  };
  const arrive = () => {
    started = true;
    const sp = cw * 1.12;   // a mesma distância de antes: chegam 1,6 cartão para a direita
    let left = map.size;
    map.forEach((slot, k) => {
      const t = target(slot), order = Math.abs(slot - (SLOTS >> 1));
      const card = cards[k];
      gsap.set(card, { ...t, x: t.x + sp * 1.6, y: t.y + ch * 0.18, opacity: 0 });
      gsap.to(card, { x: t.x, duration: 1.4, ease: 'power3.out' });   // desliza junto
      gsap.to(card, { y: t.y, opacity: 1, duration: 0.64, delay: order * 0.14, ease: 'power1.inOut',   // sobe e aparece em cascata
        onComplete: () => { if (--left <= 0) setTimeout(() => { busy = false; }, 0); } });
    });
  };

  // as fotos começam a baixar quando a seção chega perto; a chegada espera elas (senão os cartões chegam brancos)
  const imgs = cards.map((c) => c.querySelector('.nc-hero img')).filter(Boolean);
  let photos = null;
  const preload = () => photos || (photos = Promise.all(imgs.map((im) => { im.loading = 'eager';
    return (im.complete && im.naturalWidth ? Promise.resolve() : new Promise((r) => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); }))
      .then(() => (im.decode ? im.decode().catch(() => {}) : null)); })));
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); preload(); } }, { rootMargin: '900px 0px' }).observe(grid);
  new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting || e.intersectionRatio < 0.15) return;
    o.disconnect();
    Promise.race([preload(), new Promise((r) => setTimeout(r, 2500))]).then(() => { measure(); arrive(); });
  }, { threshold: [0, 0.15, 0.3] }).observe(grid);

  // ----- mouse por cima -----
  grid.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || busy) return;
    const c = e.target.closest && e.target.closest('.nc-card');
    const slot = c ? map.get(cards.indexOf(c)) : undefined;
    if (slot === undefined) return;
    clearTimeout(leaveT);
    if (hovered !== slot) { hovered = slot; layout(slot); }
  });
  grid.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse' || busy) return;
    clearTimeout(leaveT);
    leaveT = setTimeout(() => { hovered = null; layout(null); }, 50);
  });

  // ----- arrastar de lado (dedo ou mouse) troca; tocar num cartão traz ele para o centro -----
  let drag = null;
  grid.addEventListener('pointerdown', (e) => { if (e.button === 0) drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
  grid.addEventListener('pointerup', (e) => {
    const d = drag; drag = null;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { step(dx < 0 ? 1 : -1); return; }
    if (Math.hypot(dx, dy) < 8) {
      const c = e.target.closest && e.target.closest('.nc-card');
      if (c && map.has(cards.indexOf(c))) goTo(cards.indexOf(c));
    }
  });
  grid.addEventListener('pointercancel', () => { drag = null; });
  grid.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
  });
  [prev, next].forEach((b) => { b.disabled = false; b.addEventListener('click', () => step(Number(b.dataset.dir))); });

  // ----- tamanho da tela -----
  let w0 = 0;
  const onResize = () => { const w = grid.clientWidth; if (w === w0) return; w0 = w; measure(); if (started && !busy) layout(hovered, true); else if (!started) place(); };
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(grid);
  else addEventListener('resize', onResize);

  label();
  measure();
  place();
  addEventListener('load', () => { measure(); if (started && !busy) layout(hovered, true); }, { once: true });
})();
