# 017 — Follow-Up Automation System: Frontend Implementation Plan
## Frontend Architecture for Backend Spec `047_FOLLOW_UP_SYSTEM_PLAN.md`

> **Scope:** Frontend Implementation — UI Pages, API Clients, SWR Hooks, Modals, Proxy Config & Translations  
> **Target Specs:** `dev_docs/backend/047_FOLLOW_UP_SYSTEM_PLAN.md`, `AGENTS.md`  
> **Status:** Completed & Verified  

---

## 0. Executive Overview & Architecture

The **Follow-Up Automation System** provides business owners and managers with a central command cockpit to configure, monitor, test, and audit automated lead re-engagement, appointment reminders, and post-visit 2GIS reviews.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND ROUTING & SURFACES                             │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 1. /automations (Also embedded in /ai-studio -> tab "automations")                 │
│    ├── Tab 1: [Правила и сценарии] (Rules, Steps, Quiet Hours, 2GIS URL, Channels) │
│    ├── Tab 2: [Аналитика и конверсия] (KPIs, Step Funnel, Channel Breakdown)      │
│    └── Tab 3: [Журнал событий] (Paginated Audit Logs, Filter by Status/Channel)   │
│                                                                                   │
│ 2. AI Test Preview Simulator Dialog                                              │
│    └── On-demand prompt execution test with Meta 24h & token inspection          │
│                                                                                   │
│ 3. /inbox Conversation Thread Widget                                              │
│    └── Pending Follow-up Status Pill + One-Click [Отменить дожим] Action         │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. What Already Exists vs. What Will Be Replaced

| Existing File / Asset | Current State | Plan for This Implementation |
|---|---|---|
| `app/(dashboard)/automations/page.tsx` | Static page wrapper | Keep as route entrypoint; render upgraded `AutomationsPage` |
| `components/dashboard/automations/AutomationsPage.tsx` | Mock static items (`INITIAL_AUTOMATIONS`) | **REFACTOR COMPLETELY** into real 3-tab cockpit backed by SWR |
| `components/dashboard/automations/AutomationCard.tsx` | Mock card item | **REFACTOR** into modular rule cards |
| `components/dashboard/automations/AutomationEditor.tsx` | Local mock template editor | **REPLACE** with real config section components |
| `components/dashboard/ai-studio/AiStudioPage.tsx` | Embeds `AutomationsPage` under `automations` tab | **PRESERVE** integration — automatically gains all new capabilities |
| `components/dashboard/inbox/ConversationThread.tsx` | No follow-up controls | **EXPAND** with `FollowUpThreadBanner` & Cancel CTA |
| `lib/api/conversations.ts` | No follow-up cancel method | **EXTEND** with `cancelFollowUp(id)` |
| `app/api/[...proxy]/route.ts` | Handles all `/api/*` proxies | **READY** — all backend follow-up endpoints route cleanly |
| `proxy.ts` | Role & auth guards | **PRESERVE** — restricts `SPECIALIST`, allows `OWNER` & `ADMIN_MANAGER` |

---

## 2. API Layer & Type Definitions — `lib/api/followUps.ts`

Create new API client module: `lib/api/followUps.ts`.

### 2.1. TypeScript Interfaces

