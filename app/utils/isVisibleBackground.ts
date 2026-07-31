/**
 * Decide si un color de fondo (tecleado por el merchant en un metaobject)
 * amerita renderizar el panel `BackgroundSection` detrás de una sección.
 *
 * Devuelve `false` — es decir, "no dibujar fondo" — cuando el valor:
 *   · está vacío / es `transparent`
 *   · es blanco (`#fff`, `#ffffff`, `white`)
 *   · es un GRIS MUY CLARO (near-white y poco saturado, ej. `#f7f7f7`,
 *     `#e5e7eb`, `#f5f5f5`, `#eee`…). Estos no aportan nada visual y sólo
 *     dejan un panel gris "suelto" y vacío.
 *
 * Un color claro pero saturado (celeste, crema, etc.) SÍ se considera un
 * fondo intencional y devuelve `true`, para no ocultar diseños a propósito.
 *
 * Se basa en el color, no en una lista de hex, así que cubre cualquier gris
 * claro sin tener que perseguir cada valor.
 */
export function isVisibleBackground(value?: string | null): boolean {
  const v = value?.trim().toLowerCase();
  if (!v || v === 'transparent' || v === 'white') return false;

  const rgb = parseColor(v);
  // Si no se puede parsear, asumimos que es un fondo intencional.
  if (!rgb) return true;

  const {r, g, b} = rgb;
  const min = Math.min(r, g, b);
  const spread = Math.max(r, g, b) - min;

  // Blanco puro o gris muy claro (todas las canales altas y casi iguales).
  const isNearWhiteGray = min >= 220 && spread <= 16;
  return !isNearWhiteGray;
}

function parseColor(v: string): {r: number; g: number; b: number} | null {
  // #rgb / #rrggbb
  if (v.startsWith('#')) {
    let hex = v.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return {r, g, b};
  }
  // rgb() / rgba()
  const m = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    return {r: Number(m[1]), g: Number(m[2]), b: Number(m[3])};
  }
  return null;
}
