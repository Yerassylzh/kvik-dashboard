"use client";

import useSWR from 'swr';
import { bookingsApi, type AvailableSlotsResponse } from '@/lib/api/bookings';

export function useAvailableSlots(params: {
  staffId?: string;
  date?: string; // YYYY-MM-DD
  durationMinutes?: number;
}) {
  const duration = params.durationMinutes || 60;
  const shouldFetch = Boolean(params.date);

  const { data, error, isLoading, mutate } = useSWR<AvailableSlotsResponse | null>(
    shouldFetch ? ['bookings/slots', params.date, params.staffId, duration] : null,
    () =>
      bookingsApi.getAvailableSlots({
        date: params.date!,
        staffId: params.staffId || undefined,
        durationMinutes: duration,
      })
  );

  return {
    slots: data?.slots || [],
    isBusinessOpen: data?.isBusinessOpen ?? true,
    totalAvailableSlots: data?.totalAvailableSlots ?? 0,
    dayOfWeek: data?.dayOfWeek,
    isLoading,
    error,
    refresh: mutate,
  };
}
