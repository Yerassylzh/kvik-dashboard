# 019 — Business Intelligence & Recommendations Cockpit: Frontend Implementation Plan
## Frontend Architecture for Backend Spec `048_BUSINESS_IMPROVEMENTS_SUGGESTIONS_PLAN.md`

> **Scope:** Frontend Implementation — UI Dashboard, API Proxy Client, SWR Hooks, Interactive Action Modals, Demand Trend Visualizations, Weekly Reports Archive & Localization  
> **Backend Specification:** `dev_docs/backend/048_BUSINESS_IMPROVEMENTS_SUGGESTIONS_PLAN.md`  
> **Authoritative API Contract:** `openapi.json` (`BusinessInsightsController`)  
> **Status:** Specification & Architectural Blueprint  

---

## 0. Executive Overview & Philosophy

The **KVIK Business Intelligence & Recommendations System** transforms raw customer dialogues across WhatsApp, Instagram, and Telegram into structured, statistically validated, and actionable business insights.

The frontend acts as an **Executive Cockpit** for salon, clinic, and service business owners. Instead of forcing owners to analyze raw conversations or navigate disparate settings screens, the UI presents prioritized recommendations categorized across 6 business archetypes with **1-click execution**:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             FRONTEND ARCHITECTURE & ROUTING                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  Navigation Entrypoint: /insights  (Role Guard: OWNER, ADMIN_MANAGER)                            │
│  Layout: DashboardPageHeader with Underline Segmented Tabs                                       │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Tab 1: [Активные рекомендации] (Active Recommendations)                                     │  │
│  │ • Top KPI Summary (Active recommendations, estimated lost leads, potential conversion boost)│  │
│  │ • Multi-Dimensional Filters: Archetype Category, Priority Impact, Resolution Status         │  │
│  │ • Interactive Recommendation Cards with Quantified Evidence Counters                       │  │
│  │ • 1-Click Action Execution Modal (Add Service, Extend Schedule, Inject KB Note, AI Rule)   │  │
│  │ • Anonymized Customer Verbatim Quotes Slide-Over Drawer                                     │  │
│  │ • Structured Feedback Dismissal Dialog (with persistent suppressKey memory)                │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Tab 2: [Тренды спроса] (Demand Trends & Lost Opportunities)                                 │  │
│  │ • Real-Time Inquiry vs. Working Hours Distribution Heatmap / Overlay                       │  │
│  │ • Unmet Services Demand Bar Chart (Inquiries vs. Lost Leads)                               │  │
│  │ • Top Customer Friction & Objections Breakdown (Price resistance, missing Kaspi Red, etc.)  │  │
│  │ • Date Range Picker (30-day default window)                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Tab 3: [История отчётов] (Weekly Reports Archive)                                          │  │
│  │ • Chronological Timeline of Immutable Weekly Sunday Executive Snapshots                     │  │
│  │ • Pre-rendered Markdown Briefing Viewer (Zero LLM latency on client load)                  │  │
│  │ • Historical Recommendations Registry with Live DB Status Indicators                      │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Network & Proxy Architecture (Clean & Scalable)

All frontend network traffic must strictly adhere to the project's unified Next.js BFF proxy pattern:

```
┌─────────────────────────┐          ┌─────────────────────────┐          ┌─────────────────────────┐
│       Browser UI        │          │   Next.js BFF Proxy     │          │     NestJS Backend      │
│  (React 19 / SWR / TS)  │          │ app/api/[...proxy]      │          │    (Port 4000)          │
└────────────┬────────────┘          └────────────┬────────────┘          └────────────┬────────────┘
             │                                    │                                    │
             │ 1. apiClient.get('/workspaces/...')│                                    │
             │    (BaseURL: '/api')               │                                    │
             ├───────────────────────────────────►│                                    │
             │                                    │ 2. Strips hop-by-hop headers,      │
             │                                    │    attaches Bearer auth token,     │
             │                                    │    forwards to BACKEND_URL         │
             │                                    ├───────────────────────────────────►│
             │                                    │                                    │
             │                                    │ 3. Returns JSON response           │
             │                                    │◄───────────────────────────────────┤
             │ 4. Receives translated data        │                                    │
             │◄───────────────────────────────────┤                                    │
             │                                    │                                    │
             │ 5. Real-Time WebSocket Event       │                                    │
             │    (insights.recommendation_created)                                    │
             │◄────────────────────────────────────────────────────────────────────────┤
```

