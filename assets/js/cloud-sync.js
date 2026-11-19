(function () {
  'use strict';

  const TABLE = 'app_storage';
  const PREFIX = 'cleverKitimoto';
  const SKIP_KEYS = new Set([
    'cleverKitimotoCloudConfigV1',
    'cleverKitimotoCurrentBranchV1',
    PREFIX + 'CloudPendingKeysV1'
  ]);
  const PENDING_KEY = PREFIX + 'CloudPendingKeysV1';

  let client = null;
  let clientConfig = '';
  let unsub = null;
  let connected = false;
  let syncing = false;
  const PUSH_MS = 400;
  const MAX_RETRY_MS = 60000;
  let retryTimer = null;
  let retryDelay = 1000;
  let lastError = '';
  const originalSetItem = Storage.prototype.setItem;

  function pendingKeys() {
    try { return new Set(JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')); }
    catch { return new Set(); }
  }

  function storePending(keys) {
    originalSetItem.call(localStorage, PENDING_KEY, JSON.stringify(Array.from(keys)));
    announceSyncState();
  }

  function clearPendingIfUnchanged(key, raw) {
    if (localStorage.getItem(key) !== raw) return false;
    const pending = pendingKeys();
    if (!pending.delete(key)) return true;
    storePending(pending);
    return true;
  }

  function announceSyncState() {
    const detail = { pending: pendingKeys().size, error: lastError };
    document.dispatchEvent(new CustomEvent('clever-cloud-storage-sync', { detail }));
  }

  function config() {
    return window.CleverOrdersCloud?.config?.() || window.CLEVER_KITIMOTO_CLOUD || {};
  }

  function isEnabled() {
    const c = config();
    return !!(c.enabled && c.supabaseUrl && c.supabaseAnonKey);
  }

  function shouldSyncKey(key) {
    return typeof key === 'string' && key.startsWith(PREFIX) && !SKIP_KEYS.has(key);
  }

  function initClient() {
    if (!isEnabled()) return false;
    const lib = window.supabase?.createClient ? window.supabase : null;
    if (!lib) return false;
    const c = config();
    const identity = c.supabaseUrl + '|' + c.supabaseAnonKey;
    if (!client || clientConfig !== identity) {
      if (client && unsub) { unsub(); unsub = null; }
      client = lib.createClient(c.supabaseUrl, c.supabaseAnonKey);
      clientConfig = identity;
      connected = false;
    }
    return !!client;
  }

  function parseValue(raw) {
    if (raw == null || raw === '') return null;
    try { return JSON.parse(raw); } catch { return raw; }
  }

  function cacheLocal(key, value) {
    syncing = true;
    try { originalSetItem.call(localStorage, key, typeof value === 'string' ? value : JSON.stringify(value)); }
    finally { syncing = false; }
    const pending = pendingKeys();
    if (pending.delete(key)) storePending(pending);
  }

  function schedulePush(key, rawValue) {
    if (syncing || !shouldSyncKey(key)) return;
    const pending = pendingKeys();
    pending.add(key);
    storePending(pending);
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => flushPending().catch(() => {}), PUSH_MS);
  }

  function installLocalStorageHook() {
    if (localStorage.__cleverCloudHook) return;
    Storage.prototype.setItem = function (key, value) {
      originalSetItem.call(this, key, value);
      if (this === localStorage) schedulePush(key, value);
    };
    localStorage.__cleverCloudHook = true;
    window.addEventListener('online', () => {
      retryDelay = 1000;
      flushPending().catch(() => {});
    });
  }

  async function pushKey(key, data) {
    if (!initClient() || !shouldSyncKey(key)) return false;
    const payload = {
      storage_key: key,
      data: data == null ? null : data,
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from(TABLE).upsert(payload);
    if (error) throw storageError(error);
    connected = true;
    lastError = '';
    return true;
  }

  async function flushPending() {
    if (!isEnabled()) return 0;
    const pending = pendingKeys();
    let sent = 0;
    try {
      for (const key of pending) {
        const raw = localStorage.getItem(key);
        if (raw == null) { pending.delete(key); continue; }
        await pushKey(key, parseValue(raw));
        clearPendingIfUnchanged(key, raw);
        sent += 1;
      }
      storePending(pendingKeys());
      retryDelay = 1000;
      lastError = '';
      announceSyncState();
      return sent;
    } catch (err) {
      lastError = err?.message || String(err);
      console.warn('Cloud storage sync is pending:', lastError);
      announceSyncState();
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => flushPending().catch(() => {}), retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
      throw err;
    }
  }

  async function pushAllLocal() {
    if (!initClient()) return 0;
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!shouldSyncKey(key)) continue;
      const raw = localStorage.getItem(key);
      await pushKey(key, parseValue(raw));
      clearPendingIfUnchanged(key, raw);
      count += 1;
    }
    return count;
  }

  async function fetchAll() {
    if (!initClient()) throw new Error('Cloud not ready');
    const { data, error } = await client
      .from(TABLE)
      .select('storage_key, data, updated_at')
      .like('storage_key', PREFIX + '%')
      .limit(500);
    if (error) throw storageError(error);
    return data || [];
  }

  async function pullFromCloud() {
    if (!initClient()) return { changed: 0 };
    const rows = await fetchAll();
    const dirtyKeys = pendingKeys();
    let changed = 0;
    syncing = true;
    try {
      rows.forEach(row => {
        if (!row?.storage_key || !shouldSyncKey(row.storage_key)) return;
        if (dirtyKeys.has(row.storage_key)) return;
        const raw = JSON.stringify(row.data);
        if (localStorage.getItem(row.storage_key) !== raw) {
          localStorage.setItem(row.storage_key, raw);
          changed += 1;
        }
      });
    } finally {
      syncing = false;
    }
    if (changed) connected = true;
    return { changed, total: rows.length };
  }

  async function syncBootstrap() {
    if (!initClient()) return { pulled: 0, uploaded: 0 };
    const rows = await fetchAll();
    const cloudKeys = new Set();
    const dirtyKeys = pendingKeys();
    syncing = true;
    try {
      rows.forEach(row => {
        if (!row?.storage_key || !shouldSyncKey(row.storage_key)) return;
        cloudKeys.add(row.storage_key);
        if (dirtyKeys.has(row.storage_key)) return;
        localStorage.setItem(row.storage_key, JSON.stringify(row.data));
      });
    } finally {
      syncing = false;
    }
    let uploaded = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!shouldSyncKey(key) || (cloudKeys.has(key) && !dirtyKeys.has(key))) continue;
      const raw = localStorage.getItem(key);
      await pushKey(key, parseValue(raw));
      clearPendingIfUnchanged(key, raw);
      uploaded += 1;
    }
    connected = true;
    return { pulled: rows.length, uploaded };
  }

  function storageError(error) {
    if (error?.code === 'PGRST205' || /could not find the table/i.test(error?.message || '')) {
      return new Error('Jedwali app_storage halipo — run supabase/cloud-storage-migration.sql');
    }
    return error;
  }

  async function testConnection() {
    if (!initClient()) throw new Error('Supabase haijasanidi vizuri');
    const testKey = PREFIX + 'CloudTestV1';
    const { error } = await client.from(TABLE).upsert({
      storage_key: testKey,
      data: { ok: true, at: new Date().toISOString() },
      updated_at: new Date().toISOString()
    });
    if (error) throw storageError(error);
    await client.from(TABLE).delete().eq('storage_key', testKey);
    connected = true;
    return true;
  }

  function onRemoteChange(callback) {
    if (!initClient()) return () => {};
    if (unsub) unsub();

    const channel = client
      .channel('clever-kitimoto-storage')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, async () => {
        try {
          syncing = true;
          const rows = await fetchAll();
          const dirtyKeys = pendingKeys();
          rows.forEach(row => {
            if (!row?.storage_key || !shouldSyncKey(row.storage_key)) return;
            if (dirtyKeys.has(row.storage_key)) return;
            localStorage.setItem(row.storage_key, JSON.stringify(row.data));
          });
          syncing = false;
          callback({ merged: rows.length });
        } catch (err) {
          syncing = false;
          console.error('Cloud storage sync error', err);
        }
      })
      .subscribe(status => {
        connected = status === 'SUBSCRIBED';
      });

    unsub = () => {
      client.removeChannel(channel);
      unsub = null;
    };
    return unsub;
  }

  function stopSync() {
    if (unsub) {
      unsub();
      unsub = null;
    }
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
  }

  function isConnected() {
    return connected && !!client;
  }

  installLocalStorageHook();

  window.CleverCloudSync = {
    isEnabled,
    isConnected,
    shouldSyncKey,
    pushKey,
    cacheLocal,
    pushAllLocal,
    flushPending,
    getSyncState: () => ({ pending: pendingKeys().size, error: lastError }),
    pullFromCloud,
    syncBootstrap,
    testConnection,
    onRemoteChange,
    stopSync
  };
})();
