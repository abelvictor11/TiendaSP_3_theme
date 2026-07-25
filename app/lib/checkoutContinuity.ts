import {COOKIE_TTL_DAYS, readCookie, writeCookie} from '~/lib/cookieUtils';

const MARKETING_COOKIE = '_marketing_params';
export const MARKETING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  // TikTok Pixel se inicializa activamente en GtmLoader.tsx (aunque
  // PUBLIC_TIKTOK_PIXEL_ID no esté configurado hoy) — sin esto, un clic de
  // ad TikTok que use el permalink directo perdería su ttclid igual que
  // gclid/fbclid lo perdían antes de este fix (Codex, PR #91).
  'ttclid',
] as const;

export type MarketingParams = Partial<
  Record<(typeof MARKETING_PARAMS)[number], string>
>;

function readMarketingParams(): MarketingParams {
  const raw = readCookie(MARKETING_COOKIE);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as MarketingParams;
  } catch {
    return {};
  }
}

function getCheckoutHostname(checkoutUrl?: string | null): string | null {
  if (!checkoutUrl) return null;
  try {
    return new URL(checkoutUrl).hostname;
  } catch {
    try {
      return new URL(`https://${checkoutUrl}`).hostname;
    } catch {
      return null;
    }
  }
}

export function captureMarketingParams(): void {
  if (typeof window === 'undefined') return;

  const searchParams = new URLSearchParams(window.location.search);
  const current: MarketingParams = {};

  for (const key of MARKETING_PARAMS) {
    const value = searchParams.get(key);
    if (value) current[key] = value;
  }

  if (!Object.keys(current).length) return;

  // Last-click attribution: a new campaign touch replaces the stored set
  // rather than merging, so we never mix utm_* from different campaigns.
  writeCookie(MARKETING_COOKIE, JSON.stringify(current), COOKIE_TTL_DAYS);
}

// Puro / isomórfico (sin window ni cookies) para poder reusarlo desde loaders
// de servidor (ej. cart.$lines.tsx, el permalink add-to-cart-y-redirige-a-
// checkout) además del flujo normal en el navegador.
export function appendMarketingParamsToCheckoutUrl(
  checkoutUrl: string,
  params: MarketingParams,
): string {
  if (!checkoutUrl) return checkoutUrl;

  let url: URL;
  try {
    url = new URL(checkoutUrl);
  } catch {
    return checkoutUrl;
  }

  let changed = false;
  for (const key of MARKETING_PARAMS) {
    const value = params[key];
    if (!value || url.searchParams.has(key)) continue;
    url.searchParams.set(key, value);
    changed = true;
  }

  return changed ? url.toString() : checkoutUrl;
}

export function decorateCheckoutUrl(checkoutUrl: string): string {
  if (typeof window === 'undefined' || !checkoutUrl) return checkoutUrl;

  const checkoutHostname = getCheckoutHostname(checkoutUrl);
  if (!checkoutHostname) return checkoutUrl;

  return appendMarketingParamsToCheckoutUrl(checkoutUrl, readMarketingParams());
}
