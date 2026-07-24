# thefeed.com competitive teardown (2026-07-24)

Task #76. Live review of thefeed.com (homepage, `/hydration` PLP, one PDP)
against tienda-sportfitness's current implementation. Scoped to patterns
that transfer to a gym-equipment catalog — thefeed sells consumable sports
nutrition, so not everything applies 1:1.

## Already adopted (verify before re-doing — don't duplicate this work)

Commit `bd64306` ("Reskin category tiles into thefeed.com-style asymmetric
promo grid", 2026-07-22) already ported the specific pattern seen on
thefeed's homepage promo grid: 1 large tile (spans 2 rows) + smaller tiles
alongside, lime/colored pill badges top-left corner ("SAVE 38%", "FREE WITH
75+" on thefeed; "ENVÍO GRATIS", "MÁS VENDIDOS", "NUEVO" on tienda).
Confirmed live and rendering correctly on production as of this session —
same cadence/spacing, tienda's own colors. **Nothing to redo here.**

tienda also already has the top marquee ticker bar (shipping/promo message,
looping) that thefeed uses — already in place, common pattern, not a gap.

## Real gaps worth considering

### 1. Graceful out-of-stock → alternative-product cross-sell
thefeed's biggest standout pattern: when a product/variant is unavailable
(in their case, region-locked), they show a banner **twice** (above the
fold and again near the buy box) with a specific substitute product card +
direct "SHOP [ALTERNATIVE]" CTA — e.g. "Skratch Labs Hydration Sport Mix is
not available in Australia. We recommend Powerbar Isoactive as a
replacement." tienda's current PDP just shows a disabled "Agotado" button
with no cross-sell. This is a concrete, high-value gap: instead of losing
the visit, thefeed converts it to a different sale. Given tienda already
has `ComplementaryProducts.tsx`, this could reuse the same
metafield-driven cross-sell mechanism, gated on `isOutOfStock` instead of
always showing.

### 2. Reviews shown inline on PDP, not behind a click
thefeed shows star rating + review count directly under the product title
(no click needed), and the first 2-3 full reviews render inline in the
main column below the buy box — not behind an accordion/tab. tienda uses
Okendo (`OkendoStarRating`/`OkendoReviews`) — worth checking whether the
current placement requires a click/scroll-triggered load or renders
above-the-fold-adjacent like thefeed's. (Not independently verified this
session — flag for task #78's page-by-page audit.)

### 3. Variant selection with clear grouping + scrollable strip for many options
thefeed labels each option group explicitly ("Select Size", "Select
Flavor") and uses a horizontally-scrollable pill strip with prev/next
arrows when there are more than ~4 flavor options — avoids cramming many
buttons into a wrapping grid. tienda's product options render as a plain
button grid with no scroll affordance; fine for options with few values
(tienda's typical Color/Peso options are ≤6 values), but worth keeping in
mind if any product ever has many variants.

### 4. PLP quick-add-to-cart
Some of thefeed's PLP cards have an "ADD TO CART" button directly on the
grid (not just "VIEW PRODUCT"), letting a confident shopper skip the PDP
entirely. Need to check tienda's `ProductCard.tsx`/`ProductsGrid.tsx` for
whether this exists today — likely not, given filter/PLP work this session
never touched cart-adding — worth confirming as part of task #78.

### 5. Proprietary quality score ("Feed Score")
thefeed shows a black badge with a 0-100 "FEED SCORE" on every PLP card and
the PDP hero image — a proprietary quality/ingredient rating, clearly
differentiating from generic star ratings. This doesn't map cleanly to a
gym-equipment catalog (no obvious "quality score" axis without real
editorial/testing investment) — **not recommended to port**, flagging only
because it's their strongest trust-signal differentiator and worth knowing
it exists.

### 6. Rich sub-category tabs within a single PLP
thefeed's `/hydration` PLP has a secondary tab bar (All Hydration / Workout
/ Daily / Pre-Workout / Electrolyte Boosters / Cramp Solutions) narrowing
within the category, in addition to the left filter sidebar. tienda has
the "subcollections bar" pattern already
(`app/routes/($locale).collections.$collectionHandle.tsx` renders one when
a collection has a `subcollections` metafield) — same underlying idea,
already exists where subcollections are configured. Worth checking
coverage: how many top-level collections actually have subcollections
populated vs. relying on the filter sidebar alone.

### 7. Long-form editorial product description
thefeed's PDP description includes brand-story copy ("Born in the Kitchen,
Proven in the Peloton" — founder narrative), not just spec bullets. This
directly relates to the already-known content gap: task #70 (106
collections missing `descriptionHtml`) and the broader thinness of
tienda's product/collection copy. Not a new finding, but thefeed is a
concrete example of what "good" looks like for this exact gap.

## Hero: layered product-image compositing with vignette (not a bug)

Flagged by Felipe as looking like a stray HTML artifact on top of the hero
image — it isn't. thefeed's hero slides sometimes composite a **second**
image (a specific product or product pair) on top of the full-bleed
background photo, with a soft white radial-gradient "spotlight" placed
behind the product cutout so it doesn't get visually lost against a busy
photo (e.g. a crowd scene during a bike race). Confirmed on the "20% OFF
ENERVIT" slide: race photo background + a separate Enervit gel-pack cutout
image on the right, with the radial glow directly behind it.

tienda's `SectionHeroSlider.tsx` (~line 348-384) only supports a single
flat background image/video per slide (`horizontal_image`/`vertical_image`)
+ text overlay — no secondary product-image layer exists at all today.

**Not implemented this session**: this needs new product-cutout creative
assets (isolated product photography, not the standard product-listing
photos) that don't exist yet for any tienda product — unlike the PLP
quick-add and OOS cross-sell fixes, this isn't a pure code change. If
wanted, the path would be: add an optional `overlay_image` field to the
hero slide metaobject in Shopify Admin (schema change, needs a deliberate
decision — not done automatically), render it as an absolutely-positioned
image with a `radial-gradient` backdrop behind it in
`SectionHeroSlider.tsx`, opt-in per slide (existing slides render
unchanged since the field would be empty). Flagging for whenever there's
product photography to use it with — genuinely nice differentiator, not
urgent.

## CSS spacing measurements (getComputedStyle, not eyeballed)

Measured directly via `getComputedStyle` on both sites at ~1536px viewport,
so these are real numbers, not visual estimates.

| Metric | thefeed.com | tienda | Note |
|---|---|---|---|
| Container max-width | 1312px | 1440px | tienda's content column is wider |
| Container side gutter | 24px | **96px** | see below — biggest gap found |
| Card/tile grid gap | 20px | 24px | close, not a meaningful difference |
| Card border-radius | 10px | 16px | tienda's cards are noticeably more rounded — aesthetic choice, not a problem either way |
| Section H2 font-size | 48px | 36px | thefeed's headings carry more visual weight |
| Section H2 font-weight | 400 | 400 | same — both use a light/editorial weight, not bold |

**Biggest finding: tienda's side gutter (96px) is 4x thefeed's (24px).**
At a 1536px-wide viewport, that's 192px of total dead margin on each side
vs. thefeed's 48px — meaningfully less content visible above the fold on
wide screens, and a lot of empty space framing the content column. This
may be an intentional "premium/spacious" design choice (worth asking
before changing) rather than an oversight, but it's a real, measurable,
easily-adjustable difference (`app/styles/app.css` / tailwind `.container`
config) that directly affects how much a shopper sees without scrolling —
flagging for task #79 as a concrete design decision to make, not
auto-changing it.

Note on the H2 margin comparison: tienda's `Heading` component applies
vertical spacing on an *outer wrapper* (e.g.
`<Heading className="mb-8 lg:mb-10">`), not the `<h2>` tag itself, so a raw
`h2 margin-bottom: 0px` reading is not a real gap — the actual
heading-to-content spacing needs to be checked at the wrapper level per
section, not generalized from one h2 measurement.

## Not applicable / correctly different
- thefeed's dark, black-background aesthetic with lime-green accents is a
  brand choice tied to their endurance-sports/nutrition positioning — not
  a signal tienda should copy wholesale; tienda's lighter, red-accent
  branding is appropriate for a broader home-gym-equipment audience.
- "Sponsored" placements/multi-brand marketplace dynamics (thefeed acts as
  a retailer for many nutrition brands with paid placement) — tienda's
  vendor structure is different enough that this isn't a direct parallel.

## Recommended next steps
Feed items #1 (OOS cross-sell) and #4 (PLP quick-add) into task #78
(page-by-page audit) as concrete things to verify/scope. Item #7 is
already tracked via tasks #70/#71 (SEO Tier 2 content gaps). Item #2 needs
a live check of the current Okendo placement before concluding it's a real
gap.
