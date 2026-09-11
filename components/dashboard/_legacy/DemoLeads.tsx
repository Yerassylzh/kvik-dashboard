'use client';

import React from 'react';

interface DemoLead {
  id: string;
  name: string;
  phone: string;
  service: string;
  master: string;
  slot: string;
  status: 'HOT' | 'QUALIFIED' | 'WARM';
  statusText: string;
  time: string;
}

const sampleLeads: DemoLead[] = [
  {
    id: 'L-101',
    name: 'Арман Сериков',
    phone: '+7 (701) 948-22-11',
    service: 'Стрижка + борода',
    master: 'Мастер Ерлан',
    slot: 'Завтра, 15:00',
    status: 'HOT',
    statusText: '🔥 Запись подтверждена',
    time: '10 минут назад',
  },
  {
    id: 'L-102',
    name: 'Динара Нурланова',
    phone: '+7 (777) 310-44-88',
    service: 'Маникюр + покрытие',
    master: 'Мастер Анна',
    slot: 'Ср, 11:30',
    status: 'QUALIFIED',
    statusText: '🎯 Квалифицирован',
    time: '35 минут назад',
  },
  {
    id: 'L-103',
    name: 'Бауржан Аскаров',
    phone: '+7 (705) 555-12-34',
    service: 'Массаж спины, 60 мин',
    master: 'Любой свободный',
    slot: 'Уточняется',
    status: 'WARM',
    statusText: '💬 Консультация ИИ',
    time: '2 часа назад',
  },
  {
    id: 'L-104',
    name: 'Айгерим Касымова',
    phone: '+7 (747) 888-99-00',
    service: 'Окрашивание, сложное',
    master: 'Мастер Сауле',
    slot: 'Пт, 16:00',
    status: 'QUALIFIED',
    statusText: '🎯 Квалифицирован',
    time: 'Вчера, 18:20',
  },
];

export function DemoLeads() {
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
                <th className="p-4">Интересующая услуга</th>
                <th className="p-4">Мастер / Слот записи</th>
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
                    {lead.service}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">{lead.master}</div>
                    <div className="text-[11px] text-muted-foreground">{lead.slot}</div>
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
