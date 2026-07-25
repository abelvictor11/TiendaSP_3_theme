# Conversion investigation — full findings (2026-07-25)

## Purpose and how to read this document

This started from a hypothesis: "most of our conversion issues are UI/UX." The
investigation pulled data from three independent sources — Shopify's own
order ledger, GA4 behavioral events, and Google Search Console organic
performance — at four granularities (monthly, quarterly, half-year, and a
single YoY snapshot) to see whether the shape of the decline actually
supports that hypothesis, or points somewhere else.

**Explicit instruction from this investigation's scope: do not treat any
single comparison here as a definitive, final conclusion.** A 12-month YoY
snapshot, taken alone, hides *when* things changed and can make a two-phase
problem look like one smooth trend. The month/quarter/half breakdown below
exists specifically to check that. Where the granular data complicates or
contradicts the headline YoY number, that's flagged explicitly rather than
smoothed over.

All raw pulls are saved as CSVs in this folder:
- `shopify_orders_monthly.csv` — Shopify Admin API, paginated `orders()` query, source-of-truth order ledger (May 2025–Jul 2026)
- `ga4_monthly_funnel.csv` — GA4 Explore, Year×Month×Event name, funnel events only (Jun 2025–Jul 2026)
- `ga4_monthly_traffic_medium.csv` — GA4 Explore, Year×Month×First user medium, raw (194 rows)
- `ga4_monthly_traffic_medium_buckets.csv` — same, collapsed into 7 broad channel buckets
- `gsc_monthly_organic.csv` — Google Search Console, domain property, monthly clicks/impressions (Mar 2025–Jul 2026, the 16-month display cap)
- `monthly_combined.csv`, `quarterly_rollup.csv`, `halfyear_rollup.csv` — the three sources joined and rolled up
- `google_ads_monthly.csv` — Google Ads "tienda-sportfitness - CO" account, monthly cost/clicks/impressions/conversions (Jan 2025–Jul 2026), pulled via the account's [report editor](https://ads.google.com/aw/reporteditor/view?ocid=269449138&euid=454331993&__u=4051727057&uscid=269449138&__c=1305408162&authuser=0&__e=2359776801&reportState=GrsBChoKBU1vbnRoEg0KCQoHCgVNb250aBAAGAAgMgp_CgRDb3N0CgdBdmdDb3N0CgZDbGlja3MKIXN0YXRzLnBvc3RfaW52b2ljZV91cGRhdGVkX2NsaWNrcwoLSW1wcmVzc2lvbnMKHUFjdGl2ZVZpZXdWaWV3YWJsZUltcHJlc3Npb25zChdDb252ZXJzaW9uc01hbnlQZXJDbGljayIcCBwSGAoKMjAyNS0wMS0wMRIKMjAyNi0wNy0yNCIEGgIIAg%3D%3D)
- `meta_ads_monthly.csv` — Meta Ads Manager "Tienda SportFitness" account (218335765418186), monthly spend/impressions/reach (Feb 2025–Jul 2026)
- `ga4_sessions_vs_activeusers.csv` — GA4 Explore, Year×Month, Sessions vs Active users (Jun 2025–Jul 2026)
- `ga4_last28days_source_bounce.csv` — GA4 Explore, Session source/medium × bounce rate, last 28 days
- `ga4_last28days_landingpage_bounce.csv` — GA4 Explore, Landing page × bounce rate, last 28 days (top 25 by volume)
- `ga4_last28days_device_funnel.csv` — GA4 Explore, Device category × Event name, funnel events, last 28 days

## Correction carried over from the prior pass

An earlier pass in this investigation incorrectly concluded the store was
~14 months old based only on `shop.createdAt` in the Shopify Admin API. That
field is when *this Shopify instance* was created (a platform migration),
not the business's founding date. Cross-referenced properly: Wayback Machine
shows continuous crawl history back to 2018-04-30, and
`app/data/legacyRedirects.json` has 634 WordPress/WooCommerce-style URLs from
a real prior catalog. This is a 7+ year business that migrated platforms
around April–May 2025 — a real YoY comparison is valid. Full detail in
`docs/UX_CONVERSION_SIGNAL_FRAMEWORK_2026_07.md`.

---

## 1. Monthly data, all three sources side by side

Revenue in COP. GA4 columns are Active Users who fired that event in the
month. GSC is domain-property organic clicks/impressions.

| Month | Orders | Revenue (COP) | GA4 sessions | view_item | add_to_cart | begin_checkout | purchase | GSC clicks | GSC impr. |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2025-03 (23–31 only) | — | — | — | — | — | — | — | 3,777 | 188,463 |
| 2025-04 | — | — | — | — | — | — | — | **12,458** | 606,079 |
| 2025-05 | 28 | 46,225,361 | — | — | — | — | — | **11,159** | 574,009 |
| 2025-06 | 338 | 191,622,726 | 27,271 | 15,041 | 1,772 | 1,387 | 277 | 3,761 | 205,920 |
| 2025-07 | 305 | 155,093,955 | 29,533 | 17,269 | 1,883 | 1,445 | 236 | 3,516 | 199,061 |
| 2025-08 | 245 | 98,454,249 | 18,403 | 10,709 | 1,229 | 926 | 197 | 2,147 | 144,207 |
| 2025-09 | 204 | 62,179,331 | 19,008 | 11,515 | 1,058 | 796 | 168 | 2,500 | 148,463 |
| 2025-10 | 215 | 90,912,448 | 22,514 | 13,886 | 1,460 | 1,010 | 168 | 2,294 | 134,535 |
| 2025-11 | 212 | 73,791,177 | 18,828 | 12,181 | 1,062 | 777 | 164 | 3,075 | 215,539 |
| 2025-12 | 88 | 50,943,627 | 15,972 | 9,388 | 752 | 549 | 69 | 1,742 | 112,097 |
| 2026-01 | 145 | 65,494,613 | 40,898 | 12,681 | 1,087 | 679 | 115 | 2,745 | 176,202 |
| 2026-02 | 135 | 65,300,701 | 29,386 | 12,626 | 997 | 672 | 113 | 2,470 | 169,504 |
| 2026-03 | 106 | 53,376,813 | 15,866 | 9,503 | 663 | 541 | 78 | 2,388 | 175,203 |
| 2026-04 | 73 | 40,095,404 | 15,995 | 6,560 | 296 | 438 | 54 | 2,187 | 154,798 |
| 2026-05 | 50 | 23,599,895 | 18,711 | 7,312 | 635 | 290 | 30 | 2,029 | 149,686 |
| 2026-06 | 37 | 13,398,032 | 13,205 | 5,832 | 542 | 223 | 14 | 2,097 | 160,004 |
| 2026-07 (1–22/25) | 33 | 12,841,056 | 8,294 | 4,186 | 335 | 203 | 25 | 1,400 | 122,723 |

