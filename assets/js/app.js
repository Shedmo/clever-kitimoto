(function () {
  'use strict';

  const CK_KEY = 'cleverKitimotoMenuV1';
  const CUSTOM_KEY = 'cleverKitimotoCustomMenusV1';
  const WA = '255683497330';
  const SMS_PHONE = '255683497330';
  const CART_KEY = 'cleverKitimotoCartV1';
  const DELIVERY_NOTE = 'Bei ya delivery ni kwa mteja';

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
        const size = cell.querySelector('b')?.textContent?.trim() || '';
        const price = cell.querySelector('[data-price]')?.textContent?.trim() || '';
        cell.classList.add('price-add');
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
        cell.dataset.item = name;
        cell.dataset.detail = size;
        cell.dataset.priceVal = price;
      });

      const hint = document.createElement('p');
      hint.className = 'size-hint';
      hint.textContent = '👆 Bonyeza ukubwa kuongeza kwenye oda';
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
  }

  function waLink(text) {
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
  }

  function smsLink(text, phone) {
    return 'sms:' + (phone || SMS_PHONE) + '?body=' + encodeURIComponent(text);
  }

  function buildCartMessage() {
    const lines = ['Habari Clever Kitimoto, naomba kuagiza:', ''];
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
          <p>Chagua menu kutoka orodha. Kwa vitu vya ukubwa tofauti (Choma, Rosti…), bonyeza ukubwa unaotaka.</p>
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
      const addEl = e.target.closest('.btn-add, .price-add');
      if (addEl) {
        e.preventDefault();
        addToCart(
          addEl.dataset.item,
          addEl.dataset.detail || '',
          addEl.dataset.priceVal || '',
          addEl
        );
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
  }
  function sendCart(channel) {
    if (!cart.length) {
      showToast('Oda haina kitu — ongeza menu kwanza');
      openOrderPanel();
      return;
    }
    const msg = buildCartMessage();
    if (channel === 'sms') openSms(msg);
    else openWhatsApp(msg);
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

    document.querySelectorAll('.section, .card, .order-banner').forEach(el => {
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
    applyPrices();
    bindCartEvents();
    initSizePickers();
    updateCartUI();
    bindSearch();
    bindNav();
    bindReveal();
    bindPhoneCopy();
    renderCustomMenus();
  });

  window.addEventListener('storage', () => {
    applyPrices();
    renderCustomMenus();
  });
})();
