# 034 — Meta Channels (Instagram & WhatsApp) Integration Adaptation & Refactoring Plan

> **Document Type:** Frontend Technical Architecture & Execution Plan  
> **Target Audience:** Frontend Engineers, Fullstack Developers, QA Engineers  
> **Backend Reference:** `dev_docs/backend/065_META_CHANNELS_CONNECTION_CHANGES.md`  
> **Related Documents:** `dev_docs/030_INSTAGRAM_LOGIN_CHANGE.md`, `dev_docs/031_WHATSAPP_INTEGRATION_CHANGE.md`, `dev_docs/018_PROJECT_LEVEL_DESIGN_ARCH_SPEC.md`  
> **Status:** 🎯 Ready for Execution  

---

## 1. Executive Summary & Objective

The backend team completed an audit and standardization of Meta channel integrations (`dev_docs/backend/065_META_CHANNELS_CONNECTION_CHANGES.md`), aligning Kvik with the **Meta Graph API (v22.0+)** specifications for:
1. **Instagram Business Login:** Direct Instagram OAuth without requiring a linked Facebook Page.
2. **WhatsApp Cloud API (Embedded Signup v4):** Meta JS SDK `FB.login` flow with session asset tracking (`sessionInfoVersion: '3'`) and immediate token exchange.
3. **Unified Channel Lifecycle:** Standardized health checks, disconnection endpoints, token expiration metadata, and webhook subscriptions.

This document details the frontend implementation plan to adapt our client architecture, eliminate technical debt, extract shared Meta SDK utilities, harden OAuth callbacks and postMessage security, and ensure a unified UX across both **Onboarding (`/onboarding`)** and **Dashboard Settings (`/integrations`)**.

---

## 2. API Contracts & Architecture Alignment Matrix

### 2.1. Endpoints Overview

| Endpoint | HTTP | Payload / Query | Response DTO | Purpose |
|---|---|---|---|---|
| `/channels/meta/config` | `GET` | — | `MetaConfigResponseDto` | Public app IDs, config IDs, version (`v22.0+`), and scopes |
| `/channels/instagram/connect` | `POST` | `{ code: string, redirectUri: string }` | `ChannelConnectResponseDto` | Exchange auth code for 60-day token & auto-subscribe webhooks |
| `/channels/whatsapp/connect` | `POST` | `{ code: string, wabaId?: string, phoneNumberId?: string }` | `ChannelConnectResponseDto` | Exchange auth code for business token, subscribe WABA & register phone |
| `/channels/telegram/connect` | `POST` | `{ botToken: string }` | `ChannelConnectResponseDto` | Validate token & register Telegram bot webhook |
| `/channels` | `GET` | — | `ChannelsListResponseDto` | List all connected channels with status and metadata |
| `/channels/{type}` | `GET` | `type: WHATSAPP \| INSTAGRAM \| TELEGRAM` | `ChannelDto` | Fetch single channel details and status |
| `/channels/{type}/disconnect` | `POST` | `type: WHATSAPP \| INSTAGRAM \| TELEGRAM` | `ChannelDisconnectResponseDto` | Revoke tokens, unsubscribe webhooks, set `DISCONNECTED` |
| `/channels/{type}/health` | `GET` | `type: WHATSAPP \| INSTAGRAM \| TELEGRAM` | `ChannelHealthResponseDto` | Validate webhook status and token validity |

---

### 2.2. Identified Frontend Gaps & Required Refactoring

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       IDENTIFIED GAPS & FRONTEND FIXES                      │
├────────────────────┬────────────────────────────────────────────────────────┤
│ 1. Meta JS SDK     │ SDK initialization is duplicated or embedded inside    │
│    Management      │ components. Must extract a robust singleton loader     │
│                    │ (`lib/meta-sdk.ts`) with concurrency guard.            │
├────────────────────┼────────────────────────────────────────────────────────┤
│ 2. WhatsApp        │ `FB.login` extras must pass `sessionInfoVersion: '3'`,  │
│    Embedded Signup │ and message listener must handle origin validation     │
│    Payloads        │ (`facebook.com`, `web.facebook.com`) & event types.    │
├────────────────────┼────────────────────────────────────────────────────────┤
│ 3. Instagram Code  │ Strip `#_` appended by Instagram OAuth redirect URL    │
│    Sanitization    │ and ensure exact `redirectUri` match on connect POST.  │
├────────────────────┼────────────────────────────────────────────────────────┤
│ 4. Token Expiry &  │ Display `tokenExpiresAt` in Settings UI, alerting if   │
│    Health Status   │ token is expiring within 7 days or revoked.            │
├────────────────────┼────────────────────────────────────────────────────────┤
│ 5. UX & Component  │ Unify connect/disconnect logic between Onboarding flow │
│    Modularity      │ and Integrations settings page (<400 lines per file).  │
└────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component & Module Refactoring Plan

