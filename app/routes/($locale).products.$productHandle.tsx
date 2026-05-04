import {Suspense, useState, useRef, useEffect} from 'react';
import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, Await, useRouteLoaderData, isRouteErrorResponse, useRouteError, Link as RemixLink} from '@remix-run/react';
import {
  type VariantOption,
  Image,
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  getProductOptions,
  type MappedProductOptions,
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import clsx from 'clsx';
import type {
  Maybe,
  ProductOptionValueSwatch,
  SelectedOption,
} from '@shopify/hydrogen/storefront-api-types';
import type {ProductFragment} from 'storefrontapi.generated';
import {ProductGallery} from '~/components/ProductGallery';
import {Skeleton} from '~/components/Skeleton';
import {Link} from '~/components/Link';
import {AddToCartButton} from '~/components/AddToCartButton';
import {seoPayload} from '~/lib/seo.server';
import type {Storefront} from '~/lib/type';
import {routeHeaders} from '~/data/cache';
import {MEDIA_FRAGMENT} from '~/data/fragments';
import Prices from '~/components/Prices';
import NcInputNumber from '~/components/NcInputNumber';
import Policy from '~/components/Policy';
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import BagIcon from '~/components/BagIcon';
import {NoSymbolIcon, ChevronDownIcon} from '@heroicons/react/24/outline';
import {getProductStatus, ProductBadge} from '~/components/ProductCard';
import {useGetPublicStoreCdnStaticUrlFromRootLoaderData} from '~/hooks/useGetPublicStoreCdnStaticUrlFromRootLoaderData';
import ButtonSecondary from '~/components/Button/ButtonSecondary';
import LikeButton from '~/components/LikeButton';
import {
  OKENDO_PRODUCT_REVIEWS_FRAGMENT,
  OKENDO_PRODUCT_STAR_RATING_FRAGMENT,
  OkendoReviews,
  OkendoStarRating,
} from '@okendo/shopify-hydrogen';
import {COMMON_PRODUCT_CARD_FRAGMENT} from '~/data/commonFragments';
import {SnapSliderProducts} from '~/components/SnapSliderProducts';
import {RouteContent} from '~/sections/RouteContent';
import {getSeoMeta} from '@shopify/hydrogen';
import {getLoaderRouteFromMetaobject} from '~/utils/getLoaderRouteFromMetaobject';
import type {RootLoader} from '~/root';
import {useAside} from '~/components/Aside';
import {SlashIcon} from '@heroicons/react/24/solid';
import ProductHelpBanner from '~/components/ProductHelpBanner';
import ProductHighlights from '~/components/ProductHighlights';
import ProductSpecs from '~/components/ProductSpecs';
import ProductDescription from '~/components/ProductDescription';
import CreditCalculator from '~/components/CreditCalculator';
import {ComplementaryProducts} from '~/components/ComplementaryProducts';
import {VendorLogoWithFallback} from '~/components/VendorLogo';
import BikeSizeGuide from '~/components/BikeSizeGuide';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {params} = args;
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

async function loadCriticalData(args: LoaderFunctionArgs) {
  const {params, request, context} = args;
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const selectedOptions = getSelectedProductOptions(request).filter(
    (option) =>
      // Filter out Shopify predictive search query params
      !option.name.startsWith('_sid') &&
      !option.name.startsWith('_pos') &&
      !option.name.startsWith('_psq') &&
      !option.name.startsWith('_ss') &&
      !option.name.startsWith('_v') &&
      // Filter out third party tracking params
      !option.name.startsWith('fbclid'),
  );

  if (!productHandle) {
    throw new Error('Expected product handle to be defined');
  }

  const [productResult, creditCalculatorData, proveedoresData] = await Promise.all([
    context.storefront.query(PRODUCT_QUERY, {
      variables: {
        handle: productHandle,
        selectedOptions,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
    context.storefront.query(CREDIT_CALCULATOR_QUERY).catch(() => null),
    context.storefront.query(PROVEEDORES_QUERY).catch(() => null),
  ]);

  const {shop, product} = productResult;

  if (!product?.id) {
    // 404 → server.ts will call storefrontRedirect, which checks Shopify
    // Admin's URL Redirects table and forwards the visitor if a match exists.
    throw new Response('product', {status: 404});
  }

  const recommended = getRecommendedProducts(context.storefront, product.id);
  const selectedVariant = product.selectedOrFirstAvailableVariant ?? {};
  const variants = getAdjacentAndFirstAvailableVariants(product);

  const seo = seoPayload.product({
    product: {...product, variants},
    selectedVariant,
    url: request.url,
  });

  // Parse credit calculator config from metaobject
  const creditCalculatorConfig = creditCalculatorData?.metaobject
    ? parseCreditCalculatorConfig(creditCalculatorData.metaobject)
    : null;

  // Match product proveedor_1 text field with metaobject entries
  const proveedorName = (product as any).proveedor_1?.value;
  const proveedores = proveedoresData?.proveedores?.nodes || [];
  const matchedProveedor = proveedorName
    ? proveedores.find((p: any) => 
        p.name?.value?.toLowerCase().trim() === proveedorName.toLowerCase().trim()
      )
    : null;
  const proveedorDeliveryTime = matchedProveedor?.delivery_time?.value || null;

  return {
    shop,
    variants,
    product,
    recommended,
    storeDomain: shop.primaryDomain.url,
    seo,
    creditCalculatorConfig,
    proveedorDeliveryTime,
  };
}

function loadDeferredData(args: LoaderFunctionArgs) {
  const {params, request, context} = args;
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  // Deferred promises must never reject — if they do, Remix bubbles the
  // rejection past the route's ErrorBoundary into the root, masking a
  // critical-loader 404 (or any thrown Response) as a 500. That breaks
  // server.ts → storefrontRedirect for renamed product handles.
  const routePromise = getLoaderRouteFromMetaobject({
    params,
    context,
    request,
    handle: 'route-product',
  }).catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('[PDP] routePromise failed', error);
    return null;
  });

  const helpBannerPromise = context.storefront
    .query(PDP_HELP_BANNER_QUERY, {
      cache: context.storefront.CacheLong(),
    })
    .catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error('[PDP] helpBannerPromise failed', error);
      return null;
    });

  return {
    routePromise,
    helpBannerPromise,
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

/**
 * ErrorBoundary — captures any uncaught error in the loader OR component tree
 * for this route. Without this, a runtime error blanks the page and Remix
 * bubbles up to the root error boundary, which gives users a frozen-looking
 * experience when navigating client-side.
 *
 * Covers three cases:
 *  - 404 (product not found)
 *  - Other Response errors (5xx, etc.)
 *  - Uncaught JS errors during render (e.g. ReferenceError in a component)
 */
export function ErrorBoundary() {
  const error = useRouteError();
  const isResponseError = isRouteErrorResponse(error);
  const is404 = isResponseError && error.status === 404;

  // Log non-404 errors for observability
  if (!is404 && typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error('[PDP ErrorBoundary]', error);
  }

  return (
    <div className="container py-20 lg:py-28 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-semibold mb-4">
          {is404 ? 'Producto no encontrado' : 'Algo salió mal'}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          {is404
            ? 'Este producto ya no está disponible o la dirección es incorrecta.'
            : 'No pudimos cargar este producto. Por favor intenta nuevamente o vuelve al inicio.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <RemixLink
            to="/"
            className="inline-flex items-center px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Volver al inicio
          </RemixLink>
          <RemixLink
            to="/collections"
            className="inline-flex items-center px-5 py-3 rounded-full border border-slate-300 text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors dark:text-white dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Ver productos
          </RemixLink>
        </div>
      </div>
    </div>
  );
}

export default function Product() {
  const {product, shop, recommended, variants, routePromise, storeDomain, helpBannerPromise, creditCalculatorConfig} =
    useLoaderData<typeof loader>();
  const {
    media,
    outstanding_features,
    descriptionHtml,
    id,
    metafields,
  } = product as any;
  const {shippingPolicy, refundPolicy, subscriptionPolicy} = shop;

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    variants,
  );
  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);
  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  // Calculate discount percentage
  const price = parseFloat(selectedVariant?.price?.amount || '0');
  const compareAtPrice = parseFloat(selectedVariant?.compareAtPrice?.amount || '0');
  const discountPercentage = compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  // Out-of-stock badge
  const isOutOfStock = !selectedVariant?.availableForSale;
  const status = getProductStatus({
    availableForSale: !!selectedVariant?.availableForSale,
    compareAtPriceRangeMinVariantPrice:
      selectedVariant?.compareAtPrice || undefined,
    priceRangeMinVariantPrice: selectedVariant?.price,
    publishedAt: product.publishedAt,
  });

  // Scroll indicator for left column (desktop)
  const scrollColRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);
  useEffect(() => {
    const el = scrollColRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollHint(el.scrollTop <= 40);
    };
    el.addEventListener('scroll', onScroll, {passive: true});
    if (el.scrollHeight <= el.clientHeight) setShowScrollHint(false);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={clsx(
        'product-page mt-5 lg:mt-10 pb-20 lg:pb-28 space-y-12 sm:space-y-16',
      )}
    >
      <main className="container">
        <div className="lg:flex lg:gap-0 lg:relative">
          {/* Left Column - Galleries + Description (independent scroll on desktop) */}
          <div className="w-full lg:w-[55%] lg:sticky lg:top-0 lg:self-start relative">
            {/* Scroll indicator: gradient + bouncing chevron, only on desktop */}
            <div
              aria-hidden="true"
              className={`hidden lg:block absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-white to-transparent pointer-events-none z-20 transition-opacity duration-500 ${showScrollHint ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="absolute bottom-3 inset-x-0 flex justify-center">
                <ChevronDownIcon className="w-5 h-5 text-slate-400 animate-bounce" />
              </div>
            </div>
          <div ref={scrollColRef} className="lg:max-h-screen lg:overflow-y-auto pdp-scroll-col">
            {/* Galleries */}
            <div className="relative lg:pt-4">
              <ProductGallery
                media={media.nodes}
                className="w-full lg:col-span-2 lg:gap-7"
                discountPercentage={discountPercentage}
                selectedVariantImageUrl={selectedVariant?.image?.url}
              />
              <LikeButton
                id={id}
                className="absolute top-3 end-3 z-10 !w-10 !h-10"
              />
              {/* Out of stock badge — top-left corner over the image */}
              {isOutOfStock && (
                <div className="absolute top-3 start-3 z-10">
                  <ProductBadge status={status} />
                </div>
              )}
            </div>

            {/* Product Description - Below images on desktop with "Ver más..." */}
            <div className="hidden lg:block mt-10 pb-8">
              {!!descriptionHtml && (
                <ProductDescription descriptionHtml={descriptionHtml} />
              )}

              {/* Technical Specifications - Below description on desktop */}
              <div className="mt-10">
                <ProductSpecs metafields={metafields} barcode={selectedVariant?.barcode} />
              </div>
            </div>
          </div>{/* closes inner scroll div */}
          </div>{/* closes outer sticky div */}

          {/* Right Column - Product Info (independent scroll on desktop) */}
          <div className="w-full lg:w-[45%] pt-10 lg:pt-0 lg:pl-7 xl:pl-9 2xl:pl-10 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto pdp-scroll-col">
            <div className="grid gap-7 2xl:gap-8 lg:pt-4 lg:pb-24">
              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
                storeDomain={storeDomain}
                metafields={metafields}
              />

              {/* Highlights - Quick specs icons */}
              <ProductHighlights metafields={metafields} />

              {/*  */}
              <hr className=" border-slate-200 dark:border-slate-700"></hr>
              {/*  */}

              {/* Help Banner */}
              <Suspense fallback={null}>
                <Await resolve={helpBannerPromise}>
                  {(bannerData) => {
                    const banner = bannerData?.pdpHelpBanner?.nodes?.[0];
                    if (!banner) return null;
                    return (
                      <ProductHelpBanner
                        heading={banner.heading?.value || ''}
                        description={banner.description?.value || ''}
                        ctaText={banner.cta_text?.value || ''}
                        ctaLink={banner.cta_link?.value || ''}
                        backgroundColor={banner.background_color?.value || '#e0f2fe'}
                        textColor={banner.text_color?.value || '#0c4a6e'}
                        buttonBackgroundColor={banner.button_background_color?.value || '#1e3a5f'}
                        buttonTextColor={banner.button_text_color?.value || '#ffffff'}
                        enabled={banner.enabled?.value !== 'false'}
                      />
                    );
                  }}
                </Await>
              </Suspense>

              {/* Complementary Products */}
              <Suspense fallback={<div className="h-32" />}>
                <Await resolve={recommended}>
                  {(products) => (
                    <ComplementaryProducts
                      products={products.nodes.slice(0, 4)}
                      title="Equípate al completo"
                    />
                  )}
                </Await>
              </Suspense>

              {!!outstanding_features?.value && (
                <div>
                  <h2 className="text-sm font-medium text-gray-900">
                    Características destacadas
                  </h2>
                  <div>
                    <div
                      className="prose prose-sm mt-4 text-gray-600"
                      dangerouslySetInnerHTML={{
                        __html: `<ul role="list"> 
                    ${(
                      JSON.parse(
                        outstanding_features?.value || '[]',
                      ) as string[]
                    )
                      .map((item: string) => `<li>${item}</li>`)
                      .join('')} 
                    </ul>`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Credit Calculator */}
              {selectedVariant?.price && (
                <CreditCalculator 
                  price={selectedVariant.price} 
                  config={creditCalculatorConfig}
                  className="mb-5" 
                />
              )}

              {/* ---------- 6 ----------  */}
              <div>
                <Policy
                  shippingPolicy={shippingPolicy}
                  refundPolicy={refundPolicy}
                  subscriptionPolicy={subscriptionPolicy}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Add to Cart Bar - Desktop only */}
        {selectedVariant && selectedVariant.availableForSale && (
          <FixedAddToCartBar
            selectedVariant={selectedVariant}
            onCartOpen={() => {
              // This is handled inline
            }}
          />
        )}

        {/* DETAIL AND REVIEW */}
        <div className="mt-12 sm:mt-16 space-y-12 sm:space-y-16">
          {/* Product description - Mobile only (desktop shows in left column) */}
          <div className="lg:hidden">
            {!!descriptionHtml && (
              <ProductDescription descriptionHtml={descriptionHtml} />
            )}
            <div className="mt-10">
              <ProductSpecs metafields={metafields} barcode={selectedVariant?.barcode} />
            </div>
          </div>

          {/* Product reviews */}
          <ProductReviews product={product} />

          <hr className="border-slate-200 dark:border-slate-700" />

          {/* OTHER SECTION */}
          <Suspense fallback={<div className="h-32" />}>
            <Await
              errorElement="There was a problem loading related products"
              resolve={recommended}
            >
              {(products) => (
                <>
                  <SnapSliderProducts
                    heading_bold={'Los clientes también compraron'}
                    products={products.nodes}
                    className=""
                    headingFontClass="text-2xl font-semibold"
                  />
                </>
              )}
            </Await>
          </Suspense>
        </div>
      </main>

      {/* 3. Render the route's content sections */}
      <Suspense fallback={<div className="h-32" />}>
        <Await
          errorElement="There was a problem loading route's content sections"
          resolve={routePromise}
        >
          {(data) => (
            <>
              {data?.route ? (
                <RouteContent
                  route={data.route}
                  className="space-y-12 sm:space-y-16"
                />
              ) : null}
            </>
          )}
        </Await>
      </Suspense>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

interface Metafield {
  key: string;
  namespace: string;
  value: string | null;
}

export function ProductForm({
  productOptions,
  selectedVariant,
  storeDomain,
  metafields,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  storeDomain: string;
  metafields?: Metafield[];
}) {
  const {open} = useAside();
  const {product, proveedorDeliveryTime} = useLoaderData<typeof loader>();
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const isOutOfStock = !selectedVariant?.availableForSale;
  // null = inventory not tracked or CONTINUE policy → no limit
  const maxQty = (selectedVariant as any)?.quantityAvailable ?? null;

  // Reset qty to 1 when variant changes, or clamp if new stock < current qty
  useEffect(() => {
    setQuantity((prev) => (maxQty !== null ? Math.min(prev, maxQty || 1) : prev));
  }, [selectedVariant?.id, maxQty]);

  // Build breadcrumb hierarchy from product collections
  const breadcrumbs = (() => {
    const collections = (product.collections?.nodes || []) as any[];
    if (collections.length === 0) return [];

    const collectionHandles = new Set(collections.map((c: any) => c.handle));

    // Find a parent that has a coleccion_hija referencing another collection the product belongs to
    for (const col of collections) {
      const children = col.coleccion_hija?.references?.nodes || [];
      for (const child of children) {
        if (child.handle !== col.handle && collectionHandles.has(child.handle)) {
          // Found parent -> child relationship
          const childCol = collections.find((c: any) => c.handle === child.handle);
          return [
            {title: col.title.replace(/(<([^>]+)>)/gi, ''), handle: col.handle, href: `/collections/${col.handle}`},
            {title: (childCol?.title || child.title).replace(/(<([^>]+)>)/gi, ''), handle: child.handle, href: `/collections/${col.handle}/${child.handle}`},
          ];
        }
      }
    }

    // No hierarchy found, use first collection
    const first = collections[0];
    return [{title: first.title.replace(/(<([^>]+)>)/gi, ''), handle: first.handle, href: `/collections/${first.handle}`}];
  })();

  // Parse custom badges from metafield
  // Format: [{"text": "Destacado", "color": "#d4f542", "textColor": "#1a1a2e"}, ...]
  const customBadges = (() => {
    try {
      const badgesValue = (product as any).custom_badges?.value;
      if (!badgesValue) return [];
      return JSON.parse(badgesValue) as Array<{text: string; color: string; textColor?: string}>;
    } catch {
      return [];
    }
  })();

  return (
    <>
      {/* ---------- HEADING ----------  */}
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <div className="flex items-center text-sm">
                  <Link
                    to={'/'}
                    className="font-medium text-gray-500 hover:text-gray-900"
                  >
                    Inicio
                  </Link>
                  <SlashIcon className="ml-2 h-5 w-5 flex-shrink-0 text-gray-300" />
                </div>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.handle}>
                  <div className="flex items-center text-sm">
                    <Link
                      to={crumb.href}
                      className="font-medium text-gray-500 hover:text-gray-900"
                    >
                      {crumb.title}
                    </Link>
                    {index < breadcrumbs.length - 1 && (
                      <SlashIcon className="ml-2 h-5 w-5 flex-shrink-0 text-gray-300" />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Vendor - Logo SVG */}
        {product.vendor && (
          <div className="mb-4">
            <VendorLogoWithFallback 
              vendor={product.vendor} 
              className="h-8 w-auto max-w-[150px] object-contain"
              fallbackClassName="text-xs font-normal text-black uppercase tracking-wide"
            />
          </div>
        )}

        <h1
          className="text-2xl sm:text-3xl font-semibold"
          title={product.title}
        >
          {product.title}
        </h1>

        {/* Star Rating - Below title */}
        {product?.okendoStarRatingSnippet && (
          <div className="mt-2">
            <OkendoStarRating
              productId={product.id}
              okendoStarRatingSnippet={product.okendoStarRatingSnippet}
            />
          </div>
        )}

        {/* SKU */}
        {selectedVariant?.sku && (
          <p className="text-sm text-slate-500 mt-2">
            SKU: <span className="text-slate-700 dark:text-slate-300">{selectedVariant.sku}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center mt-5 gap-4 lg:gap-5">
          <Prices
            contentClass="py-1 px-2 md:py-1.5 md:px-3 text-lg font-semibold"
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />

          {/* Custom Badges */}
          {customBadges.length > 0 && (
            <>
              <div className="h-7 border-l border-slate-300 dark:border-slate-700 opacity-0 sm:opacity-100" />
              <div className="flex flex-wrap items-center gap-2">
                {customBadges.map((badge: {text: string; color: string; textColor?: string; showIcon?: boolean}, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: badge.color || '#d4f542',
                      color: badge.textColor || '#1a1a2e',
                    }}
                  >
                    {badge.showIcon && (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {badge.text}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------- VARIANTS AND COLORS LIST ----------  */}
      {productOptions.map((option, optionIndex) => {
        const isColor = option.name.toLowerCase().startsWith('color');
        const isSizeOption = /talla|size|tamaño/i.test(option.name);
        const isBike = isBikeProduct(product);

        return (
          <div key={option.name}>
            {isColor ? (
              <ProductColorOption option={option} />
            ) : (
              <>
                {isSizeOption && isBike && (
                  <div className="flex items-center justify-between mb-1">
                    <span />
                    <button
                      onClick={() => setSizeGuideOpen(true)}
                      className="text-sm font-medium text-slate-500 hover:text-black underline underline-offset-2 transition-colors"
                    >
                      ¿No sabes tu talla? Guía de tallas
                    </button>
                  </div>
                )}
                <ProductOtherOption option={option} />
              </>
            )}
          </div>
        );
      })}

      {/* Bike Size Guide Modal */}
      <BikeSizeGuide
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        productTitle={product.title}
        productImage={selectedVariant?.image?.url || product.media?.nodes?.[0]?.previewImage?.url}
        bikeType={detectBikeType(product)}
        availableSizes={productOptions
          .filter((o) => /talla|size|tamaño/i.test(o.name))
          .flatMap((o) => o.optionValues.map((v) => v.name))}
      />

      {selectedVariant && (
        <div className="grid items-stretch gap-4">
          {isOutOfStock ? (
            <ButtonSecondary disabled>
              <NoSymbolIcon className="w-5 h-5" />
              <span className="ms-2">Agotado</span>
            </ButtonSecondary>
          ) : (
            <div className="flex gap-2 sm:gap-3.5 items-stretch">
              <div className="flex items-center justify-center bg-[#efefef]/70 dark:bg-slate-800/70 p-2 sm:p-3 rounded-full">
                <NcInputNumber
                  className=""
                  defaultValue={quantity}
                  onChange={setQuantity}
                  max={maxQty}
                />
              </div>
              <div className="flex-1 *:h-full *:flex">
                <AddToCartButton
                  lines={[
                    {
                      merchandiseId: selectedVariant.id!,
                      quantity,
                      selectedVariant,
                      attributes: [{key: '_deliveryTime', value: proveedorDeliveryTime || DEFAULT_DELIVERY_TIME}],
                    },
                  ]}
                  className="w-full flex-1"
                  data-test="add-to-cart"
                  onClick={() => open('cart')}
                >
                  <ButtonPrimary
                    as="span"
                    className="w-full h-full flex items-center justify-center gap-3 "
                  >
                    <BagIcon className="hidden sm:inline-block w-5 h-5 mb-0.5" />
                    <span>Agregar al carrito</span>
                  </ButtonPrimary>
                </AddToCartButton>
              </div>
            </div>
          )}

          {/* Delivery Time Info */}
          <DeliveryTimeInfo product={product} />

          {/* Highlights below Add to Cart */}
          <ProductFormHighlights metafields={metafields} />
        </div>
      )}
    </>
  );
}

const ProductFormHighlights = ({metafields}: {metafields?: Metafield[]}) => {
  const highlightsMetafield = metafields?.find(
    (m) => m?.key === 'highlights' && m?.namespace === 'specs'
  );
  
  if (!highlightsMetafield?.value) return null;
  
  let highlights: string[] = [];
  try {
    const parsed = JSON.parse(highlightsMetafield.value);
    if (Array.isArray(parsed)) {
      highlights = parsed as string[];
    }
  } catch {
    return null;
  }
  
  if (highlights.length === 0) return null;
  
  return (
    <div className="flex flex-col gap-2 pt-2">
      {highlights.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {item}
          </span>
        </div>
      ))}
    </div>
  );
};

const DEFAULT_DELIVERY_TIME = 'Entrega estimada de 3 a 7 días hábiles después de confirmado el pago.';

function DeliveryTimeInfo({product}: {product: any}) {
  const {proveedorDeliveryTime} = useLoaderData<typeof loader>();
  const deliveryTime = proveedorDeliveryTime || DEFAULT_DELIVERY_TIME;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-[#004f9d]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Tiempo de entrega
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 whitespace-pre-line">
            {deliveryTime}
          </p>
        </div>
      </div>
    </div>
  );
}

const ProductOtherOption = ({option}: {option: MappedProductOptions}) => {
  if (!option.optionValues.length) {
    return null;
  }
  if (option.name === 'Title' && option.optionValues.length < 2) {
    return null;
  }

  return (
    <div>
      <div className="font-medium text-sm">{option.name}</div>
      <div className="flex flex-wrap gap-3 mt-3">
        {option.optionValues.map(
          ({
            name: value,
            variantUriQuery,
            selected: isActive,
            available: isAvailable,
            isDifferentProduct,
            handle,
          }) => {
            return (
              <Link
                key={option.name + value}
                {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                to={`/products/${handle}?${variantUriQuery}`}
                preventScrollReset
                prefetch="intent"
                replace
                className={clsx(
                  'relative flex items-center justify-center rounded-md border py-3 px-5 sm:px-3 text-sm font-medium uppercase cursor-pointer focus:outline-none border-black ',
                  !isAvailable
                    ? isActive
                      ? 'opacity-90 text-opacity-80 cursor-not-allowed'
                      : 'text-opacity-20 cursor-not-allowed'
                    : 'cursor-pointer',
                  isActive
                    ? 'bg-black border-back text-slate-100'
                    : 'border-slate-300 text-black hover:bg-neutral-50 ',
                )}
              >
                {!isAvailable && (
                  <span
                    className={clsx(
                      'absolute inset-[1px]',
                      isActive ? 'text-slate-100/60' : 'text-slate-300/60',
                    )}
                  >
                    <svg
                      className="absolute inset-0 h-full w-full stroke-1"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      stroke="currentColor"
                    >
                      <line
                        x1="0"
                        y1="100"
                        x2="100"
                        y2="0"
                        vectorEffect="non-scaling-stroke"
                      ></line>
                    </svg>
                  </span>
                )}
                {/* {!isAvailable && (
                <div
                  className={clsx(
                    'absolute -inset-x-0.5 border-t top-1/2 z-10 rotate-[28deg]',
                    isActive ? 'border-slate-400' : '',
                  )}
                />
              )} */}
                {value}
              </Link>
            );
          },
        )}
      </div>
    </div>
  );
};

const ProductColorOption = ({option}: {option: MappedProductOptions}) => {
  const {getImageWithCdnUrlByName, getColorHexByName} =
    useGetPublicStoreCdnStaticUrlFromRootLoaderData();

  if (!option.optionValues.length) {
    return null;
  }

  // Get the selected color name
  const selectedColor = option.optionValues.find((opt) => opt.selected)?.name || '';

  return (
    <div>
      {/* Color label with selected color name */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Color:</span>
        <span className="text-slate-700 dark:text-slate-300">{selectedColor}</span>
      </div>
      
      {/* Circular color swatches */}
      <div className="flex flex-wrap gap-3 mt-3">
        {option.optionValues.map(
          ({
            name: value,
            variantUriQuery,
            selected: isActive,
            available: isAvailable,
            isDifferentProduct,
            handle,
          }) => {
            const imageUrl = getImageWithCdnUrlByName(value.replaceAll(/ /g, '_'));
            const colorHex = getColorHexByName(value);

            return (
              <Link
                key={option.name + value}
                {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                to={`/products/${handle}?${variantUriQuery}`}
                preventScrollReset
                prefetch="intent"
                replace
                className={clsx(
                  'relative w-10 h-10 rounded-full transition-all',
                  isActive 
                    ? 'ring-2 ring-black ring-offset-2' 
                    : '',
                  !isAvailable && 'opacity-50 cursor-not-allowed',
                )}
                title={value}
              >
                <span className="sr-only">{value}</span>

                <div 
                  className="absolute inset-0 rounded-full overflow-hidden"
                  style={!imageUrl ? {backgroundColor: colorHex} : undefined}
                >
                  {imageUrl && (
                    <Image
                      data={{
                        url: imageUrl,
                        altText: value,
                        width: 40,
                        height: 40,
                      }}
                      width={40}
                      height={40}
                      sizes="40px"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>

                {!isAvailable && (
                  <div className="absolute inset-x-1 border-t border-slate-400 top-1/2 rotate-[-30deg]" />
                )}
              </Link>
            );
          },
        )}
      </div>
    </div>
  );
};

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;
  if (!image && !color) return name;
  return (
    <div
      aria-label={name}
      className="w-8 h-8"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}

const ProductReviews = ({product}: {product: ProductFragment}) => {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const publicOkendoSubcriberId = rootData?.publicOkendoSubcriberId;

  if (!product?.id || !publicOkendoSubcriberId) {
    return null;
  }

  return (
    <>
      <hr className="border-slate-200 dark:border-slate-700" />

      <div className="product-page__reviews scroll-mt-nav" id="reviews">
        {/* HEADING */}
        {product?.okendoReviewsSnippet ? (
          <h2 className="text-2xl font-semibold text-center sm:text-left">
            <span>Reseñas</span>
          </h2>
        ) : null}

        <div className="product-page__reviews-widget">
          <OkendoReviews
            productId={product?.id}
            okendoReviewsSnippet={product?.okendoReviewsSnippet}
          />
        </div>
      </div>
    </>
  );
};

// ─── Bike Detection Helpers ──────────────────────────────────────────────────

const BIKE_KEYWORDS = [
  'bicicleta', 'bici', 'bike', 'bicycle',
  'mtb', 'gravel', 'ruta', 'road', 'e-bike', 'ebike',
  'montaña', 'montana', 'urbana', 'plegable', 'fixie',
  'cicla', 'pedelec',
];

function isBikeProduct(product: any): boolean {
  const title = (product?.title || '').toLowerCase();
  const handle = (product?.handle || '').toLowerCase();
  const type = (product?.productType || '').toLowerCase();
  const collectionTitles = (product?.collections?.nodes || [])
    .map((c: any) => (c.title || '').toLowerCase());

  const allText = [title, handle, type, ...collectionTitles].join(' ');
  return BIKE_KEYWORDS.some((kw) => allText.includes(kw));
}

function detectBikeType(product: any): 'road' | 'mtb' | 'gravel' | 'ebike' | 'urban' {
  const allText = [
    product?.title || '',
    product?.handle || '',
    product?.productType || '',
    ...(product?.collections?.nodes || []).map((c: any) => c.title || ''),
  ].join(' ').toLowerCase();

  if (/gravel/.test(allText)) return 'gravel';
  if (/mtb|monta[ñn]a|mountain|enduro|trail|downhill/.test(allText)) return 'mtb';
  if (/e-bike|ebike|el[eé]ctric|pedelec/.test(allText)) return 'ebike';
  if (/urban|ciudad|city|plegable|fixie/.test(allText)) return 'urban';
  return 'road';
}

// ─── Fixed Add to Cart Bar (Desktop) ────────────────────────────────────────

function FixedAddToCartBar({
  selectedVariant,
  onCartOpen,
}: {
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  onCartOpen: () => void;
}) {
  const {open} = useAside();
  const {product} = useLoaderData<typeof loader>();

  if (!selectedVariant?.availableForSale) return null;

  return (
    <div className="hidden lg:block fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="container flex items-center justify-between py-3 gap-6">
        {/* Product info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {selectedVariant?.image?.url && (
            <img
              src={selectedVariant.image.url}
              alt={product.title}
              className="w-12 h-12 object-contain rounded-lg border border-slate-100 flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {product.title}
            </p>
            <Prices
              contentClass="text-sm font-bold"
              price={selectedVariant?.price}
              compareAtPrice={selectedVariant?.compareAtPrice}
            />
          </div>
        </div>

        {/* Add to Cart */}
        <div className="flex-shrink-0">
          <AddToCartButton
            lines={[
              {
                merchandiseId: selectedVariant.id!,
                quantity: 1,
                selectedVariant,
              },
            ]}
            className="w-full"
            data-test="fixed-add-to-cart"
            onClick={() => open('cart')}
          >
            <ButtonPrimary
              as="span"
              className="flex items-center justify-center gap-3 px-8 py-3"
            >
              <BagIcon className="w-5 h-5 mb-0.5" />
              <span>Agregar al carrito</span>
            </ButtonPrimary>
          </AddToCartButton>
        </div>
      </div>
    </div>
  );
}

export const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
    quantityAvailable
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    sku
    barcode
    title
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
      title
      vendor
      handle
      descriptionHtml
      description
      publishedAt
      encodedVariantExistence
      encodedVariantAvailability
      collections(first: 10) {
        nodes {
          id
          title
          handle
          coleccion_hija: metafield(namespace: "custom", key: "coleccion_hija") {
            references(first: 20) {
              nodes {
                ... on Collection {
                  id
                  handle
                  title
                }
              }
            }
          }
        }
      }
      reviews_rating_count: metafield(namespace: "reviews", key:"rating_count") {
        id
        value
        namespace
        key
      }
      reviews_rating: metafield(namespace: "reviews", key:"rating") {
        id
        value
        namespace
        key
      }
      outstanding_features: metafield(namespace: "ciseco--product", key:"outstanding_features") {
        id
        value
        namespace
        key
      }
      proveedor_1: metafield(namespace: "custom", key: "proveedor_1") {
        value
      }
      custom_badges: metafield(namespace: "custom", key:"badges") {
        id
        value
        namespace
        key
      }
      # Especificaciones técnicas - Todos los metafields de producto
      metafields(identifiers: [
        # Custom namespace
        {namespace: "custom", key: "alto"},
        {namespace: "custom", key: "ancho"},
        {namespace: "custom", key: "bater_a"},
        {namespace: "custom", key: "bielas"},
        {namespace: "custom", key: "cadena"},
        {namespace: "custom", key: "cassette"},
        {namespace: "custom", key: "frenos"},
        {namespace: "custom", key: "horquilla"},
        {namespace: "custom", key: "largo"},
        {namespace: "custom", key: "llantas"},
        {namespace: "custom", key: "manillar"},
        {namespace: "custom", key: "marco"},
        {namespace: "custom", key: "motor"},
        {namespace: "custom", key: "pedalier"},
        {namespace: "custom", key: "ruedas"},
        {namespace: "custom", key: "sensor"},
        {namespace: "custom", key: "sillin"},
        {namespace: "custom", key: "suspensi_n"},
        {namespace: "custom", key: "tenedor"},
        {namespace: "custom", key: "tija_de_sillin"},
        # Global namespace
        {namespace: "global", key: "altoshopi"},
        {namespace: "global", key: "ancho_llanta_compatibleshopi"},
        {namespace: "global", key: "ancho_suspension"},
        {namespace: "global", key: "anchodelproductoshopi"},
        {namespace: "global", key: "anchoshopi"},
        {namespace: "global", key: "angulo_de_rotacion"},
        {namespace: "global", key: "anoshopi"},
        {namespace: "global", key: "bluetooth"},
        {namespace: "global", key: "cadencia"},
        {namespace: "global", key: "cantidad_de_huecos"},
        {namespace: "global", key: "capacidad_de_la_bateria"},
        {namespace: "global", key: "capacidadshopi"},
        {namespace: "global", key: "caracteristicas_del_material"},
        {namespace: "global", key: "color_del_lente"},
        {namespace: "global", key: "compatible_monitor_de_ritmo_cardiaco"},
        {namespace: "global", key: "condiciones"},
        {namespace: "global", key: "consistenciashopi"},
        {namespace: "global", key: "contiene_lactosashopi"},
        {namespace: "global", key: "desbloqueo"},
        {namespace: "global", key: "es_veganoshopi"},
        {namespace: "global", key: "espigo"},
        {namespace: "global", key: "forma_del_candadoshopi"},
        {namespace: "global", key: "fotocromatica"},
        {namespace: "global", key: "funciones_adicionalesshopi"},
        {namespace: "global", key: "garantia"},
        {namespace: "global", key: "generoshopi"},
        {namespace: "global", key: "guantesldedo"},
        {namespace: "global", key: "largoshopi"},
        {namespace: "global", key: "libre_de_glutenshopi"},
        {namespace: "global", key: "mapas"},
        {namespace: "global", key: "materialshopi"},
        {namespace: "global", key: "microfono"},
        {namespace: "global", key: "numero_de_eslabonesshopi"},
        {namespace: "global", key: "numero_de_herramientas"},
        {namespace: "global", key: "palancas"},
        {namespace: "global", key: "pantalla"},
        {namespace: "global", key: "peso_producto"},
        {namespace: "global", key: "posicion_manzana"},
        {namespace: "global", key: "posicionshopi"},
        {namespace: "global", key: "potencia_e-bike"},
        {namespace: "global", key: "recorrido"},
        {namespace: "global", key: "sensibilidadshopi"},
        {namespace: "global", key: "sistema_de_fijacionshopi"},
        {namespace: "global", key: "sistema_de_montajeshopi"},
        {namespace: "global", key: "tamano_de_rinshopi"},
        {namespace: "global", key: "tensor"},
        {namespace: "global", key: "tipo_de_alimentacionshopi"},
        {namespace: "global", key: "tipo_de_aperturashopi"},
        {namespace: "global", key: "tipo_de_bicicletashopi"},
        {namespace: "global", key: "tipo_de_bloqueo"},
        {namespace: "global", key: "tipo_de_eje"},
        {namespace: "global", key: "tipo_de_frenoshopi"},
        {namespace: "global", key: "tipo_de_mangashopi"},
        {namespace: "global", key: "tipo_de_plato"},
        {namespace: "global", key: "tipo_de_valvulashopi"},
        {namespace: "global", key: "tipodeplato"},
        {namespace: "global", key: "tubelessshopi"},
        {namespace: "global", key: "velocidades"},
        {namespace: "global", key: "wirelesscicloc"},
        # Specs namespace
        {namespace: "specs", key: "highlights"}
      ]) {
        key
        namespace
        value
      }
      options {
        name
        optionValues {
          name
          firstSelectableVariant {
            ...ProductVariant
          }
          swatch {
            color
            image {
              previewImage {
                url
              }
            }
          }
        }
      }
      selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        ...ProductVariant
      }
      adjacentVariants (selectedOptions: $selectedOptions) {
        ...ProductVariant
      }
      media(first: 7) {
        nodes {
          ...Media
        }
      }
      # variants(first: 1) {
      #   nodes {
      #     ...ProductVariant
      #   }
      # }
      seo {
        description
        title
      }
      ...OkendoStarRatingSnippet
		  ...OkendoReviewsSnippet
  }
  ${PRODUCT_VARIANT_FRAGMENT}
  ${OKENDO_PRODUCT_STAR_RATING_FRAGMENT}
	${OKENDO_PRODUCT_REVIEWS_FRAGMENT}
` as const;

export const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
    shop {
      name
      primaryDomain {
        url
      }
      shippingPolicy {
        handle
      }
      refundPolicy {
        handle
      }
      subscriptionPolicy {
        handle
      }
    }
  }
  ${MEDIA_FRAGMENT}
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query productRecommendations(
    $productId: ID!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...CommonProductCard
    }
    additional: products(first: $count, sortKey: BEST_SELLING) {
      nodes {
        ...CommonProductCard
      }
    }
  }
  ${COMMON_PRODUCT_CARD_FRAGMENT}
` as const;

async function getRecommendedProducts(
  storefront: Storefront,
  productId: string,
) {
  const products = await storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
    variables: {productId, count: 12},
  });

  invariant(products, 'No data returned from Shopify API');

  const mergedProducts = (products.recommended ?? [])
    .concat(products.additional.nodes)
    .filter(
      (value, index, array) =>
        array.findIndex((value2) => value2.id === value.id) === index,
    );

  const originalProduct = mergedProducts.findIndex(
    (item) => item.id === productId,
  );

  mergedProducts.splice(originalProduct, 1);

  return {nodes: mergedProducts};
}

const CREDIT_CALCULATOR_QUERY = `#graphql
  query creditCalculatorConfig {
    metaobject(handle: {type: "ciseco--credit_calculator", handle: "credit-calculator-config"}) {
      id
      enabled: field(key: "enabled") { value }
      title: field(key: "title") { value }
      monthly_label: field(key: "monthly_label") { value }
      installments_label: field(key: "installments_label") { value }
      partners_title: field(key: "partners_title") { value }
      installment_options: field(key: "installment_options") { value }
      partners: field(key: "partners") { value }
      benefits: field(key: "benefits") { value }
    }
  }
` as const;

function parseCreditCalculatorConfig(metaobject: any) {
  if (!metaobject) return null;
  
  try {
    return {
      enabled: metaobject.enabled?.value === 'true',
      title: metaobject.title?.value || 'Opciones de financiación',
      monthlyLabel: metaobject.monthly_label?.value || 'Cuota mensual',
      installmentsLabel: metaobject.installments_label?.value || 'Pagar en',
      partnersTitle: metaobject.partners_title?.value || 'Métodos de crédito disponibles',
      installmentOptions: metaobject.installment_options?.value 
        ? JSON.parse(metaobject.installment_options.value) 
        : [3, 6, 12, 24],
      defaultInstallments: 12,
      partners: metaobject.partners?.value 
        ? JSON.parse(metaobject.partners.value) 
        : [],
      benefits: metaobject.benefits?.value 
        ? JSON.parse(metaobject.benefits.value) 
        : [],
    };
  } catch (e) {
    console.error('Error parsing credit calculator config:', e);
    return null;
  }
}

const PROVEEDORES_QUERY = `#graphql
  query proveedores {
    proveedores: metaobjects(type: "proveedor", first: 50) {
      nodes {
        handle
        name: field(key: "name") { value }
        delivery_time: field(key: "delivery_time") { value }
      }
    }
  }
` as const;

const PDP_HELP_BANNER_QUERY = `#graphql
  query pdpHelpBanner {
    pdpHelpBanner: metaobjects(type: "ciseco--pdp_help_banner", first: 1) {
      nodes {
        id
        handle
        heading: field(key: "heading") {
          value
        }
        description: field(key: "description") {
          value
        }
        cta_text: field(key: "cta_text") {
          value
        }
        cta_link: field(key: "cta_link") {
          value
        }
        background_color: field(key: "background_color") {
          value
        }
        text_color: field(key: "text_color") {
          value
        }
        button_background_color: field(key: "button_background_color") {
          value
        }
        button_text_color: field(key: "button_text_color") {
          value
        }
        enabled: field(key: "enabled") {
          value
        }
      }
    }
  }
` as const;
