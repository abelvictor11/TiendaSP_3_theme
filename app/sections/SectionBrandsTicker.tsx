import {Link} from '@remix-run/react';
import {useMemo} from 'react';

const MIN_BRANDS_FOR_FULL_WIDTH = 12;

function BrandItemContent({
  svgContent,
  imageUrl,
  brandName,
}: {
  svgContent?: string;
  imageUrl?: string;
  brandName: string;
}) {
  return (
    <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity rounded-md bg-[rgb(237,237,237,0.5)]">
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
}

export function SectionBrandsTicker(props: any) {
  const {title, brands, background_color, speed} = props;

  const bgColor = background_color?.value || '#ffffff';
  const animationSpeed = speed?.value || '30';

  const rawNodes = brands?.references?.nodes;

  const brandsData = useMemo(
    () => (rawNodes && rawNodes.length > 0 ? rawNodes : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawNodes?.length],
  );

  const {repeatedBrands, adjustedDuration} = useMemo(() => {
    if (!brandsData) return {repeatedBrands: [], adjustedDuration: 30};
    const count = brandsData.length;
    const repeatCount = Math.max(
      2,
      Math.ceil(MIN_BRANDS_FOR_FULL_WIDTH / count) * 2,
    );
    const result: any[] = [];
    for (let i = 0; i < repeatCount; i++) result.push(...brandsData);
    const duration = Number(animationSpeed) * (result.length / (count * 2));
    return {repeatedBrands: result, adjustedDuration: duration};
  }, [brandsData, animationSpeed]);

  if (!brandsData) return null;

  return (
    <section
      className="nc-SectionBrandsTicker py-8 lg:py-12 overflow-hidden"
      style={{backgroundColor: bgColor}}
    >
      {title?.value && (
        <div className="container mb-6">
          <h2 className="font-headline text-3xl md:text-4xl font-normal">
            {title.value}
          </h2>
          <hr className="border-neutral-900/10" />
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 w-20 md:w-40 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to right, ${bgColor} 0%, ${bgColor}80 30%, transparent 100%)`,
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-20 md:w-40 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to left, ${bgColor} 0%, ${bgColor}80 30%, transparent 100%)`,
          }}
        />
        <div
          className="flex items-center gap-4 animate-ticker"
          style={{animationDuration: `${adjustedDuration}s`}}
        >
          {repeatedBrands.map((brand: any, index: number) => {
            const svgContent = brand.svg_logo?.value as string | undefined;
            const imageUrl = brand.image_logo?.reference?.image?.url as
              | string
              | undefined;
            const brandUrl = brand.url?.value as string | undefined;
            const brandName =
              (brand.name?.value as string | undefined) || `Brand ${index}`;

            return brandUrl ? (
              <Link
                key={`${brand.id}-${index}`}
                to={brandUrl}
                className="flex-shrink-0"
                prefetch="intent"
              >
                <BrandItemContent
                  svgContent={svgContent}
                  imageUrl={imageUrl}
                  brandName={brandName}
                />
              </Link>
            ) : (
              <div key={`${brand.id}-${index}`} className="flex-shrink-0">
                <BrandItemContent
                  svgContent={svgContent}
                  imageUrl={imageUrl}
                  brandName={brandName}
                />
              </div>
            );
          })}
        </div>
      </div>
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
