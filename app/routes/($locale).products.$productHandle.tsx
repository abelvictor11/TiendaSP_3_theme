import {Suspense, useState, useEffect, useRef} from 'react';
import {
  defer,
  redirect,
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
// Policy import removed - policy cards no longer shown on PDP
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import BagIcon from '~/components/BagIcon';
import {NoSymbolIcon} from '@heroicons/react/24/outline';
import {getProductStatus, ProductBadge} from '~/components/ProductCard';
import ShippingBadge from '~/components/ShippingBadge';
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
import {getSeoMetaTags} from '~/lib/seoMeta';
import {getLoaderRouteFromMetaobject} from '~/utils/getLoaderRouteFromMetaobject';
import type {RootLoader} from '~/root';
import {useAside} from '~/components/Aside';
import {SlashIcon} from '@heroicons/react/24/solid';
import ProductHelpBanner from '~/components/ProductHelpBanner';
import {PreorderCountdown} from '~/components/PreorderCountdown';
// ProductHighlights import removed - replaced by PdpAccordion structure
import ProductSpecs from '~/components/ProductSpecs';
import {ComplementaryProducts} from '~/components/ComplementaryProducts';
import {PdpEnhancedSection, parsePdpEnhancedData} from '~/components/PdpEnhancedSection';
import {ProductDescriptionBlock} from '~/components/ProductDescriptionBlock';
import {ProductFeatureBlocks, parseFeatureBlocks} from '~/components/ProductFeatureBlocks';
import {getLegacyRedirectTarget} from '~/lib/legacyRedirects.server';

export const headers = routeHeaders;

async function queryWithRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delayMs = 200,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return queryWithRetry(fn, retries - 1, delayMs);
  }
}

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

  // Unlike recommended/routePromise/helpBannerPromise, this query can't fall
  // back to null on failure — the whole page depends on it. A single retry
  // absorbs a brief Storefront API blip instead of sending every product
  // page to the generic error boundary for it.
  const {shop, product} = await queryWithRetry(() =>
    context.storefront.query(PRODUCT_QUERY, {
      variables: {
        handle: productHandle,
        selectedOptions,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
  );

  if (!product?.id) {
    // Fall back to legacyRedirects.json before 404ing: this route is more
    // specific than the $.tsx catch-all, so Remix matches it first for
    // canonical-shaped legacy paths (e.g. /products/producto-antiguo) and
    // $.tsx never gets a chance to consult the redirect map for them.
    const target = getLegacyRedirectTarget(new URL(request.url).pathname);
    if (target) {
      throw redirect(target, 301);
    }

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
  // .catch() so a transient error here can't take down the whole PDP —
  // RouteContent already no-ops on route: null via its `route?.sections &&`
  // guard, so this degrades to "no extra route sections" instead of a 500.
  const routePromise = getLoaderRouteFromMetaobject({
    params,
    context,
    request,
    handle: 'route-product',
  }).catch(() => ({route: null}));

  // Query PDP Help Banner
  // .catch() for the same reason — the consumer already optional-chains
  // through bannerData?.pdpHelpBanner?.nodes?.[0], so null degrades to "no
  // banner" instead of crashing the page.
  const helpBannerPromise = context.storefront
    .query(PDP_HELP_BANNER_QUERY, {
      cache: context.storefront.CacheLong(),
    })
    .catch(() => null);

  return {
    routePromise,
    helpBannerPromise,
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMetaTags(
    matches.map((match) => (match?.data as any)?.seo),
    'product',
  );
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

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    variants,
  );
  const isOutOfStock = !selectedVariant?.availableForSale;
  // Distinct from isOutOfStock above: that's about the currently-selected
  // variant specifically (drives the disabled "Agotado" add-to-cart button);
  // this is whether the product has ANY purchasable variant at all (drives
  // the "sold out, here are alternatives" messaging below, which shouldn't
  // fire just because the default/selected variant is OOS while a different
  // option is still in stock).
  const productSoldOut = !product.availableForSale;
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

  // Enhanced PDP data (per-product, activated via metafields)
  const enhancedData = parsePdpEnhancedData(product);

  return (
    <div
      className={clsx(
        // pb-32 (vs. the lg:pb-28 desktop value) reserves clearance for the
        // mobile-only FixedAddToCartBar below so it doesn't overlap the
        // page's last content/footer on scroll.
        'product-page mt-5 lg:mt-10 pb-32 lg:pb-28 space-y-12 sm:space-y-16',
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
                selectedVariantImageUrl={selectedVariant?.image?.url}
              />
              <LikeButton
                id={id}
                className="absolute top-3 end-3 z-10 !w-10 !h-10"
              />
            </div>

            {/* Above-the-fold OOS alternatives — thefeed shows this pattern
                twice (here + near the buy box below); on mobile the buy box
                is a long scroll away, so a customer landing on an
                out-of-stock product via a shared/ad link otherwise sees
                nothing actionable until they scroll past the gallery. Same
                recommended promise + ComplementaryProducts as the near-buy-box
                instance, just without the redundant disabled "Agotado" button.
                Gated on productSoldOut (product-wide), not isOutOfStock
                (selected-variant-only) — a customer who landed on an
                out-of-stock color/size of an otherwise-in-stock product
                shouldn't be told to look at unrelated alternatives instead
                of just picking a different option on this same page. */}
            {productSoldOut && (
              <Suspense fallback={null}>
                <Await resolve={recommended}>
                  {(products) => {
                    const alternatives = products.nodes.slice(0, 2);
                    if (!alternatives.length) return null;
                    return (
                      <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <p className="px-4 pt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                          Este producto está agotado. ¿Buscas algo similar? Mira
                          estas alternativas disponibles:
                        </p>
                        <ComplementaryProducts
                          products={alternatives}
                          hideHeader
                        />
                      </div>
                    );
                  }}
                </Await>
              </Suspense>
            )}

            {/* Description below thumbnails - only on desktop */}
            {!!descriptionHtml && (
              <ProductDescriptionBlock
                descriptionHtml={descriptionHtml}
                maxChars={350}
                className="hidden lg:block mt-8 lg:mt-10"
              />
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="w-full lg:w-[45%] pt-10 lg:pt-0 lg:pl-7 xl:pl-9 2xl:pl-10">
            <div className="sticky top-10 grid gap-7 2xl:gap-8">
              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
                storeDomain={storeDomain}
              />

              {/* Accordions: Especificaciones, Equípate al completo */}
              <div className="divide-y divide-[#dacac7] dark:divide-slate-700 border border-[#dacac7] dark:border-slate-700 rounded-xl overflow-hidden">
                {/* Especificaciones Técnicas Accordion */}
                <PdpAccordion title="Especificaciones Técnicas">
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
                    hideTitle
                  />
                </PdpAccordion>

                {/* Equípate al completo Accordion */}
                <Suspense fallback={null}>
                  <Await resolve={recommended}>
                    {(products) => {
                      const complementary = products.nodes.slice(0, 4);
                      if (!complementary.length) return null;
                      return (
                        <PdpAccordion title="Equípate al completo">
                          <ComplementaryProducts
                            products={complementary}
                            title="Equípate al completo"
                            hideHeader
                          />
                        </PdpAccordion>
                      );
                    }}
                  </Await>
                </Suspense>
              </div>

              {/* Description after accordion - only on mobile */}
              {!!descriptionHtml && (
                <ProductDescriptionBlock
                  descriptionHtml={descriptionHtml}
                  maxChars={350}
                  className="lg:hidden"
                />
              )}

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
            </div>
          </div>
        </div>

        {/* Enhanced PDP sections (per-product, activated via metafields) */}
        {enhancedData && <PdpEnhancedSection data={enhancedData} />}

        {/* Feature Blocks - grilla de tarjetas (imagen + título + descripción) */}
        {(() => {
          const featureBlocks = parseFeatureBlocks(product);
          const keyFeatures = ((product as any)?.features_key_features?.value ||
            '')
            .split('\n')
            .map((s: string) => s.trim())
            .filter(Boolean);
          return featureBlocks.length > 0 || keyFeatures.length > 0 ? (
            <ProductFeatureBlocks
              blocks={featureBlocks}
              heading={
                (product as any)?.features_heading?.value || 'Características'
              }
              eyebrow={(product as any)?.features_eyebrow?.value || undefined}
              keyFeatures={keyFeatures}
              className="mt-12 sm:mt-16"
            />
          ) : null;
        })()}

        {/* DETAIL AND REVIEW */}
        <div className="mt-12 sm:mt-16 space-y-12 sm:space-y-16">
          {/* Product reviews */}
          <ProductReviews product={product} />

          <hr className="border-[#dacac7] dark:border-slate-700" />

          {/* OTHER SECTION */}
          <Suspense fallback={<div className="h-32" />}>
            <Await
              errorElement="Hubo un problema al cargar productos relacionados"
              resolve={recommended}
            >
              {(products) => {
                // SnapSliderProducts always renders its heading + nav
                // arrows regardless of how many products it's given — on
                // the empty-array fallback from a rejected recommended
                // promise, that leaves a misleading empty carousel instead
                // of no section at all.
                if (!products.nodes.length) return null;
                return (
                  <SnapSliderProducts
                    heading_bold={'Los clientes también compraron'}
                    products={products.nodes}
                    className=""
                    headingFontClass="text-2xl font-semibold"
                  />
                );
              }}
            </Await>
          </Suspense>
        </div>
      </main>

      {/* 3. Render the route's content sections */}
      <Suspense fallback={<div className="h-32" />}>
        <Await
          errorElement="Hubo un problema al cargar el contenido de la página"
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
  const {product, recommended} = useLoaderData<typeof loader>();
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = !selectedVariant?.availableForSale;
  // See the identical comment in Product() above — product-wide vs.
  // selected-variant-only availability.
  const productSoldOut = !product.availableForSale;

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

  // Shipping badge (metaobject reference) — ej. "Llega en 24 horas"
  const shippingBadgeMetaobject = (product as any)?.shipping_badge?.reference;

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

        {/* Shipping Badge (metaobject: ej. "Llega en 24 horas") — encima del H1 */}
        {shippingBadgeMetaobject && (
          <div className="mb-2">
            <ShippingBadge metaobject={shippingBadgeMetaobject} size="md" />
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

      {/* ---------- ADDI WIDGET ---------- */}
      <AddiWidget price={selectedVariant?.price} />

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
            <>
              <ButtonSecondary disabled>
                <NoSymbolIcon className="w-5 h-5" />
                <span className="ms-2">Agotado</span>
              </ButtonSecondary>

              {/* Alternativas — solo cuando TODO el producto está agotado
                  (productSoldOut), no cuando la variante seleccionada lo
                  está pero otras opciones del mismo producto siguen
                  disponibles (en ese caso el swatch/selector de opciones
                  arriba ya muestra cuáles siguen disponibles — mandar al
                  cliente a "alternativas" no relacionadas sería peor que no
                  decir nada). Sin esto el cliente llega a un callejón sin
                  salida cuando sí aplica; el mismo mecanismo de "Equípate al
                  completo" (más abajo, dentro de un accordion siempre
                  colapsado) ya trae estos datos, solo lo mostramos de
                  inmediato junto al botón deshabilitado en vez de exigir un
                  click adicional. */}
              {productSoldOut && (
                <Suspense fallback={null}>
                  <Await resolve={recommended}>
                    {(products) => {
                      const alternatives = products.nodes.slice(0, 2);
                      if (!alternatives.length) return null;
                      return (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <p className="px-4 pt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                            ¿Buscas algo similar? Mira estas alternativas
                            disponibles:
                          </p>
                          <ComplementaryProducts
                            products={alternatives}
                            hideHeader
                          />
                        </div>
                      );
                    }}
                  </Await>
                </Suspense>
              )}
            </>
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

          {/* Fixed Add to Cart Bar — mobile only. Inline button above
              scrolls out of view quickly on mobile's long single-column
              layout; this keeps Add to Cart reachable without scrolling
              back up. Shares this component's own `quantity`/`selectedVariant`
              state so a quantity picked above the fold is respected here too. */}
          {!isOutOfStock && (
            <FixedAddToCartBar
              selectedVariant={selectedVariant}
              quantity={quantity}
              onOpenCart={() => open('cart')}
            />
          )}

          {/* {!isOutOfStock && (
            <ShopPayButton
              width="100%"
              className="rounded-full"
              variantIds={[selectedVariant?.id!]}
              storeDomain={storeDomain}
            />
          )} */}

          {/* Countdown de preventa: aparece si el producto tiene el metafield
              custom.fecha_envio_preventa con una fecha futura. */}
          <PreorderCountdown
            shipDate={(product as any).preorder_ship_date?.value}
          />
        </div>
      )}
    </>
  );
}

// ─── Fixed Add to Cart Bar (mobile only) ────────────────────────────────────

function FixedAddToCartBar({
  selectedVariant,
  quantity,
  onOpenCart,
}: {
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  quantity: number;
  onOpenCart: () => void;
}) {
  const {product} = useLoaderData<typeof loader>();

  if (!selectedVariant?.availableForSale) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="container flex items-center justify-between py-3 gap-3">
        {/* Product info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedVariant?.image?.url && (
            // Hidden below sm: on narrow phones the 48px thumbnail leaves
            // too little room for the price next to a non-shrinking CTA
            // button (Colombian prices like "$15.000.000,00" don't wrap
            // within a single unbreakable span) — dropping it here frees
            // that width for the price instead.
            <img
              src={selectedVariant.image.url}
              alt={product.title}
              className="hidden sm:block w-12 h-12 object-contain rounded-lg border border-slate-100 dark:border-slate-700 flex-shrink-0"
            />
          )}
          <div className="min-w-0 overflow-hidden">
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
                quantity,
                selectedVariant,
              },
            ]}
            className="w-full"
            data-test="fixed-add-to-cart"
            onClick={onOpenCart}
          >
            <ButtonPrimary
              as="span"
              className="flex items-center justify-center gap-3"
              sizeClass="py-3 px-4 sm:px-8"
            >
              <BagIcon className="hidden sm:inline-block w-5 h-5 mb-0.5" />
              <span>Agregar al carrito</span>
            </ButtonPrimary>
          </AddToCartButton>
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
                  'relative flex items-center justify-center rounded-md border py-3 px-5 sm:px-6 text-sm font-medium uppercase min-w-[80px] cursor-pointer focus:outline-none border-gray-200 ',
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


// Enlace estático original -- fallback cuando el widget dinámico no está
// configurado (PUBLIC_ADDI_PARTNER_ID / PUBLIC_ADDI_ALLY_SLUG vacíos).
function AddiStaticLink({
  price,
}: {
  price: {amount: string; currencyCode: string};
}) {
  const amount = Math.round(parseFloat(price.amount));
  const addiUrl = `https://www.addi.com/compra-ahora-paga-despues/?storeUuid=sportfitnessshopcolombiasas&price=${amount}&currency=${price.currencyCode}`;

  return (
    <div className="w-full mt-3 mb-2">
      <a
        href={addiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
      >
        <span className="font-medium">Paga en cuotas con</span>
        {/* Logo de Addi como texto estilizado - evita problemas de carga de imagen */}
        <span
          className="font-bold text-lg tracking-tight"
          style={{
            color: '#00D0A0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          addi
        </span>
        <span className="text-slate-400 text-xs">→</span>
      </a>
      <p className="text-xs text-slate-500 mt-1">
        Monto mínimo $50.000 COP •{' '}
        <a
          href={addiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-700"
        >
          Ver condiciones
        </a>
      </p>
    </div>
  );
}

const ADDI_WIDGET_TARGET_ID = 'addi-product-widget-target';
const ADDI_WIDGET_SCRIPT_SRC =
  'https://s3.amazonaws.com/statics.addi.com/shopify/js/shopify-co-widget-wrapper.bundle.min.js';

// Widget dinámico oficial de Addi para Shopify -- muestra el cálculo real
// "desde $X/mes" en vez del enlace estático genérico de antes. `partnerId`
// y `allySlug` son específicos de la cuenta Addi de esta tienda (llegan por
// correo de activacion.aliados@addi.com), nunca inventados aquí -- ver
// env.d.ts. `data-element-reference` es el patrón documentado por Addi para
// este script; no confirmado en vivo todavía por falta de credenciales
// reales al momento de escribir esto -- verificar con datos reales.
function AddiDynamicWidget({
  price,
  partnerId,
  allySlug,
}: {
  price: {amount: string; currencyCode: string};
  partnerId: string;
  allySlug: string;
}) {
  const amount = Math.round(parseFloat(price.amount));

  useEffect(() => {
    // El script de Addi lee el precio del target una sola vez al ejecutarse
    // (no reactivamente) -- si el cliente navega de un producto a otro sin
    // recargar la página (React Router client-side nav, sin remount de esta
    // ruta), el efecto anterior con dedup fijo ('script[data-addi-widget]')
    // nunca reinyectaba, dejando el widget congelado en el precio del
    // primer producto visto en la sesión. Quitar el script previo y
    // reinyectar en cada cambio de precio fuerza una lectura fresca del
    // target -- sin credenciales reales de Addi para probar contra la API
    // real, esto es lo más seguro que se puede garantizar desde el código.
    const existing = document.querySelector('script[data-addi-widget="true"]');
    existing?.remove();

    const script = document.createElement('script');
    script.src = ADDI_WIDGET_SCRIPT_SRC;
    script.async = true;
    script.dataset.name = 'shopifyAddiWidget';
    script.dataset.id = partnerId;
    script.dataset.allySlug = allySlug;
    script.dataset.elementReference = ADDI_WIDGET_TARGET_ID;
    script.dataset.addiWidget = 'true';
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [partnerId, allySlug, amount]);

  return (
    <div className="w-full mt-3 mb-2">
      <div id={ADDI_WIDGET_TARGET_ID} data-addi-price={amount} />
    </div>
  );
}

function AddiWidget({price}: {price?: {amount: string; currencyCode: string}}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const partnerId = rootData?.publicAddiPartnerId;
  const allySlug = rootData?.publicAddiAllySlug;

  // Solo renderizar en cliente, nunca en SSR
  const [isClient, setIsClient] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (!price || parseFloat(price.amount) <= 0) return;

    const amount = parseFloat(price.amount);
    // Addi Colombia: mínimo $50,000, máximo $3,000,000 COP
    if (price.currencyCode !== 'COP' || amount < 50000 || amount > 3000000) return;

    setIsVisible(true);
  }, [price]);

  // No renderizar nada durante SSR o si no cumple condiciones
  if (!isClient || !isVisible || !price) return null;

  if (partnerId && allySlug) {
    return (
      <AddiDynamicWidget price={price} partnerId={partnerId} allySlug={allySlug} />
    );
  }

  return <AddiStaticLink price={price} />;
}

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
      <div className="text-sm font-medium">Seleccionar {option.name}</div>
      
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

function PdpAccordion({title, children}: {title: string; children: React.ReactNode}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[#F9F7F7] transition-colors text-left"
      >
        <span className="font-medium text-secondary-800">{title}</span>
        <svg
          className={clsx('w-5 h-5 text-slate-500 transition-transform duration-200', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className={clsx(
          'grid transition-all duration-300 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">
            {children}
          </div>
        </div>
      </div>
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
      # true if ANY variant is purchasable -- distinct from a given
      # selectedVariant's own availableForSale. Used to gate "this product
      # is sold out, here are alternatives" messaging so it doesn't fire
      # just because the currently-selected/default variant happens to be
      # out of stock while a different option (e.g. another size/color) is
      # still purchasable.
      availableForSale
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
      # Fecha estimada de envío para productos en preventa (tipo date).
      # Alimenta el countdown debajo del botón "Agregar al carrito".
      preorder_ship_date: metafield(namespace: "custom", key: "fecha_envio_preventa") {
        value
      }
      # Badge de envío (metaobject reference)
      shipping_badge: metafield(namespace: "custom", key: "shipping_badge") {
        reference {
          ... on Metaobject {
            type
            label: field(key: "label") { value }
            icon_emoji: field(key: "icon_emoji") { value }
            background_color: field(key: "background_color") { value }
            text_color: field(key: "text_color") { value }
            priority: field(key: "priority") { value }
          }
        }
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
      # Enhanced PDP (per-product)
      pdp_enhanced_enabled: metafield(namespace: "pdp_enhanced", key: "enabled") {
        value
      }
      pdp_enhanced_subtitle: metafield(namespace: "pdp_enhanced", key: "subtitle") {
        value
      }
      pdp_enhanced_hero_description: metafield(namespace: "pdp_enhanced", key: "hero_description") {
        value
      }
      pdp_enhanced_feature_icons: metafield(namespace: "pdp_enhanced", key: "feature_icons") {
        references(first: 10) {
          nodes {
            ... on Metaobject {
              id
              fields {
                key
                value
                reference {
                  ... on MediaImage {
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
          }
        }
      }
      pdp_enhanced_detail_cards: metafield(namespace: "pdp_enhanced", key: "detail_cards") {
        references(first: 10) {
          nodes {
            ... on Metaobject {
              id
              fields {
                key
                value
                reference {
                  ... on MediaImage {
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
          }
        }
      }
      pdp_enhanced_applications: metafield(namespace: "pdp_enhanced", key: "applications") {
        value
      }
      pdp_enhanced_includes_list: metafield(namespace: "pdp_enhanced", key: "includes_list") {
        value
      }
      pdp_enhanced_dimensions_image: metafield(namespace: "pdp_enhanced", key: "dimensions_image") {
        reference {
          ... on MediaImage {
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
      pdp_enhanced_warranty_badges: metafield(namespace: "pdp_enhanced", key: "warranty_badges") {
        references(first: 10) {
          nodes {
            ... on Metaobject {
              id
              fields {
                key
                value
                reference {
                  ... on MediaImage {
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
          }
        }
      }
      # Feature blocks for PDP (grilla de tarjetas)
      features_heading: metafield(namespace: "pdp_features", key: "heading") { value }
      features_eyebrow: metafield(namespace: "pdp_features", key: "eyebrow") { value }
      features_key_features: metafield(namespace: "pdp_features", key: "key_features") { value }
      feature_1_title: metafield(namespace: "pdp_features", key: "block_1_title") { value }
      feature_1_description: metafield(namespace: "pdp_features", key: "block_1_description") { value }
      feature_1_media: metafield(namespace: "pdp_features", key: "block_1_media") {
        reference {
          ... on MediaImage {
            image { url altText }
          }
          ... on Video {
            sources { url mimeType }
          }
        }
      }
      feature_2_title: metafield(namespace: "pdp_features", key: "block_2_title") { value }
      feature_2_description: metafield(namespace: "pdp_features", key: "block_2_description") { value }
      feature_2_media: metafield(namespace: "pdp_features", key: "block_2_media") {
        reference {
          ... on MediaImage {
            image { url altText }
          }
          ... on Video {
            sources { url mimeType }
          }
        }
      }
      feature_3_title: metafield(namespace: "pdp_features", key: "block_3_title") { value }
      feature_3_description: metafield(namespace: "pdp_features", key: "block_3_description") { value }
      feature_3_media: metafield(namespace: "pdp_features", key: "block_3_media") {
        reference {
          ... on MediaImage {
            image { url altText }
          }
          ... on Video {
            sources { url mimeType }
          }
        }
      }
      feature_4_title: metafield(namespace: "pdp_features", key: "block_4_title") { value }
      feature_4_description: metafield(namespace: "pdp_features", key: "block_4_description") { value }
      feature_4_media: metafield(namespace: "pdp_features", key: "block_4_media") {
        reference {
          ... on MediaImage {
            image { url altText }
          }
          ... on Video {
            sources { url mimeType }
          }
        }
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
  // try/catch here, not just the errorElement on some of its <Await> call
  // sites in the route below — an uncaught rejection on a promise handed
  // to defer() becomes an unhandled rejection that bubbles past this
  // route's own ErrorBoundary to the root, turning the whole product page
  // into a generic 500 instead of rendering normally with no
  // recommendations. Confirmed reproducible on a sibling storefront
  // (cyclewear, 2026-07-22) via a transient Storefront API error on this
  // exact query.
  try {
    const products = await storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
      variables: {productId, count: 12},
    });

    invariant(products, 'No data returned from Shopify API');

    const mergedProducts = (products.recommended ?? [])
      .concat(products.additional.nodes)
      // `additional` is an unfiltered BEST_SELLING fallback — without this,
      // an out-of-stock PDP's cross-sell/alternatives sections can recommend
      // other sold-out products, defeating their whole purpose (Codex P1 on
      // PR #83).
      .filter((value) => value.availableForSale)
      .filter(
        (value, index, array) =>
          array.findIndex((value2) => value2.id === value.id) === index,
      );

    const originalProduct = mergedProducts.findIndex(
      (item) => item.id === productId,
    );

    mergedProducts.splice(originalProduct, 1);

    return {nodes: mergedProducts};
  } catch {
    return {nodes: []};
  }
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
