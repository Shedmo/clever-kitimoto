(function () {
  'use strict';

  const KEY = 'cleverKitimotoMenuV1';
  const CUSTOM_KEY = 'cleverKitimotoCustomMenusV1';
  const ORDER_HISTORY_KEY = 'cleverKitimotoOrderHistoryV1';
  const SESSION_KEY = 'cleverKitimotoAdminSession';
  const ADMIN_USER = 'clever';
  const ADMIN_PASS = 'Clever@2026';
  const MAX_ATTEMPTS = 5;
  const LOCK_MS = 60000;

  let attempts = 0;
  let lockedUntil = 0;

  const groups = {
    'Choma': [['choma','½ KG','9,000'],['choma1','1 KG','18,000'],['choma15','1½ KG','27,000'],['choma2','2 KG','36,000']],
    'Choma ya Foil': [['foil','½ KG','9,000'],['foil1','1 KG','18,000'],['foil15','1½ KG','27,000'],['foil2','2 KG','36,000']],
    'Rosti': [['rosti','½ KG','8,500'],['rosti1','1 KG','17,000'],['rosti15','1½ KG','25,500'],['rosti2','2 KG','34,000']],
    'Kavu': [['kavu','½ KG','8,500'],['kavu1','1 KG','17,000'],['kavu15','1½ KG','25,500'],['kavu2','2 KG','34,000']],
    'Kisinia Packages': [['single','Single — Mtu 1','20,000'],['couple','Couple — Watu 2','35,000'],['family','Family — Watu 4','65,000']],
    'Mixed Packages': [['mixedhalf','½ KG Mix','25,000'],['mixedone','1 KG Mix','35,000'],['mixedtwo','2 KG Mix Special','65,000']],
    'Zege': [['zegeSingle','Zege Single','15,000'],['zegeCouple','Zege Couple','30,000'],['zegeSpecial','Zege Special','35,000']],
    'Sides': [['chipsiKavu','Chipsi Kavu','2,000'],['chipsiYai','Chipsi Yai','3,000'],['ndizi','Ndizi 1','500'],['ugali','Ugali 1','1,000'],['kachumbari','Kachumbari','1,000']]
  };

  const defaults = Object.fromEntries(Object.values(groups).flat().map(x => [x[0], x[2]]));

  function $(id) { return document.getElementById(id); }

  function setError(msg) {
    const el = $('err');
    if (el) el.textContent = msg || '';
  }

  function isSessionValid() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return s && s.user === ADMIN_USER && s.exp > Date.now();
    } catch {
      return false;
    }
  }

  function createSession() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      user: ADMIN_USER,
      exp: Date.now() + 8 * 60 * 60 * 1000
    }));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function showApp() {
    $('login')?.classList.add('hidden');
    $('app')?.classList.remove('hidden');
    render();
    renderOrders();
  }

  function showLogin() {
    $('login')?.classList.remove('hidden');
    $('app')?.classList.add('hidden');
  }

  function login() {
    const now = Date.now();
    if (now < lockedUntil) {
      const sec = Math.ceil((lockedUntil - now) / 1000);
      setError('Umejaribu mara nyingi. Subiri sekunde ' + sec + '.');
      return;
    }

    const user = ($('username')?.value || '').trim();
    const pass = $('password')?.value || '';

    if (!user || !pass) {
      setError('Weka jina la mtumiaji na nenosiri.');
      return;
    }

    const userOk = user.toLowerCase() === ADMIN_USER;
    const passOk = pass === ADMIN_PASS;

    if (userOk && passOk) {
      attempts = 0;
      setError('');
      createSession();
      showApp();
      return;
    }

    attempts += 1;
    if (attempts >= MAX_ATTEMPTS) {
      lockedUntil = now + LOCK_MS;
      attempts = 0;
      setError('Jaribio nyingi. Akaunti imefungwa kwa dakika 1.');
      return;
    }
    setError('Jina la mtumiaji au nenosiri si sahihi. (' + (MAX_ATTEMPTS - attempts) + ' majaribio yamesalia)');
    $('password').value = '';
    $('password')?.focus();
  }

  function logout() {
    if (!confirm('Toka kwenye Admin?')) return;
    clearSession();
    showLogin();
    $('password').value = '';
    setError('');
  }

  function togglePassword() {
    const input = $('password');
    const btn = $('togglePass');
    if (!input || !btn) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁';
    btn.setAttribute('aria-label', show ? 'Ficha nenosiri' : 'Onyesha nenosiri');
  }

  function render() {
    const d = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    let out = '';
    for (const [g, items] of Object.entries(groups)) {
      out += `<div class="panel"><h2>${g}</h2><div class="grid">`;
      for (const [k, l, v] of items) {
        out += `<div class="field"><label>${l}</label><input data-key="${k}" value="${d[k] || v}"></div>`;
      }
      out += '</div></div>';
    }
    $('forms').innerHTML = out;
    renderCustom();
  }

  function save() {
    const d = {};
    document.querySelectorAll('[data-key]').forEach(i => {
      d[i.dataset.key] = i.value.replace(/TSH/gi, '').trim();
    });
    localStorage.setItem(KEY, JSON.stringify(d));
    alert('Bei zimehifadhiwa! Fungua menu kuona mabadiliko.');
  }

  function resetPrices() {
    if (confirm('Rudisha bei zote kwenye default?')) {
      localStorage.removeItem(KEY);
      render();
    }
  }

  function getCustom() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch { return []; }
  }

  function addMenu() {
    const name = $('newName').value.trim();
    const category = $('newCategory').value;
    const price = $('newPrice').value.trim();
    const size = $('newSize').value.trim();
    const desc = $('newDesc').value.trim();
    const image = $('newImage').value.trim();
    if (!name || !price) { alert('Tafadhali weka jina la menu na bei.'); return; }
    const list = getCustom();
    list.push({ id: Date.now().toString(), name, category, price, size, desc, image, active: true });
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
    ['newName', 'newPrice', 'newSize', 'newDesc', 'newImage'].forEach(id => { if ($(id)) $(id).value = ''; });
    renderCustom();
    alert('Menu mpya imeongezwa.');
  }

  function renderCustom() {
    const el = $('customMenus');
    if (!el) return;
    const list = getCustom();
    if (!list.length) { el.innerHTML = '<div class="empty">Bado hujaongeza menu mpya.</div>'; return; }
    el.innerHTML = list.map(x => `
      <div class="custom-row">
        <div><b>${escapeHtml(x.name)}</b><div class="mini">${escapeHtml(x.category)} · ${escapeHtml(x.size || '')} · TSH ${escapeHtml(x.price)}</div></div>
        <button class="btn btn-delete" type="button" data-delete="${escapeHtml(x.id)}">🗑 Delete</button>
      </div>
    `).join('');
    el.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => deleteMenu(btn.dataset.delete));
    });
  }

  function deleteMenu(id) {
    if (!confirm('Futa menu hii?')) return;
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(getCustom().filter(x => x.id !== id)));
    renderCustom();
  }

  function escapeHtml(v) {
    return String(v).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  }

  function getOrders() {
    try {
      const saved = JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function formatOrderDate(iso) {
    try {
      return new Date(iso).toLocaleString('sw-TZ', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso || '—';
    }
  }

  function paymentLabel(val) {
    return ({ mpesa: 'M-Pesa', cash: 'Cash', lipa: 'Lipa namba' }[val] || val || '—');
  }

  function renderOrders() {
    const el = $('ordersList');
    if (!el) return;
    const orders = getOrders();
    if (!orders.length) {
      el.innerHTML = '<div class="empty">Hakuna oda bado. Oda zitaonekana hapa baada ya wateja kutuma WhatsApp/SMS.</div>';
      return;
    }
    el.innerHTML = orders.map(o => {
      const items = (o.items || []).map(i =>
        '<li>' + escapeHtml(i.qty + '× ' + i.name + (i.detail ? ' — ' + i.detail : '') +
          (i.price ? ' @ TSH ' + i.price : '')) + '</li>'
      ).join('');
      const sub = o.subtotal ? 'TSH ' + Number(o.subtotal).toLocaleString('en-US') : '—';
      return `
        <article class="order-card">
          <div class="order-card-head">
            <div>
              <strong>${escapeHtml(formatOrderDate(o.at))}</strong>
              <span class="order-meta">${escapeHtml(o.channel || '—')} · ${escapeHtml(paymentLabel(o.payment))}</span>
            </div>
            <strong class="order-total">${escapeHtml(sub)}</strong>
          </div>
          <div class="order-card-body">
            <div class="order-row"><span>Simu</span><b>${escapeHtml(o.phone || '—')}</b></div>
            <div class="order-row"><span>Aina</span><b>${escapeHtml(o.fulfillment === 'pickup' ? 'Pickup' : 'Delivery')}</b></div>
            ${o.address ? '<div class="order-row"><span>Mahali</span><b>' + escapeHtml(o.address) + '</b></div>' : ''}
            ${o.notes ? '<div class="order-row"><span>Maelezo</span><b>' + escapeHtml(o.notes) + '</b></div>' : ''}
          </div>
          ${items ? '<ul class="order-items">' + items + '</ul>' : ''}
        </article>
      `;
    }).join('');
  }

  function clearOrders() {
    if (!confirm('Futa historia yote ya oda?')) return;
    localStorage.removeItem(ORDER_HISTORY_KEY);
    renderOrders();
  }

  function bindEvents() {
    $('loginForm')?.addEventListener('submit', e => { e.preventDefault(); login(); });
    $('togglePass')?.addEventListener('click', togglePassword);
    $('logoutBtn')?.addEventListener('click', logout);
    $('saveBtn')?.addEventListener('click', save);
    $('resetBtn')?.addEventListener('click', resetPrices);
    $('addMenuBtn')?.addEventListener('click', addMenu);
    $('clearOrdersBtn')?.addEventListener('click', clearOrders);
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    if (isSessionValid()) showApp();
    else showLogin();
  });
})();
