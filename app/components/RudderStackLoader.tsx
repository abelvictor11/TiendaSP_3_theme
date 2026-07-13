/**
 * RudderStackLoader — Inicializa el SDK de RudderStack (@rudderstack/analytics-js)
 * en el main window vía useEffect.
 *
 * Usa el import "bundled" (no CDN) para que todo el código del SDK quede
 * empacado en nuestro propio bundle de build — evita tener que añadir un
 * dominio externo a scriptSrc en el CSP. Solo hace falta permitir el Data
 * Plane URL en connect-src (las llamadas HTTP reales del SDK al enviar
 * eventos), ver entry.server.tsx.
 *
 * El import es dinámico (`await import(...)` dentro del useEffect) a propósito:
 * este componente se renderiza dentro del árbol SSR de root.tsx, y un import
 * estático del SDK (~200KB) terminaba empacado también en el bundle de
 * servidor (dist/server/index.js) aunque nunca se ejecuta ahí — solo corre
 * en el useEffect, client-side. El import dinámico lo separa en su propio
 * chunk que el browser pide bajo demanda, sin tocar el bundle SSR.
 *
 * CustomAnalytics.tsx es dueño de disparar los eventos (page/track) en cada
 * navegación SPA, igual que con GTM/Meta Pixel/TikTok — este loader solo
 * inicializa el cliente y lo expone en window.rudderanalytics.
 */
import {useEffect} from 'react';

export function RudderStackLoader({
  writeKey,
  dataPlaneUrl,
}: {
  writeKey?: string | null;
  dataPlaneUrl?: string | null;
}) {
  useEffect(() => {
    if (!writeKey || !dataPlaneUrl) return;
    const w = window as any;
    if (w.rudderanalytics) return; // ya inicializado (evita doble init en HMR/StrictMode)

    let cancelled = false;
    import('@rudderstack/analytics-js/bundled').then(({RudderAnalytics}) => {
      if (cancelled || w.rudderanalytics) return;
      const analytics = new RudderAnalytics();
      analytics.load(writeKey, dataPlaneUrl);
      w.rudderanalytics = analytics;
    });

    return () => {
      cancelled = true;
    };
  }, [writeKey, dataPlaneUrl]);

  return null;
}
