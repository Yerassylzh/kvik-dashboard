import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { SupportedLocale } from '@/types/i18n';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as SupportedLocale | undefined;
  
  let locale: SupportedLocale = DEFAULT_LOCALE;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    locale = cookieLocale;
  }

  return {
    locale,
    messages: {
      common: (await import(`@/locales/${locale}/common.json`)).default,
      auth: (await import(`@/locales/${locale}/auth.json`)).default,
      onboarding: (await import(`@/locales/${locale}/onboarding.json`)).default,
      dashboard: (await import(`@/locales/${locale}/dashboard.json`)).default,
      api: (await import(`@/locales/${locale}/api.json`)).default,
    },
  };
});
