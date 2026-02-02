import {type FC} from 'react';
import {
  ArrowDownTrayIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';

interface Spec {
  label: string;
  value: string | null | undefined;
  icon?: string;
}

interface ProductSpecsProps {
  cuadro?: string;
  horquilla?: string;
  frenos?: string;
  cambios?: string;
  ruedas?: string;
  manillar?: string;
  potencia?: string;
  punos?: string;
  direccion?: string;
  tijaSillin?: string;
  sillin?: string;
  neumaticos?: string;
  modelo?: string;
  especificaciones?: string;
  className?: string;
}

const ProductSpecs: FC<ProductSpecsProps> = ({
  cuadro,
  horquilla,
  frenos,
  cambios,
  ruedas,
  manillar,
  potencia,
  punos,
  direccion,
  tijaSillin,
  sillin,
  neumaticos,
  modelo,
  especificaciones,
  className = '',
}) => {
  const specs: Spec[] = [
    {label: 'Modelo', value: modelo},
    {label: 'Cuadro', value: cuadro},
    {label: 'Horquilla', value: horquilla},
    {label: 'Frenos', value: frenos},
    {label: 'Cambios', value: cambios},
    {label: 'Ruedas', value: ruedas},
    {label: 'Manillar', value: manillar},
    {label: 'Potencia', value: potencia},
    {label: 'Puños', value: punos},
    {label: 'Dirección', value: direccion},
    {label: 'Tija de Sillín', value: tijaSillin},
    {label: 'Sillín', value: sillin},
    {label: 'Neumáticos', value: neumaticos},
  ].filter((spec) => spec.value);

  if (specs.length === 0 && !especificaciones) return null;

  return (
    <div className={`${className}`}>
      <h2 className="text-2xl font-bold mb-6" style={{fontFamily: 'Montserrat, sans-serif'}}>
        Especificaciones Técnicas
      </h2>

      {/* Specs Grid */}
      {specs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {specs.map((spec, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
            >
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {spec.label}
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {spec.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Rich Text Specifications */}
      {especificaciones && (
        <div 
          className="prose prose-sm dark:prose-invert max-w-none mt-6"
          dangerouslySetInnerHTML={{__html: especificaciones}}
        />
      )}
    </div>
  );
};

export default ProductSpecs;
