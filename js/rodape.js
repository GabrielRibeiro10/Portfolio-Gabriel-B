// Rodapé: ano do ©, relógio de Caraguatatuba, nome gigante do tamanho da largura e a entrada.
(() => {
  const ft = document.querySelector('.site-footer');
  if (!ft) return;

  // ano automático
  const year = ft.querySelector('.ft-year');
  if (year) year.textContent = new Date().getFullYear();

  // relógio local (fuso de São Paulo, o mesmo de Caraguatatuba)
  const time = ft.querySelector('.ft-time');
  const tz = ft.querySelector('.ft-tz');
  if (time) {
    const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    let offset = '';
    try {
      offset = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', timeZoneName: 'shortOffset' })
        .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value || '';
    } catch (e) { /* navegador sem shortOffset: fica só "horário local" */ }
    if (tz && offset) tz.textContent = `horário local (${offset})`;
    const tick = () => { const d = new Date(); time.textContent = fmt.format(d); time.dateTime = d.toISOString(); };
    tick();
    setInterval(tick, 15000);
  }

  // nome gigante: mede no tamanho base e ajusta para ocupar a largura disponível
  const word = ft.querySelector('.ft-word');
  const inner = ft.querySelector('.ft-word-in');
  const fit = () => {
    if (!word || !inner) return;
    const pad = parseFloat(getComputedStyle(word).paddingLeft) * 2;
    const avail = word.clientWidth - pad;
    word.style.fontSize = '100px';
    const w = inner.getBoundingClientRect().width;
    if (w) word.style.fontSize = `${(100 * avail) / w}px`;
  };
  fit();
  if (document.fonts) document.fonts.ready.then(fit);
  let raf;
  addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); });

  // entrada quando o rodapé aparece (sem animação para quem prefere menos movimento)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  ft.classList.add('ft-anim');
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    ft.classList.add('is-in');
    io.disconnect();
    setTimeout(() => ft.classList.add('is-done'), 1900);
  }, { threshold: 0.12 });
  io.observe(ft);
})();
