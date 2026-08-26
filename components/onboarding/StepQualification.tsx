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
      <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
        🎯 <span className="font-bold text-slate-900 dark:text-slate-100">Автоматический квалификатор ИИ:</span> ИИ не просто
        отвечает на вопросы, а аккуратно ведёт лида к сделке, собирая эти ключевые метрики. Значения
        предзаполнены — оставьте как есть или отредактируйте.
      </div>

      {/* Бюджет */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Бюджет клиента, ₸ (диапазон)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min={0}
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            placeholder="от 15 000 000"
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors"
          />
          <input
            type="number"
            min={0}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="до 45 000 000"
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors"
          />
        </div>
      </div>

      {/* Район */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Предпочитаемый район / локация
        </label>
        <input
          type="text"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder="например: Бостандыкский, Медеуский"
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors"
        />
      </div>

      {/* Срочность */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Срочность покупки</label>
        <div className="grid grid-cols-3 gap-2">
          {URGENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setUrgency(opt.value)}
              className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                urgency === opt.value
                  ? 'bg-primary/20 border-primary/50 text-foreground'
                  : 'bg-card border-border text-muted-foreground hover:border-slate-700'
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
        className="w-full p-3.5 rounded-xl bg-card border border-border flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
      >
        <span className="text-foreground font-medium">Спрашивать про ипотеку / способ оплаты</span>
        <span
          className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
            mortgage
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {mortgage ? 'Включено' : 'Выключено'}
        </span>
      </button>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
      >
        {loading ? 'Сохранение...' : 'Сохранить правила квалификации →'}
      </button>
    </form>
  );
}
