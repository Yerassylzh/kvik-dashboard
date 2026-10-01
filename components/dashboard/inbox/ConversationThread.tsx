"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { MessageSquare, FileImage, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { TakeoverControl } from "./TakeoverControl";
import { MessageBubble } from "./MessageBubble";
import { ManagerComposer } from "./ManagerComposer";
import { FollowUpThreadBanner } from "./FollowUpThreadBanner";
import { EscalationHistoryPanel } from "./EscalationHistoryPanel";
import { ManagerActiveBanner } from "./ManagerActiveBanner";
import { TypingIndicator } from "./TypingIndicator";
import { MediaGallerySheet } from "./gallery/MediaGallerySheet";
import { LeadDetail } from "@/components/dashboard/leads/LeadDetail";
import { useConversationMessages } from "@/hooks/useConversations";
import { useTypingIndicator } from "@/store/typing.store";
import { useActorId } from "@/hooks/useActorId";
import {
  conversationsApi,
  type ConversationDto,
  type ConversationStatus,
} from "@/lib/api/conversations";

interface ConversationThreadProps {
  conversation?: ConversationDto;
  onStatusChange?: (status: ConversationStatus) => void;
  /** Invalidates the conversations list SWR — needed after takeover to refresh takenOverByActorId */
  onRefreshConversations?: () => void;
}

