import { apiClient } from './client';

export type NotificationType =
  | 'ESCALATION'
  | 'TAKEOVER'
  | 'TAKEOVER_RELEASED'
  | 'NEW_BOOKING'
  | 'BOOKING_CANCELLED'
  | 'SYSTEM';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    conversationId?: string;
    triggerType?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedNotificationsResponse {
  data: NotificationDto[];
  total: number;
  unreadCount: number;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
}

export const notificationsApi = {
  getNotifications: async (
    params?: ListNotificationsParams
  ): Promise<PaginatedNotificationsResponse> => {
    const { data } = await apiClient.get<PaginatedNotificationsResponse>('/notifications', {
      params,
    });
    return data;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};
