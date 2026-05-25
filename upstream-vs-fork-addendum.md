# Upstream Ciseco vs Ideum Fork — Diff and Audit Corrections
## What changed in the comparison once we have the vanilla Ciseco baseline

**Addendum date:** 23 May 2026
**Trigger:** Vanilla Ciseco Hydrogen template (ThemeForest, March 2026 release) compared against the Ideum production fork (`iDeum-hydrogen-headless-tienda`).
**Companion to:** all prior audits. This addendum revises earlier findings where the baseline comparison changes the picture.

---

## TL;DR

The ThemeForest "update" is actually the **same Ciseco theme version (1.2.0) the team already forked from**. Identical `@shopify/hydrogen@^2025.1.2`, identical core dependencies. Not a new release.

What the comparison DID reveal is **the full extent of the Ideum team's custom work**, which the previous audits underestimated significantly. Specifically:

- ✅ **The team built a GA4 Measurement Protocol server-side webhook** that I missed in the earlier audits. This means GA4 has server-side `purchase` and `begin_checkout` attribution even when the browser pixel is dead.
- ✅ **The team built a sophisticated PDP Enhanced metaobject-driven content system** with an admin setup route that programmatically creates 10+ product-level metafields.
- ✅ **The team built a multi-brand monorepo architecture** designed for re-use across `cyclewear`, `bicimarket`, `tienda-fitness`, with sister-store cross-promotion.
- ✅ **The team built a custom i18n system** with `useTranslation`, `es.json`, `en.json`, and three locale-aware route prefixes.
- ⚠️ **The team planned for TikTok Events API** server-side (env var defined: `TIKTOK_EVENTS_TOKEN?`) but the webhook file is not yet shipped.
- ❌ **Google Ads Enhanced Conversions remains the only major server-side conversion missing.** No env var defined, no webhook file.

This changes the rank order of the porting roadmap and recalibrates the "what's broken vs what's already built" narrative.

---

## What's identical between upstream and fork

These confirmed the baseline isn't behind:

| Item | Upstream Ciseco | Ideum Fork |
|---|---|---|
| `@shopify/hydrogen` | `^2025.1.2` | `^2025.1.2` |
| `@shopify/cli-hydrogen` | `^8.3.0` | `^8.3.0` |
| `@remix-run/react` | `^2.15.3` | `^2.15.3` |
| `@okendo/shopify-hydrogen` | `^2.3.2` | `^2.3.2` |
| `react` | `^18.3.1` | `^18.3.1` |
| `vite` | `~5.1.0` | `~5.1.0` |
| Theme name | `ciseco-hydrogen-vite` v1.2.0 | `ciseco-hydrogen-vite` v1.2.0 |

Only `@remix-run/node` is slightly different (`^2.17.4` upstream vs `^2.15.3` fork), which is patch-level and won't matter for the upgrade plan.

**Conclusion:** the fork is on the same Ciseco baseline as the current ThemeForest version. The Hydrogen 2026.4 upgrade in PR 10 of the consolidated plan stays as planned.

---

## What the Ideum team added (in the fork, not in vanilla)

**256 vanilla files vs 292 fork files = 36 additions, zero removals.**

The 36 additions sort into seven categories:

### 1. Server-side conversion APIs (revenue-critical)

| File | Purpose | Status |
|---|---|---|
| `app/routes/webhooks.meta-capi.tsx` | Meta Conversions API with HMAC verification, hashed PII, event_id dedup | ✅ Implemented |
| `app/routes/webhooks.ga4-mp.tsx` | **GA4 Measurement Protocol** server-side `purchase` / `begin_checkout` | ✅ Implemented — **I missed this in earlier audits** |
| `app/lib/fbCookies.ts` | Meta `_fbp` / `_fbc` cookie capture + cart attribute forwarding | ✅ Implemented |
| `TIKTOK_EVENTS_TOKEN` env var | TikTok Events API planned | ⚠️ Env defined, webhook not yet shipped |

