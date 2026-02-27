import {useRef} from 'react';
import useSnapSlider from '~/hooks/useSnapSlider';
import Heading from '~/components/Heading/Heading';
import ProductCard from '~/components/ProductCard';
import {getImageLoadingPriority} from '~/lib/const';
import type {SectionProductCarouselFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';

export function SectionProductCarousel(
  props: SectionProductCarouselFragment,
) {
  const section = parseSection<SectionProductCarouselFragment, {}>(props);

  const {
    heading,
    sub_heading,
    collection,
    products: productsField,
    background_color,
  } = section;

  const bgColor = background_color?.value || 'transparent';

  // Products can come from a collection reference or a direct list
  const collectionProducts = (collection as any)?.products?.nodes || [];
  const directProducts = productsField?.nodes || [];
  const productsList = directProducts.length > 0 ? directProducts : collectionProducts;

  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  return (
    <section
      className="nc-SectionProductCarousel"
      style={{backgroundColor: bgColor}}
    >
      <div className="container py-12 lg:py-16">
        <Heading
          className="mb-8 lg:mb-10 text-neutral-900 dark:text-neutral-50"
          fontClass="font-headline text-3xl md:text-3xl font-normal"
          desc={sub_heading?.value || ''}
          hasNextPrev
          onClickNext={scrollToNextSlide}
          onClickPrev={scrollToPrevSlide}
        >
          {heading?.value || ''}
        </Heading>

        <div
          ref={sliderRef}
          className="relative flex snap-x snap-mandatory overflow-x-auto -mx-2 lg:-mx-4 hiddenScrollbar"
        >
          {productsList.map((item: any, index: number) => (
            <div
              key={item.id}
              className="mySnapItem snap-start shrink-0 px-2 w-[17rem] lg:w-80 xl:w-[25%]"
            >
              <ProductCard
                className="w-full"
                product={item}
                loading={getImageLoadingPriority(index)}
              />
            </div>
          ))}
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
    sub_heading: field(key: "sub_heading") {
      key
      value
    }
    collection: field(key: "collection") {
      key
      reference {
        ... on Collection {
          id
          handle
          title
          products(first: 12) {
            nodes {
              ...CommonProductCard
            }
          }
        }
      }
    }
    products: field(key: "products") {
      key
      references(first: 12) {
        nodes {
          ... on Product {
            ...CommonProductCard
          }
        }
      }
    }
    background_color: field(key: "background_color") {
      key
      value
    }
  }
`;
