# 062 — AI Takeover, Media History & Follow-Up Lifecycle Edge-Cases

> **Document Type:** Architectural & Logical Analysis Blueprint  
> **Target Audience:** Product Managers, AI Engineers, Frontend & Backend Architects  
> **Status:** 📐 Strategic Design & Architecture Recommendation  
> **Related Docs:** `053_VOICE_MSG_PROCESSING_AND_SENDING_MEDIA_PLAN.md`, `061_AI_CONVERSATION_FILES_PROCESSING.md`, `052_HUMAN_ESCALATION_AND_NOTIFICATIONS_PLAN.md`

---

## 1. Executive Summary & Problem Context

In automated conversational sales and customer support, **human escalation (takeover)** is an unavoidable necessity. AI models encounter unsupported media (heavy videos, encrypted archives, blurred images), customers explicitly request human managers, or complex negotiations arise that require human intervention.

This blueprint establishes a **Universal, Zero-Drift Dialogue Architecture** that governs:
1. Continuous sliding-window and rolling summarization across both AI and human manager turns.
2. Zero-token media triage (descriptive metadata badges for unsupported files).
3. Universal voice transcription for both inbound customer and outbound manager audio.
4. Non-colliding follow-up lifecycles with 24-hour inactivity boundaries and channel compliance.
5. Mitigation of critical production vulnerabilities (ghost bookings, rapid-chat summary throttling, manager voice latency, and Meta channel constraints).

---

## 2. Core Architectural Pillars

### 2.1 Continuous Sliding-Window & Rolling Summarization (Universal Window)

