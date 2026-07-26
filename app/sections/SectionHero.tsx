import React, {type FC} from 'react';
import {parseSection} from '~/utils/parseSection';
import {Image, type ParsedMetafields} from '@shopify/hydrogen';
import type {
  HeroItemFragment,
  SectionHeroFragment,
} from 'storefrontapi.generated';
import ButtonPrimary from '~/components/Button/ButtonPrimary';

function getPositionClasses(position: string): {
  flex: string;
  text: string;
  mx: string;
} {
  const map: Record<string, {flex: string; text: string; mx: string}> = {
    'top-left':      {flex: 'items-start justify-start',   text: 'text-left',   mx: 'mr-auto'},
    'top-center':    {flex: 'items-start justify-center',  text: 'text-center', mx: 'mx-auto'},
    'top-right':     {flex: 'items-start justify-end',     text: 'text-right',  mx: 'ml-auto'},
    'center-left':   {flex: 'items-center justify-start',  text: 'text-left',   mx: 'mr-auto'},
    'center-center': {flex: 'items-center justify-center', text: 'text-center', mx: 'mx-auto'},
    'center-right':  {flex: 'items-center justify-end',    text: 'text-right',  mx: 'ml-auto'},
    'bottom-left':   {flex: 'items-end justify-start',     text: 'text-left',   mx: 'mr-auto'},
    'bottom-center': {flex: 'items-end justify-center',    text: 'text-center', mx: 'mx-auto'},
    'bottom-right':  {flex: 'items-end justify-end',       text: 'text-right',  mx: 'ml-auto'},
  };
  return map[position] ?? map['center-left'];
}

export function SectionHero(props: SectionHeroFragment) {
  const heroItem = props.hero_item?.reference
    ? parseSection<
        HeroItemFragment,
        {
          heading?: ParsedMetafields['list.single_line_text_field'];
          sub_heading?: ParsedMetafields['list.single_line_text_field'];
          vertical_image?: ParsedMetafields['list.file_reference'];
          horizontal_image?: ParsedMetafields['list.file_reference'];
        }
      >(props.hero_item?.reference)
    : null;

  if (!heroItem) {
    return null;
  }

  const {cta_button, heading, horizontal_image, sub_heading, vertical_image} =
    heroItem;

  // Get colors with defaults
  const headingColor = (heroItem as any).heading_color?.value || '#000000';
  const subheadingColor = (heroItem as any).subheading_color?.value || '#171717';
  const buttonBgColor = (heroItem as any).button_bg_color?.value || '#171717';
  const buttonTextColor = (heroItem as any).button_text_color?.value || '#ffffff';

  // Content block position (default: center-left)
  const rawPosition = (heroItem as any).content_position?.value || 'center-left';
  const positionClasses = getPositionClasses(rawPosition);
  const isBottomAligned = rawPosition.startsWith('bottom-');
  const verticalPaddingClass = isBottomAligned ? 'pt-8 pb-16' : 'py-12 sm:py-14';
  const buttonJustify =
    positionClasses.text === 'text-right'
      ? 'flex justify-end'
      : positionClasses.text === 'text-center'
        ? 'flex justify-center'
        : 'flex justify-start';

  // Get video sources
  const horizontalVideo = (heroItem as any).horizontal_video?.reference?.sources?.[0];
  const verticalVideo = (heroItem as any).vertical_video?.reference?.sources?.[0];

  return (
    <div className="container px-4">
      <div className="nc-SectionHero aspect-h-16 aspect-w-10 relative overflow-hidden rounded-2xl bg-slate-100 sm:aspect-h-4 sm:aspect-w-3 lg:aspect-h-7 lg:aspect-w-16 2xl:aspect-w-16 2xl:aspect-h-7">
        {/* BG */}
        <div>
          {/* Desktop: Video or Image */}
          {horizontalVideo?.url ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="hidden h-full w-full object-cover lg:block"
            >
              <source src={horizontalVideo.url} type={horizontalVideo.mimeType || 'video/mp4'} />
            </video>
          ) : horizontal_image?.image && (
            <Image
              sizes="110vw"
              className="hidden h-full w-full object-cover lg:block"
              data={horizontal_image?.image}
              loading="eager"
              fetchPriority="high"
            />
          )}

          {/* Mobile: Video or Image */}
          {verticalVideo?.url ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="block h-full w-full object-cover object-bottom lg:hidden"
            >
              <source src={verticalVideo.url} type={verticalVideo.mimeType || 'video/mp4'} />
            </video>
          ) : vertical_image?.image && (
            <Image
              sizes="100vw"
              className="block h-full w-full object-cover object-bottom lg:hidden"
              data={vertical_image?.image}
              loading="eager"
              fetchPriority="high"
            />
          )}
        </div>

        {/* CONTENT */}
        <div className={`relative z-10 h-full flex ${verticalPaddingClass} ${positionClasses.flex}`}>
          <div className="container relative">
            <div className={`flex flex-col max-w-lg space-y-5 xl:max-w-2xl xl:space-y-8 ${positionClasses.mx} ${positionClasses.text}`}>
              {sub_heading?.value && (
                <span 
                  className="font-semibold sm:text-lg md:text-xl"
                  style={{color: subheadingColor}}
                >
                  {sub_heading?.value}
                </span>
              )}
              {heading?.value && (
                <h2
                  className="text-3xl font-bold !leading-[115%] sm:text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl"
                  style={{color: headingColor}}
                  dangerouslySetInnerHTML={{__html: heading?.value}}
                />
              )}
              {!!cta_button?.href?.value && (
                <div className={`sm:pt-4 ${buttonJustify}`}>
                  <a
                    href={cta_button?.href?.value || ''}
                    target={cta_button?.target?.value === 'true' ? '_blank' : '_self'}
                    rel={cta_button?.target?.value === 'true' ? 'noopener noreferrer' : undefined}
                    className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 lg:px-8 lg:py-4 text-sm sm:text-base lg:text-lg font-medium transition-all duration-200 hover:opacity-90"
                    style={{
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor,
                    }}
                  >
                    <span>{cta_button?.text?.value}</span>
                    {!!cta_button?.icon_svg?.value && (
                      <span
                        className="ms-2.5 flex max-w-5 *:!h-5 *:!w-5"
                        dangerouslySetInnerHTML={{
                          __html: cta_button?.icon_svg.value,
                        }}
                      />
                    )}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SECTION_HERO_FRAGMENT = `#graphql
  fragment SectionHero on Metaobject {
    type
    hero_item: field(key: "hero_item") {
      reference {
          ... on Metaobject {
            ...HeroItem
          }
      }
    }
  }
`;
