import type React from 'react';
import {useRouteLoaderData} from '@remix-run/react';
import type {RootLoader} from '~/root';

// Color map for fallback when CDN is not configured
const COLOR_MAP: Record<string, string> = {
  negro: '#000000',
  black: '#000000',
  azul: '#0052CC',
  blue: '#0052CC',
  marrón: '#8B7355',
  marron: '#8B7355',
  brown: '#8B7355',
  cafe: '#8B7355',
  café: '#8B7355',
  verde: '#00875A',
  green: '#00875A',
  gris: '#6B778C',
  gray: '#6B778C',
  grey: '#6B778C',
  naranja: '#FF991F',
  orange: '#FF991F',
  rosa: '#FFCDD2',
  pink: '#FFCDD2',
  púrpura: '#8B008B',
  purpura: '#8B008B',
  purple: '#8B008B',
  morado: '#8B008B',
  rojo: '#DE350B',
  red: '#DE350B',
  blanco: '#FFFFFF',
  white: '#FFFFFF',
  amarillo: '#FFD700',
  yellow: '#FFD700',
  neutral: '#C4C4C4',
  beige: '#D4C4A8',
  dorado: '#FFD700',
  gold: '#FFD700',
  plateado: '#C0C0C0',
  silver: '#C0C0C0',
  turquesa: '#40E0D0',
  turquoise: '#40E0D0',
  coral: '#FF7F50',
  lima: '#32CD32',
  lime: '#32CD32',
  oliva: '#808000',
  olive: '#808000',
  aguamarina: '#7FFFD4',
  aqua: '#00FFFF',
  cyan: '#00FFFF',
  crema: '#FFFDD0',
  cream: '#FFFDD0',
  borgoña: '#800020',
  burgundy: '#800020',
  vino: '#800020',
  celeste: '#87CEEB',
  lightblue: '#87CEEB',
  lavanda: '#E6E6FA',
  lavender: '#E6E6FA',
};

// Pre-computed at module load: keys already normalized, no per-call allocation
const NORMALIZED_COLOR_ENTRIES: Array<[string, string]> = Object.entries(COLOR_MAP).map(
  ([key, value]) => [key.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), value],
);

// Get color hex from name
function getColorFromName(name: string): string | null {
  const normalizedName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ');

  for (const [normalizedColorName, colorValue] of NORMALIZED_COLOR_ENTRIES) {
    if (normalizedName.includes(normalizedColorName)) {
      return colorValue;
    }
  }
  return null;
}

export const useGetPublicStoreCdnStaticUrlFromRootLoaderData = () => {
  const rootLoaderData = useRouteLoaderData<RootLoader>('root');

  const publicStoreCdnStaticUrl = rootLoaderData?.publicStoreCdnStaticUrl;
  const imgFormat = rootLoaderData?.publicImageFormatForProductOption;

  const getImageWithCdnUrlByName = (imageName: string, format = imgFormat) => {
    // If CDN URL is configured, use it
    if (publicStoreCdnStaticUrl && imgFormat) {
      return `${publicStoreCdnStaticUrl}${imageName}.${format}`;
    }
    // Return null if no CDN configured - caller should handle fallback
    return null;
  };

  const getColorHexByName = (colorName: string): string => {
    return getColorFromName(colorName) || '#C4C4C4';
  };

  // Returns a CSS style object for a color swatch.
  // Supports compound names like "Negro/Azul" or "Negro-Azul" by splitting on / or -
  // and rendering a diagonal split gradient.
  const getSwatchStyle = (colorName: string): React.CSSProperties => {
    const separatorMatch = colorName.match(/[/]/);
    if (separatorMatch) {
      const parts = colorName.split('/').map((p) => p.trim());
      if (parts.length >= 2) {
        const hex1 = getColorFromName(parts[0]) || '#C4C4C4';
        const hex2 = getColorFromName(parts[1]) || '#C4C4C4';
        return {
          background: `linear-gradient(135deg, ${hex1} 50%, ${hex2} 50%)`,
        };
      }
    }
    return {backgroundColor: getColorFromName(colorName) || '#C4C4C4'};
  };

  return {
    publicStoreCdnStaticUrl,
    imgFormat,
    getImageWithCdnUrlByName,
    getColorHexByName,
    getSwatchStyle,
  };
};
