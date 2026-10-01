"use client";

import React, { useState } from "react";
import { Bot, UserCheck, Lock, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { conversationsApi } from "@/lib/api/conversations";
import { useInboxStore } from "@/store/inbox.store";
import { useActorId } from "@/hooks/useActorId";
import { useRBAC } from "@/hooks/useRBAC";
import type { ConversationDto, ConversationStatus } from "@/lib/api/conversations";

interface TakeoverControlProps {
  conversation: ConversationDto;
  /**
   * Whether the conversation can be handed back to AI at all.
   * `false` disables the "Передать ИИ" button (e.g. the thread contains
   * attachments the bot cannot process when it resumes).
   * Defaults to `true` when omitted.
   */
  canReturnToBot?: boolean;
  onStatusChange?: (status: ConversationStatus) => void;
  onRefresh?: () => void;
  onTakeoverSuccess?: () => void;
  onReleaseSuccess?: () => void;
}

export function TakeoverControl({
  conversation,
  canReturnToBot = true,
  onStatusChange,
  onRefresh,
  onTakeoverSuccess,
  onReleaseSuccess,
}: TakeoverControlProps) {
  const t = useTranslations("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimisticOwner, setIsOptimisticOwner] = useState(false);

  React.useEffect(() => {
    queueMicrotask(() => {
      setIsOptimisticOwner(false);
    });
  }, [conversation.id]);

  React.useEffect(() => {
    if (conversation.status === "BOT_ACTIVE" || conversation.takenOverByActorId === null) {
      queueMicrotask(() => {
        setIsOptimisticOwner(false);
      });
    }
  }, [conversation.status, conversation.takenOverByActorId]);

  const { takenConversationIds } = useInboxStore();
  // Mirror backend exactly: actorId = user.staffMemberId ?? user.sub
  // Decoded from JWT so the owner (no staffMemberId in JWT) resolves to userId,
  // while staff members resolve to their staffMemberId — matching what DB stores.
  const myActorId = useActorId();
  const { systemRole } = useRBAC();

  const { status, takenOverByActorId } = conversation;
  /** OWNER and ADMIN_MANAGER can see who holds the lock for accountability */
  const canSeeAssigneeName = systemRole === "OWNER" || systemRole === "ADMIN_MANAGER";

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
        setIsOptimisticOwner(true);
        onTakeoverSuccess?.();
        toast.success(t("inbox.takeover_success_toast"));
        onStatusChange?.("MANAGER_INTERCEPTED");
        onRefresh?.();
      } catch {
        setIsOptimisticOwner(false);
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

  // MANAGER_INTERCEPTED — determine who owns it
  const isAssignedToMe = isOptimisticOwner || (!!myActorId && takenOverByActorId === myActorId);
  const isTakenByOther =
    !isAssignedToMe &&
    (Boolean(takenOverByActorId) || takenConversationIds?.has(conversation.id));

  // Taken by someone else — disabled chip
  // OWNER/ADMIN_MANAGER can see the assignee name for accountability
  if (isTakenByOther) {
    const assigneeName = canSeeAssigneeName ? conversation.assignedStaff?.name : null;
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-muted border-border/60 text-muted-foreground select-none">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        <span>
          {assigneeName
            ? `${t("inbox.takeover_locked_by")}: ${assigneeName}`
            : t("inbox.takeover_locked")}
        </span>
      </div>
    );
  }

  // Assigned to current user — show "You are handling" + "Передать ИИ" + "Освободить"
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
        setIsOptimisticOwner(false);
        onReleaseSuccess?.();
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
        setIsOptimisticOwner(false);
        onReleaseSuccess?.();
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
          disabled={!canReturnToBot}
          onClick={handleReturnToBot}
          leftIcon={<Bot className="w-3.5 h-3.5" />}
          title={!canReturnToBot ? t("inbox.handoff_media_blocked") : undefined}
          className="text-xs h-8 text-primary border-primary/30 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
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

  // MANAGER_INTERCEPTED + unassigned — "Взять в работу" button
  const handleTakeover = async () => {
    setIsLoading(true);
    try {
      await conversationsApi.takeover(conversation.id);
      setIsOptimisticOwner(true);
      onTakeoverSuccess?.();
      toast.success(t("inbox.takeover_success_toast"));
      onRefresh?.();
    } catch (err: unknown) {
      setIsOptimisticOwner(false);
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
