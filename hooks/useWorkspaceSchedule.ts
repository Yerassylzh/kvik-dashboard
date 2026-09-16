"use client";

import useSWR from 'swr';
import { useCallback } from 'react';
import {
  workspacesScheduleApi,
  type WorkspaceScheduleTemplateDto,
  type WorkspaceScheduleOverrideDto,
  type SetWorkspaceSchedulePayload,
  type AddWorkspaceOverridePayload,
} from '@/lib/api/workspacesSchedule';

export function useWorkspaceSchedule(from?: string, to?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ['workspaces/schedule', from, to],
    () => workspacesScheduleApi.getSchedule(from, to),
    { revalidateOnFocus: true }
  );

  const setSchedule = useCallback(
    async (templates: SetWorkspaceSchedulePayload['templates']) => {
      const res = await workspacesScheduleApi.setSchedule({ templates });
      await mutate();
      return res;
    },
    [mutate]
  );

  const addOverride = useCallback(
    async (payload: AddWorkspaceOverridePayload) => {
      const res = await workspacesScheduleApi.addOverride(payload);
      await mutate();
      return res;
    },
    [mutate]
  );

  const removeOverride = useCallback(
    async (id: string) => {
      const res = await workspacesScheduleApi.removeOverride(id);
      await mutate();
      return res;
    },
    [mutate]
  );

  return {
    schedule: data,
    templates: data?.templates || [],
    overrides: data?.overrides || [],
    isLoading,
    error,
    setSchedule,
    addOverride,
    removeOverride,
    refresh: mutate,
  };
}
