import { create } from 'zustand';
import type { NotificationDto } from '@/lib/api/notifications';

interface NotificationsStore {
  unreadCount: number;
  latestNotification: NotificationDto | null;
  setCount: (n: number) => void;
  increment: () => void;
  reset: () => void;
  setLatestNotification: (n: NotificationDto | null) => void;
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  unreadCount: 0,
  latestNotification: null,
  setCount: (n) => set({ unreadCount: n }),
  increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
  setLatestNotification: (n) => set({ latestNotification: n }),
}));
