import React from 'react';
import type {ChildEnhancedMenuItem, ParentEnhancedMenuItem} from '~/lib/utils';
import {Link} from './Link';
import {
  CheckCircleIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import {useFetcher, useRouteLoaderData} from '@remix-run/react';
import Input from './MyInput';
import ButtonCircle from './Button/ButtonCircle';
import {ArrowRightIcon} from '@heroicons/react/24/solid';
import SocialsList from './SocialsList';
import {type AddSubscriberMutation} from 'storefrontapi.generated';
import {FooterMenuDataWrap, HeaderMenuDataWrap} from './Layout';
import type {RootLoader} from '~/root';
import {CITIES} from '~/data/cities';

interface FooterProps {}

// ── Fallbacks de contacto y sedes ──────────────────────────────────────────
// Se usan solo si el metaobject footer_settings no trae el valor. Lo editable
// de verdad vive en Shopify → Contenido → Metaobjetos → Footer Settings.
const CONTACT_FALLBACK = {
  email: 'servicioalcliente@tiendasportfitness.com',
  whatsapp: '573001234567', // solo dígitos, formato internacional
  whatsappLabel: '+57 300 123 4567',
  hours: 'Lun–Vie 8am–6pm · Sáb 9am–1pm',
};

const STORE_LOCATIONS_FALLBACK: {city: string; address: string}[] = [
  {city: 'Medellín', address: 'Carrera 43 #30-91'},
  {city: 'Barranquilla', address: 'Carrera 51B #93-25'},
  {city: 'Llanogrande', address: 'Km 4 Vía Rionegro'},
  {city: 'Palmas', address: 'Cr 38 # 18 - 101 Mall palmagrande local 121'},
];

/** Parsea las sedes del metaobject: una por línea, "Ciudad: Dirección". */
function parseLocations(raw?: string | null) {
  if (!raw) return STORE_LOCATIONS_FALLBACK;
  const parsed = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return {city: '', address: line};
      return {city: line.slice(0, idx).trim(), address: line.slice(idx + 1).trim()};
    });
  return parsed.length ? parsed : STORE_LOCATIONS_FALLBACK;
}

const linkCls =
  'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors';
const headingCls =
  'text-sm font-semibold text-neutral-900 dark:text-neutral-100';

