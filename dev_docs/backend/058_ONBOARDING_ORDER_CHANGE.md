# 058 — Onboarding Flow Reordering & Telegram Alert Bot Step Specification

> **Target Audience:** Frontend Developers (Main Client App), Backend Developers, QA Engineers  
> **Related Documents:** `dev_docs/001_REALTY_ONBOARDING_PLAN.md`, `dev_docs/003_REALTY_ONBOARDING_FIXES_PLAN.md`, `dev_docs/054_HOW_SUPERADMIN_ONBOARDS_AND_MANAGES_WORKSPACES.md`, `dev_docs/055_SUPERADMIN_AND_CONCIERGE_ONBOARDING_SPEC.md`, `dev_docs/057_MAIN_APP_FRONTEND_055_EXPLAINED.md`  
> **Status:** 🎯 Definitive Technical Specification & Implementation Plan  

---

## 1. Executive Summary

### 1.1 Why We Are Changing the Flow
The current onboarding flow places lead qualification questions after messaging channel connection:
1. Business Info
2. Knowledge Base
3. Messaging Channel Connection (WhatsApp, Instagram, Telegram Bot for client conversations)
4. Lead Qualification Rules

This creates two friction points:
1. **Context Fragmentation:** Setting up AI knowledge and AI behavior (qualification rules) should happen together before attaching public messaging channels. Configuring qualification right after knowledge base gives the AI all its brainpower before connecting the communication line.
2. **Missing Notification Channel:** Once the AI is live and talking with clients, business owners need urgent alerts (lead escalations, new bookings, human-takeover requests). While Telegram bot notification setup exists in Settings (`/notifications/recipients`), putting it as the final step of the onboarding wizard guarantees every owner connects Kvik's alert bot before launching.

### 1.2 Summary of Order Change

```
OLD FLOW (4 Steps):
[1. Business Info] ──> [2. Knowledge Base] ──> [3. Channel Connection] ──> [4. Qualification Rules] ──> [Done]

NEW FLOW (5 Steps):
[1. Business Info] ──> [2. Knowledge Base] ──> [3. Qualification Rules] ──> [4. Channel Connection] ──> [5. Telegram Alerts] ──> [Done]
```

---

## 2. Step-by-Step Flow Comparison

| Step # | UI Step Title | Old Internal Step Name & Index | New Internal Step Name & Index | Completion Flag in DB |
|---|---|---|---|---|
| **Step 0** | Vertical / Niche | `SELECT_NICHE` (0) | `SELECT_NICHE` (0) | `workspace.nicheProfile != null` |
| **Step 1** | Business Profile | `BUSINESS_PROFILE` (1) | `BUSINESS_PROFILE` (1) | `workspace.businessName != null` |
| **Step 2** | Knowledge Ingestion | `DATA_SOURCE` (2) | `DATA_SOURCE` (2) | `metadata.dataSourceConfirmed == true` |
| **Step 3** | Knowledge Preview & Confirm | `DATA_PREVIEW` (3) | `DATA_PREVIEW` (3) | `workspace.knowledgeConfirmed == true` |
| **Step 4** | **Qualification Rules** 🔄 *(Moved earlier)* | `CONNECT_CHANNEL` (4) | `QUALIFICATION` (4) | `workspace.qualificationRulesSet == true` |
| **Step 5** | **Channel Connection** 🔄 *(Moved after qual)* | `QUALIFICATION` (5) | `CONNECT_CHANNEL` (5) | `workspace.channelConfirmed == true` |
| **Step 6** | **Telegram Alerts** 🆕 *(New step)* | *(Did not exist in wizard)* | `TELEGRAM_ALERTS` (6) | `workspace.telegramAlertsConfirmed == true` |
| **Step 7** | Done / Complete | `DONE` (6) | `DONE` (7) | `workspace.isActive == true` |

---

## 3. The Distinction Between the Two Telegram Steps

It is crucial for frontend and backend developers to distinguish between the **two completely different Telegram features** in Kvik:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE TWO TELEGRAM INTEGRATIONS IN KVIK                                  │
├─────────────────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ 1. Client Messaging Channel (Step 5)    │ 2. Team Alerts & Escalations (Step 6)                        │
├─────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ • Type: `ChannelType.TELEGRAM`          │ • Type: `NotificationRecipient`                              │
│ • Who uses it: **End Customers**        │ • Who uses it: **Business Owner / Staff**                    │
│ • What it is: The business's own bot   │ • What it is: Kvik's official alert bot (`@KvikNotifyBot`)   │
│   created via @BotFather.               │   sending push notifications to the owner's personal TG.     │
│ • Purpose: Clients chat with the AI.    │ • Purpose: Owner gets pinged when a human must take over     │
│                                         │   or when a new booking is confirmed.                        │
│ • How it connects: Token from BotFather │ • How it connects: Deep link `t.me/KvikNotifyBot?start=CODE` │
│   or skipped in onboarding.             │   or QR code scan, or skipped in onboarding.                 │
└─────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 4. Backend Architecture & Changes

