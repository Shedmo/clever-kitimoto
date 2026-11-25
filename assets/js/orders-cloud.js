(function () {
  'use strict';

  const CONFIG_KEY = 'cleverKitimotoCloudConfigV1';
  const TABLE = 'orders';
  const SALES_TABLE = 'sales';
  const ORDER_OUTBOX_KEY = 'cleverKitimotoPendingOrdersV1';
  let client = null;
  let unsubscribe = null;
  let salesUnsubscribe = null;
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
    stopSalesSync();
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
      service_fee: Number(order.serviceFee) || 0,
      total: Number(order.total) || Number(order.subtotal) || 0,
      items: order.items || [],
      status: order.status || 'pending',
      payment_status: order.paymentStatus || 'unpaid',
      payment_reference: order.paymentReference || null,
      payment_checkout_url: order.paymentCheckoutUrl || null,
      payment_session_created_at: order.paymentSessionCreatedAt || null,
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
      serviceFee: Number(row.service_fee) || 0,
      total: Number(row.total) || Number(row.subtotal) || 0,
      items: row.items || [],
      status: row.status || 'pending',
      paymentStatus: row.payment_status || 'unpaid',
      paymentReference: row.payment_reference || '',
      paymentCheckoutUrl: row.payment_checkout_url || '',
      paymentSessionCreatedAt: row.payment_session_created_at || '',
      statusAt: row.status_at,
      statusBy: row.status_by
    };
  }

  // Keep a durable browser copy until Supabase confirms the write. This means
  // a brief network outage never silently drops an order.
  function readOrderOutbox() {
    try {
      const rows = JSON.parse(localStorage.getItem(ORDER_OUTBOX_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  }

  function writeOrderOutbox(rows) {
    localStorage.setItem(ORDER_OUTBOX_KEY, JSON.stringify(rows));
  }

  async function flushOrderOutbox() {
    if (!isEnabled() || !navigator.onLine) return { saved: 0, pending: readOrderOutbox().length };
    const queued = readOrderOutbox();
    let saved = 0;
    for (const order of queued) {
      try {
        if (!init()) break;
        const { error } = await client.from(TABLE).upsert(toRow(order));
        if (error) throw error;
        const current = readOrderOutbox().filter(item => item.id !== order.id);
        writeOrderOutbox(current);
        saved += 1;
      } catch (error) {
        console.warn('Order is safely queued until connection returns:', error);
        break;
      }
    }
    return { saved, pending: readOrderOutbox().length };
  }

  window.addEventListener('online', () => { flushOrderOutbox().catch(() => {}); });
  window.addEventListener('DOMContentLoaded', () => { flushOrderOutbox().catch(() => {}); }, { once: true });

  async function fetchOrders() {
    if (!init()) throw new Error('Cloud not ready');
    const { data, error } = await client
      .from(TABLE)
      .select('*')
      .neq('status', 'test')
      .neq('channel', 'pos')
      .order('at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data || []).map(fromRow);
  }

  async function saveOrder(order) {
    const queued = readOrderOutbox();
    if (!queued.some(item => item.id === order.id)) queued.push(order);
    writeOrderOutbox(queued);
    if (!isEnabled() || !navigator.onLine) {
      const error = new Error('Oda imehifadhiwa kwenye kifaa na itasawazishwa mtandao ukirudi.');
      error.queued = true;
      throw error;
    }
    try {
      if (!init()) throw new Error('Supabase haijaunganishwa');
      const { error } = await client.from(TABLE).upsert(toRow(order));
      if (error) throw error;
      writeOrderOutbox(readOrderOutbox().filter(item => item.id !== order.id));
    } catch (cause) {
      const error = new Error('Oda ipo salama kwenye kifaa na itajaribu kuhifadhiwa mtandaoni tena.');
      error.cause = cause;
      error.queued = true;
      throw error;
    }
  }

  async function createSnippeCheckout(orderId) {
    if (!init()) throw new Error('Unganisha Supabase kabla ya kutumia malipo ya Snippe.');
    const { data, error } = await client.functions.invoke('snippe-checkout', {
      body: { action: 'create', orderId }
    });
    if (error) throw error;
    if (!data?.checkoutUrl) throw new Error(data?.error || 'Kiungo cha malipo hakikupatikana.');
    return data;
  }

  async function checkSnippeAvailability() {
    if (!init()) return false;
    const { data, error } = await client.functions.invoke('snippe-checkout', {
      body: { action: 'status' }
    });
    if (error) return false;
    return data?.ready === true;
  }

  async function getOrderPaymentStatus(orderId) {
    if (!init()) throw new Error('Cloud not ready');
    const { data, error } = await client.from(TABLE)
      .select('payment_status,payment_reference')
      .eq('id', orderId)
      .maybeSingle();
    if (error) throw error;
    return data ? { status: data.payment_status || 'pending', reference: data.payment_reference || '' } : null;
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

  function isTableMissing(error) {
    return error?.code === 'PGRST205' || /could not find the table/i.test(error?.message || '');
  }

  function saleToPosOrder(sale) {
    const noteParts = [];
    if (sale.seller) noteParts.push('Muuzaji: ' + sale.seller);
    if (sale.branchId) noteParts.push('BranchId: ' + sale.branchId);
    if (sale.notes) noteParts.push(sale.notes);
    if (sale.receiptId) noteParts.push('Risiti: ' + sale.receiptId);
    if (sale.stockAfter != null) noteParts.push('Stock: ' + sale.stockAfter);
    return {
      id: sale.id,
      at: sale.at || new Date().toISOString(),
      channel: 'pos',
      phone: sale.phone || '',
      address: sale.branchName || '',
      notes: noteParts.join(' · '),
      fulfillment: 'pickup',
      payment: sale.payment || 'cash',
      subtotal: Number(sale.total) || 0,
      items: [{
        name: sale.itemName || '',
        qty: sale.qty,
        unit: sale.unit || '',
        price: sale.unitPrice,
        category: sale.category || '',
        itemId: sale.itemId || ''
      }],
      status: 'delivered',
      statusAt: sale.at || new Date().toISOString(),
      statusBy: sale.seller || 'pos'
    };
  }

  function posOrderToSale(order) {
    const item = (order.items || [])[0] || {};
    let branchId = '';
    const notes = order.notes || '';
    const branchMatch = notes.match(/BranchId:\s*([^\s·]+)/);
    if (branchMatch) branchId = branchMatch[1];
    let receiptId = '';
    const rcptMatch = notes.match(/Risiti:\s*([^\s·]+)/);
    if (rcptMatch) receiptId = rcptMatch[1];
    return {
      id: order.id,
      receiptId: receiptId || order.id,
      at: order.at,
      itemId: item.itemId || '',
      itemName: item.name || '—',
      category: item.category || '',
      qty: Number(item.qty) || 0,
      unit: item.unit || '',
      unitPrice: Number(item.price) || 0,
      total: Number(order.subtotal) || 0,
      payment: order.payment,
      phone: order.phone,
      notes: notes,
      seller: order.statusBy || '',
      branchId,
      branchName: order.address || ''
    };
  }

  async function fetchPosOrdersAsSales(branchId) {
    const { data, error } = await client
      .from(TABLE)
      .select('*')
      .eq('channel', 'pos')
      .neq('status', 'test')
      .order('at', { ascending: false })
      .limit(500);
    if (error) throw error;
    let sales = (data || []).map(row => posOrderToSale(fromRow(row)));
    if (branchId) {
      sales = sales.filter(s => s.branchId === branchId || (!s.branchId && branchId));
    }
    return sales;
  }

  function toSaleRow(sale) {
    return {
      id: sale.id,
      receipt_id: sale.receiptId || null,
      at: sale.at || new Date().toISOString(),
      item_id: sale.itemId || '',
      item_name: sale.itemName || '',
      category: sale.category || '',
      qty: Number(sale.qty) || 0,
      unit: sale.unit || '',
      unit_price: Number(sale.unitPrice) || 0,
      total: Number(sale.total) || 0,
      payment: sale.payment || '',
      phone: sale.phone || '',
      notes: sale.notes || '',
      seller: sale.seller || '',
      branch_id: sale.branchId || '',
      branch_name: sale.branchName || '',
      stock_after: sale.stockAfter != null ? Number(sale.stockAfter) : null
    };
  }

  function fromSaleRow(row) {
    return {
      id: row.id,
      receiptId: row.receipt_id,
      at: row.at,
      itemId: row.item_id,
      itemName: row.item_name,
      category: row.category,
      qty: Number(row.qty) || 0,
      unit: row.unit,
      unitPrice: Number(row.unit_price) || 0,
      total: Number(row.total) || 0,
      payment: row.payment,
      phone: row.phone,
      notes: row.notes,
      seller: row.seller,
      branchId: row.branch_id,
      branchName: row.branch_name,
      stockAfter: row.stock_after
    };
  }

  async function fetchSales(branchId) {
    if (!init()) throw new Error('Cloud not ready');
    let query = client
      .from(SALES_TABLE)
      .select('*')
      .order('at', { ascending: false })
      .limit(500);
    if (branchId) query = query.eq('branch_id', branchId);
    const { data, error } = await query;
    if (!error) return (data || []).map(fromSaleRow);
    if (isTableMissing(error)) return fetchPosOrdersAsSales(branchId);
    throw error;
  }

  async function saveSaleViaOrders(sale) {
    const { error } = await client.from(TABLE).upsert(toRow(saleToPosOrder(sale)));
    if (error) throw error;
    return 'orders';
  }

  async function saveSale(sale) {
    if (!init()) throw new Error('Cloud not configured');
    const { error } = await client.from(SALES_TABLE).upsert(toSaleRow(sale));
    if (!error) return 'sales';
    if (isTableMissing(error)) return saveSaleViaOrders(sale);
    throw saleSaveError(error);
  }

  async function saveSales(sales) {
    if (!init()) throw new Error('Cloud not configured');
    const rows = (sales || []).map(toSaleRow);
    if (!rows.length) return 'sales';
    const { error } = await client.from(SALES_TABLE).upsert(rows);
    if (!error) return 'sales';
    if (isTableMissing(error)) {
      for (const sale of sales) await saveSaleViaOrders(sale);
      return 'orders';
    }
    throw saleSaveError(error);
  }

  async function deleteSale(saleId) {
    if (!init()) throw new Error('Cloud not configured');
    if (!saleId) return;
    const { error } = await client.from(SALES_TABLE).delete().eq('id', saleId);
    if (!error) return 'sales';
    if (isTableMissing(error)) {
      const { error: orderErr } = await client.from(TABLE).delete().eq('id', saleId);
      if (orderErr) throw orderErr;
      return 'orders';
    }
    throw error;
  }

  async function deleteSales(saleIds) {
    const ids = (saleIds || []).filter(Boolean);
    if (!ids.length) return;
    for (const id of ids) {
      await deleteSale(id);
    }
  }

  function saleSaveError(error) {
    if (isTableMissing(error)) {
      return new Error('Jedwali sales halipo — run supabase/sales-migration.sql kwenye Supabase SQL Editor');
    }
    return error;
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
      if (isTableMissing(insErr)) {
        throw new Error('Jedwali orders halipo — run supabase/schema.sql kwenye Supabase SQL Editor');
      }
      throw insErr;
    }
    await client.from(TABLE).delete().eq('id', testId);

    let salesTableOk = true;
    const saleTestId = 'test-sale-' + Date.now();
    const { error: saleErr } = await client.from(SALES_TABLE).insert({
      id: saleTestId,
      at: new Date().toISOString(),
      item_name: 'test',
      total: 0,
      branch_id: 'test'
    });
    if (saleErr) {
      if (isTableMissing(saleErr)) {
        salesTableOk = false;
      } else {
        throw saleErr;
      }
    } else {
      await client.from(SALES_TABLE).delete().eq('id', saleTestId);
    }

    connected = true;
    return { ok: true, salesTable: salesTableOk };
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

  function subscribeSales(branchId, callback) {
    if (!init()) return () => {};
    if (salesUnsubscribe) salesUnsubscribe();

    fetchSales(branchId)
      .then(sales => {
        connected = true;
        callback(sales);
      })
      .catch(err => {
        console.error('Sales fetch error', err);
        connected = false;
      });

    const channel = client
      .channel('clever-kitimoto-sales-' + (branchId || 'all'))
      .on('postgres_changes', { event: '*', schema: 'public', table: SALES_TABLE }, () => {
        fetchSales(branchId)
          .then(sales => callback(sales))
          .catch(err => console.error('Sales sync error', err));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
        fetchSales(branchId)
          .then(sales => callback(sales))
          .catch(err => console.error('Sales sync error', err));
      })
      .subscribe(status => {
        connected = status === 'SUBSCRIBED';
      });

    salesUnsubscribe = () => {
      client.removeChannel(channel);
      salesUnsubscribe = null;
    };
    return salesUnsubscribe;
  }

  function stopSalesSync() {
    if (salesUnsubscribe) {
      salesUnsubscribe();
      salesUnsubscribe = null;
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
    createSnippeCheckout,
    checkSnippeAvailability,
    getOrderPaymentStatus,
    flushOrderOutbox,
    updateOrder,
    saveSale,
    saveSales,
    deleteSale,
    deleteSales,
    fetchSales,
    testConnection,
    subscribeOrders,
    subscribeSales,
    stopSync,
    stopSalesSync,
    resetCloud
  };
})();
