"use client";

import React, { useTransition } from "react";
import { Globe, Check, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { setCurrentLocale } from "@/lib/i18n/config";
import type { SupportedLocale } from "@/types/i18n";
import clsx from "clsx";

interface LanguageOption {
  code: SupportedLocale;
  label: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: "ru",
    label: "settings.language_ru",
    nativeName: "Русский",
    flag: "🇷🇺",
  },
  {
    code: "en",
    label: "settings.language_en",
    nativeName: "English",
    flag: "🇬🇧",
  },
];

export function LanguageSettingsCard() {
  const t = useTranslations("dashboard");
  const currentLocale = useLocale() as SupportedLocale;
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (locale: SupportedLocale) => {
    if (locale === currentLocale || isPending) return;

    startTransition(() => {
      setCurrentLocale(locale);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    });
  };

  return (
    <SectionCard
      title={t("settings.language_title")}
      description={t("settings.language_desc")}
    >
      <div className="space-y-4 pt-1 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLocale === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                disabled={isPending}
                onClick={() => handleLanguageChange(lang.code)}
                className={clsx(
                  "flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer relative",
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20 shadow-xs"
                    : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0 select-none" aria-hidden="true">
                    {lang.flag}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {lang.nativeName}
                    </div>
                    <div className="text-[11px] text-muted-foreground uppercase font-mono tracking-wider">
                      {lang.code.toUpperCase()}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
          {isPending ? (
            <span className="inline-flex items-center gap-1.5 text-primary font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t("common.loading")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {t("settings.language_note")}
            </span>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
