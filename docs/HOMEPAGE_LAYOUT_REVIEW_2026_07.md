# Homepage design/layout/CSS review (2026-07-25)

Task #79. Follow-on from the thefeed.com teardown (docs/THEFEED_COMPETITIVE_TEARDOWN_2026_07.md),
which flagged two concrete design decisions plus a live visual QA pass of
tienda's own homepage.

## Decision 1: container gutter (96px vs thefeed's 24px) — corrected analysis, no change

The original teardown's "4x more dead margin" framing was **misleading**
once the container's `max-width` is factored in. tienda's container also
has a wider max-width (1440px) than thefeed's (1312px). Working out actual
visible content-box width at the ~1536px viewport both were measured at:

- thefeed: 1312px max-width − 48px total gutter = **1264px** visible content
- tienda: 1440px max-width − 192px total gutter = **1248px** visible content

A 16px difference — not 4x. Both sites show almost identical amounts of
actual content; tienda just reaches it via a wider max-width + proportionally
wider gutter (spacious/premium framing) instead of thefeed's narrower
max-width + narrower gutter (dense/edge-to-edge framing). **Decision: leave
as-is** — this is a legitimate stylistic choice, not a content-visibility
problem. (Single source of truth if ever revisited: `tailwind.config.js`
`container.padding`, one config value, no per-section overrides exist.)

## Decision 2: H2 heading size (36px vs thefeed's 48px, both weight 400) — no change

`app/components/Heading/Heading.tsx:38` default `fontClass =
'font-headline text-3xl md:text-4xl font-normal'` (30px mobile / 36px
desktop). **Decision: leave as-is** — thefeed's heavier headings suit
their editorial/endurance-sports brand voice; 36px is a reasonable choice
for a broader home-gym-equipment audience. Single source of truth if ever
revisited: this one default prop, applies everywhere `Heading` is used
with no local overrides found.

## Bug found and fixed: hero background renders completely blank in production

Live visual QA of tienda's actual homepage (not thefeed's) surfaced a real,
high-visibility production bug: the hero slider's background video never
loads — the hero renders as a blank gray box with no image behind it. This
is the very first thing every visitor sees.

**Root cause (confirmed, not guessed):**
- The video's `<source>` elements have correct, reachable URLs (verified:
  a `fetch()` to the exact URL returns 200 with the right content-type).
- But the `<video>` element itself never advances past `readyState: 0`
  (HAVE_NOTHING) — confirmed via the Resource Timing API that the browser's
  actual video-loading pipeline never completes a request, even though
  `.load()` fires a `loadstart` event before stalling forever with no
  `error` event.
- Tested the server's Range-request handling directly: a `Range:
  bytes=0-1023` request does return `206` with the correct byte count, but
  is **missing the `Content-Range` and `Accept-Ranges` response headers**
  that a spec-compliant 206 response requires — headers that `<video>`
  elements' internal buffering logic depends on to determine total file
  size and manage playback. A generic `fetch()`/HEAD doesn't care about
  this and succeeds anyway, which is why the file looked "fine" until
  tested from the browser's actual video pipeline.
- The video URL's hostname (`checkout.tienda-sportfitness.com/cdn/shop/
  videos/...`) is **genuine, intentional Shopify behavior** — confirmed via
  a direct Storefront API query returning the same domain — not a
  storefront code bug or a domain-rewrite issue. Shopify serves video
  through the store's Online Store Primary domain, and this specific
  store's primary domain happens to be named `checkout.tienda-
  sportfitness.com`.

**This points to a Shopify/CDN infrastructure issue** (likely in whatever
proxy/CDN layer fronts the Primary domain's `/cdn/shop/videos/` path
specifically for video Range requests) — **not something fixable in this
codebase**. Worth a Shopify Support ticket if reliable video hero
backgrounds matter going forward; not pursued further here since it's
outside storefront code scope.

**What was fixed (in scope, shipped)**: the hero had zero fallback when
video fails — no `poster` attribute, no image rendered behind/instead of
it. Added `poster={item.horizontal_image?.image?.url}` /
`poster={item.vertical_image?.image?.url}` to the `HeroVideo` component
(`app/sections/SectionHeroSlider.tsx`), using the fallback images already
uploaded in Shopify Admin for this exact slide (no new creative assets
needed). Verified live: hero now shows the poster image immediately
instead of a blank box, regardless of whether the underlying video ever
loads.

## Task #79 status: complete
Both flagged design decisions resolved (no-change, with corrected
analysis for the gutter). One real production bug found via live QA,
root-caused precisely, and fixed within storefront-code scope; the
underlying infrastructure issue documented for a separate Shopify Support
follow-up if desired.
