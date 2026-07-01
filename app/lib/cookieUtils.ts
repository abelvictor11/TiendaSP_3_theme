const COOKIE_TTL_DAYS = 90;

function getCookieDomain(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  return hostname !== 'localhost'
    ? `; domain=.${hostname.replace(/^www\./, '')}`
    : '';
}

function getSecureFlag(): string {
  if (typeof window === 'undefined') return '';
  return window.location.protocol === 'https:' ? '; Secure' : '';
}

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(
      '(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)',
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function writeCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; expires=${expires.toUTCString()}; path=/${getCookieDomain()}; SameSite=Lax${getSecureFlag()}`;
}

export {COOKIE_TTL_DAYS};
