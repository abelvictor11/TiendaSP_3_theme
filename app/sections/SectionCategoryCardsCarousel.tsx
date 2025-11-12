import {type ParsedMetafields} from '@shopify/hydrogen';
import {parseSection} from '~/utils/parseSection';
import type {SectionCategoryCardsCarouselFragment} from 'storefrontapi.generated';
import {useState, useRef} from 'react';
import Heading from '@/components/Heading/Heading';
import NavItem from '@/components/NavItem';
import Nav from '~/components/Nav';
import BackgroundSection from '~/components/BackgroundSection';
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import {Link} from '@remix-run/react';
import useSnapSlider from '~/hooks/useSnapSlider';
import {ArrowRightIcon} from '@heroicons/react/24/outline';

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

    return (
      <div
        key={item.id}
        className="mySnapItem snap-start shrink-0 last:pr-4 lg:last:pr-10"
      >
        <div className="w-80 sm:w-96 lg:w-[32rem] xl:w-[36rem]">
          <div className="relative h-full overflow-hidden rounded-3xl group">
            {/* Background Image */}
            {imageUrl && (
              <div className="absolute inset-0">
                <img
                  src={imageUrl}
                  alt={title || ''}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
            )}

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-6 sm:p-8 lg:p-10 min-h-[400px] lg:min-h-[500px]">
              <div className="space-y-4">
                {/* Title */}
                {title && (
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white drop-shadow-lg">
                    {title}
                  </h3>
                )}

                {/* Subtitle */}
                {subtitle && (
                  <p className="text-base sm:text-lg text-white/90 max-w-md drop-shadow-md">
                    {subtitle}
                  </p>
                )}

                {/* CTA Button */}
                <div className="pt-4">
                  <Link to={ctaLink}>
                    <ButtonPrimary
                      className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-xl"
                      sizeClass="px-6 py-3 sm:px-8 sm:py-4"
                    >
                      <span className="flex items-center gap-2">
                        {ctaText}
                        <ArrowRightIcon className="w-5 h-5" />
                      </span>
                    </ButtonPrimary>
                  </Link>
                </div>
              </div>
            </div>
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
      <div>
        <Heading
          className="mb-12 lg:mb-14 text-neutral-900 dark:text-neutral-50"
          fontClass="text-3xl md:text-4xl 2xl:text-5xl font-semibold"
          isCenter
          desc={sub_heading?.value || ''}
          hasNextPrev
          onClickNext={scrollToNextSlide}
          onClickPrev={scrollToPrevSlide}
        >
          {heading?.value || 'Shop By Category'}
        </Heading>
        {moreThanOneGroup && (
          <Nav
            className="p-1 bg-white dark:bg-neutral-800 rounded-full shadow-lg overflow-x-auto hiddenScrollbar"
            containerClassName="mb-12 lg:mb-14 relative flex justify-center w-full text-sm md:text-base"
          >
            {category_groups?.nodes.map((item, index) => (
              <NavItem
                key={item.id}
                isActive={tabActive === index}
                onClick={() => setTabActive(index)}
              >
                <div className="flex items-center justify-center space-x-1.5 sm:space-x-2.5 text-xs sm:text-sm">
                  {item.icon_svg?.value && (
                    <span
                      className="inline-block *:w-full *:h-full w-4 h-4 sm:w-5 sm:h-5"
                      dangerouslySetInnerHTML={{
                        __html: item.icon_svg?.value || '',
                      }}
                    ></span>
                  )}
                  <span>{item.name?.value}</span>
                </div>
              </NavItem>
            ))}
          </Nav>
        )}
      </div>
    );
  };

  const cards = currentGroup?.category_cards?.nodes || [];

  return (
    <section className="section-CategoryCardsCarousel">
      <div className={!noneBgColor ? 'relative py-24 lg:py-32' : ''}>
        {background_color?.value && (
          <BackgroundSection
            style={{backgroundColor: background_color?.value}}
          />
        )}
        <div className="container">{renderHeading()}</div>

        {cards.length > 0 && (
          <div className="nc-CategoryCardsCarousel">
            <div
              ref={sliderRef}
              className="relative w-full flex gap-4 lg:gap-8 snap-x snap-mandatory overflow-x-auto scroll-p-l-container hiddenScrollbar"
            >
              <div className="w-0 nc-p-l-container"></div>
              {cards.map((item, index) => renderCard(item, index))}
            </div>
          </div>
        )}

        {cards.length === 0 && (
          <div className="container text-center py-20">
            <p className="text-neutral-500 dark:text-neutral-400">
              No category cards available
            </p>
          </div>
        )}
      </div>
    </section>
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
