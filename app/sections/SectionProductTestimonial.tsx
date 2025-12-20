import {Image, Money} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import type {SectionProductTestimonialFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';

export function SectionProductTestimonial(props: SectionProductTestimonialFragment) {
  const section = parseSection<SectionProductTestimonialFragment, {}>(props);

  const {
    brand_title,
    quote_text,
    author_name,
    author_title,
    author_image,
    icon_svg,
    subtitle,
    description,
    left_background_color,
    left_text_color,
    right_background_image,
    featured_product,
    button_text,
    button_background_color,
    button_text_color,
  } = section;

  // Get product data
  const product = (featured_product as any);
  const productImage = product?.featuredImage;
  const productTitle = product?.title;
  const productVariant = product?.variants?.nodes?.[0];
  const productPrice = productVariant?.price;
  const productHandle = product?.handle;

  // Colors
  const leftBg = left_background_color?.value || '#87CEEB';
  const leftText = left_text_color?.value || '#000000';
  const btnBg = button_background_color?.value || '#ffffff';
  const btnText = button_text_color?.value || '#000000';
  const authorImg = (author_image as any)?.image?.url;
  const rightBgImg = (right_background_image as any)?.image?.url;

  return (
    <section id="section-product-testimonial" className="nc-SectionProductTestimonial">
      <div className="container rounded-xl grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-[700px]">
        {/* Left Side - Testimonial */}
        <div 
          className="relative p-8 lg:p-12 xl:p-16 flex flex-col justify-center"
          style={{backgroundColor: leftBg, color: leftText}}
        >
          {/* Brand Title */}
          {brand_title?.value && (
            <h2 
              className="font-headline text-3xl lg:text-4xl xl:text-5xl font-bold mb-6"
              style={{color: leftText}}
            >
              {brand_title.value}
            </h2>
          )}

          {/* Quote */}
          {quote_text?.value && (
            <blockquote 
              className="text-xl lg:text-2xl xl:text-3xl font-medium italic leading-relaxed mb-8"
              style={{color: leftText}}
            >
              "{quote_text.value}"
            </blockquote>
          )}

          {/* Author */}
          {(author_name?.value || author_title?.value) && (
            <div className="flex items-center gap-4 mb-8">
              {authorImg && (
                <img 
                  src={authorImg} 
                  alt={author_name?.value || 'Author'} 
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                {author_name?.value && (
                  <p className="font-bold" style={{color: leftText}}>
                    {author_name.value}
                  </p>
                )}
                {author_title?.value && (
                  <p className="text-sm opacity-80" style={{color: leftText}}>
                    {author_title.value}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Icon */}
          {icon_svg?.value && (
            <div 
              className="w-10 h-10 mb-6"
              dangerouslySetInnerHTML={{__html: icon_svg.value}}
              style={{color: leftText}}
            />
          )}

          {/* Subtitle */}
          {subtitle?.value && (
            <h3 
              className="text-sm font-bold uppercase tracking-wider mb-3"
              style={{color: leftText}}
            >
              {subtitle.value}
            </h3>
          )}

          {/* Description */}
          {description?.value && (
            <p 
              className="text-base leading-relaxed opacity-90"
              style={{color: leftText}}
            >
              {description.value}
            </p>
          )}
        </div>

        {/* Right Side - Product with Background Image */}
        <div className="relative flex items-center justify-center p-8 lg:p-12">
          {/* Background Image */}
          {rightBgImg && (
            <div className="absolute inset-0">
              <img 
                src={rightBgImg} 
                alt="" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Product Card */}
          {product && (
            <div className="relative z-10 bg-[#F6F7F8] rounded-xl shadow-xl p-6 max-w-[300px] text-center">
              {/* Product Image */}
              {productImage && (
                <div className="mb-4">
                  <Image
                    data={productImage}
                    sizes="300px"
                    className="w-full h-auto object-contain max-h-[200px]"
                  />
                </div>
              )}

              {/* Product Title */}
              {productTitle && (
                <h4 className="font-bold text-lg text-slate-900 mb-1">
                  {productTitle}
                </h4>
              )}

              {/* Product Variant/Description */}
              {productVariant?.title && productVariant.title !== 'Default Title' && (
                <p className="text-sm text-slate-500 mb-4">
                  {productVariant.title}
                </p>
              )}

              {/* View Product Button */}
              {productHandle && (
                <Link
                  to={`/products/${productHandle}`}
                  className="inline-block px-6 py-2 rounded-full border-2 font-medium text-sm transition-all hover:opacity-80"
                  style={{
                    backgroundColor: btnBg,
                    color: btnText,
                    borderColor: btnText,
                  }}
                >
                  {button_text?.value || 'View Product'}
                </Link>
              )}
            </div>
          )}

          {/* Decorative Icon Bottom Right */}
          {icon_svg?.value && (
            <div 
              className="absolute bottom-8 right-8 w-8 h-8 opacity-80"
              dangerouslySetInnerHTML={{__html: icon_svg.value}}
              style={{color: '#c8e600'}}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export const SECTION_PRODUCT_TESTIMONIAL_FRAGMENT = `#graphql
  fragment SectionProductTestimonial on Metaobject {
    type
    id
    brand_title: field(key: "brand_title") {
      type
      key
      value
    }
    quote_text: field(key: "quote_text") {
      type
      key
      value
    }
    author_name: field(key: "author_name") {
      type
      key
      value
    }
    author_title: field(key: "author_title") {
      type
      key
      value
    }
    author_image: field(key: "author_image") {
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
    icon_svg: field(key: "icon_svg") {
      type
      key
      value
    }
    subtitle: field(key: "subtitle") {
      type
      key
      value
    }
    description: field(key: "description") {
      type
      key
      value
    }
    left_background_color: field(key: "left_background_color") {
      type
      key
      value
    }
    left_text_color: field(key: "left_text_color") {
      type
      key
      value
    }
    right_background_image: field(key: "right_background_image") {
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
    featured_product: field(key: "featured_product") {
      type
      key
      reference {
        ... on Product {
          id
          title
          handle
          featuredImage {
            url
            altText
            width
            height
          }
          variants(first: 1) {
            nodes {
              id
              title
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
    button_text: field(key: "button_text") {
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
  }
` as const;
