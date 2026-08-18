'use client';

import React, { useState } from 'react';
import { QualificationDto } from '@/types/niche';

interface StepQualificationProps {
  onSubmit: (data: QualificationDto) => void;
  loading: boolean;
}

const URGENCY_OPTIONS: Array<{ value: NonNullable<QualificationDto['urgency']>; label: string }> = [
  { value: 'high', label: 'Срочно' },
  { value: 'medium', label: 'В течение месяца' },
  { value: 'low', label: 'На будущее' },
];

export function StepQualification({ onSubmit, loading }: StepQualificationProps) {
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [mortgage, setMortgage] = useState(true);
  const [district, setDistrict] = useState('');
  const [urgency, setUrgency] = useState<QualificationDto['urgency']>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: QualificationDto = {
      mortgage,
      urgency,
    };
    if (budgetMin.trim()) dto.budgetMin = Number(budgetMin);
    if (budgetMax.trim()) dto.budgetMax = Number(budgetMax);
    if (district.trim()) dto.district = district.trim();
    onSubmit(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
        🎯 <span className="font-semibold">Автоматический квалификатор ИИ:</span> ИИ не просто
        отвечает на вопросы, а аккуратно ведёт лида к сделке, собирая эти ключевые метрики. Значения
        предзаполнены — оставьте как есть или отредактируйте.
      </div>

      {/* Бюджет */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Бюджет клиента, ₸ (диапазон)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min={0}
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            placeholder="от 15 000 000"
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-xs transition-colors"
          />
          <input
            type="number"
            min={0}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="до 45 000 000"
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-xs transition-colors"
          />
        </div>
      </div>

      {/* Район */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Предпочитаемый район / локация
        </label>
        <input
          type="text"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder="например: Бостандыкский, Медеуский"
          className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-xs transition-colors"
        />
      </div>

      {/* Срочность */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Срочность покупки</label>
        <div className="grid grid-cols-3 gap-2">
          {URGENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setUrgency(opt.value)}
              className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                urgency === opt.value
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ипотека */}
      <button
        type="button"
        onClick={() => setMortgage((v) => !v)}
        className="w-full p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
      >
        <span className="text-slate-200 font-medium">Спрашивать про ипотеку / способ оплаты</span>
        <span
          className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
            mortgage
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {mortgage ? 'Включено' : 'Выключено'}
        </span>
      </button>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs rounded-xl hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
      >
        {loading ? 'Сохранение...' : 'Сохранить правила квалификации →'}
      </button>
    </form>
  );
}
