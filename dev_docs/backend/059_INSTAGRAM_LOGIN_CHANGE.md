# 059_INSTAGRAM_LOGIN_CHANGE: Migration to Direct Instagram Business Login

## 1. Executive Summary & Context

Currently, the Instagram channel connection in `kvik-backend` uses the legacy **Facebook Login for Business** flow (`getUserPages` / `POST /{pageId}/subscribed_apps`), requiring users to:
1. Have and log into a Facebook account.
2. Own a Facebook Page.
3. Have that Facebook Page linked to an Instagram Business account.

This causes significant friction, permissions errors, and webhook routing failures.

This plan details the complete migration to **"Instagram API with Instagram Business Login"** (Direct Instagram OAuth). Workspace owners connect directly with their Instagram credentials without ever interacting with Facebook.

---

## 2. Technical Architecture & Endpoints Matrix

| Component / Action | Legacy (Facebook Login) | Modern (Instagram Business Login) | Exact Meta Endpoint & Protocol |
|---|---|---|---|
| **User Login** | Facebook Login Popup | Instagram Login Popup / Redirect | `https://www.instagram.com/oauth/authorize` |
| **Short-Lived Token Exchange** | Graph API `/oauth/access_token` | Instagram OAuth Token Endpoint | `POST https://api.instagram.com/oauth/access_token` (`Content-Type: application/x-www-form-urlencoded`) |
| **Long-Lived Token Exchange** | Graph API `grant_type=fb_exchange_token` | Graph Instagram Token Exchange | `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret={SECRET}&access_token={SHORT_TOKEN}` |
| **User Profile Details** | Graph API `/{igBusinessId}` | Graph Instagram User Node | `GET https://graph.instagram.com/v21.0/me?fields=id,username,name,profile_picture_url&access_token={LONG_TOKEN}` |
| **Webhook Subscription** | `POST /{page-id}/subscribed_apps` | Graph Instagram User Node | `POST https://graph.instagram.com/v21.0/me/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token={LONG_TOKEN}` |
| **Webhook Unsubscription** | `DELETE /{page-id}/subscribed_apps` | Graph Instagram User Node | `DELETE https://graph.instagram.com/v21.0/me/subscribed_apps?access_token={LONG_TOKEN}` |
| **Outbound Messages** | `POST /{page-id}/messages` | Graph Instagram Messages Node | `POST https://graph.instagram.com/v21.0/me/messages` (Headers: `Authorization: Bearer {LONG_TOKEN}`) |
| **Inbound Webhook Payload** | `object: "instagram"`, `entry[0].id` | `object: "instagram"`, `entry[0].id` | Identical payload structure — 100% backward compatible |

---

## 3. Detailed Backend Implementation Specifications

### 3.1. Environment Configuration (`src/config/env.config.ts` & `.env.example`)
Add Instagram App credentials alongside Meta credentials:
```typescript
INSTAGRAM_APP_ID: z.string().optional(),
INSTAGRAM_APP_SECRET: z.string().optional(),
```
- `INSTAGRAM_APP_ID`: The Instagram App ID shown in the Meta Developer Dashboard under *Instagram API → API setup with Instagram login* (e.g., `1013621005086662`).
- `INSTAGRAM_APP_SECRET`: The Instagram App Secret associated with that Instagram App ID.
- Existing `INSTAGRAM_VERIFY_TOKEN` and `META_VERIFY_TOKEN` remain active for webhook challenge verification.

### 3.2. Public Meta/Instagram Config (`src/modules/channels/channels.service.ts` & `MetaConfigResponseDto`)
Update `getMetaConfig()` to output Instagram-specific parameters for the frontend:
```typescript
export class MetaConfigResponseDto {
  appId?: string;
  instagramAppId?: string; // NEW
  whatsappConfigId?: string;
  apiVersion: string;
  instagramScopes: string[];
}
```
Scopes updated to:
```typescript
instagramScopes: [
  'instagram_business_basic',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
]
```

