'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import {
  roundRobinApi,
  type RoundRobinSettings,
  type UpdateRoundRobinSettingsPayload,
} from '@/lib/api/round-robin';
import { staffApi, type UpdateStaffRoundRobinPayload } from '@/lib/api/staff';

export function useRoundRobin() {
  const { data, error, isLoading, mutate } = useSWR<RoundRobinSettings>(
    'round-robin/settings',
    () => roundRobinApi.getSettings(),
    { revalidateOnFocus: false }
  );

  const updateSettings = useCallback(
    async (payload: UpdateRoundRobinSettingsPayload) => {
      // Optimistic update
      if (data) {
        mutate({ ...data, ...payload }, false);
      }
      await roundRobinApi.updateSettings(payload);
      mutate();
    },
    [data, mutate]
  );

  const updateStaffRoundRobin = useCallback(
    async (staffId: string, payload: UpdateStaffRoundRobinPayload) => {
      // Optimistic update: patch the staff array in place
      if (data) {
        const optimisticStaff = data.staff.map((s) =>
          s.id === staffId ? { ...s, ...payload } : s
        );
        mutate({ ...data, staff: optimisticStaff }, false);
      }
      await staffApi.updateRoundRobin(staffId, payload);
      mutate();
    },
    [data, mutate]
  );

  return {
    settings: data,
    staff: data?.staff ?? [],
    isLoading,
    error,
    updateSettings,
    updateStaffRoundRobin,
    refresh: mutate,
  };
}
