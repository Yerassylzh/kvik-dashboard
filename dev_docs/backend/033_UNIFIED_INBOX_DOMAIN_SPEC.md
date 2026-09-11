# 033 — Unified Inbox & Conversations Domain Spec

> **Module:** `src/modules/conversations/`  
> **Status:** Implementation Pending  
> **Depends On:** Lead, Channel, ChannelAdapters (WhatsApp/Instagram/Telegram clients)  

---

## 1. Purpose

The Unified Inbox aggregates all incoming conversations from all connected channels (WhatsApp, Instagram, Telegram) into a single sorted list. The manager can:
- Read message history for any conversation
- Intercept the AI bot and take control manually
- Send outbound messages via the same channel the client is on
- Mark conversations as closed or hand back to the bot

Real-time updates (new messages, status changes) are pushed via WebSockets (Socket.IO gateway) or SSE.

---

## 2. Prisma Model Reference

```prisma
model Conversation {
  id                 String             // uuid
  workspaceId        String
  leadId             String             // → Lead
  channelId          String             // → Channel
  status             ConversationStatus // BOT_ACTIVE | MANAGER_INTERCEPTED | CLOSED
  lastMessageAt      DateTime           // used for inbox sort
  lastMessagePreview String?            // snippet of last message
  unreadCount        Int                // manager unread counter
}

model Message {
  id                String
  conversationId    String
  role              MessageRole        // USER | BOT | MANAGER
  content           String
  externalMessageId String?            // WhatsApp/Instagram/Telegram message ID
  metadata          Json?              // media attachments, reactions, etc.
  createdAt         DateTime
}
```

---

## 3. API Endpoints

