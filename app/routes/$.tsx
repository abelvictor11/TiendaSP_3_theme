import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import legacyRedirects from '~/data/legacyRedirects.json';

// Redirect map for URLs from the pre-Hydrogen storefronts (WooCommerce, then
// Shopify Liquid) that don't exist under the current URL structure. Sourced
// from Google Search Console's "Not found (404)" report (2026-07-19) matched
// against the live product/collection/page catalog — see
// docs/TRAFFIC_SALES_DECLINE_ANALYSIS_2026_07_19.md in the klaviyo-migration
// repo for how this was built. Bundled as a static file rather than queried
// from Shopify's Admin API at request time: the Storefront API (the only
// Shopify API this app's runtime has credentials for) doesn't expose
// urlRedirects, and adding an Admin API secret to Oxygen just for 404
// lookups isn't worth the extra credential surface. Shopify's native URL
// Redirects table (Admin > Online Store > Navigation) is the source of
// truth this file was generated from — regenerate it there if redirects
// change, this file doesn't update itself.
const REDIRECTS: Record<string, string> = legacyRedirects;

export async function loader({request}: LoaderFunctionArgs) {
  const {pathname} = new URL(request.url);
  const target =
    REDIRECTS[pathname] ??
    REDIRECTS[pathname.endsWith('/') ? pathname.slice(0, -1) : `${pathname}/`];

  if (target) {
    return redirect(target, 301);
  }

  throw new Response('Not found', {status: 404});
}

export default function Component() {
  return null;
}
