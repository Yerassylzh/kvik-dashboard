"use client";

import React, { useState } from "react";
import {
  LineChart,
  MessageSquare,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Plus,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UnansweredQuestion {
  id: string;
  question: string;
  frequency: number;
  lastAsked: string;
  category: string;
  suggestedAnswer: string;
}

const INITIAL_UNANSWERED: UnansweredQuestion[] = [
  {
    id: "q1",
    question: "Есть ли у вас парковка для клиентов рядом с филиалом?",
    frequency: 18,
    lastAsked: "Сегодня, 11:20",
    category: "Локация и парковка",
    suggestedAnswer: "Да, у нас есть бесплатная парковка для клиентов со стороны ул. Абая. Шлагбаум открывается по звонку администратору.",
  },
  {
    id: "q2",
    question: "Принимаете ли оплату через Kaspi Red / Рассрочку 0-0-12?",
    frequency: 14,
    lastAsked: "Вчера, 18:45",
    category: "Оплата",
    suggestedAnswer: "Да, мы принимаем Kaspi QR, Kaspi Red и оформляем рассрочку Kaspi 0-0-12 на любые курсовые процедуры.",
  },
  {
    id: "q3",
    question: "Можно ли прийти на чистку лица, если есть легкое высыпание?",
    frequency: 9,
    lastAsked: "14 сентября",
    category: "Медицинские показания",
    suggestedAnswer: "Перед процедурой косметолог проводит бесплатный осмотр кожи и подбирает атравматичную или комбинированную чистку по показаниям.",
  },
];

export function InsightsPage() {
  const t = useTranslations("dashboard");
  const [questions] = useState<UnansweredQuestion[]>(INITIAL_UNANSWERED);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const handleAddToKb = (item: UnansweredQuestion) => {
    setAddedIds((prev) => [...prev, item.id]);
    toast.success("Ответ успешно добавлен в Базу Знаний");
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("insights.title")}
        description={t("insights.desc")}
        badge={<Badge variant="primary">AI Conversation Intelligence</Badge>}
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{t("insights.kpi_conversations")}</span>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground font-mono tabular-nums">148</p>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +24% за эту неделю
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{t("insights.kpi_ai_success")}</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-foreground font-mono tabular-nums">74.2%</p>
          <span className="text-[10px] text-muted-foreground">
            Автономная запись без менеджера
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{t("insights.kpi_human_intercept")}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-foreground font-mono tabular-nums">18.5%</p>
          <span className="text-[10px] text-muted-foreground">
            Перехвачено администратором
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Среднее время первого ответа</span>
            <LineChart className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground font-mono tabular-nums">12 сек</p>
          <span className="text-[10px] text-emerald-600 font-semibold">
            В 15 раз быстрее ручного ответа
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drop-off reasons funnel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t("insights.dropoff_title")}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Автоматический анализ причин незавершенных диалогов:
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">
                    Цена / Не подошла стоимость
                  </span>
                  <span className="font-mono font-bold text-muted-foreground tabular-nums">42%</span>
                </div>
                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[42%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">
                    Нет свободных окон в вечернее время
                  </span>
                  <span className="font-mono font-bold text-muted-foreground tabular-nums">28%</span>
                </div>
                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[28%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">
                    Вопрос без ответа (нет в базе знаний)
                  </span>
                  <span className="font-mono font-bold text-muted-foreground tabular-nums">18%</span>
                </div>
                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full w-[18%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">
                    Клиент подумает / ответит позже
                  </span>
                  <span className="font-mono font-bold text-muted-foreground tabular-nums">12%</span>
                </div>
                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground/60 rounded-full w-[12%]" />
                </div>
              </div>
            </div>

            {/* Sentiment breakdown */}
            <div className="pt-4 border-t border-border/60">
              <h4 className="text-xs font-bold text-foreground mb-2">
                {t("insights.sentiment_title")}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Smile className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-xs font-bold text-emerald-700 block tabular-nums">82%</span>
                  <span className="text-[10px] text-muted-foreground">Позитивное</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <Meh className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs font-bold text-foreground block tabular-nums">15%</span>
                  <span className="text-[10px] text-muted-foreground">Нейтральное</span>
                </div>
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <Frown className="w-4 h-4 text-destructive mx-auto mb-1" />
                  <span className="text-xs font-bold text-destructive block tabular-nums">3%</span>
                  <span className="text-[10px] text-muted-foreground">Негатив</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Unanswered Questions & KB Gap Logger */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("insights.unanswered_title")}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Реальные вопросы клиентов, на которые у ИИ не было точного ответа:
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono tabular-nums">
                {questions.length} пробелов
              </Badge>
            </div>

            <div className="space-y-3">
              {questions.map((item) => {
                const isAdded = addedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg border border-border/70 bg-muted/10 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <Badge variant="secondary" className="text-[9px] mb-1">
                          {item.category}
                        </Badge>
                        <p className="text-xs font-semibold text-foreground">
                          &quot;{item.question}&quot;
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 tabular-nums">
                        Спросили {item.frequency} раз
                      </span>
                    </div>

                    <div className="p-2.5 rounded-md bg-card border border-border/60 text-[11px] text-muted-foreground space-y-0.5">
                      <span className="text-[10px] font-bold text-foreground block">
                        Рекомендуемый ответ для ИИ:
                      </span>
                      <p>{item.suggestedAnswer}</p>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      {isAdded ? (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> В базе знаний
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddToKb(item)}
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          {t("insights.add_to_kb_btn")}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
