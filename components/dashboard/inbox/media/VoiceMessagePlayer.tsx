"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, ChevronDown, Volume2, AlertCircle, ArrowDownToLine } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { downloadFile } from "@/lib/utils/fileDownload";
import { useMediaObjectSrc } from "@/hooks/useMediaObjectSrc";

// Global audio coordinator ensuring only one voice note plays at a time
let activeAudio: HTMLAudioElement | null = null;
let stopActiveAudioCallback: (() => void) | null = null;

interface VoiceMessagePlayerProps {
  mediaUrl: string;
  durationSeconds?: number | null;
  transcription?: string | null;
  detectedLanguage?: string | null;
  transcriptionConfidence?: number | null;
  transcriptionError?: string | null;
  isUserMessage?: boolean;
}

export function VoiceMessagePlayer({
  mediaUrl,
  durationSeconds,
  transcription,
  detectedLanguage,
  transcriptionConfidence,
  transcriptionError,
  isUserMessage = false,
}: VoiceMessagePlayerProps) {
  const t = useTranslations("dashboard");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { src, loading } = useMediaObjectSrc(mediaUrl);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Format seconds into mm:ss
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current || hasError || loading) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (activeAudio === audioRef.current) {
        activeAudio = null;
        stopActiveAudioCallback = null;
      }
    } else {
      // Pause any existing active audio player
      if (activeAudio && activeAudio !== audioRef.current && stopActiveAudioCallback) {
        stopActiveAudioCallback();
      }

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          activeAudio = audioRef.current;
          stopActiveAudioCallback = stopPlayback;
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && (!duration || isNaN(duration))) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (activeAudio === audioRef.current) {
      activeAudio = null;
      stopActiveAudioCallback = null;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  useEffect(() => {
    return () => {
      if (activeAudio === audioRef.current) {
        activeAudio = null;
        stopActiveAudioCallback = null;
      }
    };
  }, []);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const langTag = (detectedLanguage || "ru").toUpperCase();
  const confidencePercent = transcriptionConfidence
    ? Math.round(transcriptionConfidence * 100)
    : null;

  return (
    <div className="w-full min-w-[240px] max-w-[340px] space-y-2 py-0.5">
      {/* Hidden native HTML5 Audio */}
      <audio
        ref={audioRef}
        src={src || undefined}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setHasError(true)}
      />

      {/* Main Player Row */}
      <div className="flex items-center gap-2.5">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={hasError || loading}
          className={clsx(
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs",
            isUserMessage
              ? "bg-white text-primary hover:bg-white/90"
              : "bg-primary text-white hover:bg-primary/90",
            (hasError || loading) && "opacity-50 cursor-not-allowed"
          )}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform / Scrubber + Timestamps */}
        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
          {/* Scrubber Range */}
          <div className="relative w-full flex items-center h-4">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              disabled={hasError || !duration}
              className={clsx(
                "w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none",
                isUserMessage ? "bg-white/30 accent-white" : "bg-muted accent-primary"
              )}
              style={{
                background: isUserMessage
                  ? `linear-gradient(to right, #FFFFFF ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%)`
                  : `linear-gradient(to right, #7C3AED ${progressPercent}%, #E2E8F0 ${progressPercent}%)`,
              }}
            />
          </div>

          {/* Time and Speed Indicator */}
          <div
            className={clsx(
              "flex items-center justify-between text-[10px] font-mono tabular-nums leading-none",
              isUserMessage ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            <span>{formatTime(currentTime)}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cyclePlaybackRate}
                className={clsx(
                  "px-1.5 py-0.5 rounded text-[9px] font-semibold transition-colors cursor-pointer",
                  isUserMessage
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-muted/80 hover:bg-muted text-foreground"
                )}
              >
                {playbackRate}x
              </button>
              {/* Download voice note to default Downloads folder */}
              <button
                type="button"
                onClick={() => downloadFile(mediaUrl)}
                className={clsx(
                  "p-0.5 rounded transition-colors cursor-pointer opacity-80 hover:opacity-100",
                  isUserMessage
                    ? "hover:bg-white/20 text-white"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                title={t("inbox.download_file")}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
              </button>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Fallback */}
      {hasError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-50 p-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{t("inbox.media_unavailable")}</span>
        </div>
      )}

      {/* Deepgram Transcription Accordion */}
      {((isUserMessage && (transcription || transcriptionError)) ||
        (!isUserMessage && Boolean(transcription && transcription.trim().length > 0))) && (
        <div
          className={clsx(
            "rounded-xl border transition-colors overflow-hidden text-xs",
            isUserMessage
              ? "border-white/25 bg-black/10 text-white"
              : "border-border/60 bg-muted/30 text-foreground"
          )}
        >
          <button
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full flex items-center justify-between p-2 text-left cursor-pointer hover:opacity-90"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Volume2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span className="font-semibold text-[11px] truncate">
                {t("inbox.voice_transcription_title")}
              </span>
              {detectedLanguage && (
                <span
                  className={clsx(
                    "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0",
                    isUserMessage
                      ? "bg-white/25 text-white"
                      : "bg-primary/10 text-primary border border-primary/20"
                  )}
                >
                  {langTag}
                  {confidencePercent !== null ? ` ${confidencePercent}%` : ""}
                </span>
              )}
            </div>

            <ChevronDown
              className={clsx(
                "w-3.5 h-3.5 transition-transform shrink-0 opacity-70",
                isAccordionOpen && "rotate-180"
              )}
            />
          </button>

          {isAccordionOpen && (
            <div
              className={clsx(
                "px-2.5 pb-2.5 pt-0.5 text-xs leading-relaxed border-t border-dashed",
                isUserMessage ? "border-white/20 text-white/90" : "border-border/50 text-muted-foreground"
              )}
            >
              {transcription && transcription.trim().length > 0 ? (
                <p className="whitespace-pre-wrap break-words">{transcription}</p>
              ) : (
                <p className="italic opacity-80">{t("inbox.voice_transcription_empty")}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
