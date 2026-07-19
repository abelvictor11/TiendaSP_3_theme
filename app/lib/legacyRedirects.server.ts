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

/**
 * Looks up a legacy-URL redirect target for the given request pathname.
 *
 * Checks both the exact pathname and the trailing-slash-toggled variant,
 * since legacyRedirects.json entries aren't consistently normalized.
 *
 * Used by the catch-all route ($.tsx) for paths that don't match any other
 * route, and by the collection/product/page dedicated routes as a fallback
 * when the Storefront API lookup for the requested handle comes back
 * not-found — those routes are more specific than $.tsx, so Remix's router
 * matches them first for canonical-shaped legacy paths (e.g.
 * /collections/foo, /products/bar, /pages/baz) and $.tsx never gets a
 * chance to run for those 152 entries.
 */
export function getLegacyRedirectTarget(pathname: string): string | undefined {
  return (
    REDIRECTS[pathname] ??
    REDIRECTS[pathname.endsWith('/') ? pathname.slice(0, -1) : `${pathname}/`]
  );
}
