# 065_META_CHANNELS_CONNECTION_CHANGES: Meta Channels (Instagram & WhatsApp) Comprehensive Integration Audit & Execution Plan

> **Scope:** End-to-end audit of Kvik's Meta integrations (Instagram Business Login & WhatsApp Cloud API), verification of backend correctness against the latest Meta Graph API (v22.0+), concrete backend optimization checklist, and full frontend implementation contract for channel connections.

---

## 1. Executive Code Audit: Is Our Current Code Correct?

### 1.1. Summary Verdict

**YES, the core architecture is 90% correct and ready for production.**
The existing codebase in `src/modules/channels` and `src/modules/webhooks` already follows Meta's standard multi-tenant SaaS patterns:

1. **OAuth & Code Exchange:** Properly exchanges authorization codes for short-lived tokens and immediately upgrades them to 60-day long-lived tokens (`InstagramGraphApiClient.getLongLivedToken`).
2. **Encryption at Rest:** Sensitive access tokens (`accessToken`, `userAccessToken`) are encrypted using AES-256 (`EncryptionService`) before storing in PostgreSQL.
3. **Webhook Ingestion:** Unified endpoint `GET/POST /webhooks/meta` handles both verification handshakes and incoming webhook streaming for Instagram and WhatsApp.
4. **Adapter Pattern:** Clean separation between platform adapters (`InstagramMessagingAdapter`, `WhatsAppMessagingAdapter`) and the core `OrchestratorService`.

### 1.2. Identified Gaps & Required Backend Adjustments

While the architecture is sound, the following 4 specific technical gaps must be resolved for 100% bulletproof execution in both Dev Mode and Live Mode:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       IDENTIFIED GAPS & BACKEND FIXES                       │
├────────────────────┬────────────────────────────────────────────────────────┤
│ 1. API Version     │ Some hardcoded URLs use 'v21.0' instead of dynamic     │
│    Consistency     │ `${this.apiVersion}` (v22.0+).                         │
├────────────────────┼────────────────────────────────────────────────────────┤
│ 2. Instagram OAuth │ Support both direct Instagram Business Login OAuth and │
│    Fallback        │ Facebook Graph API OAuth fallback with matching URIs.  │
├────────────────────┼────────────────────────────────────────────────────────┤
│ 3. WhatsApp WABA   │ Ensure WABA webhook subscription uses the proper       │
│    Subscription    │ Graph API endpoint `POST /{wabaId}/subscribed_apps`.   │
├────────────────────┼────────────────────────────────────────────────────────┤
│ 4. Webhook Token   │ Webhook validation in `WebhooksController` must verify │
│    Matching        │ all possible tokens (`META`, `INSTAGRAM`, `WHATSAPP`). │
└────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Deep Dive: Channel Implementation Specifications

### 2.1. Instagram Messaging Channel (Direct Business Login Flow)

```
[ Frontend: Instagram OAuth Popup ]
         │ (Redirect with ?code=...)
         ▼
[ POST /channels/instagram/connect ] ──► [ Exchange Code for Short Token ]
                                                   │
                                                   ▼
                                         [ Exchange for 60-Day Long Token ]
                                                   │
                                                   ▼
                                         [ Fetch IG Account Details (/me) ]
                                                   │
                                                   ▼
                                         [ Subscribe IG to Webhooks ]
                                                   │
                                                   ▼
                                         [ Encrypt & Save to DB `Channel` ]
```

#### Step-by-Step Flow:

1. **Frontend Initiation:** User clicks "Connect Instagram" on Kvik dashboard.
   - Redirects to:
     ```text
     https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id={INSTAGRAM_APP_ID}&redirect_uri={FRONTEND_CALLBACK_URI}&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments
     ```
2. **Authorization Code Callback:** Meta redirects browser to `{FRONTEND_CALLBACK_URI}?code={AUTH_CODE}`.
3. **Backend Exchange (`POST /channels/instagram/connect`):**
   - Exchanges code for short-lived token via `https://api.instagram.com/oauth/access_token`.
   - Upgrades short token to 60-day token via `https://graph.instagram.com/access_token?grant_type=ig_exchange_token`.
   - Resolves profile info (`id`, `username`, `profile_picture_url`) via `https://graph.instagram.com/v22.0/me`.
   - Auto-subscribes app to account webhooks via `POST https://graph.instagram.com/v22.0/me/subscribed_apps`.
   - Encrypts and persists credentials in `Channel` table linked to `workspaceId`.

