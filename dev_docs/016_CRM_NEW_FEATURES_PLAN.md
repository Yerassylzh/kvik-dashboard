# 016 — CRM Frontend Implementation Plan
## New Features from Backend Spec `046_CRM_SPEC.md`

> **Scope:** Frontend-only — all backend endpoints are already implemented.  
> **Author:** Frontend Agent  
> **Status:** Ready for execution

---

## 0. What Already Exists (Do NOT Rewrite)

| File | What it does |
|---|---|
| `components/dashboard/leads/LeadsPage.tsx` | Root page: view mode toggle, filter state, `LeadDetail` modal |
| `components/dashboard/leads/LeadsKanban.tsx` | 5-column Kanban board |
| `components/dashboard/leads/KanbanColumn.tsx` | Single Kanban column |
| `components/dashboard/leads/LeadCard.tsx` | Card rendered inside Kanban column |
| `components/dashboard/leads/LeadsList.tsx` | Table/list view |
| `components/dashboard/leads/LeadFilters.tsx` | Search + channel filter bar |
| `components/dashboard/leads/LeadDetail.tsx` | Lead modal — contact info, stage switcher, conversations, bookings |
| `hooks/useLeads.ts` | SWR hooks: `useLeads`, `useLeadDetail` |
| `lib/api/leads.ts` | API client: `getLeads`, `getCounts`, `getLead`, `updateStatus`, `updateLead`, `archiveLead` |

---

## 1. API Client Updates — `lib/api/leads.ts`

### 1.1 New & Updated Types

Add the following exports to `lib/api/leads.ts`:

```ts
export type LeadLossReason =
  | 'DISQUALIFIED_BY_POLICY'
  | 'OUT_OF_SERVICE_AREA'
  | 'PRICE_TOO_HIGH'
  | 'UNSUPPORTED_SERVICE'
  | 'CLIENT_DECLINED'
  | 'UNRESPONSIVE_AFTER_FOLLOWUP'
  | 'CANCELLED_WITHOUT_REBOOK'
  | 'SPAM'
  | 'OTHER';

export type StageChangeActor = 'AI' | 'MANAGER' | 'SYSTEM';

// Extend LeadDto — add these fields:
//   lossReason?: LeadLossReason | null
//   lossNotes?: string | null
//   score?: number
//   assignedStaff?: { id: string; name: string; avatarUrl?: string } | null
//   stageChangedAt: string

// Extend LeadDetailDto — add:
//   assignedStaff?: { id: string; name: string } | null
//   recentTimeline?: LeadTimelineEventDto[]
//   notesCount?: number

export interface LeadTimelineEventDto {
  id: string;
  previousStatus: LeadStatus | null;
  newStatus: LeadStatus;
  changedBy: StageChangeActor;
  changedByUserId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface LeadNoteDto {
  id: string;
  content: string;
  isPinned: boolean;
  author: { id: string; name: string };
  createdAt: string;
}

export interface FunnelStageDto {
  stage: LeadStatus;
  count: number;
  conversionToNext: number | null;
  dropoffRate: number | null;
  avgDurationMinutes: number | null;
}

export interface FunnelAnalyticsDto {
  period: { from: string; to: string };
  funnel: FunnelStageDto[];
  overallConversionRate: number;
}

export interface LeadCountsResponseDto {
  counts: Record<LeadStatus, number>;
  totalActive: number;
  conversionRate: number;
  lostReasonsBreakdown: Partial<Record<LeadLossReason, number>>;
}
```

> **Breaking change:** `LeadCountsDto` was `Record<LeadStatus, number>`. Replace with `LeadCountsResponseDto` everywhere. Kanban column headers use `counts.counts[col.id]`.

### 1.2 New API Methods (add to `leadsApi`)

