"use client";

import useSWR from 'swr';
import { useCallback, useState } from 'react';
import {
  followUpsApi,
  type FollowUpConfigDto,
  type UpdateFollowUpConfigPayload,
  type FollowUpStatsDto,
  type FollowUpLogsParams,
  type TestPreviewPayload,
  type TestPreviewResponse,
} from '@/lib/api/followUps';
import { toast } from 'sonner';

export function useFollowUpConfig(workspaceId?: string) {
  const { data, error, isLoading, mutate } = useSWR<FollowUpConfigDto>(
    workspaceId ? ['follow-ups/config', workspaceId] : null,
    () => (workspaceId ? followUpsApi.getConfig(workspaceId) : Promise.reject('No workspace')),
    { revalidateOnFocus: true }
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const updateConfig = useCallback(
    async (payload: UpdateFollowUpConfigPayload, successMessage?: string) => {
      if (!workspaceId) return;
      setIsUpdating(true);
      try {
        const res = await followUpsApi.updateConfig(workspaceId, payload);
        await mutate();
        if (successMessage) {
          toast.success(successMessage);
        } else if (res?.message) {
          toast.success(res.message);
        }
        return res;
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Ошибка обновления настроек';
        toast.error(msg);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [workspaceId, mutate]
  );

  const toggleMasterSwitch = useCallback(
    async (enabled: boolean) => {
      return updateConfig(
        { enabled },
        enabled ? 'Автоматизации дожима включены' : 'Автоматизации дожима приостановлены'
      );
    },
    [updateConfig]
  );

  return {
    config: data,
    isLoading,
    error,
    isUpdating,
    updateConfig,
    toggleMasterSwitch,
    refresh: mutate,
  };
}

export function useFollowUpStats(
  workspaceId?: string,
  params?: { from?: string; to?: string }
) {
  const { data, error, isLoading, mutate } = useSWR<FollowUpStatsDto>(
    workspaceId ? ['follow-ups/stats', workspaceId, params?.from, params?.to] : null,
    () => (workspaceId ? followUpsApi.getStats(workspaceId, params) : Promise.reject('No workspace')),
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  return {
    stats: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useFollowUpLogs(
  workspaceId?: string,
  params?: FollowUpLogsParams
) {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceId
      ? [
          'follow-ups/logs',
          workspaceId,
          params?.status,
          params?.channelType,
          params?.conversationId,
          params?.leadId,
          params?.page,
          params?.limit,
        ]
      : null,
    () => (workspaceId ? followUpsApi.getLogs(workspaceId, params) : Promise.reject('No workspace')),
    { revalidateOnFocus: true, refreshInterval: 15000 }
  );

  return {
    logs: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useFollowUpPreview(workspaceId?: string) {
  const [result, setResult] = useState<TestPreviewResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = useCallback(
    async (payload: TestPreviewPayload) => {
      if (!workspaceId) return null;
      setIsGenerating(true);
      setError(null);
      try {
        const data = await followUpsApi.testPreview(workspaceId, payload);
        setResult(data);
        return data;
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Не удалось сгенерировать тест';
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [workspaceId]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isGenerating,
    error,
    generatePreview,
    clearResult,
  };
}
