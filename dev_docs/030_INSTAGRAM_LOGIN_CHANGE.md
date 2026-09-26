# 030 — Migration to Direct Instagram Business Login (Frontend Implementation Plan)

> **Target Audience:** Frontend Developers, UI/UX Engineers  
> **Backend Reference:** `dev_docs/backend/059_INSTAGRAM_LOGIN_CHANGE.md`  
> **Related Documents:** `dev_docs/029_ONBOARDING_ORDER_CHANGE.md`, `dev_docs/018_PROJECT_LEVEL_DESIGN_ARCH_SPEC.md`  
> **Status:** 🎯 Definitive Technical Specification & Implementation Plan  

---

## 1. Executive Summary & Problem Context

### 1.1 The Problem with Legacy Facebook Login
Previously, connecting an Instagram channel required users to go through the **Facebook Login for Business** OAuth flow (`dialog/oauth` through `facebook.com`). This created high user drop-off and friction because users had to:
1. Log into a Facebook account.
2. Own or create a Facebook Page.
3. Link the Facebook Page to an Instagram Business account.

### 1.2 The Solution: Direct Instagram Business Login
Meta now provides **"Instagram API with Instagram Business Login"** (Direct Instagram OAuth). Workspace owners log in directly with their Instagram credentials (`https://www.instagram.com/oauth/authorize`), grant permissions directly for their Instagram Business/Creator profile, and connect in 1 click without any Facebook Page requirement.

---

## 2. Technical Architecture & Endpoints Matrix

| Action | Legacy Flow (Facebook Login) | Modern Flow (Instagram Business Login) | Protocol & Parameters |
|---|---|---|---|
| **Config Retrieval** | `GET /channels/meta/config` | `GET /channels/meta/config` | Response includes `instagramAppId` & `instagramScopes` |
| **OAuth Dialog** | `https://www.facebook.com/{v}/dialog/oauth` | `https://www.instagram.com/oauth/authorize` | Direct Instagram OAuth popup / redirect |
| **OAuth Query Params** | `client_id`, `redirect_uri`, `scope`, `response_type=code` | `client_id`, `redirect_uri`, `scope`, `response_type=code`, `enable_fb_login=0`, `force_authentication=1` | Pure Instagram login prompt; disables FB fallback |
| **Callback Trailing `#_`** | N/A | Appended by Instagram (`code=AQ...#_`) | Frontend must strip `#_` before POST to backend |
| **Error / Denied Callback** | `error=access_denied` | `error=access_denied&error_reason=user_denied` | Localized friendly cancellation banner |
| **Backend Connect Call** | `POST /channels/instagram/connect` | `POST /channels/instagram/connect` | Payload: `{ code: string, redirectUri: string }` |
| **Facebook Page Requirement** | Required (`pageId`) | **Omitted / Not required** | Direct account authorization |

---

## 3. Frontend Implementation Specifications

### 3.1. TypeScript Types Update (`types/channels.ts`)

Update Meta configuration and Instagram metadata interfaces:

```typescript
// 1. MetaConfig updated with instagramAppId
export interface MetaConfig {
  appId?: string;
  instagramAppId?: string; // NEW: Instagram App ID from Meta Developer Console
  whatsappConfigId?: string;
  apiVersion: string;
  instagramScopes: string[];
}

// 2. InstagramChannelMetadata updated (pageId is now optional/legacy)
export interface InstagramChannelMetadata {
  pageId?: string; // Optional (legacy FB page)
  pageName?: string;
  instagramId: string;
  igUsername?: string;
  name?: string;
  profilePictureUrl?: string;
}

// 3. ConnectInstagramDto (pageId is optional)
export interface ConnectInstagramDto {
  code: string;
  redirectUri: string;
  pageId?: string;
}
```

---

### 3.2. Instagram Authorization Flow (`components/onboarding/channel/InstagramFlow.tsx`)

#### A. Fetching Config & Building Authorize URL
When launching the OAuth popup:
1. Call `getMetaConfig()` to obtain `instagramAppId` and `instagramScopes`.
2. Fall back to `appId` only if `instagramAppId` is absent.
3. Target `https://www.instagram.com/oauth/authorize` with exact query parameters:

```typescript
const handleLaunchOAuth = () => {
  const clientId = instagramAppIdRef.current || appIdRef.current;
  if (!clientId) return;

  try {
    const redirectUri = getCallbackUri();
    const scopes = instagramScopesRef.current.length > 0
      ? instagramScopesRef.current.join(",")
      : "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments";

    const params = new URLSearchParams({
      enable_fb_login: "0",
      force_authentication: "1",
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes,
    });

    const oauthUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
    openOAuthPopup(oauthUrl, "instagram-oauth");
  } catch (err) {
    setError(err instanceof Error ? err.message : t("instagram_flow_error"));
  }
};
```

#### B. UI & Copy Updates in `InstagramFlow.tsx`
- **Prerequisites Section**:
  - Remove requirement 2 (*"Аккаунт Instagram должен быть привязан к странице Facebook"*).
  - Only keep requirement 1 (*"Instagram-аккаунт должен быть профессиональным (бизнес или автор)"*).
- **CTA Button**:
  - Change button label from *"Войти через Meta →"* to *"Войти через Instagram →"*.
- **Helper Hint**:
  - Change from *"Откроется всплывающее окно входа в Facebook"* to *"Откроется окно авторизации Instagram"*.

---

### 3.3. OAuth Callback Handling (`components/onboarding/channel/OAuthCallbackView.tsx`)

