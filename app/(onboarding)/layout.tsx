"use client";

import React from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Sleek Minimal Onboarding Header */}
      <header className="z-10 w-full border-b border-border/80 bg-card/60 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image
            src="/tab-logo.png"
            alt="Kvik.ai"
            width={36}
            height={36}
            className="object-contain rounded-lg"
            priority
          />
          <span className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
            Kvik<span className="text-accent-brand">.ai</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <a
            href="https://t.me/kvik_support"
            target="_blank"
            rel="noreferrer"
            className="text-xs hover:text-foreground hover:underline transition-colors hidden sm:inline"
          >
            Поддержка
          </a>
          <button
            type="button"
            onClick={logout}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            Выйти
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
