import {Image, type ParsedMetafields} from '@shopify/hydrogen';
import {parseSection} from '~/utils/parseSection';
import type {
  HeroItemFragment,
  SectionHeroSliderFragment,
} from 'storefrontapi.generated';
import {useEffect, useRef, useState} from 'react';
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import useInterval from 'beautiful-react-hooks/useInterval';
import useHorizontalSwipe from 'beautiful-react-hooks/useHorizontalSwipe';
import clsx from 'clsx';

let TIME_OUT: NodeJS.Timeout | null = null;

export function SectionHeroSlider(props: SectionHeroSliderFragment) {
  const DATA = props?.hero_items?.references?.nodes || [];

  const ref = useRef<HTMLDivElement>(null);
  const swipeState = useHorizontalSwipe(ref, {
    threshold: 100,
    preventDefault: false,
    passive: true,
  });
  const [isSlided, setIsSlided] = useState(false);
  const [indexActive, setIndexActive] = useState(0);
  const [isRunning, toggleIsRunning] = useState(true);

  useEffect(() => {
    if (isSlided || !indexActive) {
      return;
    }
    setIsSlided(true);
  }, [indexActive, isSlided]);

  useEffect(() => {
    if (swipeState.swiping || !swipeState.direction || !swipeState.count) {
      return;
    }
    swipeState.direction === 'left' && handleClickNext();
    swipeState.direction === 'right' && handleClickPrev();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swipeState.direction, swipeState.swiping, swipeState.count]);

  useInterval(
    () => {
      handleAutoNext();
    },
    isRunning ? 5000 : 999999,
  );

  const handleAutoNext = () => {
    setIndexActive((state) => {
      if (state >= DATA.length - 1) {
        return 0;
      }
      return state + 1;
    });
  };

  const handleClickNext = () => {
    setIndexActive((state) => {
      if (state >= DATA.length - 1) {
        return 0;
      }
      return state + 1;
    });
    handleAfterClick();
  };

  const handleClickPrev = () => {
    setIndexActive((state) => {
      if (state === 0) {
        return DATA.length - 1;
      }
      return state - 1;
    });
    handleAfterClick();
  };

  const handleAfterClick = () => {
    toggleIsRunning(false);
    if (TIME_OUT) {
      clearTimeout(TIME_OUT);
    }
    TIME_OUT = setTimeout(() => {
      toggleIsRunning(true);
    }, 1000);
  };
  // ================= ================= =================

  const renderDots = () => {
    if (!DATA.length || DATA.length < 2) {
      return null;
    }

    return (
      <>
        <div className="absolute bottom-4 inset-x-px z-10 ">
          <div className="container flex items-center justify-center gap-2">
            {DATA.map((_, index) => {
              const isActive = index === indexActive;
              return (
                <button
                  key={`item-${index + 1}`} // Fix: Generate a unique key using a unique identifier
                  className="relative py-1.5 flex-1 max-w-20"
                  onClick={() => {
                    setIndexActive(index);
                    handleAfterClick();
                  }}
                >
                  <div className="relative h-1 w-full rounded-md bg-white shadow-sm">
                    {isActive && (
                      <div className="nc-SectionHeroSliderItem__dot absolute inset-0 rounded-md bg-slate-900" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="absolute inset-y-px end-0 px-10 hidden lg:flex items-center justify-center z-10 text-slate-700"
          onClick={handleClickNext}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={0.6}
            stroke="currentColor"
            className="h-12 w-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
        <button
          type="button"
          className="absolute inset-y-px start-0 px-10 hidden lg:flex items-center justify-center z-10 text-slate-700"
          onClick={handleClickPrev}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={0.6}
            stroke="currentColor"
            className="h-12 w-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>
      </>
    );
  };

  return (
    <section className="section-hero-slider relative" ref={ref}>
      {DATA.map((section, index) =>
        indexActive === index ? (
          <div
            key={(index + 1).toString()}
            className={clsx(
              'nc-SectionHeroSliderItem',
              isSlided && 'nc-SectionHeroSliderItem--animation',
            )}
          >
            <SectionItem section={section} />
          </div>
        ) : null,
      )}

      {/* DOT, Next/Prev Btns */}
      {renderDots()}
    </section>
  );
}

// Maps a "vertical-horizontal" position string to Tailwind classes.
// `flex`  → applied to the outer flex wrapper (vertical alignment of the
//           text block within the slide).
// `text`  → text-align for the heading/subheading.
// `mx`    → horizontal margin on the inner max-w-3xl block; needed because
//           that block sits inside `.container` and won't be centered by the
//           outer flex's justify-* alone.
function getPositionClasses(position: string): {
  flex: string;
  text: string;
  mx: string;
} {
  const map: Record<string, {flex: string; text: string; mx: string}> = {
    'top-left':      {flex: 'items-start justify-start',  text: 'text-left',   mx: 'mr-auto'},
    'top-center':    {flex: 'items-start justify-center', text: 'text-center', mx: 'mx-auto'},
    'top-right':     {flex: 'items-start justify-end',    text: 'text-right',  mx: 'ml-auto'},
    'center-left':   {flex: 'items-center justify-start', text: 'text-left',   mx: 'mr-auto'},
    'center-center': {flex: 'items-center justify-center',text: 'text-center', mx: 'mx-auto'},
    'center-right':  {flex: 'items-center justify-end',   text: 'text-right',  mx: 'ml-auto'},
    'bottom-left':   {flex: 'items-end justify-start',    text: 'text-left',   mx: 'mr-auto'},
    'bottom-center': {flex: 'items-end justify-center',   text: 'text-center', mx: 'mx-auto'},
    'bottom-right':  {flex: 'items-end justify-end',      text: 'text-right',  mx: 'ml-auto'},
  };
  return map[position] ?? map['center-left'];
}

const SectionItem = ({section}: {section: HeroItemFragment}) => {
  const item = parseSection<
    HeroItemFragment,
    {
      heading?: ParsedMetafields['list.single_line_text_field'];
      sub_heading?: ParsedMetafields['list.single_line_text_field'];
      vertical_image?: ParsedMetafields['list.file_reference'];
      horizontal_image?: ParsedMetafields['list.file_reference'];
    }
  >(section);

  // Get colors with defaults
  const headingColor = (item as any).heading_color?.value || '#1e293b';
  const subheadingColor = (item as any).subheading_color?.value || '#475569';
  const buttonBgColor = (item as any).button_bg_color?.value || '#1e293b';
  const buttonTextColor = (item as any).button_text_color?.value || '#ffffff';

  // Content block position (default: center-left)
  const rawPosition = (item as any).content_position?.value || 'center-left';
  const positionClasses = getPositionClasses(rawPosition);
  // Reserve room for the dot indicators (which sit at bottom-4) when the
  // content is anchored to the bottom edge — otherwise the CTA overlaps
  // the dots instead of sitting above them.
  const isBottomAligned = rawPosition.startsWith('bottom-');
  const verticalPaddingClass = isBottomAligned ? 'pt-8 pb-20' : 'pb-8 pt-8';

  // Determine if this hero item has text content
  const hasTextContent = !!(item.heading?.value || item.sub_heading?.value || item.cta_button?.text?.value);
  const linkUrl = item.cta_button?.href?.value;
  const linkTarget = item.cta_button?.target?.value === 'true' ? '_blank' : '_self';
  const linkRel = item.cta_button?.target?.value === 'true' ? 'noopener noreferrer' : undefined;

  // If no text content but has a URL, the entire slide becomes clickable
  const isImageOnlyLink = !hasTextContent && !!linkUrl;

  const slideContent = (
    <div className={`h-[60vh] min-h-[400px] w-full lg:h-[55vh] lg:min-h-[500px] relative overflow-hidden bg-[#efefef]${isImageOnlyLink ? ' group' : ''}`}>
      {/* BG - Absolute positioned */}
      <div className="nc-SectionHeroSliderItem__image absolute inset-0 w-full h-full">
        {/* Desktop: Video or Image */}
        {(item as any).horizontal_video?.sources?.[0]?.url ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="hidden h-full w-full object-cover lg:block"
          >
            <source src={(item as any).horizontal_video.sources[0].url} type={(item as any).horizontal_video.sources[0].mimeType || 'video/mp4'} />
          </video>
        ) : item.horizontal_image?.image && (
          <Image
            data={item.horizontal_image?.image}
            sizes="110vw"
            className={`hidden h-full w-full object-cover lg:block${isImageOnlyLink ? ' transition-transform duration-500 group-hover:scale-105' : ''}`}
            style={{objectPosition: 'center center'}}
            loading="eager"
            fetchpriority="high"
          />
        )}

        {/* Mobile: Video or Image */}
        {(item as any).vertical_video?.sources?.[0]?.url ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="block h-full w-full object-cover lg:hidden"
          >
            <source src={(item as any).vertical_video.sources[0].url} type={(item as any).vertical_video.sources[0].mimeType || 'video/mp4'} />
          </video>
        ) : item.vertical_image?.image && (
          <Image
            data={item.vertical_image?.image}
            sizes="100vw"
            className={`block h-full w-full object-cover lg:hidden${isImageOnlyLink ? ' transition-transform duration-500 group-hover:scale-105' : ''}`}
            style={{objectPosition: 'center center'}}
            loading="eager"
            fetchpriority="high"
          />
        )}
      </div>

      {/* CONTENT - Only show text overlay if there is text content */}
      {hasTextContent && (
        <div className={`relative z-10 h-full flex ${verticalPaddingClass} ${positionClasses.flex}`}>
          <div className="container">
            <div className={`nc-SectionHeroSliderItem__left relative w-full max-w-3xl space-y-6 lg:space-y-8 ${positionClasses.mx} ${positionClasses.text}`}>
              <div className="space-y-3 sm:space-y-4">
                {!!item.heading?.value && (
                  <h2
                    className="nc-SectionHeroSliderItem__heading font-headline text-2xl font-normal !leading-[114%] sm:text-3xl md:text-4xl xl:text-5xl 2xl:text-6xl"
                    style={{color: headingColor}}
                    dangerouslySetInnerHTML={{__html: item.heading.value}}
                  />
                )}
                {!!item.sub_heading?.value && (
                  <span
                    className="nc-SectionHeroSliderItem__subheading block text-base font-normal md:text-lg"
                    style={{color: subheadingColor}}
                    dangerouslySetInnerHTML={{__html: item.sub_heading.value}}
                  />
                )}
              </div>

              {!!item.cta_button?.href?.value && (
                <div className={positionClasses.text === 'text-left' ? 'flex justify-start' : positionClasses.text === 'text-right' ? 'flex justify-end' : 'flex justify-center'}>
                  <a
                    href={item.cta_button.href.value}
                    target={linkTarget}
                    rel={linkRel}
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl border border-current transition-all duration-200 hover:opacity-90"
                    style={{
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor,
                      borderColor: buttonBgColor,
                    }}
                  >
                    <span>{item.cta_button?.text?.value || 'Ver más'}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      className="w-5 h-5 ml-2 transition-transform duration-200 ease-in-out group-hover:translate-x-1"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isImageOnlyLink) {
    return (
      <a
        href={linkUrl!}
        target={linkTarget}
        rel={linkRel}
        className="block"
      >
        {slideContent}
      </a>
    );
  }

  return slideContent;
};

export const HERO_ITEM_FRAGMENT = `#graphql
    fragment HeroItem on Metaobject {
      type
      heading: field(key: "heading") {
        value
      }
      sub_heading: field(key: "sub_heading") {
        value
      }
      cta_button: field(key: "cta_button") {
        ...Link
      }
      vertical_image: field(key: "vertical_image") {
        key
        reference {
          ... on MediaImage {
            ...MediaImage
          }
        }
      }
      horizontal_image: field(key: "horizontal_image") {
        key
        reference {
          ... on MediaImage {
            ...MediaImage
          }
        }
      }
      vertical_video: field(key: "vertical_video") {
        key
        reference {
          ... on Video {
            id
            sources {
              url
              mimeType
              width
              height
            }
          }
        }
      }
      horizontal_video: field(key: "horizontal_video") {
        key
        reference {
          ... on Video {
            id
            sources {
              url
              mimeType
              width
              height
            }
          }
        }
      }
      heading_color: field(key: "heading_color") {
        value
      }
      subheading_color: field(key: "subheading_color") {
        value
      }
      button_bg_color: field(key: "button_bg_color") {
        value
      }
      button_text_color: field(key: "button_text_color") {
        value
      }
      content_position: field(key: "content_position") {
        value
      }
  }
`;

export const SECTION_HERO_SLIDER_FRAGMENT = `#graphql
  fragment SectionHeroSlider on Metaobject {
    type
    hero_items: field(key: "hero_items") {
      references(first: 10) {
        nodes {
          ... on Metaobject {
            ...HeroItem
          }
        }
      }
    }
  }
`;
