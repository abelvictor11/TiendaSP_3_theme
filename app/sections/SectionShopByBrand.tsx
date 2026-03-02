import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {useRef} from 'react';
import useSnapSlider from '~/hooks/useSnapSlider';
import Heading from '~/components/Heading/Heading';
import type {SectionShopByBrandFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';

export function SectionShopByBrand(props: SectionShopByBrandFragment) {
  const section = parseSection<SectionShopByBrandFragment, {}>(props);

  const {
    heading,
    sub_heading,
    brandCollections,
  } = section;

  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  const collectionNodes = brandCollections?.nodes || [];

  if (!collectionNodes.length) return null;

  return (
    <section className="nc-SectionShopByBrand py-12 lg:py-16">
      <div className="container">
        <Heading
          className="mb-8 lg:mb-10 text-neutral-900 dark:text-neutral-50"
          fontClass="font-headline text-3xl md:text-3xl font-normal"
          desc={sub_heading?.value || ''}
          hasNextPrev
          onClickNext={scrollToNextSlide}
          onClickPrev={scrollToPrevSlide}
        >
          {heading?.value || 'Shop by Brand'}
        </Heading>

        <div
          ref={sliderRef}
          className="relative flex snap-x snap-mandatory overflow-x-auto gap-4 hiddenScrollbar pb-4"
        >
          {collectionNodes.map((collection: any, index: number) => {
            const imageData = collection.image;
            const title = collection.title;
            const handle = collection.handle;

            return (
              <Link
                key={collection.id || index}
                to={`/collections/${handle}`}
                className="snap-start shrink-0 group"
              >
                <div className="relative w-[180px] sm:w-[220px] lg:w-[260px] aspect-square rounded-2xl overflow-hidden bg-[#F9F7F7]">
                  {imageData ? (
                    <Image
                      data={imageData}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, 260px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                      <span className="text-slate-500 font-medium text-sm">{title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white text-sm sm:text-base font-medium">
                      {title}
                    </h3>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const SECTION_SHOP_BY_BRAND_FRAGMENT = `#graphql
  fragment SectionShopByBrand on Metaobject {
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
    brandCollections: field(key: "collections") {
      key
      references(first: 10) {
        nodes {
          ... on Collection {
            id
            handle
            title
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
`;