### 3.3. DTO Updates (`src/modules/channels/dto/connect-instagram.dto.ts`)
- `code`: string (authorization code received from Instagram OAuth callback).
- `redirectUri`: string (exact redirect URI used during the authorization request).
- `pageId`: Make optional or omit entirely (no Facebook Page is involved in this flow).

### 3.4. Instagram Graph API Client (`src/modules/channels/providers/meta/instagram-graph-api.client.ts`)
Refactor the client to target Instagram endpoints:

1. **`exchangeUserCode(code: string, redirectUri: string)`**:
   - Sends `POST https://api.instagram.com/oauth/access_token`.
   - Body form-urlencoded:
     - `client_id`: `INSTAGRAM_APP_ID`
     - `client_secret`: `INSTAGRAM_APP_SECRET`
     - `grant_type`: `'authorization_code'`
     - `redirect_uri`: `redirectUri`
     - `code`: `code`
   - Returns `{ accessToken: string, userId: string }`.

2. **`getLongLivedToken(shortToken: string)`**:
   - Sends `GET https://graph.instagram.com/access_token`.
   - Params:
     - `grant_type`: `'ig_exchange_token'`
     - `client_secret`: `INSTAGRAM_APP_SECRET`
     - `access_token`: `shortToken`
   - Returns `{ accessToken: string, tokenType: string, expiresIn: number }` (approx. 5,184,000 seconds / 60 days).

3. **`getInstagramDetails(accessToken: string)`**:
   - Sends `GET https://graph.instagram.com/v21.0/me`.
   - Params:
     - `fields`: `'id,username,name,profile_picture_url'`
     - `access_token`: `accessToken`
   - Returns `{ id: string, username: string, name?: string, profilePictureUrl?: string }`.

4. **`subscribeAccount(accessToken: string)`**:
   - Sends `POST https://graph.instagram.com/v21.0/me/subscribed_apps`.
   - Params:
     - `subscribed_fields`: `'messages,messaging_postbacks'`
     - `access_token`: `accessToken`
   - Returns `boolean` (`response.data?.success === true`).

5. **`unsubscribeAccount(accessToken: string)`**:
   - Sends `DELETE https://graph.instagram.com/v21.0/me/subscribed_apps`.
   - Params:
     - `access_token`: `accessToken`
   - Returns `boolean`.

### 3.5. Channel Service (`src/modules/channels/services/instagram-channel.service.ts`)
Streamline `connect()` to remove all Facebook Page fetching:
1. `shortToken = await this.instagramClient.exchangeUserCode(dto.code, dto.redirectUri)`
2. `longToken = await this.instagramClient.getLongLivedToken(shortToken.accessToken)`
3. `igDetails = await this.instagramClient.getInstagramDetails(longToken.accessToken)`
4. `await this.instagramClient.subscribeAccount(longToken.accessToken)`
5. Encrypt credentials: `{ accessToken: longToken.accessToken }`
6. Prepare metadata:
   ```typescript
   const metadata: InstagramMetadata = {
     instagramId: igDetails.id,
     igUsername: igDetails.username,
     name: igDetails.name,
     profilePictureUrl: igDetails.profilePictureUrl,
   };
   ```
7. Upsert channel in `ChannelsRepository`:
   - `type`: `ChannelType.INSTAGRAM`
   - `status`: `ChannelStatus.CONNECTED`
   - `externalAccountId`: `igDetails.id`
   - `credentials`: encrypted payload
   - `metadata`: metadata JSON
   - `tokenExpiresAt`: Date calculated from `longToken.expiresIn`

### 3.6. Messaging Adapter (`src/modules/channels/adapters/instagram-messaging.adapter.ts`)
- **Outbound Text (`sendTextMessage`) & Media (`sendMediaMessage`)**:
  - URL: `https://graph.instagram.com/v21.0/me/messages`
  - Headers: `Authorization: Bearer <accessToken>`, `Content-Type: application/json`
  - Payload: `{ recipient: { id: recipientId }, message: { text: "..." } }`
