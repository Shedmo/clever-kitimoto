(function () {
  'use strict';

  const POLL_MS = 30000;
  const SYNC_META_KEY = 'cleverKitimotoSmartSyncMetaV1';

  let pollId = null;
  let lastSyncAt = 0;
  let lastOrderSnapshot = '';
  let running = false;
  let paused = false;

  function isCloudOn() {
    return window.CleverOrdersCloud?.isEnabled?.() || window.CleverCloudSync?.isEnabled?.();
  }

  function loadMeta() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_META_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function saveMeta(patch) {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify({ ...loadMeta(), ...patch }));
  }

  function formatAgo(ms) {
    if (!ms) return '—';
    const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (sec < 8) return 'sasa hivi';
    if (sec < 60) return sec + 's';
    return Math.floor(sec / 60) + 'm';
  }

  function dispatch(detail) {
    document.dispatchEvent(new CustomEvent('clever-smart-sync', { detail }));
  }

  async function tick(opts = {}) {
    if (paused || running) return null;
    if (!isCloudOn()) return null;
    running = true;
    const detail = {
      at: Date.now(),
      storageChanged: 0,
      orders: null,
      newOrders: [],
      pendingOrders: 0,
      silent: !!opts.silent
    };

    try {
      if (window.CleverCloudSync?.isEnabled()) {
        const pull = await window.CleverCloudSync.pullFromCloud();
        detail.storageChanged = pull?.changed || 0;
      }
    } catch (err) {
      detail.storageError = err.message || String(err);
    }

    try {
      if (window.CleverOrdersCloud?.isEnabled()) {
        const orders = await window.CleverOrdersCloud.fetchOrders();
        detail.orders = orders;
        detail.pendingOrders = orders.filter(o => (o.status || 'pending') === 'pending').length;
        const snap = orders.map(o => o.id + ':' + (o.status || 'pending')).join('|');
        if (lastOrderSnapshot && snap !== lastOrderSnapshot) {
          const prevIds = new Set(lastOrderSnapshot.split('|').map(x => x.split(':')[0]).filter(Boolean));
          detail.newOrders = orders.filter(o => !prevIds.has(o.id) && (o.status || 'pending') === 'pending');
        }
        lastOrderSnapshot = snap;
      }
    } catch (err) {
      detail.ordersError = err.message || String(err);
    }

    lastSyncAt = detail.at;
    saveMeta({ lastSyncAt: detail.at });
    running = false;
    dispatch(detail);
    return detail;
  }

  function start(opts = {}) {
    stop();
    if (!isCloudOn()) return;
    const interval = opts.intervalMs || loadMeta().pollMs || POLL_MS;
    saveMeta({ autoRefresh: true, pollMs: interval });
    tick({ silent: true });
    pollId = setInterval(() => tick({ silent: true }), interval);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
  }

  function stop() {
    if (pollId) {
      clearInterval(pollId);
      pollId = null;
    }
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('online', onOnline);
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') tick({ silent: false });
  }

  function onOnline() {
    tick({ silent: false });
  }

  function pause() { paused = true; }
  function resume() { paused = false; }

  function getLastSyncAt() {
    return lastSyncAt || loadMeta().lastSyncAt || 0;
  }

  window.CleverSmartSync = {
    POLL_MS,
    start,
    stop,
    pause,
    resume,
    tick,
    getLastSyncAt,
    formatAgo,
    isRunning: () => !!pollId
  };
})();
