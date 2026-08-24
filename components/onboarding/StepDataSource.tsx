import React, { useState } from 'react';
import { NicheProfile } from '@/types/niche';

interface StepDataSourceProps {
  initialKrishaUserId?: string;
  nicheProfile?: NicheProfile | null;
  onSubmit: (userId: string) => void;
  loading: boolean;
}

export function StepDataSource({
  initialKrishaUserId = '',
  nicheProfile,
  onSubmit,
  loading,
}: StepDataSourceProps) {
  const [dataSourceInput, setDataSourceInput] = useState(initialKrishaUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(dataSourceInput);
  };

  const getSourceConfig = () => {
    if (nicheProfile === 'REALTY') {
      return {
        label: 'Krisha.kz Profile ID / URL',
        placeholder: 'например: 12345678 или https://krisha.kz/a/show/...',
        helpTitle: 'Где найти ID пользователя Krisha.kz?',
        helpText:
          'Перейдите в личный кабинет на Krisha.kz или откройте любое ваше объявление. В ссылке профиля будет ID (например: 12345678).',
      };
    }
    if (nicheProfile === 'AUTO_SALES') {
      return {
        label: 'Kolesa.kz Profile ID / URL',
        placeholder: 'например: 12345678 или https://kolesa.kz/a/show/...',
        helpTitle: 'Где найти ID продавца на Kolesa.kz?',
        helpText:
          'Перейдите в кабинет продавца/автосалона на Kolesa.kz или откройте объявление вашего автосалона. Скопируйте ID или полную ссылку.',
      };
    }
    if (nicheProfile === 'AUTO_SERVICE') {
      return {
        label: '2GIS / Instagram Profile или URL прайс-листа',
        placeholder: 'например: https://2gis.kz/almaty/firm/... или @autoservice_kz',
        helpTitle: 'Источники данных автосервиса (СТО)',
        helpText:
          'Укажите ссылку на страницу в 2GIS, Instagram профиль или прайс-лист. ИИ настроит квалификацию и запись на обслуживание.',
      };
    }
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
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary-foreground">
        💡 <span className="font-semibold">{config.helpTitle}</span> {config.helpText}
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

