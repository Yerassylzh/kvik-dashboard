# 029 — Onboarding Flow Reordering & Telegram Alert Bot Integration (Frontend Plan)

> **Target Audience:** Frontend Developers, UI/UX Engineers, Full-Stack Developers  
> **Backend Reference:** `dev_docs/backend/058_ONBOARDING_ORDER_CHANGE.md`  
> **Related Documents:** `dev_docs/005_ONBOARDING_DESIGN_DECISION.md`, `dev_docs/018_PROJECT_LEVEL_DESIGN_ARCH_SPEC.md`, `dev_docs/backend/057_MAIN_APP_FRONTEND_055_EXPLAINED.md`  
> **Status:** 🎯 Definitive Technical Specification & Implementation Plan  

---

## 1. Executive Summary & Problem Context

### 1.1 Why We Are Updating the Onboarding Flow
The previous onboarding sequence placed messaging channel connection (WhatsApp/Instagram/Telegram) before lead qualification rules:

```
PREVIOUS SEQUENCE (Sub-optimal):
[1. Business Info] ──> [2. Knowledge Base] ──> [3. Channel Connection] ──> [4. Qualification Rules] ──> [Done]
```

This produced two critical UX friction points:
1. **Brain Before Channel:** Configuring AI knowledge without defining qualification rules left the AI assistant partially programmed when the owner connected public channels. Configuring knowledge ingestion + qualification rules consecutively gives the AI complete contextual intelligence *before* exposing it to live client channels.
2. **Missing Urgent Alerts Channel:** In the previous flow, owners connected customer-facing channels but had no alert mechanism for urgent human handoffs, lead escalations, or new bookings. Bringing Telegram Alert Bot connection into the wizard as the final step ensures every workspace owner receives instant push notifications from launch day.

### 1.2 Target Flow Sequence (7 Steps + Done)

```
TARGET SEQUENCE (Optimized 5-Phase Wizard):
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [0. Select Niche] ──> [1. Business Profile]   (Phase 1: Business Identity)                             │
│ ──> [2. Knowledge Ingest] ──> [3. Data Preview] (Phase 2: AI Knowledge Base)                           │
│ ──> [4. Lead Qualification]                   (Phase 3: AI Behavior & Qualification) 🔄 Moved Earlier  │
│ ──> [5. Connect Channels]                     (Phase 4: Customer Channels) 🔄 Moved After Qual         │
│ ──> [6. Telegram Alerts]                      (Phase 5: Team Push Notifications) 🆕 New Step           │
│ ──> [7. DONE]                                 (Launch Dashboard)                                       │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Principles & Distinctions

### 2.1 The Two Distinct Telegram Integrations

It is crucial to keep the two Telegram integrations completely decoupled in the frontend UI, types, and API calls:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   THE TWO TELEGRAM INTEGRATIONS IN KVIK                                 │
├──────────────────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ 1. Client Messaging Channel (Step 5)     │ 2. Team Push Alerts & Escalations (Step 6)                   │
├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ • Entity: `ChannelType.TELEGRAM`         │ • Entity: `NotificationRecipient`                            │
│ • Audience: **End Customers**            │ • Audience: **Business Owner / Team Staff**                  │
│ • What it is: Custom business bot        │ • What it is: Official Kvik Alert Bot (`@KvikNotifyBot`)     │
│   created by owner via @BotFather.       │   sending push alerts to the owner's personal Telegram.      │
│ • Purpose: Clients chat with AI for      │ • Purpose: Owner gets pinged for urgent human takeover,      │
│   bookings, pricing, and questions.      │   new bookings, cancellations, and escalation events.        │
│ • Auth: Bot token pasted from @BotFather │ • Auth: 1-click deep link `t.me/KvikNotifyBot?start=CODE`    │
│   or skipped in onboarding.              │   or QR code scan; completely skippable in onboarding.       │
│ • Permanent Home: `/settings/channels`   │ • Permanent Home: `/settings/notifications`                  │
└──────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

### 2.2 Settings vs Onboarding Coexistence
- **Settings (`/settings/notifications`):** Remains the full-featured management hub for listing, editing notification types, and deleting Telegram recipients (`TelegramRecipientsCard.tsx`).
- **Onboarding Step 6 (`<StepTelegramAlerts />`):** Acts as a frictionless 1-click linker. If skipped, the user can configure it at any time in Settings. Completing or skipping the step immediately advances the workspace state to `DONE`.

---

## 3. UI/UX Design System: Anti-AI, Minimalist & Scannable

To strictly comply with the **Modern Minimalist Light SaaS Standard** (`AGENTS.md`), the new onboarding step and updated stepper must adhere to strict aesthetic and anti-AI rules:

### 3.1 Strict Anti-AI Rules (Prohibited Patterns)
- ❌ **No multi-color gradients:** Remove legacy `bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400` from the progress bar. Use clean, single-accent solid MoonAI Violet (`bg-primary` / `#7C3AED`).
- ❌ **No glowing borders or neon pulse rings:** Prohibit `animate-ping` radar circles, ambient glow drop-shadows, and neon outlines.
- ❌ **No gradient text:** All headers must be crisp solid slate (`text-foreground` / `#0F172A`).
- ❌ **No paragraph bloat:** Keep titles 20–24px bold with at most a 1-line subtitle.
- ❌ **No nested card-in-card clutter:** No gray-bordered boxes placed inside other gray-bordered boxes.

