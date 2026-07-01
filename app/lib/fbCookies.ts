/**
 * Utilidades para Meta Pixel / CAPI cookies (_fbp, _fbc).
 *
 * Meta usa estas cookies para deduplicar y mejorar la atribución:
 *  - _fbp: cookie first-party generada por fbevents.js (browser ID)
 *  - _fbc: cookie first-party que contiene el fbclid (click ID) de Meta Ads
 *
 * Cuando el usuario llega desde un anuncio de Meta, Facebook añade
 * ?fbclid=... a la URL. fbevents.js lo persiste en _fbc, pero si el pixel
 * no está completamente cargado perdemos el dato. Este helper lo captura
 * directamente y garantiza que se envíe al servidor.
 */

import {COOKIE_TTL_DAYS, readCookie, writeCookie} from '~/lib/cookieUtils';

const FBP_COOKIE = '_fbp';
const FBC_COOKIE = '_fbc';

/**
 * Captura fbclid desde la URL y escribe _fbc si todavía no existe.
 * Formato oficial de _fbc: fb.{subdomainIndex}.{timestamp}.{fbclid}
 * https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/
 */
export function captureFbclid(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get('fbclid');
  if (!fbclid) return;
  const existing = readCookie(FBC_COOKIE);
  // Refresh when a new ad click arrives: _fbc ends with `.{fbclid}`, so only
  // skip the write when the stored click id matches the current one.
  if (existing && existing.endsWith(`.${fbclid}`)) return;
  const value = `fb.1.${Date.now()}.${fbclid}`;
  writeCookie(FBC_COOKIE, value, COOKIE_TTL_DAYS);
}

export function getFbp(): string | null {
  return readCookie(FBP_COOKIE);
}

export function getFbc(): string | null {
  return readCookie(FBC_COOKIE);
}

/**
 * Devuelve un objeto con las cookies de Meta listas para enviar al servidor
 * (por ejemplo, como cart attributes o como user_data de fbq).
 */
export function getFbCookies(): {fbp?: string; fbc?: string} {
  const out: {fbp?: string; fbc?: string} = {};
  const fbp = getFbp();
  const fbc = getFbc();
  if (fbp) out.fbp = fbp;
  if (fbc) out.fbc = fbc;
  return out;
}
