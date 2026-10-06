import type {SectionInstitutionalFragment} from 'storefrontapi.generated';
import {useState, type FormEvent} from 'react';
import {
  ArrowUpRightIcon,
  CheckIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  HomeModernIcon,
  HeartIcon,
  TrophyIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import {
  buildInstitutionalInquiry,
  readInstitutionalSection,
  type InstitutionalBlock,
  type InstitutionalInquiry,
} from '~/lib/institutional';

const icons = {
  fitness: BoltIcon,
  hotel: BuildingOffice2Icon,
  company: HeartIcon,
  residential: HomeModernIcon,
  education: AcademicCapIcon,
  sports: TrophyIcon,
};
const button =
  'inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary-600 px-7 py-3 font-semibold text-white transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-600';
function Heading({block}: {block: InstitutionalBlock}) {
  return (
    <div className="mb-9 max-w-3xl">
      {block.kicker && (
        <p className="mb-4 text-xs font-bold tracking-widest text-primary-600">
          {block.kicker}
        </p>
      )}
      {block.heading && (
        <h2 className="whitespace-pre-line font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          {block.heading}
        </h2>
      )}
      {block.description && (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {block.description}
        </p>
      )}
    </div>
  );
}
function Cta({block}: {block: InstitutionalBlock}) {
  return block.ctaUrl && block.ctaText ? (
    <a className={button} href={block.ctaUrl}>
      {block.ctaText}
      <ArrowUpRightIcon className="h-5 w-5" aria-hidden="true" />
    </a>
  ) : null;
}
export function SectionInstitutional(
  props: SectionInstitutionalFragment & {id: string},
) {
  const block = readInstitutionalSection(props);
  if (!block) return null;
  return <InstitutionalBlockView block={block} />;
}
export function InstitutionalBlockView({
  block: b,
}: {
  block: InstitutionalBlock;
}) {
  if (b.variant === 'hero')
    return (
      <section
        id={b.id}
        className="relative isolate overflow-hidden bg-slate-900 text-white"
      >
        {b.imageUrl && (
          <img
            src={b.imageUrl}
            alt={b.imageAlt || ''}
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/60 to-black/10" />
        <div className="container py-20 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="mb-6 text-xs font-bold tracking-widest text-white/90">
              {b.kicker}
            </p>
            <h1 className="whitespace-pre-line font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {b.heading}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              {b.description}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Cta block={b} />
              {b.secondaryCtaUrl && (
                <a
                  href={b.secondaryCtaUrl}
                  className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold underline underline-offset-8"
                >
                  {b.secondaryCtaText}
                  <ArrowUpRightIcon className="h-4 w-4" />
                </a>
              )}
            </div>
            <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/90">
              {b.items.map((i) => (
                <li key={i.id} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-red-400" />
                  {i.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  if (b.variant === 'stats')
    return (
      <section
        id={b.id}
        aria-label="Nuestro respaldo"
        className="border-b border-slate-200 bg-white"
      >
        <div className="container grid grid-cols-2 gap-8 py-9 lg:grid-cols-4">
          {b.items.map((i) => (
            <div key={i.id}>
              <p className="font-display text-xl font-semibold sm:text-2xl">
                {i.title}
              </p>
              <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                {i.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  if (b.variant === 'intro')
    return (
      <section
        id={b.id}
        className="container grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24"
      >
        <div>
          <Heading block={b} />
          <ul className="mb-8 space-y-5">
            {b.items.map((i) => (
              <li key={i.id} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-primary-600">
                  <CheckIcon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{i.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {i.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Cta block={b} />
        </div>
        {b.imageUrl && (
          <div className="overflow-hidden rounded-3xl bg-slate-100">
            <img
              src={b.imageUrl}
              alt={b.imageAlt || 'Planificación de espacios fitness'}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </div>
        )}
      </section>
    );
  if (b.variant === 'contact')
    return (
      <section id={b.id} className="scroll-mt-24 bg-slate-100 py-16 lg:py-24">
        <div className="container grid gap-12 lg:grid-cols-2">
          <div>
            <Heading block={b} />
            <p className="mb-6 text-sm font-semibold">
              Asesoría comercial · +{b.whatsapp}
            </p>
            <div className="space-y-5">
              {b.items.map((i) => (
                <div key={i.id}>
                  <h3 className="text-sm font-semibold">{i.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{i.description}</p>
                </div>
              ))}
            </div>
          </div>
          <InquiryForm block={b} />
        </div>
      </section>
    );
  if (b.variant === 'faq')
    return (
      <section id={b.id} className="container py-16 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <Heading block={b} />
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {b.items.map((i) => (
              <details key={i.id} className="group py-5">
                <summary className="cursor-pointer text-base font-semibold marker:text-primary-600">
                  {i.title}
                </summary>
                <p className="mt-4 pr-6 text-sm leading-relaxed text-slate-600">
                  {i.description}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  const compact = b.variant === 'clients' || b.variant === 'brands';
  const columns = b.variant === 'process' ? 'xl:grid-cols-4' : 'lg:grid-cols-3';
  return (
    <section
      id={b.id}
      className={
        b.variant === 'sectors' || b.variant === 'brands'
          ? 'bg-slate-50 py-16 lg:py-24'
          : 'py-16 lg:py-24'
      }
    >
      <div className="container">
        <Heading block={b} />
        {compact ? (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {b.items.map((i) => (
              <li
                key={i.id}
                className="flex min-h-24 items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center font-display text-lg font-semibold tracking-tight"
              >
                {i.imageUrl ? (
                  <img
                    src={i.imageUrl}
                    alt={i.title}
                    loading="lazy"
                    className="max-h-12 max-w-full object-contain"
                  />
                ) : (
                  i.title
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className={`grid gap-6 md:grid-cols-2 ${columns}`}>
            {b.items.map((i, index) => {
              const Icon = icons[i.icon as keyof typeof icons] || BoltIcon;
              return (
                <article
                  key={i.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  {b.variant === 'projects' && i.imageUrl && (
                    <img
                      src={i.imageUrl}
                      alt={i.imageAlt || i.title}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  )}
                  <div className="p-7">
                    {b.variant === 'process' ? (
                      <span className="mb-7 block font-display text-4xl font-semibold text-primary-600">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    ) : (
                      b.variant === 'sectors' && (
                        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-primary-600">
                          <Icon className="h-7 w-7" />
                        </span>
                      )
                    )}
                    <h3 className="font-display text-xl font-semibold">
                      {i.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {i.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {b.ctaUrl && (
          <div className="mt-10">
            <Cta block={b} />
          </div>
        )}
      </div>
    </section>
  );
}
function InquiryForm({block}: {block: InstitutionalBlock}) {
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = Object.fromEntries(data.entries()) as InstitutionalInquiry;
    input.consent = data.get('consent') === 'on';
    try {
      window.location.assign(
        buildInstitutionalInquiry(input, block.whatsapp || ''),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Revisa los datos del proyecto.',
      );
    }
  }
  const fields = [
    ['name', 'Nombre completo', 'text', 'name'],
    ['company', 'Empresa o institución', 'text', 'organization'],
    ['email', 'Correo electrónico', 'email', 'email'],
    ['phone', 'Teléfono', 'tel', 'tel'],
    ['city', 'Ciudad', 'text', 'address-level2'],
    ['area', 'Área aproximada (m²)', 'number', 'off'],
  ];
  const inputClass =
    'mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-primary-600 focus:ring-primary-600';
  return (
    <form
      method="post"
      onSubmit={submit}
      className="rounded-3xl bg-white p-6 shadow-sm sm:p-9"
    >
      <input type="hidden" name="contactSection" value={block.id} />
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([name, label, type, autoComplete]) => (
          <label
            key={name}
            className="text-sm font-medium"
            htmlFor={`institutional-${name}`}
          >
            {label}
            {name !== 'area' && ' *'}
            <input
              id={`institutional-${name}`}
              name={name}
              type={type}
              autoComplete={autoComplete}
              required={name !== 'area'}
              min={name === 'area' ? 1 : undefined}
              maxLength={type !== 'number' ? 200 : undefined}
              className={inputClass}
            />
          </label>
        ))}
        <label
          className="text-sm font-medium sm:col-span-2"
          htmlFor="institutional-sector"
        >
          Tipo de proyecto *
          <select
            name="sector"
            id="institutional-sector"
            required
            className={inputClass}
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {[
              'Gimnasio o estudio',
              'Hotel o club',
              'Empresa',
              'Proyecto residencial',
              'Institución educativa',
              'Centro deportivo',
              'Otro',
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label
          className="text-sm font-medium sm:col-span-2"
          htmlFor="institutional-message"
        >
          Cuéntanos sobre tu proyecto *
          <textarea
            name="message"
            id="institutional-message"
            required
            maxLength={1500}
            rows={4}
            className={inputClass}
          />
        </label>
      </div>
      <label className="mt-6 flex items-start gap-3 text-xs leading-relaxed text-slate-600">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-1 rounded text-primary-600"
        />
        <span>
          Autorizo el tratamiento de mis datos personales conforme a la{' '}
          <a className="underline" href="/policies/privacy-policy">
            política de privacidad
          </a>
          . *
        </span>
      </label>
      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        Al continuar se abrirá WhatsApp con los datos de tu proyecto. Revisa el
        mensaje antes de enviarlo.
      </p>
      <p role="alert" className="mt-3 text-sm text-red-700">
        {error}
      </p>
      <button type="submit" className={`${button} mt-3 w-full`}>
        {block.ctaText || 'Continuar en WhatsApp'}
        <ArrowUpRightIcon className="h-5 w-5" />
      </button>
    </form>
  );
}

export const SECTION_INSTITUTIONAL_FRAGMENT = `#graphql
fragment SectionInstitutional on Metaobject {
  institutional_variant: field(key: "variant") { value }
  institutional_anchor_id: field(key: "anchor_id") { value }
  institutional_kicker: field(key: "kicker") { value }
  institutional_heading: field(key: "heading") { value }
  institutional_description: field(key: "description") { value }
  institutional_image_url: field(key: "image_url") { value }
  institutional_image: field(key: "image") { reference { ... on MediaImage { image { url altText } } } }
  institutional_cta_text: field(key: "cta_text") { value }
  institutional_cta_url: field(key: "cta_url") { value }
  institutional_secondary_cta_text: field(key: "secondary_cta_text") { value }
  institutional_secondary_cta_url: field(key: "secondary_cta_url") { value }
  institutional_whatsapp: field(key: "whatsapp") { value }
  institutional_items: field(key: "items") { references(first: 30) { nodes { ... on Metaobject {
    id
    institutional_title: field(key: "title") { value }
    institutional_description: field(key: "description") { value }
    institutional_icon: field(key: "icon") { value }
    institutional_image_url: field(key: "image_url") { value }
    institutional_image: field(key: "image") { reference { ... on MediaImage { image { url altText } } } }
  } } } }
}`;
