import {type FC} from 'react';
import {CheckCircleIcon} from '@heroicons/react/24/outline';

interface ProductHighlightsProps {
  highlights?: string[];
  className?: string;
}

const ProductHighlights: FC<ProductHighlightsProps> = ({
  highlights,
  className = '',
}) => {
  if (!highlights || highlights.length === 0) return null;

  // Show max 4 highlights
  const displayHighlights = highlights.slice(0, 4);

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {displayHighlights.map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-start text-left p-4 rounded-2xl border-slate-200 dark:border-slate-700 border dark:bg-opacity-90"
        >
          <CheckCircleIcon className="w-6 h-6 text-black mb-2" />
          <span className="text-sm block font-semibold text-slate-900">
            {item}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ProductHighlights;
