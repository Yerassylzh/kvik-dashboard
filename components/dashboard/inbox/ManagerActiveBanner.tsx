"use client";

import React, { useState } from "react";
import { ShieldCheck, Bot, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { conversationsApi } from "@/lib/api/conversations";

interface ManagerActiveBannerProps {
  conversationId: string;
  isAssignedToMe: boolean;
  assigneeName?: string | null;
  onReturnToBot?: () => void;
}

export function ManagerActiveBanner({
  conversationId,
  isAssignedToMe,
  assigneeName,
  onReturnToBot,
}: ManagerActiveBannerProps) {
  const t = useTranslations("dashboard");
  const [isReturning, setIsReturning] = useState(false);

  const handleReturnToBot = async () => {
    setIsReturning(true);
    try {
      if (isAssignedToMe) {
        await conversationsApi.releaseTakeover(conversationId);
      }
      await conversationsApi.updateStatus(conversationId, "BOT_ACTIVE");
      toast.success(t("inbox.takeover_returned_to_bot_toast"));
      onReturnToBot?.();
    } catch {
      toast.error(t("inbox.takeover_return_error"));
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">
              {t("inbox.manager_active_banner_title")}
            </span>
            {assigneeName && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {assigneeName}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            {t("inbox.manager_active_banner_desc")}
          </p>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleReturnToBot}
        loading={isReturning}
        leftIcon={<Bot className="w-3.5 h-3.5 text-primary" />}
        className="shrink-0 text-xs font-semibold h-8 bg-card hover:bg-muted border-border/80"
      >
        <Sparkles className="w-3 h-3 text-primary mr-1" />
        {t("inbox.handoff_return_bot")}
      </Button>
    </div>
  );
}
