import type {AppLoadContext, EntryContext} from '@shopify/remix-oxygen';
import {RemixServer} from '@remix-run/react';
import isbot from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  context: AppLoadContext,
) {
  const storeDomain = context.env.PUBLIC_STORE_DOMAIN;
  const shopifyDomain = context.env.PUBLIC_SHOPIFY_STORE_DOMAIN || storeDomain;
  const requestOrigin = new URL(request.url).origin;
  // Dominio de checkout (checkout.tienda-sportfitness.com): al ser el Primary
  // de Online Store, Shopify genera las URLs de media del CDN (/cdn/shop/...)
  // sobre él — debe estar permitido en el CSP o los videos no cargan.
  const checkoutCspDomain = 'https://checkout.tienda-sportfitness.com';

  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain,
    },
    scriptSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://analytics.google.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      'https://*.googletagmanager.com',
      'https://www.googleadservices.com',
      'https://googleads.g.doubleclick.net',
      'https://td.doubleclick.net',
      'https://pagead2.googlesyndication.com',
      // Addi widget
      'https://statics.addi.com',
      'https://cdn.addi.com',
      // Meta Pixel (fbevents.js)
      'https://connect.facebook.net',
      'https://www.facebook.com',
      // TikTok Pixel
      'https://analytics.tiktok.com',
      ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:*'] : []),
      'https://d3hw6dc1ow8pp2.cloudfront.net',
      'https://dov7r31oq5dkj.cloudfront.net',
      'https://cdn-static.okendo.io',
      'https://surveys.okendo.io',
      'https://api.okendo.io',
      'https://www.google.com',
      'https://www.gstatic.com',
    ],
    defaultSrc: [
      "'self'",
      'localhost:*',
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://d3hw6dc1ow8pp2.cloudfront.net',
      'https://d3g5hqndtiniji.cloudfront.net',
      'https://dov7r31oq5dkj.cloudfront.net',
      'https://cdn-static.okendo.io',
      'https://surveys.okendo.io',
      'https://api.okendo.io',
      'data:',
    ],
    imgSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'data:',
      'https://d3hw6dc1ow8pp2.cloudfront.net',
      'https://d3g5hqndtiniji.cloudfront.net',
      'https://dov7r31oq5dkj.cloudfront.net',
      'https://cdn-static.okendo.io',
      'https://surveys.okendo.io',
      // Meta Pixel tracking beacons
      'https://www.facebook.com',
      'https://connect.facebook.net',
      // Google Analytics / Ads beacons
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://analytics.google.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      'https://*.googletagmanager.com',
      'https://www.google.com',
      // Google Ads dispara beacons de remarketing desde el dominio por país
      'https://www.google.com.co',
      'https://region1.google-analytics.com',
      'https://www.googleadservices.com',
      'https://googleads.g.doubleclick.net',
      'https://stats.g.doubleclick.net',
      'https://ad.doubleclick.net',
      'https://pagead2.googlesyndication.com',
      // TikTok
      'https://analytics.tiktok.com',
      // Addi widget
      'https://statics.addi.com',
      'https://cdn.addi.com',
      // Shopify Analytics
      `https://${shopifyDomain}`,
      'https://*.myshopify.com',
      checkoutCspDomain,
      requestOrigin,
    ],
    mediaSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://d3hw6dc1ow8pp2.cloudfront.net',
      'https://d3g5hqndtiniji.cloudfront.net',
      'https://dov7r31oq5dkj.cloudfront.net',
      'https://cdn-static.okendo.io',
      `https://${shopifyDomain}`,
      `https://${storeDomain}`,
      'https://*.myshopify.com',
      checkoutCspDomain,
      requestOrigin,
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://cdn.shopify.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://d3hw6dc1ow8pp2.cloudfront.net',
      'https://cdn-static.okendo.io',
      'https://surveys.okendo.io',
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
      'https://d3hw6dc1ow8pp2.cloudfront.net',
      'https://dov7r31oq5dkj.cloudfront.net',
      'https://cdn.shopify.com',
      'https://cdn-static.okendo.io',
      'https://surveys.okendo.io',
    ],
    connectSrc: [
      "'self'",
      'https://monorail-edge.shopifysvc.com',
      'localhost:*',
      'ws://localhost:*',
      'ws://127.0.0.1:*',
      // Shopify (consent tracking API + web pixels)
      'https://cdn.shopify.com',
      'https://shopify.com',
      // Okendo
      'https://api.okendo.io',
      'https://cdn-static.okendo.io',
      'https://surveys.okendo.io',
      // Error tracking
      'https://api.raygun.com',
      // Google Analytics / GTM / Ads
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://*.googletagmanager.com',
      'https://analytics.google.com',
      'https://*.analytics.google.com',
      'https://region1.google-analytics.com',
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://www.googleadservices.com',
      'https://googleads.g.doubleclick.net',
      'https://td.doubleclick.net',
      'https://stats.g.doubleclick.net',
      'https://ad.doubleclick.net',
      'https://pagead2.googlesyndication.com',
      // Addi widget
      'https://statics.addi.com',
      'https://cdn.addi.com',
      'https://api.addi.com',
      // Meta Pixel
      'https://www.facebook.com',
      'https://connect.facebook.net',
      // TikTok Pixel
      'https://analytics.tiktok.com',
      'https://business-api.tiktok.com',
      // Klaviyo
      'https://a.klaviyo.com',
      'https://static.klaviyo.com',
      // RudderStack (CDP propio, self-hosted data plane vía Cloudflare Tunnel)
      'https://cdp.tienda-sportfitness.com',
    ],
    // Web pixels de Shopify corren en iframes sandbox - necesitan estos dominios
    frameSrc: [
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://*.shopifysvc.com',
      'https://www.googletagmanager.com',
      'https://googleads.g.doubleclick.net',
      'https://td.doubleclick.net',
      'https://www.facebook.com',
      'https://connect.facebook.net',
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
