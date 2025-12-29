import {type FC} from 'react';
import {
  ScaleIcon,
  CubeIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface ProductHighlightsProps {
  highlights?: string[];
  pesoMaxUsuario?: string;
  plegable?: boolean;
  requiereElectricidad?: boolean;
  className?: string;
}

const ProductHighlights: FC<ProductHighlightsProps> = ({
  highlights,
  pesoMaxUsuario,
  plegable,
  requiereElectricidad,
  className = '',
}) => {
  // Build automatic highlights from specs
  const autoHighlights: {icon: any; text: string}[] = [];

  if (pesoMaxUsuario) {
    autoHighlights.push({
      icon: ScaleIcon,
      text: `Soporta hasta ${pesoMaxUsuario}`,
    });
  }

  if (plegable) {
    autoHighlights.push({
      icon: CubeIcon,
      text: 'Plegable / Ahorro de espacio',
    });
  }

  if (requiereElectricidad === false) {
    autoHighlights.push({
      icon: BoltIcon,
      text: 'Sin conexión eléctrica',
    });
  }

  // Add custom highlights
  if (highlights && highlights.length > 0) {
    highlights.forEach((h) => {
      autoHighlights.push({
        icon: WrenchScrewdriverIcon,
        text: h,
      });
    });
  }

  if (autoHighlights.length === 0) return null;

  // Show max 4 highlights
  const displayHighlights = autoHighlights.slice(0, 4);

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {displayHighlights.map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-start text-left p-4 rounded-2xl border-slate-200 dark:border-slate-700 border border-red-100 dark:bg-opacity-90"
        >
          <item.icon className="w-6 h-6 text-black mb-2" />
          <span className="text-sm block font-semibold text-slate-900">
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ProductHighlights;
