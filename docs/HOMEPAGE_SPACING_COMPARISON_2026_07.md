# Homepage spacing system: tienda vs. thefeed.com (2026-07-27)

Follow-up to `THEFEED_COMPETITIVE_TEARDOWN_2026_07.md`, which measured
container gutter/grid-gap/border-radius/heading size but not vertical
section-to-section rhythm. That gap is closed here. All numbers below are
`getComputedStyle` reads on the live sites, not eyeballed — tienda measured
on `tienda-sportfitness.com`, thefeed on `thefeed.com/en-au` (geo-redirect),
both at a 1219px viewport unless noted.

**Note:** the container-gutter finding from the earlier teardown (96px vs.
thefeed's 24px) is already fixed and live — tienda now also measures 24px
at `lg`+. Not re-litigated here.

## The two systems are architecturally different, not just different numbers

**tienda**: one shared `space-y-*` gap on the parent wrapper
(`app/sections/Sections.tsx`) separates every section, regardless of
whether an individual section also has its own padding. Some sections carry
extra `py-*` padding on top of that shared gap; most don't.

**thefeed**: no shared gap at all — every section wrapper carries its own
`padding-top`/`padding-bottom` utility class (e.g. `layout-padding-top-40-64`),
and sections sit directly adjacent (`margin: 0`) to their neighbors. The
"gap" a viewer sees is 100% each section's own padding, not a parent-level
rule. This is also how they cleanly alternate background colors
(`layout-bg-black`) between sections with no seam.

## Numbers

| | tienda | thefeed |
|---|---|---|
| Spacing mechanism | `space-y-*` on parent (shared gap) | `padding-top`/`padding-bottom` per section (no shared gap) |
| Mobile section spacing | 32px (`space-y-8`) | 40px (`layout-padding-*-40-64`, <992px) |
| Desktop section spacing | 64px at `lg` (≥1024px), 80px at `xl` (≥1280px) | 64px (≥992px) — single desktop tier, no further scaling past that |
| Breakpoint framework | Tailwind (`sm 640 / md 768 / lg 1024 / xl 1280`) | Bootstrap (`sm 576 / md 768 / lg 992 / xl 1200`) |
| Smaller-gap tier available? | No — one scale for all sections | Yes — `layout-padding-*-16-20` exists for tighter sections |
| Per-section override | Some sections add their own `py-*` on top of the shared gap (stacks) | N/A — padding *is* the only mechanism, so no stacking is possible by construction |

## What this means concretely

On tienda, a section that has its own `py-*` (e.g. Intro Feature:
`py-12 lg:py-20`, 80px desktop) stacks with the shared 64px `space-y` gap to
its neighbor — **144px** of combined whitespace at that seam. A section
with no own padding (e.g. Category Cards Carousel) has just the 64px shared
gap. That's inconsistent seam-to-seam: some transitions are visually much
airier than others, not because of a deliberate content-based decision, but
because of which components happen to carry extra padding.

thefeed's model can't produce that inconsistency — every section's seam is
exactly that section's own padding value, and since almost everything uses
the same `40-64` tier, seams are uniform by construction. The `16-20` tier
exists as a deliberate escape hatch for sections that should sit tighter,
not an accident.

**Real, measurable difference, but not an obvious "bug"** — tienda's
current 64-80px desktop seams are in the same ballpark as thefeed's 64px,
so this isn't the 4x container-gutter gap the last teardown found. The
finding here is about *consistency*, not *magnitude*: tienda's per-section
`py-*` overrides create seam-to-seam variance thefeed's architecture
doesn't have. Whether to normalize tienda's sections to rely on the shared
gap alone (removing individual `py-*` overrides) or keep the current mixed
approach is a design call, not an auto-fix — flagging for the next design
pass rather than changing blind.

## Live section-by-section reference (tienda homepage, 11 sections, this session)

| # | Section | Own `py-*` | Combined seam to next section (at `lg`, 64px shared gap) |
|---|---|---|---|
| 0 | Hero (image) | 0 | 64px (shared gap only) |
| 1 | Hero Slider | `py-12 lg:py-16` (64px desktop) on inner wrapper | 64px (inner padding doesn't add to outer seam) |
| 2 | Intro Feature | `py-12 lg:py-20` (80px desktop) | **144px** (80 + 64) |
| 3 | Category Cards Carousel | 0 | 64px |
| 4 | Product Showcase | 0 | 64px |
| 5 | Product Feature | `py-16` (64px both edges) | **128px** (64 + 64) |
| 6 | Grid Products & Filter | 0 | 64px |
| 7 | Product Testimonial | 0 | 64px |
| 8 | Instagram Feed | 0 | 64px |
| 9 | Blog Carousel | 0 | 64px |
| 10 | Brands Ticker | `py-12` (48px both edges) | **112px** (48 + 64) |

Four of eleven seams are 1.75x–2.25x wider than the rest, purely from which
component happens to carry its own padding.
