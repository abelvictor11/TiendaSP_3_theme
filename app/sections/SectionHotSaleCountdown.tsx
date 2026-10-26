import {useEffect, useState} from 'react';
import {Link} from '~/components/Link';

/**
 * Section | Hot Sale Countdown
 *
 * Cuenta regresiva hasta el inicio de un Hot Sale. Tarjeta clara con dos
 * columnas: a la izquierda titular + texto + CTA ("Ver productos"); a la
 * derecha el contador en tiles tipo split-flap y, debajo, las pills de
 * categorías que estarán en promoción. Todo editable desde el metaobject
 * `ciseco--section_hot_sale_countdown`.
 *
 * Diseño anclado en los tokens de tienda-sportfitness: titular y dígitos en
 * F37Bolton (font-headline), texto en Poppins (font-display), CTA en el rojo
 * de marca (primary-600). Los tiles van oscuros para que el único acento de
 * color (el rojo) viva en el botón. Colores sobre-escribibles por campo.
 *
 * Sin framework de animación: el "flip" de cada dígito es CSS puro (keyframe
 * `hsc-flip`), re-disparado al cambiar el valor vía `key`. Respeta
 * prefers-reduced-motion.
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

/** Un tile split-flap: número grande sobre fondo oscuro, con costura al
 *  centro y una ligera sombra inferior. El dígito re-monta al cambiar
 *  (`key`) para re-disparar la animación de flip. */
function FlipTile({
  value,
  label,
  tileBg,
  digitColor,
  animate,
}: {
  value: number;
  label: string;
  tileBg: string;
  digitColor: string;
  animate: boolean;
}) {
  const text = String(Math.max(0, value)).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div
        className="hsc-tile relative overflow-hidden rounded-xl sm:rounded-2xl min-w-[62px] sm:min-w-[82px] px-2.5 py-3 sm:px-4 sm:py-4"
        style={{backgroundColor: tileBg}}
      >
        <span
          key={text}
          className={animate ? 'hsc-digit' : undefined}
          style={{
            display: 'block',
            textAlign: 'center',
            color: digitColor,
            fontFamily: 'F37Bolton, sans-serif',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            fontSize: 'clamp(2rem, 6vw, 3.25rem)',
          }}
        >
          {text}
        </span>
      </div>
      <span className="mt-2 text-[10px] sm:text-xs font-display font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
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

  // Colores. Defaults pensados para la referencia: tiles oscuros, dígito
  // blanco, acento = rojo de marca en el CTA. Editables por campo.
  const tileBg = background_color?.value || '#1b1b2b';
  const digitColor = text_color?.value || '#ffffff';
  const accent = accent_color?.value || '#e00000';
  // background_color_end se mantiene por compatibilidad pero ya no se usa en
  // el nuevo layout de tarjeta clara (antes era un gradiente de fondo).
  void background_color_end;

  const eyebrowText = eyebrow?.value;
  const headingText = heading?.value || 'Hot Sale';
  const ctaText = cta_text?.value || 'Ver productos';
  const ctaLink = cta_link?.value || '/collections/ofertas';
  const label = countdown_label?.value || 'Comienza en';
  const catHeading = categories_heading?.value || 'Categorías en promoción';
  const ended = ended_message?.value || '¡El Hot Sale ya comenzó!';

  // Tras montar, si la fecha ya pasó → estado "ya comenzó".
  const hasStarted = mounted && target && !remaining;
  // Placeholder estable en SSR/pre-montaje (ceros) para evitar mismatch.
  const shown = remaining ?? {days: 0, hours: 0, minutes: 0, seconds: 0};
  // Solo animamos tras montar (nunca en SSR).
  const animate = mounted && !!remaining;

  return (
    <section className="container">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes hsc-flip {
  0%   { transform: translateY(-55%); opacity: 0; }
  60%  { transform: translateY(6%);  opacity: 1; }
  100% { transform: translateY(0);   opacity: 1; }
}
@media (prefers-reduced-motion: no-preference) {
  .hsc-digit { animation: hsc-flip .45s cubic-bezier(.2,.8,.2,1) both; }
}
/* Costura central + barniz superior del tile (look split-flap). */
.hsc-tile::before {
  content: ""; position: absolute; left: 0; right: 0; top: 50%;
  height: 2px; background: rgba(0,0,0,.45); transform: translateY(-1px);
  z-index: 2; pointer-events: none;
}
.hsc-tile::after {
  content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,0) 48%, rgba(0,0,0,.18) 100%);
}
.hsc-tile > span { position: relative; z-index: 0; }
`,
        }}
      />

      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-10 lg:gap-16 items-center">
          {/* Columna de contenido */}
          <div className="max-w-md">
            {eyebrowText && (
              <p className="font-display font-semibold text-sm mb-3 text-primary-600">
                {eyebrowText}
              </p>
            )}

            <h2 className="font-headline leading-[0.95] text-3xl sm:text-4xl lg:text-5xl text-neutral-900 dark:text-neutral-50">
              {headingText}
            </h2>

            {description?.value && (
              <p className="font-display mt-4 text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {description.value}
              </p>
            )}

            {ctaText && (
              <div className="mt-7">
                <Link
                  to={ctaLink}
                  className="inline-flex items-center justify-center rounded-full px-7 py-3 font-display font-semibold text-base text-white transition-transform duration-200 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500"
                  style={{backgroundColor: accent}}
                >
                  {ctaText}
                </Link>
              </div>
            )}
          </div>

          {/* Columna del contador + categorías */}
          <div className="w-full lg:w-auto">
            <p className="font-display text-sm font-medium mb-3 text-neutral-500 dark:text-neutral-400">
              {hasStarted ? ended : label}
            </p>

            {hasStarted ? (
              <div
                className="rounded-2xl px-6 py-8 text-center"
                style={{backgroundColor: tileBg}}
              >
                <span
                  className="font-headline text-2xl sm:text-3xl"
                  style={{color: digitColor}}
                >
                  ¡Ya está aquí!
                </span>
              </div>
            ) : (
              <div className="flex gap-2.5 sm:gap-4">
                <FlipTile value={shown.days} label="Días" tileBg={tileBg} digitColor={digitColor} animate={animate} />
                <FlipTile value={shown.hours} label="Horas" tileBg={tileBg} digitColor={digitColor} animate={animate} />
                <FlipTile value={shown.minutes} label="Min" tileBg={tileBg} digitColor={digitColor} animate={animate} />
                <FlipTile value={shown.seconds} label="Seg" tileBg={tileBg} digitColor={digitColor} animate={animate} />
              </div>
            )}

            {pills.length > 0 && (
              <div className="mt-7">
                {catHeading && (
                  <p className="font-display text-sm font-medium mb-3 text-neutral-500 dark:text-neutral-400">
                    {catHeading}
                  </p>
                )}
                <ul className="flex flex-wrap gap-2.5">
                  {pills.map((pill, i) => (
                    <li
                      key={pill + i}
                      className="font-display text-sm font-medium rounded-full px-4 py-1.5 border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800"
                    >
                      {pill}
                    </li>
                  ))}
                </ul>
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
