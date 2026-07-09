/**
 * GtmLoader — Inicializa GTM, GA4, Google Ads, Meta Pixel y TikTok Pixel,
 * **gateado por consentimiento** vía el Customer Privacy API de Shopify.
 *
 * Debe montarse DENTRO de <Analytics.Provider> (usa useAnalytics).
 *
 * Reglas de consentimiento:
 *   - GTM + GA4           → requieren `analyticsProcessingAllowed()`
 *   - Google Ads / Meta / TikTok → requieren `marketingAllowed()`
 *   En regiones sin leyes de consentimiento, Shopify devuelve true de
 *   inmediato; en regiones con banner, esperamos `visitorConsentCollected`.
 *
 * Por qué useEffect + createElement en vez de <script nonce> en SSR:
 *   Scripts con nonce en el <head> de React pueden ser bloqueados por CSP
 *   o eliminados durante la hidratación. Scripts cargados con createElement
 *   son siempre evaluados por el browser y detectados por Tag Assistant.
 */
import {useEffect, useState} from 'react';

type ConsentState = {analytics: boolean; marketing: boolean};

function readConsent(): ConsentState | null {
  const cp = (window as any).Shopify?.customerPrivacy;
  if (!cp) return null;
  try {
    return {
      analytics: cp.analyticsProcessingAllowed?.() === true,
      marketing: cp.marketingAllowed?.() === true,
    };
  } catch {
    return null;
  }
}

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
  gtmOwnsTags,
}: {
  gtmId?: string | null;
  gaMeasurementId?: string | null;
  googleAdsId?: string | null;
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
  checkoutDomain?: string | null;
  gtmOwnsTags?: boolean;
}) {
  const checkoutHostname = getCheckoutHostname(checkoutDomain);
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    marketing: false,
  });

  // ── 0. Espera el consentimiento (Customer Privacy API) ──────────────────
  useEffect(() => {
    const w = window as any;
    // Flag global para que otros handlers (ej. begin_checkout en el cart)
    // sepan qué vía usar sin prop-drilling.
    w.__gtmOwnsTags = gtmOwnsTags === true;

    const update = () => {
      const c = readConsent();
      // Refleja el estado actual (no acumulativo): si el visitante revoca
      // consentimiento, los flags vuelven a false y los emisores dejan de
      // enviar (los scripts ya cargados no se pueden descargar, pero los
      // helpers verifican consentimiento al emitir cada evento).
      if (c) setConsent(c);
    };

    // Ya respondido en visita anterior / región sin banner
    update();

    // El banner nativo de Shopify dispara este evento al responder
    document.addEventListener('visitorConsentCollected', update);

    // El script del Customer Privacy API carga async — reintenta un rato
    // por si `window.Shopify.customerPrivacy` aún no existía en el mount.
    const interval = setInterval(() => {
      if (readConsent()) {
        update();
        clearInterval(interval);
      }
    }, 500);
    const stop = setTimeout(() => clearInterval(interval), 20000);

    return () => {
      document.removeEventListener('visitorConsentCollected', update);
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [gtmOwnsTags]);

  // ── A. Analytics permitido → GTM + GA4 ──────────────────────────────────
  useEffect(() => {
    if (!consent.analytics) return;
    const w = window as any;
    const linker = checkoutHostname
      ? {linker: {domains: [checkoutHostname], accept_incoming: true}}
      : null;

    // dataLayer + función gtag estándar
    w.dataLayer = w.dataLayer ?? [];
    if (!w.gtag) {
      w.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer.push(arguments);
      };
    }

    // GTM container
    if (gtmId && !document.querySelector(`script[data-gtm-id="${gtmId}"]`)) {
      w.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-gtm-id', gtmId);
      s.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      document.head.appendChild(s);
    }

    // GA4 gtag.js — solo si este código es dueño de los tags. Si GTM es el
    // dueño (gtmOwnsTags), GA4 se configura dentro del contenedor GTM y
    // cargarlo aquí duplicaría los hits.
    if (
      !gtmOwnsTags &&
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
  }, [consent.analytics]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── B. Marketing permitido → Google Ads + Meta + TikTok ─────────────────
  useEffect(() => {
    if (!consent.marketing) return;
    const w = window as any;
    const linker = checkoutHostname
      ? {linker: {domains: [checkoutHostname], accept_incoming: true}}
      : null;

    w.dataLayer = w.dataLayer ?? [];
    if (!w.gtag) {
      w.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer.push(arguments);
      };
    }

    // Google Ads
    if (
      !gtmOwnsTags &&
      googleAdsId &&
      !document.querySelector(`script[data-google-ads-id="${googleAdsId}"]`)
    ) {
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-google-ads-id', googleAdsId);
      s.src = `https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`;
      s.onload = () => {
        w.gtag('js', new Date());
        w.gtag('config', googleAdsId, {...(linker ?? {})});
      };
      document.head.appendChild(s);
    }

    // Meta Pixel (fbq) — en el main window para que CustomAnalytics lo use.
    if (!gtmOwnsTags && metaPixelId && !w.fbq) {
      const fbScript = document.createElement('script');
      fbScript.async = true;
      fbScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(fbScript);

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

    // TikTok Pixel (ttq)
    if (!gtmOwnsTags && tiktokPixelId && !w.ttq) {
      // Snippet oficial de TikTok adaptado a createElement (CSP estricto).
      w.TiktokAnalyticsObject = 'ttq';
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
  }, [consent.marketing]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
