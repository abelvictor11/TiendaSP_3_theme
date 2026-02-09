import {type FC} from 'react';
import {InformationCircleIcon} from '@heroicons/react/24/outline';

export interface ProductHelpBannerProps {
  heading?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  enabled?: boolean;
}

const ProductHelpBanner: FC<ProductHelpBannerProps> = ({
  heading = '¿Necesitas ayuda con tu pedido?',
  description = 'Contáctanos por WhatsApp para resolver tus dudas',
  ctaText = 'CONTACTAR POR WHATSAPP',
  ctaLink = 'https://api.whatsapp.com/send?phone=573146370443&text=Hola Tienda-Sportfitness! Quiero más información, por favor!',
  backgroundColor = '#e0f2fe',
  textColor = '#0c4a6e',
  buttonBackgroundColor = '#1e3a5f',
  buttonTextColor = '#ffffff',
  enabled = true,
}) => {
  if (!enabled) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-5 mt-6 border"
      style={{
        backgroundColor,
        borderColor: `${textColor}20`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: `${textColor}15`,
          }}
        >
          <InformationCircleIcon
            className="w-6 h-6"
            style={{color: textColor}}
          />
        </div>

        {/* Content */}
        <div className="flex-grow">
          {heading && (
            <h4
              className="font-semibold text-base mb-1"
              style={{color: textColor}}
            >
              {heading}
            </h4>
          )}
          {description && (
            <p
              className="text-sm mb-4"
              style={{color: textColor, opacity: 0.8}}
            >
              {description}
            </p>
          )}
          {ctaText && ctaLink && (
            <a
              href={ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-opacity hover:opacity-90"
              style={{
                backgroundColor: buttonBackgroundColor,
                color: buttonTextColor,
              }}
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductHelpBanner;
