'use client';

import React, { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { setCurrentLocale } from '@/lib/i18n/config';
import type { SupportedLocale } from '@/types/i18n';
import clsx from 'clsx';

export function AuthLanguageToggle() {
  const currentLocale = useLocale() as SupportedLocale;
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: SupportedLocale) => {
    if (newLocale === currentLocale || isPending) return;
    startTransition(() => {
      setCurrentLocale(newLocale);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    });
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-card/80 border border-border/70 backdrop-blur-sm shadow-xs text-xs">
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleLocaleChange('ru')}
        className={clsx(
          'px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer select-none text-[11px]',
          currentLocale === 'ru'
            ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
        )}
      >
        RU
      </button>
      <span className="text-border/80 text-[10px] select-none">/</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleLocaleChange('en')}
        className={clsx(
          'px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer select-none text-[11px]',
          currentLocale === 'en'
            ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
        )}
      >
        EN
      </button>
    </div>
  );
}
