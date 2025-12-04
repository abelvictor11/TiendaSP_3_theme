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
    product,
    collection,
    background_color,
    text_color,
    button_background_color,
    button_text_color,
    image_position,
  } = section;

  // Get product from either direct product or collection's first product
  // Fallback para compatibilidad con secciones antiguas
  const productsFromCollection = (collection?.reference as any)?.productsFeatureSection || (collection?.reference as any)?.products;
  const featuredProduct = (product?.reference as any) || productsFromCollection?.nodes?.[0];
  
  // Early return si no hay producto
  if (!featuredProduct) {
    return null;
  }
  
  const productImage = featuredProduct?.featuredImage;

  const bgColor = background_color?.value || '#00bcd4';
  const txtColor = text_color?.value || '#ffffff';
  const btnBgColor = button_background_color?.value || '#ffffff';
  const btnTxtColor = button_text_color?.value || '#000000';
  const imageOnLeft = image_position?.value === 'left';

  return (
    <section className="nc-SectionProductFeature py-16 lg:py-24">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Image Side */}
          <div className={`relative ${imageOnLeft ? 'lg:order-1' : 'lg:order-2'}`}>
            {productImage && (
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
                <Image
                  data={productImage}
                  className="absolute inset-0 w-full h-full object-contain p-8"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </div>

          {/* Content Side */}
          <div
            className={`relative rounded-3xl p-8 lg:p-12 ${imageOnLeft ? 'lg:order-2' : 'lg:order-1'}`}
            style={{backgroundColor: bgColor}}
          >
            <div className="space-y-6">
              {/* Heading */}
              {heading?.value && (
                <h2
                  className="text-3xl lg:text-4xl xl:text-5xl font-bold"
                  style={{color: txtColor}}
                >
                  {heading.value}
                </h2>
              )}

              {/* Description */}
              {description?.value && (
                <p
                  className="text-base lg:text-lg leading-relaxed max-w-lg"
                  style={{color: txtColor}}
                >
                  {description.value}
                </p>
              )}

              {/* CTA Button */}
              {cta_text?.value && cta_link?.value && (
                <div>
                  <Link to={cta_link.value}>
                    <button
                      className="px-8 py-3 rounded-full font-semibold uppercase text-sm tracking-wide transition-all hover:shadow-xl hover:scale-105"
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
