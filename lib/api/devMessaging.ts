import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM';

export interface MockChannel {
  id: string;
  type: ChannelType;
  status: string;
  externalAccountId: string;
}

export interface ProvisionResponse {
  code: string;
  message: string;
  channels: MockChannel[];
}

export interface SimulateInboundRequest {
  channelType: ChannelType;
  senderId?: string;
  senderName?: string;
  text: string;
}

export interface SimulateInboundResponse {
  code: string;
  message: string;
  conversationId: string;
  leadId: string;
}

export interface DevMessage {
  id: string;
  conversationId: string;
  role: 'USER' | 'BOT' | 'MANAGER' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface DevLead {
  id: string;
  name?: string | null;
  phone?: string | null;
  status?: string;
}

export interface ConversationMessagesResponse {
  conversationId: string;
  status: string;
  channelType: ChannelType;
  lead?: DevLead | null;
  messages: DevMessage[];
  total: number;
  page: number;
  limit: number;
}

export interface GetConversationMessagesParams {
  page?: number;
  limit?: number;
}

export interface GetConversationBySenderParams {
  channelType: ChannelType;
  senderId: string;
  page?: number;
  limit?: number;
}

export interface ResetConversationResponse {
  code: string;
  message: string;
}

/** Auto-creates mock WHATSAPP, INSTAGRAM, TELEGRAM channels for the workspace. */
export async function provisionMockChannels(): Promise<ProvisionResponse> {
  const { data } = await apiClient.post<ProvisionResponse>('/dev-messaging/provision');
  return data;
}

/** Simulates an inbound client message through the full orchestration pipeline. */
export async function simulateInbound(
  payload: SimulateInboundRequest
): Promise<SimulateInboundResponse> {
  const { data } = await apiClient.post<SimulateInboundResponse>(
    '/dev-messaging/simulate-inbound',
    payload
  );
  return data;
}

/** Resets a conversation to BOT_ACTIVE status for re-testing. */
export async function resetConversation(
  conversationId: string
): Promise<ResetConversationResponse> {
  const { data } = await apiClient.post<ResetConversationResponse>(
    `/dev-messaging/reset-conversation/${conversationId}`
  );
  return data;
}

/** Retrieves message history for a conversation by conversationId. */
export async function getDevConversationMessages(
  conversationId: string,
  params?: GetConversationMessagesParams
): Promise<ConversationMessagesResponse> {
  const { data } = await apiClient.get<ConversationMessagesResponse>(
    `/dev-messaging/conversations/${conversationId}/messages`,
    { params }
  );
  return data;
}

/** Retrieves message history for the active conversation of a specific channelType and senderId. */
export async function getDevConversationBySender(
  params: GetConversationBySenderParams
): Promise<ConversationMessagesResponse> {
  const { data } = await apiClient.get<ConversationMessagesResponse>(
    '/dev-messaging/conversation-by-sender',
    { params }
  );
  return data;
}

