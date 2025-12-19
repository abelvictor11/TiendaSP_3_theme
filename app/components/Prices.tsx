import {type Maybe, type MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {type FC} from 'react';

export interface PricesProps {
  className?: string;
  price?: Pick<MoneyV2, 'amount' | 'currencyCode'>;
  compareAtPrice?: Maybe<Pick<MoneyV2, 'amount' | 'currencyCode'>>;
  contentClass?: string;
  compareAtPriceClass?: string;
  withoutTrailingZeros?: boolean;
}

// Format price with $ symbol only
function formatPrice(amount: string, withoutTrailingZeros?: boolean): string {
  const num = parseFloat(amount);
  if (withoutTrailingZeros) {
    return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Calculate discount percentage
function calculateDiscountPercentage(price: string, compareAtPrice: string): number {
  const priceNum = parseFloat(price);
  const compareNum = parseFloat(compareAtPrice);
  if (compareNum <= 0) return 0;
  return Math.round(((compareNum - priceNum) / compareNum) * 100);
}

const Prices: FC<PricesProps> = ({
  className = '',
  price,
  compareAtPrice,
  contentClass = 'py-1 md:py-1.5 text-sm font-bold',
  compareAtPriceClass = 'text-md',
  withoutTrailingZeros,
}) => {
  const hasDiscount = compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price?.amount || '0');
  const discountPercentage = hasDiscount 
    ? calculateDiscountPercentage(price?.amount || '0', compareAtPrice.amount)
    : 0;

  return (
    <div className={`${className} pt-2`}>
      <div className={`flex items-center flex-wrap gap-x-2 gap-y-1 ${contentClass}`}>
        {price ? (
          <span className={hasDiscount ? 'text-red-500 !leading-none font-bold' : 'text-slate-900 dark:text-slate-100 !leading-none font-bold'}>
            {formatPrice(price.amount, withoutTrailingZeros)}
          </span>
        ) : null}
        {hasDiscount && compareAtPrice ? (
          <>
            <s className={`${compareAtPriceClass} text-black font-body line-through`}>
              {formatPrice(compareAtPrice.amount, withoutTrailingZeros)}
            </s>
            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
              Ahorra {discountPercentage}%
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Prices;
