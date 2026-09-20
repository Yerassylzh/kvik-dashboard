"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RecommendationItemDto } from "@/types/insights";
import { Zap, Check, Clock, PlusCircle, BookOpen, Bot } from "lucide-react";
import { useTranslations } from "next-intl";

interface ApplyRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: RecommendationItemDto | null;
  onConfirmApply: (id: string, customizedPayload?: Record<string, unknown>) => Promise<unknown>;
  isApplying?: boolean;
}

interface ModalContentProps {
  recommendation: RecommendationItemDto;
  onClose: () => void;
  onConfirmApply: (id: string, customizedPayload?: Record<string, unknown>) => Promise<unknown>;
  isApplying: boolean;
}

function ApplyRecommendationModalContent({
  recommendation,
  onClose,
  onConfirmApply,
  isApplying,
}: ModalContentProps) {
  const t = useTranslations("insights");
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    recommendation.actionPayload ? { ...recommendation.actionPayload } : {}
  );

  const handleFieldChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isApplying) return;
    try {
      await onConfirmApply(recommendation.id, formData);
      onClose();
    } catch {
      // Error handled with toast upstream
    }
  };

  const renderFormFields = () => {
    switch (recommendation.actionType) {
      case "ADD_SERVICE_OFFERING":
        return (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 text-primary font-medium">
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{t("apply.service.notice")}</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{t("apply.service.name_label")}</label>
              <Input
                value={(formData.serviceName as string) || ""}
                onChange={(e) => handleFieldChange("serviceName", e.target.value)}
                placeholder={t("apply.service.name_placeholder")}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t("apply.service.category_label")}</label>
                <Input
                  value={(formData.category as string) || ""}
                  onChange={(e) => handleFieldChange("category", e.target.value)}
                  placeholder={t("apply.service.category_placeholder")}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t("apply.service.duration_label")}</label>
                <Input
                  type="number"
                  value={Number(formData.suggestedDurationMinutes) || 60}
                  onChange={(e) => handleFieldChange("suggestedDurationMinutes", Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{t("apply.service.price_label")}</label>
              <Input
                type="number"
                value={formData.suggestedPrice !== undefined ? String(formData.suggestedPrice) : ""}
                onChange={(e) => handleFieldChange("suggestedPrice", Number(e.target.value))}
                placeholder="12000"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{t("apply.service.description_label")}</label>
              <Textarea
                rows={2}
                value={(formData.description as string) || ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder={t("apply.service.description_placeholder")}
                className="text-xs resize-none"
              />
            </div>
          </div>
        );

      case "UPDATE_SCHEDULE_HOURS":
        return (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 text-amber-800 font-medium">
              <Clock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{t("apply.schedule.notice")}</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{t("apply.schedule.days_label")}</label>
              <Input
                value={
                  Array.isArray(formData.targetDays)
                    ? (formData.targetDays as string[]).join(", ")
                    : (formData.targetDays as string) || ""
                }
                onChange={(e) =>
                  handleFieldChange(
                    "targetDays",
                    e.target.value.split(",").map((s) => s.trim())
                  )
                }
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t("apply.schedule.open_label")}</label>
                <Input
                  value={(formData.newOpenTime as string) || "09:00"}
                  onChange={(e) => handleFieldChange("newOpenTime", e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t("apply.schedule.close_label")}</label>
                <Input
                  value={(formData.newCloseTime as string) || "20:00"}
                  onChange={(e) => handleFieldChange("newCloseTime", e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        );

      case "ADD_KNOWLEDGE_NOTE":
        return (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 text-blue-800 font-medium">
              <BookOpen className="w-4 h-4 shrink-0 text-blue-600" />
              <span>{t("apply.kb.notice")}</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{t("apply.kb.title_label")}</label>
              <Input
                value={(formData.title as string) || ""}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{t("apply.kb.content_label")}</label>
              <Textarea
                rows={3}
                value={(formData.content as string) || ""}
                onChange={(e) => handleFieldChange("content", e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>
        );

      case "UPDATE_PROMPT_RULE":
        return (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 text-purple-800 font-medium">
              <Bot className="w-4 h-4 shrink-0 text-purple-600" />
              <span>{t("apply.prompt.notice")}</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{t("apply.prompt.rule_label")}</label>
              <Textarea
                rows={3}
                value={(formData.ruleText as string) || ""}
                onChange={(e) => handleFieldChange("ruleText", e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-2">
            <p>{t("apply.manual.desc")}</p>
            <p className="font-medium text-foreground">{recommendation.title}</p>
          </div>
        );
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader className="text-left space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-primary/10 text-primary">
            <Zap className="w-4 h-4 fill-current" />
          </span>
          <DialogTitle className="text-base font-bold">
            {t("apply.title")}
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-muted-foreground">
          {t("apply.desc")}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {renderFormFields()}

        <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isApplying}
            className="text-xs h-8"
          >
            {t("apply.cancel")}
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={isApplying}
            className="text-xs h-8 gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isApplying ? t("apply.confirming") : t("apply.confirm")}</span>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function ApplyRecommendationModal({
  isOpen,
  onClose,
  recommendation,
  onConfirmApply,
  isApplying = false,
}: ApplyRecommendationModalProps) {
  if (!isOpen || !recommendation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ApplyRecommendationModalContent
        key={recommendation.id}
        recommendation={recommendation}
        onClose={onClose}
        onConfirmApply={onConfirmApply}
        isApplying={isApplying}
      />
    </Dialog>
  );
}
