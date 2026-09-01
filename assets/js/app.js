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

  const POPULAR = [
    { name: 'Choma', detail: '0.5 KG', priceKey: 'choma', tag: 'Quick', desc: 'Nusu kilo — bei poa, oda haraka' },
    { name: '1 KG Mix', detail: '', price: '35,000', tag: 'Best Seller', desc: 'Choma + Rosti + Kavu + sides' },
    { name: 'Kisinia Couple', detail: 'Watu 2', priceKey: 'couple', tag: 'Couple', desc: 'Perfect kwa watu wawili' },
    { name: 'Choma', detail: '1 KG', price: '18,000', tag: 'Classic', desc: 'Kitimoto choma fresh' },
    { name: 'Zege Single', detail: '', price: '15,000', tag: 'Zege', desc: 'Kitimoto + chipsi kavu' }
  ];

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
      subtitle: 'Single · Couple · Family',
      items: [
        { name: 'Kisinia Single', detail: 'Mtu 1', priceKey: 'single', icon: '👤', tag: 'Solo', desc: '½ KG Mix + Ndizi 2 + Ugali 1 + Kachumbari' },
        { name: 'Kisinia Couple', detail: 'Watu 2', priceKey: 'couple', icon: '👫', tag: 'Couple', desc: '1 KG Mix + Ndizi 4 + Ugali 2 + Kachumbari' },
        { name: 'Kisinia Family', detail: 'Watu 4', priceKey: 'family', icon: '👨‍👩‍👧‍👦', tag: 'Family', desc: '2 KG Mix + Ndizi 8 + Ugali 4 + Chipsi Yai + Kachumbari' }
      ]
    },
    {
      title: 'Mixed Kitimoto',
      subtitle: 'Choma + Rosti + Kavu',
      items: [
        { name: '½ KG Mix', detail: '', priceKey: 'mixedhalf', icon: '🍽️', tag: 'Mix', desc: 'Choma + Rosti + Kavu + Ndizi 2 + Ugali 1 + Kachumbari' },
        { name: '1 KG Mix', detail: '', priceKey: 'mixedone', icon: '⭐', tag: 'Best', desc: 'Choma + Rosti + Kavu + Ndizi 4 + Ugali 2 + Kachumbari' },
        { name: '2 KG Mix Special', detail: '', priceKey: 'mixedtwo', icon: '🎉', tag: 'Feast', desc: 'Choma 1 KG + Rosti ½ + Kavu ½ + sides' }
      ]
    },
    {
      title: 'Kisinia Zege',
      subtitle: 'Kitimoto + Chipsi',
      items: [
        { name: 'Zege Single', detail: '', priceKey: 'zegeSingle', icon: '🍟', tag: 'Single', desc: '½ KG Kitimoto + Chipsi Kavu' },
        { name: 'Zege Couple', detail: '', priceKey: 'zegeCouple', icon: '🍟', tag: 'Couple', desc: '1 KG Kitimoto + Chipsi Kavu + Kachumbari' },
        { name: 'Zege Special', detail: '', priceKey: 'zegeSpecial', icon: '🍟', tag: 'Special', desc: '1½ KG Kitimoto + sides' }
      ]
    }
  ];

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

  function openOrderPanel() {
    const panel = document.getElementById('orderPanel');
    if (!panel) return;
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
    renderPopularPicks();
    renderHalfKgQuickOrder();
    renderKisiniaQuickOrder();
    renderOrderHalfKgStrip();
  }

  function waLink(text) {
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
  }

  function smsLink(text, phone) {
    return 'sms:' + (phone || SMS_PHONE) + '?body=' + encodeURIComponent(text);
  }

  function paymentLabel(val) {
    return ({ mpesa: 'M-Pesa', cash: 'Cash', lipa: 'Lipa namba' }[val] || val);
  }

  function getCheckout() {
    return {
      phone: document.getElementById('custPhone')?.value.trim() || '',
      address: document.getElementById('custAddress')?.value.trim() || '',
      notes: document.getElementById('custNotes')?.value.trim() || '',
      fulfillment: document.querySelector('#fulfillmentPills .pill.active')?.dataset.val || 'delivery',
      payment: document.querySelector('#paymentPills .pill.active')?.dataset.val || 'mpesa'
    };
  }

  function saveCheckout() {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(getCheckout()));
  }

  function loadCheckout() {
    try {
      const c = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '{}');
      const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
      set('custPhone', c.phone);
      set('custAddress', c.address);
      set('custNotes', c.notes);
      if (c.fulfillment) setPillActive('fulfillmentPills', c.fulfillment);
      if (c.payment) setPillActive('paymentPills', c.payment);
      toggleAddressField();
      toggleLipaPanel();
    } catch { /* noop */ }
  }

  function setPillActive(groupId, val) {
    document.querySelectorAll('#' + groupId + ' .pill').forEach(p => {
      p.classList.toggle('active', p.dataset.val === val);
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
    if (panel) panel.classList.toggle('lipa-active', lipa);
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

  function saveOrderRecord(channel) {
    const c = getCheckout();
    const items = cart.map(i => ({
      name: i.name,
      detail: i.detail || '',
      price: i.price,
      qty: i.qty
    }));
    const record = {
      id: 'ord-' + Date.now(),
      at: new Date().toISOString(),
      channel,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      fulfillment: c.fulfillment,
      payment: c.payment,
      subtotal: getCartTotal(),
      items
    };
    const history = loadOrderHistory();
    history.unshift(record);
    if (history.length > 200) history.length = 200;
    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history));
    return record;
  }

  function buildCartMessage() {
    const c = getCheckout();
    const lines = ['Habari Clever Kitimoto, naomba kuagiza:', ''];

    if (c.phone) lines.push('Simu: ' + c.phone);
    lines.push('Aina: ' + (c.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'));
    if (c.fulfillment === 'delivery' && c.address) lines.push('Mahali: ' + c.address);
    lines.push('Malipo: ' + paymentLabel(c.payment));
    if (c.payment === 'lipa') lines.push('Lipa namba: ' + lipaNumbersLine());
    if (c.notes) lines.push('Maelezo: ' + c.notes);
    if (c.phone) lines.push('');

    let moneyTotal = 0;
    cart.forEach(i => {
      const unit = parsePrice(i.price);
      const sub = lineTotal(i);
      if (sub > 0) moneyTotal += sub;
      let line = '• ' + i.qty + '× ' + i.name + (i.detail ? ' — ' + i.detail : '');
      if (unit > 0) {
        line += ' @ TSH ' + i.price;
        if (i.qty > 1) line += ' = TSH ' + formatMoney(sub);
      }
      lines.push(line);
    });

    if (moneyTotal > 0) {
      lines.push('', 'JUMLA: TSH ' + formatMoney(moneyTotal) + ' (bila delivery)');
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

  function lineTotal(item) {
    const unit = parsePrice(item.price);
    return unit > 0 ? unit * item.qty : 0;
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => sum + lineTotal(item), 0);
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
      cart.push({ id, name, detail: detail || '', price: price || '', qty: 1 });
    }
    saveCart();
    updateCartUI();
    flashAdded(sourceEl);
    showToast('✓ ' + name + (detail ? ' (' + detail + ')' : '') + ' imeongezwa');
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

  function renderOrderPanel() {
    const list = document.getElementById('orderPanelList');
    const subtitle = document.getElementById('orderPanelSubtitle');
    const subtotalEl = document.getElementById('orderSubtotal');
    const grandEl = document.getElementById('orderGrandTotal');
    if (!list) return;

    const itemCount = cart.reduce((s, i) => s + i.qty, 0);
    const moneyTotal = getCartTotal();

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
              <div class="order-line-meta">${item.detail ? esc(item.detail) : 'Standard'} · TSH ${esc(item.price || '—')} each</div>
              <div class="order-line-price">${sub > 0 ? 'TSH ' + formatMoney(sub) : 'Bei haijulikani'}</div>
            </div>
            <div class="order-line-controls">
              <div class="qty-stepper">
                <button type="button" data-qty-change="-1" data-id="${esc(item.id)}" aria-label="Punguza">−</button>
                <span>${item.qty}</span>
                <button type="button" data-qty-change="1" data-id="${esc(item.id)}" aria-label="Ongeza">+</button>
              </div>
              <button type="button" class="order-line-remove" data-remove-id="${esc(item.id)}">Ondoa</button>
            </div>
          </article>`;
      }).join('');
    }

    if (subtotalEl) subtotalEl.textContent = moneyTotal > 0 ? 'TSH ' + formatMoney(moneyTotal) : '—';
    if (grandEl) grandEl.textContent = moneyTotal > 0 ? 'TSH ' + formatMoney(moneyTotal) : '—';
    renderOrderHalfKgStrip();
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
        let line = i.qty + '× ' + i.name + (i.detail ? ' (' + i.detail + ')' : '');
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

  function clearCart() {
    if (cart.length && !confirm('Futa vitu vyote kwenye oda?')) return;
    cart = [];
    saveCart();
    updateCartUI();
  }

  let cartEventsBound = false;

  function bindCartEvents() {
    if (cartEventsBound) return;
    cartEventsBound = true;

    document.addEventListener('click', e => {
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

      const removeBtn = e.target.closest('[data-remove-id]');
      if (removeBtn) {
        removeFromCart(removeBtn.dataset.removeId);
      }
    });

    document.getElementById('openOrderPanel')?.addEventListener('click', openOrderPanel);
    document.getElementById('cartBarTap')?.addEventListener('click', openOrderPanel);
    document.getElementById('orderPanelClose')?.addEventListener('click', closeOrderPanel);
    document.getElementById('orderPanelBackdrop')?.addEventListener('click', closeOrderPanel);
    document.getElementById('mobileOpenOrder')?.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('mobileDrawer')?.classList.remove('open');
      openOrderPanel();
    });

    document.getElementById('cartSend')?.addEventListener('click', () => sendCart('whatsapp'));
    document.getElementById('cartSms')?.addEventListener('click', () => sendCart('sms'));
    document.getElementById('cartClear')?.addEventListener('click', clearCart);
    document.getElementById('orderSms')?.addEventListener('click', e => {
      e.preventDefault();
      openSms(getOrderMessage());
    });
    document.getElementById('heroSms')?.addEventListener('click', e => {
      e.preventDefault();
      openSms(buildSimpleOrderMessage());
    });
    document.getElementById('mobileSms')?.addEventListener('click', e => {
      e.preventDefault();
      openSms(getOrderMessage());
      document.getElementById('mobileDrawer')?.classList.remove('open');
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeOrderPanel();
    });

    document.getElementById('shareMenuBtn')?.addEventListener('click', shareMenu);
    document.getElementById('reorderBtn')?.addEventListener('click', reorderLast);
  }
  function sendCart(channel) {
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
    saveCheckout();
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(cart));
    saveOrderRecord(channel);
    document.getElementById('reorderBtn')?.removeAttribute('hidden');

    const msg = buildCartMessage();
    if (channel === 'sms') openSms(msg);
    else openWhatsApp(msg);
    showToast('Oda imetumwa — asante!');
  }

  function renderPopularPicks() {
    const grid = document.getElementById('popularGrid');
    if (!grid) return;
    grid.innerHTML = POPULAR.map(p => {
      const price = p.priceKey ? formatPrice(p.priceKey) : p.price;
      return `
      <article class="popular-card reveal">
        <span class="popular-tag">${esc(p.tag)}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}${p.detail ? ' · ' + esc(p.detail) : ''}</p>
        <div class="popular-price">TSH ${esc(price)}</div>
        <button type="button" class="btn btn-add btn-sm"
          data-item="${esc(p.name)}" data-detail="${esc(p.detail)}" data-price-val="${esc(price)}">+ Ongeza kwenye Oda</button>
      </article>
    `;
    }).join('');
  }

  function renderHalfKgQuickOrder() {
    const grid = document.getElementById('halfKgGrid');
    if (!grid) return;
    grid.innerHTML = HALF_KG_ITEMS.map(item => {
      const price = formatPrice(item.priceKey);
      return `
        <article class="halfkg-card reveal">
          <div class="halfkg-icon">${item.icon}</div>
          <div class="halfkg-body">
            <span class="halfkg-badge">0.5 KG</span>
            <h3>${esc(item.name)}</h3>
            <p>${esc(item.desc)}</p>
            <div class="halfkg-price">TSH ${esc(price)}</div>
          </div>
          <button type="button" class="btn btn-primary halfkg-add"
            data-item="${esc(item.name)}" data-detail="${SIZE_DETAIL}" data-price-val="${esc(price)}">
            + Oda 0.5 KG
          </button>
        </article>
      `;
    }).join('');
  }

  function renderKisiniaQuickOrder() {
    const root = document.getElementById('kisiniaRoot');
    if (!root) return;
    root.innerHTML = KISINIA_GROUPS.map(group => `
      <div class="kisinia-group reveal">
        <div class="kisinia-group-head">
          <h3>${esc(group.title)}</h3>
          <span>${esc(group.subtitle)}</span>
        </div>
        <div class="kisinia-grid">
          ${group.items.map(item => {
            const price = formatPrice(item.priceKey);
            return `
              <article class="kisinia-card reveal"
                data-item="${esc(item.name)}" data-detail="${esc(item.detail)}" data-price-key="${esc(item.priceKey)}">
                <div class="kisinia-card-top">
                  <span class="kisinia-icon">${item.icon}</span>
                  <span class="kisinia-tag">${esc(item.tag)}</span>
                </div>
                <h4>${esc(item.name)}${item.detail ? ` <small>· ${esc(item.detail)}</small>` : ''}</h4>
                <p>${esc(item.desc)}</p>
                <div class="kisinia-price">TSH ${esc(price)}</div>
                <span class="kisinia-cta">+ Oda sasa</span>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
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

  function reorderLast() {
    try {
      const last = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || '[]');
      if (!last.length) { showToast('Hakuna oda ya mwisho'); return; }
      cart = last.map(i => ({ ...i, id: i.id || cartId(i.name, i.detail) }));
      saveCart();
      updateCartUI();
      showToast('Oda ya mwisho imeongezwa!');
      openOrderPanel();
    } catch { showToast('Imeshindwa kupakia oda ya mwisho'); }
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
    ['custPhone', 'custAddress', 'custNotes'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', saveCheckout);
    });
    document.querySelectorAll('.pill-group').forEach(group => {
      group.addEventListener('click', e => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        saveCheckout();
        if (group.id === 'fulfillmentPills') toggleAddressField();
        if (group.id === 'paymentPills') toggleLipaPanel();
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

    document.querySelectorAll('.section, .card, .order-banner, .popular-card, .halfkg-card, .kisinia-card, .kisinia-group, .faq-section').forEach(el => {
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
            <a class="btn btn-primary btn-sm" href="${waLink('Habari Clever Kitimoto, naomba ' + x.name + (x.size ? ' (' + x.size + ')' : '') + ' — TSH ' + x.price)}">Order</a>
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

  document.addEventListener('DOMContentLoaded', () => {
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
    updateOpenStatus();
    initScrollTop();
  });

  window.addEventListener('storage', () => {
    applyPrices();
    renderCustomMenus();
    renderPopularPicks();
    renderHalfKgQuickOrder();
    renderKisiniaQuickOrder();
  });
})();
