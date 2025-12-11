import {Image} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import type {SectionProductShowcaseFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';
import ProductCard from '~/components/ProductCard';

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
  // parseSection ya hizo lift de 'reference' y 'references', así que accedemos directamente
  const productsFromCollection = (collection as any)?.productsShowcaseSection || (collection as any)?.products;
  const productsFromProducts = (products as any)?.nodes || [];
  
  // Determinar qué fuente de productos usar
  let productsToShow: any[] = [];
  if (productsFromProducts && productsFromProducts.length > 0) {
    productsToShow = productsFromProducts.slice(0, 2);
  } else if (productsFromCollection?.nodes && productsFromCollection.nodes.length > 0) {
    productsToShow = productsFromCollection.nodes.slice(0, 2);
  }

  // Early return si no hay productos
  if (productsToShow.length === 0) {
    return null;
  }

  const bgImage = (background_image as any)?.image?.url;
  const contentBg = content_background_color?.value || '#ffffff';
  const txtColor = text_color?.value || '#000000';
  const cardBg = card_background_color?.value || '#ffffff';
  const cardTxt = card_text_color?.value || '#000000';
  const btnText = button_text?.value || 'VIEW PRODUCT';

  return (
    <section className="nc-SectionProductShowcase relative min-h-[80vh] flex items-center overflow-hidden">
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

      {/* Badge - Posición absoluta arriba a la izquierda */}
      {badge_text?.value && (
        <div className="absolute top-8 left-8 z-20">
          <span className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-full uppercase tracking-wide shadow-lg">
            {badge_text.value}
          </span>
        </div>
      )}

      <div className="container relative z-10 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Content Card */}
          <div className="lg:col-span-5">
            <div
              className="rounded-3xl p-8 lg:p-12 h-full shadow-2xl"
              style={{backgroundColor: contentBg}}
            >

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
              {productsToShow.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showViewProductButton={true}
                  quickAddToCart={true}
                />
              ))}
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
            ...CommonProductCard
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
              ...CommonProductCard
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
