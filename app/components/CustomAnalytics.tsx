/**
 * CustomAnalytics — Puente entre Hydrogen Analytics y Meta Pixel / GA4 / dataLayer.
 *
 * Coloca este componente DENTRO de <Analytics.Provider> en root.tsx.
 * Funciona junto con los Web Pixels de Shopify (configurados en Admin).
 * Soluciona el problema de SPA: Hydrogen no recarga la página en cada navegación,
 * por lo que los pixels estándar solo ven el primer pageview.
 *
 * Eventos que maneja:
 *  - page_viewed        → fbq PageView / gtag page_view
 *  - product_viewed     → fbq ViewContent / gtag view_item
 *  - collection_viewed  → gtag view_item_list / dataLayer
 *  - cart_viewed        → gtag view_cart / dataLayer
 *  - product_add_to_cart→ fbq AddToCart / gtag add_to_cart
 *  - search_viewed      → fbq Search / gtag search
 */
import {useAnalytics, AnalyticsEvent} from '@shopify/hydrogen';
import type {
  PageViewPayload,
  ProductViewPayload,
  CollectionViewPayload,
  CartViewPayload,
  CartLineUpdatePayload,
  SearchViewPayload,
} from '@shopify/hydrogen';
import {useEffect} from 'react';
import {captureFbclid} from '~/lib/fbCookies';

// ── Tipos globales para fbq (Meta Pixel) y gtag (Google Analytics) ──────────
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
    ttq?: {
      page?: () => void;
      track?: (event: string, data?: Record<string, unknown>) => void;
      identify?: (data: Record<string, unknown>) => void;
    } & Record<string, unknown>;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pushDataLayer(event: string, data: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({event, ...data});
}

function fbqEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', event, data);
}

function gtagEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', event, data);
}

function ttqEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const ttq = window.ttq;
  if (ttq && typeof ttq.track === 'function') {
    ttq.track(event, data ?? {});
  }
}

// ── Componente ───────────────────────────────────────────────────────────────

