/**
 * Meta Conversions API (CAPI) webhook endpoint.
 *
 * Recibe webhooks de Shopify (orders/create, orders/paid, checkouts/create)
 * y reenvía los eventos a Meta CAPI para tracking server-side.
 *
 * Configuración en Shopify Admin:
 *   Settings → Notifications → Webhooks → Create webhook
 *     Event: Order creation / Order payment / Checkout creation
 *     Format: JSON
 *     URL: https://<tu-dominio>/webhooks/meta-capi
 *     Webhook API version: 2024-01 (o la más reciente)
 *
 * Variables de entorno (Oxygen → Storefront settings → Environments):
 *   - PUBLIC_META_PIXEL_ID       Pixel ID (ej. "1234567890")
 *   - META_CAPI_ACCESS_TOKEN     Token CAPI de Meta Business Manager
 *   - META_TEST_EVENT_CODE       (opcional) Código de test event para el Event Manager
 *   - SHOPIFY_WEBHOOK_SECRET     Secreto compartido para validar HMAC del webhook
 *
 * Deduplicación:
 *   Usa event_id estable derivado del ID de Shopify para que si el evento
 *   también se dispara client-side (Meta Pixel en navegador), Meta los
 *   deduplique correctamente.
 */
import {type ActionFunctionArgs} from '@shopify/remix-oxygen';

const META_GRAPH_API_VERSION = 'v23.0';

// Hash con SHA-256 usando WebCrypto (disponible en Oxygen Workers)
async function sha256(value: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Verifica la firma HMAC de Shopify (X-Shopify-Hmac-Sha256)
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

type UserData = {
  em?: string[];
  ph?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;
  fbp?: string;
};

function getAttr(data: Record<string, any>, key: string): string | undefined {
  // Shopify webhook: note_attributes es un array [{name, value}]
  const attrs = data.note_attributes ?? data.attributes ?? [];
  const found = attrs.find?.((a: any) => a?.name === key || a?.key === key);
  return found?.value;
}

async function buildUserData(
  data: Record<string, any>,
  req: Request,
): Promise<UserData> {
  const user: UserData = {
    client_ip_address:
      data.client_details?.browser_ip ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      undefined,
    client_user_agent:
      getAttr(data, '_client_user_agent') ??
      data.client_details?.user_agent ??
      req.headers.get('user-agent') ??
      undefined,
  };
  if (data.email) user.em = [await sha256(String(data.email))];
  if (data.phone) user.ph = [await sha256(String(data.phone))];
  if (data.customer?.email && !user.em)
    user.em = [await sha256(String(data.customer.email))];
  if (data.customer?.phone && !user.ph)
    user.ph = [await sha256(String(data.customer.phone))];

  // fbp/fbc persistidos como cart attributes antes del checkout
  const fbp = getAttr(data, '_fbp');
  const fbc = getAttr(data, '_fbc');
  if (fbp) user.fbp = fbp;
  if (fbc) user.fbc = fbc;

  return user;
}

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {status: 405});
  }

  const env = context.env as unknown as Record<string, string | undefined>;
  const pixelId = env.PUBLIC_META_PIXEL_ID;
  const accessToken = env.META_CAPI_ACCESS_TOKEN;
  const testEventCode = env.META_TEST_EVENT_CODE;
  const webhookSecret = env.SHOPIFY_WEBHOOK_SECRET;

  if (!pixelId || !accessToken) {
    console.error('[meta-capi] Missing PUBLIC_META_PIXEL_ID or META_CAPI_ACCESS_TOKEN');
    return new Response('Meta CAPI not configured', {status: 503});
  }

  const rawBody = await request.text();
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic') ?? '';

  // Fail-closed: sin secret configurado, cualquiera podría inyectar
  // eventos falsos (Purchase) al pixel. Nunca procesar sin verificar HMAC.
  if (!webhookSecret) {
    console.error(
      '[meta-capi] SHOPIFY_WEBHOOK_SECRET not configured — rejecting',
    );
    return new Response('Webhook secret not configured', {status: 503});
  }
  const ok = await verifyShopifyHmac(rawBody, hmacHeader, webhookSecret);
  if (!ok) {
    console.warn('[meta-capi] Invalid HMAC signature');
    return new Response('Unauthorized', {status: 401});
  }

  let data: Record<string, any>;
  try {
    data = JSON.parse(rawBody) as Record<string, any>;
  } catch {
    return new Response('Invalid JSON', {status: 400});
  }

  const now = Math.floor(Date.now() / 1000);
  const userData = await buildUserData(data, request);

  // Mapea topic de Shopify a evento de Meta
  let eventName: string | null = null;
  let eventId = '';
  const customData: Record<string, any> = {
    currency: data.currency ?? data.presentment_currency,
  };

  switch (topic) {
    case 'orders/create':
    case 'orders/paid': {
      eventName = 'Purchase';
      eventId = `shopify_order_${data.id}`;
      customData.value = parseFloat(data.total_price ?? '0');
      customData.content_ids = (data.line_items ?? []).map((l: any) =>
        String(l.product_id),
      );
      customData.content_type = 'product';
      customData.num_items = (data.line_items ?? []).length;
      customData.order_id = String(data.id);
      break;
    }
    case 'checkouts/create': {
      eventName = 'InitiateCheckout';
      // Prefiere event_id del cliente (guardado como cart attribute) para dedup
      eventId = getAttr(data, '_client_event_id') ?? `shopify_checkout_${data.id}`;
      customData.value = parseFloat(data.total_price ?? '0');
      customData.content_ids = (data.line_items ?? []).map((l: any) =>
        String(l.product_id),
      );
      customData.content_type = 'product';
      customData.num_items = (data.line_items ?? []).length;
      customData.checkout_id = String(data.id);
      break;
    }
    default:
      return new Response(`Ignored topic: ${topic}`, {status: 200});
  }

  const payload: Record<string, any> = {
    data: [
      {
        event_name: eventName,
        event_time: now,
        event_id: eventId,
        action_source: 'website',
        event_source_url: data.source_url ?? data.landing_site ?? undefined,
        user_data: userData,
        custom_data: customData,
      },
    ],
  };
  if (testEventCode) payload.test_event_code = testEventCode;

  const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    const body = await resp.text();
    if (!resp.ok) {
      console.error('[meta-capi] Meta returned error', resp.status, body);
      return new Response(`Meta error: ${body}`, {status: 502});
    }
    return new Response(`Event ${eventName} sent`, {status: 200});
  } catch (err) {
    console.error('[meta-capi] fetch error', err);
    return new Response('Upstream error', {status: 502});
  }
}

export function loader() {
  return new Response('Use POST', {status: 405});
}