**Audit correction:** the earlier `hydrogen-code-audit.md` Issue #3 says *"Only Meta has full attribution; no gclid/ttclid/msclkid persistence"* and recommends a Google Ads enhanced conversions webhook. The first half is correct (the browser-side click ID capture is still Meta-only). But the second half is partly wrong: **GA4 server-side attribution already exists** via `webhooks.ga4-mp.tsx`. Google Ads pulls conversion data from GA4 via the GA4↔Google Ads linked-account integration, so if the GA4 MP webhook is properly configured in Shopify Admin → Notifications → Webhooks, Google Ads is receiving conversion data via that path. The remaining gap is **enhanced conversions** specifically — sending hashed email/phone to Google Ads for browser-side conversion matching — which is a smaller, more focused fix than building a full Google Ads webhook from scratch.

### 2. PDP Enhanced metaobject-driven content (Hydrogen-only feature, no Liquid equivalent)

| File | Purpose |
|---|---|
| `app/routes/($locale).setup-pdp-enhanced.tsx` | Admin setup route that programmatically creates 10+ product-level metafields via Admin API |
| `app/components/PdpEnhancedSection.tsx` | Renders the enhanced PDP from those metafields: featureIcons, detailCards, applications, includesList, warrantyBadges, dimensionsImageUrl |
| `app/components/ProductHighlights.tsx` | Auto-builds badge row from fitness-domain metafields: `pesoMaxUsuario`, `plegable`, `requiereElectricidad` |
| `app/components/ProductSpecs.tsx` | Renders spec tables from metafields |
| `app/components/ShippingBadge.tsx` | "Llega en 24 horas" metaobject reference badge |

**Audit correction:** the `liquid-hydrogen-parity-audit.md` §5.4 noted this as a Hydrogen advantage but didn't fully credit how sophisticated it is. This is genuinely a **flagship Hydrogen feature that Liquid Horizon cannot match**. Worth showcasing in the migration narrative to leadership — it's tangible Hydrogen-only value.

### 3. Multi-brand monorepo architecture

| File | Purpose |
|---|---|
| `app/config/store.ts` | Per-brand `logoUrl`, `faviconUrl`, `sisterStores` configuration; designed to be the merge-conflict-isolated brand layer |
| `app/components/BrandSwitcher.tsx` | Header widget showing sister stores (`ciclospecial`, `fitshop`) |

The `config/store.ts` file has an explicit comment:

> *"Each branch (cyclewear, bicimarket, tienda-fitness, etc.) maintains its own version of this file so that logos, favicons, and other brand assets never collide when merging shared code changes. To avoid merge conflicts, add this file to your merge strategy: `git config merge.ours.driver true` && `echo 'app/config/store.ts merge=ours' >> .gitattributes`"*

**Strategic context for the team:** the fork is **explicitly designed to power multiple Ideum-owned/operated brands** from a shared codebase. That's a major architectural decision that:
1. Justifies the investment in Hydrogen even at high per-store complexity
2. Means each PR should consider impact across all sister stores, not just tienda-sportfitness
3. Makes consolidation work (e.g. fixing JSON-LD, fixing breadcrumbs) MORE valuable because the fix benefits 3+ stores at once

### 4. Custom i18n / translation system

| File | Purpose |
|---|---|
| `app/hooks/useTranslation.ts` | `useTranslation()` React hook |
| `app/i18n/en.json` | English translations |
| `app/i18n/es.json` | Spanish translations |
| `app/i18n/index.ts` | Loader / dispatcher |

This is **separate from** Hydrogen's built-in `($locale)` route prefix. It handles UI string translation specifically. Useful for multi-LATAM expansion later (the strategic plan's Markets recipe).

### 5. Custom header / navigation components

| File | Purpose |
|---|---|
| `app/components/Header/HeaderQuickLinks.tsx` | Top-bar quick-link bar (driven by metaobject) |
| `app/components/Header/NavigationBar.tsx` | Main navigation |
| `app/components/Header/StickyHeader.tsx` | Sticky header on scroll |
| `app/components/TopBarMarquee.tsx` | Announcement marquee at the very top (metaobject-driven) |

These collectively replace vanilla Ciseco's simpler header with a more sophisticated multi-row header system.

### 6. Custom product card / discovery components

