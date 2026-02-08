import {type FC} from 'react';

interface Metafield {
  key: string;
  namespace: string;
  value: string | null;
}

interface ProductSpecsProps {
  metafields?: Metafield[];
  className?: string;
}

interface RichTextNode {
  type: string;
  value?: string;
  bold?: boolean;
  italic?: boolean;
  children?: RichTextNode[];
  url?: string;
  title?: string;
  target?: string;
  listType?: string;
}

function renderRichTextNode(node: RichTextNode): string {
  if (!node) return '';
  
  switch (node.type) {
    case 'root':
      return node.children?.map(renderRichTextNode).join('') || '';
    case 'paragraph':
      return `<p>${node.children?.map(renderRichTextNode).join('') || ''}</p>`;
    case 'heading':
      return `<h3>${node.children?.map(renderRichTextNode).join('') || ''}</h3>`;
    case 'list':
      const tag = node.listType === 'ordered' ? 'ol' : 'ul';
      return `<${tag}>${node.children?.map(renderRichTextNode).join('') || ''}</${tag}>`;
    case 'list-item':
      return `<li>${node.children?.map(renderRichTextNode).join('') || ''}</li>`;
    case 'link':
      return `<a href="${node.url || '#'}" target="${node.target || '_self'}">${node.children?.map(renderRichTextNode).join('') || ''}</a>`;
    case 'text':
      let text = node.value || '';
      text = text.replace(/\n/g, '<br/>');
      if (node.bold) text = `<strong>${text}</strong>`;
      if (node.italic) text = `<em>${text}</em>`;
      return text;
    default:
      return node.children?.map(renderRichTextNode).join('') || node.value || '';
  }
}

function parseRichText(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString) as RichTextNode;
    if (parsed && parsed.type === 'root') {
      return renderRichTextNode(parsed);
    }
    return jsonString;
  } catch {
    return jsonString;
  }
}

const METAFIELD_LABELS: Record<string, string> = {
  // Custom namespace
  alto: 'Alto',
  ancho: 'Ancho',
  bater_a: 'Batería',
  bielas: 'Bielas',
  cadena: 'Cadena',
  cassette: 'Cassette',
  frenos: 'Frenos',
  horquilla: 'Horquilla',
  largo: 'Largo',
  llantas: 'Llantas',
  manillar: 'Manillar',
  marco: 'Marco',
  motor: 'Motor',
  pedalier: 'Pedalier',
  ruedas: 'Ruedas',
  sensor: 'Sensor',
  sillin: 'Sillín',
  suspensi_n: 'Suspensión',
  tenedor: 'Tenedor',
  tija_de_sillin: 'Tija de Sillín',
  // Global namespace
  altoshopi: 'Alto',
  ancho_llanta_compatibleshopi: 'Ancho Llanta Compatible',
  ancho_suspension: 'Ancho Suspensión',
  anchodelproductoshopi: 'Ancho del Producto',
  anchoshopi: 'Ancho',
  angulo_de_rotacion: 'Ángulo de Rotación',
  anoshopi: 'Año',
  bluetooth: 'Bluetooth',
  cadencia: 'Cadencia',
  cantidad_de_huecos: 'Cantidad de Huecos',
  capacidad_de_la_bateria: 'Capacidad de Batería',
  capacidadshopi: 'Capacidad',
  caracteristicas_del_material: 'Características del Material',
  color_del_lente: 'Color del Lente',
  compatible_monitor_de_ritmo_cardiaco: 'Compatible Monitor Cardíaco',
  condiciones: 'Condiciones',
  consistenciashopi: 'Consistencia',
  contiene_lactosashopi: 'Contiene Lactosa',
  desbloqueo: 'Desbloqueo',
  es_veganoshopi: 'Es Vegano',
  espigo: 'Espigo',
  forma_del_candadoshopi: 'Forma del Candado',
  fotocromatica: 'Fotocromática',
  funciones_adicionalesshopi: 'Funciones Adicionales',
  garantia: 'Garantía',
  generoshopi: 'Género',
  guantesldedo: 'Guantes Dedo',
  largoshopi: 'Largo',
  libre_de_glutenshopi: 'Libre de Gluten',
  mapas: 'Mapas',
  materialshopi: 'Material',
  microfono: 'Micrófono',
  numero_de_eslabonesshopi: 'Número de Eslabones',
  numero_de_herramientas: 'Número de Herramientas',
  palancas: 'Palancas',
  pantalla: 'Pantalla',
  peso_producto: 'Peso',
  posicion_manzana: 'Posición Manzana',
  posicionshopi: 'Posición',
  'potencia_e-bike': 'Potencia E-Bike',
  recorrido: 'Recorrido',
  sensibilidadshopi: 'Sensibilidad',
  sistema_de_fijacionshopi: 'Sistema de Fijación',
  sistema_de_montajeshopi: 'Sistema de Montaje',
  tamano_de_rinshopi: 'Tamaño de Rin',
  tensor: 'Tensor',
  tipo_de_alimentacionshopi: 'Tipo de Alimentación',
  tipo_de_aperturashopi: 'Tipo de Apertura',
  tipo_de_bicicletashopi: 'Tipo de Bicicleta',
  tipo_de_bloqueo: 'Tipo de Bloqueo',
  tipo_de_eje: 'Tipo de Eje',
  tipo_de_frenoshopi: 'Tipo de Frenos',
  tipo_de_mangashopi: 'Tipo de Manga',
  tipo_de_plato: 'Tipo de Plato',
  tipo_de_valvulashopi: 'Tipo de Válvula',
  tipodeplato: 'Tipo de Plato',
  tubelessshopi: 'Tubeless',
  velocidades: 'Velocidades',
  wirelesscicloc: 'Wireless',
};

function formatKeyToLabel(key: string): string {
  if (METAFIELD_LABELS[key]) return METAFIELD_LABELS[key];
  return key
    .replace(/shopi$/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const ProductSpecs: FC<ProductSpecsProps> = ({
  metafields = [],
  className = '',
}) => {
  const specs = (metafields || [])
    .filter((m) => m && m.value && m.key !== 'highlights' && m.key !== 'especificaciones' && m.key !== 'condiciones' && (m.namespace === 'custom' || m.namespace === 'global'))
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
        label: formatKeyToLabel(m.key),
        value: displayValue,
      };
    });

  const especificaciones = metafields?.find((m) => m?.key === 'especificaciones')?.value;

  if (specs.length === 0 && !especificaciones) return null;

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6" style={{fontFamily: '"nudista-web", sans-serif'}}>
        Especificaciones Técnicas
      </h2>

      {/* Specs Grid */}
      {specs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {specs.map((spec, index) => (
            <div
              key={index}
              className="flex flex-col p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
            >
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
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
          dangerouslySetInnerHTML={{__html: parseRichText(especificaciones)}}
        />
      )}
    </div>
  );
};

export default ProductSpecs;
