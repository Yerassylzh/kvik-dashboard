# 063 — AI Takeover Edge-Cases & Universal Context Implementation Plan

> **Document Type:** Technical Implementation Plan & Engineering Specification  
> **Target Audience:** Backend Engineers, AI/Prompt Engineers, Fullstack Frontend Developers  
> **Status:** 🚀 Ready for Implementation  
> **Target Modules:** `src/modules/conversations/`, `src/modules/ai-engine/`, `src/modules/ai/`  
> **Related Docs:** `062_AI_TAKEOVER_EDGE_CASES_ANALYSIS.md`, `061_AI_CONVERSATION_FILES_PROCESSING.md`, `053_VOICE_MSG_PROCESSING_AND_SENDING_MEDIA_PLAN.md`

---

## 1. Overview & Core Objectives

This specification implements the **Universal Context & Takeover Lifecycle Architecture** defined in `062_AI_TAKEOVER_EDGE_CASES_ANALYSIS.md`. 

### Key Deliverables:
1. **Outbound Manager Voice Transcription:** Deepgram STT integration into `ConversationsMessagingService` / `ConversationsMediaService` so manager voice messages are transcribed at write-time.
2. **24-Hour Dormancy Auto-Return:** Automatic reset of `MANAGER_INTERCEPTED` $\rightarrow$ `BOT_ACTIVE` and release of takeover lock when a customer messages after 24 hours of inactivity.
3. **Universal Semantic History Compression:** Formatting of manager turns, transcripts, and non-processable file labels (`[🎥 Видеозапись: demo.mp4]`) in `ChatSessionManagerService`.
4. **Discrepancy Resolution Prompting:** System prompt instruction in `NichePolicyService` to gracefully resolve agreements in chat history not yet committed to CRM calendar tools.
5. **Follow-Up State Guard Verification:** Strict verification that follow-ups drop when human is intercepted and schedule organically only under `BOT_ACTIVE`.

---

## 2. Technical Architecture & Modifications

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. Outbound Manager Voice STT (ConversationsMessagingService)                          │
│                                                                                        │
│  Manager records audio in dashboard ──► POST /conversations/:id/messages               │
│       │                                                                                │
│       ├── Promise.all([                                                                │
│       │     deepgramService.transcribeAudio(fileBuffer, mimeType),                     │
│       │     channelAdapter.sendMediaMessage(...)                                       │
│       │   ])                                                                           │
│       │                                                                                │
│       └── Persist Message:                                                             │
│             role: MANAGER                                                              │
│             content: "🎤 " + transcript || "🎤 Голосовое сообщение (0:xx)"             │
│             metadata: { mediaType: 'AUDIO', isVoice: true, transcription, ... }        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. 24h Inactivity Auto-Reset (OrchestratorInboundService)                              │
│                                                                                        │
│  Inbound Customer Message Received                                                     │
│       │                                                                                │
│       ├── Check: conv.status === MANAGER_INTERCEPTED && elapsedHours > 24              │
│       │     ├── repository.updateStatus(conv.id, BOT_ACTIVE)                           │
│       │     ├── repository.clearTakeoverLock(conv.id)                                  │
│       │     └── gateway.emitConversationUpdated(workspaceId, { status: BOT_ACTIVE })   │
│       │                                                                                │
│       └── Proceed to Autonomous Gemini Loop under BOT_ACTIVE                           │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. Universal Sliding Window (ChatSessionManagerService)                                │
│                                                                                        │
│  Build Gemini Prompt turns:                                                            │
│  ├── User Audio: 🎤 transcript                                                         │
│  ├── Manager Audio: 🎤 transcript (mapped to role: 'model')                            │
│  ├── User / Manager Video: [🎥 Видеозапись: filename.mp4]                              │
│  └── Unsupported Files: [📎 Файл: filename.ext]                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Backend Changes

### 3.1 `ConversationsModule` & Outbound Voice STT
* **File:** `src/modules/conversations/conversations.module.ts`
  - Import `AiModule` to make `DeepgramService` available.
* **File:** `src/modules/conversations/services/conversations-messaging.service.ts`
  - Inject `DeepgramService`.
  - When `dto.mediaType === MessageMediaType.AUDIO` and `fileBuffer` exists:
    - Execute `this.deepgramService.transcribeAudio(fileBuffer, dto.mimeType)` concurrently with `channelAdapter.sendMediaMessage()`.
    - If transcript is produced:
      - Set `displayContent = "🎤 " + sttResult.transcript`
      - Set `messageMetadata.transcription = sttResult.transcript`
      - Set `messageMetadata.transcriptionConfidence = sttResult.confidence`
      - Set `messageMetadata.detectedLanguage = sttResult.detectedLanguage`

### 3.2 24-Hour Dormancy Auto-Reset
* **File:** `src/modules/conversations/conversations.repository.ts`
  - Add method `resetTakeoverLock(conversationId: string): Promise<Conversation>` to set `takenOverByActorId: null` and `status: BOT_ACTIVE`.
