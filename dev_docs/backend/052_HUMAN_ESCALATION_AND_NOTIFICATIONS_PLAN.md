# 052 — Human Escalation, In-App Notifications & Conversation Takeover

> **Modules:** `src/modules/ai-engine/`, `src/modules/conversations/`, `src/modules/notifications/`
> **Status:** ✅ Implemented
> **Related Docs:** `034_AI_ENGINE_DOMAIN_SPEC.md`, `033_UNIFIED_INBOX_DOMAIN_SPEC.md`

---

## 1. Overview

Four integrated features:

1. **Human Escalation** — AI-to-human handoff with prioritized trigger rules.
2. **Telegram Notifications** — Owner/manager Telegram linking via zero-friction deep link for high-priority alerts.
3. **In-App Notification Inbox** — Persistent notification center with real-time WebSocket push and desktop notification support.
4. **Specialist Takeover Lock** — Exclusive conversation ownership for a single specialist, with anonymous broadcast on take/release.

---

## 2. Escalation Triggers

Checked on every inbound message. First match wins.

| Priority | Trigger | Condition |
|---|---|---|
| **P0** | Visual / file media | Non-audio attachment (image, video, document, sticker, gif). Audio passes through to voice pipeline. |
| **P0** | Explicit human request | Client writes "живой человек", "оператор", "call manager" etc. |
| **P1** | Knowledge gap | AI tool call: `escalate_to_human(reason: "knowledge_gap")` |
| **P1** | Complaint / conflict | AI tool call: `escalate_to_human(reason: "complaint")` |
| **P1** | Policy edge case | AI tool call: `escalate_to_human(reason: "policy_edge_case")` |
| **P1** | Specialist required | AI tool call: `escalate_to_human(reason: "specialist_required")` |
| **P2** | AI response failure | Gemini error / empty response |
| **P2** | Consecutive unresolved | Multiple unanswered turns |

When escalated, `Conversation.status` → `MANAGER_INTERCEPTED`.

---

## 3. Telegram Notification Channel

### 3.1 Zero-Friction Deep Link Connection Flow

```
1. Owner/manager clicks "Connect Telegram" in Dashboard Settings
2. POST /notifications/recipients/telegram/generate-code
   → returns { deepLink: "https://t.me/kvik_notify_bot?start=KVIK-8F3A2", code, expiresAt }
3. Frontend opens deepLink (window.open or <a href>)
4. Owner taps START in Telegram
5. Bot receives /start KVIK-8F3A2 → backend links chat_id → replies "✅ Telegram подключен!"
6. Frontend refreshes recipient list (GET /notifications/recipients)
```

Code expires in **15 minutes** and is single-use.

### 3.2 Notification Events Sent to Telegram

| Event | When |
|---|---|
| 🚨 New escalation | Conversation escalated to `MANAGER_INTERCEPTED` |
| 👤 Диалог взят в работу | Specialist takes over (no name shown) |
| ⚠️ Диалог освобожден | Specialist releases (no name shown) |
| 📅 Новая запись | Booking created |
| ❌ Запись отменена | Booking cancelled |

---

## 4. REST API Reference (Frontend)

All endpoints require `Authorization: Bearer <token>`.

---

### 4.1 Telegram Recipients

#### `POST /notifications/recipients/telegram/generate-code`
Generate a Telegram deep link. Roles: `OWNER`, `ADMIN_MANAGER`.

**Response `200`:**
```json
{
  "deepLink": "https://t.me/kvik_notify_bot?start=KVIK-8F3A2",
  "code": "KVIK-8F3A2",
  "expiresAt": "2026-09-19T15:00:00.000Z"
}
```

