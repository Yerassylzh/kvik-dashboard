import { apiClient } from './client';

export type ConversationStatus = 'BOT_ACTIVE' | 'MANAGER_INTERCEPTED' | 'CLOSED';
export type ChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM';
export type MessageRole = 'USER' | 'BOT' | 'MANAGER';
export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';

export interface MessageMediaMetadata {
  mediaType?: MediaType;
  mediaUrl?: string;
  fileKey?: string;
  mimeType?: string;
  fileSize?: number;
  fileName?: string;
  durationSeconds?: number;
  
  // Voice STT Specific (Inbound)
  isVoice?: boolean;
  transcription?: string;
  transcriptionConfidence?: number;
  detectedLanguage?: 'ru' | 'kk' | 'en' | string;
  transcriptionDurationMs?: number;
  transcriptionError?: string;
  
  // Channel Context
  rawType?: string;
  externalMediaId?: string;
}

export interface MessageDto {
  id: string;
  conversationId?: string;
  role: MessageRole;
  senderStaffId?: string | null;
  senderName?: string | null;
  content: string;
  externalMessageId?: string | null;
  metadata?: MessageMediaMetadata | Record<string, unknown> | null;
  createdAt: string;
}

export interface AssignedStaffDto {
  id: string;
  name: string;
  role: string;
}

export interface EscalationDto {
  id: string;
  conversationId: string;
  triggerType: string;
  reason: string | null;
  triggeredAt: string;
  resolvedAt: string | null;
  resolvedByStaffId: string | null;
}

export interface ConversationDto {
  id: string;
  status: ConversationStatus;
  lastMessageAt: string;
  lastMessagePreview?: string | null;
  unreadCount: number;
  channelType?: ChannelType | null;
  assignedStaffId?: string | null;
  takenOverByActorId?: string | null; // staffMemberId OR userId — identifies who holds the exclusive lock
  takenOverAt?: string | null;
  assignedStaff?: AssignedStaffDto | null;
  lead?: {
    id: string;
    name?: string | null;
    phone?: string | null;
  } | null;
  pendingFollowUp?: {
    stepIndex: number;
    scheduledFor: string;
  } | null;
}

export interface ConversationDetailDto extends ConversationDto {
  channel?: {
    id: string;
    type: ChannelType;
    status: string;
  } | null;
}

export interface ListConversationsParams {
  status?: ConversationStatus;
  channelType?: ChannelType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedConversationsResponse {
  data: ConversationDto[];
  total: number;
  page: number;
  limit: number;
}

export interface SendManagerMessageDto {
  content?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  durationSeconds?: number | null;
}

export interface UploadMediaResponse {
  mediaUrl: string;
  mediaType: MediaType;
  mimeType: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  durationSeconds?: number;
}

export interface MediaItemDto {
  messageId: string;
  role: 'USER' | 'MANAGER' | 'BOT';
  senderName?: string;
  mediaType: MediaType;
  mediaUrl: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  caption?: string;
  durationSeconds?: number;
  transcription?: string;
  detectedLanguage?: string;
  createdAt: string;
}

export interface PaginatedMediaResponse {
  data: MediaItemDto[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedMessagesResponse {
  data: MessageDto[];
  total: number;
  page: number;
  limit: number;
}

export const conversationsApi = {
  getConversations: async (params?: ListConversationsParams): Promise<PaginatedConversationsResponse> => {
    const { data } = await apiClient.get<PaginatedConversationsResponse>('/conversations', { params });
    return data;
  },

  getConversation: async (id: string): Promise<ConversationDetailDto> => {
    const { data } = await apiClient.get<ConversationDetailDto>(`/conversations/${id}`);
    return data;
  },

  getMessages: async (id: string, params?: { page?: number; limit?: number }): Promise<PaginatedMessagesResponse> => {
    const { data } = await apiClient.get<PaginatedMessagesResponse>(`/conversations/${id}/messages`, {
      params,
    });
    return data;
  },

  uploadMedia: async (
    conversationId: string,
    file: File | Blob,
    mediaType?: MediaType,
    durationSeconds?: number
  ): Promise<UploadMediaResponse> => {
    const formData = new FormData();
    const fileName = file instanceof File ? file.name : `voice-recording-${Date.now()}.webm`;
    formData.append('file', file, fileName);
    if (mediaType) {
      formData.append('mediaType', mediaType);
    }
    if (durationSeconds !== undefined && durationSeconds !== null) {
      formData.append('durationSeconds', String(durationSeconds));
    }

    const { data } = await apiClient.post<UploadMediaResponse>(
      `/conversations/${conversationId}/media/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return data;
  },

  sendMessage: async (id: string, payload: string | SendManagerMessageDto): Promise<MessageDto> => {
    const body = typeof payload === 'string' ? { content: payload } : payload;
    const { data } = await apiClient.post<MessageDto>(`/conversations/${id}/messages`, body);
    return data;
  },

  getMediaGallery: async (
    id: string,
    params?: { type?: MediaType; page?: number; limit?: number }
  ): Promise<PaginatedMediaResponse> => {
    const { data } = await apiClient.get<PaginatedMediaResponse>(`/conversations/${id}/media`, {
      params,
    });
    return data;
  },

  updateStatus: async (
    id: string,
    status: ConversationStatus
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(`/conversations/${id}/status`, {
      status,
    });
    return data;
  },

  cancelFollowUp: async (id: string): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.post<{ code: string; message: string }>(
      `/conversations/${id}/cancel-followup`
    );
    return data;
  },

  markAsRead: async (id: string): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(`/conversations/${id}/read`);
    return data;
  },

  takeover: async (id: string): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.post<{ code: string; message: string }>(
      `/conversations/${id}/takeover`
    );
    return data;
  },

  releaseTakeover: async (id: string): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.post<{ code: string; message: string }>(
      `/conversations/${id}/release-takeover`
    );
    return data;
  },

  getEscalations: async (id: string): Promise<EscalationDto[]> => {
    const { data } = await apiClient.get<EscalationDto[]>(
      `/conversations/${id}/escalations`
    );
    return data;
  },
};

