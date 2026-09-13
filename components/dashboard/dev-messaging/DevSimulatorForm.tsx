"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Send, Search, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChannelType } from "@/lib/api/devMessaging";

const CHANNELS: ChannelType[] = ["WHATSAPP", "INSTAGRAM", "TELEGRAM"];

const CHANNEL_COLORS: Record<ChannelType, string> = {
  WHATSAPP: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  INSTAGRAM: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
  TELEGRAM: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
};

interface DevSimulatorFormProps {
  channelType: ChannelType;
  onChannelChange: (ch: ChannelType) => void;
  senderId: string;
  onSenderIdChange: (val: string) => void;
  senderName: string;
  onSenderNameChange: (val: string) => void;
  messageText: string;
  onMessageTextChange: (val: string) => void;
  onSimulate: (e: React.FormEvent) => void;
  onFetchBySender: () => void;
  isSending: boolean;
  isFetchingBySender: boolean;
}

export function DevSimulatorForm({
  channelType,
  onChannelChange,
  senderId,
  onSenderIdChange,
  senderName,
  onSenderNameChange,
  messageText,
  onMessageTextChange,
  onSimulate,
  onFetchBySender,
  isSending,
  isFetchingBySender,
}: DevSimulatorFormProps) {
  const t = useTranslations("dashboard");

  const templates = [
    {
      label: "Запись на прием",
      text: t("dev_messaging.tpl_booking"),
    },
    {
      label: "Цены и скидки",
      text: t("dev_messaging.tpl_pricing"),
    },
    {
      label: "Перенос записи",
      text: t("dev_messaging.tpl_reschedule"),
    },
    {
      label: "Адрес и парковка",
      text: t("dev_messaging.tpl_location"),
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (messageText.trim() && !isSending) {
        onSimulate(e);
      }
    }
  };

  return (
    <SectionCard
      title={t("dev_messaging.simulator_title")}
      description={t("dev_messaging.simulator_desc")}
      action={
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onFetchBySender}
          disabled={isFetchingBySender || !senderId.trim()}
          className="gap-1.5 text-xs h-8"
          title="Загрузить историю для текущего канала и отправителя"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{isFetchingBySender ? t("common.loading") : t("dev_messaging.find_by_sender_btn")}</span>
        </Button>
      }
    >
      <form onSubmit={onSimulate} className="space-y-4">
        {/* Channel selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("dev_messaging.channel_label")}
          </label>
          <div className="flex gap-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => onChannelChange(ch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  channelType === ch
                    ? CHANNEL_COLORS[ch]
                    : "bg-card border-border/40 text-muted-foreground hover:border-border"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Sender details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("dev_messaging.sender_id_label")}
            </label>
            <Input
              type="text"
              value={senderId}
              onChange={(e) => onSenderIdChange(e.target.value)}
              placeholder={t("dev_messaging.sender_id_placeholder")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("dev_messaging.sender_name_label")}
            </label>
            <Input
              type="text"
              value={senderName}
              onChange={(e) => onSenderNameChange(e.target.value)}
              placeholder={t("dev_messaging.sender_name_placeholder")}
            />
          </div>
        </div>

        {/* Quick prompt templates */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-accent-ai" />
            <span className="font-semibold">{t("dev_messaging.templates_label")}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onMessageTextChange(tpl.text)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer text-left truncate max-w-full"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("dev_messaging.message_label")}
          </label>
          <textarea
            required
            rows={3}
            value={messageText}
            onChange={(e) => onMessageTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("dev_messaging.message_placeholder")}
            className="w-full bg-card border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground">
            Нажмите <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] border border-border">Enter</kbd> для отправки
          </p>

          <Button
            type="submit"
            size="sm"
            disabled={isSending || !messageText.trim()}
            loading={isSending}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            className="shrink-0 text-xs"
          >
            {isSending ? t("dev_messaging.sending") : t("dev_messaging.send_btn")}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
