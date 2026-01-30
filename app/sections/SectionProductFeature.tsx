import {Link} from '@remix-run/react';
import type {SectionProductFeatureFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';

export function SectionProductFeature(props: SectionProductFeatureFragment) {
  const section = parseSection<SectionProductFeatureFragment, {}>(props);

  const {
    heading,
    description,
    cta_text,
    cta_link,
    banner_image,
    background_color,
    text_color,
    button_background_color,
    button_text_color,
    image_position,
  } = section;

  // Solo usar banner_image personalizada
  const displayImage = (banner_image as any)?.image?.url;
  
  // Early return si no hay imagen o contenido
  if (!displayImage && !heading?.value) {
    return null;
  }

  const bgColor = background_color?.value || '#00bcd4';
  const txtColor = text_color?.value || '#ffffff';
  const btnBgColor = button_background_color?.value || '#ffffff';
  const btnTxtColor = button_text_color?.value || '#000000';
  const imageOnLeft = image_position?.value === 'left';

  return (
    <section className="nc-SectionProductFeature py-10 lg:py-16">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-0 rounded-xl overflow-hidden">
          {/* Image Side - 60% */}
          <div className={`relative lg:col-span-6 ${imageOnLeft ? 'lg:order-1' : 'lg:order-2'}`}>
            {displayImage && (
              <div className="relative h-full min-h-[400px] lg:min-h-[500px] bg-neutral-100">
                <img
                  src={displayImage}
                  alt={heading?.value || 'Banner'}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Content Side - 40% */}
          <div
            className={`relative lg:col-span-4 p-8 lg:p-12 flex flex-col justify-center ${imageOnLeft ? 'lg:order-2' : 'lg:order-1'}`}
            style={{backgroundColor: bgColor}}
          >
            <div className="space-y-6">
              {/* Heading */}
              {heading?.value && (
                <h2
                  className="font-headline text-3xl lg:text-4xl xl:text-5xl font-normal leading-tight"
                  style={{color: txtColor}}
                >
                  {heading.value}
                </h2>
              )}

              {/* Description */}
              {description?.value && (
                <p
                  className="text-base lg:text-lg leading-relaxed"
                  style={{color: txtColor}}
                >
                  {description.value}
                </p>
              )}

              {/* CTA Button */}
              {cta_text?.value && cta_link?.value && (
                <div className="pt-2">
                  <Link to={cta_link.value}>
                    <button
                      className="px-6 py-3 lg:px-8 lg:py-4 rounded-full text-sm sm:text-base lg:text-lg font-medium shadow-xl transition-all hover:shadow-2xl hover:scale-105"
                      style={{
                        backgroundColor: btnBgColor,
                        color: btnTxtColor,
                      }}
                    >
                      {cta_text.value}
                    </button>
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

export const SECTION_PRODUCT_FEATURE_FRAGMENT = `#graphql
  fragment SectionProductFeature on Metaobject {
    type
    id
    heading: field(key: "heading") {
      type
      key
      value
    }
    description: field(key: "description") {
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
    banner_image: field(key: "banner_image") {
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
    text_color: field(key: "text_color") {
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
    image_position: field(key: "image_position") {
      type
      key
      value
    }
  }
` as const;
