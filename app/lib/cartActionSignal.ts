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
 *
 * Known residual gap (Codex review, #63): CartAnalytics doesn't actually
 * diff against this fetcher at all — it watches the `cart` prop root.tsx
 * passes to <Analytics.Provider>, which is root's OWN loader cart, deferred
 * and re-fetched by Remix's automatic revalidation after ANY fetcher
 * action settles (confirmed directly in @shopify/hydrogen's CartAnalytics
 * source: it Promise.resolve()s the `cart` prop and diffs on that
 * resolution, not on this fetcher's state). So "this CartForm's fetcher
 * went idle" and "root's cart promise has been re-fetched and resolved"
 * are two separate async chains that merely tend to overlap — on a slow
 * connection, root's revalidation round-trip (which only starts after
 * this fetcher's own action completes) can still outlast the window
 * below. A structurally correct fix would track root's own cart
 * revalidation lifecycle directly, not this fetcher's — deferred pending
 * a way to verify that against a live app (this fixed window is a
 * pragmatic mitigation, not a guarantee). GRACE_MS is intentionally more
 * generous than the original 8s for exactly this reason.
 */
const GRACE_MS = 15000;

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
