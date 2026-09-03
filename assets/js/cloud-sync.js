(function () {
  'use strict';

  const TABLE = 'app_storage';
  const PREFIX = 'cleverKitimoto';
  const SKIP_KEYS = new Set([
    'cleverKitimotoCloudConfigV1',
    'cleverKitimotoCurrentBranchV1'
  ]);

  let client = null;
  let unsub = null;
  let connected = false;
  let syncing = false;
  const pushTimers = {};
  const PUSH_MS = 400;

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
    if (!client) client = lib.createClient(c.supabaseUrl, c.supabaseAnonKey);
    return !!client;
  }

  function parseValue(raw) {
    if (raw == null || raw === '') return null;
    try { return JSON.parse(raw); } catch { return raw; }
  }

  function schedulePush(key, rawValue) {
    if (syncing || !shouldSyncKey(key)) return;
    if (pushTimers[key]) clearTimeout(pushTimers[key]);
    pushTimers[key] = setTimeout(() => {
      delete pushTimers[key];
      pushKey(key, parseValue(rawValue)).catch(err => {
        console.warn('Cloud sync push failed:', key, err);
      });
    }, PUSH_MS);
  }

  function installLocalStorageHook() {
    if (localStorage.__cleverCloudHook) return;
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      orig.call(this, key, value);
      if (this === localStorage) schedulePush(key, value);
    };
    localStorage.__cleverCloudHook = true;
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
    return true;
  }

  async function pushAllLocal() {
    if (!initClient()) return 0;
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!shouldSyncKey(key)) continue;
      await pushKey(key, parseValue(localStorage.getItem(key)));
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

  async function syncBootstrap() {
    if (!initClient()) return { pulled: 0, uploaded: 0 };
    const rows = await fetchAll();
    const cloudKeys = new Set();
    syncing = true;
    try {
      rows.forEach(row => {
        if (!row?.storage_key || !shouldSyncKey(row.storage_key)) return;
        cloudKeys.add(row.storage_key);
        localStorage.setItem(row.storage_key, JSON.stringify(row.data));
      });
    } finally {
      syncing = false;
    }
    let uploaded = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!shouldSyncKey(key) || cloudKeys.has(key)) continue;
      await pushKey(key, parseValue(localStorage.getItem(key)));
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
          rows.forEach(row => {
            if (!row?.storage_key || !shouldSyncKey(row.storage_key)) return;
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
    Object.keys(pushTimers).forEach(k => clearTimeout(pushTimers[k]));
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
    pushAllLocal,
    syncBootstrap,
    testConnection,
    onRemoteChange,
    stopSync
  };
})();