Instagram appends `#_` to the callback URL (e.g. `?code=AQD...#_` or inside hash). The callback handler must:
1. **Cleanse authorization code**: Strip trailing `#_` or hash fragments (`rawCode.replace(/#_$/, "").split("#")[0]`).
2. **Handle user cancellation**: When `error=access_denied` or `error_reason=user_denied`, display a friendly cancellation message (*"Авторизация Instagram была отменена"*) rather than a generic crash.
3. **Notify opener & execute connect**:
   - Post `INSTAGRAM_OAUTH_CODE` with sanitized `code` and `redirectUri`.
   - Call `POST /channels/instagram/connect` with `{ code, redirectUri }`.
   - On success, post `INSTAGRAM_CONNECTED` and auto-close the popup after 1.2s.

```typescript
// Code sanitization logic in OAuthCallbackView.tsx
const rawCode = urlParams.get("code") || hashParams.get("code");
const code = rawCode ? rawCode.replace(/#_$/, "").split("#")[0] : null;

const error =
  urlParams.get("error") ||
  urlParams.get("error_description") ||
  urlParams.get("error_reason");
```

---

### 3.4. Onboarding Stage & Settings UI (`StageInstagram.tsx` & `ChannelCard.tsx`)

1. **`StageInstagram.tsx` (Onboarding Wizard)**:
   - Update benefit 3 text: *"Прямой вход через Instagram Business"* (instead of *"Официальная интеграция Facebook Login"*).
   - Maintain Modern Minimalist Light SaaS aesthetic: clean white cards, soft violet/neutral accents, no AI gradients.
2. **`ChannelCard.tsx` (Settings `/settings/channels`)**:
   - Ensure `resolveDetail` correctly handles `@username` and `name` from `InstagramChannelMetadata`.
   - In-place connection triggers the updated `InstagramFlow` seamlessly.

---

### 3.5. Translation & Localization Keys

Add/update the following keys in `locales/translation_keys_new.json` and merge via `node scripts/apply-translation-keys.mjs`:

```json
{
  "onboarding.channel.instagram_btn": "Войти через Instagram",
  "onboarding.channel.instagram_flow_btn": "Войти через Instagram →",
  "onboarding.channel.instagram_flow_hint": "Откроется окно авторизации Instagram",
  "onboarding.channel.instagram_flow_prereq1": "Instagram-аккаунт должен быть профессиональным (бизнес или автор)",
  "onboarding.channel.instagram_flow_cancelled": "Авторизация Instagram была отменена",
  "onboarding.channel.instagram_benefit3": "Прямое подключение без страницы Facebook"
}
```

---

## 4. System Integrity & Cross-Channel Compatibility

1. **WhatsApp Flow (`WhatsAppFlow.tsx`)**: Unaffected. Still uses Meta Embedded Signup / `dialog/oauth` with `whatsappConfigId`.
2. **Telegram Flow (`TelegramFlow.tsx`)**: Unaffected. Continues using BotFather token exchange.
3. **PostMessage & Storage Channels**: The `useOAuthChannel` hook protocol (`INSTAGRAM_OAUTH_CODE`, `INSTAGRAM_CONNECTED`) remains backward-compatible.
4. **Proxy Route (`proxy.ts` / `app/(onboarding)/layout.tsx`)**: Callback route `/onboarding/instagram-callback` remains open without auth guards.

---

## 5. Self-Verification Checklist (Prevent Hallucinations)

Use this checklist during frontend development to verify all steps:

- [x] **1. Types & Client (`types/channels.ts`, `lib/api/channels.ts`)**:
  - [x] Add `instagramAppId?: string` to `MetaConfig`.
  - [x] Mark `pageId?: string` as optional in `InstagramChannelMetadata` and `ConnectInstagramDto`.
  - [x] Ensure `connectInstagram` accepts `{ code: string; redirectUri: string; pageId?: string }`.
- [x] **2. Instagram Flow (`components/onboarding/channel/InstagramFlow.tsx`)**:
  - [x] Fetch `cfg.instagramAppId` from `getMetaConfig()`.
  - [x] Generate authorize URL pointing strictly to `https://www.instagram.com/oauth/authorize`.
  - [x] Include query parameters: `enable_fb_login=0`, `force_authentication=1`, `client_id`, `redirect_uri`, `response_type=code`, `scope`.
  - [x] Update prerequisites: remove Facebook Page requirement; keep only Professional / Creator account requirement.
  - [x] Update button label and hint text to reference Instagram.
- [x] **3. OAuth Callback (`components/onboarding/channel/OAuthCallbackView.tsx` & `app/(onboarding)/onboarding/instagram-callback/page.tsx`)**:
  - [x] Sanitize authorization `code` by stripping trailing `#_` and hash fragments.
  - [x] Handle `error_reason=user_denied` and `error=access_denied` with user-friendly notification.
  - [x] Transmit clean `code` and `redirectUri` to backend `connectInstagram`.
  - [x] Auto-close popup and broadcast `INSTAGRAM_CONNECTED` event to opener.
- [x] **4. Onboarding & Settings UI Alignment (`StageInstagram.tsx`, `ChannelCard.tsx`)**:
  - [x] Update benefit badge copy in `StageInstagram.tsx`.
  - [x] Verify Instagram channel status and metadata rendering (`@username`, display name) in `/settings/channels`.
- [x] **5. Translations & Localization**:
  - [x] Add all updated Russian strings to `locales/translation_keys_new.json`.
  - [x] Run `node scripts/apply-translation-keys.mjs`.
  - [x] Run `node scripts/export-translation-keys.mjs`.
- [x] **6. Quality Assurance & Build**:
  - [x] Run TypeScript check: `npx tsc --noEmit` with zero errors.
  - [x] Run Next.js build: `npm run build` with zero errors.
