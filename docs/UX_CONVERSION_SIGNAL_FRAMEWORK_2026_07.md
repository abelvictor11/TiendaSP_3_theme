# UX conversion signal framework (2026-07-25)

Goal: systematically test what's driving conversion issues — UI/UX,
traffic quality, or something else — using Shopify's own data + GA4 +
events, cross-referenced against a real historical comparison, anchored
on the top-selling products.

## Correction: the store is not new — my first pass here was wrong

An earlier version of this doc claimed the store was ~14 months old
(based on `shop.createdAt` in the Admin API, 2025-05-21) and concluded a
literal YoY comparison wasn't meaningful. **That was wrong** — `createdAt`
is when this specific Shopify *instance* was created (part of a platform
migration), not when the business started trading. Cross-referenced
properly:

- **Wayback Machine**: continuous, near-monthly crawl history of
  tienda-sportfitness.com from **2018-04-30** through the present — a
  7+ year operating business.
- **`app/data/legacyRedirects.json`**: 634 entries with WordPress/
  WooCommerce-style URLs (`/categoria/accesorios/agilidad/conos/`) — hard
  evidence of a real prior platform with a full catalog, not a fresh
  start.
- **Google Search Console** (16-month max retention, domain property):
  real organic search traffic visible back to at least 2026-03-23 (cut
  off by GSC's display cap, not by actual history), with a sharp traffic
  regime change — from a high, spiky ~400-500 clicks/day down to a
  steady ~100-150/day — right around the platform migration window.
- **Shopify order history**: order #1001 (Shopify's default starting
  number) on 2025-05-24 confirms this *Shopify instance's* order ledger
  starts there — consistent with a migration date, not a business launch
  date.

**Net: this is an established business that migrated platforms around
April-May 2025, not a new store.** A real year-over-year comparison is
valid and — as it turns out — extremely informative (see below).

## The headline finding: a real, large, uniform YoY decline

Pulled via GA4's native Compare feature (exact matching calendar range,
Jul 1-25, both years, same property, same metric definitions — the
cleanest possible comparison GA4 supports):

| Step | Jul 1-25, 2026 | Jul 1-25, 2025 | Change |
|---|---|---|---|
| Active users (site-wide) | 8,323 | 26,517 | **-68.6%** |
| view_item | 4,175 | 15,385 | **-72.9%** |
| add_to_cart | 335 | 1,629 | **-79.4%** |
| begin_checkout | 203 | 1,262 | **-83.9%** |
| purchase | 25 | 207 | **-87.9%** |

**The decline compounds at every step deeper into the funnel — this is
not purely a traffic-volume story.** Implied step-to-step conversion
rates:

| Step conversion | 2026 | 2025 | Relative change |
|---|---|---|---|
| view_item → add_to_cart | 8.0% | 10.6% | **-24%** |
| add_to_cart → begin_checkout | 60.6% | 77.5% | **-22%** |
| begin_checkout → purchase | 12.3% | 16.4% | **-25%** |

Every single step lost roughly a quarter of its conversion rate,
uniformly. That uniformity is itself a signal: a *localized* UX problem
(e.g., one broken filter, one confusing PDP layout) would typically show
up as a disproportionate drop at *one* step, not an even ~22-25% haircut
at every step from top to bottom. A uniform decline like this more
commonly points to something global: traffic-quality/channel-mix shift
(different acquisition sources bringing lower-intent visitors), a
site-wide technical/performance regression, broader market conditions, or
some combination — not necessarily "the menu is confusing" or "the search
is bad" specifically, even though those remain worth checking.

**This reframes the original hypothesis.** The request that started this
investigation assumed "most issues are UI/UX." The data doesn't rule that
out, but it doesn't point there first either — it points at "something
changed broadly across the whole funnel, right around when this business
migrated platforms." The migration itself (new domain-serving
architecture, new theme/storefront, new tracking setup, likely different
traffic-source mix as old bookmarks/backlinks/ad campaigns pointed at the
old platform) is a far more parsimonious single explanation for a uniform
cross-funnel decline than five separate, coincidentally-simultaneous UX
regressions would be.

