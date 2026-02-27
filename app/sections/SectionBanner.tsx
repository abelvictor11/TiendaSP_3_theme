import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import type {SectionBannerFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';

export function SectionBanner(props: SectionBannerFragment) {
  const section = parseSection<SectionBannerFragment, {}>(props);

  const {
    heading,
    sub_heading,
    image,
    cta_button,
    background_color,
    text_color,
  } = section;

  const bgColor = background_color?.value || '#f5f5f5';
  const txtColor = text_color?.value || '#171717';

  // Image data
  const imageField = image as any;
  const imageData = imageField?.image;

  // CTA button - references a ciseco--link metaobject
  const ctaText = cta_button?.text?.value || cta_button?.title?.value;
  const ctaHref = cta_button?.href?.value || '#';

  return (
    <section
      className="nc-SectionBanner"
      style={{backgroundColor: bgColor}}
    >
      <div className="container py-12 lg:py-20">
        <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Text Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            {heading?.value && (
              <h2
                className="font-headline text-3xl md:text-4xl lg:text-5xl font-normal mb-4"
                style={{color: txtColor}}
              >
                {heading.value}
              </h2>
            )}

            {sub_heading?.value && (
              <p
                className="text-base lg:text-lg mb-8 max-w-lg mx-auto lg:mx-0"
                style={{color: txtColor, opacity: 0.8}}
              >
                {sub_heading.value}
              </p>
            )}

            {ctaText && (
              <Link
                to={ctaHref}
                className="inline-block px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all hover:opacity-90 hover:scale-105 bg-neutral-900 text-white"
              >
                {ctaText}
              </Link>
            )}
          </div>

          {/* Image */}
          <div className="w-full lg:w-1/2">
            {imageData ? (
              <div className="relative rounded-2xl overflow-hidden">
                <Image
                  data={imageData}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-slate-200 aspect-[4/3] flex items-center justify-center">
                <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export const SECTION_BANNER_FRAGMENT = `#graphql
  fragment SectionBanner on Metaobject {
    type
    id
    heading: field(key: "heading") {
      key
      value
    }
    sub_heading: field(key: "sub_heading") {
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
    cta_button: field(key: "cta_button") {
      key
      reference {
        ... on Metaobject {
          id
          type
          title: field(key: "title") {
            value
          }
          text: field(key: "text") {
            value
          }
          href: field(key: "href") {
            value
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
  }
`;
