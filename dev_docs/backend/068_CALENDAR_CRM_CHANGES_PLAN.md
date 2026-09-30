# 068 — Backend Implementation Plan: Calendar, CRM, AI Silence & Frontend Integration Spec

> **Document Type:** Technical Implementation Plan & API Specification  
> **Status:** 🚀 Ready for Implementation  
> **Target Modules:** `src/modules/ai-engine/`, `src/modules/onboarding/`, `src/modules/leads/`, `src/modules/bookings/`, `src/modules/conversations/`  
> **Related Docs:** `067_SYSTEM_CHANGES_SPEC.md`, `064_AI_MESSAGE_NATURAL_DELAYS.md`, `046_CRM_SPEC.md`

---

## 1. Overview & Architectural Goals

This document specifies the exact backend implementation plan to resolve conversational logic flaws, streamline onboarding and CRM pipelines, ensure rock-solid AI silence safety (`SILENT_NO_OP`), and provide clear contracts for frontend developers.

### Key Goals:
1. **Safe AI Silence & No-Reply Guard:** Ensure that when AI chooses silence (`[NO_REPLY]`), **NO** message is pushed to external channels, **NO** empty `BOT` record is created in the database, and **NO** false WebSocket message event is broadcast to the frontend.
2. **Exploration vs Booking Mode in Prompts:** Eliminate the "broken record" loop where the bot aggressively tacks on *"Могу предложить 09:00 или 14:00"* to every informational question.
3. **Onboarding & CRM Funnel Simplification:** Eliminate the redundant qualification step and intermediate `QUALIFIED` status.
4. **Identity Resolution & Contact History:** Support anonymous initial chats (Instagram/Telegram) with lazy phone linking and contact merging.
5. **Frontend API & UI Migration Guide:** Clear specifications for updated endpoints, Kanban stages, stepper changes, and real-time WebSocket contracts.

---

## 2. Phase 1: Safe AI Silence & Anti-Spam Architecture (`SILENT_NO_OP`)

### 2.1. The Critical Safety Requirement
When the AI or backend decides to **NOT** reply to an incoming user message (e.g. trailing "Ok", "Спасибо", reaction emoji, autoresponder):
- ✅ The incoming `USER` message is saved in PostgreSQL and broadcast via WebSocket `message.new` so human managers see the user's message live in the Unified Inbox.
- 🚫 **External Dispatch Blocked:** `outboundDispatcher.dispatchTextMessage()` MUST NOT be called.
- 🚫 **No Phantom DB Record:** Do NOT insert a `Message` with `role: BOT` and empty or dummy content.
- 🚫 **No False Frontend Event:** Do NOT emit `message.new` for a non-existent BOT message.
- ✅ **Conversation Updated:** `lastMessageAt` and `lastMessagePreview` are updated to reflect the user's latest text, and `unreadCount` is incremented appropriately.

```
Incoming User Message ("Ок" / "Спасибо" / "👍")
   │
   ├── 1. Save USER message to DB
   ├── 2. Emit WebSocket: message.new (role: USER) ──► Frontend shows user message live
   │
   ├── 3. Silence Check (Tier 1 Fast Regex OR Tier 2 LLM [NO_REPLY])
   │      │
   │      ├─► [REPLY NEEDED] ──► Call Outbound Dispatcher ──► Save BOT msg ──► Emit BOT message.new
   │      │
   │      └─► [SILENCE / NO_REPLY]
   │             │
   │             ├── DO NOT call Outbound Dispatcher
   │             ├── DO NOT save BOT message to DB
   │             ├── DO NOT emit BOT message.new over WebSocket
   │             └── Log: "[AI Engine] Response skipped safely (SILENT_NO_OP)" ──► Clean Exit ✅
```

### 2.2. Two-Tier Silence Detection Implementation

