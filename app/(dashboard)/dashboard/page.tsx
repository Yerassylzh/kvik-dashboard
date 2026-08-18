import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Дашборд агента недвижимости</h1>
        <p className="text-xs text-slate-400 mt-1">Обзор активности ИИ-менеджера и входящих диалогов</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Всего обращений</p>
          <p className="text-2xl font-extrabold text-white mt-2">24</p>
          <span className="text-[11px] text-emerald-400 font-medium">↑ 12% за неделю</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Квалифицировано лидов</p>
          <p className="text-2xl font-extrabold text-indigo-400 mt-2">18</p>
          <span className="text-[11px] text-indigo-300 font-medium">75% конверсия</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Средняя скорость ответа</p>
          <p className="text-2xl font-extrabold text-cyan-400 mt-2">12 сек</p>
          <span className="text-[11px] text-cyan-300 font-medium">Цель: до 20 сек</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Использовано токенов ИИ</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-2">142 / 1000</p>
          <span className="text-[11px] text-amber-300 font-medium">Тариф Starter</span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4">Быстрый запуск</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Поздравляем! Ваш ИИ-агент настроен и синхронизирован с объявлением на Krisha.kz. Скоро в этом разделе появятся живые метрики общения с покупателями.
        </p>
      </div>
    </div>
  );
}
