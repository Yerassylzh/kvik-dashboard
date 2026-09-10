import { SupportedLocale } from '@/types/i18n';
import { translateKey } from './config';

interface I18nNode {
  code: string;
  message: string;
  params?: Record<string, string | number>;
  isRaw?: boolean;
}

/**
 * Checks if an object adheres to the I18nPayload structure.
 */
function isI18nNode(obj: Record<string, unknown>): obj is Record<string, unknown> & I18nNode {
  return typeof obj.code === 'string' && typeof obj.message === 'string';
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

  const obj = data as Record<string, unknown>;

  if (isI18nNode(obj)) {
    const isRaw = obj.isRaw === true || obj.code === 'raw';
    if (!isRaw) {
      const translated = translateKey(obj.code, obj.params, locale);
      if (translated) {
        obj.message = translated;
      }
    }
  }

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'object' && val !== null) {
      obj[key] = transformI18nMessages(val, locale);
    }
  }

  return obj as T;
}
