import { apiClient } from './client';

export interface StaffDto {
  id: string;
  name: string;
  role?: string | null;
  specializations?: string[] | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
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
  specializations?: string[];
  phone?: string;
  email?: string;
  avatarUrl?: string;
}

export interface UpdateStaffPayload {
  name?: string;
  role?: string;
  specializations?: string[];
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isActive?: boolean;
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
};