#### The Architecture
The sliding-window model ($X$ recent raw messages + 1 compact rolling summary of older history) runs **continuously at all times**, regardless of whether the conversation is currently managed by the AI (`BOT_ACTIVE`) or a human specialist (`MANAGER_INTERCEPTED`).

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                      CONTINUOUS CONVERSATION TIMELINE                             │
│                                                                                   │
│  [Old Messages 1..N-20] ──► Compressed into: Conversation.metadata.summary        │
│                                                                                   │
│  [Active Window: Last 20 Messages]                                                │
│  ├── Msg N-19 (USER): "Здравствуйте, хочу записаться на окрашивание"             │
│  ├── Msg N-18 (BOT): "Добрый день! Какая длина волос?"                            │
│  ├── Msg N-17 (USER): [🎥 Видеозапись клиента: hair_sample.mp4] ──► ESCALATED    │
│  ├── Msg N-16 (MANAGER): 🎤 "Здравствуйте! Посмотрела ваше видео, это шатуш..."   │
│  ├── Msg N-15 (USER): "Супер, сколько это займет по времени?"                     │
│  └── Msg N-14 (MANAGER): "Примерно 3 часа. Записала вас на субботу в 15:00"      │
│                                                                                   │
│  ──► 24h Inactivity ──► Auto-Return to BOT_ACTIVE (Dialogue session marked stale) │
│                                                                                   │
│  └── Msg N (USER, anytime later): "Здравствуйте, а где вы находитесь?"            │
│       ├── AI responds INSTANTLY with 100% full context comprehension!             │
│       └── Normal follow-up scheduling resumes organically for subsequent silence. │
└───────────────────────────────────────────────────────────────────────────────────┘
```

#### Handling Unsupported Files Without Breaking Context
When files arrive that the AI cannot or should not process (heavy videos, corrupted documents, proprietary binaries), the system **never attempts expensive parsing**. Instead, it generates a clean, descriptive text label at write-time:
* `[🎥 Видеозапись клиента: <имя_файла>]` (~3 tokens)
* `[📎 Файл клиента: <имя_файла.ext>]` (~3 tokens)
* `[📄 Документ менеджера: price_list.pdf]` (~4 tokens)

The AI sees that media was exchanged and reads the human manager's textual reply, which resolves the semantic context.

---

### 2.2 Universal Voice Note Transcription (Inbound & Outbound)

* **Inbound (Customer $\rightarrow$ Business):** Transcribed via Deepgram Nova-3 STT on webhook receipt. Stored in `message.metadata.transcription` and `message.content = "🎤 <текст>"`.
* **Outbound (Manager/Owner $\rightarrow$ Customer):** Transcribed via Deepgram Nova-3 STT upon upload/dispatch. Stored in `message.metadata.transcription` and `message.content = "🎤 <текст>"`.

**Why this is mandatory:** If a manager records a 20-second voice note saying *"Я перенесла вашу запись на 16:00 к мастеру Асель"*, transcribing this guarantees that when the conversation returns to AI, the bot will know about the new appointment time and master name.

---

### 2.3 Follow-Up Safety & The 24-Hour Dormancy Boundary

1. **Takeover Isolation:** When `status === MANAGER_INTERCEPTED`, all pending follow-up jobs are immediately dropped. No automated messages are ever sent while a human holds the conversation.
2. **24-Hour Inactivity Auto-Return:** If 24 hours elapse with zero messages from either party:
   - The dialogue session is marked closed/stale.
   - Status automatically resets to `BOT_ACTIVE`.
   - The takeover lock (`takenOverByActorId`) is released.
3. **Resumption:** When the customer messages again at any later point (hours, days, or weeks later), the AI answers autonomously under `BOT_ACTIVE`.
4. **Organic Follow-Up Scheduling:** If the customer goes silent *after this new AI exchange*, standard follow-up sequences (e.g. 2h abandonment nudge) schedule normally across all connected channels.

---

## 3. Critical Production Vulnerabilities & Solutions

---

### ⚠️ Vulnerability 1: The "Unfulfilled Manager Promise" (Ghost Bookings)

#### The Risk
A manager takes over, chats with the client, and types: *"Договорились, записала вас на субботу в 15:00"*, but **the manager forgets to create the actual appointment record in the CRM / calendar**.
Later, the chat resets to `BOT_ACTIVE`. The client messages: *"Подтвердите мою запись на субботу"*.
* If the AI checks the database, it finds **no booking record**.
* **Failure Mode A:** The bot bluntly says *"У вас нет записи"*, contradicting the manager and causing customer outrage.
* **Failure Mode B:** The bot hallucinates *"Да, ваша запись на субботу подтверждена"*, leading to double-booking disasters.

#### Architectural Mitigation
In the AI Orchestrator System Prompt (`NichePolicyService`), add an explicit **Discrepancy Resolution Rule**:
> *"If chat history shows a manager agreed to or promised an appointment, but tool `listBookings` returns no active booking in the database: do NOT contradict the manager and do NOT blindly confirm. Politely inform the client: 'Я вижу вашу договоренность с менеджером на субботу в 15:00. Сейчас перепроверю свободный слот и зафиксирую его в системе' and trigger the booking tool or escalate if the slot is unavailable."*

---

### ⚠️ Vulnerability 2: Rapid-Fire Human Chatting & Summary API Throttling

#### The Risk
During a live negotiation, a human manager and customer exchange 25 short messages in 5 minutes (*"тут?"*, *"да"*, *"скинула фото"*, *"минутку"*, *"ок"*).
If the backend invokes an LLM to regenerate the rolling summary on *every single message*, the system burns unnecessary API costs, adds database write pressure, and hits rate limits.

#### Architectural Mitigation
* **Threshold / Lazy Summarization:**
  - Messages are saved directly as normalized records in PostgreSQL (zero LLM calls during rapid human typing).
  - Rolling summary generation is triggered **only** when the uncompressed message count exceeds the sliding window threshold ($N > 20$), and is debounced asynchronously in a background queue.

---

### ⚠️ Vulnerability 3: Outbound Voice Note Latency

#### The Risk
When a manager records a 30-second voice note in the web dashboard, waiting for Deepgram STT (~600ms) + Channel API dispatch (~800ms) sequentially can cause noticeable UI lag (>1.5s) on the "Send" button.

#### Architectural Mitigation
* **Concurrent STT & Channel Dispatch:**
  - Execute `deepgramService.transcribeAudio(buffer)` and `channelAdapter.sendMediaMessage(buffer)` concurrently via `Promise.all`.
  - Both complete within ~600–800ms total, returning a snappy response to the manager while ensuring the transcript is persisted in the database.

---

### ⚠️ Vulnerability 4: Meta Channel Policy (WhatsApp & Instagram 24h Window)

#### The Channel Rules & Reality
* **WhatsApp Cloud API:**
  - *Within 24 Hours:* Free-form generative text can be sent.
  - *After 24 Hours:* Free-form text is rejected by Meta. Follow-ups must use **pre-approved Meta WhatsApp Message Templates (HSM)**.
* **Instagram Graph API:**
  - *Within 24 Hours:* Free-form generative messages can be sent.
  - *After 24 Hours:* Meta restricts general proactive re-engagement without user-initiated tokens.
* **Telegram Bot API:**
  - No 24-hour messaging window restriction.

#### Current Scope & Action Item
* **Current Execution:** The core scheduling logic remains channel-agnostic and universally scheduled across all conversations under `BOT_ACTIVE`.
* **Action Required (WhatsApp & Instagram Follow-Up Templates):**
  - For live production WhatsApp deployments outside mock mode, standard re-engagement and reminder templates (e.g. `reengagement_followup_v1`) must be formally submitted and approved in the workspace's Meta WhatsApp Business Account (WABA).
  - Instagram follow-ups outside the 24h window will require user-opted recurring notification tokens or waiting for user-initiated messages.

---

## 4. Universal Pipeline & Architectural Contracts

To prevent fragmented `if/else` checks across controllers and services, the system adheres to **3 universal contracts**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. UNIVERSAL WRITE-TIME NORMALIZER (User / Bot / Manager)                   │
│                                                                             │
│  Every message at creation:                                                 │
│  ├── Text: Sanitized & Stored                                               │
│  ├── Audio: Transcribed via Deepgram STT ──► metadata.transcription         │
│  ├── Light Image/PDF: Auto-described ──► metadata.aiDescription             │
│  └── Video / Heavy / Binary: ──► Semantic Badge: "[🎥 Видео: file.mp4]"      │
│                                  (Triggers instant escalation if USER)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. STATE & EXPIRY MACHINE                                                   │
│                                                                             │
│  • BOT_ACTIVE ──(Escalation / Manager Msg)──► MANAGER_INTERCEPTED           │
│  • MANAGER_INTERCEPTED ──(Manual Toggle OR 24h Inactivity)──► BOT_ACTIVE     │
│  • Follow-Ups: Active in BOT_ACTIVE. (Template-compliant on WhatsApp >24h)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. UNIFIED PROMPT BUILDER (ChatSessionManager)                              │
│                                                                             │
│  • Ingests Sliding Window (Last 20 normalized messages) + Rolling Summary.  │
│  • Ingests CRM Client Memory (Name, preferences, booking history).          │
│  • Ingests Discrepancy Policy (Handles unfulfilled manager agreements).     │
│  • ZERO retro-processing, ZERO binary re-transmission, ZERO cold-start lag. │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Summary Matrix: Edge Cases & Resolutions

| Scenario / Edge Case | What Happens Under the Hood | AI / System Behavior |
| :--- | :--- | :--- |
| **Client sends heavy video (>25MB)** | Saved to storage; labeled `[🎥 Видеозапись клиента: name.mp4]`. | Auto-escalates to `MANAGER_INTERCEPTED`; alerts manager via Telegram. Zero LLM video tokens burned. |
| **Manager sends voice note** | Uploads audio; runs Deepgram STT concurrently with channel dispatch. | Transcribed text saved to `metadata.transcription`. AI retains 100% full context. |
| **Manager sends PDF / Video** | Saved to storage; labeled `[📄 Документ: price.pdf]` or `[🎥 Видеозапись]`. | LLM receives lightweight text marker (~3-5 tokens). Context window is never overloaded. |
| **Follow-up was scheduled, then manager stepped in** | Scheduled job wakes up, checks `status === MANAGER_INTERCEPTED`. | Job is immediately dropped. Zero bot nudges sent during human conversation. |
| **Chat inactive for 24 hours** | 24h dormancy boundary reached. | Lock released; status auto-resets to `BOT_ACTIVE`. Dialogue session marked fresh. |
| **Client returns anytime later** | Inbound message opens new turn under `BOT_ACTIVE`. | AI responds instantly using rolling summary + sliding window + CRM memory. Follow-ups resume normally. |
| **Manager promised booking in text but forgot CRM entry** | AI checks `listBookings` tool, detects discrepancy. | AI follows Discrepancy Policy: acknowledges manager agreement and offers to book slot immediately. |
| **Follow-up scheduled outside 24h window** | Scheduler checks channel type and elapsed hours. | Dispatches via template on WhatsApp; executes AI generation inside 24h / on Telegram. |
