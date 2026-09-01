/**
 * Links the AttributionOS visitor id to the current cart, as a note_attribute
 * that survives onto the order. See app/lib/aosCartLink.ts (the client-side
 * caller) for the full "why" — this is the server half.
 *
 * A resource route (no default export) rather than reusing
 * app/routes/($locale).cart.tsx's existing AttributesUpdateInput handling:
 * that route only returns clean JSON for requests shaped like Remix's
 * internal fetcher convention (`?_data=<routeId>`), which is an
 * implementation detail, not a public contract — a plain fetch() without it
 * gets the full rendered HTML page back instead of the mutation result
 * (confirmed empirically against a real dev server). A route with no UI
 * component has no such ambiguity: every request is handled by action/loader
 * only, regardless of headers or query params.
 */
import {json, type ActionFunctionArgs} from '@shopify/remix-oxygen';

const AOS_VID_ATTR_KEY = '_aos_vid';
const MAX_VISITOR_ID_LENGTH = 128;

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({error: 'method not allowed'}, {status: 405});
  }

  let body: {visitorId?: unknown} | null = null;
  try {
    body = (await request.json()) as {visitorId?: unknown} | null;
  } catch {
    return json({error: 'invalid json'}, {status: 400});
  }

  const visitorId = body?.visitorId;
  if (
    typeof visitorId !== 'string' ||
    visitorId.length === 0 ||
    visitorId.length > MAX_VISITOR_ID_LENGTH
  ) {
    return json({error: 'invalid visitorId'}, {status: 400});
  }

  const {cart} = context;

  // Defense in depth, matching the client's own rule in aosCartLink.ts:
  // NEVER let this route create a cart. `updateAttributes` on a cart handler
  // with no cart id calls Shopify's cartCreate, which races the shopper's
  // own first add-to-cart -- whichever response's Set-Cookie the browser
  // applies last silently becomes the active cart, orphaning whichever one
  // it wasn't. The client already checks the `cart` cookie before calling
  // this route at all, but that's a cheap, un-trustworthy client-side
  // signal (cleared cookies, an unrelated caller); this is the check that
  // actually matters.
  if (!cart.getCartId()) {
    return json({error: 'no cart yet'}, {status: 409});
  }

  try {
    const result = await cart.updateAttributes([
      {key: AOS_VID_ATTR_KEY, value: visitorId},
    ]);
    if (result.userErrors && result.userErrors.length > 0) {
      // A real rejection from Shopify (e.g. a checkout-locked cart) — the
      // attribute was NOT written. Report failure rather than 200, so the
      // client doesn't persist its guard cookie against a write that didn't
      // happen.
      console.error(
        '[aos-link-cart] updateAttributes userErrors:',
        result.userErrors,
      );
      return json({error: 'cart update rejected'}, {status: 422});
    }
    if (!result.cart?.id) {
      return json({error: 'no cart in mutation result'}, {status: 502});
    }
    // Mirrors app/routes/($locale).cart.tsx's own action: refresh the cart
    // cookie from the mutation result rather than assuming it's unchanged.
    const headers = cart.setCartId(result.cart.id);
    return json({cartId: result.cart.id}, {headers});
  } catch (err) {
    // Best-effort by design (see aosCartLink.ts) -- log and respond, never
    // let a Storefront API hiccup surface as a broken request to the pixel.
    console.error('[aos-link-cart] updateAttributes failed:', err);
    return json({error: 'cart update failed'}, {status: 502});
  }
}

// No loader, no default export: Remix itself rejects any non-action method
// (e.g. GET) with its own 400 before this file's action() ever runs, since
// there is no loader defined. The explicit POST check above is belt-and-
// braces for whatever method Remix DOES dispatch to action().
