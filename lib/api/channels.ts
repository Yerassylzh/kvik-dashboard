import { apiClient } from './client';
import {
  MetaConfig,
  ChannelListResponse,
  ChannelConnectResponse,
  ChannelDisconnectResponse,
  ChannelHealthResponse,
  ChannelType,
  ConnectWhatsAppDto,
  ConnectInstagramDto,
  ConnectTelegramDto,
} from '@/types/channels';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Fetches Meta App config (appId, whatsappConfigId, apiVersion, scopes) for FB JS SDK. */
export async function getMetaConfig(): Promise<MetaConfig> {
  const { data } = await apiClient.get<MetaConfig>('/channels/meta/config');
  return data;
}

// ---------------------------------------------------------------------------
// Channel list & status
// ---------------------------------------------------------------------------

/** Lists all connected channels for the current workspace. */
export async function listChannels(): Promise<ChannelListResponse> {
  const { data } = await apiClient.get<ChannelListResponse>('/channels');
  return data;
}

/** Gets status & metadata for a specific channel type. Throws 404 if not connected. */
export async function getChannel(type: ChannelType) {
  const { data } = await apiClient.get(`/channels/${type}`);
  return data;
}

// ---------------------------------------------------------------------------
// Connect
// ---------------------------------------------------------------------------

/** Connects WhatsApp via Cloud API Embedded Signup v4. */
export async function connectWhatsApp(
  dto: ConnectWhatsAppDto
): Promise<ChannelConnectResponse> {
  const { data } = await apiClient.post<ChannelConnectResponse>(
    '/channels/whatsapp/connect',
    dto
  );
  return data;
}

/** Connects Instagram via Direct Instagram Business Login OAuth. */
export async function connectInstagram(
  dto: ConnectInstagramDto
): Promise<ChannelConnectResponse> {
  const { data } = await apiClient.post<ChannelConnectResponse>(
    '/channels/instagram/connect',
    dto
  );
  return data;
}

/** Connects Telegram bot via BotFather token. */
export async function connectTelegram(
  dto: ConnectTelegramDto
): Promise<ChannelConnectResponse> {
  const { data } = await apiClient.post<ChannelConnectResponse>(
    '/channels/telegram/connect',
    dto
  );
  return data;
}

// ---------------------------------------------------------------------------
// Disconnect & Health
// ---------------------------------------------------------------------------

/** Disconnects a channel and removes webhook subscriptions. */
export async function disconnectChannel(
  type: ChannelType
): Promise<ChannelDisconnectResponse> {
  const { data } = await apiClient.post<ChannelDisconnectResponse>(
    `/channels/${type}/disconnect`
  );
  return data;
}

/** Checks if a channel credential is still valid and webhooks are active. */
export async function checkChannelHealth(
  type: ChannelType
): Promise<ChannelHealthResponse> {
  const { data } = await apiClient.get<ChannelHealthResponse>(
    `/channels/${type}/health`
  );
  return data;
}