```ts
getFunnel: (params?: { from?: string; to?: string }) => Promise<FunnelAnalyticsDto>
  // GET /leads/funnel

getCounts: () => Promise<LeadCountsResponseDto>
  // GET /leads/counts — update return type

getTimeline: (id: string, params?: { page?: number; limit?: number }) =>
  Promise<{ data: LeadTimelineEventDto[]; total: number; page: number; limit: number }>
  // GET /leads/:id/timeline

createNote: (id: string, payload: { content: string; isPinned?: boolean }) => Promise<LeadNoteDto>
  // POST /leads/:id/notes

deleteNote: (id: string, noteId: string) => Promise<{ code: string; message: string }>
  // DELETE /leads/:id/notes/:noteId

qualifyLead: (id: string, payload: {
  serviceInterest?: string;
  preferredStaffId?: string;
  budget?: number;
  notes?: string;
}) => Promise<{ code: string; message: string }>
  // POST /leads/:id/qualify

disqualifyLead: (id: string, payload: {
  lossReason: LeadLossReason;
  lossNotes?: string;
}) => Promise<{ code: string; message: string }>
  // POST /leads/:id/disqualify

// updateStatus — add optional third arg:
updateStatus: (id: string, status: LeadStatus, opts?: {
  reason?: string;
  lossReason?: LeadLossReason | null;
}) => Promise<{ code: string; message: string }>
  // PATCH /leads/:id/status
```

---

## 2. Hook Updates — `hooks/useLeads.ts`

### 2.1 `useLeads` hook changes

- Update `counts` type to `LeadCountsResponseDto`.
- Update `updateLeadStatus` to accept optional `{ reason?, lossReason? }` and pass to API.
- Remove `archiveLead` (or keep as alias). The correct CRM action is now `disqualifyLead`.

### 2.2 New `useLeadTimeline` hook

```ts
export function useLeadTimeline(leadId: string | null, page = 1) {
  // SWR key: leadId ? ['lead-timeline', leadId, page] : null
  // Fetcher: leadsApi.getTimeline(leadId!, { page, limit: 20 })
  // Returns: { events, total, page, isLoading, error, goToPage(n) }
}
```

### 2.3 New `useLeadNotes` hook

```ts
export function useLeadNotes(leadId: string | null) {
  // Notes are included in LeadDetailDto from GET /leads/:id
  // This hook wraps mutation helpers:
  // Returns: { addNote(content, isPinned?), deleteNote(noteId), isSubmitting }
  // After mutation: mutate the useLeadDetail SWR key
}
```

### 2.4 New `useFunnelAnalytics` hook

```ts
export function useFunnelAnalytics(params?: { from?: string; to?: string }) {
  // SWR key: ['leads-funnel', params]
  // Fetcher: leadsApi.getFunnel(params)
  // Returns: { funnel, overallConversionRate, period, isLoading, error }
}
```

---

## 3. Component Updates

### 3.1 `LeadDetail.tsx` — Tabbed Panel Expansion

Convert the flat scroll layout into **3 tabs** using the existing `SegmentedTabs` UI primitive.

**Tab 1 — Профиль:**
- Keep: contact info (phone, email), nicheData display, sourceChannel badge.
- Add: `assignedStaff` row (avatar + name), `score` pill (0–100).
- Add: loss info section (visible only when `status === 'DEAL_LOST'`): `lossReason` + `lossNotes`.
- Replace status switcher with smarter controls:
  - For `DEAL_LOST` target: show `DisqualifyDialog` instead of direct transition.
  - "Квалифицировать" quick-action button (calls `POST /leads/:id/qualify`).
- Replace ALL hardcoded Russian labels with `t('leads.*')`.

**Tab 2 — История:**
- Render `<LeadTimeline leadId={leadId} />`.

**Tab 3 — Заметки:**
- Render `<LeadNotes leadId={leadId} notes={lead.notes} />`.

> If file exceeds 400 lines, split profile tab into `LeadDetailProfile.tsx`.

### 3.2 `LeadsKanban.tsx` / `KanbanColumn.tsx`

- Accept `counts: LeadCountsResponseDto` (not the old flat record).
- Kanban column count: `counts.counts[col.id]`.
- Add a conversion rate chip in the board header: `"Конверсия: {counts.conversionRate}%"`.
- Replace hardcoded column labels with `t('leads.stage_*')`.