#### Tier 1: Fast Deterministic Pre-LLM Filter
Implemented in `OrchestratorInboundService` before initiating Gemini API loops:
- **Condition:** Conversation has an active confirmed booking OR last bot message was sent within 30 minutes, AND incoming text matches short closure regex:
  ```typescript
  const CLOSURE_REGEX = /^[\s\p{P}]*(ок|окей|хорошо|понял|поняла|понятно|договорились|спасибо|рахмет|спс|ясно|отлично|супер|👍|👌|🙏|❤️|🤝)+[\s\p{P}]*$/iu;
  ```
- **Action:** If matched, the turn immediately logs `[SILENT_NO_OP: Deterministic Pre-Filter]` and skips LLM generation entirely, saving API costs and execution latency.

#### Tier 2: LLM Semantic `[NO_REPLY]` Guard
In `deal-closing-prompt.builder.ts` and `OrchestratorInboundService`:
- The system prompt instructs Gemini:
  > *"Если вопрос клиента уже решен, запись оформлена, и клиент присылает короткую вежливость или закрывающую реплику, на которую не требуется содержательного ответа, выведи строго токен `[NO_REPLY]`."*
- In `OrchestratorInboundService`:
  ```typescript
  if (!aiResponse || aiResponse.trim() === '' || aiResponse.includes('[NO_REPLY]')) {
    this.logger.log(`[AI Engine] Safe silence triggered for conversation ${conv.id}. Suppressing outbound message and bot DB record.`);
    return; // Clean exit without dispatching or saving BOT message
  }
  ```

---

## 3. Phase 2: System Prompt Refactoring & Anti-Repetition

### 3.1. Fixing the "Broken Record" Repetitive Slot Pitching
Modify `src/modules/ai-engine/prompt-builders/deal-closing-prompt.builder.ts`:

#### 1. Exploration vs Booking Separation
- **Informational / Exploration Mode:** When the user asks about services, doctor profiles, machine specifications (*"Hitachi MRI"*, *"УЗИ брюшной полости"*), prices, or general clinic info:
  - Answer the question accurately and concisely in 1–3 sentences.
  - Ask a relevant contextual follow-up question (*"Вас интересует МРТ какого отдела?"* or *"Хотите, расскажу про подготовку?"*).
  - **STRICT PROHIBITION:** Do NOT propose specific calendar slot times (e.g. *"Могу предложить 09:00 или 14:00"*) while the client is merely asking informational questions.
- **Booking Mode:** Only call `get_available_slots` and offer 2 specific time options when:
  - The client expresses booking intent (*"Хочу записаться"*, *"Когда можно прийти?"*, *"Запишите меня к терапевту"*).
  - The client specifies a desired date/day (*"Есть время на завтра?"*).

#### 2. Duplicate Message & `/start` Guard
- If the incoming message is a duplicate `/start` or identical repeated command within 10 seconds, do not re-send the full initial welcome banner. Reply with a short helpful inquiry (*"Чем могу вам помочь?"*) or ignore duplicates in debounce.

---

## 4. Phase 3: Onboarding & CRM Funnel Simplification

### 4.1. Onboarding Wizard Refactoring
- **Deprecate Step 4 (Qualification Rules):** Remove `qualificationRulesSet` as a prerequisite for workspace activation.
- **New 4-Step Onboarding State Machine (`OnboardingStateService`):**
  1. `SELECT_NICHE` (Step 0)
  2. `BUSINESS_PROFILE` (Step 1)
  3. `DATA_SOURCE` & `DATA_PREVIEW` (Step 2 & 3 - Knowledge Base)
  4. `CONNECT_CHANNEL` (Step 4 - WhatsApp / Telegram / Instagram)
  5. `TELEGRAM_ALERTS` (Step 5 - Manager Alert Connection)
  6. `DONE` (Step 6 - Active Workspace)

### 4.2. CRM Funnel & Lead Status Simplification
- **Update Primary Funnel Stages:**
  $$\mathbf{NEW} \longrightarrow \mathbf{APPOINTMENT\_SET} \longrightarrow \mathbf{DEAL\_WON} \quad (\text{or } \mathbf{DEAL\_LOST})$$
