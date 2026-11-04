// Hero do portfólio: entrada animada (letras, palavras, foto, cards), números contando e
// parallax da foto, com GSAP. Quem prefere menos movimento (prefers-reduced-motion) vê tudo
// parado e os números finais; se o GSAP não carregar, tudo aparece normalmente.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// modo leve (js/desempenho.js): aparelho fraco; o que pesa fica desligado. Pode ligar no meio do uso ('gr:leve')
const leve = () => document.documentElement.classList.contains('leve');
const hero = document.querySelector('.hero');
const person = document.querySelector('.person');
// design amarelo atrás da foto e, no PC, o halo amarelo em volta da pessoa (camada própria, por cima do painel
// claro): andam junto com a foto
const art = [...document.querySelectorAll('.hero-art, .person-halo')];
const withArt = art.length ? [person, ...art] : person;
const { gsap, ScrollTrigger } = window;
const animate = Boolean(gsap && hero) && !reduceMotion;
// mesma condição do layout de celular no css/style.css
const MOBILE = '(max-width: 860px), (max-aspect-ratio: 4/5), (orientation: landscape) and (max-height: 500px) and (max-width: 1000px)';

// ---------- Números contando (0 → valor final) ----------
function countUp(el) {
  const end = Number(el.dataset.count), suffix = el.dataset.suffix || '';
  const duration = 1600;
  let start;
  const frame = (t) => {
    start ??= t;
    const p = Math.min((t - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);   // desacelera no fim
    el.textContent = Math.round(end * eased) + suffix;
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
const resetCount = (el) => { el.textContent = '0' + (el.dataset.suffix || ''); };

// ---------- Quebra do texto em letras e palavras ----------
// Cada linha/palavra fica dentro de uma "máscara" (overflow: hidden) e o texto sobe de baixo
// dela, como se fosse revelado. Leitores de tela leem o título pelo aria-label.
function splitChars(heading) {
  // &nbsp; vira o caractere de verdade: espaço comum some numa letra solta ("com IA" virava "comIA")
  const lines = heading.innerHTML.split(/<br\s*\/?>/i).map((l) => l.trim().replace(/&nbsp;/g, ' '));
  heading.setAttribute('aria-label', lines.join(' '));
  heading.innerHTML = lines.map((line) =>
    `<span class="line-mask" aria-hidden="true"><span class="line">${
      [...line].map((c) => `<span class="char">${c}</span>`).join('')
    }</span></span>`).join('');
  return heading.querySelectorAll('.char');
}

function splitWords(root) {
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.append(part); continue; }
          const mask = document.createElement('span');
          mask.className = 'word-mask';
          mask.innerHTML = '<span class="word"></span>';
          mask.firstChild.textContent = part;
          frag.append(mask);
        }
        const prev = child.previousSibling, first = frag.firstChild;
        child.replaceWith(frag);
        // pontuação colada num <em> ("Gabriel" + "."): junta os dois para não quebrar a linha entre eles
        if (prev?.nodeType === Node.ELEMENT_NODE && first?.classList?.contains('word-mask') && /^[.,;:!?…”"')]+$/.test(first.textContent)) {
          const keep = document.createElement('span');
          keep.className = 'nowrap';
          prev.before(keep);
          keep.append(prev, first);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child);
      }
    }
  };
  walk(root);
  return root.querySelectorAll('.word');
}

// ---------- Foto pronta (baixada e decodificada) ----------
// O molde da luz laranja (mask-image) é a mesma foto, já no cache quando ela termina de baixar.
// Trava de 6 s: nunca fica escondida.
function photoReady() {
  const img = person && person.querySelector('img');
  return new Promise((resolve) => {
    if (!img) return resolve();
    const done = () => (img.decode ? img.decode() : Promise.resolve()).then(resolve, resolve);
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', resolve, { once: true }); }
    setTimeout(resolve, 6000);
  });
}