### 1.1. Proxy Rules & Implementation Standards
1. **Zero Direct Backend Calls:** Browser components must never request `http://localhost:4000` or raw backend domain strings directly. All calls flow through `/api/*`.
2. **Unified `apiClient` (`lib/api/client.ts`):** Automatically injects the active workspace Bearer token, passes through `ngrok-skip-browser-warning`, handles silent 401 token refresh, and applies `transformI18nMessages`.
3. **Route Guard Integration (`proxy.ts`):**
   - The `/insights` route is protected and exclusively accessible to `OWNER` and `ADMIN_MANAGER` roles.
   - Specialists (`SPECIALIST`) attempting to navigate to `/insights` are automatically redirected to `/calendar`.
4. **WebSocket Sync:** SWR cache keys are automatically invalidated upon receiving `insights.recommendation_created` or `insights.weekly_report_ready` over the `/insights` WebSocket namespace.

---

## 2. Detailed User Presentation Surfaces (High-Level Language)

### 2.1. Cockpit Header & Cadence Summary Bar

The header establishes context, displays top-level KPIs, and sets clear expectations regarding data freshness:

* **Title & Badge:** `Бизнес-аналитика и рекомендации` with a subtle violet tag `AI Intelligence`.
* **Cadence & Freshness Indicator:**
  - Recommendations batch: `«Обновлено в воскресенье, 22 сен»` (clarifies that synthesis runs on a weekly Sunday cycle).
  - Demand trends: `«Тренды обновляются в реальном времени»`.
  - **No Manual "Запустить анализ" Button:** The pipeline is completely autonomous (event-driven micro-extraction + weekly cron). Normal business owners do not see or need a manual trigger. (Only developer mode exposes debug hooks).
* **Summary KPI Cards (3 Cards Grid):**
  1. **Требуют внимания:** Total active high/medium priority recommendations count (e.g., `3 рекомендации`).
  2. **Упущено клиентов:** Total lost leads attributed to identified friction points (e.g., `68 клиентов`).
  3. **Потенциал конверсии:** Estimated recoverable conversion rate score (e.g., `+18% к конверсии`).

---

### 2.2. Tab 1: Активные рекомендации (Active Recommendations)

The central operational workspace where owners review prioritized interventions and execute changes in 1 click.

#### Multi-Dimensional Filter Bar:
* **Status Filter:** Segmented pill tabs: `Новые` (default), `Применённые`, `Отклонённые`, `Все`.
* **Category Filter:** Dropdown/Pills for the 6 archetypes:
  1. `Услуги и спрос` (`SERVICE_EXPANSION`)
  2. `График и слоты` (`SCHEDULE_OPTIMIZATION`)
  3. `Цены и оплата` (`PRICING_AND_PACKAGING`)
  4. `База знаний и FAQ` (`KNOWLEDGE_GAP`)
  5. `Загрузка мастеров` (`STAFF_BALANCING`)
  6. `Маркетинг и каналы` (`MARKETING_INSIGHT`)
* **Impact Filter:** `Высокий (HIGH)`, `Средний (MEDIUM)`, `Низкий (LOW)`.

