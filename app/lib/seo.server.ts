import {type SeoConfig} from '@shopify/hydrogen';
import type {
  Article,
  ArticleAuthor,
  Blog,
  Collection,
  Metafield,
  Page,
  Product,
  ProductVariant,
  ShopPolicy,
  Image,
} from '@shopify/hydrogen/storefront-api-types';
import type {
  AggregateRating,
  Article as SeoArticle,
  BreadcrumbList,
  Blog as SeoBlog,
  CollectionPage,
  Offer,
  Organization,
  Product as SeoProduct,
  WebPage,
} from 'schema-dts';

import type {ShopFragment} from 'storefrontapi.generated';

/**
 * Shared store identity used across JSON-LD blocks that need to describe
 * "who publishes this" (root Organization, Article publisher/author
 * fallback) without re-deriving it or drifting out of sync.
 */
const SHOP_NAME = 'Tienda Fitness';
const SHOP_SOCIAL_LINKS = [
  'https://www.instagram.com/tiendafitness.co/',
  'https://www.facebook.com/profile.php?id=61581462937015',
  'https://www.youtube.com/channel/UCNel96H1em3ZaArATLx9VFg',
  'https://www.tiktok.com/@tiendafitness.co',
];

function root({
  shop,
  url,
}: {
  shop: ShopFragment;
  url: Request['url'];
}): SeoConfig {
  const origin = new URL(url).origin;
  const siteUrl = `${origin}/`;
  return {
    title: shop?.name,
    titleTemplate: '%s | Tienda Fitness',
    description: truncate(shop?.description ?? ''),
    handle: '@tiendafitness.co',
    url,
    robots: {
      noIndex: false,
      noFollow: false,
    },
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: shop.name,
        logo: shop.brand?.logo?.image?.url,
        sameAs: SHOP_SOCIAL_LINKS,
        url: siteUrl,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: shop.name,
        url: siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}search?q={search_term}`,
          'query-input': 'required name=search_term',
        },
      },
    ],
  };
}

function home({url}: {url: Request['url']}): SeoConfig {
  return {
    title: 'Equipos de Gimnasio y Máquinas de Ejercicio',
    titleTemplate: '%s | Tienda Fitness',
    description:
      'Encuentra equipos de gimnasio, máquinas de ejercicio y accesorios fitness de las mejores marcas. Envíos a toda Colombia.',
    url,
    robots: {
      noIndex: false,
      noFollow: false,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Home page',
    },
  };
}

type SelectedVariantRequiredFields = Pick<ProductVariant, 'sku'> & {
  image?: null | Partial<Image>;
};

type ProductRequiredFields = Pick<
  Product,
  'title' | 'description' | 'vendor' | 'seo'
> & {
  variants: Array<
    Pick<
      ProductVariant,
      'sku' | 'price' | 'selectedOptions' | 'availableForSale'
    >
  >;
  // Structured rating metafields (namespace "reviews") — a plain Shopify
  // "rating" metafield type, distinct from the Okendo `okendoStarRatingSnippet`
  // / `okendoReviewsSnippet` metafields (namespace "okendo") also loaded on
  // this route. The Okendo snippets are opaque pre-rendered widget markup
  // consumed via `dangerouslySetInnerHTML` by Okendo's client-side script
  // (see node_modules/@okendo/shopify-hydrogen/dist/esm/index.js) — there's
  // no rating value or review count to extract from them. These
  // `reviews_rating`/`reviews_rating_count` metafields, already fetched by
  // PRODUCT_FRAGMENT but previously unused, hold the structured data instead.
  reviews_rating?: null | Pick<Metafield, 'value'>;
  reviews_rating_count?: null | Pick<Metafield, 'value'>;
};

/**
 * Parses the store's structured `reviews_rating` (Shopify "rating" metafield
 * type — a JSON string like `{"scale_min":"1.0","scale_max":"5.0","value":"4.8"}`)
 * and `reviews_rating_count` (plain integer string) metafields into an
 * AggregateRating-shaped value. Returns null (skip emitting the schema
 * entirely) when either metafield is missing, malformed, or the review
 * count is zero — never fabricates a placeholder rating.
 */
function parseAggregateRating(product: {
  reviews_rating?: null | {value: string};
  reviews_rating_count?: null | {value: string};
}): {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
} | null {
  const ratingRaw = product?.reviews_rating?.value;
  const countRaw = product?.reviews_rating_count?.value;
  if (!ratingRaw || !countRaw) return null;

  let parsed: {value?: string; scale_min?: string; scale_max?: string};
  try {
    parsed = JSON.parse(ratingRaw) as {
      value?: string;
      scale_min?: string;
      scale_max?: string;
    };
  } catch {
    return null;
  }

  const ratingValue = parseFloat(parsed?.value ?? '');
  const reviewCount = parseInt(countRaw, 10);
  if (
    !Number.isFinite(ratingValue) ||
    !Number.isFinite(reviewCount) ||
    reviewCount <= 0
  ) {
    return null;
  }

  const bestRating = parseFloat(parsed?.scale_max ?? '');
  const worstRating = parseFloat(parsed?.scale_min ?? '');

  return {
    ratingValue,
    reviewCount,
    ...(Number.isFinite(bestRating) ? {bestRating} : {}),
    ...(Number.isFinite(worstRating) ? {worstRating} : {}),
  };
}

function productJsonLd({
  product,
  selectedVariant,
  url,
}: {
  product: ProductRequiredFields;
  selectedVariant: SelectedVariantRequiredFields;
  url: Request['url'];
}): SeoConfig['jsonLd'] {
  const origin = new URL(url).origin;
  const variants = product.variants;
  const description = truncate(
    product?.seo?.description ?? product?.description,
  );
  const aggregateRating = parseAggregateRating(product);
  const offers: Offer[] = (variants || []).map((variant) => {
    const variantUrl = new URL(url);
    for (const option of variant.selectedOptions) {
      variantUrl.searchParams.set(option.name, option.value);
    }
    const availability = variant.availableForSale
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

    return {
      '@type': 'Offer',
      availability,
      price: parseFloat(variant.price.amount),
      priceCurrency: variant.price.currencyCode,
      sku: variant?.sku ?? '',
      url: variantUrl.toString(),
    };
  });
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Products',
          item: `${origin}/products`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: product.title,
          item: url,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      brand: {
        '@type': 'Brand',
        name: product.vendor,
      },
      description,
      image: [selectedVariant?.image?.url ?? ''],
      name: product.title,
      offers,
      sku: selectedVariant?.sku ?? '',
      url,
      ...(aggregateRating
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: aggregateRating.ratingValue,
              reviewCount: aggregateRating.reviewCount,
              ...(aggregateRating.bestRating !== undefined
                ? {bestRating: aggregateRating.bestRating}
                : {}),
              ...(aggregateRating.worstRating !== undefined
                ? {worstRating: aggregateRating.worstRating}
                : {}),
            } satisfies AggregateRating,
          }
        : {}),
    },
  ];
}

function product({
  product,
  url,
  selectedVariant,
}: {
  product: ProductRequiredFields;
  selectedVariant: SelectedVariantRequiredFields;
  url: Request['url'];
}): SeoConfig {
  const description = truncate(
    product?.seo?.description ?? product?.description ?? '',
  );
  return {
    title: product?.seo?.title ?? product?.title,
    description,
    url,
    media: selectedVariant?.image,
    jsonLd: productJsonLd({product, selectedVariant, url}),
  };
}

type CollectionRequiredFields = Omit<
  Collection,
  'products' | 'descriptionHtml' | 'metafields' | 'image' | 'updatedAt'
> & {
  products: {nodes: Pick<Product, 'handle'>[]};
  image?: null | Pick<Image, 'url' | 'height' | 'width' | 'altText'>;
  descriptionHtml?: null | Collection['descriptionHtml'];
  updatedAt?: null | Collection['updatedAt'];
  metafields?: null | Collection['metafields'];
};

function collectionJsonLd({
  url,
  collection,
}: {
  url: Request['url'];
  collection: CollectionRequiredFields;
}): SeoConfig['jsonLd'] {
  const siteUrl = new URL(url);
  const itemListElement: CollectionPage['mainEntity'] =
    collection.products.nodes.map((product, index) => {
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl.origin}/products/${product.handle}`,
      };
    });

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Collections',
          item: `${siteUrl.origin}/collections`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: collection.title,
          item: `${siteUrl.origin}/collections/${collection.handle}`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: collection?.seo?.title ?? collection?.title ?? '',
      description: truncate(
        collection?.seo?.description ?? collection?.description ?? '',
      ),
      image: collection?.image?.url,
      url: `${siteUrl.origin}/collections/${collection.handle}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement,
      },
    },
  ];
}

function collection({
  collection,
  url,
}: {
  collection: CollectionRequiredFields;
  url: Request['url'];
}): SeoConfig {
  return {
    title: collection?.seo?.title ?? collection?.title,
    description: truncate(
      collection?.seo?.description ?? collection?.description ?? '',
    ),
    titleTemplate: '%s | Tienda Fitness',
    url,
    media: {
      type: 'image',
      url: collection?.image?.url,
      height: collection?.image?.height,
      width: collection?.image?.width,
      altText: collection?.image?.altText,
    },
    jsonLd: collectionJsonLd({collection, url}),
  };
}

type CollectionListRequiredFields = {
  nodes: Omit<CollectionRequiredFields, 'products'>[];
};

function collectionsJsonLd({
  url,
  collections,
}: {
  url: Request['url'];
  collections: CollectionListRequiredFields;
}): SeoConfig['jsonLd'] {
  const origin = new URL(url).origin;
  const itemListElement: CollectionPage['mainEntity'] = collections.nodes.map(
    (collection, index) => {
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${origin}/collections/${collection.handle}`,
      };
    },
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Colecciones',
    description: 'Todas las colecciones',
    url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement,
    },
  };
}

