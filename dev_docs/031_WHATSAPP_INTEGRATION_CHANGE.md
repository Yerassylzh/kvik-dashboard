# 031 — Migration to Meta JavaScript SDK WhatsApp Embedded Signup (Frontend Implementation Plan)

> **Target Audience:** Frontend Developers, Fullstack Engineers, UI/UX Engineers  
> **Backend Reference:** `dev_docs/backend/022_MESSAGING_CHANNEL_CONN_PLAN.md`, `dev_docs/backend/023_MESSAGING_CHANNELS_FULL_CONN_PLAN.md`  
> **Related Documents:** `dev_docs/030_INSTAGRAM_LOGIN_CHANGE.md`, `dev_docs/007_ARCHITECTURE_MODULARITY_REFACTORING_PLAN.md`, `dev_docs/018_PROJECT_LEVEL_DESIGN_ARCH_SPEC.md`  
> **Status:** 🎯 Definitive Technical Specification & Implementation Plan  

---

## 1. Executive Summary & Problem Context

### 1.1 The Problem with Legacy Dialog/OAuth Redirection
Previously, the frontend attempted to initiate WhatsApp Cloud API connection by manually constructing an OAuth dialog URL (`https://www.facebook.com/{version}/dialog/oauth`) with `config_id` and opening it in a standalone browser window. This legacy pattern caused several issues:
1. **Missing Asset IDs:** Meta's WhatsApp Embedded Signup emits client asset identifiers (`waba_id`, `phone_number_id`, `business_id`) via client-side `window.postMessage` events (`type: "WA_EMBEDDED_SIGNUP"`), which are lost or unreliable when relying purely on full-page redirect callback URLs.
2. **Code Expiration Race Condition:** Meta's authorization exchange code expires in **30 seconds**. Redirect callback loops across domains introduce latency and potential timeouts.
3. **Popup / Session Disconnects:** Manual popup URL tracking without the official Meta JS SDK (`FB.login`) fails to leverage Meta's native Embedded Signup modal session management and auto-resizing iframe handshake.

### 1.2 The Solution: Official Meta JavaScript SDK & Embedded Signup
Meta's official recommendation for WhatsApp Business Cloud API onboardings is the **Meta JavaScript SDK** (`https://connect.facebook.net/en_US/sdk.js` or `ru_RU/sdk.js`) combined with `FB.login()` configured with `config_id` and an active `window` message event listener:
1. **Dynamic SDK Initialization:** Fetch public app credentials (`appId`, `whatsappConfigId`, `apiVersion`) from `GET /channels/meta/config` (with fallback to `NEXT_PUBLIC_META_APP_ID` and `NEXT_PUBLIC_META_CONFIG_ID`) and initialize `FB.init()`.
2. **Asset ID Capture:** An active `message` event listener intercepts `WA_EMBEDDED_SIGNUP` events from `facebook.com` / `meta.com` and stores `waba_id` and `phone_number_id`.
3. **Trigger Embedded Signup Modal:** `FB.login()` opens the official Meta Embedded Signup flow.
4. **Instant Token Exchange:** Upon popup completion, the temporary authorization `code` from `response.authResponse.code` and captured `waba_id` / `phone_number_id` are dispatched **immediately** to `POST /channels/whatsapp/connect`.

---

## 2. Technical Architecture & Endpoints Matrix