### 4.1 Prisma Schema & Database Changes

Add `telegramAlertsConfirmed` boolean flag to the `Workspace` model in `prisma/schema.prisma`:

```prisma
model Workspace {
  id                    String            @id @default(uuid())
  name                  String
  nicheProfile          NicheProfile?
  subSegment            String?

  // Business profile
  businessName          String?
  city                  String?
  businessPhone         String?
  businessEmail         String?
  businessAddress       String?
  businessDescription   String?
  websiteUrl            String?
  instagramUrl          String?

  // Knowledge & State progression flags
  knowledgeConfirmed        Boolean       @default(false)
  qualificationRulesSet     Boolean       @default(false)
  channelConfirmed          Boolean       @default(false)
  telegramAlertsConfirmed   Boolean       @default(false) // 🆕 NEW FIELD
  qualificationRules        Json?
  isActive                  Boolean       @default(false)
  vipRequested              Boolean       @default(false)
  plan                      Plan          @default(STARTER)
  metadata                  Json?
  ownerId                   String
  ...
}
```

#### Migration SQL
```sql
ALTER TABLE "workspaces" ADD COLUMN "telegramAlertsConfirmed" BOOLEAN NOT NULL DEFAULT false;
```

---

### 4.2 Updated TypeScript Types (`onboarding-state.service.ts`)

```typescript
export type OnboardingStep =
  | 'SELECT_NICHE'
  | 'BUSINESS_PROFILE'
  | 'DATA_SOURCE'
  | 'DATA_PREVIEW'
  | 'QUALIFICATION'       // Step 4 (Index 4)
  | 'CONNECT_CHANNEL'     // Step 5 (Index 5)
  | 'TELEGRAM_ALERTS'     // Step 6 (Index 6) 🆕
  | 'DONE';               // Step 7 (Index 7)

export interface OnboardingState {
  step: OnboardingStep;
  stepIndex: number;
  completed: boolean;
  parsingStatus?: string;
  parsedCount?: number;
  totalCount?: number;
  failedCount?: number;
  error?: string;
}
```

---

### 4.3 Deterministic State Derivation Logic (`OnboardingStateService.getState`)

The state engine will derive the exact step using the updated sequence:

```typescript
async getState(workspaceId: string): Promise<OnboardingState> {
  const workspace = await this.workspacesRepository.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException({
      code: 'onboarding.workspace_not_found',
      message: 'Workspace not found',
      isRaw: false,
    });
  }

  const meta = (workspace.metadata as Record<string, unknown>) ?? {};

  // Step 0: Select Niche
  if (!workspace.nicheProfile) {
    return { step: 'SELECT_NICHE', stepIndex: 0, completed: false };
  }

  // Step 1: Business Profile Info
  if (!workspace.businessName) {
    return { step: 'BUSINESS_PROFILE', stepIndex: 1, completed: false };
  }

  // Step 2: Knowledge Ingestion
  const isDataSourceConfirmed = Boolean(
    workspace.knowledgeConfirmed ||
    meta.dataSourceConfirmed ||
    meta.dataSourceSubmitted,
  );
  if (!isDataSourceConfirmed) {
    return {
      step: 'DATA_SOURCE',
      stepIndex: 2,
      completed: false,
      ...this.parsingProgress(meta, 'IDLE'),
    };
  }

  // Step 3: Preview & Confirm Knowledge
  if (!workspace.knowledgeConfirmed) {
    return {
      step: 'DATA_PREVIEW',
      stepIndex: 3,
      completed: false,
      ...this.parsingProgress(meta, 'DONE'),
    };
  }

  // Step 4: Qualification Rules (NEW POSITION)
  if (!workspace.qualificationRulesSet) {
    return { step: 'QUALIFICATION', stepIndex: 4, completed: false };
  }

  // Step 5: Messaging Channel Connection (NEW POSITION)
  if (!workspace.channelConfirmed) {
    return { step: 'CONNECT_CHANNEL', stepIndex: 5, completed: false };
  }

  // Step 6: Telegram Alert Bot Connection (NEW STEP)
  if (!workspace.telegramAlertsConfirmed) {
    return { step: 'TELEGRAM_ALERTS', stepIndex: 6, completed: false };
  }

  // Step 7: Completed
  return { step: 'DONE', stepIndex: 7, completed: true };
}
```

