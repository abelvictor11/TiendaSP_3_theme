# Tracking Setup — GTM, GA4, Meta Pixel/CAPI, TikTok

> Guía completa para configurar el tracking client-side + server-side de las 4
> tiendas (fitshop, tienda/supermu, ciclospecial, cyclewear).

---

## 📑 Índice

1. [Arquitectura general](#arquitectura-general)
2. [Variables de entorno](#variables-de-entorno-oxygen)
3. [IDs por tienda](#ids-por-tienda)
4. [Webhooks de Shopify](#webhooks-de-shopify)
5. [Paso a paso: Meta Pixel + CAPI](#paso-a-paso-meta-pixel--capi)
6. [Paso a paso: Google Analytics 4 + GTM](#paso-a-paso-google-analytics-4--gtm)
7. [Paso a paso: TikTok Pixel](#paso-a-paso-tiktok-pixel)
8. [Validación y troubleshooting](#validación-y-troubleshooting)
9. [FAQ](#faq)

---

## Arquitectura general

Hay **dos flujos** corriendo en paralelo:

### 🧭 Client-side (browser)

```
┌──────────────┐     ┌───────────────┐
│  GtmLoader   │ ──► │  gtag (GA4)   │
│ useEffect()  │ ──► │  fbq (Meta)   │
│  en <body>   │ ──► │  ttq (TikTok) │
└──────────────┘     └───────────────┘
        │
        ▼
┌────────────────────┐
│ CustomAnalytics    │  ← escucha eventos de Hydrogen Analytics
│ (SPA bridge)       │    y dispara a gtag/fbq/ttq en cada nav SPA
└────────────────────┘
        │
        ▼
   PageView, ViewContent, AddToCart, Search, InitiateCheckout
```

### 🛰️ Server-side (webhooks)

```
┌──────────────────┐        ┌──────────────────────┐
│ Shopify webhook  │ ─────► │ /webhooks/meta-capi  │ ──► Meta CAPI
│ orders/create    │        └──────────────────────┘
│ orders/paid      │
│ checkouts/create │ ─────► ┌──────────────────────┐
└──────────────────┘        │ /webhooks/ga4-mp     │ ──► GA4 MP
                            └──────────────────────┘
```

### 🔗 Deduplicación

Cada evento lleva un `event_id` único. Cuando el mismo evento llega por
ambos canales (client + server), Meta y GA4 lo deduplican automáticamente.

| Evento | Client `event_id` | Server `event_id` |
|--------|-------------------|-------------------|
| Purchase | (manejado por Shopify Web Pixel) | `shopify_order_{id}` |
| InitiateCheckout | `client_checkout_{ts}` → guardado en cart attribute | lee `_client_event_id` del cart |
| ViewContent, AddToCart | solo client-side | — |

---

## Variables de entorno (Oxygen)

**Dashboard:** Shopify Admin → Apps → Hydrogen → `<storefront>` → Environments → Variables

### 🟢 Variables públicas (expuestas al browser)

Prefijo `PUBLIC_*`. Se incluyen en el bundle JS — **no son secretas**.

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `PUBLIC_GTM_ID` | Recomendado | Container ID de Google Tag Manager | `GTM-W8SBW56T` |
| `PUBLIC_GA_MEASUREMENT_ID` | Recomendado | Stream ID de GA4 | `G-PMJ8N4MCVR` |
| `PUBLIC_META_PIXEL_ID` | Opcional | Pixel ID de Meta (15–16 dígitos) | `1234567890123456` |
| `PUBLIC_TIKTOK_PIXEL_ID` | Opcional | Pixel ID de TikTok | `CXXX…` |

> **Nota:** `PUBLIC_GTM_ID` y `PUBLIC_GA_MEASUREMENT_ID` tienen fallback
> hardcoded en `root.tsx` por tienda, así que funcionan aunque no los
> configures. Meta y TikTok no tienen fallback — si no los configuras, no
> se cargan.

### 🔒 Variables privadas (solo server)

Sin prefijo `PUBLIC_`. **Nunca** se exponen al browser. Úsalas con cuidado.

| Variable | Requerida para | Descripción | Dónde generar |
|----------|----------------|-------------|---------------|
| `META_CAPI_ACCESS_TOKEN` | Meta CAPI | Access token del dataset | Events Manager → tu pixel → Settings → Generate access token |
| `META_TEST_EVENT_CODE` | Meta CAPI (solo test) | Código para marcar eventos como test | Events Manager → Test Events tab |
| `GA4_API_SECRET` | GA4 MP | API secret del stream | GA4 Admin → Data Streams → Measurement Protocol API secrets → Create |
| `TIKTOK_EVENTS_TOKEN` | TikTok Events API | Access token | TikTok Events Manager → Events API |
| `SHOPIFY_WEBHOOK_SECRET` | HMAC verification | Secret compartido para validar webhooks | Lo genera Shopify al crear el webhook |
| `ADMIN_API_ACCESS_TOKEN` | Admin API (usos varios) | Token del app de Shopify | Ya existe en fitshop/tienda/ciclospecial |

---

## IDs por tienda

### Actualmente hardcoded (fallback en `app/root.tsx`)

| Tienda | GTM ID | GA4 Measurement ID |
|--------|--------|--------------------|
| **fitshop** | `GTM-W8SBW56T` | `G-PMJ8N4MCVR` |
| **tienda (supermu)** | `GTM-KNGTLWDD` | `G-3KXN1RL4D5` |
| **ciclospecial** | `GTM-KGWW5XVJ` | `G-WJNFGXGM06` |
| **cyclewear** | _(no configurado)_ | _(no configurado)_ |

### Pendientes por tienda

Para cada tienda, completa esta tabla con los IDs reales:

| Tienda | Meta Pixel ID | Meta CAPI Token | TikTok Pixel ID | TikTok Token |
|--------|---------------|-----------------|-----------------|--------------|
| **fitshop** | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ |
| **tienda (supermu)** | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ |
| **ciclospecial** | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ |
| **cyclewear** | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ |

---

## Webhooks de Shopify

**Dashboard:** Shopify Admin → Settings → Notifications → **Webhooks** → Create webhook

### Webhooks requeridos por tienda

Cada tienda necesita **6 webhooks** (3 eventos × 2 destinos):

| # | Event | Format | URL |
|---|-------|--------|-----|
| 1 | Order creation | JSON | `https://<tu-dominio>/webhooks/meta-capi` |
| 2 | Order payment | JSON | `https://<tu-dominio>/webhooks/meta-capi` |
| 3 | Checkout creation | JSON | `https://<tu-dominio>/webhooks/meta-capi` |
| 4 | Order creation | JSON | `https://<tu-dominio>/webhooks/ga4-mp` |
| 5 | Order payment | JSON | `https://<tu-dominio>/webhooks/ga4-mp` |
| 6 | Checkout creation | JSON | `https://<tu-dominio>/webhooks/ga4-mp` |

> **Webhook API version:** usar la más reciente (ej. `2024-10`).

### Dominio por tienda

Reemplaza `<tu-dominio>` por:

| Tienda | Dominio |
|--------|---------|
| fitshop | `https://fitshop.co` _(o el custom domain de Oxygen)_ |
| tienda (supermu) | `https://supermu.com.co` |
| ciclospecial | `https://ciclospecial.com.co` _(confirmar)_ |
| cyclewear | `https://cyclewear.com.co` |

### Webhook Secret

Al crear el primer webhook, Shopify genera un **webhook signing secret**
visible en Admin → Settings → Notifications → scroll al final de la página
(sección "Webhooks"). Es el **mismo para toda la tienda**.

Cópialo y guárdalo como `SHOPIFY_WEBHOOK_SECRET` en Oxygen env vars.

---

## Paso a paso: Meta Pixel + CAPI

### 1. Crear o identificar el Pixel

1. [Meta Events Manager](https://business.facebook.com/events_manager)
2. Selecciona el Business Account de la marca
3. Data Sources → tu Pixel (o **Connect Data** → Web → Create pixel)
4. Copia el **Pixel ID** (15–16 dígitos)

### 2. Generar CAPI Access Token

1. En el mismo pixel → **Settings** (⚙️)
2. Scroll a **Conversions API** → **Generate access token**
3. Copia el token (empieza con `EAA...`)
4. Guárdalo en Oxygen como `META_CAPI_ACCESS_TOKEN`

### 3. Configurar Oxygen env vars

```
PUBLIC_META_PIXEL_ID=1234567890123456
META_CAPI_ACCESS_TOKEN=EAAxxxxxxxx...
META_TEST_EVENT_CODE=TEST12345      # (opcional, solo durante pruebas)
SHOPIFY_WEBHOOK_SECRET=<el secret del webhook de Shopify>
```

### 4. Crear webhooks en Shopify

Ver tabla [arriba](#webhooks-requeridos-por-tienda). Crea 3 webhooks
apuntando a `/webhooks/meta-capi`.

### 5. Validar

- **Browser (client-side):** instala [Meta Pixel Helper](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) y navega la tienda. Deberías ver:
  - `PageView` en cada página
  - `ViewContent` al abrir un producto
  - `AddToCart` al agregar al carrito
  - `InitiateCheckout` al pulsar "Finalizar compra"

- **Server (CAPI):** Events Manager → tu pixel → **Test Events** tab → configura `META_TEST_EVENT_CODE` en Oxygen y haz una compra real. Debe aparecer:
  - `Purchase` con **Event Match Quality** ≥ 7/10
  - Fuente: **Server** o **Browser + Server** (deduplicado)

### 6. Event Match Quality (EMQ)

El EMQ depende de cuántos identificadores envíes a Meta. Nuestro webhook
envía automáticamente:

| Campo | Fuente |
|-------|--------|
| `em` (email SHA-256) | `order.email` o `order.customer.email` |
| `ph` (phone SHA-256) | `order.phone` o `order.customer.phone` |
| `client_ip_address` | `order.client_details.browser_ip` |
| `client_user_agent` | cart attribute `_client_user_agent` o `order.client_details.user_agent` |
| `fbp` | cart attribute `_fbp` (persistido desde cookie del browser) |
| `fbc` | cart attribute `_fbc` (derivado de `?fbclid=` al entrar) |

**EMQ esperado: 8–10/10** (excelente).

---

## Paso a paso: Google Analytics 4 + GTM

### 1. Google Analytics 4

1. [Google Analytics](https://analytics.google.com/)
2. Admin → **Data Streams** → tu Web Stream → copia **Measurement ID** (`G-XXXX`)
3. En el mismo panel → **Measurement Protocol API secrets** → **Create**
   - Nickname: `hydrogen-server`
   - Copia el **Secret value**

### 2. Google Tag Manager (opcional pero recomendado)

1. [Google Tag Manager](https://tagmanager.google.com/)
2. Crea un Container Web (si no existe)
3. Copia el **Container ID** (`GTM-XXXX`)

### 3. Configurar Oxygen

```
PUBLIC_GTM_ID=GTM-XXXX
PUBLIC_GA_MEASUREMENT_ID=G-XXXX
GA4_API_SECRET=xxxxxxxxxxxxx
SHOPIFY_WEBHOOK_SECRET=<mismo que Meta>
```

### 4. Crear webhooks en Shopify

Los 3 webhooks apuntando a `/webhooks/ga4-mp` (ver tabla arriba).

### 5. Validar

- **Client:** [Google Tag Assistant](https://tagassistant.google.com/) → conecta tu sitio → ver tags disparándose.
- **Client (alternativa):** GA4 → Admin → **DebugView** → abre la tienda con la extensión [GA Debugger](https://chromewebstore.google.com/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) → ves eventos en tiempo real.
- **Server:** Haz una compra real. En GA4 → **Reports** → **Realtime** debe aparecer `purchase` con el flag **(mp)** indicando que vino por Measurement Protocol.

---

## Paso a paso: TikTok Pixel

### 1. Crear Pixel en TikTok Ads Manager

1. [TikTok Ads Manager](https://ads.tiktok.com/) → Assets → **Events** → **Web Events**
2. **Set Up Web Events** → **Manual**
3. Copia el **Pixel ID**

### 2. Generar Events API Token (opcional, para server-side)

1. En el mismo pixel → **Events API** tab → **Generate Access Token**
2. Copia el token → Oxygen como `TIKTOK_EVENTS_TOKEN`

> _Nota: actualmente no hay ruta `/webhooks/tiktok-events` implementada.
> Se puede agregar de forma análoga a Meta CAPI si se requiere._

### 3. Configurar Oxygen

```
PUBLIC_TIKTOK_PIXEL_ID=CXXXXXX
```

### 4. Validar

Instala [TikTok Pixel Helper](https://chromewebstore.google.com/detail/tiktok-pixel-helper/aelgobmabdmlfmiblddjfnjodalhidnn) y navega la tienda. Debes ver:
- `Pageview` en cada página
- `ViewContent`, `AddToCart`, `Search`, `InitiateCheckout` cuando correspondan

---

## Validación y troubleshooting

### 🧪 Checklist de validación por tienda

- [ ] Abrir la tienda → ver en DevTools → Network que se cargan:
  - `https://www.googletagmanager.com/gtm.js?id=GTM-...`
  - `https://www.googletagmanager.com/gtag/js?id=G-...`
  - `https://connect.facebook.net/en_US/fbevents.js` (si hay Meta)
  - `https://analytics.tiktok.com/i18n/pixel/events.js` (si hay TikTok)

- [ ] No hay errores `Refused to load the script … Content Security Policy`

- [ ] Meta Pixel Helper muestra los 5 eventos (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase)

- [ ] Events Manager → Test Events → ves eventos Server + Browser con EMQ ≥ 7

- [ ] GA4 → Realtime → ves `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`

- [ ] TikTok Pixel Helper muestra los 4 eventos principales

- [ ] `/webhooks/meta-capi` responde 200 a POST (revisar logs de Oxygen)

- [ ] `/webhooks/ga4-mp` responde 200 a POST

### 🔧 Problemas comunes

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| CSP bloquea `fbevents.js` | Falta dominio en `scriptSrc` | Ya resuelto en `app/entry.server.tsx` |
| Meta Pixel Helper no detecta nada | `PUBLIC_META_PIXEL_ID` no configurado | Agregar en Oxygen env vars |
| EMQ muy bajo (< 5) | Falta `_fbp`/`_fbc` en cart | Ver que el usuario llegue con `?fbclid=` o que la cookie `_fbp` esté presente |
| Eventos duplicados en Meta | `event_id` diferente entre client/server | Nuestra implementación ya comparte `_client_event_id` vía cart attributes |
| Webhook devuelve 401 | HMAC secret incorrecto | Copiar exactamente el secret de Shopify Admin → Notifications → Webhook settings |
| Webhook devuelve 503 | Variables de entorno faltantes | Revisar que `PUBLIC_META_PIXEL_ID` y `META_CAPI_ACCESS_TOKEN` estén configurados en Oxygen |
| `purchase` no llega a GA4 Realtime | `GA4_API_SECRET` incorrecto o `measurement_id` mal formado | El `measurement_id` debe empezar con `G-`, no `UA-` |
| Los eventos llegan a GA4 pero el `client_id` es siempre distinto | Esperable server-side; GA4 los cuenta igual pero la sesión puede fragmentarse | Para mejor UX session stitching, capturar el cookie `_ga` client-side y pasarla al webhook _(no implementado)_ |

### 📡 Ver logs de webhooks

En Oxygen: Dashboard → tu storefront → **Logs** tab → filtrar por ruta.

Cada endpoint loguea:
- `[meta-capi] Meta returned error 400 {...}`  → problema con payload
- `[meta-capi] Invalid HMAC signature` → secret mal configurado
- `[meta-capi] Missing PUBLIC_META_PIXEL_ID or META_CAPI_ACCESS_TOKEN` → env vars faltantes

---

## FAQ

### ¿Necesito configurar TODAS las variables?

No. Mínimo viable para tener **algo** funcionando:

| Quiero... | Necesito configurar |
|-----------|---------------------|
| Google Analytics 4 client-side | Nada (usa fallback hardcoded) |
| Meta Pixel client-side | `PUBLIC_META_PIXEL_ID` |
| Meta CAPI server-side | `PUBLIC_META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` + webhooks |
| TikTok Pixel client-side | `PUBLIC_TIKTOK_PIXEL_ID` |
| GA4 server-side (purchase tracking robusto) | `PUBLIC_GA_MEASUREMENT_ID` + `GA4_API_SECRET` + webhooks |
| Validación HMAC de webhooks (seguridad) | `SHOPIFY_WEBHOOK_SECRET` |

### ¿Los webhooks con HMAC incorrecto se pueden procesar?

No. Si `SHOPIFY_WEBHOOK_SECRET` está configurado, el endpoint rechaza
cualquier POST cuyo header `X-Shopify-Hmac-Sha256` no coincida.

Si `SHOPIFY_WEBHOOK_SECRET` está **vacío**, el endpoint acepta cualquier
POST (inseguro, solo para testing local).

### ¿Qué pasa con el checkout de Shopify (3er párrafo del flujo)?

El checkout nativo de Shopify corre en otro dominio (`*.myshopify.com` o
checkout custom). Shopify ejecuta ahí su **Web Pixel API** que también
dispara `fbq('track', 'Purchase')` y `gtag('event', 'purchase')` dentro
del sandbox iframe de ese checkout.

Esto significa que **Purchase** se dispara 2 veces:
1. Server-side vía webhook → `event_id: shopify_order_{id}`
2. Client-side desde Shopify Web Pixel → Meta/GA4 deduplican por el order ID

La deduplicación funciona porque ambos usan el mismo ID de orden.

### ¿Puedo usar Klaviyo / Mailchimp / otros?

Sí, pero no está implementado. El patrón sería similar:
1. Agregar `PUBLIC_KLAVIYO_SITE_ID` a env vars
2. Crear un snippet de init en `GtmLoader.tsx`
3. Agregar eventos en `CustomAnalytics.tsx`

### ¿Cómo añadir un nuevo pixel/plataforma?

1. Agregar variable en `env.d.ts`
2. Leerla en `root.tsx` loader y pasarla al `<GtmLoader>`
3. Inicializar el SDK en `GtmLoader.tsx` useEffect
4. Agregar CSP allowlist en `entry.server.tsx` (scriptSrc + imgSrc)
5. Disparar eventos en `CustomAnalytics.tsx`
6. (Opcional) Crear ruta `/webhooks/<plataforma>` para server-side

---

## Archivos clave del repo

| Archivo | Rol |
|---------|-----|
| `app/components/GtmLoader.tsx` | Inicializa GTM, GA4, Meta Pixel, TikTok Pixel en el main window |
| `app/components/CustomAnalytics.tsx` | Bridge SPA: escucha Hydrogen Analytics y dispara a los pixels |
| `app/lib/fbCookies.ts` | Captura `fbclid` → `_fbc`, lee `_fbp` |
| `app/routes/($locale).cart.tsx` | Persiste fbp/fbc como cart attributes antes del checkout |
| `app/routes/webhooks.meta-capi.tsx` | Recibe webhooks de Shopify → Meta CAPI |
| `app/routes/webhooks.ga4-mp.tsx` | Recibe webhooks de Shopify → GA4 Measurement Protocol |
| `app/entry.server.tsx` | CSP (scriptSrc, imgSrc) permite todos los dominios de tracking |
| `env.d.ts` | Declaraciones de tipo para todas las env vars |
