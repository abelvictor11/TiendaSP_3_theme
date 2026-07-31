import {Image, type ParsedMetafields} from '@shopify/hydrogen';
import {isVisibleBackground} from '~/utils/isVisibleBackground';
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

  // Un fondo blanco o gris muy claro no aporta nada visual y deja un panel
  // gris "suelto"; en esos casos no se renderiza el BackgroundSection.
  const hasBgColor = isVisibleBackground(background_color?.value);

  const renderCard = (item: any, index: number) => {
    if (!item.id) return null;

    const imageData = item.image?.image;
    const backgroundImageData = item.background_image?.image;
    const cardImageData = backgroundImageData?.url
      ? backgroundImageData
      : imageData;
    const title = item.title?.value;
    const subtitle = item.subtitle?.value;
    const ctaText = item.cta_text?.value || 'Shop Now';
    const ctaLink = item.cta_link?.value || '#';
    const badgeText = item.badge_text?.value;
    const badgeColor = item.badge_color?.value || '#ffe600';

    // Customizable colors
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
        className={`group relative overflow-hidden rounded-2xl block snap-start min-w-[82%] shrink-0 sm:min-w-0 sm:shrink ${
          isLarge
            ? 'aspect-[4/5] sm:aspect-[auto] sm:row-span-2'
            : 'aspect-[4/5] sm:aspect-[1/1]'
        }`}
      >
        {/* Background Image */}
        {cardImageData?.url && (
          <>
            <Image
              data={cardImageData}
              alt={title || ''}
              // Grid is `grid-cols-1 sm:grid-cols-3` with no further
              // breakpoint override; isLarge only spans rows
              // (`sm:row-span-2`), never columns, so every card is the same
              // 1-of-3-columns width from 640px up, including this one.
              sizes="(max-width: 640px) 100vw, 33vw"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/70" />
          </>
        )}

        {/* Badge pill — esquina superior izquierda, mismo lugar que las
            badges de thefeed.com ("SAVE 38%", "FREE WITH $75+") */}
        {/* Mismo estilo unificado que los badges de la ProductCard:
            px-2 py-1, text-xs font-medium, rounded-md, sin uppercase/bold/
            rounded-full/shadow. Sólo cambia el color de fondo. */}
        {badgeText && (
          <span
            className="absolute top-3 left-3 z-10 inline-flex items-center px-2 py-1 text-xs font-medium rounded-md leading-none"
            style={{backgroundColor: badgeColor, color: '#171717'}}
          >
            {badgeText}
          </span>
        )}

        {/* Content — sin panel de fondo ni blur; el texto se apoya sobre el
            gradiente inferior de la imagen. */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="p-1">
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
            // Mobile: carrusel horizontal con scroll-snap (flex + overflow-x).
            // Desktop (sm+): vuelve a la grilla de 3 columnas.
            <div className="flex sm:grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 sm:auto-rows-[minmax(0,1fr)] overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none -mx-4 px-4 sm:mx-0 sm:px-0 hiddenScrollbar">
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
