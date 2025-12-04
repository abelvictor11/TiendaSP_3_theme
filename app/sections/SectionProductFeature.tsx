import {Image} from '@shopify/hydrogen';
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
    product,
    collection,
    background_color,
    text_color,
    button_background_color,
    button_text_color,
    image_position,
  } = section;

  // Prioridad: banner_image > product > collection
  const customImage = (banner_image as any)?.image?.url;
  const productsFromCollection = (collection as any)?.productsFeatureSection || (collection as any)?.products;
  const featuredProduct = product || productsFromCollection?.nodes?.[0];
  const productImage = featuredProduct?.featuredImage;
  
  // Usar imagen personalizada o imagen de producto como fallback
  const displayImage = customImage || productImage?.url;
  
  // Early return si no hay ni imagen ni contenido
  if (!displayImage && !heading?.value) {
    return null;
  }

  const bgColor = background_color?.value || '#00bcd4';
  const txtColor = text_color?.value || '#ffffff';
  const btnBgColor = button_background_color?.value || '#ffffff';
  const btnTxtColor = button_text_color?.value || '#000000';
  const imageOnLeft = image_position?.value === 'left';

  return (
    <section className="nc-SectionProductFeature py-16 lg:py-24">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-0 rounded-3xl overflow-hidden shadow-2xl">
          {/* Image Side - 60% */}
          <div className={`relative lg:col-span-6 ${imageOnLeft ? 'lg:order-1' : 'lg:order-2'}`}>
            {displayImage && (
              <div className="relative h-full min-h-[400px] lg:min-h-[500px] bg-neutral-100">
                {customImage ? (
                  <img
                    src={displayImage}
                    alt={heading?.value || 'Banner'}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : productImage ? (
                  <Image
                    data={productImage}
                    className="absolute inset-0 w-full h-full object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                ) : null}
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
                  className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight"
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
                      className="px-8 py-3 rounded-full font-bold uppercase text-xs tracking-wider transition-all hover:shadow-xl hover:scale-105"
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
    product: field(key: "product") {
      type
      key
      reference {
        ... on Product {
          id
          handle
          title
          featuredImage {
            url
            altText
            width
            height
          }
        }
      }
    }
    collection: field(key: "collection") {
      type
      key
      reference {
        ... on Collection {
          id
          handle
          title
          productsFeatureSection: products(first: 1) {
            nodes {
              id
              handle
              title
              featuredImage {
                url
                altText
                width
                height
              }
            }
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
