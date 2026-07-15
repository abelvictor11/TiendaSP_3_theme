import {Link} from '~/components/Link';
import {useRef} from 'react';
import useSnapSlider from '~/hooks/useSnapSlider';
import {ArrowLeftIcon, ArrowRightIcon} from '@heroicons/react/24/outline';
import ProductCard from '~/components/ProductCard';

export function SectionProductCarousel(props: any) {
  const {
    heading,
    description,
    cta_text,
    cta_link,
    collection,
    background_color,
  } = props;

  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  const products = collection?.reference?.productCarouselSection?.nodes || [];

  if (!products.length) return null;

  return (
    <section 
      className="nc-SectionProductCarousel py-12 lg:py-16"
      style={background_color?.value ? {backgroundColor: background_color.value} : undefined}
    >
      <div className="container">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Content - Fixed (30%) */}
          <div className="lg:w-[30%] lg:shrink-0 flex flex-col justify-center">
            {heading?.value && (
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
                {heading.value}
              </h2>
            )}
            {description?.value && (
              <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
                {description.value}
              </p>
            )}
            {cta_link?.value && (
              <div className="mt-8">
                <Link
                  to={cta_link.value}
                  className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-[#efefef] rounded-xl transition-colors"
                >
                  {cta_text?.value || 'Shop Now'}
                </Link>
              </div>
            )}
          </div>

          {/* Right Content - Carousel (70%) */}
          <div className="lg:w-[70%] relative">
            {/* Navigation Arrows */}
            <div className="hidden lg:flex absolute -left-6 top-1/2 -translate-y-1/2 z-10">
              <button
                onClick={scrollToPrevSlide}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-900 dark:hover:border-white transition-colors shadow-sm"
                aria-label="Previous"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10">
              <button
                onClick={scrollToNextSlide}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-900 dark:hover:border-white transition-colors shadow-sm"
                aria-label="Next"
              >
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Products Slider */}
            <div
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory hiddenScrollbar pb-4"
            >
              {products.map((product: any, index: number) => (
                <div
                  key={product.id || index}
                  className="snap-start shrink-0 w-[280px] sm:w-[300px]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Mobile Navigation */}
            <div className="flex lg:hidden items-center justify-center gap-4 mt-4">
              <button
                onClick={scrollToPrevSlide}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-white transition-colors"
                aria-label="Previous"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={scrollToNextSlide}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-white transition-colors"
                aria-label="Next"
              >
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const SECTION_PRODUCT_CAROUSEL_FRAGMENT = `#graphql
  fragment SectionProductCarousel on Metaobject {
    type
    id
    heading: field(key: "heading") {
      key
      value
    }
    description: field(key: "description") {
      key
      value
    }
    cta_text: field(key: "cta_text") {
      key
      value
    }
    cta_link: field(key: "cta_link") {
      key
      value
    }
    background_color: field(key: "background_color") {
      key
      value
    }
    collection: field(key: "collection") {
      type
      key
      reference {
        ... on Collection {
          id
          title
          handle
          productCarouselSection: products(first: 12, filters: {available: true}) {
            nodes {
              ...CommonProductCard
            }
          }
        }
      }
    }
  }
`;
