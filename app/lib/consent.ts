/**
 * Helpers de consentimiento (Shopify Customer Privacy API).
 *
 * Fail-closed: si el script de privacy aún no cargó, devolvemos false y el
 * evento se descarta — nunca trackeamos sin permiso confirmado.
 */
export function analyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  const cp = (window as any).Shopify?.customerPrivacy;
  if (!cp) return false;
  try {
    return cp.analyticsProcessingAllowed?.() === true;
  } catch {
    return false;
  }
}

export function marketingAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  const cp = (window as any).Shopify?.customerPrivacy;
  if (!cp) return false;
  try {
    return cp.marketingAllowed?.() === true;
  } catch {
    return false;
  }
}
