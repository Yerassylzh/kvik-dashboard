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
import { Textarea } from "@/components/ui/textarea";
import { RecommendationItemDto, DismissalReasonCode } from "@/types/insights";
import { XCircle, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

interface DismissRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: RecommendationItemDto | null;
  onConfirmDismiss: (
    id: string,
    payload: {
      reasonCode: DismissalReasonCode;
      feedbackNotes?: string;
      suppressPermanently?: boolean;
    }
  ) => Promise<unknown>;
  isDismissing?: boolean;
}

const REASONS: Array<{
  code: DismissalReasonCode;
  labelKey: "not_applicable" | "business_decision" | "resolved_offline" | "incorrect_extraction" | "other";
  descKey: "not_applicable_desc" | "business_decision_desc" | "resolved_offline_desc" | "incorrect_extraction_desc" | "other_desc";
}> = [
  {
    code: "NOT_APPLICABLE_TO_NICHE",
    labelKey: "not_applicable",
    descKey: "not_applicable_desc",
  },
  {
    code: "BUSINESS_DECISION_NO",
    labelKey: "business_decision",
    descKey: "business_decision_desc",
  },
  {
    code: "ALREADY_RESOLVED_OFFLINE",
    labelKey: "resolved_offline",
    descKey: "resolved_offline_desc",
  },
  {
    code: "INCORRECT_EXTRACTION",
    labelKey: "incorrect_extraction",
    descKey: "incorrect_extraction_desc",
  },
  {
    code: "OTHER",
    labelKey: "other",
    descKey: "other_desc",
  },
];

export function DismissRecommendationModal({
  isOpen,
  onClose,
  recommendation,
  onConfirmDismiss,
  isDismissing = false,
}: DismissRecommendationModalProps) {
  const t = useTranslations("insights");
  const [selectedReason, setSelectedReason] = useState<DismissalReasonCode>("BUSINESS_DECISION_NO");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [suppressPermanently, setSuppressPermanently] = useState(true);

  if (!recommendation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDismissing) return;
    try {
      await onConfirmDismiss(recommendation.id, {
        reasonCode: selectedReason,
        feedbackNotes: feedbackNotes.trim() || undefined,
        suppressPermanently,
      });
      onClose();
    } catch {
      // Error handled with toast upstream
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2 text-rose-600">
            <XCircle className="w-5 h-5" />
            <DialogTitle className="text-base font-bold text-foreground">
              {t("dismiss.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("dismiss.desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {/* Reason Code Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              {t("dismiss.reason_label")}
            </label>
            <div className="space-y-1.5">
              {REASONS.map((r) => (
                <label
                  key={r.code}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                    selectedReason === r.code
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="dismissReason"
                    value={r.code}
                    checked={selectedReason === r.code}
                    onChange={() => setSelectedReason(r.code)}
                    className="mt-0.5 text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-foreground font-medium text-xs leading-none">
                      {t(`dismiss.reason.${r.labelKey}`)}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {t(`dismiss.reason.${r.descKey}`)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Optional notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              {t("dismiss.notes_label")}
            </label>
            <Textarea
              rows={2}
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              placeholder={t("dismiss.notes_placeholder")}
              className="text-xs resize-none"
            />
          </div>

          {/* Suppress permanently toggle */}
          <label className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/60 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={suppressPermanently}
              onChange={(e) => setSuppressPermanently(e.target.checked)}
              className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{t("dismiss.suppress_label")}</span>
            </div>
          </label>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isDismissing}
              className="text-xs h-8"
            >
              {t("dismiss.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isDismissing}
              className="text-xs h-8 font-semibold"
            >
              {isDismissing ? t("dismiss.confirming") : t("dismiss.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
