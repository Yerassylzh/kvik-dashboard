import React, { useState } from 'react';

interface StepDataSourceProps {
  initialKrishaUserId?: string;
  nicheProfile?: string | null;
  onSubmit: (userId: string) => void;
  loading: boolean;
}

export function StepDataSource({
  initialKrishaUserId = '',
  onSubmit,
  loading,
}: StepDataSourceProps) {
  const [dataSourceInput, setDataSourceInput] = useState(initialKrishaUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(dataSourceInput);
  };

  const getSourceConfig = () => {
    return {
      label: 'ID / Ссылка на профиль бизнеса',
      placeholder: 'например: 12345678 или ссылка на профиль',
      helpTitle: 'Подключение источника данных',
      helpText:
        'Укажите ID или ссылку на ваш бизнес-профиль для автоимпорта прайса и услуг.',
    };
  };

  const config = getSourceConfig();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
        💡 <span className="font-bold text-slate-900 dark:text-slate-100">{config.helpTitle}</span> {config.helpText}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">
          {config.label} <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          required
          value={dataSourceInput}
          onChange={(e) => setDataSourceInput(e.target.value)}
          placeholder={config.placeholder}
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono text-sm transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !dataSourceInput}
        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
      >
        {loading ? 'Запуск автопарсера...' : 'Начать импорт объявлений →'}
      </button>
    </form>
  );
}

