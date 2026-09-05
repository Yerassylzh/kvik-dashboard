"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { BusinessProfileDto } from "@/types/niche";
import { FadeIn } from "@/components/ui/motion/FadeIn";

interface StepBusinessProfileProps {
  initialValues: Partial<BusinessProfileDto>;
  onSubmit: (data: BusinessProfileDto) => void;
  onBack?: () => void;
  loading: boolean;
}

export function StepBusinessProfile({
  initialValues,
  onSubmit,
  onBack,
  loading,
}: StepBusinessProfileProps) {
  const t = useTranslations("onboarding");
  const [country, setCountry] = useState(initialValues.country || "KZ");
  const [businessName, setBusinessName] = useState(
    initialValues.businessName || "",
  );
  const [city, setCity] = useState(
    initialValues.city || t("profile.city_almaty"),
  );
  const [businessAddress, setBusinessAddress] = useState(
    initialValues.businessAddress || "",
  );
  const [businessPhone, setBusinessPhone] = useState(
    initialValues.businessPhone || "",
  );
  const [workingHours, setWorkingHours] = useState(
    initialValues.workingHours || "",
  );
  const [businessDescription, setBusinessDescription] = useState(
    initialValues.businessDescription || "",
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialValues.websiteUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(
    initialValues.instagramUrl || "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      country,
      businessName,
      city,
      businessPhone,
      businessAddress,
      workingHours,
      businessDescription,
      websiteUrl,
      instagramUrl,
    });
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs sm:text-sm transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FadeIn delay={0.05} className="space-y-4">
        {/* Section 1: Core Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("profile.country_label")}{" "}
              <span className="text-destructive">*</span>
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputClass}
            >
              <option value="KZ">{t("profile.country_kz")}</option>
              <option value="UZ">{t("profile.country_uz")}</option>
              <option value="KG">{t("profile.country_kg")}</option>
              <option value="RU">{t("profile.country_ru")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("profile.business_name_label")}{" "}
              <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t("profile.business_name_placeholder")}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("profile.city_label")}{" "}
              <span className="text-destructive">*</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            >
              <option value={t("profile.city_almaty")}>
                {t("profile.city_almaty")}
              </option>
              <option value={t("profile.city_astana")}>
                {t("profile.city_astana")}
              </option>
              <option value={t("profile.city_shymkent")}>
                {t("profile.city_shymkent")}
              </option>
              <option value={t("profile.city_karaganda")}>
                {t("profile.city_karaganda")}
              </option>
              <option value={t("profile.city_other")}>
                {t("profile.city_other")}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("profile.address_label")}
            </label>
            <input
              type="text"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder={t("profile.address_placeholder")}
              className={inputClass}
            />
          </div>
        </div>
      </FadeIn>

      {/* Section 2: Contact & Operations */}
      <FadeIn delay={0.1} className="space-y-4 pt-2 border-t border-border/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("profile.phone_label")}
            </label>
            <input
              type="text"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              placeholder={t("profile.phone_placeholder")}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("profile.working_hours_label")}
            </label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder={t("profile.working_hours_placeholder")}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("profile.website_label")}
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder={t("profile.website_placeholder")}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("profile.instagram_label")}
            </label>
            <input
              type="text"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder={t("profile.instagram_placeholder")}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            {t("profile.description_label")}
          </label>
          <textarea
            rows={3}
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            placeholder={t("profile.description_placeholder")}
            className={inputClass}
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.15} className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto py-3.5 px-5 bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            ← Назад
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:flex-1 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t("profile.btn_submitting")}
            </>
          ) : (
            t("profile.btn_submit")
          )}
        </button>
      </FadeIn>
    </form>
  );
}