## What this means for next steps
Before building the menu/collection/search-specific framework from the
original ask, the higher-value next step is diagnosing *why* the decline
is uniform rather than concentrated:
1. **Traffic-source/channel-mix comparison, 2025 vs 2026**: pull "First
   user medium" (already available as a GA4 dimension, seen in this
   session's Free-form report) for both periods. If the mix shifted
   heavily (e.g., much more low-intent paid traffic, or organic collapse
   from the GSC-visible post-migration SEO drop), that alone could
   explain most of this without any on-site UX culprit.
2. **GSC performance, pre- vs post-migration**: the same Compare
   functionality exists in GSC — pull clicks/impressions/average position
   for the equivalent windows to quantify how much of the traffic decline
   is organic-search-specific (SEO impact of the migration) vs. broader.
3. **Device-category split** of the same YoY comparison — if the decline
   is concentrated on one device type, that's a much more specific,
   actionable lead than a store-wide number.
4. Only after 1-3 rule in/out a traffic-quality or SEO explanation does it
   make sense to invest in the original menu/collection-filter/search
   instrumentation plan below — otherwise there's a real risk of
   correctly diagnosing "conversion rate dropped 25% at every step" and
   incorrectly prescribing a UX fix for what's actually a traffic-mix or
   SEO problem.

## Update 2026-07-25 — items 1–3 above are done; Phase 2 now has real corroborating data

The three pre-checks listed above were completed (full detail in
`docs/conversion-investigation-2026-07/FINDINGS.md`, sections 5–7 and 11).
Summary of what changed the picture:
- Traffic-source mix: paid, not organic, has been the dominant channel every
  half since data began — the store's demand is acquisition-driven, not
  SEO-driven (FINDINGS.md section 5).
- GSC pre/post-migration: confirmed a sharp, dated ~70–75% organic-click
  collapse exactly at the Apr–Jun 2025 migration window, never recovered —
  and this round found a concrete technical mechanism (a broken sitemap the
  site's own `robots.txt` was still pointing to as late as 2025-05-10;
  FINDINGS.md section 11.6).
- Device split: only a single-window (last 28 days) snapshot was pulled, not
  the full YoY/half-year comparison originally planned — still an open item
  (FINDINGS.md section 11.7).

None of this rules out on-site UX as a contributor — if anything, a
Shopify-Sidekick-generated bounce-rate report was independently cross-checked
against GA4 this round and **one specific claim held up**: the
`/collections/bicicletas-estaticas-y-spinning` collection page bounces at
**84.07%** (GA4, last 28 days) vs Sidekick's claimed 82.5% — a close match.
The sibling claim for `/collections/caminadoras-y-trotadoras` (claimed 83.6%)
did **not** hold up at 28-day aggregate (45.71% actual) and should be treated
as unconfirmed, not as a second proven bad page (FINDINGS.md section 11.2).
**Net effect on this framework's priority**: the top-50-products
mini-funnel and new instrumentation below are still correctly sequenced
after the acquisition/tracking items in FINDINGS.md section 10, but the
`bicicletas-estaticas-y-spinning` collection page specifically now has real,
corroborated evidence behind it and is a reasonable first concrete target
once this phase starts (e.g. clearer above-the-fold CTAs/trust signals,
checking whether social-ad creative matches the page content) — no other
single page in this framework currently has two independent measurements
agreeing on it.

## Original framework (still valid, now Phase 2 rather than Phase 1)
Sections below are unchanged from the original design — genuinely useful,
just resequenced behind the traffic-quality/SEO check above rather than
ahead of it.