- Deprecate `QUALIFIED` stage. Inbound contacts remain in `NEW` (In Dialogue) until `create_booking` moves them directly to `APPOINTMENT_SET`.
- `POST /leads/:id/qualify` will return a deprecation-safe `200 OK` without breaking legacy clients.

---

## 5. Phase 4: Identity Resolution, Contact Lifetime History & Returning Clients

### 5.1. Contact (Client) vs Deal (Booking) Model
In `src/modules/leads/` and `src/modules/bookings/`:

1. **Client / Contact Identity (`Contact` / `ClientProfile`):**
   - Unique per verified phone number within the workspace.
   - Retains cumulative metrics: `totalBookingsCount`, `totalSpent`, `noShowCount`, `preferredSpecialistId`, `clientNotes`.
   - Injected into AI Prompt:
     ```
     ДАННЫЕ О КЛИЕНТЕ:
     - Имя: Асель | Телефон: +77015551234 | История: 3 визита | Предпочитаемый врач: Др. Ахметов
     ```
2. **Lazy Linking & Smart Merge:**
   - Inbound Instagram/Telegram messages create a temporary lead record with `externalSenderId`.
   - When the user shares their phone number during booking, `LeadsRepository.resolveOrMergeByPhone()` checks if a client with this phone number exists.
   - If found, it merges channel IDs into the existing profile and links the conversation, preserving full history.

---

## 6. Phase 5: Specialist Management & Graceful Fallbacks

### 6.1. Handling Missing Specialists
In `src/modules/ai-engine/tools/handlers/staff-tool.handler.ts` and `deal-closing-prompt.builder.ts`:
- When a client asks for a doctor's name (*"Как зовут терапевта?"*) and `get_staff_members` returns no specialists:
- **Instruction:** AI must state: *"У нас ведут прием врачи-терапевты. Конкретные данные дежурного доктора я могу уточнить у администратора. Подобрать вам время для визита?"*
- **Strict Rule:** Never invent fictional names or repeat calendar slots.

---

## 7. Frontend Integration & API Changes Specification

This section details all modifications, new schemas, and WebSocket behavior for the frontend team.

### 7.1. Onboarding Stepper Changes

#### `GET /onboarding/state`
**Updated Response Schema:**
```json
{
  "code": "onboarding.state_retrieved",
  "data": {
    "step": "CONNECT_CHANNEL",
    "stepIndex": 4,
    "totalSteps": 6,
    "completed": false,
    "parsingStatus": "DONE",
    "parsedCount": 12,
    "totalCount": 12
  }
}
```

*Step Index Mapping for Frontend Stepper:*
- `0`: `SELECT_NICHE`
- `1`: `BUSINESS_PROFILE`
- `2`: `DATA_SOURCE`
- `3`: `DATA_PREVIEW`
- `4`: `CONNECT_CHANNEL` *(Shifted from 5)*
- `5`: `TELEGRAM_ALERTS` *(Shifted from 6)*
- `6`: `DONE` *(Workspace Active)*

> **Note for Frontend:** Remove the "Lead Qualification Rules" tab/step from the onboarding wizard UI.

---

### 7.2. CRM Kanban Board & Lead Endpoints

#### `GET /leads/counts`
**Updated Response Schema (4 Stages):**
```json
{
  "NEW": 14,
  "APPOINTMENT_SET": 8,
  "DEAL_WON": 45,
  "DEAL_LOST": 3
}
```

*Kanban Columns to Render:*
1. **Входящие / В диалоге (`NEW`)** — Yellow/Blue badge
2. **Запись создана (`APPOINTMENT_SET`)** — Purple badge
3. **Визит завершен (`DEAL_WON`)** — Green badge
4. **Отменен / Отказ (`DEAL_LOST`)** — Red/Gray badge

---

