import {useEffect, useState} from 'react';
import {Link} from '~/components/Link';

/**
 * Section | Hot Sale Countdown
 *
 * Cuenta regresiva hasta el inicio de un Hot Sale, con titular, texto,
 * pills de categorías que estarán en promoción y un CTA ("Ver productos").
 * Todo editable desde el metaobject `ciseco--section_hot_sale_countdown`.
 *
 * Diseño anclado en los design tokens de tienda-sportfitness: el rojo de
 * marca (#FF0000 / 600 #E00000) como campo dominante "de calor", titular y
 * dígitos en F37Bolton (font-headline), texto de apoyo en Poppins
 * (font-display). Colores sobre-escribibles por campo.
 *
 * Hidratación: el contador NO se calcula en el servidor (cambiaría cada
 * segundo → mismatch #418). Se renderiza un placeholder estable y el valor
 * real se calcula en useEffect tras montar — mismo patrón que
 * PreorderCountdown.
 */

type Remaining = {days: number; hours: number; minutes: number; seconds: number};

function parseTarget(raw?: string): Date | null {
  if (!raw) return null;
  // date → YYYY-MM-DD (fijar mediodía local evita corrimiento por zona);
  // date_time → ISO con hora.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const d = new Date(dateOnly ? `${raw}T12:00:00` : raw);
  return isNaN(d.getTime()) ? null : d;
}

function getRemaining(target: Date): Remaining | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function parseList(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
  } catch {
    // list.single_line_text_field siempre llega como JSON; si no parsea,
    // tratarlo como un único valor de texto.
    return raw.trim() ? [raw.trim()] : [];
  }
  return [];
}

function TimeChip({
  value,
  label,
  inkColor,
}: {
  value: number;
  label: string;
  inkColor: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center rounded-2xl bg-black/25 backdrop-blur-sm min-w-[64px] sm:min-w-[84px] px-3 py-3 sm:px-4 sm:py-4"
        style={{boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)'}}
      >
        <span
          className="font-headline tabular-nums leading-none text-3xl sm:text-5xl"
          style={{color: inkColor}}
        >
          {String(Math.max(0, value)).padStart(2, '0')}
        </span>
      </div>
      <span
        className="mt-2 text-[11px] sm:text-xs font-display font-medium tracking-wide"
        style={{color: inkColor, opacity: 0.7}}
      >
        {label}
      </span>
    </div>
  );
}

export function SectionHotSaleCountdown(props: any) {
  const {
    eyebrow,
    heading,
    description,
    start_date,
    countdown_label,
    ended_message,
    categories_heading,
    categories,
    cta_text,
    cta_link,
    background_color,
    background_color_end,
    text_color,
    accent_color,
  } = props;

  const target = parseTarget(start_date?.value);
  const pills = parseList(categories?.value);

  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!target) return;
    setMounted(true);
    setRemaining(getRemaining(target));
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start_date?.value]);

  // Colores (defaults = rojo de marca). Editables por campo.
  const bgFrom = background_color?.value || '#e00000';
  const bgTo = background_color_end?.value || '#7a0000';
  const ink = text_color?.value || '#ffffff';
  const accent = accent_color?.value || bgFrom;

  const headingText = heading?.value || 'Hot Sale';
  const ctaText = cta_text?.value || 'Ver productos';
  const ctaLink = cta_link?.value || '/collections/ofertas';
  const label = countdown_label?.value || 'Comienza en';
  const ended = ended_message?.value || '¡El Hot Sale ya comenzó!';

  // Tras montar, si la fecha ya pasó → estado "ya comenzó".
  const hasStarted = mounted && target && !remaining;
  // Placeholder estable en SSR/pre-montaje (ceros) para evitar mismatch.
  const shown = remaining ?? {days: 0, hours: 0, minutes: 0, seconds: 0};

  return (
    <section className="container">
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16"
        style={{
          backgroundImage: `linear-gradient(135deg, ${bgFrom} 0%, ${bgTo} 100%)`,
          color: ink,
        }}
      >
        {/* Resplandor de "calor" — un único gesto decorativo, no disperso */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full blur-3xl"
          style={{background: ink, opacity: 0.08}}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Columna de contenido */}
          <div>
            {eyebrow?.value && (
              <p
                className="font-display font-semibold text-sm mb-3"
                style={{color: ink, opacity: 0.85}}
              >
                {eyebrow.value}
              </p>
            )}

            <h2
              className="font-headline leading-[0.95] text-4xl sm:text-5xl lg:text-6xl"
              style={{color: ink}}
            >
              {headingText}
            </h2>

            {description?.value && (
              <p
                className="font-display mt-4 max-w-[46ch] text-base sm:text-lg"
                style={{color: ink, opacity: 0.82}}
              >
                {description.value}
              </p>
            )}

            {pills.length > 0 && (
              <div className="mt-6">
                {categories_heading?.value && (
                  <p
                    className="font-display text-sm font-medium mb-3"
                    style={{color: ink, opacity: 0.75}}
                  >
                    {categories_heading.value}
                  </p>
                )}
                <ul className="flex flex-wrap gap-2.5">
                  {pills.map((pill, i) => (
                    <li
                      key={pill + i}
                      className="font-display text-sm font-medium rounded-full px-4 py-1.5"
                      style={{
                        color: ink,
                        border: `1.5px solid ${ink}`,
                        borderColor: `color-mix(in srgb, ${ink} 45%, transparent)`,
                      }}
                    >
                      {pill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ctaText && (
              <div className="mt-8">
                <Link
                  to={ctaLink}
                  className="inline-flex items-center justify-center rounded-full px-7 py-3.5 font-display font-semibold text-base transition-transform duration-200 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  style={{backgroundColor: ink, color: accent}}
                >
                  {ctaText}
                </Link>
              </div>
            )}
          </div>

          {/* Columna del contador — el héroe */}
          <div className="lg:justify-self-end w-full">
            <p
              className="font-display text-sm font-medium mb-4 text-center lg:text-right"
              style={{color: ink, opacity: 0.75}}
            >
              {hasStarted ? ended : label}
            </p>

            {hasStarted ? (
              <div
                className="rounded-2xl bg-black/25 backdrop-blur-sm px-6 py-8 text-center"
                style={{boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)'}}
              >
                <span
                  className="font-headline text-3xl sm:text-4xl"
                  style={{color: ink}}
                >
                  ¡Ya está aquí!
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2.5 sm:gap-4 justify-items-center">
                <TimeChip value={shown.days} label="Días" inkColor={ink} />
                <TimeChip value={shown.hours} label="Horas" inkColor={ink} />
                <TimeChip value={shown.minutes} label="Min" inkColor={ink} />
                <TimeChip value={shown.seconds} label="Seg" inkColor={ink} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export const SECTION_HOT_SALE_COUNTDOWN_FRAGMENT = `#graphql
  fragment SectionHotSaleCountdown on Metaobject {
    type
    eyebrow: field(key: "eyebrow") { key value }
    heading: field(key: "heading") { key value }
    description: field(key: "description") { key value }
    start_date: field(key: "start_date") { key value }
    countdown_label: field(key: "countdown_label") { key value }
    ended_message: field(key: "ended_message") { key value }
    categories_heading: field(key: "categories_heading") { key value }
    categories: field(key: "categories") { key value }
    cta_text: field(key: "cta_text") { key value }
    cta_link: field(key: "cta_link") { key value }
    background_color: field(key: "background_color") { key value }
    background_color_end: field(key: "background_color_end") { key value }
    text_color: field(key: "text_color") { key value }
    accent_color: field(key: "accent_color") { key value }
  }
`;
