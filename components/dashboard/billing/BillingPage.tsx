"use client";

import React from "react";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Download,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion/FadeIn";

interface InvoiceItem {
  id: string;
  date: string;
  amount: string;
  status: string;
}

const mockInvoices: InvoiceItem[] = [
  { id: "INV-2026-009", date: "01.09.2026", amount: "49 000 ₸", status: "paid" },
  { id: "INV-2026-008", date: "01.08.2026", amount: "49 000 ₸", status: "paid" },
  { id: "INV-2026-007", date: "01.07.2026", amount: "49 000 ₸", status: "paid" },
];

export function BillingPage() {
  const t = useTranslations("dashboard");

  const tokensUsed = 6840;
  const tokensLimit = 10000;
  const percentage = Math.round((tokensUsed / tokensLimit) * 100);

  return (
    <FadeIn direction="up" distance={20} duration={0.25} className="space-y-6 max-w-5xl">
      <PageHeader
        title={t("billing.title")}
        description={t("billing.desc")}
      />

      {/* Hero Plan & Token Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Plan Overview */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-primary/15 via-card to-card border border-primary/30 flex flex-col justify-between gap-5 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {t("billing.current_plan")}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t("billing.active_badge")}</span>
              </span>
            </div>

            <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
              {t("billing.plan_pro")}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("billing.plan_pro_desc")}
            </p>
          </div>

          <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground font-medium">
              {t("billing.renewal_notice")}
            </p>
            <Button
              size="sm"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              className="text-xs whitespace-nowrap"
            >
              {t("billing.change_plan_btn")}
            </Button>
          </div>
        </div>

        {/* Token Usage Meter */}
        <div className="p-6 rounded-2xl bg-card border border-border/60 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <span>{t("billing.tokens_usage_title")}</span>
              </span>
              <span className="font-mono font-bold text-xs text-foreground">
                {percentage}%
              </span>
            </div>

            <div className="space-y-1.5">
              <Progress value={percentage} variant="brand" size="md" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>{tokensUsed.toLocaleString("ru-RU")} токенов</span>
                <span>{tokensLimit.toLocaleString("ru-RU")} макс</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/40">
            {t("billing.tokens_reset_notice")}
          </p>
        </div>
      </div>

      {/* Features & Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Included Features */}
        <SectionCard
          title={t("billing.features_title")}
          description="Возможности, включенные в тарифный план PRO AGENT"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            {[
              "Подключение WhatsApp, Instagram и Telegram",
              "Интеллектуальная база знаний (Layer 2 & RAG)",
              "Автоматическая проверка слотов и запись",
              "Перехват диалогов менеджером и Live Overflow",
              "Автоматические дожимы 24ч и 72ч",
              "Неограниченное число специалистов в графике",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Payment Method */}
        <SectionCard
          title={t("billing.payment_method_title")}
          description={t("billing.payment_method_desc")}
        >
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/60 pt-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-card border border-border/60">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Visa •••• 4242
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Срок действия: 12/28
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" className="text-xs">
              {t("billing.update_card_btn")}
            </Button>
          </div>
        </SectionCard>
      </div>

      {/* Invoice History Table */}
      <SectionCard
        title={t("billing.invoices_title")}
        description={t("billing.invoices_desc")}
      >
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold">{t("billing.invoice_id")}</th>
                <th className="py-2.5 px-3 font-semibold">{t("billing.invoice_date")}</th>
                <th className="py-2.5 px-3 font-semibold">{t("billing.invoice_amount")}</th>
                <th className="py-2.5 px-3 font-semibold">{t("billing.invoice_status")}</th>
                <th className="py-2.5 px-3 font-semibold text-right">{t("billing.invoice_action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {mockInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-foreground">
                    {inv.id}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    {inv.date}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-foreground">
                    {inv.amount}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {t("billing.invoice_status_paid")}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      className="h-7 px-2 text-xs"
                    >
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </FadeIn>
  );
}
