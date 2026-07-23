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
 *   La disponibilidad de `Shopify.customerPrivacy` en sí se obtiene de
 *   `customerPrivacy` (useAnalytics()/<Analytics.Provider>), NO con un
 *   polling propio contra `window.Shopify.customerPrivacy` — ese patrón
 *   corría en una ventana de carrera contra el `wait_for_update` de Consent
 *   Mode y perdía la atribución del primer hit de la sesión si el script de
 *   Customer Privacy de Shopify tardaba en cargar (ver historial de PRs).
 *
 * Por qué useEffect + createElement en vez de <script nonce> en SSR:
 *   Scripts con nonce en el <head> de React pueden ser bloqueados por CSP
 *   o eliminados durante la hidratación. Scripts cargados con createElement
 *   son siempre evaluados por el browser y detectados por Tag Assistant.
 *
 *   `isLikelyBot()` (ver app/lib/botDetection.ts) también bloquea la carga
 *   de scripts aquí, independientemente del consentimiento — cubre
 *   crawlers de IA (GPTBot, ClaudeBot, etc.) y frameworks de automatización
 *   (Puppeteer, Playwright, Selenium) que sí ejecutan JavaScript y de otro
 *   modo contaminarían GA4/Meta/Ads/TikTok como un visitante real.
 */
import {useEffect, useState} from 'react';
import {useAnalytics} from '@shopify/hydrogen';
import {isLikelyBot} from '~/lib/botDetection';

type ConsentState = {analytics: boolean; marketing: boolean};

function readConsentFrom(cp: any): ConsentState {
  try {
    return {
      analytics: cp?.analyticsProcessingAllowed?.() === true,
      marketing: cp?.marketingAllowed?.() === true,
    };
  } catch {
    return {analytics: false, marketing: false};
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
  const {customerPrivacy} = useAnalytics();
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    marketing: false,
  });

  // ── 0a. Google Consent Mode v2: default "denied" ─────────────────────────
  // Corre de inmediato al montar, ANTES de que cargue gtag.js/gtm.js (los
  // comandos se encolan en dataLayer y gtag los procesa en orden al cargar).
  // Sin esto, Google recibe los hits como "sin consentimiento declarado" y
  // los limita/descarta para Ads aunque el evento llegue.
  useEffect(() => {
    const w = window as any;
    // Flag global para que otros handlers (ej. begin_checkout en el cart)
    // sepan qué vía usar sin prop-drilling.
    w.__gtmOwnsTags = gtmOwnsTags === true;

    w.dataLayer = w.dataLayer ?? [];
    if (!w.gtag) {
      w.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer.push(arguments);
      };
    }
    if (!w.__consentModeDefaultSet) {
      w.__consentModeDefaultSet = true;
      w.gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        // Margen defensivo mientras se resuelve el consentimiento real (ver
        // efecto 0b) — antes este valor estaba en 500ms, empatado con un
        // polling propio del mismo intervalo, sin margen si el script de
        // Customer Privacy de Shopify tardaba más en cargar. El primer hit
        // de la sesión (el que más pesa para atribución de canal) corría
        // entonces con consentimiento denegado por defecto.
        wait_for_update: 2000,
      });
    }
  }, [gtmOwnsTags]);

  // ── 0b. Refleja el consentimiento real (Customer Privacy API) ───────────
  // `customerPrivacy` viene de useAnalytics()/<Analytics.Provider> — el
  // mismo mecanismo de espera que ya usa CustomAnalytics.tsx para no perder
  // el primer PAGE_VIEWED, en vez de reimplementar un polling propio contra
  // `window.Shopify.customerPrivacy` (ver nota arriba). Este efecto
  // simplemente no hace nada hasta que `customerPrivacy` deja de ser null;
  // no hay temporizador que perder.
  useEffect(() => {
    if (!customerPrivacy) return;
    const w = window as any;

    const emitConsentSignals = (c: ConsentState) => {
      // Google Consent Mode v2: refleja el estado del Customer Privacy API
      w.gtag('consent', 'update', {
        analytics_storage: c.analytics ? 'granted' : 'denied',
        ad_storage: c.marketing ? 'granted' : 'denied',
        ad_user_data: c.marketing ? 'granted' : 'denied',
        ad_personalization: c.marketing ? 'granted' : 'denied',
      });
      // Meta Pixel: si fbq ya existe, sincroniza grant/revoke
      if (typeof w.fbq === 'function') {
        w.fbq('consent', c.marketing ? 'grant' : 'revoke');
      }
    };

    const update = () => {
      // Refleja el estado actual (no acumulativo): si el visitante revoca
      // consentimiento, los flags vuelven a false y los emisores dejan de
      // enviar (los scripts ya cargados no se pueden descargar, pero los
      // helpers verifican consentimiento al emitir cada evento).
      const c = readConsentFrom(customerPrivacy);
      setConsent(c);
      emitConsentSignals(c);
    };

    // Ya respondido en visita anterior / región sin banner
    update();

    // El banner nativo de Shopify dispara este evento al responder
    document.addEventListener('visitorConsentCollected', update);
    return () =>
      document.removeEventListener('visitorConsentCollected', update);
  }, [customerPrivacy]);

  // ── A. Analytics permitido → GTM + GA4 ──────────────────────────────────
  useEffect(() => {
    if (!consent.analytics || isLikelyBot()) return;
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
    if (!consent.marketing || isLikelyBot()) return;
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

      // Consentimiento explícito ANTES del init: este efecto solo corre con
      // marketing permitido, así que declaramos grant (Meta por defecto
      // asume grant, pero declararlo deja el estado consistente si luego
      // se revoca vía emitConsentSignals).
      w.fbq('consent', 'grant');
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
