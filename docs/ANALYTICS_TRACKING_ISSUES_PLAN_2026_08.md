# Analytics/Tracking Issues — Hypotheses, Tests, Plan

Date: 2026-08-12 · Owner: Felipe

Follow-up to the 2026-08-12 state check (GA4 warehouse on `cdp-stack`, RudderStack
`shopify_events`, live Shopify Admin API pull). Four issues surfaced; this doc
grounds each in a concrete, testable hypothesis rather than treating the
numbers as self-explanatory, then sequences the work.

## Summary table

| # | Issue | Status | Effort to fix |
|---|---|---|---|
| 1 | ~61% of GA4 sessions unattributed (`(not set)`) since wk of Jul 20 | Hypotheses only, needs GTM/GA4 UI access | Unknown until root cause known |
| 2 | GA4 purchase/revenue over-counted ~50-65% vs real orders | Hypotheses only, needs Shopify Admin UI access | Low-Med |
| 3 | RudderStack `order_completed` under-counts real orders ~25-29% | **Root cause confirmed** (redirect-gateway pixel loss) | Low-Med (one new webhook route, same pattern as `webhooks.ga4-mp.tsx`) |
| 4 | `checkout_started → order_completed` weak funnel step | **Mostly explained** — corrected rate (6.4-9.5%) is close to `view→add_to_cart`, most of the original gap was Issue 3's measurement artifact | N/A (diagnostic, not a bug) |

Issues 3 and 4 are answered below using data already on hand — no further
access needed to act on them. Issues 1 and 2 need interactive GTM/GA4/
Shopify Admin access to move past hypotheses; sequencing for those two:

---

## Issue 1 — GA4 session attribution broken for ~61% of traffic since Jul 20

**Observed:** `session_default_channel_group = 'Unassigned'`, `session_source_medium = '(not set)'`
jumped from ~50 sessions/week (stable Jun-early Jul baseline) to 2,358-2,643/week
starting the week of 2026-07-20 — 7,875 sessions total since. Timing lines up
with two changes that both landed around Jul 20-21: the GTM/GA4 "blackhole"
fix ([[reference_tsf_gtm_owns_tags_gap]]) and the Hydrogen redirect-theme
deploy (task #51, replacing the legacy Online Store theme leak).

**Hypotheses, ranked by plausibility:**
- **H1a — redirect hop strips referrer/landing-page context.** The
  redirect-theme deploy adds a hop before the real Hydrogen page loads. If
  that hop drops the original `document.referrer` or the landing URL's
  query string (gclid/fbclid/utm_*) before GA4's session-start fires on the
  final page, GA4 can't derive a channel — lands as `(not set)`.
- **H1b — GTM trigger/timing changed by the blackhole fix.** If the fix
  changed the GA4 Configuration tag's trigger (e.g. to a custom SPA
  route-change event instead of page-load), the tag could now fire after
  the SPA has already "consumed" the referrer/URL params internally,
  same end effect as H1a but at the tag-config layer instead of the code
  layer.
- **H1c — ad-platform-side URL issue**, unrelated to either deploy — a
  campaign flight that started ~Jul 20 with a malformed/missing UTM
  template. Lower plausibility only because it would need to explain
  *all* channels going unassigned, not just paid ones, and organic/direct
  traffic is affected too per the raw breakdown.

**How to test (cheapest first):**
1. Pull a handful of specific `(not set)` sessions' landing pages via GA4
   Explore (or BigQuery export if linked) — homogenous landing path
   (points at H1a/H1b, code/config-level) vs spread across many pages and
   sources (points at H1c or something broader).
2. GTM Preview mode against a fresh incognito session: load the site via a
   tagged URL (`?utm_source=test&utm_medium=cpc`), watch the Tags-fired
   timeline for the GA4 Configuration tag, and inspect `document.referrer`
   / `location.href` / the outgoing GA4 `collect` request's `dr`/`dl`
   params at the moment it fires.
3. Re-check Google Ads/Meta campaign URL templates for any change around
   Jul 20 (partial overlap with task #91's UTM audit — just needs a
   re-look at anything dated after that audit).

