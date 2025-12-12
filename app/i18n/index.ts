import es from './es.json';
import en from './en.json';

export type TranslationKey = keyof typeof es;
export type Translations = typeof es;

const translations: Record<string, Translations> = {
  es,
  en,
  // Spanish variations
  'es-CO': es,
  'es-MX': es,
  'es-AR': es,
  'es-ES': es,
  // English variations
  'en-US': en,
  'en-GB': en,
};

/**
 * Get translations for a specific locale
 * @param locale - The locale code (e.g., 'es', 'en', 'es-CO')
 * @returns The translations object for that locale
 */
export function getTranslations(locale: string = 'es'): Translations {
  // Try exact match first, then language code only
  return translations[locale] || translations[locale.split('-')[0]] || translations.es;
}

/**
 * Get a specific translation by key path
 * @param locale - The locale code
 * @param keyPath - Dot-separated path to the translation (e.g., 'common.add_to_cart')
 * @returns The translated string
 */
export function t(locale: string, keyPath: string): string {
  const trans = getTranslations(locale);
  const keys = keyPath.split('.');
  
  let result: any = trans;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      console.warn(`Translation not found: ${keyPath}`);
      return keyPath;
    }
  }
  
  return typeof result === 'string' ? result : keyPath;
}

export {es, en};
