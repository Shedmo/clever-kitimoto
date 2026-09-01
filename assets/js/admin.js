(function () {
  'use strict';

  const KEY = 'cleverKitimotoMenuV1';
  const CUSTOM_KEY = 'cleverKitimotoCustomMenusV1';
  const ORDER_HISTORY_KEY = 'cleverKitimotoOrderHistoryV1';
  const VISIT_LOG_KEY = 'cleverKitimotoVisitLogV1';
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
    renderDashboard();
    renderOrders();
    renderVisits();
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
    $('priceForms').innerHTML = out;
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

  function formatMoney(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  function isToday(iso) {
    const d = new Date(iso);
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  }

  function getVisits() {
    try {
      const saved = JSON.parse(localStorage.getItem(VISIT_LOG_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function computeStats() {
    const orders = getOrders();
    const visits = getVisits();
    const totalRevenue = orders.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);
    const todayOrders = orders.filter(o => isToday(o.at));
    const todayVisits = visits.filter(v => isToday(v.at));
    const uniqueVisitors = new Set(visits.map(v => v.visitorId)).size;
    const whatsapp = orders.filter(o => o.channel === 'whatsapp').length;
    const sms = orders.filter(o => o.channel === 'sms').length;

    return {
      orderCount: orders.length,
      totalRevenue,
      todayOrderCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((s, o) => s + (Number(o.subtotal) || 0), 0),
      visitCount: visits.length,
      todayVisitCount: todayVisits.length,
      uniqueVisitors,
      whatsapp,
      sms
    };
  }

  function renderDashboard() {
    const el = $('dashboardStats');
    if (!el) return;
    const s = computeStats();
    el.innerHTML = `
      <article class="stat-card stat-primary">
        <span class="stat-label">Jumla ya Mapato</span>
        <strong class="stat-value">TSH ${formatMoney(s.totalRevenue)}</strong>
        <span class="stat-sub">Leo: TSH ${formatMoney(s.todayRevenue)}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Oda Zote</span>
        <strong class="stat-value">${s.orderCount}</strong>
        <span class="stat-sub">Leo: ${s.todayOrderCount} · WhatsApp ${s.whatsapp} · SMS ${s.sms}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Wageni</span>
        <strong class="stat-value">${s.visitCount}</strong>
        <span class="stat-sub">Leo: ${s.todayVisitCount} · Unique: ${s.uniqueVisitors}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Wastani kwa Oda</span>
        <strong class="stat-value">${s.orderCount ? 'TSH ' + formatMoney(Math.round(s.totalRevenue / s.orderCount)) : '—'}</strong>
        <span class="stat-sub">Bila delivery</span>
      </article>
    `;
  }

  function renderOrdersSummary() {
    const el = $('ordersSummary');
    if (!el) return;
    const orders = getOrders();
    const total = orders.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);
    el.innerHTML = `
      <div class="summary-chip"><span>Oda</span><b>${orders.length}</b></div>
      <div class="summary-chip highlight"><span>Jumla ya Mapato</span><b>TSH ${formatMoney(total)}</b></div>
    `;
  }

  function renderVisitsSummary() {
    const el = $('visitsSummary');
    if (!el) return;
    const visits = getVisits();
    const unique = new Set(visits.map(v => v.visitorId)).size;
    const mobile = visits.filter(v => v.device === 'Mobile').length;
    el.innerHTML = `
      <div class="summary-chip"><span>Wageni</span><b>${visits.length}</b></div>
      <div class="summary-chip"><span>Unique</span><b>${unique}</b></div>
      <div class="summary-chip"><span>Mobile</span><b>${mobile}</b></div>
      <div class="summary-chip"><span>Desktop</span><b>${visits.length - mobile}</b></div>
    `;
  }

  function shortReferrer(ref) {
    if (!ref || ref === 'Direct') return 'Direct';
    try {
      const u = new URL(ref);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return ref.slice(0, 40);
    }
  }

  function renderVisits() {
    const el = $('visitsList');
    if (!el) return;
    renderVisitsSummary();
    const visits = getVisits();
    if (!visits.length) {
      el.innerHTML = '<tr><td colspan="5" class="empty-cell">Hakuna wageni bado. Wageni wataonekana watakapofungua menu.</td></tr>';
      return;
    }
    el.innerHTML = visits.map(v => `
      <tr>
        <td>${escapeHtml(formatOrderDate(v.at))}</td>
        <td><code class="visitor-id">${escapeHtml((v.visitorId || '—').slice(-10))}</code></td>
        <td>${escapeHtml(v.device || '—')}</td>
        <td>${escapeHtml(v.page || '—')}</td>
        <td>${escapeHtml(shortReferrer(v.referrer))}</td>
      </tr>
    `).join('');
  }

  function csvEscape(val) {
    const s = String(val ?? '');
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function downloadCsv(filename, rows) {
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportOrdersCsv() {
    const orders = getOrders();
    if (!orders.length) { alert('Hakuna oda za kupakua.'); return; }
    const header = ['Tarehe', 'Simu', 'Channel', 'Malipo', 'Aina', 'Mahali', 'Maelezo', 'Jumla TSH', 'Bidhaa'];
    const rows = [header.join(',')];
    orders.forEach(o => {
      const items = (o.items || []).map(i =>
        i.qty + 'x ' + i.name + (i.detail ? ' (' + i.detail + ')' : '') + (i.price ? ' @' + i.price : '')
      ).join('; ');
      rows.push([
        csvEscape(formatOrderDate(o.at)),
        csvEscape(o.phone),
        csvEscape(o.channel),
        csvEscape(paymentLabel(o.payment)),
        csvEscape(o.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'),
        csvEscape(o.address),
        csvEscape(o.notes),
        csvEscape(o.subtotal || 0),
        csvEscape(items)
      ].join(','));
    });
    downloadCsv('clever-kitimoto-oda-' + new Date().toISOString().slice(0, 10) + '.csv', rows);
  }

  function exportVisitsCsv() {
    const visits = getVisits();
    if (!visits.length) { alert('Hakuna wageni wa kupakua.'); return; }
    const header = ['Tarehe', 'Visitor ID', 'Kifaa', 'Ukurasa', 'Chanzo', 'Lugha', 'Screen'];
    const rows = [header.join(',')];
    visits.forEach(v => {
      rows.push([
        csvEscape(formatOrderDate(v.at)),
        csvEscape(v.visitorId),
        csvEscape(v.device),
        csvEscape(v.page),
        csvEscape(v.referrer),
        csvEscape(v.lang),
        csvEscape(v.screen)
      ].join(','));
    });
    downloadCsv('clever-kitimoto-wageni-' + new Date().toISOString().slice(0, 10) + '.csv', rows);
  }

  function printReport() {
    const s = computeStats();
    const orders = getOrders();
    const visits = getVisits();
    const w = window.open('', '_blank');
    if (!w) { alert('Ruhusu pop-ups kuchapisha ripoti.'); return; }
    const orderRows = orders.slice(0, 50).map(o => `
      <tr>
        <td>${escapeHtml(formatOrderDate(o.at))}</td>
        <td>${escapeHtml(o.phone || '—')}</td>
        <td>${escapeHtml(o.channel || '—')}</td>
        <td>TSH ${formatMoney(o.subtotal)}</td>
      </tr>
    `).join('');
    const visitRows = visits.slice(0, 50).map(v => `
      <tr>
        <td>${escapeHtml(formatOrderDate(v.at))}</td>
        <td>${escapeHtml((v.visitorId || '').slice(-10))}</td>
        <td>${escapeHtml(v.device || '—')}</td>
        <td>${escapeHtml(shortReferrer(v.referrer))}</td>
      </tr>
    `).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Clever Kitimoto Ripoti</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#2d1a12}
        h1{color:#7a1515;margin:0 0 4px} .meta{color:#6b5344;font-size:14px;margin-bottom:24px}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
        .stat{border:1px solid #ddd;border-radius:10px;padding:12px;background:#fff8e7}
        .stat span{display:block;font-size:11px;text-transform:uppercase;color:#6b5344}
        .stat b{font-size:20px;color:#7a1515}
        h2{font-size:16px;color:#7a1515;margin:24px 0 8px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
        th{background:#7a1515;color:#fff}
      </style></head><body>
      <h1>Clever Kitimoto — Ripoti</h1>
      <p class="meta">Imetengenezwa: ${escapeHtml(new Date().toLocaleString('sw-TZ'))}</p>
      <div class="stats">
        <div class="stat"><span>Jumla Mapato</span><b>TSH ${formatMoney(s.totalRevenue)}</b></div>
        <div class="stat"><span>Oda Zote</span><b>${s.orderCount}</b></div>
        <div class="stat"><span>Wageni</span><b>${s.visitCount}</b></div>
        <div class="stat"><span>Unique Wageni</span><b>${s.uniqueVisitors}</b></div>
      </div>
      <h2>Oda (50 za mwisho)</h2>
      <table><thead><tr><th>Tarehe</th><th>Simu</th><th>Channel</th><th>Jumla</th></tr></thead>
      <tbody>${orderRows || '<tr><td colspan="4">Hakuna oda</td></tr>'}</tbody></table>
      <h2>Wageni (50 wa mwisho)</h2>
      <table><thead><tr><th>Tarehe</th><th>Mgeni</th><th>Kifaa</th><th>Chanzo</th></tr></thead>
      <tbody>${visitRows || '<tr><td colspan="4">Hakuna wageni</td></tr>'}</tbody></table>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  function switchReportTab(tab) {
    document.querySelectorAll('.report-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    $('ordersPane')?.classList.toggle('active', tab === 'orders');
    $('visitsPane')?.classList.toggle('active', tab === 'visits');
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
    renderOrdersSummary();
    renderDashboard();
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

  function clearVisits() {
    if (!confirm('Futa historia yote ya wageni?')) return;
    localStorage.removeItem(VISIT_LOG_KEY);
    renderVisits();
    renderDashboard();
  }

  function bindEvents() {
    $('loginForm')?.addEventListener('submit', e => { e.preventDefault(); login(); });
    $('togglePass')?.addEventListener('click', togglePassword);
    $('logoutBtn')?.addEventListener('click', logout);
    $('saveBtn')?.addEventListener('click', save);
    $('resetBtn')?.addEventListener('click', resetPrices);
    $('addMenuBtn')?.addEventListener('click', addMenu);
    $('clearOrdersBtn')?.addEventListener('click', clearOrders);
    $('clearVisitsBtn')?.addEventListener('click', clearVisits);
    $('exportOrdersBtn')?.addEventListener('click', exportOrdersCsv);
    $('exportVisitsBtn')?.addEventListener('click', exportVisitsCsv);
    $('printReportBtn')?.addEventListener('click', printReport);
    document.querySelectorAll('.report-tab').forEach(btn => {
      btn.addEventListener('click', () => switchReportTab(btn.dataset.tab));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    if (isSessionValid()) showApp();
    else showLogin();
  });
})();
