"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, CheckCircle2, Lock, SearchCode, ArrowRight, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

interface KbCautionModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onGoBack?: () => void;
}

export function KbCautionModal({ isOpen, onConfirm, onGoBack }: KbCautionModalProps) {
  const t = useTranslations("dashboard");
  const router = useRouter();

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      router.push("/overview");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            key="caution-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            key="caution-dialog"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative z-10 w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6"
            role="alertdialog"
            aria-modal="true"
          >
            {/* Header with Icon and Badge */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  {t("knowledge.caution_modal_title")}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("knowledge.caution_modal_subtitle")}
                </p>
              </div>
            </div>

            {/* Explanatory intro */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground leading-relaxed">
              {t("knowledge.caution_modal_p1")}
            </div>

            {/* Key Guidance Points */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-foreground">
                    {t("knowledge.caution_modal_point1_title")}
                  </div>
                  <div className="text-muted-foreground leading-normal">
                    {t("knowledge.caution_modal_point1_desc")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-foreground">
                    {t("knowledge.caution_modal_point2_title")}
                  </div>
                  <div className="text-muted-foreground leading-normal">
                    {t("knowledge.caution_modal_point2_desc")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                  <SearchCode className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-foreground">
                    {t("knowledge.caution_modal_point3_title")}
                  </div>
                  <div className="text-muted-foreground leading-normal">
                    {t("knowledge.caution_modal_point3_desc")}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-border/80 bg-background text-foreground font-semibold text-xs hover:bg-muted/70 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("knowledge.caution_modal_back")}</span>
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>{t("knowledge.caution_modal_btn")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