function listCollections({
  collections,
  url,
}: {
  collections: CollectionListRequiredFields;
  url: Request['url'];
}): SeoConfig {
  return {
    title: 'Colecciones',
    titleTemplate: '%s | Tienda Fitness',
    description: 'Todas las colecciones de Tienda Fitness.',
    url,
    jsonLd: collectionsJsonLd({collections, url}),
  };
}

function article({
  article,
  url,
}: {
  article: Pick<
    Article,
    'title' | 'contentHtml' | 'seo' | 'publishedAt' | 'excerpt'
  > & {
    image?: null | Pick<
      NonNullable<Article['image']>,
      'url' | 'height' | 'width' | 'altText'
    >;
    // Aliased from `authorV2` in ARTICLE_QUERY (news.$newsHandle.tsx) —
    // already fetched and rendered on the article page, just not
    // schema-marked until now.
    author?: null | Pick<ArticleAuthor, 'name'>;
  };
  url: Request['url'];
}): SeoConfig {
  const origin = new URL(url).origin;
  const siteUrl = `${origin}/`;
  return {
    title: article?.seo?.title ?? article?.title,
    description: truncate(article?.seo?.description ?? ''),
    titleTemplate: '%s | Tienda Fitness',
    url,
    media: {
      type: 'image',
      url: article?.image?.url,
      height: article?.image?.height,
      width: article?.image?.width,
      altText: article?.image?.altText,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      alternativeHeadline: article.title,
      articleBody: article.contentHtml,
      datePublished: article?.publishedAt,
      // The Storefront API's Article type has no separate "updated at"
      // field (only `publishedAt`), so there's no real modified date to
      // report — using publishedAt for both satisfies Article rich-result
      // guidelines (dateModified >= datePublished) without fabricating data.
      dateModified: article?.publishedAt,
      description: truncate(
        article?.seo?.description || article?.excerpt || '',
      ),
      headline: article?.seo?.title || '',
      image: article?.image?.url,
      url,
      author: article?.author?.name
        ? {'@type': 'Person', name: article.author.name}
        : {'@type': 'Organization', name: SHOP_NAME},
      publisher: {
        '@type': 'Organization',
        name: SHOP_NAME,
        sameAs: SHOP_SOCIAL_LINKS,
        url: siteUrl,
      },
    },
  };
}

