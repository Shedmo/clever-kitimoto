import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SERVICE_FEE = 200;

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeTzPhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (/^0[67]\d{8}$/.test(digits)) return "+255" + digits.slice(1);
  if (/^255[67]\d{8}$/.test(digits)) return "+" + digits;
  return null;
}

function priceNumber(value: unknown) {
  const number = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

async function verifyWebhook(rawBody: string, request: Request, secret: string) {
  const timestamp = request.headers.get("X-Webhook-Timestamp") || "";
  const signature = request.headers.get("X-Webhook-Signature") || "";
  const eventTime = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!/^\d+$/.test(timestamp) || !signature || Math.abs(now - eventTime) > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const expected = Array.from(new Uint8Array(signed), b => b.toString(16).padStart(2, "0")).join("");
  if (signature.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function handleWebhook(rawBody: string, request: Request) {
  const secret = Deno.env.get("SNIPPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !supabaseUrl || !serviceKey) return respond({ error: "Payment webhook is not configured." }, 503);
  if (!await verifyWebhook(rawBody, request, secret)) return respond({ error: "Invalid webhook signature." }, 401);

  let event: Record<string, any>;
  try { event = JSON.parse(rawBody); } catch { return respond({ error: "Invalid JSON." }, 400); }
  const eventType = String(event.type || event.event || request.headers.get("X-Webhook-Event") || "");
  const data = event.data || event;
  const allowed: Record<string, string> = {
    "payment.completed": "completed",
    "payment.failed": "failed",
    "payment.voided": "voided",
    "payment.expired": "expired",
  };
  const paymentStatus = allowed[eventType];
  if (!paymentStatus) return respond({ received: true, ignored: true });

  const db = createClient(supabaseUrl, serviceKey);
  const orderId = String(data.metadata?.order_id || "");
  const sessionRef = String(data.session_reference || "");
  let query = db.from("orders").select("id,total,payment_reference,payment_status");
  if (orderId) query = query.eq("id", orderId);
  else if (sessionRef) query = query.eq("payment_reference", sessionRef);
  else return respond({ error: "Missing order reference." }, 400);
  const { data: order, error } = await query.maybeSingle();
  if (error || !order) return respond({ error: "Order not found." }, 404);
  if (order.payment_reference && sessionRef && order.payment_reference !== sessionRef) {
    return respond({ error: "Payment reference does not match order." }, 409);
  }

  if (paymentStatus === "completed") {
    const amountValue = Number(data.amount?.value ?? data.amount);
    const currency = String(data.amount?.currency || "");
    if (currency !== "TZS" || amountValue !== Number(order.total)) {
      return respond({ error: "Payment amount does not match order." }, 409);
    }
  }

  const { error: updateError } = await db.from("orders").update({
    payment_status: paymentStatus,
    payment_reference: order.payment_reference || sessionRef || data.reference || null,
  }).eq("id", order.id);
  if (updateError) return respond({ error: "Could not update order payment." }, 500);
  return respond({ received: true });
}

async function createCheckout(body: Record<string, unknown>) {
  const apiKey = Deno.env.get("SNIPPE_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = Deno.env.get("SITE_URL");
  if (!apiKey || !supabaseUrl || !serviceKey || !siteUrl) {
    return respond({ error: "Snippe checkout is not configured on the server." }, 503);
  }

  const orderId = String(body.orderId || "");
  if (!/^ord-[a-z0-9-]{16,40}$/i.test(orderId)) return respond({ error: "Invalid order reference." }, 400);
  const db = createClient(supabaseUrl, serviceKey);
  const { data: order, error } = await db.from("orders")
    .select("id,phone,notes,items,subtotal,service_fee,total,payment,payment_status,payment_reference,payment_checkout_url,payment_session_created_at")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) return respond({ error: "Oda haijapatikana mtandaoni." }, 404);
  if (order.payment !== "snippe") return respond({ error: "Oda hii haijachagua malipo ya Snippe." }, 409);
  if (order.payment_status === "completed") return respond({ error: "Oda hii tayari imelipiwa." }, 409);
  if (Number(order.service_fee) !== SERVICE_FEE || Number(order.total) !== Number(order.subtotal) + SERVICE_FEE) {
    return respond({ error: "Jumla ya oda si sahihi. Fungua upya oda na ujaribu tena." }, 409);
  }
  if (Number(order.total) < 500) return respond({ error: "Kiasi cha malipo kiko chini ya kiwango cha Snippe." }, 400);

  const phone = normalizeTzPhone(order.phone);
  if (!phone) return respond({ error: "Weka namba ya simu ya Tanzania iliyo sahihi." }, 400);
  const createdAt = new Date(order.payment_session_created_at || 0).getTime();
  const existingUrl = String(order.payment_checkout_url || "");
  if (existingUrl.startsWith("https://") && createdAt > Date.now() - 55 * 60 * 1000 && order.payment_status === "pending") {
    return respond({ checkoutUrl: existingUrl, reference: order.payment_reference, reused: true });
  }

  const orderItems = Array.isArray(order.items) ? order.items : [];
  if (orderItems.length > 49) return respond({ error: "Gawa oda ndogo yenye bidhaa zisizozidi 49 kwa malipo." }, 400);
  const items = orderItems;
  const lineItems = items.map((item: Record<string, unknown>) => {
    const label = [item.name, item.detail].filter(Boolean).join(" ").slice(0, 100) || "Menu";
    const lineTotal = priceNumber(item.price) * Math.max(1, Number(item.qty) || 1);
    return { name: `${label} × ${Number(item.qty) || 1}`, quantity: 1, unit_price: lineTotal };
  }).filter((item: { unit_price: number }) => item.unit_price > 0);
  const itemTotal = lineItems.reduce((sum: number, item: { unit_price: number }) => sum + item.unit_price, 0);
  if (itemTotal !== Number(order.subtotal)) return respond({ error: "Bei za oda hazilingani. Fungua upya menu na ujaribu tena." }, 409);
  lineItems.push({ name: "Ada ya huduma", quantity: 1, unit_price: SERVICE_FEE });

  const redirect = new URL(siteUrl);
  redirect.searchParams.set("snippe_return", "1");
  redirect.searchParams.set("order_id", order.id);
  const payload = {
    amount: Number(order.total),
    currency: "TZS",
    allowed_methods: ["mobile_money"],
    customer: { phone },
    redirect_url: redirect.toString(),
    webhook_url: `${supabaseUrl.replace(/\/$/, "")}/functions/v1/snippe-checkout`,
    description: `Clever Kitimoto order ${order.id}`.slice(0, 500),
    metadata: { order_id: order.id },
    expires_in: 3600,
    line_items: lineItems,
    display: { show_line_items: true, line_items_style: "cards", success_message: "Asante! Malipo yako yanathibitishwa." },
  };

  let response: Response;
  try {
    response = await fetch("https://api.snippe.sh/api/v1/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return respond({ error: "Imeshindikana kuwasiliana na Snippe. Jaribu tena." }, 502);
  }
  const result = await response.json().catch(() => ({}));
  const session = result?.data;
  if (!response.ok || typeof session?.checkout_url !== "string" || !session.checkout_url.startsWith("https://")) {
    console.error("Snippe session creation failed", response.status, result?.message || result?.error || "unknown error");
    return respond({ error: "Snippe haikuanzisha malipo. Hakiki API key na jaribu tena." }, 502);
  }

  const now = new Date().toISOString();
  const { error: updateError } = await db.from("orders").update({
    payment_status: "pending",
    payment_reference: session.reference || session.id || null,
    payment_checkout_url: session.checkout_url,
    payment_session_created_at: now,
  }).eq("id", order.id);
  if (updateError) return respond({ error: "Malipo yameanzishwa lakini oda haikusasishwa. Wasiliana na mgahawa." }, 500);
  return respond({ checkoutUrl: session.checkout_url, reference: session.reference || session.id || "" });
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405);
  const rawBody = await request.text();
  if (request.headers.has("X-Webhook-Event") || request.headers.has("X-Webhook-Signature")) {
    return await handleWebhook(rawBody, request);
  }
  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody); } catch { return respond({ error: "Invalid JSON." }, 400); }
  if (body.action !== "create") return respond({ error: "Unknown action." }, 400);
  return await createCheckout(body);
});
