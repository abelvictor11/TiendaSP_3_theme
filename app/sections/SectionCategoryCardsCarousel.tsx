import {type ParsedMetafields} from '@shopify/hydrogen';
import {parseSection} from '~/utils/parseSection';
import type {SectionCategoryCardsCarouselFragment} from 'storefrontapi.generated';
import {useState, useRef} from 'react';
import {Link} from '@remix-run/react';
import useSnapSlider from '~/hooks/useSnapSlider';
import Heading from '~/components/Heading/Heading';
import Nav from '~/components/Nav';
import NavItem from '~/components/NavItem';
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import clsx from 'clsx';
import NextPrev from '~/components/NextPrev/NextPrev';

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

    const imageUrl = item.image?.image?.url;
    const backgroundImageUrl = item.background_image?.image?.url; // Nueva imagen de fondo
    const title = item.title?.value;
    const subtitle = item.subtitle?.value;
    const ctaText = item.cta_text?.value || 'Shop Now';
    const ctaLink = item.cta_link?.value || '#';
    const bgColor = item.background_color?.value || '#e0f2fe';
    
    // Customizable colors
    const contentBgColor = item.content_background_color?.value || 'rgba(0, 0, 0, 0.6)';
    const titleColor = item.title_color?.value || '#ffffff';
    const subtitleColor = item.subtitle_color?.value || 'rgba(255, 255, 255, 0.9)';
    const buttonBgColor = item.button_background_color?.value || '#ffffff';
    const buttonTextColor = item.button_text_color?.value || '#171717';

    return (
      <div
        key={item.id}
        className="mySnapItem snap-start shrink-0 px-2"
      >
        <div className="relative overflow-hidden rounded-2xl group w-[350px] sm:w-[450px] lg:w-[500px] h-[400px] sm:h-[450px]">
          {/* Background with color or gradient */}
          <div 
            className="absolute inset-0"
            style={{backgroundColor: bgColor}}
          />
          
          {/* Background Image (usa background_image si existe, sino usa image) */}
          {(backgroundImageUrl || imageUrl) && (
            <>
              <img
                src={backgroundImageUrl || imageUrl}
                alt={title || ''}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
            </>
          )}

          {/* Product Image Centered (solo si existe image) */}
          {imageUrl && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] max-w-[280px] z-10">
              <img
                src={imageUrl}
                alt={title || ''}
                className="w-full h-auto object-contain drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          )}

          {/* Content Container with Custom Background */}
          <div className="absolute bottom-5 left-5 right-5 z-20">
            <div 
              className="rounded-2xl p-6 sm:p-8 backdrop-blur-sm"
              style={{backgroundColor: contentBgColor}}
            >
              {/* Title */}
              {title && (
                <h4 
                  className="text-2xl sm:text-3xl lg:text-3xl font-normal mb-3"
                  style={{color: titleColor}}
                >
                  {title}
                </h4>
              )}

              {/* Subtitle */}
              {subtitle && (
                <p 
                  className="text-sm sm:text-xs mb-5 max-w-md"
                  style={{color: subtitleColor}}
                >
                  {subtitle}
                </p>
              )}

              {/* CTA Button */}
              <div>
                <Link to={ctaLink}>
                  <button
                    className="px-6 py-3 lg:px-8 lg:py-4 rounded-full text-sm sm:text-base lg:text-lg font-medium shadow-xl transition-all hover:shadow-2xl hover:scale-105"
                    style={{
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor,
                    }}
                  >
                    {ctaText}
                  </button>
                </Link>
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
    const hasHeading = heading?.value || sub_heading?.value;

    return (
      <div>
        {hasHeading ? (
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
        ) : (
          <div className="flex justify-end mb-6">
            <NextPrev onClickNext={scrollToNextSlide} onClickPrev={scrollToPrevSlide} />
          </div>
        )}
        {moreThanOneGroup && (
          <Nav
            className="p-1 bg-white dark:bg-neutral-800 rounded-full shadow-lg overflow-x-auto hiddenScrollbar"
            containerClassName="mb-8 lg:mb-10 relative flex justify-center w-full text-sm md:text-base"
          >
            {category_groups?.nodes.map((item, index) => (
              <NavItem
                key={item.id}
                isActive={tabActive === index}
                onClick={() => setTabActive(index)}
              >
                <span>{item.name?.value}</span>
              </NavItem>
            ))}
          </Nav>
        )}
      </div>
    );
  };

  const cards = currentGroup?.category_cards?.nodes || [];

  return (
    <section className="nc-SectionCategoryCardsCarousel">
      <div className="px-8">
        {/* Heading with Tabs */}
        {renderHeading()}

        {/* Carousel */}
        {cards.length > 0 && (
          <div
            ref={sliderRef}
            className="relative flex snap-x snap-mandatory overflow-x-auto -mx-2 lg:-mx-4 hiddenScrollbar"
          >
            {cards.map((item, index) => renderCard(item, index))}
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
    content_background_color: field(key: "content_background_color") {
      type
      key
      value
    }
    title_color: field(key: "title_color") {
      type
      key
      value
    }
    subtitle_color: field(key: "subtitle_color") {
      type
      key
      value
    }
    button_background_color: field(key: "button_background_color") {
      type
      key
      value
    }
    button_text_color: field(key: "button_text_color") {
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
