import {type ParsedMetafields} from '@shopify/hydrogen';
import {parseSection} from '~/utils/parseSection';
import type {SectionCategoryCardsCarouselFragment} from 'storefrontapi.generated';
import {Link} from '@remix-run/react';
import Heading from '~/components/Heading/Heading';
import BackgroundSection from '~/components/BackgroundSection';

export function SectionCategoryCardsCarousel(
  props: SectionCategoryCardsCarouselFragment,
) {
  const section = parseSection<
    SectionCategoryCardsCarouselFragment,
    {
      heading?: ParsedMetafields['single_line_text_field'];
    }
  >(props);

  const {category_groups, heading, sub_heading, background_color} = section;

  // Solo el primer grupo — el layout tipo Feed (1 tile grande + resto
  // chicos) no tiene un buen equivalente con tabs de grupo múltiple, y hoy
  // solo hay un grupo real (`endurance`) usándose en home de todas formas.
  const cards = category_groups?.nodes?.[0]?.category_cards?.nodes || [];

  const hasBgColor =
    background_color?.value &&
    background_color?.value !== 'transparent' &&
    background_color?.value !== '#ffffff' &&
    background_color?.value !== '#fff';

  const renderCard = (item: any, index: number) => {
    if (!item.id) return null;

    const imageUrl = item.image?.image?.url;
    const backgroundImageUrl = item.background_image?.image?.url;
    const title = item.title?.value;
    const subtitle = item.subtitle?.value;
    const ctaText = item.cta_text?.value || 'Shop Now';
    const ctaLink = item.cta_link?.value || '#';
    const badgeText = item.badge_text?.value;
    const badgeColor = item.badge_color?.value || '#ffe600';

    // Customizable colors
    const contentBgColor =
      item.content_background_color?.value || 'rgba(0, 0, 0, 0.6)';
    const titleColor = item.title_color?.value || '#ffffff';
    const subtitleColor =
      item.subtitle_color?.value || 'rgba(255, 255, 255, 0.9)';
    const buttonBgColor = item.button_background_color?.value || '#ffffff';
    const buttonTextColor = item.button_text_color?.value || '#171717';

    // Primer tile = grande (ocupa las 2 filas en desktop), como el grid de
    // promos de thefeed.com — mismo patrón de cadencia/espaciado, colores
    // propios de tienda.
    const isLarge = index === 0;

    return (
      <Link
        key={item.id}
        to={ctaLink}
        className={`group relative overflow-hidden rounded-2xl block ${
          isLarge
            ? 'col-span-2 row-span-2 aspect-[4/5] sm:aspect-auto'
            : 'aspect-square'
        }`}
      >
        {/* Background Image */}
        {(backgroundImageUrl || imageUrl) && (
          <>
            <img
              src={backgroundImageUrl || imageUrl}
              alt={title || ''}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/70" />
          </>
        )}

        {/* Badge pill — esquina superior izquierda, mismo lugar que las
            badges de thefeed.com ("SAVE 38%", "FREE WITH $75+") */}
        {badgeText && (
          <span
            className="absolute top-3 left-3 z-10 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide shadow-sm"
            style={{backgroundColor: badgeColor, color: '#171717'}}
          >
            {badgeText}
          </span>
        )}

        {/* Content */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div
            className="rounded-xl p-4 sm:p-5 backdrop-blur-sm"
            style={{backgroundColor: contentBgColor}}
          >
            {title && (
              <h4
                className={`font-normal mb-1 ${
                  isLarge ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
                }`}
                style={{color: titleColor}}
              >
                {title}
              </h4>
            )}
            {subtitle && isLarge && (
              <p
                className="text-sm mb-3 max-w-md line-clamp-2"
                style={{color: subtitleColor}}
              >
                {subtitle}
              </p>
            )}
            <span
              className="inline-block px-4 py-2 rounded-full text-xs sm:text-sm font-medium shadow-md transition-transform group-hover:scale-105"
              style={{backgroundColor: buttonBgColor, color: buttonTextColor}}
            >
              {ctaText}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section className="nc-SectionCategoryCardsCarousel container">
      <div className={hasBgColor ? 'relative py-12 lg:py-16' : ''}>
        {hasBgColor && (
          <BackgroundSection
            style={{backgroundColor: background_color?.value ?? undefined}}
          />
        )}
        <div>
          {(heading?.value || sub_heading?.value) && (
            <Heading className="mb-8 lg:mb-10" desc={sub_heading?.value}>
              {heading?.value}
            </Heading>
          )}

          {cards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 sm:auto-rows-[minmax(0,1fr)]">
              {cards.map((item, index) => renderCard(item, index))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-neutral-500 dark:text-neutral-400">
                No category cards available
              </p>
            </div>
          )}
        </div>
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
    badge_text: field(key: "badge_text") {
      type
      key
      value
    }
    badge_color: field(key: "badge_color") {
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
