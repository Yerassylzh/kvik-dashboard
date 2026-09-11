'use client';

import React from 'react';

export function DemoOverview() {
  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Входящие диалоги</span>
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center text-lg shadow-sm">
              💬
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground mt-3 tracking-tight">148</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
            <span className="font-extrabold text-emerald-600">↑ +28%</span>
            <span className="text-muted-foreground font-normal">за последние 7 дней</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Записей подтверждено</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center text-lg shadow-sm">
              📅
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 mt-3 tracking-tight">87</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="font-extrabold text-emerald-600">59%</span>
            <span className="text-muted-foreground font-normal">диалогов завершились записью</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Скорость ответа ИИ</span>
            <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center text-lg shadow-sm">
              ⚡
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground mt-3 tracking-tight">6.4 сек</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="font-extrabold text-sky-600">⚡ Мгновенно</span>
            <span className="text-muted-foreground font-normal">без ожидания</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Записей в базе знаний</span>
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center text-lg shadow-sm">
              📚
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground mt-3 tracking-tight">42</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="font-extrabold text-emerald-600">2GIS + Сайт</span>
            <span className="text-muted-foreground font-normal">услуги, цены, мастера</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live AI Simulator + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Chat Simulator */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-lg shadow-sm">
                📱
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Живой автоответчик WhatsApp ИИ</h3>
                <p className="text-xs text-muted-foreground">Демонстрация записи клиента в реальном времени</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Онлайн 24/7
            </span>
          </div>

          {/* Chat Bubble Area */}
          <div className="p-4.5 rounded-xl bg-slate-900 text-white space-y-4 text-xs font-sans shadow-inner">
            {/* Incoming Client Message */}
            <div className="flex flex-col items-start max-w-[85%]">
              <span className="text-[10px] text-slate-400 mb-1">Клиент (WhatsApp): +7 (701) 948-22-11</span>
              <div className="p-3.5 rounded-2xl bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700 shadow-sm leading-relaxed">
                Здравствуйте! Хочу записаться на маникюр на этой неделе. Сколько это стоит и есть ли окно завтра?
              </div>
              <span className="text-[9px] text-slate-500 mt-1">12:44</span>
            </div>

            {/* AI Agent Response */}
            <div className="flex flex-col items-end max-w-[88%] ml-auto">
              <span className="text-[10px] text-indigo-400 mb-1 font-semibold flex items-center gap-1">
                <span>🤖 Kvik AI Agent</span>
                <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded text-[9px] border border-indigo-500/30">
                  Авто-ответ (4 сек)
                </span>
              </span>
              <div className="p-3.5 rounded-2xl bg-indigo-600 text-white rounded-tr-none shadow-md space-y-2 leading-relaxed">
                <p>Добрый день! 👋 Маникюр с покрытием — <b>8 000 ₸</b>, длительность 90 минут.</p>
                <p>📅 У мастера Анны есть свободное окно <b>завтра в 11:30 или 16:00</b>.</p>
                <p>На какое время вас записать?</p>
              </div>
              <span className="text-[9px] text-slate-500 mt-1">12:44 · Слот проверен в календаре</span>
            </div>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground">Последние события</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm hover:border-indigo-200 transition-colors flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold flex-shrink-0">
                ✅
              </div>
              <div>
                <p className="font-bold text-foreground">Запись подтверждена</p>
                <p className="text-muted-foreground text-[11px]">Арман К. — завтра, 15:00, стрижка</p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">2 минуты назад</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm hover:border-indigo-200 transition-colors flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold flex-shrink-0">
                🔄
              </div>
              <div>
                <p className="font-bold text-foreground">Follow-up отправлен</p>
                <p className="text-muted-foreground text-[11px]">Динара Н. — напоминание о записи через 24ч</p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">15 минут назад</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm hover:border-indigo-200 transition-colors flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center font-bold flex-shrink-0">
                🔥
              </div>
              <div>
                <p className="font-bold text-foreground">Горячий лид квалифицирован</p>
                <p className="text-muted-foreground text-[11px]">Готов записаться: на этой неделе</p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">40 минут назад</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
