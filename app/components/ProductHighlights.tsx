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

const PRIORITY_KEYS = [
  'generoshopi', 'materialshopi', 'tipo_de_bicicletashopi', 'velocidades',
  'peso_producto', 'garantia', 'tamano_de_rinshopi', 'tipo_de_frenoshopi'
];

const EXCLUDED_FROM_HIGHLIGHTS = [
  'condiciones', 'alto', 'ancho', 'largo', 'altoshopi', 'anchoshopi', 'largoshopi',
  'anchodelproductoshopi', 'bielas', 'cadena', 'pedalier', 'sillin', 'tija_de_sillin',
  'horquilla', 'tenedor', 'sensor', 'cassette', 'manillar', 'ruedas', 'frenos',
  'suspensi_n', 'ancho_suspension', 'ancho_llanta_compatibleshopi', 'angulo_de_rotacion',
  'espigo', 'tensor', 'palancas', 'posicion_manzana', 'posicionshopi', 'recorrido',
  'numero_de_eslabonesshopi', 'numero_de_herramientas', 'tipo_de_eje', 'tipo_de_plato',
  'tipodeplato', 'tipo_de_valvulashopi', 'tipo_de_bloqueo', 'tipo_de_aperturashopi',
  'sistema_de_fijacionshopi', 'sistema_de_montajeshopi', 'caracteristicas_del_material',
  'contiene_lactosashopi', 'libre_de_glutenshopi', 'es_veganoshopi', 'consistenciashopi',
  'marco', 'motor', 'bater_a', 'llantas'
];

const HIGHLIGHT_LABELS: Record<string, string> = {
  generoshopi: 'Género',
  materialshopi: 'Material',
  tipo_de_bicicletashopi: 'Tipo',
  velocidades: 'Velocidades',
  peso_producto: 'Peso',
  garantia: 'Garantía',
  tamano_de_rinshopi: 'Rin',
  tipo_de_frenoshopi: 'Frenos',
  marco: 'Marco',
  motor: 'Motor',
  bater_a: 'Batería',
  llantas: 'Llantas',
};

function formatKeyToLabel(key: string): string {
  if (HIGHLIGHT_LABELS[key]) return HIGHLIGHT_LABELS[key];
  return key
    .replace(/shopi$/i, '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const ProductHighlights: FC<ProductHighlightsProps> = ({
  metafields = [],
  className = '',
}) => {
  // Build highlights from metafields that have values, prioritizing certain keys
  // Exclude technical specs that should only appear in ProductSpecs
  const allHighlights = (metafields || [])
    .filter((m) => m && m.value && m.key !== 'highlights' && m.key !== 'especificaciones' && !EXCLUDED_FROM_HIGHLIGHTS.includes(m.key) && (m.namespace === 'custom' || m.namespace === 'global'))
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
        key: m.key,
        label: formatKeyToLabel(m.key),
        value: displayValue,
        priority: PRIORITY_KEYS.indexOf(m.key),
      };
    });

  // Sort by priority (prioritized keys first, then alphabetically)
  const highlights = allHighlights
    .sort((a, b) => {
      if (a.priority >= 0 && b.priority >= 0) return a.priority - b.priority;
      if (a.priority >= 0) return -1;
      if (b.priority >= 0) return 1;
      return a.label.localeCompare(b.label);
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
