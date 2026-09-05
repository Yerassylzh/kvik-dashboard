'use client';

import React from 'react';

interface DemoObjectsProps {
  niche: string;
}

export function DemoObjects({ niche }: DemoObjectsProps) {
  const isRealty = niche === 'REALTY';

  const sampleObjects = isRealty
    ? [
        {
          id: '1',
          title: '2-комнатная квартира, 72 м²',
          location: 'Алматы, Бостандыкский р-н, пр. Гагарина 236 (ЖК Гагарин Парк)',
          price: '48,500,000 ₸',
          params: '72 м² · 10/16 этаж · Монолит · 2021 г.',
          source: 'Krisha.kz #6829104',
          status: 'Синхронизировано',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        },
        {
          id: '2',
          title: '3-комнатная квартира, 110 м²',
          location: 'Алматы, Медеуский р-н, пр. Аль-Фараби (Esentai Apartments)',
          price: '120,000,000 ₸',
          params: '110 м² · 5/22 этаж · Вид на горы · Пентхаус',
          source: 'Krisha.kz #7710293',
          status: 'Синхронизировано',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        },
        {
          id: '3',
          title: '1-комнатная квартира, 42 м²',
          location: 'Алматы, мкр. Самал-2, ул. Достык',
          price: '28,000,000 ₸',
          params: '42 м² · 3/5 этаж · Кирпич · Меблирована',
          source: 'Krisha.kz #5492100',
          status: 'Синхронизировано',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        },
      ]
    : [
        {
          id: '1',
          title: 'Toyota Camry 75 (2.5 Luxe)',
          location: 'Алматы, Автосалон Kvik Auto, пр. Суюнбая 150',
          price: '14,800,000 ₸',
          params: '2022 г. · 2.5L · Бензин · Автомат · Пробег 24,000 км',
          source: 'Kolesa.kz #9821034',
          status: 'Синхронизировано',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        },
        {
          id: '2',
          title: 'Hyundai Tucson (2.0 High-Tech)',
          location: 'Алматы, пр. Райымбека 480',
          price: '17,500,000 ₸',
          params: '2023 г. · 2.0L · Полный привод · Пробег 8,500 км',
          source: 'Kolesa.kz #9910482',
          status: 'Синхронизировано',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        },
        {
          id: '3',
          title: 'Kia Sportage (2.0 Prestige)',
          location: 'Астана, Кабанбай Батыра 54',
          price: '12,200,000 ₸',
          params: '2021 г. · 2.0L · Передний привод · Пробег 45,000 км',
          source: 'Kolesa.kz #8849102',
          status: 'Синхронизировано',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        },
      ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            База знаний ИИ: База объектов ({isRealty ? 'Krisha.kz' : 'Kolesa.kz'})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            ИИ-агент моментально отвечает на вопросы клиентов, основываясь на данных этих листингов
          </p>
        </div>
        <button className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2">
          <span>🔄</span>
          <span>Принудительная ре-синхронизация</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sampleObjects.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-xl font-bold">
                {isRealty ? '🏢' : '🚗'}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                {item.status}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-foreground line-clamp-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.location}</p>
            </div>

            <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs font-mono">
              <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{item.price}</p>
              <p className="text-[11px] text-muted-foreground font-sans mt-1">{item.params}</p>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border">
              <span>{item.source}</span>
              <span className="text-indigo-600 font-bold hover:underline cursor-pointer">
                Просмотр в ИИ →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