#### Recommendation Card Anatomy:
Every card is rendered on a pure white surface (`bg-card border-border/80 shadow-2xs`) without visual clutter:
1. **Card Header:**
   - Impact badge (`🔴 Высокий`, `🟡 Средний`, `🟢 Низкий`).
   - Archetype category tag.
   - Evidence observation window (e.g., `30 дней`).
   - Current status badge (`Новая`, `Применена`, `Отклонена`).
2. **Body & Diagnosis:**
   - **Executive Title:** Clear, actionable statement (e.g., *"Высокий спрос на новую услугу: Ламинирование бровей и ресниц"*).
   - **Executive Summary:** 1–2 line core finding with metrics (e.g., *"19 клиентов искали эту услугу в WhatsApp и Instagram (13% от всех отказов)"*).
   - **Problem Diagnosis:** Collapsible explanation of why leads drop off and business impact.
3. **Quantified Evidence Metrics:**
   - `Уникальных клиентов:` 19
   - `Потерянных лидов:` 19
   - `Оценка потерь выручки:` ~220 000 ₸ / мес.
4. **Interactive Action Toolbar (3 Core Actions):**
   - **`[ 💬 Цитаты клиентов (19) ]` (Secondary Ghost Button):** Opens the Evidence Drawer.
   - **`[ ⚡ Применить в 1 клик ]` (Primary MoonAI Violet CTA):** Opens the context-aware Action Modal.
   - **`[ Отклонить ]` (Muted Destructive/Ghost Button):** Opens the Structured Dismissal Dialog.

---

### 2.3. Context-Aware 1-Click Action Modals

