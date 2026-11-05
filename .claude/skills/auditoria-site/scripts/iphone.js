// 8) iPhone / Safari: abre o site no motor do Safari (WebKit) como iPhone 13 Pro Max e iPhone SE e confere o que o
// Chrome não mostra: vídeo/captura dos projetos visíveis dentro do notebook 3D, foto no crachá, erros de JS.
// O WebKit do Playwright não vem instalado: na 1ª vez rode
//   PLAYWRIGHT_BROWSERS_PATH=<pasta> node <playwright>/cli.js install webkit  (+ bibliotecas do sistema, ver SKILL.md)
// Uso: PLAYWRIGHT_BROWSERS_PATH=<pasta> node iphone.js [--fotos=pasta]
const fs = require('fs'), path = require('path');
const { webkit, devices } = require('playwright');
const { args } = require('./comum');
(async () => {
  const a = args(); if (a.fotos) fs.mkdirSync(a.fotos, { recursive: true });
  const b = await webkit.launch(); let ruim = 0;
  for (const dev of ['iPhone 13 Pro Max', 'iPhone SE']) {
    const ctx = await b.newContext({ ...devices[dev] }); const p = await ctx.newPage();
    const erros = []; p.on('pageerror', (e) => erros.push(e.message)); p.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
    await p.goto(a.base + '/index.html', { waitUntil: 'networkidle', timeout: 90000 }); await p.waitForTimeout(3500);
    const out = [];
    // notebook: o centro da tela do notebook tem que mostrar a captura/vídeo (não o cinza da tampa por fora)
    const pj = await p.$('.pj');
    if (pj) {
      await p.evaluate(() => scrollTo(0, document.querySelector('.pj').getBoundingClientRect().top + scrollY)); await p.waitForTimeout(5000);
      const lap = await p.$('.pj-slide.is-active .lp-screen');
      const shot = await lap.screenshot();
      const top = await p.evaluate((sel) => { const s = document.querySelector(sel).getBoundingClientRect(); const e = document.elementFromPoint(s.left + s.width / 2, s.top + s.height / 2); return e ? e.className.baseVal ?? e.className : '-'; }, '.pj-slide.is-active .lp-screen');
      if (a.fotos) fs.writeFileSync(path.join(a.fotos, `iphone-${dev.replace(/ /g, '')}-notebook.png`), shot);

      out.push(`notebook: elemento no centro da tela = ${top}`);
    }
    // crachá: tem canvas 3D ou crachá desenhado, e a foto carregou
    await p.evaluate(() => scrollTo(0, document.querySelector('.about-me').getBoundingClientRect().top + scrollY)); await p.waitForTimeout(6000);
    const cr = await p.evaluate(() => ({ modo: document.querySelector('.about').className, canvas: !!document.querySelector('.cracha-canvas'), lanyard: !!document.querySelector('.lanyard') }));
    if (a.fotos) await p.screenshot({ path: path.join(a.fotos, `iphone-${dev.replace(/ /g, '')}-cracha.png`) });
    out.push(`crachá: ${cr.modo} (canvas ${cr.canvas}, desenhado ${cr.lanyard})`);
    if (erros.length) ruim++;
    console.log(`== ${dev} | ${erros.length ? 'ERROS: ' + erros.join(' || ') : 'sem erros'}`); out.forEach((l) => console.log('   ' + l));
    await ctx.close();
  }
  console.log(a.fotos ? `\nOLHE as fotos em ${a.fotos}: notebook com o site aparecendo (não cinza) e crachá com a foto.` : '');
  await b.close(); process.exit(ruim ? 1 : 0);
})();
