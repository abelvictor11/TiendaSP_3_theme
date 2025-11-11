# BikeExchange-Inspired Development Plan
## Transforming Ciseco Hydrogen Theme

**Goal:** Adapt BikeExchange's UI/UX, layout, and functionality for a multi-category, multi-brand ecommerce store using Shopify Hydrogen.

**Current State:** Ciseco Hydrogen theme with metaobject-driven CMS  
**Target State:** BikeExchange-style UI with advanced filtering, comparison, and product discovery

---

## 🎯 BikeExchange Key UI/UX Features to Implement

### Homepage Features
1. **Advanced Search Bar** - Prominent, multi-field search with autocomplete
2. **Category Navigation** - Visual category tiles with images
3. **Brand Showcase** - Featured brands grid
4. **Filter Preview** - Quick filters visible on homepage
5. **Product Highlights** - Featured deals, new arrivals, bestsellers
6. **Trust Signals** - Shipping info, guarantees, return policy
7. **Newsletter/Alerts** - Email signup for deals and new products

### Search/Collection Page Features
1. **Advanced Filter Sidebar** - Multi-level filtering (price, brand, specs, etc.)
2. **Active Filter Tags** - Visual filter chips with remove option
3. **Sort Options** - Price, relevance, newest, popularity, rating
4. **Grid/List View Toggle** - User preference switching
5. **Product Count** - "Showing X of Y products"
6. **Comparison Feature** - Select multiple products to compare
7. **Save Search** - Alert me for new matches
8. **Pagination + Load More** - Hybrid approach

### Product Page Features
1. **Specifications Table** - Detailed tech specs in organized tabs
2. **Size/Fit Guide** - Interactive size selector with recommendations
3. **Stock/Availability Info** - Real-time stock status
4. **Similar Products** - Smart recommendations
5. **Recently Viewed** - Persistent across sessions
6. **Share/Save** - Social sharing, wishlist
7. **Q&A Section** - Product questions and answers
8. **Enhanced Gallery** - Zoom, 360°, video support

---

## 📋 Development Roadmap - 6 Milestones

---

## **MILESTONE 1: Enhanced Navigation & Search** ⏱️ 1-2 weeks

### Objectives
✅ Implement BikeExchange-style header with advanced search  
✅ Create visual category navigation  
✅ Add brand filtering and showcase  
✅ Build mega menu with images

### Tasks

#### 1.1 Header Redesign
**Files to modify:**
- `app/components/Header/MainNav.tsx`
- Create: `app/components/Header/SearchBar.tsx`

**Features:**
- Full-width prominent search bar
- Category dropdown in search
- Autocomplete with product suggestions
- Recent searches
- Popular searches

**Implementation:**
```typescript
// Use Shopify Predictive Search API
const {search} = await storefront.query(PREDICTIVE_SEARCH_QUERY, {
  variables: {
    query: searchTerm,
    limit: 10,
    types: ['PRODUCT', 'COLLECTION', 'PAGE']
  }
});
```

#### 1.2 Mega Menu Navigation
**Create:** `app/components/Header/MegaMenu.tsx`

**Features:**
- Multi-column dropdown
- Category images
- Subcategory links
- Featured products in menu
- Brand quick links

**Shopify Setup:**
- Add category images via collection metafields
- Structure: Main Category → Subcategories → Brands

#### 1.3 Category Landing Pages
**Create:** `app/routes/($locale).categories.$handle.tsx`

**Features:**
- Visual category tiles (grid layout)
- Subcategory navigation
- Top brands in category
- Featured products
- SEO-optimized content blocks

**Shopify Metafields:**
```graphql
collection {
  subcategories: metafield(namespace: "category", key: "subcategories") {
    references { ...CollectionCard }
  }
  top_brands: metafield(namespace: "category", key: "top_brands") {
    value # JSON array
  }
  banner_image: metafield(namespace: "category", key: "banner") {
    reference { ...MediaImage }
  }
}
```

#### 1.4 Brand Pages
**Create:** `app/routes/($locale).brands.$handle.tsx`

**Features:**
- Brand logo and description
- All products by brand
- Brand story/about section
- Filter by category within brand

**Shopify Setup:**
- Create automated collections by vendor
- Add brand metafields (logo, description, website URL)

### Deliverables
✅ Advanced search with autocomplete  
✅ Mega menu navigation  
✅ Category landing pages  
✅ Brand showcase pages  
✅ Mobile-optimized navigation

---

## **MILESTONE 2: Advanced Filtering System** ⏱️ 2-3 weeks

### Objectives
✅ Implement comprehensive filter sidebar  
✅ Add active filter tags with URL persistence  
✅ Create product comparison feature  
✅ Add save search functionality

### Tasks

#### 2.1 Filter Sidebar Component
**Create:** `app/components/Filters/FilterSidebar.tsx`