### 3.2 Single Accent Color Rule (`#7C3AED` / `var(--primary)`)
The signature brand accent is used strictly in 5 places:
1. Stepper active progress fill & active tab indicator.
2. Primary CTA buttons (`Button variant="primary"`).
3. Active toggle switches.
4. Primary pill badges (`bg-primary/10 text-primary border-primary/20`).
5. Focus rings on interactive inputs.

All numbers, codes, counters, and timers must use `tabular-nums` and font-mono for clear readability.

---

## 4. UI Layout & Scannability: `<StepTelegramAlerts />`

The step is structured as a balanced, high-contrast 2-column card surface that can be scanned and completed in under 10 seconds:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🔔] Оповещения в Telegram                                                                     │
│ Получайте мгновенные уведомления о новых записях и запросах клиентов на вызов администратора.   │
├────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│ СПОСОБ 1: Камера смартфона                     │ СПОСОБ 2: Прямой переход                       │
│                                                │                                                │
│ ┌────────────────────────────────────────────┐ │ ┌────────────────────────────────────────────┐ │
│ │                                            │ │ │ [ 📱 Открыть бота в Telegram ] (Primary)   │ │
│ │             [ QR-КОД 180x180 ]             │ │ └────────────────────────────────────────────┘ │
│ │        (Высококонтрастный SVG/Canvas)      │ │                                                │
│ │                                            │ │ СПОСОБ 3: Ручной код                           │
│ └────────────────────────────────────────────┘ │ Отправьте код боту @KvikNotifyBot:             │
│                                                │ ┌──────────────────────────────┬─────────────┐ │
│ Отсканируйте камерой телефона для              │ │ KVIK-A1B2C3D4                │ Скопировать │ │
│ мгновенного перехода в Telegram                │ └──────────────────────────────┴─────────────┘ │
├────────────────────────────────────────────────┴────────────────────────────────────────────────┤
│ СТАТУС ПОДКЛЮЧЕНИЯ:                                                                            │
│ ⏳ Ожидание подключения... (Проверка каждые 2.5 сек)                                            │
│ [или при успехе: ✓ Подключено: @username • Уведомления активны]                                │
├────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│ [ Пропустить этот шаг ] (Secondary / Ghost)    │ [ Завершить настройку ➔ ] (Primary CTA)        │
└────────────────────────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 5. Proxies & API Routing Architecture

### 5.1 Next.js API Catch-All Proxy (`app/api/[...proxy]/route.ts`)
The existing catch-all proxy in `app/api/[...proxy]/route.ts` forwards all `/api/*` traffic to `BACKEND_URL/*`.

#### Requirements for New Onboarding Endpoints:
1. **Endpoint Resolution:** Frontend calls via `apiClient` (`/onboarding/step/telegram-alerts/*`) are routed to `http://localhost:3000/api/onboarding/step/telegram-alerts/*` and forwarded automatically to `BACKEND_URL/onboarding/step/telegram-alerts/*`.
2. **Method Support:** Proxy must pass through `GET`, `POST`, and `PATCH` methods without dropping Authorization cookies or headers.
3. **Polling Timeout Protection:** Set polling frequency to 2.5 seconds with maximum timeout cutoff (120s) to prevent dangling connections.

