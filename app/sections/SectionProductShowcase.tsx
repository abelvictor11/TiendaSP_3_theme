import {Image} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import type {SectionProductShowcaseFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';

export function SectionProductShowcase(props: SectionProductShowcaseFragment) {
  const section = parseSection<SectionProductShowcaseFragment, {}>(props);

  const {
    heading,
    subheading,
    description,
    icon_svg,
    badge_text,
    background_image,
    content_background_color,
    text_color,
    products,
    collection,
    card_background_color,
    card_text_color,
    button_text,
  } = section;

  // Get products from either direct products or collection
  // Fallback para compatibilidad con secciones antiguas
  const productsFromCollection = collection?.reference?.productsShowcaseSection || (collection?.reference as any)?.products;
  const productsToShow =
    products?.references?.nodes?.slice(0, 2) ||
    productsFromCollection?.nodes?.slice(0, 2) ||
    [];

  const bgImage = background_image?.reference?.image?.url;
  const contentBg = content_background_color?.value || '#ffffff';
  const txtColor = text_color?.value || '#000000';
  const cardBg = card_background_color?.value || '#ffffff';
  const cardTxt = card_text_color?.value || '#000000';
  const btnText = button_text?.value || 'VIEW PRODUCT';

  return (
    <section className="nc-SectionProductShowcase relative py-16 lg:py-24 overflow-hidden">
      {/* Background Image */}
      {bgImage && (
        <div className="absolute inset-0 w-full h-full">
          <img
            src={bgImage}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Content Card */}
          <div className="lg:col-span-5">
            <div
              className="rounded-2xl p-8 lg:p-10 h-full"
              style={{backgroundColor: contentBg}}
            >
              {/* Badge */}
              {badge_text?.value && (
                <div className="inline-block mb-6">
                  <span className="px-4 py-2 bg-neutral-800 text-white text-xs font-semibold rounded-full uppercase tracking-wide">
                    {badge_text.value}
                  </span>
                </div>
              )}

              {/* Heading */}
              {heading?.value && (
                <h2
                  className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-6"
                  style={{color: txtColor}}
                >
                  {heading.value}
                </h2>
              )}

              {/* Icon */}
              {icon_svg?.value && (
                <div
                  className="w-12 h-12 mb-4"
                  dangerouslySetInnerHTML={{__html: icon_svg.value}}
                  style={{color: txtColor}}
                />
              )}

              {/* Subheading */}
              {subheading?.value && (
                <h3
                  className="text-lg font-semibold mb-4 uppercase tracking-wide"
                  style={{color: txtColor}}
                >
                  {subheading.value}
                </h3>
              )}

              {/* Description */}
              {description?.value && (
                <p
                  className="text-base leading-relaxed"
                  style={{color: txtColor}}
                >
                  {description.value}
                </p>
              )}
            </div>
          </div>

          {/* Right Product Cards */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {productsList.map((product: any) => {
                const productImage = product?.featuredImage;
                return (
                  <div
                    key={product.id}
                    className="rounded-2xl p-6 lg:p-8 flex flex-col"
                    style={{backgroundColor: cardBg}}
                  >
                    {/* Product Image */}
                    {productImage && (
                      <div className="relative aspect-square mb-6 rounded-xl overflow-hidden bg-neutral-100">
                        <Image
                          data={productImage}
                          className="absolute inset-0 w-full h-full object-contain p-4"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex-grow">
                      <h3
                        className="text-xl font-bold mb-2"
                        style={{color: cardTxt}}
                      >
                        {product.title}
                      </h3>
                      {product.description && (
                        <p
                          className="text-sm mb-4"
                          style={{color: cardTxt, opacity: 0.7}}
                        >
                          {product.description.substring(0, 60)}
                          {product.description.length > 60 ? '...' : ''}
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Link to={`/products/${product.handle}`}>
                      <button
                        className="w-full px-6 py-3 border-2 rounded-lg font-semibold uppercase text-sm tracking-wide transition-all hover:bg-neutral-900 hover:text-white hover:border-neutral-900"
                        style={{
                          borderColor: cardTxt,
                          color: cardTxt,
                        }}
                      >
                        {btnText}
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const SECTION_PRODUCT_SHOWCASE_FRAGMENT = `#graphql
  fragment SectionProductShowcase on Metaobject {
    type
    id
    heading: field(key: "heading") {
      type
      key
      value
    }
    subheading: field(key: "subheading") {
      type
      key
      value
    }
    description: field(key: "description") {
      type
      key
      value
    }
    icon_svg: field(key: "icon_svg") {
      type
      key
      value
    }
    badge_text: field(key: "badge_text") {
      type
      key
      value
    }
    background_image: field(key: "background_image") {
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
    content_background_color: field(key: "content_background_color") {
      type
      key
      value
    }
    text_color: field(key: "text_color") {
      type
      key
      value
    }
    products: field(key: "products") {
      references(first: 2) {
        nodes {
          ... on Product {
            id
            handle
            title
            description
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
    collection: field(key: "collection") {
      type
      key
      reference {
        ... on Collection {
          id
          handle
          title
          productsShowcaseSection: products(first: 2) {
            nodes {
              id
              handle
              title
              description
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
    card_background_color: field(key: "card_background_color") {
      type
      key
      value
    }
    card_text_color: field(key: "card_text_color") {
      type
      key
      value
    }
    button_text: field(key: "button_text") {
      type
      key
      value
    }
  }
` as const;
