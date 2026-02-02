import {type FC} from 'react';
import {CheckCircleIcon} from '@heroicons/react/24/outline';

interface Metafield {
  key: string;
  namespace: string;
  value: string | null;
}

interface ProductHighlightsProps {
  metafields?: Metafield[];
  className?: string;
}

const HIGHLIGHT_KEYS = ['modalidad', 'material', 'genero', 'condici_n', 'grupo', 'tamanollanta'];

const HIGHLIGHT_LABELS: Record<string, string> = {
  modalidad: 'Modalidad',
  material: 'Material',
  genero: 'Género',
  condici_n: 'Condición',
  grupo: 'Grupo',
  tamanollanta: 'Tamaño Llanta',
};

const ProductHighlights: FC<ProductHighlightsProps> = ({
  metafields = [],
  className = '',
}) => {
  // Build highlights from metafields that have values
  const highlights = (metafields || [])
    .filter((m) => m && m.value && HIGHLIGHT_KEYS.includes(m.key))
    .map((m) => {
      let displayValue = m.value || '';
      try {
        const parsed = JSON.parse(m.value || '');
        if (Array.isArray(parsed)) {
          displayValue = parsed.join(', ');
        }
      } catch {
        // Not JSON, use as-is
      }
      return {
        label: HIGHLIGHT_LABELS[m.key] || m.key,
        value: displayValue,
      };
    });

  if (highlights.length === 0) return null;

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
          <span className="text-xs text-slate-500 uppercase tracking-wide">
            {item.label}
          </span>
          <span className="text-sm block font-semibold text-slate-900 dark:text-white">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ProductHighlights;
