import {Image, Money} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import type {SectionProductTestimonialFragment} from 'storefrontapi.generated';
import {parseSection} from '~/utils/parseSection';
import {useRef} from 'react';
import useSnapSlider from '~/hooks/useSnapSlider';
import type {CommonProductCardFragment} from 'storefrontapi.generated';

export function SectionProductTestimonial(props: SectionProductTestimonialFragment) {
  const section = parseSection<SectionProductTestimonialFragment, {
    featured_collection?: any;
  }>(props);

  // Debug: Ver todos los campos disponibles
  console.log('SectionProductTestimonial - All section fields:', section);

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
    featured_collection,
    button_text,
    button_background_color,
    button_text_color,
  } = section;

  // Get products from the featured collection
  let products: any[] = [];
  const collection = (featured_collection as any)?.reference;
  
  console.log('SectionProductTestimonial - featured_collection:', featured_collection);
  console.log('SectionProductTestimonial - collection:', collection);
  
  // TEMPORAL: Add example products if no collection found
  if (!collection || !collection.products) {
    console.log('No collection or products found, adding example products for demo');
    products = [
      {
        id: 'demo-product-1',
        title: 'Trotadora Profesional X200',
        handle: 'trotadora-profesional-x200',
        featuredImage: {
          url: 'https://cdn.shopify.com/s/files/1/0553/8637/3264/files/trotadora-placeholder.jpg',
          altText: 'Trotadora Profesional X200',
          width: 400,
          height: 300
        },
        variants: {
          nodes: [
            {
              id: 'demo-variant-1',
              title: 'Default Title',
              availableForSale: true,
              price: {
                amount: '1299900',
                currencyCode: 'COP'
              }
            }
          ]
        },
        priceRange: {
          minVariantPrice: {
            amount: '1299900',
            currencyCode: 'COP'
          }
        }
      },
      {
        id: 'demo-product-2',
        title: 'Set de Mancuernas 20kg',
        handle: 'set-mancuernas-20kg',
        featuredImage: {
          url: 'https://cdn.shopify.com/s/files/1/0553/8637/3264/files/mancuernas-placeholder.jpg',
          altText: 'Set de Mancuernas 20kg',
          width: 400,
          height: 300
        },
        variants: {
          nodes: [
            {
              id: 'demo-variant-2',
              title: 'Default Title',
              availableForSale: true,
              price: {
                amount: '459900',
                currencyCode: 'COP'
              }
            }
          ]
        },
        priceRange: {
          minVariantPrice: {
            amount: '459900',
            currencyCode: 'COP'
          }
        }
      },
      {
        id: 'demo-product-3',
        title: 'Bandas de Resistencia',
        handle: 'bandas-resistencia',
        featuredImage: {
          url: 'https://cdn.shopify.com/s/files/1/0553/8637/3264/files/bandas-placeholder.jpg',
          altText: 'Bandas de Resistencia',
          width: 400,
          height: 300
        },
        variants: {
          nodes: [
            {
              id: 'demo-variant-3',
              title: 'Default Title',
              availableForSale: true,
              price: {
                amount: '89900',
                currencyCode: 'COP'
              }
            }
          ]
        },
        priceRange: {
          minVariantPrice: {
            amount: '89900',
            currencyCode: 'COP'
          }
        }
      }
    ];
  } else {
    // Get products from the actual collection
    products = collection.products?.nodes?.slice(0, 5) || [];
  }
  
  console.log('SectionProductTestimonial - products:', products);
  console.log('SectionProductTestimonial - products length:', products.length);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

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
          className="rounded-xl relative p-8 lg:p-12 xl:p-16 flex flex-col justify-center"
          style={{backgroundColor: leftBg, color: leftText}}
        >
          {/* Brand Title */}
          {brand_title?.value && (
            <h2 
              className="font-headline text-3xl lg:text-4xl xl:text-5xl font-normal mb-6"
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

        {/* Right Side - Collection Carousel with Background Image */}
        <div className="relative flex items-center justify-center p-8 lg:p-12 rounded-xl">
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

          {/* Product Carousel */}
          <div className="relative z-10 w-full max-w-[400px]">
            {products.length > 0 ? (
              <div
                ref={sliderRef}
                className="relative flex gap-4 snap-x snap-mandatory overflow-x-auto"
              >
                {products.slice(0, 5).map((product: any, index: number) => {
                  console.log(`Rendering product ${index}:`, product);
                  const productImage = product.featuredImage;
                  const productTitle = product.title;
                  const productVariant = product.variants?.nodes?.[0];
                  const productPrice = productVariant?.price;
                  const productHandle = product.handle;
                  
                  return (
                    <div
                      key={product.id}
                      className="flex-shrink-0 w-full snap-center"
                    >
                      <div className="bg-[#F6F7F8] rounded-xl shadow-xl p-6 text-left">
                        {/* Product Image */}
                        {productImage && (
                          <div className="mb-4">
                            <Image
                              data={productImage}
                              sizes="400px"
                              className="mix-blend-multiply w-full h-auto object-contain max-h-[200px] rounded-lg"
                            />
                          </div>
                        )}

                        {/* Product Title */}
                        {productTitle && (
                          <h4 className="font-semibold text-md text-slate-900 mb-1">
                            {productTitle}
                          </h4>
                        )}

                        {/* Product Variant/Description */}
                        {productVariant?.title && productVariant.title !== 'Default Title' && (
                          <p className="text-sm text-slate-500 mb-4">
                            {productVariant.title}
                          </p>
                        )}

                        {/* Product Price */}
                        {productPrice && (
                          <p className="text-lg font-semibold text-slate-900 mb-4">
                            <Money data={productPrice} />
                          </p>
                        )}

                        {/* View Product Button */}
                        {productHandle && (
                          <Link
                            to={`/products/${productHandle}`}
                            className="inline-block px-6 py-2 rounded-full border font-medium text-sm transition-all hover:opacity-80"
                            style={{
                              backgroundColor: btnBg,
                              color: btnText,
                              borderColor: btnText,
                            }}
                          >
                            {button_text?.value || 'Ver Producto'}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#F6F7F8] rounded-xl shadow-xl p-6 text-left">
                <p className="text-slate-500 text-center">
                  No hay productos disponibles
                </p>
              </div>
            )}

            {/* Carousel Navigation */}
            {products.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={scrollToPrevSlide}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-all"
                  style={{color: leftText}}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={scrollToNextSlide}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-all"
                  style={{color: leftText}}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

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
    featured_collection: field(key: "featured_collection") {
      type
      key
      reference {
        ... on Collection {
          id
          title
          handle
          description
          image {
            url
            altText
            width
            height
          }
          horizontal_image: metafield(key: "horizontal_image", namespace: "ciseco--collection") {
            reference {
              ... on MediaImage {
                id
                image {
                  altText
                  height
                  width
                  url
                }
              }
            }
          }
          products(first: 5) {
            nodes {
              ...CommonProductCard
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
