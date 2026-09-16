"use client";

import React, { useState } from "react";
import { Zap, Clock, Bell, RefreshCw, CheckCircle2, Sliders, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import clsx from "clsx";

interface AutomationItem {
  id: string;
  titleKey: string;
  descKey: string;
  triggerText: string;
  delayText: string;
  defaultTemplate: string;
  isEnabled: boolean;
  category: "followup" | "reminder" | "winback";
}

const INITIAL_AUTOMATIONS: AutomationItem[] = [
  {
    id: "followup_24h",
    titleKey: "automations.followup_24h_title",
    descKey: "automations.followup_24h_desc",
    triggerText: "Клиент перестал отвечать после уточнения услуги или цены",
    delayText: "Через 24 часа",
    defaultTemplate: "Здравствуйте, {имя}! Подскажите, актуальна ли еще запись на {услуга}? Могу предложить свободные окна на этой неделе ✨",
    isEnabled: true,
    category: "followup",
  },
  {
    id: "followup_72h",
    titleKey: "automations.followup_72h_title",
    descKey: "automations.followup_72h_desc",
    triggerText: "Клиент не ответил на первое напоминание (24h)",
    delayText: "Через 72 часа (3 дня)",
    defaultTemplate: "{имя}, добрый день! Если у вас остались вопросы по процедуре или графику мастеров, с радостью подскажу. Хорошего дня!",
    isEnabled: true,
    category: "followup",
  },
  {
    id: "reminder_24h",
    titleKey: "automations.reminder_24h_title",
    descKey: "automations.reminder_24h_desc",
    triggerText: "До подтвержденной записи осталось 24 часа",
    delayText: "За 24 часа до визита",
    defaultTemplate: "Напоминаем о вашей записи на завтра в {время} к специалисту {мастер}. Ждем вас по адресу {адрес}! Подтверждаете визит?",
    isEnabled: true,
    category: "reminder",
  },
  {
    id: "reminder_2h",
    titleKey: "automations.reminder_2h_title",
    descKey: "automations.reminder_2h_desc",
    triggerText: "До записи осталось 2 часа",
    delayText: "За 2 часа до визита",
    defaultTemplate: "Ждем вас сегодня в {время} на {услуга}! Наш филиал на карте 2GIS: {ссылка_2gis}",
    isEnabled: false,
    category: "reminder",
  },
  {
    id: "reactivation_30d",
    titleKey: "automations.reactivation_title",
    descKey: "automations.reactivation_desc",
    triggerText: "Прошло 30 дней после успешного завершения процедуры",
    delayText: "Через 30 дней",
    defaultTemplate: "Здравствуйте, {имя}! Прошел уже месяц с вашего визита на {услуга}. Хотите обновить результат и записаться на удобный день?",
    isEnabled: false,
    category: "winback",
  },
];

export function AutomationsPage() {
  const t = useTranslations("dashboard");
  const [automations, setAutomations] = useState<AutomationItem[]>(INITIAL_AUTOMATIONS);
  const [selectedId, setSelectedId] = useState<string | null>("followup_24h");
  const [activeFilter, setActiveFilter] = useState<"all" | "followup" | "reminder" | "winback">("all");

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextState = !a.isEnabled;
          toast.success(
            nextState
              ? `${t(a.titleKey as any)} включено`
              : `${t(a.titleKey as any)} приостановлено`
          );
          return { ...a, isOpen: nextState, isEnabled: nextState };
        }
        return a;
      })
    );
  };

  const updateTemplate = (id: string, newText: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, defaultTemplate: newText } : a))
    );
  };

  const filteredAutomations = automations.filter((a) =>
    activeFilter === "all" ? true : a.category === activeFilter
  );

  const selectedItem = automations.find((a) => a.id === selectedId) || automations[0];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("automations.title")}
        description={t("automations.desc")}
        badge={<Badge variant="success">BullMQ Automation Engine</Badge>}
        tabs={[
          {
            id: "all",
            label: "Все сценарии",
            icon: Zap,
            active: activeFilter === "all",
            onClick: () => setActiveFilter("all"),
          },
          {
            id: "followup",
            label: "Дожим лидов (24h/72h)",
            icon: Clock,
            active: activeFilter === "followup",
            onClick: () => setActiveFilter("followup"),
          },
          {
            id: "reminder",
            label: "Напоминания о записи",
            icon: Bell,
            active: activeFilter === "reminder",
            onClick: () => setActiveFilter("reminder"),
          },
          {
            id: "winback",
            label: "Повторные визиты",
            icon: RefreshCw,
            active: activeFilter === "winback",
            onClick: () => setActiveFilter("winback"),
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Automation Cards List */}
        <div className="lg:col-span-6 space-y-3">
          {filteredAutomations.map((item) => {
            const isSelected = selectedItem?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={clsx(
                  "p-4 rounded-2xl border transition-all cursor-pointer space-y-3",
                  isSelected
                    ? "bg-card border-primary ring-1 ring-primary shadow-sm"
                    : "bg-card/60 hover:bg-card border-border/80 hover:border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {t(item.titleKey as any)}
                      </span>
                      <Badge
                        variant={item.isEnabled ? "success" : "secondary"}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {item.isEnabled ? t("automations.status_enabled") : t("automations.status_disabled")}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t(item.descKey as any)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAutomation(item.id);
                    }}
                    className={clsx(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                      item.isEnabled ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={clsx(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                        item.isEnabled ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                  <span className="font-medium">⏱️ {item.delayText}</span>
                  <span className="text-primary flex items-center gap-1 font-semibold">
                    Настроить <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Template & Trigger Editor */}
        <div className="lg:col-span-6 space-y-4">
          {selectedItem && (
            <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {t(selectedItem.titleKey as any)}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedItem.delayText}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => toast.success("Шаблон сохранен")}
                  className="text-xs rounded-xl"
                >
                  Сохранить
                </Button>
              </div>

              {/* Trigger details */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1">
                <span className="font-bold text-foreground block">
                  🎯 Условие срабатывания:
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {selectedItem.triggerText}
                </span>
              </div>

              {/* Message template editor */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Текст отправляемого сообщения:
                </label>
                <textarea
                  rows={4}
                  value={selectedItem.defaultTemplate}
                  onChange={(e) => updateTemplate(selectedItem.id, e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              {/* Dynamic tag helper */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Доступные переменные (теги):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["{имя}", "{услуга}", "{время}", "{мастер}", "{адрес}", "{ссылка_2gis}"].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          updateTemplate(
                            selectedItem.id,
                            `${selectedItem.defaultTemplate} ${tag}`
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-mono border border-border/60 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Stop condition pill */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Умное авто-отключение:</span>
                </div>
                <p className="text-[10px] leading-relaxed opacity-90">
                  Если клиент ответит на сообщение или запишется на услугу раньше срока,
                  цепочка автоматически отменяется.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
