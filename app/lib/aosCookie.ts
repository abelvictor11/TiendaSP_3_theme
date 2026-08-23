/**
 * visitorId de AttributionOS (_aos_vid).
 *
 * AttributionOS construye el "journey" de atribución (pageviews → purchase)
 * enlazando eventos por este UUID. Replica la lógica del pixel.js nativo de
 * AttributionOS (genera un UUID v4 y lo persiste 365 días) para que el
 * mismo visitorId sobreviva entre el pageview beacon y el cart attribute
 * que se lee luego en el webhook de purchase.
 */
import {readCookie, writeCookie} from '~/lib/cookieUtils';

const AOS_VID_COOKIE = '_aos_vid';
const COOKIE_TTL_DAYS = 365;

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Devuelve el visitorId existente o genera y persiste uno nuevo. */
export function getOrCreateAosVisitorId(): string {
  if (typeof document === 'undefined') return '';
  const existing = readCookie(AOS_VID_COOKIE);
  if (existing) return existing;
  const vid = uuidv4();
  writeCookie(AOS_VID_COOKIE, vid, COOKIE_TTL_DAYS);
  return vid;
}

export function getAosVisitorId(): string | null {
  return readCookie(AOS_VID_COOKIE);
}