Clicking **"Применить в 1 клик"** launches a tailored confirmation dialog pre-populated with data from `actionPayload`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      1-CLICK ACTION MODAL WORKFLOWS                         │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ Action Type              │ Modal UI Behavior & Payload Fields               │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ ADD_SERVICE_OFFERING     │ Pre-fills service name, suggested category,      │
│                          │ price (₸), duration (min), and description.      │
│                          │ Allows inline editing before 1-click apply.      │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ UPDATE_SCHEDULE_HOURS    │ Displays target weekdays (e.g. Thu, Fri) and     │
│                          │ proposed opening/closing times (e.g. 09:00-20:00)│
│                          │ with 1-click update to WorkspaceScheduleTemplate.│
├──────────────────────────┼──────────────────────────────────────────────────┤
│ ADD_KNOWLEDGE_NOTE       │ Pre-fills operational FAQ title and ready-to-use │
│                          │ answer (e.g., Kaspi Red payment conditions,      │
│                          │ parking). Writes note and triggers RAG embed.    │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ UPDATE_PROMPT_RULE       │ Pre-fills specialized sales script / cross-sell  │
│                          │ instruction to append to AI qualification rules. │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ MANUAL_ACTION_REQUIRED   │ Displays guided checklist and deep-link shortcut.│
└──────────────────────────┴──────────────────────────────────────────────────┘
```

Upon clicking **"Подтвердить и применить"**:
- Calls `POST /workspaces/:workspaceId/recommendations/:id/apply` with `customizedPayload`.
- Triggers optimistic UI update: card immediately flips to `IMPLEMENTED` with a checkmark badge.
- Shows a non-blocking toast notification.

---

### 2.4. Customer Verbatim Quotes Drawer (`QuotesProofDrawer`)

Slide-over panel verifying that the recommendation is backed by real customer dialogue, eliminating doubt:
* **Header:** Topic title, total mentions counter, observation period.
* **Quote Cards List:**
  - Channel badge (`WhatsApp`, `Instagram`, `Telegram`) with authentic icon and color tint.
  - Date & time formatted in user timezone (`Asia/Almaty`).
  - Lead outcome badge (`Лид потерян` / `Успешная запись`).
  - Anonymized client quote text (PII-scrubbed: no phone numbers or customer full names).

---

### 2.5. Structured Dismissal Dialog (`DismissRecommendationModal`)

Prevents recommendation fatigue and trains the AI engine on owner preferences:
* **Reason Code Picker (Radio Group):**
  - `Не подходит для нашей ниши / профиля` (`NOT_APPLICABLE_TO_NICHE`)
  - `Принципиальное решение бизнеса (не планируем)` (`BUSINESS_DECISION_NO`)
  - `Уже решено оффлайн / вне системы` (`ALREADY_RESOLVED_OFFLINE`)
  - `Некорректно определено ИИ` (`INCORRECT_EXTRACTION`)
  - `Другая причина` (`OTHER`)
* **Feedback Notes (Optional Textarea):** Allows owner to add custom reasoning.
* **Permanent Suppression Checkbox:**
  - `«Больше не предлагать рекомендации по этой теме»` (`suppressPermanently: true`). Writes `suppressKey` to memory so future cron aggregations skip the topic.

---

### 2.6. Tab 2: Тренды спроса (Demand Trends & Lost Opportunities)

Visualizes high-level customer behavior patterns using real-time aggregated signal data (`GET /workspaces/:workspaceId/recommendations/demand-trends`):

1. **Неудовлетворённый спрос на услуги (Unmet Services Demand):**
   - Horizontal bar chart comparing inquiries vs. lost leads for requested but missing services.
2. **Распределение запросов по часам (Hourly Demand Heatmap / Distribution):**
   - 24-hour distribution of incoming client messages.
   - Working hours highlighted vs. off-hours peak demand overlay (e.g., highlighting that 38 inquiries arrived between 19:00 and 21:00 when the salon closed at 18:00).
3. **Топ причин сомнений и отказов (Top Objections Breakdown):**
   - Categorized friction distribution (`PRICE_TOO_HIGH`, `NO_EVENING_SLOTS`, `NO_PARKING_INFO`, `PREFERRED_MASTER_BUSY`) with counts and percentages.

---

### 2.7. Tab 3: История отчётов (Weekly Reports Archive)

Maintains an immutable historical record of all Sunday executive snapshots:
* **Chronological Reports List:** Cards displaying `Неделя 38 (15–21 Сен 2026)`, leads analyzed, total insights discovered, and applied/dismissed count.
* **Report Drill-Down Modal / View:**
  - Displays pre-rendered `markdownContent` directly from the database (instant rendering, zero LLM compute on view).
  - Embeds the exact recommendations generated for that week with **live actionable status** (an owner can still apply a recommendation from 2 weeks ago; the status badge reflects the live DB state).

---

### 2.8. Cold Start & Zero State Handlers
* **New Workspace (<3 leads / 0 clusters):** Informational card explaining data accumulation:
  * *"Ваши данные накапливаются. Обычно первые инсайты появляются после 20–30 диалогов с клиентами."*
  * Displays 2 generic niche best-practice recommendations clearly labeled *"Общие рекомендации"*.
* **Zero Friction State:** Congratulatory banner indicating that bot conversion is optimal and no recurring objections were detected.

---

## 3. Frontend Architecture & Modular Component Breakdown

To enforce the **<400 lines per file** rule (`AGENTS.md`) and maintain modularity, the feature is decomposed into focused sub-components:

```
components/dashboard/insights/
├── InsightsPage.tsx                      # Root coordinator (~180 lines)
├── tabs/
│   ├── RecommendationsTab.tsx            # Filter bar + recommendation cards list (~220 lines)
│   ├── DemandTrendsTab.tsx               # Analytics charts and friction breakdown (~250 lines)
│   └── ReportsHistoryTab.tsx             # Weekly reports timeline and drilldown (~200 lines)
├── cards/
│   ├── InsightKpiHeader.tsx              # 3 KPI summary metrics + data freshness badge (~120 lines)
│   ├── RecommendationCard.tsx            # Individual recommendation card UI (~240 lines)
│   └── ColdStartInsightsCard.tsx         # Empty state for new workspaces (~110 lines)
├── drawers/
│   └── QuotesProofDrawer.tsx             # Verbatim quotes slide-over panel (~180 lines)
├── modals/
│   ├── ApplyRecommendationModal.tsx      # Dynamic 1-click execution modal (~260 lines)
│   ├── DismissRecommendationModal.tsx    # Feedback & suppression modal (~190 lines)
│   └── WeeklyReportDetailModal.tsx       # Rendered markdown weekly briefing modal (~180 lines)
└── charts/
    ├── UnmetServicesChart.tsx            # Bar chart for missing services (~140 lines)
    ├── HourlyDistributionChart.tsx       # Inquiries vs work hours overlay (~160 lines)
    └── ObjectionsDonutChart.tsx          # Objections breakdown visual (~130 lines)

