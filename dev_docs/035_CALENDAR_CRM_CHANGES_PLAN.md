# 035 — Frontend Implementation Plan: Calendar, CRM Funnel Simplification, Contact Lifetime History & AI Silence WebSocket Synchronization

> **Document Type:** Frontend Technical Architecture & Execution Plan  
> **Target Audience:** Frontend Engineers, Fullstack Developers, QA Engineers  
> **Backend Reference:** `dev_docs/backend/068_CALENDAR_CRM_CHANGES_PLAN.md`  
> **Related Documents:** `dev_docs/016_CRM_NEW_FEATURES_PLAN.md`, `dev_docs/029_ONBOARDING_ORDER_CHANGE.md`, `dev_docs/018_PROJECT_LEVEL_DESIGN_ARCH_SPEC.md`  
> **Status:** Ready for Execution  

---

## 1. Executive Summary & Architectural Goals

The backend team completed core enhancements specified in `dev_docs/backend/068_CALENDAR_CRM_CHANGES_PLAN.md`. These changes resolve critical conversational and CRM pipeline bottlenecks across:
1. **Safe AI Silence & No-Reply Guard (`SILENT_NO_OP`):** The backend suppresses outbound external dispatches, avoids creating phantom bot records in PostgreSQL, and prevents false bot WebSocket events when incoming messages are closure or polite remarks ("Ок", "Спасибо").
2. **CRM Funnel & Kanban Simplification:** Deprecation of the redundant intermediate `QUALIFIED` stage, creating a streamlined 4-stage funnel:
   $$\mathbf{NEW} \longrightarrow \mathbf{APPOINTMENT\_SET} \longrightarrow \mathbf{DEAL\_WON} \quad (\text{or } \mathbf{DEAL\_LOST})$$
3. **Onboarding Stepper Streamlining:** Removal of the qualification rules step from the onboarding wizard, reducing the setup flow to a clean 6-step state machine (`0` through `6`).
4. **Onboarding Data Preview Tab Layout Fix:** Isolating the AI Business Summary ("ИИ-резюме вашего бизнеса") into its own dedicated tab so it does not vertically dominate the preview page, and guaranteeing that the primary action button ("Далее: Подключение каналов") is always directly reachable and visible.
5. **Channel Connection Height & Scroll Unlocking:** Resolving rigid `overflow-hidden` height constraints in onboarding layout wrappers and sub-steps (`StageWhatsApp`, `StageInstagram`, `StageTelegram`), ensuring action buttons ("Далее", "Пропустить", "Назад") are always scrollable and reachable on all viewport heights.
6. **Contact Identity Resolution & Lifetime History:** Support for returning clients, multi-visit metrics (`totalBookingsCount`, `noShowCount`), lazy phone resolution, and detailed staff assignment with roles.
7. **Specialist Management Fallbacks:** Clean degradation when no specific specialist is assigned or available in the schedule.

---

## 2. API Contracts & Architecture Alignment Matrix

### 2.1. Updated & Affected Endpoints

| Endpoint | HTTP | Schema / Parameters | Response DTO | Purpose & Changes |
|---|---|---|---|---|
| `/onboarding/state` | `GET` | — | `OnboardingStateResponse` | Returns updated 6-step machine (`stepIndex: 0..6`, total steps: 6). Qualification step removed. |
| `/leads/counts` | `GET` | — | `LeadCountsResponseDto` | Returns counts across 4 primary stages (`NEW`, `APPOINTMENT_SET`, `DEAL_WON`, `DEAL_LOST`). |
| `/leads` | `GET` | `FilterLeadsParams` | `PaginatedLeadsResponse` | Filter and paginate leads by 4 primary stages, channels, staff, and loss reasons. |
| `/leads/{id}` | `GET` | `id: UUID` | `LeadDetailDto` | Extended client profile with `noShowCount`, `totalBookingsCount`, `assignedStaff` (with `role`), `bookings`, and `notes`. |
| `/leads/funnel` | `GET` | `{ from?: string, to?: string }` | `FunnelAnalyticsDto` | Analytics funnel data structured across the 4 streamlined stages. |
| `/leads/{id}/status` | `PATCH` | `{ status, reason?, lossReason? }` | `{ code, message }` | Moves lead between `NEW`, `APPOINTMENT_SET`, `DEAL_WON`, `DEAL_LOST`. |
| `/leads/{id}/qualify` | `POST` | `{ serviceInterest?, preferredStaffId?, budget?, notes? }` | `{ code, message }` | Maintained for backward compatibility; returns `200 OK` safely. |
| `/leads/{id}/disqualify` | `POST` | `{ lossReason, lossNotes? }` | `{ code, message }` | Moves lead to `DEAL_LOST` with structured loss reason. |
| `/bookings/{id}/no-show` | `POST` | `id: UUID` | `{ code, message }` | Marks booking as `NO_SHOW`, incrementing client's `noShowCount`. |
| WebSocket `/conversations` | `WS` | Event `message.new` | `{ conversationId, message }` | Receives incoming `USER` messages immediately. On AI silence, no bot event is emitted. |

