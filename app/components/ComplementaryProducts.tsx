import {useState} from 'react';
import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import type {CommonProductCardFragment} from 'storefrontapi.generated';
import {ChevronDownIcon, InformationCircleIcon} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface ComplementaryProductsProps {
  products: CommonProductCardFragment[];
  title?: string;
  className?: string;
}

export function ComplementaryProducts({
  products,
  title = 'Equípate al completo',
  className = '',
}: ComplementaryProductsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!products || products.length === 0) return null;

  return (
    <div className={clsx('border border-slate-200 rounded-xl overflow-hidden', className)}>
      {/* Header - Collapsible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors"
      >
        <h3 className="font-headline text-lg font-bold text-slate-900">{title}</h3>
        <ChevronDownIcon 
          className={clsx(
            'w-5 h-5 text-slate-500 transition-transform duration-300',
            isExpanded && 'rotate-180'
          )} 
        />
      </button>

      {/* Products List - Animated */}
      <div 
        className={clsx(
          'grid transition-all duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="divide-y divide-slate-200">
            {products.slice(0, 4).map((product) => (
              <ComplementaryProductItem key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplementaryProductItem({product}: {product: CommonProductCardFragment}) {
  const firstVariant = product.variants?.nodes?.[0];
  const price = firstVariant?.price;
  const image = product.featuredImage;
  
  // Get color options if available
  const colorOption = product.options?.find(
    (opt: {name: string; values?: string[]}) => opt.name.toLowerCase() === 'color'
  );
  const colorValues = colorOption?.values?.slice(0, 4) || [];

  return (
    <div className="flex items-center gap-4 p-4 bg-white">
      {/* Product Image */}
      <Link
        to={`/products/${product.handle}`}
        className="shrink-0 w-24 h-24 bg-[#efefef] rounded-lg overflow-hidden"
      >
        {image && (
          <Image
            data={image}
            sizes="96px"
            className="w-full h-full object-contain mix-blend-multiply"
          />
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/products/${product.handle}`}>
          <h4 className="font-medium text-slate-900 truncate hover:text-primary-600 transition-colors">
            {product.title}
          </h4>
        </Link>

        {/* Color Swatches */}
        {colorValues.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            {colorValues.map((color: string, idx: number) => (
              <span
                key={idx}
                className="w-5 h-5 rounded-full border border-slate-300"
                style={{backgroundColor: getColorHex(color)}}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mt-2">
          {price && (
            <span className="font-bold text-slate-900">
              <Money data={price} />
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={`/products/${product.handle}`}
          className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 transition-colors"
        >
          Elegir opciones
        </Link>
        <Link
          to={`/products/${product.handle}`}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          title="Ver detalles"
        >
          <InformationCircleIcon className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

// Helper function to convert color names to hex
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    negro: '#000000',
    black: '#000000',
    blanco: '#ffffff',
    white: '#ffffff',
    rojo: '#ef4444',
    red: '#ef4444',
    azul: '#3b82f6',
    blue: '#3b82f6',
    verde: '#22c55e',
    green: '#22c55e',
    amarillo: '#eab308',
    yellow: '#eab308',
    naranja: '#f97316',
    orange: '#f97316',
    rosa: '#ec4899',
    pink: '#ec4899',
    morado: '#a855f7',
    purple: '#a855f7',
    gris: '#6b7280',
    gray: '#6b7280',
    grey: '#6b7280',
  };

  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || '#9ca3af';
}

export default ComplementaryProducts;
