/**
 * Correlates Hydrogen's PRODUCT_ADD_TO_CART publish with a real cart
 * mutation, so CustomAnalytics can drop the false positive that
 * @shopify/hydrogen's CartAnalytics emits on the first cart resolution of a
 * fresh session: with `prevCart` still undefined, every line already sitting
 * in a resumed (non-empty) cart reads as "just added". Its only guard is a
 * localStorage timestamp, which doesn't survive cleared storage, a new
 * device, or a fresh in-app-browser session — all common for a visitor
 * returning via a retargeting ad with items already in their cart.
 *
 * Tracked against the actual fetcher lifecycle (via CartActionTracker,
 * mounted inside each CartForm's render-prop), not a fixed click-to-event
 * window — a mutation stays "pending" for as long as it actually takes, so a
 * slow connection or a multi-line "Buy again" submit is never mistaken for a
 * phantom page-load firing regardless of how long the network round trip
 * runs. The grace window only starts counting once the mutation settles,
 * covering CartAnalytics' own async resolve+diff cycle that follows.
 */
const GRACE_MS = 8000;

let pendingCount = 0;
let settledAt = 0;

export function markCartActionPending(): void {
  pendingCount += 1;
}

export function markCartActionSettled(): void {
  pendingCount = Math.max(0, pendingCount - 1);
  settledAt = Date.now();
}

export function wasRecentRealCartAdd(): boolean {
  return pendingCount > 0 || Date.now() - settledAt <= GRACE_MS;
}
