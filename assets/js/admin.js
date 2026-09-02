(function () {
  'use strict';

  const KEY = 'cleverKitimotoMenuV1';
  const CUSTOM_KEY = 'cleverKitimotoCustomMenusV1';
  const ORDER_HISTORY_KEY = 'cleverKitimotoOrderHistoryV1';
  const VISIT_LOG_KEY = 'cleverKitimotoVisitLogV1';
  const SALES_ITEMS_KEY = 'cleverKitimotoSalesItemsV1';
  const SALES_LOG_KEY = 'cleverKitimotoSalesLogV1';
  const STOCK_LOG_KEY = 'cleverKitimotoStockLogV1';
  const BRANCHES_KEY = 'cleverKitimotoBranchesV1';
  const CURRENT_BRANCH_KEY = 'cleverKitimotoCurrentBranchV1';
  const SESSION_KEY = 'cleverKitimotoAdminSession';
  const MAX_ATTEMPTS = 5;
  const LOCK_MS = 60000;

  const ROLE_LABELS = {
    admin: 'Admin',
    manager: 'Meneja',
    seller: 'Muuzaji'
  };

  const ACCOUNTS = [
    { user: 'clever', pass: 'Clever@2026', role: 'admin' },
    { user: 'manager', pass: 'Manager@2026', role: 'manager' },
    { user: 'seller', pass: 'Seller@2026', role: 'seller' }
  ];

  const PERMS = {
    admin: ['dashboard', 'orders', 'users', 'visits', 'export', 'prices', 'menus', 'save', 'reset', 'clear', 'sales', 'sales_items', 'sales_clear', 'stock_add', 'branches'],
    manager: ['dashboard', 'orders', 'users', 'visits', 'export', 'prices', 'menus', 'save', 'sales', 'sales_items', 'stock_add', 'branches'],
    seller: ['dashboard', 'orders', 'users', 'visits', 'export', 'sales', 'stock_view']
  };

  let attempts = 0;
  let lockedUntil = 0;
  let userFilter = 'all';
  let userQuery = '';

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

  function getAllBranches() {
    try {
      const saved = JSON.parse(localStorage.getItem(BRANCHES_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function getBranches() {
    return getAllBranches().filter(b => b.active !== false);
  }

  function getBranchById(id) {
    return getAllBranches().find(b => b.id === id) || null;
  }

  function initBranches() {
    if (getAllBranches().length) return;
    const main = {
      id: 'br-main',
      name: 'Clever Kitimoto — Main',
      location: 'Dar es Salaam',
      phone: '0683 497 330',
      active: true,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(BRANCHES_KEY, JSON.stringify([main]));
    setCurrentBranchId(main.id);
  }

  function migrateBranchData() {
    const branches = getBranches();
    if (!branches.length) return;
    const mainId = branches[0].id;
    [SALES_ITEMS_KEY, SALES_LOG_KEY, STOCK_LOG_KEY].forEach(base => {
      const legacy = localStorage.getItem(base);
      const mainKey = branchStorageKey(base, mainId);
      if (legacy && !localStorage.getItem(mainKey)) {
        localStorage.setItem(mainKey, legacy);
      }
    });
    if (!getCurrentBranchId()) setCurrentBranchId(mainId);
  }

  function branchStorageKey(baseKey, branchId) {
    return baseKey + '__' + (branchId || getCurrentBranchId() || 'default');
  }

  function getCurrentBranchId() {
    const id = sessionStorage.getItem(CURRENT_BRANCH_KEY) || localStorage.getItem(CURRENT_BRANCH_KEY);
    if (id && getBranches().some(b => b.id === id)) return id;
    return getBranches()[0]?.id || '';
  }

  function getCurrentBranch() {
    return getBranchById(getCurrentBranchId());
  }

  function setCurrentBranchId(id) {
    if (!id) return;
    sessionStorage.setItem(CURRENT_BRANCH_KEY, id);
    localStorage.setItem(CURRENT_BRANCH_KEY, id);
  }

  function loadBranchData(baseKey, fallback, branchId) {
    return loadBranchDataFor(baseKey, branchId || getCurrentBranchId(), fallback);
  }

  function loadBranchDataFor(baseKey, branchId, fallback) {
    try {
      const raw = localStorage.getItem(branchStorageKey(baseKey, branchId));
      if (raw != null) return JSON.parse(raw);
      if (fallback !== undefined) return typeof fallback === 'string' ? JSON.parse(fallback) : fallback;
      return [];
    } catch {
      return fallback !== undefined && typeof fallback !== 'string' ? fallback : [];
    }
  }

  function saveBranchData(baseKey, data, branchId) {
    localStorage.setItem(branchStorageKey(baseKey, branchId), JSON.stringify(data));
  }

  function switchBranch(branchId) {
    if (!getBranchById(branchId)) return;
    setCurrentBranchId(branchId);
    populateBranchSelect();
    updateBranchBar();
    refreshBranchViews();
    showAdminToast('🏪 Tawi: ' + (getCurrentBranch()?.name || branchId));
  }

  function refreshBranchViews() {
    render();
    renderDashboard();
    renderUsers();
    renderOrders();
    renderVisits();
    renderSales();
    migrateStockFields();
    populateSaleItemSelect();
    renderSalesItems();
    renderStock();
    renderBranches();
  }

  function populateBranchSelect() {
    const sel = $('branchSelect');
    if (!sel) return;
    const branches = getBranches();
    const current = getCurrentBranchId();
    sel.innerHTML = branches.map(b =>
      `<option value="${escapeHtml(b.id)}"${b.id === current ? ' selected' : ''}>${escapeHtml(b.name)}</option>`
    ).join('');
  }

  function updateBranchBar() {
    const b = getCurrentBranch();
    const label = $('currentBranchLabel');
    const sub = $('branchBarSub');
    if (label) label.textContent = b?.name || '—';
    if (sub && b) {
      sub.textContent = [b.location, b.phone].filter(Boolean).join(' · ') || 'Chagua tawi la kufanya kazi';
    }
  }

  function registerBranch() {
    if (!hasPerm('branches')) return;
    const name = $('branchName')?.value.trim();
    const location = $('branchLocation')?.value.trim();
    const phone = $('branchPhone')?.value.trim();
    if (!name) {
      showAdminToast('Weka jina la tawi.', 'warn');
      return;
    }
    const list = getAllBranches();
    if (list.some(b => b.name.toLowerCase() === name.toLowerCase() && b.active !== false)) {
      showAdminToast('Tawi lenye jina hili lipo tayari.', 'warn');
      return;
    }
    const branch = {
      id: 'br-' + Date.now(),
      name,
      location: location || '',
      phone: phone || '',
      active: true,
      createdAt: new Date().toISOString()
    };
    list.push(branch);
    localStorage.setItem(BRANCHES_KEY, JSON.stringify(list));
    initSalesItemsForBranch(branch.id);
    ['branchName', 'branchLocation', 'branchPhone'].forEach(id => { if ($(id)) $(id).value = ''; });
    populateBranchSelect();
    renderBranches();
    showAdminToast('✓ Tawi limeandikishwa: ' + name);
  }

  function initSalesItemsForBranch(branchId) {
    const key = branchStorageKey(SALES_ITEMS_KEY, branchId);
    if (localStorage.getItem(key)) return;
    const mainId = getBranches()[0]?.id;
    if (mainId && mainId !== branchId) {
      const copy = localStorage.getItem(branchStorageKey(SALES_ITEMS_KEY, mainId));
      if (copy) {
        localStorage.setItem(key, copy);
        return;
      }
    }
    const items = DEFAULT_SALES_ITEMS.map((x, i) => ({
      id: 'si-' + branchId + '-' + i,
      ...x,
      trackStock: true,
      active: true
    }));
    localStorage.setItem(key, JSON.stringify(items));
  }

  function deactivateBranch(id) {
    if (!hasPerm('branches')) return;
    const branches = getBranches();
    if (branches.length <= 1) {
      showAdminToast('Huwezi kufuta tawi la mwisho.', 'warn');
      return;
    }
    if (!confirm('Futa (zima) tawi hili? Data yake itabaki kwenye kifaa.')) return;
    const list = getAllBranches().map(b =>
      b.id === id ? { ...b, active: false } : b
    );
    localStorage.setItem(BRANCHES_KEY, JSON.stringify(list));
    if (getCurrentBranchId() === id) {
      setCurrentBranchId(getBranches()[0]?.id || '');
    }
    populateBranchSelect();
    updateBranchBar();
    renderBranches();
    refreshBranchViews();
  }

  function renderBranches() {
    const el = $('branchesList');
    if (!el) return;
    const list = getBranches();
    if (!list.length) {
      el.innerHTML = '<div class="empty">Hakuna matawi. Ongeza tawi la kwanza hapo juu.</div>';
      return;
    }
    el.innerHTML = list.map(b => {
      const isCurrent = b.id === getCurrentBranchId();
      const sales = loadBranchDataFor(SALES_LOG_KEY, b.id, []);
      const branchSales = Array.isArray(sales) ? sales : [];
      const revenue = branchSales.reduce((s, x) => s + (Number(x.total) || 0), 0);
      const items = loadBranchDataFor(SALES_ITEMS_KEY, b.id, []);
      const stockItems = (Array.isArray(items) ? items : []).filter(x => x.trackStock !== false);
      const low = stockItems.filter(x => getStockStatus(x) === 'low').length;
      const out = stockItems.filter(x => getStockStatus(x) === 'out').length;
      return `
        <article class="branch-card${isCurrent ? ' branch-current' : ''}">
          <div class="branch-card-main">
            <div class="branch-card-head">
              <strong>${escapeHtml(b.name)}</strong>
              ${isCurrent ? '<span class="branch-now">Tawi la sasa</span>' : ''}
            </div>
            <div class="branch-meta">${escapeHtml([b.location, b.phone].filter(Boolean).join(' · ') || '—')}</div>
            <div class="branch-stats-mini">
              <span>Mauzo: ${branchSales.length}</span>
              <span>Mapato: TSH ${formatMoney(revenue)}</span>
              ${low ? `<span class="warn">Chini: ${low}</span>` : ''}
              ${out ? `<span class="danger">Imeisha: ${out}</span>` : ''}
            </div>
          </div>
          <div class="branch-card-actions">
            ${!isCurrent ? `<button type="button" class="btn btn-save btn-sm" data-switch-branch="${escapeHtml(b.id)}">Fungua</button>` : ''}
            ${hasPerm('branches') ? `<button type="button" class="btn btn-delete btn-sm" data-delete-branch="${escapeHtml(b.id)}">Futa</button>` : ''}
          </div>
        </article>`;
    }).join('');

    el.querySelectorAll('[data-switch-branch]').forEach(btn => {
      btn.addEventListener('click', () => switchBranch(btn.dataset.switchBranch));
    });
    el.querySelectorAll('[data-delete-branch]').forEach(btn => {
      btn.addEventListener('click', () => deactivateBranch(btn.dataset.deleteBranch));
    });
  }

  function setError(msg) {
    const el = $('err');
    if (el) el.textContent = msg || '';
  }

  function getSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (!s || !s.role || !s.user || s.exp <= Date.now()) return null;
      return s;
    } catch {
      return null;
    }
  }

  function hasPerm(perm) {
    const role = getSession()?.role;
    return !!(role && (PERMS[role] || []).includes(perm));
  }

  function isSessionValid() {
    return !!getSession();
  }

  function createSession(user, role) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      user,
      role,
      exp: Date.now() + 8 * 60 * 60 * 1000
    }));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function applyRoleUI() {
    const s = getSession();
    const badge = $('roleBadge');
    const sessionBadge = $('sessionBadge');
    if (badge && s) {
      badge.textContent = ROLE_LABELS[s.role] || s.role;
      badge.className = 'role-badge role-' + s.role;
    }
    if (sessionBadge && s) {
      sessionBadge.textContent = '🔓 ' + (ROLE_LABELS[s.role] || s.role);
    }

    $('priceSection')?.classList.toggle('hidden', !hasPerm('prices'));
    $('priceForms')?.classList.toggle('hidden', !hasPerm('prices'));
    $('menuSection')?.classList.toggle('hidden', !hasPerm('menus'));
    $('customMenuSection')?.classList.toggle('hidden', !hasPerm('menus'));
    $('saveSection')?.classList.toggle('hidden', !hasPerm('save'));
    $('salesPanel')?.classList.toggle('hidden', !hasPerm('sales'));
    $('salesItemsSection')?.classList.toggle('hidden', !hasPerm('sales_items'));
    const canEditStock = hasPerm('stock_add');
    const canViewStock = hasPerm('stock_view');
    $('stockPanel')?.classList.toggle('hidden', !canEditStock && !canViewStock);
    $('stockAlerts')?.classList.toggle('hidden', !canEditStock);
    const stockNote = $('stockPanelNote');
    if (stockNote) {
      stockNote.textContent = canEditStock
        ? 'Ongeza stock, fuatilia kilo zilizobaki — mauzo hupunguza otomatiki'
        : 'Muhtasari wa stock tu — huwezi kuhariri au kuongeza';
    }
    $('clearSalesBtn')?.classList.toggle('hidden', !hasPerm('sales_clear'));
    $('resetBtn')?.classList.toggle('hidden', !hasPerm('reset'));
    $('clearOrdersBtn')?.classList.toggle('hidden', !hasPerm('clear'));
    $('clearVisitsBtn')?.classList.toggle('hidden', !hasPerm('clear'));
    $('branchPanel')?.classList.toggle('hidden', !hasPerm('branches'));
    $('branchRegisterForm')?.classList.toggle('hidden', !hasPerm('branches'));
    $('registerBranchBtn')?.classList.toggle('hidden', !hasPerm('branches'));

    document.querySelectorAll('#priceForms .panel').forEach(p => {
      p.classList.toggle('hidden', !hasPerm('prices'));
    });
  }

  function showApp() {
    initBranches();
    migrateBranchData();
    getBranches().forEach(b => initSalesItemsForBranch(b.id));
    $('login')?.classList.add('hidden');
    $('app')?.classList.remove('hidden');
    applyRoleUI();
    populateBranchSelect();
    updateBranchBar();
    render();
    renderDashboard();
    renderUsers();
    renderOrders();
    renderVisits();
    renderSales();
    initSalesItems();
    migrateStockFields();
    populateSaleItemSelect();
    renderSalesItems();
    renderStock();
    renderBranches();
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

    const user = ($('username')?.value || '').trim().toLowerCase();
    const pass = $('password')?.value || '';

    if (!user || !pass) {
      setError('Weka jina la mtumiaji na nenosiri.');
      return;
    }

    const account = ACCOUNTS.find(a => a.user === user && a.pass === pass);

    if (account) {
      attempts = 0;
      setError('');
      createSession(account.user, account.role);
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
    applyRoleUI();
  }

  function save() {
    if (!hasPerm('save')) { alert('Huna ruhusa ya kuhifadhi bei.'); return; }
    const d = {};
    document.querySelectorAll('[data-key]').forEach(i => {
      d[i.dataset.key] = i.value.replace(/TSH/gi, '').trim();
    });
    localStorage.setItem(KEY, JSON.stringify(d));
    alert('Bei zimehifadhiwa! Fungua menu kuona mabadiliko.');
  }

  function resetPrices() {
    if (!hasPerm('reset')) return;
    if (confirm('Rudisha bei zote kwenye default?')) {
      localStorage.removeItem(KEY);
      render();
    }
  }

  function getCustom() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch { return []; }
  }

  function addMenu() {
    if (!hasPerm('menus')) return;
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

  const DEFAULT_SALES_ITEMS = [
    { name: 'Choma', category: 'Choma', unit: 'KG', price: 18000, stock: 20, lowStock: 3 },
    { name: 'Choma ya Foil', category: 'Choma ya Foil', unit: 'KG', price: 18000, stock: 20, lowStock: 3 },
    { name: 'Rosti', category: 'Rosti', unit: 'KG', price: 17000, stock: 20, lowStock: 3 },
    { name: 'Kavu', category: 'Kavu', unit: 'KG', price: 17000, stock: 20, lowStock: 3 },
    { name: '½ KG Mix', category: 'Mix', unit: 'Kifurushi', price: 25000, stock: 12, lowStock: 2 },
    { name: '1 KG Mix', category: 'Mix', unit: 'Kifurushi', price: 35000, stock: 10, lowStock: 2 },
    { name: 'Kisinia Single', category: 'Kisinia', unit: 'Kifurushi', price: 20000, stock: 15, lowStock: 3 },
    { name: 'Kisinia Couple', category: 'Kisinia', unit: 'Kifurushi', price: 35000, stock: 10, lowStock: 2 },
    { name: 'Kisinia Family', category: 'Kisinia', unit: 'Kifurushi', price: 65000, stock: 6, lowStock: 1 },
    { name: 'Chipsi Kavu', category: 'Sides', unit: 'Sahani', price: 2000, stock: 40, lowStock: 8 },
    { name: 'Chipsi Yai', category: 'Sides', unit: 'Sahani', price: 3000, stock: 30, lowStock: 6 },
    { name: 'Ugali', category: 'Sides', unit: 'Kipande', price: 1000, stock: 50, lowStock: 10 },
    { name: 'Ndizi', category: 'Sides', unit: 'Kipande', price: 500, stock: 60, lowStock: 12 }
  ];

  function getSalesItems() {
    try {
      const saved = loadBranchData(SALES_ITEMS_KEY, '[]');
      return Array.isArray(saved) ? saved.filter(x => x.active !== false) : [];
    } catch {
      return [];
    }
  }

  function getAllSalesItems() {
    try {
      const saved = loadBranchData(SALES_ITEMS_KEY, '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function initSalesItems() {
    if (getAllSalesItems().length) return;
    initSalesItemsForBranch(getCurrentBranchId());
  }

  function defaultStockForUnit(unit) {
    if (unit === 'KG') return { stock: 20, lowStock: 3 };
    if (unit === 'Kifurushi') return { stock: 10, lowStock: 2 };
    return { stock: 30, lowStock: 5 };
  }

  function migrateStockFields() {
    const list = getAllSalesItems();
    let changed = false;
    const migrated = list.map(x => {
      if (x.stock != null && x.lowStock != null && x.trackStock != null) return x;
      changed = true;
      const def = defaultStockForUnit(x.unit);
      return {
        ...x,
        stock: x.stock != null ? x.stock : def.stock,
        lowStock: x.lowStock != null ? x.lowStock : def.lowStock,
        trackStock: x.trackStock !== false
      };
    });
    if (changed) saveSalesItemsList(migrated);
  }

  function getStockLog() {
    try {
      const saved = loadBranchData(STOCK_LOG_KEY, '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function getStockStatus(item) {
    if (!item || item.trackStock === false) return 'untracked';
    const stock = Number(item.stock) || 0;
    const low = Number(item.lowStock) || 0;
    if (stock <= 0) return 'out';
    if (stock <= low) return 'low';
    return 'ok';
  }

  function stockStatusLabel(status) {
    return ({ ok: 'Salama', low: 'Chini', out: 'Imeisha', untracked: '—' }[status] || '—');
  }

  function formatStockQty(n, unit) {
    const v = Math.round(Number(n) * 100) / 100;
    return v + ' ' + (unit || '');
  }

  function saveSalesItemsList(list) {
    saveBranchData(SALES_ITEMS_KEY, list);
  }

  function updateItemStock(itemId, delta, type, note, ref) {
    const list = getAllSalesItems();
    const idx = list.findIndex(x => x.id === itemId && x.active !== false);
    if (idx < 0) return null;
    const item = list[idx];
    if (item.trackStock === false) return item;

    const before = Number(item.stock) || 0;
    const after = Math.max(0, Math.round((before + delta) * 100) / 100);
    list[idx] = { ...item, stock: after };
    saveSalesItemsList(list);

    const session = getSession();
    const log = getStockLog();
    const branch = getCurrentBranch();
    log.unshift({
      id: 'stk-' + Date.now(),
      at: new Date().toISOString(),
      type,
      itemId,
      itemName: item.name,
      unit: item.unit,
      qty: Math.abs(delta),
      delta,
      before,
      after,
      note: note || '',
      ref: ref || '',
      user: session?.user || 'staff',
      branchId: branch?.id || '',
      branchName: branch?.name || ''
    });
    if (log.length > 500) log.length = 500;
    saveBranchData(STOCK_LOG_KEY, log);

    return list[idx];
  }

  function addStockToItem(itemId, qty, note) {
    if (!hasPerm('stock_add')) {
      showAdminToast('Huna ruhusa ya kuongeza stock.', 'warn');
      return null;
    }
    const amount = parseFloat(qty);
    if (!amount || amount <= 0) {
      showAdminToast('Weka kiasi cha stock sahihi.', 'warn');
      return null;
    }
    const updated = updateItemStock(itemId, amount, 'in', note || 'Ongezeko la stock');
    if (updated) {
      populateSaleItemSelect();
      renderSalesItems();
      renderStock();
      renderDashboard();
      showAdminToast('✓ Stock imeongezwa: ' + updated.name + ' → ' + formatStockQty(updated.stock, updated.unit));
    }
    return updated;
  }

  function computeStockStats() {
    const items = getSalesItems().filter(x => x.trackStock !== false);
    let low = 0;
    let out = 0;
    let totalKg = 0;
    items.forEach(x => {
      const status = getStockStatus(x);
      if (status === 'low') low += 1;
      if (status === 'out') out += 1;
      if (x.unit === 'KG') totalKg += Number(x.stock) || 0;
    });
    return {
      tracked: items.length,
      low,
      out,
      ok: items.length - low - out,
      totalKg: Math.round(totalKg * 10) / 10
    };
  }

  function renderStock() {
    renderStockSummary();
    if (hasPerm('stock_add')) {
      renderStockAlerts();
      renderStockList();
    } else if (hasPerm('stock_view')) {
      const alertsEl = $('stockAlerts');
      const listEl = $('stockList');
      if (alertsEl) alertsEl.innerHTML = '';
      if (listEl) {
        const s = computeStockStats();
        listEl.innerHTML = `
          <div class="stock-view-only">
            <p class="stock-view-msg">Muuzaji: unaona jumla ya stock tu. Kuhariri au kuongeza, wasiliana na Meneja au Admin.</p>
            <div class="stock-view-totals">
              <div class="stock-view-stat"><span>Bidhaa</span><b>${s.tracked}</b></div>
              <div class="stock-view-stat ok"><span>Salama</span><b>${s.ok}</b></div>
              <div class="stock-view-stat${s.low ? ' warn' : ''}"><span>Chini</span><b>${s.low}</b></div>
              <div class="stock-view-stat${s.out ? ' danger' : ''}"><span>Imeisha</span><b>${s.out}</b></div>
              <div class="stock-view-stat highlight"><span>KG Jumla</span><b>${s.totalKg || '—'}</b></div>
            </div>
          </div>`;
      }
    }
  }

  function renderStockSummary() {
    const el = $('stockSummary');
    if (!el) return;
    const s = computeStockStats();
    el.innerHTML = `
      <div class="summary-chip"><span>Bidhaa zinazofuatiliwa</span><b>${s.tracked}</b></div>
      <div class="summary-chip"><span>Salama</span><b>${s.ok}</b></div>
      <div class="summary-chip ${s.low ? 'warn' : ''}"><span>Chini</span><b>${s.low}</b></div>
      <div class="summary-chip ${s.out ? 'danger' : ''}"><span>Imeisha</span><b>${s.out}</b></div>
      <div class="summary-chip highlight"><span>KG kwenye stoo</span><b>${s.totalKg || '—'}</b></div>
    `;
  }

  function renderStockAlerts() {
    const el = $('stockAlerts');
    if (!el) return;
    const alerts = getSalesItems()
      .filter(x => x.trackStock !== false)
      .filter(x => getStockStatus(x) !== 'ok')
      .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0));

    if (!alerts.length) {
      el.innerHTML = '<div class="stock-alert-ok">✓ Stock zote ziko salama kwa sasa</div>';
      return;
    }

    el.innerHTML = alerts.map(x => {
      const status = getStockStatus(x);
      return `
        <div class="stock-alert stock-alert-${status}">
          <span>${status === 'out' ? '🔴' : '⚠️'} <b>${escapeHtml(x.name)}</b> — ${escapeHtml(formatStockQty(x.stock, x.unit))} (${escapeHtml(stockStatusLabel(status))})</span>
          ${hasPerm('stock_add') ? `<button type="button" class="btn btn-save btn-sm" data-stock-add="${escapeHtml(x.id)}" data-stock-qty="${x.unit === 'KG' ? '5' : '10'}">+ Ongeza</button>` : ''}
        </div>`;
    }).join('');

    el.querySelectorAll('[data-stock-add]').forEach(btn => {
      btn.addEventListener('click', () => addStockToItem(btn.dataset.stockAdd, btn.dataset.stockQty));
    });
  }

  function renderStockList() {
    const el = $('stockList');
    if (!el) return;
    const items = getSalesItems();
    if (!items.length) {
      el.innerHTML = '<div class="empty">Hakuna bidhaa za kufuatilia stock.</div>';
      return;
    }

    el.innerHTML = items.map(x => {
      const status = getStockStatus(x);
      const stock = Number(x.stock) || 0;
      const low = Number(x.lowStock) || 0;
      const cap = Math.max(stock, low * 4, 1);
      const pct = Math.min(100, Math.round((stock / cap) * 100));
      const canAdd = hasPerm('stock_add');
      const presets = x.unit === 'KG' ? [1, 5, 10] : [5, 10, 20];

      return `
        <article class="stock-row stock-${status}">
          <div class="stock-row-main">
            <div class="stock-row-head">
              <div>
                <strong>${escapeHtml(x.name)}</strong>
                <span class="stock-meta">${escapeHtml(x.category)} · ${escapeHtml(x.unit)}</span>
              </div>
              <span class="stock-badge stock-badge-${status}">${escapeHtml(stockStatusLabel(status))}</span>
            </div>
            <div class="stock-bar-wrap">
              <div class="stock-bar"><div class="stock-bar-fill stock-bar-${status}" style="width:${pct}%"></div></div>
              <span class="stock-qty-label"><b>${escapeHtml(formatStockQty(stock, x.unit))}</b> · onyo &lt; ${escapeHtml(String(low))}</span>
            </div>
          </div>
          ${canAdd ? `
          <div class="stock-row-actions">
            ${presets.map(p => `<button type="button" class="stock-add-btn" data-stock-add="${escapeHtml(x.id)}" data-stock-qty="${p}">+${p}</button>`).join('')}
            <div class="stock-custom-add">
              <input type="number" min="0.01" step="0.01" placeholder="+" data-stock-input="${escapeHtml(x.id)}" aria-label="Ongeza stock ${escapeHtml(x.name)}">
              <button type="button" class="btn btn-back btn-sm" data-stock-custom="${escapeHtml(x.id)}">Ongeza</button>
            </div>
          </div>` : `
          <div class="stock-row-view">${x.trackStock === false ? 'Haifuatiliwi' : 'Angalia tu'}</div>`}
        </article>`;
    }).join('');

    el.querySelectorAll('[data-stock-add]').forEach(btn => {
      btn.addEventListener('click', () => addStockToItem(btn.dataset.stockAdd, btn.dataset.stockQty));
    });
    el.querySelectorAll('[data-stock-custom]').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = el.querySelector('[data-stock-input="' + btn.dataset.stockCustom + '"]');
        addStockToItem(btn.dataset.stockCustom, input?.value);
        if (input) input.value = '';
      });
    });
  }

  function getSalesLog() {
    try {
      const saved = loadBranchData(SALES_LOG_KEY, '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function addSalesItem() {
    if (!hasPerm('sales_items')) return;
    const name = $('salesItemName')?.value.trim();
    const category = $('salesItemCategory')?.value || 'Nyingine';
    const unit = $('salesItemUnit')?.value || 'KG';
    const price = parseInt($('salesItemPrice')?.value, 10);
    const stock = parseFloat($('salesItemStock')?.value);
    const lowStock = parseFloat($('salesItemLowStock')?.value);
    if (!name || !price) {
      showAdminToast('Weka jina la bidhaa na bei.', 'warn');
      return;
    }
    const def = defaultStockForUnit(unit);
    const list = getAllSalesItems();
    list.push({
      id: 'si-' + Date.now(),
      name,
      category,
      unit,
      price,
      stock: stock > 0 ? stock : def.stock,
      lowStock: lowStock > 0 ? lowStock : def.lowStock,
      trackStock: true,
      active: true
    });
    saveSalesItemsList(list);
    ['salesItemName', 'salesItemPrice', 'salesItemStock', 'salesItemLowStock'].forEach(id => { if ($(id)) $(id).value = ''; });
    renderSalesItems();
    populateSaleItemSelect();
    renderStock();
    showAdminToast('✓ Bidhaa imeongezwa na stock ya kuanza.');
  }

  function deleteSalesItem(id) {
    if (!hasPerm('sales_items')) return;
    if (!confirm('Futa bidhaa hii?')) return;
    const list = getAllSalesItems().map(x =>
      x.id === id ? { ...x, active: false } : x
    );
    saveSalesItemsList(list);
    renderSalesItems();
    populateSaleItemSelect();
    renderStock();
  }

  function renderSalesItems() {
    const el = $('salesItemsList');
    if (!el) return;
    const list = getSalesItems();
    if (!list.length) {
      el.innerHTML = '<div class="empty">Hakuna bidhaa. Ongeza bidhaa za mauzo hapo juu.</div>';
      return;
    }
    el.innerHTML = list.map(x => {
      const status = getStockStatus(x);
      const deleteBtn = hasPerm('sales_items')
        ? `<button class="btn btn-delete" type="button" data-delete-sales="${escapeHtml(x.id)}">🗑 Futa</button>`
        : '';
      return `
      <div class="custom-row">
        <div>
          <b>${escapeHtml(x.name)}</b>
          <div class="mini">${escapeHtml(x.category)} · ${escapeHtml(x.unit)} · TSH ${formatMoney(x.price)} / ${escapeHtml(x.unit)}</div>
          <div class="mini stock-mini stock-mini-${status}">Stock: ${escapeHtml(formatStockQty(x.stock, x.unit))} · ${escapeHtml(stockStatusLabel(status))}</div>
        </div>
        ${deleteBtn}
      </div>`;
    }).join('');
    el.querySelectorAll('[data-delete-sales]').forEach(btn => {
      btn.addEventListener('click', () => deleteSalesItem(btn.dataset.deleteSales));
    });
  }

  function populateSaleItemSelect() {
    const sel = $('saleItemSelect');
    if (!sel) return;
    const items = getSalesItems();
    const current = sel.value;
    sel.innerHTML = '<option value="">Chagua bidhaa...</option>' +
      items.map(x => {
        const status = getStockStatus(x);
        const stockTxt = x.trackStock === false ? '' : ' · Stoo: ' + formatStockQty(x.stock, x.unit);
        const warn = status === 'out' ? ' ⛔ IMEISHA' : status === 'low' ? ' ⚠ Chini' : '';
        const disabled = status === 'out' ? ' disabled' : '';
        return `<option value="${escapeHtml(x.id)}"${disabled}>${escapeHtml(x.name)} — TSH ${formatMoney(x.price)}/${escapeHtml(x.unit)}${escapeHtml(stockTxt)}${warn}</option>`;
      }).join('');
    if (current && items.some(x => x.id === current)) sel.value = current;
    updateSaleTotalPreview();
    renderSaleQtyPresets();
  }

  function getSelectedSaleItem() {
    const id = $('saleItemSelect')?.value;
    return getSalesItems().find(x => x.id === id) || null;
  }

  function updateSaleTotalPreview() {
    const item = getSelectedSaleItem();
    const qty = parseFloat($('saleQty')?.value) || 0;
    const hint = $('salePriceHint');
    const totalEl = $('saleTotal');
    if (!item) {
      if (hint) hint.textContent = 'Chagua bidhaa kwanza';
      return;
    }
    const unitPrice = Number(item.price) || 0;
    const total = item.unit === 'KG'
      ? Math.round(unitPrice * qty)
      : Math.round(unitPrice * (qty || 1));
    if (hint) {
      let text = 'TSH ' + formatMoney(unitPrice) + ' / ' + item.unit;
      if (qty > 0) text += ' · Jumla: TSH ' + formatMoney(total);
      if (item.trackStock !== false) {
        const status = getStockStatus(item);
        text += ' · Stoo: ' + formatStockQty(item.stock, item.unit);
        if (status === 'out') text += ' · IMEISHA';
        else if (status === 'low') text += ' · Chini';
        if (qty > 0 && qty > (Number(item.stock) || 0)) text += ' · HAITOSHI!';
      }
      hint.textContent = text;
      hint.classList.toggle('field-hint-warn', item.trackStock !== false && (getStockStatus(item) !== 'ok' || qty > (Number(item.stock) || 0)));
    }
    if (totalEl && qty > 0 && !totalEl.dataset.manual) {
      totalEl.value = total;
    }
  }

  function renderSaleQtyPresets() {
    const wrap = $('saleQtyPresets');
    const item = getSelectedSaleItem();
    if (!wrap) return;
    if (!item || item.unit !== 'KG') {
      wrap.innerHTML = '';
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    wrap.innerHTML = [0.5, 1, 1.5, 2].map(kg =>
      `<button type="button" class="sales-qty-btn" data-qty="${kg}">${kg} KG</button>`
    ).join('');
    wrap.querySelectorAll('.sales-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if ($('saleQty')) $('saleQty').value = btn.dataset.qty;
        if ($('saleTotal')) delete $('saleTotal').dataset.manual;
        updateSaleTotalPreview();
      });
    });
  }

  function recordSale() {
    if (!hasPerm('sales')) return;
    const item = getSelectedSaleItem();
    const qty = parseFloat($('saleQty')?.value);
    const total = parseInt($('saleTotal')?.value, 10);
    const payment = $('salePayment')?.value || 'cash';
    const phone = $('salePhone')?.value.trim() || '';
    const notes = $('saleNotes')?.value.trim() || '';
    const session = getSession();

    if (!item) { showAdminToast('Chagua bidhaa kwanza.', 'warn'); return; }
    if (!qty || qty <= 0) { showAdminToast('Weka kiasi sahihi.', 'warn'); return; }
    if (!total || total <= 0) { showAdminToast('Weka bei ya mauzo.', 'warn'); return; }

    if (item.trackStock !== false) {
      const avail = Number(item.stock) || 0;
      if (avail <= 0) {
        showAdminToast('Stock imeisha kwa ' + item.name + '. Ongeza stock kwanza.', 'warn');
        return;
      }
      if (qty > avail) {
        showAdminToast('Stock haitoshi. Ipo tu: ' + formatStockQty(avail, item.unit), 'warn');
        return;
      }
    }

    const branch = getCurrentBranch();
    const sale = {
      id: 'sale-' + Date.now(),
      at: new Date().toISOString(),
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      qty,
      unit: item.unit,
      unitPrice: item.price,
      total,
      payment,
      phone,
      notes,
      seller: session?.user || 'staff',
      branchId: branch?.id || '',
      branchName: branch?.name || ''
    };

    const log = getSalesLog();
    log.unshift(sale);
    if (log.length > 500) log.length = 500;
    saveBranchData(SALES_LOG_KEY, log);

    let stockAfter = null;
    if (item.trackStock !== false) {
      stockAfter = updateItemStock(item.id, -qty, 'sale', 'Mauzo', sale.id);
    }
    sale.stockAfter = stockAfter ? stockAfter.stock : null;

    ['saleQty', 'saleTotal', 'salePhone', 'saleNotes'].forEach(id => {
      if ($(id)) {
        $(id).value = '';
        if (id === 'saleTotal') delete $(id).dataset.manual;
      }
    });
    if ($('saleItemSelect')) $('saleItemSelect').value = '';
    updateSaleTotalPreview();
    renderSaleQtyPresets();
    renderSales();
    renderStock();
    renderDashboard();
    populateSaleItemSelect();
    showSaleSuccessDialog(sale);
  }

  function computeSalesStats() {
    const sales = getSalesLog();
    const total = sales.reduce((s, x) => s + (Number(x.total) || 0), 0);
    const today = sales.filter(x => isToday(x.at));
    const todayTotal = today.reduce((s, x) => s + (Number(x.total) || 0), 0);
    const kgSold = sales.reduce((s, x) => {
      if (x.unit === 'KG') return s + (Number(x.qty) || 0);
      return s;
    }, 0);
    const byItem = {};
    sales.forEach(x => {
      const key = x.itemName || 'Nyingine';
      if (!byItem[key]) byItem[key] = { qty: 0, total: 0, unit: x.unit };
      byItem[key].qty += Number(x.qty) || 0;
      byItem[key].total += Number(x.total) || 0;
    });
    return {
      count: sales.length,
      total,
      todayCount: today.length,
      todayTotal,
      kgSold: Math.round(kgSold * 10) / 10,
      byItem
    };
  }

  function renderSalesSummary() {
    const el = $('salesSummary');
    if (!el) return;
    const s = computeSalesStats();
    el.innerHTML = `
      <div class="summary-chip highlight"><span>Jumla Mauzo</span><b>TSH ${formatMoney(s.total)}</b></div>
      <div class="summary-chip"><span>Leo</span><b>TSH ${formatMoney(s.todayTotal)}</b></div>
      <div class="summary-chip"><span>Mauzo</span><b>${s.count}</b></div>
      <div class="summary-chip"><span>Leo</span><b>${s.todayCount}</b></div>
      <div class="summary-chip"><span>KG iliyouzwa</span><b>${s.kgSold || '—'}</b></div>
    `;
  }

  function renderSalesBreakdown() {
    const el = $('salesBreakdown');
    if (!el) return;
    const { byItem } = computeSalesStats();
    const entries = Object.entries(byItem).sort((a, b) => b[1].total - a[1].total);
    if (!entries.length) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `
      <div class="sales-breakdown-head">Mauzo kwa bidhaa</div>
      <div class="sales-breakdown-grid">
        ${entries.slice(0, 8).map(([name, data]) => `
          <div class="sales-breakdown-chip">
            <b>${escapeHtml(name)}</b>
            <span>${data.qty} ${escapeHtml(data.unit)} · TSH ${formatMoney(data.total)}</span>
          </div>
        `).join('')}
      </div>`;
  }

  function renderSales() {
    renderSalesSummary();
    renderSalesBreakdown();
    renderDashboard();
    const el = $('salesList');
    if (!el) return;
    const sales = getSalesLog();
    if (!sales.length) {
      el.innerHTML = '<div class="empty">Hakuna mauzo bado. Rekodi mauzo kwenye sehemu ya Mauzo ya Nyama.</div>';
      return;
    }
    el.innerHTML = sales.slice(0, 50).map(x => `
      <article class="order-card sales-card">
        <div class="order-card-head">
          <div>
            <strong>${escapeHtml(formatOrderDate(x.at))}</strong>
            <span class="order-meta">${escapeHtml(x.category)} · ${escapeHtml(paymentLabel(x.payment))} · ${escapeHtml(x.seller || 'staff')}${x.branchName ? ' · ' + escapeHtml(x.branchName) : ''}</span>
          </div>
          <strong class="order-total">TSH ${formatMoney(x.total)}</strong>
        </div>
        <div class="order-card-body">
          <div class="order-row"><span>Bidhaa</span><b>${escapeHtml(x.itemName)}</b></div>
          <div class="order-row"><span>Kiasi</span><b>${escapeHtml(String(x.qty))} ${escapeHtml(x.unit)}</b></div>
          ${x.phone ? '<div class="order-row"><span>Simu</span><b>' + escapeHtml(x.phone) + '</b></div>' : ''}
          ${x.notes ? '<div class="order-row"><span>Maelezo</span><b>' + escapeHtml(x.notes) + '</b></div>' : ''}
        </div>
      </article>
    `).join('');
  }

  function exportSalesCsv() {
    const sales = getSalesLog();
    const branch = getCurrentBranch();
    if (!sales.length) { alert('Hakuna mauzo ya kupakua.'); return; }
    const header = ['Tarehe', 'Tawi', 'Bidhaa', 'Aina', 'Kiasi', 'Kipimo', 'Bei/TSH', 'Jumla TSH', 'Malipo', 'Simu', 'Maelezo', 'Muuzaji'];
    const rows = [header.join(',')];
    sales.forEach(x => {
      rows.push([
        csvEscape(formatOrderDate(x.at)),
        csvEscape(x.branchName || branch?.name || ''),
        csvEscape(x.itemName),
        csvEscape(x.category),
        csvEscape(x.qty),
        csvEscape(x.unit),
        csvEscape(x.unitPrice),
        csvEscape(x.total),
        csvEscape(paymentLabel(x.payment)),
        csvEscape(x.phone),
        csvEscape(x.notes),
        csvEscape(x.seller)
      ].join(','));
    });
    const slug = (branch?.name || 'mauzo').replace(/[^\w\-]+/g, '-').slice(0, 24);
    downloadCsv('clever-kitimoto-mauzo-' + slug + '-' + new Date().toISOString().slice(0, 10) + '.csv', rows);
  }

  function clearSales() {
    if (!hasPerm('sales_clear')) return;
    const branch = getCurrentBranch();
    const label = branch?.name || 'tawi hili';
    if (!confirm('Futa historia yote ya mauzo kwa ' + label + '?')) return;
    localStorage.removeItem(branchStorageKey(SALES_LOG_KEY));
    renderSales();
  }

  function escapeHtml(v) {
    return String(v).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  }

  let adminDialogTimer = null;
  let adminToastTimer = null;

  function closeAdminDialog() {
    const el = $('adminDialog');
    if (!el) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    if (adminDialogTimer) {
      clearTimeout(adminDialogTimer);
      adminDialogTimer = null;
    }
  }

  function showAdminToast(msg, type) {
    const el = $('adminToast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'admin-toast visible' + (type ? ' admin-toast-' + type : '');
    if (adminToastTimer) clearTimeout(adminToastTimer);
    adminToastTimer = setTimeout(() => {
      el.classList.remove('visible');
    }, 3200);
  }

  function showSaleSuccessDialog(sale) {
    const body = $('adminDialogBody');
    const dialog = $('adminDialog');
    if (!body || !dialog) return;

    const stats = computeSalesStats();
    const payIcon = { cash: '💵', mpesa: '📱', lipa: '💳' }[sale.payment] || '💰';

    body.innerHTML = `
      <div class="sale-success-dialog">
        <div class="ssd-icon-wrap" aria-hidden="true">
          <span class="ssd-ring"></span>
          <span class="ssd-check">✓</span>
        </div>
        <h3 class="ssd-title" id="adminDialogTitle">Mauzo Yamerekodiwa!</h3>
        <p class="ssd-sub">Imehifadhiwa kwa mafanikio · ${escapeHtml(formatOrderDate(sale.at))}${sale.branchName ? ' · ' + escapeHtml(sale.branchName) : ''}</p>
        <div class="ssd-card">
          <div class="ssd-item-head">
            <span class="ssd-cat">${escapeHtml(sale.category || 'Bidhaa')}</span>
            <strong>${escapeHtml(sale.itemName)}</strong>
          </div>
          <div class="ssd-rows">
            <div class="ssd-row"><span>Kiasi</span><b>${escapeHtml(String(sale.qty))} ${escapeHtml(sale.unit)}</b></div>
            <div class="ssd-row"><span>Malipo</span><b>${payIcon} ${escapeHtml(paymentLabel(sale.payment))}</b></div>
            ${sale.phone ? '<div class="ssd-row"><span>Simu</span><b>' + escapeHtml(sale.phone) + '</b></div>' : ''}
            ${sale.notes ? '<div class="ssd-row"><span>Maelezo</span><b>' + escapeHtml(sale.notes) + '</b></div>' : ''}
            <div class="ssd-row"><span>Muuzaji</span><b>${escapeHtml(sale.seller || 'staff')}</b></div>
            ${sale.stockAfter != null ? '<div class="ssd-row"><span>Stock baada ya mauzo</span><b>' + escapeHtml(formatStockQty(sale.stockAfter, sale.unit)) + '</b></div>' : ''}
          </div>
          <div class="ssd-total">
            <span>Jumla</span>
            <strong>TSH ${formatMoney(sale.total)}</strong>
          </div>
        </div>
        <div class="ssd-smart">
          <div class="ssd-smart-chip"><span>Leo</span><b>TSH ${formatMoney(stats.todayTotal)}</b></div>
          <div class="ssd-smart-chip"><span>Mauzo leo</span><b>${stats.todayCount}</b></div>
          <div class="ssd-smart-chip"><span>KG leo</span><b>${stats.kgSold || '—'}</b></div>
        </div>
      </div>`;

    dialog.classList.add('open');
    dialog.setAttribute('aria-hidden', 'false');
    $('adminDialogOk')?.focus();

    if (adminDialogTimer) clearTimeout(adminDialogTimer);
    adminDialogTimer = setTimeout(closeAdminDialog, 7000);
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
    const uniqueCustomers = new Set(orders.map(o => (o.phone || '').trim()).filter(Boolean)).size;
    const whatsapp = orders.filter(o => o.channel === 'whatsapp').length;
    const sms = orders.filter(o => o.channel === 'sms').length;
    const sales = computeSalesStats();
    const stock = computeStockStats();

    return {
      orderCount: orders.length,
      totalRevenue,
      todayOrderCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((s, o) => s + (Number(o.subtotal) || 0), 0),
      visitCount: visits.length,
      todayVisitCount: todayVisits.length,
      uniqueVisitors,
      uniqueCustomers,
      whatsapp,
      sms,
      salesCount: sales.count,
      salesTotal: sales.total,
      salesToday: sales.todayTotal,
      salesTodayCount: sales.todayCount,
      kgSold: sales.kgSold,
      stockLow: stock.low,
      stockOut: stock.out,
      stockKg: stock.totalKg
    };
  }

  function computeDashboardData() {
    const s = computeStats();
    const sales = getSalesLog();
    const orders = getOrders();
    const todaySales = sales.filter(x => isToday(x.at));

    const todayByItem = {};
    todaySales.forEach(x => {
      const k = x.itemName || 'Nyingine';
      if (!todayByItem[k]) todayByItem[k] = { qty: 0, total: 0, unit: x.unit };
      todayByItem[k].qty += Number(x.qty) || 0;
      todayByItem[k].total += Number(x.total) || 0;
    });
    const topToday = Object.entries(todayByItem).sort((a, b) => b[1].total - a[1].total)[0] || null;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = i === 0 ? 'Leo' : d.toLocaleDateString('sw-TZ', { weekday: 'short' });
      const daySales = sales.filter(x => x.at && x.at.slice(0, 10) === key);
      const dayOrders = orders.filter(x => x.at && x.at.slice(0, 10) === key);
      const salesTotal = daySales.reduce((sum, x) => sum + (Number(x.total) || 0), 0);
      const ordersTotal = dayOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
      days.push({
        key,
        label,
        salesTotal,
        ordersTotal,
        total: salesTotal + ordersTotal,
        count: daySales.length + dayOrders.length,
        isToday: i === 0
      });
    }
    const maxDayTotal = Math.max(...days.map(d => d.total), 1);

    const activity = [
      ...sales.slice(0, 25).map(x => ({
        type: 'sale',
        at: x.at,
        title: x.itemName,
        sub: String(x.qty) + ' ' + (x.unit || ''),
        amount: Number(x.total) || 0,
        payment: x.payment,
        seller: x.seller
      })),
      ...orders.slice(0, 25).map(o => ({
        type: 'order',
        at: o.at,
        title: o.phone || 'Oda mpya',
        sub: ((o.items || []).length) + ' bidhaa · ' + (o.channel || '—'),
        amount: Number(o.subtotal) || 0,
        payment: o.payment,
        seller: o.channel
      }))
    ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 10);

    const insights = [];
    if (s.stockOut > 0) {
      insights.push({ type: 'danger', icon: '🔴', text: s.stockOut + ' bidhaa zimeisha stock — ongeza haraka!' });
    } else if (s.stockLow > 0) {
      insights.push({ type: 'warn', icon: '⚠️', text: s.stockLow + ' bidhaa ziko chini ya kiwango cha onyo' });
    } else {
      insights.push({ type: 'ok', icon: '✓', text: 'Stock zote ziko salama kwa tawi hili' });
    }

    const todayCombined = s.todayRevenue + s.salesToday;
    if (todayCombined > 0) {
      insights.push({ type: 'money', icon: '💰', text: 'Mapato ya leo: TSH ' + formatMoney(todayCombined) });
    } else {
      insights.push({ type: 'info', icon: '📋', text: 'Hakuna mapato leo bado — rekodi mauzo au subiri oda' });
    }

    if (topToday) {
      insights.push({
        type: 'hot',
        icon: '🔥',
        text: 'Leo ' + topToday[0] + ' inaongoza (TSH ' + formatMoney(topToday[1].total) + ')'
      });
    }

    if (s.todayVisitCount > 0 && s.todayVisitCount > s.todayOrderCount) {
      insights.push({
        type: 'info',
        icon: '👀',
        text: s.todayVisitCount + ' wageni leo, oda ' + s.todayOrderCount + ' — fuatilia ubadilishaji'
      });
    }

    if (s.salesTodayCount > 0) {
      insights.push({
        type: 'sale',
        icon: '🥩',
        text: s.salesTodayCount + ' mauzo leo · ' + (s.kgSold ? s.kgSold + ' KG jumla' : 'rekodi imeendelea vizuri')
      });
    }

    const { byItem } = computeSalesStats();
    const topAll = Object.entries(byItem).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
    const stock = computeStockStats();
    const stockPct = stock.tracked ? Math.round((stock.ok / stock.tracked) * 100) : 100;

    const payMix = { cash: 0, mpesa: 0, lipa: 0 };
    todaySales.forEach(x => {
      if (payMix[x.payment] != null) payMix[x.payment] += Number(x.total) || 0;
    });
    const payTotal = Object.values(payMix).reduce((a, b) => a + b, 0) || 1;

    return {
      ...s,
      topToday,
      days,
      maxDayTotal,
      activity,
      insights,
      topAll,
      stockPct,
      todayCombined,
      stock,
      payMix,
      payTotal
    };
  }

  function dashGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Habari za asubuhi';
    if (h < 17) return 'Habari za mchana';
    return 'Habari za jioni';
  }

  function dashStatusLabel(d) {
    if (d.stockOut > 0) return { text: 'Stock inahitaji umakini', cls: 'danger' };
    if (d.stockLow > 0) return { text: 'Stock chini — angalia stoo', cls: 'warn' };
    if (d.todayCombined > 0) return { text: 'Biashara inaendelea vizuri', cls: 'ok' };
    return { text: 'Tayari kwa siku mpya', cls: 'neutral' };
  }

  function scrollToPanel(id) {
    const el = $(id);
    if (!el) return;
    el.classList.remove('hidden');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderDashboard() {
    const root = $('dashboardRoot');
    if (!root) return;

    const d = computeDashboardData();
    const branch = getCurrentBranch();
    const status = dashStatusLabel(d);
    const now = new Date();
    const dateStr = now.toLocaleDateString('sw-TZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const combinedTotal = d.totalRevenue + d.salesTotal;
    const avgOrder = d.orderCount ? Math.round(d.totalRevenue / d.orderCount) : 0;
    const canSales = hasPerm('sales');
    const canStock = hasPerm('stock_add') || hasPerm('stock_view');

    root.innerHTML = `
      <section class="dash-hero">
        <div class="dash-hero-main">
          <span class="dash-hero-greet">${dashGreeting()} 👋</span>
          <h3 class="dash-hero-title">${escapeHtml(branch?.name || 'Clever Kitimoto')}</h3>
          <p class="dash-hero-date">${escapeHtml(dateStr)}</p>
          <div class="dash-hero-tags">
            <span class="dash-pill dash-pill-${status.cls}">${escapeHtml(status.text)}</span>
            ${branch?.location ? '<span class="dash-pill dash-pill-muted">📍 ' + escapeHtml(branch.location) + '</span>' : ''}
          </div>
        </div>
        <div class="dash-hero-kpi">
          <span class="dash-hero-kpi-label">Mapato Leo</span>
          <strong class="dash-hero-kpi-value">TSH ${formatMoney(d.todayCombined)}</strong>
          <span class="dash-hero-kpi-sub">${d.todayOrderCount + d.salesTodayCount} shughuli leo</span>
        </div>
      </section>

      <div class="dash-insights" role="list">
        ${d.insights.map(ins => `
          <div class="dash-insight dash-insight-${ins.type}" role="listitem">
            <span class="dash-insight-icon" aria-hidden="true">${ins.icon}</span>
            <span>${escapeHtml(ins.text)}</span>
          </div>
        `).join('')}
      </div>

      <div class="dash-kpi-grid">
        <article class="dash-kpi dash-kpi-primary">
          <div class="dash-kpi-icon" aria-hidden="true">💰</div>
          <div class="dash-kpi-body">
            <span class="dash-kpi-label">Jumla Mapato</span>
            <strong class="dash-kpi-value">TSH ${formatMoney(combinedTotal)}</strong>
            <span class="dash-kpi-sub">Oda TSH ${formatMoney(d.totalRevenue)} · Mauzo TSH ${formatMoney(d.salesTotal)}</span>
          </div>
        </article>
        <article class="dash-kpi dash-kpi-sales">
          <div class="dash-kpi-icon" aria-hidden="true">🥩</div>
          <div class="dash-kpi-body">
            <span class="dash-kpi-label">Mauzo ya Nyama</span>
            <strong class="dash-kpi-value">${d.salesCount}</strong>
            <span class="dash-kpi-sub">Leo ${d.salesTodayCount} · ${d.kgSold || 0} KG · TSH ${formatMoney(d.salesToday)}</span>
          </div>
        </article>
        <article class="dash-kpi dash-kpi-stock${d.stockOut ? ' dash-kpi-danger' : d.stockLow ? ' dash-kpi-warn' : ''}">
          <div class="dash-kpi-ring" style="--pct:${d.stockPct}" aria-hidden="true">
            <span>${d.stockPct}%</span>
          </div>
          <div class="dash-kpi-body">
            <span class="dash-kpi-label">Stock / Stoo</span>
            <strong class="dash-kpi-value">${d.stockOut ? d.stockOut + ' imeisha' : d.stockLow ? d.stockLow + ' chini' : 'Salama'}</strong>
            <span class="dash-kpi-sub">${d.stockKg || 0} KG kwenye stoo · ${d.stock.ok}/${d.stock.tracked} bidhaa</span>
          </div>
        </article>
        <article class="dash-kpi">
          <div class="dash-kpi-icon" aria-hidden="true">📱</div>
          <div class="dash-kpi-body">
            <span class="dash-kpi-label">Wateja & Oda</span>
            <strong class="dash-kpi-value">${d.orderCount}</strong>
            <span class="dash-kpi-sub">${d.uniqueCustomers} wateja · Leo ${d.todayOrderCount} · WA ${d.whatsapp} SMS ${d.sms}</span>
          </div>
        </article>
      </div>

      <div class="dash-main-grid">
        <article class="dash-card dash-card-chart">
          <div class="dash-card-head">
            <h4>📈 Mapato — Siku 7</h4>
            <span class="dash-card-meta">Oda + mauzo kwa tawi</span>
          </div>
          <div class="dash-chart">
            ${d.days.map(day => {
              return `
                <div class="dash-bar-col${day.isToday ? ' is-today' : ''}">
                  <div class="dash-bar-wrap">
                    <div class="dash-bar dash-bar-sales" style="height:${day.salesTotal ? Math.max(4, Math.round((day.salesTotal / d.maxDayTotal) * 100)) : 0}%" title="Mauzo"></div>
                    <div class="dash-bar dash-bar-orders" style="height:${day.ordersTotal ? Math.max(4, Math.round((day.ordersTotal / d.maxDayTotal) * 100)) : 0}%" title="Oda"></div>
                  </div>
                  <span class="dash-bar-val">${day.total ? (day.total >= 1000 ? Math.round(day.total / 1000) + 'k' : day.total) : '—'}</span>
                  <span class="dash-bar-label">${escapeHtml(day.label)}</span>
                </div>`;
            }).join('')}
          </div>
          <div class="dash-chart-legend">
            <span><i class="leg leg-sales"></i> Mauzo</span>
            <span><i class="leg leg-orders"></i> Oda</span>
          </div>
        </article>

        <article class="dash-card">
          <div class="dash-card-head">
            <h4>🏆 Bidhaa Zinazouzwa</h4>
            <span class="dash-card-meta">Kwa tawi hili</span>
          </div>
          ${d.topAll.length ? `
            <ul class="dash-rank-list">
              ${d.topAll.map(([name, data], i) => {
                const pct = d.salesTotal ? Math.round((data.total / d.salesTotal) * 100) : 0;
                return `
                  <li class="dash-rank-item">
                    <span class="dash-rank-num">${i + 1}</span>
                    <div class="dash-rank-body">
                      <div class="dash-rank-row">
                        <strong>${escapeHtml(name)}</strong>
                        <span>TSH ${formatMoney(data.total)}</span>
                      </div>
                      <div class="dash-rank-bar"><span style="width:${pct}%"></span></div>
                      <small>${data.qty} ${escapeHtml(data.unit)} · ${pct}% ya mauzo</small>
                    </div>
                  </li>`;
              }).join('')}
            </ul>` : '<p class="dash-empty">Hakuna mauzo bado. Rekodi mauzo ya kwanza.</p>'}
        </article>

        <article class="dash-card">
          <div class="dash-card-head">
            <h4>💳 Malipo Leo</h4>
            <span class="dash-card-meta">Mauzo ya leo tu</span>
          </div>
          ${d.payTotal > 1 ? `
            <ul class="dash-pay-list">
              ${[
                { key: 'cash', label: 'Cash', icon: '💵' },
                { key: 'mpesa', label: 'M-Pesa', icon: '📱' },
                { key: 'lipa', label: 'Lipa namba', icon: '💳' }
              ].map(p => {
                const amt = d.payMix[p.key] || 0;
                const pct = Math.round((amt / d.payTotal) * 100);
                return `
                  <li class="dash-pay-item">
                    <span class="dash-pay-icon">${p.icon}</span>
                    <div class="dash-pay-body">
                      <div class="dash-rank-row">
                        <strong>${p.label}</strong>
                        <span>TSH ${formatMoney(amt)}</span>
                      </div>
                      <div class="dash-rank-bar dash-pay-bar"><span style="width:${pct}%"></span></div>
                    </div>
                    <span class="dash-pay-pct">${pct}%</span>
                  </li>`;
              }).join('')}
            </ul>` : '<p class="dash-empty">Hakuna mauzo ya leo bado.</p>'}
        </article>

        <article class="dash-card dash-card-stats">
          <div class="dash-card-head">
            <h4>📊 Takwimu za Haraka</h4>
          </div>
          <div class="dash-mini-stats">
            <div class="dash-mini-stat">
              <span>Wageni</span>
              <b>${d.visitCount}</b>
              <small>Leo ${d.todayVisitCount}</small>
            </div>
            <div class="dash-mini-stat">
              <span>Unique</span>
              <b>${d.uniqueVisitors}</b>
              <small>wageni tofauti</small>
            </div>
            <div class="dash-mini-stat">
              <span>Wastani Oda</span>
              <b>${avgOrder ? 'TSH ' + formatMoney(avgOrder) : '—'}</b>
              <small>bila delivery</small>
            </div>
            <div class="dash-mini-stat">
              <span>Mauzo Leo</span>
              <b>TSH ${formatMoney(d.salesToday)}</b>
              <small>${d.salesTodayCount} rekodi</small>
            </div>
          </div>
        </article>
      </div>

      <div class="dash-bottom-grid">
        <article class="dash-card dash-card-activity">
          <div class="dash-card-head">
            <h4>⚡ Shughuli za Hivi Karibuni</h4>
            <span class="dash-card-meta">Mauzo & oda</span>
          </div>
          ${d.activity.length ? `
            <ul class="dash-activity-list">
              ${d.activity.map(a => `
                <li class="dash-activity-item dash-activity-${a.type}">
                  <span class="dash-activity-icon">${a.type === 'sale' ? '🥩' : '📲'}</span>
                  <div class="dash-activity-body">
                    <strong>${escapeHtml(a.title)}</strong>
                    <span>${escapeHtml(a.sub)} · ${escapeHtml(formatOrderDate(a.at))}</span>
                  </div>
                  <div class="dash-activity-amt">
                    <b>TSH ${formatMoney(a.amount)}</b>
                    <small>${escapeHtml(paymentLabel(a.payment))}</small>
                  </div>
                </li>
              `).join('')}
            </ul>` : '<p class="dash-empty">Hakuna shughuli bado. Rekodi mauzo au subiri oda kutoka menu.</p>'}
        </article>

        <article class="dash-card dash-card-actions">
          <div class="dash-card-head">
            <h4>🚀 Vitendo vya Haraka</h4>
          </div>
          <div class="dash-quick-actions">
            ${canSales ? '<button type="button" class="dash-action-btn" data-dash-scroll="salesPanel"><span>🥩</span> Rekodi Mauzo</button>' : ''}
            ${canStock ? '<button type="button" class="dash-action-btn" data-dash-scroll="stockPanel"><span>📦</span> Angalia Stock</button>' : ''}
            <button type="button" class="dash-action-btn" data-dash-scroll="reportsPanel"><span>📋</span> Ripoti Zote</button>
            ${hasPerm('branches') ? '<button type="button" class="dash-action-btn" data-dash-scroll="branchPanel"><span>🏪</span> Dhibiti Matawi</button>' : ''}
            <button type="button" class="dash-action-btn" id="dashRefreshBtn"><span>🔄</span> Onyesha Upya</button>
          </div>
          <p class="dash-action-note">Data inasasishwa otomatiki unaporekodi mauzo, stock, au oda.</p>
        </article>
      </div>
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

  function normalizePhone(phone) {
    const d = String(phone || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('255')) return d;
    if (d.startsWith('0')) return '255' + d.slice(1);
    return d;
  }

  function buildUserList() {
    const orders = getOrders();
    const visits = getVisits();
    const map = new Map();

    orders.forEach(o => {
      const phone = (o.phone || '').trim();
      if (!phone) return;
      const key = 'c:' + phone;
      if (!map.has(key)) {
        map.set(key, {
          type: 'customer',
          phone,
          orderCount: 0,
          totalSpent: 0,
          lastAt: o.at,
          lastAddress: o.address || '',
          lastChannel: o.channel || '',
          channels: new Set()
        });
      }
      const u = map.get(key);
      u.orderCount += 1;
      u.totalSpent += Number(o.subtotal) || 0;
      if (o.channel) u.channels.add(o.channel);
      if (new Date(o.at) >= new Date(u.lastAt)) {
        u.lastAt = o.at;
        u.lastAddress = o.address || u.lastAddress;
        u.lastChannel = o.channel || u.lastChannel;
      }
    });

    visits.forEach(v => {
      const id = v.visitorId || 'unknown';
      const key = 'v:' + id;
      if (!map.has(key)) {
        map.set(key, {
          type: 'visitor',
          visitorId: id,
          visitCount: 0,
          lastAt: v.at,
          device: v.device || '—',
          lastReferrer: v.referrer || 'Direct',
          firstAt: v.at
        });
      }
      const u = map.get(key);
      u.visitCount += 1;
      if (new Date(v.at) >= new Date(u.lastAt)) {
        u.lastAt = v.at;
        u.device = v.device || u.device;
        u.lastReferrer = v.referrer || u.lastReferrer;
      }
      if (new Date(v.at) <= new Date(u.firstAt)) u.firstAt = v.at;
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  }

  function userMatchesFilter(u) {
    if (userFilter === 'customer' && u.type !== 'customer') return false;
    if (userFilter === 'visitor' && u.type !== 'visitor') return false;
    if (!userQuery) return true;
    const q = userQuery.toLowerCase();
    if (u.type === 'customer') {
      return [u.phone, u.lastAddress, u.lastChannel].some(v => String(v || '').toLowerCase().includes(q));
    }
    return [u.visitorId, u.device, u.lastReferrer].some(v => String(v || '').toLowerCase().includes(q));
  }

  function renderUsersSummary(list) {
    const el = $('usersSummary');
    if (!el) return;
    const customers = list.filter(u => u.type === 'customer');
    const visitors = list.filter(u => u.type === 'visitor');
    const revenue = customers.reduce((s, u) => s + u.totalSpent, 0);
    el.innerHTML = `
      <div class="summary-chip"><span>Wateja wote</span><b>${list.length}</b></div>
      <div class="summary-chip"><span>Waliagiza</span><b>${customers.length}</b></div>
      <div class="summary-chip"><span>Wageni</span><b>${visitors.length}</b></div>
      <div class="summary-chip highlight"><span>Mapato (wateja)</span><b>TSH ${formatMoney(revenue)}</b></div>
    `;
  }

  function renderUsers() {
    const el = $('usersList');
    if (!el) return;
    const all = buildUserList();
    const list = all.filter(userMatchesFilter);
    renderUsersSummary(all);

    if (!list.length) {
      el.innerHTML = '<div class="empty">Hakuna wateja bado. Wateja wataonekana baada ya kuagiza au kufungua menu.</div>';
      return;
    }

    el.innerHTML = list.map(u => {
      if (u.type === 'customer') {
        const wa = normalizePhone(u.phone);
        const channels = [...u.channels].join(', ') || '—';
        return `
          <article class="user-card user-customer">
            <div class="user-avatar customer">📱</div>
            <div class="user-body">
              <div class="user-head">
                <div>
                  <strong class="user-title">${escapeHtml(u.phone)}</strong>
                  <span class="user-badge customer">Mteja · ${u.orderCount} oda</span>
                </div>
                <strong class="user-spent">TSH ${formatMoney(u.totalSpent)}</strong>
              </div>
              <div class="user-meta">
                <span>🕐 ${escapeHtml(formatOrderDate(u.lastAt))}</span>
                ${u.lastAddress ? '<span>📍 ' + escapeHtml(u.lastAddress) + '</span>' : ''}
                <span>📲 ${escapeHtml(channels)}</span>
              </div>
            </div>
            <div class="user-actions">
              <a class="btn btn-save btn-sm" href="https://wa.me/${escapeHtml(wa)}" target="_blank" rel="noopener">WhatsApp</a>
              <a class="btn btn-back btn-sm" href="sms:${escapeHtml(wa)}">SMS</a>
            </div>
          </article>
        `;
      }

      return `
        <article class="user-card user-visitor">
          <div class="user-avatar visitor">${u.device === 'Mobile' ? '📱' : '💻'}</div>
          <div class="user-body">
            <div class="user-head">
              <div>
                <strong class="user-title">Mgeni <code>${escapeHtml((u.visitorId || '').slice(-8))}</code></strong>
                <span class="user-badge visitor">${u.visitCount} ziara</span>
              </div>
            </div>
            <div class="user-meta">
              <span>🕐 ${escapeHtml(formatOrderDate(u.lastAt))}</span>
              <span>${escapeHtml(u.device || '—')}</span>
              <span>↗ ${escapeHtml(shortReferrer(u.lastReferrer))}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function exportUsersCsv() {
    const list = buildUserList();
    if (!list.length) { alert('Hakuna wateja wa kupakua.'); return; }
    const header = ['Aina', 'Simu/ID', 'Oda', 'Ziara', 'Jumla TSH', 'Mwisho', 'Mahali/Kifaa', 'Channel/Chanzo'];
    const rows = [header.join(',')];
    list.forEach(u => {
      if (u.type === 'customer') {
        rows.push([
          csvEscape('Mteja'),
          csvEscape(u.phone),
          csvEscape(u.orderCount),
          csvEscape(''),
          csvEscape(u.totalSpent),
          csvEscape(formatOrderDate(u.lastAt)),
          csvEscape(u.lastAddress),
          csvEscape([...u.channels].join(', '))
        ].join(','));
      } else {
        rows.push([
          csvEscape('Mgeni'),
          csvEscape(u.visitorId),
          csvEscape(''),
          csvEscape(u.visitCount),
          csvEscape(''),
          csvEscape(formatOrderDate(u.lastAt)),
          csvEscape(u.device),
          csvEscape(u.lastReferrer)
        ].join(','));
      }
    });
    downloadCsv('clever-kitimoto-wateja-' + new Date().toISOString().slice(0, 10) + '.csv', rows);
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
    const branch = getCurrentBranch();
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
      <p class="meta">Imetengenezwa: ${escapeHtml(new Date().toLocaleString('sw-TZ'))}${branch ? ' · Tawi: ' + escapeHtml(branch.name) : ''}</p>
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
    $('usersPane')?.classList.toggle('active', tab === 'users');
    $('ordersPane')?.classList.toggle('active', tab === 'orders');
    $('salesPane')?.classList.toggle('active', tab === 'sales');
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
    renderUsers();
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
    if (!hasPerm('clear')) return;
    if (!confirm('Futa historia yote ya oda?')) return;
    localStorage.removeItem(ORDER_HISTORY_KEY);
    renderOrders();
    renderUsers();
  }

  function clearVisits() {
    if (!hasPerm('clear')) return;
    if (!confirm('Futa historia yote ya wageni?')) return;
    localStorage.removeItem(VISIT_LOG_KEY);
    renderVisits();
    renderUsers();
    renderDashboard();
  }

  function bindEvents() {
    $('registerBranchBtn')?.addEventListener('click', registerBranch);
    $('branchSelect')?.addEventListener('change', e => {
      if (e.target.value) switchBranch(e.target.value);
    });
    $('dashboardRoot')?.addEventListener('click', e => {
      const scrollBtn = e.target.closest('[data-dash-scroll]');
      if (scrollBtn) {
        scrollToPanel(scrollBtn.dataset.dashScroll);
        return;
      }
      if (e.target.closest('#dashRefreshBtn')) {
        renderDashboard();
        showAdminToast('✓ Dashboard imesasishwa');
      }
    });
    $('loginForm')?.addEventListener('submit', e => { e.preventDefault(); login(); });
    $('togglePass')?.addEventListener('click', togglePassword);
    $('logoutBtn')?.addEventListener('click', logout);
    $('saveBtn')?.addEventListener('click', save);
    $('resetBtn')?.addEventListener('click', resetPrices);
    $('addMenuBtn')?.addEventListener('click', addMenu);
    $('clearOrdersBtn')?.addEventListener('click', clearOrders);
    $('clearVisitsBtn')?.addEventListener('click', clearVisits);
    $('exportOrdersBtn')?.addEventListener('click', exportOrdersCsv);
    $('exportUsersBtn')?.addEventListener('click', exportUsersCsv);
    $('exportVisitsBtn')?.addEventListener('click', exportVisitsCsv);
    $('exportSalesBtn')?.addEventListener('click', exportSalesCsv);
    $('printReportBtn')?.addEventListener('click', printReport);
    $('recordSaleBtn')?.addEventListener('click', recordSale);
    $('addSalesItemBtn')?.addEventListener('click', addSalesItem);
    $('clearSalesBtn')?.addEventListener('click', clearSales);
    $('saleItemSelect')?.addEventListener('change', () => {
      if ($('saleTotal')) delete $('saleTotal').dataset.manual;
      updateSaleTotalPreview();
      renderSaleQtyPresets();
    });
    $('saleQty')?.addEventListener('input', () => {
      if ($('saleTotal')) delete $('saleTotal').dataset.manual;
      updateSaleTotalPreview();
    });
    $('saleTotal')?.addEventListener('input', () => {
      if ($('saleTotal')) $('saleTotal').dataset.manual = '1';
    });
    $('userSearch')?.addEventListener('input', e => {
      userQuery = e.target.value.trim();
      renderUsers();
    });
    document.querySelectorAll('.user-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        userFilter = btn.dataset.filter || 'all';
        document.querySelectorAll('.user-filter').forEach(b => b.classList.toggle('active', b === btn));
        renderUsers();
      });
    });
    document.querySelectorAll('.report-tab').forEach(btn => {
      btn.addEventListener('click', () => switchReportTab(btn.dataset.tab));
    });
    $('adminDialogOk')?.addEventListener('click', closeAdminDialog);
    $('adminDialogBackdrop')?.addEventListener('click', closeAdminDialog);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && $('adminDialog')?.classList.contains('open')) closeAdminDialog();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    if (isSessionValid()) showApp();
    else showLogin();
  });
})();