```typescript
// Proxy forwarding mapping:
POST /api/onboarding/step/telegram-alerts/generate-code -> BACKEND_URL/onboarding/step/telegram-alerts/generate-code
GET  /api/onboarding/step/telegram-alerts/status        -> BACKEND_URL/onboarding/step/telegram-alerts/status
POST /api/onboarding/step/telegram-alerts/confirm      -> BACKEND_URL/onboarding/step/telegram-alerts/confirm
POST /api/onboarding/step/telegram-alerts/skip         -> BACKEND_URL/onboarding/step/telegram-alerts/skip
```

### 5.2 Next.js Middleware & Route Guard (`proxy.ts`)
1. `/onboarding` is a protected route requiring valid auth cookies (`kvik_token`, `access_token`, or `refresh_token`).
2. Concierge handoff via `/claim-workspace` authenticates the client and redirects to `/onboarding`.
3. `GET /onboarding/state` returns derived state `step: "CONNECT_CHANNEL"` (since steps 0–4 are completed by concierge), smoothly routing the client through `CONNECT_CHANNEL` $\rightarrow$ `TELEGRAM_ALERTS` $\rightarrow$ `DONE`.

---

## 6. Frontend State Machine & Component Architecture

### 6.1 Step Mapping & State Enum (`types/niche.ts`)

```typescript
export type OnboardingStepState =
  | 'SELECT_NICHE'       // Step 0
  | 'BUSINESS_PROFILE'   // Step 1
  | 'DATA_SOURCE'        // Step 2
  | 'DATA_PREVIEW'       // Step 3
  | 'QUALIFICATION'      // Step 4 (Moved earlier)
  | 'CONNECT_CHANNEL'    // Step 5 (Moved after qualification)
  | 'TELEGRAM_ALERTS'    // Step 6 (New step)
  | 'DONE';              // Step 7 (Completed)

export interface GenerateTelegramAlertsCodeResponse {
  deepLink: string;
  code: string;
  expiresAt: string;
}

export interface TelegramAlertRecipientDto {
  id: string;
  displayName: string;
  telegramChatId: string;
  notificationTypes: string[];
  isActive: boolean;
  createdAt: string;
}

export interface TelegramAlertsStatusResponse {
  connected: boolean;
  recipients: TelegramAlertRecipientDto[];
}
```

---

### 6.2 API Client Methods (`lib/api/onboarding.ts`)

```typescript
// Telegram Alerts Step (Step 6)
export async function generateTelegramAlertsCode(): Promise<GenerateTelegramAlertsCodeResponse> {
  const { data } = await apiClient.post<GenerateTelegramAlertsCodeResponse>(
    '/onboarding/step/telegram-alerts/generate-code'
  );
  return data;
}

export async function getTelegramAlertsStatus(): Promise<TelegramAlertsStatusResponse> {
  const { data } = await apiClient.get<TelegramAlertsStatusResponse>(
    '/onboarding/step/telegram-alerts/status'
  );
  return data;
}

export async function confirmTelegramAlertsStep(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>(
    '/onboarding/step/telegram-alerts/confirm'
  );
  return data;
}

export async function skipTelegramAlertsStep(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>(
    '/onboarding/step/telegram-alerts/skip'
  );
  return data;
}
```

---

### 6.3 Stepper Configuration (`components/onboarding/OnboardingHeader.tsx`)

Update `STEP_META` dictionary with the new order and index hierarchy:

```typescript
export const STEP_META: Record<
  OnboardingStepState,
  { index: number; titleKey: string; subtitleKey: string }
> = {
  SELECT_NICHE: {
    index: 0,
    titleKey: "stepper.select_niche_title",
    subtitleKey: "stepper.select_niche_subtitle",
  },
  BUSINESS_PROFILE: {
    index: 1,
    titleKey: "stepper.business_profile_title",
    subtitleKey: "stepper.business_profile_subtitle",
  },
  DATA_SOURCE: {
    index: 2,
    titleKey: "stepper.data_source_title",
    subtitleKey: "stepper.data_source_subtitle",
  },
  DATA_PREVIEW: {
    index: 3,
    titleKey: "stepper.data_preview_title",
    subtitleKey: "stepper.data_preview_subtitle",
  },
  QUALIFICATION: {
    index: 4,
    titleKey: "stepper.qualification_title",
    subtitleKey: "stepper.qualification_subtitle",
  },
  CONNECT_CHANNEL: {
    index: 5,
    titleKey: "stepper.channel_title",
    subtitleKey: "stepper.channel_subtitle",
  },
  TELEGRAM_ALERTS: {
    index: 6,
    titleKey: "stepper.telegram_alerts_title",
    subtitleKey: "stepper.telegram_alerts_subtitle",
  },
  DONE: {
    index: 7,
    titleKey: "stepper.done_title",
    subtitleKey: "stepper.done_subtitle",
  },
};

export const TOTAL_STEPS = 7;
```

