import {type FC, useState} from 'react';
import Prices from './Prices';
import {StarIcon} from '@heroicons/react/24/solid';
import ProductStatus from './ProductStatus';
import {Image} from '@shopify/hydrogen';
import {Link} from './Link';
import {type CommonProductCardFragment} from 'storefrontapi.generated';
import {useGetPublicStoreCdnStaticUrlFromRootLoaderData} from '~/hooks/useGetPublicStoreCdnStaticUrlFromRootLoaderData';
import LikeButton from './LikeButton';
import {isNewArrival} from '~/lib/utils';
import {
  type SelectedOption,
  type MoneyV2,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import ButtonSecondary from './Button/ButtonSecondary';
import ButtonPrimary from './Button/ButtonPrimary';
import BagIcon from './BagIcon';
import {NoSymbolIcon} from '@heroicons/react/24/outline';
import {getThumbnailSkeletonByIndex} from './ThumbnailSkeletons';
import {getProductFeatureText} from '~/utils/getProductFeatureText';
import {OkendoStarRating} from '@okendo/shopify-hydrogen';
import {useAside} from './Aside';
import {getVariantUrl, useVariantUrl} from '~/lib/variants';
import {ClientOnly} from './client-only';
import {VendorLogoWithFallback} from './VendorLogo';

export interface ProductCardProps {
  className?: string;
  product: CommonProductCardFragment;
  loading?: HTMLImageElement['loading'];
  quickAddToCart?: boolean;
  isCardSmall?: boolean;
}

const ProductCard: FC<ProductCardProps> = ({
  className = '',
  product,
  loading,
  quickAddToCart = true,
  isCardSmall = false,
}) => {
  const {
    id,
    handle,
    title,
    options,
    featuredImage,
    variants,
    outstanding_features,
    okendoStarRatingSnippet,
    vendor,
    images,
    uso_tipo,
    modelo,
    material,
    envio_gratis,
  } = product;

  // Segunda imagen para hover (producto en uso/contexto)
  const secondImage = images?.edges?.[1]?.node;

  // Parsear material (puede venir como JSON array)
  const parseMaterialValue = (value: string | undefined): string | null => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.join(' | ') : String(parsed);
    } catch {
      return value;
    }
  };
  const materialValue = parseMaterialValue(material?.value);
  
  // Verificar envío gratis (puede ser "true" o "1")
  const hasEnvioGratis = envio_gratis?.value === 'true' || envio_gratis?.value === '1';

  const firstVariant = variants?.nodes?.[0];

  const optColor = options.find((option) => option.name === 'Color');
  const optSizes = options.find((option) => option.name === 'Size');
  const optWeight = options.find((option) => option.name === 'Peso' || option.name === 'Weight');
  const isSale =
    Number(product.compareAtPriceRange?.minVariantPrice?.amount || 0) >
    Number(product.priceRange.minVariantPrice.amount);

  const {open} = useAside();
  const variantUrl = useVariantUrl(
    product.handle,
    firstVariant.selectedOptions,
  );
  const {getImageWithCdnUrlByName, getColorHexByName} =
    useGetPublicStoreCdnStaticUrlFromRootLoaderData();

  // State for selected color on hover - persists until another color is hovered
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // Current active color: hovered one or first color as default
  const activeColor = selectedColor || optColor?.values?.[0] || null;

  // Find variant image for selected color
  const getVariantImageForColor = (colorName: string | null) => {
    if (!colorName || !variants?.nodes) return null;
    const variant = variants.nodes.find((v) =>
      v.selectedOptions?.some(
        (opt) => opt.name === 'Color' && opt.value === colorName
      )
    );
    return variant?.image;
  };

  const selectedVariantImage = selectedColor ? getVariantImageForColor(selectedColor) : null;

  const renderColorOptions = () => {
    if (!optColor || optColor.values.length < 2) {
      return null;
    }

    return (
      <div className="flex items-center flex-wrap gap-3">
        {optColor?.values.map((color, index) => {
          if (index >= 5) {
            return null;
          }
          const imageUrl = getImageWithCdnUrlByName(color.replaceAll(/ /g, '_'));
          const colorHex = getColorHexByName(color);

          const isActive = color === activeColor;
          
          return (
            <div
              key={color}
              className={`relative w-5 h-5 rounded-full cursor-pointer p-[2px] transition-all ${
                isActive ? 'ring-1 ring-black ring-offset-1' : ''
              }`}
              title={color}
              onMouseEnter={() => setSelectedColor(color)}
            >
              <div 
                className="w-full h-full rounded-full overflow-hidden"
                style={!imageUrl ? {backgroundColor: colorHex} : undefined}
              >
                {imageUrl && (
                  <Image
                    data={{
                      url: imageUrl,
                      altText: color,
                    }}
                    width={20}
                    height={20}
                    aspectRatio="1/1"
                    className="rounded-full w-full h-full object-cover"
                    sizes="(max-width: 640px) 16px, 20px"
                  />
                )}
              </div>
            </div>
          );
        })}
        {optColor.values.length > 5 && (
          <div className="block ps-1 text-sm">
            <span>+</span>
          </div>
        )}
      </div>
    );
  };

  const renderWishlistButton = () => {
    return (
      <ClientOnly>
        <LikeButton id={id} className="absolute top-3 end-3 z-10" />
      </ClientOnly>
    );
  };

  const renderSizeList = () => {
    const sizes = optSizes?.values;

    if (!sizes || !sizes.length || quickAddToCart) {
      return null;
    }

    return (
      <div className="absolute bottom-0 inset-x-3 gap-1.5 flex justify-center opacity-0 invisible group-hover:bottom-4 group-hover:opacity-100 group-hover:visible transition-all">
        <div className="flex justify-center flex-wrap gap-1.5">
          {sizes.map((size, index) => {
            if (index >= 4) {
              return null;
            }
            return (
              <Link
                key={`${index + size}`}
                className="nc-shadow-lg min-w-10 h-10 flex-shrink-0 px-2 rounded-xl bg-white transition-colors cursor-pointer flex items-center justify-center font-semibold tracking-tight text-sm text-slate-900 hover:bg-slate-50"
                to={getProductUrlWithSelectedOption({
                  productHandle: product.handle,
                  selectedOptions: [
                    ...(firstVariant.selectedOptions ?? []),
                    {
                      name: 'Size',
                      value: size,
                    },
                  ],
                })}
              >
                <span className="line-clamp-1">{size}</span>
              </Link>
            );
          })}
          {sizes.length > 4 && (
            <Link
              prefetch="intent"
              to={variantUrl}
              className="nc-shadow-lg min-w-10 h-10 flex-shrink-0 px-2 rounded-xl bg-white transition-colors cursor-pointer flex items-center justify-center font-semibold tracking-tight text-sm text-slate-900 hover:bg-slate-50"
            >
              <span className="-ml-0.5">+{sizes.length - 4}</span>
            </Link>
          )}
        </div>
      </div>
    );
  };

  const renderGroupButtons = () => {
    if (!quickAddToCart) {
      return null;
    }
    return (
      <div className="absolute hidden bottom-0 group-hover:bottom-4 inset-x-1 flex justify-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        {firstVariant.availableForSale && (
          <ClientOnly>
            <AddToCartButton
              lines={[
                {
                  quantity: 1,
                  merchandiseId: firstVariant.id,
                  selectedVariant: firstVariant,
                },
              ]}
              onClick={() => open('cart')}
            >
              <ButtonPrimary
                className="shadow-lg"
                fontSize="text-xs"
                sizeClass="py-2 px-4"
                as="span"
              >
                <BagIcon className="w-3.5 h-3.5 mb-0.5" />
                <span className="ms-1">Añadir al carrito</span>
              </ButtonPrimary>
            </AddToCartButton>
          </ClientOnly>
        )}
        {!firstVariant.availableForSale && (
          <ButtonSecondary
            className="ms-1.5 bg-white hover:!bg-gray-100 hover:text-slate-900 transition-colors shadow-lg"
            fontSize="text-xs"
            sizeClass="py-2 px-4"
            disabled
          >
            <NoSymbolIcon className="w-3.5 h-3.5" />
            <span className="ms-1">Soul out</span>
          </ButtonSecondary>
        )}
      </div>
    );
  };

  // Use selected variant image if color is hovered, otherwise use default
  const image = selectedVariantImage || firstVariant?.image || featuredImage;

  return (
    <>
      <div
        className={`ProductCard relative flex flex-col h-full bg-transparent border border-[#e5e7eb] hover:border-[#1a1a1a] rounded-md overflow-hidden ${className}`}
      >
        <Link to={variantUrl} className="absolute inset-0" prefetch="viewport">
          <span className="sr-only">{title}</span>
        </Link>

        <div className="bg-[#f8f8f8] relative flex-shrink-0 overflow-hidden z-1 group p-5">
          <Link to={variantUrl} className="block">
            <div className="flex aspect-w-1 aspect-h-1 w-full relative">
              {/* Imagen principal */}
              {image && (
                <Image
                  data={{...image, width: undefined, height: undefined}}
                  className={`mix-blend-multiply object-contain transition-opacity duration-300 ${secondImage ? 'group-hover:opacity-0' : 'group-hover:opacity-80'}`}
                  sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  loading={loading}
                />
              )}
              {/* Imagen secundaria en hover (producto en uso) */}
              {secondImage && (
                <Image
                  data={{...secondImage, width: undefined, height: undefined}}
                  className="object-contain absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  loading="lazy"
                />
              )}
            </div>
          </Link>
          {/* Badges de estado - fila horizontal */}
          <div className="absolute top-3 start-3 z-10 flex flex-row items-center gap-1.5">
            <ProductBadge
              status={getProductStatus({
                availableForSale: product.availableForSale,
                compareAtPriceRangeMinVariantPrice:
                  product.compareAtPriceRange.minVariantPrice,
                priceRangeMinVariantPrice: product.priceRange.minVariantPrice,
                publishedAt: product.publishedAt,
              })}
              className="px-2 py-1 text-xs !relative !top-0 !start-0"
            />
            {/* Badge Tipo de Uso */}
            {uso_tipo?.value && (
              <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                uso_tipo.value.toLowerCase() === 'comercial' 
                  ? 'bg-blue-100 text-blue-700' 
                  : uso_tipo.value.toLowerCase() === 'profesional'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-[#F9F9F9] text-[#2B2A2A]'
              }`}>
                {uso_tipo.value}
              </span>
            )}
          </div>
          {renderWishlistButton()}
          {renderSizeList()}
          {renderGroupButtons()}
        </div>

        <div className="px-2.5 pb-4 flex-grow flex flex-col dark:bg-slate-800" style={{ fontFamily: '"nudista-web", sans-serif' }}>
          
          
          {renderColorOptions()}
          
          {/* Selector de pesos (para mancuernas, pesas, etc.) */}
          {optWeight && optWeight.values.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {optWeight.values.slice(0, 4).map((weight) => (
                <Link
                  key={weight}
                  to={getProductUrlWithSelectedOption({
                    productHandle: product.handle,
                    selectedOptions: [
                      ...(firstVariant.selectedOptions ?? []),
                      { name: optWeight.name, value: weight },
                    ],
                  })}
                  className="relative z-10 min-w-8 h-6 px-1.5 flex items-center justify-center text-xs font-medium bg-white rounded-md hover:border hover:border-slate-400 transition-colors"
                >
                  {weight}
                </Link>
              ))}
              {optWeight.values.length > 4 && (
                <span className="text-xs" style={{ color: '#666666' }}>+{optWeight.values.length - 4}</span>
              )}
            </div>
          )}
          


          <div className="flex-grow mt-4">
            {/* Marca - Logo SVG */}
            {vendor && (
              <div className="mb-4">
                <VendorLogoWithFallback 
                  vendor={vendor} 
                  className="h-4 w-auto max-w-[70px] object-contain"
                  fallbackClassName="text-[10px] font-medium uppercase tracking-wide text-black"
                />
              </div>
            )}
            <h5
              className="nc-ProductCard__title transition-colors"
              style={{
                fontSize: '1rem',
                fontStyle: 'normal',
                fontWeight: 600,
                lineHeight: '1.2',
              }}
              title={title}
            >
              {title}
            </h5>
            
            {/* Atributos técnicos con separador | */}
            {(modelo?.value || materialValue || hasEnvioGratis) && (
              <p className="text-xs flex items-center flex-wrap mt-1" style={{ color: '#000000' }}>
                {modelo?.value && (
                  <span>{modelo.value}</span>
                )}
                {modelo?.value && materialValue && (
                  <span className="mx-1.5" style={{ color: '#000000' }}>|</span>
                )}
                {materialValue && (
                  <span>{materialValue}</span>
                )}
                {(modelo?.value || materialValue) && hasEnvioGratis && (
                  <span className="mx-1.5" style={{ color: '#000000' }}>|</span>
                )}
                {hasEnvioGratis && (
                  <span className="bg-[#28faa5] text-[#213875] font-medium px-2 py-0.5 rounded-md text-xs">Envío Gratis</span>
                )}
              </p>
            )}
            
            {product.tags && product.tags.length > 0 && !modelo?.value && !material?.value && (
              <p
                className="capitalize whitespace-nowrap overflow-hidden text-ellipsis"
                style={{
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '.875rem',
                }}
              >
                {product.tags.slice(0, 3).join(', ')}
              </p>
            )}
            {!isCardSmall && (
              <div className="flex items-center">
                <OkendoStarRating
                  productId={id}
                  okendoStarRatingSnippet={okendoStarRatingSnippet}
                />
              </div>
            )}
            <div>
              <Prices
                price={product.priceRange.minVariantPrice}
                compareAtPrice={
                  isSale ? product.compareAtPriceRange?.minVariantPrice : undefined
                }
                withoutTrailingZeros={
                  Number(product.priceRange.minVariantPrice.amount || 1) > 99
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const ProductBadge = ({
  status,
  className,
}: {
  status: 'Sold out' | 'Sale' | 'New' | 'Agotado' | 'Oferta' | 'Nuevo' | null;
  className?: string;
}) => {
  if (!status) {
    return null;
  }

  if (status === 'Sold out' || status === 'Agotado') {
    return (
      <ProductStatus
        className={className}
        color="zinc"
        status="Agotado"
        icon="NoSymbolIcon"
      />
    );
  }

  if (status === 'Sale' || status === 'Oferta') {
    return (
      <ProductStatus
        className={className}
        color="rose"
        status="Oferta"
        icon="IconDiscount"
      />
    );
  }

  if (status === 'New' || status === 'Nuevo') {
    return (
      <ProductStatus
        className={className}
        color="black"
        status="Nuevo"
        icon="SparklesIcon"
      />
    );
  }

  return null;
};

export const getProductStatus = ({
  availableForSale,
  compareAtPriceRangeMinVariantPrice,
  priceRangeMinVariantPrice,
  publishedAt,
}: {
  availableForSale: boolean;
  compareAtPriceRangeMinVariantPrice?: Pick<MoneyV2, 'amount' | 'currencyCode'>;
  priceRangeMinVariantPrice?: Pick<MoneyV2, 'amount' | 'currencyCode'>;
  publishedAt: string;
}) => {
  const isSale =
    compareAtPriceRangeMinVariantPrice?.amount &&
    priceRangeMinVariantPrice?.amount &&
    Number(compareAtPriceRangeMinVariantPrice?.amount) >
      Number(priceRangeMinVariantPrice.amount);

  if (!availableForSale) {
    return 'Agotado';
  }

  if (isSale && availableForSale) {
    return 'Oferta';
  }

  if (isNewArrival(publishedAt)) {
    return 'Nuevo';
  }

  return null;
};

export function getProductUrlWithSelectedOption({
  productHandle,
  selectedOptions,
}: {
  productHandle: string;
  selectedOptions: SelectedOption[];
}) {
  return getVariantUrl({
    handle: productHandle,
    searchParams: new URLSearchParams(),
    selectedOptions,
  });
}

export const ProductCardSkeleton = ({
  className = '',
  index = 0,
}: {
  className?: string;
  index?: number;
}) => {
  const ThumbnailSkeleton = getThumbnailSkeletonByIndex(index);

  return (
    <div
      className={
        `ProductCard relative flex flex-col h-full bg-transparent border border-[#e5e7eb] rounded-md overflow-hidden ` + className
      }
    >
      <div className="relative flex-shrink-0 bg-slate-50 border border-slate-50 dark:bg-slate-300 rounded-3xl overflow-hidden z-1 group p-5">
        <div className="flex aspect-w-1 aspect-h-1 w-full group-hover:opacity-80 transition-opacity">
          <ThumbnailSkeleton />
        </div>
      </div>

      <div className="space-y-4 px-2.5 pt-5 pb-2.5 flex-grow flex flex-col">
        <div className="flex items-center flex-wrap gap-3">
          {[1, 1, 1, 1].map((_, index) => {
            if (index >= 5) {
              return null;
            }
            return (
              <div
                key={'_' + index.toString()}
                className={`relative w-4 h-4 rounded-full bg-[#efefef] overflow-hidden cursor-pointer`}
              ></div>
            );
          })}
        </div>
        <div>
          <h2 className="nc-ProductCard__title text-base font-semibold transition-colors">
            Product title
          </h2>
          <p
            className={`text-sm text-slate-500 dark:text-black mt-1 capitalize`}
          >
            Outstanding feature
          </p>
        </div>

        <div className="flex justify-between items-end gap-2">
          <Prices
            price={{
              amount: '100.00',
              currencyCode: 'USD',
            }}
          />
          <>
            <div className="flex">
              <StarIcon className="w-4 h-4 text-amber-400" />
              <span className="text-sm ml-1">
                <span className="line-clamp-1">5.0 (28 reviews)</span>
              </span>
            </div>
          </>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