```typescript
import { ChannelType } from '@/types/channels';

export type FollowUpLogStatus = 'PENDING' | 'SENT' | 'REPLIED' | 'SKIPPED' | 'CANCELLED';
export type DispatchMode = 'AI_FREEFORM' | 'WABA_HSM_TEMPLATE' | 'INSTAGRAM_FALLBACK';

export interface QuietHoursConfig {
  enabled: boolean;
  start: string; // "21:30"
  end: string;   // "09:00"
  timezone: string; // "Asia/Almaty"
}

export interface AbandonmentStepConfig {
  stepIndex: number; // 1, 2, 3
  delayMinutes: number; // 120, 1200, 2880
  label?: string;
}

export interface AbandonmentSequenceConfig {
  enabled: boolean;
  steps: AbandonmentStepConfig[];
  autoDisqualifyAfterHours: number; // default: 72
}

export interface AdaptiveNoticeRules {
  minAdvanceHoursFor24hReminder: number; // default: 48
  minAdvanceHoursFor2hReminder: number;   // default: 3
}

export interface AppointmentRemindersConfig {
  enabled: boolean;
  send24hReminder: boolean;
  send2hReminder: boolean;
  adaptiveNoticeRules: AdaptiveNoticeRules;
}

export interface PostVisitRetentionConfig {
  enabled: boolean;
  send2GisReviewRequest: boolean;
  sendReviewRequestAfterMinutes: number; // default: 120
  direct2GisReviewUrl?: string | null;
  sendRepeatRecallAfterDays: number;     // default: 30
}

export interface ChannelPolicyStatus {
  active: boolean;
  wabaTemplateConfigured?: boolean;
  crossChannelFallback?: boolean;
  unlimitedWindow?: boolean;
}

export interface FollowUpConfigDto {
  enabled: boolean;
  quietHours: QuietHoursConfig;
  abandonmentSequence: AbandonmentSequenceConfig;
  appointmentReminders: AppointmentRemindersConfig;
  postVisitRetention: PostVisitRetentionConfig;
  channels: Record<ChannelType, ChannelPolicyStatus>;
}

export interface UpdateFollowUpConfigPayload {
  enabled?: boolean;
  quietHours?: Partial<QuietHoursConfig>;
  abandonmentSequence?: {
    enabled?: boolean;
    steps?: Array<{ stepIndex: number; delayMinutes: number }>;
    autoDisqualifyAfterHours?: number;
  };
  appointmentReminders?: {
    enabled?: boolean;
    send24hReminder?: boolean;
    send2hReminder?: boolean;
  };
  postVisitRetention?: {
    enabled?: boolean;
    send2GisReviewRequest?: boolean;
    sendReviewRequestAfterMinutes?: number;
    sendRepeatRecallAfterDays?: number;
  };
}

export interface StepStatItem {
  stepIndex: number;
  name: string;
  dispatched: number;
  replied: number;
  replyRate: number;
  bookingsCreated: number;
}

export interface ChannelStatItem {
  dispatched: number;
  replied: number;
  replyRate: number;
}

export interface FollowUpStatsDto {
  period: { from: string; to: string };
  summary: {
    totalFollowUpsDispatched: number;
    totalReplied: number;
    replyRate: number;
    bookingsGenerated: number;
    conversionToBookingRate: number;
    autoDisqualifiedLeads: number;
    reviewsRequested: number;
    estimatedReviewsSubmitted: number;
  };
  stepBreakdown: StepStatItem[];
  channelBreakdown: Record<ChannelType, ChannelStatItem>;
}

export interface FollowUpLogItem {
  id: string;
  conversationId: string;
  lead?: {
    id: string;
    name?: string | null;
    phone?: string | null;
  } | null;
  channelType: ChannelType;
  stepIndex: number;
  scheduledFor: string;
  executedAt?: string | null;
  status: FollowUpLogStatus;
  messageText: string;
  repliedAt?: string | null;
  convertedToBooking: boolean;
}

export interface FollowUpLogsResponse {
  data: FollowUpLogItem[];
  total: number;
  page: number;
  limit: number;
}

export interface FollowUpLogsParams {
  conversationId?: string;
  leadId?: string;
  status?: FollowUpLogStatus;
  channelType?: ChannelType;
  page?: number;
  limit?: number;
}

export interface TestPreviewPayload {
  conversationId: string;
  stepIndex?: number;
}

export interface TestPreviewResponse {
  generatedMessage: string;
  channelType: ChannelType;
  withinMeta24hWindow: boolean;
  dispatchMode: DispatchMode;
  quietHoursActiveNow: boolean;
  tokensUsed: number;
  latencyMs: number;
}
```

### 2.2. API Client Methods (`lib/api/followUps.ts`)

