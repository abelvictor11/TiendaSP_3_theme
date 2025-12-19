import type {SectionsFragment} from 'storefrontapi.generated';
import {
  HERO_ITEM_FRAGMENT,
  SECTION_HERO_SLIDER_FRAGMENT,
  SectionHeroSlider,
} from './SectionHeroSlider';
import {
  COMMON_COLLECTION_ITEM_FRAGMENT,
  COMMON_PRODUCT_CARD_FRAGMENT,
  LINK_FRAGMENT,
  MEDIA_IMAGE_FRAGMENT,
} from '~/data/commonFragments';
import {
  SECTION_COLLECTIONS_SLIDER_FRAGMENT,
  SectionCollectionsSlider,
} from './SectionCollectionsSlider';
import {
  SECTION_PRODUCTS_SLIDER_FRAGMENT,
  SectionProductsSlider,
} from './SectionProductsSlider';
import {SECTION_STEPS_FRAGMENT, SectionSteps} from './SectionSteps';
import {
  SECTION_IMAGEWITHTEXT_FRAGMENT,
  SectionImageWithText,
} from './SectionImageWithText';
import {
  SECTION_TABS_COLLECTONS_BY_GROUP_FRAGMENT,
  SectionTabsCollectionsByGroup,
} from './SectionTabsCollectionsByGroup';
import {
  SECTION_GRID_PRODUCTS_AND_FILTER_FRAGMENT,
  SectionGridProductsAndFilter,
} from './SectionGridProductsAndFilter';
import {
  SECTION_LATEST_BLOG_FRAGMENT,
  SectionLatestBlog,
} from './SectionLatestBlog';
import {
  SECTION_CLIENTS_SAY_FRAGMENT,
  SectionClientsSay,
} from './SectionClientsSay';
import {
  SECTION_CATEGORY_CARDS_CAROUSEL_FRAGMENT,
  SectionCategoryCardsCarousel,
} from './SectionCategoryCardsCarousel';
import {
  SECTION_PRODUCT_FEATURE_FRAGMENT,
  SectionProductFeature,
} from './SectionProductFeature';
import {
  SECTION_PRODUCT_SHOWCASE_FRAGMENT,
  SectionProductShowcase,
} from './SectionProductShowcase';
import {
  SECTION_BRANDS_TICKER_FRAGMENT,
  SectionBrandsTicker,
} from './SectionBrandsTicker';
import clsx from 'clsx';
import {SECTION_HERO_FRAGMENT, SectionHero} from './SectionHero';
import {OKENDO_PRODUCT_STAR_RATING_FRAGMENT} from '@okendo/shopify-hydrogen';
import {ClientOnly} from '~/components/client-only';

export interface SectionProps {
  sections: SectionsFragment;
  className?: string;
  hasDivider?: boolean;
  showFirstDivider?: boolean;
  paddingTopPx?: number;
}

export type CisecoSectionType =
  | 'ciseco--section_hero'
  | 'ciseco--section_hero_slider'
  | 'ciseco--section_collections_slider'
  | 'ciseco--section_products_slider'
  | 'ciseco--section_steps'
  | 'ciseco--section_image_with_text'
  | 'ciseco--section_tabs_collections_by_group'
  | 'ciseco--section_grid_products_and_filter'
  | 'ciseco--section_latest_blog'
  | 'ciseco--section_clients_say'
  | 'ciseco--section_category_cards_carousel'
  | 'ciseco--section_product_feature'
  | 'ciseco--section_product_showcase'
  | 'ciseco--section_brands_ticker';

