/**
 * Store-specific configuration.
 *
 * Each branch (cyclewear, bicimarket, tienda-fitness, etc.) maintains its own
 * version of this file so that logos, favicons, and other brand assets never
 * collide when merging shared code changes.
 *
 * To avoid merge conflicts, add this file to your merge strategy:
 *   git config merge.ours.driver true
 *   echo "app/config/store.ts merge=ours" >> .gitattributes
 */

export const storeConfig = {
  /** Main header logo */
  logoUrl:
    'https://cdn.shopify.com/s/files/1/0931/1168/1396/files/LOGO_FITSHOP_2.svg?v=1756830247',

  /** Favicon URL — can be .svg, .png, or .ico */
  faviconUrl:
    'https://cdn.shopify.com/s/files/1/0931/1168/1396/files/favicon.png?v=1773973579',

  /** Sticky header mini logo — SVG markup or text fallback */
  stickyLogoText: '',
  stickyLogoSvg: `<img src="https://cdn.shopify.com/s/files/1/0931/1168/1396/files/LOGO_FITSHOP_2.svg?v=1756830247" alt="Fit Shop" style="height:32px;" />`,
} as const;
