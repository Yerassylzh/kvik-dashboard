# 069 — WhatsApp Dialogue & Typing Improvements Changes Plan

> **Document Type:** Technical Implementation & Changes Plan  
> **Target Audience:** Backend Engineers, Frontend Engineers, AI/Prompt Engineers  
> **Status:** 🚀 Approved for Implementation  
> **Target Modules:** `src/modules/ai-engine/`, `src/modules/channels/`, `src/modules/conversations/`, `src/modules/webhooks/`  
> **Related Docs:** `064_AI_MESSAGE_NATURAL_DELAYS.md`, `063_AI_TAKEOVER_EDGE_CASES_PLAN.md`, `045_AI_ENGINE_PROMPT_AND_HISTORY_IMPL_PLAN.md`

---

## 1. High-Level Summary of Issues & Tech Changes

| Area | Current Issue | Solution & High-Level Tech Change |
| :--- | :--- | :--- |
| **Phone & Slot Amnesia** | Bot books client with real WhatsApp number, but later forgets the booking, offers the same slot again, and re-asks for the phone number. | Inject lead's **active confirmed bookings** directly into CRM memory for Gemini. Add prompt rules to forbid re-offering confirmed slots and auto-use WhatsApp sender phone without asking. |
| **Blue Checkmarks (Read Receipts)** | User messages in WhatsApp stay grey checkmarks; bot never marks them as read. | Send `status: "read"` via Meta Cloud API when message processing begins, turning ticks blue. |
| **Typing Animation & Interruption** | No typing indicator shown on WhatsApp; bot responds instantaneously or without presence. | Trigger native WhatsApp `typing_indicator: { type: "text" }`. If user sends a new message *during* AI typing/generation, immediately cancel the in-flight generation, stop typing, and restart the turn with full updated history. |
| **Webhook Logging Noise** | Verbose ASCII banners and raw payload dumps in logs. | Cleaned up to single-line structured INFO logs. |

---

## 2. Platform Typing Indicator & Read Status Reality

### Channel Capabilities Matrix

| Channel | Outbound Typing Indicator | Blue Checkmark / Mark-as-Read API | Inbound Typing Webhook from User |
| :--- | :---: | :---: | :---: |
| **WhatsApp (Cloud API)** | ✅ **YES** (`typing_indicator: { type: "text" }`) | ✅ **YES** (`status: "read"`, `message_id`) | ❌ **NO** (Meta privacy rule) |
| **Instagram (Graph API)** | ✅ **YES** (`sender_action: "typing_on"`) | ✅ **YES** (`sender_action: "mark_seen"`) | ❌ **NO** (Meta privacy rule) |
| **Telegram (Bot API)** | ✅ **YES** (`sendChatAction: "typing"`) | ℹ️ N/A (Telegram auto-reads on bot interaction) | ❌ **NO** (Telegram protocol rule) |

### How WhatsApp Turns Blue (Read Receipts)
WhatsApp messages stay grey until the business server explicitly calls:
```http
POST /v26.0/{PHONE_NUMBER_ID}/messages
{
  "messaging_product": "whatsapp",
  "status": "read",
  "message_id": "<INCOMING_WAMID>",
  "typing_indicator": {
    "type": "text"
  }
}
```
Executing this single request both **marks the customer's message as read (blue checkmarks)** and **displays the typing bubble** in their chat.

---

## 3. Interruption Handling During AI "Typing"

When the bot is in the middle of typing/generation and the user sends another message:

```
[t = 0.0s] User: "Запишите на 9:00"
[t = 3.5s] Debounce fires -> Bot marks message as READ (Blue checkmarks) + starts TYPING animation
[t = 4.5s] [AI is typing...] User sends: "Ой, лучше на 11:00!"
           │
           ├── 1. Invalidation: Active generation is aborted via AbortController.
           ├── 2. WhatsApp Typing Animation: Automatically resets upon new user message.
           ├── 3. Database Hygiene: Discarded response is NEVER saved to PostgreSQL.
           ├── 4. Fresh Turn: A new debounce cycle starts (3.5s).
           └── 5. At t = 8.0s: Bot marks new message as read, types, and sends confirmed booking for 11:00.
```

---

## 4. Endpoints & Code Changes

### 1. Webhook Pipeline (`src/modules/webhooks/`)
- `POST /webhooks/meta`
  - Removed multi-line ASCII logging noise.
  - When routing incoming messages, triggers channel adapter to mark message as read and show typing indicator.

### 2. Channels Module (`src/modules/channels/`)
- `WhatsAppCloudApiClient` & `WhatsAppMessagingAdapter`
  - Add method `sendReadReceiptAndTyping(phoneNumberId, messageId)` calling Meta Cloud API `status: "read"` + `typing_indicator: { type: "text" }`.
