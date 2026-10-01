export interface AiToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
}

export interface AiToolParameterSchema {
  type: string;
  required?: string[];
  properties?: Record<string, AiToolParameterProperty>;
}

export interface AiToolDto {
  name: string;
  description: string;
  enabled: boolean;
  customDescription?: string;
  parameters?: AiToolParameterSchema;
}

export interface AiToolsResponseDto {
  tools: AiToolDto[];
}

export interface PromptPreviewDto {
  nicheProfile?: string;
  todayStr?: string;
  dayOfWeek?: string;
  businessContext?: Record<string, unknown>;
  customInstructions?: string;
  compiledSystemPrompt: string;
  totalPromptTokensEstimate?: number;
}

export interface ToolCallExecution {
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface AiTestResponseDto {
  response: string;
  toolCallsCount?: number;
  toolCalls?: ToolCallExecution[];
  ragChunksUsed?: number;
  latencyMs: number;
}

export interface AiConfigDto {
  nicheProfile?: string;
  systemPromptPreview?: string;
  followUpEnabled?: boolean;
  followUp24hEnabled?: boolean;
  followUp72hEnabled?: boolean;
  liveOverflowTimeoutSeconds?: number;
  customInstructions?: string;
}

export interface UpdateAiConfigPayload {
  followUpEnabled?: boolean;
  followUp24hEnabled?: boolean;
  followUp72hEnabled?: boolean;
  liveOverflowTimeoutSeconds?: number;
  customInstructions?: string;
}

export interface UpdateToolConfigPayload {
  enabled: boolean;
  customDescription?: string;
}
