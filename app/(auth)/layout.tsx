import React from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center relative overflow-hidden px-4 py-12">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Logo */}
      <div className="z-10 mb-8 flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="Kvik.ai"
          width={120}
          height={60}
          className="object-contain invert"
          priority
        />
        <p className="text-xs text-muted-foreground mt-3 font-medium tracking-wide">
          AI-менеджеры продаж для недвижимости и бизнеса
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="z-10 w-full max-w-md bg-card/90 border border-border rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        {children}
      </div>

      {/* Footer */}
      <div className="z-10 mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Kvik AI Inc. Все права защищены.
      </div>
    </div>
  );
}