---

### 2.2. Frontend Architectural Gap Analysis & Critical UI Fixes

```
+--------------------+--------------------------------------------------------+
| Area               | Identified Gaps & Required Frontend Fixes              |
+--------------------+--------------------------------------------------------+
| 1. Onboarding      | Stepper currently has 7 steps including Qualification. |
|    Stepper         | Remove Step 4 (Qualification), re-index to             |
|                    | 6 steps (0..6), and adjust progress calculations.      |
+--------------------+--------------------------------------------------------+
| 2. Preview Tab     | "ИИ-резюме вашего бизнеса" is rendered on top of the   |
|    Layout & Scroll | page, pushing content down and burying the button.     |
|    Accessibility   | Move AI summary into a dedicated tab; ensure action    |
|                    | button is always reachable and visible.                |
+--------------------+--------------------------------------------------------+
| 3. Channel Widget  | Fixed min-heights and overflow-hidden in container     |
|    Scroll Locking  | trap scroll and make action buttons unreachable on     |
|                    | smaller screens. Unlock viewport scroll & flex heights.|
+--------------------+--------------------------------------------------------+
| 4. CRM Kanban &    | Board and funnel currently show 5 stages including     |
|    Lead Stages     | QUALIFIED. Simplify Kanban and Funnel to 4 stages      |
|                    | (NEW, APPOINTMENT_SET, DEAL_WON, DEAL_LOST).           |
+--------------------+--------------------------------------------------------+
| 5. Client Profile  | Lead drawer must display lifetime booking metrics      |
|    & History       | (totalBookingsCount, noShowCount), assigned doctor     |
|                    | role, and full chronological booking cards.            |
+--------------------+--------------------------------------------------------+
| 6. AI Silence &    | Ensure active chat threads gracefully handle incoming  |
|    WebSocket Sync  | USER messages without expecting a BOT response. Avoid  |
|                    | hung typing indicators, empty bubbles, or sync errors. |
+--------------------+--------------------------------------------------------+
| 7. Specialist      | Fallback gracefully when activeStaff is empty in       |
|    Fallbacks       | calendar matrix and booking details ("Дежурный врач"). |
+--------------------+--------------------------------------------------------+
```

---

## 3. Module-by-Module Frontend Implementation Plan

### 3.1. Module 1: Onboarding Stepper Refactoring (6-Step Architecture)

The onboarding flow must match the backend `OnboardingStateService` state machine by removing the `QUALIFICATION` step and re-indexing the remaining steps, while fixing scroll trapping and layout accessibility.

#### 1. Updated Step Sequence & Indexing:
- **Index 0:** `SELECT_NICHE` — Select industry vertical (`StepSelectNiche.tsx`)
- **Index 1:** `BUSINESS_PROFILE` — Company details & contact info (`StepBusinessProfile.tsx`)
- **Index 2:** `DATA_SOURCE` — Ingest 2GIS, website, notes, documents (`StepKnowledgeSource.tsx`)
- **Index 3:** `DATA_PREVIEW` — Review knowledge entries & parsed business summary (`StepDataPreview.tsx`)
- **Index 4:** `CONNECT_CHANNEL` — Connect WhatsApp, Telegram, or Instagram (`StepConnectChannel.tsx`)
- **Index 5:** `TELEGRAM_ALERTS` — Connect Telegram manager alerts (`StepTelegramAlerts.tsx`)
- **Index 6:** `DONE` — Workspace activated & redirect to `/`

