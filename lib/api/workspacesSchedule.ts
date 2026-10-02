import { apiClient } from './client';

export interface WorkspaceScheduleTemplateDto {
  id?: string;
  workspaceId?: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "19:00"
  isOpen?: boolean;
  isWorking?: boolean;
  slotDuration?: number; // in minutes (default: 60)
  slotDurationMinutes?: number;
}

export interface WorkspaceScheduleOverrideDto {
  id: string;
  workspaceId?: string;
  date: string; // YYYY-MM-DD
  isClosed: boolean;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface WorkspaceScheduleResponse {
  templates: WorkspaceScheduleTemplateDto[];
  overrides: WorkspaceScheduleOverrideDto[];
}

export interface SetWorkspaceSchedulePayload {
  templates: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isOpen: boolean;
    slotDuration?: number;
  }>;
}

export interface AddWorkspaceOverridePayload {
  date: string; // YYYY-MM-DD
  isClosed?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export const workspacesScheduleApi = {
  getSchedule: async (from?: string, to?: string): Promise<WorkspaceScheduleResponse> => {
    const { data } = await apiClient.get<WorkspaceScheduleResponse>('/workspaces/schedule', {
      params: from || to ? { from, to } : undefined,
    });
    return data;
  },

  setSchedule: async (
    payload: SetWorkspaceSchedulePayload
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.put<{ code: string; message: string }>(
      '/workspaces/schedule',
      payload
    );
    return data;
  },

  addOverride: async (
    payload: AddWorkspaceOverridePayload
  ): Promise<WorkspaceScheduleOverrideDto> => {
    const { data } = await apiClient.post<WorkspaceScheduleOverrideDto>(
      '/workspaces/schedule/overrides',
      payload
    );
    return data;
  },

  removeOverride: async (
    id: string
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.delete<{ code: string; message: string }>(
      `/workspaces/schedule/overrides/${id}`
    );
    return data;
  },
};
