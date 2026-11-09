// 4b) Teste de hover como cliente: passa a seta por cima de cada elemento que reage ao mouse e procura o que
//     PARECE bug para quem usa, mesmo funcionando como foi escrito:
//  - SOME: ao entrar ou com a seta passando de leve (entra e sai rápido), boa parte do desenho desaparece
//    (ex.: a marca GR sumia e se redesenhava a cada hover; passando de leve parecia reiniciar);
//  - FLASH: ao entrar, aparece de repente bem mais desenho do que no normal e no hover (clarão, piscada);
//  Transições suaves (cor que muda, texto que sobe e troca, círculo que preenche) NÃO são acusadas: os quadros do
//  meio delas ficam longe do início e do fim, mas o desenho não some nem acende do nada.
//  - NÃO VOLTA: depois de tirar a seta, fica preso no estado do hover;
//  (com --tudo também mostra, só como informação, o que PULSA parado em cima: costuma ser de propósito).
// Elementos testados: todo seletor com :hover nas folhas de estilo (o dono do hover, ex. ".logo" em
// ".logo:hover .lg-s") + links e botões. Mede pixels (fotos do elemento), então pega efeito de CSS e de JS.
// Uso: node hover.js [--paginas=index.html,404.html] [--aparelhos=pc-bom] [--modo=normal] [--fotos=pasta]
//                    [--css="regra extra"] [--max=120] [--so=".logo"]
const fs = require('fs'), path = require('path');
const { chromium, args, lista, abrir, modoAtual } = require('./comum');

const LIMIAR = 0.15;   // fração da "tinta" do elemento que mudou para contar como diferente (acima do ruído medido)

