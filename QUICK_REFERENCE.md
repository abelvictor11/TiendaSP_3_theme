# Ciseco Hydrogen - Quick Reference Guide

## 🚀 Getting Started

### Development Commands
```bash
npm run dev              # Start local dev server
npm run build            # Production build
npm run preview          # Test production build
npm run typecheck        # TypeScript validation
npm run lint             # ESLint check
npm run codegen          # Generate GraphQL types
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in Shopify credentials
3. Run `npm install`
4. Run `npm run dev`

---

## 📂 Key File Locations

| Purpose | Location |
|---------|----------|
| Routes | `app/routes/` |
| Components | `app/components/` |
| Sections | `app/sections/` |
| GraphQL Fragments | `app/data/commonFragments.ts` |
| Utilities | `app/lib/utils.ts` |
| Styles | `app/styles/` |
| Config | `vite.config.ts`, `tailwind.config.js` |

---

## 🎨 Component Library

### Product Components
- `ProductCard` - Product grid/list item
- `ProductGallery` - Image carousel
- `AddToCartButton` - Cart action
- `Prices` - Price display with compare-at
- `ProductBadge` - Sale/New/OOS badges

### Layout Components
- `Header/MainNav` - Desktop navigation
- `Header/NavMobile` - Mobile menu
- `Footer` - Site footer
- `Cart` - Cart drawer
- `Layout` - Main layout wrapper

### Section Components (Metaobject-driven)
- `SectionHero` - Hero banner
- `SectionProductsSlider` - Product carousel
- `SectionCollectionsSlider` - Collection carousel
- `SectionImageWithText` - Content block
- `SectionGridProductsAndFilter` - Filterable grid

---

## 🔧 Common Tasks

### Add New Route
1. Create file in `app/routes/`
2. Use naming: `($locale).your-route.tsx`
3. Export `loader` and default component
4. Add SEO meta function

### Add New Section Type
1. Create component in `app/sections/`
2. Export GraphQL fragment
3. Register in `Sections.tsx` switch
4. Create metaobject definition in Shopify

### Query Shopify Data
```typescript
const {product} = await storefront.query(PRODUCT_QUERY, {
  variables: { handle: 'product-handle' },
  cache: storefront.CacheLong(),
});
```

### Add Custom Metafield
```graphql
custom_field: metafield(namespace: "custom", key: "field") {
  type
  value
}
```

---

## 📊 GraphQL Patterns

### Product Query
```graphql
fragment CommonProductCard on Product {
  id, title, handle
  featuredImage { url, altText }
  priceRange { minVariantPrice { amount, currencyCode } }
}
```

### Collection Query
```graphql
fragment CommonCollectionItem on Collection {
  id, title, handle, description
  image { url, altText }
}
```

### Metaobject Query
```graphql
query route($handle: String!) {
  route: metaobject(handle: { handle: $handle, type: "ciseco--route" }) {
    sections: field(key: "sections") {
      references(first: 20) {
        nodes { ...SectionFragments }
      }
    }
  }
}
```

---

## 🎯 Best Practices

### Performance
- Use `defer()` for non-critical data
- Implement Suspense boundaries
- Cache queries appropriately
- Lazy load images

### SEO
- Add meta tags per route
- Generate sitemaps
- Use semantic HTML
- Implement structured data

### Type Safety
- Run `npm run codegen` after GraphQL changes
- Use TypeScript throughout
- Validate with `npm run typecheck`

### Accessibility
- Use Headless UI components
- Add ARIA labels
- Test keyboard navigation
- Maintain color contrast

---

## 🔐 Security

### CSP Configuration
Located in `app/entry.server.tsx`
- Add domains to scriptSrc, imgSrc, etc.
- Use nonces for inline scripts
- Test with browser console

### Session Management
- Sessions stored in encrypted cookies
- Auto-expires after inactivity
- Secure flag in production

---

## 🚢 Deployment

### Deploy to Oxygen
```bash
shopify hydrogen deploy
```

### Environment Variables
Set in Oxygen dashboard:
- `PUBLIC_STOREFRONT_API_TOKEN`
- `PRIVATE_STOREFRONT_API_TOKEN`
- `SESSION_SECRET`
- etc.

---

## 📚 Documentation Links

- [Hydrogen Docs](https://shopify.dev/docs/storefronts/headless/hydrogen)
- [Storefront API](https://shopify.dev/docs/api/storefront)
- [React Router](https://reactrouter.com)
- [TailwindCSS](https://tailwindcss.com)

---

## 🐛 Troubleshooting

### GraphQL Errors
- Run `npm run codegen`
- Check API version compatibility
- Verify metafield namespaces

### Build Errors
- Clear `.hydrogen` folder
- Delete `node_modules`, reinstall
- Check TypeScript errors

### Runtime Errors
- Check browser console
- Verify environment variables
- Review Oxygen logs

---

**Version:** Hydrogen 2025.1.2 | API 2025-07
