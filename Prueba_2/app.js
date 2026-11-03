(function () {
  'use strict';

  /* ===== CONFIG (la llave publicable es pública por diseño; la protege RLS) ===== */
  const CONFIG = {
    url: 'https://sjrptmcqcixwvgfdfydq.supabase.co',
    key: 'sb_publishable_rw72VSeQo173Y8wgAcebQw_CiboKKWu',
    idleMs: 30 * 60 * 1000
  };
  const sb = window.supabase.createClient(CONFIG.url, CONFIG.key, { auth: { persistSession: true, autoRefreshToken: true } });

  /* ===== SERVICES: formato, fechas, permisos, errores ===== */
  const fmtCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const todayCO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  const monthStartCO = () => todayCO().slice(0, 8) + '01';
  const METHODS = { cash: 'Efectivo', transfer: 'Transferencia', nequi: 'Nequi' };
  const ROLES = { owner: 'Dueño', cashier: 'Cajero', trainer: 'Entrenador', client: 'Cliente' };
  const ACCESS = { '#/inicio': ['owner', 'cashier'], '#/agenda': ['trainer'], '#/mi-panel': ['client'] };
  const HOME = { owner: '#/inicio', cashier: '#/inicio', trainer: '#/agenda', client: '#/mi-panel' };
  const ERRORS = { PULSO_E_FORBIDDEN: 'No tienes permiso para esta acción.', PULSO_E_RATE_LIMIT: 'Demasiados intentos. Espera un momento.' };
  const friendly = (e) => {
    const m = (e && e.message) || '';
    const k = Object.keys(ERRORS).find((x) => m.includes(x));
    return k ? ERRORS[k] : 'No se pudo completar la acción. Intenta de nuevo.';
  };
  const sumTotal = (rows) => rows.reduce((s, r) => s + Number(r.total), 0);

  /* ===== REPOSITORY: único punto que habla con Supabase ===== */
  const repo = {
    signIn: (email, password) => sb.auth.signInWithPassword({ email, password }),
    signOut: () => sb.auth.signOut(),
    session: () => sb.auth.getSession(),
    async profile(id) {
      const { data, error } = await sb.from('profiles').select('id,role,full_name,is_active').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async count(status) {
      const { count, error } = await sb.from('v_member_status').select('id', { count: 'exact', head: true }).eq('pay_status', status);
      if (error) throw error;
      return count || 0;
    },
    async revenue(from, to) {
      const { data, error } = await sb.rpc('revenue_summary', { p_from: from, p_to: to });
      if (error) throw error;
      return data || [];
    }
  };

  /* ===== STORE: estado central ===== */
  const store = {
    state: { profile: null },
    set(patch) { Object.assign(this.state, patch); }
  };

  /* ===== UI helpers (render seguro: textContent / createElement) ===== */
  const h = (tag, props = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    kids.flat().forEach((c) => { if (c != null) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return el;
  };
  const ecg = (big) => {
    const ns = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 120 40');
    s.setAttribute('class', big ? 'ecg ecg--big' : 'ecg');
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', 'M2 22H34L42 6L54 36L63 16L69 22H118');
    p.setAttribute('pathLength', '1');
    s.append(p);
    return s;
  };
  const brand = (big) => h('div', { class: big ? 'brand brand--big' : 'brand' },
    ecg(big), h('span', { class: 'brand__word', text: 'PULSO' }),
    big ? h('span', { class: 'brand__tag', text: 'Entrenamiento vital' }) : null);
  const toast = (msg) => {
    const t = h('p', { class: 'toast', text: msg });
    document.getElementById('toasts').append(t);
    setTimeout(() => t.remove(), 4500);
  };
  const render = (node) => document.getElementById('app').replaceChildren(node);

  /* ===== VISTAS ===== */
  function viewLogin() {
    let fails = 0;
    const email = h('input', { id: 'email', type: 'email', autocomplete: 'username', required: '', maxlength: '120' });
    const pass = h('input', { id: 'pass', type: 'password', autocomplete: 'current-password', required: '', maxlength: '72' });
    const msg = h('p', { class: 'msg', role: 'alert' });
    const btn = h('button', { class: 'btn', type: 'submit', text: 'Entrar' });
    const form = h('form', { class: 'login glass', novalidate: '' },
      brand(true),
      h('div', { class: 'field' }, h('label', { for: 'email', text: 'Correo' }), email),
      h('div', { class: 'field' }, h('label', { for: 'pass', text: 'Contraseña' }), pass),
      msg, btn);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (btn.disabled) return;
      const em = email.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em) || pass.value.length < 8) { msg.textContent = 'Revisa tu correo y contraseña.'; return; }
      btn.disabled = true; btn.classList.add('is-loading'); msg.textContent = '';
      const { error } = await repo.signIn(em, pass.value);
      btn.classList.remove('is-loading');
      if (error) {
        fails += 1;
        const wait = Math.min(2 ** fails, 30);
        msg.textContent = 'Correo o contraseña incorrectos.';
        setTimeout(() => { btn.disabled = false; }, wait * 1000);
        return;
      }
      pass.value = '';
      btn.disabled = false;
      start();
    });
    return h('main', { class: 'login-wrap', id: 'main' }, form);
  }

  function shell(content) {
    const p = store.state.profile;
    return h('div', { class: 'app' },
      h('header', { class: 'topbar' }, brand(false),
        h('nav', { class: 'topbar__user', 'aria-label': 'Cuenta' },
          h('span', { text: p.full_name }),
          h('span', { class: 'chip', text: ROLES[p.role] }),
          h('button', { class: 'btn btn--ghost', type: 'button', text: 'Salir', onclick: logout }))),
      h('main', { id: 'main' }, content));
  }

  const viewStatus = (title, text) => h('div', { class: 'page' }, h('div', { class: 'state glass' }, h('h1', { class: 'page__title', text: title }), h('p', { class: 'tile__hint', text }), ecg(true)));
  const viewForbidden = () => viewStatus('Sin permiso', 'Tu rol no tiene acceso a esta sección.');
  const viewSoon = () => viewStatus('Próximamente', 'Esta sección llega en una fase siguiente.');

  const tile = (cls, label, ...kids) => h('article', { class: 'tile glass tilt ' + cls }, h('p', { class: 'tile__label', text: label }), kids);
  const num = (n, cls = '') => h('p', { class: 'tile__value ' + cls, text: String(n) });

  function methodRows(rows, withBars) {
    const total = sumTotal(rows) || 1;
    return h('div', { class: 'rows' }, rows.map((r) => h('div', { class: 'row' },
      h('div', { class: 'row__head' }, h('span', { text: METHODS[r.method] || r.method }), h('span', { text: fmtCOP.format(r.total) })),
      withBars ? h('progress', { max: String(total), value: String(Number(r.total)), 'aria-label': METHODS[r.method] || r.method }) : null)));
  }

  function paint(box, s) {
    if (s.status === 'loading') {
      box.replaceChildren(...['tile--hero', '', '', '', 'tile--wide'].map((c) => tile('is-loading ' + c, 'Cargando…')));
      return;
    }
    if (s.status === 'error') {
      box.replaceChildren(h('article', { class: 'tile tile--full glass' }, h('div', { class: 'state' },
        h('p', { text: 'No pudimos cargar el resumen.' }),
        h('button', { class: 'btn', type: 'button', text: 'Reintentar', onclick: s.retry }))));
      return;
    }
    const d = s.d;
    const empty = d.active + d.due + d.expired === 0;
    box.replaceChildren(
      tile('tile--hero', 'Ingresos de hoy', num(fmtCOP.format(sumTotal(d.today)), 'tile__value--big'), methodRows(d.today, false)),
      tile('', 'Socios activos', num(d.active)),
      tile('tile--warn', 'Por vencer (3 días)', num(d.due)),
      tile('tile--bad', 'Vencidos', num(d.expired)),
      tile('', 'Siguiente paso', h('p', { class: 'tile__hint', text: empty ? 'Aún no hay socios. Registra el primero cuando esté lista la sección Socios.' : 'Todo al día. Cobros y socios llegan en las próximas entregas.' })),
      tile('tile--wide', 'Ingresos del mes por método', num(fmtCOP.format(sumTotal(d.month))), methodRows(d.month, true)));
  }

  function viewInicio() {
    const box = h('section', { class: 'bento', 'aria-label': 'Resumen del gimnasio' });
    const load = async () => {
      paint(box, { status: 'loading' });
      try {
        const t = todayCO();
        const [active, due, expired, today, month] = await Promise.all([
          repo.count('active'), repo.count('due_soon'), repo.count('expired'), repo.revenue(t, t), repo.revenue(monthStartCO(), t)]);
        paint(box, { status: 'ok', d: { active, due, expired, today, month } });
      } catch (e) {
        paint(box, { status: 'error', retry: load });
      }
    };
    load();
    return h('div', { class: 'page' }, h('h1', { class: 'page__title', text: 'Inicio' }), box);
  }

  /* ===== ROUTER + GUARD ===== */
  function route() {
    const hash = location.hash || '#/inicio';
    const p = store.state.profile;
    if (!p) {
      if (hash !== '#/login') { location.hash = '#/login'; return; }
      render(viewLogin());
      return;
    }
    const allowed = ACCESS[hash];
    if (hash === '#/login' || !allowed) { location.hash = HOME[p.role]; return; }
    if (!allowed.includes(p.role)) { render(shell(viewForbidden())); return; }
    render(shell(hash === '#/inicio' ? viewInicio() : viewSoon()));
  }

  /* ===== SESIÓN ===== */
  async function logout() {
    await repo.signOut();
    store.set({ profile: null });
    location.hash = '#/login';
    route();
  }
  async function start() {
    try {
      const { data } = await repo.session();
      if (data.session) {
        const p = await repo.profile(data.session.user.id);
        if (p && p.is_active) store.set({ profile: p });
        else { await repo.signOut(); toast('Tu cuenta no tiene un perfil activo. Contacta al dueño.'); }
      }
    } catch (e) { toast(friendly(e)); }
    resetIdle();
    route();
  }
  let idleTimer;
  function resetIdle() {
    clearTimeout(idleTimer);
    if (store.state.profile) idleTimer = setTimeout(logout, CONFIG.idleMs);
  }
  ['pointerdown', 'keydown', 'scroll'].forEach((ev) => addEventListener(ev, resetIdle, { passive: true }));

  /* ===== TILT 3D (única excepción: variables CSS --rx/--ry) ===== */
  function initTilt() {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    document.addEventListener('pointermove', (e) => {
      const t = e.target.closest && e.target.closest('.tilt');
      if (!t) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = t.getBoundingClientRect();
        t.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(2) + 'deg');
        t.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 12).toFixed(2) + 'deg');
      });
    });
    document.addEventListener('pointerout', (e) => {
      const t = e.target.closest && e.target.closest('.tilt');
      if (t && !t.contains(e.relatedTarget)) { t.style.removeProperty('--rx'); t.style.removeProperty('--ry'); }
    });
  }

  /* ===== BOOT ===== */
  document.addEventListener('DOMContentLoaded', () => {
    addEventListener('hashchange', route);
    sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT' && store.state.profile) { store.set({ profile: null }); route(); } });
    initTilt();
    start();
  });
})();