| File | Purpose |
|---|---|
| `app/components/ProductCardCollection.tsx` | Alternative product card style for collection pages |
| `app/components/ProductCardShowcase.tsx` | Larger showcase card for featured products |
| `app/components/ComplementaryProducts.tsx` | "Equípate al completo" cross-sell accordion on PDP |
| `app/components/Paginator.tsx` | Custom pagination component |
| `app/components/FiltersSidebar.tsx` | Custom collection filter sidebar |
| `app/components/ProductHelpBanner.tsx` | "Need help choosing?" CTA |

### 7. Custom section / page components

| File | Purpose |
|---|---|
| `app/sections/SectionBrandsTicker.tsx` | Brands logo ticker |
| `app/sections/SectionCategoryCardsCarousel.tsx` | Category cards carousel (the round category icons) |
| `app/sections/SectionIntroFeature.tsx` | Intro feature section |
| `app/sections/SectionProductFeature.tsx` | Featured product section |
| `app/sections/SectionProductShowcase.tsx` | Product showcase grid |
| `app/sections/SectionProductTestimonial.tsx` | Product testimonial section |
| `app/sections/SectionShopByCategory.tsx` | Shop by category grid |
| `app/routes/($locale).pages.contact.tsx` | Contact page route with form handler and three sedes |

---

## Audit corrections

### Correction 1: Server-side GA4 attribution exists