---

### 2.2. WhatsApp Business Cloud API (Embedded Signup v4 Flow)

```
[ Frontend: Meta Embedded Signup Popup (FB.login) ]
         │ (Returns session data & auth code)
         ▼
[ POST /channels/whatsapp/connect ] ──► [ Exchange Code for Business Token ]
                                                   │
                                                   ▼
                                         [ Register Phone Number (Cloud API) ]
                                                   │
                                                   ▼
                                         [ Subscribe WABA to Webhooks ]
                                                   │
                                                   ▼
                                         [ Encrypt & Save to DB `Channel` ]
```

#### Step-by-Step Flow:

1. **Frontend Initiation:** User clicks "Connect WhatsApp".
   - Frontend loads Meta JS SDK (`https://connect.facebook.net/en_US/sdk.js`).
   - Calls `FB.login` with `config_id: '{META_WHATSAPP_CONFIG_ID}'` and `response_type: 'code'`.
   - Captures `sessionInfoListener` message containing `waba_id` and `phone_number_id`.
2. **Backend Registration (`POST /channels/whatsapp/connect`):**
   - Exchanges code for access token via `https://graph.facebook.com/v22.0/oauth/access_token`.
   - Subscribes WABA to webhooks via `POST https://graph.facebook.com/v22.0/{wabaId}/subscribed_apps`.
   - Registers phone number with Meta Cloud API via `POST https://graph.facebook.com/v22.0/{phoneNumberId}/register`.
   - Queries verified business name and phone display number via `GET https://graph.facebook.com/v22.0/{phoneNumberId}`.
   - Encrypts and persists credentials in `Channel` table.

---

## 3. Master Backend Optimization Plan & Action Checklist

### Task Checklist for Backend:

- [x] **1. Standardize API Version across Meta Clients**
  - Standardized all Meta requests in `InstagramGraphApiClient`, `WhatsAppCloudApiClient`, `InstagramMessagingAdapter`, and `WhatsAppMessagingAdapter` to use dynamic `${this.apiVersion}` (v22.0+).
- [x] **2. Verify Webhook GET Handshake & HMAC-SHA256 Signature Verification (`/webhooks/meta`)**
  - Handshake checks against `META_VERIFY_TOKEN`, `INSTAGRAM_VERIFY_TOKEN`, and `WHATSAPP_VERIFY_TOKEN` and echoes back raw `hub.challenge`.
  - Added timing-safe HMAC-SHA256 verification of `x-hub-signature-256` using configured App Secrets with `rawBody: true`.
- [x] **3. Webhook Parsing Robustness & 24h Window Error Catching**
  - Parsing normalizes both Instagram Direct messages (`entry[].messaging[]`) and WhatsApp messages (`entry[].changes[].value.messages[]`).
  - Added detection and logging for WhatsApp customer service window expiration (codes `131047`, `131051`) with translation key `channels.whatsapp_24h_window_expired`.
- [x] **4. 60-Day Token Auto-Renewal Task**
  - Added `InstagramGraphApiClient.refreshToken(longLivedToken)` calling `GET /refresh_access_token?grant_type=ig_refresh_token`.
  - Added proactive `ensureValidToken()` in `InstagramChannelService` that auto-refreshes tokens within 7 days of expiration and updates encrypted database records.

---

## 4. Frontend Developer Guide: Channel Connection Integration

This section is prepared specifically for the **Frontend Engineer / Agent** to connect Instagram and WhatsApp from the Kvik dashboard settings.

### 4.1. Meta Configuration Endpoint

Before initiating any OAuth popup, the frontend fetches the current public Meta configuration:

```http
GET /api/v1/channels/meta/config
Authorization: Bearer {JWT_ACCESS_TOKEN}
```

**Response Payload (`200 OK`):**

```json
{
  "appId": "1569479327755652",
  "instagramAppId": "1402817568051677",
  "whatsappConfigId": "987654321098765",
  "apiVersion": "v22.0",
  "instagramScopes": [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments"
  ]
}
```

---

### 4.2. Implementing Instagram Connection (Frontend)

#### A. The OAuth Connect Button Action

When the user clicks **"Connect Instagram"**:

