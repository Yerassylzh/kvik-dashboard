'use client';

import useSWRInfinite from 'swr/infinite';
import { useCallback } from 'react';
import { notificationsApi, type NotificationDto } from '@/lib/api/notifications';
import { useNotificationsStore } from '@/store/notifications.store';

const PAGE_SIZE = 30;

export function useNotifications() {
  const { setCount } = useNotificationsStore();

  const getKey = (pageIndex: number, previousPageData: { data: NotificationDto[]; total: number; unreadCount: number } | null) => {
    if (previousPageData && previousPageData.data.length === 0) return null;
    return ['notifications', pageIndex + 1, PAGE_SIZE];
  };

  const { data, error, isLoading, mutate, size, setSize } = useSWRInfinite(
    getKey,
    ([, page, limit]) =>
      notificationsApi.getNotifications({ page: page as number, limit: limit as number }),
    {
      revalidateOnFocus: true,
      onSuccess: (pages) => {
        if (pages[0]) {
          setCount(pages[0].unreadCount);
        }
      },
    }
  );

  const items: NotificationDto[] = data ? data.flatMap((page) => page.data) : [];
  const total = data?.[0]?.total ?? 0;
  const unreadCount = data?.[0]?.unreadCount ?? 0;
  const hasMore = items.length < total;

  const markRead = useCallback(
    async (id: string) => {
      await notificationsApi.markRead(id);
      await mutate();
    },
    [mutate]
  );

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    await mutate();
    setCount(0);
  }, [mutate, setCount]);

  const loadMore = useCallback(() => {
    if (hasMore) setSize((s) => s + 1);
  }, [hasMore, setSize]);

  return {
    items,
    total,
    unreadCount,
    hasMore,
    isLoading,
    error,
    markRead,
    markAllRead,
    loadMore,
    refresh: mutate,
  };
}
