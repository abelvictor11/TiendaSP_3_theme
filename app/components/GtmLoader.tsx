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

export function GtmLoader({
  gtmId,
  gaMeasurementId,
  metaPixelId,
}: {
  gtmId?: string | null;
  gaMeasurementId?: string | null;
  metaPixelId?: string | null;
}) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;

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
        w.gtag('config', gaMeasurementId);
      };
      document.head.appendChild(s);
    }

    // ── 4. Meta Pixel (fbq) ───────────────────────────────────────────────
    // Inicializa fbq en el main window para que CustomAnalytics pueda usarlo.
    // Sin esto, window.fbq solo existe dentro del iframe sandbox de Shopify.
    if (metaPixelId && !w.fbq) {
      // Cargar fbevents.js
      const fbScript = document.createElement('script');
      fbScript.async = true;
      fbScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(fbScript);

      // Definir fbq queue antes de que cargue el script
      w.fbq = function () {
        // eslint-disable-next-line prefer-rest-params
        w.fbq.callMethod
          ? w.fbq.callMethod.apply(w.fbq, arguments)
          : w.fbq.queue.push(arguments);
      };
      w._fbq = w.fbq;
      w.fbq.push = w.fbq;
      w.fbq.loaded = true;
      w.fbq.version = '2.0';
      w.fbq.queue = [];

      w.fbq('init', metaPixelId);
      w.fbq('track', 'PageView');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
