"use client";

import React, { useState } from "react";
import { Zap, Clock, Bell, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AutomationCard, type AutomationItem } from "./AutomationCard";
import { AutomationEditor } from "./AutomationEditor";

const INITIAL_AUTOMATIONS: AutomationItem[] = [
  {
    id: "followup_24h",
    titleKey: "automations.followup_24h_title",
    descKey: "automations.followup_24h_desc",
    triggerText: "Клиент перестал отвечать после уточнения услуги или цены",
    delayText: "Через 24 часа",
    defaultTemplate:
      "Здравствуйте, {имя}! Подскажите, актуальна ли еще запись на {услуга}? Могу предложить свободные окна на этой неделе ✨",
    isEnabled: true,
    category: "followup",
  },
  {
    id: "followup_72h",
    titleKey: "automations.followup_72h_title",
    descKey: "automations.followup_72h_desc",
    triggerText: "Клиент не ответил на первое напоминание (24h)",
    delayText: "Через 72 часа (3 дня)",
    defaultTemplate:
      "{имя}, добрый день! Если у вас остались вопросы по процедуре или графику мастеров, с радостью подскажу. Хорошего дня!",
    isEnabled: true,
    category: "followup",
  },
  {
    id: "reminder_24h",
    titleKey: "automations.reminder_24h_title",
    descKey: "automations.reminder_24h_desc",
    triggerText: "До подтвержденной записи осталось 24 часа",
    delayText: "За 24 часа до визита",
    defaultTemplate:
      "Напоминаем о вашей записи на завтра в {время} к специалисту {мастер}. Ждем вас по адресу {адрес}! Подтверждаете визит?",
    isEnabled: true,
    category: "reminder",
  },
  {
    id: "reminder_2h",
    titleKey: "automations.reminder_2h_title",
    descKey: "automations.reminder_2h_desc",
    triggerText: "До записи осталось 2 часа",
    delayText: "За 2 часа до визита",
    defaultTemplate:
      "Ждем вас сегодня в {время} на {услуга}! Наш филиал на карте 2GIS: {ссылка_2gis}",
    isEnabled: false,
    category: "reminder",
  },
  {
    id: "reactivation_30d",
    titleKey: "automations.reactivation_title",
    descKey: "automations.reactivation_desc",
    triggerText: "Прошло 30 дней после успешного завершения процедуры",
    delayText: "Через 30 дней",
    defaultTemplate:
      "Здравствуйте, {имя}! Прошел уже месяц с вашего визита на {услуга}. Хотите обновить результат и записаться на удобный день?",
    isEnabled: false,
    category: "winback",
  },
];

export function AutomationsPage() {
  const t = useTranslations("dashboard");
  const [automations, setAutomations] = useState<AutomationItem[]>(INITIAL_AUTOMATIONS);
  const [selectedId, setSelectedId] = useState<string | null>("followup_24h");
  const [activeFilter, setActiveFilter] = useState<"all" | "followup" | "reminder" | "winback">(
    "all"
  );

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
          return { ...a, isEnabled: nextState };
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
          {filteredAutomations.map((item) => (
            <AutomationCard
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onSelect={() => setSelectedId(item.id)}
              onToggle={() => toggleAutomation(item.id)}
            />
          ))}
        </div>

        {/* Right Column: Template & Trigger Editor */}
        <div className="lg:col-span-6 space-y-4">
          {selectedItem && (
            <AutomationEditor
              item={selectedItem}
              onUpdateTemplate={(text) => updateTemplate(selectedItem.id, text)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