// ---------- Entrada da hero (linha do tempo única, estilo awwwards) ----------
if (animate) {
  if (ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); if (window.grReload) ScrollTrigger.clearScrollMemory('manual'); }
  const $ = (s) => hero.querySelector(s), $$ = (s) => hero.querySelectorAll(s);
  const isMobile = matchMedia(MOBILE).matches;

  const chars = splitChars($('.intro h1'));
  const pitchWords = splitWords($('.pitch-text'));
  const smallWords = splitWords($('.pitch-small'));
  const quoteWords = splitWords($('.quote-card blockquote'));
  const nums = $$('[data-count]');
  nums.forEach(resetCount);

  // a foto é centralizada com translateX(-50%) no CSS; o GSAP passa a cuidar do transform
  gsap.set(withArt, { xPercent: -50, x: 0, y: 0 });

  // clearProps devolve o controle ao CSS no fim (efeitos de hover usam transform)
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  // marca: o G e o R se desenham igual ao hover (o cursor já pisca), depois o fio e o nome aparecem.
  // autoRound: false — sem ele o GSAP arredonda o px e o traço pulava de 1 para 0, sem desenhar
  tl.from($$('.logo .lg-s'), { strokeDashoffset: 1.05, autoRound: false, duration: 0.8, stagger: 0.1, ease: 'power2.inOut', clearProps: 'strokeDashoffset' }, 0.3)
    .from($('.logo-sep'), { scaleY: 0, duration: 0.8, clearProps: 'transform' }, 0.55)
    .from($('.logo-word'), { clipPath: 'inset(0% 100% 0% 0%)', duration: 1.1, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.55);
  // painel claro desenrola de cima para baixo (no celular ele fica mais abaixo: entra na rolagem)
  if (!isMobile) {
    tl.from($('.panel'), { clipPath: 'inset(0% 0% 100% 0% round 16px)', duration: 1.25, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.05);
  }
  tl.from(chars, { yPercent: 115, rotation: 8, transformOrigin: '0% 100%', duration: 1.25, stagger: 0.035 }, 0.3)
    .from($('.tag'), { clipPath: 'inset(0% 100% 0% 0% round 999px)', duration: 1.1, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.3)
    .from($$('.nav a'), { yPercent: -120, autoAlpha: 0, duration: 0.9, stagger: 0.06, clearProps: 'transform,opacity,visibility' }, 0.6)
    .from($('.btn-work'), { y: 30, scale: 0.9, autoAlpha: 0, duration: 1, clearProps: 'transform,opacity,visibility' }, 0.85)
    .from($$('.stat'), { y: 50, autoAlpha: 0, duration: 1.1, stagger: 0.1, clearProps: 'transform,opacity,visibility' }, 0.95)
    .call(() => nums.forEach(countUp), null, 1.05)
    .from($$('.socials a'), { scale: 0.3, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: 'back.out(2)', clearProps: 'transform,opacity,visibility' }, 1.1);

  // Foto: entra subindo e sendo descoberta de baixo para cima, sempre OPACA, e só depois de
  // baixada e decodificada inteira. Antes ela entrava esmaecendo (autoAlpha 0 → 1) no tempo
  // fixo de 0,5 s: o painel claro aparecia através dela ("branco por cima da foto, depois
  // atrás") e, com internet lenta, ela surgia pela metade. Se demorar, entra assim que chegar.
  gsap.set(person, { autoAlpha: 0 });
  if (art.length) gsap.set(art, { autoAlpha: 0, scale: 0.94, transformOrigin: '50% 45%' });
  photoReady().then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
    gsap.fromTo(person,
      // sobe de baixo da moldura, inteira e opaca (sem efeito de aparecer)
      // começa inteira abaixo da moldura (nada à vista enquanto espera)
      { autoAlpha: 1, yPercent: 100 },
      { yPercent: 0, duration: 1.4, ease: 'expo.out',
        delay: Math.max(0, 0.5 - tl.time()) });
    // o desenho amarelo aparece atrás quando a foto está chegando
    if (art.length) gsap.to(art, { autoAlpha: 1, scale: 1, duration: 1.3, ease: 'expo.out', delay: Math.max(0, 0.5 - tl.time()) + 0.55 });
  })));

  // card da citação: brilho que passa de tempos em tempos e, no PC (mouse), inclinação 3D seguindo o ponteiro.
  // Nada disso no modo leve.
  const card = $('.quote-card');
  const shine = document.createElement('span');
  shine.className = 'quote-shine'; shine.setAttribute('aria-hidden', 'true');
  card.append(shine);
  gsap.set(shine, { xPercent: -130 });
  function cardAlive() {
    if (leve()) return;
    gsap.fromTo(shine, { xPercent: -130 }, { xPercent: 130, duration: 1.3, ease: 'power2.inOut', repeat: -1, repeatDelay: 6.5 });
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    gsap.set(card, { transformPerspective: 900 });
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    const lift = gsap.quickTo(card, 'y', { duration: 0.7, ease: 'power3.out' });
    card.addEventListener('pointermove', (e) => {
      if (leve()) return;
      const r = card.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 10);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
      lift(-6);
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); lift(0); });
  }

  // conteúdo do painel: selo, apresentação palavra por palavra e card da citação
  const panelIn = (t, at) => t
    .from($('.badge'), { scale: 0.6, autoAlpha: 0, duration: 0.8, ease: 'back.out(2)', clearProps: 'transform,opacity,visibility' }, at)
    .from(pitchWords, { yPercent: 110, duration: 1, stagger: 0.025 }, at + 0.05)
    .from(smallWords, { yPercent: 110, duration: 0.8, stagger: 0.03 }, at + 0.4)
    // card da citação: levanta em 3D (dobrado para trás, de baixo), a foto salta, nome e cargo deslizam, as
    // palavras sobem e um brilho passa por cima; no PC depois ele inclina seguindo o mouse
    .fromTo(card, { y: 70, rotationX: -24, scale: 0.94, autoAlpha: 0, transformPerspective: 900, transformOrigin: '50% 100%' },
      { y: 0, rotationX: 0, scale: 1, autoAlpha: 1, duration: 1.4, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, at + 0.3)
    .from($('.quote-head img'), { scale: 0.3, rotation: -14, autoAlpha: 0, duration: 0.9, ease: 'back.out(2.2)', clearProps: 'transform,opacity,visibility' }, at + 0.55)
    .from($$('.quote-head strong, .quote-head span'), { x: -18, autoAlpha: 0, duration: 0.8, stagger: 0.08, clearProps: 'transform,opacity,visibility' }, at + 0.62)
    .from(quoteWords, { yPercent: 110, duration: 0.9, stagger: 0.03 }, at + 0.7)
    .call(cardAlive, null, at + 1.35);
  if (!isMobile) {
    panelIn(tl, 0.7);
  } else {
    panelIn(gsap.timeline({
      defaults: { ease: 'expo.out' },
      scrollTrigger: ScrollTrigger ? { trigger: $('.panel'), start: 'top 85%', once: true } : undefined,
    }), 0);
  }
} else if (!reduceMotion) {
  // sem GSAP: os números contam quando aparecem na tela
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      countUp(entry.target);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => { resetCount(el); io.observe(el); });
}