### Instrumentation inventory (unchanged finding)
| Touchpoint | Status |
|---|---|
| Predictive search (viewed + selected, with position) | ✅ tracked |
| Full search page (query, results) | ✅ tracked |
| PDP view, add_to_cart, remove_from_cart, view_cart, checkout started | ✅ tracked |
| Collection page landing (view_item_list) | ✅ tracked |
| Header/mega-menu clicks | ❌ zero tracking — bare `<Link>`s |
| Collection filter/sort usage | ❌ zero tracking — only inferable by diffing URL params |
| Search zero-results | ❌ computed in code, never sent to any tracker |
| Homepage category/promo card clicks | ❌ zero tracking — bare `<Link>`s |
| PLP quick-add vs. PDP add-to-cart source | ❌ indistinguishable |

### Top-50-products + per-product mini-funnel (unchanged design)
Once the traffic-quality question is resolved (or ruled out), pull top 50
products by units sold (Shopify Bulk Operations API, orders + line
items), cross-reference each against GA4's `view_item`/`add_to_cart`/
purchase counts for a per-product mini-funnel — same diagnostic logic as
originally designed: low-views-relative-to-sales points at
discoverability (menu/collection placement), high-views-low-add-to-cart
points at PDP content, high-add-to-cart-low-purchase points at
cart/checkout friction.

### New instrumentation (unchanged design, still Phase 2/3)
Menu clicks, filter/sort usage, zero-results event, promo-card clicks,
add-to-cart source tagging — still genuinely missing, still worth
shipping eventually, just not the first move given the traffic-quality
question above is cheaper to answer and more likely to explain the bulk
of the effect.

## Next-session plan (2026-07-25, written after shipping the checkout fix; updated 2026-07-26)

