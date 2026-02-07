import {Image} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import type {CommonProductCardFragment} from 'storefrontapi.generated';
import {type FC} from 'react';
import Prices from './Prices';
import {getVariantUrl} from '~/lib/variants';

export interface ProductCardShowcaseProps {
  product: CommonProductCardFragment;
  cardBackgroundColor?: string;
  cardTextColor?: string;
}

export const ProductCardShowcase: FC<ProductCardShowcaseProps> = ({
  product,
  cardBackgroundColor = '#ffffff',
  cardTextColor = '#FFFFFF',
}) => {
  const {
    id,
    handle,
    title,
    featuredImage,
    variants,
    vendor,
  } = product;

  const firstVariant = variants?.nodes?.[0];
  const image = featuredImage;

  const variantUrl = getVariantUrl({
    handle,
    selectedOptions: firstVariant?.selectedOptions || [],
    searchParams: new URLSearchParams(),
  });

  const isSale =
    Number(product.compareAtPriceRange?.minVariantPrice?.amount || 0) >
    Number(product.priceRange.minVariantPrice.amount);

  return (
    <div
      className="ProductCardShowcase relative flex flex-col h-full rounded-2xl overflow-hidden shadow-xl backdrop-blur-md"
      style={{backgroundColor: `${cardBackgroundColor}cc`}} // cc = 80% opacity
    >
      <Link to={variantUrl} className="absolute inset-0 z-0" prefetch="viewport">
        <span className="sr-only">{title}</span>
      </Link>

      {/* Image Container */}
      <div className="relative aspect-square p-8">
        {image && (
          <Image
            data={{...image, width: undefined, height: undefined}}
            className="object-contain w-full h-full mix-blend-multiply"
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 300px"
            loading="lazy"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col" style={{fontFamily: '"nudista-web", sans-serif'}}>
        {/* Vendor */}
        {vendor && (
          <span className="text-xs font-medium uppercase tracking-wide mb-1" style={{color: cardTextColor, opacity: 0.7}}>
            {vendor}
          </span>
        )}

        {/* Title */}
        <h5
          className="text-base font-semibold mb-2 line-clamp-2"
          style={{lineHeight: '1.3', color: cardTextColor}}
        >
          {title}
        </h5>

        {/* Price */}
        <div className="mt-auto">
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
  );
};

export default ProductCardShowcase;