#### `GET /notifications/recipients`
List all connected Telegram recipients. Roles: `OWNER`, `ADMIN_MANAGER`.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "telegramChatId": "123456789",
    "displayName": "Иван Иванов",
    "notificationTypes": ["escalation", "new_booking", "booking_cancelled"],
    "isActive": true,
    "createdAt": "2026-09-19T10:00:00.000Z"
  }
]
```

#### `PATCH /notifications/recipients/:id`
Update recipient preferences. Roles: `OWNER`, `ADMIN_MANAGER`.

**Body:**
```json
{
  "notificationTypes": ["escalation"],
  "isActive": false
}
```

#### `DELETE /notifications/recipients/:id`
Remove a Telegram recipient. Roles: `OWNER`, `ADMIN_MANAGER`.

---

### 4.2 In-App Notification Inbox

#### `GET /notifications?page=1&limit=30`
Paginated notification inbox for the workspace. All authenticated users.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "ESCALATION",
      "title": "🚨 Требуется участие сотрудника",
      "body": "Клиент Иван: ИИ не нашел ответ в базе знаний",
      "data": { "conversationId": "uuid", "triggerType": "KNOWLEDGE_GAP" },
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-09-19T14:32:00.000Z"
    }
  ],
  "total": 42,
  "unreadCount": 5
}
```

> Use `unreadCount` to drive the notification badge in the nav.

#### `PATCH /notifications/read-all`
Mark all unread notifications as read.

**Response `200`:**
```json
{ "code": "notifications.all_marked_read", "message": "All notifications marked as read." }
```

#### `PATCH /notifications/:id/read`
Mark one notification as read.

**Response `200`:**
```json
{ "code": "notifications.marked_read", "message": "Notification marked as read." }
```

---

### 4.3 Conversation Takeover

#### `POST /conversations/:id/takeover`
The current staff member claims exclusive ownership of an escalated conversation.

- Only works when `conversation.status === "MANAGER_INTERCEPTED"`.
- Returns `403` if already taken over by a different specialist.

**Response `200`:**
```json
{ "code": "conversations.takeover_success", "message": "You have successfully taken over the conversation." }
```

**Error `403`:**
```json
{ "code": "conversations.taken_over_by_other", "message": "..." }
```

**Error `400`:**
```json
{ "code": "conversations.not_escalated", "message": "..." }
```

#### `POST /conversations/:id/release-takeover`
The owning specialist releases the lock. Conversation stays `MANAGER_INTERCEPTED` but becomes available for others.

- Returns `403` if caller is not the current assignee.

**Response `200`:**
```json
{ "code": "conversations.takeover_released", "message": "Takeover released. The conversation is now open for another specialist." }
```

---

### 4.4 Outbound Message Lock

`POST /conversations/:id/messages` now enforces the takeover lock.

**Error `403` (if another specialist tries to reply):**
```json
{ "code": "conversations.taken_over_by_other", "message": "This conversation has been taken over by another specialist. You cannot send messages here." }
```

---

### 4.5 Escalation History

