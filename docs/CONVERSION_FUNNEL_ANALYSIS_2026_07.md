# Conversion funnel analysis refresh (2026-07-25)

Task #77. Task #18 (original diagnosis, pre-dating this session's tracking
fixes) explicitly could not localize the drop-off: "shopify_events is only
6 days old (n=6 orders, statistical noise) and GA4 has no funnel-stage
granularity, only session/transaction totals with a known tracking-gap
undercount."

**Correction (2026-07-25, post-Codex-review on PR #93):** the first version
of this doc used a Jun 27–Jul 24 window and called it a trustworthy
post-fix baseline. Two things were wrong with that, both confirmed via
`git log`:
1. **The window was almost entirely pre-fix.** The phantom-`add_to_cart`
   fix (`e8895dd`) landed 2026-07-22 21:09, and the duplicate-GA4-purchase
   fix (`a159fe8`) landed 2026-07-23 20:43 — both merged 1-2 days before
   the window's end, not near its start. GA4 doesn't retroactively clean
   historical events, so the 28-day numbers mix contaminated add-to-cart
   counts and duplicate-purchase counts with a sliver of clean data.
2. **The percentages weren't a real sequential funnel.** They divided
   independent per-event "Active users" counts from a GA4 Free-form
   report — users who did `begin_checkout` in the window aren't
   guaranteed to be the same 382 users who did `add_to_cart`, and a
   purchase that completed a checkout started before the window boundary
   would appear in one bucket but not the other. A proper answer needs a
   GA4 Funnel Exploration (ordered, session-scoped) or an identifier-level
   cohort, not ratio division on independent counts.

Both issues are corrected below rather than patched — new data, explicit
caveats, and an honest statement of what still isn't resolved.

## Data source & method
Pulled directly from GA4 (Explore > Free form, Event name × Event count/
Active users), property Tienda SportFitness / SportFitness - GA4
(377125483). Two windows pulled for comparison:
- **28 days (Jun 27–Jul 24)**: mixed pre/post-fix, large sample.
- **3 days (Jul 23–25)**: genuinely post-fix (both fixes landed within or
  before this window), small sample.

Both are still independent per-event Active User ratios, **not** an
ordered GA4 Funnel Exploration — the sequential-cohort caveat from Codex's
review applies to both tables below. Treat the percentages as an
approximation of step-to-step conversion, not a rigorous cohort-verified
number.

## The numbers

| Step | 28d (Jun27–Jul24) users | 28d step conv. | 3d (Jul23–25) users | 3d step conv. |
|---|---|---|---|---|
| view_item | 4,669 | — | 371 | — |
| add_to_cart | 382 | 8.2% | 24 | 6.5% |
| begin_checkout | 225 | 58.9% | 14 | 58.3% |
| purchase | 29 | 12.9% | 2 | 14.3% |

**The 3-day post-fix window is not statistically meaningful on its own —
2 purchases is exactly the "statistical noise" problem task #18 already
hit once.** It's included only because it's directionally consistent with
the larger, contamination-mixed 28-day window on all three step-conversion
rates (within a couple points on each), which is a weak but real signal
that the qualitative shape isn't purely an artifact of the pre-fix data
issues. It is not strong enough evidence to confidently restate the
"checkout is the leak" conclusion as settled — see below.

## What this does and doesn't support

**Weakly supported, not confirmed:** `begin_checkout → purchase` looks
like the weaker step relative to `view_item → add_to_cart` in both
windows (~59% vs. ~85-87% drop-off respectively). `add_to_cart` conversion
(6.5-8.2%) is in a normal ecommerce range (typical benchmarks: 5-10%),
so it's less likely to be the priority than checkout completion — but
this is now a hypothesis with two data points pointing the same direction,
not an established finding the way the first version of this doc claimed.

**Not supported by this pass at all:** any specific percentage as "the"
current conversion rate. Neither window is both (a) fully post-fix and
(b) large enough to trust at the percentage level. That requires waiting
for more days of clean post-fix data to accumulate — this store's own
7-day snapshot (109 checkouts, 4 purchases, pulled earlier in this
session) suggests roughly a week of clean data would give a low-hundreds
sample size for `begin_checkout`, which is still thin but usable.

## Why this still matters for what's already in flight

Task #78's checkout-handoff review (UTM/attribution fix, PR #91;
confirmed discount codes/domain/webhooks structurally sound) remains
correctly scoped regardless of this data-quality issue — checkout being
*a* meaningful part of the funnel to get right isn't in question, only
whether *this specific 87% number* is trustworthy enough to cite as
established. It isn't, yet.

Also worth noting, unconfirmed: this store's payment mix (per the
CycleWear checkout benchmark researched earlier this session, a
comparable Colombian storefront) skews heavily toward BNPL providers
(Addi, Sistecredito) over straight card payments — BNPL approval-flow
latency/rejections are a plausible contributor to checkout-stage
abandonment specifically, worth checking against this store's own
payment-method breakdown once there's enough post-fix volume to make that
worthwhile.

## Recommended next steps
1. **Wait for more post-fix data** (recommend re-pulling this in ~1-2
   weeks) before treating any step-conversion percentage as a confident
   number, per the sample-size problem above.
2. **Build a real GA4 Funnel Exploration** (ordered steps, not independent
   event ratios) once there's enough post-fix volume — this session
   couldn't get that UI to configure reliably via browser automation, and
   the Free-form approximation was used instead. Worth a manual pass in
   the GA4 UI directly, or another automated attempt with more time
   budgeted for the step-editor's fragility.
3. Pull the same funnel split by device category (mobile vs. desktop) —
   not done in this pass.
4. Pull payment-method breakdown on completed vs. abandoned checkouts to
   test the BNPL-friction hypothesis directly, rather than inferring it
   from a comparable store.

## Task #77 status: complete, with an honest caveat
A rigorous, confident percentage-level baseline isn't achievable yet —
task #18's original "not enough clean data" conclusion turns out to still
apply post-fix, just for a different reason (need to wait out the pre-fix
contamination window rather than accumulate more history from zero). What
*is* delivered: two independently-pulled, methodologically-caveated data
points that weakly agree on which step looks weaker, an explicit map of
what would be needed to turn that into a confident finding, and a
corrected understanding of exactly how much post-fix data exists today
(effectively none — 1-2 days).