/** Ghost bubble skeleton shown while messages are loading */
function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 animate-pulse">
      {/* Bot message — left */}
      <div className="flex items-end gap-2.5 max-w-[70%]">
        <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-10 w-52 rounded-2xl bg-muted" />
        </div>
      </div>
      {/* User message — right */}
      <div className="flex items-end gap-2.5 max-w-[60%] ml-auto flex-row-reverse">
        <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-12 rounded bg-muted ml-auto" />
          <div className="h-10 w-44 rounded-2xl bg-muted" />
        </div>
      </div>
      {/* Bot message — left, longer */}
      <div className="flex items-end gap-2.5 max-w-[75%]">
        <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-16 w-64 rounded-2xl bg-muted" />
        </div>
      </div>
      {/* User message — right, short */}
      <div className="flex items-end gap-2.5 max-w-[40%] ml-auto flex-row-reverse">
        <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-12 rounded bg-muted ml-auto" />
          <div className="h-8 w-32 rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function ConversationThread({
  conversation,
  onStatusChange,
  onRefreshConversations,
}: ConversationThreadProps) {
  const t = useTranslations("dashboard");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPinnedToBottom = useRef(true);

  const myActorId = useActorId();
  const [isOptimisticTaken, setIsOptimisticTaken] = useState(false);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);

  const typingStatus = useTypingIndicator(conversation?.id);

  useEffect(() => {
    queueMicrotask(() => {
      setIsOptimisticTaken(false);
    });
  }, [conversation?.id]);

  useEffect(() => {
    if (conversation?.status === "BOT_ACTIVE" || conversation?.takenOverByActorId === null) {
      queueMicrotask(() => {
        setIsOptimisticTaken(false);
      });
    }
  }, [conversation?.status, conversation?.takenOverByActorId]);

  const { messages, isLoading, sendMessage, updateStatus, refresh } = useConversationMessages(
    conversation?.id || null
  );

  /**
   * Multimodal AI engine supports visual & document processing.
   * Managers can safely return dialogues with media back to AI.
   */
  const canHandOffToAi = true;

  /** Track whether the user is scrolled close enough to the bottom */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isPinnedToBottom.current = distanceFromBottom < 100;
  }, []);

  /** On conversation switch: reset position to top immediately, scroll to bottom after messages load */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    isPinnedToBottom.current = true;
  }, [conversation?.id]);

  /** Scroll to bottom only when pinned */
  useEffect(() => {
    if (isPinnedToBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingStatus?.isTyping]);

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
        <MessageSquare className="w-12 h-12 mb-3 opacity-30 text-primary" />
        <p className="text-sm font-medium">{t("inbox.empty_thread")}</p>
      </div>
    );
  }

  const handleStatusToggle = (newStatus: ConversationStatus) => {
    updateStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const handleTakeover = async () => {
    if (!conversation) return;
    try {
      if (conversation.status === "BOT_ACTIVE") {
        await conversationsApi.updateStatus(conversation.id, "MANAGER_INTERCEPTED");
      }
      await conversationsApi.takeover(conversation.id);
      setIsOptimisticTaken(true);
      toast.success(t("inbox.takeover_success_toast"));
      handleStatusToggle("MANAGER_INTERCEPTED");
      // Refresh both messages and the conversations list (to update takenOverByActorId)
      refresh();
      onRefreshConversations?.();
    } catch {
      setIsOptimisticTaken(false);
      toast.error(t("inbox.takeover_error_toast"));
    }
  };

  const leadName = conversation.lead?.name || t("inbox.role_user");
  const isEscalated =
    conversation.status === "MANAGER_INTERCEPTED" || isOptimisticTaken;
  const isAssignedToMe =
    isOptimisticTaken ||
    (Boolean(myActorId) && conversation.takenOverByActorId === myActorId);

  return (
    <>
      <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        {/* Thread Header — solid, clean SaaS surface */}
        <div className="flex items-center justify-between p-3.5 px-4 border-b border-border/60 bg-card">
          <div
            className={`flex items-center gap-3 min-w-0 ${
              conversation.lead?.id ? "cursor-pointer group" : ""
            }`}
            onClick={() => {
              if (conversation.lead?.id) setIsLeadDetailOpen(true);
            }}
          >
            <EntityAvatar name={leadName} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {leadName}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {conversation.lead?.phone && (
                  <span className="font-mono tabular-nums">{conversation.lead.phone}</span>
                )}
                {conversation.channelType && (
                  <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-medium">
                    {conversation.channelType}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lead CRM Profile Trigger */}
            {conversation.lead?.id && (
              <button
                type="button"
                onClick={() => setIsLeadDetailOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border/70 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={t("inbox.lead_profile_btn")}
              >
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">{t("inbox.lead_profile_btn")}</span>
              </button>
            )}

            {/* Media Gallery Trigger */}
            <MediaGallerySheet
              conversationId={conversation.id}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border/70 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={t("inbox.media_gallery_title")}
                >
                  <FileImage className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden sm:inline">{t("inbox.media_gallery_btn")}</span>
                </button>
              }
            />

            {/* Takeover Control */}
            <TakeoverControl
              conversation={conversation}
              canReturnToBot={canHandOffToAi}
              onStatusChange={handleStatusToggle}
              onRefresh={() => {
                refresh();
                onRefreshConversations?.();
              }}
              onTakeoverSuccess={() => setIsOptimisticTaken(true)}
              onReleaseSuccess={() => setIsOptimisticTaken(false)}
            />
          </div>
        </div>

        {/* Manager Active & AI Paused Banner */}
        {isEscalated && (
          <ManagerActiveBanner
            conversationId={conversation.id}
            isAssignedToMe={isAssignedToMe}
            assigneeName={conversation.assignedStaff?.name}
            onReturnToBot={() => {
              setIsOptimisticTaken(false);
              handleStatusToggle("BOT_ACTIVE");
              refresh();
              onRefreshConversations?.();
            }}
          />
        )}

        {/* Escalation history panel — only shows for MANAGER_INTERCEPTED */}
        {isEscalated && (
          <EscalationHistoryPanel conversationId={conversation.id} />
        )}

        {/* Pending Follow-up Active Banner */}
        <FollowUpThreadBanner
          conversationId={conversation.id}
          pendingFollowUp={conversation.pendingFollowUp}
        />

        {/* Messages Stream */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto themed-scroll p-4 space-y-2"
        >
          {isLoading ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-xs text-muted-foreground">
              {t("inbox.empty_messages")}
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}

          {/* Real-time typing animation bubble */}
          {typingStatus?.isTyping && (
            <TypingIndicator role={typingStatus.role} />
          )}
        </div>

        {/* Composer */}
        <ManagerComposer
          onSendMessage={sendMessage}
          conversationId={conversation.id}
          takenOverByActorId={
            isOptimisticTaken
              ? (myActorId ?? conversation.takenOverByActorId)
              : conversation.takenOverByActorId
          }
          status={isOptimisticTaken ? "MANAGER_INTERCEPTED" : conversation.status}
          onTakeover={handleTakeover}
          assignedStaff={conversation.assignedStaff}
        />
      </div>

      {/* Lead CRM Modal / Drawer */}
      {conversation.lead?.id && (
        <LeadDetail
          leadId={conversation.lead.id}
          isOpen={isLeadDetailOpen}
          onClose={() => setIsLeadDetailOpen(false)}
          onStatusChange={() => {
            refresh();
            onRefreshConversations?.();
          }}
          onArchive={() => {
            setIsLeadDetailOpen(false);
            onRefreshConversations?.();
          }}
        />
      )}
    </>
  );
}