lib/api/
└── insights.ts                           # Typed API proxy client methods (~180 lines)

hooks/
└── useBusinessInsights.ts                # SWR hooks, optimistic mutations & filters (~220 lines)

types/
└── insights.ts                           # Full TypeScript DTO contracts (~160 lines)
```

---

## 4. Authoritative Backend API Contracts (`openapi.json`)

All endpoint contracts are verified directly against `openapi.json`:

### 4.1. Endpoints Specification

| Method | Endpoint | Description | Query / Body Parameters | Response DTO |
|---|---|---|---|---|
| `GET` | `/workspaces/{workspaceId}/recommendations` | List paginated recommendations | `status`, `category`, `impact`, `page`, `limit` | `RecommendationsListResponseDto` |
| `GET` | `/workspaces/{workspaceId}/recommendations/summary` | Header KPI metrics & category breakdown | None | `RecommendationsSummaryResponseDto` |
| `POST` | `/workspaces/{workspaceId}/recommendations/{id}/apply` | Execute 1-click action | `ApplyRecommendationDto` (`customizedPayload`) | `200 OK` (Updated status: `IMPLEMENTED`) |
| `POST` | `/workspaces/{workspaceId}/recommendations/{id}/dismiss` | Dismiss with structured feedback | `DismissRecommendationDto` (`reasonCode`, `feedbackNotes`, `suppressPermanently`) | `200 OK` (Updated status: `DISMISSED`) |
| `GET` | `/workspaces/{workspaceId}/recommendations/demand-trends` | Demand charts & friction metrics | `from`, `to` | `DemandTrendsResponseDto` |
| `GET` | `/workspaces/{workspaceId}/reports` | List historical weekly reports | `page`, `limit` | `ReportsListResponseDto` |
| `GET` | `/workspaces/{workspaceId}/reports/{reportId}` | Single weekly report + markdown | None | `SingleWeeklyReportResponseDto` |

---

### 4.2. Core TypeScript Interfaces (`types/insights.ts`)

```typescript
export type RecommendationStatus = 'NEW' | 'ACCEPTED' | 'DISMISSED' | 'IMPLEMENTED' | 'ALL';

export type InsightCategory =
  | 'SERVICE_EXPANSION'
  | 'SCHEDULE_OPTIMIZATION'
  | 'PRICING_AND_PACKAGING'
  | 'KNOWLEDGE_GAP'
  | 'STAFF_BALANCING'
  | 'MARKETING_INSIGHT';

export type InsightImpact = 'HIGH' | 'MEDIUM' | 'LOW';

export type RecommendationActionType =
  | 'ADD_SERVICE_OFFERING'
  | 'UPDATE_SCHEDULE_HOURS'
  | 'ADD_KNOWLEDGE_NOTE'
  | 'UPDATE_PROMPT_RULE'
  | 'MANUAL_ACTION_REQUIRED';

export type DismissalReasonCode =
  | 'NOT_APPLICABLE_TO_NICHE'
  | 'BUSINESS_DECISION_NO'
  | 'ALREADY_RESOLVED_OFFLINE'
  | 'INCORRECT_EXTRACTION'
  | 'OTHER';