#### Refactored Minimalist Progress Bar:
```tsx
{/* Clean Minimalist Progress Bar without Multi-color Gradients */}
<div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
  <div
    className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
    style={{ width: `${progressPercent}%` }}
  />
</div>
```

---

### 6.4 Onboarding Flow Hook Updates (`hooks/useOnboardingFlow.ts`)

1. **Remove Legacy `COMPLETE_TEST` Hacks:** Remove the automatic step skip on `COMPLETE_TEST` since `TELEGRAM_ALERTS` is the final step transitioning directly to `DONE`.
2. **Add Telegram Alerts Handlers:**
   - `handleConfirmTelegramAlerts()` $\rightarrow$ calls `confirmTelegramAlertsStep()`, transitions to `DONE` and redirects to `/`.
   - `handleSkipTelegramAlerts()` $\rightarrow$ calls `skipTelegramAlertsStep()`, transitions to `DONE` and redirects to `/`.
3. **Step Transition Updates:**
   - `handleConfirmDataPreview()` $\rightarrow$ transitions to `QUALIFICATION` (Step 4).
   - `handleSubmitQualification()` $\rightarrow$ transitions to `CONNECT_CHANNEL` (Step 5).
   - `handleChannelStepContinue()` $\rightarrow$ transitions to `TELEGRAM_ALERTS` (Step 6).

---

### 6.5 New Step Component: `<StepTelegramAlerts />` (`components/onboarding/StepTelegramAlerts.tsx`)

#### Component Architecture & Lifecycle:
1. **On Mount:**
   - Call `generateTelegramAlertsCode()`.
   - Store `deepLink` (`https://t.me/KvikNotifyBot?start=CODE`), `code`, and `expiresAt`.
   - Render clean QR code via a lightweight SVG/Canvas QR component with quiet zone and dark slate modules on white background.
2. **Polling Effect (Every 2.5 seconds):**
   - Query `getTelegramAlertsStatus()`.
   - If `status.connected === true`:
     - Update UI state to show green confirmation badge: `✓ Подключено: @${recipient.displayName}`.
     - Play subtle spring scale-in on the success state.
     - Enable primary action button "Завершить настройку".
3. **Action Triggers:**
   - **Direct Telegram Link:** `window.open(deepLink, '_blank', 'noopener,noreferrer')`.
   - **Copy Code Button:** Copies code to clipboard with 2-second "Скопировано!" feedback.
   - **Continue Action:** Calls `handleConfirmTelegramAlerts()`.
   - **Skip Action:** Calls `handleSkipTelegramAlerts()`.

---

## 7. Localization & Translation Strategy (`locales/`)

All user-facing copy must be in Russian and managed via the translation system. Add new keys to `locales/translation_keys_new.json`:

```json
{
  "onboarding.stepper.telegram_alerts_title": "Уведомления в Telegram",
  "onboarding.stepper.telegram_alerts_subtitle": "Подключите личный Telegram для получения срочных уведомлений и запросов на вызов администратора",
  "onboarding.telegram_alerts.badge": "ВАЖНО",
  "onboarding.telegram_alerts.qr_heading": "Способ 1: С помощью камеры",
  "onboarding.telegram_alerts.qr_hint": "Отсканируйте камерой телефона для мгновенного перехода в Telegram",
  "onboarding.telegram_alerts.direct_heading": "Способ 2: Прямая ссылка",
  "onboarding.telegram_alerts.direct_btn": "Открыть бота в Telegram",
  "onboarding.telegram_alerts.manual_heading": "Способ 3: Код подключения",
  "onboarding.telegram_alerts.manual_desc": "Отправьте этот код официальному боту @KvikNotifyBot:",
  "onboarding.telegram_alerts.copy_btn": "Скопировать",
  "onboarding.telegram_alerts.copied": "Скопировано",
  "onboarding.telegram_alerts.status_waiting": "Ожидание подключения ботом...",
  "onboarding.telegram_alerts.status_connected": "Telegram успешно подключен",
  "onboarding.telegram_alerts.btn_complete": "Завершить настройку →",
  "onboarding.telegram_alerts.btn_skip": "Пропустить этот шаг"
}
```