function blog({
  blog,
  url,
}: {
  blog: Pick<Blog, 'seo' | 'title'>;
  url: Request['url'];
}): SeoConfig {
  return {
    title: blog?.seo?.title,
    description: truncate(blog?.seo?.description || ''),
    titleTemplate: '%s | Tienda Fitness',
    url,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: blog?.seo?.title || blog?.title || '',
      description: blog?.seo?.description || '',
      url,
    },
  };
}

type CityRequiredFields = {
  name: string;
  department: string;
  paragraph: string;
};

function city({
  city,
  url,
}: {
  city: CityRequiredFields;
  url: Request['url'];
}): SeoConfig {
  const title = `Equipos de Gimnasio en ${city.name}`;
  const description = truncate(
    `Compra equipos de gimnasio, máquinas de ejercicio y accesorios fitness con envío a ${city.name}, ${city.department}. ${city.paragraph}`,
  );
  return {
    title,
    description,
    titleTemplate: '%s | Tienda Fitness',
    url,
    robots: {
      noIndex: false,
      noFollow: false,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url,
    },
  };
}

function page({
  page,
  url,
}: {
  page: Pick<Page, 'title' | 'seo'>;
  url: Request['url'];
}): SeoConfig {
  const description = truncate(page?.seo?.description || '');
  const title = page?.seo?.title ?? page?.title;
  return {
    description,
    title,
    titleTemplate: '%s | Tienda Fitness',
    url,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url,
    },
  };
}

