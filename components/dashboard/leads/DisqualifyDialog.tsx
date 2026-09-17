"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LeadLossReason } from "@/lib/api/leads";

interface DisqualifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lossReason: LeadLossReason, lossNotes?: string) => Promise<void>;
}

const lossReasonOptions: LeadLossReason[] = [
  "DISQUALIFIED_BY_POLICY",
  "OUT_OF_SERVICE_AREA",
  "PRICE_TOO_HIGH",
  "UNSUPPORTED_SERVICE",
  "CLIENT_DECLINED",
  "UNRESPONSIVE_AFTER_FOLLOWUP",
  "CANCELLED_WITHOUT_REBOOK",
  "SPAM",
  "OTHER",
];

export function DisqualifyDialog({
  isOpen,
  onClose,
  onConfirm,
}: DisqualifyDialogProps) {
  const t = useTranslations("dashboard");
  const [selectedReason, setSelectedReason] = useState<LeadLossReason>("CLIENT_DECLINED");
  const [lossNotes, setLossNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selectedReason, lossNotes.trim() || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="dialog"
      title={t("leads.disqualify_dialog_title")}
      description={t("leads.disqualify_dialog_desc")}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("leads.loss_reason_label")} *
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value as LeadLossReason)}
            className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {lossReasonOptions.map((reason) => (
              <option key={reason} value={reason}>
                {t(`leads.loss_reason_${reason}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("leads.loss_notes_label")}
          </label>
          <Textarea
            value={lossNotes}
            onChange={(e) => setLossNotes(e.target.value)}
            placeholder={t("leads.notes_placeholder")}
            rows={3}
            className="text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            {t("bookings.cancel_btn")}
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            loading={isSubmitting}
            className="text-xs font-semibold"
          >
            {t("leads.disqualify_btn")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
