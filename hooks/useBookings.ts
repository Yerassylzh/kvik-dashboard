"use client";

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import {
  bookingsApi,
  type BookingDto,
  type BookingStatus,
  type FilterBookingsParams,
  type CreateBookingPayload,
  type RescheduleBookingPayload,
} from '@/lib/api/bookings';

export function useBookings(initialParams?: Partial<FilterBookingsParams>) {
  const [params, setParams] = useState<FilterBookingsParams>(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    const end = new Date(today);
    end.setDate(today.getDate() + 30);

    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0],
      ...initialParams,
    };
  });

  const { data, error, isLoading, mutate } = useSWR(
    ['bookings', params],
    () => bookingsApi.getBookings(params),
    {
      revalidateOnFocus: true,
      refreshInterval: 15000,
    }
  );

  const createBooking = useCallback(
    async (payload: CreateBookingPayload) => {
      const created = await bookingsApi.createBooking(payload);
      mutate();
      return created;
    },
    [mutate]
  );

  const updateStatus = useCallback(
    async (bookingId: string, status: BookingStatus) => {
      await bookingsApi.updateStatus(bookingId, status);
      mutate();
    },
    [mutate]
  );

  const reschedule = useCallback(
    async (bookingId: string, payload: RescheduleBookingPayload) => {
      await bookingsApi.reschedule(bookingId, payload);
      mutate();
    },
    [mutate]
  );

  return {
    bookings: data || [],
    params,
    setParams,
    createBooking,
    updateStatus,
    reschedule,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useBookingDetail(bookingId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    bookingId ? ['booking', bookingId] : null,
    () => (bookingId ? bookingsApi.getBooking(bookingId) : null)
  );

  return {
    booking: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
