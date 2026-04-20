/**
 * GtmLoader — Inyecta GTM y GA4 en el cliente vía useEffect.
 *
 * Por qué useEffect en vez de <script> en SSR:
 *  - Los scripts con nonce en el <head> de React pueden ser bloqueados
 *    por la CSP o eliminados durante la hidratación.
 *  - Los scripts cargados via createElement son siempre evaluados por el
 *    browser y detectados correctamente por Tag Assistant.
 *  - Los dominios de GTM/GA4 ya están en script-src de la CSP.
 */
import {useEffect} from 'react';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function GtmLoader({
  gtmId,
  gaMeasurementId,
}: {
  gtmId?: string | null;
  gaMeasurementId?: string | null;
}) {
  useEffect(() => {
    // 1. Inicializar dataLayer y la función gtag estándar
    window.dataLayer = window.dataLayer ?? [];

    if (!window.gtag) {
      // Debe ser function (no arrow) para poder usar `arguments`
      // eslint-disable-next-line prefer-rest-params
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
    }

    // 2. Cargar contenedor GTM
    if (gtmId && !document.querySelector(`script[data-gtm-id="${gtmId}"]`)) {
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js',
      });
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-gtm-id', gtmId);
      s.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      document.head.appendChild(s);
    }

    // 3. Cargar gtag.js de GA4 directamente
    //    Esto asegura que window.gtag funcione para los eventos de CustomAnalytics
    //    incluso antes de que GTM termine de cargar su propio tag de GA4.
    if (
      gaMeasurementId &&
      !document.querySelector(`script[data-ga-id="${gaMeasurementId}"]`)
    ) {
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-ga-id', gaMeasurementId);
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
      document.head.appendChild(s);
      s.onload = () => {
        window.gtag!('js', new Date());
        window.gtag!('config', gaMeasurementId);
      };
    }
  }, []); // Solo al montar — los IDs son constantes

  return null;
}