```typescript
export const followUpsApi = {
  getConfig: async (workspaceId: string): Promise<FollowUpConfigDto> => {
    const { data } = await apiClient.get<FollowUpConfigDto>(`/workspaces/${workspaceId}/follow-ups/config`);
    return data;
  },

  updateConfig: async (
    workspaceId: string,
    payload: UpdateFollowUpConfigPayload
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(
      `/workspaces/${workspaceId}/follow-ups/config`,
      payload
    );
    return data;
  },

  getStats: async (
    workspaceId: string,
    params?: { from?: string; to?: string }
  ): Promise<FollowUpStatsDto> => {
    const { data } = await apiClient.get<FollowUpStatsDto>(`/workspaces/${workspaceId}/follow-ups/stats`, {
      params,
    });
    return data;
  },

  getLogs: async (
    workspaceId: string,
    params?: FollowUpLogsParams
  ): Promise<FollowUpLogsResponse> => {
    const { data } = await apiClient.get<FollowUpLogsResponse>(`/workspaces/${workspaceId}/follow-ups/logs`, {
      params,
    });
    return data;
  },

  testPreview: async (
    workspaceId: string,
    payload: TestPreviewPayload
  ): Promise<TestPreviewResponse> => {
    const { data } = await apiClient.post<TestPreviewResponse>(
      `/workspaces/${workspaceId}/follow-ups/test-preview`,
      payload
    );
    return data;
  },
};
```

### 2.3. Extension to `lib/api/conversations.ts`

```typescript
// Add to conversationsApi:
cancelFollowUp: async (conversationId: string): Promise<{ code: string; message: string }> => {
  const { data } = await apiClient.post<{ code: string; message: string }>(
    `/conversations/${conversationId}/cancel-followup`
  );
  return data;
}
```

---

## 3. SWR Hooks Layer — `hooks/useFollowUps.ts`

Create `hooks/useFollowUps.ts` adhering strictly to SWR cache management and optimistic updates:

```typescript
export function useFollowUpConfig(workspaceId?: string) {
  // SWR Key: ['follow-ups/config', workspaceId]
  // Methods: updateConfig(payload), toggleMasterSwitch(enabled)
  // Auto-toast notifications on save
}

export function useFollowUpStats(workspaceId?: string, params?: { from?: string; to?: string }) {
  // SWR Key: ['follow-ups/stats', workspaceId, params?.from, params?.to]
  // Returns: { stats, isLoading, error, refresh }
}

export function useFollowUpLogs(workspaceId?: string, params?: FollowUpLogsParams) {
  // SWR Key: ['follow-ups/logs', workspaceId, params]
  // Returns: { logs, total, page, totalPages, isLoading, error, refresh }
}

export function useFollowUpPreview(workspaceId?: string) {
  // Helper for generating test previews with loading & error state
  // Returns: { generatePreview, isGenerating, result, error, clearResult }
}
```

---

## 4. UI Component Architecture & Hierarchy

All components strictly comply with **Modern Minimalist Light SaaS**, Google Inter typography, `tabular-nums` metrics, zero gradient text, and **max 400 lines per file**.

```
components/dashboard/automations/
├── AutomationsPage.tsx                 # [MAIN CONTAINER] Tab navigation + Header + Test Trigger
├── rules/
│   ├── FollowUpRulesTab.tsx            # [TAB 1] Main orchestrator for rule configuration
│   ├── AbandonmentStepCard.tsx         # Step 1, 2, 3 delay pickers + Meta 24h badges
│   ├── QuietHoursCard.tsx              # Night blackout toggle & 21:30 - 09:00 times
│   ├── AdaptiveRemindersCard.tsx       # 48h advance notice explanation + 24h & 2h toggles
│   ├── ReviewRetentionCard.tsx         # 2GIS 1-click URL preview + Repeat visit days
│   └── ChannelPolicyStatusCard.tsx     # Meta WABA / IG / TG compliance overview
├── stats/
│   ├── FollowUpStatsTab.tsx            # [TAB 2] Analytics dashboard + Date range filters
│   ├── FollowUpKpiCards.tsx            # Stat cards (Dispatched, Replied %, Bookings, Disqualified)
│   ├── FollowUpStepFunnel.tsx          # Conversion dropoff bar per Step 1, 2, 3
│   └── FollowUpChannelBreakdown.tsx    # WABA vs IG vs TG performance comparison
├── logs/
│   ├── FollowUpLogsTab.tsx             # [TAB 3] Paginated activity table + status filters
│   ├── FollowUpLogStatusBadge.tsx      # Neutral/semantic status badge (PENDING/SENT/REPLIED/etc)
│   └── FollowUpMessageModal.tsx        # Inspection modal for dispatched copy & recipient
└── preview/
    └── FollowUpTestModal.tsx           # Interactive AI simulation tester dialog
```

