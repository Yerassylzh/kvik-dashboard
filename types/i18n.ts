export type SupportedLocale = 'ru' | 'en' | 'kk';

export interface I18nPayload {
  code: string;
  message: string;
  isRaw?: boolean;
  params?: Record<string, string | number>;
  errors?: Record<string, I18nPayload>;
}
