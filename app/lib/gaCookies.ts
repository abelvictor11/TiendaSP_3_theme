/**
 * Lectura de cookies de GA4 para continuidad de sesión hacia el checkout.
 *
 * El checkout vive en otro dominio: el webhook de GA4 Measurement Protocol
 * necesita el MISMO client_id (cookie `_ga`) y session_id (cookie
 * `_ga_<stream>`) del navegador para que la compra se atribuya a la sesión
 * y fuente originales en vez de crear un usuario nuevo "(direct)/(none)".
 * Estos valores se persisten como cart attributes antes de ir al checkout.
 */
import {readCookie} from '~/lib/cookieUtils';

export function getGaCookies(): {clientId?: string; sessionId?: string} {
  if (typeof document === 'undefined') return {};

  // _ga = "GA1.1.1234567890.1700000000" → client_id = "1234567890.1700000000"
  const ga = readCookie('_ga');
  const clientId = ga?.match(/^GA\d+\.\d+\.(.+)$/)?.[1];

  // _ga_XXXXXXX = "GS1.1.1700000000.5.1..." (o "GS2.1.s1700000000$o5...")
  // session_id es el timestamp que inicia la 3ª sección.
  let sessionId: string | undefined;
  const m = document.cookie.match(/(?:^|;\s*)_ga_[A-Z0-9]+=([^;]+)/);
  if (m?.[1]) {
    const value = decodeURIComponent(m[1]);
    sessionId = value.match(/^GS\d+\.\d+\.s?(\d+)/)?.[1];
  }

  return {clientId, sessionId};
}