A few things jump out immediately from the monthly view that a single
12-month YoY comparison cannot show:

**The GA4 `session_start` numbers for Jan–Feb 2026 (40,898 and 29,386) are
the two highest months in the entire 14-month series** — higher than any
month in 2025, including the pre-migration peak. That looks like it
contradicts the "traffic is collapsing" story, until you cross-reference
with the traffic-medium breakdown in section 3: almost that entire spike is
attributed to `(none)` medium (20,598 and 9,261 active users respectively),
which usually signals untagged/no-referrer traffic — possibly bot traffic,
an app webview, or a tracking/attribution artifact, not real new demand.
**This is flagged as unresolved, not concluded** — see open questions.

**`view_item_list` (collection-page views) is ~0 for every month from June
2025 through March 2026, then jumps to 1,418–2,820 from April 2026
onward.** That is very unlikely to be real user behavior — collection pages
didn't stop being visited for 10 months and then start again. This reads as
an instrumentation gap that got fixed around April 2026, not a behavioral
signal. **Do not use `view_item_list` for any YoY or trend comparison** —
it's a tracking artifact for at least the first 10 months of this series.

## 2. Quarterly rollup

| Quarter | Months in data | Orders | Revenue (COP) | GA4 sessions | view_item | add_to_cart | begin_checkout | purchase | GSC clicks | GSC impr. |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2025 Q2 | 2 (May–Jun) | 366 | 237,848,087 | 27,271 | 15,041 | 1,772 | 1,387 | 277 | 14,920¹ | 779,929 |
| 2025 Q3 | 3 | 754 | 315,727,535 | 66,944 | 39,493 | 4,170 | 3,167 | 601 | 8,163 | 491,731 |
| 2025 Q4 | 3 | 515 | 215,647,252 | 57,314 | 35,455 | 3,274 | 2,336 | 401 | 7,111 | 462,171 |
| 2026 Q1 | 3 | 386 | 184,172,127 | 86,150 | 34,810 | 2,747 | 1,892 | 306 | 7,603 | 520,909 |
| 2026 Q2 | 3 | 160 | 77,093,331 | 47,911 | 19,704 | 1,473 | 951 | 98 | 6,313 | 464,488 |
| 2026 Q3 | 1 (Jul, partial) | 33 | 12,841,056 | 8,294 | 4,186 | 335 | 203 | 25 | 1,400 | 122,723 |

¹ Q2 2025 GSC clicks include the pre-migration Apr/May spike (12,458 +
11,159), so this row isn't comparable to later quarters the same way the
order/GA4 columns are — Shopify order data only starts partway through Q2
(May 24, 2025), and GA4 event tracking only starts in June 2025.

Quarter-over-quarter, orders decline every single quarter with no
rebound: 754 → 515 → 386 → 160 → (33 for a partial Q3). Revenue follows the
same monotonic pattern. This is the cleanest, most source-independent signal
in the whole dataset (Shopify's own order ledger, no tracking-code
dependency) and it says the decline has been continuous for over a year, not
a one-time event.

## 3. Half-year rollup — H2 2025 vs H1 2026

This is the comparison the user specifically asked for. Numbers are summed
across the 6 months in each half (H1 2026 is complete Jan–Jun; H2 2025 is
complete Jul–Dec — note Shopify/GA4 both have partial or missing May–Jun
2025 data feeding into what would be "H1 2025," so H1 2025 isn't included as
a clean comparison point).

| Half | Orders | Revenue (COP) | GA4 sessions | view_item | add_to_cart | begin_checkout | purchase | GSC clicks | GSC impr. |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2025 H2 (Jul–Dec) | 1,269 | 531,374,787 | 124,258 | 74,948 | 7,444 | 5,503 | 1,002 | 15,274 | 953,902 |
| 2026 H1 (Jan–Jun) | 546 | 261,265,458 | 134,061 | 54,514 | 4,220 | 2,843 | 404 | 13,916 | 985,397 |
| **Change** | **-57.0%** | **-50.8%** | **+7.9%** | **-27.3%** | **-43.3%** | **-48.3%** | **-59.7%** | **-8.9%** | **+3.3%** |

**This is the single most important table in this document, and it
complicates the original UI/UX hypothesis in an interesting way.**

Sequential half-over-half (not YoY — this is H2'25 vs the immediately
following H1'26), orders and purchases fell by roughly half to
two-thirds. But **top-of-funnel volume did not fall in the same
proportion** — GA4 sessions were flat-to-up (+7.9%) and GSC organic clicks
were nearly flat (-8.9%, essentially noise-level compared to the order
decline). Impressions in GSC actually rose slightly.

That combination — **flat-to-growing traffic, collapsing conversion at
every funnel stage below the landing** — is a very different diagnostic
picture than "traffic dried up." view_item fell 27%, but add_to_cart fell
43%, begin_checkout fell 48%, and purchase fell 60% — the drop-off compounds
at each step, same pattern as the earlier YoY finding, but this time it's
happening on top of *roughly stable* traffic volume, not declining traffic.
This shifts weight back toward genuine on-site conversion/UX friction (or
traffic *quality* degrading even while traffic *quantity* holds) as at least
part of the explanation for the most recent 6 months — see the traffic-mix
caveat below before treating this as settled, though.

## 4. The exact-day-matched YoY snapshot (context from the prior pass)

For reference, the original finding that kicked off this deeper pull, pulled
via GA4's native Compare → Previous year (Jul 1–25, exact day count matched
both years):

| Step | Jul 1–25, 2026 | Jul 1–25, 2025 | Change |
|---|---:|---:|---:|
| Active users | 8,323 | 26,517 | -68.6% |
| view_item | 4,175 | 15,385 | -72.9% |
| add_to_cart | 335 | 1,629 | -79.4% |
| begin_checkout | 203 | 1,262 | -83.9% |
| purchase | 25 | 207 | -87.9% |

This YoY comparison spans **both** of the distinct phases described below
(the Apr–Jun 2025 migration-driven organic collapse, and the more recent
H2'25→H1'26 conversion-rate decline on roughly stable traffic) folded
into one number. It is not wrong, but on its own it invites the
wrong mental model — a single cause, evenly spread — when the granular data
below shows at least two different things happening at different times.

## 5. Traffic-source/channel mix — the piece that reframes everything

Pulled via GA4 "First user medium," monthly, then bucketed into 7 broad
channels (raw 194-row breakdown in `ga4_monthly_traffic_medium.csv`,
bucketed version in `ga4_monthly_traffic_medium_buckets.csv`):

