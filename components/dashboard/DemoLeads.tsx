'use client';

import React from 'react';

interface DemoLeadsProps {
  niche: string;
}

export function DemoLeads({ niche }: DemoLeadsProps) {
  const isRealty = niche === 'REALTY';

  const sampleLeads = [
    {
      id: 'L-101',
      name: 'Арман Сериков',
      phone: '+7 (701) 948-22-11',
      interest: isRealty ? '2-комн., ЖК Гагарин Парк' : 'Toyota Camry 75 (2022)',
      budget: isRealty ? '48,500,000 ₸' : '14,800,000 ₸',
      status: 'HOT',
      statusText: '🔥 Показ назначен',
      payment: isRealty ? 'Ипотека (7-20-25)' : 'Трейд-ин + Кредит',
      time: '10 минут назад',
    },
    {
      id: 'L-102',
      name: 'Динара Нурланова',
      phone: '+7 (777) 310-44-88',
      interest: isRealty ? '3-комн. пентхаус, ЖК Esentai' : 'Hyundai Tucson (2023)',
      budget: isRealty ? '120,000,000 ₸' : '17,500,000 ₸',
      status: 'QUALIFIED',
      statusText: '🎯 Квалифицирован',
      payment: 'Наличный расчёт',
      time: '35 минут назад',
    },
    {
      id: 'L-103',
      name: 'Бауржан Аскаров',
      phone: '+7 (705) 555-12-34',
      interest: isRealty ? '1-комн. квартира, мкр. Самал' : 'Kia Sportage (2021)',
      budget: isRealty ? '28,000,000 ₸' : '12,200,000 ₸',
      status: 'WARM',
      statusText: '💬 Консультация ИИ',
      payment: 'Ипотека Отбасы Банк',
      time: '2 часа назад',
    },
    {
      id: 'L-104',
      name: 'Айгерим Касымова',
      phone: '+7 (747) 888-99-00',
      interest: isRealty ? 'Коммерция (Офис 110 кв.м)' : 'Lexus RX 350 (2020)',
      budget: isRealty ? '85,000,000 ₸' : '26,000,000 ₸',
      status: 'QUALIFIED',
      statusText: '🎯 Квалифицирован',
      payment: 'Банковский перевод',
      time: 'Вчера, 18:20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">CRM Лиды от ИИ-Агента</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Клиенты, прошедшие автоматическую квалификацию в WhatsApp / Instagram
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 transition-all">
            📥 Экспорт в Excel / CRM
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-4">Клиент</th>
                <th className="p-4">Интересующий объект</th>
                <th className="p-4">Бюджет / Способ оплаты</th>
                <th className="p-4">Статус ИИ</th>
                <th className="p-4">Время</th>
                <th className="p-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sampleLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-foreground text-sm">{lead.name}</div>
                    <div className="text-muted-foreground text-[11px] font-mono mt-0.5">{lead.phone}</div>
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {lead.interest}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">{lead.budget}</div>
                    <div className="text-[11px] text-muted-foreground">{lead.payment}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        lead.status === 'HOT'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : lead.status === 'QUALIFIED'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                      }`}
                    >
                      {lead.statusText}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-[11px]">{lead.time}</td>
                  <td className="p-4 text-right">
                    <button className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 transition-all">
                      Открыть диалог
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
