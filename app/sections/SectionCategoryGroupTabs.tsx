import {useRef} from 'react';
import useSnapSlider from '~/hooks/useSnapSlider';
import Heading from '~/components/Heading/Heading';
import {Link} from '@remix-run/react';
import {parseSection} from '~/utils/parseSection';

export function SectionCategoryGroupTabs(props: any) {
  const section = parseSection<any, {}>(props);

  const {name, title, category_cards} = section;

  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  const cards = category_cards?.nodes || [];

  if (!cards.length) return null;

  const renderCard = (item: any, index: number) => {
    if (!item.id) return null;

    const imageUrl = item.image?.image?.url;
    const backgroundImageUrl = item.background_image?.image?.url;
    const cardTitle = item.title?.value;
    const subtitle = item.subtitle?.value;
    const ctaText = item.cta_text?.value || 'Comprar ahora';
    const ctaLink = item.cta_link?.value || '#';
    const bgColor = item.background_color?.value || '#e0f2fe';

    const contentBgColor =
      item.content_background_color?.value || 'rgba(0, 0, 0, 0.6)';
    const titleColor = item.title_color?.value || '#ffffff';
    const subtitleColor =
      item.subtitle_color?.value || 'rgba(255, 255, 255, 0.9)';

    return (
      <div key={item.id} className="mySnapItem snap-start shrink-0 px-2">
        <div className="relative overflow-hidden rounded-2xl group w-[350px] sm:w-[450px] lg:w-[500px] h-[400px] sm:h-[450px]">
          <div
            className="absolute inset-0"
            style={{backgroundColor: bgColor}}
          />

          {(backgroundImageUrl || imageUrl) && (
            <>
              <img
                src={backgroundImageUrl || imageUrl}
                alt={cardTitle || ''}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
            </>
          )}

          {imageUrl && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] max-w-[280px] z-10">
              <img
                src={imageUrl}
                alt={cardTitle || ''}
                className="w-full h-auto object-contain drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          )}

          <div className="absolute bottom-5 left-5 right-5 z-20">
            <div className="">
              {cardTitle && (
                <h4
                  className="text-2xl sm:text-3xl lg:text-3xl font-normal mb-3"
                  style={{color: titleColor}}
                >
                  {cardTitle}
                </h4>
              )}

              {subtitle && (
                <p
                  className="text-sm sm:text-xs mb-5 max-w-md"
                  style={{color: subtitleColor}}
                >
                  {subtitle}
                </p>
              )}

              <div>
                <Link 
                  to={ctaLink}
                  className="inline-flex items-center gap-2 font-medium text-sm transition-all hover:gap-3"
                  style={{color: titleColor}}
                >
                  {ctaText}
                  <svg className="w-4 h-4" focusable="false" role="presentation" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 16 16" stroke="currentColor" fill="none">
                    <path d="M2.6665 8H13.3332M13.3332 8L9.33317 4M13.3332 8L9.33317 12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="nc-SectionCategoryGroupTabs">
      <div className="px-8">
        <Heading
          className="mb-8 lg:mb-10 text-neutral-900 dark:text-neutral-50"
          fontClass="font-headline text-3xl md:text-3xl font-normal"
          hasNextPrev
          onClickNext={scrollToNextSlide}
          onClickPrev={scrollToPrevSlide}
        >
          {name?.value || title?.value || ''}
        </Heading>

        {cards.length > 0 && (
          <div
            ref={sliderRef}
            className="relative flex snap-x snap-mandatory overflow-x-auto -mx-2 lg:-mx-4 hiddenScrollbar"
          >
            {cards.map((item: any, index: number) => renderCard(item, index))}
          </div>
        )}
      </div>
    </section>
  );
}

const CATEGORY_GROUP_TAB_CARD_FRAGMENT = `#graphql
  fragment CategoryGroupTabCard on Metaobject {
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

export const SECTION_CATEGORY_GROUP_TABS_FRAGMENT = `#graphql
  fragment SectionCategoryGroupTabs on Metaobject {
    type
    id
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
          ...CategoryGroupTabCard
        }
      }
    }
  }
  ${CATEGORY_GROUP_TAB_CARD_FRAGMENT}
`;