export function CustomAnalytics() {
  const {subscribe} = useAnalytics();

  useEffect(() => {
    // Captura fbclid inmediatamente (solo una vez al montar)
    captureFbclid();

    // ── PAGE VIEW ─────────────────────────────────────────────────────────
    const unsubPage = subscribe(
      AnalyticsEvent.PAGE_VIEWED,
      (payload: PageViewPayload) => {
        // Por si el usuario navega a una URL con ?fbclid= sin recargar
        captureFbclid();

        // Meta Pixel: PageView en cada navegación SPA
        fbqEvent('PageView');

        // GA4: page_view en cada navegación SPA
        gtagEvent('page_view', {page_location: payload.url});

        // TikTok Pixel
        if (typeof window !== 'undefined' && window.ttq?.page) {
          window.ttq.page();
        }

        // GTM dataLayer
        pushDataLayer('page_view', {page_location: payload.url});
      },
    );

    // ── PRODUCT VIEW (ViewContent / view_item) ────────────────────────────
    const unsubProduct = subscribe(
      AnalyticsEvent.PRODUCT_VIEWED,
      (payload: ProductViewPayload) => {
        const product = payload.products?.[0];
        if (!product) return;

        const currency = payload.shop?.currency ?? 'COP';
        const price = parseFloat(product.price ?? '0');

        // Meta Pixel
        fbqEvent('ViewContent', {
          content_ids: [product.id],
          content_name: product.title,
          content_type: 'product',
          content_category: product.productType ?? '',
          value: price,
          currency,
        });

        // TikTok Pixel
        ttqEvent('ViewContent', {
          contents: [
            {
              content_id: product.id,
              content_name: product.title,
              price,
              quantity: 1,
            },
          ],
          content_type: 'product',
          value: price,
          currency,
        });

        // GA4 ecommerce
        const item = {
          item_id: product.variantId,
          item_name: product.title,
          item_brand: product.vendor,
          item_variant: product.variantTitle,
          price,
        };
        gtagEvent('view_item', {currency, value: price, items: [item]});

        // GTM dataLayer (clear ecommerce primero — buena práctica GA4)
        pushDataLayer('clear_ecommerce', {ecommerce: null});
        pushDataLayer('view_item', {
          ecommerce: {currency, value: price, items: [item]},
        });
      },
    );

    // ── ADD TO CART ───────────────────────────────────────────────────────
    const unsubAddToCart = subscribe(
      AnalyticsEvent.PRODUCT_ADD_TO_CART,
      (payload: CartLineUpdatePayload) => {
        const line = payload.currentLine;
        if (!line) return;

        const merchandise = line.merchandise as Record<string, unknown>;
        const productData = merchandise?.product as Record<string, unknown>;
        const price = parseFloat(
          (line.cost as any)?.totalAmount?.amount ?? '0',
        );
        const currency =
          (line.cost as any)?.totalAmount?.currencyCode ??
          payload.shop?.currency ??
          'COP';

        // Meta Pixel
        fbqEvent('AddToCart', {
          content_ids: [merchandise?.id],
          content_name: productData?.title,
          content_type: 'product',
          value: price,
          currency,
          num_items: line.quantity,
        });

        // TikTok Pixel
        ttqEvent('AddToCart', {
          contents: [
            {
              content_id: merchandise?.id,
              content_name: productData?.title,
              price: price / (line.quantity || 1),
              quantity: line.quantity,
            },
          ],
          content_type: 'product',
          value: price,
          currency,
        });

        // GA4
        const item = {
          item_id: merchandise?.id,
          item_name: productData?.title,
          item_brand: productData?.vendor,
          item_variant: merchandise?.title,
          price: price / (line.quantity || 1),
          quantity: line.quantity,
        };
        gtagEvent('add_to_cart', {currency, value: price, items: [item]});

        // GTM dataLayer
        pushDataLayer('clear_ecommerce', {ecommerce: null});
        pushDataLayer('add_to_cart', {
          ecommerce: {currency, value: price, items: [item]},
        });
      },
    );

    // ── COLLECTION VIEW ───────────────────────────────────────────────────
    const unsubCollection = subscribe(
      AnalyticsEvent.COLLECTION_VIEWED,
      (payload: CollectionViewPayload) => {
        const listId = payload.collection?.id ?? '';
        const listName = payload.collection?.handle ?? '';

        gtagEvent('view_item_list', {
          item_list_id: listId,
          item_list_name: listName,
        });

        pushDataLayer('clear_ecommerce', {ecommerce: null});
        pushDataLayer('view_item_list', {
          ecommerce: {item_list_id: listId, item_list_name: listName},
        });
      },
    );

    // ── SEARCH ────────────────────────────────────────────────────────────
    const unsubSearch = subscribe(
      AnalyticsEvent.SEARCH_VIEWED,
      (payload: SearchViewPayload) => {
        const term = payload.searchTerm ?? '';

        // Meta Pixel
        fbqEvent('Search', {search_string: term});

        // GA4
        gtagEvent('search', {search_term: term});

        // TikTok Pixel
        ttqEvent('Search', {query: term});

        // GTM dataLayer
        pushDataLayer('search', {search_term: term});
      },
    );

    // ── CART VIEW ─────────────────────────────────────────────────────────
    const unsubCart = subscribe(
      AnalyticsEvent.CART_VIEWED,
      (payload: CartViewPayload) => {
        const cartData = payload.cart;
        const currency =
          (cartData?.cost as any)?.totalAmount?.currencyCode ?? 'COP';
        const value = parseFloat(
          (cartData?.cost as any)?.totalAmount?.amount ?? '0',
        );
        const items = (cartData?.lines as any)?.nodes?.map((line: any) => {
          const merch = line.merchandise as any;
          return {
            item_id: merch?.id,
            item_name: merch?.product?.title,
            item_variant: merch?.title,
            price: parseFloat(line.cost?.totalAmount?.amount ?? '0'),
            quantity: line.quantity,
          };
        }) ?? [];

        gtagEvent('view_cart', {currency, value, items});

        pushDataLayer('clear_ecommerce', {ecommerce: null});
        pushDataLayer('view_cart', {ecommerce: {currency, value, items}});
      },
    );

    // Cleanup al desmontar
    return () => {
      unsubPage();
      unsubProduct();
      unsubAddToCart();
      unsubCollection();
      unsubSearch();
      unsubCart();
    };
  }, [subscribe]);

  // No renderiza nada — solo lógica de suscripción
  return null;
}