| Half | paid | organic | (none)/direct | referral | social | email | other/unknown | **Total** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 2025 H1 (Jun only, partial) | 18,100 | 3,246 | 3,531 | 1,831 | 369 | 61 | 434 | 27,572 |
| 2025 H2 | 90,519 | 12,645 | 14,324 | 4,418 | 187 | 345 | 2,363 | 124,801 |
| 2026 H1 | 80,654 | 10,811 | **35,223** | 4,745 | 979 | 328 | 1,750 | 134,490 |
| 2026 H2 (Jul only, partial) | 4,656 | 1,186 | 759 | 751 | 537 | 123 | 597 | 8,609 |

Two findings here, one confirms a hypothesis and one complicates it:

**Paid traffic (`cpc` + `paid` + `cpa` combined) has been the dominant
channel every single half in this dataset — never organic.** That's
worth stating plainly since the original ask assumed a UI/UX-first framing:
this store's demand is, and has been, overwhelmingly paid-acquisition-driven,
not organic/SEO-driven. Organic is a consistent single-digit-thousands/half
minor channel throughout.

**The `(none)` / direct-attribution bucket exploded from 14,324 (2025 H2) to
35,223 (2026 H1) — almost entirely concentrated in January (20,598) and
February 2026 (9,261), then back to normal (~1-2k/month) from March
onward.** This is a two-month anomaly, not a sustained trend. `(none)`
medium in GA4 usually means a session with no referrer and no campaign
parameters — could be direct type-in traffic, an app/webview context, bot
traffic, or a tracking/consent-mode gap. It is large enough (20K+ users in
one month) that it meaningfully inflates the "flat-to-growing" GA4 session
total in section 3's half-year table. **This is flagged as an open question,
not resolved** — if a meaningful share of that spike is non-human or
misattributed traffic, the "traffic held flat while conversion collapsed"
framing in section 3 gets weaker, and the picture shifts back toward "real
traffic also declined, it's just partly hidden by a two-month attribution
anomaly."

**Paid traffic itself shows a real, sharp, recent decline that lines up with
the steepest part of the order decline**: from the monthly bucket data,
total bucketed active users were 18,891 (May 2026) → 13,242 (Jun 2026) →
8,609 (Jul 2026, partial) — falling fast in exactly the two months where
orders also fell hardest (50 → 37 → 33). This is the most concrete,
checkable lead in the whole dataset: **something changed with paid
acquisition (spend, campaign structure, platform policy, creative
fatigue, or tracking) in June–July 2026 specifically.**

## 6. Google Search Console — the cleanest single signal in this investigation

Independent of GA4 event tracking entirely (GSC measures what Google
actually served in search results, not what fired on-site), and independent
of Shopify's order ledger:

| Period | Clicks | Impressions |
|---|---:|---:|
| 2025-03 (23–31 only, 9 days) | 3,777 | 188,463 |
| 2025-04 | **12,458** | 606,079 |
| 2025-05 | **11,159** | 574,009 |
| 2025-06 | 3,761 | 205,920 |
| 2025-07 | 3,516 | 199,061 |
| 2025-08 – 2026-06 (11 months) | 1,742 – 3,075/mo | 112,097 – 215,539/mo |
| 2026-07 (1–22, partial) | 1,400 | 122,723 |

**Organic clicks fell ~70–75% between May 2025 and June 2025 (11,159 → 3,761)
and have stayed in a ~1,700–3,800/month band ever since, with no recovery
trend across the following 13+ months.** This lines up almost exactly with
the platform migration window established in the prior pass (Shopify order
ledger starting 2025-05-24). This is the single cleanest step-change in the
entire dataset — sharp, dated, and sustained — and it is consistent with an
SEO-impacting migration event (URL structure changes, lost backlink equity,
re-indexing, redirect issues, or ranking resets) rather than a gradual UX
degradation.

**Caveat: organic was never the dominant channel** (see section 5) so this
collapse alone does not explain the majority of the order decline — but it
is very likely a real, first, and so-far-unrecovered problem sitting
underneath everything else that happened afterward.

## 7. Ad platform cross-examination — spend did NOT collapse, which changes the diagnosis

Section 5 flagged "something changed with paid acquisition in June–July
2026" as the most concrete lead in the dataset, reasoning from GA4's
first-user-medium bucket alone (18,891 → 13,242 → 8,609 active users,
May→Jun→Jul 2026). This section pulls the actual Google Ads and Meta Ads
account data to test that directly, and the answer is more surprising, and
more useful, than "ad spend got cut."

**Combined ad spend, orders, and Google Ads click volume, Nov 2025–Jul 2026**
(Google Ads: "tienda-sportfitness - CO" account; Meta: "Tienda SportFitness"
ad account 218335765418186 — the account actually running ads; a second,
empty Meta ad account under the same Business Manager was checked and ruled
out):

| Month | Orders | Google Ads cost (COP) | Google Ads clicks | Meta spend (COP) | Meta impressions | **Total ad spend** |
|---|---:|---:|---:|---:|---:|---:|
| 2025-11 | 212 | 1,072,206 | 7,523 | 1,540,552 | 127,898 | 2,612,758 |
| 2025-12 | 88 | 824,019 | 6,776 | 1,530,137 | 110,794 | 2,354,156 |
| 2026-01 | 145 | 905,604 | 11,974 | 1,638,964 | 149,623 | 2,544,568 |
| 2026-02 | 135 | 1,545,337 | 8,328 | 1,976,602 | 239,185 | 3,521,939 |
| 2026-03 | 106 | 1,212,852 | 5,000 | 1,734,617 | 234,493 | 2,947,469 |
| 2026-04 | 73 | 896,481 | 4,396 | 3,789,842 | 435,186 | 4,686,323 |
| 2026-05 | 50 | 1,080,970 | 4,477 | 3,804,492 | 340,534 | **4,885,462** |
| 2026-06 | 37 | 1,556,175 | 5,971 | 3,087,658 | 386,764 | 4,643,833 |
| 2026-07 (1–24/25) | 33 | 1,504,412 | 8,630 | 1,498,219 | 358,022 | 3,002,631 (partial month) |

**This directly contradicts the ad-spend-cut hypothesis.** Combined
Google+Meta spend nearly *doubled* from Nov 2025 (2.6M COP) to its Apr–Jun
2026 peak (4.6–4.9M COP/month) — the exact window where orders fell from 212
to 37 (an 83% drop). Google Ads clicks in June–July 2026 (5,971 → 8,630) were
actually *rising*, not falling, directly contradicting the GA4-bucket-based
read in section 5. Meta impressions likewise held in the 340–390K/month
range through May–July, not collapsing.

