import { apiClient } from './client';

export interface TelegramRecipient {
  id: string;
  telegramChatId: string;
  displayName: string;
  notificationTypes: string[];
  isActive: boolean;
  createdAt: string;
}

export interface GenerateTelegramCodeResponse {
  deepLink: string;
  code: string;
  expiresAt: string;
}

export interface UpdateRecipientPayload {
  notificationTypes?: string[];
  isActive?: boolean;
}

export const notificationRecipientsApi = {
  generateTelegramCode: async (): Promise<GenerateTelegramCodeResponse> => {
    const { data } = await apiClient.post<GenerateTelegramCodeResponse>(
      '/notifications/recipients/telegram/generate-code'
    );
    return data;
  },

  getRecipients: async (): Promise<TelegramRecipient[]> => {
    const { data } = await apiClient.get<TelegramRecipient[]>('/notifications/recipients');
    return data;
  },

  updateRecipient: async (
    id: string,
    payload: UpdateRecipientPayload
  ): Promise<TelegramRecipient> => {
    const { data } = await apiClient.patch<TelegramRecipient>(
      `/notifications/recipients/${id}`,
      payload
    );
    return data;
  },

  deleteRecipient: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/recipients/${id}`);
  },
};
