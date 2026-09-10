"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { BusinessProfileDto } from "@/types/niche";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface StepBusinessProfileProps {
  initialValues: Partial<BusinessProfileDto>;
  onSubmit: (data: BusinessProfileDto) => void;
  loading: boolean;
}

export function StepBusinessProfile({
  initialValues,
  onSubmit,
  loading,
}: StepBusinessProfileProps) {
  const t = useTranslations("onboarding");
  const [country, setCountry] = useState(initialValues.country || "KZ");
  const [businessName, setBusinessName] = useState(
    initialValues.businessName || ""
  );
  const [city, setCity] = useState(
    initialValues.city || t("profile.city_almaty")
  );
  const [businessAddress, setBusinessAddress] = useState(
    initialValues.businessAddress || ""
  );
  const [businessPhone, setBusinessPhone] = useState(
    initialValues.businessPhone || ""
  );
  const [workingHours, setWorkingHours] = useState(
    initialValues.workingHours || ""
  );
  const [businessDescription, setBusinessDescription] = useState(
    initialValues.businessDescription || ""
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialValues.websiteUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(
    initialValues.instagramUrl || ""
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

  const countryOptions = [
    { value: "KZ", label: t("profile.country_kz") },
    { value: "UZ", label: t("profile.country_uz") },
    { value: "KG", label: t("profile.country_kg") },
    { value: "RU", label: t("profile.country_ru") },
  ];

  const cityOptions = [
    { value: t("profile.city_almaty"), label: t("profile.city_almaty") },
    { value: t("profile.city_astana"), label: t("profile.city_astana") },
    { value: t("profile.city_shymkent"), label: t("profile.city_shymkent") },
    { value: t("profile.city_karaganda"), label: t("profile.city_karaganda") },
    { value: t("profile.city_other"), label: t("profile.city_other") },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FadeIn delay={0.05} className="space-y-4">
        {/* Section 1: Core Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t("profile.country_label")}
            requiredIndicator
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            options={countryOptions}
          />

          <Input
            label={t("profile.business_name_label")}
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder={t("profile.business_name_placeholder")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t("profile.city_label")}
            requiredIndicator
            value={city}
            onChange={(e) => setCity(e.target.value)}
            options={cityOptions}
          />

          <Input
            label={t("profile.address_label")}
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            placeholder={t("profile.address_placeholder")}
          />
        </div>
      </FadeIn>

      {/* Section 2: Contact & Operations */}
      <FadeIn delay={0.1} className="space-y-4 pt-2 border-t border-border/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("profile.phone_label")}
            type="tel"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            placeholder={t("profile.phone_placeholder")}
          />

          <Input
            label={t("profile.working_hours_label")}
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
            placeholder={t("profile.working_hours_placeholder")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("profile.website_label")}
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder={t("profile.website_placeholder")}
          />

          <Input
            label={t("profile.instagram_label")}
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder={t("profile.instagram_placeholder")}
          />
        </div>

        <Textarea
          label={t("profile.description_label")}
          rows={3}
          value={businessDescription}
          onChange={(e) => setBusinessDescription(e.target.value)}
          placeholder={t("profile.description_placeholder")}
        />
      </FadeIn>

      <FadeIn delay={0.15} className="pt-2">
        <Button
          type="submit"
          loading={loading}
          size="lg"
          className="w-full shadow-md"
        >
          {loading ? t("profile.btn_submitting") : t("profile.btn_submit")}
        </Button>
      </FadeIn>
    </form>
  );
}