(async () => {
  const a = args();
  const paginas = lista(a.paginas, fs.readdirSync(process.cwd()).filter((f) => /\.html$/.test(f)).sort());
  const aparelhos = lista(a.aparelhos, ['pc-bom']);
  const max = +(a.max || 120);
  if (a.fotos) fs.mkdirSync(a.fotos, { recursive: true });
  const b = await chromium.launch();
  // página à parte só para comparar fotos (não mexe no site)
  const cmp = await (await b.newContext()).newPage();
  await cmp.setContent('<body></body>');
  const diffs = (fotos, pares) => cmp.evaluate(async ({ fotos, pares }) => {
    const img = await Promise.all(fotos.map(async (b64) => {
      const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
      const c = new OffscreenCanvas(bm.width, bm.height), x = c.getContext('2d'); x.drawImage(bm, 0, 0);
      const im = x.getImageData(0, 0, bm.width, bm.height); im.data.w = bm.width; return im.data;
    }));
    // "tinta": pixels diferentes do fundo (cor do canto). A mudança é medida em relação à tinta, e não à área da foto:
    // um traço fino (como o da marca GR) sumindo é pouca área, mas é quase toda a tinta do elemento.
    const dif = (p, i, q, j) => Math.abs(p[i] - q[j]) + Math.abs(p[i + 1] - q[j + 1]) + Math.abs(p[i + 2] - q[j + 2]);
    const tinta = img.map((p) => { let n = 0; for (let i = 0; i < p.length; i += 4) if (dif(p, i, p, 0) > 60) n++; return n / (p.length / 4); });
    const d = (a, b) => { const p = img[a], q = img[b]; if (p.length !== q.length) return 1; let n = 0; for (let i = 0; i < p.length; i += 4)
      if (dif(p, i, q, i) > 60) n++; return n / (p.length / 4) / Math.max(tinta[a], tinta[b], 0.02); };
    // igual, mas tolera o elemento ter andado até 8 px (faixa que corre sozinha, botão com leve movimento,
    // rolagem suave assentando): sem isso, "não volta ao normal" e "treme" davam alarme falso
    const ds = (a, b) => { const p = img[a], q = img[b], w = p.w, h = p.length / 4 / w; if (p.length !== q.length) return 1; let melhor = 1;
      for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { let n = 0, t = 0;
        for (let y = 8; y < h - 8; y++) for (let x = 8; x < w - 8; x++) { const i = (y * w + x) * 4, j = ((y + dy) * w + x + dx) * 4; t++; if (dif(p, i, q, j) > 60) n++; }
        melhor = Math.min(melhor, t ? n / t / Math.max(tinta[a], tinta[b], 0.02) : 1); }
      return melhor; };
    return { m: img.map((p, a) => img.map((q, b) => Math.min(1, d(a, b)))), tinta, s: pares.map(([a, b]) => Math.min(1, ds(a, b))) };
  }, { fotos, pares });

  let problemas = 0, total = 0;
  for (const pagina of paginas) for (const nome of aparelhos) {
    const { ctx, page, ap, erros } = await abrir(b, nome, a.base + '/' + pagina, { modo: a.modo || 'normal', espera: 5000 });
    if (ap.toque) { console.log(`\n== ${pagina} @ ${nome}: aparelho de toque não tem hover, pulei`); await ctx.close(); continue; }
    if (a.css) await page.addStyleTag({ content: a.css });
    // donos de hover nas folhas de estilo + links/botões
    const alvos = await page.evaluate(({ max, so }) => {
      const sel = new Set();
      const anda = (rules) => { for (const r of rules) {
        if (r.cssRules && !r.selectorText) { try { anda(r.cssRules); } catch (e) {} continue; }
        if (!r.selectorText || !r.selectorText.includes(':hover')) continue;
        for (const s of r.selectorText.split(/,(?![^(]*\))/)) {
          const i = s.indexOf(':hover'); if (i < 0) continue;
          const dono = s.slice(0, i).replace(/:not\($/, '').trim(); if (dono) sel.add(dono + s.slice(i + 6).match(/^[^\s>+~]*/)[0]);
        } } };
      for (const f of document.styleSheets) { try { anda(f.cssRules); } catch (e) {} }
      const els = new Set();
      for (const s of (so ? [so] : [...sel, 'a[href]', 'button', 'summary', '[role=button]'])) { try { document.querySelectorAll(s).forEach((e) => els.add(e)); } catch (e) {} }
      const out = [];
      for (const el of els) {
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        if (r.width < 6 || r.height < 6 || r.width * r.height > innerWidth * innerHeight * 0.6 || cs.visibility === 'hidden' || cs.display === 'none') continue;
        el.dataset.hv = out.length;
        const nomeEl = (el.getAttribute('aria-label') || el.textContent.trim().replace(/\s+/g, ' ') || el.tagName).slice(0, 28);
        out.push({ i: out.length, nome: `${el.tagName.toLowerCase()}${el.classList[0] ? '.' + el.classList[0] : ''} "${nomeEl}"` });
        if (out.length >= max) break;
      }
      return out;
    }, { max, so: a.so });

    const linhas = [];
    for (const al of alvos) {
      const loc = page.locator(`[data-hv="${al.i}"]`);
      // leva o elemento para o meio da tela, a seta longe, e espera assentar (animações de entrada da rolagem)
      await page.mouse.move(2, 2);
      await loc.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' })).catch(() => {});
      await page.waitForTimeout(1300);
      const r = await loc.boundingBox().catch(() => null);
      if (!r || r.width < 6 || r.y + r.height < 0 || r.y > ap.h) continue;
      const vis = await page.evaluate(({ x, y, i }) => { const e = document.elementFromPoint(x, y), el = document.querySelector(`[data-hv="${i}"]`); return !!e && (e === el || el.contains(e) || e.contains(el)); }, { x: r.x + r.width / 2, y: r.y + r.height / 2, i: al.i });
      if (!vis) continue;   // coberto ou fora da tela: o cliente não consegue passar a seta
      total++;
      const pad = 10, clip = { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad) };
      clip.width = Math.min(ap.w, r.x + r.width + pad) - clip.x; clip.height = Math.min(ap.h, r.y + r.height + pad) - clip.y;
      const foto = async () => (await page.screenshot({ clip, animations: 'allow' })).toString('base64');
      const fora = { x: Math.min(ap.w - 3, r.x + r.width + 60), y: Math.max(3, r.y - 60) };
      const dentro = { x: r.x + r.width / 2, y: r.y + r.height / 2 };

      // 1) parado sem a seta: ruído (cursor piscando, degradê animado...)
      const base = [];
      for (let k = 0; k < 4; k++) { base.push(await foto()); await page.waitForTimeout(150); }
      // 2) entra devagar e fica em cima, fotografando
      await page.mouse.move(fora.x, fora.y);
      await page.mouse.move(dentro.x, dentro.y, { steps: 8 });
      const entrada = [];
      for (let k = 0; k < 10; k++) { entrada.push(await foto()); await page.waitForTimeout(60); }
      await page.waitForTimeout(900);
      const hov = [];
      for (let k = 0; k < 4; k++) { hov.push(await foto()); await page.waitForTimeout(150); }
      // 3) sai e entra rápido várias vezes (seta passando de leve)
      const leve = [];
      for (let k = 0; k < 5; k++) {
        await page.mouse.move(fora.x, fora.y, { steps: 2 }); await page.waitForTimeout(90);
        await page.mouse.move(dentro.x, dentro.y, { steps: 2 }); await page.waitForTimeout(90);
        leve.push(await foto());
      }
      // 4) tira a seta e espera voltar
      await page.mouse.move(fora.x, fora.y, { steps: 4 }); await page.mouse.move(2, 2);
      await page.waitForTimeout(1500);
      const depois = await foto();

      const todas = [...base, ...hov, ...entrada, ...leve, depois];
      const pares = [[23, 0], [23, 1], [23, 2], [23, 3], [4, 5], [4, 6], [4, 7], [5, 6], [5, 7], [6, 7], [23, 4], [23, 5], [23, 6], [23, 7]];
      const { m, tinta, s: sm } = await diffs(todas, pares);
      const voltaD = Math.min(...sm.slice(0, 4)), ruidoHs = Math.max(...sm.slice(4, 10)), presoH = Math.min(...sm.slice(10, 14));
      const B = [0, 1, 2, 3], H = [4, 5, 6, 7], E = [...Array(10).keys()].map((k) => 8 + k), L = [...Array(5).keys()].map((k) => 18 + k), D = 23;
      const maxEntre = (xs, ys) => Math.max(...xs.flatMap((x) => ys.map((y) => m[x][y])));
      const minPara = (x, ys) => Math.min(...ys.map((y) => m[x][y]));
      const ruido = maxEntre(B, B), ruidoH = maxEntre(H, H);
      const mudanca = Math.min(...B.flatMap((x) => H.map((y) => m[x][y])));   // quanto o hover muda o visual
      const lim = Math.max(LIMIAR, ruido * 1.5 + 0.05);
      // quadro "fora do caminho": longe do normal E do estado com hover (num caminho suave, perto de um dos dois
      // ou no meio; medimos o quanto ele se afasta além da distância normal → hover)
      const fora_ = (x) => Math.min(minPara(x, B), minPara(x, H)) - mudanca * 0.5;
      const pior = (xs) => xs.reduce((p, x) => (fora_(x) > fora_(p) ? x : p), xs[0]);
      // quanto do desenho some num quadro (trocar de cor não tira desenho; sumir tira), comparado ao normal e ao hover
      const ref = Math.min(...B.map((x) => tinta[x]), ...H.map((x) => tinta[x]));
      const vari = Math.max(...B.map((x) => tinta[x])) / Math.max(1e-4, Math.min(...B.map((x) => tinta[x]))) - 1;
      const some = (xs) => Math.max(...xs.map((x) => 1 - tinta[x] / Math.max(1e-4, ref)));
      const limSome = Math.max(0.25, vari + 0.15);
      const achados = [];
      if (some(E) > limSome) achados.push(`SOME ao entrar (${Math.round(some(E) * 100)}% do desenho desaparece)`);
      if (some(L) > limSome) achados.push(`SOME passando de leve (${Math.round(some(L) * 100)}% do desenho desaparece)`);
      const pe = pior(E), pl = pior(L);   // só informativo (--tudo): quanto o quadro do meio se afasta dos dois estados
      const topo = Math.max(...B.map((x) => tinta[x]), ...H.map((x) => tinta[x]), tinta[23]);
      const flash = Math.max(...[...E, ...L].map((x) => tinta[x] / Math.max(1e-4, topo) - 1));
      if (flash > Math.max(0.6, vari + 0.4)) achados.push(`FLASH: acende do nada ao passar a seta (${Math.round(flash * 100)}% mais desenho)`);
      // "não volta" = ficou preso no estado do hover (mais perto dele que do normal). Diferente dos dois = algo que se
      // mexe sozinho ali (faixa que corre, cursor piscando, brilho pulsando), não é culpa da seta
      if (voltaD > lim && presoH < voltaD * 0.5) achados.push(`NÃO VOLTA: fica preso no hover depois de tirar a seta (${Math.round(voltaD * 100)}%)`);
      const treme = ruidoHs > Math.max(LIMIAR * 2, ruido * 2 + 0.08);   // informativo: efeito que pulsa com a seta em cima (costuma ser de propósito)
      const info = mudanca > lim ? `muda ${Math.round(mudanca * 100)}%` : (mudanca > ruido + 0.01 ? 'muda pouco' : 'sem efeito visível');
      if (achados.length) {
        problemas++;
        linhas.push(`!! ${al.nome}: ${achados.join('; ')} [${info}]`);
        if (a.fotos) {
          const nomeArq = `${pagina.replace('.html', '')}-${nome}-${String(al.i).padStart(3, '0')}`;
          [base[0], ...entrada, ...leve, depois].forEach((f, k) => fs.writeFileSync(path.join(a.fotos, `${nomeArq}-${String(k).padStart(2, '0')}.png`), Buffer.from(f, 'base64')));
        }
      } else if (a.tudo) linhas.push(`   ${al.nome}: ok [${info}; entrada ${Math.round(fora_(pe) * 100)}%, leve ${Math.round(fora_(pl) * 100)}%, ruído ${Math.round(ruido * 100)}%${treme ? ', pulsa com a seta' : ''}, flash ${Math.round(flash * 100)}%, some ${Math.round(Math.max(some(E), some(L)) * 100)}%/${Math.round(limSome * 100)}%]`);
    }
    console.log(`\n== ${pagina} @ ${nome} (${await modoAtual(page)})${erros.length ? ' | ERROS: ' + erros.join(' || ') : ''}`);
    console.log(`   elementos com a seta testados: ${linhas.length || !a.tudo ? total : linhas.length}`);
    linhas.forEach((l) => console.log('   ' + l));
    await ctx.close();
  }
  console.log(problemas ? `\n${problemas} elemento(s) com hover que parece bug${a.fotos ? ' (quadros em ' + a.fotos + ': normal, entrada, passando de leve, depois; use montagem.js)' : ''}` : `\nhover ok (${total} elementos)`);
  await b.close();
})();