**So the GA4 "paid" medium collapse (May→Jul 2026, -69%) does not reflect a
drop in real, purchased ad delivery from either platform.** The two most
likely explanations, in order of how checkable they are:
1. **A UTM/attribution gap specific to paid clicks** — this session already
   found and fixed one real instance of this exact failure mode earlier
   (a missing `ttclid` param in `app/lib/checkoutContinuity.ts`, PR #91).
   If ad platform UTM tagging templates changed, or GTM/consent-mode
   logic started dropping campaign parameters before GA4 records the
   session, real paid clicks would land on-site and even convert in
   Shopify/ad-platform terms while GA4 attributes them to `(none)` or
   organic/direct instead of `cpc`/`paid` — which would also help explain
   the Jan–Feb 2026 `(none)` spike in section 5 as the same failure mode,
   not a separate anomaly.
2. **Real efficiency collapse** — the ads are delivering and being clicked,
   but converting far worse (rising CPMs from ad-auction competition,
   audience/creative fatigue after 12+ months of the same core creative,
   or the ads sending traffic to pages/products with the same conversion
   friction diagnosed in section 3).

**Two independent, concrete technical findings surfaced while pulling this
data, unrelated to the spend question but worth fixing regardless:**
- **Google Ads: the account has no primary conversion action configured**
  ("No se puede utilizar el objetivo vista de página para la optimización
  porque no tiene ninguna acción de conversión principal" — the account's
  optimization goal is defaulting to page views instead of purchases).
  This actively hurts Google's bidding algorithm's ability to optimize
  toward buyers, independent of any tracking-accuracy question. The
  account does have a real "Compras" (Purchases) conversion action showing
  1,890 purchases across Jan 2025–Jul 2026 — reasonably consistent with the
  ~2,214 total Shopify orders over the same window (evidence Google Ads
  purchase tracking is broadly working, even if not set as primary).
- **Meta Ads: near-total spend pause in August–September 2025** (both
  months show $0 in the account, with October 2025 also anomalously low at
  171,855 COP vs. a 1.5–3.8M COP/month norm) before resuming at higher
  spend from November 2025 onward. This is a distinct, dated campaign-
  management event that lines up with the same Aug–Oct 2025 window where
  Shopify order volume was also declining — worth confirming with whoever
  manages the Meta account whether this was a deliberate pause (budget,
  account review, creative refresh) or an account-health issue (ad
  disapproval, payment failure, policy flag).
- **Meta Ads is also mid-methodology-change**: a banner on the account
  states that as of 2026-03-17, "click results will report website and
  in-store conversions, such as purchases, only after link clicks"
  (previously broader attribution). This doesn't affect the *spend*
  numbers above, but means Meta's own "Results" column isn't reliably
  comparable before vs. after that date — another reason to lean on spend/
  impressions (unaffected) rather than Meta's self-reported conversions.

## 8. A major caveat found via git history: the tracking code itself has been unstable and under active repair

While auditing UTM/attribution end-to-end (the top next-step from the prior
version of this doc), `git log` on the tracking files themselves
(`GtmLoader.tsx`, `CustomAnalytics.tsx`, `RudderStackLoader.tsx`,
`checkoutContinuity.ts`) surfaced something that changes how much weight the
GA4 numbers in this whole document should carry — this needed to be written
up honestly rather than left out because it complicates the analysis.

**Timeline reconstructed from commit dates:**
- **2026-04-18 to 2026-04-20**: GA4/Meta Pixel/GTM tracking for this
  Hydrogen headless storefront was built essentially from scratch
  ("tracking SPA unificado", "agregar GtmLoader") — meaning proper
  SPA-aware client-side tracking on the *new* platform is only about 3
  months old as of this writing, not something that existed cleanly since
  the migration.
- **2026-05-14/15**: `PUBLIC_GOOGLE_ADS_ID` was added as a tracked variable
  for the first time — Google Ads conversion linking may not have been
  properly wired before this date.
- **2026-06-09**: a commit (`8120ee2`) with the message **"GA4 reportaba
  ~10x más sesiones que Shopify porque cada carga de página generaba 2
  page_views: el automático de gtag('config') + el manual de
  CustomAnalytics"** — i.e., the developer's own diagnosis was that GA4 was
  self-reporting roughly **10x more sessions than Shopify's actual order/
  session data**, caused by a duplicate page_view bug. The fix
  (`send_page_view: false`) was applied and then **reverted three minutes
  later** the same day (`d874cc9`), with no explanation in the revert
  commit.
- **2026-07-01** (`e1951a3`, "port fixes #15/#16/#17 a tienda"): this is
  the point where that fix (and others developed on sibling-brand branches)
  actually landed on the branch serving tienda-sportfitness — meaning the
  double-counting bug plausibly persisted on **this specific store** from
  ~April 2026 through ~July 1, 2026.
- **2026-07-09** (`471c89b`): a large modernization commit — Hydrogen
  2025.1.2 → 2026.4.4, Remix 2 → React Router 7.16 migration touching 89
  files, bundled with further analytics/consent rework.
- **2026-07-10 through 2026-07-25 (today)**: a dense, continuous sequence
  of consent-mode, RudderStack, bot-detection, and UTM/click-ID-forwarding
  fixes — averaging roughly one tracking-related commit every 1-2 days,
  ending with today's `ttclid` fix (section 7's earlier context).

**What this means for how to read this document:** the current
`GtmLoader.tsx` does have `send_page_view: false` set correctly (verified
by reading the live file), so the specific double-page_view bug described
above is fixed *now*. But it was self-diagnosed as inflating GA4 sessions
by roughly 10x for some real stretch of time this store was live on
Hydrogen, and the exact boundaries of that window aren't fully pinned down
here. The metric used throughout sections 1–7 of this document is GA4
**"Active users"**, not "Sessions" or event counts — active-users counts a
unique person once regardless of how many duplicate page_view/session_start
events they generated in one visit, so it is structurally less exposed to
this specific bug than sessions or event-count metrics would have been.
That's a reasonable basis for treating the Active-users-based trend shapes
in this document as still informative — but it is **not the same as
confirming they're unaffected**, and this was not verified before now.
**Do not treat any GA4 absolute number in this document (or any GA4-based
comparison spanning before/after early July 2026) as fully trustworthy
without first checking the Sessions-to-Active-users ratio by month** (see
next steps) — if that ratio moved meaningfully around the fix dates above,
some of the month-to-month shape described in sections 1–3 could be a
tracking-code artifact rather than real user behavior. Shopify's own order
ledger (section 2) remains unaffected by any of this and is the most
trustworthy series in this whole investigation.

## 11. Closing out the next-steps list (2026-07-25, later) — Sidekick cross-examination + items 1–7

This round worked through all seven items from section 10's original priority
list, plus independently verified a Shopify Sidekick-generated bounce-rate
report pasted into this investigation. New raw pulls: `ga4_sessions_vs_activeusers.csv`,
`ga4_last28days_source_bounce.csv`, `ga4_last28days_landingpage_bounce.csv`,
`ga4_last28days_device_funnel.csv`.