### Translation Build Script Execution:
```bash
node scripts/apply-translation-keys.mjs
node scripts/export-translation-keys.mjs
```

---

## 8. Frontend Implementation Master Checklist

### 1. Types & Data Models
- [ ] Update `OnboardingStepState` union in `types/niche.ts` to include `'TELEGRAM_ALERTS'` and remove `'COMPLETE_TEST'`.
- [ ] Add `GenerateTelegramAlertsCodeResponse`, `TelegramAlertsStatusResponse`, and `TelegramAlertRecipientDto` to `types/niche.ts`.
- [ ] Ensure `types/openapi.ts` reflects updated DTO contracts.

### 2. API Layer & Proxies
- [ ] Add `generateTelegramAlertsCode()`, `getTelegramAlertsStatus()`, `confirmTelegramAlertsStep()`, and `skipTelegramAlertsStep()` in `lib/api/onboarding.ts`.
- [ ] Verify `app/api/[...proxy]/route.ts` forwards `POST` and `GET` requests to `/onboarding/step/telegram-alerts/*` without header drops.
- [ ] Verify `proxy.ts` middleware route guards protect `/onboarding` and allow clean auth redirection.

### 3. State Management & Hooks
- [ ] Update `store/onboarding.store.ts` initial step state and type definitions.
- [ ] Update `STEP_META` in `components/onboarding/OnboardingHeader.tsx` with new step indices (0 to 7) and total step count (7).
- [ ] Replace multi-color gradient in `OnboardingHeader.tsx` with solid `bg-primary` bar.
- [ ] Update `hooks/useOnboardingFlow.ts` transition handlers:
  - [ ] `handleConfirmDataPreview` $\rightarrow$ transitions to `QUALIFICATION`.
  - [ ] `handleSubmitQualification` $\rightarrow$ transitions to `CONNECT_CHANNEL`.
  - [ ] `handleChannelStepContinue` $\rightarrow$ transitions to `TELEGRAM_ALERTS`.
  - [ ] Implement `handleConfirmTelegramAlerts` and `handleSkipTelegramAlerts`.
  - [ ] Clean up legacy `COMPLETE_TEST` auto-complete logic.

### 4. Components & Views
- [ ] Create `components/onboarding/StepTelegramAlerts.tsx`:
  - [ ] Two-column minimalist layout (QR code container + Direct button + Copyable code).
  - [ ] Polling loop (2.5s) checking connection status with clear status pill.
  - [ ] Smooth transition to verified state upon successful link.
  - [ ] "Пропустить этот шаг" secondary action & "Завершить настройку" primary CTA.
- [ ] Update `app/(onboarding)/onboarding/page.tsx`:
  - [ ] Mount `<StepQualification />` at step `QUALIFICATION` (index 4).
  - [ ] Mount `<StepConnectChannel />` at step `CONNECT_CHANNEL` (index 5).
  - [ ] Mount `<StepTelegramAlerts />` at step `TELEGRAM_ALERTS` (index 6).
- [ ] Update `components/auth/ClaimWorkspaceForm.tsx` to verify claimed workspace transitions cleanly to `CONNECT_CHANNEL` $\rightarrow$ `TELEGRAM_ALERTS` $\rightarrow$ `DONE`.

### 5. Localization & Verification
- [ ] Add translation keys to `locales/translation_keys_new.json`.
- [ ] Run `node scripts/apply-translation-keys.mjs` and `node scripts/export-translation-keys.mjs`.
- [ ] Run `npm run build` to verify strict TypeScript and Next.js compilation with zero type errors.
- [ ] Test end-to-end onboarding flow manually:
  - [ ] Fresh registration $\rightarrow$ Steps 0 to 6 $\rightarrow$ Launch.
  - [ ] Skipping Telegram alerts step $\rightarrow$ Lands in `/` and verifies Settings retains recipient manager.
  - [ ] Claiming workspace invite $\rightarrow$ Lands on `CONNECT_CHANNEL` $\rightarrow$ `TELEGRAM_ALERTS` $\rightarrow$ Launch.