### 4.1. Detailed Component Specifications

#### 1. `AutomationsPage.tsx` (≤ 250 lines)
- Page header using `DashboardPageHeader`.
- Actions: **"Тестовый запуск"** (`PlayCircle` icon) opening `FollowUpTestModal`.
- Header badge: `BullMQ Follow-Up Engine`.
- Underline tabs:
  1. `rules` — **Сценарии и правила** (`Zap` icon)
  2. `stats` — **Аналитика и конверсия** (`LineChart` icon)
  3. `logs` — **Журнал событий** (`Clock` icon)

#### 2. `FollowUpRulesTab.tsx` (≤ 280 lines)
- Master Toggle: Global Enable / Disable switch for all automations.
- Grid Layout:
  - **Left column (7 cols):**
    - `AbandonmentStepCard`: Configure delays for Step 1 (+2h), Step 2 (+20h), Step 3 (+48h) + auto-disqualify (72h). Clear indicators for Meta 24h window (Free-form AI vs. WhatsApp HSM Template).
    - `AdaptiveRemindersCard`: Clear callout on the **$\ge 48\text{h}$ Advance Notice Rule** — prevents spam on bookings made $\le 25\text{h}$ ahead. Toggles for 24h attendance confirmation and 2h final nudge.
  - **Right column (5 cols):**
    - `QuietHoursCard`: Night blackout switch (`21:30 – 09:00` in `Asia/Almaty`). Explanation of automatic morning rescheduling (`09:15`).
    - `ReviewRetentionCard`: Direct 2GIS Review URL (`.../tab/reviews/addreview`) builder status + 30-day repeat recall trigger.
    - `ChannelPolicyStatusCard`: Channel readiness badges (WABA HSM approved, Instagram fallback, Telegram unlimited).

#### 3. `FollowUpStatsTab.tsx` (≤ 300 lines)
- Filter header: Preset buttons (7 days, 30 days, 90 days) + custom date range.
- Top KPI Row (4 `StatCard` primitives):
  - **Отправлено дожимов:** `summary.totalFollowUpsDispatched`
  - **Конверсия в ответ:** `summary.replyRate%` (`summary.totalReplied` ответов)
  - **Записей создано:** `summary.bookingsGenerated` (`summary.conversionToBookingRate%`)
  - **Запросов отзывов 2GIS:** `summary.reviewsRequested` (~`summary.estimatedReviewsSubmitted` оставлено)
- Visual Funnel & Channel Breakdown:
  - `FollowUpStepFunnel`: Step 1 $\rightarrow$ Step 2 $\rightarrow$ Step 3 dropoff, reply rate, and bookings generated.
  - `FollowUpChannelBreakdown`: Side-by-side performance cards for WhatsApp, Instagram, and Telegram.

#### 4. `FollowUpLogsTab.tsx` (≤ 280 lines)
- Filter Bar: Channel selector (`WHATSAPP`, `INSTAGRAM`, `TELEGRAM`, All), Status filter (`PENDING`, `SENT`, `REPLIED`, `SKIPPED`, `CANCELLED`, All).
- Clean Table View:
  - Timestamp (tabular-nums format: `DD.MM.YYYY HH:mm`)
  - Lead Name + Phone
  - Channel badge + Step Index
  - Status Badge (`FollowUpLogStatusBadge`)
  - Message preview snippet with click-to-view modal
  - Result tag (e.g. `Запись создана` in emerald tint)
- Pagination controls with page count and limits.

#### 5. `FollowUpTestModal.tsx` (≤ 220 lines)
- Dialog to simulate live AI generation without messaging actual users:
  - Conversation selector / ID input.
  - Step selector (Step 1: Мягкий вопрос, Step 2: Ценность/Срочность, Step 3: Вежливое прощание / HSM).
  - "Сгенерировать" CTA button with loading skeleton.
  - Output display: Generated copy, Meta 24h compliance flag, dispatch mode, token consumption, and response latency ($ms$).

