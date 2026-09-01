/**
 * AttributionOSPixel — pageview beacon hacia AttributionOS (app propia en
 * Replit, ver app/lib/attributionOS.ts).
 *
 * Restaura la mitad "journey" de AttributionOS que dependía de un snippet
 * legacy en el checkout.liquid (Shopify.checkout.order_id, que no existe en
 * este store desde la migración a Checkout Extensibility — ver
 * webhooks.attributionos.tsx para la mitad "purchase", que sí puede
 * dispararse server-side). Este componente solo cubre pageviews en el
 * storefront Hydrogen, que no dependen de esa superficie legacy.
 *
 * El browser agrega el header Origin automáticamente en este fetch — ver
 * app/lib/attributionOS.ts sobre el dominio (aún incorrecto) registrado
 * para este shop en AttributionOS.
 *
 * Gateado igual que Meta/TikTok/Ads en GtmLoader.tsx: requiere
 * marketingAllowed() (Customer Privacy API) y descarta bots conocidos.
 *
 * Debe montarse DENTRO de <Analytics.Provider> (usa useAnalytics), junto a
 * GtmLoader y CustomAnalytics.
 */
import {useEffect} from 'react';
import {useAnalytics, AnalyticsEvent} from '@shopify/hydrogen';
import type {PageViewPayload, CartUpdatePayload} from '@shopify/hydrogen';
import {marketingAllowed} from '~/lib/consent';
import {isLikelyBot} from '~/lib/botDetection';
import {getOrCreateAosVisitorId} from '~/lib/aosCookie';
import {linkVisitorToCart} from '~/lib/aosCartLink';
import {readMarketingParams} from '~/lib/checkoutContinuity';
import {getFbCookies} from '~/lib/fbCookies';
import {
  ATTRIBUTION_OS_COLLECT_URL,
  ATTRIBUTION_OS_SHOP_ID,
} from '~/lib/attributionOS';

export function AttributionOSPixel() {
  const {subscribe} = useAnalytics();

  useEffect(() => {
    subscribe(AnalyticsEvent.PAGE_VIEWED, (payload: PageViewPayload) => {
      if (!marketingAllowed() || isLikelyBot()) return;

      const visitorId = getOrCreateAosVisitorId();
      if (!visitorId) return;

      // Closes the visit->order link (IDATTROS-51/53) -- see aosCartLink.ts.
      linkVisitorToCart(visitorId);

      const marketing = readMarketingParams();
      const {fbp, fbc} = getFbCookies();

      const body = {
        shopId: ATTRIBUTION_OS_SHOP_ID,
        visitorId,
        eventType: 'pageview',
        url: payload.url ?? window.location.href,
        referrer: document.referrer || '',
        utmSource: marketing.utm_source ?? '',
        utmMedium: marketing.utm_medium ?? '',
        utmCampaign: marketing.utm_campaign ?? '',
        utmContent: marketing.utm_content ?? '',
        utmTerm: marketing.utm_term ?? '',
        fbclid: marketing.fbclid ?? '',
        gclid: marketing.gclid ?? '',
        fbp: fbp ?? '',
        fbc: fbc ?? '',
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language || '',
      };

      try {
        fetch(ATTRIBUTION_OS_COLLECT_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(body),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Best-effort: nunca debe romper la navegación del cliente.
      }
    });

    // Segundo punto de enlace, además del que ya corre dentro de
    // PAGE_VIEWED (arriba): cuando el carrito recién se CREÓ o cambió por
    // una acción real del shopper (add-to-cart, etc.), payload.cart.id ya es
    // el id real y definitivo -- taguearlo aquí no puede competir con esa
    // creación porque ya ocurrió. Esto es lo que cubre la primera visita de
    // un shopper que agrega al carrito antes de que exista un `cart` cookie
    // (PAGE_VIEWED por sí solo se niega a taguear en ese caso -- ver
    // aosCartLink.ts). Sin este segundo punto, esos shoppers nunca quedan
    // enlazados en su primera sesión.
    subscribe(AnalyticsEvent.CART_UPDATED, (payload: CartUpdatePayload) => {
      if (!marketingAllowed() || isLikelyBot()) return;
      const visitorId = getOrCreateAosVisitorId();
      const cartId = payload.cart?.id;
      if (!visitorId || !cartId) return;
      linkVisitorToCart(visitorId, cartId);
    });
  }, [subscribe]);

  return null;
}