**Original claim** (in `hydrogen-code-audit.md` Issue #3 and `consolidated-strategic-plan.md` PR 8):

> *"Only Meta has full click-ID attribution; no gclid / ttclid / msclkid capture; add `marketingAttribution.ts`... Add a Google Ads server-side conversion webhook sibling to the existing Meta CAPI webhook."*

**Corrected picture:**

- **GA4 server-side attribution is implemented** (`webhooks.ga4-mp.tsx`)
- **GA4 → Google Ads link** carries conversion data into Google Ads automatically when the merchant has linked the accounts in Google Ads UI (Tools → Conversions → enable GA4 import)
- The **remaining gap** for Google Ads is specifically:
  - **Enhanced Conversions** — sending hashed email/phone to Google Ads for browser-conversion matching (improves match rate, doesn't add new conversions)
  - **Click ID persistence (`gclid`)** for matching the browser's last-click attribution to the conversion event
  - **Direct Google Ads Conversion Upload API** — bypasses GA4 for direct upload (only needed if GA4↔Google Ads link is broken or you want richer event data)

**Updated PR 8 scope:** Marketing attribution module (`marketingAttribution.ts`) for `gclid` / `ttclid` / `msclkid` persistence is still valid and needed. But the **separate Google Ads server-side webhook is downgraded from required to optional** — it's only needed if the team wants to bypass GA4 for conversion delivery. Verify the GA4↔Google Ads link first; if it's healthy, the existing GA4 MP webhook delivers conversions to Google Ads adequately.

**Net impact on roadmap:** PR 8 effort drops from ~1.5 days to ~1 day. The optional Google Ads webhook is a Tier-4-or-later item.

### Correction 2: The PDP Enhanced system is a flagship Hydrogen feature, not a footnote

**Original claim** (in `liquid-hydrogen-parity-audit.md` §5.4):

> *"Custom badges (`custom_badges` metafield) and shipping badge (`shipping_badge` metaobject): 🆕 Hydrogen-only feature. Worth knowing: if your team migrates to Liquid for any reason, these would need to be ported back."*

**Corrected picture:** the PDP Enhanced system isn't just "custom badges" — it's a full **metaobject-driven CMS layer for the product detail page** comprising:
- Featured icons (Bluetooth, foldable, etc.)
- Detail cards with images and descriptions
- Applications list (use cases)
- "Includes" list (what's in the box)
- Warranty badges with custom messaging
- Dimensions image
- Auto-generated highlights from domain metafields (`pesoMaxUsuario`, `plegable`, `requiereElectricidad`)
- Complementary products cross-sell ("Equípate al completo")
- Shipping badge ("Llega en 24 horas")

This is **genuinely best-in-class for fitness ecommerce**. Liquid Horizon cannot do this without significant custom development. **This is the migration value proposition** — concrete evidence that Hydrogen earns its complexity.

For the leadership narrative: when defending the Hydrogen investment, this section is the strongest piece of evidence. Surface to Saša/Felipe in those conversations.

### Correction 3: The architecture is multi-brand by design

**Original claim** (implicit across all audits): the fork is a one-store custom Hydrogen build.

**Corrected picture:** the `config/store.ts` file with sister-store cross-promotion, the merge-strategy comment, and references to `cyclewear`, `bicimarket`, `tienda-fitness` in code comments make it clear: **this is a shared platform** designed to spin up multiple brands from one codebase.

**Implication for the roadmap:**
- Every fix in the consolidated plan now benefits multiple stores once propagated
- The investment economics shift favorably — a 3-day fix that benefits 3 stores is effectively a 1-day fix per store
- Code review and PR cadence should consider sister-store impact before merging
- The brand-config isolation pattern is well-architected; future brands can be added cheaply

### Correction 4: Sede count discrepancy is three-way, not two-way

**Original claim** (in `liquid-hydrogen-parity-audit.md` §4.6):

> *"Three sedes listed (Medellín, Barranquilla, Llanogrande) [Liquid] vs Hydrogen footer has four sedes... Liquid is missing Palmas."*

**Corrected picture:** the inconsistency is now confirmed to span THREE locations:

| Location | Sedes |
|---|---|
| Liquid theme footer | 3 sedes (Medellín, Barranquilla, Llanogrande) |
| Hydrogen footer (`Footer.tsx:86-92`) | 4 sedes (adds Palmas) |
| Hydrogen contact page (`($locale).pages.contact.tsx:22-26`) | 3 sedes (matches Liquid — NO Palmas) |

So Palmas was added to the Hydrogen footer but not the Hydrogen contact page (and not Liquid). This is internal inconsistency within Hydrogen itself, not just cross-storefront.

**Action:** In PR 9 (the cleanup PR), reconcile across all three locations. If Palmas is real, add to Liquid footer + Hydrogen contact page. If not, remove from Hydrogen footer.

Bonus inconsistency surfaced from the contact page: the SEO title reads `"Tienda N-Fitness"` (line 31), not `"Tienda Fitness"` or `"Tienda Sportfitness"`. A fourth brand-name variant. Likely a typo from copy/paste of another store's contact page. Fix: standardize to `"Tienda Fitness"`.

### Correction 5: TikTok Events API was planned but not shipped

**Original claim** (in `hydrogen-code-audit.md`): server-side TikTok Events API is missing.

**Corrected picture:** the team **planned** for it — `TIKTOK_EVENTS_TOKEN?` is defined in `env.d.ts:48`. They just didn't ship the webhook file yet. This makes it a "complete the obvious work" task rather than a "design from scratch" task.

**Action:** When prioritizing the roadmap, building `webhooks.tiktok-events.tsx` as a fourth peer to Meta CAPI + GA4 MP is a small lift (~2-3 hours) using the existing webhook patterns. Consider adding to PR 8 (Marketing Attribution) scope.

---

## Updated PR ranking in light of these corrections

The four-tier roadmap in `consolidated-strategic-plan.md` stays correct in shape, but specific PRs get reranked:

### Tier 2 (Sprint 2) — slightly de-prioritized

**PR 5** (Review platform consolidation) — unchanged, still important.

**PR 4** (Mercado Pago Antifraud) — unchanged.

**PR 3** (Klaviyo) — unchanged in priority, but **the implementation should now leverage the existing webhook infrastructure pattern**. Specifically, build a `webhooks.klaviyo-events.tsx` sibling to the Meta CAPI and GA4 MP webhooks for server-side Klaviyo event forwarding, while also wiring the onsite SDK. This is the architecturally consistent approach for this codebase.

### Tier 3 (Sprint 3) — refocused

**PR 8 (Marketing Attribution)** — scope updates:
- Build `app/lib/marketingAttribution.ts` for `gclid` / `ttclid` / `msclkid` ✅ (was already in plan)
- Cart attribute forwarding to checkout ✅ (was already in plan)
- ~~Build Google Ads server-side conversion webhook~~ → **DOWNGRADE TO OPTIONAL.** Verify GA4↔Google Ads linked-account import is healthy first; existing GA4 MP webhook + click ID persistence may be sufficient.
- **NEW: Build `webhooks.tiktok-events.tsx`** as a fourth server-side webhook (env var already exists, pattern is reusable)
- **NEW: Add Google Ads Enhanced Conversions via GTM** — sends hashed user data from the browser at conversion time, complementing the GA4 MP server-side delivery. ~1 hour of GTM configuration, no Hydrogen code change.

Net effort: roughly the same as before (~1.5 days), but better-targeted.

### Tier 4 (Sprint 4) — refined

**PR 9 (Quality cleanup)** — add:
- Sede reconciliation across THREE locations (Liquid footer, Hydrogen footer, Hydrogen contact page)
- Brand-name standardization (`Tienda N-Fitness` → `Tienda Fitness` on contact page)

**PR 10 (Hydrogen 2026.4 upgrade)** — unchanged. The team's heavy customization (36 added files, custom i18n, multi-brand architecture) means this upgrade needs **extra QA time** because the React Router 7 migration will touch every `@remix-run/react` import in all the team's custom components.

**Revised effort estimate for PR 10:** ~5-7 days (was 3-5), with explicit smoke-tests across all 36 custom files. Strongly recommend executing this in the `1000061661` Oxygen staging environment first.

---

## Architectural narrative for leadership

This addendum is also a chance to update the story you tell Saša / leadership about the migration.

**Before this addendum:** "We're on Hydrogen but a lot is broken. Need investment to fix it."

**After this addendum:** "We built a sophisticated multi-brand Hydrogen platform (`config/store.ts` design pattern, custom i18n, server-side Meta CAPI + GA4 MP webhooks, PDP Enhanced metaobject CMS, sister-store cross-promotion) that powers multiple Ideum-owned/operated stores. The platform has measurement and configuration issues that are well-scoped and fixable in 3-4 weeks. The architecture itself is sound and ahead of what Liquid could deliver."

The corrections in this addendum change the narrative from "incomplete migration" to "sophisticated multi-brand platform with measurement plumbing to finish."

That's not just spin — it's factually more accurate. The team built more than the previous audits credited them with.

---

## Summary of what changed

| Audit claim | Status after this addendum |
|---|---|
| "Server-side conversion APIs are missing except for Meta" | ❌ Wrong. GA4 MP webhook exists. Meta CAPI exists. TikTok planned (env var present). Only Google Ads dedicated webhook is fully missing, and that's optional given the GA4 path. |
| "PDP Enhanced is a small Hydrogen-only feature" | ❌ Wrong. It's a flagship Hydrogen-only feature comprising 10+ metafields, an admin setup route, and a sophisticated rendering component. Major migration value. |
| "Fork is a one-store custom build" | ❌ Wrong. It's a multi-brand monorepo platform with explicit isolation patterns (`config/store.ts` merge strategy). |
| "Sedes inconsistency between Liquid and Hydrogen" | ⚠️ Partially right. The inconsistency is actually three-way (Hydrogen footer vs Hydrogen contact vs Liquid). |
| "TikTok Events API webhook needs to be built" | ⚠️ Partially right. Env var exists. Code doesn't. ~2-3 hours to add. |
| "Build Google Ads server-side webhook" | ⚠️ Partially right. GA4↔Google Ads link likely covers it. Only needed if you want to bypass GA4. Downgraded to optional. |
| "Hydrogen 2026.4 upgrade is 3-5 days" | ⚠️ Underestimated. With 36 custom files using `@remix-run/react`, plan for 5-7 days including QA. |
| "Consent gate must be fixed via custom auto-grant component" | ❌ Wrong (already corrected in consolidated plan). Use `withPrivacyBanner: true` + Admin region config. |
| "All other audit findings (URL pollution, breadcrumb, JSON-LD, missing pixels)" | ✅ Still correct as written. |

---

## Recommendation

The consolidated plan (`consolidated-strategic-plan.md`) remains correct in its tier ordering and overall sequencing. Apply the corrections in this addendum as scope refinements within each PR, not as a re-plan.

**The most important narrative correction:** the Hydrogen storefront is more sophisticated than the audits initially conveyed, and the team built more than they're being credited for. When socializing the roadmap and budget with stakeholders, frame this as **finishing a sophisticated platform**, not **fixing a broken migration**. Both are true; the former is more accurate to what's actually been built.

---

*End of addendum.*
