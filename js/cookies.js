// Aviso de cookies (LGPD): cartão no canto da tela com "Recusar" e "Aceitar todos" do mesmo tamanho e
// "Personalizar", que abre as categorias. A escolha fica no cookie gr_cookies por 12 meses (formato
// "versão.aN.mN.data"; trocar VERSION pede o consentimento de novo). Os botões [data-cookies-open]
// (rodapé, Política de Cookies) reabrem o cartão já com as categorias abertas.
// Scripts opcionais entram assim e só rodam depois da permissão:
//   <script type="text/plain" data-cookies="analytics" src="..."></script>   (ou "marketing")
// Quem quiser reagir à escolha: document.addEventListener('gr:cookies', (e) => e.detail)
(() => {
  const NAME = 'gr_cookies', VERSION = 1, MAX_AGE = 60 * 60 * 24 * 365;
  const CATS = ['analytics', 'marketing'];
  const policy = 'cookies.html';

  const read = () => {
    const m = document.cookie.match(/(?:^|;\s*)gr_cookies=([^;]+)/);
    if (!m) return null;
    const [v, a, k, t] = decodeURIComponent(m[1]).split('.');
    if (Number(v) !== VERSION || !/^a[01]$/.test(a) || !/^m[01]$/.test(k)) return null;
    return { analytics: a === 'a1', marketing: k === 'm1', date: Number(t) || 0 };
  };
  const write = (c) => {
    const val = `${VERSION}.a${+c.analytics}.m${+c.marketing}.${Math.floor(Date.now() / 1000)}`;
    document.cookie = `${NAME}=${val}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  };

  // libera os scripts das categorias permitidas (uma vez cada)
  const run = (c) => {
    document.querySelectorAll('script[type="text/plain"][data-cookies]').forEach((old) => {
      if (!c[old.dataset.cookies]) return;
      const s = document.createElement('script');
      for (const { name, value } of old.attributes) if (name !== 'type' && name !== 'data-cookies') s.setAttribute(name, value);
      s.dataset.cookiesRan = old.dataset.cookies;
      s.text = old.text;
      old.replaceWith(s);
    });
  };

  let consent = read();
  const apply = (c, save) => {
    const before = consent;
    consent = { analytics: !!c.analytics, marketing: !!c.marketing, date: save ? Math.floor(Date.now() / 1000) : c.date };
    if (save) write(consent);
    run(consent);
    document.dispatchEvent(new CustomEvent('gr:cookies', { detail: consent }));
    // tirou uma permissão que já estava valendo: recarrega para o script que já rodou parar de vez
    if (before && CATS.some((k) => before[k] && !consent[k] && document.querySelector(`script[data-cookies-ran="${k}"]`))) location.reload();
  };
  if (consent) apply(consent, false);

  // ---------- cartão ----------
  const ICON = `<svg viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <radialGradient id="ck-dough" cx=".38" cy=".34" r=".78"><stop offset="0" stop-color="#ffd9b0"/><stop offset=".55" stop-color="#f4a25a"/><stop offset="1" stop-color="#c8641f"/></radialGradient>
    </defs>
    <path fill="url(#ck-dough)" d="M44.32 21.76A20.5 20.5 0 1 1 21.74 4.12A4.4 4.4 0 0 0 30.44 5.04A20.5 20.5 0 0 1 31.31 5.35A6.1 6.1 0 0 0 40.82 12.77A20.5 20.5 0 0 1 41.32 13.54A4.4 4.4 0 0 0 44.32 21.76Z"/>
    <g fill="#5c210a">
      <path d="M14 15.6c1.5-1 3.4-.4 3.9 1.1s-.5 3.3-2.1 3.6-3.1-.8-3.1-2.3c0-1 .5-1.8 1.3-2.4z"/>
      <path d="M26.2 22.4c1.4-1.2 3.6-.9 4.3.6s0 3.3-1.6 3.7-3.3-.5-3.6-2c-.1-.9.2-1.7.9-2.3z"/>
      <path d="M15.6 30.8c1.2-.5 2.7.1 3.1 1.4s-.4 2.6-1.6 2.8-2.6-.6-2.7-1.8c-.1-1 .4-2 1.2-2.4z"/>
      <path d="M31.4 33.6c1.1-.6 2.6-.1 3 1s-.3 2.3-1.4 2.6-2.4-.5-2.5-1.6c0-.9.3-1.6.9-2z"/>
      <path d="M22.6 12.6c.8-.5 1.8-.1 2 .7s-.2 1.6-1 1.7-1.6-.4-1.6-1.1c0-.5.2-1 .6-1.3z"/>
      <path d="M8.9 23.6c.7-.4 1.6-.1 1.8.6s-.2 1.4-.9 1.5-1.4-.3-1.5-1c0-.5.2-.9.6-1.1z"/>
      <path d="M23.7 38.4c.7-.4 1.6-.1 1.8.6s-.2 1.4-.9 1.5-1.4-.3-1.4-1c0-.5.2-.9.5-1.1z"/>
    </g>
    <path d="M10.5 15.5a15.5 15.5 0 0 1 8-7.6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
  const opt = (k, title, text) => `
        <label class="ck-opt">
          <span class="ck-opt-t"><strong>${title}</strong><span>${text}</span></span>
          <input class="ck-switch" type="checkbox" role="switch" name="${k}">
        </label>`;
  const HTML = `
    <div class="ck-card">
      <div class="ck-head">
        <span class="ck-ico">${ICON}</span>
        <h2 class="ck-t" id="ck-t">Cookies, só com a sua permissão</h2>
      </div>
      <p class="ck-d" id="ck-d">Uso cookies essenciais para o site funcionar e lembrar a sua escolha. Os de análise e de marketing só entram se você deixar. Saiba mais na <a href="${policy}">Política de Cookies</a>.</p>
      <div class="ck-prefs" id="ck-prefs">
        <div class="ck-prefs-in">
          <div class="ck-opt">
            <span class="ck-opt-t"><strong>Essenciais</strong><span>Guardam a sua escolha e mantêm o site funcionando.</span></span>
            <span class="ck-always">Sempre ativos</span>
          </div>${opt('analytics', 'Desempenho e análise', 'Contam visitas de forma anônima para melhorar o site.')}${opt('marketing', 'Marketing', 'Medem campanhas e anúncios nas redes sociais.')}
        </div>
      </div>
      <div class="ck-actions">
        <button type="button" class="ck-more" data-ck="more" aria-expanded="false" aria-controls="ck-prefs"><span>Personalizar</span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5L6 7.5 9 4.5"/></svg></button>
        <button type="button" class="ck-btn ck-btn--line" data-ck="reject">Recusar</button>
        <button type="button" class="ck-btn ck-btn--line" data-ck="save" hidden>Salvar escolhas</button>
        <button type="button" class="ck-btn ck-btn--main" data-ck="accept">Aceitar todos</button>
      </div>
    </div>`;

  let box = null, opener = null, closing = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setPrefs = (open) => {
    box.classList.toggle('is-prefs', open);
    box.querySelector('[data-ck="more"]').setAttribute('aria-expanded', open);
    box.querySelector('[data-ck="more"] span').textContent = open ? 'Menos opções' : 'Personalizar';
    box.querySelector('[data-ck="reject"]').hidden = open;
    box.querySelector('[data-ck="save"]').hidden = !open;
    box.querySelector('.ck-prefs').inert = !open;
  };

  const close = () => {
    if (!box || box.classList.contains('is-out')) return;
    const el = box;
    el.classList.remove('is-in');
    el.classList.add('is-out');
    const done = () => { if (el.isConnected) el.remove(); if (box === el) box = null; };
    clearTimeout(closing);
    closing = setTimeout(done, reduce ? 0 : 600);
    if (opener && document.contains(opener) && el.contains(document.activeElement)) opener.focus({ preventScroll: true });
    opener = null;
  };

  const choose = (c) => { apply(c, true); close(); };

  const build = () => {
    const el = document.createElement('section');
    el.className = 'ck';
    el.setAttribute('aria-labelledby', 'ck-t');
    el.setAttribute('aria-describedby', 'ck-d');
    el.innerHTML = HTML;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ck]');
      if (!b) return;
      const act = b.dataset.ck;
      const val = (k) => el.querySelector(`input[name="${k}"]`).checked;
      if (act === 'more') setPrefs(!el.classList.contains('is-prefs'));
      else if (act === 'accept') choose({ analytics: true, marketing: true });
      else if (act === 'reject') choose({ analytics: false, marketing: false });
      else if (act === 'save') choose({ analytics: val('analytics'), marketing: val('marketing') });
    });
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (el.classList.contains('is-prefs') && !consent) setPrefs(false);
      else if (consent) close();   // já escolheu antes: Esc fecha sem mudar nada
    });
    return el;
  };

  const show = ({ prefs = false, focus = false } = {}) => {
    clearTimeout(closing);
    if (box && box.classList.contains('is-out')) { box.remove(); box = null; }
    if (!box) {
      box = build();
      document.body.append(box);
    }
    CATS.forEach((k) => { box.querySelector(`input[name="${k}"]`).checked = !!(consent && consent[k]); });
    setPrefs(prefs);
    box.offsetWidth;   // aplica o estado inicial antes de animar a entrada
    box.classList.add('is-in');
    if (focus) {
      const first = box.querySelector(prefs ? 'input[name="analytics"]' : '[data-ck="accept"]');
      setTimeout(() => first && first.focus({ preventScroll: true }), reduce ? 0 : 350);
    }
  };

  // botões que reabrem as preferências (rodapé, Política de Cookies): ficam escondidos sem JavaScript
  document.querySelectorAll('[data-cookies-open][hidden]').forEach((b) => { b.hidden = false; });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cookies-open]');
    if (!b) return;
    e.preventDefault();
    opener = b;
    show({ prefs: true, focus: true });
  });

  window.grCookies = { get: () => consent && { ...consent }, open: () => show({ prefs: true, focus: true }) };

  // primeira visita (ou escolha vencida): mostra o aviso depois da entrada da página
  if (!consent) {
    const later = () => setTimeout(() => { if (!consent && !box) show(); }, document.querySelector('.hero') ? 1600 : 700);
    if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
  }
})();
