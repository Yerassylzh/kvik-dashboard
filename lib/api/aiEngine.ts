import { apiClient } from './client';

export interface AiConfigDto {
  nicheProfile?: string;
  systemPromptPreview?: string;
  followUpEnabled?: boolean;
  followUp24hEnabled?: boolean;
  followUp72hEnabled?: boolean;
  liveOverflowTimeoutSeconds?: number;
  customInstructions?: string;
}

export interface AiTestResponseDto {
  response: string;
  ragChunksUsed: number;
  latencyMs: number;
}

export interface UpdateAiConfigPayload {
  followUpEnabled?: boolean;
  followUp24hEnabled?: boolean;
  followUp72hEnabled?: boolean;
  liveOverflowTimeoutSeconds?: number;
  customInstructions?: string;
}

export const aiEngineApi = {
  getConfig: async (): Promise<AiConfigDto> => {
    const { data } = await apiClient.get<AiConfigDto>('/ai-engine/config');
    return data;
  },

  updateConfig: async (
    payload: UpdateAiConfigPayload
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(
      '/ai-engine/config',
      payload
    );
    return data;
  },

  testMessage: async (message: string): Promise<AiTestResponseDto> => {
    const { data } = await apiClient.post<AiTestResponseDto>('/ai-engine/test', { message });
    return data;
  },
};
