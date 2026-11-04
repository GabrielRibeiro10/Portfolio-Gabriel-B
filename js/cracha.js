// ---------- Crachá 3D pendurado no "g" de "Código" (Sobre mim) ----------
// Estilo do Lanyard do React Bits: fita que dobra, cartão que gira em 3D, dá para arrastar
// (mouse ou dedo) e ele volta balançando. O three.js só carrega quando a seção chega perto da tela.
// Sem WebGL fica o <figure> estático do HTML (que também é o que os leitores de tela leem).
// ponytail: física própria (Verlet, pontos + distâncias) no lugar de React + Rapier, que o site não usa.
const about = document.querySelector('.about');
const slot = about && about.querySelector('.cracha-slot');
const title = about && about.querySelector('.about-title');
const fig = slot && slot.querySelector('.cracha');

// ----- entrada do título: "Design que emociona. Código que entrega." desliza da esquerda para a direita e leva o
// crachá junto (ele está preso no "g": a física puxa a fita e o cartão vem atrás, balançando na freada).
// Começa quando o bloco chega na tela e o crachá está pronto (no máximo 1,5 s de espera). É movido quadro a
// quadro aqui, e não por transição CSS: se um quadro atrasar, o título espera em vez de pular, e o gancho do
// crachá (que lê a posição do "g" a cada quadro) acompanha certinho. Quem prefere menos movimento vê tudo parado.
const slide = Boolean(fig && title) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
let titleIn = !slide, seen = false, ready = false;
const waitTitle = [];
const whenTitleIn = (f) => (titleIn ? f() : waitTitle.push(f));
const markReady = () => { ready = true; goTitle(); };
function goTitle() {
  if (titleIn || !seen || !ready) return;
  titleIn = true;
  const D = 2000, X = -0.62 * innerWidth, ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let p = 0, last = performance.now();
  const f = (now) => {
    p = Math.min(1, p + Math.min(now - last, 34) / D); last = now;
    if (p < 1) {
      title.style.transform = `translate3d(${(X * (1 - ease(p))).toFixed(1)}px, 0, 0)`;
      title.style.opacity = Math.min(1, p * 2.4).toFixed(3);
      requestAnimationFrame(f);
    } else { title.style.transform = title.style.opacity = ''; title.classList.remove('ab-slide'); }
  };
  requestAnimationFrame(f);
  waitTitle.splice(0).forEach((g) => g());
}
if (slide) {
  title.classList.add('ab-slide');
  new IntersectionObserver((e, o) => {
    if (!e[0].isIntersecting) return;
    o.disconnect();
    seen = true; goTitle();
    setTimeout(markReady, 1500);   // o crachá demorou: o título entra assim mesmo e ele chega depois
  }, { rootMargin: '0px 0px -30% 0px' }).observe(title.parentElement);
}

if (fig && title) {
  about.classList.add('cracha-loading');
  new IntersectionObserver((e, o) => {
    if (!e[0].isIntersecting) return;
    o.disconnect();
    // modo leve (js/desempenho.js): fita e gancho desenhados sem 3D (lanyard()), sem baixar o three.js
    if (document.documentElement.classList.contains('leve')) { lanyard(); return; }
    start().catch((err) => {
      console.warn('crachá 3D desligado:', err);
      about.classList.remove('cracha-3d');
      lanyard();
    });
  }, { rootMargin: '400px 0px' }).observe(slot);
}

const mob = () => matchMedia('(max-width: 860px)').matches;
// posição da letra onde o gancho prende (o título pode estar separado em palavras pelo GSAP):
// no PC o "g" de "Código"; no celular o "e" do "que" logo depois, que fica no meio da tela
function anchor() {
  const tw = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  let n, seen = false;
  while ((n = tw.nextNode())) {
    let i = seen ? 0 : n.data.indexOf('Código');
    if (i < 0) continue;
    const rg = document.createRange();
    if (!mob()) { rg.setStart(n, i + 4); rg.setEnd(n, i + 5); return { r: rg.getBoundingClientRect(), el: n.parentElement, ch: 'g' }; }
    if (!seen) { seen = true; i += 6; }
    const j = n.data.indexOf('que', i);
    if (j < 0) continue;
    rg.setStart(n, j + 2); rg.setEnd(n, j + 3);
    return { r: rg.getBoundingClientRect(), el: n.parentElement, ch: 'e' };
  }
  return { r: title.getBoundingClientRect(), el: title, ch: 'g' };
}
// centro do traço de baixo do "g" e a grossura dele: desenha a letra num canvas com a mesma fonte e procura
// a tinta mais baixa. Fica como fração da caixa da letra, que acompanha o tamanho da fonte.
let tail = { x: 0.5, y: 0.88, th: 0.08 };
function measureTail() {
  const { r, el, ch } = anchor(), cs = getComputedStyle(el), k = 3;
  const c = document.createElement('canvas'); c.width = Math.ceil(r.width * k) + 16; c.height = Math.ceil(r.height * k) + 16;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.scale(k, k); x.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  x.fillText(ch, 0, x.measureText(ch).fontBoundingBoxAscent);
  const a = x.getImageData(0, 0, c.width, c.height).data, ink = (px, py) => a[(py * c.width + px) * 4 + 3] > 128;
  for (let py = c.height - 1; py >= 0; py--) {
    let lo = -1, hi = -1;
    for (let px = 0; px < c.width; px++) if (ink(px, py)) { if (lo < 0) lo = px; hi = px; }
    if (lo < 0) continue;
    const cx = Math.round((lo + hi) / 2);
    let top = py; while (top > 0 && ink(cx, top - 1)) top--;
    tail = { x: cx / k / r.width, y: (py + top) / 2 / k / r.height, th: (py - top + 1) / k / r.height };
    return;
  }
}

