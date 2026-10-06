import initialContent from '~/data/institutional-projects.json';

export type InstitutionalVariant =
  | 'hero'
  | 'stats'
  | 'intro'
  | 'clients'
  | 'sectors'
  | 'process'
  | 'projects'
  | 'brands'
  | 'contact'
  | 'faq';
export interface InstitutionalItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  imageAlt?: string;
}
export interface InstitutionalBlock {
  id: string;
  variant: InstitutionalVariant;
  kicker?: string;
  heading?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  whatsapp?: string;
  items: InstitutionalItem[];
}
interface Field {
  value?: string | null;
  reference?: {image?: {url?: string; altText?: string | null} | null} | null;
  references?: {nodes?: InstitutionalMetaobject[]} | null;
}
export interface InstitutionalMetaobject {
  id: string;
  type?: string;
  [key: string]: Field | string | null | undefined;
}
const variants = new Set([
  'hero',
  'stats',
  'intro',
  'clients',
  'sectors',
  'process',
  'projects',
  'brands',
  'contact',
  'faq',
]);
function field(
  object: InstitutionalMetaobject,
  key: string,
): Field | undefined {
  const value = object[`institutional_${key}`];
  return typeof value === 'object' && value ? value : undefined;
}
function value(object: InstitutionalMetaobject, key: string): string {
  return field(object, key)?.value?.trim() || '';
}
export function safeInstitutionalUrl(url: string | undefined): string {
  if (
    !url ||
    Array.from(url).some(
      (char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
    )
  )
    return '';
  if (
    url.startsWith('#') ||
    (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\'))
  )
    return url;
  try {
    const parsed = new URL(url);
    return ['https:', 'http:', 'tel:', 'mailto:'].includes(parsed.protocol)
      ? url
      : '';
  } catch {
    return '';
  }
}
function image(object: InstitutionalMetaobject) {
  const media = field(object, 'image')?.reference?.image;
  return {
    imageUrl: safeInstitutionalUrl(media?.url || value(object, 'image_url')),
    imageAlt:
      media?.altText || value(object, 'title') || value(object, 'heading'),
  };
}
export function readInstitutionalSection(
  object: InstitutionalMetaobject,
): InstitutionalBlock | null {
  const variant = value(object, 'variant');
  if (!variants.has(variant)) return null;
  const nodes = field(object, 'items')?.references?.nodes || [];
  return {
    id: value(object, 'anchor_id') || object.id,
    variant: variant as InstitutionalVariant,
    kicker: value(object, 'kicker'),
    heading: value(object, 'heading'),
    description: value(object, 'description'),
    ...image(object),
    ctaText: value(object, 'cta_text'),
    ctaUrl: safeInstitutionalUrl(value(object, 'cta_url')),
    secondaryCtaText: value(object, 'secondary_cta_text'),
    secondaryCtaUrl: safeInstitutionalUrl(value(object, 'secondary_cta_url')),
    whatsapp: value(object, 'whatsapp'),
    items: nodes.map((item) => ({
      id: item.id,
      title: value(item, 'title'),
      description: value(item, 'description'),
      icon: value(item, 'icon'),
      ...image(item),
    })),
  };
}
function makeMetaobject(
  input: Record<string, unknown>,
  type: string,
): InstitutionalMetaobject {
  const result: InstitutionalMetaobject = {id: String(input.id), type};
  for (const [key, content] of Object.entries(input)) {
    if (key === 'id') {
      result.institutional_anchor_id = {value: String(content)};
      continue;
    }
    if (key === 'items')
      result.institutional_items = {
        references: {
          nodes: (content as Record<string, unknown>[]).map((item) =>
            makeMetaobject(item, 'ciseco--institutional_item'),
          ),
        },
      };
    else result[`institutional_${key}`] = {value: String(content)};
  }
  return result;
}
export function resolveInstitutionalRoute<T>(
  route: T | null | undefined,
): T | ReturnType<typeof createDefaultInstitutionalRoute> {
  return route ?? createDefaultInstitutionalRoute();
}
export function createDefaultInstitutionalRoute() {
  return {
    id: 'institutional-default',
    type: 'ciseco--route',
    title: {value: initialContent.title},
    sections: {
      references: {
        nodes: initialContent.sections.map((section) =>
          makeMetaobject(
            section as unknown as Record<string, unknown>,
            'ciseco--section_institutional',
          ),
        ),
      },
    },
  };
}
export interface InstitutionalInquiry {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  city?: string;
  sector?: string;
  area?: string;
  message?: string;
  consent?: boolean;
}
export function buildInstitutionalInquiry(
  input: InstitutionalInquiry,
  phone: string,
): string {
  const number = phone.replace(/\D/g, '');
  if (!/^\d{8,15}$/.test(number))
    throw new Error('Contacto comercial no disponible.');
  const required = [
    'name',
    'company',
    'email',
    'phone',
    'city',
    'sector',
    'message',
  ] as const;
  if (
    input.consent !== true ||
    required.some(
      (key) => typeof input[key] !== 'string' || !input[key]?.trim(),
    ) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || '')
  ) {
    throw new Error(
      'Completa los campos obligatorios y acepta el tratamiento de datos.',
    );
  }
  const text = [
    'Hola, me interesa una asesoría para un proyecto institucional.',
    `Nombre: ${input.name?.trim()}`,
    `Empresa / institución: ${input.company?.trim()}`,
    `Correo: ${input.email?.trim()}`,
    `Teléfono: ${input.phone?.trim()}`,
    `Ciudad: ${input.city?.trim()}`,
    `Tipo de proyecto: ${input.sector?.trim()}`,
    input.area?.trim() ? `Área aproximada: ${input.area.trim()} m²` : '',
    `Proyecto: ${input.message?.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
export const institutionalSeo = {
  title: initialContent.title,
  description: initialContent.description,
};