- **Inbound Webhook Parsing (`parseIncomingWebhook`)**:
  - No changes needed. Payload format from Meta is identical:
    - `rawPayload.entry[].id` → `externalAccountId` (matches `Channel.externalAccountId` = `igDetails.id`).
    - `messaging[].sender.id` → `senderId` (Customer Instagram Scoped ID).
    - `messaging[].message` → `mid`, `text`, `attachments`.

---

## 4. System Integrity & Backward Compatibility Guarantees

To ensure other features and messaging channels are not disrupted:
1. **WhatsApp Cloud API**: Remains 100% untouched (`WhatsAppChannelService`, `WhatsAppMessagingAdapter`).
2. **Telegram Bot Channel**: Remains 100% untouched (`TelegramChannelService`, `TelegramMessagingAdapter`).
3. **Dev Mock Messaging**: Remains 100% untouched (`ENABLE_DEV_MESSAGING`).
4. **AI Engine Orchestrator**: `UnifiedIncomingMessageDto` contract is preserved; inbound AI handling, prompt generation, and tool invocations operate identically.
5. **Conversations & Unified Inbox**: `IChannelMessagingAdapter` interface signatures remain intact; manual agent replies and follow-ups work without modification.
6. **Follow-Up Dispatcher**: Outbound follow-up messages call `instagramAdapter.sendTextMessage(credentials, recipientId, text)` which continues to work using the stored long-lived access token.
7. **Database Schema**: No Prisma migrations required; the existing `Channel` table columns (`externalAccountId`, `credentials`, `metadata`, `tokenExpiresAt`) support this payload directly.

---

## 5. Agent Implementation Checklist (Self-Verification)

Follow this checklist step-by-step during backend implementation to verify accuracy and prevent hallucinations:

- [x] **Config & Environment**:
  - [x] Add `INSTAGRAM_APP_ID` (optional string) and `INSTAGRAM_APP_SECRET` (optional string) to `src/config/env.config.ts`.
  - [x] Add `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET` placeholders to `.env.example`.
- [x] **DTOs & Meta Config**:
  - [x] Add `instagramAppId` to `MetaConfigResponseDto` in `src/modules/channels/dto/meta-config-response.dto.ts`.
  - [x] Update `ChannelsService.getMetaConfig()` to return `instagramAppId` and `instagram_business_*` scopes.
  - [x] In `ConnectInstagramDto`, make `pageId` optional (`@IsOptional()`).
- [x] **Instagram Graph API Client (`instagram-graph-api.client.ts`)**:
  - [x] Implement `exchangeUserCode(code, redirectUri)` using `https://api.instagram.com/oauth/access_token`.
  - [x] Implement `getLongLivedToken(shortToken)` using `https://graph.instagram.com/access_token`.
  - [x] Implement `getInstagramDetails(accessToken)` using `https://graph.instagram.com/v21.0/me`.
  - [x] Implement `subscribeAccount(accessToken)` using `POST https://graph.instagram.com/v21.0/me/subscribed_apps`.
  - [x] Implement `unsubscribeAccount(accessToken)` using `DELETE https://graph.instagram.com/v21.0/me/subscribed_apps`.
- [x] **Instagram Channel Service (`instagram-channel.service.ts`)**:
  - [x] Refactor `connect()` to remove `getUserPages()` and Facebook Page resolution.
  - [x] Ensure `externalAccountId` is set to `igDetails.id`.
  - [x] Ensure credentials encrypt `{ accessToken: longLivedToken }`.
  - [x] Ensure `disconnect()` calls `unsubscribeAccount()`.
- [x] **Instagram Messaging Adapter (`instagram-messaging.adapter.ts`)**:
  - [x] Update `sendTextMessage()` and `sendMediaMessage()` request URLs to `https://graph.instagram.com/v21.0/me/messages`.
  - [x] Ensure `Authorization: Bearer <accessToken>` header is passed cleanly.
