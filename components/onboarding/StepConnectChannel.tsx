"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChannelStepper } from "./channel/ChannelStepper";
import { StageWhatsApp } from "./channel/StageWhatsApp";
import { StageInstagram } from "./channel/StageInstagram";
import { StageTelegram } from "./channel/StageTelegram";
import { StageChannelSummary } from "./channel/StageChannelSummary";
import { listChannels, disconnectChannel } from "@/lib/api/channels";
import {
  ChannelType,
  ChannelStatus,
  WhatsAppChannelMetadata,
  InstagramChannelMetadata,
  TelegramChannelMetadata,
} from "@/types/channels";

interface ConnectedChannel {
  status: ChannelStatus;
  detail?: string;
}

interface StepConnectChannelProps {
  /** Called when user clicks "Continue" to advance the onboarding state */
  onContinue: () => void;
  continueLoading: boolean;
}

export function StepConnectChannel({
  onContinue,
  continueLoading,
}: StepConnectChannelProps) {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const prevStageRef = useRef<number>(0);

  const [channels, setChannels] = useState<
    Partial<Record<ChannelType, ConnectedChannel>>
  >({});
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [disconnecting, setDisconnecting] = useState<ChannelType | null>(null);

  // ---------------------------------------------------------------------------
  // Load existing channel statuses on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listChannels();
        if (cancelled) return;
        const map: Partial<Record<ChannelType, ConnectedChannel>> = {};
        for (const ch of res.channels) {
          map[ch.type] = {
            status: ch.status,
            detail: resolveDetail(ch.type, ch.metadata),
          };
        }
        setChannels(map);

        // If WhatsApp is already connected/confirmed, show next channel by default
        if (map.WHATSAPP?.status === "CONNECTED") {
          if (map.INSTAGRAM?.status !== "CONNECTED") {
            setActiveStage(1);
            prevStageRef.current = 1;
          } else if (map.TELEGRAM?.status !== "CONNECTED") {
            setActiveStage(2);
            prevStageRef.current = 2;
          } else {
            setActiveStage(3);
            prevStageRef.current = 3;
          }
        }
      } catch {
        // Non-fatal — proceed with empty statuses
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const resolveDetail = (
    type: ChannelType,
    metadata: unknown
  ): string | undefined => {
    if (!metadata || typeof metadata !== "object") return undefined;
    const m = metadata as Record<string, unknown>;
    if (type === "WHATSAPP") {
      return (m as unknown as WhatsAppChannelMetadata).displayPhoneNumber ?? undefined;
    }
    if (type === "INSTAGRAM") {
      const ig = m as unknown as InstagramChannelMetadata;
      if (ig.igUsername) return `@${ig.igUsername.replace(/^@/, '')}`;
      return ig.name || ig.pageName || undefined;
    }
    if (type === "TELEGRAM") {
      const tg = m as unknown as TelegramChannelMetadata;
      return tg.botUsername ? `@${tg.botUsername}` : undefined;
    }
    return undefined;
  };

  const handleSelectStage = useCallback((targetStage: number) => {
    setDirection(targetStage >= prevStageRef.current ? 1 : -1);
    prevStageRef.current = targetStage;
    setActiveStage(targetStage);
  }, []);

  const markConnected = useCallback(
    (type: ChannelType, detail?: string) => {
      setChannels((prev) => ({
        ...prev,
        [type]: { status: "CONNECTED" as ChannelStatus, detail },
      }));
    },
    []
  );

  const handleDisconnect = async (type: ChannelType) => {
    try {
      setDisconnecting(type);
      await disconnectChannel(type);
      setChannels((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
    } catch {
      // Handled globally
    } finally {
      setDisconnecting(null);
    }
  };

  const isWhatsAppConnected = channels.WHATSAPP?.status === "CONNECTED";
  const isInstagramConnected = channels.INSTAGRAM?.status === "CONNECTED";
  const isTelegramConnected = channels.TELEGRAM?.status === "CONNECTED";

  const connectedCount = Object.values(channels).filter(
    (c) => c?.status === "CONNECTED"
  ).length;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -30 : 30,
      opacity: 0,
    }),
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loadingStatus) {
    return (
      <div className="space-y-6">
        <div className="h-14 rounded-2xl bg-card border border-border animate-pulse" />
        <div className="h-72 rounded-2xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-step Navigation Bar */}
      <ChannelStepper
        activeStage={activeStage}
        onSelectStage={handleSelectStage}
        isWhatsAppConnected={isWhatsAppConnected}
        isInstagramConnected={isInstagramConnected}
        isTelegramConnected={isTelegramConnected}
        connectedCount={connectedCount}
      />

      {/* Step Card Container */}
      <div className="p-5 sm:p-7 rounded-3xl bg-card border border-border shadow-xs overflow-visible">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeStage}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            {activeStage === 0 && (
              <StageWhatsApp
                isConnected={isWhatsAppConnected}
                connectedDetail={channels.WHATSAPP?.detail}
                onSuccess={(meta) => {
                  markConnected("WHATSAPP", meta.displayPhoneNumber);
                }}
                onDisconnect={() => handleDisconnect("WHATSAPP")}
                disconnecting={disconnecting === "WHATSAPP"}
                onNext={() => handleSelectStage(1)}
                onSkip={() => handleSelectStage(1)}
              />
            )}

            {activeStage === 1 && (
              <StageInstagram
                isConnected={isInstagramConnected}
                connectedDetail={channels.INSTAGRAM?.detail}
                onSuccess={(meta) => {
                  markConnected(
                    "INSTAGRAM",
                    meta.igUsername ? `@${meta.igUsername}` : undefined
                  );
                }}
                onDisconnect={() => handleDisconnect("INSTAGRAM")}
                disconnecting={disconnecting === "INSTAGRAM"}
                onNext={() => handleSelectStage(2)}
                onBack={() => handleSelectStage(0)}
                onSkip={() => handleSelectStage(2)}
              />
            )}

            {activeStage === 2 && (
              <StageTelegram
                isConnected={isTelegramConnected}
                connectedDetail={channels.TELEGRAM?.detail}
                onSuccess={(meta) => {
                  markConnected(
                    "TELEGRAM",
                    meta.botUsername ? `@${meta.botUsername}` : undefined
                  );
                }}
                onDisconnect={() => handleDisconnect("TELEGRAM")}
                disconnecting={disconnecting === "TELEGRAM"}
                onNext={() => handleSelectStage(3)}
                onBack={() => handleSelectStage(1)}
                onSkip={() => handleSelectStage(3)}
              />
            )}

            {activeStage === 3 && (
              <StageChannelSummary
                channels={channels}
                onSelectStage={handleSelectStage}
                onContinue={onContinue}
                continueLoading={continueLoading}
                onDisconnect={handleDisconnect}
                disconnecting={disconnecting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
