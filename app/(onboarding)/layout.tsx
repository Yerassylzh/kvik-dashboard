import React from 'react';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  if (!user) {
    redirect('/login?from=/onboarding');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Onboarding Header */}
      <header className="z-10 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
              K
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Kvik<span className="text-indigo-400">.ai</span>
            <span className="ml-3 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              Онбординг
            </span>
          </span>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Нужна помощь? <a href="https://t.me/kvik_support" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Написать поддержке</a>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="z-10 flex-1 flex flex-col justify-start items-center p-4 sm:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
