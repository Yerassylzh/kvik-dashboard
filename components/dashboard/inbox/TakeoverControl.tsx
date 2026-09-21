"use client";

import React, { useState } from "react";
import { Bot, UserCheck, Lock, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { conversationsApi } from "@/lib/api/conversations";
import { useInboxStore } from "@/store/inbox.store";
import { useAuthStore } from "@/store/auth.store";
import type { ConversationDto, ConversationStatus } from "@/lib/api/conversations";

interface TakeoverControlProps {
  conversation: ConversationDto;
  onStatusChange?: (status: ConversationStatus) => void;
  onRefresh?: () => void;
}

export function TakeoverControl({
  conversation,
  onStatusChange,
  onRefresh,
}: TakeoverControlProps) {
  const t = useTranslations("dashboard");
  const [isLoading, setIsLoading] = useState(false);

  const { takenConversationIds } = useInboxStore();
  const currentUser = useAuthStore((s) => s.user);
  // actorId mirrors the backend: staffMemberId (staff) or userId (owner)
  const myActorId = currentUser?.staffProfile?.id ?? currentUser?.id;

  const { status, takenOverByActorId } = conversation;

  // CLOSED: show neutral badge
  if (status === "CLOSED") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-muted border-border/60 text-muted-foreground select-none">
        <span>{t("inbox.status_closed")}</span>
      </div>
    );
  }

  // BOT_ACTIVE: show bot indicator + active button to manually take over & stop AI
  if (status === "BOT_ACTIVE") {
    const handleTakeoverFromBot = async () => {
      setIsLoading(true);
      try {
        await conversationsApi.updateStatus(conversation.id, "MANAGER_INTERCEPTED");
        try {
          await conversationsApi.takeover(conversation.id);
        } catch {
          // Status is still successfully transitioned even if lock endpoint has an issue
        }
        toast.success(t("inbox.takeover_success_toast"));
        onStatusChange?.("MANAGER_INTERCEPTED");
        onRefresh?.();
      } catch {
        toast.error(t("inbox.takeover_error_toast"));
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 border border-primary/20 text-primary select-none">
          <Bot className="w-3.5 h-3.5 shrink-0" />
          <span>{t("inbox.handoff_bot")}</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          loading={isLoading}
          onClick={handleTakeoverFromBot}
          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
          className="text-xs h-8 border-amber-400/60 text-amber-600 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 font-semibold"
        >
          {t("inbox.handoff_takeover")}
        </Button>
      </div>
    );
  }

  // MANAGER_INTERCEPTED вЂ” determine who owns it
  const isAssignedToMe = !!myActorId && takenOverByActorId === myActorId;
  const isTakenByOther =
    (!!takenOverByActorId && !isAssignedToMe) ||
    takenConversationIds.has(conversation.id);

  // Taken by someone else вЂ” disabled chip
  if (isTakenByOther && !isAssignedToMe) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-muted border-border/60 text-muted-foreground select-none">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        <span>{t("inbox.takeover_locked")}</span>
      </div>
    );
  }

  // Assigned to current user вЂ” show "You are handling" + "РџРµСЂРµРґР°С‚СЊ РР" + "РћСЃРІРѕР±РѕРґРёС‚СЊ"
  if (isAssignedToMe) {
    const handleReturnToBot = async () => {
      setIsLoading(true);
      try {
        try {
          await conversationsApi.releaseTakeover(conversation.id);
        } catch {
          // Ignore release error when resetting status
        }
        await conversationsApi.updateStatus(conversation.id, "BOT_ACTIVE");
        toast.success(t("inbox.takeover_returned_to_bot_toast"));
        onStatusChange?.("BOT_ACTIVE");
        onRefresh?.();
      } catch {
        toast.error(t("inbox.takeover_return_error"));
      } finally {
        setIsLoading(false);
      }
    };

    const handleRelease = async () => {
      setIsLoading(true);
      try {
        await conversationsApi.releaseTakeover(conversation.id);
        toast.success(t("inbox.takeover_released_toast"));
        onRefresh?.();
      } catch {
        toast.error(t("inbox.takeover_release_error"));
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700 select-none">
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{t("inbox.takeover_mine")}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          loading={isLoading}
          onClick={handleReturnToBot}
          leftIcon={<Bot className="w-3.5 h-3.5" />}
          className="text-xs h-8 text-primary border-primary/30 hover:bg-primary/10"
        >
          {t("inbox.handoff_return_bot")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          loading={isLoading}
          onClick={handleRelease}
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
          className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
          title={t("inbox.takeover_release_btn")}
        >
          {t("inbox.takeover_release_btn")}
        </Button>
      </div>
    );
  }

  // MANAGER_INTERCEPTED + unassigned вЂ” "Р’Р·СЏС‚СЊ РІ СЂР°Р±РѕС‚Сѓ" button
  const handleTakeover = async () => {
    setIsLoading(true);
    try {
      await conversationsApi.takeover(conversation.id);
      toast.success(t("inbox.takeover_success_toast"));
      onRefresh?.();
    } catch (err: unknown) {
      const errCode = (err as { data?: { code?: string } })?.data?.code;
      if (errCode === "conversations.taken_over_by_other") {
        toast.error(t("inbox.takeover_taken_toast"));
      } else {
        toast.error(t("inbox.takeover_error_toast"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      loading={isLoading}
      onClick={handleTakeover}
      leftIcon={<UserCheck className="w-3.5 h-3.5" />}
      className="text-xs border-amber-400/60 text-amber-600 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 h-8 font-semibold"
    >
      {t("inbox.takeover_btn")}
    </Button>
  );
}

