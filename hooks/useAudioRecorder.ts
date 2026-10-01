"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  durationSeconds: number;
  audioBlob: Blob | null;
  volumeLevel: number; // 0 to 1
  error: string | null;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resolveStopPromiseRef = useRef<((blob: Blob) => void) | null>(null);

  // Determine best supported audio MIME type
  const getSupportedMimeType = (): string => {
    if (typeof MediaRecorder === "undefined") return "audio/webm";
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setVolumeLevel(0);
  }, []);

  const monitorVolume = useCallback(() => {
    function loop() {
      if (!analyserRef.current) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      setVolumeLevel(Math.min(1, avg / 128));

      animationFrameRef.current = requestAnimationFrame(loop);
    }
    loop();
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setError(null);
    cleanup();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("voice_mic_unsupported");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup Web Audio Analyser for volume metering
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
        monitorVolume();
      } catch {
        // AudioContext metering is optional; recording still works without it
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        if (resolveStopPromiseRef.current) {
          resolveStopPromiseRef.current(recordedBlob);
          resolveStopPromiseRef.current = null;
        }
      };

      mediaRecorder.start(200); // 200ms slice
      setIsRecording(true);
      setDurationSeconds(0);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDurationSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 500);

      return true;
    } catch (err: unknown) {
      cleanup();
      const isNotAllowed = (err as { name?: string })?.name === "NotAllowedError";
      setError(isNotAllowed ? "voice_mic_denied" : "voice_mic_unsupported");
      return false;
    }
  }, [cleanup, monitorVolume]);

  const stopRecording = useCallback((): Promise<{ blob: Blob; duration: number }> => {
    return new Promise((resolve) => {
      const duration = durationSeconds;

      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        cleanup();
        resolve({ blob: new Blob([]), duration: 0 });
        return;
      }

      resolveStopPromiseRef.current = (blob: Blob) => {
        cleanup();
        resolve({ blob, duration: Math.max(1, duration) });
      };

      mediaRecorderRef.current.stop();
    });
  }, [durationSeconds, cleanup]);

  const cancelRecording = useCallback(() => {
    cleanup();
    setDurationSeconds(0);
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    isRecording,
    durationSeconds,
    volumeLevel,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