### 11.1 Sessions-vs-Active-users ratio (next-step #1) — stable, softens the section 8 caveat

| Year-Month | Active users | Sessions | Sessions/user |
|---|---:|---:|---:|
| 2025-06 | 27,411 | 39,774 | 1.451 |
| 2025-07 | 29,684 | 43,519 | 1.466 |
| 2025-08 | 18,474 | 25,862 | 1.400 |
| 2025-09 | 19,063 | 27,224 | 1.428 |
| 2025-10 | 22,554 | 32,380 | 1.436 |
| 2025-11 | 18,878 | 26,340 | 1.395 |
| 2025-12 | 15,992 | 21,881 | 1.368 |
| 2026-01 | 40,952 | 48,954 | 1.195 |
| 2026-02 | 29,441 | 38,997 | 1.325 |
| 2026-03 | 15,893 | 21,043 | 1.324 |
| 2026-04 | 16,008 | 18,536 | 1.158 |
| 2026-05 | 18,717 | 25,163 | 1.344 |
| 2026-06 | 13,228 | 16,977 | 1.284 |
| 2026-07 (partial) | 8,592 | 10,453 | 1.217 |

The ratio stays in a narrow 1.16–1.47 band across all 14 months, including
the exact window (Apr–Jul 2026) where the section 8 duplicate-`page_view`
bug was live on this branch. **No evidence of a ~10x session-inflation
artifact at monthly resolution for this property.** This meaningfully softens
(does not eliminate) the section 8 caveat — Active users, and by extension
Sessions, both look usable for the trend shapes described in sections 1–3.
The bug may have been real for a shorter window than a full month, or may
have self-corrected via GA4's own dedup logic; either way it isn't visible
here.

### 11.2 Shopify Sidekick's bounce-rate report — verdict per claim

A Sidekick-generated report (pasted into this investigation, not authored by
us) made several specific claims. Cross-examined directly against GA4 (Session
source/medium and landing page, last 28 days — a different, session-level
dimension than the "First user medium" used in section 5, which explains
some of the magnitude gaps below):

