// Páginas legais. O topo animado para de se mexer quando sai da tela (desempenho).
(() => {
  const hero = document.querySelector('.doc-hero');
  if (hero && 'IntersectionObserver' in window) new IntersectionObserver(([e]) => hero.classList.toggle('is-off', !e.isIntersecting)).observe(hero);
})();
// O índice da esquerda acende a seção que está sendo lida (a última cujo topo já passou de 30% da tela).
(() => {
  const links = [...document.querySelectorAll('.doc-toc a[href^="#"]')];
  const secs = links.map((a) => document.getElementById(a.hash.slice(1)));
  if (!links.length || secs.some((s) => !s)) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const line = innerHeight * 0.3;
    let cur = 0;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) cur = i; });
    // no fim da página a última seção pode não chegar à linha: acende ela quando não há mais o que rolar
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) {
      const last = secs.findLastIndex((s) => s.getBoundingClientRect().top < innerHeight);
      if (last > cur) cur = last;
    }
    links.forEach((a, i) => {
      a.classList.toggle('is-on', i === cur);
      if (i === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(update); });
  update();
})();
