import {type FC} from 'react';

/**
 * ShippingBadge — Etiqueta visual de envío impulsada por metaobject.
 *
 * Recibe el nodo de metaobject devuelto por la query de Storefront API:
 *   metafield(namespace: "custom", key: "shipping_badge") { reference { ... on Metaobject { ... } } }
 *
 * Campos del metaobject (type: shipping_badge):
 *   - label:            Texto del badge (ej. "Llega en 24 horas")
 *   - icon_emoji:       Emoji opcional (ej. "⚡")
 *   - background_color: Hex (ej. "#FEF3C7")
 *   - text_color:       Hex (ej. "#92400E")
 *   - priority:         Entero para ordenamiento (no usado aquí)
 *
 * El diseño es:
 *   - Gradiente sutil sobre el color base (más vibrante que un flat color)
 *   - Anillo de borde semi-translúcido con el text_color
 *   - Pulse suave en el emoji para llamar la atención
 *   - Usa los colores del metaobject con fallback amarillo cálido (urgencia positiva)
 */

type MetaobjectField = {key: string; value: string | null} | null | undefined;

type ShippingBadgeMetaobject = {
  type?: string;
  label?: MetaobjectField;
  icon_emoji?: MetaobjectField;
  background_color?: MetaobjectField;
  text_color?: MetaobjectField;
  priority?: MetaobjectField;
} | null | undefined;

export interface ShippingBadgeProps {
  metaobject: ShippingBadgeMetaobject;
  /**
   * Tamaño visual.
   *  - "sm" para la card de producto (lista/grilla).
   *  - "md" para la PDP (detalle).
   */
  size?: 'sm' | 'md';
  className?: string;
}

const ShippingBadge: FC<ShippingBadgeProps> = ({
  metaobject,
  size = 'sm',
  className = '',
}) => {
  const label = metaobject?.label?.value;
  if (!label) return null;

  const emoji = metaobject?.icon_emoji?.value ?? '';
  const bg = metaobject?.background_color?.value ?? '#FEF3C7';
  const fg = metaobject?.text_color?.value ?? '#92400E';

  // Gradiente sutil: el color base → una versión 10% más clara (mezcla con blanco)
  const gradient = `linear-gradient(135deg, ${bg} 0%, ${mix(bg, '#ffffff', 0.25)} 100%)`;

  const sizeClasses =
    size === 'md'
      ? 'gap-1.5 px-2.5 py-1 text-xs'
      : 'gap-1 px-2.5 py-1 text-xs';
  const emojiSize = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide shadow-sm ring-1 ring-inset ${sizeClasses} ${className}`}
      style={{
        background: gradient,
        color: fg,
        borderColor: fg + '33', // opaco al 20%
        // El ring-1 usa --tw-ring-color, lo sobrescribimos inline
        ['--tw-ring-color' as any]: fg + '33',
      }}
      aria-label={label}
      title={label}
    >
      {emoji && (
        <span
          className={`${emojiSize} leading-none animate-pulse-soft`}
          aria-hidden="true"
        >
          {emoji}
        </span>
      )}
      <span className="leading-none whitespace-nowrap">{label}</span>
    </span>
  );
};

/**
 * Mezcla dos colores hex en proporción (0..1). Si parsing falla, retorna el base.
 */
function mix(hexA: string, hexB: string, amount: number): string {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  if (!a || !b) return hexA;
  const r = Math.round(a.r * (1 - amount) + b.r * amount);
  const g = Math.round(a.g * (1 - amount) + b.g * amount);
  const bl = Math.round(a.b * (1 - amount) + b.b * amount);
  return '#' + [r, g, bl].map((n) => n.toString(16).padStart(2, '0')).join('');
}

function parseHex(hex: string): {r: number; g: number; b: number} | null {
  const m = hex.replace('#', '');
  if (m.length !== 6) return null;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return {r, g, b};
}

export default ShippingBadge;
