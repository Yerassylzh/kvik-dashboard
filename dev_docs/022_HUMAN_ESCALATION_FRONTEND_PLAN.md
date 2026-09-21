# 022 — Human Escalation & Notifications: Frontend Implementation Plan

> **Status:** ✅ Implemented
> **Backend Reference:** `dev_docs/backend/052_HUMAN_ESCALATION_AND_NOTIFICATIONS_PLAN.md` (✅ Implemented)
> **Touches:** `components/dashboard/inbox/`, `components/dashboard/notifications/`, `components/dashboard/settings/`, `hooks/`, `lib/api/`, `store/`, `app/(dashboard)/layout.tsx`

---

## Overview

The backend has fully shipped escalation triggers, notification inbox, Telegram recipient management, and conversation takeover lock. The frontend currently has **mock/stub** implementations across the notifications and inbox layers. This plan replaces all stubs with real API + WebSocket integrations and adds the new UI surfaces.

---

## Feature Map

### Feature 1 — Notification Inbox (Real API Integration)

**What:** Replace hardcoded `mockNotifications` arrays in `NotificationsPage.tsx` and `NotificationPopover.tsx` with real paginated data from `GET /notifications`.

**Where:**
- `components/dashboard/notifications/NotificationsPage.tsx`
- `components/dashboard/notifications/NotificationPopover.tsx`
- NEW: `lib/api/notifications.ts`
- NEW: `hooks/useNotifications.ts`

**How (high-level):**
1. Add `lib/api/notifications.ts` with: `getNotifications(page, limit)`, `markRead(id)`, `markAllRead()`.
2. Add `hooks/useNotifications.ts` using SWR returning `{ items, unreadCount, isLoading, markRead, markAllRead, loadMore }`.
3. Wire `NotificationsPage` to hook — replace `useState(mockNotifications)`. Tabs filter by notification `type` field (ESCALATION, NEW_BOOKING, BOOKING_CANCELLED, TAKEOVER, SYSTEM).
4. Wire `NotificationPopover` to same hook — show top 5 items, real `unreadCount` for badge dot.
5. Clickable escalation notification navigates to `/inbox?conversationId=<id>` via `data.conversationId`.

---

### Feature 2 — Real-Time Notification Push (WebSocket)

**What:** Extend `useInboxRealtime` to handle `notification.new` socket events — update badge and optionally fire browser desktop notification.

**Where:**
- `hooks/useInboxRealtime.ts`
- NEW: `store/notifications.store.ts`
- `app/(dashboard)/layout.tsx`

**How (high-level):**
1. Create `store/notifications.store.ts` (Zustand) with `{ unreadCount, increment, setCount, latestNotification }`.
2. In `useInboxRealtime`, on `notification.new`:
   - Call `notificationsStore.increment()`.
   - `mutate` the notifications SWR key to prepend the new item.
   - If `Notification.permission === 'granted'`, fire `new Notification(payload.title, { body, icon })`.
3. In `app/(dashboard)/layout.tsx`, after user loads, call `Notification.requestPermission()` once (guard: `permission === 'default'`).
4. `NotificationPopover` badge reads from `notifications.store.unreadCount`, not local state.

---

### Feature 3 — Conversation Takeover Lock (Inbox UI)

**What:** Replace the simple `HandoffToggle` (BOT_ACTIVE ↔ MANAGER_INTERCEPTED toggle) with a proper three-state `TakeoverControl` component.

**States:**
- BOT_ACTIVE → violet "ИИ Активен" chip (no takeover action).
- MANAGER_INTERCEPTED + unassigned → amber "Взять в работу" primary button.
- MANAGER_INTERCEPTED + assigned to current user → green "Вы ведёте диалог" chip + ghost "Освободить" button.
- MANAGER_INTERCEPTED + assigned to other → grey "Занято специалистом" chip, disabled. No name shown (privacy rule).

**Where:**
- RENAME/REWRITE: `components/dashboard/inbox/HandoffToggle.tsx` → `TakeoverControl.tsx`
- `components/dashboard/inbox/ConversationThread.tsx`
- `lib/api/conversations.ts`
- `store/inbox.store.ts`

**How (high-level):**
1. Extend `ConversationDto` with backend new fields: `assignedStaffId`, `takenOverAt`, `assignedStaff`.
2. Add to `lib/api/conversations.ts`:
   - `takeover(id)` → `POST /conversations/:id/takeover`
   - `releaseTakeover(id)` → `POST /conversations/:id/release-takeover`
   - `getEscalations(id)` → `GET /conversations/:id/escalations`