#### `GET /leads/:id`
**Full Lead & Client Profile Schema:**
```json
{
  "id": "lead_uuid",
  "name": "Асель",
  "phone": "+77015551234",
  "email": "asel@example.com",
  "status": "APPOINTMENT_SET",
  "sourceChannel": "WHATSAPP",
  "score": 85,
  "noShowCount": 0,
  "totalBookingsCount": 3,
  "assignedStaff": {
    "id": "staff_uuid",
    "name": "Др. Ахметов",
    "role": "Терапевт"
  },
  "bookings": [
    {
      "id": "booking_uuid_1",
      "startTime": "2026-10-01T09:00:00.000Z",
      "endTime": "2026-10-01T10:00:00.000Z",
      "serviceName": "Консультация терапевта",
      "status": "CONFIRMED",
      "staffName": "Др. Ахметов"
    },
    {
      "id": "booking_uuid_0",
      "startTime": "2026-08-15T14:00:00.000Z",
      "serviceName": "УЗИ брюшной полости",
      "status": "COMPLETED",
      "staffName": "Др. Сабитов"
    }
  ],
  "notes": [
    {
      "id": "note_uuid",
      "content": "Аллергия на новокаин",
      "authorName": "Администратор",
      "createdAt": "2026-08-15T13:50:00.000Z"
    }
  ]
}
```

---

### 7.3. WebSocket Contracts & Real-Time Chat Behavior

#### WebSocket Gateway: `ConversationsGateway`

1. **User Message Arrives:**
   - Gateway emits `message.new`:
     ```json
     {
       "conversationId": "conv_uuid",
       "message": {
         "id": "msg_uuid_1",
         "role": "USER",
         "content": "Спасибо, понятно!",
         "createdAt": "2026-09-30T10:40:00.000Z"
       }
     }
     ```
   - **Frontend Action:** Immediately appends the user bubble to the active chat and updates the conversation preview in the inbox list.

2. **When AI Generates a Reply:**
   - Gateway emits `message.new` with `role: "BOT"`.
   - **Frontend Action:** Renders the bot response bubble.

3. **When AI Chooses Silence (`SILENT_NO_OP` / No Reply):**
   - **NO `message.new` event is emitted for `BOT`.**
   - **Frontend Action:** Chat remains in its natural state displaying the user's message. No empty bubble, no error toast, and no endless typing indicator.

---

## 8. Implementation Steps & Verification Checklist

| # | Task | Target Files | Verification Method |
|---|---|---|---|
| **1** | Safe Silence Handler (`[NO_REPLY]`) | `src/modules/ai-engine/services/orchestrator-inbound.service.ts` | Unit test: ensure no outbound dispatch & no DB bot message on `[NO_REPLY]` |
| **2** | Fast Pre-LLM Closure Regex | `src/modules/ai-engine/services/orchestrator-inbound.service.ts` | Unit test: incoming "Ок" / "Спасибо" skips LLM loop safely |
| **3** | Prompt Refactoring (Exploration vs Booking) | `src/modules/ai-engine/prompt-builders/deal-closing-prompt.builder.ts` | Test dialogues: Q&A answers without slot pitch; slot pitch only on booking intent |
| **4** | Onboarding Wizard Simplification | `src/modules/onboarding/services/onboarding-state.service.ts` | E2E test: onboarding proceeds from Knowledge directly to Channels (4 steps) |
| **5** | CRM Funnel & Kanban Simplification | `src/modules/leads/leads.service.ts`, `leads.controller.ts` | Verify `/leads/counts` returns 4 stages without `QUALIFIED` |
| **6** | Contact Phone Lazy Linking & Merge | `src/modules/leads/leads.repository.ts` | Unit test: merge Telegram lead with existing phone record |
| **7** | Missing Staff Fallback Prompting | `src/modules/ai-engine/tools/handlers/staff-tool.handler.ts` | Test dialogue: doctor name inquiry with 0 staff returns honest administrative disclaimer |
