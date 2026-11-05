// Peças comuns dos scripts da auditoria: perfis de aparelho, abrir página, rolar como uma pessoa.
const { chromium } = require('playwright');

// Aparelhos simulados. cpu = quantas vezes mais lento que o computador do teste (1 = bom, 3 = médio, 6 = fraco).
// toque = tela de toque (celular/tablet): o site recebe eventos de toque e "pointer: coarse".
const APARELHOS = {
  'celular-bom':    { w: 390,  h: 844,  cpu: 1, toque: true },
  'celular-medio':  { w: 390,  h: 844,  cpu: 3, toque: true },
  'celular-fraco':  { w: 360,  h: 780,  cpu: 6, toque: true },
  'celular-deitado':{ w: 844,  h: 390,  cpu: 3, toque: true },
  'tablet-bom':     { w: 820,  h: 1180, cpu: 1, toque: true },
  'tablet-fraco':   { w: 768,  h: 1024, cpu: 6, toque: true },
  'pc-bom':         { w: 1440, h: 900,  cpu: 1, toque: false },
  'pc-medio':       { w: 1366, h: 768,  cpu: 3, toque: false },
  'pc-fraco':       { w: 1366, h: 768,  cpu: 6, toque: false },
  'monitor-grande': { w: 2560, h: 1440, cpu: 1, toque: false },
};

// Tamanhos da varredura de responsividade (do celular pequeno ao monitor grande, com celular deitado).
const TAMANHOS = [[320, 640], [360, 780], [375, 667], [390, 844], [430, 932], [667, 375], [844, 390],
  [768, 1024], [820, 1180], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440]];

const args = () => {
  const o = { base: 'http://localhost:8123', _: [] };
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) o[m[1]] = m[2]; else if (a.startsWith('--')) o[a.slice(2)] = true; else o._.push(a);
  }
  return o;
};

const lista = (v, padrao) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : padrao);

// Abre um aparelho. modo: 'auto' (o site decide sozinho), 'normal' (?leve=0) ou 'leve' (?leve=1).
async function abrir(browser, nome, url, { modo = 'auto', espera = 2500, init } = {}) {
  const ap = APARELHOS[nome];
  if (!ap) throw new Error('aparelho desconhecido: ' + nome + ' (use: ' + Object.keys(APARELHOS).join(', ') + ')');
  const ctx = await browser.newContext({ viewport: { width: ap.w, height: ap.h }, ...(ap.toque ? { isMobile: true, hasTouch: true } : {}) });
  const page = await ctx.newPage();
  const erros = [], falhas = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => {
    const t = (r.failure() || {}).errorText || '';
    // vídeo baixado em pedaços (range request) aparece como ERR_ABORTED: é normal
    if (/ERR_ABORTED/.test(t) && /\.(mp4|webm)(\?|$)/.test(r.url())) return;
    falhas.push(r.url().split('/').slice(3).join('/') + ' ' + t);
  });
  if (init) await page.addInitScript(init);
  if (ap.cpu > 1) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: ap.cpu }); }
  const q = modo === 'normal' ? '?leve=0' : modo === 'leve' ? '?leve=1' : '';
  await page.goto(url + (url.includes('?') ? q.replace('?', '&') : q), { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(espera);
  return { ctx, page, ap, erros, falhas };
}

// Rola a página inteira com a roda do mouse, em passos curtos, como uma pessoa.
async function rolarTudo(page, ap, { passo = 40, pausa = 16 } = {}) {
  await page.mouse.move(ap.w / 2, ap.h / 2);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H - ap.h; y += passo) { await page.mouse.wheel(0, passo); await page.waitForTimeout(pausa); }
}

const modoAtual = (page) => page.evaluate(() => (document.documentElement.classList.contains('leve')
  ? 'leve(' + (document.documentElement.dataset.leve || '?') + ')' : 'normal'));

module.exports = { chromium, APARELHOS, TAMANHOS, args, lista, abrir, rolarTudo, modoAtual };
