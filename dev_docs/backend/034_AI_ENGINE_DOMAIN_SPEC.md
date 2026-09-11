# 034 — AI Orchestrator & Live Overflow Domain Spec

> **Module:** `src/modules/ai-engine/`  
> **Status:** Implementation Pending — Phase 4  
> **Depends On:** Conversations, Knowledge Base (RAG), Channels (adapters), Bookings (slot validation)  

---

## 1. Purpose

The AI Engine is the core revenue feature. When a client sends a message to any connected channel, the AI Orchestrator:
1. Retrieves the conversation history from the DB
2. Runs a RAG search on the workspace's knowledge base for relevant context
3. Passes history + context + niche system prompt to Gemini 2.0 Flash
4. Validates any slot/booking intent in real time
5. Sends the AI response back via the correct channel adapter
6. Persists the response as a `BOT` role message

**Live Overflow** — if the manager does not respond within `N` seconds when `MANAGER_INTERCEPTED`, the AI resumes automatically.

**Follow-up Engine** — BullMQ jobs are scheduled to send automated re-engagement messages at 24h and 72h for leads in `NEW` or `QUALIFIED` status with no recent activity.

---

## 2. Core Flow

```
Inbound Webhook (WhatsApp/Instagram/Telegram)
         │
         ▼
WebhooksController → validates signature → dispatches to ChannelAdapter
         │
         ▼
ConversationsService → finds or creates Conversation + Lead → persists USER message
         │
         ▼
AI Engine Orchestrator
    ├── Checks: conversation.status === BOT_ACTIVE?
    │   └── NO (MANAGER_INTERCEPTED) → skip AI, start Live Overflow timer
    │   └── YES → continue
    ├── RAG: KnowledgeBaseService.search(workspaceId, userMessage) → topK chunks
    ├── Intent detection: booking intent? → SlotValidationService.validateSlot()
    ├── NichePolicyService.buildSystemPrompt(nicheProfile, businessContext)
    ├── GeminiService.generateResponse(systemPrompt, history, ragContext, userMessage)
    └── ChannelAdapter.sendMessage(channelId, leadExternalId, aiResponse)
         │
         ▼
ConversationsService → persists BOT message, updates lastMessageAt
         │
         ▼
Socket.IO Gateway → emits message.new to dashboard
```

---

## 3. API Endpoints

The AI Engine is mostly **event-driven** (triggered by webhooks), not REST. The following endpoints are exposed for dashboard configuration and testing.

---

### `GET /ai-engine/config`
> Returns the current AI configuration for the workspace (system prompt preview, follow-up settings).

**Response `200`:**
```json
{
  "nicheProfile": "BEAUTY",
  "systemPromptPreview": "Ты — вежливый AI-ассистент салона красоты...",
  "followUpEnabled": true,
  "followUp24hEnabled": true,
  "followUp72hEnabled": true,
  "liveOverflowTimeoutSeconds": 30
}
```

---

### `PATCH /ai-engine/config`
> Update AI configuration for the workspace.

**Request Body** (all optional):
```json
{
  "followUp24hEnabled": false,
  "followUp72hEnabled": true,
  "liveOverflowTimeoutSeconds": 60,
  "customInstructions": "Всегда предлагай скидку 10% новым клиентам."
}
```

**Response `200`:** `{ "code": "ai_engine.config_updated", "message": "AI config updated." }`

---

### `POST /ai-engine/test`
> Send a test message through the AI pipeline without dispatching to a real channel. Used in the "Test Dialogue" dashboard panel.

**Request Body:**
```json
{
  "message": "Здравствуйте, хочу записаться на стрижку в пятницу"
}
```

**Response `200`:**
```json
{
  "response": "Добрый день! Рады вас принять. В пятницу у нас свободны слоты: 10:00, 13:00, 16:00. Какой вам удобен?",
  "ragChunksUsed": 3,
  "latencyMs": 1240
}
```

---

## 4. Internal Services (No Public Endpoints)

| Service | Responsibility |
|---|---|
| `OrchestratorService` | Main event handler — wires together all sub-services |
| `NichePolicyService` | Builds the system prompt per `nicheProfile` + `businessContext` |
| `SlotValidationService` | Detects booking intent and validates slot availability in real time |
| `LiveOverflowService` | Starts/clears BullMQ timers when manager intercepts/resumes |
| `FollowUpService` | Schedules and dispatches 24h/72h re-engagement messages |

---

## 5. Follow-Up Engine Logic

```
Trigger: Lead.status = NEW or QUALIFIED AND no message in last 23h
         → schedule BullMQ job (delay: 24h from last activity)

Job execution:
  1. Re-check: has lead messaged since scheduled?  → abort if yes
  2. Load conversation + channel
  3. Generate follow-up message via GeminiService (niche-specific warm-up template)
  4. Send via ChannelAdapter
  5. Persist as BOT message
  6. Schedule 72h job if 24h job was first

72h job follows the same pattern.
```

---

## 6. Files to Create

```
src/modules/ai-engine/
├── ai-engine.module.ts
├── orchestrator.service.ts
├── niche-policy.service.ts
├── slot-validation.service.ts
├── live-overflow.service.ts
├── follow-up.service.ts
└── dto/
    ├── ai-config.dto.ts
    └── test-message.dto.ts

src/modules/ai-engine/
└── ai-engine.controller.ts       # /ai-engine/config, /ai-engine/test
```

---

## 7. Implementation Checklist

- [ ] `OrchestratorService` — wired to inbound webhook pipeline in `WebhooksController`
- [ ] `NichePolicyService` — one system prompt template per `NicheProfile` enum value, injecting `businessContext` JSON
- [ ] RAG integration — call `KnowledgeBaseService.semanticSearch(workspaceId, query, topK=5)`
- [ ] `SlotValidationService` — detect booking intent keywords, call `SlotCalculatorService` with parsed date/time
- [ ] `LiveOverflowService` — on `MANAGER_INTERCEPTED`: start BullMQ delayed job → on manager reply: clear job → on timeout: set status back to `BOT_ACTIVE` and resume
- [ ] `FollowUpService` — schedule jobs on `AI_JOBS_QUEUE`, check last activity before dispatching
- [ ] `POST /ai-engine/test` — run full pipeline except channel dispatch, return response + latency
- [ ] `PATCH /ai-engine/config` — persist config in `workspace.metadata` JSON field (no separate table needed)
- [ ] All error codes registered in `translation_keys_new.json`
- [ ] `npm run build` passes cleanly