#### 6. Inbox Integration — `FollowUpThreadBanner.tsx` (≤ 120 lines)
- Positioned in `ConversationThread.tsx` above message stream.
- Visible when conversation has an active pending follow-up scheduled.
- Shows:
  - Clock icon + text: *"Запланирован авто-дожим: Шаг {step} через {time}"*
  - Button: **"Отменить дожим"** (calls `conversationsApi.cancelFollowUp`).
  - Disappears immediately on click or when manager sends a message.

---

## 5. Translation Keys Specification

All text is in Russian. Keys are added to `locales/translation_keys_new.json` and merged via translation scripts.

### 5.1. Dashboard Namespace (`dashboard.json`)

```json
{
  "automations.title": "Автоматизации и дожим",
  "automations.desc": "Умный дожим замолчавших лидов, напоминания о записях и сбор отзывов в 2GIS",
  "automations.tab_rules": "Сценарии и правила",
  "automations.tab_stats": "Аналитика и конверсия",
  "automations.tab_logs": "Журнал событий",
  "automations.master_switch_enabled": "Автоматизации активны",
  "automations.master_switch_disabled": "Автоматизации приостановлены",
  "automations.save_success": "Настройки автоматизаций сохранены",
  "automations.test_btn": "Тестовый запуск ИИ",
  "automations.test_dialog_title": "Симулятор генерации дожима",
  "automations.test_dialog_desc": "Проверьте, какое сообщение сгенерирует ИИ на основе контекста диалога",
  "automations.test_conv_placeholder": "Выберите диалог для теста...",
  "automations.test_step_label": "Шаг сценария",
  "automations.test_run_btn": "Сгенерировать ответ",
  "automations.test_meta_window_ok": "Внутри 24ч окна Meta (Free-form AI)",
  "automations.test_meta_window_expired": "24ч окно Meta истекло (Шаблон HSM)",
  "automations.test_latency": "Задержка генерации",
  "automations.test_tokens": "Использовано токенов",
  "automations.steps_title": "Сценарий дожима лидов (Lead Abandonment)",
  "automations.steps_desc": "Автоматические касания, если клиент замолчал до завершения записи",
  "automations.step_1_title": "Шаг 1: Мягкое уточнение (+2 часа)",
  "automations.step_1_desc": "ИИ задает вежливый вопрос по услуге или предлагает помощь с выбором времени",
  "automations.step_2_title": "Шаг 2: Ценность и свободные окна (+20 часов)",
  "automations.step_2_desc": "Напоминание о свободных слотах до закрытия 24-часового окна диалога",
  "automations.step_3_title": "Шаг 3: Вежливое завершение (+48 часов)",
  "automations.step_3_desc": "Финальное сообщение или официальный WhatsApp HSM-шаблон",
  "automations.autodisqualify_title": "Авто-закрытие сделки через 72 часа",
  "automations.autodisqualify_desc": "Переводит лид в «Проиграно» с причиной «Не ответил на дожим»",
  "automations.quiet_hours_title": "Тихие часы (Ночной режим)",
  "automations.quiet_hours_desc": "Запрет отправки сообщений с 21:30 до 09:00 (Asia/Almaty). Сообщения переносятся на 09:15",
  "automations.reminders_title": "Адаптивные напоминания о визите",
  "automations.reminders_desc": "Умное расписание без спама: напоминание за 24ч отправляется ТОЛЬКО при бронировании за 48+ часов",
  "automations.reminder_24h_label": "Подтверждение визита за 24 часа",
  "automations.reminder_2h_label": "Короткое напоминание за 2 часа",
  "automations.review_title": "Сбор отзывов в 2GIS и повторные визиты",
  "automations.review_desc": "Прямая ссылка на добавление отзыва 2GIS через 2 часа после визита",
  "automations.review_url_label": "Прямая ссылка на отзыв 2GIS",
  "automations.repeat_recall_label": "Приглашение на повторный визит через (дней)",
  "automations.stats_kpi_dispatched": "Отправлено дожимов",
  "automations.stats_kpi_replied": "Ответов клиентов",
  "automations.stats_kpi_bookings": "Записей получено",
  "automations.stats_kpi_reviews": "Запросов 2GIS",
  "automations.stats_kpi_disqualified": "Лидов авто-закрыто",
  "automations.stats_step_funnel": "Эффективность шагов дожима",
  "automations.stats_channel_perf": "Конверсия по каналам связи",
  "automations.logs_title": "История выполнения авто-дожимов",
  "automations.logs_filter_status": "Статус",
  "automations.logs_filter_channel": "Канал",
  "automations.logs_col_date": "Дата и время",
  "automations.logs_col_lead": "Клиент",
  "automations.logs_col_step": "Шаг",
  "automations.logs_col_status": "Статус",
  "automations.logs_col_message": "Текст сообщения",
  "automations.logs_col_result": "Результат",
  "automations.status_pending": "Ожидает",
  "automations.status_sent": "Отправлено",
  "automations.status_replied": "Клиент ответил",
  "automations.status_skipped": "Пропущено",
  "automations.status_cancelled": "Отменено",
  "inbox.followup_banner_scheduled": "Запланирован авто-дожим (Шаг {step}) в {time}",
  "inbox.followup_banner_cancel_btn": "Отменить дожим",
  "inbox.followup_cancelled_toast": "Авто-дожим для диалога отменен"
}
```

