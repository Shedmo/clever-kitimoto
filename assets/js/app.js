(function () {
  'use strict';

  const CK_KEY = 'cleverKitimotoMenuV1';
  const CUSTOM_KEY = 'cleverKitimotoCustomMenusV1';
  const WA = '255683497330';

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

  let cart = [];
  let activeFilter = 'all';

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

  function addToCart(name, detail, price) {
    const existing = cart.find(i => i.name === name && i.detail === detail);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, detail, price, qty: 1 });
    }
    updateCartBar();
    document.querySelectorAll('.btn-add').forEach(btn => {
      if (btn.dataset.item === name && btn.dataset.detail === detail) {
        btn.classList.add('added');
        btn.textContent = '✓ Added';
        setTimeout(() => {
          btn.classList.remove('added');
          btn.textContent = '+ Add';
        }, 1400);
      }
    });
  }

  function updateCartBar() {
    const bar = document.getElementById('cartBar');
    const count = document.getElementById('cartCount');
    const preview = document.getElementById('cartPreview');
    const totalEl = document.getElementById('cartTotal');
    const itemCount = cart.reduce((s, i) => s + i.qty, 0);
    const moneyTotal = getCartTotal();
    const pricedCount = cart.filter(i => parsePrice(i.price) > 0).reduce((s, i) => s + i.qty, 0);

    if (!itemCount) {
      bar.classList.remove('visible');
      return;
    }

    bar.classList.add('visible');
    count.textContent = itemCount + (itemCount === 1 ? ' item' : ' items');
    preview.textContent = cart.map(i => {
      const sub = lineTotal(i);
      let line = i.qty + '× ' + i.name + (i.detail ? ' (' + i.detail + ')' : '');
      if (sub > 0) line += ' — TSH ' + formatMoney(sub);
      return line;
    }).join(', ');

    if (totalEl) {
      if (moneyTotal > 0) {
        const note = pricedCount < itemCount ? ' (+ baadhi bila bei)' : '';
        totalEl.textContent = 'JUMLA: TSH ' + formatMoney(moneyTotal) + note;
      } else {
        totalEl.textContent = 'JUMLA: —';
      }
    }
  }

  function sendCart() {
    if (!cart.length) return;
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
      lines.push('', '💰 JUMLA: TSH ' + formatMoney(moneyTotal));
    }
    lines.push('', 'Asante!');
    window.open(waLink(lines.join('\n')), '_blank');
  }

  function clearCart() {
    cart = [];
    updateCartBar();
  }

  function bindCartButtons() {
    document.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => {
        addToCart(btn.dataset.item, btn.dataset.detail || '', btn.dataset.priceVal || '');
      });
    });
    document.getElementById('cartSend')?.addEventListener('click', sendCart);
    document.getElementById('cartClear')?.addEventListener('click', clearCart);
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

    bindCartButtons();
    grid.querySelectorAll('.card').forEach(c => {
      c.classList.add('reveal');
      new IntersectionObserver(([e]) => { if (e.isIntersecting) e.target.classList.add('visible'); }, { threshold: 0.08 }).observe(c);
    });
  }

  window.CK = { getPrices, formatPrice, applyPrices, waLink };

  document.addEventListener('DOMContentLoaded', () => {
    applyPrices();
    bindCartButtons();
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
