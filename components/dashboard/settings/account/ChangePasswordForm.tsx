"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, Check, Lock, Mail, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { changePasswordApi } from "@/lib/api/auth";

export function ChangePasswordForm() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);

    if (newPassword !== confirmPassword) {
      setError(t("settings.change_password_mismatch"));
      return;
    }

    if (newPassword.length < 6) {
      setError(t("settings.new_password_placeholder"));
      return;
    }

    setLoading(true);

    try {
      await changePasswordApi({ currentPassword, newPassword });
      setIsSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("settings.change_password_error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Account Info Card */}
      <SectionCard
        title={t("settings.account_title")}
        description={t("settings.account_desc")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Электронная почта
            </span>
            <p className="text-sm font-semibold text-foreground font-mono">
              {user?.email || "—"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              Статус подтверждения
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Check className="w-3 h-3" />
                Подтверждён
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Change Password Form Card */}
      <form onSubmit={handleSubmit}>
        <SectionCard
          title={t("settings.change_password_title")}
          description={t("settings.change_password_desc")}
        >
          <div className="space-y-4 pt-2 max-w-lg">
            {error && (
              <div className="p-3 rounded-xl alert-destructive border text-xs flex items-start gap-2 shadow-xs">
                <span className="font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {isSuccess && (
              <div className="p-3 rounded-xl alert-success border text-xs flex items-center gap-2 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold">{t("settings.change_password_success")}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("settings.current_password_label")}
              </label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("settings.current_password_placeholder")}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("settings.new_password_label")}
              </label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("settings.new_password_placeholder")}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("settings.confirm_new_password_label")}
              </label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("settings.confirm_new_password_placeholder")}
                className="text-xs"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                size="sm"
                className="gap-1.5 text-xs whitespace-nowrap shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t("settings.change_password_submit")}</span>
              </Button>
            </div>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}
