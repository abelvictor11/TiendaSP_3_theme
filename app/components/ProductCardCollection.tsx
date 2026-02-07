import {type FC} from 'react';
import {Link} from './Link';
import {Image} from '@shopify/hydrogen';
import ButtonSecondary from './Button/ButtonSecondary';
import {type CommonProductCardFragment} from 'storefrontapi.generated';
import Prices from './Prices';
import clsx from 'clsx';
import {VendorLogoWithFallback} from './VendorLogo';

export interface ProductCardCollectionProps {
  product: CommonProductCardFragment;
  button_text?: string;
  className?: string;
}

const ProductCardCollection: FC<ProductCardCollectionProps> = ({
  product,
  button_text = 'Ver ahora',
  className = '',
}) => {
  const {handle, title, featuredImage, variants, vendor} = product;
  
  const firstVariant = variants?.nodes?.[0];
  const image = featuredImage;

  const isSale =
    Number(product.compareAtPriceRange?.minVariantPrice?.amount || 0) >
    Number(product.priceRange.minVariantPrice.amount);

  return (
    <Link
      to={`/products/${handle}`}
      className={clsx(`block w-full`, className)}
      prefetch="viewport"
    >
      <div className="relative w-full aspect-w-16 aspect-h-12 sm:aspect-h-9 rounded-2xl overflow-hidden bg-[#efefef] group">
        {/* Background image */}
        {image && (
          <Image
            className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            data={image}
            sizes="(max-width: 640px) 90vw, (max-width: 1200px) 50vw, 40vw"
          />
        )}

        {/* Fallback when no image */}
        {!image && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#efefef] rounded-2xl">
            <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-2xl"></div>
        
        {/* Hover effect */}
        <span className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-black/20 transition-opacity rounded-2xl"></span>

        <div>
          <div className="absolute inset-4 lg:inset-8 flex flex-col">
            <div className="max-w-[18rem]">
              {/* Vendor/Category - Logo SVG */}
              {vendor && (
                <div className="mb-1">
                  <VendorLogoWithFallback 
                    vendor={vendor} 
                    className="h-5 w-auto max-w-[80px] object-contain brightness-0 invert"
                    fallbackClassName="text-sm text-white/90 font-medium"
                  />
                </div>
              )}
              
              {/* Product Title */}
              {!!title && (
                <h2
                  className="text-xl lg:text-2xl text-white font-normal mt-0.5 sm:mt-2"
                  dangerouslySetInnerHTML={{__html: title}}
                />
              )}
            </div>
            
            <div className="mt-auto">
              {/* Price */}
              <div className="mb-3">
                <Prices
                  price={product.priceRange.minVariantPrice}
                  compareAtPrice={
                    isSale ? product.compareAtPriceRange?.minVariantPrice : undefined
                  }
                  withoutTrailingZeros={
                    Number(product.priceRange.minVariantPrice.amount || 1) > 99
                  }
                  className="text-white"
                />
              </div>
              
              {/* Button */}
              <ButtonSecondary
                sizeClass="py-3 px-4 sm:py-3.5 sm:px-6"
                fontSize="text-sm font-medium"
                className="nc-shadow-lg bg-white/90 hover:bg-white text-neutral-900 backdrop-blur-sm"
              >
                {button_text || 'Ver ahora'}
              </ButtonSecondary>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCardCollection;
