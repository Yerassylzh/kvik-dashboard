"use client";

import useSWR, { useSWRConfig } from 'swr';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { getSocketBaseUrl } from '@/lib/api/socketUrl';
import {
  insightsApi,
  GetRecommendationsParams,
  GetDemandTrendsParams,
  GetReportsParams,
} from '@/lib/api/insights';
import {
  RecommendationsSummaryResponseDto,
  RecommendationsListResponseDto,
  DemandTrendsResponseDto,
  ReportsListResponseDto,
  SingleWeeklyReportResponseDto,
  ApplyRecommendationPayload,
  DismissRecommendationPayload,
} from '@/types/insights';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function useActiveWorkspaceId(explicitId?: string): string | undefined {
  const storeWorkspaceId = useAuthStore((s) => s.user?.workspace?.id);
  return explicitId || storeWorkspaceId;
}

export function useBusinessInsightsSummary(explicitWorkspaceId?: string) {
  const workspaceId = useActiveWorkspaceId(explicitWorkspaceId);

  const { data, error, isLoading, mutate } = useSWR<RecommendationsSummaryResponseDto>(
    workspaceId ? ['insights/summary', workspaceId] : null,
    () => (workspaceId ? insightsApi.getSummary(workspaceId) : Promise.reject('No workspace')),
    { revalidateOnFocus: true }
  );

  return {
    summary: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useBusinessRecommendations(
  explicitWorkspaceId?: string,
  params?: GetRecommendationsParams
) {
  const t = useTranslations('insights');
  const workspaceId = useActiveWorkspaceId(explicitWorkspaceId);
  const { mutate: globalMutate } = useSWRConfig();
  const [isMutating, setIsMutating] = useState(false);

  const swrKey = workspaceId
    ? [
        'insights/recommendations',
        workspaceId,
        params?.status || 'ALL',
        params?.category || 'ALL',
        params?.impact || 'ALL',
        params?.page || 1,
        params?.limit || 10,
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR<RecommendationsListResponseDto>(
    swrKey,
    () =>
      workspaceId
        ? insightsApi.getRecommendations(workspaceId, params)
        : Promise.reject('No workspace'),
    { revalidateOnFocus: true }
  );

  const applyRecommendation = useCallback(
    async (id: string, payload?: ApplyRecommendationPayload, successMsg?: string) => {
      if (!workspaceId) return;
      setIsMutating(true);
      try {
        const res = await insightsApi.applyRecommendation(workspaceId, id, payload);
        toast.success(successMsg || t('toasts.apply_success'));
        await Promise.all([
          mutate(),
          globalMutate(['insights/summary', workspaceId]),
        ]);
        return res;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { code?: string; message?: string } }; message?: string };
        const errorCode = error?.response?.data?.code;
        const msg = error?.response?.data?.message || error?.message || t('toasts.apply_error');
        toast.error(msg);
        if (errorCode === 'insights.already_implemented' || errorCode === 'insights.already_dismissed') {
          await Promise.all([
            mutate(),
            globalMutate(['insights/summary', workspaceId]),
          ]);
        }
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [workspaceId, mutate, globalMutate, t]
  );

  const dismissRecommendation = useCallback(
    async (id: string, payload: DismissRecommendationPayload, successMsg?: string) => {
      if (!workspaceId) return;
      setIsMutating(true);
      try {
        const res = await insightsApi.dismissRecommendation(workspaceId, id, payload);
        toast.success(successMsg || t('toasts.dismiss_success'));
        await Promise.all([
          mutate(),
          globalMutate(['insights/summary', workspaceId]),
        ]);
        return res;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { code?: string; message?: string } }; message?: string };
        const errorCode = error?.response?.data?.code;
        const msg = error?.response?.data?.message || error?.message || t('toasts.dismiss_error');
        toast.error(msg);
        if (errorCode === 'insights.already_implemented' || errorCode === 'insights.already_dismissed') {
          await Promise.all([
            mutate(),
            globalMutate(['insights/summary', workspaceId]),
          ]);
        }
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [workspaceId, mutate, globalMutate, t]
  );

  return {
    recommendations: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    isLoading,
    isMutating,
    error,
    applyRecommendation,
    dismissRecommendation,
    refresh: mutate,
  };
}

export function useDemandTrends(
  explicitWorkspaceId?: string,
  params?: GetDemandTrendsParams
) {
  const workspaceId = useActiveWorkspaceId(explicitWorkspaceId);

  const { data, error, isLoading, mutate } = useSWR<DemandTrendsResponseDto>(
    workspaceId ? ['insights/demand-trends', workspaceId, params?.from, params?.to] : null,
    () =>
      workspaceId
        ? insightsApi.getDemandTrends(workspaceId, params)
        : Promise.reject('No workspace'),
    { revalidateOnFocus: true }
  );

  return {
    demandTrends: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useWeeklyReports(
  explicitWorkspaceId?: string,
  params?: GetReportsParams
) {
  const workspaceId = useActiveWorkspaceId(explicitWorkspaceId);

  const { data, error, isLoading, mutate } = useSWR<ReportsListResponseDto>(
    workspaceId ? ['insights/reports', workspaceId, params?.page || 1, params?.limit || 10] : null,
    () =>
      workspaceId
        ? insightsApi.getReports(workspaceId, params)
        : Promise.reject('No workspace'),
    { revalidateOnFocus: true }
  );

  return {
    reports: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useWeeklyReportDetail(
  explicitWorkspaceId?: string,
  reportId?: string | null
) {
  const workspaceId = useActiveWorkspaceId(explicitWorkspaceId);

  const { data, error, isLoading, mutate } = useSWR<SingleWeeklyReportResponseDto>(
    workspaceId && reportId ? ['insights/reports/detail', workspaceId, reportId] : null,
    () =>
      workspaceId && reportId
        ? insightsApi.getReportById(workspaceId, reportId)
        : Promise.reject('No report ID'),
    { revalidateOnFocus: false }
  );

  return {
    report: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useInsightsRealtime(explicitWorkspaceId?: string) {
  const workspaceId = useActiveWorkspaceId(explicitWorkspaceId);
  const { accessToken } = useAuthStore();
  const { mutate } = useSWRConfig();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken || !workspaceId || typeof window === 'undefined') return;

    const socketUrl = getSocketBaseUrl();
    const bearerToken = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`;
    const socket = io(`${socketUrl}/insights`, {
      auth: { token: bearerToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('workspace.join', { workspaceId });
    });

    socket.on('insights.recommendation_created', () => {
      mutate((key) => Array.isArray(key) && key[0] === 'insights/recommendations');
      mutate(['insights/summary', workspaceId]);
    });

    socket.on('insights.recommendation_applied', () => {
      mutate((key) => Array.isArray(key) && key[0] === 'insights/recommendations');
      mutate(['insights/summary', workspaceId]);
    });

    socket.on('insights.weekly_report_ready', () => {
      mutate((key) => Array.isArray(key) && key[0] === 'insights/reports');
      mutate(['insights/summary', workspaceId]);
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, workspaceId, mutate]);
}
