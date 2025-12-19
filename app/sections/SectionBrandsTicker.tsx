import {Link} from '@remix-run/react';

export function SectionBrandsTicker(props: any) {
  const {
    title,
    brands,
    background_color,
    speed,
  } = props;

  const bgColor = background_color?.value || '#ffffff';
  const animationSpeed = speed?.value || '30'; // seconds

  // Parse brands data - comes from references
  const brandsData = brands?.references?.nodes || [];

  if (brandsData.length === 0) {
    return null;
  }

  // Duplicate brands for seamless loop
  const duplicatedBrands = [...brandsData, ...brandsData];

  return (
    <section 
      className="nc-SectionBrandsTicker py-8 lg:py-12 overflow-hidden"
      style={{backgroundColor: bgColor}}
    >
      {/* Title */}
      {title?.value && (
        <div className="container mb-6">
          <h2 className="text-lg font-semibold text-center text-slate-600">
            {title.value}
          </h2>
        </div>
      )}

      {/* Ticker Container */}
      <div className="relative">
        <div 
          className="flex items-center gap-16 animate-ticker"
          style={{
            animationDuration: `${animationSpeed}s`,
          }}
        >
          {duplicatedBrands.map((brand: any, index: number) => {
            const svgContent = brand.svg_logo?.value;
            const imageUrl = brand.image_logo?.reference?.image?.url;
            const brandUrl = brand.url?.value;
            const brandName = brand.name?.value || `Brand ${index}`;

            const BrandContent = () => (
              <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                {svgContent ? (
                  <div 
                    className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
                    dangerouslySetInnerHTML={{__html: svgContent}}
                  />
                ) : imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={brandName}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-500">{brandName}</span>
                )}
              </div>
            );

            return brandUrl ? (
              <Link 
                key={`${brand.id}-${index}`}
                to={brandUrl}
                className="flex-shrink-0"
                prefetch="viewport"
              >
                <BrandContent />
              </Link>
            ) : (
              <div key={`${brand.id}-${index}`} className="flex-shrink-0">
                <BrandContent />
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker linear infinite;
          width: max-content;
        }
      `}</style>
    </section>
  );
}

export const SECTION_BRANDS_TICKER_FRAGMENT = `#graphql
  fragment SectionBrandsTicker on Metaobject {
    type
    id
    title: field(key: "title") {
      type
      key
      value
    }
    background_color: field(key: "background_color") {
      type
      key
      value
    }
    speed: field(key: "speed") {
      type
      key
      value
    }
    brands: field(key: "brands") {
      references(first: 20) {
        nodes {
          ... on Metaobject {
            id
            type
            name: field(key: "name") {
              value
            }
            svg_logo: field(key: "svg_logo") {
              value
            }
            image_logo: field(key: "image_logo") {
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
            url: field(key: "url") {
              value
            }
          }
        }
      }
    }
  }
` as const;
