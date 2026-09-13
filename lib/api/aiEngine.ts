import { apiClient } from './client';
import type {
  AiConfigDto,
  AiTestResponseDto,
  UpdateAiConfigPayload,
  AiToolsResponseDto,
  UpdateToolConfigPayload,
  PromptPreviewDto,
} from '@/types/aiEngine';

export * from '@/types/aiEngine';

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

  getTools: async (): Promise<AiToolsResponseDto> => {
    const { data } = await apiClient.get<AiToolsResponseDto>('/ai-engine/tools');
    return data;
  },

  updateTool: async (
    toolName: string,
    payload: UpdateToolConfigPayload
  ): Promise<{ code: string; name: string; enabled: boolean }> => {
    const { data } = await apiClient.patch<{ code: string; name: string; enabled: boolean }>(
      `/ai-engine/tools/${toolName}`,
      payload
    );
    return data;
  },

  getPromptPreview: async (): Promise<PromptPreviewDto> => {
    const { data } = await apiClient.get<PromptPreviewDto>('/ai-engine/prompt-preview');
    return data;
  },

  testMessage: async (message: string): Promise<AiTestResponseDto> => {
    const { data } = await apiClient.post<AiTestResponseDto>('/ai-engine/test', { message });
    return data;
  },
};
