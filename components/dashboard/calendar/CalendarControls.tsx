"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CalendarDays,
  List as ListIcon,
  Plus,
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export type CalendarViewType = "matrix" | "month" | "list";

interface CalendarControlsProps {
  selectedDate: Date;
  viewType: CalendarViewType;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarViewType) => void;
  onOpenCreate: () => void;
}

export function CalendarControls({
  selectedDate,
  viewType,
  onDateChange,
  onViewChange,
  onOpenCreate,
}: CalendarControlsProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Date navigation */}
      <div className="flex items-center gap-0.5 bg-card border border-border/80 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => onDateChange(subDays(selectedDate, 1))}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDateChange(new Date())}
          className="px-2 py-1 text-xs font-medium hover:bg-muted rounded-md text-foreground cursor-pointer"
        >
          {t("calendar.today")} ({format(selectedDate, "d MMM, EEE", { locale: ru })})
        </button>
        <button
          type="button"
          onClick={() => onDateChange(addDays(selectedDate, 1))}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border/70">
        <button
          type="button"
          onClick={() => onViewChange("matrix")}
          className={clsx(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
            viewType === "matrix"
              ? "bg-card text-foreground shadow-2xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("calendar.view_matrix")}</span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange("month")}
          className={clsx(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
            viewType === "month"
              ? "bg-card text-foreground shadow-2xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("calendar.view_month")}</span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange("list")}
          className={clsx(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
            viewType === "list"
              ? "bg-card text-foreground shadow-2xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ListIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("calendar.view_list")}</span>
        </button>
      </div>

      <Button
        size="sm"
        onClick={onOpenCreate}
        leftIcon={<Plus className="w-3.5 h-3.5" />}
        className="text-xs"
      >
        {t("calendar.new_booking")}
      </Button>
    </div>
  );
}