* **File:** `src/modules/ai-engine/services/orchestrator-inbound.service.ts`
  - Before checking the `MANAGER_INTERCEPTED` guard:
    ```ts
    if (conv.status === ConversationStatus.MANAGER_INTERCEPTED) {
      const elapsedHours = conv.lastMessageAt
        ? (Date.now() - new Date(conv.lastMessageAt).getTime()) / (1000 * 60 * 60)
        : 999;

      if (elapsedHours >= 24) {
        this.logger.log(`Conversation ${conv.id} 24h dormancy expired. Auto-resetting to BOT_ACTIVE.`);
        await this.conversationsRepository.resetTakeoverLock(conv.id);
        conv.status = ConversationStatus.BOT_ACTIVE;
        this.conversationsGateway.emitConversationUpdated(workspaceId, {
          id: conv.id,
          status: ConversationStatus.BOT_ACTIVE,
          takenOverByActorId: null,
        });
      } else {
        this.logger.log(`Conversation ${conv.id} is MANAGER_INTERCEPTED (<24h). Skipped AI response.`);
        return;
      }
    }
    ```

### 3.3 Semantic File Labels in Prompt Builder
* **File:** `src/modules/ai-engine/services/chat-session-manager.service.ts`
  - Ensure all media types have clean text labels for both `USER` and `MANAGER`:
    - `VIDEO`: `[🎥 Видеозапись: ${meta.fileName || 'видео'}]`
    - `AUDIO` with transcript: `🎤 ${meta.transcription}`
    - `AUDIO` without transcript: `🎤 [Голосовое сообщение]`
    - `DOCUMENT`: `[📄 ${meta.aiDescription || meta.fileName || 'Документ'}]`
    - `IMAGE`: `[📷 ${meta.aiDescription || 'Фотография'}]`

### 3.4 Discrepancy Resolution Prompt Rule
* **File:** `src/modules/ai-engine/niche-policy.service.ts`
  - In `buildSystemPrompt()`, add a directive under core operational rules:
    > **CRM vs Chat History Discrepancy Rule:**
    > *"If the chat history shows a human specialist agreed to or discussed an appointment or discount, but tools (`listBookings` / `checkAvailability`) return no active record in the schedule: NEVER contradict the specialist. Politely inform the client: 'Я вижу вашу договоренность с администратором. Сейчас зафиксирую время в графике' and call the booking tool to create the appointment, or escalate if the slot is unavailable."*

---

## 4. Backend Implementation Checklist

- [ ] **Step 1:** Add `AiModule` to `ConversationsModule` imports.
- [ ] **Step 2:** Inject `DeepgramService` into `ConversationsMessagingService` and run STT on outbound audio buffers.
- [ ] **Step 3:** Add `resetTakeoverLock(id)` to `ConversationsRepository`.
- [ ] **Step 4:** Implement 24-hour dormancy check in `OrchestratorInboundService` to auto-return to `BOT_ACTIVE`.
- [ ] **Step 5:** Update `ChatSessionManagerService` with standardized text badges for videos, documents, and transcripts.
- [ ] **Step 6:** Add the CRM Discrepancy Resolution directive to `NichePolicyService.buildSystemPrompt()`.
- [ ] **Step 7:** Run unit tests (`npm run test`) to verify all existing and updated flows pass.

---

## 5. Frontend Changes & Integration Guide

To support the updated backend architecture, the frontend agent should implement the following adjustments in the web dashboard:

### 5.1 Outbound Manager Voice Note Transcription Bubble
* **Current Behavior:** Manager voice bubbles display only an audio waveform player.
* **New Requirement:**
  - When rendering message bubbles where `role === 'MANAGER'` and `metadata.mediaType === 'AUDIO'`:
    - If `metadata.transcription` exists, render the **collapsible transcription accordion** beneath the waveform (identical to inbound customer voice bubbles).
    - If transcription failed or is empty, hide the accordion.

### 5.2 Real-Time Takeover Lock & Status Reactivity
* **Current Behavior:** The frontend listens to `conversation.updated` WebSocket event.
* **New Requirement:**
  - When the backend auto-resets a dormant conversation from `MANAGER_INTERCEPTED` $\rightarrow$ `BOT_ACTIVE`, the `conversation.updated` event will emit `{ status: 'BOT_ACTIVE', takenOverByActorId: null }`.
  - Frontend must reactively:
    1. Update the chat status badge in the header from *"Взят сотрудником"* $\rightarrow$ *"ИИ активен"*.
    2. Unlock the message input box if it was previously locked to another specialist.
    3. Update the conversation list filter item in real-time without page reload.

### 5.3 Media Drawer & Gallery Transcripts
* **Current Behavior:** `GET /conversations/:id/media` returns list of attachments.
* **New Requirement:**
  - Manager voice recordings in the Media Drawer now include `transcription: string`.
  - Display the transcribed text snippet in the audio card preview inside the conversation media panel.
