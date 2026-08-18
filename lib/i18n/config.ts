import ruApi from '@/locales/ru/api.json';
import enApi from '@/locales/en/api.json';
import { SupportedLocale } from '@/types/i18n';

// Registry of backend API error & response dictionaries
export const API_DICTIONARIES: Record<SupportedLocale, Record<string, any>> = {
  ru: ruApi,
  en: enApi,
  kk: {}, // Placeholder for Kazakh API dictionary
};

export const SUPPORTED_LOCALES: SupportedLocale[] = ['ru', 'en', 'kk'];
export const DEFAULT_LOCALE: SupportedLocale = 'ru';

let activeLocale: SupportedLocale = DEFAULT_LOCALE;

/**
 * Gets the current active locale in the application.
 */
export function getCurrentLocale(): SupportedLocale {
  return activeLocale;
}

/**
 * Sets the active locale for translation lookups and HTTP requests.
 */
export function setCurrentLocale(locale: SupportedLocale): void {
  if (API_DICTIONARIES[locale]) {
    activeLocale = locale;
    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    }
  } else {
    console.warn(`[i18n] Locale "${locale}" is not registered. Falling back to "${DEFAULT_LOCALE}".`);
    activeLocale = DEFAULT_LOCALE;
  }
}

/**
 * Resolves a dot-notation key (e.g. "auth.invalid_credentials") against the API dictionary,
 * interpolating any {param} placeholders with provided parameters.
 */
export function translateKey(
  code: string,
  params?: Record<string, string | number>,
  locale: SupportedLocale = activeLocale
): string | null {
  if (!code || code === 'raw') return null;

  const dict = API_DICTIONARIES[locale] || API_DICTIONARIES[DEFAULT_LOCALE];
  const keys = code.split('.');
  
  let current: any = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      current = undefined;
      break;
    }
  }

  // Fallback to English if not found in active locale
  if (typeof current !== 'string' && locale !== 'en') {
    let fallback: any = API_DICTIONARIES.en;
    for (const k of keys) {
      if (fallback && typeof fallback === 'object' && k in fallback) {
        fallback = fallback[k];
      } else {
        fallback = undefined;
        break;
      }
    }
    if (typeof fallback === 'string') {
      current = fallback;
    }
  }

  if (typeof current !== 'string') {
    return null;
  }

  let result = current;
  if (params && typeof params === 'object') {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replaceAll(`{${paramKey}}`, String(paramValue));
    }
  }

  return result;
}
