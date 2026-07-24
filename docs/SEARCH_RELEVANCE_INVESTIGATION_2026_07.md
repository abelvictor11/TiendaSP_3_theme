# Search relevance investigation (2026-07-24)

Task #78 (page-by-page UX audit) — scoping search/predictive-search
improvements. Two parts: (1) what tienda's code actually does today
(verified by reading it), (2) what Shopify's documented capabilities and
constraints are (deep-research pass, 19 primary sources, 18 claims
verified 3-vote adversarial).

## 1. Current state (verified by reading the code)

**Header dropdown** (`app/components/SearchAutocomplete.tsx`, loader at
`app/routes/($locale).api.predictive-search.tsx`):
- Uses `predictiveSearch`, `types: [PRODUCT, COLLECTION]` only — no QUERY
  suggestions, no PAGE/ARTICLE.
- `limit: 6, limitScope: EACH` (6 products + 6 collections separately —
  already avoids the "products crowded out by other types" trap).
- `searchableFields` already overridden to `[TITLE, VARIANTS_TITLE,
  VARIANTS_SKU, VARIANTS_BARCODE, PRODUCT_TYPE, VENDOR, TAG]` — broader
  than Shopify's default (TITLE/PRODUCT_TYPE/VARIANT_TITLE/VENDOR only),
  specifically to catch SKU/barcode searches. Good — already ahead of the
  documented default.
- `app/components/Header/SearchModal.tsx` exists but is dead code (not
  imported, its body commented out) — worth deleting separately, unrelated
  to relevance.

**Full search page** (`app/routes/($locale).search.tsx`):
- Uses the `search` query (not `predictiveSearch`), `types: PRODUCT` only,
  `sortKey: RELEVANCE` default, supports `productFilters` (faceted sidebar,
  same component as collections) and price/relevance sort toggle.
- No `prefix: LAST` argument set — partial last-word matching (e.g.
  "banda resistencia elast" → "elástica") is not currently requested.
- No synonym handling, no manual relevance weighting anywhere in the repo
  (grepped `relevance|boost|synonym|weight|MATCHES|partial|prefix` across
  app/ — no hits relate to search logic).
- No reference anywhere to Shopify's Search & Discovery app or its Admin
  API objects — current relevance is 100% Storefront API defaults.

## 2. What research confirms about Shopify's actual capabilities

Full findings, caveats, and sources in the research run; key points below.

### Confirmed, high confidence
- **Search & Discovery app settings (synonyms, product boosts) do flow
  through to the headless Storefront API's `search` query** — confirmed
  verbatim across 3 independent primary Shopify sources. This is free
  (no new app spend) and directly improves the full results page.
- **That same guarantee is NOT documented for `predictiveSearch`** (header
  dropdown). Shopify's docs attach "Advanced customizations" language only
  to the `search` query section; semantic search is explicitly stated as
  not applying to predictive search. **Needs a direct empirical test on
  our own storefront** (configure one synonym pair in Search & Discovery,
  query both `search` and `predictiveSearch` for it, compare) before
  assuming it helps the dropdown too.
- **`predictiveSearch` supports exactly 5 types** (ARTICLE, COLLECTION,
  PAGE, PRODUCT, QUERY), capped at **10 results total by default** unless
  `limit`/`limitScope` are set — we already avoid this trap.
- **`search` supports `prefix: LAST`** for partial-word matching on the
  final search term — **not currently passed in our loader**. Free,
  one-line addition.
- **Typo tolerance is real but narrow**: only a 1-letter difference or
  2-letter transposition, and only if the first 4 letters are typed
  correctly. Spanish is on the supported-language list for this, but it's
  much weaker than true fuzzy search.
- **Stemming/lemmatization and trigram matching are English/Japanese
  only — not Spanish.** This is the single clearest documented gap for an
  es-CO catalog: "zapato" will not auto-match "zapatos", "correr" won't
  stem-match "corriendo", etc., without a manual synonym/variant map.
- **Predictive search's query-suggestion strings are English-only**, and
  its collection-name matching only checks the store's **primary admin
  language** — if tienda's Shopify admin Primary Language isn't actually
  set to Spanish (vs. English-primary with a Spanish translation layered
  on), collection suggestions in the dropdown silently fail to match
  Spanish terms. **5-minute admin check, worth doing before anything else.**

### Refuted (worth naming so we don't act on them)
- "Shopify storefront search includes AI-powered typo-tolerant matching
  broadly" — refuted; the real behavior is the narrow rule above, not
  general AI fuzzy matching.