export interface SampleQuoteDto {
  quote: string;
  channel: 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM';
  date: string;
}

export interface RecommendationItemDto {
  id: string;
  category: InsightCategory;
  impact: InsightImpact;
  status: RecommendationStatus;
  title: string;
  executiveSummary: string;
  problemDiagnosis: string;
  uniqueClientsCount: number;
  lostLeadsCount: number;
  lostRevenueScore: number;
  sampleQuotes: SampleQuoteDto[];
  actionType: RecommendationActionType;
  actionPayload: Record<string, any>;
  createdAt: string;
}

export interface RecommendationsSummaryResponseDto {
  totalActive: number;
  highImpactCount: number;
  mediumImpactCount: number;
  lowImpactCount: number;
  estimatedLostLeadsTotal: number;
  categoryBreakdown: Record<InsightCategory, number>;
}

export interface UnmetServiceItemDto {
  service: string;
  inquiries: number;
  lostLeads: number;
}

export interface HourlyDistributionItemDto {
  hour: number;
  inquiries: number;
  isWorkingHour: boolean;
}

export interface TopObjectionItemDto {
  reason: string;
  count: number;
  percentage: number;
}

export interface DemandTrendsResponseDto {
  period: { from: string; to: string };
  unmetServices: UnmetServiceItemDto[];
  hourlyInquiryDistribution: HourlyDistributionItemDto[];
  topObjections: TopObjectionItemDto[];
}

export interface WeeklyReportItemDto {
  id: string;
  periodStart: string;
  periodEnd: string;
  weekLabel: string;
  totalLeadsAnalyzed: number;
  totalInsightsFound: number;
  highImpactCount: number;
  totalLostLeads: number;
  recommendations: Array<{
    id: string;
    category: InsightCategory;
    impact: InsightImpact;
    status: RecommendationStatus;
    title: string;
    uniqueClientsCount: number;
  }>;
  generatedAt: string;
}

export interface SingleWeeklyReportResponseDto extends WeeklyReportItemDto {
  markdownContent: string;
}
```

---

### 4.3. API Client Wrapper Implementation (`lib/api/insights.ts`)

```typescript
import { apiClient } from './client';
import {
  RecommendationItemDto,
  RecommendationsSummaryResponseDto,
  DemandTrendsResponseDto,
  WeeklyReportItemDto,
  SingleWeeklyReportResponseDto,
  DismissalReasonCode,
  InsightCategory,
  InsightImpact,
  RecommendationStatus,
} from '@/types/insights';

