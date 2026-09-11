# 037 — Dev Mock Messaging Channel & Chat Simulator Plan

> **Module:** `src/modules/dev-messaging/`  
> **Status:** Implemented & Verified  
> **Env Flag:** `ENABLE_DEV_MESSAGING` (auto-enabled when `NODE_ENV !== 'production'`)

---

## 1. Purpose

During development the team needs to test the full conversation cycle without real WhatsApp/Instagram/Telegram credentials. The mock channel:

1. **Auto-provisions** mock WHATSAPP, INSTAGRAM, TELEGRAM channels for the workspace.
2. **Simulates an inbound client message** that goes through the exact same production pipeline:
   - Creates or finds the `Lead` and `Conversation`
   - Persists the `USER` message
   - Emits `message.new` & `conversation.updated` via **Socket.IO** (not HTTP response — stays async like production)
   - Runs `OrchestratorService` (RAG → Slot check → Gemini → Mock outbound dispatch)
   - Persists the `BOT` response and broadcasts via Socket.IO
3. **Never calls real external APIs** (Meta/Telegram). Outbound sends on mock channels return a fake `externalMessageId`.
4. **Routing:** The endpoint uses the authenticated user's JWT (`workspaceId`) to route the message to the correct business's knowledge base, calendar, and inbox — identical to how production channels resolve their business via `phone_number_id`.

---

## 2. Architecture & Data Flow

```
Dev Simulator UI
  POST /dev-messaging/simulate-inbound
     + JWT (workspaceId = active business)
       │
       ▼
DevMessagingController
  • reads workspaceId from JWT
  • looks up workspace's mock channel (externalAccountId starts with 'mock_')
  • calls OrchestratorService.handleInboundMessage(...)
  • returns 200 immediately with conversationId and leadId
       │
       ▼ (async, runs in background)
OrchestratorService
  1. findOrCreate Lead (phone = senderId)
  2. findOrCreate Conversation
  3. persist Message (role: USER)
  4. Socket.IO: emit message.new (USER message)
  5. If MANAGER_INTERCEPTED → skip AI, start LiveOverflow timer
  6. If BOT_ACTIVE:
     a. RAG search on workspace knowledge base
     b. Slot validation + available times
     c. Gemini 2.0 Flash generates response
     d. Mock adapter.sendTextMessage → returns { externalMessageId: "mock_msg_..." }
     e. persist Message (role: BOT)
     f. Socket.IO: emit message.new (BOT response)
       │
       ▼
Manager Dashboard Inbox & Simulator UI update in real-time via Socket.IO or polling
```

---

## 3. How Mock Channels Block External API Calls

Metadata field `isMock: true` is stored on provisioned mock channels. All three adapters check at the top of `sendTextMessage`:

```typescript
if (credentials?.isMock || String(recipientId).startsWith('mock_')) {
  this.logger.log(`[DEV MOCK] Outbound ${this.channelType} → ${recipientId}: "${text}"`);
  return { externalMessageId: `mock_msg_${Date.now()}` };
}
```

This means:
- Manager's outbound messages (`POST /conversations/:id/messages`) work with zero config
- AI bot responses are dispatched and stored without any real network call
- The full Socket.IO real-time flow is exercised identically to production

---

## 4. Endpoints

All routes: prefix `/dev-messaging`, require JWT, blocked in production by `DevOnlyGuard`.

---

### 4.1 `POST /dev-messaging/provision`
> Auto-creates mock WHATSAPP, INSTAGRAM, TELEGRAM channels for the workspace.

**Request:** *(empty body)*

**Response `201`:**
```json
{
  "code": "dev_messaging.channels_provisioned",
  "message": "Dev mock channels provisioned and connected.",
  "channels": [
    { "id": "uuid", "type": "WHATSAPP",  "status": "CONNECTED", "externalAccountId": "mock_wa_phone_id" },
    { "id": "uuid", "type": "INSTAGRAM", "status": "CONNECTED", "externalAccountId": "mock_ig_account_id" },
    { "id": "uuid", "type": "TELEGRAM",  "status": "CONNECTED", "externalAccountId": "mock_tg_bot_id" }
  ]
}
```

---

### 4.2 `POST /dev-messaging/simulate-inbound`
> Simulates a client message from the dev chat UI.