// ---------- Parallax da foto (GSAP) ----------
// Só a foto tem parallax. No PC ela segue o mouse; no celular (sem mouse) ela anda mais
// devagar que a página na rolagem.
if (animate && person) {
  const mm = gsap.matchMedia();
  mm.add('(hover: hover) and (pointer: fine)', () => {
    // 1,8 s para alcançar o mouse (antes 0,9 s): o usuário pediu a foto mais lenta
    const toX = gsap.quickTo(person, 'x', { duration: 1.8, ease: 'power3.out' });
    const toY = gsap.quickTo(person, 'y', { duration: 1.8, ease: 'power3.out' });
    const artX = art.length ? gsap.quickTo(art, 'x', { duration: 1.8, ease: 'power3.out' }) : () => {};
    const artY = art.length ? gsap.quickTo(art, 'y', { duration: 1.8, ease: 'power3.out' }) : () => {};
    const move = (e) => {
      const r = hero.getBoundingClientRect();
      const mx = (((e.clientX - r.left) / r.width) * 2 - 1) * 18, my = (((e.clientY - r.top) / r.height) * 2 - 1) * 11;   // antes 26/16 px
      toX(mx); toY(my); artX(mx); artY(my);
    };
    const reset = () => { toX(0); toY(0); artX(0); artY(0); };
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', reset);
    return () => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', reset); };
  });
  mm.add('not ((hover: hover) and (pointer: fine))', () => {
    if (!ScrollTrigger) return;
    gsap.to(withArt, { y: () => innerHeight * 0.18, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
  });
  // PC: descendo a página, a foto desce junto (30% da altura dela até a hero sair da tela);
  // subindo, volta. Usa yPercent: o y fica com o parallax do mouse. (No celular já existe o
  // mesmo efeito acima, com y.)
  mm.add('(hover: hover) and (pointer: fine)', () => {
    if (!ScrollTrigger) return;
    gsap.to(withArt, { yPercent: 30, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
  });
}

document.documentElement.classList.remove('gsap-loading');   // mesmo sem GSAP, tudo aparece

// selos das seções (Sobre mim, Projetos): o fio cresce quando cada um aparece na tela
document.querySelectorAll('.about-kicker').forEach((k) => {
  if (!('IntersectionObserver' in window)) { k.classList.add('is-in'); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { k.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.6 });
  io.observe(k);
});
// ---------- Rolagem suave leve (Lenis) ----------
// só no mouse/touchpad; inércia curta (lerp alto) para não "prender" entre seções.
// Celular segue com a rolagem nativa.
// No modo leve fica a rolagem nativa (e ela é desligada se o modo leve ligar no meio do uso).
if (window.Lenis && !reduceMotion && !leve() && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true, anchors: true, autoRaf: !window.gsap });
  const raf = (t) => lenis.raf(t * 1000);
  if (window.gsap) {
    if (ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
  }
  if (window.grReload) lenis.scrollTo(0, { immediate: true, force: true });
  // Barra de rolagem do navegador ou teclado no meio de uma rolagem animada (ex.: "Ver meus projetos" leva ~1,7 s
  // descendo): o Lenis ignorava a barra e continuava puxando a página para o destino, e ela parecia travada.
  // Agora qualquer um dos dois cancela a animação na hora e a rolagem volta a ser da pessoa.
  const cancel = () => { if (lenis.isScrolling === 'smooth') lenis.scrollTo(lenis.actualScroll, { immediate: true, force: true }); };
  // clique na barra: fora da área do conteúdo (barra clássica) ou na borda direita da própria página (barra fina por cima, Mac)
  const onBar = (e) => { const w = document.documentElement.clientWidth; if (e.clientX >= w || (e.target === document.documentElement && e.clientX >= w - 20)) cancel(); };
  addEventListener('pointerdown', onBar, { passive: true });
  addEventListener('mousedown', onBar, { passive: true });
  addEventListener('keydown', (e) => { if (/^(Arrow|Page|Home|End| )/.test(e.key)) cancel(); });
  document.addEventListener('gr:leve', () => { if (window.gsap) gsap.ticker.remove(raf); lenis.destroy(); }, { once: true });
}

// Para todos: as animações de enfeite (fundos que se mexem, brilhos, letreiro, a marca GR) param quando a
// parte delas sai da tela e voltam quando ela aparece (o navegador não gasta tempo pintando o que não se vê)
if ('IntersectionObserver' in window) {
  const logo = document.querySelector('.logo-mark');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    e.target.classList.toggle('is-off', !e.isIntersecting);
    if (logo && e.target.classList.contains('hero')) (e.isIntersecting && !leve() ? logo.unpauseAnimations() : logo.pauseAnimations());
  }), { rootMargin: '120px 0px' });
  document.querySelectorAll('.hero, .about-title, .stack, .faq-bg, .faq-marquee, .site-footer, .doc-hero').forEach((el) => io.observe(el));
}
// modo leve: a marca GR fica parada (o degradê que corre redesenha o traço com sombra a cada quadro)
const stopLogo = () => { const l = document.querySelector('.logo-mark'); if (l) l.pauseAnimations(); };
if (leve()) stopLogo();
document.addEventListener('gr:leve', stopLogo);