---

### 4.4 Automatic Webhook Advancement

When the business owner opens Telegram and taps `/start KVIK-XXXX`, the existing webhook (`POST /webhooks/telegram/notifications` handled in `NotificationsRecipientsService`) will automatically mark `telegramAlertsConfirmed: true` on the workspace:

```typescript
// Inside NotificationsRecipientsService.handleTelegramBotUpdate:
await this.notificationsRepository.upsertRecipient({
  workspaceId: connectCode.workspaceId,
  addedByUserId: connectCode.addedByUserId,
  telegramChatId: chatId,
  displayName: userDisplayName,
  notificationTypes: ['escalation', 'new_booking', 'booking_cancelled'],
});

await this.notificationsRepository.markConnectCodeUsed(code);

// Auto-advance onboarding flag if not set yet
await this.workspacesRepository.update(connectCode.workspaceId, {
  telegramAlertsConfirmed: true,
});
```

This means frontend polling will instantly detect the step completion without requiring the user to manually click "Done" if they connected via their phone!

---

## 5. API Endpoints Specification

### 5.1 Onboarding Wizard Endpoints Matrix

| HTTP Method | Path | Request Body | Response Body | Description |
|---|---|---|---|---|
| `GET` | `/onboarding/state` | — | `OnboardingStateResponseDto` | Returns current derived step & progress |
| `POST` | `/onboarding/step/niche` | `{ nicheProfile }` | `OnboardingStateResponseDto` | Step 0: Save business niche |
| `POST` | `/onboarding/step/business-profile` | `BusinessProfileDto` | `OnboardingStateResponseDto` | Step 1: Save business profile info |
| `POST` | `/onboarding/step/data-source` | `{ ... }` | `DataSourceResponseDto` | Step 2: Confirm ingestion started |
| `GET` | `/onboarding/step/data-preview` | — | `DataPreviewResponseDto` | Step 3: Fetch parsed KB objects & status |
| `POST` | `/onboarding/step/data-confirm` | — | `OnboardingStateResponseDto` | Step 3: Confirm KB data (advances to `QUALIFICATION`) |
| `POST` | `/onboarding/step/qualification` | `QualificationDto` | `OnboardingStateResponseDto` | Step 4: Save qualification rules (advances to `CONNECT_CHANNEL`) |
| `POST` | `/onboarding/step/channel` | `ConnectChannelDto` | `OnboardingStateResponseDto` | Step 5: Connect channel (advances to `TELEGRAM_ALERTS`) |
| `POST` | `/onboarding/step/channel-confirm` | — | `OnboardingStateResponseDto` | Step 5: Confirm channel step (advances to `TELEGRAM_ALERTS`) |
| `POST` | `/onboarding/step/channel-skip` | — | `OnboardingStateResponseDto` | Step 5: Skip channel step (advances to `TELEGRAM_ALERTS`) |
| `POST` | `/onboarding/step/telegram-alerts/generate-code` 🆕 | — | `GenerateTelegramCodeResponseDto` | Step 6: Generate one-time code & deep link |
| `GET` | `/onboarding/step/telegram-alerts/status` 🆕 | — | `TelegramAlertsStatusResponseDto` | Step 6: Check if owner/staff linked Telegram |
| `POST` | `/onboarding/step/telegram-alerts/confirm` 🆕 | — | `OnboardingStateResponseDto` | Step 6: Mark alerts step confirmed |
| `POST` | `/onboarding/step/telegram-alerts/skip` 🆕 | — | `OnboardingStateResponseDto` | Step 6: Skip alerts step (advances to `DONE`) |
| `POST` | `/onboarding/step/complete` | — | `OnboardingStateResponseDto` | Step 7: Finalize onboarding and activate workspace |

---

### 5.2 Detailed Contracts for New & Updated Endpoints

#### 1. `POST /onboarding/step/qualification` (Now Step 4)
- **Request Body:**
  ```json
  {
    "questions": [
      { "field": "service_type", "question": "Какая услуга вас интересует?", "required": true },
      { "field": "budget", "question": "Какой у вас ориентировочный бюджет?", "required": false }
    ],
    "disqualifiers": ["Ищу бесплатную консультацию", "Не в Алматы"],
    "autoPassConditions": ["Готов записаться сегодня", "Бюджет от 50 000 ₸"],
    "budgetMin": 10000,
    "budgetMax": 500000
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "step": "CONNECT_CHANNEL",
    "stepIndex": 5,
    "completed": false
  }
  ```

