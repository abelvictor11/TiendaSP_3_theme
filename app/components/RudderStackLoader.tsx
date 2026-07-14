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
 * Mientras ese chunk se descarga, `window.rudderanalytics` se deja como un
 * array con métodos proxy — el mismo patrón que usa el snippet oficial de
 * carga por CDN — que encola cada llamada como `[method, ...args]`. Sin esto,
 * el PAGE_VIEWED inicial (o un PRODUCT_VIEWED si se aterriza directo en un
 * PDP), disparado por CustomAnalytics.tsx justo al montar, se perdería por
 * completo mientras el SDK real todavía se está descargando.
 *
 * El propio constructor de `RudderAnalytics` (ver node_modules/@rudderstack/
 * analytics-js) detecta que `window.rudderanalytics` es un array, dispara el
 * `load(writeKey, dataPlaneUrl)` ya encolado y reproduce el resto de eventos
 * — por eso NO se debe llamar `.load()` de nuevo después de construirlo.
 *
 * CustomAnalytics.tsx es dueño de disparar los eventos (page/track) en cada
 * navegación SPA, igual que con GTM/Meta Pixel/TikTok — este loader solo
 * inicializa el cliente y lo expone en window.rudderanalytics.
 */
import {useEffect} from 'react';

const PRELOAD_METHODS = [
  'load',
  'page',
  'track',
  'identify',
  'alias',
  'group',
  'ready',
  'reset',
  'getAnonymousId',
  'setAnonymousId',
];

function ensurePreloadQueue(): any {
  const w = window as any;
  if (w.rudderanalytics) return w.rudderanalytics; // ya es una queue o el SDK real

  const queue: any = [];
  PRELOAD_METHODS.forEach((method) => {
    queue[method] = (...args: unknown[]) => {
      queue.push([method, ...args]);
    };
  });
  w.rudderanalytics = queue;
  return queue;
}

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
    // Ya inicializado con el SDK real (no un array-queue) — evita doble init
    // en HMR/StrictMode.
    if (w.rudderanalytics && !Array.isArray(w.rudderanalytics)) return;

    const queue = ensurePreloadQueue();
    queue.load(writeKey, dataPlaneUrl);

    let cancelled = false;
    import('@rudderstack/analytics-js/bundled').then(({RudderAnalytics}) => {
      if (cancelled) return;
      // El constructor detecta el `load` recién encolado arriba y se
      // auto-inicializa con esos args (ver comentario de arriba).
      // eslint-disable-next-line no-new
      new RudderAnalytics();
    });

    return () => {
      cancelled = true;
    };
  }, [writeKey, dataPlaneUrl]);

  return null;
}
