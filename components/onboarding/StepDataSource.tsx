import React, { useState } from 'react';

interface StepDataSourceProps {
  initialKrishaUserId?: string;
  onSubmit: (userId: string) => void;
  loading: boolean;
}

export function StepDataSource({ initialKrishaUserId = '', onSubmit, loading }: StepDataSourceProps) {
  const [krishaUserId, setKrishaUserId] = useState(initialKrishaUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(krishaUserId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
        💡 <span className="font-semibold">Где найти ID пользователя Krisha.kz?</span> Перейдите в кабинет на Krisha.kz или откройте любое ваше объявление. В ссылке профиля будет ID (например: <code className="bg-indigo-950 px-1.5 py-0.5 rounded text-white font-mono">12345678</code>).
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          ID пользователя или агентства на Krisha.kz <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          required
          value={krishaUserId}
          onChange={(e) => setKrishaUserId(e.target.value)}
          placeholder="например: 12345678"
          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-sm transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !krishaUserId}
        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs rounded-xl hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
      >
        {loading ? 'Запуск автопарсера...' : 'Начать импорт объявлений →'}
      </button>
    </form>
  );
}
