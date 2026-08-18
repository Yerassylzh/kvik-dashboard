import { SupportedLocale } from '@/types/i18n';
import { translateKey } from './config';

/**
 * Checks if an object adheres to the I18nPayload structure.
 */
function isI18nNode(obj: any): boolean {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string'
  );
}

/**
 * Recursively inspects all incoming response payloads (successes, errors, nested form validation errors),
 * translating non-raw `code` entries using the active locale dictionary in-place.
 */
export function transformI18nMessages<T>(data: T, locale?: SupportedLocale): T {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => transformI18nMessages(item, locale)) as unknown as T;
  }

  const obj = data as Record<string, any>;

  if (isI18nNode(obj)) {
    const isRaw = obj.isRaw === true || obj.code === 'raw';
    if (!isRaw) {
      const translated = translateKey(obj.code, obj.params, locale);
      if (translated) {
        obj.message = translated;
      }
    }
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      obj[key] = transformI18nMessages(obj[key], locale);
    }
  }

  return obj as T;
}
