"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  ShieldCheck,
  Lock,
  Bot,
  UserCheck,
  AlertTriangle,
  Mic,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useInboxStore } from "@/store/inbox.store";
import { useActorId } from "@/hooks/useActorId";
import {
  conversationsApi,
  type ConversationStatus,
  type SendManagerMessageDto,
  type MediaType,
} from "@/lib/api/conversations";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { VoiceRecordingBar } from "./composer/VoiceRecordingBar";
import { AttachmentPicker } from "./composer/AttachmentPicker";
import { PendingMediaPreview } from "./composer/PendingMediaPreview";

interface ManagerComposerProps {
  onSendMessage: (payload: string | SendManagerMessageDto) => Promise<unknown>;
  disabled?: boolean;
  conversationId?: string;
  takenOverByActorId?: string | null;
  status?: ConversationStatus;
  onTakeover?: () => Promise<void>;
  assignedStaff?: { id: string; name: string; role: string } | null;
}

export function ManagerComposer({
  onSendMessage,
  disabled,
  conversationId,
  takenOverByActorId,
  status = "BOT_ACTIVE",
  onTakeover,
  assignedStaff: _assignedStaff,
}: ManagerComposerProps) {
  const t = useTranslations("dashboard");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  // Optimistic: immediately show input after takeover without waiting for SWR revalidation
  const [isOptimisticOwner, setIsOptimisticOwner] = useState(false);
  const [stagedMedia, setStagedMedia] = useState<{
    file: File;
    mediaType: MediaType;
  } | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const user = useAuthStore((s) => s.user);
  // Mirror backend: actorId = user.staffMemberId ?? user.sub (decoded from JWT)
  const myActorId = useActorId();
  const { takenConversationIds } = useInboxStore();

  const {
    isRecording,
    durationSeconds,
    volumeLevel,
    error: micError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  useEffect(() => {
    if (micError) {
      if (micError === "voice_mic_denied") {
        toast.error(t("inbox.voice_mic_denied"));
      } else {
        toast.error(t("inbox.voice_mic_unsupported"));
      }
    }
  }, [micError, t]);

  useEffect(() => {
    setIsOptimisticOwner(false);
    setIsLockedByOther(false);
  }, [conversationId]);

  const senderLabel = user?.staffProfile?.name
    ? `${user.staffProfile.name}${user.staffProfile.role ? ` (${user.staffProfile.role})` : ""}`
    : t("inbox.sender_manager");

  const isAssignedToMe = isOptimisticOwner || (!!myActorId && takenOverByActorId === myActorId);
  const isLockedExternally =
    !isAssignedToMe &&
    (Boolean(takenOverByActorId) ||
      Boolean(conversationId && takenConversationIds.has(conversationId)));

  const handleTakeoverClick = async () => {
    if (!onTakeover || isTakingOver) return;
    setIsTakingOver(true);
    try {
      await onTakeover();
      // Optimistically unlock the composer without waiting for SWR revalidation
      setIsOptimisticOwner(true);
      setIsLockedByOther(false);
    } finally {
      setIsTakingOver(false);
    }
  };

  // 1. Closed conversation
  if (status === "CLOSED") {
    return (
      <div className="p-3.5 border-t border-border/60 bg-muted/30 backdrop-blur-sm text-center">
        <p className="text-xs text-muted-foreground">{t("inbox.status_closed")}</p>
      </div>
    );
  }

  // 2. Bot active — block input and offer takeover
  if (status === "BOT_ACTIVE") {
    return (
      <div className="p-3 border-t border-border/60 bg-muted/30 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {t("inbox.composer_bot_active_title")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("inbox.composer_bot_active_desc")}
              </p>
            </div>
          </div>

          {onTakeover && (
            <Button
              size="sm"
              loading={isTakingOver}
              onClick={handleTakeoverClick}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              className="text-xs shrink-0 font-semibold"
            >
              {t("inbox.handoff_takeover")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 3. Locked by another specialist
  if (!isAssignedToMe && (isLockedExternally || isLockedByOther)) {
    return (
      <div className="p-3 border-t border-border/60 bg-muted/40 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
          <Lock className="w-4 h-4 shrink-0 text-slate-500" />
          <p className="text-xs font-medium">{t("inbox.composer_locked_by_other")}</p>
        </div>
      </div>
    );
  }

  // 4. Escalated, but unassigned to current user
  if (!isAssignedToMe) {
    return (
      <div className="p-3 border-t border-border/60 bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card border border-border border-l-4 border-l-amber-400 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {t("inbox.composer_unassigned_title")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("inbox.composer_unassigned_desc")}
              </p>
            </div>
          </div>

          {onTakeover && (
            <Button
              size="sm"
              loading={isTakingOver}
              onClick={handleTakeoverClick}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              className="text-xs shrink-0 border-amber-400 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              {t("inbox.takeover_btn")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 5. Assigned to current user — input is fully unlocked!
  const isBusy = isSending || isUploadingMedia || disabled;
  const canSend = (content.trim().length > 0 || !!stagedMedia) && !isBusy;

  const handleSendVoice = async () => {
    if (!conversationId || isBusy) return;
    setIsUploadingMedia(true);

    try {
      const { blob, duration } = await stopRecording();
      if (!blob || blob.size === 0) {
        setIsUploadingMedia(false);
        return;
      }

      // 1. Upload audio recording to Cloudflare R2 / local storage
      const uploadRes = await conversationsApi.uploadMedia(
        conversationId,
        blob,
        "AUDIO",
        duration
      );

      // 2. Send outbound manager message
      await onSendMessage({
        mediaUrl: uploadRes.mediaUrl,
        mediaType: "AUDIO",
        durationSeconds: duration,
        fileName: uploadRes.fileName,
        mimeType: uploadRes.mimeType,
        fileSize: uploadRes.fileSize,
      });

      setIsLockedByOther(false);
    } catch (err: unknown) {
      const errCode = (err as { data?: { code?: string } })?.data?.code;
      if (errCode === "conversations.taken_over_by_other") {
        setIsLockedByOther(true);
      } else {
        toast.error(t("inbox.outbound_media_failed" as any) || "Failed to send voice note");
      }
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSend = async () => {
    if (!canSend || !conversationId) return;

    const textToSend = content.trim();
    const mediaToUpload = stagedMedia;

    setIsSending(true);

    try {
      if (mediaToUpload) {
        setIsUploadingMedia(true);
        // Upload staged media attachment
        const uploadRes = await conversationsApi.uploadMedia(
          conversationId,
          mediaToUpload.file,
          mediaToUpload.mediaType
        );

        // Send message with media payload and optional caption
        await onSendMessage({
          content: textToSend || undefined,
          mediaUrl: uploadRes.mediaUrl,
          mediaType: mediaToUpload.mediaType,
          fileName: uploadRes.fileName,
          mimeType: uploadRes.mimeType,
          fileSize: uploadRes.fileSize,
        });

        setStagedMedia(null);
      } else {
        // Send regular text message
        await onSendMessage(textToSend);
      }

      setContent("");
      setIsLockedByOther(false);
    } catch (err: unknown) {
      const errCode = (err as { data?: { code?: string } })?.data?.code;
      if (errCode === "conversations.taken_over_by_other") {
        setIsLockedByOther(true);
      } else {
        setContent(textToSend);
      }
    } finally {
      setIsSending(false);
      setIsUploadingMedia(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 border-t border-border/60 bg-card/80 backdrop-blur-sm space-y-2">
      {/* Active Responder Identity Badge */}
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold px-1">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
        <span>
          {t("inbox.sender_prefix")} {senderLabel}
        </span>
      </div>

      {/* Staged Media Attachment Preview */}
      {stagedMedia && (
        <PendingMediaPreview
          file={stagedMedia.file}
          mediaType={stagedMedia.mediaType}
          isUploading={isUploadingMedia}
          onRemove={() => setStagedMedia(null)}
        />
      )}

      {/* Input Bar or Voice Recording Bar */}
      {isRecording ? (
        <VoiceRecordingBar
          durationSeconds={durationSeconds}
          volumeLevel={volumeLevel}
          isUploading={isUploadingMedia}
          onCancel={cancelRecording}
          onSend={handleSendVoice}
        />
      ) : (
        <div className="flex items-end gap-1.5 bg-muted/40 border border-border/60 rounded-2xl p-1.5 focus-within:border-primary/60 transition-colors">
          {/* Attachment Paperclip Picker */}
          <AttachmentPicker
            disabled={isBusy}
            onFileSelected={(file, mediaType) => setStagedMedia({ file, mediaType })}
          />

          {/* Text / Caption Area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              stagedMedia
                ? t("inbox.caption_placeholder")
                : t("inbox.composer_placeholder")
            }
            rows={1}
            disabled={isBusy}
            className="flex-1 bg-transparent resize-none px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32 min-h-[38px]"
          />

          {/* Voice Record Mic Trigger */}
          <button
            type="button"
            disabled={isBusy || !!stagedMedia}
            onClick={() => startRecording()}
            className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted/70 transition-colors disabled:opacity-40 cursor-pointer"
            title={t("inbox.voice_recording")}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <Button
            type="button"
            size="sm"
            onClick={handleSend}
            loading={isSending || isUploadingMedia}
            disabled={!canSend}
            rightIcon={<Send className="w-3.5 h-3.5" />}
            className="rounded-xl shrink-0 h-9 px-3.5 font-semibold"
          >
            {t("inbox.send_btn")}
          </Button>
        </div>
      )}
    </div>
  );
}