// "O que eu entrego": o fio laranja desce junto com a rolagem (a ponta fica a 60% da altura da tela),
// com um leve atraso para ficar macio; o item acende quando o fio passa do começo dele. No mesmo quadro
// em que desenha o fio, chama a gota dos Projetos (dropFrame, mais abaixo) com o mesmo valor, para ela
// pousar exatamente onde a bolinha da ponta está.
let dropFrame = null, lineGo = () => {};
document.querySelectorAll('.about-areas ol').forEach((list) => {
  const items = [...list.children];
  if (reduceMotion) { list.style.setProperty('--p', 1); items.forEach((li) => li.classList.add('is-on')); }
  else {
    list.classList.add('is-live');
    let cur = 0, raf = 0, hgt = 0, tops = [];
    // medidas dos itens guardadas (mudam só quando a lista muda de tamanho): o quadro só lê a posição na tela
    const measure = () => { hgt = list.offsetHeight; tops = items.map((li) => li.offsetTop + li.offsetHeight * 0.3); };
    measure();
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(list);
    const tick = () => {
      const r = list.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
      cur += (t - cur) * 0.12;
      if (Math.abs(t - cur) < 0.0005) cur = t;
      const p = Number(cur.toFixed(4));
      if (dropFrame) dropFrame(p, r);   // antes de mexer no fio: a gota lê a tela sem forçar outro layout
      list.style.setProperty('--p', p);
      const tip = p * hgt;
      items.forEach((li, i) => li.classList.toggle('is-on', tip >= tops[i]));
      raf = cur === t ? 0 : requestAnimationFrame(tick);
    };
    lineGo = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('scroll', lineGo, { passive: true });
    addEventListener('resize', lineGo);
    lineGo();
  }
});