export function Sections({
  sections,
  className = 'space-y-12 sm:space-y-16 lg:space-y-20 xl:space-y-24',
  paddingTopPx,
  ...args
}: SectionProps) {
  // Check if first section is a hero type (no top spacing needed)
  const firstSectionType = sections?.references?.nodes?.[0]?.type as CisecoSectionType;
  const isFirstHero = firstSectionType === 'ciseco--section_hero' || firstSectionType === 'ciseco--section_hero_slider';
  
  return (
    <div
      className={clsx('sections', className, isFirstHero && '[&>*:first-child]:mt-0')}
      style={{
        paddingTop: paddingTopPx ? `${paddingTopPx}px` : undefined,
      }}
    >
      {sections?.references?.nodes.map((section, index, arr) => {
        switch (section.type as CisecoSectionType) {
          case 'ciseco--section_hero':
            return (
              <WrapSection key={section.id} index={index} {...args} isHero>
                <SectionHero {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_hero_slider':
            return (
              <WrapSection key={section.id} index={index} {...args} isHero>
                <SectionHeroSlider {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_collections_slider':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionCollectionsSlider {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_products_slider':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionProductsSlider {...section} key={section.id} />
              </WrapSection>
            );

          case 'ciseco--section_steps':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionSteps {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_image_with_text':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionImageWithText {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_tabs_collections_by_group':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionTabsCollectionsByGroup {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_grid_products_and_filter':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionGridProductsAndFilter {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_latest_blog':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <ClientOnly>
                  <SectionLatestBlog {...section} key={section.id} />
                </ClientOnly>
              </WrapSection>
            );
          case 'ciseco--section_clients_say':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionClientsSay {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_category_cards_carousel':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionCategoryCardsCarousel {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_product_feature':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionProductFeature {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_product_showcase':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionProductShowcase {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_brands_ticker':
            return (
              <WrapSection key={section.id} index={index} {...args}>
                <SectionBrandsTicker {...section} key={section.id} />
              </WrapSection>
            );

          // case 'section_another':
          //   return <AnotherSection />;
          default:
            // eslint-disable-next-line no-console
            console.log(`Unsupported section type: ${section.type}`);
            return null;
        }
      })}
    </div>
  );
}

function WrapSection({
  children,
  index,
  hasDivider,
  showFirstDivider,
  isHero,
}: {
  children: React.ReactNode;
  index: number;
  hasDivider?: boolean;
  showFirstDivider?: boolean;
  isHero?: boolean;
}) {
  const isFirst = index === 0;

  // Hero sections at first position should have no margin
  if (isFirst && isHero) {
    return <div className="!mt-0">{children}</div>;
  }

  return (
    <>
      {((isFirst && showFirstDivider) || (!isFirst && hasDivider)) && (
        <div className="container">
          <hr />
        </div>
      )}
      {children}
    </>
  );
}

export const SECTIONS_FRAGMENT = `#graphql
  fragment Sections on MetaobjectField {
    ... on MetaobjectField {
      references(first: 20) {
        nodes {
          ... on Metaobject {
            id
            type
            ...SectionHero
            ...SectionHeroSlider
            ...SectionCollectionsSlider
            ...SectionProductsSlider
            ...SectionSteps
            ...SectionImageWithText
            ...SectionTabsCollectionsByGroup
            ...SectionGridProductsAndFilter
            ...SectionLatestBlog
            ...SectionClientsSay
            ...SectionCategoryCardsCarousel
            ...SectionProductFeature
            ...SectionProductShowcase
            ...SectionBrandsTicker
          }
        }
      }
    }
  }
  # All section fragments
  ${SECTION_HERO_FRAGMENT} 
  ${SECTION_HERO_SLIDER_FRAGMENT} 
  ${SECTION_COLLECTIONS_SLIDER_FRAGMENT}
  ${SECTION_PRODUCTS_SLIDER_FRAGMENT}
  ${SECTION_STEPS_FRAGMENT}
  ${SECTION_IMAGEWITHTEXT_FRAGMENT}
  ${SECTION_TABS_COLLECTONS_BY_GROUP_FRAGMENT}
  ${SECTION_GRID_PRODUCTS_AND_FILTER_FRAGMENT}
  ${SECTION_LATEST_BLOG_FRAGMENT}
  ${SECTION_CLIENTS_SAY_FRAGMENT}
  ${SECTION_CATEGORY_CARDS_CAROUSEL_FRAGMENT}
  ${SECTION_PRODUCT_FEATURE_FRAGMENT}
  ${SECTION_PRODUCT_SHOWCASE_FRAGMENT}
  ${SECTION_BRANDS_TICKER_FRAGMENT}

  # All common fragments
  ${COMMON_PRODUCT_CARD_FRAGMENT}
  ${MEDIA_IMAGE_FRAGMENT}
  ${LINK_FRAGMENT}
  ${COMMON_COLLECTION_ITEM_FRAGMENT}
  ${HERO_ITEM_FRAGMENT}
`;