- Claims that Ajax Predictive Search API (`/search/suggest.json`,
  theme-facing) behavior proves anything about the GraphQL
  `predictiveSearch` Hydrogen actually uses — refuted as an inference;
  they're documented as separate surfaces and must be tested independently.

### Real gap in this research pass
Despite asking directly, **no verified findings on third-party headless
search vendors** (Algolia, Klevu, Searchspring, Boost AI Search &
Discovery, Doofinder) or actual Hydrogen community/GitHub discussion
threads survived verification — those candidate claims either weren't
sourced or didn't survive 3-vote adversarial checking. Anything said about
that tier below is general knowledge, not verified evidence, and would
need a dedicated follow-up pass if we want to seriously evaluate it.

## 3. Options, ranked

**Tier 1 — free, do first, no architecture change** (all directly
actionable in the existing loaders):
1. ~~Audit Shopify Admin Primary Language~~ **DONE** — checked via Admin
   API (`shopLocales`): `es` is the only locale and it's primary/published.
   Not a blocker; predictive search's collection-name matching against
   Spanish terms is not silently broken by an English-primary setup.
2. ~~Add `prefix: LAST` to the `search` query~~ **DONE, shipped and
   live-verified** (PR — branch `feat/search-prefix-match-tienda`).
   Added to both `SEARCH_QUERY` and `SEARCH_QUERY_2` (the latter seeds the
   price-filter range and must match the former's result set or the
   slider range would be computed off a different product set). Confirmed
   live: searching "banda resistencia elast" (a deliberately truncated
   last word) now returns real elastic-band products — it returned
   nothing relevant before this change.
   - Side-finding while shipping this: Hydrogen's codegen
     (`storefrontapi.generated.d.ts`) keys generated types off the exact
     query string text. Editing a query's arguments without re-running
     `npm run codegen` produces confusing, unrelated-looking TS errors
     elsewhere in the same file (implicit `any`, `unknown` not assignable)
     because the type lookup silently falls back — not a real type error,
     just a stale-codegen symptom. Re-running codegen resolved it cleanly.
3. **Search & Discovery synonyms/boosts — BLOCKED on manual admin step,
   not implementable by me.** Checked the Admin GraphQL API directly: it
   exposes **zero query or mutation fields for synonyms/boosts** (grepped
   the full schema for `synonym`/`search`/`discovery`/`boost` — nothing
   relevant). This configuration only exists in the Search & Discovery
   app's own embedded Admin UI (Apps → Search & Discovery → Synonyms /
   Boosts), which I can't reach programmatically or via browser (no
   Shopify Admin login in this session). **Needs you to add at least one
   test synonym pair by hand** — suggested first pair: `pesas` ↔
   `mancuernas` (or `caminadora` ↔ `trotadora`). Once one exists, I can
   query both `search` and `predictiveSearch` for the synonym term and
   report back definitively whether it reaches the header dropdown too,
   closing the one open question research couldn't resolve from docs
   alone.
4. **Adding QUERY suggestions to the header dropdown — not implemented,
   flagging a real risk instead of doing it by default.** Research
   confirmed predictive search's query/term-suggestion strings are
   English-only. Turning this on for an all-Spanish storefront risks
   showing English suggestion text mixed into the dropdown — worse UX,
   not better. Leaving off unless you want to see it live and judge for
   yourself; trivial one-line revert either way.

**Tier 2 — free, DIY, ongoing maintenance cost** (closes the Spanish
stemming/typo gap Shopify doesn't solve natively):
- Hand-built Spanish synonym/typo map (plurals, common regional
  misspellings, verb-form variants) applied as a pre-processing step on
  the query string before it hits the Storefront API — lives in our code,
  not Shopify config, so it can cover both `search` and `predictiveSearch`
  identically regardless of what Tier 1's empirical test finds.
- Optional: light client-side re-ranking of returned results (boost exact
  title/SKU matches, boost in-stock) — building on the exact-match
  correctness work already done in the OOS-alternatives fix.

**Tier 3 — third-party search service** (Algolia/Klevu/Searchspring/Boost/
Doofinder): would give real fuzzy, Spanish-aware relevance via its own
API. **Not evaluated with verified evidence in this pass** — would need
its own research/POC before committing spend or integration effort.

## Recommendation
Do Tier 1 items 1-3 now (cheap, no code architecture change, directly
verified as effective for at least the results page). Decide on Tier 2 vs.
a Tier 3 follow-up research pass based on how much Tier 1 actually moves
the needle — testable within a day of shipping it.
