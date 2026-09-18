"use client";

import React from "react";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FollowUpLogStatusBadge } from "./FollowUpLogStatusBadge";
import type { FollowUpLogItem } from "@/lib/api/followUps";

interface FollowUpMessageModalProps {
  log: FollowUpLogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FollowUpMessageModal({
  log,
  isOpen,
  onClose,
}: FollowUpMessageModalProps) {
  const t = useTranslations("dashboard");

  if (!log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">
                {t("automations.modal_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("automations.modal_step_channel", {
                  step: log.stepIndex,
                  channel: log.channelType,
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Recipient & Status Metadata */}
          <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("automations.modal_client_label")}</span>
              <strong className="text-foreground">
                {log.lead?.name || t("automations.modal_client_anonymous")}
              </strong>
            </div>

            {log.lead?.phone && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("automations.modal_phone_label")}</span>
                <span className="font-mono text-foreground">{log.lead.phone}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("automations.modal_status_label")}</span>
              <FollowUpLogStatusBadge status={log.status} />
            </div>

            {log.executedAt && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("automations.modal_sent_label")}</span>
                <span className="font-mono text-foreground">
                  {new Date(log.executedAt).toLocaleString("ru-RU")}
                </span>
              </div>
            )}

            {log.repliedAt && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("automations.modal_replied_label")}</span>
                <span className="font-mono text-emerald-600 font-semibold">
                  {new Date(log.repliedAt).toLocaleString("ru-RU")}
                </span>
              </div>
            )}

            {log.convertedToBooking && (
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold pt-1 border-t border-border/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("automations.modal_converted_badge")}</span>
              </div>
            )}
          </div>

          {/* Message Content Bubble */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t("automations.modal_message_label")}
            </label>
            <div className="p-3.5 rounded-xl border border-border/80 bg-card text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {log.messageText || t("automations.modal_message_empty")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
