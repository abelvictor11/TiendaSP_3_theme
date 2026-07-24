# Cyclewear → tienda audit: deferred items (2026-07-24)

Follow-up to `docs/CYCLEWEAR_PORT_EVALUATION_2026_07.md`. A full scan of the
`cyclewear` branch (186 files diffed against `tienda`) turned up 10 confirmed,
low-risk fixes — shipped in PR #77 — plus the items below, which were
deliberately **not** ported yet. Keeping them written down so they don't get
rediscovered from scratch.

## Reverted after shipping: quantity cap by `quantityAvailable`

Originally item #6 of the confirmed batch (PR #77): cap the PDP quantity
selector by the variant's real `quantityAvailable` instead of
`NcInputNumber`'s hardcoded default of 99.

**Reverted** after live-testing against the real store: `quantityAvailable`
requires the `unauthenticated_read_product_inventory` Storefront API access
scope, which this store's Hydrogen storefront API token does not have.
Querying it returns a field-level GraphQL error
(`Access denied for quantityAvailable field`) on every single product page
load. It doesn't currently break the page — Shopify's Storefront API
returns partial data with a field-level `errors` entry rather than failing
the whole query, and the code's own `typeof ... === 'number'` check already
treated a `null`/missing value as "no cap" — but it means the fix was a
silent no-op in practice while logging a GraphQL access-denied error on
every PDP request, which is worse than not having the fix at all (log
noise, wasted diagnosis time later, and misleading code that looks like it
works but never does).

**To actually ship this**: enable `unauthenticated_read_product_inventory`
on the Storefront API access scopes for the `TiendaSportfitnes_3` custom
storefront in Shopify Admin (Hydrogen → Storefront API → access scopes),
then re-add `quantityAvailable` to `PRODUCT_VARIANT_FRAGMENT` in
`app/routes/($locale).products.$productHandle.tsx` and the `maxQty`
clamping logic in `ProductForm` (both were written correctly — reverted
code is straightforward to redo, just needs the scope granted first). This
is a Shopify Admin settings change, not a code change, so it needs explicit
sign-off before doing it.

## Plausible, needs care before shipping (not blind copies)

### 1. CSP: add `'strict-dynamic'` to `scriptSrc`
`app/entry.server.tsx`

`GtmLoader.tsx` injects GTM/GA4/Ads/Meta/TikTok scripts via
`document.createElement` (deliberately, per its own docstring — nonced
`<script>` tags can get stripped during hydration). That's exactly the
textbook use case for CSP's `'strict-dynamic'`: the page's own bundle
carries the nonce (`<Scripts nonce={nonce} />`), and `'strict-dynamic'`
propagates that trust to anything the bundle injects dynamically — meaning
the ever-growing manual host allowlist (~30 directives today) could shrink
instead of growing every time a new vendor script gets added. Legacy
browsers that don't understand `'strict-dynamic'` still fall back to the
existing allowlist, so it's additive/non-breaking in theory.

**Why deferred**: needs a real tag-firing test after adding (GTM Preview
mode + checking each pixel actually fires), not just the reasoning above.
Not verified live.

### 2. `server.ts`: broaden the Shopify redirect-table check
Currently `if (response.status === 404)` triggers a Storefront API
`storefrontRedirect()` lookup. Cyclewear broadened this to `>= 400`, on the
reasoning that a loader bug can turn a genuinely-redirected URL into a 500,
hiding the redirect from ever being applied.

**Why deferred as-is**: `storefrontRedirect()` makes a Storefront API call
every time it's invoked. Blindly broadening to `>=400` adds that round-trip
to *every* erroring response site-wide — including POST/action responses
from cart mutations, auth 401/403s, rate limits — which is real added
latency on requests that are already failing for unrelated reasons. If
ported, scope it to GET/navigation requests only, not all methods.

### 3. Move Okendo's data fetch to deferred
`app/root.tsx` — tienda currently awaits Okendo's provider-data fetch
alongside the layout query before sending the first byte
(`loadCriticalData`). Cyclewear moved it to the deferred stream
(`loadDeferredData`), resolving in parallel with header/footer/cart after
TTFB. This matches Hydrogen's own critical-vs-deferred loader guidance.

