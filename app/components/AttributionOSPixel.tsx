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
import type {PageViewPayload} from '@shopify/hydrogen';
import {marketingAllowed} from '~/lib/consent';
import {isLikelyBot} from '~/lib/botDetection';
import {getOrCreateAosVisitorId} from '~/lib/aosCookie';
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
  }, [subscribe]);

  return null;
}