#### 2. Component & Type Modifications:
- **`types/niche.ts`:**
  - Deprecate `"QUALIFICATION"` in `OnboardingStepState`.
  - Update `OnboardingStepState`:
    ```typescript
    export type OnboardingStepState =
      | "SELECT_NICHE"
      | "BUSINESS_PROFILE"
      | "DATA_SOURCE"
      | "DATA_PREVIEW"
      | "CONNECT_CHANNEL"
      | "TELEGRAM_ALERTS"
      | "DONE"
      | "QUALIFICATION" // Legacy fallback
      | "COMPLETE_TEST"; // Legacy fallback
    ```
- **`components/onboarding/OnboardingHeader.tsx`:**
  - Update `TOTAL_STEPS = 6`.
  - Update `STEP_META` map to 6 steps.
- **`hooks/useOnboardingFlow.ts`:**
  - Remove qualification submission handler.
  - In `handleConfirmDataPreview`: advance state to `CONNECT_CHANNEL`.
  - Handle legacy `QUALIFICATION` step state defensively by auto-advancing to `CONNECT_CHANNEL`.
- **`app/(onboarding)/onboarding/page.tsx`:**
  - Remove `<StepQualification />` branch from `StepTransition`.

---

### 3.2. UI Fix 1: StepDataPreview Tab Isolation & Unblocked Action Button

#### The Issue:
In `StepDataPreview.tsx`, `BusinessContextSummary` was rendered at the top of the page above the tabs and knowledge entries list. Because business summaries contain multiple lines of text, it pushed all source tabs, entry cards, and the confirm button down. The nested scrolling container created scroll trapping, making the bottom action button unreachable.

#### The Solution:
1. **Move AI Business Summary into its own dedicated Tab:**
   - Update `FilterType` in `StepDataPreview.tsx` to include `"AI_SUMMARY"`.
   - Tabs Order:
     - `AI_SUMMARY` — "Резюме ИИ" (Displays the business profile summary).
     - `ALL` — "Все записи" (Displays all parsed knowledge entries).
     - `LOCAL_LISTING` — "2ГИС"
     - `WEBSITE_CONTENT` — "Сайт"
     - `DOCUMENT` — "Документы"
     - `MANUAL_NOTE` — "Заметки"
2. **Guaranteed Button Reachability:**
   - Remove nested scroll traps.
   - When tab is `"AI_SUMMARY"`: Render `BusinessContextSummary` directly inside the tab container.
   - When tab is `"ALL"` or a specific source: Render `KnowledgeEntryCard` items with compact pagination.
   - Place the primary button ("Далее: Подключение каналов") directly below the active tab content with crisp spacing, ensuring it is always immediately visible without requiring deep scroll.

---

### 3.3. UI Fix 2: Channel Connection Height & Scroll Unlocking

#### The Issue:
In `StepConnectChannel.tsx` and layout wrappers (`app/(onboarding)/layout.tsx`), containers had restrictive `overflow-hidden` classes and fixed heights (`min-h-[22rem]`). When sub-step guides (such as `StageTelegram` with BotFather steps and token input) expanded, the content overflowed outside the viewport, locking scrolling and preventing users from reaching the "Далее", "Пропустить", "Назад" buttons.

#### The Solution:
1. **Unlock Root Layout Scroll (`app/(onboarding)/layout.tsx`):**
   - Replace `overflow-hidden` with `min-h-screen w-full flex flex-col bg-background text-foreground overflow-y-auto`.
   - Ensure the layout permits natural page-level scrolling on small screens and laptops.
2. **Flexible Step Container (`StepConnectChannel.tsx`):**
   - Change container to `rounded-3xl bg-card border border-border shadow-sm p-5 sm:p-8 overflow-visible` (removing rigid `overflow-hidden` clipping).
