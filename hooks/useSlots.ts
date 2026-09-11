"use client";

import useSWR from 'swr';
import { bookingsApi, type AvailableSlotsResponse } from '@/lib/api/bookings';

export function useAvailableSlots(params: {
  staffId?: string;
  date?: string; // YYYY-MM-DD
  durationMinutes?: number;
}) {
  const shouldFetch = Boolean(params.staffId && params.date && params.durationMinutes);

  const { data, error, isLoading, mutate } = useSWR<AvailableSlotsResponse | null>(
    shouldFetch ? ['bookings/slots', params.staffId, params.date, params.durationMinutes] : null,
    () =>
      bookingsApi.getAvailableSlots({
        staffId: params.staffId!,
        date: params.date!,
        durationMinutes: params.durationMinutes || 60,
      })
  );

  return {
    slots: data?.slots || [],
    isLoading,
    error,
    refresh: mutate,
  };
}
