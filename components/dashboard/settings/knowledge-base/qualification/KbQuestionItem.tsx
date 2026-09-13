"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { QualificationQuestion } from "@/types/knowledgeBase";

interface KbQuestionItemProps {
  question: QualificationQuestion;
  index: number;
  onUpdate: (index: number, key: keyof QualificationQuestion, value: any) => void;
  onRemove: (index: number) => void;
}

export function KbQuestionItem({
  question,
  index,
  onUpdate,
  onRemove,
}: KbQuestionItemProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/40">
      <span className="text-xs font-mono font-bold text-muted-foreground w-5 text-center">
        {index + 1}.
      </span>
      <Input
        value={question.question}
        onChange={(e) => onUpdate(index, "question", e.target.value)}
        placeholder={t("knowledge.qual_question_text")}
        className="flex-1 text-xs h-8"
      />
      <label className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={question.required ?? true}
          onChange={(e) => onUpdate(index, "required", e.target.checked)}
          className="w-3.5 h-3.5 rounded text-primary accent-primary"
        />
        <span>{t("knowledge.qual_required_badge")}</span>
      </label>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}