### 3.1. Singleton Meta JS SDK Loader (`lib/meta-sdk.ts`)

Create a centralized, thread-safe utility to load and initialize the Meta JavaScript SDK once per application lifecycle.

* **Key Responsibilities:**
  - Prevents duplicate `<script id="facebook-jssdk">` injections.
  - Dynamically initializes `window.FB.init` with credentials from `GET /channels/meta/config` (fallback to `process.env.NEXT_PUBLIC_META_APP_ID`).
  - Supports dynamic API versioning (e.g. `v22.0`).
  - Provides promise-based readiness check with timeout and network failure recovery.

```typescript
// lib/meta-sdk.ts
interface InitMetaSdkOptions {
  appId: string;
  apiVersion?: string;
  autoLogAppEvents?: boolean;
  xfbml?: boolean;
}

let sdkPromise: Promise<typeof window.FB> | null = null;

export function loadMetaSdk(options: InitMetaSdkOptions): Promise<typeof window.FB> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Meta SDK can only be loaded in browser environment"));
  }

  if (window.FB) {
    return Promise.resolve(window.FB);
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Meta SDK load timeout"));
    }, 15000);

    window.fbAsyncInit = function () {
      clearTimeout(timeoutId);
      try {
        window.FB.init({
          appId: options.appId,
          autoLogAppEvents: options.autoLogAppEvents ?? true,
          xfbml: options.xfbml ?? true,
          version: options.apiVersion || "v22.0",
        });
        resolve(window.FB);
      } catch (err) {
        reject(err);
      }
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error("Failed to load Meta SDK script"));
      };
      document.body.appendChild(script);
    }
  });

  return sdkPromise;
}
```

---

### 3.2. TypeScript Types & DTO Hardening (`types/channels.ts`)

Ensure type contracts match backend OpenAPI schemas exactly:

1. **`MetaConfig` Interface:**
   ```typescript
   export interface MetaConfig {
     appId?: string;
     instagramAppId?: string;
     whatsappConfigId?: string;
     apiVersion: string;
     instagramScopes: string[];
   }
   ```

2. **`ConnectWhatsAppDto` Interface:**
   ```typescript
   export interface ConnectWhatsAppDto {
     code: string;
     wabaId?: string;
     phoneNumberId?: string;
     pin?: string;
     redirectUri?: string;
   }
   ```

3. **`ConnectInstagramDto` Interface:**
   ```typescript
   export interface ConnectInstagramDto {
     code: string;
     redirectUri?: string;
     pageId?: string; // Legacy fallback only
   }
   ```

4. **`FbLoginOptions` Interface:**
   ```typescript
   export interface FbLoginOptions {
     config_id?: string;
     response_type?: string;
     override_default_response_type?: boolean;
     scope?: string;
     extras?: {
       setup?: Record<string, unknown>;
       featureType?: string;
       sessionInfoVersion?: string | number;
       [key: string]: unknown;
     };
   }
   ```

5. **`Channel` Interface:**
   - Verify `tokenExpiresAt?: string | null` is typed as ISO timestamp string.
   - Verify `metadata` accommodates `WhatsAppChannelMetadata` (`wabaId`, `phoneNumberId`, `displayPhoneNumber`, `verifiedName`) and `InstagramChannelMetadata` (`instagramId`, `igUsername`, `name`, `profilePictureUrl`).

---

### 3.3. WhatsApp Cloud API Embedded Signup Flow (`components/onboarding/channel/WhatsAppFlow.tsx`)

Refactor `WhatsAppFlow.tsx` to utilize the new singleton SDK and implement complete Meta v22.0 Embedded Signup event handling:

1. **Configuration & SDK Preload:**
   - Fetch Meta configuration via `getMetaConfig()`.
   - Initialize SDK with `loadMetaSdk({ appId: config.appId, apiVersion: config.apiVersion || "v22.0" })`.
2. **Session Event Listener (`WA_EMBEDDED_SIGNUP`):**
   - Validate event origin strictly against `https://www.facebook.com` and `https://web.facebook.com`.
   - Intercept events `FINISH` and `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING`.
   - Store `waba_id`, `phone_number_id`, and `business_id` in refs.
3. **Trigger Embedded Signup (`FB.login`):**
   - Pass options:
     ```typescript
     {
       config_id: config.whatsappConfigId,
       response_type: "code",
       override_default_response_type: true,
       extras: {
         setup: {},
         featureType: "",
         sessionInfoVersion: "3",
       },
     }
     ```
   - Standard synchronous callback function passed to `FB.login` to avoid SDK type check issues.
4. **Immediate Backend POST (`POST /channels/whatsapp/connect`):**
   - Extract code from `response.authResponse.code`.
   - Dispatch code and captured asset IDs immediately (<30 seconds before expiration).
   - Show loading feedback and handle error/cancellation responses cleanly.

---

### 3.4. Direct Instagram Business Login Flow (`components/onboarding/channel/InstagramFlow.tsx` & `OAuthCallbackView.tsx`)

Harden the Instagram direct authorization flow without Facebook Page dependency:

1. **Client ID & Scopes Resolution:**
   - Prioritize `config.instagramAppId` over `config.appId`.
   - Fall back to standard scopes: `instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`.
2. **Authorization URL Construction:**
   ```typescript
   const params = new URLSearchParams({
     enable_fb_login: "0",
     force_authentication: "1",
     client_id: clientId,
     redirect_uri: redirectUri,
     response_type: "code",
     scope: scopes,
   });
   const oauthUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
   ```
3. **Callback URL Sanitization (`OAuthCallbackView.tsx`):**
   - Parse code from query parameters or hash.
   - Cleanse Instagram's trailing `#_` suffix: `rawCode.replace(/#_$/, "").split("#")[0]`.
   - Detect user cancellation (`error=access_denied`, `error_reason=user_denied`) and show a localized friendly banner.
4. **Backend Connect Execution:**
   - Call `POST /channels/instagram/connect` with `{ code, redirectUri }`.
   - Cross-window notification via `postMessage` + `BroadcastChannel` to update the parent window instantly and close popup after 1.2s.

---

### 3.5. Settings & Integrations Page Refactoring (`components/dashboard/settings/channels/`)

Refactor channel cards in `/integrations` to display full health status and token lifecycle:

1. **Channel Status & Token Expiration Badge:**
   - If `channel.status === 'CONNECTED'`:
     - Render green status pill (`Подключено`).
     - If `channel.tokenExpiresAt` exists:
       - Calculate remaining days.
       - If `< 7 days`: show amber warning badge (*"Истекает через N дн."*) with a *"Продлить доступ"* (Re-auth) CTA.
       - Otherwise show subtle metadata with expiration date.
   - If `channel.status === 'ERROR'` or `channel.status === 'REVOKED'`:
     - Render red status pill with `channel.lastError` tooltip and *"Переподключить"* action.
2. **Channel Health Check Button:**
   - Calls `GET /channels/{type}/health` with loading spinner.
   - Updates local status badge and notifies user with toast feedback.
3. **Channel Disconnect Action:**
   - Confirmation modal before triggering `POST /channels/{type}/disconnect`.
   - On success, smoothly transitions card to disconnected state and invalidates cache.

---

### 3.6. Onboarding Flow Consistency (`components/onboarding/`)

Verify and unify the channel step in onboarding:
- Ensure `StepConnectChannel.tsx`, `StageInstagram.tsx`, `StageWhatsApp.tsx`, and `StageTelegram.tsx` use the refactored flows.
- Display connected channels with verified handles / phone numbers.
- Allow skipping or connecting multiple channels seamlessly.

---

## 4. Security, Edge Cases & Error Handling

1. **Origin Verification in `postMessage` Handlers:**
   - Only trust messages from `window.location.origin`, `https://www.facebook.com`, and `https://web.facebook.com`.