// ----- modo leve (ou sem WebGL): o mesmo crachá pendurado, parado e sem three.js -----
// Gancho no "g", argola, fita com o nome e o cartão (o próprio <figure>) embaixo, com as medidas do 3D.
// São só alguns <span> posicionados; nada roda a cada quadro depois que o título termina de entrar.
let lanyardOn = false;
async function lanyard() {
  if (lanyardOn) return;
  lanyardOn = true;
  await document.fonts.load('600 20px "Inter Tight"').catch(() => {});
  await document.fonts.load(getComputedStyle(title).font).catch(() => {});
  const el = document.createElement('div');
  el.className = 'lanyard';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="ly-band"><span>' + 'GABRIEL RIBEIRO   •   FULL STACK   •   '.repeat(8) +
    '</span></span><span class="ly-wire"></span><span class="ly-ring"></span>';
  const [band, wire, ring] = el.children;
  about.appendChild(el);
  about.classList.add('cracha-leve');
  about.classList.remove('cracha-loading');

  let dx = 0;
  const px = (n) => n.toFixed(2) + 'px';
  const box = (n, l, t, w, h) => Object.assign(n.style, { left: px(l), top: px(t), width: px(w), height: px(h) });
  function place() {
    const { r } = anchor(), ar = about.getBoundingClientRect();
    const x = r.left + r.width * tail.x - ar.left, y = r.top + r.height * tail.y - ar.top;   // centro do traço do "g"
    const W = mob() ? 150 : 180, BAND = Math.round(W * 0.12);
    // mesmas contas do buildHook() do 3D
    const t = tail.th * r.height, rw = Math.max(1.4, t * 0.18), R = t / 2 + rw + 0.6;
    const sh = Math.max(6, BAND * 0.35), wb = BAND + rw * 2 + 3, hb = Math.max(7, BAND * 0.45), rr = hb * 0.45;
    box(wire, x - rw, y - R, rw * 2, R + sh + rw);
    box(ring, x - wb / 2 - rw, y + sh - rw, wb + rw * 2, hb + rw * 2);
    Object.assign(ring.style, { borderWidth: px(rw * 2), borderRadius: px(rr + rw) });
    // cartão centrado embaixo do gancho; a fita vai da argola até o clipe do cartão
    const fr = fig.getBoundingClientRect();
    dx = x - (fr.left - dx + fr.width / 2 - ar.left);
    fig.style.transform = `translateX(${px(dx)})`;
    const A = y + sh + hb, top = A - rw * 3.2, bottom = fr.top - ar.top - 3;   // termina dentro do clipe
    box(band, x - BAND / 2, top, BAND, Math.max(0, bottom - top));
    Object.assign(band.style, {
      borderRadius: `${px(BAND / 2)} ${px(BAND / 2)} 0 0 / ${px(rw * 2.2)} ${px(rw * 2.2)} 0 0`,
      fontSize: px(BAND * 0.42), paddingTop: px(A - top + BAND * 1.3),
    });
  }
  const relayout = () => { measureTail(); place(); };
  relayout();
  markReady();
  // o título pode estar entrando (GSAP move as palavras): acompanha o "g" por 3 s e depois para
  let until = performance.now() + 3000;
  const follow = () => { place(); if (performance.now() < until) requestAnimationFrame(follow); };
  requestAnimationFrame(follow);
  // o título deslizando: acompanha até ele parar
  whenTitleIn(() => { const go = performance.now() >= until; until = performance.now() + 2600; if (go) requestAnimationFrame(follow); });
  // só a largura importa (o "g" muda de lugar quando a largura muda). A altura da seção muda a cada quadro quando uma
  // resposta do FAQ abre (o FAQ fica dentro dela): reagir à altura redesenhava a letra num canvas a cada quadro e travava
  let lastW = about.clientWidth;
  if ('ResizeObserver' in window) new ResizeObserver(() => { const w = about.clientWidth; if (w !== lastW) { lastW = w; requestAnimationFrame(relayout); } }).observe(about);
  else addEventListener('resize', relayout);
}

