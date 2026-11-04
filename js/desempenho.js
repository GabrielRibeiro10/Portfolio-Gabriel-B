// Roda no <head>, antes de tudo (sem defer), em todas as páginas.
//
// 1) Recarregar sempre volta ao topo: o navegador não devolve a posição da rolagem, o #âncora sai da URL
//    (senão ele pularia para a seção) e a página é levada ao topo até terminar de carregar. Ir e voltar
//    pelo histórico continua devolvendo a posição normal.
//
// 2) Modo leve (classe "leve" no <html>): em aparelho fraco o site desliga o que pesa (fundos animados,
//    onda do FAQ, crachá 3D, vídeos dos projetos, rolagem suave, desfoques) e mantém o resto. Liga por:
//    - sinais do aparelho: economia de dados, internet 2G, até 2 núcleos ou 2 GB de memória, ou celular
//      com até 4 núcleos e 4 GB;
//    - medida real: se a página roda abaixo de ~36 quadros por segundo depois da entrada, ou travando
//      enquanto a pessoa rola. A decisão fica guardada na sessão (as outras páginas já abrem leves).
//    Para testar: ?leve=1 força o modo leve, ?leve=0 desliga a detecção.
//    Quem precisa reagir escuta document 'gr:leve' (o evento vem quando ele liga no meio do uso).
(() => {
  const html = document.documentElement;

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
  let force = null;
  try { force = new URLSearchParams(location.search).get('leve'); } catch (e) { /* sem URLSearchParams */ }
  const store = (v) => { try { sessionStorage.setItem('gr-leve', v); } catch (e) { /* bloqueado */ } };
  const stored = () => { try { return sessionStorage.getItem('gr-leve'); } catch (e) { return null; } };
  if (force === '0') { store('0'); return; }

  const on = (why) => {
    if (html.classList.contains('leve')) return;
    html.classList.add('leve');
    html.dataset.leve = why;
    if (force !== '1') store('1');
    document.dispatchEvent(new CustomEvent('gr:leve', { detail: why }));
  };
  window.grLeve = on;

  const c = navigator.connection || {};
  const cores = navigator.hardwareConcurrency || 8, mem = navigator.deviceMemory || 8;
  const touch = matchMedia('(pointer: coarse)').matches;
  if (force === '1') on('forçado');
  else if (stored() === '1') on('sessão');
  else if (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')) on('dados');
  else if (cores <= 2 || mem <= 2 || (touch && cores <= 4 && mem <= 4)) on('aparelho');
  if (html.classList.contains('leve') || stored() === '0') return;

  // medida real dos quadros por segundo (só com a aba à vista)
  const measure = (frames, done) => {
    const d = [];
    let last = 0;
    const f = (t) => {
      if (document.visibilityState !== 'visible') { last = 0; requestAnimationFrame(f); return; }
      if (last) d.push(t - last);
      last = t;
      if (d.length < frames) requestAnimationFrame(f);
      else { d.sort((a, b) => a - b); done(d[Math.floor(d.length / 2)], d[Math.floor(d.length * 0.9)]); }
    };
    requestAnimationFrame(f);
  };
  // depois da entrada da página (a hero anima até ~2,5 s): mediana acima de 28 ms = abaixo de ~36 fps
  addEventListener('load', () => setTimeout(() => {
    if (html.classList.contains('leve')) return;
    measure(90, (med, p90) => { if (med > 28 || p90 > 60) on('fps'); });
  }, 3200), { once: true });
  // enquanto a pessoa rola: a cada 1,5 s de rolagem, se metade dos quadros passou de 34 ms (abaixo de ~30 fps)
  let slow = 0, total = 0, last = 0, end = 0, raf = 0;
  const tick = (t) => {
    raf = 0;
    if (last && document.visibilityState === 'visible') { total++; if (t - last > 34) slow++; }
    last = t;
    if (performance.now() < end) raf = requestAnimationFrame(tick);
    else last = 0;
    if (total >= 90) {
      if (slow / total > 0.5) { on('rolagem'); removeEventListener('scroll', onScroll); }
      slow = total = 0;
    }
  };
  const onScroll = () => { end = performance.now() + 250; if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', onScroll, { passive: true });
})();