#### `GET /conversations/:id/escalations`
Returns the escalation log for a conversation.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "conversationId": "uuid",
    "triggerType": "MEDIA_ATTACHMENT",
    "reason": "Клиент прикрепил фото/документ — требуется просмотр",
    "triggeredAt": "2026-09-19T14:30:00.000Z",
    "resolvedAt": null,
    "resolvedByStaffId": null
  }
]
```

---

## 5. WebSocket Events (Socket.IO)

**Namespace:** `/conversations`  
**Authentication:** Connect with `Authorization` header or token query param (same as REST).

### 5.1 Join workspace room (required first step)

```js
socket.emit('workspace.join', { workspaceId: 'your-workspace-id' });
// ack: { event: 'workspace.joined', room: 'workspace:...' }
```

---

### 5.2 Incoming Events (backend → frontend)

#### `notification.new`
Fired when any new in-app notification is created. Use to increment the badge and optionally show a browser `Notification`.

```ts
socket.on('notification.new', (payload: {
  id: string;
  type: 'ESCALATION' | 'TAKEOVER' | 'TAKEOVER_RELEASED' | 'NEW_BOOKING' | 'BOOKING_CANCELLED' | 'SYSTEM';
  title: string;
  body: string;
  data?: Record<string, any>; // e.g. { conversationId, triggerType }
  createdAt: string; // ISO date
}) => { ... });
```

---

#### `conversation.escalated`
Fired when a conversation is escalated to `MANAGER_INTERCEPTED`. Use to highlight the conversation in the inbox.

```ts
socket.on('conversation.escalated', (payload: {
  conversationId: string;
  triggerType: string;
  reason: string | null;
  triggeredAt: string;
}) => { ... });
```

---

#### `conversation.takeover`
Fired when a specialist takes over a conversation. **No specialist name in payload** (privacy rule).

```ts
socket.on('conversation.takeover', (payload: {
  conversationId: string;
  takenOverAt: string; // ISO date
}) => { ... });
```

> **Frontend behavior:** Mark the conversation as "in progress" (e.g. grey out the "Take Over" button for other users).

---

#### `conversation.takeover_released`
Fired when the specialist releases ownership. Conversation is back in the open queue.

```ts
socket.on('conversation.takeover_released', (payload: {
  conversationId: string;
}) => { ... });
```

> **Frontend behavior:** Re-enable "Take Over" button for all specialists.

---

#### `conversation.updated`
Status or unread count changed.

```ts
socket.on('conversation.updated', (payload: {
  id: string;
  status: 'BOT_ACTIVE' | 'MANAGER_INTERCEPTED' | 'CLOSED';
  lastMessageAt: string;
  unreadCount: number;
}) => { ... });
```

---

#### `message.new`
New message in any conversation in the workspace.

```ts
socket.on('message.new', (payload: {
  conversationId: string;
  message: {
    id: string;
    role: 'USER' | 'ASSISTANT' | 'MANAGER';
    content: string;
    senderStaff?: { id: string; name: string; role: string; avatarUrl?: string };
    createdAt: string;
  };
}) => { ... });
```

---

#### `conversation.new`
A brand new conversation was created (first message from a new lead).

```ts
socket.on('conversation.new', (conversation: any) => { ... });
```

---

## 6. Desktop Push Notifications (Web Push API)

The `notification.new` socket event is the trigger point for desktop notifications. Suggested frontend pattern:

```js
socket.on('notification.new', async (payload) => {
  // 1. Update badge count in UI
  setBadge(count => count + 1);

  // 2. Show browser notification if permission granted
  if (Notification.permission === 'granted') {
    new Notification(payload.title, {
      body: payload.body,
      icon: '/favicon.ico',
      data: payload.data,
    });
  }
});
```

Request permission on first login:
```js
if (Notification.permission === 'default') {
  await Notification.requestPermission();
}
```

---

## 7. Conversation Detail Shape (with takeover fields)

`GET /conversations/:id` now includes takeover fields:

```json
{
  "id": "uuid",
  "status": "MANAGER_INTERCEPTED",
  "assignedStaffId": "staff-uuid-or-null",
  "takenOverAt": "2026-09-19T14:32:00.000Z",
  "assignedStaff": {
    "id": "uuid",
    "name": "Иван",
    "role": "SPECIALIST"
  },
  "lead": { ... },
  "channel": { ... }
}
```

> The `assignedStaff` field is available for the **owning specialist's own UI** (e.g. show "You are handling this conversation"). Do **not** expose it publicly in broadcast messages to other users.

---

## 8. Implementation Status

| Feature | Status |
|---|---|
| Prisma: `Notification`, `NotificationType`, `assignedStaffId`, `takenOverAt` | ✅ |
| `EscalationService` with in-app + Telegram dispatch | ✅ |
| `NotificationsService`: deep link, bot webhook, dispatch, in-app CRUD | ✅ |
| REST: `/notifications` inbox (list, read, read-all) | ✅ |
| REST: `/notifications/recipients` (CRUD + deep link) | ✅ |
| REST: `/conversations/:id/takeover` + `/release-takeover` | ✅ |
| `sendMessage` lock check (403 for non-assignee) | ✅ |
| Gateway: `notification.new`, `conversation.takeover`, `conversation.takeover_released` | ✅ |
| Telegram formatters: escalation, takeover, released, booking | ✅ |
| Lint + TypeScript build | ✅ |