3. Create `TakeoverControl.tsx` using `currentUser.id` vs `assignedStaffId` to determine state.
4. Optimistic UI + `sonner` toast for: success takeover, success release, 403 already taken.
5. Handle `sendMessage` 403 `conversations.taken_over_by_other` in `ManagerComposer` — show inline locked banner instead of crashing.

---

### Feature 4 — Real-Time Takeover State Updates (WebSocket)

**What:** Handle `conversation.escalated`, `conversation.takeover`, `conversation.takeover_released` to keep inbox list and thread header live.

**Where:**
- `hooks/useInboxRealtime.ts`
- `store/inbox.store.ts`

**How (high-level):**
1. `conversation.escalated` → mutate conversations SWR key (list revalidates, item gets amber badge). Bump notification badge.
2. `conversation.takeover` → mark `conversationId` as taken in store. `TakeoverControl` reads this to disable "Взять в работу" for others.
3. `conversation.takeover_released` → unmark from store. Re-enable button.

---

### Feature 5 — Escalation Badge in Conversation List

**What:** `MANAGER_INTERCEPTED` conversations need visible "🚨 Требует внимания" treatment in the list so staff immediately spot which ones need human attention.

**Where:**
- `components/dashboard/inbox/ConversationListItem.tsx`
- `components/dashboard/inbox/InboxFilters.tsx`

**How (high-level):**
1. In `ConversationListItem`: if `status === 'MANAGER_INTERCEPTED'`, add amber left border accent + small amber "Требует внимания" tag.
2. In `InboxFilters`: add a fourth tab `MANAGER_INTERCEPTED` with a live count badge.

---

### Feature 6 — Escalation History Panel (Conversation Thread)

**What:** Inside an open escalated conversation, show a collapsible panel with the full escalation log from `GET /conversations/:id/escalations`.

**Where:**
- NEW: `components/dashboard/inbox/EscalationHistoryPanel.tsx`
- `components/dashboard/inbox/ConversationThread.tsx`

**How (high-level):**
1. Fetch lazily when `status === 'MANAGER_INTERCEPTED'` (SWR key `['escalations', conversationId]`).
2. Collapsible card below thread header. Each entry: trigger type icon + label + reason text + timestamp.
3. Trigger type → readable label map: `MEDIA_ATTACHMENT` → 📎, `KNOWLEDGE_GAP` → 🧠, `COMPLAINT` → ⚠️, `EXPLICIT_REQUEST` → 👤, etc.

---

### Feature 7 — Telegram Notification Recipients (Settings)

**What:** New settings page `/settings/notifications` for OWNER/ADMIN_MANAGER to connect Telegram and manage recipients.

**Where:**
- NEW route: `app/(dashboard)/settings/notifications/page.tsx`
- NEW: `components/dashboard/settings/notifications/NotificationSettingsPage.tsx`
- NEW: `components/dashboard/settings/notifications/TelegramRecipientsCard.tsx`
- NEW: `lib/api/notificationRecipients.ts`
- `components/dashboard/settings/SettingsNav.tsx`

**How (high-level):**
1. `lib/api/notificationRecipients.ts`: `generateTelegramCode()`, `getRecipients()`, `updateRecipient(id, patch)`, `deleteRecipient(id)`.
2. `TelegramRecipientsCard`:
   - List recipients in a table: displayName, notification type badges, isActive toggle, delete button.
   - "Подключить Telegram" button → call `generateTelegramCode()` → open `deepLink` in new tab → poll `getRecipients()` every 3s (max 2 min) to detect new connection. Show animated countdown waiting state.
   - Notification type checkboxes per row → `PATCH /notifications/recipients/:id` on change with debounce.

---

## Shared Infrastructure

### `lib/api/notifications.ts` (NEW)
```ts
interface NotificationDto {
  id: string; type: 'ESCALATION'|'TAKEOVER'|'TAKEOVER_RELEASED'|'NEW_BOOKING'|'BOOKING_CANCELLED'|'SYSTEM';
  title: string; body: string; data?: Record<string, any>;
  isRead: boolean; readAt: string|null; createdAt: string;
}
interface PaginatedNotificationsResponse { data: NotificationDto[]; total: number; unreadCount: number; }
```

### `store/notifications.store.ts` (NEW)
```ts
{ unreadCount: number, increment(), reset(), setCount(n: number), latestNotification: NotificationDto|null }
```