**Why deferred**: legitimate, low-risk performance win, just hasn't been
scheduled — no known blocker, this one's closer to "ready to port" than the
other two.

### 4. Async Google Fonts loading
`app/root.tsx` — cyclewear applies the standard "preload as style, flip
`media` from `print` to `all` on load" technique to avoid a render-blocking
font stylesheet. The *technique* is sound and vendor-independent.

**Why deferred**: cyclewear's actual implementation passes
`onLoad: "this.media='all'"` as a **string** in the Remix `links()`
`LinkDescriptor`. Remix's `<Links />` renders these as
`React.createElement("link", {...link})`, and React's `onLoad` prop expects
a function, not an inline JS string — this looks like it silently doesn't
work as written (the media may never actually flip to `all`). If porting
the concept for tienda's Google Fonts link, implement the load-event
handling for real (a ref + `element.addEventListener('load', ...)`, or a
tiny inline `<script nonce>`), don't copy cyclewear's code verbatim.

## Big one: page-number pagination (not a quick port)

**What it is**: cyclewear fully replaces Hydrogen's cursor-based
`<Pagination>` (which tienda's `collections.$collectionHandle.tsx` and
`search.tsx` still use) with stable `?page=2`-style URLs, via three new
files:
- `app/components/PaginationBar.tsx` — renders real `<a href="?page=N">`
  links (idempotent — the same URL always means the same thing) plus
  ellipsis-style page numbers.
- `app/utils/loadCollectionPage.ts` — server-side `page` → Storefront API
  cursor translation. For collections ≤250 products: one lightweight ID
  query + `nodes(ids:)`, O(1) regardless of page. For collections >250
  products (or with an availability filter applied): walks `after`-cursors
  from scratch on every request until it reaches the requested offset —
  the one real cost, since there's no cross-request cursor cache.
- `app/utils/fetchProductsStockFirst.ts` — fetches lightweight
  `{id, availableForSale}` for up to 250 products, partitions in-stock
  first (stable order otherwise), then re-fetches full cards via
  `nodes(ids:)`. Confirmed gap in tienda: the Storefront API's
  `collection.products` query does **not** apply the merchant's "push
  out-of-stock to the end" Search & Discovery setting the way
  `search`/predictive search do — tienda's `COLLECTION_QUERY` has no
  availability-aware sort today, so out-of-stock products can show ahead
  of in-stock ones on the default collection sort.

**Why this matters**: it's a more complete fix for the exact stale-cursor
SEO problem patched via `robots.txt` on 2026-07-23
(`Disallow: /*cursor=*`) — that patch only stops Google from *re-crawling*
cursor URLs it already indexed; it doesn't stop them from being generated
and discovered in the first place, and it doesn't help the "share this
page" URL experience (a cursor URL isn't a stable, bookmarkable link the
way `?page=2` is).

**Why it's not a quick port**:
- Touches the loader, `FiltersSidebar.tsx`, `SortFilter.tsx`, and both
  `search.tsx` and `collections.$collectionHandle.tsx` together — it's
  all-or-nothing, not a single-file change.
- Companion fix required for correctness: `FiltersSidebar`/`SortFilter`
  must `paramsClone.delete('page')` whenever a filter changes, or
  page-based pagination has a real bug — applying a filter while on page 3
  of unfiltered results can point at a page number beyond the new (smaller)
  filtered result set, silently showing an empty grid. Cursor pagination
  has no `page` param, so this bug doesn't exist in tienda today; it would
  be introduced by this change and must be handled alongside it.
- Real tradeoff for very large (>250-product) collections at deep page
  numbers: repeated cursor-chain walking per request, no caching across
  requests.
- Stock-first sorting adds 2 Storefront API calls per collection-page load
  (stock-meta query + by-IDs query) versus 1 today — worth confirming
  that's an acceptable cost before shipping, independent of whether the
  pagination rework happens.

**Recommendation**: treat as a deliberate follow-up project, scoped and
planned on its own, not bundled into a "small fixes" batch. If tienda ever
does this, `fetchProductsStockFirst.ts` naturally comes along as part of
`loadCollectionPage.ts`'s integration; it could in principle also be ported
standalone into the current cursor-based collection loader, but that would
need its own integration work.
