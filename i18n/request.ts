import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { SupportedLocale } from '@/types/i18n';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as SupportedLocale | undefined;
  
  let locale: SupportedLocale = DEFAULT_LOCALE;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    locale = cookieLocale;
  }

  const localesDir = path.join(process.cwd(), 'locales', locale);
  const messages: Record<string, Record<string, unknown>> = {};

  if (fs.existsSync(localesDir)) {
    const files = fs.readdirSync(localesDir).filter((file) => file.endsWith('.json'));
    for (const file of files) {
      const namespace = path.basename(file, '.json');
      try {
        const filePath = path.join(localesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        messages[namespace] = JSON.parse(content);
      } catch (err) {
        console.error(`[i18n] Failed to load locale file "${file}" for locale "${locale}":`, err);
      }
    }
  }

  return {
    locale,
    messages,
  };
});
