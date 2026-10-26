import {useRef} from 'react';
import {Image} from '@shopify/hydrogen';
import {ArrowRightIcon} from '@heroicons/react/24/outline';
import {Link} from '~/components/Link';
import Prices from '~/components/Prices';
import useSnapSlider from '~/hooks/useSnapSlider';

interface FeaturedProduct {
  id: string;
  handle: string;
  title: string;
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  priceRange?: {minVariantPrice?: {amount: string; currencyCode: string}};
  compareAtPriceRange?: {
    minVariantPrice?: {amount: string; currencyCode: string};
  };
}

/**
 * Carousel de productos destacados, pensado para ir ANTES del grid en la
 * página de colección. Título, descripción y link son editables por
 * metafields de la colección (custom.featured_*), y los productos se eligen
 * con custom.featured_products (list.product_reference).
 *
 * Look basado en la referencia (card simple: imagen + título + precio), con
 * los design tokens de tienda-sportfitness: titular en F37Bolton
 * (font-headline), link en rojo de marca (primary-600), cards de borde
 * redondeado que se oscurece en hover.
 */
export function CollectionFeaturedCarousel({
  heading,
  description,
  linkText,
  linkUrl,
  products,
}: {
  heading?: string;
  description?: string;
  linkText?: string;
  linkUrl?: string;
  products: FeaturedProduct[];
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  if (!products?.length) return null;

  return (
    <section className="pt-2 pb-2">
      {/* Encabezado: título + descripción + link custom */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 mb-5 lg:mb-6">
        <div className="max-w-2xl">
          {heading && (
            <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl leading-tight text-neutral-900 dark:text-neutral-50">
              {heading}
            </h2>
          )}
          {description && (
            <p className="mt-1.5 text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
              {description}
            </p>
          )}
          {linkText && linkUrl && (
            <Link
              to={linkUrl}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {linkText}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Flechas (desktop) */}
        {products.length > 1 && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={scrollToPrevSlide}
              aria-label="Anterior"
              className="p-2.5 rounded-full border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:border-neutral-900 hover:text-neutral-900 dark:hover:border-white dark:hover:text-white transition-colors"
            >
              <ArrowRightIcon className="w-4 h-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={scrollToNextSlide}
              aria-label="Siguiente"
              className="p-2.5 rounded-full border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:border-neutral-900 hover:text-neutral-900 dark:hover:border-white dark:hover:text-white transition-colors"
            >
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory hiddenScrollbar pb-1 -mx-1 px-1"
      >
        {products.map((product) => {
          const price = product.priceRange?.minVariantPrice;
          const compareAt = product.compareAtPriceRange?.minVariantPrice;
          const hasDiscount =
            compareAt &&
            price &&
            parseFloat(compareAt.amount) > parseFloat(price.amount);

          return (
            <Link
              key={product.id}
              to={`/products/${product.handle}`}
              prefetch="intent"
              className="snap-start shrink-0 w-[270px] sm:w-[320px] group flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white bg-white dark:bg-neutral-900 p-3.5 transition-colors"
            >
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                {product.featuredImage?.url ? (
                  <Image
                    data={product.featuredImage as any}
                    width={160}
                    height={160}
                    className="h-full w-full object-contain"
                    sizes="80px"
                    alt={product.featuredImage.altText || product.title}
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-display text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-50 line-clamp-2">
                  {product.title}
                </h3>
                {price && (
                  <div className="mt-1.5">
                    <Prices
                      price={price as any}
                      compareAtPrice={(hasDiscount ? compareAt : undefined) as any}
                      withoutTrailingZeros
                      contentClass="text-sm font-bold"
                    />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
