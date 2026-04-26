# Design: Hero Positioning, Homepage SEO & Mobile Logo

**Date:** 2026-04-26
**Branch:** cyclewear
**Status:** Approved

## Overview

Four independent improvements to the cyclewear Hydrogen theme:

1. Hero banner — configurable content block position (9-point grid)
2. Homepage SEO — title and description pulled from Shopify store settings
3. Mobile header logo — mini SVG logo (same as sticky header) on small screens
4. Shopify Admin — instructions for adding the new metaobject field

---

## 1. Hero Content Positioning

### Problem
The content block (heading + sub_heading + CTA button) inside `SectionHeroSlider` is always
vertically centered and horizontally left-aligned. There is no way to reposition it per slide.

### Solution — `content_position` metafield

Add a new `single_line_text_field` key `content_position` to the `hero_item` metaobject.

**Accepted values**

| Value | Vertical | Horizontal |
|---|---|---|
| `top-left` (default when omitted → `center-left`) | top | left |
| `top-center` | top | center |
| `top-right` | top | right |
| `center-left` | center | left |
| `center-center` | center | center |
| `center-right` | center | right |
| `bottom-left` | bottom | left |
| `bottom-center` | bottom | center |
| `bottom-right` | bottom | right |

**Mapping to Tailwind**

```
vertical  → items-start | items-center | items-end
horizontal → justify-start | justify-center | justify-end
text-align → text-left | text-center | text-right
```

**Files changed**
- `app/sections/SectionHeroSlider.tsx`
  - Read `(item as any).content_position?.value`
  - Derive Tailwind classes from the value
  - Apply to the content wrapper `div`
  - Update `HERO_ITEM_FRAGMENT` to query the new field

### Shopify Admin — add the field

1. Go to **Content → Metaobjects**
2. Open the **hero_item** definition
3. Click **Add field**
   - Type: `Single line text`
   - Name: `Content position`
   - Key: `content_position` (auto-filled)
   - Validations: leave empty (any value accepted; code falls back to `center-left`)
4. Save

---

## 2. Homepage SEO

### Problem
`seoPayload.home()` in `app/lib/seo.server.ts` returns hardcoded values:
- `title: 'Home'`
- `description: 'The best place to buy snowboarding products'`

These never reflect what is set in **Shopify Admin → Online Store → Preferences**.

### Solution
- Update `seoPayload.home()` to accept `{ shop, url }` where `shop: { name?: string; description?: string }`.
- Use `shop.name` as title and `shop.description` as description.
- Update `loadCriticalData` in `app/routes/($locale)._index.tsx` to pass the already-loaded `shop` object.
- No GraphQL changes needed — `HOMEPAGE_SEO_QUERY` already returns `shop { name description }`.

**Files changed**
- `app/lib/seo.server.ts` — update `home()` signature and body
- `app/routes/($locale)._index.tsx` — pass `shop` to `seoPayload.home()`

---

## 3. Mobile Logo

### Problem
`MainNav.tsx` renders `<Logo />` (full-width image from CDN) on all screen sizes.
On mobile the available horizontal space is narrow and the full logo can be too large.
The sticky header already has a compact SVG icon (`storeConfig.stickyLogoSvg`) that works well at small sizes.

### Solution
In `MainNav.tsx`, replace the single `<Logo />` with two conditionally visible elements:

- **Mobile** (`block lg:hidden`): inline SVG using `storeConfig.stickyLogoSvg` + `storeConfig.stickyLogoViewBox`, wrapped in a `<Link to="/">` — same markup as `StickyHeader`.
- **Desktop** (`hidden lg:block`): existing `<Logo />` component.

No changes to `Logo.tsx`, `StickyHeader.tsx`, or `storeConfig.ts`.

---

## Out of scope
- Adding `content_position` to metaobject entries in Shopify — must be done manually per banner.
- Adding `PUBLIC_CHECKOUT_DOMAIN` env var — must be set in Shopify Admin → Hydrogen → Env vars.
