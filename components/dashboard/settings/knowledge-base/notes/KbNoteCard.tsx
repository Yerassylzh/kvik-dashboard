"use client";

import React from "react";
import { StickyNote, Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ManualNoteDto } from "@/types/knowledgeBase";

interface KbNoteCardProps {
  note: ManualNoteDto;
  onToggleActive: (note: ManualNoteDto) => void;
  onEdit: (note: ManualNoteDto) => void;
  onDelete: (id: string) => void;
}

export function KbNoteCard({
  note,
  onToggleActive,
  onEdit,
  onDelete,
}: KbNoteCardProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        note.active
          ? "bg-card border-border/60 shadow-xs"
          : "bg-muted/10 border-border/30 opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <StickyNote className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-foreground truncate">
            {note.title || t("knowledge.note_fallback")}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {note.processingStatus === "COMPLETED" && (
            <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
              {tCommon("status_completed")}
            </Badge>
          )}
          {note.processingStatus === "PENDING" && (
            <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">
              <Clock className="w-2.5 h-2.5 mr-1" />
              {tCommon("status_pending")}
            </Badge>
          )}
          {note.processingStatus === "FAILED" && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
              <AlertCircle className="w-2.5 h-2.5 mr-1" />
              {tCommon("status_failed")}
            </Badge>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap mb-4">
        {note.note}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
        {/* Active switch */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={note.active}
            onChange={() => onToggleActive(note)}
            className="w-3.5 h-3.5 rounded text-primary focus:ring-primary/20 accent-primary"
          />
          <span className="text-[11px] text-muted-foreground">
            {note.active ? t("knowledge.active_for_ai") : t("knowledge.active_disabled")}
          </span>
        </label>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(note)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(note.id)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