**Request Body:**
```json
{
  "channelType": "WHATSAPP",
  "senderId": "+77019998877",
  "senderName": "Айдар Сериков (Тест)",
  "text": "Здравствуйте, хочу записаться на завтра в 14:00"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `channelType` | `WHATSAPP \| INSTAGRAM \| TELEGRAM` | Yes | Which mock channel to use |
| `senderId` | `string` | No | Defaults to `"+77000000001"` |
| `senderName` | `string` | No | Defaults to `"Тестовый Клиент"` |
| `text` | `string` | Yes | Message content |

**Response `200`:**
```json
{
  "code": "dev_messaging.inbound_simulated",
  "message": "Message dispatched. AI response will arrive via Socket.IO.",
  "conversationId": "uuid",
  "leadId": "uuid"
}
```
> AI response arrives via **Socket.IO** `message.new` event (async, just like production webhooks) and is persisted to DB.

---

### 4.3 `GET /dev-messaging/conversations/:id/messages`
> Retrieves message history for a conversation to inspect AI bot replies directly in the dev UI / polling fallback.

**Query Parameters:**
| Param | Type | Required | Default | Notes |
|---|---|---|---|---|
| `page` | `number` | No | `1` | Pagination page |
| `limit` | `number` | No | `50` | Number of messages |

**Response `200`:**
```json
{
  "conversationId": "34c38d22-1d54-4a48-8df0-67cbe5c0d5cf",
  "status": "BOT_ACTIVE",
  "channelType": "WHATSAPP",
  "lead": {
    "id": "e0b9616e-b3f5-4cf5-9923-d8ea3d6fefbb",
    "name": "Айдар Сериков (Тест)",
    "phone": "+77019998877",
    "status": "NEW"
  },
  "messages": [
    {
      "id": "msg-1-uuid",
      "conversationId": "34c38d22-1d54-4a48-8df0-67cbe5c0d5cf",
      "role": "USER",
      "content": "Здравствуйте, хочу записаться на завтра в 14:00",
      "createdAt": "2026-09-12T01:40:00.000Z"
    },
    {
      "id": "msg-2-uuid",
      "conversationId": "34c38d22-1d54-4a48-8df0-67cbe5c0d5cf",
      "role": "BOT",
      "content": "Здравствуйте! Завтра в 14:00 есть свободное окно. Подскажите, на какую услугу вас записать?",
      "createdAt": "2026-09-12T01:40:02.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 50
}
```

---

### 4.4 `GET /dev-messaging/conversation-by-sender`
> Finds active conversation and recent messages for a specific `channelType` and `senderId`.

**Query Parameters:**
| Param | Type | Required | Default | Notes |
|---|---|---|---|---|
| `channelType` | `WHATSAPP \| INSTAGRAM \| TELEGRAM` | Yes | - | Channel type |
| `senderId` | `string` | Yes | - | Client handle/phone |
| `page` | `number` | No | `1` | Pagination page |
| `limit` | `number` | No | `50` | Number of messages |

**Response `200`:**
```json
{
  "conversationId": "34c38d22-1d54-4a48-8df0-67cbe5c0d5cf",
  "status": "BOT_ACTIVE",
  "channelType": "WHATSAPP",
  "lead": {
    "id": "e0b9616e-b3f5-4cf5-9923-d8ea3d6fefbb",
    "name": "Айдар Сериков (Тест)",
    "phone": "+77019998877",
    "status": "NEW"
  },
  "messages": [ ... ],
  "total": 2,
  "page": 1,
  "limit": 50
}
```

---

### 4.5 `POST /dev-messaging/reset-conversation/:id`
> Resets a conversation to `BOT_ACTIVE` for re-testing.

**Response `200`:**
```json
{
  "code": "dev_messaging.conversation_reset",
  "message": "Conversation reset to BOT_ACTIVE."
}
```

---

## 5. Security & Disable Mechanism

- **`DevOnlyGuard`** checks `ENABLE_DEV_MESSAGING !== 'false'` AND `NODE_ENV !== 'production'`
- If either condition fails → `403 Forbidden` with `code: 'dev_messaging.disabled'`
- The entire module can be removed from `app.module.ts` for production with a single line

---

## 6. Implementation Checklist

- [x] Create `DevOnlyGuard` (`src/common/guards/dev-only.guard.ts`)
- [x] Add `ENABLE_DEV_MESSAGING` to `env.config.ts` (optional string, defaults enabled in dev)
- [x] Update all 3 messaging adapters to check `credentials?.isMock` and short-circuit outbound calls
- [x] Create `src/modules/dev-messaging/dto/simulate-inbound.dto.ts`
- [x] Create `src/modules/dev-messaging/dto/get-dev-messages.dto.ts`
- [x] Create `src/modules/dev-messaging/dto/get-conversation-by-sender.dto.ts`
- [x] Create `src/modules/dev-messaging/dev-messaging.service.ts`
- [x] Create `src/modules/dev-messaging/dev-messaging.controller.ts`
- [x] Create `src/modules/dev-messaging/dev-messaging.module.ts`
- [x] Register `DevMessagingModule` in `app.module.ts`
- [x] Add translation keys to `translation_keys_new.json`
- [x] `npm run build` passes ✓

---

## 7. Additions & Bugfixes Applied

### 7.1 Reply Retrieving Endpoints Added
- **`GET /dev-messaging/conversations/:id/messages`**: Retrieves full message history (USER, BOT, MANAGER) for a specific conversation ID. Enables mock simulator UI to poll for AI responses or inspect the full chat stream.
- **`GET /dev-messaging/conversation-by-sender`**: Allows querying the current active conversation by `channelType` and `senderId` without needing to remember or supply a conversation ID upfront.

### 7.2 Lead Deduplication Across All Channels (Fix for New Channel on Every Message)
- **Problem:** In `orchestrator.service.ts`, `phone` was passed to `leadsRepository.findOrCreate()` only when `channelType === ChannelType.WHATSAPP` (`phone: channelType === ChannelType.WHATSAPP ? senderId : undefined`). For `INSTAGRAM` and `TELEGRAM`, `phone` was `undefined`, causing `findOrCreate` to never find the existing lead and creating a new `Lead` row and subsequent new `Conversation` on every message.
- **Fix:** Updated `orchestrator.service.ts` to pass `phone: senderId` for all channels. Now consecutive messages from the same sender ID map to the same lead and existing conversation across all channel types.

### 7.3 Synchronous Lead & Conversation Resolution in `simulateInbound`
- **Problem:** `simulateInbound` returned `conversationId: null` on the first message because the asynchronous `setImmediate` task had not completed lead creation before `simulateInbound` returned.
- **Fix:** `simulateInbound` resolves/creates the lead and conversation synchronously before firing the background AI processing pipeline, guaranteeing valid `conversationId` and `leadId` are returned in the response.