---

#### 2. `POST /onboarding/step/channel-confirm` or `POST /onboarding/step/channel-skip` (Now Step 5)
- **Response (200 OK):**
  ```json
  {
    "step": "TELEGRAM_ALERTS",
    "stepIndex": 6,
    "completed": false
  }
  ```

---

#### 3. `POST /onboarding/step/telegram-alerts/generate-code` (Step 6)
Generates a 15-minute one-time connection code and deep link for the current logged-in user.
- **Request Headers:** `Authorization: Bearer <jwt_token>`
- **Response (200 OK):**
  ```json
  {
    "deepLink": "https://t.me/KvikNotifyBot?start=KVIK-A1B2C3D4",
    "code": "KVIK-A1B2C3D4",
    "expiresAt": "2026-09-26T12:15:00.000Z"
  }
  ```

---

#### 4. `GET /onboarding/step/telegram-alerts/status` (Step 6)
Checks if any active Telegram notification recipient exists for this workspace.
- **Response (200 OK):**
  ```json
  {
    "connected": true,
    "recipients": [
      {
        "id": "rec_98765",
        "displayName": "Alex Owner",
        "telegramChatId": "123456789",
        "notificationTypes": ["escalation", "new_booking", "booking_cancelled"],
        "isActive": true,
        "createdAt": "2026-09-26T12:05:00.000Z"
      }
    ]
  }
  ```

---

#### 5. `POST /onboarding/step/telegram-alerts/confirm` & `/skip` (Step 6)
Marks `telegramAlertsConfirmed = true` and transitions the workspace state to `DONE`.
- **Response (200 OK):**
  ```json
  {
    "step": "DONE",
    "stepIndex": 7,
    "completed": true
  }
  ```

---

#### 6. `POST /onboarding/step/complete` (Step 7)
Final activation call.
- **Response (200 OK):**
  ```json
  {
    "step": "DONE",
    "stepIndex": 7,
    "completed": true
  }
  ```

---

## 6. Frontend Implementation Guide

### 6.1 Stepper UI / Navigation Bar
The top progress stepper in the onboarding layout must be updated to display the 5 main user-facing steps:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         ONBOARDING WIZARD                                              │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  (1) Business Info  ──>  (2) Knowledge Base  ──>  (3) AI Qualification  ──>  (4) Connect Channels  ──> │
│  ──>  (5) Alert Notifications (Telegram)  ──>  (6) Complete & Launch                                   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Step Component Routing Mapping
| UI Step # | Step Label | Trigger / Backend Step State | React/Vue Component to Render |
|---|---|---|---|
| **1** | Business Info | `SELECT_NICHE`, `BUSINESS_PROFILE` | `<BusinessProfileStep />` |
| **2** | Knowledge Base | `DATA_SOURCE`, `DATA_PREVIEW` | `<KnowledgeBaseStep />` |
| **3** | Lead Qualification | `QUALIFICATION` | `<QualificationRulesStep />` *(Moved here)* |
| **4** | Connect Channels | `CONNECT_CHANNEL` | `<ConnectChannelsStep />` *(Moved here)* |
| **5** | Telegram Alerts | `TELEGRAM_ALERTS` | `<TelegramAlertsStep />` *(New component)* |

---

### 6.2 New Component: `<TelegramAlertsStep />`

The new Telegram alert step needs to be clean, intuitive, and friction-free for the business owner.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔔 Get Real-Time Alerts on Telegram                                                          │
│                                                                                              │
│ When an urgent client requests a human manager, or when a new appointment is booked,         │
│ Kvik will instantly ping you directly in Telegram.                                           │
│                                                                                              │
│ ┌───────────────────────────────────────┐    ┌─────────────────────────────────────────────┐ │
│ │                                       │    │ OPTION 1: Direct Link (Mobile / Desktop App)│ │
│ │             [ QR CODE ]               │    │                                             │ │
│ │         Scan with phone camera        │    │ [ 📱 Open Kvik Bot in Telegram ]            │ │
│ │                                       │    │                                             │ │
│ │                                       │    │ OPTION 2: Manual Code                       │ │
│ │                                       │    │ Send code to @KvikNotifyBot:                │ │
│ │                                       │    │ ┌───────────────────────────┬─────────────┐ │ │
│ │                                       │    │ │ KVIK-A1B2C3D4             │ Copy Code 📋│ │ │
│ └───────────────────────────────────────┘    └─┴───────────────────────────┴─────────────┘ │ │
│                                                                                              │
│ [ 🔄 Waiting for connection... ] (Auto-updates upon scan)                                    │
│                                                                                              │
│ ─────────────────────────────────────────────────────────────────────────────────────────── │
│ [ Skip for now ]                                                     [ Continue to Launch ➔ ]│
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Component Logic Lifecycle:
1. **On Mount:**
   - Call `POST /onboarding/step/telegram-alerts/generate-code`.
   - Store `deepLink` and `code`.
   - Render QR code using a library like `qrcode.react` with `value={deepLink}`.