**Filter Types:**
1. **Price Range** - Slider with min/max inputs
2. **Brand** - Checkbox list with search
3. **Category** - Hierarchical checkboxes
4. **Specifications** - Dynamic based on product type
   - Size (S, M, L, XL)
   - Color
   - Material
   - Year/Model
   - Custom attributes
5. **Availability** - In stock, on sale, new arrivals
6. **Rating** - Star rating filter
7. **Features** - Checkboxes for product features

**Shopify Implementation:**
```typescript
const filters = [
  { productVendor: ['Brand1', 'Brand2'] },
  { price: { min: 100, max: 500 } },
  { productMetafield: { 
      namespace: 'specs', 
      key: 'size', 
      value: 'M' 
  }},
  { available: true },
  { tag: 'new-arrival' }
];
```

#### 2.2 Active Filter Tags
**Create:** `app/components/Filters/ActiveFilters.tsx`

**Features:**
- Display active filters as removable chips
- "Clear all filters" button
- Filter count badge
- Persist in URL parameters

**URL Structure:**
```
/collections/bikes?brand=haibike,cube&price=500-1000&size=m,l&sort=price-asc&page=2
```

#### 2.3 Product Comparison
**Create:**
- `app/components/Comparison/CompareBar.tsx` (sticky bottom bar)
- `app/routes/($locale).compare.tsx` (comparison page)

**Features:**
- Sticky comparison bar at bottom
- Add/remove products (max 3-4)
- Compare button → comparison page
- Persist selection in localStorage
- Side-by-side specification comparison
- Highlight differences
- Add to cart from comparison

**Shopify Data Structure:**
```graphql
product {
  specifications: metafield(namespace: "specs", key: "all") {
    value # JSON object with all specs
  }
}
```

#### 2.4 Save Search / Alerts
**Create:** `app/components/Filters/SaveSearch.tsx`

**Features:**
- Save current filter combination
- Email alerts for new matching products
- Manage saved searches in account
- Name your saved searches

**Implementation:**
- Store in customer metafields (logged in users)
- Use Shopify Flow or Klaviyo for email alerts

### Deliverables
✅ Advanced filter sidebar with 7+ filter types  
✅ Active filter tags with URL persistence  
✅ Product comparison (up to 4 products)  
✅ Save search functionality  
✅ Mobile filter drawer (bottom sheet)

---

## **MILESTONE 3: Enhanced Product Listing** ⏱️ 1-2 weeks

### Objectives
✅ Redesign product cards  
✅ Add grid/list view toggle  
✅ Implement advanced sorting  
✅ Add quick view modal

### Tasks

#### 3.1 Product Card Redesign
**Modify:** `app/components/ProductCard.tsx`

**BikeExchange-Style Layout:**
```
┌─────────────────────┐
│   Product Image     │
│   [Compare ☐]       │
│   [Quick View 👁]   │
└─────────────────────┘
Brand Name
Product Title (truncated)
⭐⭐⭐⭐⭐ (12 reviews)
Key Specs: Size M | 2024 | Carbon
€1,299 [was €1,499] -13%
[Add to Cart] [♡ Wishlist]
```

**Features:**
- Larger product image
- Prominent pricing with discount %
- Key specs preview (3-4 specs)
- Availability badge (In Stock, Low Stock, Pre-order)
- Compare checkbox
- Quick view button on hover
- Wishlist heart icon

#### 3.2 Grid/List View Toggle
**Create:** `app/components/ProductGrid/ViewToggle.tsx`

**Features:**
- Grid view (2-4 columns responsive)
- List view (detailed, 1 column with more info)
- Save preference to localStorage
- Different information density per view

#### 3.3 Advanced Sorting
**Enhance:** `app/components/Filters/SortMenu.tsx`

**Sort Options:**
- Relevance (default)
- Price: Low to High
- Price: High to Low
- Newest First
- Best Selling
- Best Rated
- Name: A-Z
- Name: Z-A

#### 3.4 Quick View Modal
**Create:** `app/components/ProductQuickView.tsx`

**Features:**
- Modal overlay with product details
- Product gallery (3-4 images, swipeable)
- Key specifications
- Variant selector
- Quantity selector
- Add to cart button
- "View full details" link
- Close on outside click

**Implementation:**
- Use Headless UI Dialog component
- Fetch product data on demand
- Optimistic UI for cart operations

#### 3.5 Product Count & Enhanced Pagination
**Create:** `app/components/ProductGrid/ProductCount.tsx`

**Features:**
- "Showing 1-24 of 156 products"
- Load more button
- Infinite scroll option (toggle)
- Jump to page dropdown
- Results per page selector (24, 48, 96)

### Deliverables
✅ BikeExchange-style product cards  
✅ Grid/List view toggle  
✅ 8 sort options  
✅ Quick view modal  
✅ Enhanced pagination with load more

