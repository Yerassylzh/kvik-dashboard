import React from 'react';
import { NicheProfile } from '@/types/niche';

interface StepSelectNicheProps {
  onSelect: (niche: NicheProfile) => void;
  loading: boolean;
}

export function StepSelectNiche({ onSelect, loading }: StepSelectNicheProps) {
  const niches = [
    {
      id: 'REALTY' as NicheProfile,
      icon: '🏠',
      title: 'Недвижимость',
      desc: 'Агентства и риелторы. Авто-парсер Krisha.kz, ипотека, показы объектов.',
    },
    {
      id: 'AUTO_SALES' as NicheProfile,
      icon: '🚗',
      title: 'Автосалоны & Дилеры',
      desc: 'Продажа авто. Парсер Kolesa.kz, кредит/трейд-ин, запись на тест-драйв.',
    },
    {
      id: 'OTHER_CALENDAR' as NicheProfile,
      icon: '📅',
      title: 'Услуги и запись',
      desc: 'Бьюти, клиники, сервисы. Онлайн-запись в Google Календарь, напоминания.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {niches.map((niche) => (
        <button
          key={niche.id}
          onClick={() => onSelect(niche.id)}
          disabled={loading}
          className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900/80 text-left transition-all group flex flex-col justify-between h-56 shadow-lg hover:shadow-indigo-500/10 disabled:opacity-50"
        >
          <div>
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              {niche.icon}
            </div>
            <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors">
              {niche.title}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {niche.desc}
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Выбрать нишу &rarr;
          </span>
        </button>
      ))}
    </div>
  );
}
