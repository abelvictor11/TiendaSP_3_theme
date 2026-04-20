/**
 * GtmLoader — Inyecta GTM y GA4 en el cliente vía useEffect.
 *
 * Usamos (window as any) para evitar conflictos de tipo con la declaración
 * de Window en CustomAnalytics.tsx (dataLayer: Record<string,unknown>[] vs any[]).
 * Un conflicto de tipos en global declarations causa error de build en Oxygen.
 */
import {useEffect} from 'react';

export function GtmLoader({
  gtmId,
  gaMeasurementId,
}: {
  gtmId?: string | null;
  gaMeasurementId?: string | null;
}) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;

    // 1. Inicializar dataLayer
    w.dataLayer = w.dataLayer ?? [];

    // 2. Definir gtag como función estándar (usa arguments — requerido por GA4)
    if (!w.gtag) {
      w.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer.push(arguments);
      };
    }

    // 3. Cargar contenedor GTM
    if (gtmId && !document.querySelector(`script[data-gtm-id="${gtmId}"]`)) {
      w.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-gtm-id', gtmId);
      s.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      document.head.appendChild(s);
    }

    // 4. Cargar gtag.js de GA4 directamente
    //    Garantiza window.gtag en el main window para que CustomAnalytics funcione.
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
