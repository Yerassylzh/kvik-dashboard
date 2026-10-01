"use client";

import React, { useState } from "react";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { conversationsApi } from "@/lib/api/conversations";
import { Button } from "@/components/ui/button";

interface FollowUpThreadBannerProps {
  conversationId: string;
  pendingFollowUp?: {
    stepIndex: number;
    scheduledFor: string;
  } | null;
  onCancelled?: () => void;
}

export function FollowUpThreadBanner({
  conversationId,
  pendingFollowUp,
  onCancelled,
}: FollowUpThreadBannerProps) {
  const t = useTranslations("dashboard");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!pendingFollowUp || isDismissed) {
    return null;
  }

  const scheduledTimeStr = new Date(pendingFollowUp.scheduledFor).toLocaleTimeString(
    "ru-RU",
    { hour: "2-digit", minute: "2-digit" }
  );

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await conversationsApi.cancelFollowUp(conversationId);
      setIsDismissed(true);
      toast.success(t("inbox.followup_cancelled_toast"));
      onCancelled?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as { message?: string })?.message || t("inbox.followup_cancel_error");
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="mx-4 mt-2 mb-1 p-2.5 px-3.5 rounded-xl border border-border/70 bg-muted/30 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
      <div className="flex items-center gap-2 text-foreground font-medium min-w-0">
        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="truncate">
          {t("inbox.followup_banner_scheduled", {
            step: pendingFollowUp.stepIndex,
            time: scheduledTimeStr,
          })}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        loading={isCancelling}
        onClick={handleCancel}
        className="text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2 shrink-0"
      >
        {t("inbox.followup_banner_cancel_btn")}
      </Button>
    </div>
  );
}
