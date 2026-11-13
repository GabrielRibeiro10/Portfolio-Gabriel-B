// Abertura / primeira tela: o desempenho.js só mede depois que a página abre e rola. Este mede do carregamento até
// alguns segundos depois: quando a página aparece (primeira pintura e maior elemento), as travadas longas ANTES de
// aparecer (tela vazia, ninguém vê a animação ainda) e DEPOIS (essas travam a abertura de verdade) e a fluidez dos
// quadros durante a abertura.
// Uso: node abertura.js [--pagina=index.html] [--aparelhos=celular-fraco,pc-medio] [--modo=auto|normal|leve]
//      [--seg=8] (segundos medidos) [--alvo=".logo"] (marca "alvo aparece" quando esse elemento fica visível)
//      [--bloquear="fonts\.g|three"] (bloqueia arquivos que casam com o padrão: descobre quem atrasa a primeira tela)
// Dica: rode 2 vezes e compare (o tempo varia); compare antes/depois no mesmo aparelho.
const { chromium, args, lista, APARELHOS, prepararModo, urlModo } = require('./comum');
const init = (alvo) => {
  window.__a = { lt: [], fr: [], ev: {} };
  const A = window.__a, mark = (n) => { if (!(n in A.ev)) A.ev[n] = Math.round(performance.now()); };
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => A.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (e.name === 'first-contentful-paint') A.ev['primeira pintura'] = Math.round(e.startTime); })).observe({ type: 'paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { const e = l.getEntries().pop(); if (e) A.ev['maior elemento (LCP)'] = Math.round(e.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  document.addEventListener('DOMContentLoaded', () => mark('DOMContentLoaded'));
  addEventListener('load', () => mark('load'));
  if (alvo) { const iv = setInterval(() => { const el = document.querySelector(alvo); if (el) { const cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (+cs.opacity > 0.05 && cs.visibility !== 'hidden' && r.width && r.bottom > 0 && r.top < innerHeight) { mark('alvo aparece'); clearInterval(iv); } } }, 10); }
  let last = 0; const f = (t) => { if (last) A.fr.push([Math.round(t), Math.round(t - last)]); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f);
};
(async () => {
  const a = args();
  const seg = Number(a.seg || 8) * 1000;
  const aparelhos = lista(a.aparelhos, ['celular-fraco', 'celular-medio', 'pc-fraco', 'pc-medio', 'pc-bom']);
  const b = await chromium.launch();
  for (const nome of aparelhos) {
    const ap = APARELHOS[nome];
    const ctx = await b.newContext({ viewport: { width: ap.w, height: ap.h }, ...(ap.toque ? { isMobile: true, hasTouch: true } : {}) });
    const page = await ctx.newPage(); const erros = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await prepararModo(page, a.modo || 'auto');
    await page.addInitScript(init, a.alvo || '');
    if (a.bloquear) await page.route(new RegExp(a.bloquear), (r) => r.abort());
    if (ap.cpu > 1) { const c = await ctx.newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate: ap.cpu }); }
    page.goto(urlModo(a.base + '/' + (a.pagina || 'index.html'), a.modo || 'auto')).catch(() => {});
    await page.waitForFunction((s) => window.__a && performance.now() > s, seg, { timeout: seg * 6 + 60000 });
    const [A, modo] = await page.evaluate(() => [window.__a, document.documentElement.dataset.leve || (document.documentElement.classList.contains('leve') ? 'leve' : 'normal')]);
    const aparece = A.ev['alvo aparece'] ?? A.ev['primeira pintura'] ?? 0;
    const antes = A.lt.filter(([t]) => t < aparece), depois = A.lt.filter(([t]) => t >= aparece);
    const soma = (l) => l.reduce((x, y) => x + y[1], 0);
    const q = A.fr.filter(([t]) => t >= aparece).map((x) => x[1]);
    const med = q.length ? q.reduce((x, y) => x + y, 0) / q.length : 0;
    console.log(`\n== ${nome} ${ap.w}x${ap.h} cpu x${ap.cpu} | modo ${modo}${erros.length ? ' | ERROS: ' + erros.join(' || ') : ''}`);
    console.log('   ' + Object.entries(A.ev).sort((x, y) => x[1] - y[1]).map(([n, t]) => `${n} ${(t / 1000).toFixed(2)}s`).join(' | '));
    console.log(`   travadas ANTES de aparecer: ${antes.length} (soma ${soma(antes)}ms, maior ${Math.max(0, ...antes.map((x) => x[1]))}ms)`);
    console.log(`   travadas DEPOIS (na abertura): ${depois.length} (soma ${soma(depois)}ms, maior ${Math.max(0, ...depois.map((x) => x[1]))}ms) | quadro médio ${med.toFixed(1)}ms | quadros >50ms ${q.filter((d) => d > 50).length}`);
    await ctx.close();
  }
  await b.close();
})();