- [x] **Testing & Quality Assurance**:
  - [x] Run unit tests: `npm test` and ensure all channel/messaging tests pass (25 suites, 143 tests passed).
  - [x] Check TypeScript compilation: `npm run build` with zero errors.
  - [x] Verify swagger OpenAPI generation matches expected DTOs.

---

## 6. Frontend Implementation Specifications (For Frontend Developers)

*This section provides complete, self-contained specifications for the frontend team so no external Meta documentation lookup is needed.*

### 6.1. What Changes on the Frontend
- **Remove**: The Facebook JavaScript SDK (`FB.init`, `FB.login`) and any Facebook Page selector modals.
- **Add**: A direct Instagram OAuth popup/redirect button that opens Instagram's authorization dialog.

---

### 6.2. Step 1: Fetch Configuration from Backend
When the channels/onboarding page loads, fetch the Meta/Instagram configuration:
- **Endpoint**: `GET /channels/meta-config`
- **Response**:
  ```json
  {
    "appId": "...",
    "instagramAppId": "1013621005086662",
    "apiVersion": "v21.0",
    "instagramScopes": [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments"
    ]
  }
  ```

---

### 6.3. Step 2: Construct the Instagram OAuth URL
When the user clicks **"Connect Instagram"**, construct the authorization URL:

```text
https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id={INSTAGRAM_APP_ID}&redirect_uri={ENCODED_REDIRECT_URI}&response_type=code&scope={COMMA_SEPARATED_SCOPES}
```

#### Exact Query Parameter Reference:
| Parameter | Value | Purpose |
|---|---|---|
| `client_id` | Value of `instagramAppId` (e.g. `1013621005086662`) | Identifies your Instagram App |
| `redirect_uri` | e.g. `https://app.kvik.kz/onboarding/channels/instagram/callback` | Registered OAuth Redirect URL (must be URL-encoded) |
| `response_type` | `code` | Requests an authorization code |
| `scope` | `instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments` | Requested permissions for messaging and account profile |
| `enable_fb_login` | `0` | Disables the "Log in with Facebook" fallback and presents pure Instagram login |
| `force_authentication`| `1` | Forces Instagram to show the login prompt even if already logged in in another tab |

---

### 6.4. Step 3: Handling the OAuth Callback & Error States

#### A. Success Flow:
Instagram redirects the browser/popup back to your `redirect_uri` with the code in the query string:
```text
https://app.kvik.kz/onboarding/channels/instagram/callback?code=AQD...#_
```
*Note: Instagram appends `#_` to the end of the URL. The frontend should strip `#_` from the code before sending to the backend.*

The frontend then calls the backend:
- **Endpoint**: `POST /channels/instagram/connect`
- **Payload**:
  ```json
  {
    "code": "AQD...",
    "redirectUri": "https://app.kvik.kz/onboarding/channels/instagram/callback"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "code": "channels.instagram_connected",
    "message": "Instagram channel successfully connected",
    "channel": {
      "id": "cl...",
      "type": "INSTAGRAM",
      "status": "CONNECTED",
      "externalAccountId": "178414...",
      "metadata": {
        "instagramId": "178414...",
        "igUsername": "barberpro_kz",
        "name": "Barber Pro Almaty",
        "profilePictureUrl": "https://..."
      },
      "active": true
    }
  }
  ```

#### B. User Cancellation / Denial Flow:
If the user clicks "Cancel" on Instagram's authorization screen, Instagram redirects back with error parameters:
```text
https://app.kvik.kz/onboarding/channels/instagram/callback?error=access_denied&error_reason=user_denied&error_description=Permissions+disallowed.
```
- The frontend should detect `error` or `error_reason` in query params, display a user-friendly cancellation message (e.g., *"Instagram connection was cancelled"*), and return to the channel setup screen.