---

## **MILESTONE 4: Product Page Enhancement** ⏱️ 2-3 weeks

### Objectives
✅ Add comprehensive specifications table  
✅ Implement size/fit guide  
✅ Add Q&A section  
✅ Enhance product gallery  
✅ Improve related products

### Tasks

#### 4.1 Specifications Table
**Create:** `app/components/Product/SpecificationsTable.tsx`

**Features:**
- Tabbed interface (Overview | Specifications | Geometry | Components)
- Collapsible sections
- Copy spec button
- Print specs option
- Compare with similar products link

**Shopify Metafield Structure:**
```json
{
  "frame": {
    "material": "Carbon",
    "size": "M",
    "weight": "1.2kg",
    "color": "Black"
  },
  "components": {
    "fork": "RockShox Pike",
    "brakes": "Shimano XT",
    "drivetrain": "Shimano Deore"
  },
  "geometry": {
    "reach": "450mm",
    "stack": "620mm",
    "wheelbase": "1180mm"
  }
}
```

#### 4.2 Size/Fit Guide
**Create:** `app/components/Product/SizeGuide.tsx`

**Features:**
- Interactive size selector
- Size chart table (height/weight recommendations)
- Geometry visualization (SVG diagram)
- Size recommendation based on height
- "Find my size" calculator

#### 4.3 Stock & Availability
**Create:** `app/components/Product/AvailabilityInfo.tsx`

**Features:**
- Real-time stock status per variant
- Expected delivery date
- Low stock warning
- Notify when back in stock
- Store pickup availability (if applicable)

#### 4.4 Q&A Section
**Create:** `app/components/Product/ProductQA.tsx`

**Features:**
- Customer questions list
- Expert/merchant answers
- Upvote helpful answers
- "Ask a question" form
- Search within questions

**Metaobject Structure:**
```
ciseco--product_qa
├─ question (text)
├─ answer (text)
├─ helpful_count (number)
├─ date (date)
├─ answered_by (text)
└─ product (product reference)
```

#### 4.5 Enhanced Gallery
**Enhance:** `app/components/ProductGallery.tsx`

**New Features:**
- Zoom on hover (desktop)
- Pinch to zoom (mobile)
- 360° view support
- Video support
- Fullscreen mode
- Thumbnail navigation
- Image badges (NEW, SALE)
- Swipe gestures (mobile)

#### 4.6 Related Products Enhancement
**Enhance:** `app/components/Product/RelatedProducts.tsx`

**Sections:**
- Similar products (same category/type)
- Frequently bought together
- Recently viewed products
- Complete the look / Accessories
- Alternative options (different brands)

### Deliverables
✅ Comprehensive specifications table  
✅ Interactive size guide  
✅ Stock availability info  
✅ Q&A section  
✅ Enhanced product gallery  
✅ Smart related products (5 sections)

---

## **MILESTONE 5: User Experience Features** ⏱️ 1-2 weeks

### Objectives
✅ Add recently viewed products  
✅ Enhance wishlist functionality  
✅ Add social sharing  
✅ Create breadcrumb navigation  
✅ Add sticky elements

### Tasks

#### 5.1 Recently Viewed Products
**Create:** `app/components/RecentlyViewed.tsx`

**Features:**
- Track last 12-20 viewed products
- Display on product pages and homepage
- Persist across sessions (localStorage)
- Clear history option
- Exclude current product

#### 5.2 Enhanced Wishlist
**Enhance:** `app/routes/($locale).wishlist.tsx`

**New Features:**
- Multiple wishlists ("Favorites", "Gift Ideas", "Compare Later")
- Share wishlist via link
- Price drop alerts
- Back in stock notifications
- Move all to cart
- Wishlist analytics (most saved products)

#### 5.3 Social Sharing
**Create:** `app/components/Product/ShareButtons.tsx`

**Platforms:**
- Facebook
- Twitter/X
- Pinterest
- WhatsApp
- Email
- Copy link
- QR code (mobile)

#### 5.4 Breadcrumb Navigation
**Create:** `app/components/Breadcrumbs.tsx`

**Features:**
- Auto-generated from route hierarchy
- Schema.org markup for SEO
- Clickable path
- Mobile-friendly (collapse on small screens)

**Example:**
```
Home > Bikes > Mountain Bikes > Full Suspension > Haibike FullSeven 9
```

#### 5.5 Sticky Add to Cart Bar
**Create:** `app/components/Product/StickyCartBar.tsx`

**Features:**
- Appears on scroll (when main CTA is off-screen)
- Shows product thumbnail, title, price
- Compact variant selector
- Add to cart button
- Quantity selector
- Mobile-optimized

### Deliverables
✅ Recently viewed products  
✅ Enhanced wishlist with multiple lists  
✅ Social sharing buttons  
✅ Breadcrumb navigation  
✅ Sticky add to cart bar