### 3.3 `LeadCard.tsx`

- Show `lead.score` as a small number badge (bottom-right) when `score > 0`.
- Show `lead.assignedStaff?.name` in small text below phone, if present.
- Show `lossReason` badge (text-xs, rose-tinted) when `status === 'DEAL_LOST'`.

### 3.4 `LeadFilters.tsx`

Add these new controls:
- `sortBy` dropdown: `lastActivityAt | createdAt | stageChangedAt | score`.
- `sortOrder` toggle: asc / desc.
- `assignedStaffId` selector (optional staff picker).
- `lossReason` dropdown (visible only when `status === 'DEAL_LOST'` filter is active).

### 3.5 `LeadsPage.tsx`

- Extend view mode to 3 options: `"kanban" | "list" | "funnel"`.
- Render `<LeadsFunnel />` when `viewMode === 'funnel'`.
- Pass `sortBy`, `sortOrder`, `assignedStaffId`, `lossReason` filter state to `useLeads`.

### 3.6 Bookings — No-Show in `LeadDetail.tsx`

For bookings rendered in the bookings section (Tab 1 or dedicated row):
- When `booking.status === 'CONFIRMED'`, show a **"Не пришел"** button.
- On click: call `bookingsApi.markNoShow(booking.id, reason?)`.
- On success: refresh `useLeadDetail` SWR, show toast `t('leads.noshow_toast')`.

---

## 4. New Files to Create

| File | Lines budget | Purpose |
|---|---|---|
| `components/dashboard/leads/LeadTimeline.tsx` | ≤ 150 | Vertical audit trail feed |
| `components/dashboard/leads/LeadNotes.tsx` | ≤ 200 | Notes CRUD panel |
| `components/dashboard/leads/LeadsFunnel.tsx` | ≤ 200 | Funnel chart + date picker |
| `components/dashboard/leads/DisqualifyDialog.tsx` | ≤ 120 | lossReason picker dialog |

---

## 5. Bookings API Addition — `lib/api/bookings.ts`

```ts
markNoShow: async (
  bookingId: string,
  payload?: { reason?: string; chargeFee?: boolean }
) => Promise<{
  code: string;
  message: string;
  booking: { id: string; status: string; startTime: string };
  lead: { id: string; status: string; lossReason: string; noShowCount: number };
}>
// POST /bookings/:id/no-show
```

---

## 6. Translation Keys to Add

**Workflow:**
1. Add keys to `locales/translation_keys_new.json` (dashboard namespace).
2. Add API error keys to `locales/backend_new_keys.json` (api namespace) if that file exists, otherwise same file.
3. Run `node scripts/apply-translation-keys.mjs`.
4. Run `node scripts/export-translation-keys.mjs`.
5. Never directly edit `locales/ru/*.json`.

