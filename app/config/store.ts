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
  /** Main header logo (used in Logo.tsx) */
  logoUrl:
    'https://cdn.shopify.com/s/files/1/0572/4710/5098/files/Logo_cyclewear_6f22636c-8e2b-49f0-8ca3-2c7e8582bcc7.svg?v=1770484353',

  /** Favicon URL — can be .svg, .png, or .ico */
  faviconUrl:
    'https://cdn.shopify.com/s/files/1/0572/4710/5098/files/Logo_cyclewear_6f22636c-8e2b-49f0-8ca3-2c7e8582bcc7.svg?v=1770484353',

  /** Sticky header mini logo — inline SVG path data (CWR icon) */
  stickyLogoSvg: `<path d="M110.087,114.388h-87.92c-9.399,0-15.147-7.664-12.796-17.063l16.782-67.094c2.351-9.399,11.933-17.063,21.332-17.063h87.92c9.544,0,15.146,7.664,12.796,17.063l-3.328,13.303H120.58l3.002-12.002H50.123L33.991,96.025h73.46l3.033-12.077h24.293l-3.358,13.378C129.068,106.724,119.63,114.388,110.087,114.388z M268.802,114.388h-34.416l-0.722-4.049l-4.733-25.594l-17.392,25.594l-2.893,4.049h-34.272l-18.641-101.22h26.463l15.245,82.422l24.624-36.005l1.808-2.603l-6.105-33.403l-2.023-10.411h24.149l8.129,43.814l0.505,2.603l6.61,36.005l50.178-73.226l-14.552-9.196h47.317L268.802,114.388z M436.227,72.802h-19.495l26.158,41.585h-30.354l-26.293-41.585l-32.694,0l5.74-18.364h74.302l5.731-22.905h-73.459l-20.726,82.855h-24.293l25.319-101.22h104.983c9.544,0,15.146,7.664,12.796,17.063l-6.382,25.508C455.207,65.138,445.771,72.802,436.227,72.802z"/>`,

  /** SVG viewBox for the sticky header logo */
  stickyLogoViewBox: '0 0 473.321 127.556',
} as const;
