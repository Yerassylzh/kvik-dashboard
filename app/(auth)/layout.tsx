import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center relative overflow-hidden px-4 py-12">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Logo */}
      <div className="z-10 mb-8 flex flex-col items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
              K
            </div>
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Kvik<span className="text-indigo-400">.ai</span>
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">
          AI-менеджеры продаж для недвижимости и бизнеса
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="z-10 w-full max-w-md bg-slate-900/70 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
        {children}
      </div>

      {/* Footer */}
      <div className="z-10 mt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Kvik AI Inc. Все права защищены.
      </div>
    </div>
  );
}
