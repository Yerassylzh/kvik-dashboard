"use client";

import React, { useState } from "react";
import { Building2, Globe, Clock, Check, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WorkspaceForm() {
  const t = useTranslations("dashboard");
  const [name, setName] = useState("Салон красоты Афродита");
  const [niche, setNiche] = useState("BEAUTY");
  const [timezone, setTimezone] = useState("Asia/Almaty");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <SectionCard
      title="Профиль компании"
      description="Основные данные бизнеса и региональные настройки"
      className="max-w-2xl"
    >
      <form onSubmit={handleSave} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Название бизнеса</label>
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название компании..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Ниша бизнеса</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-card border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="BEAUTY">💅 Бьюти и салоны красоты</option>
              <option value="CLINIC">🏥 Клиники и медицина</option>
              <option value="FITNESS">🏋️ Фитнес и спорт</option>
              <option value="CONSULTING">💼 Консалтинг и услуги</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Часовой пояс</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-card border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
            >
              <option value="Asia/Almaty">Asia/Almaty (UTC+5)</option>
              <option value="Asia/Aqtau">Asia/Aqtau (UTC+5)</option>
              <option value="Asia/Aqtobe">Asia/Aqtobe (UTC+5)</option>
              <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          {isSaved ? (
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>{t("settings.saved_success")}</span>
            </span>
          ) : (
            <div />
          )}

          <Button type="submit" size="sm" className="gap-1.5">
            <Save className="w-4 h-4" />
            <span>{t("settings.save_changes")}</span>
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
