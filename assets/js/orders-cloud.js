(function () {
  'use strict';

  const CONFIG_KEY = 'cleverKitimotoCloudConfigV1';
  const TABLE = 'orders';
  let client = null;
  let unsubscribe = null;
  let connected = false;

  function fileConfig() {
    return window.CLEVER_KITIMOTO_CLOUD || {};
  }

  function storedConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
      return saved && typeof saved === 'object' ? saved : null;
    } catch {
      return null;
    }
  }

  function config() {
    const stored = storedConfig();
    if (stored?.enabled && stored?.supabaseUrl && stored?.supabaseAnonKey) return stored;
    const file = fileConfig();
    if (file?.enabled && file?.supabaseUrl && file?.supabaseAnonKey) return file;
    return file;
  }

  function saveConfig(cfg) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    window.CLEVER_KITIMOTO_CLOUD = cfg;
    resetCloud();
  }

  function getConfigForExport() {
    return config();
  }

  function isEnabled() {
    const c = config();
    return !!(c.enabled && c.supabaseUrl && c.supabaseAnonKey);
  }

  function resetCloud() {
    stopSync();
    client = null;
    connected = false;
  }

  function getSupabaseLib() {
    return window.supabase?.createClient ? window.supabase : null;
  }

  function init() {
    if (!isEnabled()) return false;
    const lib = getSupabaseLib();
    if (!lib) {
      console.warn('CleverOrdersCloud: Supabase SDK not loaded');
      return false;
    }
    const c = config();
    if (!client) {
      client = lib.createClient(c.supabaseUrl, c.supabaseAnonKey);
    }
    return !!client;
  }

  function isConnected() {
    return connected && !!client;
  }

  function toRow(order) {
    return {
      id: order.id,
      at: order.at || new Date().toISOString(),
      channel: order.channel || '',
      phone: order.phone || '',
      address: order.address || '',
      notes: order.notes || '',
      fulfillment: order.fulfillment || '',
      payment: order.payment || '',
      subtotal: Number(order.subtotal) || 0,
      items: order.items || [],
      status: order.status || 'pending',
      status_at: order.statusAt || null,
      status_by: order.statusBy || null
    };
  }

  function fromRow(row) {
    return {
      id: row.id,
      at: row.at,
      channel: row.channel,
      phone: row.phone,
      address: row.address,
      notes: row.notes,
      fulfillment: row.fulfillment,
      payment: row.payment,
      subtotal: Number(row.subtotal) || 0,
      items: row.items || [],
      status: row.status || 'pending',
      statusAt: row.status_at,
      statusBy: row.status_by
    };
  }

  async function fetchOrders() {
    if (!init()) throw new Error('Cloud not ready');
    const { data, error } = await client
      .from(TABLE)
      .select('*')
      .neq('status', 'test')
      .order('at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data || []).map(fromRow);
  }

  async function saveOrder(order) {
    if (!init()) throw new Error('Cloud not configured');
    const { error } = await client.from(TABLE).upsert(toRow(order));
    if (error) throw error;
  }

  async function updateOrder(orderId, patch) {
    if (!init()) throw new Error('Cloud not ready');
    const row = {};
    if (patch.status != null) row.status = patch.status;
    if (patch.statusAt != null) row.status_at = patch.statusAt;
    if (patch.statusBy != null) row.status_by = patch.statusBy;
    const { error } = await client.from(TABLE).update(row).eq('id', orderId);
    if (error) throw error;
  }

  async function testConnection() {
    if (!init()) throw new Error('Supabase haijasanidi vizuri');
    const testId = 'test-' + Date.now();
    const { error: insErr } = await client.from(TABLE).insert({
      id: testId,
      at: new Date().toISOString(),
      channel: 'test',
      subtotal: 0,
      items: [],
      status: 'test'
    });
    if (insErr) {
      if (insErr.code === 'PGRST205' || /could not find the table/i.test(insErr.message || '')) {
        throw new Error('Jedwali orders halipo — run supabase/schema.sql kwenye Supabase SQL Editor');
      }
      throw insErr;
    }
    await client.from(TABLE).delete().eq('id', testId);
    connected = true;
    return true;
  }

  function subscribeOrders(callback) {
    if (!init()) return () => {};
    if (unsubscribe) unsubscribe();

    fetchOrders()
      .then(orders => {
        connected = true;
        callback(orders);
      })
      .catch(err => {
        console.error('Orders fetch error', err);
        connected = false;
      });

    const channel = client
      .channel('clever-kitimoto-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
        fetchOrders()
          .then(orders => callback(orders))
          .catch(err => console.error('Orders sync error', err));
      })
      .subscribe(status => {
        connected = status === 'SUBSCRIBED';
      });

    unsubscribe = () => {
      client.removeChannel(channel);
      unsubscribe = null;
    };
    return unsubscribe;
  }

  function stopSync() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  window.CleverOrdersCloud = {
    CONFIG_KEY,
    config,
    saveConfig,
    getConfigForExport,
    isEnabled,
    isConnected,
    init,
    saveOrder,
    updateOrder,
    testConnection,
    subscribeOrders,
    stopSync,
    resetCloud
  };
})();
