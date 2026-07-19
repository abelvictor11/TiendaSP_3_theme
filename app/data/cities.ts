/**
 * City landing pages (`/ciudad/:city.html`).
 *
 * Background: the pre-Hydrogen storefront had one `/ciudad/{city}.html`
 * page per major Colombian city, and Google Search Console shows real
 * historical clicks on several of those URLs even though they now 404
 * (169-517 clicks each over 16 months). Rather than hand-build a page per
 * city (there were ~9-32 of these historically, and most of that copy
 * would be thin, near-duplicate "we ship to X" boilerplate — a classic
 * doorway-page SEO risk), this app has ONE reusable route
 * (`app/routes/($locale).ciudad.$city[.html].tsx`) driven by this config.
 *
 * Seeded with only the 4 cities with the strongest historical GSC traffic
 * signal: Bogotá, Medellín, Bucaramanga, Barranquilla. To add a 5th city,
 * add one entry below — no route or component changes needed. Keep the
 * `paragraph` copy honest: reference the city name, its real metro-area
 * municipalities (verifiable facts, not marketing invention), and the
 * store's actual *national* free-shipping policy. Do not invent
 * city-specific delivery-time promises (e.g. "entrega en 24 horas") unless
 * that claim is genuinely published elsewhere on the site for that city.
 */

export interface CityConfig {
  /** URL slug, matches the `:city` route param (before `.html`). */
  slug: string;
  /** Display name, used for the H1 and page title. */
  name: string;
  /** Department/region, for on-page context and JSON-LD. */
  department: string;
  /** Short, honest, city-specific paragraph shown on the page. */
  paragraph: string;
}

export const CITIES: CityConfig[] = [
  {
    slug: 'bogota',
    name: 'Bogotá',
    department: 'Bogotá D.C.',
    paragraph:
      'Enviamos a todo Bogotá y a los municipios de la Sabana. Como en el resto de Colombia, el envío es gratis en pedidos mayores a $200.000.',
  },
  {
    slug: 'medellin',
    name: 'Medellín',
    department: 'Antioquia',
    paragraph:
      'Enviamos a Medellín y a los demás municipios del Valle de Aburrá (Envigado, Itagüí, Bello, Sabaneta, La Estrella y Caldas). Como en el resto de Colombia, el envío es gratis en pedidos mayores a $200.000.',
  },
  {
    slug: 'bucaramanga',
    name: 'Bucaramanga',
    department: 'Santander',
    paragraph:
      'Enviamos a Bucaramanga y a los municipios de su área metropolitana (Floridablanca, Girón y Piedecuesta). Como en el resto de Colombia, el envío es gratis en pedidos mayores a $200.000.',
  },
  {
    slug: 'barranquilla',
    name: 'Barranquilla',
    department: 'Atlántico',
    paragraph:
      'Enviamos a Barranquilla y a los municipios de su área metropolitana (Soledad, Puerto Colombia, Malambo y Galapa). Como en el resto de Colombia, el envío es gratis en pedidos mayores a $200.000.',
  },
];

export function getCityBySlug(
  slug: string | undefined,
): CityConfig | undefined {
  if (!slug) return undefined;
  return CITIES.find((city) => city.slug === slug.toLowerCase());
}
