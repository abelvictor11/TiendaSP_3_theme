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
    text_position,
  } = section;

  // Colors with defaults
  const bgColor = background_color?.value || '#FFFFFF';
  const txtColor = text_color?.value || '#1a1a2e';
  const badgeBgColor = badge_background_color?.value || '#1a1a2e';
  const badgeTxtColor = badge_text_color?.value || '#c4ff00';
  const btnBgColor = button_background_color?.value || '#1a1a2e';
  const btnTxtColor = button_text_color?.value || '#FFFFFF';

  // Position: default 'left' means text on left, image on right
  const isTextRight = text_position?.value?.toLowerCase() === 'right';

  // Image data - after parseSection lifts 'reference', structure is image.image
  const imageField = image as any;
  const imageData = imageField?.image;
  const imageUrl = imageData?.url;

  return (
    <section 
      id="section-intro-feature" 
      className="nc-SectionIntroFeature"
      style={{backgroundColor: bgColor}}
    >
      <div className="container">
        <div className={`flex flex-col lg:flex-row gap-6 items-stretch ${isTextRight ? 'lg:flex-row-reverse' : ''}`}>
          {/* Text Content - 30% width */}
          <div 
            className="w-full lg:w-[30%] flex flex-col justify-center p-8"
            style={{ minHeight: '400px' }}
          >
            <div className="flex flex-col justify-center h-full lg:min-h-[500px]">
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
                  className="font-headline text-3xl lg:text-4xl font-normal mb-6"
                  style={{color: txtColor}}
                >
                  {heading.value}
                </h2>
              )}

              {/* Description */}
              {description?.value && (
                <p 
                  className="text-base lg:text-lg leading-relaxed mb-8"
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
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl border border-current transition-all duration-200 hover:opacity-90"
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
          </div>

          {/* Image - 70% width */}
          <div className="w-full lg:w-[70%] min-h-[300px] lg:min-h-[500px]">
            {imageData ? (
              <div className="relative h-full rounded-2xl overflow-hidden">
                <Image
                  data={imageData}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 768px) 100vw, 70vw"
                />
              </div>
            ) : (
              <div className="relative h-full rounded-2xl overflow-hidden bg-slate-200 flex items-center justify-center">
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
          ...MediaImage
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
    text_position: field(key: "text_position") {
      key
      value
    }
  }
`;
