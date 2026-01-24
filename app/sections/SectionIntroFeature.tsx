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

  // Image data - handle different possible structures from metaobject
  const imageField = image as any;
  
  // Debug: log full structure
  console.log('SectionIntroFeature DEBUG:', {
    props,
    section,
    image,
    imageField,
    imageFieldReference: imageField?.reference,
    imageFieldReferenceImage: imageField?.reference?.image,
  });
  
  // Try multiple paths to get image URL
  const imageData = imageField?.reference?.image;
  const imageUrl = imageData?.url || imageField?.reference?.image?.url || imageField?.reference?.url;

  return (
    <section 
      id="section-intro-feature" 
      className="nc-SectionIntroFeature py-12 lg:py-20"
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
                  className="font-headline text-3xl lg:text-4xl font-bold mb-6"
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
          </div>

          {/* Image - 70% width */}
          <div className="w-full lg:w-[70%] min-h-[300px] lg:min-h-[500px]">
            {imageUrl ? (
              <div className="relative h-full rounded-2xl overflow-hidden">
                <img
                  src={imageUrl}
                  alt={imageData?.altText || heading?.value || ''}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative h-full rounded-2xl overflow-hidden bg-slate-200 flex items-center justify-center">
                <svg className="w-24 h-24 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="absolute bottom-4 text-sm text-slate-500">No image URL found</span>
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
    text_position: field(key: "text_position") {
      key
      value
    }
  }
`;
