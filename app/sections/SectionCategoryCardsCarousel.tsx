import {type ParsedMetafields} from '@shopify/hydrogen';
import {parseSection} from '~/utils/parseSection';
import type {SectionCategoryCardsCarouselFragment} from 'storefrontapi.generated';
import {useState, useRef} from 'react';
import {Link} from '@remix-run/react';
import useSnapSlider from '~/hooks/useSnapSlider';

export function SectionCategoryCardsCarousel(
  props: SectionCategoryCardsCarouselFragment,
) {
  const section = parseSection<
    SectionCategoryCardsCarouselFragment,
    {
      heading?: ParsedMetafields['single_line_text_field'];
    }
  >(props);

  const {
    category_groups,
    heading,
    sub_heading,
    background_color,
  } = section;

  const [tabActive, setTabActive] = useState(0);

  const currentGroup = category_groups?.nodes?.[tabActive];
  const noneBgColor =
    !background_color?.value ||
    background_color?.value === '#fff' ||
    background_color?.value === '#ffffff';

  const renderCard = (item: any, index: number) => {
    if (!item.id) return null;

    const imageUrl = item.image?.reference?.image?.url;
    const title = item.title?.value;
    const subtitle = item.subtitle?.value;
    const ctaText = item.cta_text?.value || 'Shop Now';
    const ctaLink = item.cta_link?.value || '#';
    const bgColor = item.background_color?.value || '#f8f9fa';

    return (
      <div
        key={item.id}
        className="feed-carousel-item box-carousel-item snap-start shrink-0"
      >
        <div className="carousel-banner box-item-full-background rounded-2xl overflow-hidden relative w-[350px] sm:w-[450px] lg:w-[500px] h-[400px] sm:h-[450px] transition-transform hover:scale-[1.02] duration-300">
          {/* Background Image */}
          {imageUrl ? (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${imageUrl})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
            </div>
          ) : (
            <div 
              className="absolute inset-0"
              style={{backgroundColor: bgColor}}
            />
          )}

          {/* Product Image Overlay (centered) */}
          {imageUrl && (
            <div className="box-item-media absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] max-w-[300px] z-10 pointer-events-none">
              <img
                src={imageUrl}
                alt={title || ''}
                className="w-full h-auto object-contain drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          <div className="box-item-copy absolute inset-0 flex flex-col justify-end p-6 sm:p-8 z-20">
            {/* Title */}
            {title && (
              <h4 className="heading text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                <span className="highlighted-text text-white drop-shadow-lg">
                  {title}
                </span>
              </h4>
            )}

            {/* Subtitle */}
            {subtitle && (
              <p className="description text-sm sm:text-base text-white/90 mb-4 max-w-md drop-shadow-md">
                {subtitle}
              </p>
            )}

            {/* CTA Button */}
            <Link 
              to={ctaLink}
              className="feed-button button-secondary button-md inline-flex items-center justify-center px-5 py-2.5 bg-white text-neutral-900 font-semibold rounded-lg hover:bg-neutral-100 transition-all shadow-lg hover:shadow-xl w-fit"
            >
              {ctaText}
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  const renderHeading = () => {
    const moreThanOneGroup = (category_groups?.nodes?.length || 1) > 1;

    return (
      <div className="page-wellness">
        <div className="pick-your-homepage-wrapper">
          <div className="section-pick-your-homepage">
            <div className="pyhp-controls-wrapper">
              <div className="pyhp-controls flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                {heading?.value && (
                  <h4 className="pyhp-heading text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                    {heading.value}
                  </h4>
                )}
                {moreThanOneGroup && (
                  <div className="pyhp-toggle-buttons flex flex-wrap items-center justify-center gap-2">
                    {category_groups?.nodes.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => setTabActive(index)}
                        className={
                          tabActive === index
                            ? 'feed-button button-secondary button-md px-5 py-2.5 rounded-full font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-md'
                            : 'feed-button button-tertiary button-md px-5 py-2.5 rounded-full font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all'
                        }
                      >
                        {item.name?.value}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const cards = currentGroup?.category_cards?.nodes || [];

  return (
    <div className="kevel-box-carousel-wrapper py-8 sm:py-12 lg:py-16">
      <section className="section-box-carousel box-carousel-ads box-carousel-has-ads">
        <div className="feed-container container-lg box-carousel-container">
          {/* Heading with Tabs */}
          <div className="mb-8 sm:mb-12">{renderHeading()}</div>

          {/* Carousel */}
          {cards.length > 0 && (
            <div className="feed-carousel feed-carousel-enabled box-carousel relative" style={{'--carousel-gap': '16px'} as React.CSSProperties}>
              <div className="carousel-track-window overflow-hidden">
                <div
                  ref={sliderRef}
                  className="carousel-track flex gap-4 snap-x snap-mandatory overflow-x-auto hiddenScrollbar pb-4"
                >
                  {cards.map((item, index) => renderCard(item, index))}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              <button
                onClick={scrollToPrevSlide}
                className="carousel-arrow-button carousel-arrow-left absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all z-30 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous slide"
              >
                <svg stroke="currentColor" height="1.5rem" width="1.5rem" viewBox="0 0 24 24" fill="none" className="text-neutral-900 dark:text-neutral-100">
                  <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={scrollToNextSlide}
                className="carousel-arrow-button carousel-arrow-right absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all z-30"
                aria-label="Next slide"
              >
                <svg stroke="currentColor" height="1.5rem" width="1.5rem" viewBox="0 0 24 24" fill="none" className="text-neutral-900 dark:text-neutral-100">
                  <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}

          {cards.length === 0 && (
            <div className="text-center py-20">
              <p className="text-neutral-500 dark:text-neutral-400">
                No category cards available
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const CATEGORY_CARD_FRAGMENT = `#graphql
  fragment CategoryCardItem on Metaobject {
    type
    id
    handle
    title: field(key: "title") {
      type
      key
      value
    }
    subtitle: field(key: "subtitle") {
      type
      key
      value
    }
    image: field(key: "image") {
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
    background_color: field(key: "background_color") {
      type
      key
      value
    }
    cta_text: field(key: "cta_text") {
      type
      key
      value
    }
    cta_link: field(key: "cta_link") {
      type
      key
      value
    }
  }
`;

const CATEGORY_GROUP_FRAGMENT = `#graphql
  fragment CategoryGroupItem on Metaobject {
    type
    id
    handle
    title: field(key: "title") {
      type
      key
      value
    }
    name: field(key: "name") {
      type
      key
      value
    }
    icon_svg: field(key: "icon_svg") {
      type
      key
      value
    }
    category_cards: field(key: "category_cards") {
      references(first: 20) {
        nodes {
          ...CategoryCardItem
        }
      }
    }
  }
  ${CATEGORY_CARD_FRAGMENT}
`;

export const SECTION_CATEGORY_CARDS_CAROUSEL_FRAGMENT = `#graphql
  fragment SectionCategoryCardsCarousel on Metaobject {
    type
    id
    heading: field(key: "heading") {
      type
      key
      value
    }
    sub_heading: field(key: "sub_heading") {
      type
      key
      value
    }
    background_color: field(key: "background_color") {
      type
      key
      value
    }
    category_groups: field(key: "category_groups") {
      references(first: 20) {
        nodes {
          ...CategoryGroupItem
        }
      }
    }
  }
  ${CATEGORY_GROUP_FRAGMENT}
`;