### `GET /conversations`
> Paginated inbox list, sorted by `lastMessageAt DESC` by default. Used for the main inbox view.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `status` | `ConversationStatus` (optional) | Filter by status |
| `channelType` | `WHATSAPP \| INSTAGRAM \| TELEGRAM` (optional) | Filter by channel |
| `search` | `string` (optional) | Search by lead name or phone |
| `page` | `number` (default: 1) | |
| `limit` | `number` (default: 30, max: 100) | |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "BOT_ACTIVE",
      "lastMessageAt": "2026-09-11T14:30:00Z",
      "lastMessagePreview": "Здравствуйте, хочу записаться...",
      "unreadCount": 2,
      "channelType": "WHATSAPP",
      "lead": {
        "id": "uuid",
        "name": "Анна Смирнова",
        "phone": "+77011234567"
      }
    }
  ],
  "total": 85,
  "page": 1,
  "limit": 30
}
```

---

### `GET /conversations/:id`
> Full conversation detail — metadata and lead info. No messages included (use the messages endpoint).

**Response `200`:**
```json
{
  "id": "uuid",
  "status": "MANAGER_INTERCEPTED",
  "lastMessageAt": "2026-09-11T14:30:00Z",
  "unreadCount": 0,
  "channelType": "INSTAGRAM",
  "lead": { "id": "uuid", "name": "Анна", "phone": "+77011234567", "status": "QUALIFIED" },
  "channel": { "id": "uuid", "type": "INSTAGRAM", "status": "CONNECTED" }
}
```

---

### `GET /conversations/:id/messages`
> Paginated message history for a conversation, oldest-first. Calling this endpoint also resets `unreadCount` to 0.

**Query Params:** `page` (default: 1), `limit` (default: 50)

**Response `200`:**
```json
{
  "data": [
    { "id": "uuid", "role": "USER", "content": "Здравствуйте!", "createdAt": "..." },
    { "id": "uuid", "role": "BOT",  "content": "Добрый день! Чем могу помочь?", "createdAt": "..." },
    { "id": "uuid", "role": "MANAGER", "content": "Я сейчас подключусь.", "createdAt": "..." }
  ],
  "total": 18,
  "page": 1,
  "limit": 50
}
```

---

### `POST /conversations/:id/messages`
> **Manager sends an outbound message.** The backend dispatches the message via the correct channel adapter (WhatsApp, Instagram, or Telegram) and persists it as a `MANAGER` role message.  
> Automatically sets conversation `status = MANAGER_INTERCEPTED` if it was `BOT_ACTIVE`.

**Request Body:**
```json
{
  "content": "Здравствуйте! Я Алия, администратор. Чем могу помочь?"
}
```

**Response `201`:**
```json
{ "id": "uuid", "role": "MANAGER", "content": "...", "createdAt": "..." }
```

**Errors:** `404` `conversations.not_found` | `400` `conversations.channel_disconnected` | `502` `conversations.send_failed`

---

### `PATCH /conversations/:id/status`
> Change conversation status. Used for handoff toggle and closing.

**Request Body:**
```json
{ "status": "BOT_ACTIVE" }
```
> Valid transitions: `BOT_ACTIVE → MANAGER_INTERCEPTED`, `MANAGER_INTERCEPTED → BOT_ACTIVE`, `any → CLOSED`

**Response `200`:**
```json
{ "code": "conversations.status_updated", "message": "Conversation status updated." }
```

**Errors:** `400` `conversations.invalid_status_transition`

---

### `PATCH /conversations/:id/read`
> Mark conversation as read — resets `unreadCount = 0`.

**Response `200`:** `{ "code": "conversations.marked_read", "message": "Marked as read." }`

---

## 4. Real-Time: WebSocket Gateway

The backend exposes a **Socket.IO** namespace at `/conversations` (authenticated via `auth.token` in the handshake).

**Events the frontend LISTENS to:**

| Event | Payload | Description |
|---|---|---|
| `message.new` | `{ conversationId, message: { id, role, content, createdAt } }` | New inbound message from client or bot |
| `conversation.updated` | `{ id, status, lastMessageAt, unreadCount }` | Status change or unread bump |
| `conversation.new` | Full conversation object | Entirely new conversation created |

**Events the frontend EMITS:**

| Event | Payload | Description |
|---|---|---|
| `workspace.join` | `{ workspaceId }` | Subscribe to workspace-level updates |
| `workspace.leave` | `{ workspaceId }` | Unsubscribe |

> The frontend joins the room on dashboard mount and leaves on unmount. All broadcasts are scoped to the workspace room.

---

## 5. Files to Create

```
src/modules/conversations/
├── conversations.module.ts
├── conversations.controller.ts
├── conversations.service.ts
├── conversations.repository.ts
├── gateways/
│   └── conversations.gateway.ts     # Socket.IO gateway
└── dto/
    ├── list-conversations.dto.ts
    ├── send-message.dto.ts
    └── update-status.dto.ts
```

---

## 6. Implementation Checklist

- [ ] `ConversationsRepository` — all queries filter by `workspaceId`
- [ ] `GET /conversations` — include lead name/phone join, channel type join, apply filters and pagination
- [ ] `GET /conversations/:id/messages` — paginate oldest-first, auto-reset `unreadCount` on fetch
- [ ] `POST /conversations/:id/messages` — dispatch via channel adapter → persist message → emit `message.new` via gateway
- [ ] Channel adapter dispatch: resolve correct client (`WhatsAppCloudApiClient` / `InstagramGraphApiClient` / `TelegramBotApiClient`) from `channelId`
- [ ] `PATCH /conversations/:id/status` — validate transition, update status, emit `conversation.updated`
- [ ] `PATCH /conversations/:id/read` — set `unreadCount = 0`
- [ ] Socket.IO gateway — authenticate via JWT on handshake, room = `workspace:{workspaceId}`
- [ ] Webhooks pipeline (from `src/modules/webhooks/`) must call `ConversationsService` to persist inbound messages, bump `unreadCount`, update `lastMessageAt`, and emit `message.new` via gateway
- [ ] All error codes registered in `translation_keys_new.json`
- [ ] `npm run build` passes cleanly
