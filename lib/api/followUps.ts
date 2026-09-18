import { apiClient } from './client';
import { ChannelType } from '@/types/channels';

export type FollowUpLogStatus = 'PENDING' | 'SENT' | 'REPLIED' | 'SKIPPED' | 'CANCELLED';
export type DispatchMode = 'AI_FREEFORM' | 'WABA_HSM_TEMPLATE' | 'INSTAGRAM_FALLBACK';

export interface QuietHoursConfig {
  enabled: boolean;
  start: string; // "21:30"
  end: string;   // "09:00"
  timezone: string; // "Asia/Almaty"
}

export interface AbandonmentStepConfig {
  stepIndex: number; // 1, 2, 3
  delayMinutes: number; // 120, 1200, 2880
  label?: string;
}

export interface AbandonmentSequenceConfig {
  enabled: boolean;
  steps: AbandonmentStepConfig[];
  autoDisqualifyAfterHours: number; // default: 72
}

export interface AdaptiveNoticeRules {
  minAdvanceHoursFor24hReminder: number; // default: 48
  minAdvanceHoursFor2hReminder: number;   // default: 3
}

export interface AppointmentRemindersConfig {
  enabled: boolean;
  send24hReminder: boolean;
  send2hReminder: boolean;
  adaptiveNoticeRules: AdaptiveNoticeRules;
}

export interface PostVisitRetentionConfig {
  enabled: boolean;
  send2GisReviewRequest: boolean;
  sendReviewRequestAfterMinutes: number; // default: 120
  direct2GisReviewUrl?: string | null;
  sendRepeatRecallAfterDays: number;     // default: 30
}

export interface ChannelPolicyStatus {
  active: boolean;
  wabaTemplateConfigured?: boolean;
  crossChannelFallback?: boolean;
  unlimitedWindow?: boolean;
}

export interface FollowUpConfigDto {
  enabled: boolean;
  quietHours: QuietHoursConfig;
  abandonmentSequence: AbandonmentSequenceConfig;
  appointmentReminders: AppointmentRemindersConfig;
  postVisitRetention: PostVisitRetentionConfig;
  channels: Partial<Record<ChannelType, ChannelPolicyStatus>>;
}

export interface UpdateFollowUpConfigPayload {
  enabled?: boolean;
  quietHours?: Partial<QuietHoursConfig>;
  abandonmentSequence?: {
    enabled?: boolean;
    steps?: Array<{ stepIndex: number; delayMinutes: number }>;
    autoDisqualifyAfterHours?: number;
  };
  appointmentReminders?: {
    enabled?: boolean;
    send24hReminder?: boolean;
    send2hReminder?: boolean;
    adaptiveNoticeRules?: Partial<AdaptiveNoticeRules>;
  };
  postVisitRetention?: {
    enabled?: boolean;
    send2GisReviewRequest?: boolean;
    sendReviewRequestAfterMinutes?: number;
    direct2GisReviewUrl?: string | null;
    sendRepeatRecallAfterDays?: number;
  };
}

export interface StepStatItem {
  stepIndex: number;
  name: string;
  dispatched: number;
  replied: number;
  replyRate: number;
  bookingsCreated: number;
}

export interface ChannelStatItem {
  dispatched: number;
  replied: number;
  replyRate: number;
}

export interface FollowUpStatsDto {
  period: { from: string; to: string };
  summary: {
    totalFollowUpsDispatched: number;
    totalReplied: number;
    replyRate: number;
    bookingsGenerated: number;
    conversionToBookingRate: number;
    autoDisqualifiedLeads: number;
    reviewsRequested: number;
    estimatedReviewsSubmitted: number;
  };
  stepBreakdown: StepStatItem[];
  channelBreakdown: Partial<Record<ChannelType, ChannelStatItem>>;
}

export interface FollowUpLogItem {
  id: string;
  conversationId: string;
  lead?: {
    id: string;
    name?: string | null;
    phone?: string | null;
  } | null;
  channelType: ChannelType;
  stepIndex: number;
  scheduledFor: string;
  executedAt?: string | null;
  status: FollowUpLogStatus;
  messageText: string;
  repliedAt?: string | null;
  convertedToBooking: boolean;
}

export interface FollowUpLogsResponse {
  data: FollowUpLogItem[];
  total: number;
  page: number;
  limit: number;
}

export interface FollowUpLogsParams {
  conversationId?: string;
  leadId?: string;
  status?: FollowUpLogStatus;
  channelType?: ChannelType;
  page?: number;
  limit?: number;
}

export interface TestPreviewPayload {
  conversationId: string;
  stepIndex?: number;
}

export interface TestPreviewResponse {
  generatedMessage: string;
  channelType: ChannelType;
  withinMeta24hWindow: boolean;
  dispatchMode: DispatchMode;
  quietHoursActiveNow: boolean;
  tokensUsed: number;
  latencyMs: number;
}

export const followUpsApi = {
  getConfig: async (workspaceId: string): Promise<FollowUpConfigDto> => {
    const { data } = await apiClient.get<FollowUpConfigDto>(`/workspaces/${workspaceId}/follow-ups/config`);
    return data;
  },

  updateConfig: async (
    workspaceId: string,
    payload: UpdateFollowUpConfigPayload
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(
      `/workspaces/${workspaceId}/follow-ups/config`,
      payload
    );
    return data;
  },

  getStats: async (
    workspaceId: string,
    params?: { from?: string; to?: string }
  ): Promise<FollowUpStatsDto> => {
    const { data } = await apiClient.get<FollowUpStatsDto>(`/workspaces/${workspaceId}/follow-ups/stats`, {
      params,
    });
    return data;
  },

  getLogs: async (
    workspaceId: string,
    params?: FollowUpLogsParams
  ): Promise<FollowUpLogsResponse> => {
    const { data } = await apiClient.get<FollowUpLogsResponse>(`/workspaces/${workspaceId}/follow-ups/logs`, {
      params,
    });
    return data;
  },

  testPreview: async (
    workspaceId: string,
    payload: TestPreviewPayload
  ): Promise<TestPreviewResponse> => {
    const { data } = await apiClient.post<TestPreviewResponse>(
      `/workspaces/${workspaceId}/follow-ups/test-preview`,
      payload
    );
    return data;
  },
};
