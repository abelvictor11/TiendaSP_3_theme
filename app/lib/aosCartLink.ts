/**
 * Links the AttributionOS visitor id (_aos_vid) to the Shopify cart, so it
 * survives onto the order as a note_attribute.
 *
 * WHY THIS EXISTS (IDATTROS-51/53): AttributionOS's own orders/paid webhook
 * delivers the completed ORDER, but has no way to know which visitor placed
 * it unless the order itself carries that id. Without this link, pixel
 * pageviews (with their gclid/fbclid/utm_source) and the order that resulted
 * from them can never be joined — the visit and the purchase are recorded,
 * but nothing connects them.
 *
 * HOW: posts to the resource route app/routes/api.aos-link-cart.tsx, which
 * calls the Hydrogen cart handler's updateAttributes (Storefront API
 * cartAttributesUpdate mutation).
 *
 * CRITICAL SAFETY RULE — never trigger cart creation: `updateAttributes` on
 * a cart handler with no existing cart id calls Shopify's `cartCreate` and
 * returns a Set-Cookie for a brand-new, empty cart. An earlier version of
 * this file called that unconditionally on every pageview, including before
 * any cart existed. That races the shopper's own first add-to-cart: if our
 * response's Set-Cookie is processed by the browser after theirs, it
 * silently overwrites the `cart` cookie to point at our empty, tagged cart —
 * orphaning the cart that actually has the item they just added, with the
 * item vanishing from checkout/cart-page reload and no error anywhere.
 *
 * The fix is structural, not a guard: this function now REFUSES to run
 * unless a cart id is already known (either Hydrogen's own `cart` cookie is
 * already set, or the caller passes one straight from a cart event). It
 * never creates a cart itself. See AttributionOSPixel.tsx for the two call
 * sites this requires: PAGE_VIEWED (cart already exists from a prior visit)
 * and CART_UPDATED (cart was JUST created/changed by the shopper's own
 * action, so tagging it here cannot race that creation — it already
 * happened).
 *
 * GUARD: keyed to the cart id, not to time — a repeat buyer gets a fresh
 * cart after checkout, and the link must be re-established for that new
 * cart. The guard is written host-only (no domain attribute), matching the
 * scope Hydrogen's own `cart` cookie uses — the shared writeCookie() helper
 * forces an apex-domain cookie, which would make the guard readable across
 * apex/www even though the `cart` cookie it's compared against might not be,
 * causing false "already linked" reads. Persisted only on a CONFIRMED
 * success (the server route validates Shopify's own userErrors, not just
 * HTTP status) — a failed or errored attempt writes nothing, so the next
 * pageview or cart event retries rather than being silently blackholed for
 * 30 days by one transient failure.
 */
import {readCookie} from '~/lib/cookieUtils';

const GUARD_COOKIE = '_aos_cart_link_state';

function readHostOnlyCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(
      '(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)',
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeHostOnlyCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : ''
  }`;
}

/**
 * @param visitorId The AttributionOS visitor id.
 * @param knownCartId Pass this from a CART_UPDATED event's `payload.cart.id`
 *   — it is authoritative and avoids depending on the `cart` cookie having
 *   propagated to `document.cookie` yet in the same tick. Omit to fall back
 *   to reading the cookie (safe for a plain pageview on a return visit).
 */
export function linkVisitorToCart(
  visitorId: string,
  knownCartId?: string | null,
): void {
  if (!visitorId || typeof document === 'undefined') return;

  const rawCartId = knownCartId || readCookie('cart');
  // No cart yet — do nothing. Creating one here is exactly the bug this
  // rewrite exists to remove.
  if (!rawCartId) return;

  const cartId = rawCartId.includes('/')
    ? rawCartId.split('/').pop()!
    : rawCartId;
  const guardState = readHostOnlyCookie(GUARD_COOKIE);
  if (guardState === `${cartId}:${visitorId}`) return; // already confirmed for this cart

  fetch('/api/aos-link-cart', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({visitorId}),
    credentials: 'same-origin',
    keepalive: true,
  })
    .then(async (res) => {
      // Non-2xx covers both transport failure and the route's own 422 for a
      // Shopify-side userErrors rejection (e.g. a checkout-locked cart) — in
      // both cases the write did not actually happen, so leave the guard
      // unset and let the next pageview/cart event try again.
      if (!res.ok) return;
      const data = (await res.json().catch(() => null)) as {
        cartId?: string;
      } | null;
      if (data?.cartId) {
        const confirmedCartId = data.cartId.split('/').pop() || cartId;
        writeHostOnlyCookie(
          GUARD_COOKIE,
          `${confirmedCartId}:${visitorId}`,
          30,
        );
      }
    })
    .catch(() => {
      // Best-effort: never let this affect the shopper's session.
    });
}
