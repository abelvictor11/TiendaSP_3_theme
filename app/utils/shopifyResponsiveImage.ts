const RESPONSIVE_WIDTHS = [640, 828, 1080, 1280, 1920, 2560];

export function shopifyImageUrlAtWidth(url: string, width: number) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}`;
}

export function shopifyImageSrcSet(url: string) {
  return RESPONSIVE_WIDTHS.map(
    (width) => `${shopifyImageUrlAtWidth(url, width)} ${width}w`,
  ).join(', ');
}