export const insightsApi = {
  getRecommendations: (
    workspaceId: string,
    params?: {
      status?: RecommendationStatus;
      category?: InsightCategory;
      impact?: InsightImpact;
      page?: number;
      limit?: number;
    }
  ) =>
    apiClient
      .get<{ data: RecommendationItemDto[]; total: number; page: number; limit: number }>(
        `/workspaces/${workspaceId}/recommendations`,
        { params }
      )
      .then((res) => res.data),

  getSummary: (workspaceId: string) =>
    apiClient
      .get<RecommendationsSummaryResponseDto>(`/workspaces/${workspaceId}/recommendations/summary`)
      .then((res) => res.data),

  applyRecommendation: (
    workspaceId: string,
    id: string,
    customizedPayload?: Record<string, any>
  ) =>
    apiClient
      .post(`/workspaces/${workspaceId}/recommendations/${id}/apply`, { customizedPayload })
      .then((res) => res.data),

  dismissRecommendation: (
    workspaceId: string,
    id: string,
    payload: {
      reasonCode: DismissalReasonCode;
      feedbackNotes?: string;
      suppressPermanently?: boolean;
    }
  ) =>
    apiClient
      .post(`/workspaces/${workspaceId}/recommendations/${id}/dismiss`, payload)
      .then((res) => res.data),

  getDemandTrends: (workspaceId: string, params?: { from?: string; to?: string }) =>
    apiClient
      .get<DemandTrendsResponseDto>(`/workspaces/${workspaceId}/recommendations/demand-trends`, {
        params,
      })
      .then((res) => res.data),

  getReports: (workspaceId: string, params?: { page?: number; limit?: number }) =>
    apiClient
      .get<{ data: WeeklyReportItemDto[]; total: number; page: number; limit: number }>(
        `/workspaces/${workspaceId}/reports`,
        { params }
      )
      .then((res) => res.data),

  getReportById: (workspaceId: string, reportId: string) =>
    apiClient
      .get<SingleWeeklyReportResponseDto>(`/workspaces/${workspaceId}/reports/${reportId}`)
      .then((res) => res.data),
};
```

---

## 5. Localization & Translation System

In accordance with Section 4 of `AGENTS.md`, the platform is **Russian-only**. All UI strings must be declared in `locales/translation_keys_new.json` and compiled via scripts.

### 5.1. Namespace Keys (`locales/translation_keys_new.json`)

```json
{
  "insights": {
    "title": "Бизнес-аналитика и рекомендации",
    "desc": "Автоматический анализ диалогов клиентов, выявление упущенной выручки и готовые улучшения бизнеса в 1 клик",
    "badge_ai": "AI Intelligence",
    "updated_weekly": "Данные рекомендаций обновлены в воскресенье, {date}",
    "updated_realtime": "Тренды спроса обновляются в реальном времени",
    "tabs": {
      "recommendations": "Активные рекомендации",
      "demand_trends": "Тренды спроса",
      "reports_history": "История отчётов"
    },
    "kpi": {
      "active_improvements": "Важных улучшений",
      "lost_leads": "Потенциальных клиентов упущено",
      "conversion_uplift": "Возможный прирост конверсии",
      "require_attention": "требуют внимания"
    },
    "filters": {
      "status_new": "Новые",
      "status_applied": "Применённые",
      "status_dismissed": "Отклонённые",
      "status_all": "Все",
      "all_categories": "Все категории",
      "all_impacts": "Любой приоритет"
    },
    "categories": {
      "SERVICE_EXPANSION": "Услуги и меню",
      "SCHEDULE_OPTIMIZATION": "График и слоты",
      "PRICING_AND_PACKAGING": "Цены и оплата",
      "KNOWLEDGE_GAP": "База знаний и FAQ",
      "STAFF_BALANCING": "Нагрузка мастеров",
      "MARKETING_INSIGHT": "Маркетинг и каналы"
    },
    "actions": {
      "view_quotes": "Цитаты клиентов ({count})",
      "apply_one_click": "Применить в 1 клик",
      "dismiss": "Отклонить",
      "applied_success": "Рекомендация успешно применена!",
      "dismissed_success": "Рекомендация отклонена, предпочтения сохранены"
    },
    "modals": {
      "proof_title": "Доказательства спроса из диалогов",
      "apply_title": "Применение рекомендации",
      "dismiss_title": "Отклонение рекомендации",
      "reason_placeholder": "Укажите причину отклонения...",
      "suppress_topic": "Больше не предлагать рекомендации по этой теме"
    },
    "cold_start": {
      "title": "Сбор первых данных",
      "desc": "Диалоги ваших клиентов анализируются в фоновом режиме. Первые точные рекомендации появятся после накопления 20–30 обращений."
    }
  }
}
```

### 5.2. Compilation Script Command
```bash
node scripts/apply-translation-keys.mjs
node scripts/export-translation-keys.mjs
```

---

## 6. Concise Anti-Hallucination Checklist

To avoid guessing backend behaviors, making false assumptions, or introducing breaking architectural defects, any agent or developer implementing the frontend must follow this strict verification protocol:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            CONCISE ANTI-HALLUCINATION CHECKLIST                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. [ ] VERIFY BACKEND CONTRACT IN openapi.json                                              │
│        • Confirm endpoints: /workspaces/{workspaceId}/recommendations and                   │
│          /workspaces/{workspaceId}/reports (NOT /insights/v1 or /api/recommendations).      │
│        • Verify all parameter names: workspaceId (path), id (path), reportId (path).       │
│                                                                                             │
│ 2. [ ] ROUTE ALL REQUESTS THROUGH NEXT.JS PROXY                                             │
│        • Ensure apiClient uses baseURL: '/api' targeting app/api/[...proxy]/route.ts.       │
│        • Never write hardcoded http://localhost:4000 backend URLs in client components.     │
│        • Confirm proxy.ts allows OWNER and ADMIN_MANAGER; redirects SPECIALIST to /calendar.│
│                                                                                             │
│ 3. [ ] PIN ENUMS & DTO PROPERTIES EXACTLY                                                   │
│        • Categories: SERVICE_EXPANSION, SCHEDULE_OPTIMIZATION, PRICING_AND_PACKAGING,       │
│          KNOWLEDGE_GAP, STAFF_BALANCING, MARKETING_INSIGHT.                                 │
│        • Impacts: HIGH, MEDIUM, LOW.                                                        │
│        • Statuses: NEW, ACCEPTED, DISMISSED, IMPLEMENTED.                                   │
│        • Action Types: ADD_SERVICE_OFFERING, UPDATE_SCHEDULE_HOURS, ADD_KNOWLEDGE_NOTE,     │
│          UPDATE_PROMPT_RULE, MANUAL_ACTION_REQUIRED.                                        │
│        • Dismissal Reasons: NOT_APPLICABLE_TO_NICHE, BUSINESS_DECISION_NO,                  │
│          ALREADY_RESOLVED_OFFLINE, INCORRECT_EXTRACTION, OTHER.                             │
│                                                                                             │
│ 4. [ ] DO NOT RENDER A MANUAL "RUN ANALYSIS" BUTTON FOR NORMAL USERS                        │
│        • The pipeline is 100% autonomous (event-driven micro-extraction + Sunday cron).     │
│        • A manual trigger button in the main UI is a hallucination. If a debug trigger      │
│          is created, isolate it strictly behind an internal isDevMode flag.                 │
│                                                                                             │
│ 5. [ ] ENFORCE DATA FRESHNESS DISCLAIMERS IN UI                                             │
│        • Display "Обновлено в воскресенье, [дата]" for recommendations batch.               │
│        • Display "Обновлено сегодня" for live demand trends.                                │
│        • Do not misrepresent batch-synthesized recommendations as instantaneous live AI.    │
│                                                                                             │
│ 6. [ ] ADHERE TO RUSSIAN-ONLY TRANSLATION SYSTEM                                            │
│        • Zero hardcoded Russian text in TSX. Always use useTranslations('insights').        │
│        • Append keys to locales/translation_keys_new.json, then run:                        │
│          node scripts/apply-translation-keys.mjs && node scripts/export-translation-keys.mjs │
│                                                                                             │
│ 7. [ ] COMPLY WITH ENTERPRISE LIGHT SAAS DESIGN SYSTEM                                      │
│        • Max 400 lines per file (strictly split into sub-components).                       │
│        • Pure white cards (bg-card / bg-white) with ultra-subtle border (border-border/80). │
│        • Accent color strictly MoonAI Violet (#7C3AED / var(--primary)).                    │
│        • Zero AI visual gimmicks: no glowing borders, no radar pulse rings, no gradients.   │
│        • Use tabular-nums on all numbers, currencies (₸), dates, and metrics.               │
│                                                                                             │
│ 8. [ ] HANDLE COLD START & ZERO-DATA GRACEFULLY                                             │
│        • Display empty state card with explanation when unique leads < 3.                   │
│        • Never show blank screens, broken chart axes, or infinite loading skeletons.        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```
