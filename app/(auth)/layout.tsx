import React from 'react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { AuthLanguageToggle } from '@/components/auth/AuthLanguageToggle';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('auth');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center relative overflow-hidden px-4 py-8 sm:py-12">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <AuthLanguageToggle />
      </div>

      {/* Header Logo */}
      <div className="z-10 mb-6 flex flex-col items-center text-center">
        <div className="relative mb-2 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Kvik.ai"
            width={44}
            height={44}
            className="h-11 w-11 object-contain drop-shadow-xs"
            priority
          />
        </div>
        <div className="flex items-center gap-0.5 font-bold text-lg tracking-tight text-foreground">
          <span>Kvik</span>
          <span className="text-primary font-extrabold">.ai</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm font-medium tracking-normal">
          {t('layout.tagline')}
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="z-10 w-full max-w-md bg-card/90 border border-border/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        {children}
      </div>

      {/* Footer */}
      <div className="z-10 mt-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Kvik AI Inc. {t('layout.rights_reserved')}
      </div>
    </div>
  );
}
