'use client';

import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Onboarding Header */}
      <header className="z-10 w-full border-b border-border bg-card/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Kvik.ai"
            width={80}
            height={36}
            className="object-contain invert"
            priority
          />
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
            Онбординг
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
          <span>
            Нужна помощь? <a href="https://t.me/kvik_support" target="_blank" rel="noreferrer" className="text-accent-brand hover:underline">Написать поддержке</a>
          </span>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive-foreground hover:bg-destructive/20 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
          >
            <span>🚪</span>
            <span>Выйти</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="z-10 flex-1 flex flex-col justify-start items-center p-4 sm:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
