"use client";

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { analyticsApi } from '@/lib/api/analytics';

export type DatePreset = 'today' | '7d' | '30d' | '90d';

export function useAnalytics() {
  const [preset, setPreset] = useState<DatePreset>('30d');

  const { from, to } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    if (preset === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (preset === '7d') {
      start.setDate(end.getDate() - 7);
    } else if (preset === '30d') {
      start.setDate(end.getDate() - 30);
    } else if (preset === '90d') {
      start.setDate(end.getDate() - 90);
    }

    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0],
    };
  }, [preset]);

  const {
    data: overview,
    error: overviewError,
    isLoading: overviewLoading,
    mutate: mutateOverview,
  } = useSWR(['analytics/overview', from, to], () => analyticsApi.getOverview(from, to), {
    revalidateOnFocus: true,
    refreshInterval: 60000,
  });

  const {
    data: funnel,
    error: funnelError,
    isLoading: funnelLoading,
  } = useSWR(['analytics/funnel', from, to], () => analyticsApi.getFunnel(from, to));

  const {
    data: bookingsByDay,
    error: bookingsByDayError,
    isLoading: bookingsByDayLoading,
  } = useSWR(['analytics/bookings-by-day', from, to], () =>
    analyticsApi.getBookingsByDay(from, to)
  );

  const {
    data: channels,
    error: channelsError,
    isLoading: channelsLoading,
  } = useSWR(['analytics/channels', from, to], () => analyticsApi.getChannels(from, to));

  const {
    data: staffAnalytics,
    error: staffError,
    isLoading: staffLoading,
  } = useSWR(['analytics/staff', from, to], () => analyticsApi.getStaffAnalytics(from, to));

  return {
    preset,
    setPreset,
    dateRange: { from, to },
    overview,
    funnel,
    bookingsByDay,
    channels,
    staffAnalytics,
    isLoading:
      overviewLoading || funnelLoading || bookingsByDayLoading || channelsLoading || staffLoading,
    error: overviewError || funnelError || bookingsByDayError || channelsError || staffError,
    refresh: mutateOverview,
  };
}
