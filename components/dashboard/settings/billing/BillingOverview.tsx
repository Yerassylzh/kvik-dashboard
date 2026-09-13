"use client";

import React from "react";
import { CreditCard, Zap, CheckCircle2, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export function BillingOverview() {
  const t = useTranslations("dashboard");

  const tokensUsed = 6840;
  const tokensLimit = 10000;
  const percentage = Math.round((tokensUsed / tokensLimit) * 100);

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionCard
        title="Тарифный план и лимиты"
        description="Информация о текущей подписке и использовании токенов ИИ"
        className="max-w-3xl"
      >
        <div className="space-y-6 pt-2">
          {/* Plan Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 via-card to-card border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-foreground">PRO AGENT</span>
                <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Активен
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Неограниченные каналы связи, автоответы 24/7 и интеграция с календарем
              </p>
            </div>

            <Button
              size="sm"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              className="shrink-0 text-xs"
            >
              Управление подпиской
            </Button>
          </div>

          {/* AI Tokens Meter */}
          <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <span>Использование токенов ИИ</span>
              </span>
              <span className="font-mono font-bold text-foreground">
                {tokensUsed.toLocaleString("ru-RU")} / {tokensLimit.toLocaleString("ru-RU")}
              </span>
            </div>

            <Progress value={percentage} variant="brand" size="md" />

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>Лимит обновляется 1-го числа каждого месяца</span>
              <span className="font-mono font-semibold">{percentage}%</span>
            </div>
          </div>

          {/* Included Features */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Возможности тарифа
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                "Подключение WhatsApp, Instagram Direct и Telegram",
                "Интеллектуальная база знаний (RAG)",
                "Автоматическая проверка свободных слотов",
                "Перехват диалогов менеджером и Live Overflow",
                "Автоматические дожимы 24ч и 72ч",
                "Неограниченное число специалистов в расписании",
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
