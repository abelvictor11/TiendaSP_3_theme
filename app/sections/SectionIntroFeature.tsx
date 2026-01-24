import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import type {SectionIntroFeatureFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';

export function SectionIntroFeature(props: SectionIntroFeatureFragment) {
  const section = parseSection<SectionIntroFeatureFragment, {}>(props);

  const {
    badge_text,
    heading,
    description,
    button_text,
    button_link,
    image,
    background_color,
    text_color,
    badge_background_color,
    badge_text_color,
    button_background_color,
    button_text_color,
  } = section;

  // Colors with defaults
  const bgColor = background_color?.value || '#FFFFFF';
  const txtColor = text_color?.value || '#1a1a2e';
  const badgeBgColor = badge_background_color?.value || '#1a1a2e';
  const badgeTxtColor = badge_text_color?.value || '#c4ff00';
  const btnBgColor = button_background_color?.value || '#1a1a2e';
  const btnTxtColor = button_text_color?.value || '#FFFFFF';

  // Image data
  const imageData = (image as any)?.reference?.image;

  return (
    <section 
      id="section-intro-feature" 
      className="nc-SectionIntroFeature py-12 lg:py-20"
      style={{backgroundColor: bgColor}}
    >
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1 flex flex-col justify-center">
            {/* Badge */}
            {badge_text?.value && (
              <div className="mb-6">
                <span 
                  className="inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: badgeBgColor,
                    color: badgeTxtColor,
                  }}
                >
                  {badge_text.value}
                </span>
              </div>
            )}

            {/* Heading */}
            {heading?.value && (
              <h2 
                className="font-headline text-3xl lg:text-4xl xl:text-5xl font-bold mb-6"
                style={{color: txtColor}}
              >
                {heading.value}
              </h2>
            )}

            {/* Description */}
            {description?.value && (
              <p 
                className="text-base lg:text-lg leading-relaxed mb-8 max-w-lg"
                style={{color: txtColor, opacity: 0.85}}
              >
                {description.value}
              </p>
            )}

            {/* Button */}
            {button_text?.value && (
              <div>
                <Link
                  to={button_link?.value || '#'}
                  className="inline-block px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all hover:opacity-90 hover:scale-105"
                  style={{
                    backgroundColor: btnBgColor,
                    color: btnTxtColor,
                  }}
                >
                  {button_text.value}
                </Link>
              </div>
            )}
          </div>

          {/* Right Image */}
          <div className="order-1 lg:order-2">
            {imageData ? (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  data={imageData}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-200 aspect-video flex items-center justify-center">
                <svg className="w-24 h-24 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export const SECTION_INTRO_FEATURE_FRAGMENT = `#graphql
  fragment SectionIntroFeature on Metaobject {
    type
    id
    badge_text: field(key: "badge_text") {
      key
      value
    }
    heading: field(key: "heading") {
      key
      value
    }
    description: field(key: "description") {
      key
      value
    }
    button_text: field(key: "button_text") {
      key
      value
    }
    button_link: field(key: "button_link") {
      key
      value
    }
    image: field(key: "image") {
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
      key
      value
    }
    text_color: field(key: "text_color") {
      key
      value
    }
    badge_background_color: field(key: "badge_background_color") {
      key
      value
    }
    badge_text_color: field(key: "badge_text_color") {
      key
      value
    }
    button_background_color: field(key: "button_background_color") {
      key
      value
    }
    button_text_color: field(key: "button_text_color") {
      key
      value
    }
  }
`;