3. **Compact Sub-Step Cards (`StageWhatsApp.tsx`, `StageInstagram.tsx`, `StageTelegram.tsx`):**
   - Streamline padding and hero banners to prevent excessive vertical height.
   - Ensure action button rows use `shrink-0` and clear positioning, guaranteeing they are always in view and reachable.

---

### 3.4. Module 2: CRM Funnel & Kanban Simplification (4 Primary Stages)

The intermediate `QUALIFIED` status is removed from active CRM pipelines. Inbound contacts remain in `NEW` (В диалоге) until an appointment is booked (`APPOINTMENT_SET`) or the lead is disqualified (`DEAL_LOST`).

#### 1. Funnel Stages Configuration:
```
+-----------------+       +-----------------+       +-----------------+
|       NEW       | ----> | APPOINTMENT_SET | ----> |    DEAL_WON     |
|   (В диалоге)   |       | (Запись создана)|       |(Визит завершен) |
+--------+--------+       +--------+--------+       +-----------------+
         |                         |
         +------------+------------+
                      |
                      v
              +-----------------+
              |    DEAL_LOST    |
              |     (Отказ)     |
              +-----------------+
```

#### 2. Kanban Board Updates (`components/dashboard/leads/LeadsKanban.tsx`):
- Update `columnsConfig` to 4 standard columns:
  ```typescript
  const columnsConfig: Array<{ id: LeadStatus; labelKey: string; colorDot: string }> = [
    { id: "NEW", labelKey: "leads.stage_new", colorDot: "bg-blue-500" },
    { id: "APPOINTMENT_SET", labelKey: "leads.stage_appointment", colorDot: "bg-purple-500" },
    { id: "DEAL_WON", labelKey: "leads.stage_won", colorDot: "bg-emerald-500" },
    { id: "DEAL_LOST", labelKey: "leads.stage_lost", colorDot: "bg-rose-500" },
  ];
  ```

#### 3. Lead Funnel View Updates:
- **`components/dashboard/leads/FunnelVisualStepper.tsx`:** Update to 4 stepper steps with conversion share calculation.
- **`components/dashboard/leads/FunnelStageItem.tsx`:** Simplify `stageConfig` to 4 primary stages.
- **`components/dashboard/overview/LeadFunnelChart.tsx`:** Update overview chart to render the 4 stages cleanly without empty `QUALIFIED` bars.

#### 4. Status Badges & Styles (`components/dashboard/shared/StatusBadge.tsx`):
- Standardize Russian badges:
  - `NEW`: "В диалоге" (Blue pill)
  - `APPOINTMENT_SET`: "Запись создана" (Purple pill)
  - `DEAL_WON`: "Визит завершен" (Emerald pill)
  - `DEAL_LOST`: "Отказ" (Rose/Gray pill)

---

### 3.5. Module 3: Contact Identity Resolution, Lifetime History & Rich Client Profile

`GET /leads/:id` delivers enriched contact metrics and booking history. The lead detail drawer acts as a complete Client Card.

#### 1. Header & Quick Metrics (`components/dashboard/leads/LeadDetailHeader.tsx`):
- **Client Lifetime Badges:**
  - `totalBookingsCount`: Show pill "Визитов: X" with calendar icon.
  - `noShowCount`: If `noShowCount > 0`, render warning badge "Неявок: Y".
  - `assignedStaff`: Render doctor/specialist name with role badge (e.g., "Др. Ахметов · Терапевт").
- **Quick Action Buttons:**
  - Primary CTA: "Создать запись" (triggers booking modal prefilled with lead data) + "Отказ" (opens `DisqualifyDialog`).

#### 2. Profile Details & Stage Switcher (`components/dashboard/leads/LeadDetailProfile.tsx`):
- **Stage Switcher:** Render 4 buttons (`NEW`, `APPOINTMENT_SET`, `DEAL_WON`, `DEAL_LOST`).
- **Contact Channels & Phone Resolution:**
  - Display verified phone number with click-to-copy and channel deep links.

