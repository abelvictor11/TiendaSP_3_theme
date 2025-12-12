import {useRouteLoaderData} from '@remix-run/react';
import {getTranslations, t, type Translations} from '~/i18n';
import type {RootLoader} from '~/root';

/**
 * Hook to get translations based on the current locale
 * @returns Object with translations and helper function
 */
export function useTranslation() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const locale = rootData?.selectedLocale?.language?.toLowerCase() || 'es';
  
  const translations = getTranslations(locale);
  
  /**
   * Get a translation by key path
   * @param keyPath - Dot-separated path (e.g., 'common.add_to_cart')
   * @param replacements - Optional object with values to replace in the string
   */
  const translate = (keyPath: string, replacements?: Record<string, string | number>): string => {
    let text = t(locale, keyPath);
    
    if (replacements) {
      Object.entries(replacements).forEach(([key, value]) => {
        text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
    }
    
    return text;
  };
  
  return {
    t: translate,
    locale,
    translations,
  };
}

/**
 * Server-side translation helper
 * @param locale - The locale code
 * @param keyPath - Dot-separated path to the translation
 */
export function serverTranslate(locale: string, keyPath: string): string {
  return t(locale, keyPath);
}
