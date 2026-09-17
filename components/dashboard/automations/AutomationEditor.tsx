"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { AutomationItem } from "./AutomationCard";

interface AutomationEditorProps {
  item: AutomationItem;
  onUpdateTemplate: (text: string) => void;
}

const AVAILABLE_TAGS = [
  "{имя}",
  "{услуга}",
  "{время}",
  "{мастер}",
  "{адрес}",
  "{ссылка_2gis}",
];

export function AutomationEditor({ item, onUpdateTemplate }: AutomationEditorProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t(item.titleKey as any)}
          </h3>
          <p className="text-[11px] text-muted-foreground">{item.delayText}</p>
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
        <span className="text-muted-foreground text-[11px]">{item.triggerText}</span>
      </div>

      {/* Message template editor */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground block">
          Текст отправляемого сообщения:
        </label>
        <textarea
          rows={4}
          value={item.defaultTemplate}
          onChange={(e) => onUpdateTemplate(e.target.value)}
          className="w-full p-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed"
        />
      </div>

      {/* Dynamic tag helper */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Доступные переменные (теги):
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onUpdateTemplate(`${item.defaultTemplate} ${tag}`)}
              className="px-2 py-1 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-mono border border-border/60 transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
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
  );
}
