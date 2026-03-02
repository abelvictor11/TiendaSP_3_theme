import {Suspense, useState} from 'react';
import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, Await, useRouteLoaderData} from '@remix-run/react';
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
import {NoSymbolIcon} from '@heroicons/react/24/outline';
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
import {ComplementaryProducts} from '~/components/ComplementaryProducts';

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

  const [{shop, product}] = await Promise.all([
    context.storefront.query(PRODUCT_QUERY, {
      variables: {
        handle: productHandle,
        selectedOptions,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
  ]);

  if (!product?.id) {
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

  return {
    shop,
    variants,
    product,
    recommended,
    storeDomain: shop.primaryDomain.url,
    seo,
  };
}

function loadDeferredData(args: LoaderFunctionArgs) {
  const {params, request, context} = args;
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  // 3. Query the route metaobject
  const routePromise = getLoaderRouteFromMetaobject({
    params,
    context,
    request,
    handle: 'route-product',
  });

  // Query PDP Help Banner
  const helpBannerPromise = context.storefront.query(PDP_HELP_BANNER_QUERY, {
    cache: context.storefront.CacheLong(),
  });

  return {
    routePromise,
    helpBannerPromise,
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Product() {
  const {product, shop, recommended, variants, routePromise, storeDomain, helpBannerPromise} =
    useLoaderData<typeof loader>();
  const {
    media,
    outstanding_features,
    descriptionHtml,
    id,
    // Specs
    specs_dimensiones,
    specs_peso_max_usuario,
    specs_tipo_resistencia,
    specs_niveles_resistencia,
    specs_potencia_motor,
    specs_peso_producto,
    specs_garantia,
    specs_nivel_ruido,
    specs_conectividad,
    specs_certificaciones,
    specs_plegable,
    specs_requiere_electricidad,
    specs_ficha_tecnica_pdf,
    specs_video_producto,
    specs_highlights,
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

  return (
    <div
      className={clsx(
        'product-page mt-5 lg:mt-10 pb-20 lg:pb-28 space-y-12 sm:space-y-16',
      )}
    >
      <main className="container">
        <div className="lg:flex">
          {/* Left Column - Galleries + Description */}
          <div className="w-full lg:w-[55%]">
            {/* Galleries */}
            <div className="relative">
              <ProductGallery
                media={media.nodes}
                className="w-full lg:col-span-2 lg:gap-7"
                discountPercentage={discountPercentage}
              />
              <LikeButton
                id={id}
                className="absolute top-3 end-3 z-10 !w-10 !h-10"
              />
            </div>

            {/* Product Description - Below images on desktop */}
            {!!descriptionHtml && (
              <div className="hidden lg:block mt-10">
                <h2 className="text-2xl font-semibold">Detalles del producto</h2>
                <div
                  className="prose prose-sm sm:prose dark:prose-invert sm:max-w-4xl mt-7"
                  dangerouslySetInnerHTML={{
                    __html: descriptionHtml || '',
                  }}
                />
              </div>
            )}

            {/* Technical Specifications - Below gallery on desktop */}
            <div className="hidden lg:block mt-10">
              <ProductSpecs
                dimensiones={specs_dimensiones?.value}
                pesoMaxUsuario={specs_peso_max_usuario?.value}
                tipoResistencia={specs_tipo_resistencia?.value}
                nivelesResistencia={specs_niveles_resistencia?.value}
                potenciaMotor={specs_potencia_motor?.value}
                pesoProducto={specs_peso_producto?.value}
                garantia={specs_garantia?.value}
                nivelRuido={specs_nivel_ruido?.value}
                conectividad={specs_conectividad?.value}
                certificaciones={specs_certificaciones?.value}
                plegable={specs_plegable?.value === 'true'}
                requiereElectricidad={specs_requiere_electricidad?.value === 'true'}
                fichaTecnicaPdf={specs_ficha_tecnica_pdf?.reference?.url}
                videoProducto={specs_video_producto?.value}
              />
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="w-full lg:w-[45%] pt-10 lg:pt-0 lg:pl-7 xl:pl-9 2xl:pl-10">
            <div className="sticky top-10 grid gap-7 2xl:gap-8">
              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
                storeDomain={storeDomain}
              />

              {/* Highlights - Quick specs icons */}
              <ProductHighlights
                highlights={specs_highlights?.value ? JSON.parse(specs_highlights.value) as string[] : undefined}
                pesoMaxUsuario={specs_peso_max_usuario?.value}
                plegable={specs_plegable?.value === 'true'}
                requiereElectricidad={specs_requiere_electricidad?.value === 'true'}
              />

              {/*  */}
              <hr className=" border-[#dacac7] dark:border-slate-700"></hr>
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

        {/* DETAIL AND REVIEW */}
        <div className="mt-12 sm:mt-16 space-y-12 sm:space-y-16">
          {/* Product description - Mobile only (desktop shows below images) */}
          {!!descriptionHtml && (
            <div className="lg:hidden">
              <h2 className="text-2xl font-semibold">Detalles del producto</h2>
              <div
                className="prose prose-sm sm:prose dark:prose-invert sm:max-w-4xl mt-7"
                dangerouslySetInnerHTML={{
                  __html: descriptionHtml || '',
                }}
              />
            </div>
          )}

          {/* Technical Specifications - Mobile only (desktop shows below gallery) */}
          <div className="lg:hidden">
            <ProductSpecs
              dimensiones={specs_dimensiones?.value}
              pesoMaxUsuario={specs_peso_max_usuario?.value}
              tipoResistencia={specs_tipo_resistencia?.value}
              nivelesResistencia={specs_niveles_resistencia?.value}
              potenciaMotor={specs_potencia_motor?.value}
              pesoProducto={specs_peso_producto?.value}
              garantia={specs_garantia?.value}
              nivelRuido={specs_nivel_ruido?.value}
              conectividad={specs_conectividad?.value}
              certificaciones={specs_certificaciones?.value}
              plegable={specs_plegable?.value === 'true'}
              requiereElectricidad={specs_requiere_electricidad?.value === 'true'}
              fichaTecnicaPdf={specs_ficha_tecnica_pdf?.reference?.url}
              videoProducto={specs_video_producto?.value}
            />
          </div>

          {/* Product reviews */}
          <ProductReviews product={product} />

          <hr className="border-[#dacac7] dark:border-slate-700" />

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
          {({route}) => (
            <>
              <RouteContent
                route={route}
                className="space-y-12 sm:space-y-16"
              />
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

export function ProductForm({
  productOptions,
  selectedVariant,
  storeDomain,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  storeDomain: string;
}) {
  const {open} = useAside();
  const {product} = useLoaderData<typeof loader>();
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = !selectedVariant?.availableForSale;

  const status = getProductStatus({
    availableForSale: !!selectedVariant?.availableForSale,
    compareAtPriceRangeMinVariantPrice:
      selectedVariant?.compareAtPrice || undefined,
    priceRangeMinVariantPrice: selectedVariant?.price,
    publishedAt: product.publishedAt,
  });

  const collection = product.collections.nodes[0];

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
        {!!collection && (
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
                  <SlashIcon className="ml-2 h-5 w-5 flex-shrink-0 text-gray-300 " />
                </div>
              </li>
              <li>
                <div className="flex items-center text-sm">
                  <Link
                    to={'/collections/' + collection.handle}
                    className="font-medium text-gray-500 hover:text-gray-900"
                  >
                    {/* romove html on title */}
                    {collection.title.replace(/(<([^>]+)>)/gi, '')}
                  </Link>
                </div>
              </li>
            </ol>
          </nav>
        )}

        {/* Vendor */}
        {product.vendor && (
          <p className="text-xs font-normal text-black uppercase tracking-wide mb-2">
            {product.vendor}
          </p>
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
      {productOptions.map((option, optionIndex) => (
        <div key={option.name}>
          {option.name === 'Color' ? (
            <ProductColorOption option={option} />
          ) : (
            <ProductOtherOption option={option} />
          )}
        </div>
      ))}

      {selectedVariant && (
        <div className="grid items-stretch gap-4">
          {isOutOfStock ? (
            <ButtonSecondary disabled>
              <NoSymbolIcon className="w-5 h-5" />
              <span className="ms-2">Agotado</span>
            </ButtonSecondary>
          ) : (
            <div className="flex gap-2 sm:gap-3.5 items-stretch">
              <div className="flex items-center justify-center bg-[#F9F7F7]/70 dark:bg-secondary-700/70 p-2 sm:p-3 rounded-full">
                <NcInputNumber
                  className=""
                  defaultValue={quantity}
                  onChange={setQuantity}
                />
              </div>
              <div className="flex-1 *:h-full *:flex">
                <AddToCartButton
                  lines={[
                    {
                      merchandiseId: selectedVariant.id!,
                      quantity,
                      selectedVariant,
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
          {/* {!isOutOfStock && (
            <ShopPayButton
              width="100%"
              className="rounded-full"
              variantIds={[selectedVariant?.id!]}
              storeDomain={storeDomain}
            />
          )} */}
        </div>
      )}
    </>
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
                  'relative flex items-center justify-center rounded-md border py-3 px-5 sm:px-3 text-sm font-medium uppercase sm:flex-1 cursor-pointer focus:outline-none border-gray-200 ',
                  !isAvailable
                    ? isActive
                      ? 'opacity-90 text-opacity-80 cursor-not-allowed'
                      : 'text-opacity-20 cursor-not-allowed'
                    : 'cursor-pointer',
                  isActive
                    ? 'bg-secondary-800 border-secondary-800 text-slate-100'
                    : 'border-slate-300 text-secondary-800 hover:bg-neutral-50 ',
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
  const {getImageWithCdnUrlByName} =
    useGetPublicStoreCdnStaticUrlFromRootLoaderData();

  if (!option.optionValues.length) {
    return null;
  }

  // Check if any option has a variant image
  const hasVariantImages = option.optionValues.some(
    (opt) => opt.variant?.image?.url
  );

  return (
    <div>
      <div className="text-sm font-medium">Select {option.name}</div>
      
      {/* Large cards with variant images */}
      {hasVariantImages ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          {option.optionValues.map(
            ({
              name: value,
              variantUriQuery,
              selected: isActive,
              available: isAvailable,
              isDifferentProduct,
              handle,
              variant,
            }) => {
              const variantImage = variant?.image;
              // Fallback to CDN image if no variant image
              const imageUrl = variantImage?.url || getImageWithCdnUrlByName(value.replaceAll(/ /g, '_'));
              
              return (
                <Link
                  key={option.name + value}
                  {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                  to={`/products/${handle}?${variantUriQuery}`}
                  preventScrollReset
                  prefetch="intent"
                  replace
                  className={clsx(
                    'relative flex flex-col rounded-lg border-2 p-3 transition-all',
                    isActive 
                      ? 'border-primary-500 bg-primary-50/50' 
                      : 'border-[#dacac7] dark:border-slate-700 hover:border-slate-300',
                    !isAvailable && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {/* Image */}
                  <div className="aspect-square w-full rounded-md overflow-hidden bg-[#F9F7F7] dark:bg-secondary-700 mb-2 flex items-center justify-center">
                    <Image
                      data={{
                        url: imageUrl,
                        altText: value,
                        width: 200,
                        height: 200,
                      }}
                      width={200}
                      height={200}
                      sizes="(max-width: 640px) 120px, 150px"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Color name */}
                  <span className={clsx(
                    'text-sm font-medium text-center',
                    isActive ? 'text-primary-600' : 'text-[#131210] dark:text-slate-300'
                  )}>
                    {value}
                  </span>

                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-secondary-800/60 rounded-lg">
                      <span className="text-xs text-slate-500">Agotado</span>
                    </div>
                  )}
                </Link>
              );
            },
          )}
        </div>
      ) : (
        /* Fallback: Small circular swatches */
        <div className="flex flex-wrap gap-3 mt-3">
          {option.optionValues.map(
            ({
              name: value,
              variantUriQuery,
              selected: isActive,
              available: isAvailable,
              isDifferentProduct,
              handle,
            }) => (
              <Link
                key={option.name + value}
                {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                to={`/products/${handle}?${variantUriQuery}`}
                preventScrollReset
                prefetch="intent"
                replace
                className={clsx(
                  'relative w-8 h-8 md:w-9 md:h-9 rounded-full',
                  isActive ? 'ring ring-offset-1 ring-primary-500/60' : '',
                  !isAvailable && 'opacity-50 cursor-not-allowed',
                )}
                title={value}
              >
                <span className="sr-only">{value}</span>

                <div className="absolute inset-0.5 rounded-full overflow-hidden z-0">
                  <Image
                    data={{
                      url: getImageWithCdnUrlByName(value.replaceAll(/ /g, '_')),
                      altText: value,
                      width: 36,
                      height: 36,
                    }}
                    width={36}
                    height={36}
                    sizes="(max-width: 640px) 36px, 40px"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>

                {!isAvailable && (
                  <div className="absolute inset-x-1 border-t border-dashed top-1/2 rotate-[-30deg]" />
                )}
              </Link>
            ),
          )}
        </div>
      )}
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
      <hr className="border-[#dacac7] dark:border-slate-700" />

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

export const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
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
      collections(first: 1) {
        nodes {
          id
          title
          handle
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
      custom_badges: metafield(namespace: "custom", key:"badges") {
        id
        value
        namespace
        key
      }
      # Especificaciones técnicas
      specs_dimensiones: metafield(namespace: "specs", key:"dimensiones") {
        value
      }
      specs_peso_max_usuario: metafield(namespace: "specs", key:"peso_max_usuario") {
        value
      }
      specs_tipo_resistencia: metafield(namespace: "specs", key:"tipo_resistencia") {
        value
      }
      specs_niveles_resistencia: metafield(namespace: "specs", key:"niveles_resistencia") {
        value
      }
      specs_potencia_motor: metafield(namespace: "specs", key:"potencia_motor") {
        value
      }
      specs_peso_producto: metafield(namespace: "specs", key:"peso_producto") {
        value
      }
      specs_garantia: metafield(namespace: "specs", key:"garantia") {
        value
      }
      specs_nivel_ruido: metafield(namespace: "specs", key:"nivel_ruido") {
        value
      }
      specs_conectividad: metafield(namespace: "specs", key:"conectividad") {
        value
      }
      specs_certificaciones: metafield(namespace: "specs", key:"certificaciones") {
        value
      }
      specs_plegable: metafield(namespace: "specs", key:"plegable") {
        value
      }
      specs_requiere_electricidad: metafield(namespace: "specs", key:"requiere_electricidad") {
        value
      }
      specs_ficha_tecnica_pdf: metafield(namespace: "specs", key:"ficha_tecnica_pdf") {
        reference {
          ... on GenericFile {
            url
          }
        }
      }
      specs_video_producto: metafield(namespace: "specs", key:"video_producto") {
        value
      }
      specs_highlights: metafield(namespace: "specs", key:"highlights") {
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