**Expected result:** step 2 should be decisive — either the collect
request already carries a blank/stripped referrer (code/redirect issue,
H1a) or the tag fires with good data but GA4 still can't resolve a channel
(GTM config issue, H1b). Fix is scoped accordingly: either preserve
referrer/query-string through the redirect middleware, or fix the GA4 tag
trigger in GTM-KNGTLWDD.

---

## Issue 2 — GA4 purchase/revenue over-counted ~50-65% vs real orders

**Observed:** GA4 `ecommerce_by_campaign` reports 19/34/24 transactions and
10.2M/10.5M/9.2M COP revenue for weeks that actually had 14/21/15 real paid
Shopify orders and 10.0M/5.77M/5.49M COP revenue (weeks of Jul 20/27, Aug 3).

**Grounding:** confirmed via code read that `app/routes/webhooks.ga4-mp.tsx`
is the *only* place in this repo that ever sends a GA4 `purchase` event —
there is no client-side `purchase`/`transaction` push anywhere (`grep`
came back empty). It fires once per `orders/paid` webhook, deliberately
scoped to that single topic to avoid double-firing on `orders/create` (the
code's own comment explains this). So a second source, external to this
codebase, is the most likely explanation for counts exceeding real orders.

**Hypotheses:**
- **H2a — Shopify's native "Google & YouTube" channel (or a similar
  installed app) is also wired to the same GA4 property** and fires its
  own purchase hit from the Shopify-hosted checkout/thank-you page,
  independent of this app's code. Most plausible given no in-repo second
  source exists.
- **H2b — Shopify webhook redelivery causes the MP webhook to fire more
  than once per order.** Shopify delivers webhooks at-least-once and
  retries on non-2xx/timeout. `webhooks/ga4-mp` forwards synchronously to
  GA4 MP before responding — any slow GA4 response near Shopify's timeout
  could trigger a Shopify retry, and GA4 MP does **not** dedupe
  server-to-server hits by `event_id` (per the route's own comment).
- **H2c — session_id bug is live in tienda's code too** (already
  confirmed by direct code read: `webhooks.ga4-mp.tsx` sets
  `params.session_id = gaSessionId` unconditionally before branching on
  event type, so it lands on `purchase` events too when the cart captured
  a `_ga_session_id`). This is the same bug documented in
  [[reference_ga4_mp_session_id_purchase_bug]] and fixed on cyclewear
  (PR #110) — that fix was never ported here. On its own this would cause
  **under**-counting (GA4 MP silently drops `purchase` events carrying
  `session_id`), which doesn't explain the observed over-count — but it's
  a confirmed live bug regardless and should be fixed either way, since it
  means some legitimate purchases are being silently dropped even as
  others are (per H2a/H2b) being double-counted.

**How to test:**
1. Shopify Admin → Sales channels: check whether "Google & YouTube" (or
   any other GA4-linked app) is installed and which measurement ID it's
   connected to. Five-minute check, confirms/kills H2a immediately.
2. Shopify Admin → Settings → Notifications → Webhooks → delivery history
   for the `orders/paid` subscription pointed at `/webhooks/ga4-mp`: look
   for repeated deliveries (same order, multiple timestamps) or non-2xx
   responses. Confirms/kills H2b.
3. Pick 2-3 real orders from the already-pulled Shopify order list, search
   GA4 Realtime/DebugView (or Explore once the data lands) for that
   `transaction_id`, count occurrences.

**Expected result:** H2a is the single most likely answer given the
plan/scale of this store and the "no second in-repo source" finding —
expect to find a Shopify-native app double-reporting to the same property.
Fix is either disconnecting/reconfiguring that app's GA4 link, or (if it's
wanted for other reasons) migrating tienda's own `PUBLIC_GA_MEASUREMENT_ID`
tracking to a clearly separate stream. **H2c (the session_id bug) should
be fixed regardless of what H2a/H2b turn up** — it's a one-line change
(move `params.session_id = gaSessionId` inside the `checkouts/create` case
only, matching the cyclewear fix) and costs nothing to ship now.

---

## Issue 3 — RudderStack `order_completed` under-counts real orders ~25-29% — ROOT CAUSE CONFIRMED

**Observed:** `shopify_events.order_completed` shows 6/10/15/11 events for
weeks that had 8/14/21/15 real Shopify orders (Jul 13/20/27, Aug 3).