2. **Polling Loop:**
   - Poll `GET /onboarding/step/telegram-alerts/status` every 2.5 seconds.
   - If `status.connected === true`:
     - Show green checkmark animation: `Connected as @username`.
     - Automatically update state / enable primary action button.
3. **Buttons:**
   - **"Open Kvik Bot in Telegram"**: Opens `deepLink` in a new browser tab / triggers native Telegram app.
   - **"Continue / Next"**: Calls `POST /onboarding/step/telegram-alerts/confirm` -> moves to `DONE`.
   - **"Skip for now"**: Calls `POST /onboarding/step/telegram-alerts/skip` -> moves to `DONE` with no error.

---

## 7. Interaction with Superadmin & Concierge Onboarding

When a Superadmin sets up a workspace on behalf of a client (Specs `054`–`057`):

1. **Superadmin Setup Phase:**
   - Superadmin enters Business Profile (Steps 0–1).
   - Superadmin uploads files, triggers scrapers, confirms KB (Steps 2–3).
   - Superadmin fills default lead qualification questions (Step 4).
   - Superadmin dispatches the workspace invite email to the client (`/claim-workspace?token=...`).

2. **Client Claiming Phase:**
   - Client clicks email link, sets password on `/claim-workspace`.
   - Client logs in and calls `GET /onboarding/state`.
   - Since Steps 0–4 are completed, backend returns `step: "CONNECT_CHANNEL"` (Step 5).
   - Client connects their WhatsApp QR code or Instagram Direct (Step 5).
   - Client is immediately presented with **Telegram Alerts** (Step 6) to connect their personal phone.
   - Client enters their brand-new Dashboard with full notification and conversation coverage!

---

## 8. Translation Keys (`translation_keys_new.json`)

The following translation keys will be added to `translation_keys_new.json`:

```json
{
  "onboarding.telegram_alerts_code_generated": "Код для подключения Telegram-уведомлений успешно создан.",
  "onboarding.telegram_alerts_confirmed": "Telegram-уведомления успешно подключены.",
  "onboarding.telegram_alerts_skipped": "Подключение Telegram-уведомлений пропущено.",
  "onboarding.telegram_alerts_status_fetched": "Статус подключения Telegram-уведомлений получен."
}
```

---

## 9. Master Checklist

### Backend Tasks
- [ ] Add `telegramAlertsConfirmed Boolean @default(false)` to `Workspace` in `prisma/schema.prisma`.
- [ ] Create Prisma migration.
- [ ] Update `OnboardingStep` type in `src/modules/onboarding/services/onboarding-state.service.ts` to include `'TELEGRAM_ALERTS'`.
- [ ] Update `OnboardingStateService.getState()` derived logic with new step sequence and indices (0 to 7).
- [ ] Implement `POST /onboarding/step/telegram-alerts/generate-code` in `onboarding-wizard.controller.ts`.
- [ ] Implement `GET /onboarding/step/telegram-alerts/status` in `onboarding-wizard.controller.ts`.
- [ ] Implement `POST /onboarding/step/telegram-alerts/confirm` and `POST /onboarding/step/telegram-alerts/skip` in `onboarding-wizard.controller.ts`.
- [ ] Update `NotificationsRecipientsService.handleTelegramBotUpdate` to set `telegramAlertsConfirmed = true` when bot `/start` occurs.
- [ ] Update `completeOnboarding` validation in `onboarding.service.ts` to allow completion from `TELEGRAM_ALERTS` or `DONE`.
- [ ] Update Swagger response DTOs in `src/modules/onboarding/dto/onboarding-response.dto.ts`.

### Frontend Tasks
- [ ] Update `OnboardingStep` union type and step index map in client frontend.
- [ ] Re-order stepper navigation: Place `Qualification` before `Connect Channels`.
- [ ] Create `<TelegramAlertsStep />` with QR code, Telegram deep link button, one-time code display, and polling logic.
- [ ] Add "Skip for now" support on Telegram Alerts step.
- [ ] Ensure concierge claim redirect routes client cleanly to `CONNECT_CHANNEL` -> `TELEGRAM_ALERTS` -> `DONE`.
