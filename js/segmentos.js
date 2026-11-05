// Segmentos: galeria em arco (efeito do CircularGallery do React Bits, refeito sem React e sem WebGL, nos cartões que já
// existem: mesmas fotos e textos). Os cartões ficam num arco que desce nas pontas e acompanha a curva; arrastar (mouse
// ou dedo), a roda/trackpad de lado, as setas e o teclado (← →) passam de um para outro com inércia e assentam no mais
// próximo; as pontas somem num degradê; enquanto anda, os cartões ondulam de leve; na primeira vez que a seção aparece
// eles chegam deslizando. Tudo com transform/opacity (só o compositor trabalha), o laço só roda enquanto algo se mexe
// e com a seção à vista. "Menos movimento": fica a grade/carrossel de antes. Modo leve: sem a ondulação.
(() => {
  const ni = document.querySelector('.nichos');
  const grid = ni && ni.querySelector('.nc-grid');
  const ctrl = ni && ni.querySelector('.nc-ctrl');
  if (!grid || !ctrl || !document.documentElement.classList.contains('nc-gal-on')) return;   // classe posta no <head> (js/desempenho.js)
  const cards = [...grid.querySelectorAll(':scope > .nc-card')];
  const N = cards.length;
  if (N < 3) return;
  const [prev, next] = ctrl.querySelectorAll('.nc-arrow');
  const num = ctrl.querySelector('.nc-count b'), name = ctrl.querySelector('.nc-count em');
  const leve = () => document.documentElement.classList.contains('leve');

  ni.classList.add('nc-gal');
  grid.setAttribute('tabindex', '0');
  grid.setAttribute('role', 'region');
  grid.setAttribute('aria-roledescription', 'carrossel');
  grid.setAttribute('aria-label', 'Segmentos: arraste ou use as setas');

  const BEND = 3, GAP = 0.12, EASE = 0.075, FADE = 0.12, INTRO = 1.4;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wrap = (v, n) => ((v % n) + n) % n;
  const ease = (x) => x * x * (3 - 2 * x);
  const smoother = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };

  const st = { scroll: 0, target: 0, vel: 0, active: 0, intro: 0, started: false, drag: null, hover: -1, lift: new Float32Array(N) };
  let vw = 1, cw = 300, ch = 400, sp = 330, R = 1e9, half = 1, raf = 0, last = 0, visible = false, snapT = 0;

  const measure = () => {
    vw = grid.clientWidth || innerWidth;
    cw = cards[0].offsetWidth;
    ch = Math.max(...cards.map((c) => c.offsetHeight));
    sp = cw * (1 + GAP);
    // arco: desce "depth" px na borda da tela (como bend=3 do original), raio que passa por esse ponto
    half = Math.max(vw / 2, cw * 1.5);
    const depth = ch * 0.06 * BEND;
    R = (half * half + depth * depth) / (2 * depth);
    const a = st.active;
    st.scroll = st.target = a * sp;
    wake();
  };

  const setActive = (slot) => {
    const i = wrap(slot, N);
    if (slot === st.active && num.textContent) return;
    st.active = slot;
    num.textContent = String(i + 1).padStart(2, '0');
    name.textContent = cards[i].querySelector('h3').textContent;
    cards.forEach((c, k) => c.classList.toggle('is-center', k === i));
  };
  const goTo = (slot) => { st.target = slot * sp; setActive(slot); wake(); };
  const nearest = () => Math.round(st.target / sp);

  const frame = (now) => {
    raf = 0;
    if (!visible) { last = 0; return; }
    const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
    last = now;
    const before = st.scroll;
    st.scroll += (st.target - st.scroll) * (1 - Math.pow(1 - EASE, dt * 60));
    if (Math.abs(st.target - st.scroll) < 0.1) st.scroll = st.target;
    const v = (st.scroll - before) / dt;
    st.vel += (v - st.vel) * (1 - Math.exp(-dt / 0.08));
    if (Math.abs(st.vel) < 2) st.vel = 0;
    if (st.started && st.intro < 1) st.intro = Math.min(1, st.intro + dt / INTRO);
    let settling = false;
    for (let k = 0; k < N; k++) {
      const goal = k === st.hover && !st.drag ? 1 : 0;
      const nv = st.lift[k] + (goal - st.lift[k]) * (1 - Math.exp(-dt / 0.12));
      st.lift[k] = Math.abs(goal - nv) < 0.002 ? goal : nv;
      if (st.lift[k] !== goal) settling = true;
    }
    if (!st.drag) { const s = Math.round(st.scroll / sp); if (s !== st.active && Math.abs(st.scroll - st.target) < sp * 0.5) setActive(nearest()); }

    const ie = 1 - Math.pow(1 - st.intro, 3);
    const scroll = st.scroll + (1 - ie) * sp * 1.6;   // entrada: chegam da direita
    const total = sp * N;
    const wav = leve() ? 0 : clamp(st.vel / (sp * 4), -1, 1);   // ondulação proporcional à velocidade
    for (let k = 0; k < N; k++) {
      const c = cards[k];
      let x = wrap(k * sp - scroll + total / 2, total) - total / 2;
      const reach = Math.min(Math.abs(x), half, R * 0.999);
      const y = R - Math.sqrt(R * R - reach * reach);
      const ang = Math.sign(x) * Math.asin(reach / R);
      const u = (vw / 2 + x) / vw;
      const edge = smoother(u / FADE) * smoother((1 - u) / FADE);
      const order = Math.abs(k * sp - st.scroll) / sp;
      const shown = st.started ? ease(clamp(st.intro * 2.2 - Math.min(order, N - order) * 0.22, 0, 1)) : 0;
      const op = edge * shown;
      if (op < 0.01) { if (c.style.visibility !== 'hidden') c.style.visibility = 'hidden'; continue; }
      if (c.style.visibility) c.style.visibility = '';
      const lift = st.lift[k];
      const dy = y + (1 - shown) * ch * 0.18 - lift * 10;   // entrada: sobe um pouco; hover: levanta 10 px
      const sk = wav * 6 * (0.6 + 0.4 * Math.cos(x / sp));
      c.style.transform = `translate3d(${x.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${ang.toFixed(4)}rad) skewX(${sk.toFixed(2)}deg) scale(${(1 + lift * 0.03).toFixed(4)})`;
      c.style.opacity = op.toFixed(3);
      c.style.zIndex = String(100 - Math.round(Math.abs(x) / 10));
    }
    const moving = st.scroll !== st.target || st.vel !== 0 || (st.started && st.intro < 1) || settling || st.drag;
    if (moving) raf = requestAnimationFrame(frame); else last = 0;
  };
  function wake() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  // ----- entrada: só quando a seção aparece e as fotos estão prontas (senão os cartões chegam brancos) -----
  // as fotos começam a baixar quando a seção chega perto (antes eram "lazy" e só baixavam ao aparecer)
  const imgs = cards.map((c) => c.querySelector('.nc-hero img')).filter(Boolean);
  let photos = null;
  const preload = () => photos || (photos = Promise.all(imgs.map((im) => { im.loading = 'eager';
    return (im.complete && im.naturalWidth ? Promise.resolve() : new Promise((r) => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); }))
      .then(() => (im.decode ? im.decode().catch(() => {}) : null)); })));
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); preload(); } }, { rootMargin: '900px 0px' }).observe(grid);

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !st.started && e.intersectionRatio > 0.15) {
      Promise.race([preload(), new Promise((r) => setTimeout(r, 2500))]).then(() => { st.started = true; wake(); });
    }
    if (visible) wake();
  }, { threshold: [0, 0.15, 0.3] }).observe(grid);

  // ----- arrastar (mouse e dedo); gesto vertical no celular continua rolando a página -----
  const hitCard = (el) => el && el.closest && el.closest('.nc-card');
  grid.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    st.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, start: st.target, moved: false, samples: [], card: hitCard(e.target) };
    wake();
  });
  grid.addEventListener('pointermove', (e) => {
    const d = st.drag;
    if (!d || d.id !== e.pointerId) {
      if (e.pointerType === 'mouse') { const c = hitCard(e.target); const k = c ? cards.indexOf(c) : -1; if (k !== st.hover) { st.hover = k; wake(); } }
      return;
    }
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.moved && Math.hypot(dx, dy) > 6) {
      if (Math.abs(dy) > Math.abs(dx) && e.pointerType !== 'mouse') { st.drag = null; return; }
      d.moved = true; grid.setPointerCapture?.(e.pointerId); grid.setAttribute('data-dragging', ''); st.hover = -1;
    }
    if (d.moved) {
      st.target = d.start - dx;
      d.samples.push({ x: e.clientX, t: performance.now() }); if (d.samples.length > 6) d.samples.shift();
      wake();
    }
  });
  const end = (e) => {
    const d = st.drag;
    if (!d || d.id !== e.pointerId) return;
    st.drag = null; grid.removeAttribute('data-dragging');
    if (grid.hasPointerCapture?.(e.pointerId)) grid.releasePointerCapture(e.pointerId);
    if (d.moved) {
      const s = d.samples;
      if (s.length > 1) { const a = s[0], b = s[s.length - 1]; st.target -= ((b.x - a.x) / Math.max(b.t - a.t, 16)) * 1000 * 0.18; }
      goTo(nearest());
    } else if (d.card && e.type === 'pointerup') {   // toque/clique num cartão: ele vem para o centro
      const k = cards.indexOf(d.card); const cur = st.active, base = cur - wrap(cur, N) + k;
      goTo([base - N, base, base + N].reduce((p, q) => (Math.abs(q - cur) < Math.abs(p - cur) ? q : p)));
    }
  };
  grid.addEventListener('pointerup', end);
  grid.addEventListener('pointercancel', end);
  grid.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && st.hover !== -1) { st.hover = -1; wake(); } });
  // roda/trackpad: só o gesto de lado move a galeria (o vertical continua rolando a página)
  grid.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    st.target += e.deltaX * (e.deltaMode === 1 ? 16 : 1);
    clearTimeout(snapT); snapT = setTimeout(() => goTo(nearest()), 140);
    wake();
  }, { passive: false });
  grid.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(nearest() + (e.key === 'ArrowRight' ? 1 : -1)); }
  });
  [prev, next].forEach((b) => { b.disabled = false; b.addEventListener('click', () => goTo(nearest() + Number(b.dataset.dir))); });

  if ('ResizeObserver' in window) { let w0 = 0; new ResizeObserver(() => { const w = grid.clientWidth; if (w !== w0) { w0 = w; measure(); } }).observe(grid); }
  setActive(0);
  measure();
  addEventListener('load', measure, { once: true });
})();