- `InstagramGraphApiClient` & `InstagramMessagingAdapter`
  - Add `sendTypingIndicator(recipientId)` calling `sender_action: "typing_on"`.
- `TelegramApiClient` & `TelegramMessagingAdapter`
  - Add `sendChatAction(chatId, "typing")` calling Telegram Bot API `POST /sendChatAction` with `{ chat_id: senderId, action: "typing" }`.
- `OutboundChannelDispatcherService`
  - Add unified `dispatchTypingIndicator(channelType, credentials, recipientId, messageId, channelMetadata)` to trigger channel-specific typing indicators in a fire-and-forget, non-blocking manner.

### 3. AI Session Manager & Prompt (`src/modules/ai-engine/`)
- `ChatSessionManagerService.prepareSessionContext`
  - Fetch active bookings from `BookingsRepository.findActiveByLead(workspaceId, lead.id)` and inject into `clientProfile.activeBookings`.
- `deal-closing-prompt.builder.ts`
  - Display active bookings under `ДАННЫЕ О КЛИЕНТЕ`.
  - Add rule: *If client has an active booking for the requested service/time, do not propose booking again or re-ask for phone number; confirm details and answer questions.*
  - Add rule: *If channel is WhatsApp or phone exists in profile, use it directly for `create_booking` without asking the client.*
- `agent-tools.declarations.ts`
  - Update `create_booking.clientPhone` description to clarify that CRM/sender phone is used directly.

### 4. Inbound Lead Synchronization (`src/modules/ai-engine/services/orchestrator-inbound.service.ts`)
- `resolveConversationAndLead`
  - Backfill `lead.phone = senderId` on existing WhatsApp conversations if `lead.phone` was null.

---

## 5. Guide for Frontend Developers

Backend WebSocket events and API responses will provide live indicators to keep the dashboard UI in sync with WhatsApp dialogue events.

### 1. Real-Time WebSocket Events (`ConversationsGateway`)

| Event Name | Payload | Frontend Action |
| :--- | :--- | :--- |
| `conversation:typing` | `{ conversationId: string, isTyping: boolean, role: "bot" \| "user" }` | Show/hide the animated "AI is typing..." indicator inside the chat thread view. |
| `message:new` | `{ conversationId: string, message: MessageDto }` | Append new message to active chat. When a user message arrives, immediately render it; when bot message arrives, remove typing bubble and render bot reply. |
| `lead:stage_changed` | `{ leadId: string, newStatus: "APPOINTMENT_SET", metadata: { bookingId, startTime, serviceName } }` | Update the lead badge on the CRM sidebar / Kanban column from `NEW`/`IN_CONVERSATION` to `APPOINTMENT_SET` in real time. |
| `conversation:updated` | `{ id: string, status: string, lastMessageAt: string, unreadCount: number }` | Update conversation list sorting and unread badges. |

### 2. Active Bookings Display in CRM Panel
- In the right-hand Lead Profile sidebar (`/conversations/:id` details view):
  - The `activeBookings` list will now be populated under `lead.bookings`.
  - The frontend can render an **"Upcoming Appointments"** card showing date, service, and assigned specialist so managers instantly see what the bot booked.

### 3. Manager Takeover Indication
- When a human agent types a message and hits send (`POST /conversations/:id/messages`):
  - Backend sets conversation status to `MANAGER_INTERCEPTED` and aborts any active bot typing indicator.
  - Frontend UI reflects `BOT_PAUSED` / `MANAGER_ACTIVE` banner.

---

## 6. Implementation Checklist

- [x] **Webhook Logging Cleanup:** Cleaned up `webhooks.controller.ts`.
- [x] **WhatsApp Mark-as-Read & Typing Indicator:** Implement `sendReadReceiptAndTyping` in WhatsApp adapter.
- [x] **Telegram & Instagram Typing Indicator:** Implement `sendTypingIndicator` in Telegram and Instagram adapters.
- [x] **Orchestrator Inbound Integration:** Dispatch typing indicator upon debounce timer trigger and abort on interruption.
- [x] **Active Bookings CRM Hydration:** Inject lead's active bookings into `clientProfile` in `ChatSessionManagerService`.
- [x] **Deal Closing Prompt Builder:** Add WhatsApp phone auto-use and active booking retention directives.
- [x] **Tool Declaration Refinement:** Update `create_booking` clientPhone schema.
- [x] **Frontend WebSocket Typing Broadcast:** Emit `conversation:typing` event in `ConversationsGateway`.
- [x] **Lead Phone WhatsApp Backfill:** Update `resolveConversationAndLead` to backfill `lead.phone` from `senderId` if missing.
- [x] **Tests:** Unit test debounce interruption, mark-as-read dispatch, and prompt context hydration.