async function start() {
  const THREE = await import('./vendor/three.module.min.js');
  await document.fonts.load('600 20px "Inter Tight"').catch(() => {});
  await document.fonts.load(getComputedStyle(title).font).catch(() => {});   // a do título, para medir o "g"
  const img = fig.querySelector('img');
  const photo = new Image(); photo.src = img.currentSrc || img.src; await photo.decode();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = matchMedia('(max-width: 860px)').matches ? 150 : 180;   // largura do cartão (o antigo tinha 260 e ficava grande)
  const H = Math.round(W * 1.54);
  const BAND = Math.round(W * 0.12);   // largura da fita
  const N = 12;                        // pontos da fita
  const G = 3000, DAMPING = 1.2, STEP = 1 / 120, ITER = 12;
  const KF = 0.004, TWIST = 0.12;      // mola que vira o cartão de frente / giro que o balanço dá

  // ----- cena -----
  const canvas = document.createElement('canvas');
  canvas.className = 'cracha-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.visibility = 'hidden';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: devicePixelRatio < 1.5, alpha: true, powerPreference: 'high-performance' });   // tela de alta densidade não precisa de antisserrilhado (mais leve)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));   // desempenho: até 1,5x
  about.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 10);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a948d, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(-0.5, 1, 1.2); scene.add(sun);
  // reflexos: as mesmas faixas de luz (Lightformers) do Lanyard do React Bits, num mapa de ambiente.
  // Com o verniz (clearcoat) do cartão, elas viram brilhos que correm pelo cartão quando ele gira.
  const env = new THREE.Scene(), strip = new THREE.PlaneGeometry(1, 1);
  for (const [i, p, r, sc] of [[2, [0, -1, 5], [0, 0, 1.047], [100, 0.1]], [3, [-1, -1, 1], [0, 0, 1.047], [100, 0.1]],
    [3, [1, 1, 1], [0, 0, 1.047], [100, 0.1]], [10, [-10, 0, 14], [0, 1.571, 1.047], [100, 10]]]) {
    const m = new THREE.Mesh(strip, new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide }));
    m.position.set(...p); m.rotation.set(...r); m.scale.set(sc[0], sc[1], 1); env.add(m);
  }
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0.04).texture;
  const gloss = (o) => new THREE.MeshPhysicalMaterial({ clearcoat: 1, clearcoatRoughness: 0.15, roughness: 0.9, metalness: 0.1, envMapIntensity: 0.35, ...o });
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };

  // cartão: corpo com espessura + frente (foto e nome) + verso; a origem fica no meio da borda de cima
  const shape = new THREE.Shape(), r = W * 0.07, x0 = -W / 2, y0 = -H / 2;
  shape.moveTo(x0 + r, y0); shape.lineTo(x0 + W - r, y0); shape.quadraticCurveTo(x0 + W, y0, x0 + W, y0 + r);
  shape.lineTo(x0 + W, y0 + H - r); shape.quadraticCurveTo(x0 + W, y0 + H, x0 + W - r, y0 + H);
  shape.lineTo(x0 + r, y0 + H); shape.quadraticCurveTo(x0, y0 + H, x0, y0 + H - r);
  shape.lineTo(x0, y0 + r); shape.quadraticCurveTo(x0, y0, x0 + r, y0);
  const face = (z, back) => {
    const g = new THREE.ShapeGeometry(shape, 8), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / W + 0.5, p.getY(i) / H + 0.5);
    if (back) g.rotateY(Math.PI);
    return g.translate(0, 0, z);
  };
  const card = new THREE.Group(), inner = new THREE.Group();
  inner.position.y = -H / 2;
  inner.add(
    new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -1.2),
      gloss({ color: 0xeceae6 })),
    new THREE.Mesh(face(1.4), gloss({ map: tex(drawFront()) })),
    new THREE.Mesh(face(-1.4, true), gloss({ map: tex(drawFront()) })),   // verso igual à frente: foto dos dois lados
  );
  // brilho do vídeo: faixa de luz na diagonal sobre a frente, que desliza quando o cartão gira/balança.
  // O reflexo do mapa de ambiente sozinho fica um véu borrado num cartão desse tamanho, então a faixa é desenhada.
  const glintTex = tex(drawGlint()); glintTex.repeat.x = 1 / 3;
  const glint = new THREE.Mesh(face(1.5), new THREE.MeshBasicMaterial({ map: glintTex, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  inner.add(glint);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W + 80, H + 80),   // sombra suave atrás (o cartão branco sumia no fundo claro)
    new THREE.MeshBasicMaterial({ map: tex(drawShadow()), transparent: true, depthWrite: false }));
  shadow.position.set(4, -12, -10);
  inner.add(shadow);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(W * 0.2, 12, 5), new THREE.MeshStandardMaterial({ color: 0xcfcfcf, metalness: 0.25, roughness: 0.3, envMapIntensity: 0.25 }));
  clip.position.y = 2;
  card.add(inner, clip);
  scene.add(card);

  // fita: tira plana ao longo de uma curva pelos pontos do cordão, com o nome repetido
  const S = 64;
  const bandTex = tex(drawBand()); bandTex.wrapS = THREE.RepeatWrapping;
  const tile = BAND * bandTex.image.width / bandTex.image.height;   // quantos px da fita cada repetição ocupa
  const LEAD = BAND * 1.3;   // trecho liso logo abaixo da dobra, antes do nome começar
  const bandPos = new Float32Array(S * 6), bandUv = new Float32Array(S * 4), idx = [];
  for (let i = 0; i < S - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const bandGeo = new THREE.BufferGeometry();
  bandGeo.setAttribute('position', new THREE.BufferAttribute(bandPos, 3));
  bandGeo.setAttribute('uv', new THREE.BufferAttribute(bandUv, 2));
  bandGeo.setIndex(idx);
  const band = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ map: bandTex, side: THREE.DoubleSide }));
  band.frustumCulled = false;
  scene.add(band);
  // gancho de metal: dá a volta no traço de baixo do "g" (por cima e por trás) e desce até uma argola achatada;
  // a fita passa pela argola e dobra (a "cap" é a dobra, atrás da barra de baixo da argola)
  const metal = new THREE.MeshStandardMaterial({ color: 0x8e8e8e, metalness: 0.75, roughness: 0.3 });
  const hook = new THREE.Group(), hookWire = new THREE.Mesh(new THREE.BufferGeometry(), metal), hookRing = new THREE.Mesh(new THREE.BufferGeometry(), metal);
  hook.add(hookWire, hookRing);
  const cap = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: '#111' }));
  for (const o of [hook, cap]) { o.frustumCulled = false; scene.add(o); }
  let hookLen = 0, hookAng = 0;   // do centro do traço até a barra de baixo da argola / quanto o gancho está virado
  const HOOK_MAX = 0.75;          // o gancho vira no máximo ~43° para cada lado (encosta na letra)

  // ----- física: pontos da fita (0 = preso no "g", N = topo do cartão) + 2 cantos de baixo do cartão -----
  const pts = Array.from({ length: N + 3 }, (_, i) => ({ x: 0, y: 0, z: 0, px: 0, py: 0, pz: 0, w: i === 0 ? 0 : i >= N ? 0.35 : 1, card: i >= N }));
  const A = pts[0], T = pts[N], BL = pts[N + 1], BR = pts[N + 2], cardPts = [T, BL, BR];
  const D = Math.hypot(W / 2, H);
  let cw = 0, ch = 0, L = 200, drag = null, shown = false, X0 = 0, vw = 0, Y0 = 0, rh = 0;   // X0/vw e Y0/rh: faixa da seção que o canvas desenha

  const P = { x: 0, y: 0 };   // centro do traço do "g", onde o gancho gira
  function pin() {
    const { r } = anchor(), ar = about.getBoundingClientRect();
    P.x = r.left + r.width * tail.x - ar.left;
    P.y = r.top + r.height * tail.y - ar.top;
    placeA();
  }
  function placeA() {   // a fita fica presa na barra de baixo da argola, que gira junto com o gancho
    A.x = A.px = P.x + Math.sin(hookAng) * hookLen;
    A.y = A.py = P.y + Math.cos(hookAng) * hookLen;
  }
  function buildHook() {   // medidas a partir da grossura do traço do "g" e da largura da fita
    const t = tail.th * anchor().r.height, rw = Math.max(1.4, t * 0.18), R = t / 2 + rw + 0.6;
    const sh = Math.max(6, BAND * 0.35), wb = BAND + rw * 2 + 3, hb = Math.max(7, BAND * 0.45), rr = hb * 0.45;
    const wire = [];   // por trás do traço, por cima, desce pela frente
    for (let a = 215; a >= 0; a -= 7.5) { const q = THREE.MathUtils.degToRad(a); wire.push(new THREE.Vector3(0, R * Math.sin(q), R * Math.cos(q))); }
    wire.push(new THREE.Vector3(0, -sh / 2, R), new THREE.Vector3(0, -sh, R));
    const ring = [], arc = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const q = a0 - k * Math.PI / 12; ring.push(new THREE.Vector3(cx + rr * Math.cos(q), cy + rr * Math.sin(q), R)); } };
    arc(wb / 2 - rr, -sh - rr, Math.PI / 2); arc(wb / 2 - rr, -sh - hb + rr, 0);   // argola: retângulo de cantos redondos
    arc(-wb / 2 + rr, -sh - hb + rr, -Math.PI / 2); arc(-wb / 2 + rr, -sh - rr, -Math.PI);
    hookWire.geometry.dispose(); hookWire.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire), 64, rw, 8);
    hookRing.geometry.dispose(); hookRing.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true, 'centripetal'), 96, rw, 8, true);
    hookLen = sh + hb;
    // dobra da fita: sobe passando a barra e arredonda por cima; embaixo é meio círculo, para a fita sair lisa em qualquer ângulo
    const hw = BAND / 2, s = new THREE.Shape();
    s.moveTo(-hw, 0); s.absarc(0, 0, hw, Math.PI, Math.PI * 2, false); s.lineTo(hw, rw);
    s.absellipse(0, rw, hw, rw * 2.2, 0, Math.PI, false); s.lineTo(-hw, 0);
    cap.geometry.dispose(); cap.geometry = new THREE.ShapeGeometry(s, 12);
  }
  function layout() {
    measureTail(); buildHook(); pin();
    const ar = about.getBoundingClientRect(), sr = slot.getBoundingClientRect();
    L = Math.max(120, sr.top - ar.top + 40 - A.y - (mob() ? 18 : 0));   // o cartão fica 40px abaixo do topo da coluna (no celular a fita é um pouco mais curta)
    cw = about.clientWidth; ch = Math.min(about.clientHeight, Math.ceil(A.y + L + H + 120));
    // desempenho: o canvas cobre só uma faixa de até 900px em volta do gancho (antes, a largura toda da seção)
    vw = Math.min(cw, 900); X0 = Math.round(Math.min(Math.max(P.x - vw / 2, 0), cw - vw));
    // e na altura começa pouco acima do gancho (folga para levantar o cartão arrastando): a seção tem os Projetos
    // em cima, e sem isso o canvas teria mais de mil pixels transparentes desenhados a cada quadro
    Y0 = Math.max(0, Math.round(P.y - L - 80)); rh = ch - Y0;
    renderer.setSize(vw, rh); canvas.style.left = X0 + 'px'; canvas.style.top = Y0 + 'px';
    camera.aspect = cw / ch;
    camera.setViewOffset(cw, ch, X0, Y0, vw, rh);
    camera.position.z = ch / 2 / Math.tan(THREE.MathUtils.degToRad(15));   // 1 unidade = 1px no plano z = 0
    camera.near = camera.position.z * 0.5; camera.far = camera.position.z * 1.5;
    camera.updateProjectionMatrix();
  }
  function hang(angle) {   // fita esticada num ângulo, cartão reto na ponta, tudo parado
    hookAng = THREE.MathUtils.clamp(angle, -HOOK_MAX, HOOK_MAX); placeA();
    const sx = Math.sin(angle), sy = Math.cos(angle);
    for (let i = 1; i <= N; i++) Object.assign(pts[i], { x: A.x + sx * L * i / N, y: A.y + sy * L * i / N, z: 0 });
    Object.assign(BL, { x: T.x - W / 2, y: T.y + H, z: 0 });
    Object.assign(BR, { x: T.x + W / 2, y: T.y + H, z: 0 });
    for (const p of pts) { p.px = p.x; p.py = p.y; p.pz = p.z; }
  }
  function keep(a, b, len, rope) {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1e-6, sw = a.w + b.w;
    if ((rope && d <= len) || sw === 0) return;
    const k = (d - len) / d / sw;
    a.x += dx * k * a.w; a.y += dy * k * a.w; a.z += dz * k * a.w;
    b.x -= dx * k * b.w; b.y -= dy * k * b.w; b.z -= dz * k * b.w;
  }
  function apart(a, b, min) {   // afasta dois pontos que chegaram perto demais
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1e-6, sw = a.w + b.w;
    if (d >= min || sw === 0) return;
    const k = (d - min) / d / sw * 0.5;
    a.x += dx * k * a.w; a.y += dy * k * a.w; a.z += dz * k * a.w;
    b.x -= dx * k * b.w; b.y -= dy * k * b.w; b.z -= dz * k * b.w;
  }
  function step() {
    const damp = Math.exp(-DAMPING * STEP);
    // o gancho vira devagar para o lado em que a fita puxa, e a argola (ponta da fita) vai junto
    const pull = Math.atan2(pts[1].x - P.x, pts[1].y - P.y);
    hookAng += (THREE.MathUtils.clamp(pull, -HOOK_MAX, HOOK_MAX) - hookAng) * 0.08; placeA();
    const cx = (T.x + BL.x + BR.x) / 3, cy = (T.y + BL.y + BR.y) / 3;
    const vcx = (cx - (T.px + BL.px + BR.px) / 3) / STEP;
    let moved = 0;
    for (const p of pts) {
      const vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp, vz = (p.z - p.pz) * damp;
      p.px = p.x; p.py = p.y; p.pz = p.z;
      if (p === A) continue;
      if (drag && p.card) { p.x += (drag.x - cx) * 0.3; p.y += (drag.y - cy) * 0.3; p.z += vz; }
      else { p.x += vx; p.y += vy + G * STEP * STEP; p.z += vz; }
      p.z *= 0.998;
      moved = Math.max(moved, Math.abs(p.x - p.px) + Math.abs(p.y - p.py) + Math.abs(p.z - p.pz));
    }
    // o balanço gira o cartão; a mola o traz de volta de frente
    const tw = drag ? 0 : vcx * TWIST * STEP;
    BL.z += tw; BR.z -= tw;
    const yaw = (BR.z - BL.z) * KF, pitch = (T.z - (BL.z + BR.z) / 2) * KF;
    BR.z += pitch - yaw; BL.z += pitch + yaw;
    for (let it = 0; it < ITER; it++) {
      for (let i = 0; i < N; i++) keep(pts[i], pts[i + 1], L / N, true);
      for (let i = 0; i < N - 1; i++) apart(pts[i], pts[i + 2], L / N * 1.75);   // fita de tecido: curva, mas não dobra em quina
      keep(T, BL, D); keep(T, BR, D); keep(BL, BR, W);
    }
    if (drag) {   // arrastando: o cartão não passa do comprimento da fita
      const dx = T.x - A.x, dy = T.y - A.y, d = Math.hypot(dx, dy), over = d - L * 1.02;
      if (over > 0) for (const p of cardPts) { p.x -= dx / d * over; p.y -= dy / d * over; }
    }
    return moved;
  }

  // ----- desenho -----
  const toW = (p, v) => v.set(p.x - cw / 2, ch / 2 - p.y, p.z);
  const vT = new THREE.Vector3(), vL = new THREE.Vector3(), vR = new THREE.Vector3();
  const up = new THREE.Vector3(), right = new THREE.Vector3(), nrm = new THREE.Vector3(), m = new THREE.Matrix4();
  const ctrl = Array.from({ length: N + 1 }, () => new THREE.Vector3());
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
  const smp = Array.from({ length: S }, () => new THREE.Vector3());
  const Z = new THREE.Vector3(0, 0, 1), tan = new THREE.Vector3(), side = new THREE.Vector3(), cr = new THREE.Vector3();
  function draw() {
    toW(T, vT); toW(BL, vL); toW(BR, vR);
    up.addVectors(vL, vR).multiplyScalar(0.5).subVectors(vT, up).normalize();
    right.subVectors(vR, vL); right.addScaledVector(up, -right.dot(up)).normalize();
    nrm.crossVectors(right, up);
    card.quaternion.setFromRotationMatrix(m.makeBasis(right, up, nrm));
    card.position.copy(vT);
    // parado, a faixa fica no alto à esquerda da foto; virar e inclinar o cartão a faz correr de lado
    glintTex.offset.x = THREE.MathUtils.clamp(0.47 - nrm.x * 1.6 - Math.atan2(right.y, right.x) * 0.45, 0, 2 / 3);

    for (let i = 0; i <= N; i++) toW(pts[i], ctrl[i]);
    for (let i = 0; i < S; i++) curve.getPoint(i / (S - 1), smp[i]);
    let u = 0;
    for (let i = 0; i < S; i++) {
      tan.subVectors(smp[Math.min(S - 1, i + 1)], smp[Math.max(0, i - 1)]).normalize();
      side.crossVectors(Z, tan).normalize();
      const k = THREE.MathUtils.smoothstep(i / (S - 1), 0.8, 1);   // perto do clipe a fita deita junto com o cartão
      cr.copy(right); if (cr.dot(side) < 0) cr.negate();
      side.lerp(cr, k).normalize().multiplyScalar(BAND / 2);
      if (i) u += smp[i].distanceTo(smp[i - 1]);
      const p = smp[i], o = i * 6, tu = u < LEAD ? -0.01 : (u - LEAD) / tile;   // -0.01 = fim da repetição, que é só fundo
      bandUv.set([tu, 0, tu, 1], i * 4);
      bandPos[o] = p.x - side.x; bandPos[o + 1] = p.y - side.y; bandPos[o + 2] = p.z - side.z;
      bandPos[o + 3] = p.x + side.x; bandPos[o + 4] = p.y + side.y; bandPos[o + 5] = p.z + side.z;
    }
    hook.position.set(P.x - cw / 2, ch / 2 - P.y, 0); hook.rotation.z = hookAng;
    cap.position.copy(smp[0]); cap.rotation.z = hookAng;
    bandGeo.attributes.position.needsUpdate = true;
    bandGeo.attributes.uv.needsUpdate = true;
    renderer.render(scene, camera);
  }

  // ----- laço: só roda enquanto a seção está na tela e algo se mexe -----
  let running = false, visible = true, last = 0, acc = 0, still = 0, since = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 1 / 60); last = t; acc += dt;
    pin();   // o título pode estar animando: o "g" muda de lugar
    let moved = 0;
    while (acc >= STEP) { moved = Math.max(moved, step()); acc -= STEP; }
    draw();
    still = moved < 0.05 && !drag ? still + dt : 0;
    since = drag ? 0 : since + dt;   // nunca fica rodando sozinho para sempre (tremidinhas de arredondamento)
    if (visible && still < 0.5 && since < 7) requestAnimationFrame(frame); else running = false;
  }
  const kick = () => { still = 0; since = 0; if (!running && visible && shown) { running = true; last = performance.now(); acc = 0; requestAnimationFrame(frame); } };

  layout(); hang(0); draw();
  about.classList.add('cracha-3d'); about.classList.remove('cracha-loading');
  markReady();
  const show = () => { shown = true; canvas.style.visibility = ''; kick(); };
  if (reduce) show();
  else whenTitleIn(() => { pin(); hang(0.5); show(); });   // aparece junto com o título, que o arrasta para a direita
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; kick(); }).observe(canvas);   // só o pedaço do crachá, não a seção inteira
  const relayout = () => { layout(); if (!running) draw(); kick(); };
  addEventListener('resize', relayout);
  addEventListener('load', relayout);
  setTimeout(relayout, 1800);   // depois da entrada do título

  // ----- arrastar: o canvas não recebe cliques (o texto embaixo continua clicável), então testa o cartão aqui -----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const local = (e) => { const ar = about.getBoundingClientRect(); return { x: e.clientX - ar.left, y: e.clientY - ar.top }; };
  // modo leve ligado no meio do uso: some o 3D e volta o crachá estático
  let dead = false;
  document.addEventListener('gr:leve', () => {
    dead = true; visible = false; drag = null; about.style.cursor = '';
    canvas.remove(); renderer.dispose(); about.classList.remove('cracha-3d'); lanyard();
  }, { once: true });
  function onCard(e) {
    if (!shown || dead) return false;
    const p = local(e);
    if (p.x < X0 || p.y < Y0 || p.x > X0 + vw || p.y > ch) return false;
    ndc.set((p.x - X0) / vw * 2 - 1, 1 - (p.y - Y0) / rh * 2);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(card, true).length > 0;
  }
  let off = null;
  about.addEventListener('touchstart', (e) => { if (onCard(e.touches[0])) e.preventDefault(); }, { passive: false });   // não rola a página
  about.addEventListener('pointerdown', (e) => {
    if (!onCard(e)) return;
    e.preventDefault();
    about.setPointerCapture(e.pointerId);
    const p = local(e);
    off = { x: p.x - (T.x + BL.x + BR.x) / 3, y: p.y - (T.y + BL.y + BR.y) / 3 };
    drag = { x: p.x - off.x, y: p.y - off.y };
    for (const c of cardPts) c.w = 0;
    about.style.cursor = 'grabbing';
    kick();
  });
  about.addEventListener('pointermove', (e) => {
    if (drag) { const p = local(e); drag.x = p.x - off.x; drag.y = p.y - off.y; kick(); }
    else if (e.pointerType === 'mouse') {
      const on = onCard(e), p = local(e);
      about.style.cursor = on ? 'grab' : '';
      if (on && hov) {   // mouse passando por cima: empurrãozinho na direção do movimento, o cartão balança de leve
        const dx = THREE.MathUtils.clamp(p.x - hov.x, -30, 30), dy = THREE.MathUtils.clamp(p.y - hov.y, -30, 30);
        for (const c of cardPts) { c.px -= dx * 0.04; c.py -= dy * 0.02; c.pz -= dx * 0.015; }
        kick();
      }
      hov = on ? p : null;
    }
  });
  let hov = null;
  const release = () => {
    if (!drag) return;
    drag = null;
    for (const c of cardPts) {   // solta com a velocidade do arrasto (limitada)
      c.w = 0.35;
      const vx = c.x - c.px, vy = c.y - c.py, s = Math.min(1, 25 / (Math.hypot(vx, vy) || 1));
      c.px = c.x - vx * s; c.py = c.y - vy * s;
    }
    about.style.cursor = '';
    kick();
  };
  about.addEventListener('pointerup', release);
  about.addEventListener('pointercancel', release);

  // ----- texturas -----
  function drawFront() {
    const k = 4, c = document.createElement('canvas'); c.width = W * k; c.height = H * k;
    const x = c.getContext('2d'); x.scale(k, k);
    const u = W / 260, pad = 12 * u;   // mesmas medidas do crachá do HTML (260px), em escala
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    hole(x, u, pad);
    const iy = pad + 18 * u, iw = W - pad * 2, ih = iw * 4 / 3;
    x.save(); x.beginPath(); x.roundRect(pad, iy, iw, ih, 10 * u); x.clip();
    x.drawImage(grayCover(iw * k, ih * k), pad, iy, iw, ih);
    x.restore();
    x.textBaseline = 'top';
    x.fillStyle = '#111'; x.font = `600 ${15 * u}px "Inter Tight", sans-serif`;
    x.fillText(fig.querySelector('figcaption strong').textContent, pad, iy + ih + 11 * u);
    x.fillStyle = '#6b6b6b'; x.font = `400 ${11.5 * u}px "Inter Tight", sans-serif`;
    x.fillText(fig.querySelector('figcaption span').textContent, pad, iy + ih + 31 * u);
    return c;
  }
  function hole(x, u, top) {
    x.fillStyle = '#e4e1dc'; x.beginPath(); x.roundRect((W - 46 * u) / 2, top, 46 * u, 8 * u, 4 * u); x.fill();
  }
  function grayCover(w, h) {   // foto P&B cortada em 3:4 (object-fit: cover)
    const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h);
    const x = c.getContext('2d'), s = Math.max(c.width / photo.naturalWidth, c.height / photo.naturalHeight);
    const dw = photo.naturalWidth * s, dh = photo.naturalHeight * s;
    x.drawImage(photo, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
    const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) a[i] = a[i + 1] = a[i + 2] = a[i] * 0.299 + a[i + 1] * 0.587 + a[i + 2] * 0.114;
    x.putImageData(d, 0, 0);
    return c;
  }
  function drawGlint() {   // 3 cartões de largura; a faixa fica no do meio: borda nítida à direita, some aos poucos à esquerda
    const k = 2, c = document.createElement('canvas'); c.width = W * 3 * k; c.height = H * k;
    const x = c.getContext('2d'); x.scale(k, k);
    x.translate(W * 1.5, H / 2); x.rotate(0.6);   // inclina para "/"
    const bw = W * 0.55, g = x.createLinearGradient(-bw, 0, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,.38)');
    x.fillStyle = g; x.fillRect(-bw, -H * 2, bw + 1.5, H * 4);
    return c;
  }
  function drawShadow() {
    const k = 2, m = 40, c = document.createElement('canvas'); c.width = (W + m * 2) * k; c.height = (H + m * 2) * k;
    const x = c.getContext('2d'); x.scale(k, k);
    x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 22 * k; x.shadowOffsetX = 10000 * k;   // só a sombra fica dentro do canvas
    x.fillStyle = '#000'; x.beginPath(); x.roundRect(m - 10000, m, W, H, W * 0.07); x.fill();
    return c;
  }
  function drawBand() {   // uma repetição do texto; a textura se repete ao longo da fita
    const text = 'GABRIEL RIBEIRO   •   FULL STACK   •   ', hpx = 64, font = `600 ${hpx * 0.42}px "Inter Tight", sans-serif`;
    const c = document.createElement('canvas'), x = c.getContext('2d');
    x.font = font; c.width = Math.ceil(x.measureText(text).width); c.height = hpx;
    x.fillStyle = '#111'; x.fillRect(0, 0, c.width, hpx);
    x.font = font; x.fillStyle = 'rgba(255,255,255,.8)'; x.textBaseline = 'middle';
    x.fillText(text, 0, hpx / 2 + 1);
    return c;
  }
}
