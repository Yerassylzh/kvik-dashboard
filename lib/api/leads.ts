import { apiClient } from './client';

export type LeadStatus = 'NEW' | 'QUALIFIED' | 'APPOINTMENT_SET' | 'DEAL_WON' | 'DEAL_LOST';
export type ChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM';

export type LeadLossReason =
  | 'DISQUALIFIED_BY_POLICY'
  | 'OUT_OF_SERVICE_AREA'
  | 'PRICE_TOO_HIGH'
  | 'UNSUPPORTED_SERVICE'
  | 'CLIENT_DECLINED'
  | 'UNRESPONSIVE_AFTER_FOLLOWUP'
  | 'CANCELLED_WITHOUT_REBOOK'
  | 'SPAM'
  | 'OTHER';

export type StageChangeActor = 'AI' | 'MANAGER' | 'SYSTEM';

export interface LeadAssignedStaff {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface LeadDto {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  sourceChannel?: ChannelType | null;
  status: LeadStatus;
  lossReason?: LeadLossReason | null;
  lossNotes?: string | null;
  assignedStaffId?: string | null;
  assignedStaff?: LeadAssignedStaff | null;
  nicheData?: Record<string, unknown> | null;
  score?: number;
  stageChangedAt?: string;
  lastActivityAt: string;
  createdAt: string;
}

export interface LeadTimelineEventDto {
  id: string;
  previousStatus: LeadStatus | null;
  newStatus: LeadStatus;
  changedBy: StageChangeActor;
  changedByUserId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface LeadNoteAuthorDto {
  id: string;
  name: string;
}

export interface LeadNoteDto {
  id: string;
  content: string;
  isPinned: boolean;
  author: LeadNoteAuthorDto;
  createdAt: string;
  updatedAt?: string;
}

export interface LeadDetailDto extends LeadDto {
  conversations?: Array<{
    id: string;
    channelType: ChannelType;
    status: string;
    lastMessagePreview?: string;
    lastMessageAt: string;
  }>;
  bookings?: Array<{
    id: string;
    serviceName?: string;
    staffName?: string;
    startTime: string;
    endTime?: string;
    status: string;
  }>;
  recentTimeline?: LeadTimelineEventDto[];
  notes?: LeadNoteDto[];
  notesCount?: number;
}

export interface FunnelStageDto {
  stage: LeadStatus;
  count: number;
  conversionToNext: number | null;
  dropoffRate: number | null;
  avgDurationMinutes: number | null;
}

export interface FunnelAnalyticsDto {
  period: { from: string; to: string };
  funnel: FunnelStageDto[];
  overallConversionRate: number;
}

export interface LeadCountsResponseDto {
  counts: Record<LeadStatus, number>;
  totalActive: number;
  conversionRate: number;
  lostReasonsBreakdown?: Partial<Record<LeadLossReason, number>>;
}

export type LeadCountsDto = LeadCountsResponseDto;

export interface FilterLeadsParams {
  status?: LeadStatus;
  sourceChannel?: ChannelType;
  assignedStaffId?: string;
  lossReason?: LeadLossReason;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'lastActivityAt' | 'createdAt' | 'stageChangedAt' | 'score';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedLeadsResponse {
  data: LeadDto[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedTimelineResponse {
  data: LeadTimelineEventDto[];
  total: number;
  page: number;
  limit: number;
}

export const leadsApi = {
  getLeads: async (params?: FilterLeadsParams): Promise<PaginatedLeadsResponse> => {
    const { data } = await apiClient.get<PaginatedLeadsResponse>('/leads', { params });
    return data;
  },

  getCounts: async (): Promise<LeadCountsResponseDto> => {
    const { data } = await apiClient.get<LeadCountsResponseDto>('/leads/counts');
    return data;
  },

  getFunnel: async (params?: { from?: string; to?: string }): Promise<FunnelAnalyticsDto> => {
    const { data } = await apiClient.get<FunnelAnalyticsDto>('/leads/funnel', { params });
    return data;
  },

  getLead: async (id: string): Promise<LeadDetailDto> => {
    const { data } = await apiClient.get<LeadDetailDto>(`/leads/${id}`);
    return data;
  },

  getTimeline: async (
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedTimelineResponse> => {
    const { data } = await apiClient.get<PaginatedTimelineResponse>(`/leads/${id}/timeline`, { params });
    return data;
  },

  updateStatus: async (
    id: string,
    status: LeadStatus,
    opts?: { reason?: string; lossReason?: LeadLossReason | null }
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(`/leads/${id}/status`, {
      status,
      reason: opts?.reason,
      lossReason: opts?.lossReason,
    });
    return data;
  },

  qualifyLead: async (
    id: string,
    payload: {
      serviceInterest?: string;
      preferredStaffId?: string;
      budget?: number;
      notes?: string;
    }
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.post<{ code: string; message: string }>(`/leads/${id}/qualify`, payload);
    return data;
  },

  disqualifyLead: async (
    id: string,
    payload: {
      lossReason: LeadLossReason;
      lossNotes?: string;
    }
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.post<{ code: string; message: string }>(`/leads/${id}/disqualify`, payload);
    return data;
  },

  updateLead: async (
    id: string,
    payload: {
      name?: string;
      phone?: string;
      email?: string;
      assignedStaffId?: string | null;
      score?: number;
      nicheData?: Record<string, unknown>;
    }
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(`/leads/${id}`, payload);
    return data;
  },

  createNote: async (
    id: string,
    payload: { content: string; isPinned?: boolean }
  ): Promise<LeadNoteDto> => {
    const { data } = await apiClient.post<LeadNoteDto>(`/leads/${id}/notes`, payload);
    return data;
  },

  deleteNote: async (
    id: string,
    noteId: string
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.delete<{ code: string; message: string }>(`/leads/${id}/notes/${noteId}`);
    return data;
  },

  archiveLead: async (id: string): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.delete<{ code: string; message: string }>(`/leads/${id}`);
    return data;
  },
};