**Dashboard namespace keys (`dashboard.json`):**
```json
{
  "leads.tab_profile": "Профиль",
  "leads.tab_timeline": "История",
  "leads.tab_notes": "Заметки",
  "leads.score_label": "Рейтинг клиента",
  "leads.assigned_staff": "Ответственный",
  "leads.loss_reason_label": "Причина отказа",
  "leads.loss_notes_label": "Комментарий",
  "leads.qualify_btn": "Квалифицировать",
  "leads.disqualify_btn": "Дисквалифицировать",
  "leads.disqualify_dialog_title": "Закрыть лид",
  "leads.disqualify_dialog_desc": "Укажите причину, по которой лид не конвертировался",
  "leads.timeline_empty": "История действий пуста",
  "leads.timeline_actor_ai": "ИИ-Агент",
  "leads.timeline_actor_manager": "Менеджер",
  "leads.timeline_actor_system": "Система",
  "leads.notes_empty": "Нет заметок",
  "leads.notes_placeholder": "Добавить заметку о клиенте...",
  "leads.notes_add_btn": "Добавить",
  "leads.notes_pin_label": "Закрепить",
  "leads.notes_delete_confirm": "Удалить заметку?",
  "leads.funnel_title": "Воронка продаж",
  "leads.funnel_overall_rate": "Общая конверсия",
  "leads.funnel_avg_duration": "Среднее время в этапе",
  "leads.funnel_dropoff": "Отвал",
  "leads.funnel_conversion": "Конверсия →",
  "leads.noshow_btn": "Не пришел",
  "leads.noshow_toast": "Визит отмечен как пропущенный",
  "leads.loss_reason_disqualified": "Не соответствует критериям",
  "leads.loss_reason_area": "Вне зоны",
  "leads.loss_reason_price": "Цена не устроила",
  "leads.loss_reason_service": "Услуга не поддерживается",
  "leads.loss_reason_declined": "Клиент отказался",
  "leads.loss_reason_unresponsive": "Не отвечает",
  "leads.loss_reason_cancelled": "Отменил без перезаписи",
  "leads.loss_reason_spam": "Спам",
  "leads.loss_reason_other": "Другое",
  "leads.conversion_rate_label": "Конверсия",
  "leads.sort_by_label": "Сортировать",
  "leads.filter_loss_reason": "Причина отказа"
}
```

**API namespace keys (`api.json`):**
```json
{
  "leads.status_updated": "Статус лида успешно обновлен",
  "leads.updated": "Данные лида обновлены",
  "leads.qualified": "Лид успешно квалифицирован",
  "leads.disqualified": "Лид дисквалифицирован и переведен в проигранные",
  "leads.note_created": "Заметка успешно добавлена",
  "leads.note_deleted": "Заметка удалена",
  "leads.not_found": "Лид не найден",
  "leads.invalid_status_transition": "Недопустимый переход между этапами воронки",
  "leads.loss_reason_required": "Для закрытия лида необходимо указать причину отказа",
  "leads.note_not_found": "Заметка не найдена"
}
```

---

## 7. Execution Order

Follow this sequence strictly to avoid broken imports:

1. `lib/api/leads.ts` — types + new methods
2. `hooks/useLeads.ts` — new hooks + `useLeads` update
3. `lib/api/bookings.ts` — add `markNoShow`
4. `components/dashboard/leads/DisqualifyDialog.tsx` — **NEW**
5. `components/dashboard/leads/LeadTimeline.tsx` — **NEW**
6. `components/dashboard/leads/LeadNotes.tsx` — **NEW**
7. `components/dashboard/leads/LeadDetail.tsx` — expand with tabs
8. `components/dashboard/leads/LeadCard.tsx` — score, staff, lossReason
9. `components/dashboard/leads/KanbanColumn.tsx` — counts type fix
10. `components/dashboard/leads/LeadsKanban.tsx` — counts type + conversion chip
11. `components/dashboard/leads/LeadFilters.tsx` — new filter controls
12. `components/dashboard/leads/LeadsFunnel.tsx` — **NEW**
13. `components/dashboard/leads/LeadsPage.tsx` — funnel view mode
14. Translation keys — add to JSON + run scripts

---

## 8. Hard Rules (Never Break)

- **No hardcoded Russian strings** in TSX — always `t('leads.key')`.
- **No revenue/price KPIs** — do not display cost or price estimates (spec §2.5).
- **File limit ≤ 400 lines** per file — split into sub-components if needed.
- **No custom CSS files** — Tailwind utility classes only.
- **Single accent** — `text-primary` / `bg-primary` for active/selected states only.
- **`LeadCountsDto`** is now `LeadCountsResponseDto` — update ALL references.
- **`updateStatus` for `DEAL_LOST`** — always require and pass `lossReason`.
- **Notes pipeline** — never directly edit `locales/ru/*.json`.
- **WebSocket** — if `lead.stage_changed` WS event is already wired up in the app, invalidate `['leads', params]` and `'leads/counts'` SWR keys on receive. Otherwise rely on `refreshInterval: 30000`.
