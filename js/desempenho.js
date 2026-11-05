// Roda no <head>, antes de tudo (sem defer), em todas as páginas.
//
// 1) Recarregar sempre volta ao topo: o navegador não devolve a posição da rolagem, o #âncora sai da URL
//    (senão ele pularia para a seção) e a página é levada ao topo até terminar de carregar. Ir e voltar
//    pelo histórico continua devolvendo a posição normal.
//
// 2) Modo leve (classe "leve" no <html>): em aparelho fraco o site desliga o que pesa (fundos animados,
//    onda do FAQ, crachá 3D, vídeos dos projetos, rolagem suave, desfoques) e mantém o resto.
//    A decisão é tomada aqui, antes de a hero aparecer, então ela já abre no modo certo:
//    - internet: economia de dados ou 2G;
//    - placa de vídeo: sem WebGL, WebGL por software ou placa conhecida por ser fraca;
//    - processador: um teste de ~12 ms (celular fraco faz menos de 1/5 das contas de um computador comum);
//    - até 2 núcleos ou 2 GB de memória (menos no Safari, que esconde esses números).
//    O perfil fica guardado por 30 dias (localStorage "gr-perfil-v2"); as próximas visitas não medem de novo.
//    Rede de segurança: se mesmo assim a página ficar abaixo de ~25 quadros por segundo por 4 s seguidos,
//    liga no meio do uso (engasgo isolado não conta) e vale até fechar a aba.
//    Para testar: ?leve=1 força o modo leve, ?leve=0 desliga. No console: grPerfil mostra o que foi medido
//    e document.documentElement.dataset.leve, o motivo.
//    Quem precisa reagir escuta document 'gr:leve' (o evento vem quando ele liga no meio do uso).
(() => {
  const html = document.documentElement;
  // Segmentos em galeria (js/segmentos.js): o layout dela vale desde a primeira pintura, senão a seção mudava de altura
  // quando o script rodasse e a página "pulava" (em celular fraco, ~1,7 s depois de abrir)
  try { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) html.classList.add('nc-gal-on'); } catch (e) { /* sem matchMedia */ }

  // ---------- 1) recarregar → topo ----------
  let reload = false;
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    reload = nav ? nav.type === 'reload' : performance.navigation && performance.navigation.type === 1;
  } catch (e) { /* navegador antigo: segue o padrão */ }
  if (reload) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
    const top = () => { if (scrollY || document.documentElement.scrollTop) window.scrollTo(0, 0); };
    top();
    document.addEventListener('DOMContentLoaded', top);
    addEventListener('load', () => { top(); requestAnimationFrame(top); setTimeout(top, 60); });
  }
  window.grReload = reload;

  // ---------- 2) modo leve ----------
  // A decisão sai antes da primeira pintura: a hero já abre no modo certo e nada desliga no meio da entrada.
  let force = null;
  try { force = new URLSearchParams(location.search).get('leve'); } catch (e) { /* sem URLSearchParams */ }
  const ss = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };
  if (force === '0') { ss('gr-leve', '0'); return; }

  const on = (why) => {
    if (html.classList.contains('leve')) return;
    html.classList.add('leve');
    html.dataset.leve = why;
    if (force !== '1') ss('gr-leve', '1');
    document.dispatchEvent(new CustomEvent('gr:leve', { detail: why }));
  };
  window.grLeve = on;

  // Perfil do aparelho: placa de vídeo + processador + memória. É do aparelho, não da visita, então fica
  // guardado (localStorage, 30 dias) e as próximas visitas nem medem de novo.
  const KEY = 'gr-perfil-v2';
  const profile = () => {
    try { const p = JSON.parse(localStorage.getItem(KEY)); if (p && Date.now() - p.t < 2592e6) return p; } catch (e) { /* sem storage */ }
    const p = { t: Date.now(), gpu: '', cpu: 0, why: '' };

    // placa de vídeo: sem WebGL, ou WebGL só por software (o navegador avisa com failIfMajorPerformanceCaveat),
    // ou uma placa conhecida por ser fraca
    try {
      const cv = document.createElement('canvas');
      const gl = cv.getContext('webgl', { failIfMajorPerformanceCaveat: true });
      if (!gl) p.why = 'gpu';
      else {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        p.gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
        if (/swiftshader|llvmpipe|softpipe|software|basic render|gdi generic|mali-[2-4]\d\d|mali-t[0-8]\d\d|mali-g[35]1\b|adreno\D*([1-4]\d\d|50\d)\b|powervr sgx|ge8\d{3}|videocore|\bgma\b|hd graphics( family)?\b(?! \d)|hd graphics [2-4]\d{3}\b/i.test(p.gpu)) p.why = 'gpu';
        const lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
    } catch (e) { p.why = 'gpu'; }

    // processador: quanta conta cabe em 3 ms, 4 vezes, valendo a melhor (uma interrupção só piora o número).
    // ~12 ms no total, antes de existir algo na tela. Computador comum ≈ 1500+, celular fraco < 350.
    const bench = () => {
      const a = new Float64Array(256);
      let x = 0, best = 0;
      for (let w = 0; w < 4; w++) {
        let n = 0;
        const end = performance.now() + 3;
        do { for (let i = 0; i < 200; i++) a[i & 255] = x = (x + Math.sqrt(n + i) * 1.0001) % 1e6; n += 200; }
        while (performance.now() < end && n < 4e5);   // teto: relógio impreciso (Firefox protegido) não trava
        if (n > best) best = n;
      }
      return Math.round(best / 100) + (a[7] < 0 ? 1 : 0);
    };
    p.cpu = bench();
    if (p.cpu < 350) p.cpu = Math.max(p.cpu, bench());   // confirma antes de concluir que é fraco

    const apple = /apple/i.test(p.gpu);   // Safari esconde memória e núcleos: ali vale só a medida
    const cores = navigator.hardwareConcurrency || 8, mem = navigator.deviceMemory || 8;
    if (!p.why && p.cpu < 350) p.why = 'cpu';
    if (!p.why && !apple && (cores <= 2 || mem <= 2)) p.why = 'aparelho';
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* sem storage */ }
    return p;
  };

  const c = navigator.connection || {};
  if (force === '1') on('forçado');
  else if (ss('gr-leve') === '1') on('sessão');
  else if (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')) on('dados');
  else {
    const p = profile();
    window.grPerfil = p;   // para conferir no console
    if (p.why) on(p.why);
  }
  if (html.classList.contains('leve') || ss('gr-leve') === '0') return;

  // ---------- rede de segurança: só para lentidão de verdade ----------
  // Um engasgo isolado (o three.js do crachá chegando, um vídeo começando) não conta. Mede em janelas de
  // 2 s (com a aba à vista, nos primeiros segundos depois da entrada e enquanto a pessoa rola) e só liga
  // se duas janelas seguidas tiverem a mediana abaixo de ~25 quadros por segundo. 30 fps fixos (modo
  // economia de bateria do iPhone) não contam como lento.
  let frames = [], spent = 0, bad = 0, last = 0, raf = 0, until = 0;
  const tick = (t) => {
    raf = 0;
    const dt = last ? t - last : 0;
    last = t;
    if (dt > 0 && dt < 250 && document.visibilityState === 'visible') { frames.push(dt); spent += dt; }
    if (spent >= 2000) {
      frames.sort((a, b) => a - b);
      bad = frames[frames.length >> 1] > 40 ? bad + 1 : 0;
      frames = []; spent = 0;
      if (bad >= 2) { on('fps'); removeEventListener('scroll', onScroll); return; }
    }
    if (performance.now() < until) raf = requestAnimationFrame(tick);
    else last = 0;
  };
  const watch = (ms) => { until = Math.max(until, performance.now() + ms); if (!raf) raf = requestAnimationFrame(tick); };
  const onScroll = () => watch(300);
  addEventListener('load', () => setTimeout(() => watch(4200), 2600), { once: true });   // depois da entrada da hero
  addEventListener('scroll', onScroll, { passive: true });
})();
