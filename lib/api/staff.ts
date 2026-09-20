import { apiClient } from './client';
import { SystemRole } from '@/types/auth';

export type InviteStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'REVOKED';

export interface StaffDto {
  id: string;
  workspaceId: string;
  userId?: string | null;
  name: string;
  role?: string | null;
  systemRole: SystemRole;
  specializations?: string[] | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  hasDashboardAccess: boolean;
  inviteStatus: InviteStatus;
  createdAt: string;
  // Round Robin fields
  roundRobinEnabled?: boolean;
  roundRobinWeight?: number;
  lastAssignedAt?: string | null;
}

export interface AvailabilityTemplateDto {
  staffId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

export interface AvailabilityOverrideDto {
  id?: string;
  staffId?: string;
  date: string;
  isBlocked: boolean;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface StaffScheduleResponse {
  templates: AvailabilityTemplateDto[];
  overrides: AvailabilityOverrideDto[];
}

export interface CreateStaffPayload {
  name: string;
  role?: string;
  systemRole?: SystemRole;
  specializations?: string[];
  phone?: string;
  email?: string;
  avatarUrl?: string;
  sendInvite?: boolean;
}

export interface UpdateStaffPayload {
  name?: string;
  role?: string;
  systemRole?: SystemRole;
  specializations?: string[];
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface UpdateStaffRoundRobinPayload {
  roundRobinEnabled?: boolean;
  roundRobinWeight?: number;
}

export interface InviteStaffPayload {
  email?: string;
  systemRole?: SystemRole;
}

export interface SetScheduleTemplateItem {
  dayOfWeek: number; // 0=Sun..6=Sat
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  slotDuration: number;
}

export interface AddOverridePayload {
  date: string; // YYYY-MM-DD
  isBlocked: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export const staffApi = {
  getStaff: async (isActive?: boolean): Promise<StaffDto[]> => {
    const { data } = await apiClient.get<StaffDto[]>('/staff', {
      params: isActive !== undefined ? { isActive } : undefined,
    });
    return data;
  },

  getStaffById: async (id: string): Promise<StaffDto> => {
    const { data } = await apiClient.get<StaffDto>(`/staff/${id}`);
    return data;
  },

  createStaff: async (payload: CreateStaffPayload): Promise<StaffDto> => {
    const { data } = await apiClient.post<StaffDto>('/staff', payload);
    return data;
  },

  updateStaff: async (
    id: string,
    payload: UpdateStaffPayload
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(`/staff/${id}`, payload);
    return data;
  },

  deactivateStaff: async (id: string): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.delete<{ code: string; message: string }>(`/staff/${id}`);
    return data;
  },

  inviteStaff: async (
    id: string,
    payload?: InviteStaffPayload
  ): Promise<{ code: string; message: string; expiresAt?: string }> => {
    const { data } = await apiClient.post<{ code: string; message: string; expiresAt?: string }>(
      `/staff/${id}/invite`,
      payload || {}
    );
    return data;
  },

  revokeInvite: async (id: string): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.delete<{ code: string; message: string }>(`/staff/${id}/invite`);
    return data;
  },

  updateRoundRobin: async (
    id: string,
    payload: UpdateStaffRoundRobinPayload
  ): Promise<{ code: string; message: string; staffId: string; roundRobinEnabled: boolean; roundRobinWeight: number }> => {
    const { data } = await apiClient.patch(`/staff/${id}/round-robin`, payload);
    return data;
  },

  getSchedule: async (
    id: string,
    from?: string,
    to?: string
  ): Promise<StaffScheduleResponse> => {
    const { data } = await apiClient.get<StaffScheduleResponse>(`/staff/${id}/schedule`, {
      params: { from, to },
    });
    return data;
  },

  setSchedule: async (
    id: string,
    templates: SetScheduleTemplateItem[]
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.put<{ code: string; message: string }>(`/staff/${id}/schedule`, {
      templates,
    });
    return data;
  },

  addOverride: async (
    id: string,
    payload: AddOverridePayload
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.post<{ code: string; message: string }>(
      `/staff/${id}/overrides`,
      payload
    );
    return data;
  },

  removeOverride: async (
    id: string,
    overrideId: string
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.delete<{ code: string; message: string }>(
      `/staff/${id}/overrides/${overrideId}`
    );
    return data;
  },

  resetSchedule: async (id: string): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.delete<{ code: string; message: string }>(
      `/staff/${id}/schedule`
    );
    return data;
  },
};

