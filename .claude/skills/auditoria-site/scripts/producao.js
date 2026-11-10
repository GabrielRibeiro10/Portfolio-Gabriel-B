// 9) Como no ar (produção): testa o site com as MESMAS regras de segurança que a Vercel envia (vercel.json) e a
// página 404. No teste local essas regras não existem, então algo que elas bloqueiam (script colado na página, fonte
// ou imagem de outro endereço) funciona aqui e quebra no ar, sem aviso.
//  - cada página, no PC e no celular (e iPhone se o WebKit estiver instalado): procura bloqueios da política de segurança
//    (CSP) e erros, rolando até o fim para tudo carregar;
//  - confere se cada <script> colado na página tem o "hash" liberado na política (senão o navegador não roda);
//  - 404: abre um endereço que não existe, inclusive dentro de pasta (/pasta/link-quebrado), servindo o 404.html como a
//    Vercel faz, e confere que aparece no visual do site, sem arquivo faltando, e que o botão volta ao início.
//  - cache: acusa Cache-Control com max-age > 0 (dias de cache) em arquivos referenciados sem marca de versão (?v=N):
//    a atualização do site não chegaria a quem já visitou.
// Uso: node producao.js [--paginas=index.html,termos.html] [--fotos=pasta]
//      (com PLAYWRIGHT_BROWSERS_PATH apontando para o WebKit, também testa no iPhone; ver SKILL.md passo 5b)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const pw = require('playwright');
const { args, lista } = require('./comum');
(async () => {
  const a = args(); const raiz = a.raiz || process.cwd();
  // site sem vercel.json (outra hospedagem): testa sem regras e avisa para conferir as do servidor de verdade
  const temVercel = fs.existsSync(path.join(raiz, 'vercel.json'));
  const cfg = temVercel ? JSON.parse(fs.readFileSync(path.join(raiz, 'vercel.json'), 'utf8')) : {};
  const regras = (cfg.headers || []).find((h) => h.source === '/(.*)') || { headers: [] };
  if (!temVercel) console.log('?? sem vercel.json: a hospedagem é outra. Testando sem regras de segurança; confira as regras (CSP) do servidor real.');
  else if (!regras.headers.length) console.log('!! vercel.json sem regras para todas as páginas ("/(.*)"): o site vai ao ar sem CSP nem cabeçalhos de segurança');
  // no teste local (http) tiramos só o que exige https; o resto vai igual ao do ar
  const H = Object.fromEntries(regras.headers.filter((x) => x.key !== 'Strict-Transport-Security')
    .map((x) => [x.key.toLowerCase(), x.value.replace(/;\s*upgrade-insecure-requests/, '')]));
  const csp = H['content-security-policy'] || '';
  const paginas = lista(a.paginas, fs.readdirSync(raiz).filter((f) => f.endsWith('.html') && f !== '404.html').sort());
  if (a.fotos) fs.mkdirSync(a.fotos, { recursive: true });
  let ruins = 0;

  // ----- scripts colados na página x hashes liberados -----
  // cada diretiva separada (style-src-attr não é style-src)
  const dir = Object.fromEntries(csp.split(';').map((d) => d.trim().split(/\s+/)).filter((d) => d[0]).map((d) => [d[0], d.slice(1)]));
  const scriptSrc = dir['script-src'] || dir['default-src'] || [], styleSrc = dir['style-src'] || dir['default-src'] || [];
  const liberados = new Set(scriptSrc.filter((t) => /^'sha256-/.test(t)).map((t) => t.slice(1, -1)));
  for (const pg of [...paginas, '404.html'].filter((f) => fs.existsSync(path.join(raiz, f)))) {
    const html = fs.readFileSync(path.join(raiz, pg), 'utf8');
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
      // dados (ld+json, json, template) não são executados: a CSP não se aplica a eles
      const tipo = (m[1].match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
      if (tipo && !/^(text\/javascript|application\/javascript|module)$/i.test(tipo)) continue;
      m[1] = m[2];
      const h = 'sha256-' + crypto.createHash('sha256').update(m[1], 'utf8').digest('base64');
      if (!liberados.has(h) && !scriptSrc.includes("'unsafe-inline'")) { ruins++; console.log(`!! ${pg}: script colado na página sem hash liberado no vercel.json (${h}) — no ar ele NÃO roda`); }
    }
    if (/<style[\s>]/.test(html) && !styleSrc.includes("'unsafe-inline'")) { ruins++; console.log(`!! ${pg}: bloco <style> na página — a política bloqueia; mova para um arquivo .css`); }
  }

  // ----- cache: atualização do site chega a todos? -----
  // Cache-Control com max-age > 0 faz o navegador NÃO perguntar ao servidor durante esse tempo: o dono troca um arquivo
  // mantendo o nome, publica, e quem já visitou continua vendo o velho (só a aba anônima mostra o novo). O padrão da
  // Vercel (sem regra) é "max-age=0, must-revalidate": o navegador confere a cada visita e o deploy limpa a CDN.
  // s-maxage só vale para a CDN, que a Vercel limpa a cada deploy: não conta.
  const arquivosDoSite = (dir, out = []) => { for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (/^(\.|node_modules$|vendor$)/.test(f.name)) continue;
    const c = path.join(dir, f.name);
    if (f.isDirectory()) arquivosDoSite(c, out); else if (/\.(html|css|js|json|webmanifest)$/.test(f.name)) out.push(c);
  } return out; };
  const regrasCache = (cfg.headers || []).map((r) => [r.source, (r.headers || []).find((x) => /^cache-control$/i.test(x.key))])
    .filter(([, h]) => h && +((h.value.match(/(?:^|[\s,])max-age=(\d+)/) || [])[1] || 0) > 0);
  if (regrasCache.length) {
    const textos = arquivosDoSite(raiz).map((f) => fs.readFileSync(f, 'utf8'));
    for (const [src, h] of regrasCache) {
      const seg = +h.value.match(/(?:^|[\s,])max-age=(\d+)/)[1], tempo = seg >= 86400 ? Math.round(seg / 86400) + ' dia(s)' : Math.round(seg / 3600) + ' hora(s)';
      // padrão da Vercel ("/img/(.*)", "/:path*") -> expressão regular sobre o caminho do arquivo
      const re = new RegExp('^' + src.replace(/^\//, '').replace(/\(\.\*\)|:\w+\*/g, '\u0000').replace(/:\w+/g, '\u0001').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\u0000/g, '.*').replace(/\u0001/g, '[^/]+') + '$');
      const semVersao = new Set();
      for (const t of textos) for (const m of t.matchAll(/["'(\s,]\/?((?:[\w.-]+\/)*[\w.-]+\.(?:css|js|png|jpe?g|webp|avif|gif|svg|mp4|webm|woff2?|ico|json))(\?[^"')\s,]*)?/g))
        if (re.test(m[1]) && !/[?&]v=/.test(m[2] || '') && !/__V__/.test(m[0])) semVersao.add(m[1]);
      if (semVersao.size) { ruins++; console.log(`!! cache de ${tempo} em ${src} e arquivo sem marca de versão (${[...semVersao].slice(0, 3).join(', ')}${semVersao.size > 3 ? '…' : ''}): trocar o arquivo e publicar NÃO chega a quem já visitou (só a aba anônima mostra). Tire a regra de Cache-Control (padrão da Vercel) ou ponha ?v=N em toda referência e troque o N a cada mudança`); }
      else console.log(`?? cache de ${tempo} em ${src}: todas as referências têm marca de versão; lembre de trocar a marca a cada mudança`);
    }
  }

  // ----- navegadores disponíveis -----
  const motores = [['chromium', { viewport: { width: 1366, height: 768 } }, 'PC'], ['chromium', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 'celular']];
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) motores.push(['webkit', pw.devices['iPhone 13 Pro Max'], 'iPhone']);
  const chromePath = (() => { try { const d = '/opt/pw-browsers'; const c = fs.readdirSync(d).find((x) => /^chromium-\d+$/.test(x)); const e = c && path.join(d, c, 'chrome-linux64', 'chrome'); return e && fs.existsSync(e) ? e : undefined; } catch (e) { return undefined; } })();
  const abrirMotor = (eng) => pw[eng].launch(eng === 'chromium' && process.env.PLAYWRIGHT_BROWSERS_PATH && chromePath ? { executablePath: chromePath } : {});
  const body404 = fs.existsSync(path.join(raiz, '404.html')) ? fs.readFileSync(path.join(raiz, '404.html')) : null;

  for (const [eng, opts, nome] of motores) {
    let b; try { b = await abrirMotor(eng); } catch (e) { console.log(`?? ${nome}: navegador não disponível (${e.message.split('\n')[0]})`); continue; }
    const comRegras = async (p, problemas) => {
      p.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) problemas.push('BLOQUEIO: ' + m.text().slice(0, 180)); });
      p.on('pageerror', (e) => problemas.push('ERRO: ' + e.message));
      await p.route(a.base + '/**', async (route) => {
        const url = route.request().url();
        if (body404 && /\/(pasta-inexistente|link-que-nao-existe)/.test(url)) return route.fulfill({ status: 404, contentType: 'text/html; charset=utf-8', body: body404, headers: H });
        try {
          const r = await route.fetch();
          if (r.status() >= 400) problemas.push('FALTANDO: ' + url.replace(a.base, ''));
          await route.fulfill({ response: r, headers: { ...r.headers(), ...H } });
        } catch (e) { /* página fechada com a requisição em andamento: não é problema do site */ }
      });
    };
    // páginas
    for (const pg of paginas) {
      const p = await b.newPage(opts); const prob = [];
      await comRegras(p, prob);
      try {
        await p.goto(`${a.base}/${pg}`, { waitUntil: 'networkidle', timeout: 90000 }); await p.waitForTimeout(2000);
        const Ht = await p.evaluate(() => document.documentElement.scrollHeight), vh = opts.viewport.height;
        for (let y = 0; y < Ht; y += vh) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(200); }
        await p.waitForTimeout(2500);
      } catch (e) { prob.push('não terminou: ' + e.message.split('\n')[0]); }
      if (prob.length) ruins++;
      console.log(`${prob.length ? '!!' : 'ok'} ${pg.padEnd(18)} ${nome.padEnd(8)} ${prob.length ? [...new Set(prob)].slice(0, 4).join(' | ') : 'sem bloqueios nem erros'}`);
      await p.close();
    }
    // 404
    if (!body404) { if (nome === 'PC') { ruins++; console.log('!! 404.html não existe: um link quebrado mostra a página padrão da hospedagem (sem o visual do site). Crie uma 404 no visual do site'); } }
    else for (const url of ['/link-que-nao-existe', '/pasta-inexistente/sub/pagina']) {
      const p = await b.newPage(opts); const prob = [];
      await comRegras(p, prob);
      try {
        const resp = await p.goto(a.base + url, { waitUntil: 'networkidle', timeout: 60000 }); await p.waitForTimeout(1500);
        if (resp.status() !== 404) prob.push('status ' + resp.status() + ' (deveria ser 404)');
        const st = await p.evaluate(() => ({ css: [...document.styleSheets].some((s) => { try { return s.cssRules.length > 0 && !/fonts\.googleapis/.test(s.href || ''); } catch (e) { return false; } }), noindex: !!document.querySelector('meta[name="robots"][content*="noindex"]'), home: !!document.querySelector('a[href="/"]') }));
        if (!st.css) prob.push('sem estilo (caminho relativo de CSS quebra dentro de pasta: use /css/...)');
        if (!st.noindex) prob.push('falta <meta name="robots" content="noindex">');
        if (!st.home) prob.push('sem link para voltar ao início (href="/")');
        if (a.fotos) await p.screenshot({ path: path.join(a.fotos, `404-${nome}${url.includes('pasta') ? '-pasta' : ''}.png`) });
      } catch (e) { prob.push('não terminou: ' + e.message.split('\n')[0]); }
      const real = prob.filter((x) => !(x.startsWith('FALTANDO') && /link-que-nao-existe|pasta-inexistente/.test(x)));
      if (real.length) ruins++;
      console.log(`${real.length ? '!!' : 'ok'} 404 ${url.padEnd(29)} ${nome.padEnd(8)} ${real.length ? [...new Set(real)].slice(0, 4).join(' | ') : 'no visual do site, sem arquivo faltando'}`);
      await p.close();
    }
    await b.close();
  }
  console.log(ruins ? `\n${ruins} problema(s): corrija antes de publicar` : '\nok: funciona com as regras de segurança do ar e a 404 está certa');
  if (a.fotos) console.log('fotos em ' + a.fotos);
  process.exit(ruins ? 1 : 0);
})();
