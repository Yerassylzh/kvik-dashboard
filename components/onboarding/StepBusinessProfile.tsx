import React, { useState } from 'react';
import { BusinessProfileDto } from '@/types/niche';

interface StepBusinessProfileProps {
  initialValues: Partial<BusinessProfileDto>;
  onSubmit: (data: BusinessProfileDto) => void;
  loading: boolean;
}

export function StepBusinessProfile({ initialValues, onSubmit, loading }: StepBusinessProfileProps) {
  const [businessName, setBusinessName] = useState(initialValues.businessName || '');
  const [city, setCity] = useState(initialValues.city || 'Алматы');
  const [businessPhone, setBusinessPhone] = useState(initialValues.businessPhone || '');
  const [businessDescription, setBusinessDescription] = useState(initialValues.businessDescription || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialValues.websiteUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(initialValues.instagramUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ businessName, city, businessPhone, businessDescription, websiteUrl, instagramUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Название агентства / компании <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="например: Kvik Realty Almaty"
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Город работы <span className="text-destructive">*</span>
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary text-xs transition-colors"
          >
            <option value="Алматы">Алматы</option>
            <option value="Астана">Астана</option>
            <option value="Шымкент">Шымкент</option>
            <option value="Караганда">Караганда</option>
            <option value="Другой">Другой город</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Рабочий телефон WhatsApp</label>
          <input
            type="text"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            placeholder="+7 (707) 000-00-00"
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Instagram профиль</label>
          <input
            type="text"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="@kvik_realty"
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Веб-сайт компании</label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://realty.kz"
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Краткое описание бизнеса</label>
        <textarea
          rows={3}
          value={businessDescription}
          onChange={(e) => setBusinessDescription(e.target.value)}
          placeholder="Продажа и аренда жилой и коммерческой недвижимости премиум-класса в Алматы"
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
      >
        {loading ? 'Сохранение...' : 'Продолжить к источнику данных →'}
      </button>
    </form>
  );
}