**Grounding:** confirmed via code read that no client-side `rudderTrack()`
call for order completion exists anywhere in this repo (`window.rudderanalytics.track`
is only ever called generically from `CustomAnalytics.tsx`, with zero
callers passing an order-completion event). The table's `context_topic`
column is `'checkout_completed'` for all 46 rows — that's Shopify's
**Web Pixels / Customer Events** naming convention, not a raw webhook
topic (real Shopify webhook topics look like `orders/paid`). So this is a
**client-side pixel running on Shopify's own hosted checkout/thank-you
page**, entirely outside this repo's control, not a server-side webhook.
This also means the 2026-08-03 `ORDER_SOURCE_RECONCILIATION` doc's
"29/29 matched" result only ever checked **precision** (are RudderStack's
captured orders real?), never **recall** (did it capture every real
order?) — the gap was simply never tested for before now.

**Confirmed via direct order-diff (ran this now, not deferred):** joined
the 62 real Shopify orders since Jul 13 against the 46
`shopify_events.order_completed` rows by order ID. **16 orders are
missing**, and the pattern is exact, not fuzzy:

| Payment gateway | Missing | Present | Capture rate |
|---|---|---|---|
| Mercado Pago Tarjetas (direct card, no redirect) | 0 | 19 | **100%** |
| Mercado Pago Checkout Pro (external redirect) | 5 (+1 combo) | 12 (+1 combo) | ~68% |
| Addi Payment (BNPL, external redirect) | 9 (+1 combo) | 7 (+1 combo) | ~44% |
| Sistecredito (BNPL, external redirect) | 1 | 5 | ~83% |

**Every single missing order used a gateway that redirects off-site**
(Addi, Mercado Pago Checkout Pro, or Sistecredito); **every order paid via
direct card entry (Mercado Pago Tarjetas) was captured, 19/19**. This
isn't a BNPL-specific gap (H3c as originally framed) — it's an
**external-redirect gap**: the Web Pixel only fires if the browser lands
cleanly back on Shopify's own thank-you page after the round-trip to
Addi/Mercado Pago/Sistecredito's own domain, and it's silently missing
that landing roughly a third to over half the time depending on gateway
(worst on Addi, ~56% loss).

**H3a (resource-capped LXC drops webhook deliveries) is now ruled out** —
there's no webhook in this path to drop; it's 100% a client-side pixel
mechanism. H3b (pre-existing untested gap) is confirmed true but is a
description, not a cause.

**Recommended fix, given the mechanism is now known:** don't try to make
the client-side pixel more reliable (redirect-flow tab loss is largely
outside this app's control) — instead add a **server-side capture** as
the reliable path, the same pattern already proven working for GA4 MP
(`webhooks.ga4-mp.tsx`, listening to `orders/paid`). A parallel
`webhooks.rudderstack-order-completed.tsx` (or extending the existing GA4
MP route) that forwards `orders/paid` to RudderStack's HTTP source API
would catch 100% of paid orders regardless of redirect-flow tab loss,
matching Mercado Pago Tarjetas' current 100% capture rate for every
gateway. The existing Web Pixel can stay as-is (still useful for
whatever session-level context it carries) — just needs a
`checkout_id`/`order_id` reconciliation guard so a future analysis
doesn't double-count once both sources exist (dedupe by `order_id` when
querying, no need to suppress either source at write time).

