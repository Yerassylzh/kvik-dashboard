# 023 — Messaging Channels Full Connection & Messaging Specification

**Scope:** Complete production-grade technical specification for connecting, receiving messages, sending AI responses, and managing permissions across **WhatsApp Business Cloud API**, **Instagram Direct API**, and **Telegram Bot API**.

**Target API Versions (Latest 2026/2025):**
- **Meta Graph API:** `v22.0` / `v21.0`
- **WhatsApp Cloud API:** Embedded Signup **v4**
- **Telegram Bot API:** `7.x+`

---

## 1. Shared Messaging Architecture Pattern

The system handles all 3 channels under a unified omnichannel pipeline:

```
[Customer on WhatsApp / Instagram / Telegram]
                │ (Inbound message)
                ▼
  [Meta / Telegram Webhook Servers]
                │ (HTTPS POST)
                ▼
  [Kvik Backend: /webhooks/{platform}]  <── (Public route, validates secret / HMAC)
                │
                ├─► 1. Deduplicate event (by platform message_id in Redis/DB)
                ├─► 2. Find or create Lead + Conversation in PostgreSQL
                ├─► 3. Save incoming message (role: 'USER')
                └─► 4. Enqueue Job to BullMQ ('incoming-message-queue')
                               │
                               ▼
                [Worker: LLM Agent & Knowledge Engine]
                               │
                               ├─► Generates AI contextual response
                               └─► Dispatches Outbound Send Job
                                               │
                                               ▼
                               [Outbound Channel Adapter]
                                               │ (POST to Meta / Telegram API)
                                               ▼
                         [Customer receives instant reply]
```

---

## 2. Channel 1: WhatsApp Business Cloud API