// Projetos: carrossel de notebooks 3D (o desenho e as animações estão no css/style.css). O primeiro
// notebook abre quando aparece na tela; setas, teclado (← →) e arrastar para o lado trocam de projeto:
// o atual fecha e sai, o próximo entra pelo outro lado e abre. A tela só rola com a seção à vista.
{
  const pj = document.querySelector('.pj');
  const slides = pj ? [...pj.querySelectorAll('.pj-slide')] : [];
  if (slides.length) {
    const count = pj.querySelector('.pj-count b'), dots = [...pj.querySelectorAll('.pj-dots i')];
    let cur = -1, inView = false;
    // vídeo do site na tela: começa do início quando a tampa termina de abrir (css: 1.3s + 1.3s) e só toca
    // com a seção à vista; o do notebook que saiu para depois que ele some
    const vid = (s) => s && s.querySelector('.lp-screen video');
    // dois tamanhos de cada vídeo: 960px (PC e tablet) e 720px (notebook pequeno, no celular); só baixa quando for tocar
    const load = (v) => {
      if (!v || v.src) return;
      v.src = v.dataset.src + (v.parentElement.offsetWidth >= 420 ? '-960.mp4' : '-720.mp4');
      v.preload = 'auto';
    };
    const playVideo = (s, old) => {
      const o = vid(old);
      if (o) { o.canStart = false; setTimeout(() => { if (old !== slides[cur]) { o.pause(); o.classList.remove('is-on'); } }, 700); }
      const v = vid(s);
      if (!v || reduceMotion || leve()) return;   // modo leve: fica a captura rolando, sem baixar nem tocar vídeo
      clearTimeout(v.startTimer);
      v.canStart = false;
      v.pause();
      v.classList.remove('is-on');
      load(v);
      v.startTimer = setTimeout(() => {
        if (s !== slides[cur]) return;
        v.canStart = true;
        v.currentTime = 0;
        if (inView) v.play().catch(() => {});
      }, 1300);
    };
    slides.forEach((s) => {
      const v = vid(s);
      if (v) v.addEventListener('playing', () => v.classList.add('is-on'));
    });
    document.addEventListener('gr:leve', () => slides.forEach((s) => {
      const v = vid(s);
      if (v) { clearTimeout(v.startTimer); v.canStart = false; v.pause(); v.classList.remove('is-on'); }
    }));
    const show = (i, dir = 1) => {
      i = (i + slides.length) % slides.length;
      if (i === cur) return;
      const old = slides[cur], next = slides[i];
      if (old) {
        old.style.setProperty('--x', -dir);
        old.classList.replace('is-active', 'is-leaving');
        old.inert = true;
        clearTimeout(old.leaveTimer);
        old.leaveTimer = setTimeout(() => old.classList.remove('is-leaving'), 700);   // depois de sumir (css: visibility .. .6s)
      }
      // o próximo vai para o lado de onde vem sem animar (ele e o notebook: senão o notebook
      // atravessava a tela e entrava pelo lado errado), e só então entra
      clearTimeout(next.leaveTimer);
      next.classList.remove('is-leaving');
      const lap = next.querySelector('.laptop');
      next.style.transition = 'none'; if (lap) lap.style.transition = 'none';
      next.style.setProperty('--x', dir); next.offsetWidth;
      next.style.transition = ''; if (lap) lap.style.transition = '';
      next.classList.add('is-active');
      next.inert = false;
      cur = i;
      playVideo(next, old);
      count.textContent = String(i + 1).padStart(2, '0');
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
    };
    const step = (dir) => show(Math.max(cur, 0) + dir, dir);
    slides.forEach((s, k) => { s.inert = k > 0; });

    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); if (cur < 0) show(0); } }, { threshold: 0.15 })
        .observe(slides[0].querySelector('.laptop'));
      new IntersectionObserver(([e]) => {
        inView = e.isIntersecting;
        pj.classList.toggle('is-paused', !inView);
        const v = vid(slides[cur]);
        if (v && v.canStart) { if (inView) v.play().catch(() => {}); else v.pause(); }
      }).observe(pj);
      // o vídeo do primeiro projeto começa a baixar quando a seção chega perto
      new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); if (!leve()) load(vid(slides[0])); } }, { rootMargin: '600px 0px' })
        .observe(pj);
    } else show(0);

    pj.querySelectorAll('.pj-arrow').forEach((b) => b.addEventListener('click', () => step(Number(b.dataset.dir))));
    pj.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
    });

    // arrastar para o lado (dedo ou mouse): mais de 50px na horizontal troca de projeto
    let sx = null, sy = 0;
    pj.querySelector('.pj-track').addEventListener('pointerdown', (e) => { if (e.button === 0) { sx = e.clientX; sy = e.clientY; } });
    addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1);
    });
    addEventListener('pointercancel', () => { sx = null; });

    // no PC o notebook inclina um pouco seguindo o mouse
    if (!reduceMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      pj.addEventListener('pointermove', (e) => {
        const r = pj.getBoundingClientRect();
        pj.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        pj.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      pj.addEventListener('pointerleave', () => { pj.style.setProperty('--mx', 0); pj.style.setProperty('--my', 0); });
    }
  }
}

