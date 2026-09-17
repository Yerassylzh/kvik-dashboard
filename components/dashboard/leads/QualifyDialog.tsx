"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface QualifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    serviceInterest?: string;
    budget?: number;
    notes?: string;
  }) => Promise<void>;
  initialService?: string;
}

export function QualifyDialog({
  isOpen,
  onClose,
  onConfirm,
  initialService = "",
}: QualifyDialogProps) {
  const t = useTranslations("dashboard");
  const [serviceInterest, setServiceInterest] = useState(initialService);
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm({
        serviceInterest: serviceInterest.trim() || undefined,
        budget: budget ? Number(budget) : undefined,
        notes: notes.trim() || undefined,
      });
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
      title={t("leads.qualify_modal_title")}
      description="Перевод лида в статус квалифицированного с фиксацией потребности"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("leads.qualify_service_label")}
          </label>
          <Input
            value={serviceInterest}
            onChange={(e) => setServiceInterest(e.target.value)}
            placeholder="Например: Сложное окрашивание"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("leads.qualify_budget_label")}
          </label>
          <Input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="35000"
            className="text-xs font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("leads.qualify_notes_label")}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Дополнительные пожелания клиента..."
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
            size="sm"
            loading={isSubmitting}
            className="text-xs font-semibold"
          >
            {t("leads.qualify_confirm_btn")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
