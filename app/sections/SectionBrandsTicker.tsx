import {Link} from '@remix-run/react';
import {useMemo} from 'react';

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

  // Calculate how many times to repeat brands to fill the screen
  // Each brand takes ~160px (128px width + 32px gap)
  // We need at least 2 full sets for seamless loop, but more if there are few brands
  const minBrandsForFullWidth = 12; // Minimum brands to fill ~1920px screen
  const repeatCount = Math.max(2, Math.ceil(minBrandsForFullWidth / brandsData.length) * 2);
  
  // Create repeated brands array
  const repeatedBrands = useMemo(() => {
    const result = [];
    for (let i = 0; i < repeatCount; i++) {
      result.push(...brandsData);
    }
    return result;
  }, [brandsData, repeatCount]);

  const renderBrandItem = (brand: any, index: number) => {
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
  };

  // Calculate animation duration based on number of brands
  // More brands = longer duration to maintain consistent speed
  const baseDuration = Number(animationSpeed);
  const adjustedDuration = baseDuration * (repeatedBrands.length / (brandsData.length * 2));

  return (
    <section 
      className="nc-SectionBrandsTicker py-8 lg:py-12 overflow-hidden"
      style={{backgroundColor: bgColor}}
    >
      {/* Title */}
      {title?.value && (
        <div className="container mb-6">
          <h2 className="font-headline text-3xl md:text-4xl font-normal">
            {title.value}
          </h2>
          <hr className="border-neutral-900/10" />
        </div>
      )}

      {/* Ticker Container */}
      <div className="relative w-full overflow-hidden">
        {/* Fade left */}
        <div
          className="absolute left-0 top-0 bottom-0 w-20 md:w-40 z-10 pointer-events-none"
          style={{background: `linear-gradient(to right, ${bgColor} 0%, ${bgColor}80 30%, transparent 100%)`}}
        />
        {/* Fade right */}
        <div
          className="absolute right-0 top-0 bottom-0 w-20 md:w-40 z-10 pointer-events-none"
          style={{background: `linear-gradient(to left, ${bgColor} 0%, ${bgColor}80 30%, transparent 100%)`}}
        />
        <div 
          className="flex items-center gap-8 md:gap-12 lg:gap-16 animate-ticker"
          style={{
            animationDuration: `${adjustedDuration}s`,
          }}
        >
          {repeatedBrands.map((brand: any, index: number) => renderBrandItem(brand, index))}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-${100 / repeatCount * (repeatCount / 2)}%);
          }
        }
        .animate-ticker {
          animation: ticker linear infinite;
          width: max-content;
          will-change: transform;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
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