/** Normaliza un título de menú para clasificarlo (sin acentos, minúsculas). */
function normTitle(s?: string | null) {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Reparte los menús del footer (definidos por el merchant en Shopify) en los
 * dos slots con etiqueta fija del nuevo layout — "Sobre {tienda}" y
 * "Políticas" — emparejando por título, con fallback por posición. Todo menú
 * que no entre en esos dos slots (Categorías u otros) se devuelve en `extras`
 * y se muestra abajo como tira horizontal, para no perder ningún link.
 */
function bucketFooterMenus(menus?: ParentEnhancedMenuItem[]) {
  const list = menus ?? [];
  let policies = list.find((m) => /polit|info|legal/.test(normTitle(m.title)));
  let about = list.find(
    (m) =>
      m !== policies &&
      /ayuda|sobre|about|help|nosotros|tienda/.test(normTitle(m.title)),
  );
  // Fallback por posición si no hubo match por título.
  if (!about) about = list.find((m) => m !== policies);
  if (!policies) policies = list.find((m) => m !== about);

  const used = new Set([about, policies].filter(Boolean));
  const extras = list.filter((m) => !used.has(m));
  return {about, policies, extras};
}

function MenuLinks({items}: {items?: ChildEnhancedMenuItem[]}) {
  return (
    <ul className="mt-5 space-y-3 text-sm">
      {items?.map((item, i) => (
        <li key={`${i + item.id}`}>
          {item.to.startsWith('http') ? (
            <a
              href={item.to}
              target={item.target}
              rel="noopener noreferrer"
              className={linkCls}
            >
              {item.title}
            </a>
          ) : (
            <Link
              to={item.to}
              target={item.target}
              prefetch="intent"
              className={linkCls}
            >
              {item.title}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

const Footer: React.FC<FooterProps> = () => {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const shop = rootData?.layout?.shop;

  return (
    <footer
      className="bg-white dark:bg-neutral-900 border-t border-neutral-900/10 dark:border-transparent"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-20 lg:px-8 lg:pt-24">
        {/* ── Fila superior: 5 columnas ── */}
        <HeaderMenuDataWrap>
          {({headerData}) => {
            const socials = headerData.socials;
            const fs = (headerData as any).footerSettings?.nodes?.[0];
            const contact = {
              email: fs?.email?.value || CONTACT_FALLBACK.email,
              whatsapp: fs?.whatsapp?.value || CONTACT_FALLBACK.whatsapp,
              whatsappLabel:
                fs?.whatsapp_label?.value || CONTACT_FALLBACK.whatsappLabel,
              hours: fs?.hours?.value || CONTACT_FALLBACK.hours,
            };
            const locations = parseLocations(fs?.locations?.value);
            return (
            <FooterMenuDataWrap>
              {({footerMenu}) => {
                const {about, policies, extras} = bucketFooterMenus(
                  footerMenu?.items,
                );
                const socialLinks = socials.edges
                  .map((edge) => ({
                    name: edge.node.title?.value || '',
                    href: edge.node.link?.value || '',
                  }))
                  .filter((s) => s.name && s.href);

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
                    {/* 1 · Sobre Tienda Fitness */}
                    <div>
                      <h3 className={headingCls}>
                        Sobre {shop?.name || 'Tienda Fitness'}
                      </h3>
                      <MenuLinks items={about?.items} />
                    </div>

                    {/* 2 · Sociales */}
                    <div>
                      <h3 className={headingCls}>Sociales</h3>
                      <ul className="mt-5 space-y-3 text-sm">
                        {socialLinks.map((s) => (
                          <li key={s.name}>
                            <a
                              href={s.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={linkCls}
                            >
                              {s.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 3 · Políticas */}
                    <div>
                      <h3 className={headingCls}>Políticas</h3>
                      <MenuLinks items={policies?.items} />
                    </div>

                    {/* 4 · Contacto */}
                    <div>
                      <h3 className={headingCls}>Contacto</h3>
                      <ul className="mt-5 space-y-4 text-sm">
                        <li>
                          <a
                            href={`mailto:${contact.email}`}
                            className={`flex items-start gap-2 ${linkCls}`}
                          >
                            <EnvelopeIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="break-all">{contact.email}</span>
                          </a>
                        </li>
                        <li>
                          <a
                            href={`https://wa.me/${contact.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-start gap-2 ${linkCls}`}
                          >
                            <PhoneIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>WhatsApp {contact.whatsappLabel}</span>
                          </a>
                        </li>
                        <li className="flex items-start gap-2 text-neutral-600 dark:text-neutral-400">
                          <ClockIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{contact.hours}</span>
                        </li>
                      </ul>
                    </div>

                    {/* 5 · Direcciones */}
                    <div>
                      <h3 className={`${headingCls} flex items-center gap-2`}>
                        <MapPinIcon className="w-4 h-4" />
                        Direcciones
                      </h3>
                      <ul className="mt-5 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                        {locations.map((loc) => (
                          <li key={loc.city + loc.address}>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                              {loc.city}:
                            </span>{' '}
                            {loc.address}
                          </li>
                        ))}
                      </ul>
                    </div>
                    </div>

                    {/* Menús extra del footer (Categorías u otros) como tira
                        horizontal, para no perder ningún link. */}
                    {extras.map((menu) => (
                      <div
                        key={menu.id}
                        className="mt-14 border-t border-neutral-900/10 dark:border-neutral-700 pt-8"
                      >
                        <h3 className={headingCls}>{menu.title}</h3>
                        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          {menu.items?.map((item, i) => (
                            <li key={`${i + item.id}`}>
                              {item.to.startsWith('http') ? (
                                <a
                                  href={item.to}
                                  target={item.target}
                                  rel="noopener noreferrer"
                                  className={linkCls}
                                >
                                  {item.title}
                                </a>
                              ) : (
                                <Link
                                  to={item.to}
                                  target={item.target}
                                  prefetch="intent"
                                  className={linkCls}
                                >
                                  {item.title}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </>
                );
              }}
            </FooterMenuDataWrap>
            );
          }}
        </HeaderMenuDataWrap>

        {/* ── Envíos a tu ciudad (tira horizontal, landing pages SEO) ── */}
        <div className="mt-14 border-t border-neutral-900/10 dark:border-neutral-700 pt-8">
          <h3 className={`${headingCls} flex items-center gap-2`}>
            <TruckIcon className="w-4 h-4" />
            Envíos a tu ciudad
          </h3>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {CITIES.map((city) => (
              <li key={city.slug}>
                <Link
                  to={`/ciudad/${city.slug}.html`}
                  prefetch="intent"
                  className={linkCls}
                >
                  Envíos a {city.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Fila inferior: descripción + newsletter ── */}
        <div className="mt-14 grid gap-10 lg:grid-cols-2 border-t border-neutral-900/10 dark:border-neutral-700 pt-10">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Sobre {shop?.name || 'Tienda Fitness'}
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              <HeaderMenuDataWrap>
                {({headerData}) =>
                  (headerData as any).footerSettings?.nodes?.[0]?.description
                    ?.value ||
                  shop?.description ||
                  'En Tienda Fitness equipamos tu entrenamiento con máquinas y accesorios de gimnasio de las mejores marcas, con envíos a todo el país y respaldo posventa en nuestras sedes.'
                }
              </HeaderMenuDataWrap>
            </p>
          </div>
          <div className="lg:max-w-md lg:justify-self-end w-full">
            <WidgetAddSubscriberForm />
          </div>
        </div>

        {/* ── Copyright + iconos sociales ── */}
        <div className="mt-14 border-t border-neutral-900/10 dark:border-neutral-700 pt-8 md:flex md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-3 md:order-2">
            <HeaderMenuDataWrap>
              {({headerData: {socials}}) => (
                <SocialsList
                  data={socials.edges.map((edge) => {
                    const node = edge.node;
                    return {
                      name: node.title?.value || '',
                      icon: node.icon?.reference?.image?.url || '',
                      href: node.link?.value || '',
                    };
                  })}
                  itemClass="block w-6 h-6 opacity-90 hover:opacity-100"
                  className="!gap-5"
                />
              )}
            </HeaderMenuDataWrap>
          </div>
          <p className="mt-8 text-[13px] leading-5 text-gray-500 md:order-1 md:mt-0">
            © {new Date().getFullYear()} {shop?.name}. Todos los derechos
            reservados.
          </p>
        </div>
      </div>

      {/* Footer bottom — Certificaciones y sellos de confianza */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 flex flex-wrap items-center justify-center gap-6">
          <a
            href="https://www.sic.gov.co"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-opacity hover:opacity-80"
            aria-label="Vigilado Superintendencia de Industria y Comercio"
          >
            <img
              src="https://cdn.shopify.com/s/files/1/0646/1761/1341/files/sic-1.webp?v=1776991272"
              alt="Vigilado SIC"
              className="h-14 w-auto object-contain"
              loading="lazy"
            />
          </a>
        </div>
      </div>
    </footer>
  );
};

export function WidgetAddSubscriberForm() {
  const fetcher = useFetcher();
  const {customerCreate} = (fetcher.data || {}) as AddSubscriberMutation;

  return (
    <div
      className={`nc-WidgetAddSubscriberForm overflow-hidden rounded-3xl border border-neutral-100 dark:border-neutral-700`}
    >
      <div
        className={`nc-WidgetHeading1 flex items-center justify-between p-4 border-b border-neutral-100 `}
      >
        <h2 className="flex flex-wrap gap-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          <EnvelopeIcon className="w-6 h-6" />
          <span>Manténgase actualizado</span>
        </h2>
      </div>

      <div className="p-4 xl:p-5">
        <span className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          Suscríbete a nuestro boletín para recibir las últimas actualizaciones
          y ofertas especiales.
        </span>
        <div className="mt-4">
          <fetcher.Form
            className="relative"
            method="post"
            action="/?index"
            preventScrollReset
          >
            <Input
              required
              aria-required
              placeholder="Introduzca su dirección de correo electrónico"
              type="email"
              className="rounded-2xl"
              name="new_subscribe_email"
            />
            <ButtonCircle
              type="submit"
              name="_action"
              value="add_new_subscribe"
              className="absolute transform top-1/2 -translate-y-1/2 right-1"
              disabled={fetcher.state === 'submitting'}
            >
              <ArrowRightIcon className="w-5 h-5" />
            </ButtonCircle>
          </fetcher.Form>

          {customerCreate?.customerUserErrors[0]?.message && (
            <div className="text-red-400 flex gap-2 mt-1 ml-1">
              <InformationCircleIcon className="w-4 h-4" />
              <i className="text-xs">
                {customerCreate?.customerUserErrors[0]?.message}
              </i>
            </div>
          )}
          {!customerCreate?.customerUserErrors.length &&
            customerCreate?.customer?.id && (
              <div className="text-green-500 flex gap-2 mt-1 ml-1">
                <CheckCircleIcon className="w-4 h-4" />
                <i className="text-xs">¡Gracias por suscribirte!</i>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default Footer;
