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
      id: 'AUTO_SERVICE' as NicheProfile,
      icon: '🛠️',
      title: 'СТО & Автосервисы',
      desc: 'Ремонт и ТО. Запись на сервис, 2GIS/Instagram прайс-лист, консультация.',
    },
    {
      id: 'OTHER_CALENDAR' as NicheProfile,
      icon: '📅',
      title: 'Услуги и запись',
      desc: 'Бьюти, клиники, сервисы. Онлайн-запись в Календарь, напоминания.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {niches.map((niche) => (
        <button
          key={niche.id}
          onClick={() => onSelect(niche.id)}
          disabled={loading}
          className="p-5 rounded-2xl bg-card border border-border hover:border-primary/60 hover:bg-muted/80 text-left transition-all group flex flex-col justify-between min-h-[15rem] h-full shadow-lg disabled:opacity-50"
        >
          <div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-accent-brand flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              {niche.icon}
            </div>
            <h3 className="font-bold text-foreground text-base group-hover:text-accent-brand transition-colors">
              {niche.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {niche.desc}
            </p>
          </div>
          <span className="text-xs font-semibold text-accent-brand group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Выбрать &rarr;
          </span>
        </button>
      ))}
    </div>
  );
}