```typescript
export function startInstagramOAuth(config: MetaConfigResponseDto) {
  const redirectUri = `${window.location.origin}/onboarding/instagram-callback`;
  const scopes = config.instagramScopes.join(",");
  const clientId = config.instagramAppId || config.appId;

  const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}&response_type=code&scope=${encodeURIComponent(scopes)}`;

  // Redirect or open in popup
  window.location.href = authUrl;
}
```

#### B. Handling the Callback Route (`/onboarding/instagram-callback`)

On the callback page, parse the `code` parameter from the URL query and send it to the backend:

```typescript
// On page mount in /onboarding/instagram-callback:
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get("code");
const redirectUri = `${window.location.origin}/onboarding/instagram-callback`;

if (code) {
  try {
    const res = await fetch("/api/v1/channels/instagram/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        code,
        redirectUri,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      toast.success("Instagram successfully connected!");
      router.push("/dashboard/settings/channels");
    } else {
      toast.error(data.message || "Failed to connect Instagram");
    }
  } catch (err) {
    toast.error("Network error during Instagram connection");
  }
}
```

---

### 4.3. Implementing WhatsApp Embedded Signup (Frontend)

#### A. Load Meta JS SDK

Add the Meta SDK script to your application (or dynamically load on the settings page):

```typescript
export function loadFacebookSDK(): Promise<void> {
  return new Promise((resolve) => {
    if (window.FB) return resolve();
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v22.0",
      });
      resolve();
    };
    (function (d, s, id) {
      let js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  });
}
```

#### B. Launch Embedded Signup Popup

```typescript
export async function launchWhatsAppSignup(configId: string) {
  await loadFacebookSDK();

  let sessionWabaId: string | null = null;
  let sessionPhoneId: string | null = null;

  // 1. Listen for Embedded Signup session data event
  const messageHandler = (event: MessageEvent) => {
    if (
      event.origin !== "https://www.facebook.com" &&
      event.origin !== "https://web.facebook.com"
    ) {
      return;
    }
    try {
      const data = JSON.parse(event.data);
      if (data.type === "WA_EMBEDDED_SIGNUP") {
        if (data.event === "FINISH") {
          sessionWabaId = data.data?.waba_id;
          sessionPhoneId = data.data?.phone_number_id;
        }
      }
    } catch {}
  };

  window.addEventListener("message", messageHandler);

  // 2. Trigger FB.login popup
  window.FB.login(
    async (response: any) => {
      window.removeEventListener("message", messageHandler);

      if (response.authResponse?.code) {
        const code = response.authResponse.code;

        // 3. Send authorization code to Kvik Backend
        const res = await fetch("/api/v1/channels/whatsapp/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({
            code,
            wabaId: sessionWabaId,
            phoneNumberId: sessionPhoneId,
          }),
        });

        const result = await res.json();
        if (res.ok) {
          toast.success("WhatsApp Business connected successfully!");
        } else {
          toast.error(result.message || "Failed to connect WhatsApp");
        }
      }
    },
    {
      config_id: configId,
      response_type: "code",
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: "",
        sessionInfoVersion: "3",
      },
    },
  );
}
```

---

## 5. Channel Disconnect & Health Verification Endpoints

### 5.1. Disconnect Channel

```http
POST /api/v1/channels/{type}/disconnect
Authorization: Bearer {JWT}
```

- **Supported Types:** `INSTAGRAM`, `WHATSAPP`, `TELEGRAM`
- **Result:** Revokes tokens, unsubscribes webhooks, marks status as `DISCONNECTED`.

### 5.2. Get Channel Status & Health

```http
GET /api/v1/channels
Authorization: Bearer {JWT}
```

- Returns all channels for current workspace, connection status (`CONNECTED`, `ERROR`, `DISCONNECTED`), and token expiration timestamps.

---

## 6. Summary: Verification & Go-Live Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXECUTION ROADMAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Complete Business Verification in Meta (Done / In Review).               │
│ 2. Frontend implements OAuth buttons & callback handler as specified above. │
│ 3. Add Instagram Tester in Meta App Roles and connect test account in Dev.  │
│ 4. Send live DM on Instagram / WhatsApp → Verify AI responds in real-time.  │
│ 5. Record 1080p screencast of the flow and submit Meta App Review.          │
│ 6. Switch Meta App to LIVE mode upon approval.                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
