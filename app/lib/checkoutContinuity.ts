import {COOKIE_TTL_DAYS, readCookie, writeCookie} from '~/lib/cookieUtils';

const MARKETING_COOKIE = '_marketing_params';
const MARKETING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
] as const;

type MarketingParams = Partial<
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

export function decorateCheckoutUrl(checkoutUrl: string): string {
  if (typeof window === 'undefined' || !checkoutUrl) return checkoutUrl;

  const checkoutHostname = getCheckoutHostname(checkoutUrl);
  if (!checkoutHostname) return checkoutUrl;

  let url: URL;
  try {
    url = new URL(checkoutUrl);
  } catch {
    return checkoutUrl;
  }

  const params = readMarketingParams();
  let changed = false;

  for (const key of MARKETING_PARAMS) {
    const value = params[key];
    if (!value || url.searchParams.has(key)) continue;
    url.searchParams.set(key, value);
    changed = true;
  }

  return changed ? url.toString() : checkoutUrl;
}
