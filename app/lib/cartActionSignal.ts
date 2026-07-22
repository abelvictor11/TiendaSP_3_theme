/**
 * Correlates Hydrogen's PRODUCT_ADD_TO_CART publish with a real click on
 * AddToCartButton, so CustomAnalytics can drop the false positive that
 * @shopify/hydrogen's CartAnalytics emits on the first cart resolution of a
 * fresh session: with `prevCart` still undefined, every line already sitting
 * in a resumed (non-empty) cart reads as "just added". Its only guard is a
 * localStorage timestamp, which doesn't survive cleared storage, a new
 * device, or a fresh in-app-browser session — all common for a visitor
 * returning via a retargeting ad with items already in their cart.
 *
 * AddToCartButton marks the timestamp on click; the subscriber only forwards
 * the event if a real click happened recently. A generous window absorbs
 * normal network latency for the cart mutation without risking a false
 * negative — a phantom firing on page load has no preceding click at all
 * this session, so it never falls inside the window by accident.
 */
const REAL_ADD_WINDOW_MS = 8000;

let lastRealAddAt = 0;

export function markRealCartAdd(): void {
  lastRealAddAt = Date.now();
}

export function wasRecentRealCartAdd(): boolean {
  return Date.now() - lastRealAddAt <= REAL_ADD_WINDOW_MS;
}
