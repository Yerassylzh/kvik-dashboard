"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  isLoading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
  confirmLabel,
  cancelLabel,
}: ConfirmDeleteModalProps) {
  const t = useTranslations("common");

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="sm">
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            {cancelLabel || t("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            loading={isLoading}
            onClick={handleConfirm}
            className="text-xs"
          >
            {confirmLabel || t("delete")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
