import {Image} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import type {SectionProductShowcaseFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';
import {ProductCardShowcase} from '~/components/ProductCardShowcase';
import {useRef, useState} from 'react';
import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';

export function SectionProductShowcase(props: SectionProductShowcaseFragment) {
  const section = parseSection<SectionProductShowcaseFragment, {}>(props);

  const {
    heading,
    subheading,
    description,
    icon_svg,
    badge_text,
    background_image,
    content_background_color,
    text_color,
    products,
    collection,
    card_background_color,
    card_text_color,
    button_text,
  } = section;

  // Get products from either direct products or collection
  // parseSection ya hizo lift de 'reference' y 'references', así que accedemos directamente
  const productsFromCollection = (collection as any)?.productsShowcaseSection || (collection as any)?.products;
  const productsFromProducts = (products as any)?.nodes || [];
  
  // Determinar qué fuente de productos usar
  let productsToShow: any[] = [];
  if (productsFromProducts && productsFromProducts.length > 0) {
    productsToShow = productsFromProducts.slice(0, 2);
  } else if (productsFromCollection?.nodes && productsFromCollection.nodes.length > 0) {
    productsToShow = productsFromCollection.nodes.slice(0, 2);
  }

  // Early return si no hay productos
  if (productsToShow.length === 0) {
    return null;
  }

  const bgImage = (background_image as any)?.image?.url;
  const contentBg = content_background_color?.value || '#ffffff';
  const txtColor = text_color?.value || '#000000';
  const cardBg = card_background_color?.value || '#ffffff';
  const cardTxt = card_text_color?.value || '#000000';
  const btnText = button_text?.value || 'VIEW PRODUCT';

  // Carousel state for mobile
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollToSlide = (index: number) => {
    if (scrollContainerRef.current) {
      const slideWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth',
      });
      setCurrentSlide(index);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const slideWidth = scrollContainerRef.current.offsetWidth;
      const scrollPosition = scrollContainerRef.current.scrollLeft;
      const newSlide = Math.round(scrollPosition / slideWidth);
      setCurrentSlide(newSlide);
    }
  };

  // Total slides: 1 (content) + products
  const totalSlides = 1 + productsToShow.length;

  return (
    <section className="nc-SectionProductShowcase relative min-h-[600px] lg:min-h-[700px] lg:h-screen flex items-end overflow-hidden">
      {/* Background Image */}
      {bgImage && (
        <div className="absolute inset-0 w-full h-full">
          <img
            src={bgImage}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      {/* Badge - Posición absoluta arriba a la izquierda */}
      {badge_text?.value && (
        <div className="absolute top-8 left-8 z-20">
          <span className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-full uppercase tracking-wide shadow-lg">
            {badge_text.value}
          </span>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden lg:block container relative z-10 pb-12 lg:pb-16 pt-24">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Content Card */}
          <div className="col-span-5">
            <div
              className="rounded-xl p-8 lg:p-10 h-full shadow-2xl backdrop-blur-md"
              style={{backgroundColor: `${contentBg}cc`}}
            >
              {heading?.value && (
                <h2
                  className="font-headline text-3xl lg:text-4xl xl:text-5xl font-normal mb-6"
                  style={{color: txtColor}}
                >
                  {heading.value}
                </h2>
              )}

              {subheading?.value && (
                <h3
                  className="text-md font-semibold mb-4 tracking-wide uppercase"
                  style={{color: txtColor}}
                >
                  {subheading.value}
                </h3>
              )}

              <hr className="my-4" style={{borderColor: `${txtColor}33`}} />

              {description?.value && (
                <p
                  className="text-base leading-relaxed mt-6"
                  style={{color: txtColor}}
                >
                  {description.value}
                </p>
              )}
            </div>
          </div>

          {/* Right Product Cards */}
          <div className="col-span-7">
            <div className="grid grid-cols-2 gap-4 h-full">
              {productsToShow.map((product: any) => (
                <ProductCardShowcase
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Carousel Layout */}
      <div className="lg:hidden relative z-10 w-full pb-8 pt-20">
        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
        >
          {/* Content Slide */}
          <div className="flex-shrink-0 w-full snap-center px-4">
            <div
              className="rounded-xl p-6 shadow-2xl backdrop-blur-md h-[400px] flex flex-col justify-center"
              style={{backgroundColor: `${contentBg}cc`}}
            >
              {heading?.value && (
                <h2
                  className="font-headline text-2xl sm:text-3xl capitalize font-bold mb-4"
                  style={{color: txtColor}}
                >
                  {heading.value}
                </h2>
              )}

              {subheading?.value && (
                <h3
                  className="text-sm font-semibold mb-3 tracking-wide uppercase"
                  style={{color: txtColor}}
                >
                  {subheading.value}
                </h3>
              )}

              <hr className="my-3" style={{borderColor: `${txtColor}33`}} />

              {description?.value && (
                <p
                  className="text-sm leading-relaxed mt-3"
                  style={{color: txtColor}}
                >
                  {description.value}
                </p>
              )}
            </div>
          </div>

          {/* Product Slides */}
          {productsToShow.map((product: any) => (
            <div key={product.id} className="flex-shrink-0 w-full snap-center px-4">
              <div className="h-[400px]">
                <ProductCardShowcase
                  product={product}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({length: totalSlides}).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index
                  ? 'bg-white w-6'
                  : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export const SECTION_PRODUCT_SHOWCASE_FRAGMENT = `#graphql
  fragment SectionProductShowcase on Metaobject {
    type
    id
    heading: field(key: "heading") {
      type
      key
      value
    }
    subheading: field(key: "subheading") {
      type
      key
      value
    }
    description: field(key: "description") {
      type
      key
      value
    }
    icon_svg: field(key: "icon_svg") {
      type
      key
      value
    }
    badge_text: field(key: "badge_text") {
      type
      key
      value
    }
    background_image: field(key: "background_image") {
      type
      key
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
    content_background_color: field(key: "content_background_color") {
      type
      key
      value
    }
    text_color: field(key: "text_color") {
      type
      key
      value
    }
    products: field(key: "products") {
      references(first: 2) {
        nodes {
          ... on Product {
            ...CommonProductCard
          }
        }
      }
    }
    collection: field(key: "collection") {
      type
      key
      reference {
        ... on Collection {
          id
          handle
          title
          productsShowcaseSection: products(first: 2) {
            nodes {
              ...CommonProductCard
            }
          }
        }
      }
    }
    card_background_color: field(key: "card_background_color") {
      type
      key
      value
    }
    card_text_color: field(key: "card_text_color") {
      type
      key
      value
    }
    button_text: field(key: "button_text") {
      type
      key
      value
    }
  }
` as const;
