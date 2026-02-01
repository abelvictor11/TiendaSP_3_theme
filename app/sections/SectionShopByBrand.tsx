import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {parseSection} from '~/utils/parseSection';
import {useRef, useState, useEffect} from 'react';
import useSnapSlider from '~/hooks/useSnapSlider';
import {ArrowRightIcon} from '@heroicons/react/24/outline';

interface SectionShopByBrandProps {
  type: string;
  id: string;
  heading?: { value?: string };
  show_all_text?: { value?: string };
  show_all_link?: { value?: string };
  background_color?: { value?: string };
  heading_color?: { value?: string };
  brands?: {
    references?: {
      nodes?: Array<{
        id: string;
        title?: { value?: string };
        logo_svg?: { value?: string };
        logo_image?: { reference?: { image?: any } };
        image?: { reference?: { image?: any } };
        link?: { value?: string };
        background_color?: { value?: string };
      }>;
    };
  };
}

export function SectionShopByBrand(props: SectionShopByBrandProps) {
  const {
    heading,
    show_all_text,
    show_all_link,
    brands,
    background_color,
    heading_color,
  } = props;

  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    
    const handleScroll = () => {
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      const progress = maxScroll > 0 ? slider.scrollLeft / maxScroll : 0;
      setScrollProgress(progress);
    };
    
    slider.addEventListener('scroll', handleScroll);
    return () => slider.removeEventListener('scroll', handleScroll);
  }, []);

  const brandNodes = brands?.references?.nodes || [];

  if (!brandNodes.length) return null;

  return (
    <section 
      className="nc-SectionShopByBrand"
      style={background_color?.value ? {backgroundColor: background_color.value} : undefined}
    >
      <div className="container-fluid">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 
            className="container font-headline text-2xl md:text-3xl font-normal"
            style={heading_color?.value ? {color: heading_color.value} : undefined}
          >
            {heading?.value || 'Shop by Brand'}
          </h2>
          {show_all_link?.value && (
            <Link
              to={show_all_link.value}
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-black transition-colors"
            >
              {show_all_text?.value || 'Show all'}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Brands Grid/Slider */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory hiddenScrollbar pb-4"
          >
            {brandNodes.map((brand, index: number) => {
              const logoSvg = brand.logo_svg?.value;
              const logoImage = brand.logo_image?.reference?.image;
              const backgroundImage = (brand as any).image?.reference?.image;
              const link = brand.link?.value || '#';

              return (
                <Link
                  key={brand.id || index}
                  to={link}
                  className="snap-start shrink-0 group"
                >
                  <div className="relative w-[200px] sm:w-[240px] lg:w-[280px] aspect-[3/4] rounded-xl overflow-hidden">
                    {/* Background Image */}
                    {backgroundImage ? (
                      <Image
                        data={backgroundImage}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 200px, (max-width: 1024px) 240px, 280px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-200" />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                    
                    {/* Logo SVG or Image */}
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      {logoSvg ? (
                        <div 
                          className="w-full h-full flex items-center justify-center *:max-w-full *:max-h-full *:w-auto *:h-auto"
                          dangerouslySetInnerHTML={{__html: logoSvg}}
                        />
                      ) : logoImage ? (
                        <Image
                          data={logoImage}
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                          sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 220px"
                        />
                      ) : (
                        <h3 className="text-white text-lg sm:text-xl font-medium text-center">
                          {brand.title?.value || 'Brand'}
                        </h3>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-0.5 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-neutral-900 transition-all duration-300"
                style={{width: `${Math.max(scrollProgress * 100, 10)}%`}}
              />
            </div>
            <button
              onClick={scrollToNextSlide}
              className="p-2 rounded-full border border-neutral-300 hover:border-neutral-900 transition-colors"
              aria-label="Next"
            >
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export const SECTION_SHOP_BY_BRAND_FRAGMENT = `#graphql
  fragment SectionShopByBrand on Metaobject {
    type
    id
    heading: field(key: "heading") {
      key
      value
    }
    show_all_text: field(key: "show_all_text") {
      key
      value
    }
    show_all_link: field(key: "show_all_link") {
      key
      value
    }
    background_color: field(key: "background_color") {
      key
      value
    }
    heading_color: field(key: "heading_color") {
      key
      value
    }
    brands: field(key: "brands") {
      key
      references(first: 20) {
        nodes {
          ... on Metaobject {
            id
            type
            title: field(key: "title") {
              key
              value
            }
            logo_svg: field(key: "logo_svg") {
              key
              value
            }
            logo_image: field(key: "logo_image") {
              key
              reference {
                ... on MediaImage {
                  image {
                    altText
                    url
                    width
                    height
                  }
                }
              }
            }
            link: field(key: "link") {
              key
              value
            }
            background_color: field(key: "background_color") {
              key
              value
            }
            image: field(key: "image") {
              key
              reference {
                ... on MediaImage {
                  image {
                    altText
                    url
                    width
                    height
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