---

## Implementation Checklist

### 📦 API Layer
- [x] Create `lib/api/notifications.ts` — `getNotifications`, `markRead`, `markAllRead`
- [x] Extend `lib/api/conversations.ts` — add `takeover(id)`, `releaseTakeover(id)`, `getEscalations(id)`
- [x] Extend `ConversationDto` type — add `assignedStaffId`, `takenOverAt`, `assignedStaff`
- [x] Create `lib/api/notificationRecipients.ts` — `generateTelegramCode`, `getRecipients`, `updateRecipient`, `deleteRecipient`

### 🗃️ State Layer
- [x] Create `store/notifications.store.ts` — `unreadCount`, `increment`, `setCount`
- [x] Extend `store/inbox.store.ts` — add `takenConversationIds: Set<string>`, `markTaken(id)`, `markReleased(id)`

### 🪝 Hooks Layer
- [x] Create `hooks/useNotifications.ts` — SWR-based, `items`, `unreadCount`, `markRead`, `markAllRead`, `loadMore`
- [x] Extend `hooks/useInboxRealtime.ts` — add `notification.new`, `conversation.escalated`, `conversation.takeover`, `conversation.takeover_released` handlers

### 🧩 Inbox Components
- [x] Create `TakeoverControl.tsx` — 3-state takeover UI (replaces `HandoffToggle.tsx`)
- [x] Update `ConversationThread.tsx` — swap `HandoffToggle` → `TakeoverControl`, embed `EscalationHistoryPanel`
- [x] Update `ManagerComposer.tsx` — handle 403 `conversations.taken_over_by_other` with inline locked banner
- [x] Create `EscalationHistoryPanel.tsx` — collapsible escalation log, lazy-loaded
- [x] Update `ConversationListItem.tsx` — amber accent + badge for `MANAGER_INTERCEPTED`
- [x] Update `InboxFilters.tsx` — add `MANAGER_INTERCEPTED` filter tab with count

### 🔔 Notification Components
- [x] Refactor `NotificationsPage.tsx` — replace mock data with `useNotifications` hook, filter tabs by `type`
- [x] Refactor `NotificationPopover.tsx` — replace mock data with hook; badge from `notifications.store`
- [x] Add navigation: clicking escalation notification → `/inbox?conversationId=<id>`

### ⚙️ Settings Components
- [x] Create `app/(dashboard)/settings/notifications/page.tsx`
- [x] Create `components/dashboard/settings/notifications/NotificationSettingsPage.tsx`
- [x] Create `components/dashboard/settings/notifications/TelegramRecipientsCard.tsx` — connect flow + CRUD
- [x] Add "Уведомления" nav item to `components/dashboard/settings/SettingsNav.tsx`

### 🌐 Layout / Global
- [x] `app/(dashboard)/layout.tsx` — request `Notification.permission` on first mount (gated on `'default'`)
- [x] `app/(dashboard)/layout.tsx` — seed `notifications.store.unreadCount` from first `GET /notifications` response

### 🌍 Translations
- [x] Add all new UI strings to `locales/translation_keys_new.json`
- [x] Run `node scripts/apply-translation-keys.mjs`
- [x] Run `node scripts/export-translation-keys.mjs`
- [x] Verify zero hardcoded Russian in all new/modified TSX files

---

## Key Constraints

| Rule | Detail |
|---|---|
| **Privacy: no specialist name in broadcasts** | `conversation.takeover` WS payload has no name. Show "Занято специалистом" — never who. Only the owning specialist sees their own "Вы ведёте диалог" from `assignedStaff` on their `GET /conversations/:id`. |
| **Takeover only for MANAGER_INTERCEPTED** | "Взять в работу" renders only when `status === 'MANAGER_INTERCEPTED'`. For `BOT_ACTIVE`, show bot status chip. |
| **403 on locked send** | If `sendMessage` returns `conversations.taken_over_by_other`, show non-crashing inline banner in the composer — do not toast-crash. |
| **Notification.permission** | Request once on login, never again. Guard with `permission === 'default'`. |
| **Telegram polling** | Poll `getRecipients()` every 3s for max 2 min after generating link. Stop on new recipient found or timeout. |
| **File size** | No file > 400 lines. Split if needed. |
| **No hardcoded Russian** | All text via `useTranslations`. New keys → `translation_keys_new.json` → run both scripts. |