#### 3. Enriched Bookings List (`components/dashboard/leads/LeadProfileBookings.tsx`):
- Display list of all client bookings (past and upcoming):
  - Service Name, Specialist Name, Start/End Time (`tabular-nums`), Status Badge (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
  - Action for Confirmed Bookings: "Не пришел" (No-Show) button calling `POST /bookings/:id/no-show` with optimistic UI update.

---

### 3.6. Module 4: Real-time WebSocket Inbox & Safe AI Silence (`SILENT_NO_OP`)

When the AI chooses silence (`[NO_REPLY]` or regex closure for "Спасибо", "Ок"):
- The backend emits `message.new` for the incoming `USER` message.
- No `message.new` is emitted for `BOT`.

#### 1. Inbox Realtime Hook (`hooks/useInboxRealtime.ts`):
- When `message.new` arrives with `role: "USER"`:
  - Message is immediately appended to the active conversation thread cache (`['conversation/messages', conversationId]`).
  - Active conversation preview in the sidebar (`conversations`) updates to the user's latest text.
  - No pending typing indicator is spawned.
  - Conversation `lastMessageAt` and `unreadCount` update in real time.

#### 2. Conversation Thread (`components/dashboard/inbox/ConversationThread.tsx`):
- Thread renders user bubble smoothly at the bottom of the list.
- Manager takeover and AI handoff states remain fully responsive without phantom loading states.

---

### 3.7. Module 5: Specialist Management Fallbacks & Calendar Integration

When a workspace does not have specific staff members registered:

#### 1. Matrix View Fallback (`components/dashboard/calendar/CalendarMatrixView.tsx`):
- When `activeStaff.length === 0`:
  - Render an informative clean state: "Специалисты не добавлены. Записи ведутся по общему расписанию филиала."
  - Provide a direct link button to `/team` to add specialists.

#### 2. Booking Modal Specialist Selection:
- Support selecting "Любой свободный специалист / Дежурный врач" when booking an appointment.

---

## 4. Component Modification Checklist & File Architecture

All modified components will strictly adhere to the `<400` lines per file standard:

```
src/
├── types/
│   ├── niche.ts                         # Update OnboardingStepState (remove QUALIFICATION, 6 steps)
│   ├── lead.ts                          # Update LeadStatus (4 stages: NEW, APPOINTMENT_SET, DEAL_WON, DEAL_LOST)
│   └── openapi.ts                       # Synchronize with openapi.json
│
├── lib/api/
│   ├── onboarding.ts                    # Deprecate qualify step endpoint, update state interfaces
│   └── leads.ts                         # Update LeadStatus, LeadCountsResponseDto, LeadDetailDto (noShowCount, totalBookings)
│
├── hooks/
│   ├── useOnboardingFlow.ts             # Remove qualification handler, update 6-step transitions
│   ├── useLeads.ts                      # Update stage filter and 4-column counts
│   └── useInboxRealtime.ts              # Harden real-time user message ingestion on AI silence
│
├── components/
│   ├── onboarding/
│   │   ├── OnboardingHeader.tsx         # Update TOTAL_STEPS = 6, STEP_META mapping
│   │   ├── StepDataPreview.tsx          # Dedicated "AI Summary" tab + visible bottom confirm CTA
│   │   ├── StepConnectChannel.tsx       # Unlocked scroll, flexible auto-height container
│   │   ├── StepQualification.tsx        # Deprecated / isolated from active flow
│   │   └── channel/
│   │       ├── StageWhatsApp.tsx        # Compact layout with visible action buttons
│   │       ├── StageInstagram.tsx       # Compact layout with visible action buttons
│   │       ├── StageTelegram.tsx        # Compact BotFather guide + token input
│   │       └── StageChannelSummary.tsx  # Channel summary review & continue
│   │
│   ├── dashboard/
│   │   ├── shared/
│   │   │   └── StatusBadge.tsx          # Standardize 4-stage Russian labels and color schemes
│   │   │
│   │   ├── leads/
│   │   │   ├── LeadsPage.tsx            # Main CRM page with 4-stage Kanban, List, and Funnel
│   │   │   ├── LeadsKanban.tsx          # 4-stage Kanban columns configuration
│   │   │   ├── FunnelVisualStepper.tsx  # 4-stage visual funnel stepper
│   │   │   ├── FunnelStageItem.tsx      # 4-stage funnel card item with conversion metrics
│   │   │   ├── LeadDetail.tsx           # Lead drawer container
│   │   │   ├── LeadDetailHeader.tsx     # Display totalBookingsCount, noShowCount, specialist role
│   │   │   ├── LeadDetailProfile.tsx    # 4-stage status switcher & contact history
│   │   │   └── LeadProfileBookings.tsx  # Extended booking history cards with No-Show action
│   │   │
│   │   ├── overview/
│   │   │   └── LeadFunnelChart.tsx      # 4-stage funnel chart on main overview page
│   │   │
│   │   ├── calendar/
│   │   │   └── CalendarMatrixView.tsx   # Specialist fallback when 0 active staff
│   │   │
│   │   └── inbox/
│   │       └── ConversationThread.tsx   # Verified safe silence rendering
```

---

## 5. Localization & Translation Dictionary Updates

The frontend is strictly Russian-only. All new and updated keys must be added to `locales/translation_keys_new.json` and merged using `node scripts/apply-translation-keys.mjs`.

### Keys to Add / Update in `locales/translation_keys_new.json`:

```json
{
  "onboarding.stepper.step_of": "Шаг {current} из {total}",
  "onboarding.knowledge.preview.tab_ai_summary": "Резюме ИИ",
  "onboarding.preview.btn_continue_to_channels": "Далее: Подключение каналов →",
  
  "dashboard.leads.stage_new": "В диалоге",
  "dashboard.leads.stage_appointment": "Запись создана",
  "dashboard.leads.stage_appointment_set": "Запись создана",
  "dashboard.leads.stage_won": "Визит завершен",
  "dashboard.leads.stage_lost": "Отказ",
  
  "dashboard.leads.total_bookings_label": "Визитов: {count}",
  "dashboard.leads.noshow_count_label": "Неявок: {count}",
  "dashboard.leads.noshow_btn": "Не пришел",
  "dashboard.leads.noshow_confirm": "Отметить клиента как неявившегося на прием?",
  "dashboard.leads.noshow_toast": "Статус записи обновлен на «Не пришел»",
  "dashboard.leads.create_booking_btn": "Создать запись",
  "dashboard.leads.specialist_with_role": "{name} · {role}",
  
  "dashboard.calendar.no_staff_title": "Специалисты не добавлены",
  "dashboard.calendar.no_staff_desc": "Записи ведутся по общему расписанию филиала. Вы можете добавить сотрудников в разделе «Команда».",
  "dashboard.calendar.btn_add_staff": "Добавить специалиста"
}
```

---

## 6. Execution Phases & Step-by-Step Implementation Roadmap

```
+-----------------------------------------------------------------------------+
| FRONTEND IMPLEMENTATION PHASES                                              |
+-----------------------------------------------------------------------------+
| Phase 1: Type Definitions & API Client Synchronization                      |
|   ├── Update types/niche.ts, types/lead.ts                                  |
|   └── Update lib/api/onboarding.ts, lib/api/leads.ts                        |
+-----------------------------------------------------------------------------+
| Phase 2: Onboarding Stepper Refactoring & UI/UX Scroll Fixes                |
|   ├── Update OnboardingHeader.tsx (TOTAL_STEPS = 6, STEP_META)              |
|   ├── Update useOnboardingFlow.ts (remove Step 4 Qualification)             |
|   ├── Update StepDataPreview.tsx (AI Summary into dedicated Tab + CTA)      |
|   ├── Unlock layout scroll in app/(onboarding)/layout.tsx                   |
|   └── Update StepConnectChannel.tsx & StageTelegram.tsx heights & buttons   |
+-----------------------------------------------------------------------------+
| Phase 3: CRM Pipeline & Kanban Simplification (4 Stages)                    |
|   ├── Update StatusBadge.tsx labels and colors                              |
|   ├── Update LeadsKanban.tsx to 4 columns                                   |
|   ├── Update FunnelVisualStepper.tsx, FunnelStageItem.tsx, LeadsFunnel.tsx  |
|   └── Update LeadFunnelChart.tsx on Overview page                           |
+-----------------------------------------------------------------------------+
| Phase 4: Enriched Client Card & Booking History                             |
|   ├── Update LeadDetailHeader.tsx (totalBookingsCount, noShowCount, staff)  |
|   ├── Update LeadDetailProfile.tsx (4-stage buttons, contact links)         |
|   └── Update LeadProfileBookings.tsx (rich booking cards, No-Show action)   |
+-----------------------------------------------------------------------------+
| Phase 5: AI Silence WebSocket Verification & Specialist Fallbacks           |
|   ├── Verify useInboxRealtime.ts handles USER messages on SILENT_NO_OP       |
|   └── Update CalendarMatrixView.tsx with graceful 0-staff fallback banner   |
+-----------------------------------------------------------------------------+
| Phase 6: Localization & Script Execution                                    |
|   ├── Add Russian keys to locales/translation_keys_new.json                 |
|   ├── Run node scripts/apply-translation-keys.mjs                           |
|   └── Run node scripts/export-translation-keys.mjs                          |
+-----------------------------------------------------------------------------+
| Phase 7: Quality Assurance, Verification & Regression Testing               |
|   ├── Verify Onboarding from Step 0 to Step 6 with visible buttons          |
|   ├── Verify Data Preview AI Summary tab & Channel scroll behavior          |
|   ├── Verify Kanban drag-and-drop & Lead detail drawer                      |
|   ├── Verify Live Inbox WebSocket with AI Silence                           |
|   └── Verify TypeScript build: npm run build                                |
+-----------------------------------------------------------------------------+
```

---

## 7. Verification & QA Testing Checklist

| # | Test Scenario | Steps to Verify | Expected Result |
|---|---|---|---|
| **1** | **Onboarding 6-Step Funnel** | Start new onboarding from `/onboarding`. Complete Niche $\rightarrow$ Business Profile $\rightarrow$ Knowledge $\rightarrow$ Preview. Click Next. | Progress shows "Шаг 4 из 6", transitions straight to Channel Connection. Step 4 Qualification is bypassed. |
| **2** | **Data Preview Tabbed AI Summary** | Navigate to Step 3 (Data Preview) after scraping/notes. | "ИИ-резюме вашего бизнеса" is a dedicated tab ("Резюме ИИ"). The action button ("Далее: Подключение каналов") is immediately visible and clickable on any screen size. |
| **3** | **Channel Step Scroll Reachability** | In Step 4 (Channel Connection), open Telegram / WhatsApp setup. | Container adapts vertically, page scrolls smoothly, and action buttons ("Далее", "Пропустить", "Назад") are always reachable without clipping. |
| **4** | **CRM 4-Stage Kanban** | Navigate to `/clients` (Kanban view). | Exactly 4 columns rendered: В диалоге (`NEW`), Запись создана (`APPOINTMENT_SET`), Визит завершен (`DEAL_WON`), Отказ (`DEAL_LOST`). No `QUALIFIED` column. |
| **5** | **Lead Status Transition** | Drag lead or click stage button inside Lead Detail drawer from `NEW` to `APPOINTMENT_SET`. | Status updates instantly, timeline event recorded, counts bar re-calculates without page reload. |
| **6** | **Client Lifetime Profile** | Open Lead Card with existing bookings history (`/clients?leadId=...`). | Header displays total bookings count chip and no-show warning if > 0. Specialist role is displayed. Bookings tab lists all past/future appointments. |
| **7** | **No-Show Action** | Click "Не пришел" on a confirmed booking in the Lead Card. | Confirmation prompt appears, booking status updates to `NO_SHOW`, client's `noShowCount` increments. |
| **8** | **AI Safe Silence in Inbox** | Open `/inbox`. Send short closure message ("Спасибо" / "Ок") in simulated user channel. | User message appears in thread immediately. No bot response is generated. No empty bubble appears, no infinite spinner, sidebar preview updates cleanly. |
| **9** | **Calendar 0-Staff Fallback** | Switch to `/calendar` in a workspace without registered staff members. | Matrix view renders a polite informational banner with CTA to add staff instead of breaking or showing blank tiles. |
| **10** | **Production Build Validation** | Run `npm run build` in root directory. | Zero TypeScript errors, zero missing translation keys, zero lint violations. |
