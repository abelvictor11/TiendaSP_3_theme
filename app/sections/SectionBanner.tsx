import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import clsx from 'clsx';

interface SectionBannerProps {
  type: string;
  id: string;
  heading?: { value?: string };
  subheading?: { value?: string };
  text_align?: { value?: 'left' | 'center' | 'right' };
  desktop_image?: { reference?: { image?: any } };
  mobile_image?: { reference?: { image?: any } };
  cta_text?: { value?: string };
  cta_link?: { value?: string };
  heading_color?: { value?: string };
  subheading_color?: { value?: string };
  button_bg_color?: { value?: string };
  button_text_color?: { value?: string };
  overlay_opacity?: { value?: string };
  min_height?: { value?: string };
}

export function SectionBanner(props: SectionBannerProps) {
  const {
    heading,
    subheading,
    text_align,
    desktop_image,
    mobile_image,
    cta_text,
    cta_link,
    heading_color,
    subheading_color,
    button_bg_color,
    button_text_color,
    overlay_opacity,
    min_height,
  } = props;

  const desktopImg = desktop_image?.reference?.image;
  const mobileImg = mobile_image?.reference?.image || desktopImg;
  const alignment = text_align?.value || 'left';
  const overlayOpacity = overlay_opacity?.value ? parseInt(overlay_opacity.value) / 100 : 0.3;
  const minHeightValue = min_height?.value ? `${min_height.value}px` : '400px';

  const alignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  const containerAlignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <section className="nc-SectionBanner relative overflow-hidden">
      <div 
        className="relative w-full"
        style={{ minHeight: minHeightValue }}
      >
        {/* Desktop Image */}
        {desktopImg && (
          <div className="hidden lg:block absolute inset-0">
            <Image
              data={desktopImg}
              className="w-full h-full object-cover"
              sizes="100vw"
            />
          </div>
        )}

        {/* Mobile Image */}
        {mobileImg && (
          <div className="block lg:hidden absolute inset-0">
            <Image
              data={mobileImg}
              className="w-full h-full object-cover"
              sizes="100vw"
            />
          </div>
        )}

        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />

        {/* Content */}
        <div 
          className={clsx(
            'relative z-10 h-full flex',
            containerAlignmentClasses[alignment]
          )}
          style={{ minHeight: minHeightValue }}
        >
          <div className="container py-12 lg:py-16 flex items-center">
            <div 
              className={clsx(
                'flex flex-col gap-4 lg:gap-6 max-w-xl',
                alignmentClasses[alignment]
              )}
            >
              {heading?.value && (
                <h2 
                  className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight"
                  style={{ color: heading_color?.value || '#ffffff' }}
                  dangerouslySetInnerHTML={{ __html: heading.value }}
                />
              )}

              {subheading?.value && (
                <p 
                  className="text-sm sm:text-base lg:text-lg leading-relaxed max-w-md"
                  style={{ color: subheading_color?.value || '#ffffff' }}
                  dangerouslySetInnerHTML={{ __html: subheading.value }}
                />
              )}

              {cta_text?.value && cta_link?.value && (
                <div className="mt-2">
                  <Link
                    to={cta_link.value}
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl border border-current transition-all duration-200 hover:opacity-90"
                    style={{
                      backgroundColor: button_bg_color?.value || 'transparent',
                      color: button_text_color?.value || '#ffffff',
                      borderColor: button_text_color?.value || '#ffffff',
                    }}
                  >
                    {cta_text.value}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const SECTION_BANNER_FRAGMENT = `#graphql
  fragment SectionBanner on Metaobject {
    type
    id
    heading: field(key: "heading") {
      key
      value
    }
    subheading: field(key: "subheading") {
      key
      value
    }
    text_align: field(key: "text_align") {
      key
      value
    }
    desktop_image: field(key: "desktop_image") {
      key
      reference {
        ... on MediaImage {
          image {
            altText
            url
            width
            height
          }
        }
      }
    }
    mobile_image: field(key: "mobile_image") {
      key
      reference {
        ... on MediaImage {
          image {
            altText
            url
            width
            height
          }
        }
      }
    }
    cta_text: field(key: "cta_text") {
      key
      value
    }
    cta_link: field(key: "cta_link") {
      key
      value
    }
    heading_color: field(key: "heading_color") {
      key
      value
    }
    subheading_color: field(key: "subheading_color") {
      key
      value
    }
    button_bg_color: field(key: "button_bg_color") {
      key
      value
    }
    button_text_color: field(key: "button_text_color") {
      key
      value
    }
    overlay_opacity: field(key: "overlay_opacity") {
      key
      value
    }
    min_height: field(key: "min_height") {
      key
      value
    }
  }
`;
