(function () {
  'use strict';

  const CK_KEY = 'cleverKitimotoMenuV1';
  const CUSTOM_KEY = 'cleverKitimotoCustomMenusV1';
  const WA = '255683497330';
  const SMS_PHONE = '255683497330';
  const CART_KEY = 'cleverKitimotoCartV1';
  const CUSTOMER_KEY = 'cleverKitimotoCustomerV1';
  const LAST_ORDER_KEY = 'cleverKitimotoLastOrderV1';
  const ORDER_HISTORY_KEY = 'cleverKitimotoOrderHistoryV1';
  const ORDER_SERVICE_FEE = 200;
  const VISIT_LOG_KEY = 'cleverKitimotoVisitLogV1';
  const VISITOR_ID_KEY = 'cleverKitimotoVisitorIdV1';
  const DELIVERY_NOTE = 'Bei ya delivery ni kwa mteja';
  const LIPA_NUMBERS = [
    { label: 'Airtel', num: '130119369', display: '130 119 369', agent: 'Shedrack Moshi' },
    { label: 'Yas', num: '7561346', display: '756 1346', agent: 'Clever Restaurant' },
    { label: 'Vodacom', num: '58674550', display: '5867 4550', agent: 'Shedrack Moshi' }
  ];
  const OPEN_HOUR = 10;
  const CLOSE_HOUR = 23;

  const HALF_KG_ITEMS = [
    { name: 'Choma', priceKey: 'choma', icon: '🔥', desc: 'Classic choma' },
    { name: 'Choma ya Foil', priceKey: 'foil', icon: '✨', desc: 'Juicy & tender' },
    { name: 'Rosti', priceKey: 'rosti', icon: '🌶️', desc: 'Customer favourite' },
    { name: 'Kavu', priceKey: 'kavu', icon: '🥩', desc: 'Bold & crispy' }
  ];

  const SIZE_DETAIL = '0.5 KG';

  const KISINIA_GROUPS = [
    {
      title: 'Kisinia Packages',
      subtitle: 'Kula Kitimoto kwenye kisinia',
      items: [
        { name: 'Kisinia Single', detail: 'Mtu 1', priceKey: 'single', icon: '👤', tag: 'Solo', diners: 1,
          desc: 'Kula peke yako — ½ KG Kitimoto (nguruwe) + sides',
          includes: ['½ KG Mix — Choma, Rosti, Kavu', 'Ndizi 2', 'Ugali 1', 'Kachumbari'] },
        { name: 'Kisinia Couple', detail: 'Watu 2', priceKey: 'couple', icon: '👫', tag: 'Couple', diners: 2,
          desc: 'Kula wawili — 1 KG Kitimoto + sides',
          includes: ['1 KG Mix — Choma, Rosti, Kavu', 'Ndizi 4', 'Ugali 2', 'Kachumbari'] },
        { name: 'Kisinia Family', detail: 'Watu 4', priceKey: 'family', icon: '👨‍👩‍👧‍👦', tag: 'Family', diners: 4,
          desc: 'Kula familia — 2 KG Kitimoto + sides kubwa',
          includes: ['2 KG Mix — Choma, Rosti, Kavu', 'Ndizi 8', 'Ugali 4', 'Chipsi Yai', 'Kachumbari'] }
      ]
    },
    {
      title: 'Mixed Kitimoto',
      subtitle: 'Nyama mchanganyiko — kula pamoja',
      items: [
        { name: '½ KG Mix', detail: '', priceKey: 'mixedhalf', icon: '🍽️', tag: 'Mix', diners: 1,
          desc: 'Kitimoto mix — kiasi cha mtu 1',
          includes: ['Choma + Rosti + Kavu', 'Ndizi 2', 'Ugali 1', 'Kachumbari'] },
        { name: '1 KG Mix', detail: '', priceKey: 'mixedone', icon: '⭐', tag: 'Best', diners: 2,
          desc: 'Mix bora — watu 2 au zaidi',
          includes: ['Choma + Rosti + Kavu', 'Ndizi 4', 'Ugali 2', 'Kachumbari'] },
        { name: '2 KG Mix Special', detail: '', priceKey: 'mixedtwo', icon: '🎉', tag: 'Feast', diners: 5,
          desc: 'Sherehe — nyama nyingi kwa kikundi',
          includes: ['Choma 1 KG + Rosti ½ + Kavu ½', 'Sides kamili'] }
      ]
    },
    {
      title: 'Kisinia Zege',
      subtitle: 'Kitimoto + chipsi — ladha ya zege',
      items: [
        { name: 'Zege Single', detail: '', priceKey: 'zegeSingle', icon: '🍟', tag: 'Single', diners: 1,
          desc: 'Kula peke yako — Kitimoto na chipsi',
          includes: ['½ KG Kitimoto', 'Chipsi Kavu'] },
        { name: 'Zege Couple', detail: '', priceKey: 'zegeCouple', icon: '🍟', tag: 'Couple', diners: 2,
          desc: 'Wawili — Kitimoto + chipsi + kachumbari',
          includes: ['1 KG Kitimoto', 'Chipsi Kavu', 'Kachumbari'] },
        { name: 'Zege Special', detail: '', priceKey: 'zegeSpecial', icon: '🍟', tag: 'Special', diners: 3,
          desc: 'Zege kubwa — nyama nyingi na sides',
          includes: ['1½ KG Kitimoto', 'Chipsi + sides'] }
      ]
    }
  ];

  const KISINIA_EAT_OPTIONS = [
    { diners: 1, label: 'Mtu 1', icon: '👤', priceKey: 'single', name: 'Kisinia Single', detail: 'Mtu 1' },
    { diners: 2, label: 'Watu 2', icon: '👫', priceKey: 'couple', name: 'Kisinia Couple', detail: 'Watu 2' },
    { diners: 4, label: 'Familia 3–4', icon: '👨‍👩‍👧‍👦', priceKey: 'family', name: 'Kisinia Family', detail: 'Watu 4' },
    { diners: 5, label: 'Watu 5+', icon: '🎉', priceKey: 'mixedtwo', name: '2 KG Mix Special', detail: '' }
  ];

  let kisiniaDinerPick = 2;

  const defaults = {
    choma: '9,000', choma1: '18,000', choma15: '27,000', choma2: '36,000',
    foil: '9,000', foil1: '18,000', foil15: '27,000', foil2: '36,000',
    rosti: '8,500', rosti1: '17,000', rosti15: '25,500', rosti2: '34,000',
    kavu: '8,500', kavu1: '17,000', kavu15: '25,500', kavu2: '34,000',
    single: '20,000', couple: '35,000', family: '65,000',
    mixedhalf: '25,000', mixedone: '35,000', mixedtwo: '65,000',
    zegeSingle: '15,000', zegeCouple: '30,000', zegeSpecial: '35,000',
    chipsiKavu: '2,000', chipsiYai: '3,000', ndizi: '500', ugali: '1,000', kachumbari: '1,000'
  };

  const SIDE_OPTIONS = [
    { key: 'ugali', name: 'Ugali', icon: '🍚', priceKey: 'ugali' },
    { key: 'ndizi', name: 'Ndizi', icon: '🍌', priceKey: 'ndizi' },
    { key: 'chipsiKavu', name: 'Chipsi kavu', icon: '🍟', priceKey: 'chipsiKavu' },
    { key: 'chipsiYai', name: 'Chipsi yai', icon: '🍳', priceKey: 'chipsiYai' },
    { key: 'kachumbari', name: 'Kachumbari', icon: '🥗', priceKey: 'kachumbari' }
  ];

  let cart = loadCart();
  let activeFilter = 'all';
  let toastTimer = null;

  function cartId(name, detail) {
    return name + '::' + (detail || '');
  }

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (!Array.isArray(saved)) return [];
      return saved.map(i => ({
        ...i,
        addons: Array.isArray(i.addons) ? i.addons : [],
        id: i.id || cartId(i.name, i.detail)
      }));
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function getVisitorId() {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = 'v-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  }

  function trackVisit() {
    try {
      const visits = JSON.parse(localStorage.getItem(VISIT_LOG_KEY) || '[]');
      const last = visits[0];
      const now = Date.now();
      if (last && last.visitorId === getVisitorId() && now - new Date(last.at).getTime() < 60000) return;

      visits.unshift({
        id: 'visit-' + now,
        at: new Date().toISOString(),
        visitorId: getVisitorId(),
        page: location.pathname.split('/').pop() || 'index.html',
        referrer: document.referrer || 'Direct',
        lang: navigator.language || '',
        screen: (window.screen?.width || 0) + '×' + (window.screen?.height || 0),
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
      });
      if (visits.length > 500) visits.length = 500;
      localStorage.setItem(VISIT_LOG_KEY, JSON.stringify(visits));
    } catch { /* noop */ }
  }

  function showToast(msg) {
    const el = document.getElementById('orderToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function resetOrderConfirmation() {
    document.getElementById('orderConfirmation')?.setAttribute('hidden', '');
    document.querySelector('.order-panel-body')?.classList.remove('order-complete-hidden');
    document.querySelector('.order-panel-foot')?.classList.remove('order-complete-hidden');
    const title = document.getElementById('orderPanelTitle');
    const subtitle = document.getElementById('orderPanelSubtitle');
    if (title) title.textContent = 'Weka Oda Yako';
    if (subtitle) subtitle.textContent = 'Chagua menu, weka taarifa, kisha tuma oda moja kwa moja kwenye mfumo';
  }

  let lastSubmittedOrderMessage = '';
  function showOrderConfirmation(record, synced, message, whatsappOpened = false) {
    const confirmation = document.getElementById('orderConfirmation');
    const body = document.querySelector('.order-panel-body');
    const footer = document.querySelector('.order-panel-foot');
    const reference = String(record.id || '').replace(/^ord-/, '').slice(0, 8).toUpperCase();
    const whatsappInstruction = whatsappOpened
      ? 'WhatsApp imefunguliwa; bonyeza Tuma ndani ya app.'
      : 'Bonyeza kitufe cha WhatsApp hapa chini, kisha Tuma ujumbe.';
    const statusMessage = message || (synced
      ? 'Oda imehifadhiwa kwenye mfumo. Muuzaji ataiona kwenye dashibodi. ' + whatsappInstruction
      : 'Oda itasawazishwa kwenye mfumo intaneti ikirudi. ' + whatsappInstruction);
    document.getElementById('orderConfirmationMessage').textContent = statusMessage;
    document.getElementById('orderConfirmationId').textContent = reference || '—';
    document.getElementById('orderConfirmationTotal').textContent = 'TSH ' + formatMoney(Number(record.total) || Number(record.subtotal) || 0);
    document.getElementById('orderConfirmationEyebrow').textContent = synced ? 'ODA IMEHIFADHIWA' : 'ODA INASAWAZISHWA';
    document.getElementById('orderConfirmationHeadline').textContent = synced ? 'Asante! Oda yako imepokelewa.' : 'Oda yako imehifadhiwa kwa muda.';
    const whatsappFallback = document.getElementById('orderConfirmationWhatsApp');
    if (whatsappFallback) whatsappFallback.hidden = whatsappOpened || !lastSubmittedOrderMessage;
    document.getElementById('orderPanelTitle').textContent = synced ? 'Oda Imepokelewa' : 'Oda Inasawazishwa';
    document.getElementById('orderPanelSubtitle').textContent = 'Hifadhi namba ya oda yako kwa ufuatiliaji.';
    if (confirmation) confirmation.hidden = false;
    body?.classList.add('order-complete-hidden');
    footer?.classList.add('order-complete-hidden');

    cart = [];
    saveCart();
    updateCartUI();
    renderMyHistory();
  }

  function openOrderPanel() {
    const panel = document.getElementById('orderPanel');
    if (!panel) return;
    resetOrderConfirmation();
    renderOrderPanel();
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeOrderPanel() {
    const panel = document.getElementById('orderPanel');
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initSizePickers() {
    document.querySelectorAll('.card .price-grid').forEach(grid => {
      if (grid.dataset.sizeInit) return;
      grid.dataset.sizeInit = '1';
      grid.classList.add('price-grid-add');

      const card = grid.closest('.card');
      const name = card?.querySelector('h3')?.textContent?.trim();
      if (!name) return;

      grid.querySelectorAll('.price-cell').forEach(cell => {
        const sizeEl = cell.querySelector('b');
        const displaySize = cell.dataset.size === '0.5' ? SIZE_DETAIL : (sizeEl?.textContent?.trim() || '');
        const price = cell.querySelector('[data-price]')?.textContent?.trim() || '';
        cell.classList.add('price-add');
        if (cell.dataset.size === '0.5' || displaySize === SIZE_DETAIL) {
          cell.classList.add('size-half');
        }
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', 'Ongeza ' + name + ' ' + displaySize + ' kwenye oda');
        cell.dataset.item = name;
        cell.dataset.detail = displaySize;
        cell.dataset.priceVal = price;

        cell.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            addToCart(name, displaySize, getLivePrice(cell), cell);
          }
        });
      });

      const hint = document.createElement('p');
      hint.className = 'size-hint';
      hint.innerHTML = '👆 Bonyeza ukubwa kuongeza — <strong>0.5 KG</strong> hadi 2 KG';
      grid.after(hint);

      const addBtn = card.querySelector('.card-actions .btn-add');
      if (addBtn) addBtn.style.display = 'none';
    });
  }

  function flashAdded(el) {
    if (!el) return;
    el.classList.add('added-flash');
    setTimeout(() => el.classList.remove('added-flash'), 700);
  }

  function getPrices() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(CK_KEY) || '{}') };
    } catch {
      return { ...defaults };
    }
  }

  function formatPrice(key) {
    const v = getPrices()[key];
    return v != null ? v : defaults[key] || '—';
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>'"]/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])
    );
  }

  function applyPrices() {
    document.querySelectorAll('[data-price]').forEach(el => {
      const k = el.dataset.price;
      const v = getPrices()[k];
      if (v != null) {
        if (el.dataset.pricePrefix === 'tsh') el.textContent = 'TSH ' + v;
        else el.textContent = v;
      }
    });
    renderKisiniaQuickOrder();
    renderKisiniaSmartPicker();
    renderOrderHalfKgStrip();
  }

  function waLink(text) {
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
  }

  function smsLink(text, phone) {
    return 'sms:' + (phone || SMS_PHONE) + '?body=' + encodeURIComponent(text);
  }

  function paymentLabel(val) {
    return ({ mpesa: 'M-Pesa', snippe: 'Snippe online', cash: 'Cash', lipa: 'Lipa namba' }[val] || val);
  }

  function getCheckout() {
    return {
      name: document.getElementById('custName')?.value.trim() || '',
      phone: document.getElementById('custPhone')?.value.trim() || '',
      address: document.getElementById('custAddress')?.value.trim() || '',
      notes: document.getElementById('custNotes')?.value.trim() || '',
      fulfillment: document.querySelector('#fulfillmentPills .pill.active')?.dataset.val || 'delivery',
      payment: document.querySelector('#paymentPills .pill.active')?.dataset.val || 'mpesa',
      timing: document.querySelector('#timingPills .pill.active')?.dataset.val || 'asap',
      scheduleDate: document.getElementById('custScheduleDate')?.value || '',
      scheduleTime: document.getElementById('custScheduleTime')?.value || ''
    };
  }

  function saveCheckout() {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(getCheckout()));
  }

  function loadCheckout() {
    try {
      const c = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '{}');
      const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
      set('custName', c.name);
      set('custPhone', c.phone);
      set('custAddress', c.address);
      set('custNotes', c.notes);
      set('custScheduleDate', c.scheduleDate);
      set('custScheduleTime', c.scheduleTime);
      if (c.fulfillment) setPillActive('fulfillmentPills', c.fulfillment);
      const snippeOption = document.getElementById('snippePaymentOption');
      if (c.payment === 'snippe' && snippeOption?.hidden) setPillActive('paymentPills', 'mpesa');
      else if (c.payment) setPillActive('paymentPills', c.payment);
      if (c.timing) setPillActive('timingPills', c.timing);
      toggleAddressField();
      toggleLipaPanel();
      toggleScheduleFields();
    } catch { /* noop */ }
  }

  function setPillActive(groupId, val) {
    document.querySelectorAll('#' + groupId + ' .pill').forEach(p => {
      const active = p.dataset.val === val;
      p.classList.toggle('active', active);
      if (p.hasAttribute('aria-pressed')) p.setAttribute('aria-pressed', String(active));
    });
  }

  function toggleAddressField() {
    const pickup = document.querySelector('#fulfillmentPills .pill.active')?.dataset.val === 'pickup';
    const addr = document.getElementById('custAddress')?.closest('.ck-field');
    if (addr) addr.style.display = pickup ? 'none' : '';
  }

  function toggleLipaPanel() {
    const lipa = document.querySelector('#paymentPills .pill.active')?.dataset.val === 'lipa';
    const panel = document.getElementById('lipaPanel');
    if (panel) {
      panel.hidden = !lipa;
      panel.classList.toggle('lipa-active', lipa);
    }
    const activePay = document.querySelector('#paymentPills .pill.active')?.dataset.val;
    const sendBtn = document.getElementById('cartSend');
    if (sendBtn && !orderSending) sendBtn.textContent = activePay === 'snippe' ? '🔒 Hifadhi, Lipa na WhatsApp' : '✓ Hifadhi na WhatsApp';
    const snippeNote = document.getElementById('snippeNote');
    if (snippeNote) snippeNote.hidden = activePay !== 'snippe';
  }

  function setOrderSubmitting(submitting) {
    orderSending = submitting;
    const sendBtn = document.getElementById('cartSend');
    if (sendBtn) {
      sendBtn.disabled = submitting;
      sendBtn.textContent = submitting ? '⏳ Inahifadhi oda...' : '';
    }
    if (!submitting) toggleLipaPanel();
  }

  function toggleScheduleFields() {
    const scheduled = document.querySelector('#timingPills .pill.active')?.dataset.val === 'scheduled';
    const fields = document.getElementById('scheduleFields');
    if (fields) fields.hidden = !scheduled;
  }

  function scheduleLabel(c) {
    if (c.timing !== 'scheduled') return 'Sasa hivi';
    if (!c.scheduleDate || !c.scheduleTime) return 'Muda haujawekwa';
    return c.scheduleDate + ' saa ' + c.scheduleTime;
  }

  function lipaNumbersLine() {
    return LIPA_NUMBERS.map(l => l.label + ' ' + l.num + ' (' + l.agent + ')').join(' | ');
  }

  async function copyLipaNumber(num, label) {
    try {
      await navigator.clipboard.writeText(num);
      showToast('📋 ' + label + ' ' + num + ' imenakiliwa');
    } catch {
      showToast('Imeshindwa kunakili — andika: ' + num);
    }
  }

  function loadOrderHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  async function saveOrderRecord() {
    const c = getCheckout();
    const items = cart.map(i => ({
      name: i.name,
      detail: i.detail || '',
      price: i.price,
      qty: i.qty,
      addons: (i.addons || []).filter(addon => Number(addon.qty) > 0).map(addon => ({
        key: addon.key,
        name: addon.name,
        qty: Number(addon.qty),
        price: addonPrice(addon)
      }))
    }));
    const record = {
      id: 'ord-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12)),
      at: new Date().toISOString(),
      channel: 'menu',
      phone: c.phone,
      address: c.address,
      notes: [
        c.name ? 'Mteja: ' + c.name : '',
        'Muda wa oda: ' + scheduleLabel(c),
        c.notes
      ].filter(Boolean).join(' · '),
      fulfillment: c.fulfillment,
      payment: c.payment,
      subtotal: getCartTotal(),
      items,
      status: 'pending'
    };
    record.serviceFee = cart.length ? ORDER_SERVICE_FEE : 0;
    record.total = record.subtotal + record.serviceFee;
    record.paymentStatus = 'unpaid';
    const history = loadOrderHistory();
    history.unshift(record);
    if (history.length > 200) history.length = 200;
    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history));
    renderMyHistory();

    if (!window.CleverOrdersCloud?.isEnabled()) return { record, synced: false, cloud: false };
    try {
      await window.CleverOrdersCloud.saveOrder(record);
      return { record, synced: true, cloud: true };
    } catch (err) {
      console.warn('Order is saved locally and will retry cloud sync', err);
      return { record, synced: false, cloud: true };
    }
  }

  function parseKgFromDetail(detail) {
    const d = (detail || '').toLowerCase().replace(/\s+/g, ' ');
    if (!d) return 0;
    if (d.includes('0.5') || d.includes('½') || d.includes('nusu')) return 0.5;
    if (d.includes('1½') || d.includes('1.5')) return 1.5;
    const m = d.match(/(\d+(?:\.\d+)?)\s*kg/);
    if (m) return parseFloat(m[1]);
    return 0;
  }

  function formatKg(amount) {
    return Number(amount.toFixed(2)).toString();
  }

  function itemQuantityLabel(item) {
    const qty = Number(item.qty) || 0;
    const kgPerItem = parseKgFromDetail(item.detail) || parseKgFromDetail(item.name);
    if (kgPerItem > 0) {
      const totalKg = formatKg(kgPerItem * qty);
      return totalKg + ' KG' + (qty > 1 ? ' (' + qty + ' × ' + formatKg(kgPerItem) + ' KG)' : '');
    }
    return qty + (qty === 1 ? ' portion' : ' portions');
  }

  function computeHistoryStats(history) {
    const stats = {
      orderCount: history.length,
      totalSpent: 0,
      totalItems: 0,
      totalKg: 0,
      topItem: null,
      topItemQty: 0,
      lastOrderAt: null,
      itemCounts: {}
    };

    history.forEach(order => {
      stats.totalSpent += order.subtotal || 0;
      if (!stats.lastOrderAt) stats.lastOrderAt = order.at;
      (order.items || []).forEach(item => {
        const qty = item.qty || 0;
        stats.totalItems += qty;
        const kg = parseKgFromDetail(item.detail) || parseKgFromDetail(item.name);
        if (kg > 0) stats.totalKg += kg * qty;
        const key = item.name + (item.detail ? ' (' + item.detail + ')' : '');
        stats.itemCounts[key] = (stats.itemCounts[key] || 0) + qty;
      });
    });

    Object.entries(stats.itemCounts).forEach(([name, qty]) => {
      if (qty > stats.topItemQty) {
        stats.topItemQty = qty;
        stats.topItem = name;
      }
    });

    stats.totalKg = Math.round(stats.totalKg * 10) / 10;
    return stats;
  }

  function formatRelativeDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const days = Math.round((startToday - startThat) / 86400000);
    const time = d.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' });
    if (days === 0) return 'Leo · ' + time;
    if (days === 1) return 'Jana · ' + time;
    if (days < 7) return days + ' siku zilizopita';
    return d.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function summarizeOrderItems(items) {
    if (!items?.length) return 'Hakuna vitu';
    const lines = items.slice(0, 3).map(i => {
      const quantity = itemQuantityLabel(i);
      const extraDetail = i.detail && !parseKgFromDetail(i.detail) ? ' (' + i.detail + ')' : '';
      const base = i.name + ' — ' + quantity + extraDetail;
      const sides = (i.addons || []).filter(addon => Number(addon.qty) > 0).map(addon => addon.qty + '× ' + addon.name);
      return base + (sides.length ? ' + ' + sides.join(', ') : '');
    });
    const extra = items.length > 3 ? ' · na ' + (items.length - 3) + ' zaidi' : '';
    return lines.join(' · ') + extra;
  }

  function reorderFromHistory(orderId) {
    const order = loadOrderHistory().find(o => o.id === orderId);
    applyOrderToCart(order);
  }

  function getLastOrder() {
    const history = loadOrderHistory();
    if (history.length) return history[0];
    try {
      const items = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || '[]');
      if (!items.length) return null;
      return { id: 'last-cart', items, at: null };
    } catch {
      return null;
    }
  }

  function applyCheckoutFromOrder(order) {
    if (!order) return;
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v || '';
    };
    if (order.phone) set('custPhone', order.phone);
    if (order.address) set('custAddress', order.address);
    if (order.notes) set('custNotes', order.notes);
    if (order.fulfillment) setPillActive('fulfillmentPills', order.fulfillment);
    if (order.payment) setPillActive('paymentPills', order.payment);
    toggleAddressField();
    toggleLipaPanel();
    saveCheckout();
  }

  async function applyOrderToCart(order, opts = {}) {
    const { restoreCheckout = true, openPanel = true } = opts;
    if (!order?.items?.length) {
      showToast('Imeshindwa kupakia oda hii');
      return false;
    }
    if (cart.length && !(await confirmReplaceOrder(order))) {
      return false;
    }
    cart = order.items.map(i => ({
      id: cartId(i.name, i.detail),
      name: i.name,
      detail: i.detail || '',
      price: i.price || '',
      qty: i.qty || 1,
      addons: Array.isArray(i.addons) ? i.addons.map(addon => ({ ...addon })) : []
    }));
    saveCart();
    if (restoreCheckout) applyCheckoutFromOrder(order);
    updateCartUI();
    showToast('🔁 Oda imerudiwa — angalia na tuma tena!');
    if (openPanel) openOrderPanel();
    return true;
  }

  function confirmReplaceOrder(order) {
    const overlay = document.getElementById('orderReplaceDialog');
    const cancelBtn = document.getElementById('orderReplaceCancel');
    const replaceBtn = document.getElementById('orderReplaceConfirm');
    const currentCount = document.getElementById('replaceCurrentCount');
    const nextCount = document.getElementById('replaceNextCount');
    const returnFocus = document.activeElement;
    if (!overlay || !cancelBtn || !replaceBtn) return Promise.resolve(window.confirm('Oda yako ya sasa itabadilishwa na oda hii. Endelea?'));

    if (currentCount) currentCount.textContent = cart.length + (cart.length === 1 ? ' bidhaa' : ' bidhaa');
    if (nextCount) nextCount.textContent = order.items.length + (order.items.length === 1 ? ' bidhaa' : ' bidhaa');
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    document.body.classList.add('dialog-open');

    return new Promise(resolve => {
      let settled = false;
      const finish = accepted => {
        if (settled) return;
        settled = true;
        overlay.classList.remove('is-open');
        document.body.classList.remove('dialog-open');
        setTimeout(() => {
          overlay.hidden = true;
          if (returnFocus?.isConnected) returnFocus.focus();
        }, 180);
        cancelBtn.removeEventListener('click', cancel);
        replaceBtn.removeEventListener('click', accept);
        overlay.removeEventListener('click', backdrop);
        document.removeEventListener('keydown', onKeydown);
        resolve(accepted);
      };
      const cancel = () => finish(false);
      const accept = () => finish(true);
      const backdrop = event => { if (event.target === overlay) finish(false); };
      const onKeydown = event => {
        if (event.key === 'Escape') finish(false);
        if (event.key === 'Tab') {
          event.preventDefault();
          (document.activeElement === cancelBtn ? replaceBtn : cancelBtn).focus();
        }
      };
      cancelBtn.addEventListener('click', cancel);
      replaceBtn.addEventListener('click', accept);
      overlay.addEventListener('click', backdrop);
      document.addEventListener('keydown', onKeydown);
      cancelBtn.focus();
    });
  }

  function reorderLast() {
    const order = getLastOrder();
    if (!order) {
      showToast('Hakuna oda ya kurudia');
      return;
    }
    applyOrderToCart(order);
  }

  function updateReorderButtons() {
    const order = getLastOrder();
    const hasHistory = !!loadOrderHistory().length;
    const reorderBtn = document.getElementById('reorderBtn');
    const reorderLastBtn = document.getElementById('reorderLastBtn');
    const orderRepeatLastBtn = document.getElementById('orderRepeatLastBtn');

    if (reorderBtn) {
      if (order) {
        reorderBtn.removeAttribute('hidden');
        const sub = reorderBtn.querySelector('small');
        if (sub) {
          const summary = summarizeOrderItems(order.items);
          sub.textContent = summary.length > 42 ? summary.slice(0, 42) + '…' : summary;
        }
      } else {
        reorderBtn.setAttribute('hidden', '');
      }
    }

    reorderLastBtn?.toggleAttribute('hidden', !hasHistory);
    orderRepeatLastBtn?.toggleAttribute('hidden', !order);
  }

  function renderOrderRepeatStrip() {
    const wrap = document.getElementById('orderRepeatStrip');
    const list = document.getElementById('orderRepeatList');
    if (!wrap || !list) return;

    const history = loadOrderHistory().slice(0, 5);
    if (!history.length) {
      wrap.hidden = true;
      return;
    }

    wrap.hidden = false;
    list.innerHTML = history.map(order => {
      const summary = summarizeOrderItems(order.items);
      const short = summary.length > 36 ? summary.slice(0, 36) + '…' : summary;
      return `
        <button type="button" class="order-repeat-btn" data-reorder-id="${esc(order.id)}"
          title="Rudia: ${esc(summary)}">
          <span class="or-top">
            <span class="or-date">${esc(formatRelativeDate(order.at))}</span>
            <span class="or-total">${order.subtotal ? 'TSH ' + formatMoney(order.subtotal) : ''}</span>
          </span>
          <span class="or-items">${esc(short)}</span>
          <span class="or-cta">🔁 Rudia oda hii</span>
        </button>`;
    }).join('');
  }

  function clearMyHistory() {
    if (!confirm('Futa historia yako ya oda kwenye kifaa hiki?')) return;
    localStorage.removeItem(ORDER_HISTORY_KEY);
    localStorage.removeItem(LAST_ORDER_KEY);
    document.getElementById('reorderBtn')?.setAttribute('hidden', '');
    renderMyHistory();
    updateReorderButtons();
    showToast('Historia imefutwa');
  }

  function renderMyHistory() {
    const history = loadOrderHistory();
    const statsEl = document.getElementById('historyStats');
    const listEl = document.getElementById('historyList');
    const quickEl = document.getElementById('historyQuickStat');
    const introEl = document.getElementById('historyIntro');
    const clearBtn = document.getElementById('clearMyHistoryBtn');
    if (!statsEl || !listEl) return;

    const stats = computeHistoryStats(history);

    if (quickEl) {
      quickEl.textContent = stats.orderCount
        ? stats.orderCount + (stats.orderCount === 1 ? ' oda' : ' oda') +
          ' · TSH ' + formatMoney(stats.totalSpent)
        : 'Bado hujafanya oda';
    }

    if (introEl) {
      introEl.textContent = stats.orderCount
        ? 'Umefanya oda ' + stats.orderCount + ' kwa Clever Kitimoto. Jumla uliyoagiza: TSH ' +
          formatMoney(stats.totalSpent) + (stats.totalKg > 0 ? ' · ~' + stats.totalKg + ' KG Kitimoto' : '') + '.'
        : 'Oda zako zitaonekana hapa baada ya kutuma kupitia WhatsApp au SMS.';
    }

    if (clearBtn) clearBtn.toggleAttribute('hidden', !stats.orderCount);
    updateReorderButtons();

    if (!stats.orderCount) {
      statsEl.innerHTML = `
        <div class="history-stat highlight">
          <span class="history-stat-icon">🛒</span>
          <span class="history-stat-label">Anza oda yako</span>
          <strong class="history-stat-value">0</strong>
          <span class="history-stat-sub">Chagua menu na tuma oda</span>
        </div>`;
      listEl.innerHTML = `
        <div class="history-empty">
          <div class="icon">📋</div>
          <b>Hakuna historia bado</b>
          <p>Baada ya kutuma oda yako, utaona jumla hapa na utaweza <strong>rudia oda</strong> kwa kubonyeza moja tu.</p>
        </div>`;
      return;
    }

    statsEl.innerHTML = `
      <div class="history-stat highlight">
        <span class="history-stat-icon">🛒</span>
        <span class="history-stat-label">Jumla ya Oda</span>
        <strong class="history-stat-value">${stats.orderCount}</strong>
        <span class="history-stat-sub">${stats.lastOrderAt ? 'Mwisho: ' + formatRelativeDate(stats.lastOrderAt) : ''}</span>
      </div>
      <div class="history-stat">
        <span class="history-stat-icon">💰</span>
        <span class="history-stat-label">Uliyoagiza</span>
        <strong class="history-stat-value">TSH ${formatMoney(stats.totalSpent)}</strong>
        <span class="history-stat-sub">Jumla ya thamani (bila delivery)</span>
      </div>
      <div class="history-stat">
        <span class="history-stat-icon">🍽️</span>
        <span class="history-stat-label">Vitu Vilivyoagizwa</span>
        <strong class="history-stat-value">${stats.totalItems}</strong>
        <span class="history-stat-sub">Vipengele vyote kwenye oda</span>
      </div>
      <div class="history-stat">
        <span class="history-stat-icon">🥩</span>
        <span class="history-stat-label">Kitimoto (KG)</span>
        <strong class="history-stat-value">${stats.totalKg > 0 ? '~' + stats.totalKg + ' KG' : '—'}</strong>
        <span class="history-stat-sub">Kutoka ukubwa wa oda</span>
      </div>
      <div class="history-stat">
        <span class="history-stat-icon">⭐</span>
        <span class="history-stat-label">Unayopenda</span>
        <strong class="history-stat-value" style="font-size:0.88rem">${esc(stats.topItem || '—')}</strong>
        <span class="history-stat-sub">${stats.topItemQty ? '×' + stats.topItemQty + ' mara' : 'Bado haijulikani'}</span>
      </div>`;

    listEl.innerHTML = history.slice(0, 20).map(order => {
      const channel = order.channel === 'sms' ? 'sms' : order.channel === 'menu' ? 'online' : 'whatsapp';
      const channelLabel = channel === 'sms' ? 'SMS' : channel === 'online' ? 'Menu' : 'WhatsApp';
      const meta = [
        order.fulfillment === 'pickup' ? 'Pickup' : 'Delivery',
        paymentLabel(order.payment),
        order.paymentStatus === 'completed' ? 'Imelipwa' : order.paymentStatus === 'pending' && order.payment === 'snippe' ? 'Malipo yanasubiri' : ''
      ].filter(Boolean);
      if (order.phone) meta.push(order.phone);
      return `
        <article class="history-card history-repeatable" data-reorder-id="${esc(order.id)}"
          role="button" tabindex="0" title="Bonyeza kurudia oda hii">
          <div class="history-card-main">
            <div class="history-card-top">
              <span class="history-date">${esc(formatRelativeDate(order.at))}</span>
              <span class="history-channel ${channel}">${channelLabel}</span>
            </div>
            <p class="history-card-items">${esc(summarizeOrderItems(order.items))}</p>
            <div class="history-card-meta">${esc(meta.join(' · '))}</div>
          </div>
          <div class="history-card-side">
            <span class="history-card-total">${(order.total || order.subtotal) ? 'TSH ' + formatMoney(order.total || order.subtotal) : '—'}</span>
            <button type="button" class="btn-reorder" data-reorder-id="${esc(order.id)}">🔁 Rudia oda</button>
          </div>
        </article>`;
    }).join('');
    renderOrderRepeatStrip();
  }

  function bindHistoryEvents() {
    document.getElementById('openHistoryBtn')?.addEventListener('click', () => {
      document.getElementById('myHistory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('clearMyHistoryBtn')?.addEventListener('click', clearMyHistory);
    document.getElementById('reorderLastBtn')?.addEventListener('click', reorderLast);

    const repeatOrder = e => {
      const target = e.target.closest('[data-reorder-id]');
      if (!target) return;
      e.preventDefault();
      reorderFromHistory(target.dataset.reorderId);
    };

    document.getElementById('historyList')?.addEventListener('click', repeatOrder);
    document.getElementById('historyList')?.addEventListener('keydown', e => {
      const card = e.target.closest('.history-repeatable');
      if (!card || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      reorderFromHistory(card.dataset.reorderId);
    });
    document.getElementById('orderRepeatList')?.addEventListener('click', repeatOrder);
    document.getElementById('orderRepeatLastBtn')?.addEventListener('click', reorderLast);
  }

  function buildCartMessage() {
    const c = getCheckout();
    const lines = ['Habari Clever Kitimoto, naomba kuagiza:', ''];

    if (c.phone) lines.push('Simu: ' + c.phone);
    if (c.name) lines.push('Jina: ' + c.name);
    lines.push('Aina: ' + (c.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'));
    if (c.fulfillment === 'delivery' && c.address) lines.push('Mahali: ' + c.address);
    lines.push('Muda: ' + scheduleLabel(c));
    lines.push('Malipo: ' + paymentLabel(c.payment));
    if (c.payment === 'lipa') lines.push('Lipa namba: ' + lipaNumbersLine());
    if (c.notes) lines.push('Maelezo: ' + c.notes);
    if (c.phone) lines.push('');

    let moneyTotal = 0;
    cart.forEach(i => {
      const unit = parsePrice(i.price);
      const sub = lineTotal(i);
      if (sub > 0) moneyTotal += sub;
      const extraDetail = i.detail && !parseKgFromDetail(i.detail) ? ' · ' + i.detail : '';
      let line = '• ' + i.name + ' — ' + itemQuantityLabel(i) + extraDetail;
      if (unit > 0) {
        const kgPerItem = parseKgFromDetail(i.detail) || parseKgFromDetail(i.name);
        line += ' @ TSH ' + i.price + (kgPerItem ? ' / ' + formatKg(kgPerItem) + ' KG' : ' / portion');
        if (i.qty > 1) line += ' = TSH ' + formatMoney(unit * i.qty);
      }
      lines.push(line);
      const sides = (i.addons || []).filter(addon => Number(addon.qty) > 0);
      if (sides.length) {
        lines.push('   Sides: ' + sides.map(addon => addon.qty + '× ' + addon.name + ' @ TSH ' + addonPrice(addon)).join(', '));
      }
    });

    if (moneyTotal > 0) {
      lines.push('', 'Jumla ya menu: TSH ' + formatMoney(moneyTotal));
      lines.push('Ada ya huduma: TSH ' + formatMoney(ORDER_SERVICE_FEE));
      lines.push('JUMLA: TSH ' + formatMoney(moneyTotal + ORDER_SERVICE_FEE) + ' (bila delivery)');
      if (c.payment === 'snippe') lines.push('Malipo salama ya Snippe yatafunguka baada ya kuhifadhi oda.');
    }
    lines.push('', 'Delivery: ' + DELIVERY_NOTE);
    lines.push('', 'Asante!');
    return lines.join('\n');
  }

  function buildSimpleOrderMessage() {
    return [
      'Habari Clever Kitimoto, naomba kuagiza.',
      '',
      'Delivery: ' + DELIVERY_NOTE,
      '',
      'Asante!'
    ].join('\n');
  }

  function getOrderMessage() {
    return cart.length ? buildCartMessage() : buildSimpleOrderMessage();
  }

  function openWhatsApp(msg) {
    window.open(waLink(msg || getOrderMessage()), '_blank');
  }

  function openSms(msg) {
    window.location.href = smsLink(msg || getOrderMessage());
  }

  function parsePrice(val) {
    const n = parseInt(String(val || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMoney(amount) {
    return amount.toLocaleString('en-US');
  }

  function addonPrice(addon) {
    const option = SIDE_OPTIONS.find(side => side.key === addon?.key);
    return option ? formatPrice(option.priceKey) : (addon?.price || '');
  }

  function lineTotal(item) {
    const unit = parsePrice(item.price);
    const base = unit > 0 ? unit * item.qty : 0;
    const addons = (item.addons || []).reduce((sum, addon) => sum + parsePrice(addonPrice(addon)) * (Number(addon.qty) || 0), 0);
    return base + addons;
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => sum + lineTotal(item), 0);
  }

  function getCartGrandTotal() {
    return getCartTotal() + (cart.length ? ORDER_SERVICE_FEE : 0);
  }

  function getLivePrice(el) {
    const priceEl = el?.querySelector?.('[data-price]');
    return priceEl?.textContent?.trim() || el?.dataset?.priceVal || '';
  }

  function resolveAddTarget(el) {
    const priceKey = el.dataset.priceKey;
    const priceEl = el.querySelector?.('[data-price]');
    const priceFromMain = priceEl?.dataset?.pricePrefix === 'tsh'
      ? (priceEl.textContent || '').replace(/^TSH\s*/i, '').trim()
      : priceEl?.textContent?.trim();
    return {
      name: el.dataset.item,
      detail: el.dataset.detail || '',
      price: priceKey ? formatPrice(priceKey) : (priceFromMain || el.dataset.priceVal || ''),
      el
    };
  }

  function addToCart(name, detail, price, sourceEl) {
    const id = cartId(name, detail);
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id, name, detail: detail || '', price: price || '', qty: 1, addons: [] });
    }
    saveCart();
    updateCartUI();
    flashAdded(sourceEl);
    showToast('✓ ' + name + (detail ? ' (' + detail + ')' : '') + ' imeongezwa — fungua oda kuchagua sides');
  }

  function changeAddonQty(itemId, addonKey, delta) {
    const item = cart.find(line => line.id === itemId);
    const option = SIDE_OPTIONS.find(side => side.key === addonKey);
    if (!item || !option) return;
    const price = formatPrice(option.priceKey);
    const selected = item.addons || (item.addons = []);
    let addon = selected.find(side => side.key === addonKey);
    if (!addon && delta > 0) {
      addon = { key: option.key, name: option.name, qty: 0, price };
      selected.push(addon);
    }
    if (!addon) return;
    addon.qty = Math.max(0, Math.min(20, Number(addon.qty || 0) + delta));
    if (!addon.qty) item.addons = selected.filter(side => side.key !== addonKey);
    else addon.price = price;
    saveCart();
    updateCartUI();
  }

  function canAddSides(item) {
    return /choma|foil|rosti|kavu|kitimoto|mix|kisinia|zege/i.test(item.name || '');
  }

  function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
  }

  function renderAddonChoices(item) {
    if (!canAddSides(item)) return '';
    return `
      <section class="order-addons" aria-label="Chagua sides za ${esc(item.name)}">
        <div class="order-addons-head"><strong>Ongeza sides</strong><small>Chagua kiasi unachotaka</small></div>
        <div class="order-addons-grid">${SIDE_OPTIONS.map(option => {
          const qty = Number(item.addons?.find(addon => addon.key === option.key)?.qty) || 0;
          const price = formatPrice(option.priceKey);
          return `<div class="order-addon-row">
            <span class="order-addon-name"><span aria-hidden="true">${option.icon}</span><span>${esc(option.name)}<small>TSH ${esc(price)}</small></span></span>
            <div class="order-addon-stepper" aria-label="${esc(option.name)} kiasi">
              <button type="button" data-addon-change="-1" data-addon-key="${esc(option.key)}" data-id="${esc(item.id)}" aria-label="Punguza ${esc(option.name)}">−</button>
              <output>${qty}</output>
              <button type="button" data-addon-change="1" data-addon-key="${esc(option.key)}" data-id="${esc(item.id)}" aria-label="Ongeza ${esc(option.name)}">+</button>
            </div>
          </div>`;
        }).join('')}</div>
      </section>`;
  }

  function renderOrderPanel() {
    const list = document.getElementById('orderPanelList');
    const subtitle = document.getElementById('orderPanelSubtitle');
    const subtotalEl = document.getElementById('orderSubtotal');
    const grandEl = document.getElementById('orderGrandTotal');
    if (!list) return;

    const itemCount = cart.reduce((s, i) => s + i.qty, 0);
    const moneyTotal = getCartTotal();
    const grandTotal = getCartGrandTotal();

    if (subtitle) {
      subtitle.textContent = itemCount
        ? itemCount + (itemCount === 1 ? ' kipengele kwenye oda' : ' vipengele kwenye oda')
        : 'Chagua menu na uongeze hapa';
    }

    if (!cart.length) {
      list.innerHTML = `
        <div class="order-empty">
          <div class="icon">🛒</div>
          <b>Oda yako haina kitu bado</b>
          <p>Bonyeza <strong>0.5 KG</strong> hapo juu kuongeza haraka, au chagua menu kutoka orodha.</p>
        </div>`;
    } else {
      list.innerHTML = cart.map(item => {
        const unit = parsePrice(item.price);
        const sub = lineTotal(item);
        return `
          <article class="order-line" data-id="${esc(item.id)}">
            <div class="order-line-info">
              <h4>${esc(item.name)}</h4>
              <div class="order-line-meta">${item.detail ? esc(item.detail) : (parseKgFromDetail(item.name) ? formatKg(parseKgFromDetail(item.name)) + ' KG' : 'Standard')} · TSH ${esc(item.price || '—')} / ${parseKgFromDetail(item.detail) || parseKgFromDetail(item.name) ? formatKg(parseKgFromDetail(item.detail) || parseKgFromDetail(item.name)) + ' KG' : 'portion'}</div>
              <div class="order-line-price">${sub > 0 ? 'TSH ' + formatMoney(sub) : 'Bei haijulikani'}</div>
              ${renderAddonChoices(item)}
            </div>
            <div class="order-line-controls">
              <div class="qty-stepper">
                <button type="button" data-qty-change="-1" data-id="${esc(item.id)}" aria-label="Punguza">−</button>
                <span class="qty-unit-label">${esc(itemQuantityLabel(item))}</span>
                <button type="button" data-qty-change="1" data-id="${esc(item.id)}" aria-label="Ongeza">+</button>
              </div>
              <button type="button" class="order-line-remove" data-remove-id="${esc(item.id)}">Ondoa</button>
            </div>
          </article>`;
      }).join('');
    }

    if (subtotalEl) subtotalEl.textContent = moneyTotal > 0 ? 'TSH ' + formatMoney(moneyTotal) : '—';
    const feeEl = document.getElementById('orderServiceFee');
    if (feeEl) feeEl.textContent = 'TSH ' + formatMoney(cart.length ? ORDER_SERVICE_FEE : 0);
    if (grandEl) grandEl.textContent = moneyTotal > 0 ? 'TSH ' + formatMoney(grandTotal) : '—';
    renderOrderHalfKgStrip();
    renderOrderRepeatStrip();
  }

  function renderOrderHalfKgStrip() {
    const strip = document.getElementById('orderHalfKgStrip');
    if (!strip) return;
    strip.innerHTML = HALF_KG_ITEMS.map(item => {
      const price = formatPrice(item.priceKey);
      const inCart = cart.find(i => i.id === cartId(item.name, SIZE_DETAIL));
      const qty = inCart?.qty || 0;
      return `
        <button type="button" class="order-halfkg-btn halfkg-add${qty ? ' in-cart' : ''}"
          data-item="${esc(item.name)}" data-detail="${SIZE_DETAIL}" data-price-key="${esc(item.priceKey)}"
          title="Ongeza ${esc(item.name)} 0.5 KG">
          <span class="oh-icon">${item.icon}</span>
          <span class="oh-name">${esc(item.name)}</span>
          <span class="oh-size">0.5 KG${qty ? ' · ×' + qty : ''}</span>
          <span class="oh-price">TSH ${esc(price)}</span>
        </button>
      `;
    }).join('');
  }

  function updateCartUI() {
    const bar = document.getElementById('cartBar');
    const count = document.getElementById('cartCount');
    const preview = document.getElementById('cartPreview');
    const totalEl = document.getElementById('cartTotal');
    const badge = document.getElementById('cartBadge');
    const itemCount = cart.reduce((s, i) => s + i.qty, 0);
    const moneyTotal = getCartTotal();

    if (badge) {
      badge.textContent = String(itemCount);
      badge.dataset.count = String(itemCount);
    }

    if (!itemCount) {
      bar?.classList.remove('visible');
      renderOrderPanel();
      return;
    }

    bar?.classList.add('visible');
    if (count) count.textContent = itemCount + (itemCount === 1 ? ' kipengele' : ' vipengele');
    if (preview) {
      preview.textContent = cart.map(i => {
        const sub = lineTotal(i);
        let line = i.name + ' — ' + itemQuantityLabel(i) + (i.detail && !parseKgFromDetail(i.detail) ? ' (' + i.detail + ')' : '');
        const sides = (i.addons || []).filter(addon => Number(addon.qty) > 0).map(addon => addon.qty + '× ' + addon.name);
        if (sides.length) line += ' + ' + sides.join(', ');
        if (sub > 0) line += ' — TSH ' + formatMoney(sub);
        return line;
      }).join(' · ');
    }

    if (totalEl) {
      if (moneyTotal > 0) {
        totalEl.innerHTML = 'JUMLA: TSH ' + formatMoney(moneyTotal) +
          '<small class="cart-delivery-note"> · Delivery kwa mteja</small>';
      } else {
        totalEl.innerHTML = 'JUMLA: —<small class="cart-delivery-note"> · Delivery kwa mteja</small>';
      }
    }

    renderOrderPanel();
  }

  let cartEventsBound = false;

  function bindCartEvents() {
    if (cartEventsBound) return;
    cartEventsBound = true;

    document.addEventListener('click', e => {
      const orderNowEl = e.target.closest('.btn-order-now');
      if (orderNowEl) {
        e.preventDefault();
        const payload = resolveAddTarget(orderNowEl);
        addToCart(payload.name, payload.detail, payload.price, orderNowEl);
        openOrderPanel();
        return;
      }

      const addEl = e.target.closest('.btn-add, .price-add, .halfkg-add, .kisinia-add, .kisinia-card');
      if (addEl) {
        e.preventDefault();
        const payload = resolveAddTarget(addEl);
        addToCart(payload.name, payload.detail, payload.price, addEl);
        return;
      }

      const qtyBtn = e.target.closest('[data-qty-change]');
      if (qtyBtn) {
        changeQty(qtyBtn.dataset.id, parseInt(qtyBtn.dataset.qtyChange, 10));
        return;
      }

      const addonBtn = e.target.closest('[data-addon-change]');
      if (addonBtn) {
        changeAddonQty(addonBtn.dataset.id, addonBtn.dataset.addonKey, parseInt(addonBtn.dataset.addonChange, 10));
        return;
      }

      const removeBtn = e.target.closest('[data-remove-id]');
      if (removeBtn) {
        removeFromCart(removeBtn.dataset.removeId);
      }
    });

    document.getElementById('openOrderPanel')?.addEventListener('click', openOrderPanel);
    document.getElementById('headerOrder')?.addEventListener('click', openOrderPanel);
    document.getElementById('cartBarTap')?.addEventListener('click', openOrderPanel);
    document.getElementById('heroOrder')?.addEventListener('click', openOrderPanel);
    document.getElementById('bannerOrder')?.addEventListener('click', openOrderPanel);
    document.getElementById('orderPanelClose')?.addEventListener('click', closeOrderPanel);
    document.getElementById('orderPanelBackdrop')?.addEventListener('click', closeOrderPanel);
    document.getElementById('mobileOpenOrder')?.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('mobileDrawer')?.classList.remove('open');
      openOrderPanel();
    });

    document.getElementById('cartSend')?.addEventListener('click', () => sendCart());
    document.getElementById('orderConfirmationClose')?.addEventListener('click', closeOrderPanel);
    document.getElementById('orderConfirmationWhatsApp')?.addEventListener('click', () => {
      if (lastSubmittedOrderMessage) openWhatsApp(lastSubmittedOrderMessage);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeOrderPanel();
    });

    document.getElementById('shareMenuBtn')?.addEventListener('click', shareMenu);
    document.getElementById('reorderBtn')?.addEventListener('click', reorderLast);
  }
  let orderSending = false;
  function orderWhatsAppMessage(record, message) {
    const reference = String(record?.id || '').replace(/^ord-/, '').slice(0, 8).toUpperCase();
    return message + '\nNamba ya oda: ' + (reference || '—');
  }

  function openReservedWhatsApp(tab, message) {
    if (!tab || tab.closed) return false;
    try {
      tab.location.href = waLink(message);
      return true;
    } catch {
      return false;
    }
  }

  async function sendCart() {
    if (orderSending) return;
    if (!cart.length) {
      showToast('Oda haina kitu — ongeza menu kwanza');
      openOrderPanel();
      return;
    }
    const c = getCheckout();
    if (!c.phone) {
      showToast('Tafadhali weka namba ya simu');
      openOrderPanel();
      document.getElementById('custPhone')?.focus();
      return;
    }
    if (c.fulfillment === 'delivery' && !c.address) {
      showToast('Weka mahali pa delivery ili tukufikie');
      openOrderPanel();
      document.getElementById('custAddress')?.focus();
      return;
    }
    if (c.timing === 'scheduled' && (!c.scheduleDate || !c.scheduleTime)) {
      showToast('Weka tarehe na muda wa oda yako');
      openOrderPanel();
      document.getElementById('custScheduleDate')?.focus();
      return;
    }
    saveCheckout();
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(cart));
    const orderMessage = buildCartMessage();
    // Reserve the WhatsApp window during the button click; populate it only after saving.
    const whatsappTab = window.open('about:blank', '_blank');
    setOrderSubmitting(true);
    document.getElementById('reorderBtn')?.removeAttribute('hidden');

    if (c.payment === 'snippe') {
      let savedRecord = null;
      let whatsappOpened = false;
      try {
        const result = await saveOrderRecord();
        if (!result.cloud) {
          whatsappTab?.close();
          showToast('Hatuwezi kuanza malipo: oda haijahifadhiwa kwenye database. Angalia intaneti kisha jaribu tena.');
          setOrderSubmitting(false);
          return;
        }
        savedRecord = result.record;
        lastSubmittedOrderMessage = orderWhatsAppMessage(savedRecord, orderMessage);
        whatsappOpened = openReservedWhatsApp(whatsappTab, lastSubmittedOrderMessage);
        if (!result.synced) {
          setOrderSubmitting(false);
          showOrderConfirmation(savedRecord, false, 'Oda itasawazishwa kwenye mfumo intaneti ikirudi. ' + (whatsappOpened ? 'WhatsApp imefunguliwa; bonyeza Tuma.' : 'Fungua WhatsApp kwa kutumia kitufe hapa chini.'), whatsappOpened);
          return;
        }
        const payment = await window.CleverOrdersCloud.createSnippeCheckout(result.record.id);
        if (!payment?.checkoutUrl) throw new Error('Snippe haikurudisha kiungo cha malipo.');
        window.location.assign(payment.checkoutUrl);
      } catch (err) {
        console.warn('Snippe checkout could not start', err);
        setOrderSubmitting(false);
        if (savedRecord) {
          showOrderConfirmation(savedRecord, true, 'Oda imehifadhiwa kwenye mfumo, lakini malipo hayakuanza. ' + (whatsappOpened ? 'WhatsApp imefunguliwa; bonyeza Tuma.' : 'Fungua WhatsApp kwa kutumia kitufe hapa chini.'), whatsappOpened);
        } else {
          whatsappTab?.close();
          showToast('Oda haijahifadhiwa kwenye mfumo. Angalia intaneti kisha jaribu tena.');
        }
      }
      return;
    }
    let result;
    try {
      result = await saveOrderRecord();
    } catch (err) {
      console.error('Unable to save order on this device', err);
      whatsappTab?.close();
      showToast('Imeshindikana kuhifadhi oda. Tafadhali jaribu tena.');
      setOrderSubmitting(false);
      return;
    }
    if (!result.cloud) {
      whatsappTab?.close();
      showToast('Database haijaunganishwa. Oda haikutumwa kwenye mfumo; jaribu tena baadaye.');
      setOrderSubmitting(false);
      return;
    }
    lastSubmittedOrderMessage = orderWhatsAppMessage(result.record, orderMessage);
    const whatsappOpened = openReservedWhatsApp(whatsappTab, lastSubmittedOrderMessage);
    setOrderSubmitting(false);
    showOrderConfirmation(result.record, result.synced, '', whatsappOpened);
  }

  function findKisiniaItem(priceKey) {
    for (const group of KISINIA_GROUPS) {
      const item = group.items.find(i => i.priceKey === priceKey);
      if (item) return item;
    }
    return null;
  }

  function pickKisiniaForDiners(count) {
    if (count <= 1) return KISINIA_EAT_OPTIONS[0];
    if (count === 2) return KISINIA_EAT_OPTIONS[1];
    if (count <= 4) return KISINIA_EAT_OPTIONS[2];
    return KISINIA_EAT_OPTIONS[3];
  }

  function highlightKisiniaCards(priceKey) {
    document.querySelectorAll('.kisinia-card').forEach(card => {
      card.classList.toggle('kisinia-pick', card.dataset.priceKey === priceKey);
    });
  }

  function renderKisiniaSmartPicker() {
    const pillsEl = document.getElementById('kisiniaDinerPills');
    const recEl = document.getElementById('kisiniaRecommend');
    if (!pillsEl || !recEl) return;

    pillsEl.innerHTML = KISINIA_EAT_OPTIONS.map(opt => `
      <button type="button" class="kisinia-diner-pill${kisiniaDinerPick === opt.diners ? ' active' : ''}"
        data-diners="${opt.diners}" aria-pressed="${kisiniaDinerPick === opt.diners}">
        <span class="kdp-icon">${opt.icon}</span>
        <span class="kdp-label">${esc(opt.label)}</span>
      </button>
    `).join('');

    const pick = pickKisiniaForDiners(kisiniaDinerPick);
    const item = findKisiniaItem(pick.priceKey);
    const price = formatPrice(pick.priceKey);

    if (!item) {
      recEl.hidden = true;
      return;
    }

    recEl.hidden = false;
    recEl.innerHTML = `
      <div class="kisinia-rec-body">
        <div class="kisinia-rec-top">
          <span class="kisinia-rec-badge">🥩 Pendekezo lako</span>
          <strong>${esc(pick.name)}${pick.detail ? ' · ' + esc(pick.detail) : ''}</strong>
        </div>
        <p class="kisinia-rec-desc">${esc(item.desc)}</p>
        <ul class="kisinia-includes">
          ${(item.includes || []).map(x => '<li>' + esc(x) + '</li>').join('')}
        </ul>
        <div class="kisinia-rec-foot">
          <span class="kisinia-rec-price">TSH ${esc(price)}</span>
          <button type="button" class="btn btn-primary btn-sm kisinia-add"
            data-item="${esc(pick.name)}" data-detail="${esc(pick.detail)}" data-price-key="${esc(pick.priceKey)}">
            + Oda kisinia hii
          </button>
        </div>
      </div>`;

    highlightKisiniaCards(pick.priceKey);

    if (pillsEl.dataset.bound) return;
    pillsEl.dataset.bound = '1';
    pillsEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-diners]');
      if (!btn) return;
      kisiniaDinerPick = parseInt(btn.dataset.diners, 10);
      renderKisiniaSmartPicker();
    });
  }

  function renderKisiniaQuickOrder() {
    const root = document.getElementById('kisiniaRoot');
    if (!root) return;
    root.innerHTML = KISINIA_GROUPS.map(group => `
      <div class="kisinia-group">
        <div class="kisinia-group-head">
          <h3>${esc(group.title)}</h3>
          <span>${esc(group.subtitle)}</span>
        </div>
        <div class="kisinia-grid">
          ${group.items.map(item => {
            const price = formatPrice(item.priceKey);
            const includes = (item.includes || []).slice(0, 3).join(' · ');
            return `
              <article class="kisinia-card"
                data-item="${esc(item.name)}" data-detail="${esc(item.detail)}" data-price-key="${esc(item.priceKey)}">
                <div class="kisinia-card-top">
                  <span class="kisinia-icon">${item.icon}</span>
                  <span class="kisinia-tag">${esc(item.tag)}</span>
                </div>
                <h4>${esc(item.name)}${item.detail ? ` <small>· ${esc(item.detail)}</small>` : ''}</h4>
                <p>${esc(item.desc)}</p>
                ${includes ? `<div class="kisinia-includes-inline">${esc(includes)}</div>` : ''}
                <div class="kisinia-price">TSH ${esc(price)}</div>
                <span class="kisinia-cta">+ Oda kula sasa</span>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
    highlightKisiniaCards(pickKisiniaForDiners(kisiniaDinerPick).priceKey);
  }

  function initKisiniaOrderCards() {
    document.querySelectorAll('.kisinia-order-card').forEach(card => {
      if (card.dataset.kisiniaInit) return;
      card.dataset.kisiniaInit = '1';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', 'Ongeza ' + (card.dataset.item || 'Kisinia') + ' kwenye oda');

      const activate = () => {
        const payload = resolveAddTarget(card);
        addToCart(payload.name, payload.detail, payload.price, card);
      };

      card.addEventListener('click', e => {
        if (e.target.closest('.kisinia-add')) return;
        activate();
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  function updateOpenStatus() {
    const h = new Date().getHours();
    const open = h >= OPEN_HOUR && h < CLOSE_HOUR;
    const badge = document.getElementById('openStatusBadge');
    const text = document.getElementById('openStatusText');
    const dot = document.getElementById('openStatusDot');
    if (!badge || !text) return;

    badge.classList.toggle('open-now', open);
    badge.classList.toggle('closed-now', !open);
    text.textContent = open
      ? '🟢 Wazi sasa · 10:00 – 23:00'
      : '🔴 Tumejifunga · Fungua 10:00 – 23:00';
    if (dot) dot.style.display = open ? '' : 'none';
  }

  async function shareMenu() {
    const url = window.location.href.split('#')[0];
    const text = 'Angalia menu ya Clever Kitimoto — Kitimoto Bora, Bei Poa! 🐷';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Clever Kitimoto Menu', text, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('🔗 Link imenakiliwa!');
      }
    } catch { /* user cancelled */ }
  }

  function initCheckout() {
    loadCheckout();
    const dateInput = document.getElementById('custScheduleDate');
    if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);
    ['custName', 'custPhone', 'custAddress', 'custNotes', 'custScheduleDate', 'custScheduleTime'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', saveCheckout);
    });
    document.querySelectorAll('.pill-group').forEach(group => {
      group.addEventListener('click', e => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        group.querySelectorAll('.pill').forEach(p => {
          p.classList.remove('active');
          if (p.hasAttribute('aria-pressed')) p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        if (pill.hasAttribute('aria-pressed')) pill.setAttribute('aria-pressed', 'true');
        saveCheckout();
        if (group.id === 'fulfillmentPills') toggleAddressField();
        if (group.id === 'paymentPills') toggleLipaPanel();
        if (group.id === 'timingPills') toggleScheduleFields();
      });
    });
    document.querySelectorAll('.lipa-card').forEach(btn => {
      btn.addEventListener('click', () => {
        copyLipaNumber(btn.dataset.lipa, btn.dataset.label);
      });
    });
    if (localStorage.getItem(LAST_ORDER_KEY)) {
      document.getElementById('reorderBtn')?.removeAttribute('hidden');
    }
    updateReorderButtons();
    refreshSnippeAvailability();
  }

  async function refreshSnippeAvailability() {
    const option = document.getElementById('snippePaymentOption');
    if (!option) return;
    let ready = false;
    try {
      ready = !!(await window.CleverOrdersCloud?.checkSnippeAvailability?.());
    } catch { ready = false; }
    option.hidden = !ready;
    if (!ready && document.querySelector('#paymentPills .pill.active')?.dataset.val === 'snippe') {
      setPillActive('paymentPills', 'mpesa');
    }
    toggleLipaPanel();
    saveCheckout();
  }

  async function handleSnippeReturn() {
    const params = new URLSearchParams(location.search);
    if (params.get('snippe_return') !== '1') return;
    const orderId = params.get('order_id') || '';
    history.replaceState({}, document.title, location.pathname + location.hash);
    if (!orderId || !window.CleverOrdersCloud?.getOrderPaymentStatus) {
      showToast('Umerudi kutoka Snippe. Oda yako imehifadhiwa; hakiki hali ya malipo kwa mgahawa.');
      return;
    }
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const payment = await window.CleverOrdersCloud.getOrderPaymentStatus(orderId);
        if (payment?.status) updateLocalOrderPayment(orderId, payment.status, payment.reference);
        if (payment?.status === 'completed') {
          showToast('✓ Malipo yamethibitishwa. Oda yako inasubiri maandalizi.');
          return;
        }
        if (['failed', 'expired', 'voided'].includes(payment?.status)) {
          showToast('Malipo hayajakamilika. Oda imehifadhiwa; wasiliana nasi kuendelea.');
          return;
        }
      } catch { /* webhook may still be updating the order */ }
      if (attempt < 7) await new Promise(resolve => setTimeout(resolve, 2500));
    }
    showToast('Malipo yanathibitishwa. Oda yako imehifadhiwa; tutakujulisha.');
  }

  function updateLocalOrderPayment(orderId, status, reference) {
    try {
      const history = loadOrderHistory();
      const order = history.find(item => item.id === orderId);
      if (!order) return;
      order.paymentStatus = status;
      if (reference) order.paymentReference = reference;
      localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history));
      renderMyHistory();
    } catch { /* the cloud record remains authoritative */ }
  }

  function initScrollTop() {
    const btn = document.getElementById('scrollTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.hidden = window.scrollY < 400;
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function filterMenu(query, category) {
    const q = (query || '').trim().toLowerCase();
    activeFilter = category || activeFilter;

    document.querySelectorAll('.filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.filter === activeFilter);
    });

    document.querySelectorAll('.section').forEach(section => {
      const cat = section.dataset.category;
      const catMatch = activeFilter === 'all' || cat === activeFilter;
      let sectionVisible = false;

      section.querySelectorAll('.card').forEach(card => {
        const text = card.textContent.toLowerCase();
        const match = (!q || text.includes(q)) && catMatch;
        card.classList.toggle('no-match', !match);
        if (match) sectionVisible = true;
      });

      section.classList.toggle('hidden-by-filter', !sectionVisible && (q || activeFilter !== 'all'));
    });
  }

  function bindSearch() {
    const input = document.getElementById('menuSearch');
    input?.addEventListener('input', () => filterMenu(input.value, activeFilter));

    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        activeFilter = pill.dataset.filter;
        filterMenu(input?.value || '', activeFilter);
      });
    });
  }

  function bindNav() {
    const header = document.querySelector('.header');
    const links = document.querySelectorAll('.nav-links a, .mobile-panel a');
    const sections = document.querySelectorAll('.section[id]');

    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);

      let current = '';
      sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
      });
      links.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    }, { passive: true });

    const drawer = document.getElementById('mobileDrawer');
    document.getElementById('menuToggle')?.addEventListener('click', () => drawer.classList.add('open'));
    document.getElementById('mobileClose')?.addEventListener('click', () => drawer.classList.remove('open'));
    drawer?.addEventListener('click', e => { if (e.target === drawer) drawer.classList.remove('open'); });
    drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));
  }

  function bindReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.section, .card, .order-banner, .faq-section').forEach(el => {
      el.classList.add('reveal');
      obs.observe(el);
    });
  }

  function bindPhoneCopy() {
    document.getElementById('phoneCopy')?.addEventListener('click', () => copyPhone('06834977330', 'phoneCopy'));
    document.getElementById('phoneCopy2')?.addEventListener('click', () => copyPhone('0794607335', 'phoneCopy2'));
  }

  function copyPhone(num, id) {
    navigator.clipboard?.writeText(num).then(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const orig = el.textContent;
      el.textContent = '✓ Copied!';
      setTimeout(() => { el.textContent = orig; }, 1500);
    });
  }

  function renderCustomMenus() {
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch { /* noop */ }

    const sec = document.getElementById('customMenusSection');
    const grid = document.getElementById('customMenuGrid');
    if (!sec || !grid) return;

    const active = custom.filter(x => x.active !== false);
    if (!active.length) {
      sec.style.display = 'none';
      return;
    }

    sec.style.display = 'block';
    grid.innerHTML = active.map(x => `
      <article class="card reveal" data-searchable>
        <div class="card-photo">
          ${x.image
            ? `<img src="${esc(x.image)}" alt="${esc(x.name)}" loading="lazy">`
            : '<div style="height:100%;display:grid;place-items:center;font-size:3rem;background:var(--surface-2)">🐷</div>'}
          <span class="card-tag">${esc(x.category)}</span>
        </div>
        <div class="card-body">
          <h3>${esc(x.name)}</h3>
          <p class="card-desc">${esc(x.desc || 'Clever Kitimoto — served hot.')}</p>
          <div class="price-main">TSH ${esc(x.price)}${x.size ? ` <small>· ${esc(x.size)}</small>` : ''}</div>
          <div class="card-actions">
            <button class="btn btn-add btn-sm" data-item="${esc(x.name)}" data-detail="${esc(x.size || '')}" data-price-val="${esc(x.price)}">+ Add</button>
            <button class="btn btn-primary btn-sm btn-order-now" type="button" data-item="${esc(x.name)}" data-detail="${esc(x.size || '')}" data-price-val="${esc(x.price)}">Weka Oda</button>
          </div>
        </div>
      </article>
    `).join('');

    bindCartEvents();
    grid.querySelectorAll('.card').forEach(c => {
      c.classList.add('reveal');
      new IntersectionObserver(([e]) => { if (e.isIntersecting) e.target.classList.add('visible'); }, { threshold: 0.08 }).observe(c);
    });
  }

  window.CK = { getPrices, formatPrice, applyPrices, waLink, smsLink, openSms, openWhatsApp, getOrderMessage, openOrderPanel };

  document.addEventListener('DOMContentLoaded', async () => {
    if (window.CleverCloudSync?.isEnabled()) {
      try {
        await window.CleverCloudSync.syncBootstrap();
        window.CleverCloudSync.onRemoteChange(() => {
          applyPrices();
          renderCustomMenus();
          renderKisiniaQuickOrder();
          renderKisiniaSmartPicker();
        });
      } catch (err) {
        console.warn('Menu cloud sync failed', err);
      }
    }

    function refreshMenuFromCloud() {
      applyPrices();
      renderCustomMenus();
      renderKisiniaQuickOrder();
      renderKisiniaSmartPicker();
    }

    document.addEventListener('clever-smart-sync', e => {
      if (e.detail?.storageChanged) refreshMenuFromCloud();
    });

    if (window.CleverSmartSync && (window.CleverCloudSync?.isEnabled?.() || window.CleverOrdersCloud?.isEnabled?.())) {
      window.CleverSmartSync.start();
    }

    trackVisit();
    applyPrices();
    bindCartEvents();
    initCheckout();
    initSizePickers();
    initKisiniaOrderCards();
    updateCartUI();
    bindSearch();
    bindNav();
    bindReveal();
    bindPhoneCopy();
    renderCustomMenus();
    renderMyHistory();
    bindHistoryEvents();
    updateOpenStatus();
    initScrollTop();
    handleSnippeReturn();
  });

  window.addEventListener('storage', () => {
    applyPrices();
    renderCustomMenus();
    renderKisiniaQuickOrder();
    renderKisiniaSmartPicker();
  });
})();
