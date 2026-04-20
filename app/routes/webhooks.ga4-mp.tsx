/**
 * GA4 Measurement Protocol webhook endpoint.
 *
 * Recibe webhooks de Shopify (orders/create, orders/paid, checkouts/create)
 * y reenvía los eventos al endpoint server-side de Google Analytics 4.
 *
 * Configuración en Shopify Admin:
 *   Settings → Notifications → Webhooks → Create webhook
 *     URL: https://<tu-dominio>/webhooks/ga4-mp
 *
 * Variables de entorno (Oxygen → Storefront settings → Environments):
 *   - PUBLIC_GA_MEASUREMENT_ID   ID del stream (ej. "G-XXXXXXX")
 *   - GA4_API_SECRET             API secret generado en GA4 Admin → Data Streams → Measurement Protocol API secrets
 *   - SHOPIFY_WEBHOOK_SECRET     (opcional) Para validar HMAC del webhook
 */
import {type ActionFunctionArgs} from '@shopify/remix-oxygen';

async function verifyShopifyHmac(
  rawBody: string,
  hmacHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!hmacHeader || !secret) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(rawBody),
  );
  const sigBytes = new Uint8Array(signature);
  const computed = btoa(String.fromCharCode(...sigBytes));
  return computed === hmacHeader;
}

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {status: 405});
  }

  const env = context.env as unknown as Record<string, string | undefined>;
  const measurementId = env.PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = env.GA4_API_SECRET;
  const webhookSecret = env.SHOPIFY_WEBHOOK_SECRET;

  if (!measurementId || !apiSecret) {
    console.error(
      '[ga4-mp] Missing PUBLIC_GA_MEASUREMENT_ID or GA4_API_SECRET',
    );
    return new Response('GA4 MP not configured', {status: 503});
  }

  const rawBody = await request.text();
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic') ?? '';

  if (webhookSecret) {
    const ok = await verifyShopifyHmac(rawBody, hmacHeader, webhookSecret);
    if (!ok) {
      console.warn('[ga4-mp] Invalid HMAC signature');
      return new Response('Unauthorized', {status: 401});
    }
  }

  let data: Record<string, any>;
  try {
    data = JSON.parse(rawBody) as Record<string, any>;
  } catch {
    return new Response('Invalid JSON', {status: 400});
  }

  // client_id es requerido por GA4. Se usa el ID del customer cuando existe,
  // y como fallback el ID del order/checkout. Idealmente debería ser el mismo
  // que se usa client-side para conservar la sesión del usuario.
  const clientId = String(
    data.customer?.id ?? data.id ?? `anon_${Date.now()}`,
  );

  let eventName: string | null = null;
  const params: Record<string, any> = {};

  const items = (data.line_items ?? []).map((item: any) => ({
    item_id: String(item.product_id),
    item_name: item.title,
    item_variant: item.variant_title ?? undefined,
    price: parseFloat(item.price ?? '0'),
    quantity: item.quantity,
  }));

  switch (topic) {
    case 'orders/create':
    case 'orders/paid':
      eventName = 'purchase';
      params.transaction_id = String(data.id);
      params.value = parseFloat(data.total_price ?? '0');
      params.currency = data.currency;
      params.items = items;
      params.event_id = `shopify_order_${data.id}`;
      break;
    case 'checkouts/create':
      eventName = 'begin_checkout';
      params.value = parseFloat(data.total_price ?? '0');
      params.currency = data.currency;
      params.items = items;
      params.event_id = `shopify_checkout_${data.id}`;
      break;
    default:
      return new Response(`Ignored topic: ${topic}`, {status: 200});
  }

  const payload = {
    client_id: clientId,
    user_id: data.customer?.id ? String(data.customer.id) : undefined,
    events: [{name: eventName, params}],
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    // GA4 MP returns 2xx with empty body on success
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[ga4-mp] GA4 error', resp.status, body);
      return new Response(`GA4 error: ${body}`, {status: 502});
    }
    return new Response(`Event ${eventName} sent`, {status: 200});
  } catch (err) {
    console.error('[ga4-mp] fetch error', err);
    return new Response('Upstream error', {status: 502});
  }
}

export function loader() {
  return new Response('Use POST', {status: 405});
}