| Claim | Sidekick said | GA4 actual (last 28d) | Verdict |
|---|---|---|---|
| Facebook bounce rate | "75–76% consistently" | `facebook / paid` 59.5%, `facebook / referral` 36.4%, `fb / paid` 65.6%, `m.facebook.com / paid` 45.5% | **Direction confirmed (elevated), magnitude overstated** — no Facebook-attributed source/medium hit 75%+ |
| YouTube 95% bounce (week of Jul 13) | "spiked to a 95% bounce rate" | `youtube.com / referral`: 4 users / 5 sessions total over 28 days | **Not confirmed — almost certainly noise.** A 5-session sample makes any single-week rate statistically meaningless (1 of 5 sessions bouncing = 20%, 4 of 5 = 80%; "95%" isn't even reachable at this volume in a clean way) |
| Instagram improved to 43% | — | `ig / social` 28.55%, `instagram.com / referral` 20.80%, `l.instagram.com / referral` 13.66%, `ig / paid` 55.86% | **Roughly consistent** — all Instagram-attributed sources are meaningfully below the Facebook numbers, direction matches |
| `/collections/bicicletas-estaticas-y-spinning` bounce | "82.5%" | **84.07%** (371 users / 383 sessions) | **Confirmed** — closest match in the whole report |
| `/collections/caminadoras-y-trotadoras` bounce | "83.6%" | **45.71%** (67 users / 70 sessions) | **Not confirmed at 28-day aggregate.** Either a single-week spike that washed out over 28 days, or a Sidekick data-window/methodology difference — treat as unconfirmed, not as false |
| Homepage bounce worsened 48%→66% | — | Homepage (`/`) 59.99% (3,110 users / 3,582 sessions, last 28d) | **Plausible / in-range** — no historical GA4 pull was done to confirm the 48%→66% trend line itself, but the current level sits between those two figures |
| Mobile 69% vs desktop 56% bounce | — | Not pulled as bounce-by-device directly (see 11.5 for the device funnel pull instead, which measures funnel drop-off, not bounce) | **Not independently verified** — directionally plausible given mobile's much higher `view_item`-stage volume, but no bounce-rate-by-device number was pulled this round |
| "Unknown" high-quality source (60–65 sessions/wk, 1–3% bounce) that "disappeared" | — | No GA4 source/medium value matches this profile. The closest candidate by volume, `(not set)`, has the **opposite** character: 380 users / 414 sessions, **92.03% bounce** | **Not found in GA4 — likely a different data source.** Sidekick's own numbers (near-zero bounce, moderate volume) don't match `(not set)`'s behavior at all. Most likely explanation: Sidekick is reading Shopify's native analytics, which buckets traffic sources differently than GA4 (e.g. it may classify some referrer as "unknown" that GA4 resolves to a named source, or vice versa) |

**New finding, not present in Sidekick's report:** `(not set)` is a large,
previously-undocumented anomaly in its own right — both as a session medium
(380 users / 414 sessions, 92.03% bounce) and, more strikingly, as a
**landing page** value: 1,105 users / 1,327 sessions (**>11% of all sessions
in the last 28 days**) with a **90.58% bounce rate**. A landing page showing
as `(not set)` means GA4 captured the session but not the page path — this
points at an instrumentation/tag-timing gap (possibly related to the
consent-mode race described in section 8/11.4, or a redirect/edge-case route
not covered by `CustomAnalytics`), not a content problem. This is large
enough, and bad enough (90%+ bounce), to be worth its own follow-up
independent of the Sidekick report.

**Working theory for the underlying surge Sidekick described:** even though
several individual numbers don't hold up at 28-day aggregate, the general
shape (heavy recent Colombia/mobile/social growth) is consistent with
section 7's finding that combined ad spend nearly doubled into its
Apr–Jun 2026 peak, and with section 5's paid-channel dominance — so the
qualitative story ("more, lower-intent mobile social traffic diluting the
bounce rate") is plausible even where the specific weekly numbers aren't
independently confirmable from GA4's 28-day aggregate view.

### 11.3 UTM/attribution audit (next-step #2) — no live gap found

- **Google Ads**: account-level "Etiquetado automático" (auto-tagging) = Sí
  (on), "Seguimiento" (custom tracking template) = "No se establecieron
  opciones" (none set). This means `gclid` is appended automatically to
  every ad click with no custom override — clean, standard configuration.
- **`checkoutContinuity.ts` `MARKETING_PARAMS`** captures
  `utm_source/medium/campaign/term/content`, `gclid`, `fbclid`, `ttclid`.
  This covers what Google Ads auto-tagging and Meta/TikTok actually append
  for standard web campaigns. It does **not** include `gbraid`/`wbraid`
  (Google's privacy-preserving click IDs, used for PMax/app-to-web
  attribution) — low-risk gap given this account isn't running app
  campaigns, but worth adding if PMax usage expands.
- **Meta's own URL-parameter template could not be directly inspected** —
  Ads Manager's Billing/Business-settings surfaces live on `www.facebook.com`,
  which this browser session isn't authorized to read; in-SPA navigation
  inside `adsmanager.facebook.com` kept redirecting back to the Campaigns
  view rather than opening the URL-parameters editor. Not independently
  confirmed; `fbclid` capture is already covered in `MARKETING_PARAMS`
  regardless, which is the part that mattered most.
- **The consent-mode timing race flagged as an open question in section 8 is
  already fixed, per the code itself** (`GtmLoader.tsx` comments and
  `wait_for_update: 2000` logic) — a documented prior bug (polling
  `window.Shopify.customerPrivacy` directly, racing against a 500ms
  `wait_for_update`, which could lose first-hit attribution) was replaced
  with reading `customerPrivacy` from `useAnalytics()`'s own state and a
  2000ms default-denied window. Also relevant: Colombia doesn't require a
  consent banner under Shopify's Customer Privacy API, so
  `analyticsProcessingAllowed()`/`marketingAllowed()` both resolve to `true`
  immediately on load for CO traffic — consent grants aren't waiting on a
  user interaction that may never come. **No live UTM/consent-timing gap
  found this round.**

### 11.4 Meta Aug–Sep 2025 spend pause (next-step #3) — precise numbers, still unresolved

Exact monthly Meta spend confirms the pause and sharpens its recovery curve:
Jul 2025: 2,089,074 COP → **Aug 2025: 0 → Sep 2025: 0** → Oct 2025: 171,855
COP (a partial restart, ~8% of the pre-pause monthly norm) → Nov 2025:
1,540,552 COP (full resumption). Attempted to find a deliberate-vs-involuntary
signal directly in Ads Manager (billing history, account-update log) but
`www.facebook.com`-hosted panels aren't readable in this session and the
in-SPA "Ad account updates" panel didn't surface historical entries. **Still
unresolved — needs a direct conversation with whoever manages the Meta
account**, per the original next-step wording; no way to fully close this
one without human input.

### 11.5 Google Ads primary conversion action (next-step #4) — already fixed, verified only

Section 7 flagged this account as having no primary conversion action
(defaulting to page-view optimization). Re-checked live in Google Ads'
Conversions view this round: **"Compra" (Purchase) is now an account-default
goal with 5 primary conversion actions, active across 83 of 85 campaigns.**
This is a real, working purchase-optimization goal, not a page-view default —
the gap described in section 7 has been resolved (matches the account
owner's own recollection of a recent change). Two goal categories (Compra,
Agregar al carrito) still show a secondary "Requiere atención" status
alongside "Activa" elsewhere in the account — not investigated further this
round (a smaller diagnostic than "missing primary action", and no change was
made per explicit instruction to verify only, not to touch account
settings).

### 11.6 SEO/technical audit of the Apr–Jun 2025 migration window (next-step #5) — a concrete mechanism found

Wayback Machine's CDX index for `tienda-sportfitness.com` has only 4 crawls
in 2025, all between 2025-02-17 and 2025-05-10 (none since). Checking
`sitemap_index.xml` (the WordPress/Yoast default, and the exact path the
site's own `robots.txt` pointed to) against that window:

| Date | `sitemap_index.xml` | `robots.txt` |
|---|---|---|
| 2025-02-17 | **200** | — |
| 2025-03-30 | **404** | 200 (unchanged WordPress content) |
| 2025-04-08 | **404** | 200 (unchanged) |
| 2025-05-10 | **404** | 200 (unchanged) |

The live `robots.txt` served through at least 2025-05-10 was still the old
WordPress one (`Disallow: /wp-admin/`, `Sitemap:
https://tienda-sportfitness.com/sitemap_index.xml`) — meaning the site
hadn't yet cut over to the current Shopify-style `robots.txt`
(`Disallow: /admin`, `Sitemap: .../sitemap.xml`) as late as that date. But
the sitemap that same `robots.txt` pointed to had **already started 404ing
by 2025-03-30**, and stayed broken through the last available crawl. That's
a real, dated mechanism: **for at least ~6 weeks, Google had a `robots.txt`
directing it to a sitemap URL that no longer resolved**, right at the start
of the exact window (section 6) where GSC organic clicks collapsed
~70–75% and never recovered. Wayback has no further captures after
2025-05-10, so the precise cutover date to the current Shopify
`robots.txt`/`sitemap.xml` (both confirmed live and correct today) can't be
pinned down from this source alone — but the broken-sitemap-discovery window
is a concrete, independently-checkable contributor to the section 6 collapse,
not just a coincidence of timing.

### 11.7 Device-level funnel split (next-step #7) — full H2'25 vs H1'26 comparison, completed

Full data in `ga4_halfyear_device_funnel.csv`. Active users at each funnel
stage, by device, both halves:

| Device | Stage | 2025 H2 | 2026 H1 | Change |
|---|---|---:|---:|---:|
| Mobile | view_item | 56,426 | 43,020 | **-23.8%** |
| Mobile | add_to_cart | 5,494 | 3,376 | **-38.5%** |
| Mobile | begin_checkout | 3,899 | 2,247 | **-42.4%** |
| Mobile | purchase | 619 | 265 | **-57.2%** |
| Desktop | view_item | 14,449 | 8,924 | **-38.2%** |
| Desktop | add_to_cart | 1,735 | 715 | **-58.8%** |
| Desktop | begin_checkout | 1,463 | 526 | **-64.0%** |
| Desktop | purchase | 375 | 133 | **-64.5%** |
| Tablet | view_item | 310 | 278 | -10.3% |
| Tablet | add_to_cart | 39 | 22 | -43.6% |
| Tablet | begin_checkout | 19 | 18 | -5.3% |
| Tablet | purchase | 1 | 2 | (too small to read) |

**This overturns the single-window snapshot and the Sidekick-derived
mobile-is-worse narrative from section 11.2.** At the proper half-year
comparison — the same window section 3's headline table uses — **desktop
degraded more than mobile at every single funnel stage**, not less:
view_item -38.2% (desktop) vs -23.8% (mobile), and by purchase the gap
widens further (-64.5% vs -57.2%). Step-to-step conversion also confirms
this: desktop's view→cart rate fell from 12.0% to 8.0% and cart→checkout
from 84.3% to 73.6%, both bigger relative drops than mobile's equivalent
steps (9.7%→7.9% and 71.0%→66.6%). **The earlier single-28-day snapshot
(11.2 above) was misleading precisely because it was a snapshot, not a
trend** — exactly the kind of error this whole investigation's
month/quarter/half methodology exists to catch.

**New anomaly surfaced by this pull, not previously documented:**
desktop's bounce rate at `session_start` jumped from **38.0% (H2'25) to
69.9% (H1'26)** — mobile's moved far less over the same period (44.0% →
50.1%). A jump this large, concentrated on one device, in the same period
checkout conversion cratered, is a real lead worth chasing on its own —
possibly connected to, or independent of, the checkout-navigation bug found
in `app/routes/($locale).cart.tsx` (see the separate write-up on that). Not
yet root-caused here.

## 12. Checkout-navigation race condition — a candidate root cause, found and reproduced live (2026-07-25)

Separately from the traffic/attribution analysis above, a code-level bug was
found and confirmed reproducible on production that plausibly explains a
real share of the add_to_cart → begin_checkout drop-off documented in
sections 1, 3, and 11.7.

**The code** (`app/routes/($locale).cart.tsx`, `handleInitiateCheckout`,
lines ~401–416): the "Finalizar compra" / "Pagar" button is a real `<a
href={checkoutUrl}>`, but its `onClick` handler calls `e.preventDefault()`
whenever a cart-attributes payload needs writing (in practice this is
**always** — `_client_event_id` is unconditionally pushed onto the
attributes array), then does:

```js
fetch('/cart', {method: 'POST', body: form, keepalive: true})
  .catch(() => {})
  .finally(() => {
    window.location.href = decorateCheckoutUrl(checkoutUrl);
  });
```

Navigation to checkout is gated entirely behind this `fetch` settling, and
there is **no timeout**. If the `fetch` hangs — a slow response, a network
hiccup, the browser deprioritizing a background request — `.finally()`
never fires, `preventDefault()` already blocked the native navigation, and
the customer's click on "Pagar" does **nothing**, silently, with no console
error.

**Reproduced live on production**, desktop Chrome, no special conditions: a
fresh cart, "Pagar" clicked, page sat on `/cart` for 4+ seconds with zero
navigation and zero console errors; a second click on the same stuck page
then worked normally. Matches the shape of the funnel data exactly —
mobile and desktop cart→checkout both degraded (11.7) but not to zero,
consistent with a race condition hitting a minority of clicks rather than a
hard, universal break.

**Timeline**: introduced 2026-04-20 (`6435843`, "feat(tracking): fbp/fbc
enrichment (CAPI) + TikTok Pixel") — the same date and same commit message
as an equivalent commit (`ef056db`) on the sibling `cyclewear` branch,
independently ported rather than inherited (different hash, `ef056db` is
not an ancestor of `origin/tienda`). **Still live and unfixed on both
branches** as of this writing — `cyclewear`'s own `cart.tsx` has the
identical unfixed pattern in its latest commit, so there is no existing fix
to port from there; whichever branch fixes it first should have the patch
ported to the other.

**Fixed 2026-07-25.** `handleInitiateCheckout` was restructured so
`checkoutUrl` alone gates `preventDefault()` + navigation; the
attribute-persistence `fetch` is now fire-and-forget (still `keepalive:
true`, still fired, just no longer awaited before navigating). This exactly
matches the fix cyclewear shipped independently the same day (PR #94,
`fix/checkout-async-navigation-hang`) — compared line-by-line and adopted
their exact structure, which is slightly more defensive than an earlier
draft of this fix (cyclewear's version routes `checkoutUrl` as the sole
outer gate, so navigation and UTM/click-id decoration always happen even in
the hypothetical case `attributes` were ever empty; an earlier version of
this fix kept `attributes.length > 0` in the outer condition, which would
have silently fallen through to an undecorated native `href` in that case —
not a live bug today since `_client_event_id` is always pushed, but a
needless future footgun that cyclewear's structure avoids).

**Verified before shipping:**
- `npx tsc --noEmit` — no new errors (pre-existing errors in unrelated files unchanged).
- Reproduced the original hang locally: patched `window.fetch` to return a Promise that never resolves for `/cart` POST requests, clicked "Finalizar compra" — confirmed navigation to the real checkout screen (`checkout.tienda-sportfitness.com/checkouts/cn/...`) happened immediately, both before and after adopting cyclewear's exact structure.
- Confirmed the attribute-persistence fetch still fires correctly and still carries the `[CartForm]` payload (captured synchronously via an instrumented `fetch` override) — the fix removes the wait, not the request.
- Checked for a second, mobile-specific checkout entry point: none exists. The cart-drawer's own checkout handler (`app/components/Cart.tsx`) was independently confirmed to never have had this bug — it synchronously mutates `href` with no fetch-gating.
- **Re-verified under genuine mobile device emulation** (Chrome DevTools device toolbar, 400×881 viewport, Android/Pixel 9 UA, touch enabled): cart page renders correctly at this width, and the hung-fetch repro was re-run against this exact viewport — navigation to the real checkout screen still happened immediately with `/cart`'s POST permanently unresolved. This closes the mobile-QA gap flagged in an earlier draft of this write-up.
- Not chased further: several GA4/Google Ads conversion-beacon requests were observed returning 503 during this testing session — a separate, currently-live tracking issue worth a follow-up look.

**Still to do**: deploy, then watch mobile and desktop cart→checkout completion rate over the following 1–2 weeks for recovery toward the levels seen before the regression window (11.7's earlier-period baselines).

## 9. What this does and doesn't establish yet

**Reasonably well-supported by multiple independent sources:**
- The decline is real, large, and has been sustained for over a year — confirmed independently by Shopify's order ledger (no tracking dependency), GA4 events, and GSC.
- There appear to be **at least two distinct phases**, not one smooth trend:
  1. **Apr–Jun 2025**: a sharp, dated, ~70% organic-search collapse coinciding with the platform migration, never recovered.
  2. **Ongoing since**: a slower, compounding decline in on-site conversion (view→cart→checkout→purchase all degrading) that in the most recent half (2026 H1) happened despite roughly flat top-of-funnel GA4/GSC volume, and despite combined Google+Meta ad spend actually *rising* through Apr–Jun 2026 (section 7) — ruling out "traffic/spend dried up" as the explanation for the most recent, steepest part of the decline.
- Paid acquisition, not organic/SEO, has been the dominant demand channel throughout — relevant context for how much weight an SEO fix vs. an ads/UX fix should get.
- **Real ad spend did not collapse in Jun–Jul 2026** — Google Ads clicks and Meta impressions both held or rose in the exact window GA4's paid-medium bucket showed its sharpest drop, meaning that GA4 signal reflects an attribution/tracking gap or a genuine on-site conversion problem, not reduced ad delivery (section 7).
- The tracking implementation on this Hydrogen storefront is young (~3 months old) and was still being actively debugged as of today, including a self-diagnosed ~10x session over-count bug — this doesn't invalidate the document, but it is a real reason for humility about GA4's absolute numbers specifically (section 8).

**Now reasonably well-supported, resolved this round (section 11):**
- The section 8 duplicate-session caveat is softened — Sessions-to-Active-users ratio is stable across all 14 months, including the window the bug was live, with no visible ~10x inflation at monthly resolution (11.1).
- No live UTM/consent-timing gap in the current codebase — the specific race condition flagged as an open question in section 8 was already fixed in code, and Google Ads auto-tagging is clean (11.3).
- The Google Ads missing-primary-conversion-action gap (section 7) is fixed — "Compra" is now a working account-default goal with 5 primary actions across 83/85 campaigns (11.5).
- The Apr–Jun 2025 organic collapse (section 6) has a concrete, dated technical mechanism: a broken sitemap (`sitemap_index.xml` 404) that the site's own `robots.txt` was still pointing to as late as 2025-05-10 (11.6).
- Several of Shopify Sidekick's specific bounce-rate claims don't hold up at 28-day GA4 aggregate (notably the caminadoras-y-trotadoras collection page and the YouTube 95% figure, the latter almost certainly a small-sample artifact) — but the general "more, lower-intent mobile/social traffic" story is directionally plausible (11.2).
- **A concrete, reproduced code bug in the checkout button itself** (section 12) — navigation to checkout is silently blocked if a `fetch()` call hangs, no timeout, live since 2026-04-20. This is the strongest single candidate root cause found in this entire investigation for the add_to_cart→begin_checkout drop-off, because unlike every other finding above it doesn't require inferring cause from aggregate trends — it was directly reproduced.
- The full device split (section 11.7) overturns the earlier single-window read: **desktop, not mobile, degraded more** across H2'25→H1'26 at every funnel stage, alongside a large, unexplained desktop-specific bounce-rate jump.

**Explicitly NOT yet established — flagged as open questions requiring more
data before acting on them:**
- Whether the Jan–Feb 2026 `(none)`-medium traffic spike, and the May–Jul 2026 GA4 paid-medium collapse, share a common root cause in UTM/attribution or the broader tracking instability documented in section 8, rather than being separate anomalies.
- Whether the H2'25→H1'26 conversion-rate decline (traffic flat, purchases -60%) is a UX/friction problem, a traffic-*quality* problem (same volume, lower purchase intent per visitor), a pricing/assortment/inventory problem, a tracking artifact, or some mix — the funnel-stage compounding pattern is consistent with several of these and doesn't uniquely point to one.
- Whether the Meta Aug–Sep 2025 spend pause was deliberate (budget/creative decision) or involuntary (account/ad disapproval, payment failure) — still needs a conversation with whoever manages the Meta account; not resolvable from tooling alone (11.4).
- **New this round**: a large `(not set)` landing-page bucket — >11% of all sessions in the last 28 days, 90.58% bounce rate — meaning GA4 captured the session but not the page path. Not mentioned in Sidekick's report; likely an instrumentation gap, cause not yet diagnosed (11.2).
- ~~Full device-level split of the H2'25 vs H1'26 half-year comparison~~ — done (11.7); surfaced that desktop, not mobile, degraded most, plus a new desktop-specific bounce-rate anomaly (open item #9 in section 10).
- **A second Meta ad account for this store, "Tienda Sport Fitness" (1861970807157400), exists alongside the one this document's data is built on ("Tienda SportFitness", 218335765418186) — reported as a replacement due to a restriction on the original.** Checked directly: the second account has zero campaigns ever created (unused), and the original account shows no restriction banner and real live spend ($288,747 in the trailing 7 days as of this check) — so section 7's Nov 2025–Jul 2026 data does appear to be on the currently-active account. But the restriction itself, and its timing, could not be independently confirmed from the Ads Manager UI in this session — worth a direct confirmation from whoever manages the account before fully trusting this.
- Whether the `view_item_list` instrumentation gap (section 1) is connected to the same tracking-instability timeline in section 8 — both sit in the same Jun 2025–Mar 2026 / Apr–Jul 2026 windows.

## 10. Recommended next steps, in priority order

Items 1–5 and 7 below were the original priority list from the prior pass;
section 11 (2026-07-25) worked through all of them. Status noted inline —
see section 11 for detail on each.

1. ~~Pull GA4 "Sessions" vs Active-users ratio by month~~ — **done, stable, no ~10x artifact found (11.1).**
2. ~~Audit UTM/attribution tracking end-to-end~~ — **done, no live gap found (11.3).**
3. **Ask whoever manages the Meta ad account about the Aug–Sep 2025 near-total spend pause** — **still open.** Precise numbers pulled (11.4), but deliberate-vs-involuntary can't be determined without a human answer; not resolvable via tooling in this session.
4. ~~Fix the Google Ads account's missing primary conversion action~~ — **already fixed** (verified, not changed by us — the account owner made this change separately; 11.5).
5. ~~Re-run the SEO/technical audit for the Apr–Jun 2025 migration window~~ — **done.** Found a concrete mechanism: a broken sitemap the live `robots.txt` was still pointing to through at least 2025-05-10 (11.6).
6. Revisit the original menu/collection/search UX instrumentation plan from `docs/UX_CONVERSION_SIGNAL_FRAMEWORK_2026_07.md` — **still the right sequencing call.** Now has stronger justification given the Sidekick-corroborated `bicicletas-estaticas-y-spinning` collection-page bounce finding (11.2), but should still come after the two items below.
7. ~~Device-level split of the H2'25 vs H1'26 funnel~~ — **done.** Full half-year comparison completed (11.7) — and it overturns the mobile-is-worse framing from the earlier single-window snapshot: **desktop degraded more than mobile at every funnel stage.**

**New open items surfaced this round, not on the original list:**
8. **Diagnose the `(not set)` landing-page anomaly** — >11% of last-28-day sessions, 90.58% bounce, GA4 capturing the session but not the page path (11.2). Likely instrumentation, not content — worth a quick look before it's mistaken for a real high-bounce page.
9. **Diagnose the desktop `session_start` bounce-rate jump** (38.0% → 69.9%, H2'25 to H1'26) — the single largest device-specific anomaly found this round (11.7). Check whether it's connected to the checkout-navigation race condition below, a desktop-specific perf/rendering regression, or a tracking artifact.
10. ~~Fix the checkout-navigation race condition in `app/routes/($locale).cart.tsx`~~ — **done, 2026-07-25** (section 12). Matches cyclewear's independently-shipped PR #94. Post-deploy: watch mobile cart→checkout completion for recovery.
