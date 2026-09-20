import { apiClient } from './client';

export type RoundRobinStrategy = 'LEAST_LOADED' | 'CIRCULAR' | 'WEIGHTED';

export interface RoundRobinStaffEntry {
  id: string;
  name: string;
  systemRole: string;
  specializations: string[];
  roundRobinEnabled: boolean;
  roundRobinWeight: number;
  lastAssignedAt: string | null;
  activeBookingsToday: number;
}

export interface RoundRobinSettings {
  roundRobinEnabled: boolean;
  strategy: RoundRobinStrategy;
  matchSpecialization: boolean;
  considerWeeklyLoad: boolean;
  staff: RoundRobinStaffEntry[];
}

export interface UpdateRoundRobinSettingsPayload {
  roundRobinEnabled?: boolean;
  strategy?: RoundRobinStrategy;
  matchSpecialization?: boolean;
  considerWeeklyLoad?: boolean;
}

export const roundRobinApi = {
  getSettings: async (): Promise<RoundRobinSettings> => {
    const { data } = await apiClient.get<RoundRobinSettings>(
      '/workspaces/settings/round-robin'
    );
    return data;
  },

  updateSettings: async (
    payload: UpdateRoundRobinSettingsPayload
  ): Promise<{ code: string; message: string; settings: Omit<RoundRobinSettings, 'staff'> }> => {
    const { data } = await apiClient.put('/workspaces/settings/round-robin', payload);
    return data;
  },
};