| Step / Artifact | Legacy Manual OAuth Flow | Modern Meta JS SDK Embedded Signup Flow | Protocol & Notes |
|---|---|---|---|
| **Meta Config Retrieval** | `GET /channels/meta/config` | `GET /channels/meta/config` | Returns `{ appId, whatsappConfigId, apiVersion }` |
| **SDK Loading** | Not loaded (manual popup URL) | `https://connect.facebook.net/en_US/sdk.js` | Loaded dynamically via script tag `#facebook-jssdk` |
| **SDK Initialization** | N/A | `FB.init({ appId, autoLogAppEvents, xfbml, version })` | Uses `apiVersion` (e.g. `v25.0` or `v26.0`) |
| **Asset ID Listener** | Partial / Fragile | `window.addEventListener('message')` listening for `WA_EMBEDDED_SIGNUP` | Extracts `waba_id`, `phone_number_id`, `business_id` |
| **Trigger Mechanism** | `window.open(facebook.com/.../dialog/oauth)` | `window.FB.login(callback, options)` | Native Meta Embedded Signup popup modal |
| **FB.login Options** | N/A | `{ config_id, response_type: 'code', override_default_response_type: true, extras: { setup: {} } }` | Requests authorization code exchange |
| **Code Expiration** | 30 seconds (risk of expiry) | **Instant POST within <1s** | `authCode` immediately sent to backend |
| **Backend Connect Call** | `POST /channels/whatsapp/connect` | `POST /channels/whatsapp/connect` | Payload: `{ code, wabaId, phoneNumberId }` |
| **Response Handling** | Callback page redirect | In-place component update & `onSuccess` callback | Seamless UI update without page reload |

---

## 3. Frontend Implementation Specifications

### 3.1. Meta JS SDK Loader & Manager (`lib/meta-sdk.ts` or `hooks/useMetaSdk.ts`)

A clean, robust helper to safely load and initialize the Meta JavaScript SDK once across the client lifecycle:

```typescript
declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

interface InitMetaSdkOptions {
  appId: string;
  apiVersion?: string;
}

export function loadMetaSdk(options: InitMetaSdkOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is undefined"));
      return;
    }

    if (window.FB) {
      resolve(window.FB);
      return;
    }

    window.fbAsyncInit = () => {
      try {
        window.FB.init({
          appId: options.appId,
          autoLogAppEvents: true,
          xfbml: true,
          version: options.apiVersion || "v25.0",
        });
        resolve(window.FB);
      } catch (err) {
        reject(err);
      }
    };

    if (!document.getElementById("facebook-jssdk")) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.async = true;
      js.defer = true;
      js.crossOrigin = "anonymous";
      js.onerror = () => reject(new Error("Failed to load Meta JavaScript SDK"));
      document.body.appendChild(js);
    }
  });
}
```

---

### 3.2. WhatsApp Flow Component (`components/onboarding/channel/WhatsAppFlow.tsx`)

`WhatsAppFlow.tsx` manages:
1. Fetching Meta config from backend (`GET /channels/meta/config`) with env fallbacks.
2. Initializing the Meta JS SDK.
3. Registering the `WA_EMBEDDED_SIGNUP` window message listener.
4. Triggering `FB.login` with the WhatsApp `config_id`.
5. Sending the payload `{ code, wabaId, phoneNumberId }` to `connectWhatsApp` instantly.
6. Displaying feedback, loading spinners, and error alerts.

```tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { connectWhatsApp, getMetaConfig } from "@/lib/api/channels";
import { WhatsAppChannelMetadata, MetaConfig } from "@/types/channels";

interface WhatsAppFlowProps {
  onSuccess: (metadata: WhatsAppChannelMetadata) => void;
  onCancel: () => void;
}

interface WabaSessionData {
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
  [key: string]: unknown;
}

const FALLBACK_META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || "";
const FALLBACK_META_CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID || "";

export function WhatsAppFlow({ onSuccess, onCancel }: WhatsAppFlowProps) {
  const t = useTranslations("onboarding.channel");
  const [configLoading, setConfigLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metaConfigRef = useRef<MetaConfig | null>(null);
  const wabaDataRef = useRef<WabaSessionData | null>(null);

  // 1. Fetch Config & Init SDK
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        let config: MetaConfig | null = null;
        try {
          config = await getMetaConfig();
        } catch {
          // Use env fallback if backend config endpoint fails
        }

        const appId = config?.appId || FALLBACK_META_APP_ID;
        const apiVersion = config?.apiVersion || "v25.0";
        metaConfigRef.current = config;

        if (!appId) {
          throw new Error("Meta App ID is not configured");
        }

        if (typeof window !== "undefined") {
          // Setup fbAsyncInit
          window.fbAsyncInit = () => {
            window.FB?.init({
              appId,
              autoLogAppEvents: true,
              xfbml: true,
              version: apiVersion,
            });
            if (!cancelled) setSdkReady(true);
          };

          // Inject SDK if not already present
          if (!document.getElementById("facebook-jssdk")) {
            const js = document.createElement("script");
            js.id = "facebook-jssdk";
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            js.async = true;
            js.defer = true;
            js.crossOrigin = "anonymous";
            js.onerror = () => {
              if (!cancelled) {
                setError(t("whatsapp_flow_sdk_error"));
              }
            };
            document.body.appendChild(js);
          } else if (window.FB) {
            window.FB.init({
              appId,
              autoLogAppEvents: true,
              xfbml: true,
              version: apiVersion,
            });
            if (!cancelled) setSdkReady(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("whatsapp_flow_sdk_error"));
        }
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [t]);

  // 2. Listen for WA_EMBEDDED_SIGNUP message events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin || (!event.origin.endsWith("facebook.com") && !event.origin.endsWith("meta.com"))) {
        return;
      }

      try {
        const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (payload?.type === "WA_EMBEDDED_SIGNUP") {
          if (payload.event === "FINISH" || payload.event?.startsWith("FINISH")) {
            wabaDataRef.current = payload.data || {};
          } else if (payload.event === "CANCEL") {
            // User cancelled embedded signup inside iframe
          }
        }
      } catch {
        // Non-JSON postMessage from 3rd-party frames, ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 3. Trigger FB.login popup
  const handleLaunchSignup = useCallback(() => {
    if (!window.FB) {
      setError(t("whatsapp_flow_sdk_error"));
      return;
    }

    const configId =
      metaConfigRef.current?.whatsappConfigId || FALLBACK_META_CONFIG_ID;

    if (!configId) {
      setError("Meta WhatsApp Configuration ID is missing");
      return;
    }

    setError(null);
    setConnecting(true);

    try {
      // Must pass a standard synchronous Function callback to FB.login because Meta JS SDK strictly validates against [object Function]
      window.FB.login(
        function (response: any) {
          if (response?.authResponse?.code) {
            const authCode = response.authResponse.code;
            const capturedWaba = wabaDataRef.current;

            connectWhatsApp({
              code: authCode,
              wabaId: capturedWaba?.waba_id,
              phoneNumberId: capturedWaba?.phone_number_id,
            })
              .then((res) => {
                setConnecting(false);
                onSuccess(res.channel.metadata as WhatsAppChannelMetadata);
              })
              .catch((err) => {
                setConnecting(false);
                setError(
                  err instanceof Error ? err.message : t("whatsapp_flow_error")
                );
              });
          } else {
            // User cancelled login or closed popup
            setConnecting(false);
          }
        },
        {
          config_id: configId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
          },
        }
      );
    } catch (err) {
      setConnecting(false);
      setError(err instanceof Error ? err.message : t("whatsapp_flow_error"));
    }
  }, [onSuccess, t]);

  const isBusy = configLoading || connecting;

  // UI markup follows Enterprise Minimalist standard...
}
```

---

### 3.3. TypeScript Interfaces & DTOs (`types/channels.ts`)

Verify and keep the contract in `types/channels.ts` fully aligned with backend requirements:

```typescript
export interface ConnectWhatsAppDto {
  code: string;
  wabaId?: string;
  phoneNumberId?: string;
  pin?: string;
  redirectUri?: string;
}

export interface WhatsAppChannelMetadata {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
}

export interface MetaConfig {
  appId?: string;
  instagramAppId?: string;
  whatsappConfigId?: string;
  apiVersion: string;
  instagramScopes: string[];
}
```

---

### 3.4. Prerequisite Settings in Facebook Developer Console

To ensure Meta JS SDK Embedded Signup works without CORS/OAuth errors:
1. Go to **Meta Developer Portal** (`developers.facebook.com`) -> Your App.
2. Navigate to **Facebook Login for Business** > **Settings** > **Client OAuth settings**.
3. Set **Login with the JavaScript SDK** to **Yes**.
4. In **Allowed Domains for the JavaScript SDK**, register:
   - Production URL: `https://app.yourdomain.com` (or current deployment domain)
   - Local Testing URL: `https://localhost:3000` (*Note: Must be HTTPS for Meta JS SDK*)
