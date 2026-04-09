import {useRef} from 'react';
import useSnapSlider from '~/hooks/useSnapSlider';
import NextPrev from '~/components/NextPrev/NextPrev';
import {CheckIcon} from '@heroicons/react/24/solid';

// ─── Types ───────────────────────────────────────────────────
interface FeatureIcon {
  icon_svg: string;
  title: string;
}

interface DetailCard {
  image_url: string;
  title: string;
  description: string;
}

interface WarrantyBadge {
  title: string;
  subtitle: string;
  description: string;
  icon_svg?: string;
}

export interface PdpEnhancedData {
  enabled: boolean;
  subtitle?: string;
  heroDescription?: string;
  featureIcons: FeatureIcon[];
  detailCards: DetailCard[];
  applications: string[];
  includesList: string[];
  warrantyBadges: WarrantyBadge[];
  dimensionsImageUrl?: string;
}

// ─── Parser ──────────────────────────────────────────────────
function parseJson(field: any, fallback: any): any {
  try {
    return field?.value ? JSON.parse(field.value) : fallback;
  } catch {
    return fallback;
  }
}

export function parsePdpEnhancedData(product: any): PdpEnhancedData | null {
  const enabled = product.pdp_enhanced_enabled?.value === 'true';
  if (!enabled) return null;

  const data: PdpEnhancedData = {
    enabled: true,
    subtitle: product.pdp_enhanced_subtitle?.value || '',
    heroDescription: product.pdp_enhanced_hero_description?.value || '',
    featureIcons: parseJson(product.pdp_enhanced_feature_icons, []),
    detailCards: parseJson(product.pdp_enhanced_detail_cards, []),
    applications: parseJson(product.pdp_enhanced_applications, []),
    includesList: parseJson(product.pdp_enhanced_includes_list, []),
    warrantyBadges: parseJson(product.pdp_enhanced_warranty_badges, []),
    dimensionsImageUrl: product.pdp_enhanced_dimensions_image?.reference?.image?.url,
  };

  // Only return if there's meaningful content
  if (data.detailCards.length === 0 && data.featureIcons.length === 0) return null;

  return data;
}

// ─── Main Component ──────────────────────────────────────────
export function PdpEnhancedSection({data}: {data: PdpEnhancedData}) {
  return (
    <div className="pdp-enhanced mt-12 sm:mt-16 space-y-12 sm:space-y-16">
      {/* Feature Icons */}
      {data.featureIcons.length > 0 && (
        <FeatureIconsBar icons={data.featureIcons} />
      )}

      {/* Detail Cards Carousel */}
      {data.detailCards.length > 0 && (
        <DetailCardsSection cards={data.detailCards} />
      )}

      {/* Applications + Includes */}
      {(data.applications.length > 0 || data.includesList.length > 0) && (
        <ApplicationsSection
          applications={data.applications}
          includesList={data.includesList}
          dimensionsImageUrl={data.dimensionsImageUrl}
        />
      )}

      {/* Warranty Badges */}
      {data.warrantyBadges.length > 0 && (
        <WarrantySection badges={data.warrantyBadges} />
      )}
    </div>
  );
}

// ─── Feature Icons Bar ───────────────────────────────────────
function FeatureIconsBar({icons}: {icons: FeatureIcon[]}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 sm:p-8">
      <div
        className={`grid gap-6 ${
          icons.length <= 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : icons.length === 4
            ? 'grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
        }`}
      >
        {icons.map((icon, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-3">
            {icon.icon_svg && (
              <div
                className="w-12 h-12 flex items-center justify-center text-slate-700 dark:text-slate-200 [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{__html: icon.icon_svg}}
              />
            )}
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-200 leading-tight">
              {icon.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Detail Cards Carousel ───────────────────────────────────
function DetailCardsSection({cards}: {cards: DetailCard[]}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
          Características destacadas
        </h3>
        {cards.length > 3 && (
          <NextPrev
            onClickNext={scrollToNextSlide}
            onClickPrev={scrollToPrevSlide}
          />
        )}
      </div>
      <div
        ref={sliderRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 hiddenScrollbar pb-2"
      >
        {cards.map((card, i) => (
          <div
            key={i}
            className="shrink-0 snap-start w-[260px] sm:w-[300px] lg:w-[330px]"
          >
            <div className="border-2 border-red-600 rounded-2xl overflow-hidden h-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700">
                <img
                  src={card.image_url}
                  alt={card.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4 sm:p-5">
                <h4 className="font-semibold text-sm sm:text-base uppercase tracking-wide mb-2 text-slate-900 dark:text-white">
                  {card.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Applications + Includes ─────────────────────────────────
function ApplicationsSection({
  applications,
  includesList,
  dimensionsImageUrl,
}: {
  applications: string[];
  includesList: string[];
  dimensionsImageUrl?: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Applications */}
      {applications.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold uppercase tracking-wide mb-5 text-slate-900 dark:text-white">
            Aplicaciones de uso
          </h3>
          <ul className="space-y-3">
            {applications.map((app, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {app}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Includes + Dimensions */}
      <div className="space-y-6">
        {includesList.length > 0 && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold uppercase tracking-wide mb-5 text-slate-900 dark:text-white">
              Incluye
            </h3>
            <ul className="space-y-3">
              {includesList.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {dimensionsImageUrl && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6">
            <h4 className="text-sm font-bold uppercase tracking-wide mb-4 text-slate-900 dark:text-white">
              Dimensiones
            </h4>
            <img
              src={dimensionsImageUrl}
              alt="Dimensiones del producto"
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Warranty Badges ─────────────────────────────────────────
function WarrantySection({badges}: {badges: WarrantyBadge[]}) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-6 sm:p-8 lg:p-10">
      <div
        className={`grid gap-6 sm:gap-8 ${
          badges.length === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-3'
        }`}
      >
        {badges.map((badge, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center gap-2"
          >
            {badge.icon_svg && (
              <div
                className="w-10 h-10 text-white [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{__html: badge.icon_svg}}
              />
            )}
            <div>
              <span className="text-white font-bold uppercase tracking-wide text-sm block">
                {badge.title}
              </span>
              {badge.subtitle && (
                <span className="text-white font-bold text-xl block">
                  {badge.subtitle}
                </span>
              )}
            </div>
            {badge.description && (
              <p className="text-neutral-400 text-xs leading-relaxed max-w-[200px]">
                {badge.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PdpEnhancedSection;
