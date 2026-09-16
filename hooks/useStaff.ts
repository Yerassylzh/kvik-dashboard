"use client";

import useSWR from 'swr';
import { useCallback } from 'react';
import {
  staffApi,
  type CreateStaffPayload,
  type UpdateStaffPayload,
  type SetScheduleTemplateItem,
  type AddOverridePayload,
} from '@/lib/api/staff';

export function useStaff(isActive?: boolean) {
  const { data, error, isLoading, mutate } = useSWR(
    ['staff', isActive],
    () => staffApi.getStaff(isActive),
    { revalidateOnFocus: true }
  );

  const createStaff = useCallback(
    async (payload: CreateStaffPayload) => {
      const created = await staffApi.createStaff(payload);
      mutate();
      return created;
    },
    [mutate]
  );

  const updateStaff = useCallback(
    async (id: string, payload: UpdateStaffPayload) => {
      await staffApi.updateStaff(id, payload);
      mutate();
    },
    [mutate]
  );

  const deactivateStaff = useCallback(
    async (id: string) => {
      await staffApi.deactivateStaff(id);
      mutate();
    },
    [mutate]
  );

  const inviteStaff = useCallback(
    async (id: string, payload?: { email?: string; systemRole?: any }) => {
      const res = await staffApi.inviteStaff(id, payload);
      mutate();
      return res;
    },
    [mutate]
  );

  const revokeInvite = useCallback(
    async (id: string) => {
      const res = await staffApi.revokeInvite(id);
      mutate();
      return res;
    },
    [mutate]
  );

  return {
    staff: data || [],
    isLoading,
    error,
    createStaff,
    updateStaff,
    deactivateStaff,
    inviteStaff,
    revokeInvite,
    refresh: mutate,
  };
}

export function useStaffSchedule(staffId: string | null, from?: string, to?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    staffId ? ['staff/schedule', staffId, from, to] : null,
    () => (staffId ? staffApi.getSchedule(staffId, from, to) : null)
  );

  const setSchedule = useCallback(
    async (templates: SetScheduleTemplateItem[]) => {
      if (!staffId) return;
      await staffApi.setSchedule(staffId, templates);
      mutate();
    },
    [staffId, mutate]
  );

  const addOverride = useCallback(
    async (payload: AddOverridePayload) => {
      if (!staffId) return;
      await staffApi.addOverride(staffId, payload);
      mutate();
    },
    [staffId, mutate]
  );

  const removeOverride = useCallback(
    async (overrideId: string) => {
      if (!staffId) return;
      await staffApi.removeOverride(staffId, overrideId);
      mutate();
    },
    [staffId, mutate]
  );

  const resetSchedule = useCallback(
    async () => {
      if (!staffId) return;
      await staffApi.resetSchedule(staffId);
      mutate();
    },
    [staffId, mutate]
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
    resetSchedule,
    refresh: mutate,
  };
}
