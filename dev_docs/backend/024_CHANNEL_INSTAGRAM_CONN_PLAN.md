# 024 — Instagram Channel Connection Specification & Plan

> **Target Audience:** Frontend Developers, Backend Developers, QA  
> **Scope:** Complete guide and API reference for connecting an **Instagram Professional (Business or Creator)** channel via **Facebook Login for Business**.  
> **Related Docs:** [`dev_docs/021_MESSAGING_CHANNEL_CONN_SPEC.md`](file:///c:/Users/Honor/Desktop/tech/web/kvik/kvik-backend/dev_docs/021_MESSAGING_CHANNEL_CONN_SPEC.md), [`dev_docs/023_MESSAGING_CHANNELS_FULL_CONN_PLAN.md`](file:///c:/Users/Honor/Desktop/tech/web/kvik/kvik-backend/dev_docs/023_MESSAGING_CHANNELS_FULL_CONN_PLAN.md)

---

## 1. Executive Summary & Flow Architecture

Instagram Direct messaging access is granted through **Facebook Login for Business**. Instagram DMs are accessible for **Business or Creator accounts linked to a Facebook Page**.

### 1.1 End-to-End Sequence Diagram

```
┌─────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
│ Business Owner  │ ──1─> │ Frontend (Dashboard) │ ──2─> │ Facebook Login Dialog│
│ (Clicks Connect)│       │                      │       │     (Meta Popup)     │
└─────────────────┘       └──────────────────────┘       └──────────────────────┘
                                     │                              │
                                     │ 3. User selects IG & Page    │
                                     │    Meta returns code         │
                                     │ <────────────────────────────┘
                                     ▼
                          ┌──────────────────────┐
                          │ POST /channels/      │
                          │   instagram/connect  │
                          └──────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │     Backend API      │
                          │  1. Exchange Code    │
                          │  2. Get Long Token   │
                          │  3. Resolve Page & IG│
                          │  4. Subscribe Webhook│
                          │  5. Encrypt & Save   │
                          └──────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │ PostgreSQL (Channel) │
                          │ status: CONNECTED    │
                          └──────────────────────┘
```

### 1.2 Prerequisites for Business Owner
Before connecting, the business owner must:
1. Have an **Instagram Business or Creator** account (Personal accounts cannot connect).
2. Have their Instagram account linked to a **Facebook Page** they manage (Settings → Linked Accounts / Accounts Center).

---

## 2. Meta Dashboard & Webhook Setup

### 2.1 Meta App Dashboard Settings
In [Meta for Developers](https://developers.facebook.com/apps):
1. **Products Added:** `Facebook Login for Business`, `Instagram Graph API`, `Webhooks`.
2. **Facebook Login for Business → Settings**:
   - **Client OAuth Login:** `Yes`
   - **Web OAuth Login:** `Yes`
   - **Enforce HTTPS:** `Yes`
   - **Login with the JavaScript SDK:** `Yes`
   - **Allowed Domains for the JavaScript SDK:** `https://kvik-dashboard.vercel.app`, `http://localhost:3000`
   - **Valid OAuth Redirect URIs:**
     - `https://kvik-dashboard.vercel.app/onboarding`
     - `https://kvik-dashboard.vercel.app/onboarding/instagram-callback`
     - `https://kvik-dashboard.vercel.app/settings/channels`

### 2.2 Webhooks & The Meta Verify Token Handshake
Meta requires a Webhook Callback URL and Verify Token to verify your server before streaming live messages.

- **Callback URL (same for WhatsApp & Instagram):**
  `https://<YOUR_BACKEND_DOMAIN>/webhooks/meta`  
  *(During local dev: your active ngrok / tunnel URL, e.g. `https://xxxx.ngrok-free.app/webhooks/meta`)*
- **Verify Token:**
  A secret random string you define in your `.env`.
  - Backend supports `META_VERIFY_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, or `INSTAGRAM_VERIFY_TOKEN`.
  - **You can use the exact same Verify Token for both WhatsApp and Instagram.**
- **Webhook Subscriptions (Instagram Object / Page Object):**
  - Subscribe to fields: `messages`, `messaging_postbacks`, `message_reactions`, `message_reads`.

---

## 3. Frontend Integration Guide

The frontend can connect Instagram using either **Option A (Facebook JavaScript SDK)** or **Option B (Standard OAuth Redirect/Popup)**.

### Option A: Facebook JavaScript SDK (`FB.login`) — Recommended

```javascript
// 1. Fetch Meta config from Backend
const metaConfig = await fetch('/api/channels/meta/config', {
  headers: { Authorization: `Bearer ${accessToken}` }
}).then(r => r.json());

// 2. Initialize FB JS SDK (if not already initialized)
window.fbAsyncInit = function() {
  FB.init({
    appId: metaConfig.appId,
    cookie: true,
    xfbml: true,
    version: metaConfig.apiVersion || 'v26.0'
  });
};

// 3. Trigger Facebook Login Popup
function connectInstagram() {
  FB.login(function(response) {
    if (response.authResponse && response.authResponse.code) {
      // 4. Send code to backend
      fetch('/api/channels/instagram/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          code: response.authResponse.code
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log('Instagram Connected:', data);
      });
    }
  }, {
    scope: metaConfig.instagramScopes.join(','), // 'instagram_basic,instagram_manage_messages,pages_show_list,pages_manage_metadata'
    response_type: 'code',
    override_default_response_type: true,
    extras: { setup: {} }
  });
}
```

### Option B: OAuth Redirect / Custom Popup Dialog

```javascript
// Construct OAuth Dialog URL:
const redirectUri = 'https://kvik-dashboard.vercel.app/onboarding/instagram-callback';
const authUrl = `https://www.facebook.com/${metaConfig.apiVersion}/dialog/oauth?` +
  `client_id=${metaConfig.appId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `scope=${encodeURIComponent(metaConfig.instagramScopes.join(','))}&` +
  `response_type=code`;

// Open popup window or redirect
window.open(authUrl, 'Connect Instagram', 'width=600,height=700');

// In callback page, extract ?code=... and send to backend:
await fetch('/api/channels/instagram/connect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    code: authCodeFromUrl,
    redirectUri: redirectUri
  })
});
```

---

## 4. Backend Endpoints Reference (For Frontend Developers)

All endpoints require JWT Bearer Authentication (`Authorization: Bearer <accessToken>`).  
All responses follow the project i18n envelope standard.

---

### Endpoint 1: Get Meta App Configuration
Retrieves public credentials for initializing the Meta JS SDK.

- **`GET /channels/meta/config`**
- **Response `200 OK`**:
```json
{
  "appId": "1084920482910394",
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

### Endpoint 2: Connect Instagram Channel
Exchanges the authorization code, links the Instagram Business Account, subscribes to webhooks, and connects the channel.

- **`POST /channels/instagram/connect`**
- **Request Body (`ConnectInstagramDto`)**:
```json
{
  "code": "AQD...short_lived_oauth_code_from_facebook_login...",
  "redirectUri": "https://kvik-dashboard.vercel.app/onboarding/instagram-callback", // Optional (omit if using FB.login)
  "pageId": "109876543210123" // Optional (if omitted, backend selects first page with linked Instagram account)
}
```

- **Response `200 OK` (`ChannelConnectResponseDto`)**:
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
      "name": "Beauty Studio Almaty",
      "profilePictureUrl": "https://scontent.cdninstagram.com/v/..."
    },
    "tokenExpiresAt": "2026-11-06T12:00:00.000Z",
    "active": true,
    "lastError": null,
    "createdAt": "2026-09-10T14:30:00.000Z",
    "updatedAt": "2026-09-10T14:30:00.000Z"
  }
}
```

- **Potential Error Responses (`400 Bad Request`)**:
```json
// If user has no Facebook Pages:
{
  "statusCode": 400,
  "code": "channels.instagram_no_page_found",
  "message": "No Facebook Pages found for the authenticated user",
  "isRaw": false
}

// If Facebook Page is not linked to an Instagram Business account:
{
  "statusCode": 400,
  "code": "channels.instagram_no_business_account",
  "message": "Selected Facebook Page has no linked Instagram Business or Creator account",
  "isRaw": false
}

// If OAuth Code expired or invalid:
{
  "statusCode": 400,
  "code": "channels.instagram_token_exchange_failed",
  "message": "Failed to exchange Instagram/Facebook authorization code",
  "isRaw": false
}
```

---

### Endpoint 3: Get Instagram Channel Status
Fetches current connection status and sanitized metadata.

- **`GET /channels/INSTAGRAM`**
- **Response `200 OK`**: Single `ChannelDto` (same shape as `channel` in Connect response).
- **Response `404 Not Found`**:
```json
{
  "statusCode": 404,
  "code": "channels.channel_not_found",
  "message": "Channel INSTAGRAM is not connected for this workspace",
  "isRaw": false
}
```

---

### Endpoint 4: Disconnect Instagram Channel
Unsubscribes Facebook Page from webhooks and sets channel status to `DISCONNECTED`.

- **`POST /channels/INSTAGRAM/disconnect`**
- **Response `200 OK`**:
```json
{
  "code": "channels.channel_disconnected",
  "message": "Channel successfully disconnected",
  "type": "INSTAGRAM"
}
```

---

### Endpoint 5: Channel Health Check
Validates that the Instagram token is still active and not expired.

- **`GET /channels/INSTAGRAM/health`**
- **Response `200 OK`**:
```json
{
  "type": "INSTAGRAM",
  "status": "CONNECTED",
  "isHealthy": true,
  "details": {
    "tokenExpiresAt": "2026-11-06T12:00:00.000Z",
    "isExpired": false
  }
}
```

---

## 5. Translation Keys (`translation_keys_new.json`)

Flat Russian key-value mappings for user-facing responses:

```json
{
  "channels.instagram_connected": "Instagram успешно подключен",
  "channels.instagram_no_page_found": "Не найдено доступных страниц Facebook для данного аккаунта.",
  "channels.instagram_no_business_account": "К выбранной странице Facebook не привязан бизнес-аккаунт Instagram. Переключите тип аккаунта на 'Профессиональный' в приложении Instagram и привяжите страницу Facebook.",
  "channels.instagram_token_exchange_failed": "Не удалось обменять код авторизации Instagram. Повторите попытку входа.",
  "channels.instagram_pages_fetch_failed": "Не удалось получить список страниц Facebook для пользователя.",
  "channels.instagram_subscription_failed": "Не удалось оформить подписку страницы Facebook на сообщения Instagram."
}
```

---

## 6. Implementation Checklist

### 1. Environment & Meta Setup
- [x] Add `META_VERIFY_TOKEN` and `INSTAGRAM_VERIFY_TOKEN` support in `env.config.ts`.
- [ ] In Meta Dashboard, configure Webhooks for Instagram / Pages with Callback URL `https://<domain>/webhooks/meta` and Verify Token.
- [ ] Add Frontend domain to **Allowed Domains for JS SDK** and **Valid OAuth Redirect URIs**.

### 2. Backend Enhancements (Completed)
- [x] Update `MetaApiClient.exchangeUserCode` with multi-tier fallback for `redirect_uri` (`''`, exact URI, omitted param).
- [x] Update `MetaApiClient.getPageInstagramAccount` to resolve linked Instagram accounts directly from the Page node.
- [x] Update `InstagramChannelService` to sync `workspace.metadata.channelConfirmed = true` on connection.
- [x] Update `MetaApiClient.unsubscribePage` for clean webhook removal on disconnect.
- [x] Update `WebhooksController` to verify `META_VERIFY_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, or `INSTAGRAM_VERIFY_TOKEN`.
- [x] Register new translation keys in `translation_keys_new.json`.
- [x] Regenerate Swagger schema `openapi.json` and verify build.

### 3. Frontend Integration (For Frontend Developers)
- [ ] Call `GET /channels/meta/config` to get `appId` and `instagramScopes`.
- [ ] Trigger Facebook Login (`FB.login` or OAuth dialog).
- [ ] Post returned `code` to `POST /channels/instagram/connect`.
- [ ] On success, display connected Instagram username & profile picture, and navigate to Step 5 (Qualification).
