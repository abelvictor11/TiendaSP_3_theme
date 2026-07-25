# Checkout handoff review (2026-07-25)

Task #78, last unreviewed page. Hydrogen doesn't host its own checkout —
every path ends in a redirect to Shopify's hosted checkout via a
`checkoutUrl`. This reviews that handoff end to end.

## Solid, no action needed
- **UTM/click-ID attribution on the normal cart→checkout flow**
  (`app/lib/checkoutContinuity.ts`): `decorateCheckoutUrl`, called from
  both the cart drawer (`Cart.tsx`) and the full `/cart` page, correctly
  preserves `utm_source/medium/campaign/term/content`, `gclid`, `fbclid`
  via a 90-day cookie, last-click attribution.
- **Checkout domain**: `checkout.tienda-sportfitness.com`, a proper
  first-party subdomain of the storefront's own domain — no cookie/session
  mismatch risk between storefront and checkout.
- **Discount code plumbing**: confirmed live via a direct Storefront API
  test — a real active code (`BIENVENIDA5`) correctly attaches to
  `cart.discountCodes` when applied via the cart API and flows through to
  the real `checkoutUrl` Shopify returns. (It came back `applicable: false`
  for the test cart's contents — a Shopify-side discount eligibility rule,
  not a storefront bug; the code reaches checkout, whether it's valid for
  a given cart is Shopify's own discount-rule evaluation.)
- **Post-click purchase tracking**: server-side via `orders/create`/
  `orders/paid` webhooks + Shopify's Web Pixels API inside the checkout
  iframe, deduplicated by order ID — already documented in
  `docs/TRACKING_SETUP.md`, not rebuilt here.

## Fixed this session

### 1. Hardcoded checkout domain in CSP (`app/entry.server.tsx`)
`checkoutCspDomain` was a literal string
(`'https://checkout.tienda-sportfitness.com'`) duplicating
`PUBLIC_CHECKOUT_DOMAIN` — if the checkout domain ever changes, this would
silently drift out of sync and break video/media loading. Now derived from
the env var directly, with the two CSP array insertions (`imgSrc`,
`mediaSrc`) guarded against `undefined` if the var is ever unset.

### 2. Attribution silently dropped on the cart-permalink route (real gap, not cosmetic)
`app/routes/($locale).cart.$lines.tsx` implements Shopify's standard
"add-to-cart-and-redirect-straight-to-checkout" deep link
(`/cart/<variantId>:<qty>?discount=CODE` — the pattern used for
"Buy Now"-style ad/email/SMS links that skip the storefront cart entirely).
This loader redirects server-side, before any client JS runs — but
`decorateCheckoutUrl` is guarded by `typeof window === 'undefined'` and
reads from a cookie written by client-side JS. **Any campaign using this
exact link pattern would lose 100% of its UTM/gclid/fbclid attribution** —
revenue wouldn't be lost (the order still completes), but it would show up
as direct/unattributed traffic instead of the real channel/campaign. This
matters directly for the next priority tier (ads).

Fixed by extracting a pure, isomorphic `appendMarketingParamsToCheckoutUrl`
helper (no `window`/cookie dependency) from `checkoutContinuity.ts`, reused
by both the existing browser-side `decorateCheckoutUrl` and this loader —
which now reads the same UTM/click-ID params directly off the incoming
request URL (first-touch, no cookie needed since the params are right
there) before redirecting.

**Verified live** (local dev, real product variant + real active discount
code):
```
curl -D - "http://localhost:3001/cart/41903612362829:1?discount=BIENVENIDA5&utm_source=google&utm_medium=cpc&utm_campaign=test_campaign&gclid=TEST123"
```
Before the fix: redirected straight to a bare Shopify checkout cart URL, no
params. After: `location:` header includes
`...&utm_source=google&utm_medium=cpc&utm_campaign=test_campaign&gclid=TEST123`
appended to the real checkout URL.

## Task #78 status: complete
All four pages reviewed — PDP (OOS cross-sell, shipped PR #83/#98e532c),
cart drawer (free-shipping progress bar, shipped PR #84, wired to the real
Shopify discount rule), search (partial-match fix shipped PR #89, synonym
config blocked on a manual Shopify Admin step), checkout handoff (this
doc, two fixes shipped).
