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
import {
  SECTION_PRODUCT_TESTIMONIAL_FRAGMENT,
  SectionProductTestimonial,
} from './SectionProductTestimonial';
import {
  SECTION_INTRO_FEATURE_FRAGMENT,
  SectionIntroFeature,
} from './SectionIntroFeature';
import {
  SECTION_SHOP_BY_CATEGORY_FRAGMENT,
  SectionShopByCategory,
} from './SectionShopByCategory';
import {
  SECTION_SHOP_BY_BRAND_FRAGMENT,
  SectionShopByBrand,
} from './SectionShopByBrand';
import {
  SECTION_BANNER_FRAGMENT,
  SectionBanner,
} from './SectionBanner';
import {
  SECTION_PRODUCT_CAROUSEL_FRAGMENT,
  SectionProductCarousel,
} from './SectionProductCarousel';
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
  | 'ciseco--section_brands_ticker'
  | 'ciseco--section_product_testimonial'
  | 'section_intro_feature'
  | 'section_shop_by_category'
  | 'ciseco--section_shop_by_brand'
  | 'ciseco--section_banner'
  | 'ciseco--section_product_carousel';

export function Sections({
  sections,
  className = '',
  paddingTopPx,
  ...args
}: SectionProps) {
  return (
    <div
      className={clsx('sections', className)}
      style={{
        paddingTop: paddingTopPx ? `${paddingTopPx}px` : undefined,
      }}
    >
      {sections?.references?.nodes.map((section, index, arr) => {
        const sectionData = section as any;
        const spacing = {
          paddingTopMobile: sectionData.padding_top_mobile?.value,
          paddingTopDesktop: sectionData.padding_top_desktop?.value,
          paddingBottomMobile: sectionData.padding_bottom_mobile?.value,
          paddingBottomDesktop: sectionData.padding_bottom_desktop?.value,
        };

        switch (section.type as CisecoSectionType) {
          case 'ciseco--section_hero':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args} isHero>
                <SectionHero {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_hero_slider':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args} isHero>
                <SectionHeroSlider {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_collections_slider':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionCollectionsSlider {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_products_slider':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionProductsSlider {...section} key={section.id} />
              </WrapSection>
            );

          case 'ciseco--section_steps':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionSteps {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_image_with_text':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionImageWithText {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_tabs_collections_by_group':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionTabsCollectionsByGroup {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_grid_products_and_filter':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionGridProductsAndFilter {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_latest_blog':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <ClientOnly>
                  <SectionLatestBlog {...section} key={section.id} />
                </ClientOnly>
              </WrapSection>
            );
          case 'ciseco--section_clients_say':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionClientsSay {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_category_cards_carousel':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionCategoryCardsCarousel {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_product_feature':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionProductFeature {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_product_showcase':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionProductShowcase {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_brands_ticker':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionBrandsTicker {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_product_testimonial':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionProductTestimonial {...section} key={section.id} />
              </WrapSection>
            );
          case 'section_intro_feature':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionIntroFeature {...section} key={section.id} />
              </WrapSection>
            );
          case 'section_shop_by_category':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionShopByCategory {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_shop_by_brand':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionShopByBrand {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_banner':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionBanner {...section} key={section.id} />
              </WrapSection>
            );
          case 'ciseco--section_product_carousel':
            return (
              <WrapSection key={section.id} index={index} spacing={spacing} {...args}>
                <SectionProductCarousel {...section} key={section.id} />
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

interface SectionSpacing {
  paddingTopMobile?: string;
  paddingTopDesktop?: string;
  paddingBottomMobile?: string;
  paddingBottomDesktop?: string;
}

function WrapSection({
  children,
  index,
  hasDivider,
  showFirstDivider,
  isHero,
  spacing,
}: {
  children: React.ReactNode;
  index: number;
  hasDivider?: boolean;
  showFirstDivider?: boolean;
  isHero?: boolean;
  spacing?: SectionSpacing;
}) {
  const isFirst = index === 0;

  // Build responsive padding styles using CSS custom properties
  const paddingStyle: React.CSSProperties = {};
  const ptMobile = spacing?.paddingTopMobile ? `${spacing.paddingTopMobile}px` : '0px';
  const ptDesktop = spacing?.paddingTopDesktop ? `${spacing.paddingTopDesktop}px` : ptMobile;
  const pbMobile = spacing?.paddingBottomMobile ? `${spacing.paddingBottomMobile}px` : '0px';
  const pbDesktop = spacing?.paddingBottomDesktop ? `${spacing.paddingBottomDesktop}px` : pbMobile;

  return (
    <>
      {((isFirst && showFirstDivider) || (!isFirst && hasDivider)) && (
        <div className="container">
          <hr />
        </div>
      )}
      <div 
        className={clsx(isFirst && isHero && '!mt-0')}
        style={{
          paddingTop: ptMobile,
          paddingBottom: pbMobile,
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            [data-section-id="${index}"] {
              padding-top: ${ptDesktop} !important;
              padding-bottom: ${pbDesktop} !important;
            }
          }
        `}} />
        <div data-section-id={index}>
          {children}
        </div>
      </div>
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
            padding_top_mobile: field(key: "padding_top_mobile") { value }
            padding_top_desktop: field(key: "padding_top_desktop") { value }
            padding_bottom_mobile: field(key: "padding_bottom_mobile") { value }
            padding_bottom_desktop: field(key: "padding_bottom_desktop") { value }
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
            ...SectionProductTestimonial
            ...SectionIntroFeature
            ...SectionShopByCategory
            ...SectionShopByBrand
            ...SectionBanner
            ...SectionProductCarousel
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
  ${SECTION_PRODUCT_TESTIMONIAL_FRAGMENT}
  ${SECTION_INTRO_FEATURE_FRAGMENT}
  ${SECTION_SHOP_BY_CATEGORY_FRAGMENT}
  ${SECTION_SHOP_BY_BRAND_FRAGMENT}
  ${SECTION_BANNER_FRAGMENT}
  ${SECTION_PRODUCT_CAROUSEL_FRAGMENT}

  # All common fragments
  ${COMMON_PRODUCT_CARD_FRAGMENT}
  ${MEDIA_IMAGE_FRAGMENT}
  ${LINK_FRAGMENT}
  ${COMMON_COLLECTION_ITEM_FRAGMENT}
  ${HERO_ITEM_FRAGMENT}
`;
