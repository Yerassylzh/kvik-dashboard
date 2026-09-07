# 022 — Messaging Channel Connection Implementation Plan

> **Document Version:** 1.0  
> **Target Audience:** Backend Developers, Frontend Developers, QA  
> **Scope:** Authentication initialization, credential validation, webhook registration, and connection management for **WhatsApp (Cloud API v4 Embedded Signup)**, **Instagram (Facebook Login for Business)**, and **Telegram (BotFather Bot API)**.  
> **Reference Spec:** [`dev_docs/021_MESSAGING_CHANNEL_CONN_SPEC.md`](file:///c:/Users/Honor/Desktop/tech/web/kvik/kvik-backend/dev_docs/021_MESSAGING_CHANNEL_CONN_SPEC.md)

---

## 1. Executive Summary & Architecture

### 1.1 Scope & Boundaries
This implementation covers **channel connection and authentication initialization only**. Runtime message ingestion (webhooks parsing, AI message dispatch, chat routing) will be handled separately in the messaging engine.

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────────┐
│  Local Business │ ──1─> │ Frontend UI (React)  │ ──2─> │  Provider Dialog /  │
│      Owner      │       │                      │       │     BotFather       │
└─────────────────┘       └──────────────────────┘       └─────────────────────┘
                                     │                              │
                                   3. Code / Token                  │
                                     ▼                              │
                          ┌──────────────────────┐                  │
                          │   Backend API        │ <────────────────┘
                          │   (/channels/...)    │  4. Server-Side Exchange
                          └──────────────────────┘     & Webhook Subscriptions
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │   PostgreSQL DB      │
                          │   (Encrypted at Rest)│
                          └──────────────────────┘
```

### 1.2 Core Security Invariants
1. **No Client-Side Long-Lived Tokens**: Frontend only handles temporary OAuth authorization codes or user-entered bot tokens. All long-lived token exchanges and secret keys stay strictly server-side.
2. **Encryption at Rest**: Sensitive credentials (`accessToken`, `botToken`, `webhookSecret`) are encrypted using **AES-256-GCM** before saving to the database.
3. **No Sensitive Leaks**: API response DTOs **never** return raw access tokens or secrets to the client. Only sanitized metadata (e.g. username, phone number, status, expiresAt) is returned.

---

## 2. Database Schema Design (`Channel`)

We will update and extend the Prisma `Channel` model in [`prisma/schema.prisma`](file:///c:/Users/Honor/Desktop/tech/web/kvik/kvik-backend/prisma/schema.prisma):

```prisma
enum ChannelStatus {
  PENDING
  CONNECTED
  DISCONNECTED
  ERROR
  REVOKED
}

model Channel {
  id                String         @id @default(uuid())
  workspaceId       String
  workspace         Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  type              ChannelType    // WHATSAPP, INSTAGRAM, TELEGRAM
  status            ChannelStatus  @default(CONNECTED)
  externalAccountId String?        // WABA ID / Phone Number ID / IG Business Account ID / Telegram Bot ID
  credentials       Json           // Encrypted payload { encryptedToken, iv, authTag, ... }
  metadata          Json?          // Sanitized public info { phoneNumber, igUsername, botUsername, pageId, ... }
  tokenExpiresAt    DateTime?      // For Instagram (~60 days), null for Telegram/WhatsApp
  webhookSecret     String?        // Secret verification token (Telegram secret_token / Meta verify)
  active            Boolean        @default(true)
  lastError         String?        // Last connection or webhook error (if status == ERROR)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  conversations     Conversation[]

  @@unique([workspaceId, type])
  @@map("channels")
}
```

---

## 3. Frontend-Facing API Endpoints Reference

All endpoints require JWT Bearer Authentication (`Authorization: Bearer <accessToken>`).

```
Base URL: /api (or configured prefix)
Prefix:   /channels
```

### Overview Table

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/channels/meta/config` | Public Meta App configuration for Facebook JS SDK |
| `GET` | `/channels` | List all channels and their connection statuses for current workspace |
| `GET` | `/channels/:type` | Get status and details for a specific channel type |
| `POST` | `/channels/whatsapp/connect` | Connect WhatsApp via Cloud API v4 Embedded Signup |
| `POST` | `/channels/instagram/connect` | Connect Instagram via Facebook Login for Business |
| `POST` | `/channels/telegram/connect` | Connect Telegram via BotFather Bot Token |
| `POST` | `/channels/:type/disconnect` | Disconnect a channel and remove webhook subscriptions |
| `GET` | `/channels/:type/health` | Validate channel connection and token validity |

---

### Endpoint 1: `GET /channels/meta/config`
Provides configuration required by the frontend to initialize the Meta Facebook JS SDK.

- **Response `200 OK`**:
```json
{
  "appId": "123456789012345",
  "whatsappConfigId": "987654321098765",
  "apiVersion": "v26.0",
  "instagramScopes": [
    "instagram_basic",
    "instagram_manage_messages",
    "pages_show_list",
    "pages_manage_metadata"
  ]
}
```

---

### Endpoint 2: `GET /channels`
Lists all channels for the active workspace.

- **Response `200 OK`**:
```json
{
  "channels": [
    {
      "id": "a3b8e4f1-6c2d-4e5f-9a1b-2c3d4e5f6a7b",
      "type": "WHATSAPP",
      "status": "CONNECTED",
      "externalAccountId": "100234567890123",
      "metadata": {
        "wabaId": "100234567890123",
        "phoneNumberId": "105987654321098",
        "displayPhoneNumber": "+7 777 123 4567",
        "verifiedName": "Beauty Studio Almaty"
      },
      "tokenExpiresAt": null,
      "active": true,
      "createdAt": "2026-09-07T12:00:00.000Z",
      "updatedAt": "2026-09-07T12:00:00.000Z"
    },
    {
      "id": "b4c9e5f2-7d3e-5f6a-0b2c-3d4e5f6a7b8c",
      "type": "TELEGRAM",
      "status": "CONNECTED",
      "externalAccountId": "987654321",
      "metadata": {
        "botId": 987654321,
        "botUsername": "beautystudio_bot",
        "botFirstName": "Beauty Studio AI Bot",
        "botUrl": "https://t.me/beautystudio_bot"
      },
      "tokenExpiresAt": null,
      "active": true,
      "createdAt": "2026-09-07T12:05:00.000Z",
      "updatedAt": "2026-09-07T12:05:00.000Z"
    }
  ]
}
```

---

### Endpoint 3: `GET /channels/:type`
Returns status of a specific channel type (`WHATSAPP`, `INSTAGRAM`, or `TELEGRAM`).

- **Path Parameters**: `type` (`WHATSAPP` | `INSTAGRAM` | `TELEGRAM`)
- **Response `200 OK`**: Single channel object (as above).
- **Response `404 Not Found`**:
```json
{
  "statusCode": 404,
  "code": "channels.channel_not_found",
  "message": "Channel is not connected for this workspace",
  "isRaw": false
}
```

---

### Endpoint 4: `POST /channels/whatsapp/connect`
Connects WhatsApp using the short-lived code from Meta Embedded Signup popup.

- **Request Body**:
```json
{
  "code": "AQB...short_lived_auth_code_from_fb_login...",
  "wabaId": "100234567890123",
  "phoneNumberId": "105987654321098",
  "pin": "123456"
}
```
> `wabaId` and `phoneNumberId` are captured by the frontend from the `WA_EMBEDDED_SIGNUP` window message. `pin` is optional (defaults to `123456` if registering new phone).

- **Response `200 OK`**:
```json
{
  "code": "channels.whatsapp_connected",
  "message": "WhatsApp channel successfully connected",
  "channel": {
    "id": "a3b8e4f1-6c2d-4e5f-9a1b-2c3d4e5f6a7b",
    "type": "WHATSAPP",
    "status": "CONNECTED",
    "externalAccountId": "100234567890123",
    "metadata": {
      "wabaId": "100234567890123",
      "phoneNumberId": "105987654321098",
      "displayPhoneNumber": "+7 777 123 4567",
      "verifiedName": "Beauty Studio Almaty"
    },
    "active": true
  }
}
```

- **Error Codes**:
  - `400` `channels.whatsapp_code_expired` — The code expired (Meta codes expire in 30 seconds).
  - `400` `channels.whatsapp_registration_failed` — Phone registration failed on Meta Cloud API.
  - `400` `channels.whatsapp_subscription_failed` — Webhook subscription failed.

---

### Endpoint 5: `POST /channels/instagram/connect`
Connects Instagram Business account via Facebook Login for Business OAuth code.

- **Request Body**:
```json
{
  "code": "AQD...oauth_code_from_facebook_login...",
  "redirectUri": "https://app.kvik.kz/onboarding/channels/instagram/callback",
  "pageId": "109876543210123" 
}
```
> `pageId` is optional; if not provided, backend automatically selects the first Facebook Page that has a linked Instagram Business Account.

- **Response `200 OK`**:
```json
{
  "code": "channels.instagram_connected",
  "message": "Instagram channel successfully connected",
  "channel": {
    "id": "b4c9e5f2-7d3e-5f6a-0b2c-3d4e5f6a7b8c",
    "type": "INSTAGRAM",
    "status": "CONNECTED",
    "externalAccountId": "17841400123456789",
    "metadata": {
      "pageId": "109876543210123",
      "pageName": "Beauty Studio Almaty",
      "instagramId": "17841400123456789",
      "igUsername": "beauty_studio_ala",
      "name": "Beauty Studio Almaty"
    },
    "tokenExpiresAt": "2026-11-06T12:00:00.000Z",
    "active": true
  }
}
```

- **Error Codes**:
  - `400` `channels.instagram_no_page_found` — No Facebook Pages found for this user.
  - `400` `channels.instagram_no_business_account` — Facebook Page has no linked Instagram Business or Creator account.
  - `400` `channels.instagram_token_exchange_failed` — Failed to exchange token with Meta Graph API.

---

### Endpoint 6: `POST /channels/telegram/connect`
Connects Telegram Bot using Bot Token generated via `@BotFather`.

- **Request Body**:
```json
{
  "botToken": "7123456789:AAFlkjhsdf897sdf_example_token"
}
```

- **Response `200 OK`**:
```json
{
  "code": "channels.telegram_connected",
  "message": "Telegram bot successfully connected and webhook registered",
  "channel": {
    "id": "c5d0f6a3-8e4f-6a7b-1c3d-4e5f6a7b8c9d",
    "type": "TELEGRAM",
    "status": "CONNECTED",
    "externalAccountId": "7123456789",
    "metadata": {
      "botId": 7123456789,
      "botUsername": "beautystudio_bot",
      "botFirstName": "Beauty Studio Bot",
      "botUrl": "https://t.me/beautystudio_bot"
    },
    "tokenExpiresAt": null,
    "active": true
  }
}
```

- **Error Codes**:
  - `400` `channels.telegram_invalid_token` — Invalid bot token (Telegram API returned 401/404).
  - `400` `channels.telegram_webhook_failed` — Failed to set Telegram webhook with `setWebhook`.

---

### Endpoint 7: `POST /channels/:type/disconnect`
Disconnects the channel, revokes/cleans up webhooks, and updates status to `DISCONNECTED`.

- **Path Parameters**: `type` (`WHATSAPP` | `INSTAGRAM` | `TELEGRAM`)
- **Response `200 OK`**:
```json
{
  "code": "channels.channel_disconnected",
  "message": "Channel successfully disconnected",
  "type": "TELEGRAM"
}
```

---

### Endpoint 8: `GET /channels/:type/health`
Tests if the channel credential is valid and webhooks are active.

- **Response `200 OK`**:
```json
{
  "type": "TELEGRAM",
  "status": "CONNECTED",
  "isHealthy": true,
  "details": {
    "webhookUrl": "https://api.kvik.kz/webhooks/telegram/workspace-uuid",
    "hasCustomCertificate": false,
    "pendingUpdateCount": 0
  }
}
```

---

## 4. Channel-Specific Execution Flows

### 4.1 WhatsApp (Embedded Signup v4) Flow

```
1. Frontend loads Meta JS SDK: FB.init({ appId, version: 'v26.0' })
2. User clicks "Connect WhatsApp"
3. Frontend calls FB.login(callback, {
     config_id: '<META_WHATSAPP_CONFIG_ID>',
     response_type: 'code',
     override_default_response_type: true,
     extras: { setup: {} }
   })
4. Popup opens -> User selects/creates WABA and registers phone number.
5. Window message listener captures event:
   - type === 'WA_EMBEDDED_SIGNUP' && event === 'FINISH'
   - captures { waba_id, phone_number_id }
6. FB.login callback receives { authResponse: { code } } (Valid for 30s)
7. Frontend immediately calls POST /channels/whatsapp/connect
8. Backend executes:
   a. GET https://graph.facebook.com/v26.0/oauth/access_token
      ?client_id=<APP_ID>&client_secret=<APP_SECRET>&code=<code>
      -> Receives WABA System User / Business Access Token
   b. POST https://graph.facebook.com/v26.0/<WABA_ID>/subscribed_apps
      (Subscribes app to account_update & messages webhooks)
   c. POST https://graph.facebook.com/v26.0/<PHONE_NUMBER_ID>/register
      Body: { "messaging_product": "whatsapp", "pin": "123456" }
   d. GET https://graph.facebook.com/v26.0/<PHONE_NUMBER_ID>
      (Fetches display_phone_number, verified_name, quality_rating)
   e. Encrypts token with AES-256-GCM and persists Channel in DB.
9. Backend returns 200 OK with sanitized channel metadata.
```

---

### 4.2 Instagram (Facebook Login for Business) Flow

```
1. Frontend launches Facebook Login dialog with scopes:
   instagram_basic, instagram_manage_messages, pages_show_list, pages_manage_metadata
2. User selects Facebook Page and linked Instagram Business account -> returns code.
3. Frontend calls POST /channels/instagram/connect with { code, redirectUri }
4. Backend executes:
   a. Short-lived user token exchange:
      GET https://graph.facebook.com/v26.0/oauth/access_token
      ?client_id=<APP_ID>&client_secret=<APP_SECRET>&redirect_uri=<URI>&code=<code>
   b. Exchange for 60-day Long-Lived Token:
      GET https://graph.facebook.com/v26.0/oauth/access_token
      ?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>
      &fb_exchange_token=<SHORT_TOKEN>
   c. Resolve Facebook Pages:
      GET https://graph.facebook.com/v26.0/me/accounts?access_token=<LONG_TOKEN>
   d. For selected page, get Page Token & linked Instagram Business Account ID:
      GET https://graph.facebook.com/v26.0/<PAGE_ID>?fields=instagram_business_account,name,access_token
   e. Get Instagram profile details:
      GET https://graph.facebook.com/v26.0/<IG_BUSINESS_ID>?fields=username,name,profile_picture_url
   f. Subscribe Page to Instagram webhooks:
      POST https://graph.facebook.com/v26.0/<PAGE_ID>/subscribed_apps
      ?subscribed_fields=messages,messaging_postbacks
      Authorization: Bearer <PAGE_TOKEN>
   g. Encrypts Page Token and persists Channel (tokenExpiresAt = now + 60 days).
5. Backend returns 200 OK.
```

---

### 4.3 Telegram (Bot Token & Webhook Registration) Flow

```
1. Frontend shows step-by-step UI:
   - "Open Telegram and message @BotFather"
   - "Type /newbot and choose a name and username"
   - "Paste the generated token below"
2. User enters token and clicks "Connect Telegram"
3. Frontend calls POST /channels/telegram/connect with { botToken }
4. Backend executes:
   a. Token validation:
      GET https://api.telegram.org/bot<TOKEN>/getMe
      -> Extracts bot id, username, first_name
   b. Generate random secret_token (32 random chars [a-zA-Z0-9_-])
   c. Set Webhook:
      POST https://api.telegram.org/bot<TOKEN>/setWebhook
      Body: {
        "url": "https://<PUBLIC_BASE_URL>/webhooks/telegram/<workspaceId>",
        "secret_token": "<RANDOM_SECRET_TOKEN>",
        "allowed_updates": ["message", "callback_query"]
      }
   d. Verify webhook registration:
      GET https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   e. Encrypts botToken, stores externalAccountId=bot.id, webhookSecret, metadata in DB.
5. Backend returns 200 OK.
```

---

## 5. Environment Configuration

Add the following variables to `.env` and `.env.example`:

```env
# Encryption Key (32-byte hex for AES-256-GCM token encryption at rest)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Meta Graph API (WhatsApp & Instagram)
META_APP_ID="123456789012345"
META_APP_SECRET="abcdef0123456789abcdef0123456789"
META_WHATSAPP_CONFIG_ID="987654321098765"
META_API_VERSION="v26.0"

# Public API Base URL for Webhook callbacks (use ngrok URL during local development)
PUBLIC_APP_URL="https://your-domain.ngrok-free.app"
```

---

## 6. Translation Keys (`translation_keys_new.json`)

```json
{
  "api.channels.whatsapp_connected": "WhatsApp успешно подключен",
  "api.channels.instagram_connected": "Instagram успешно подключен",
  "api.channels.telegram_connected": "Telegram-бот успешно подключен",
  "api.channels.channel_disconnected": "Канал успешно отключен",
  "api.channels.channel_not_found": "Канал не найден или не подключен",
  "api.channels.whatsapp_code_expired": "Срок действия кода авторизации WhatsApp истек. Пожалуйста, повторите попытку.",
  "api.channels.whatsapp_registration_failed": "Не удалось зарегистрировать номер телефона в WhatsApp Cloud API.",
  "api.channels.whatsapp_subscription_failed": "Не удалось оформить подписку на вебхуки WhatsApp.",
  "api.channels.instagram_no_page_found": "Не найдено доступных страниц Facebook для данного аккаунта.",
  "api.channels.instagram_no_business_account": "К выбранной странице Facebook не привязан бизнес-аккаунт Instagram.",
  "api.channels.instagram_token_exchange_failed": "Не удалось обменять токен доступа Instagram.",
  "api.channels.telegram_invalid_token": "Указан неверный токен Telegram-бота. Проверьте токен в @BotFather.",
  "api.channels.telegram_webhook_failed": "Не удалось установить вебхук для Telegram-бота."
}
```

---

## 7. Implementation Checklist

### Phase 1: Database & Security Foundation
- [x] Add `ChannelStatus` enum to `prisma/schema.prisma`.
- [x] Extend `Channel` model with `status`, `externalAccountId`, `metadata`, `tokenExpiresAt`, `webhookSecret`, `lastError`.
- [x] Run Prisma migration / update Prisma client.
- [x] Implement `EncryptionService` (`src/common/utils/encryption.util.ts` or `src/common/services/encryption.service.ts`) using AES-256-GCM.
- [x] Add encryption key and Meta configuration to `src/config/env.config.ts`.

### Phase 2: Provider Clients & Services
- [x] Implement `MetaApiClient` (`src/modules/channels/providers/meta-api.client.ts`):
  - `exchangeCodeForToken(code, redirectUri?)`
  - `getLongLivedToken(shortToken)`
  - `subscribeWaba(wabaId, token)`
  - `registerPhoneNumber(phoneNumberId, pin, token)`
  - `getPhoneNumberDetails(phoneNumberId, token)`
  - `getUserPages(userToken)`
  - `getPageInstagramAccount(pageId, pageToken)`
  - `subscribePage(pageId, pageToken)`
  - `getInstagramDetails(igId, token)`
- [x] Implement `TelegramApiClient` (`src/modules/channels/providers/telegram-api.client.ts`):
  - `getMe(botToken)`
  - `setWebhook(botToken, url, secretToken)`
  - `getWebhookInfo(botToken)`
  - `deleteWebhook(botToken)`

### Phase 3: Channels Module & Controllers
- [x] Create `ChannelsModule` (`src/modules/channels/channels.module.ts`).
- [x] Implement DTOs with Swagger annotations and JSDoc:
  - `ConnectWhatsAppDto`
  - `ConnectInstagramDto`
  - `ConnectTelegramDto`
  - `ChannelResponseDto`, `ChannelsListResponseDto`, `MetaConfigResponseDto`
- [x] Implement `ChannelsService` (`src/modules/channels/channels.service.ts`):
  - `getMetaConfig()`
  - `listChannels(workspaceId)`
  - `getChannel(workspaceId, type)`
  - `connectWhatsApp(workspaceId, dto)`
  - `connectInstagram(workspaceId, dto)`
  - `connectTelegram(workspaceId, dto)`
  - `disconnectChannel(workspaceId, type)`
  - `checkChannelHealth(workspaceId, type)`
- [x] Implement `ChannelsController` (`src/modules/channels/channels.controller.ts`) with Swagger docs.
- [x] Bridge `POST /onboarding/step/channel` in `OnboardingModule` with `ChannelsService`.

### Phase 4: Localization & Error Handling
- [x] Register all new translation keys in `translation_keys_new.json`.
- [x] Ensure all exceptions thrown in `ChannelsService` use the i18n envelope (`code`, `message`, `isRaw`).

### Phase 5: Verification & Testing
- [x] Verify test flows for WhatsApp, Instagram, and Telegram using ngrok HTTPS URL.
- [x] Run `npm run generate:swagger` to regenerate `openapi.json`.
- [x] Verify TypeScript build (`npm run build`) and test suite.