// Saída dos Projetos (escuro → claro): a borda de baixo do painel pende como uma gota e se recolhe
// com a rolagem (curva SVG); a gota laranja fica pendurada no ponto mais fundo, se estica, se solta, cai
// num arco e pousa na bolinha da ponta do fio de "O que eu entrego", que dá um pulso.
// p vai de 0 (topo da curva no pé da tela) a 1 (no topo da tela) e sai da posição REAL da curva a cada
// quadro, junto com o fio. Antes ele vinha de um scrub atrasado: durante a rolagem a gota descolava da
// curva (até 100 px abaixo da ponta) e pousava longe da bolinha (que tem o próprio atraso).
if (animate) {
  const curve = document.querySelector('.pj-curve');
  const svg = curve && curve.querySelector('svg');
  const path = curve && curve.querySelector('path');
  const drop = curve && curve.querySelector('.pj-drop');
  // a gota só cai no fio de "O que eu entrego" quando ele vem logo depois dos Projetos; senão ela fica pendurada na
  // curva e some junto com ela (modo sem fio)
  const next = curve && curve.closest('.projects').nextElementSibling;
  const line = next && next.matches('.about-areas') ? next.querySelector('ol') : null;
  if (path && drop) {
    const inOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);   // power2.inOut
    const outQ = (x) => 1 - (1 - x) * (1 - x);
    const REL = 0.6, ARR = 0.85;   // solta com a curva a 40% da tela; pousa com ela a 15%
    const R = 7;                    // raio da gota (14 px no css)
    const SX = 0.88, SY = 1.35;     // esticada, no instante em que se solta
    let merged = null, lastD = '', hidden = false, H = 0, lt = 0, lh = 0;
    // medidas que só mudam com o tamanho da tela: altura da curva e a borda/altura interna da lista
    const measure = () => { H = svg.getBoundingClientRect().height; if (line) { lt = line.clientTop; lh = line.clientHeight; } };
    measure();
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(measure); ro.observe(svg); if (line) ro.observe(line); }
    const depth = (p) => 1 - inOut(Math.min(1, p / 0.8));   // 1 = gota funda, 0 = borda reta
    // lê tudo primeiro (curva e lista na tela), escreve no fim: nenhum layout forçado no meio do quadro
    dropFrame = (lineP, lr) => {
      const v = innerHeight, cr = curve.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (v - cr.top) / v));
      if (merged === null) merged = p >= ARR;   // página aberta já mais abaixo: sem pulso na chegada
      const d = depth(p);
      const dAttr = `M0 0H1440Q720 ${(400 * d).toFixed(1)} 0 0Z`;
      if (dAttr !== lastD) { path.setAttribute('d', dAttr); lastD = dAttr; }
      // longe da tela (antes de a curva aparecer ou depois do pouso): só garante a gota apagada
      if (p <= 0 || (p >= ARR && merged)) {
        if (!hidden) { drop.style.opacity = '0'; hidden = true; }
        if (p >= ARR) return;
        merged = false;
        return;
      }
      hidden = false;
      // posições em relação à curva (que anda junto com a página): a queda acontece "no mundo" da página,
      // como uma gota de verdade, e não oscila com a rolagem
      let x = 0, y, sx, sy, op;
      if (p < REL || !line) {
        // pendurada na ponta da curva (o topo da gota encosta na borda), esticando aos poucos
        const s = Math.min(1, p / REL);
        sx = 1 - (1 - SX) * s; sy = 1 + (SY - 1) * s;
        y = d * H + R * sy - 3;
        op = Math.min(1, p * 8) * (line || p < REL ? 1 : 1 - (p - REL) / (1 - REL));
        merged = false;
      } else {
        const q = Math.min(1, (p - REL) / (ARR - REL));
        const yr = depth(REL) * H + R * SY - 3;                   // onde ela se soltou
        const xb = lr.left + 0.5 - (cr.left + cr.width / 2);      // bolinha do fio, onde ela está agora
        const yb = lr.top + lt + lineP * lh - cr.top;
        x = xb * outQ(q);                                         // sai de lado depressa e assenta
        y = yr + (yb - yr) * q * q;                               // e cai acelerando
        const k = 1 - 0.36 * q, w = Math.sin(q * Math.PI);        // encolhe até o tamanho da bolinha (9 px)
        const r = outQ(Math.min(1, q / 0.18));                    // desfaz o esticado logo depois de soltar
        sx = SX + (k * (1 + 0.16 * w) - SX) * r;
        sy = SY + (k * (1 - 0.1 * w) - SY) * r;
        op = q < 0.94 ? 1 : (1 - q) / 0.06;
        if (q >= 1 && !merged) {                                 // encontrou: a bolinha do fio dá um pulso
          merged = true;
          line.classList.remove('is-merge'); void line.offsetWidth; line.classList.add('is-merge');
        } else if (q < 1) merged = false;
      }
      drop.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      drop.style.opacity = op.toFixed(3);
    };
    if (line) lineGo();
    else { const f = () => dropFrame(0, null); addEventListener('scroll', f, { passive: true }); f(); }
  }
}

// Stack: os números (tecnologias, áreas, projetos) contam de 0 até o valor quando aparecem na tela, um depois
// do outro, desacelerando no fim; cada um sobe um pouco e ganha um brilho que apaga quando chega. Fica no valor
// final para quem prefere menos movimento ou sem IntersectionObserver.
{
  const nums = [...document.querySelectorAll('[data-conta]')];
  if (nums.length && !reduceMotion && 'IntersectionObserver' in window) {
    const box = nums[0].closest('ul');
    nums.forEach((el) => { el.style.minWidth = `${String(el.dataset.conta).length}ch`; el.textContent = '0'; });
    box.classList.add('conta-pronta');
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      o.disconnect();
      box.classList.add('conta-on');
      nums.forEach((el, i) => {
        const end = Number(el.dataset.conta), dur = 1500 + end * 12, delay = i * 160;
        let t0;
        const f = (t) => {
          t0 ??= t + delay;
          const p = Math.max(0, Math.min((t - t0) / dur, 1));
          el.textContent = Math.round(end * (1 - Math.pow(2, -10 * p)));
          if (p < 1) requestAnimationFrame(f); else { el.textContent = end; el.classList.add('conta-fim'); }
        };
        requestAnimationFrame(f);
      });
    }, { threshold: 0.6 }).observe(box);
  }
}

