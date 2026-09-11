import { apiClient } from './client';

export type LeadStatus = 'NEW' | 'QUALIFIED' | 'APPOINTMENT_SET' | 'DEAL_WON' | 'DEAL_LOST';
export type ChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM';

export interface LeadDto {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  sourceChannel?: ChannelType | null;
  status: LeadStatus;
  nicheData?: Record<string, unknown> | null;
  lastActivityAt: string;
  createdAt: string;
}

export interface LeadDetailDto extends LeadDto {
  conversations?: Array<{
    id: string;
    channelType: ChannelType;
    status: string;
    lastMessageAt: string;
  }>;
  bookings?: Array<{
    id: string;
    serviceName?: string;
    startTime: string;
    status: string;
  }>;
}

export type LeadCountsDto = Record<LeadStatus, number>;

export interface FilterLeadsParams {
  status?: LeadStatus;
  sourceChannel?: ChannelType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'lastActivityAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedLeadsResponse {
  data: LeadDto[];
  total: number;
  page: number;
  limit: number;
}

export const leadsApi = {
  getLeads: async (params?: FilterLeadsParams): Promise<PaginatedLeadsResponse> => {
    const { data } = await apiClient.get<PaginatedLeadsResponse>('/leads', { params });
    return data;
  },

  getCounts: async (): Promise<LeadCountsDto> => {
    const { data } = await apiClient.get<LeadCountsDto>('/leads/counts');
    return data;
  },

  getLead: async (id: string): Promise<LeadDetailDto> => {
    const { data } = await apiClient.get<LeadDetailDto>(`/leads/${id}`);
    return data;
  },

  updateStatus: async (id: string, status: LeadStatus): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(`/leads/${id}/status`, {
      status,
    });
    return data;
  },

  updateLead: async (
    id: string,
    payload: {
      name?: string;
      phone?: string;
      email?: string;
      nicheData?: Record<string, unknown>;
    }
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(`/leads/${id}`, payload);
    return data;
  },

  archiveLead: async (id: string): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.delete<{ code: string; message: string }>(`/leads/${id}`);
    return data;
  },
};
