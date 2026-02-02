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
  modelo: 'Modelo',
  cuadro: 'Marco',
  horquilla: 'Horquilla',
  frenos: 'Frenos',
  cambios: 'Cambios',
  ruedas: 'Ruedas',
  manillar: 'Manillar',
  potencia: 'Potencia',
  pu_os: 'Puños',
  direcci_n: 'Dirección',
  tija_de_sill_n: 'Tija de Sillín',
  sill_n: 'Sillín',
  neum_ticos: 'Neumáticos',
  condici_n: 'Condición',
  genero: 'Género',
  material: 'Material',
  modalidad: 'Modalidad',
  tamanollanta: 'Tamaño Llanta',
  potencia_motor: 'Potencia Motor',
  grupo: 'Grupo',
  suspenci_n: 'Suspensión',
  tipo_de_suspenci_n: 'Tipo de Suspensión',
  pedales: 'Pedales',
  suspensi_n_delantera: 'Suspensión Delantera',
  llantas: 'Llantas',
  transmisi_n: 'Transmisión',
  bielas_y_pedalier: 'Bielas y Pedalier',
  cadena: 'Cadena',
  casette: 'Casette',
};

const ProductSpecs: FC<ProductSpecsProps> = ({
  metafields = [],
  className = '',
}) => {
  const specs = (metafields || [])
    .filter((m) => m && m.value && m.key !== 'highlights' && m.key !== 'especificaciones' && m.namespace === 'custom')
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
        label: METAFIELD_LABELS[m.key] || m.key,
        value: displayValue,
      };
    });

  const especificaciones = metafields?.find((m) => m?.key === 'especificaciones')?.value;

  if (specs.length === 0 && !especificaciones) return null;

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold mb-6" style={{fontFamily: 'Montserrat, sans-serif'}}>
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
