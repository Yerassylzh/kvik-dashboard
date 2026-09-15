"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { useToast } from "@/components/ui/toast/ToastContext";
import { useAuthStore } from "@/store/auth.store";
import { useDevMessagingSocket } from "@/hooks/useDevMessagingSocket";
import {
  provisionMockChannels,
  simulateInbound,
  resetConversation,
  getDevConversationMessages,
  getDevConversationBySender,
  type ChannelType,
  type MockChannel,
  type ConversationMessagesResponse,
  type DevMessage,
} from "@/lib/api/devMessaging";
import { isDevEnvironment } from "@/hooks/useDevMode";
import { DevChannelProvisioner } from "./DevChannelProvisioner";
import { DevSimulatorForm } from "./DevSimulatorForm";
import { DevChatInspector } from "./DevChatInspector";

export function DevMessagingPage() {
  const t = useTranslations("dashboard");
  const toast = useToast();
  const { user } = useAuthStore();

  // Provision state
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionedChannels, setProvisionedChannels] = useState<MockChannel[]>([]);

  // Simulation state
  const [channelType, setChannelType] = useState<ChannelType>("WHATSAPP");
  const [senderId, setSenderId] = useState("+77019998877");
  const [senderName, setSenderName] = useState("Айдар Сериков (Тест)");
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFetchingBySender, setIsFetchingBySender] = useState(false);

  // Chat & History state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationData, setConversationData] = useState<ConversationMessagesResponse | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Socket.IO realtime connection
  const handleSocketMessage = useCallback((convId: string, message: DevMessage) => {
    setConversationData((prev) => {
      if (!prev || prev.conversationId !== convId) return prev;
      if (prev.messages.some((m) => m.id === message.id)) return prev;
      return {
        ...prev,
        messages: [...prev.messages, message],
      };
    });
  }, []);

  const { isWaitingForBot, armBotWatcher } = useDevMessagingSocket({
    workspaceId: user?.workspace?.id,
    onMessage: handleSocketMessage,
  });

  // Hard guard for production
  if (!isDevEnvironment()) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">403 — Not available in production.</p>
      </div>
    );
  }

  const handleProvision = async () => {
    setIsProvisioning(true);
    try {
      const result = await provisionMockChannels();
      setProvisionedChannels(result.channels);
      toast.success(t("dev_messaging.provisioned_ok"), t("dev_messaging.provision_title"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to provision channels";
      toast.error(msg);
    } finally {
      setIsProvisioning(false);
    }
  };

  const fetchHistoryById = useCallback(async (convId: string, silent = false) => {
    if (!convId) return;
    if (!silent) setIsLoadingHistory(true);
    try {
      const data = await getDevConversationMessages(convId);
      setConversationData(data);
      setActiveConversationId(data.conversationId);
      return data;
    } catch (err: unknown) {
      if (!silent) {
        const msg = err instanceof Error ? err.message : "Failed to load conversation";
        toast.error(msg);
      }
      return null;
    } finally {
      if (!silent) setIsLoadingHistory(false);
    }
  }, [toast]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    try {
      const result = await simulateInbound({
        channelType,
        senderId: senderId.trim() || undefined,
        senderName: senderName.trim() || undefined,
        text: messageText.trim(),
      });

      toast.success(t("dev_messaging.sent_ok"), t("dev_messaging.simulator_title"));
      setMessageText("");

      if (result.conversationId) {
        setActiveConversationId(result.conversationId);
        await fetchHistoryById(result.conversationId);
        armBotWatcher(result.conversationId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to simulate inbound message";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleFetchBySender = async () => {
    if (!senderId.trim()) return;
    setIsFetchingBySender(true);
    try {
      const data = await getDevConversationBySender({
        channelType,
        senderId: senderId.trim(),
      });
      setConversationData(data);
      setActiveConversationId(data.conversationId);
      toast.success(t("dev_messaging.history_title"), `Найдено ${data.messages.length} сообщений`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Диалог не найден";
      toast.error(msg);
    } finally {
      setIsFetchingBySender(false);
    }
  };

  const handleReset = async (convId: string) => {
    if (!convId) return;
    setIsResetting(true);
    try {
      await resetConversation(convId);
      toast.success(t("dev_messaging.reset_ok"), t("dev_messaging.reset_title"));
      await fetchHistoryById(convId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset conversation";
      toast.error(msg);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <FadeIn direction="up" distance={20} duration={0.25} className="space-y-6">
      <PageHeader
        title={t("dev_messaging.title")}
        description={t("dev_messaging.desc")}
      />

      {/* Dev warning banner */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          {t("dev_messaging.warning_banner")}
        </p>
      </div>

      {/* Section 1: Provision Mock Channels */}
      <DevChannelProvisioner
        provisionedChannels={provisionedChannels}
        isProvisioning={isProvisioning}
        onProvision={handleProvision}
      />

      {/* Section 2: Simulator Form & Live Chat Inspector (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Simulator controls */}
        <div className="lg:col-span-5 space-y-6">
          <DevSimulatorForm
            channelType={channelType}
            onChannelChange={setChannelType}
            senderId={senderId}
            onSenderIdChange={setSenderId}
            senderName={senderName}
            onSenderNameChange={setSenderName}
            messageText={messageText}
            onMessageTextChange={setMessageText}
            onSimulate={handleSimulate}
            onFetchBySender={handleFetchBySender}
            isSending={isSending}
            isFetchingBySender={isFetchingBySender}
          />

          {/* Dev Tip */}
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground p-3.5 rounded-xl bg-muted/30 border border-border/40">
            <FlaskConical className="w-4 h-4 mt-0.5 shrink-0 text-accent-ai" />
            <span className="leading-relaxed">
              Отправленные сообщения поступают в пайплайн ИИ. Ответ бота отображается в блоке справа или на странице{" "}
              <strong className="text-foreground">Диалоги</strong> в реальном времени.
            </span>
          </div>
        </div>

        {/* Right column: Live Chat Inspector & History */}
        <div className="lg:col-span-7">
          <DevChatInspector
            conversationData={conversationData}
            isLoading={isLoadingHistory}
            isWaitingForBot={isWaitingForBot}
            onRefresh={() => {
              if (activeConversationId) {
                fetchHistoryById(activeConversationId);
              } else if (senderId.trim()) {
                handleFetchBySender();
              }
            }}
            onResetConversation={handleReset}
            onLookupConversation={fetchHistoryById}
            isResetting={isResetting}
          />
        </div>
      </div>
    </FadeIn>
  );
}