The checkout-navigation race condition (FINDINGS.md section 12) is now
fixed, deployed, and verified live (PR #96, `be9436c`). That fix is the
single biggest pending unknown affecting everything below: it's the
strongest candidate root cause found in this whole investigation for the
add_to_cart→begin_checkout drop-off, but "strongest candidate" is not the
same as "confirmed cause at scale" until real production data shows
recovery — it's only been live ~1 day as of this update, too early for a
clean read (Phase 0 item 2, below).

**2026-07-26 session recap**: audited every Phase 2 item below against
current `origin/tienda` before implementing anything, rather than trusting
this doc's own to-do list. Found 3 of 6 items (#7/#8/#9) were already
shipped by other PRs before this plan was even written — corrected in
place below, doc fix opened as **PR #100**. Then scoped item #13
(image/LCP) down to concrete file-and-line fixes, ready to implement next
session — see the sub-bullets under #13.

**Correction, same day**: Codex's automated review on PR #100 caught that
2 of those 3 "already shipped, no action needed" calls (#8, #9) were
themselves incomplete audits — the code exists but doesn't actually clear
the bar. Re-verified both against the live route/component code, confirmed
Codex was right on both, and rewrote #8/#9 in place with the corrected
findings and real, still-open action items. Lesson: a component rendering
≠ a component working for 88-96%-mobile traffic — check *how* it renders
(hover-gated, occluded, pushed down the page), not just *whether* it
renders.

### Start-of-next-session checklist
1. ~~Merge PR #100~~ — **done, 2026-07-26** (Phase 2 doc corrections, including the Codex-caught fixes to #8/#9).
2. ~~Implement the 3 ranked image/LCP fixes under item #13~~ — **done, 2026-07-26** (PR #101), plus a confirmed-via-real-Lighthouse-trace `fetchpriority` fix on the actual LCP element (the hero video). See item #13 for the full writeup.
3. **NEW, top priority — decide + implement the `getLoaderRouteFromMetaobject` caching fix** (item #13's TTFB finding): add an opt-in cache-strategy param, default preserves `CacheNone()` everywhere, switch only homepage/`/stores`/`/home-2`/`/news` to `storefront.CacheShort()`. This is the confirmed dominant lever on the 4.8s mobile LCP number — bigger than any image work. Needs a decision on cache duration (thinking 60-120s short cache, but that's a product call, not just a technical one) before implementing.
4. Scope and fix #8 (mobile quick-add hidden behind `group-hover`) — small, well-understood CSS fix, likely quick.
5. Decide on #9 (review placement relative to enhanced/feature content) — needs a product-strategy call before any code change, not a pure fix.
6. Re-check Phase 0 item 2 (checkout completion rate) — needs more days of post-deploy data before it's a clean read.
7. If bandwidth allows: item 5 (`(not set)` landing pages) or item 10 (`bicicletas-estaticas-y-spinning` CRO) — both data-only/analysis, no new instrumentation needed.
8. Still waiting on human answers for items 3-4 (Meta Aug-Sep 2025 spend pause, second Meta ad account) — ask directly rather than re-deriving from tooling.

### Phase 0 — Deploy, monitor, and close two human-only questions (blocking)
1. ~~Deploy the checkout fix~~ — **done, 2026-07-25.** PR #96 merged (`be9436c`), Oxygen deploy succeeded, re-verified live on production against a real cart (hung-fetch repro, navigation still succeeds).
2. **Watch mobile and desktop cart→checkout completion rate for 1–2 weeks post-deploy — now the active item.** This is the real test of the section 12 hypothesis. If it recovers toward pre-regression levels, that's strong confirmation the checkout bug explained a meaningful share of the funnel drop-off; if it doesn't move, the H2'25→H1'26 conversion decline (section 3/9) needs a different explanation and Phase 2 below becomes higher-value. The RudderStack baseline (FINDINGS.md 14, 4.8% pre-deploy) is the fastest first-party signal to re-check; GA4 will take longer to show a clean read.
3. **Get a human answer on the Meta Aug–Sep 2025 spend pause** (deliberate budget/creative decision vs. involuntary account/ad issue) — FINDINGS.md section 11.4, unresolved from tooling alone.
4. **Get a human answer on the second Meta ad account** ("Tienda Sport Fitness", 1861970807157400) — confirm the restriction timeline/context on the original account (218335765418186) that prompted creating it, since it currently has zero campaigns and the original still looks healthy and active (FINDINGS.md section 9 addendum).

### Phase 1 — Diagnose the two remaining unexplained data anomalies (fast, data-only)
5. **The `(not set)` landing-page bucket** — >11% of last-28-day sessions, 90.58% bounce, GA4 capturing the session but not the page path (FINDINGS.md 11.2). Likely a tag-timing/consent-race instrumentation gap rather than a real bad page; check before it gets mistaken for content.
6. ~~The desktop `session_start` bounce-rate jump~~ — **resolved (FINDINGS.md 16).** Not a trend: desktop bounce was flat and normal (33-42%) every month of H2'25, then spiked hard for exactly two months (Jan 2026 85%, Feb 2026 73%), then reverted to normal by March. Doesn't correlate with the checkout bug (introduced 2026-04-20, two months after this had already subsided) — instead it's very likely the same event as the `(none)`-medium traffic spike already documented in section 5 (same two months, similar magnitude), not two separate anomalies. Not fully proven (the `(none)`-medium bucket's own device split wasn't pulled to confirm the exact overlap), but treat as one open question, not two, going forward.

### Phase 2 — thefeed.com-informed UX fixes (concrete, code-level, ready to scope without new instrumentation)
From `docs/THEFEED_COMPETITIVE_TEARDOWN_2026_07.md`, in priority order:
7. ~~Out-of-stock → cross-sell banner~~ — **already shipped, this doc was stale.** PR #83 ("feat(pdp): surface in-stock alternatives immediately when out of stock") merged to `tienda` **2026-07-24**, a day before this plan was written — confirmed live on current `origin/tienda` (`app/routes/($locale).products.$productHandle.tsx`, `isOutOfStock` at line 459, disabled "Agotado" button + `ComplementaryProducts` banner at lines 602-634). A follow-up fix (`98e532c`) also patched a Codex-flagged bug where the fallback recommendations weren't filtered to in-stock items. **One real gap remains**: thefeed shows this pattern *twice* (above the fold and near the buy box); tienda only has the near-buy-box instance — `ProductGallery.tsx` has no above-the-fold OOS banner. Small follow-up if wanted (~20-40 lines, reuses the existing `recommended` promise + `ComplementaryProducts`, no new data/metafield needed), not urgent since the core fix (a recovery path existing at all) is already live.
8. **PLP quick-add-to-cart — corrected 2026-07-26 after Codex review caught an incomplete audit.** `quickAddToCart` does default `true` (`ProductCard.tsx` line 42) and `AddToCartButton` does render on the card, but the wrapping div (lines 227-230) is `opacity-0 invisible group-hover:opacity-100 group-hover:visible` — a hover-only reveal. Hover doesn't exist as a reliable interaction on touch devices, and mobile is 88-96% of traffic (Sidekick 11.2), so the dominant path has no visible quick-add affordance despite the code being "shipped." **Real gap, action needed**: gate the hover-only styling behind `@media (hover: hover)` (or equivalent) so desktop keeps the hover reveal and mobile shows the button by default. Not yet sized/scoped — do that next session alongside #13.
9. **Okendo review placement — corrected 2026-07-26 after Codex review caught an incomplete audit.** Confirmed true: reviews aren't gated behind a click/accordion/tab. Not confirmed, and actually false in the common case: `ProductReviews` renders in route `($locale).products.$productHandle.tsx` *after* `PdpEnhancedSection` (line 363) and `ProductFeatureBlocks` (line 369) — both optional, per-product, metafield-driven full-width sections sitting below the two-column buy-box layout (which closes at line 360). For any product with enhanced/feature content populated, the first review can land several full-width sections below the buy box, not adjacent to it like thefeed's inline teaser. **Real gap, needs a product-strategy call, not a pure code fix**: move reviews above the enhanced/feature sections (closer to the buy box) vs. accept current order as an intentional trade-off for content-rich PDPs. Flag for next session — don't just re-order without checking why enhanced/feature content was placed there first (may be deliberate storytelling-before-social-proof sequencing).
10. **`/collections/bicicletas-estaticas-y-spinning` CRO** — this collection page is the one item in the whole investigation with two independent measurements agreeing it's a problem (Shopify Sidekick's 82.5% claim + our own GA4 pull at 84.07%, FINDINGS.md 11.2). Concrete first target: clearer above-the-fold CTAs/trust signals, and check whether the social-ad creative driving traffic here actually matches the page content.
11. **Container side-gutter decision** (96px tienda vs. 24px thefeed at 1536px — THEFEED_COMPETITIVE_TEARDOWN.md CSS table) — a real, measurable, easily-adjustable difference in how much content is visible above the fold, but may be an intentional spacious/premium design choice. **Ask before changing**, don't auto-fix.
12. **Deferred, needs assets not code**: hero image compositing (product cutout + radial-gradient spotlight layered over the background photo) — needs isolated product photography that doesn't exist yet for any tienda product. Flag for whenever there's a photography budget, not this phase.
13. ~~Image delivery/LCP fix~~ — **implemented 2026-07-26, but re-verification found the original scoping had gaps too (same day as the PR #100 Codex catch — re-checked everything against live code/production before trusting the prior audit).** Original hypothesis (PageSpeed Insights detour, FINDINGS.md 15/15.1): mobile fails Core Web Vitals on LCP (4.8s vs. a 2.5s target, Performance score 73); desktop is borderline (2.6s, score 86); "Improve image delivery" is the #1 Lighthouse opportunity (1.4-1.7 MB) on both. What actually shipped, and what's still open:
    - **Shipped, real bugs, verified**: `SectionProductShowcase.tsx`, `SectionCategoryCardsCarousel.tsx`, and `SectionProductFeature.tsx` were using raw `<img>` tags with untransformed, full-resolution Shopify CDN URLs and no `srcset` — confirmed via live dev-server render (real CDN `srcSet`/`sizes` now generated, no `undefined`/broken output). Switched all three to Hydrogen's `<Image data={...}>`. This is a genuine contributor to the 1.4-1.7 MB opportunity regardless of what the actual LCP element turns out to be.
    - **Shipped, real bug, but narrower than scoped**: `SectionImageWithText.tsx` line 201 had malformed `sizes` syntax (missing parens around media conditions) on an actual Hydrogen `<Image>` with real `srcset` generation — fixed. Re-checking `SectionSteps.tsx`, its `<Image>` (line 47, `sizes="150px"`) was **already correct** — the malformed syntax there was only on a raw `<img>` static SVG decoration with no `srcset`, where `sizes` is inert regardless of syntax. Original audit conflated the two; fixed the inert one too for cleanliness but it does nothing for page weight.
    - **Shipped, real fix but not the mechanism first assumed**: added `loading="eager"`/`fetchPriority="high"` to `SectionHero.tsx`/`SectionHeroSlider.tsx`'s `<Image>` branch — correct for image-based hero slides (Hydrogen defaults to `loading="lazy"` even above the fold), but a live check of `https://tienda-sportfitness.com/` found the **currently-configured homepage slide renders a `<video poster="...">`, not an `<Image>`** — that branch never runs for today's content.
    - **LCP element and root cause now CONFIRMED, via a real Lighthouse trace run locally** (`npx lighthouse` + local Chrome, mobile emulation — the PSI API's daily quota was exhausted and `chrome-devtools-mcp`, added mid-session, needs a fresh conversation to load; ran Lighthouse directly against the Chrome binary already on this machine instead of blocking on either):
      - **The LCP element is exactly what the live-content check found**: the mobile hero `<video>` (`nc-SectionHeroSliderItem__image > video.block`, poster `bg-mobile.webp`). Confirmed via Lighthouse's `lcp-breakdown-insight` and `lcp-discovery-insight` audits, not guessed.
      - **`fetchpriority=high` was genuinely missing on it** — `lcp-discovery-insight`'s checklist showed `priorityHinted: false`. Fixed: added `fetchpriority="high"` to the `<video>` tag in `SectionHero.tsx` (both branches) and `SectionHeroSlider.tsx`'s `HeroVideo`. Note: React's `@types/react` version here doesn't type `fetchPriority` on `VideoHTMLAttributes` (only `img`/`link`/`script`), and passing the camelCase prop via an `as any` spread rendered as literal `fetchPriority="high"` in the DOM (works via HTML's case-insensitive attribute matching, but risked an unnecessary hydration-mismatch warning) — used the lowercase key (`{...({fetchpriority: 'high'} as any)}`) instead, verified via dev-server SSR output.
      - **The dominant cause of the 4.8s (this local run: 3.3s, different network/machine so not directly comparable) mobile LCP is server response time, not image weight at all**: `server-response-time` audit scored 0/failing — "Root document took 870ms" — with the LCP breakdown showing time-to-first-byte (905ms) as by far the largest of its four subparts (vs. 22ms resource-load-delay + 133ms resource-load-duration + 321ms element-render-delay). The 82KB poster image itself loads fast once requested (consistent with the earlier direct-fetch check); the page is slow because the server takes ~900ms to send the first byte of HTML at all, delaying everything downstream.
      - **Root cause of that TTFB, found by tracing the loader**: `app/utils/getLoaderRouteFromMetaobject.ts` line 35 passes `cache: storefront.CacheNone()` on the `ROUTE_CONTENT_QUERY` — the GraphQL query that fetches the *entire* section tree for a route (this is what powers the homepage, and via `Sections`/`SECTIONS_FRAGMENT` it's a large, deeply-nested query). Every single homepage request skips caching entirely and re-fetches this from Shopify's Storefront API fresh — a plausible, well-supported explanation for an ~870-900ms TTFB. **This function is shared across 7 routes** (homepage, `/stores`, `/home-2`, collections `$collectionHandle` with filters/pagination, `/search`, `/news`, and the PDP) — several of which (collections, search, PDP) legitimately need fresh inventory/pricing data, so blindly switching the shared default to a cached strategy risks showing stale stock/pricing on commerce-critical pages. **Not implemented — needs a decision, not just a fix**: the safe version is adding an optional cache-strategy parameter to `getLoaderRouteFromMetaobject` (defaulting to today's `CacheNone()` to preserve current behavior everywhere), and opting only the pure-marketing-content call sites (homepage, `/stores`, `/home-2`, `/news`) into `storefront.CacheShort()`. Flagged for next session rather than done blind, given it touches commerce-critical routes.
      - Also flagged by Lighthouse, smaller: a render-blocking font/CSS chain (Google Fonts CSS + 2 Oxygen-hosted CSS bundles + custom `.woff2`/`.ttf` font files chained behind them, loading ~1.5-1.7s into the trace) — worth a preload pass but secondary to the TTFB fix.
    - Lesson reinforced from the same-day PR #100 Codex catch: "the code path exists" isn't the same as "the code path is what's live/active" — check current content configuration, not just component code, before claiming a fix addresses a measured number. Second lesson from this same item: when a quota/tooling wall blocks the "proper" path (PSI API, `chrome-devtools-mcp` needing a session restart), look for an equivalent already available locally (Chrome + `npx lighthouse` were right there) before declaring the question unanswerable.
    - **2026-07-26, addressed Codex review on PR #101**: found the `loading="eager"`/`fetchPriority="high"` addition above had a real P1 bug — when neither hero side has a video, both desktop and mobile `<Image>` branches render simultaneously (only hidden via responsive CSS, which doesn't stop the fetch), so marking both eager+high-priority made them compete with each other for bandwidth. Fixed by combining both sides into one `<picture>` with a media-conditional `<source>` for that case (video-only and mixed video/image cases were already safe). Also fixed a P2: `SectionCategoryCardsCarousel.tsx`'s `isLarge` card `sizes` assumed 66vw, but the grid (`grid-cols-1 sm:grid-cols-3`, `isLarge` only spans rows not columns) means every card is really ~33vw from 640px up.
14. **NEW — verify Meta Pixel is actually firing live** (FINDINGS.md 15.1): PageSpeed's third-party breakdown showed zero Meta Pixel network activity on either mobile or desktop — no `facebook.net`/`facebook.com` entity at all. Could be a Lighthouse-consent-timing artifact (marketing consent may not resolve the same way for a synthetic crawl) rather than a real gap, but Meta campaigns depend on this pixel for custom audiences/conversions (section 7). Quick, high-value check: Meta Events Manager's Test Events tool or the Pixel Helper extension against a real page load, before concluding either way.
    - **Context from the account owner (2026-07-26), downgrades urgency**: this is a known, pre-existing gap — the client-side Meta Pixel issue is why the RudderStack CDP's "Facebook Conversions - Tienda Fitness" destination exists at all (server-side CAPI, bypassing the client-side pixel while a real fix is pending). So Meta conversion data isn't actually blind right now, it's routed a different way. Still worth the live-firing check above to fully scope the client-side gap, but not urgent — a working interim path already exists. **Also worth checking later: whether cyclewear's implementation solved the underlying client-side pixel issue** and could be ported back, rather than only relying on the CAPI workaround long-term.

### Phase 3 — Original Phase 2 UX instrumentation (unchanged from the framework above)
Menu/filter/search event tracking, zero-results tracking, promo-card
clicks, add-to-cart source tagging, and the top-50-products mini-funnel —
sequenced last because it requires building new instrumentation before it
produces any data, whereas everything in Phase 2 is already actionable
without new tracking.

### Parallel track — independent, no dependency on the above, run whenever bandwidth allows
SEO Tier 2 backlog (tasks #69/#70/#71/#73): image alt text for 520
products, `descriptionHtml` for 106 collections, `seo.title`/
`seo.description` overrides for ~110 collections, images for 117
collections currently missing one. Doesn't block or get blocked by
anything above.