type BrandListRequiredFields = Array<{handle: string; title: string}>;

function brandsJsonLd({
  url,
  brands,
}: {
  url: Request['url'];
  brands: BrandListRequiredFields;
}): SeoConfig['jsonLd'] {
  const origin = new URL(url).origin;
  const itemListElement: CollectionPage['mainEntity'] = brands.map(
    (brand, index) => {
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${origin}/collections/${brand.handle}`,
      };
    },
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Marcas',
    description: 'Todas las marcas de Tienda Fitness.',
    url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement,
    },
  };
}

function brands({
  url,
  brands,
}: {
  url: Request['url'];
  brands: BrandListRequiredFields;
}): SeoConfig {
  return {
    title: 'Marcas',
    titleTemplate: '%s | Tienda Fitness',
    description:
      'Explora las marcas disponibles en Tienda Fitness: Sportfitness, Evolution, UFC y más equipos de gimnasio y accesorios de entrenamiento.',
    url,
    robots: {
      noIndex: false,
      noFollow: false,
    },
    jsonLd: brandsJsonLd({url, brands}),
  };
}

function policy({
  policy,
  url,
}: {
  policy: Pick<ShopPolicy, 'title' | 'body'>;
  url: Request['url'];
}): SeoConfig {
  const description = truncate(policy?.body ?? '');
  return {
    description,
    title: policy?.title,
    titleTemplate: '%s | Tienda Fitness',
    url,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: policy?.title ?? '',
      description,
      url,
    },
  };
}

function policies({
  policies,
  url,
}: {
  policies: Array<Pick<ShopPolicy, 'title' | 'handle'>>;
  url: Request['url'];
}): SeoConfig {
  const origin = new URL(url).origin;
  const itemListElement: BreadcrumbList['itemListElement'] = policies
    .filter(Boolean)
    .map((policy, index) => {
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: policy.title,
        item: `${origin}/policies/${policy.handle}`,
      };
    });
  return {
    title: 'Políticas',
    titleTemplate: '%s | Tienda Fitness',
    description: 'Políticas de la tienda',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        description: 'Políticas de la tienda',
        name: 'Políticas',
        url,
      },
    ],
  };
}

export const seoPayload = {
  article,
  blog,
  brands,
  city,
  collection,
  home,
  listCollections,
  page,
  policies,
  policy,
  product,
  root,
};

/**
 * Truncate a string to a given length, adding an ellipsis if it was truncated
 * @param str - The string to truncate
 * @param num - The maximum length of the string
 * @returns The truncated string
 * @example
 * ```js
 * truncate('Hello world', 5) // 'Hello...'
 * ```
 */
function truncate(str: string, num = 155): string {
  if (typeof str !== 'string') return '';
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num - 3) + '...';
}
