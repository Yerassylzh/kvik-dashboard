"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  intervalMs?: number;
  enabled?: boolean;
  maxAttempts?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  shouldStop?: (data: T) => boolean;
}

export function usePolling<T>({
  fetcher,
  intervalMs = 2500,
  enabled = true,
  maxAttempts = 50,
  onSuccess,
  onError,
  shouldStop,
}: UsePollingOptions<T>) {
  const [isPolling, setIsPolling] = useState(enabled);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(enabled);
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const shouldStopRef = useRef(shouldStop);
  const pollRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    shouldStopRef.current = shouldStop;
  });

  const stop = useCallback(() => {
    activeRef.current = false;
    setIsPolling(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runPoll = useCallback(async () => {
    if (!activeRef.current) return;

    if (attemptsRef.current >= maxAttempts) {
      stop();
      return;
    }

    attemptsRef.current += 1;

    try {
      const result = await fetcherRef.current();
      if (!activeRef.current) return;

      onSuccessRef.current?.(result);

      if (shouldStopRef.current?.(result)) {
        stop();
        return;
      }
    } catch (err) {
      if (!activeRef.current) return;
      onErrorRef.current?.(err);
    }

    if (activeRef.current) {
      timerRef.current = setTimeout(() => {
        void pollRef.current?.();
      }, intervalMs);
    }
  }, [intervalMs, maxAttempts, stop]);

  useEffect(() => {
    pollRef.current = runPoll;
  }, [runPoll]);

  const start = useCallback(() => {
    stop();
    activeRef.current = true;
    attemptsRef.current = 0;
    setIsPolling(true);
    void runPoll();
  }, [runPoll, stop]);

  useEffect(() => {
    if (enabled) {
      activeRef.current = true;
      attemptsRef.current = 0;
      queueMicrotask(() => {
        void runPoll();
      });
    } else {
      queueMicrotask(() => {
        stop();
      });
    }

    return () => {
      stop();
    };
  }, [enabled, runPoll, stop]);

  return { isPolling, start, stop };
}