**Remaining optional step, only if a lower-priority "why do some
redirects fail" curiosity is worth chasing later:** check `docker logs
cdp-rudder`/`cdp-transformer` on `cdp-stack` around the 16 missing
orders' timestamps for any client-request-never-arrived vs
arrived-but-rejected distinction — cosmetic at this point given the fix
doesn't depend on it, but would satisfy the "is it ad-blockers or a
genuine redirect failure" question if it ever matters for something else
(e.g. diagnosing actual checkout abandonment, not just tracking gaps).

---

## Issue 4 — `checkout_started → order_completed` weak step (~5-7%)

**Observed:** across 3 full post-fix weeks, `checkout_started` converts to
`order_completed` at only 4.5-6.8%, notably weaker than
`view → add_to_cart` (7.5-9.5%, a normal ecommerce range).

**Hypotheses:**
- **H4a — genuine friction**, most plausibly BNPL approval/rejection
  latency given the ~54% Addi/Sistecredito payment mix (matches the
  original Jul conversion-funnel doc's unconfirmed hypothesis).
- **H4b — partly a measurement artifact of Issue 3.** If
  `order_completed` under-counts by ~25-29%, the *true* conversion rate
  is a proportionate amount higher than what's currently showing. Doesn't
  rule out real friction, but means the raw 5-7% is a lower bound, not
  the true rate.
- **H4c — non-payment friction** (shipping/address step) that RudderStack
  can't see because `checkout_started` is captured as a single blob, not
  broken into sub-steps.

**Recomputed now that Issue 3's real numbers are available** (using real
Shopify paid-order counts as the numerator instead of the under-counted
`order_completed` events, same `checkout_started` denominator — caveat:
`checkout_started` is a separate pixel/event that hasn't itself been
recall-tested the way Issue 3 tested `order_completed`, so this is a
partial correction, not a fully verified one):

| Week | checkout_started | order_completed (raw) | real paid orders | rate (raw) | rate (corrected) |
|---|---|---|---|---|---|
| Jul 20 | 220 | 10 | 14 | 4.5% | **6.4%** |
| Jul 27 | 222 | 15 | 21 | 6.8% | **9.5%** |
| Aug 3 | 226 | 11 | 15 | 4.9% | **6.6%** |

H4b is confirmed real and larger than expected: the corrected rate
(6.4-9.5%) is meaningfully higher than the raw tracked rate (4.5-6.8%)
and now sits roughly in the same range as `view→add_to_cart` (7.5-9.5%)
rather than clearly below it. **Much of what looked like "the weak funnel
step" in the original analysis was a measurement artifact of Issue 3, not
(mostly) real friction.**

**Remaining test, now lower-priority given the above:**
1. Cross-reference the Issue 3 missing-order list's payment methods
   against a broader "abandoned checkout" pull (Shopify has an
   `abandoned_checkouts` endpoint) — if BNPL/redirect-gateway checkouts
   are disproportionately abandoned even where the *order itself* never
   completed at all (not just untracked), that's still real friction
   worth chasing, just a smaller residual than originally thought.
2. Once Issue 3's server-side fix ships, re-pull this same table with
   clean data going forward to confirm the corrected range holds.

**Expected result:** the funnel is healthier than the raw numbers
suggested. Don't prioritize a BNPL-friction investigation as urgently as
the original framing implied — re-verify with clean post-fix data first,
since the "weak step" that motivated that hypothesis has now mostly
resolved to a tracking gap.

---

## Plan / sequencing

**Already done in this pass** (no further access needed):
- Issue 3 — root cause confirmed, exact 16 missing orders identified,
  fix direction scoped (server-side `orders/paid` webhook → RudderStack,
  same pattern as the existing GA4 MP route).
- Issue 4 — recomputed with corrected numbers; mostly resolves to being
  Issue 3's artifact, residual BNPL-friction question downgraded to
  low-priority.

**Still needs interactive access:**
1. **Issue 2, H2c fix** — ship the one-line `session_id` scoping fix in
   `webhooks.ga4-mp.tsx` (move it into the `checkouts/create` case only).
   Zero-risk, already proven-correct pattern from cyclewear, doesn't need
   any external access — can do this alongside Issue 3's fix.
2. **Issue 3 fix implementation** — new `webhooks.rudderstack-order-completed.tsx`
   (or extend the GA4 MP route) forwarding `orders/paid` to RudderStack's
   HTTP source API. Needs the RudderStack write key (check
   `.secrets/rudderstack.env` in `klaviyo-migration`) and a Shopify Admin
   webhook registration (Settings → Notifications → Webhooks), same as
   the existing GA4 MP webhook.
3. **Issue 2, steps 1-2** (Shopify Admin sales-channels check + webhook
   delivery history) — 15 min, needs Shopify Admin UI access.
4. **Issue 1, steps 1-2** (GA4 Explore sample + GTM Preview walkthrough) —
   30-45 min, needs GA4/GTM UI access (browser).

Want me to go ahead and implement the Issue 3 server-side fix + the
Issue 2 `session_id` one-liner now (both are code-only, no Admin UI
needed until the webhook registration step), while 3 and 4 wait for you
to have Shopify/GA4 Admin open?