5. In **WhatsApp** > **Quickstart / Configuration**, confirm the Configuration ID is linked with required permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`

---

## 4. Implementation Plan

### Phase 1: Meta SDK Loader & Types Refinement
- Add ambient typings for `window.FB` and `window.fbAsyncInit` in `types/channels.ts` or `types/meta.d.ts`.
- Ensure `ConnectWhatsAppDto` and `MetaConfig` in `types/channels.ts` and `lib/api/channels.ts` match the backend contract.
- Support optional fallback environment variables (`NEXT_PUBLIC_META_APP_ID`, `NEXT_PUBLIC_META_CONFIG_ID`).

### Phase 2: Refactor `WhatsAppFlow.tsx`
- Replace manual `openOAuthPopup` / `dialog/oauth` URL logic with Meta JS SDK loading and `FB.login()`.
- Add `window.addEventListener('message')` listener for `WA_EMBEDDED_SIGNUP` event payload (`waba_id`, `phone_number_id`, `business_id`).
- Pass `{ config_id, response_type: 'code', override_default_response_type: true, extras: { setup: {} } }` to `FB.login`.
- Transmit auth `code` and captured `wabaId` / `phoneNumberId` immediately to `connectWhatsApp` (`POST /channels/whatsapp/connect`).
- Handle loading, connecting, error, and cancellation states with clean Russian UI feedback.

### Phase 3: Integration in Onboarding & Settings
- Verify `StageWhatsApp.tsx` (Onboarding Step 1) properly renders and responds to `onSuccess` / `onCancel`.
- Verify `ChannelCard.tsx` and `ChannelsManager.tsx` in `/settings/channels` trigger `WhatsAppFlow` seamlessly and refresh status on connection.

### Phase 4: Localization & Validation
- Check all Russian translations in `locales/ru/onboarding.json`, `channels.json`, and `api.json`.
- Run typecheck `npx tsc --noEmit` and build test `npm run build`.

---

## 5. Concise Execution Checklist

- [ ] **1. Types & Global Declarations**:
  - [ ] Add `FB` and `fbAsyncInit` ambient declarations to TypeScript definitions.
  - [ ] Ensure `ConnectWhatsAppDto` supports `{ code: string; wabaId?: string; phoneNumberId?: string }`.
- [ ] **2. Meta JS SDK Integration in `WhatsAppFlow.tsx`**:
  - [ ] Dynamically inject `https://connect.facebook.net/en_US/sdk.js` with `facebook-jssdk` ID.
  - [ ] Initialize SDK via `window.fbAsyncInit` with `appId` and `apiVersion` from `getMetaConfig()`.
  - [ ] Add `message` listener for `WA_EMBEDDED_SIGNUP` events from `facebook.com` / `meta.com`.
  - [ ] Store `waba_id` and `phone_number_id` in component ref.
  - [ ] Trigger `FB.login` with `config_id`, `response_type: 'code'`, `override_default_response_type: true`, `extras: { setup: {} }`.
  - [ ] Call `connectWhatsApp({ code, wabaId, phoneNumberId })` immediately upon receiving `response.authResponse.code`.
  - [ ] Handle error states, SDK load failures, and user cancellations gracefully.
- [ ] **3. Onboarding & Settings Flow Verification**:
  - [ ] Verify onboarding wizard step (`StageWhatsApp.tsx`) connects and transitions to Instagram step on success.
  - [ ] Verify settings channel card (`ChannelCard.tsx` / `ChannelsManager.tsx`) connects and refreshes channel list.
- [ ] **4. Translations & Localization**:
  - [ ] Ensure all user-facing texts use `useTranslations` without hardcoded Russian text.
- [ ] **5. Quality Assurance**:
  - [ ] Run `npx tsc --noEmit` to verify type safety.
  - [ ] Run `npm run build` to ensure clean build output.