### 2.1 Meta Permissions & Products Required
In **[Meta for Developers Console](https://developers.facebook.com/apps)**:
- **Products:** `WhatsApp`, `Facebook Login for Business`, `Webhooks`
- **App Permissions:**
  - `whatsapp_business_messaging` — read & send WhatsApp messages on behalf of the business.
  - `whatsapp_business_management` — manage phone numbers, business profiles, and webhooks.

### 2.2 Connection Flow (Embedded Signup v4)
1. **Frontend:** Calls `GET /channels/meta/config` to obtain `appId`, `whatsappConfigId`, and `apiVersion`.
2. **Frontend Popup:** Opens `https://www.facebook.com/{apiVersion}/dialog/oauth` with:
   - `client_id = META_APP_ID`
   - `config_id = META_WHATSAPP_CONFIG_ID`
   - `response_type = code`
   - `override_default_response_type = true`
   - `redirect_uri = https://kvik-dashboard.vercel.app/onboarding/whatsapp-callback`
3. **Meta Redirect:** Meta returns `code` to the callback page, which posts it back to the parent window and closes.
4. **Backend Handshake (`POST /channels/whatsapp/connect`):**
   - **Step A (Exchange Code):**
     ```http
     GET https://graph.facebook.com/v22.0/oauth/access_token?client_id={META_APP_ID}&client_secret={META_APP_SECRET}&code={code}&redirect_uri={redirectUri}
     ```
     Returns permanent system/business `access_token`.
   - **Step B (Subscribe WABA to Webhooks):**
     ```http
     POST https://graph.facebook.com/v22.0/{waba_id}/subscribed_apps
     Headers: Authorization: Bearer {access_token}
     ```
   - **Step C (Register Phone Number on Cloud API):**
     ```http
     POST https://graph.facebook.com/v22.0/{phone_number_id}/register
     Headers: Authorization: Bearer {access_token}
     Body: { "messaging_product": "whatsapp", "pin": "123456" }
     ```
   - **Step D (Fetch Phone Profile):**
     ```http
     GET https://graph.facebook.com/v22.0/{phone_number_id}?fields=display_phone_number,verified_name,quality_rating
     ```
   - **Step E (Store Encrypted in Database):**
     Save `Channel` row with AES-256 encrypted `accessToken`, `externalAccountId = waba_id`, and metadata `{ phoneNumberId, displayPhoneNumber, verifiedName }`.

### 2.3 Webhook Event Ingestion
- **Webhook Endpoint:** `GET & POST /webhooks/meta`
- **Verification (`GET /webhooks/meta`):**
  Matches `hub.verify_token == WHATSAPP_VERIFY_TOKEN` and echoes `hub.challenge`.
- **Inbound Event Format (`POST /webhooks/meta`):**
  ```json
  {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "WABA_ID",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "77011234567",
                "phone_number_id": "PHONE_NUMBER_ID"
              },
              "contacts": [{ "profile": { "name": "Customer Name" }, "wa_id": "77771234567" }],
              "messages": [
                {
                  "from": "77771234567",
                  "id": "wamid.HBgL...",
                  "timestamp": "1725890000",
                  "text": { "body": "Здравствуйте! Сколько стоит консультация?" },
                  "type": "text"
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  }
  ```

### 2.4 Outbound Message Delivery
To send an AI response to the customer:
- **Endpoint:** `POST https://graph.facebook.com/v22.0/{phone_number_id}/messages`
- **Headers:** `Authorization: Bearer {decrypted_access_token}`, `Content-Type: application/json`
- **Payload (Standard Text):**
  ```json
  {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "77771234567",
    "type": "text",
    "text": {
      "preview_url": false,
      "body": "Здравствуйте! Стоимость консультации составляет 15 000 ₸. Хотите записаться на удобное время?"
    }
  }
  ```
- **Payload (Interactive Buttons / Time Slots):**
  ```json
  {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "77771234567",
    "type": "interactive",
    "interactive": {
      "type": "button",
      "body": { "text": "Выберите подходящее действие:" },
      "action": {
        "buttons": [
          { "type": "reply", "reply": { "id": "slot_1", "title": "Записаться на 15:00" } },
          { "type": "reply", "reply": { "id": "call_manager", "title": "Связаться с менеджером" } }
        ]
      }
    }
  }
  ```

### 2.5 24-Hour Customer Care Window Policy
- When a customer sends a message, a **24-hour service window** opens.
- Within 24 hours: You can send unlimited free-form AI text and interactive messages.
- Outside 24 hours: Meta requires sending an approved **Template Message** (e.g. appointment reminder) to re-engage the customer.

---

## 3. Channel 2: Instagram Direct Messaging

### 3.1 Meta Permissions & Products Required
In **Meta App Dashboard**:
- **Products:** `Facebook Login for Business`, `Instagram Graph API`, `Webhooks`
- **App Permissions:**
  - `instagram_basic` — read account profile.
  - `instagram_manage_messages` — receive and send Instagram Direct messages.
  - `pages_show_list` — list Facebook Pages managed by user.
  - `pages_manage_metadata` — subscribe Facebook Page to webhooks.

### 3.2 Connection Flow
1. **Frontend:** Initiates Facebook OAuth with scopes `instagram_basic,instagram_manage_messages,pages_show_list,pages_manage_metadata`.
2. **Backend (`POST /channels/instagram/connect`):**
   - **Step A:** Exchanges user code for User Access Token.
   - **Step B:** Exchanges User Access Token for Long-Lived Token (valid ~60 days).
   - **Step C:** Calls `GET https://graph.facebook.com/v22.0/me/accounts` to find the Facebook Page linked to an `instagram_business_account`.
   - **Step D (Subscribe Page to Instagram Webhooks):**
     ```http
     POST https://graph.facebook.com/v22.0/{page_id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks
     Headers: Authorization: Bearer {page_access_token}
     ```
   - **Step E:** Fetches Instagram account details (username, profile pic) via `GET https://graph.facebook.com/v22.0/{ig_business_id}`.
   - **Step F:** Stores encrypted `page_access_token` and metadata in database.

### 3.3 Webhook Event Ingestion
- **Webhook Endpoint:** `POST /webhooks/meta`
- **Inbound Event Format:**
  ```json
  {
    "object": "instagram",
    "entry": [
      {
        "id": "PAGE_ID",
        "time": 1725890000,
        "messaging": [
          {
            "sender": { "id": "IGSID_CUSTOMER_ID" },
            "recipient": { "id": "INSTAGRAM_BUSINESS_ACCOUNT_ID" },
            "timestamp": 1725890000,
            "message": {
              "mid": "m_mid.123...",
              "text": "Добрый день! Есть свободные слоты на завтра?"
            }
          }
        ]
      }
    ]
  }
  ```

### 3.4 Outbound Message Delivery
- **Endpoint:** `POST https://graph.facebook.com/v22.0/me/messages`
- **Headers:** `Authorization: Bearer {page_access_token}`, `Content-Type: application/json`
- **Payload:**
  ```json
  {
    "recipient": {
      "id": "IGSID_CUSTOMER_ID"
    },
    "message": {
      "text": "Добрый день! Да, на завтра есть свободное время в 14:00 и 16:30. Записать вас?"
    }
  }
  ```

---

## 4. Channel 3: Telegram Bot API

### 4.1 Prerequisites
1. User creates a bot via **`@BotFather`** on Telegram (`/newbot`).
2. Obtains Bot API Token (e.g. `7123456789:AAFxxx_...`).

### 4.2 Connection Flow (`POST /channels/telegram/connect`)
1. **Backend Validates Token:**
   ```http
   GET https://api.telegram.org/bot{botToken}/getMe
   ```
2. **Backend Generates Webhook Secret Token:**
   Creates a 32-character crypto random string `webhookSecret`.
3. **Backend Registers Webhook with Telegram:**
   ```http
   POST https://api.telegram.org/bot{botToken}/setWebhook
   Body: {
     "url": "https://kvik-backend.onrender.com/webhooks/telegram/{webhookSecret}",
     "allowed_updates": ["message", "callback_query"],
     "secret_token": "{webhookSecret}"
   }
   ```
4. **Stores in Database:** Saves encrypted `botToken`, `webhookSecret`, `externalAccountId = bot_id`, metadata `{ username, firstName }`.

### 4.3 Webhook Event Ingestion
- **Webhook Endpoint:** `POST /webhooks/telegram/:secret`
- **Header Security:** Verifies `X-Telegram-Bot-Api-Secret-Token == channel.webhookSecret`.
- **Inbound Event Format:**
  ```json
  {
    "update_id": 987654321,
    "message": {
      "message_id": 105,
      "from": {
        "id": 123456789,
        "first_name": "Yerassyl",
        "username": "yerassyl_zh"
      },
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "date": 1725890000,
      "text": "Здравствуйте, можно прайс-лист?"
    }
  }
  ```

### 4.4 Outbound Message Delivery
- **Endpoint:** `POST https://api.telegram.org/bot{botToken}/sendMessage`
- **Payload:**
  ```json
  {
    "chat_id": 123456789,
    "text": "Здравствуйте, Yerassyl! Наш актуальный прайс-лист отправлен ниже:",
    "parse_mode": "HTML",
    "reply_markup": {
      "inline_keyboard": [
        [
          { "text": "📅 Записаться онлайн", "callback_data": "book_appointment" },
          { "text": "📞 Позвонить менеджеру", "callback_data": "call_manager" }
        ]
      ]
    }
  }
  ```

---

## 5. Backend Endpoints & API Specification

### 5.1 Public Configuration Endpoint
- `GET /channels/meta/config`
  - **Auth:** Bearer JWT (Workspace)
  - **Output:**
    ```json
    {
      "appId": "1084920482910394",
      "whatsappConfigId": "987654321098765",
      "apiVersion": "v22.0",
      "instagramScopes": [
        "instagram_basic",
        "instagram_manage_messages",
        "pages_show_list",
        "pages_manage_metadata"
      ]
    }
    ```

### 5.2 Channel Management Endpoints
| Method | Path | Input DTO | Response / Action |
|---|---|---|---|
| `GET` | `/channels` | None | Lists all workspace channels with status & metadata |
| `GET` | `/channels/:type` | `type: WHATSAPP \| INSTAGRAM \| TELEGRAM` | Returns single channel connection details |
| `POST` | `/channels/whatsapp/connect` | `{ code, wabaId?, phoneNumberId?, pin?, redirectUri? }` | Exchanges token, subscribes WABA, registers phone, saves DB |
| `POST` | `/channels/instagram/connect` | `{ code, pageId?, redirectUri? }` | Exchanges token, subscribes Page, saves DB |
| `POST` | `/channels/telegram/connect` | `{ botToken }` | Validates token, registers webhook with secret, saves DB |
| `POST` | `/channels/:type/disconnect` | None | Disconnects channel, unsubscribes webhooks, marks `DISCONNECTED` |
| `GET` | `/channels/:type/health` | None | Checks token validity & webhook health with live provider API |

### 5.3 Public Webhook Endpoints
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/webhooks/meta` | `@Public()` | Meta webhook verification challenge (`hub.verify_token`) |
| `POST` | `/webhooks/meta` | `@Public()` | Ingests incoming WhatsApp & Instagram customer messages |
| `POST` | `/webhooks/telegram/:secret` | `@Public()` | Ingests incoming Telegram customer messages & callback queries |

---

## 6. Concise Dashboard Setup Guide

### 6.1 Meta for Developers Dashboard (`developers.facebook.com`)
1. **App settings → Basic**:
   - **App Domains**: `kvik-dashboard.vercel.app`, `localhost`
   - **Website → Site URL**: `https://kvik-dashboard.vercel.app/`
2. **Facebook Login for Business → Settings**:
   - **Client OAuth Login**: Yes
   - **Web OAuth Login**: Yes
   - **Allowed Domains for JS SDK**: `https://kvik-dashboard.vercel.app`, `http://localhost:3000`
   - **Valid OAuth Redirect URIs**:
     - `https://kvik-dashboard.vercel.app/onboarding/whatsapp-callback`
     - `https://kvik-dashboard.vercel.app/onboarding/instagram-callback`
     - `https://kvik-dashboard.vercel.app/onboarding`
3. **Facebook Login for Business → Configurations**:
   - Create a Configuration with `whatsapp_business_messaging` and `whatsapp_business_management`.
   - Copy **Configuration ID** into `META_WHATSAPP_CONFIG_ID`.
4. **WhatsApp / Webhooks**:
   - **Callback URL**: `https://kvik-backend.onrender.com/webhooks/meta`
   - **Verify Token**: `{WHATSAPP_VERIFY_TOKEN}`
   - **Webhook Fields Subscribed**: `messages`, `messaging_postbacks`, `message_template_status_update`.

### 6.2 Telegram Setup (`@BotFather`)
1. Open `@BotFather` on Telegram.
2. Send `/newbot`, provide bot name (e.g. `Kvik Assistant`) and username (e.g. `kvik_demo_bot`).
3. Copy the HTTP API token into the frontend input.

---

## 7. Local Development Guide & The "Two Tunnels" Solution

### 7.1 Why the "Two Tunnels" Issue Happens
- Tools like **ngrok (free tier)** restrict accounts to **only 1 active tunnel** at a time.
- If you try running a tunnel for Frontend (`http://localhost:3000`) and another for Backend (`http://localhost:8000`), the second one is blocked.

### 7.2 The 3 Recommended Solutions

#### ⭐ Solution 1: Zero-Tunnel for Connection (Recommended & Easiest)
- **Connecting Channels is a one-time database setup:**
  1. Open your live app: `https://kvik-dashboard.vercel.app/onboarding`
  2. Click **Connect WhatsApp** or **Connect Instagram** once.
  3. The connection is saved in your PostgreSQL (Neon) database.
- **Local Development:**
  - When you run `npm run start:dev` locally, your local backend connects to the same Neon database.
  - Channels are immediately `CONNECTED` and active on localhost without ever running a frontend tunnel!

#### 🛠️ Solution 2: 1 Webhook Tunnel for Local Message Testing
If you are developing or debugging AI message handling on your local machine:
1. Run 1 tunnel for your **Backend only** (`localhost:8000`):
   ```powershell
   npx localtunnel --port 8000
   # or
   ngrok http 8000
   ```
2. In Meta Dashboard (or Telegram Bot), temporarily set the Webhook URL to:
   `https://your-tunnel-url.loca.lt/webhooks/meta`
3. Inbound customer messages from real WhatsApp/Telegram will hit your local breakpoint/logs in real-time.

#### 🌐 Solution 3: Free Multi-Tunnel with Cloudflare Tunnel (100% Free, Unlimited)
If you truly need multiple subdomains pointing to different local ports simultaneously:
1. Download Cloudflare Tunnel (`cloudflared`).
2. Run unlimited named ingress tunnels without account limits:
   ```yaml
   # ~/.cloudflared/config.yml
   tunnel: my-dev-tunnel
   credentials-file: /path/to/credentials.json
   ingress:
     - hostname: app-dev.yourdomain.com
       service: http://localhost:3000
     - hostname: api-dev.yourdomain.com
       service: http://localhost:8000
     - service: http_status:404
   ```

---

## 8. Implementation Checklist for AI Agent

- [x] Create DTOs with Swagger annotations for WhatsApp, Instagram, Telegram connect requests.
- [x] Implement `MetaApiClient` with `exchangeWhatsAppCode`, `subscribeWaba`, `registerPhoneNumber`, `getUserPages`, `subscribePage`.
- [x] Implement `WhatsAppChannelService`, `InstagramChannelService`, `TelegramChannelService`.
- [x] Create unified `ChannelsController` with `@ApiBearerAuth()` and typed response envelopes.
- [x] Mark `WebhooksController` with `@Public()` to bypass JWT global guard for platform webhooks.
- [x] Configure fallback-tolerant `redirect_uri` in Meta code exchange.
- [ ] Implement BullMQ processor (`incoming-message.processor.ts`) to orchestrate RAG / LLM generation when `messages` webhook arrives.
- [ ] Implement Outbound Message Dispatcher (`channels-outbound.service.ts`) to push AI replies back to Cloud API / Telegram.
