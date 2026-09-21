"use client";

import React from "react";
import { Trash2, Send, Mic } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface VoiceRecordingBarProps {
  durationSeconds: number;
  volumeLevel: number; // 0 to 1
  isUploading: boolean;
  onCancel: () => void;
  onSend: () => void;
}

export function VoiceRecordingBar({
  durationSeconds,
  volumeLevel,
  isUploading,
  onCancel,
  onSend,
}: VoiceRecordingBarProps) {
  const t = useTranslations("dashboard");

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Generate 12 equalizer bars with heights responsive to volumeLevel
  const bars = Array.from({ length: 12 }, (_, i) => {
    const baseHeight = 4;
    const factor = Math.sin((i / 12) * Math.PI) * volumeLevel;
    const height = Math.max(4, Math.round(baseHeight + factor * 18));
    return height;
  });

  return (
    <div className="flex items-center justify-between gap-3 w-full px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in fade-in duration-200">
      {/* Left: Pulsing Red Dot + Timer */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 transition-opacity" />
        <span className="font-mono text-xs font-bold text-rose-600 tabular-nums">
          {formatTime(durationSeconds)}
        </span>
      </div>

      {/* Middle: Sound Wave Meter */}
      <div className="flex items-center justify-center gap-1 flex-1 max-w-[140px] h-6 px-2">
        {bars.map((h, idx) => (
          <div
            key={idx}
            className="w-1 bg-rose-500/70 rounded-full transition-all duration-75"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Discard Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="p-1.5 rounded-xl hover:bg-rose-500/20 text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
          title={t("inbox.voice_cancel")}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Send Button */}
        <Button
          type="button"
          size="sm"
          onClick={onSend}
          loading={isUploading}
          leftIcon={<Send className="w-3.5 h-3.5" />}
          className="h-8 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
        >
          {t("inbox.voice_send")}
        </Button>
      </div>
    </div>
  );
}
