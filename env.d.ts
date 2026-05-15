/// <reference types="vite/client" />
/// <reference types="@shopify/remix-oxygen" />
/// <reference types="@shopify/oxygen-workers-types" />

import type {
  WithCache,
  HydrogenCart,
  HydrogenSessionData,
} from '@shopify/hydrogen';
import type {Storefront, CustomerAccount} from '~/lib/type';
import type {AppSession} from '~/lib/session.server';

declare global {
  /**
   * A global `process` object is only available during build to access NODE_ENV.
   */
  const process: {env: {NODE_ENV: 'production' | 'development'}};

  /**
   * Declare expected Env parameter in fetch handler.
   */
  interface Env {
    SESSION_SECRET: string;
    PUBLIC_STOREFRONT_API_TOKEN: string;
    PRIVATE_STOREFRONT_API_TOKEN: string;
    PUBLIC_STORE_DOMAIN: string;
    PUBLIC_STOREFRONT_ID: string;
    PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: string;
    PUBLIC_CUSTOMER_ACCOUNT_API_URL: string;
    PUBLIC_CHECKOUT_DOMAIN: string;
    // MY CUSTOM ENV
    PUBLIC_SHOPIFY_STORE_DOMAIN: string;
    PUBLIC_STORE_CDN_STATIC_URL: string;
    PUBLIC_IMAGE_FORMAT_FOR_PRODUCT_OPTION: string;
    PUBLIC_OKENDO_SUBSCRIBER_ID: string;
    SHOP_ID: string;
    ADMIN_API_ACCESS_TOKEN?: string;
    // Tracking / Analytics
    PUBLIC_GTM_ID?: string;
    PUBLIC_GA_MEASUREMENT_ID?: string;
    PUBLIC_GOOGLE_ADS_ID?: string;
    PUBLIC_META_PIXEL_ID?: string;
    PUBLIC_TIKTOK_PIXEL_ID?: string;
    // Server-side tracking (Meta CAPI / GA4 Measurement Protocol / TikTok Events API)
    META_CAPI_ACCESS_TOKEN?: string;
    META_TEST_EVENT_CODE?: string;
    GA4_API_SECRET?: string;
    TIKTOK_EVENTS_TOKEN?: string;
    SHOPIFY_WEBHOOK_SECRET?: string;
  }
}

declare module '@shopify/remix-oxygen' {
  /**
   * Declare local additions to the Remix loader context.
   */
  export interface AppLoadContext {
    waitUntil: ExecutionContext['waitUntil'];
    session: AppSession;
    storefront: Storefront;
    customerAccount: CustomerAccount;
    cart: HydrogenCart;
    env: Env;
  }

  /**
   * Declare local additions to the Remix session data.
   */
  interface SessionData extends HydrogenSessionData {}
}

// Needed to make this file a module.
export {};
