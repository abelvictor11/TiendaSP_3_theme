import type {SectionCollectionsSliderFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';
import type {ParsedMetafields} from '@shopify/hydrogen';
import Heading from '~/components/Heading/Heading';
import {useRef} from 'react';
import useSnapSlider from '~/hooks/useSnapSlider';
import CollectionItem, {
  CollectionItemSkeleton,
  type TMyCommonCollectionItem,
} from '~/components/CollectionItem';

export function SectionCollectionsSlider(
  props: SectionCollectionsSliderFragment,
) {
  const section = parseSection<
    SectionCollectionsSliderFragment,
    {
      heading_bold?: ParsedMetafields['single_line_text_field'];
      heading_light?: ParsedMetafields['single_line_text_field'];
      sub_heading?: ParsedMetafields['single_line_text_field'];
    }
  >(props);

  const {id, heading_bold, heading_light, button_text, sub_heading} = section;
  const background_color = (props as any).background_color?.value;
  const heading_color = (props as any).heading_color?.value;

  return (
    <section 
      className="featured-collection py-8 lg:py-12" 
      key={id}
      style={background_color ? {backgroundColor: background_color} : undefined}
    >
      <CollectionSlider
        isSkeleton={!props.collections}
        heading_bold={heading_bold?.parsedValue || ''}
        heading_light={heading_light?.parsedValue || ''}
        sub_heading={sub_heading?.parsedValue || ''}
        collections={props.collections?.references?.nodes || []}
        button_text={button_text?.value}
        headingColor={heading_color}
      />
    </section>
  );
}

export const CollectionSlider = ({
  heading_bold,
  heading_light,
  sub_heading,
  button_text,
  collections = [],
  headingFontClass,
  isSkeleton,
  headingColor,
}: {
  heading_bold?: string;
  heading_light?: string;
  sub_heading?: string;
  collections?: TMyCommonCollectionItem[];
  button_text?: string;
  headingFontClass?: string;
  isSkeleton?: boolean;
  headingColor?: string;
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  return (
    <div className="nc-DiscoverMoreSlider">
      <Heading
        className="mb-8 lg:mb-10 text-neutral-900 dark:text-neutral-50 container"
        desc={sub_heading || ''}
        rightDescText={heading_light || ''}
        hasNextPrev
        onClickNext={scrollToNextSlide}
        onClickPrev={scrollToPrevSlide}
        fontClass={headingFontClass}
        style={headingColor ? {color: headingColor} : undefined}
      >
        {heading_bold || ''}
      </Heading>
      <div className="">
        <div
          ref={sliderRef}
          className="relative w-full flex gap-4 snap-x snap-mandatory overflow-x-auto scroll-p-l-container hiddenScrollbar"
        >
          <div className="w-0 nc-p-l-container"></div>
          {isSkeleton
            ? [1, 1, 1, 1, 1].map((_, index) => (
                <div
                  key={index}
                  className="mySnapItem snap-start shrink-0 last:pr-4 lg:last:pr-10"
                >
                  <div className="w-64 sm:w-96 lg:w-[28rem] xl:w-[30rem] 2xl:w-[34rem] flex">
                    <CollectionItemSkeleton key={index} />
                  </div>
                </div>
              ))
            : collections.filter(Boolean).map((item, index) => (
                <div
                  key={`${item.id}`}
                  className="mySnapItem snap-start shrink-0 last:pr-4 lg:last:pr-10"
                >
                  <div className="w-64 sm:w-96 lg:w-[28rem] xl:w-[30rem] 2xl:w-[34rem] flex">
                    <CollectionItem item={item} button_text={button_text} />
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export const SECTION_COLLECTIONS_SLIDER_FRAGMENT = `#graphql
  fragment SectionCollectionsSlider on Metaobject {
    type
    id
    heading_bold: field(key: "heading_bold") {
      type
      key
      value
    }
    heading_light: field(key: "heading_light") {
      type
      key
      value
    }
    sub_heading: field(key: "sub_heading") {
      type
      key
      value
    }
    button_text: field(key: "button_text") {
      type
      key
      value
    }
    background_color: field(key: "background_color") {
      key
      value
    }
    heading_color: field(key: "heading_color") {
      key
      value
    }
    collections: field(key: "collections") {
      references(first: 10) {
        nodes {
          ... on Collection {
            ...CommonCollectionItem
          }
        }
      }
    }
  } 
`;