### 5.2. API Error Codes Namespace (`api.json`)

```json
{
  "follow_up.config_updated": "Настройки авто-дожима успешно сохранены",
  "follow_up.cancelled": "Авто-дожим для диалога успешно отменен",
  "follow_up.not_found": "Настройки авто-дожима не найдены",
  "follow_up.preview_failed": "Не удалось сгенерировать превью сообщения"
}
```

---

## 6. Anti-Hallucination Implementation Checklist

Follow this strict step-by-step checklist during implementation:

### Phase 1: API & Types Layer
- [x] **1.1. Create `lib/api/followUps.ts`:**
  - [x] Define complete TypeScript interfaces matching backend DTOs (`FollowUpConfigDto`, `FollowUpStatsDto`, `FollowUpLogsResponse`, `TestPreviewResponse`).
  - [x] Implement `getConfig`, `updateConfig`, `getStats`, `getLogs`, `testPreview`.
- [x] **1.2. Update `lib/api/conversations.ts`:**
  - [x] Add `cancelFollowUp(id)` endpoint call to `POST /conversations/:id/cancel-followup`.
- [x] **1.3. Create `hooks/useFollowUps.ts`:**
  - [x] Implement `useFollowUpConfig` with optimistic mutations and cache revalidation.
  - [x] Implement `useFollowUpStats` with dynamic date filters.
  - [x] Implement `useFollowUpLogs` with pagination and status filters.
  - [x] Implement `useFollowUpPreview` for simulation drawer.

### Phase 2: Configuration Tab (`FollowUpRulesTab.tsx`)
- [x] **2.1. Lead Abandonment Steps Card:**
  - [x] Step 1 (+2h delay selector, Free-form AI badge).
  - [x] Step 2 (+20h delay selector, Free-form AI badge).
  - [x] Step 3 (+48h delay selector, WhatsApp HSM template badge).
  - [x] Auto-disqualify after 72h toggle & description.
- [x] **2.2. Quiet Hours Card:**
  - [x] Blackout toggle (`enabled`).
  - [x] Start time (`21:30`) and end time (`09:00`) time pickers.
  - [x] Fixed timezone badge: `Asia/Almaty (UTC+5)`.
  - [x] Morning reschedule note (`09:15`).
- [x] **2.3. Adaptive Reminders Card:**
  - [x] Visual callout explaining **$\ge 48\text{h}$ Advance Notice Rule** (24h reminder skipped if booked $<48\text{h}$ ahead).
  - [x] 24h attendance confirmation toggle.
  - [x] 2h short nudge toggle.
- [x] **2.4. Post-Visit 2GIS Review & Repeat Visit Card:**
  - [x] 2GIS direct 1-click review URL preview (`build2GisReviewUrl`).
  - [x] Review request trigger delay picker (default: 120 min).
  - [x] Repeat visit recall cycle (default: 30 days).
- [x] **2.5. Channel Policy Status Card:**
  - [x] WhatsApp WABA 24h window + HSM status badge.
  - [x] Instagram Direct 24h window + phone cross-channel fallback badge.
  - [x] Telegram unlimited window badge.

