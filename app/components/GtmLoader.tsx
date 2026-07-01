/**
 * GtmLoader — Inicializa GTM, GA4 y Meta Pixel en el main window vía useEffect.
 *
 * Por qué useEffect + createElement en vez de <script nonce> en SSR:
 *   Scripts con nonce en el <head> de React pueden ser bloqueados por CSP
 *   o eliminados durante la hidratación. Scripts cargados con createElement
 *   son siempre evaluados por el browser y detectados por Tag Assistant.
 *
 * No declara tipos globales de Window para evitar conflictos con
 *   CustomAnalytics.tsx. Usa (window as any) en su lugar.
 */
import {useEffect} from 'react';

function getCheckoutHostname(checkoutDomain?: string | null): string | null {
  if (!checkoutDomain) return null;
  try {
    return new URL(checkoutDomain).hostname;
  } catch {
    try {
      return new URL(`https://${checkoutDomain}`).hostname;
    } catch {
      return null;
    }
  }
}

export function GtmLoader({
  gtmId,
  gaMeasurementId,
  googleAdsId,
  metaPixelId,
  tiktokPixelId,
  checkoutDomain,
}: {
  gtmId?: string | null;
  gaMeasurementId?: string | null;
  googleAdsId?: string | null;
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
  checkoutDomain?: string | null;
}) {
  const checkoutHostname = getCheckoutHostname(checkoutDomain);

  useEffect(() => {
    const w = window as any;
    const linker = checkoutHostname
      ? {
          linker: {
            domains: [checkoutHostname],
            accept_incoming: true,
          },
        }
      : null;

    // ── 1. dataLayer + función gtag estándar ──────────────────────────────
    w.dataLayer = w.dataLayer ?? [];
    if (!w.gtag) {
      w.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer.push(arguments);
      };
    }

    // ── 2. GTM container ──────────────────────────────────────────────────
    if (gtmId && !document.querySelector(`script[data-gtm-id="${gtmId}"]`)) {
      w.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-gtm-id', gtmId);
      s.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      document.head.appendChild(s);
    }

    // ── 3. GA4 gtag.js ────────────────────────────────────────────────────
    if (
      gaMeasurementId &&
      !document.querySelector(`script[data-ga-id="${gaMeasurementId}"]`)
    ) {
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-ga-id', gaMeasurementId);
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
      s.onload = () => {
        w.gtag('js', new Date());
        // CustomAnalytics owns page_view (incl. the first load) so SPA nav is
        // tracked consistently — disable gtag's automatic initial page_view.
        w.gtag('config', gaMeasurementId, {
          send_page_view: false,
          ...(linker ?? {}),
        });
      };
      document.head.appendChild(s);
    }

    // ── 4. Google Ads ─────────────────────────────────────────────────────
    if (
      googleAdsId &&
      !document.querySelector(`script[data-google-ads-id="${googleAdsId}"]`)
    ) {
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-google-ads-id', googleAdsId);
      s.src = `https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`;
      s.onload = () => {
        w.gtag('js', new Date());
        w.gtag('config', googleAdsId, {
          ...(linker ?? {}),
        });
      };
      document.head.appendChild(s);
    }

    // ── 5. Meta Pixel (fbq) ───────────────────────────────────────────────
    // Inicializa fbq en el main window para que CustomAnalytics pueda usarlo.
    // Sin esto, window.fbq solo existe dentro del iframe sandbox de Shopify.
    if (metaPixelId && !w.fbq) {
      // Cargar fbevents.js
      const fbScript = document.createElement('script');
      fbScript.async = true;
      fbScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(fbScript);

      // Definir fbq queue antes de que cargue el script
      w.fbq = function (...args: unknown[]) {
        if (w.fbq.callMethod) {
          w.fbq.callMethod(...args);
        } else {
          w.fbq.queue.push(args);
        }
      };
      w._fbq = w.fbq;
      w.fbq.push = w.fbq;
      w.fbq.loaded = true;
      w.fbq.version = '2.0';
      w.fbq.queue = [];

      // Only init here; CustomAnalytics fires PageView on every PAGE_VIEWED
      // (including the initial load) to avoid double-counting.
      w.fbq('init', metaPixelId);
    }

    // ── 5. TikTok Pixel (ttq) ─────────────────────────────────────────────
    if (tiktokPixelId && !w.ttq) {
      // Snippet oficial de TikTok, adaptado: el código original usa
      // eval y manipula document.head directamente. Lo reemplazamos por
      // createElement para cumplir con CSP estricto.
      const ttq: any = (w.TiktokAnalyticsObject = 'ttq');
      w.ttq = [];
      const methods = [
        'page',
        'track',
        'identify',
        'instances',
        'debug',
        'on',
        'off',
        'once',
        'ready',
        'alias',
        'group',
        'enableCookie',
        'disableCookie',
      ];
      const tt: any = w.ttq;
      tt.setAndDefer = (obj: any, method: string) => {
        obj[method] = function () {
          // eslint-disable-next-line prefer-rest-params
          obj.push([method].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (const method of methods) tt.setAndDefer(tt, method);
      tt.instance = function (id: string) {
        const inst = tt._i[id] || [];
        for (const method of methods) tt.setAndDefer(inst, method);
        return inst;
      };
      tt.load = function (id: string, opts?: any) {
        const url = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        tt._i = tt._i || {};
        tt._i[id] = [];
        tt._i[id]._u = url;
        tt._t = tt._t || {};
        tt._t[id] = +new Date();
        tt._o = tt._o || {};
        tt._o[id] = opts || {};
        const s = document.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = url + '?sdkid=' + id + '&lib=ttq';
        document.head.appendChild(s);
      };

      // Only load here; CustomAnalytics calls ttq.page() on every PAGE_VIEWED
      // (including the initial load) to avoid double-counting.
      tt.load(tiktokPixelId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
