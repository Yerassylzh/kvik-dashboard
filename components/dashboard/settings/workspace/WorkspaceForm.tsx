"use client";

import React, { useState, useEffect } from "react";
import { Building2, Globe, Clock, Check, Save, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { knowledgeBaseApi } from "@/lib/api/knowledgeBase";

export function WorkspaceForm() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [niche, setNiche] = useState("BEAUTY");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.workspace) {
      if (user.workspace.name) setName(user.workspace.name);
      if (user.workspace.nicheProfile) setNiche(user.workspace.nicheProfile);
    }

    knowledgeBaseApi
      .getProfile()
      .then((res) => {
        const p = res.profile;
        if (p) {
          if (p.businessName) setName(p.businessName);
          if (p.nicheProfile) setNiche(p.nicheProfile);
          if (p.city) setCity(p.city);
          if (p.businessAddress) setAddress(p.businessAddress);
          if (p.businessPhone) setPhone(p.businessPhone);
          if (p.workingHours) setWorkingHours(p.workingHours);
          if (p.websiteUrl) setWebsiteUrl(p.websiteUrl);
          if (p.instagramUrl) setInstagramUrl(p.instagramUrl);
        }
      })
      .catch((err) => {
        console.warn("Could not load full business profile", err);
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await knowledgeBaseApi.updateProfile({
        businessName: name,
        city,
        businessAddress: address,
        businessPhone: phone,
        workingHours,
        websiteUrl: websiteUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Card 1: Company Profile */}
      <SectionCard
        title="Профиль компании"
        description="Основные данные бизнеса, контакты и отображаемое имя для клиентов"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">
              Название компании
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название бизнеса..."
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Сфера деятельности (Ниша)
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-card border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="BEAUTY">Бьюти и салоны красоты</option>
              <option value="CLINIC">Клиники и медицина</option>
              <option value="FITNESS">Фитнес и спорт</option>
              <option value="CONSULTING">Консалтинг и услуги</option>
              <option value="OTHER_CALENDAR">Другие услуги по записи</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Контактный телефон
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (700) 000-00-00"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Город</label>
            <Input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="г. Алматы"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Адрес</label>
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ул. Примерная, 10"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Веб-сайт</label>
            <Input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://mysalon.kz"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Instagram</label>
            <Input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/mysalon"
              className="text-xs"
            />
          </div>
        </div>
      </SectionCard>

      {/* Card 2: Working Schedule */}
      <SectionCard
        title="Режим работы"
        description="Стандартный график и часы работы для бота и клиентов"
      >
        <div className="pt-2">
          <div className="space-y-1.5 max-w-md">
            <label className="text-xs font-semibold text-foreground">
              График работы
            </label>
            <Input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="Пн-Вс: 10:00 - 21:00"
              className="text-xs"
            />
          </div>
        </div>
      </SectionCard>

      {/* Save Action Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 shadow-xs">
        {isSaved ? (
          <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{t("settings.saved_success")}</span>
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            Данные профиля используются в клиентских диалогах и подтверждениях записей
          </span>
        )}

        <Button
          type="submit"
          size="sm"
          loading={isSaving}
          leftIcon={<Save className="w-3.5 h-3.5" />}
          className="text-xs whitespace-nowrap shrink-0"
        >
          {t("settings.save_changes")}
        </Button>
      </div>
    </form>
  );
}