### Phase 3: Analytics Tab (`FollowUpStatsTab.tsx`)
- [x] **3.1. Date Range Filter:**
  - [x] Preset buttons: 7 days, 30 days, 90 days, or custom date picker.
- [x] **3.2. Summary StatCards:**
  - [x] Total dispatched, total replied, reply rate %, bookings generated, 2GIS requests sent.
- [x] **3.3. Funnel & Channel Breakdown:**
  - [x] Visual step progression bars (Step 1 $\rightarrow$ Step 2 $\rightarrow$ Step 3).
  - [x] Channel distribution cards with reply rates.

### Phase 4: Activity Logs Tab (`FollowUpLogsTab.tsx`)
- [x] **4.1. Filter Controls:**
  - [x] Status dropdown (`ALL`, `PENDING`, `SENT`, `REPLIED`, `SKIPPED`, `CANCELLED`).
  - [x] Channel dropdown (`ALL`, `WHATSAPP`, `INSTAGRAM`, `TELEGRAM`).
- [x] **4.2. Paginated Table:**
  - [x] Formatted timestamps with `tabular-nums`.
  - [x] Lead name & phone with avatar.
  - [x] Status badges with appropriate neutral/semantic tones.
  - [x] Message preview snippet + detailed popover/modal.
  - [x] Conversion pill when `convertedToBooking === true`.

### Phase 5: Test Simulator Modal (`FollowUpTestModal.tsx`)
- [x] **5.1. Interactive Test Simulator:**
  - [x] Select conversation dropdown / ID input.
  - [x] Step selector (Step 1, Step 2, Step 3).
  - [x] Execution button with loading state.
  - [x] Display simulated message, Meta 24h window state, token count, and latency ($ms$).

### Phase 6: Inbox & CRM Integration
- [x] **6.1. Inbox Thread Banner (`FollowUpThreadBanner.tsx`):**
  - [x] Render pending follow-up notification in `ConversationThread.tsx`.
  - [x] "Отменить дожим" button with immediate SWR cache invalidation.
- [x] **6.2. Lead CRM Detail Integration:**
  - [x] Recognize `lossReason === 'UNRESPONSIVE_AFTER_FOLLOWUP'` in `LeadDetail` and `LeadCard`.

### Phase 7: Localization & Production Polish
- [x] **7.1. Add Translation Keys:**
  - [x] Add keys to `locales/translation_keys_new.json` and `locales/backend_new_keys.json`.
  - [x] Run `node scripts/apply-translation-keys.mjs`.
  - [x] Run `node scripts/export-translation-keys.mjs`.
- [x] **7.2. Verification & Linting:**
  - [x] Verify zero TypeScript errors.
  - [x] Verify all files $\le 400$ lines.
  - [x] Verify zero hardcoded Russian text in TSX.
  - [x] Verify design tokens match MoonAI Minimalist Light SaaS standards.

---

## 7. Execution Summary (All Completed)

All implementation steps have been executed and verified:

1. `lib/api/followUps.ts` (Types & API Client) — **DONE**
2. `lib/api/conversations.ts` (Added `cancelFollowUp`) — **DONE**
3. `hooks/useFollowUps.ts` (SWR Hooks) — **DONE**
4. `components/dashboard/automations/rules/` (Sub-cards: Steps, Quiet Hours, Reminders, 2GIS, Channels) — **DONE**
5. `components/dashboard/automations/rules/FollowUpRulesTab.tsx` — **DONE**
6. `components/dashboard/automations/stats/` (KPI Cards, Funnel, Channel Breakdown, `FollowUpStatsTab.tsx`) — **DONE**
7. `components/dashboard/automations/logs/` (Status Badges, Modal, `FollowUpLogsTab.tsx`) — **DONE**
8. `components/dashboard/automations/preview/FollowUpTestModal.tsx` — **DONE**
9. `components/dashboard/automations/AutomationsPage.tsx` (Root Refactoring) — **DONE**
10. `components/dashboard/inbox/FollowUpThreadBanner.tsx` & `ConversationThread.tsx` — **DONE**
11. Localization pipeline (`translation_keys_new.json` + merge scripts) — **DONE**
12. TypeScript build & verification (`npx tsc --noEmit` exited 0) — **DONE**
