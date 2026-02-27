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
  dimensiones?: string;
  pesoMaxUsuario?: string;
  tipoResistencia?: string;
  nivelesResistencia?: string;
  potenciaMotor?: string;
  pesoProducto?: string;
  garantia?: string;
  nivelRuido?: string;
  conectividad?: string;
  certificaciones?: string;
  plegable?: boolean;
  requiereElectricidad?: boolean;
  fichaTecnicaPdf?: string;
  videoProducto?: string;
  className?: string;
}

const ProductSpecs: FC<ProductSpecsProps> = ({
  dimensiones,
  pesoMaxUsuario,
  tipoResistencia,
  nivelesResistencia,
  potenciaMotor,
  pesoProducto,
  garantia,
  nivelRuido,
  conectividad,
  certificaciones,
  plegable,
  requiereElectricidad,
  fichaTecnicaPdf,
  videoProducto,
  className = '',
}) => {
  const specs: Spec[] = [
    {label: 'Dimensiones', value: dimensiones},
    {label: 'Peso máx. usuario', value: pesoMaxUsuario},
    {label: 'Tipo de resistencia', value: tipoResistencia},
    {label: 'Niveles de resistencia', value: nivelesResistencia},
    {label: 'Potencia motor', value: potenciaMotor},
    {label: 'Peso del producto', value: pesoProducto},
    {label: 'Garantía', value: garantia},
    {label: 'Nivel de ruido', value: nivelRuido},
    {label: 'Conectividad', value: conectividad},
    {label: 'Certificaciones', value: certificaciones},
    {label: 'Plegable', value: plegable !== undefined ? (plegable ? 'Sí' : 'No') : undefined},
    {label: 'Requiere electricidad', value: requiereElectricidad !== undefined ? (requiereElectricidad ? 'Sí' : 'No') : undefined},
  ].filter((spec) => spec.value);

  if (specs.length === 0 && !fichaTecnicaPdf && !videoProducto) return null;

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
              className="flex justify-between items-center py-3 px-4 bg-slate-50 dark:bg-secondary-700 rounded-lg"
            >
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {spec.label}
              </span>
              <span className="text-sm font-semibold text-secondary-800 dark:text-white">
                {spec.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Downloads & Video */}
      {(fichaTecnicaPdf || videoProducto) && (
        <div className="flex flex-wrap gap-3 mt-6">
          {fichaTecnicaPdf && (
            <a
              href={fichaTecnicaPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary-800 text-white rounded-lg hover:bg-secondary-700 transition-colors text-sm font-medium"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Descargar Ficha Técnica
            </a>
          )}
          {videoProducto && (
            <a
              href={videoProducto}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Ver Video del Producto
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSpecs;