// Projetos: o holofote laranja do fundo segue o mouse
(() => {
  const pj = document.querySelector('.pj'), bg = pj && pj.querySelector('.pj-bg');
  if (!bg || matchMedia('(hover: none)').matches) return;
  pj.addEventListener('pointermove', (e) => {
    if (leve()) return;   // modo leve: o holofote fica parado (repintar a máscara do fundo a cada movimento pesa)
    const r = pj.getBoundingClientRect();
    bg.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    bg.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
})();

// Perguntas frequentes: abre uma por vez (todas chegam fechadas); a resposta fechada fica
// "inert" para não ser lida nem focada. A lista entra em cascata quando aparece na tela.
{
  const faq = document.querySelector('.faq');
  const items = faq ? [...faq.querySelectorAll('.faq-item')] : [];
  const set = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('button').setAttribute('aria-expanded', open);
    item.querySelector('.faq-a').inert = !open;
  };
  items.forEach((item) => {
    set(item, false);
    item.querySelector('button').addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      items.forEach((o) => set(o, o === item && open));
    });
  });
  // a onda do fundo só balança com a seção à vista (e fica parada para quem prefere menos movimento)
  const wave = faq && faq.querySelector('.faq-wave');
  // Onde a onda termina (máscara do .faq-bg). PC: vai inteira até a chamada final e desce um pouco por trás da borda
  // em ondas dela (o laranja continua sem emenda no topo laranja da faixa). Celular: some num degradê logo depois da
  // coluna da esquerda, antes da primeira pergunta (--wy).
  // Desempenho: nada disso roda durante a animação de abrir uma resposta; tudo é refeito 150 ms depois que o tamanho
  // do FAQ para de mudar (settle).
  if (wave && 'ResizeObserver' in window) {
    const side = faq.querySelector('.faq-side'), cta = faq.querySelector('.about-cta'), bg = faq.querySelector('.faq-bg');
    const phone = matchMedia('(max-width: 860px)');
    const shape = wave.querySelector('#fw-shape');
    const put = (el, k, v) => { if (el.style.getPropertyValue(k) !== v) el.style.setProperty(k, v); };
    // fim da onda e --wy: gravados só no settle(). O fim fica 90 + 400 px abaixo do topo da chamada final (escondido
    // atrás dela), então continua coberto mesmo quando uma resposta abre e a chamada desce, sem recalcular nada por quadro
    const marks = () => {
      const end = cta.offsetTop + 3 + 90 + 400;
      ['0px', '0px', '0px', '0px', end + 'px', (end + 1) + 'px'].forEach((v, i) => put(bg, `--m${i + 1}`, v));
      put(bg, '--wy', Math.round(side.offsetTop + side.offsetHeight + 4 + 3) + 'px');
    };
    // ponto da borda da onda (unidades do desenho) na altura uy: o primeiro ponto laranja vindo da direita
    // (passo de 4 e depois refinamento de 1: ~4x menos testes)
    const edgeAt = (uy, from) => {
      let x = from;
      for (; x > -200; x -= 4) if (shape.isPointInFill(new DOMPoint(x, uy))) break;
      if (x <= -200) return -1;
      for (let y = Math.min(from, x + 4); y >= x; y -= 1) if (shape.isPointInFill(new DOMPoint(y, uy))) return y;
      return x;
    };
    // PC: a borda de cima da chamada final sai da onda laranja da esquerda. Acha onde a borda da onda cruza o topo
    // da faixa e desenha dali uma curva que desce na mesma direção, arredonda e segue em ondas até a direita
    const edge = () => {
      if (phone.matches || !shape || !shape.isPointInFill) { cta.style.removeProperty('--ctop'); cta.style.removeProperty('--ex'); return; }
      const wr = wave.getBoundingClientRect(), cr = cta.getBoundingClientRect();
      const k = Math.max(wr.width / 420, wr.height / 2400), uy = (cr.top - wr.top) / k;
      const ux = edgeAt(uy, 420);
      if (ux < 0) { cta.style.removeProperty('--ctop'); return; }
      const ux2 = Math.max(ux, edgeAt(uy - 24 / k, ux + 40));
      const sl = Math.max(-2.5, Math.min(0, -(ux2 - ux) * k / 24));
      const W = Math.round(cr.width), H = Math.min(84, Math.max(56, innerWidth * 0.054));
      const ex = wr.left + ux * k - cr.left, yb = H * 0.82, bx = ex + sl * H * 0.5 + H * 1.6, x1 = bx + (W - bx) * 0.5;
      const f = (v) => v.toFixed(1);
      const d = `M0 0H${f(ex)}C${f(ex + sl * H * 0.45)} ${f(H * 0.45)} ${f(bx - H * 1.1)} ${f(yb)} ${f(bx)} ${f(yb)}`
        + `C${f(bx + (x1 - bx) * 0.45)} ${f(yb)} ${f(x1 - (x1 - bx) * 0.45)} ${f(H * 0.2)} ${f(x1)} ${f(H * 0.22)}`
        + `C${f(x1 + (W - x1) * 0.4)} ${f(H * 0.24)} ${f(W - (W - x1) * 0.35)} ${f(H * 0.5)} ${f(W)} ${f(H * 0.36)}V${f(H)}H0Z`;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${f(H)}' preserveAspectRatio='none'><path d='${d}'/></svg>`;
      put(cta, '--ctop', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
      put(cta, '--ex', Math.round(ex) + 'px');
    };
    // Altura do fundo da onda fixa em px (altura do FAQ + 400 px de folga), refeita só quando o tamanho para de mudar.
    // Sem isso, abrir uma resposta mudava a altura do fundo a cada quadro e o navegador redesenhava a camada inteira
    // (enorme, com máscara) em todos os quadros: era o que travava. A sobra abaixo do fim da onda é transparente.
    // crista (a área clara que sobe para dentro da Stack): começa exatamente na borda da onda no topo do FAQ. No celular
    // o desenho da onda é escalado pela altura (o FAQ é alto), então a posição da borda muda de aparelho para aparelho e
    // é medida aqui; se a borda cai fora da tela (celular estreito), o laranja vai até a borda e a crista some
    const crest = faq.querySelector('.faq-crest');
    const crestFit = () => {
      if (!crest || !shape || !shape.isPointInFill) return;
      const wr = wave.getBoundingClientRect(), fr = faq.getBoundingClientRect();
      const k = Math.max(wr.width / 420, wr.height / 2400), ux = edgeAt((fr.top - wr.top) / k, 420);
      const left = wr.left + ux * k - fr.left - 1, w = fr.width - left + 2;
      if (ux < 0 || w < 18) { put(crest, 'display', 'none'); return; }
      put(crest, 'display', ''); put(crest, 'left', left.toFixed(1) + 'px'); put(crest, 'width', w.toFixed(1) + 'px');
    };
    const settle = () => { put(bg, 'height', (faq.offsetHeight + 400) + 'px'); marks(); edge(); crestFit(); };
    let t = 0;
    const fit = () => { clearTimeout(t); t = setTimeout(settle, 150); };
    settle();
    new ResizeObserver(fit).observe(faq);
    phone.addEventListener('change', settle);
  }
  if (wave && (reduceMotion || !('IntersectionObserver' in window))) { if (reduceMotion) wave.pauseAnimations(); }
  else if (wave) {
    wave.pauseAnimations();
    new IntersectionObserver(([e]) => (e.isIntersecting && !leve() ? wave.unpauseAnimations() : wave.pauseAnimations())).observe(faq);
    document.addEventListener('gr:leve', () => wave.pauseAnimations());   // modo leve: a borda da onda fica parada
  }
  if (faq && !reduceMotion && 'IntersectionObserver' in window) {
    // entrada: a coluna da esquerda e cada pergunta animam quando aparecem; as que chegam juntas entram em
    // cascata (80 ms). Quando tudo entrou, as classes saem, para o atraso não atrasar o abrir/fechar
    const grid = faq.querySelector('.faq-grid'), side = faq.querySelector('.faq-side');
    const parts = [side, ...items];
    let left = parts.length;
    grid.classList.add('faq-live');
    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e, k) => {
        e.target.style.setProperty('--d', (k * 0.08).toFixed(2) + 's');
        e.target.classList.add('is-in');
        io.unobserve(e.target);
        if (--left === 0) setTimeout(() => {   // troca o fio desenhado pela borda sem transição (não pisca)
          items.forEach((el) => { el.style.transition = 'none'; });
          grid.classList.remove('faq-live');
          parts.forEach((el) => { el.classList.remove('is-in'); el.style.removeProperty('--d'); });
          requestAnimationFrame(() => requestAnimationFrame(() => items.forEach((el) => { el.style.transition = ''; })));
        }, 2600);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    parts.forEach((el) => io.observe(el));
  }
}