2. **Authorization Code Lifespan Guard:**
   - WhatsApp auth codes expire in **30 seconds**. Immediate dispatch via `POST /channels/whatsapp/connect` without intermediate redirects.
3. **Popup Blockers & Ad Blockers:**
   - Handle cases where `FB.login` or the Instagram OAuth popup is blocked by the browser.
   - Provide a clear fallback button: *"Открыть окно авторизации снова"*.
   - Handle failures when `connect.facebook.net` is blocked by uBlock/Brave Shields with a friendly instruction toast.
4. **HTTPS Requirement:**
   - Meta SDK and OAuth flows strictly require HTTPS in production. Validate `window.location.protocol === 'https:'` or `localhost`.

---

## 5. UI/UX & Design Guidelines Adherence

- **Aesthetic:** Modern Minimalist Light SaaS. Pure white card surfaces (`bg-card`), subtle borders (`border-border/80`), deep slate typography (`#0F172A`).
- **Accent Color:** Strict MoonAI Violet (`#7C3AED`) for primary interactive buttons and focus states. Emerald for WhatsApp badges, Pink for Instagram badges, Sky for Telegram badges.
- **Anti-AI Rules:** No gradient text, no glowing borders, no radar animations.
- **Localization:** 100% Russian strings loaded from `locales/ru/*.json` via `next-intl`.
- **Modularity:** Every modified and newly created file strictly below 400 lines of code.

---

## 6. Self-Execution Action Checklist

### Phase 1: SDK Utility & Core Types
- [x] **1.1.** Create `lib/meta-sdk.ts` singleton loader with script injection guard, dynamic API versioning, and cleanup.
- [x] **1.2.** Audit and update `types/channels.ts` to ensure `MetaConfig`, `ConnectWhatsAppDto`, `ConnectInstagramDto`, `FbLoginOptions`, and `Channel` contracts match backend schemas.
- [x] **1.3.** Verify `lib/api/channels.ts` function signatures and error propagation.

### Phase 2: WhatsApp Cloud API Flow Refactoring
- [x] **2.1.** Update `components/onboarding/channel/WhatsAppFlow.tsx` to use `loadMetaSdk` from `lib/meta-sdk.ts`.
- [x] **2.2.** Update `FB.login` configuration in `WhatsAppFlow.tsx` with `sessionInfoVersion: '3'` and `featureType: ''`.
- [x] **2.3.** Refine `WA_EMBEDDED_SIGNUP` message listener to validate origins (`https://www.facebook.com`, `https://web.facebook.com`) and extract `waba_id` & `phone_number_id`.
- [x] **2.4.** Test immediate token exchange and handle user cancellation / error states.

### Phase 3: Instagram Direct Business Login Refinements
- [x] **3.1.** Verify `InstagramFlow.tsx` client ID fallback logic (`config.instagramAppId || config.appId`).
- [x] **3.2.** Verify `OAuthCallbackView.tsx` code sanitization (stripping `#_` fragment) and friendly cancellation message handling.
- [x] **3.3.** Ensure `useOAuthChannel.ts` handles cross-window messaging and broadcast channels reliably.

### Phase 4: Settings & Onboarding UI Alignment
- [x] **4.1.** Update `components/dashboard/settings/channels/ChannelCard.tsx` with token expiration indicators (`tokenExpiresAt`), health check triggers, and reconnect actions.
- [x] **4.2.** Update `ChannelsManager.tsx` to handle reactive channel updates, delete confirmation modals, and feedback banners.
- [x] **4.3.** Verify `components/onboarding/StepConnectChannel.tsx`, `StageInstagram.tsx`, and `StageWhatsApp.tsx` render without errors and advance onboarding correctly.

### Phase 5: Localization & Build Quality Verification
- [x] **5.1.** Check translation keys in `locales/ru/channels.json`, `locales/ru/onboarding.json`, `locales/ru/dashboard.json`.
- [x] **5.2.** Verify strict file size compliance (<400 lines per file).
- [x] **5.3.** Run `npx tsc --noEmit` to guarantee 0 TypeScript errors.
- [x] **5.4.** Run `npm run build` to confirm all pages and routes compile cleanly.
