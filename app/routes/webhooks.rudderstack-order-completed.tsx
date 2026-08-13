/**
 * RudderStack server-side "Order Completed" webhook endpoint.
 *
 * El único capturador de order_completed que existía hasta ahora era el Web
 * Pixel de Shopify (client-side, corre en la página de gracias del checkout
 * *hospedado por Shopify*). Diagnóstico 2026-08-12 (docs/ANALYTICS_TRACKING_
 * ISSUES_PLAN_2026_08.md, Issue 3): ese pixel pierde ~25-29% de las órdenes
 * reales, y la pérdida está 100% concentrada en pasarelas que redirigen fuera
 * de Shopify (Addi, Mercado Pago Checkout Pro, Sistecredito) -- el pixel solo
 * dispara si el navegador vuelve a aterrizar en la página de gracias tras el
 * ida-y-vuelta externo. Pago directo con tarjeta (Mercado Pago Tarjetas)
 * capturaba 19/19 (100%).
 *
 * Este endpoint agrega una segunda ruta de captura, server-side, inmune a esa
 * pérdida -- mismo patrón que webhooks.ga4-mp.tsx. El Web Pixel se deja tal
 * cual (sigue aportando contexto de sesión cuando sí dispara); cualquier
 * consulta futura debe deduplicar por order_id entre ambas fuentes en vez de
 * desactivar una de las dos.
 *
 * Configuración en Shopify Admin:
 *   Settings → Notifications → Webhooks → Create webhook
 *     Event: Order payment  (topic: orders/paid)
 *     URL: https://<tu-dominio>/webhooks/rudderstack-order-completed
 *
 * Variables de entorno (Oxygen → Storefront settings → Environments):
 *   - PUBLIC_RUDDERSTACK_WRITE_KEY       ya usado por el SDK client-side
 *   - PUBLIC_RUDDERSTACK_DATA_PLANE_URL  ya usado por el SDK client-side
 *   - SHOPIFY_WEBHOOK_SECRET             REQUERIDO -- mismo secret que
 *                                        webhooks.ga4-mp.tsx (HMAC a nivel de
 *                                        shop, no por-webhook). Sin él, el
 *                                        endpoint rechaza todo (fail-closed).
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
  const writeKey = env.PUBLIC_RUDDERSTACK_WRITE_KEY;
  const dataPlaneUrl = env.PUBLIC_RUDDERSTACK_DATA_PLANE_URL;
  const webhookSecret = env.SHOPIFY_WEBHOOK_SECRET;

  if (!writeKey || !dataPlaneUrl) {
    console.error(
      '[rudderstack-order-completed] Missing PUBLIC_RUDDERSTACK_WRITE_KEY or PUBLIC_RUDDERSTACK_DATA_PLANE_URL',
    );
    return new Response('RudderStack not configured', {status: 503});
  }

  const rawBody = await request.text();
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic') ?? '';

  // Fail-closed: sin secret configurado, cualquiera podría inyectar
  // órdenes falsas al warehouse de eventos.
  if (!webhookSecret) {
    console.error(
      '[rudderstack-order-completed] SHOPIFY_WEBHOOK_SECRET not configured — rejecting',
    );
    return new Response('Webhook secret not configured', {status: 503});
  }
  const ok = await verifyShopifyHmac(rawBody, hmacHeader, webhookSecret);
  if (!ok) {
    console.warn('[rudderstack-order-completed] Invalid HMAC signature');
    return new Response('Unauthorized', {status: 401});
  }

  // Solo orders/paid -- mismo motivo que ga4-mp.tsx: orders/create también
  // dispara para pedidos que luego nunca se pagan (COD/transferencia manual
  // pendiente), y contarlos ahí infla las ventas reales.
  if (topic !== 'orders/paid') {
    return new Response(`Ignored topic: ${topic}`, {status: 200});
  }

  let data: Record<string, any>;
  try {
    data = JSON.parse(rawBody) as Record<string, any>;
  } catch {
    return new Response('Invalid JSON', {status: 400});
  }

  // userId = email en minúsculas/recortado -- misma convención que
  // rsIdentify() (CustomAnalytics.tsx) y el backfill histórico, para que
  // esta orden se fusione con el grafo de identidad existente en vez de
  // crear una identidad separada. Sin email, cae a un anonymousId sintético
  // por orden (igual queda en el warehouse, solo sin fusión de identidad).
  const email: string | undefined = data.email || data.customer?.email;
  const userId = email ? email.toLowerCase().trim() : undefined;
  const anonymousId = userId ? undefined : `shopify_order_${data.id}`;

  const products = (data.line_items ?? []).map((item: any) => ({
    product_id: String(item.product_id),
    name: item.title,
    variant: item.variant_title ?? undefined,
    price: parseFloat(item.price ?? '0'),
    quantity: item.quantity,
  }));

  const payload = {
    userId,
    anonymousId,
    // messageId = idempotency key -- si Shopify reintenta esta entrega
    // (respuesta lenta/no-2xx), RudderStack deduplica por messageId dentro
    // de su ventana de retención en vez de crear un segundo evento.
    messageId: `shopify_order_paid_${data.id}`,
    event: 'Order Completed',
    properties: {
      order_id: String(data.id),
      order_number: data.order_number ?? data.name,
      checkout_id: data.checkout_id ? String(data.checkout_id) : undefined,
      total: parseFloat(data.total_price ?? '0'),
      revenue: parseFloat(data.total_price ?? '0'),
      tax: parseFloat(data.total_tax ?? '0'),
      shipping: parseFloat(data.total_shipping_price_set?.shop_money?.amount ?? '0'),
      discount: parseFloat(data.total_discounts ?? '0'),
      currency: data.currency,
      payment_gateway: (data.payment_gateway_names ?? []).join(','),
      products,
    },
    originalTimestamp: data.processed_at ?? data.created_at ?? undefined,
  };

  try {
    const resp = await fetch(`${dataPlaneUrl}/v1/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${writeKey}:`)}`,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[rudderstack-order-completed] RudderStack error', resp.status, body);
      return new Response(`RudderStack error: ${body}`, {status: 502});
    }
    return new Response('Order Completed sent', {status: 200});
  } catch (err) {
    console.error('[rudderstack-order-completed] fetch error', err);
    return new Response('Upstream error', {status: 502});
  }
}

export function loader() {
  return new Response('Use POST', {status: 405});
}
