"use client";

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import {
  aiEngineApi,
  type UpdateAiConfigPayload,
  type AiTestResponseDto,
} from '@/lib/api/aiEngine';

export function useAiEngine() {
  const { data: config, error, isLoading, mutate } = useSWR(
    'ai-engine/config',
    () => aiEngineApi.getConfig(),
    { revalidateOnFocus: true }
  );

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<AiTestResponseDto | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const updateConfig = useCallback(
    async (payload: UpdateAiConfigPayload) => {
      await aiEngineApi.updateConfig(payload);
      mutate();
    },
    [mutate]
  );

  const runTest = useCallback(async (message: string) => {
    setIsTesting(true);
    setTestError(null);
    try {
      const res = await aiEngineApi.testMessage(message);
      setTestResult(res);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Test message failed';
      setTestError(msg);
      throw err;
    } finally {
      setIsTesting(false);
    }
  }, []);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    runTest,
    isTesting,
    testResult,
    testError,
    clearTest: () => {
      setTestResult(null);
      setTestError(null);
    },
    refresh: mutate,
  };
}
