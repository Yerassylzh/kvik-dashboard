/**
 * Channel connection types.
 *
 * Contract source: dev_docs/backend/022_MESSAGING_CHANNEL_CONN_PLAN.md
 * Covers WhatsApp (Embedded Signup v4), Instagram (Facebook Login for Business),
 * and Telegram (BotFather Bot API).
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type ChannelType = "WHATSAPP" | "INSTAGRAM" | "TELEGRAM";

export type ChannelStatus =
  | "PENDING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR"
  | "REVOKED";

// ---------------------------------------------------------------------------
// Channel entity (returned by GET /channels and GET /channels/:type)
// ---------------------------------------------------------------------------

export interface WhatsAppChannelMetadata {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
}

export interface InstagramChannelMetadata {
  pageId: string;
  pageName?: string;
  instagramId: string;
  igUsername?: string;
  name?: string;
  profilePictureUrl?: string;
}

export interface TelegramChannelMetadata {
  botId: number;
  botUsername: string;
  botFirstName?: string;
  botUrl?: string;
}

export type ChannelMetadata =
  | WhatsAppChannelMetadata
  | InstagramChannelMetadata
  | TelegramChannelMetadata
  | Record<string, unknown>;

export interface Channel {
  id: string;
  type: ChannelType;
  status: ChannelStatus;
  externalAccountId?: string | null;
  metadata?: ChannelMetadata | null;
  tokenExpiresAt?: string | null;
  active: boolean;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API Responses
// ---------------------------------------------------------------------------

export interface MetaConfig {
  appId: string;
  whatsappConfigId: string;
  apiVersion: string;
  instagramScopes: string[];
}

export interface ChannelListResponse {
  channels: Channel[];
}

export interface ChannelConnectResponse {
  code: string;
  message: string;
  channel: Channel;
}

export interface ChannelDisconnectResponse {
  code: string;
  message: string;
  type: ChannelType;
}

export interface ChannelHealthResponse {
  type: ChannelType;
  status: ChannelStatus;
  isHealthy: boolean;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// DTOs (request bodies)
// ---------------------------------------------------------------------------

export interface ConnectWhatsAppDto {
  code: string;
  wabaId?: string;
  phoneNumberId?: string;
  pin?: string;
  redirectUri?: string;
}

export interface ConnectInstagramDto {
  code: string;
  redirectUri?: string;
  pageId?: string;
}

export interface ConnectTelegramDto {
  botToken: string;
}

// ---------------------------------------------------------------------------
// Meta FB JS SDK globals (minimal shape used by WhatsApp / Instagram flows)
// ---------------------------------------------------------------------------

export interface FbAuthResponse {
  code?: string;
  accessToken?: string;
  userID?: string;
  expiresIn?: number;
}

export interface FbLoginResponse {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: FbAuthResponse;
}

export interface FbLoginOptions {
  config_id?: string;
  response_type?: string;
  override_default_response_type?: boolean;
  scope?: string;
  extras?: Record<string, unknown>;
}

declare global {
  interface Window {
    FB?: {
      init(params: {
        appId: string;
        autoLogAppEvents?: boolean;
        xfbml?: boolean;
        version: string;
      }): void;
      login(
        callback: (response: FbLoginResponse) => void,
        options?: FbLoginOptions
      ): void;
    };
    fbAsyncInit?: () => void;
  }
}