// Segmentos no celular: os cartões viram um carrossel; as setas levam ao anterior/próximo e o contador mostra qual
// está no centro (número e nome). Tudo segue a rolagem, então arrastar com o dedo também atualiza o contador.
{
  const grid = document.querySelector('.nc-grid'), ctrl = document.querySelector('.nc-ctrl');
  if (grid && ctrl) {
    const cards = [...grid.querySelectorAll('.nc-card')], [prev, next] = ctrl.querySelectorAll('.nc-arrow');
    const num = ctrl.querySelector('.nc-count b'), name = ctrl.querySelector('.nc-count em');
    let cur = -1, raf = 0;
    const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : grid.clientWidth);
    const update = () => {
      raf = 0;
      const i = Math.max(0, Math.min(cards.length - 1, Math.round(grid.scrollLeft / step())));
      if (i === cur) return;
      cur = i;
      num.textContent = String(i + 1).padStart(2, '0');
      name.textContent = cards[i].querySelector('h3').textContent;
      prev.disabled = i === 0;
      next.disabled = i === cards.length - 1;
    };
    grid.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    [prev, next].forEach((b) => b.addEventListener('click', () => {
      const i = Math.max(0, Math.min(cards.length - 1, cur + Number(b.dataset.dir)));
      grid.scrollTo({ left: i * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
    update();
  }
}

// Segmentos: título, texto e cartões entram em cascata quando a seção aparece (depois as classes saem, para o hover
// dos cartões não herdar o atraso da cascata)
{
  const ni = document.querySelector('.nichos');
  if (ni && !reduceMotion && 'IntersectionObserver' in window) {
    ni.classList.add('ni-live');
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      ni.classList.add('is-in');
      setTimeout(() => ni.classList.remove('ni-live', 'is-in'), 2600);
    }, { threshold: 0.12 });
    io.observe(ni);
  }
}