---

## **MILESTONE 6: Performance & Polish** ⏱️ 1-2 weeks

### Objectives
✅ Optimize performance  
✅ Add loading states  
✅ Implement error handling  
✅ Mobile optimization  
✅ Analytics & tracking  
✅ Accessibility audit

### Tasks

#### 6.1 Performance Optimization

**Image Optimization:**
- Use Shopify CDN transformations
- Lazy loading for below-fold images
- WebP format with fallbacks
- Responsive image srcsets

**Code Splitting:**
- Lazy load comparison feature
- Lazy load Q&A section
- Dynamic imports for modals
- Route-based code splitting

**Caching Strategy:**
```typescript
// Collections - 1 hour
storefront.CacheShort()

// Products - 5 minutes  
storefront.CacheShort()

// Static content - 24 hours
storefront.CacheLong()
```

#### 6.2 Loading States
**Create:** `app/components/LoadingStates/`

**Skeleton Components:**
- ProductCardSkeleton
- ProductPageSkeleton
- FilterSidebarSkeleton
- GallerySkeleton
- SpecTableSkeleton

#### 6.3 Error Handling

**Error Pages:**
- 404 Product not found
- 404 Collection not found
- 500 Server error
- Network offline message

**User-Friendly Messages:**
- "Product no longer available → Browse similar"
- "Search returned no results → Try different filters"

#### 6.4 Mobile Optimization

**Mobile-Specific:**
- Bottom sheet filters
- Swipeable product gallery
- Sticky mobile header
- Touch-friendly buttons (min 44px)
- Mobile-optimized forms

#### 6.5 Analytics & Tracking

**Events:**
- Product views
- Add to cart / Remove from cart
- Filter usage
- Search queries
- Comparison usage
- Wishlist actions
- Share clicks
- Quick view opens

#### 6.6 Accessibility Audit

**WCAG 2.1 AA:**
- Keyboard navigation
- Screen reader support
- Color contrast 4.5:1
- Focus indicators
- ARIA labels
- Alt text for images

**Testing:**
- Lighthouse score 90+
- axe DevTools scan
- Manual keyboard testing

### Deliverables
✅ Optimized performance (Lighthouse 90+)  
✅ Loading skeletons  
✅ Error handling  
✅ Mobile-optimized UI  
✅ Analytics tracking  
✅ Accessibility compliance

---

## 🗂️ Shopify Admin Setup

### Metafields to Create

**Product Metafields:**
```
Namespace: specs
├─ specifications (JSON) - Full specs
├─ size (single_line_text) - For filtering
├─ material (single_line_text)
├─ year (number_integer)
└─ features (list.single_line_text)

Namespace: product
├─ size_chart (JSON)
├─ related_products (list.product_reference)
├─ video_url (url)
└─ badge (single_line_text)
```

**Collection Metafields:**
```
Namespace: category
├─ subcategories (list.collection_reference)
├─ top_brands (JSON)
├─ banner_image (file_reference)
└─ description_long (multi_line_text)
```

### Collections Structure

**By Category:**
- Main categories with subcategories
- Smart collections for filters

**By Brand:**
- Automated by vendor
- Manual for featured brands

**Smart Collections:**
- New Arrivals (< 30 days)
- On Sale (compare_at_price exists)
- Best Sellers (manual tags)
- Price ranges

---

## 📅 Timeline Summary

| Milestone | Duration | Tasks | Cumulative |
|-----------|----------|-------|------------|
| M1: Navigation & Search | 1-2 weeks | 4 | 2 weeks |
| M2: Advanced Filtering | 2-3 weeks | 4 | 5 weeks |
| M3: Product Listing | 1-2 weeks | 5 | 7 weeks |
| M4: Product Page | 2-3 weeks | 6 | 10 weeks |
| M5: UX Features | 1-2 weeks | 5 | 12 weeks |
| M6: Performance | 1-2 weeks | 6 | 14 weeks |

**Total:** 10-14 weeks (2.5-3.5 months)

---

## 🚀 Next Steps

### Week 1:
1. Review plan with team
2. Set up Shopify metafields
3. Create project board (Jira/Trello)
4. Begin M1: Header redesign
5. Gather BikeExchange screenshots

### Development Workflow:
- Branch: `feature/milestone-X-task-name`
- Code review required
- Playwright E2E tests
- Preview deployment per milestone
- Stakeholder review

---

## 📊 Success Metrics

**Performance:**
- Lighthouse: 90+
- FCP: < 1.5s
- TTI: < 3.5s

**UX:**
- Filter usage: 60%+
- Comparison: 15%+
- Search: 40%+

**Business:**
- Session duration: +25%
- Pages/session: +30%
- Conversion: +20%

---

**Ready to start Milestone 1?** 🚀
