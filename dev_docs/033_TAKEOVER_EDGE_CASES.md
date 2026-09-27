# 033 — AI Takeover Edge-Cases & Universal Context Frontend Implementation

> **Document Type:** Frontend Implementation & Verification Specification  
> **Target Audience:** Fullstack Engineers, Frontend Developers, QA Engineers  
> **Status:** 🚀 Implemented & Verified  
> **Target Modules:** `components/dashboard/inbox/`, `hooks/useInboxRealtime.ts`, `hooks/useConversations.ts`, `lib/api/conversations.ts`  
> **Related Docs:** `dev_docs/backend/063_AI_TAKEOVER_EDGE_CASES_PLAN.md`, `dev_docs/backend/062_AI_TAKEOVER_EDGE_CASES_ANALYSIS.md`

---

## 1. Overview & Context

This document details the frontend implementation corresponding to **Section 5 of `dev_docs/backend/063_AI_TAKEOVER_EDGE_CASES_PLAN.md`** and edge-case visual refinements for multimodal messages.

With the backend upgrading the dialogue pipeline to support:
1. Outbound manager voice note transcription via Deepgram Nova-3 STT at write-time.
2. 24-hour dormancy auto-reset (`MANAGER_INTERCEPTED` $\rightarrow$ `BOT_ACTIVE`, clearing `takenOverByActorId`).
3. Universal sliding-window and semantic media history persistence (`[📷 Фотография: ...]`, `[🎥 Видеозапись: ...]`, etc.).

The web dashboard frontend has been updated to provide seamless real-time reactivity, transcription bubble accordions for manager voice notes, rich audio previews in the conversation media drawer, and collapsible deduplicated AI media descriptions.

---

## 2. Implemented Frontend Features

### 2.1 Outbound Manager Voice Note Transcription Bubble
* **Files:** `components/dashboard/inbox/MessageBubble.tsx`, `components/dashboard/inbox/media/VoiceMessagePlayer.tsx`
* **Behavior:**
  - When rendering message bubbles where `role === 'MANAGER'` and `metadata.mediaType === 'AUDIO'`:
    - If `metadata.transcription` exists (or fallback extracted from `message.content`), render the **collapsible transcription accordion** beneath the waveform (matching customer voice note UX).
    - Includes detected language pill (`RU` / `KK`) and confidence score when provided by STT metadata.
    - If transcription failed or is empty for manager voice recordings, the accordion is hidden completely to prevent empty UI clutter.

### 2.2 Real-Time Takeover Lock & Status Reactivity
* **Files:** `hooks/useInboxRealtime.ts`, `components/dashboard/inbox/TakeoverControl.tsx`, `components/dashboard/inbox/ManagerComposer.tsx`, `components/dashboard/inbox/ConversationThread.tsx`
* **Behavior:**
  - Listens to `conversation.updated` WebSocket events carrying `{ status: 'BOT_ACTIVE', takenOverByActorId: null }` (such as on 24-hour dormancy expiration).
  - Automatically invokes `markReleased(conversationId)` in the Zustand `inbox.store` to clear taken locks.
  - Optimistically updates all matching items in the SWR conversation list cache with background revalidation.
  - Reactively clears optimistic owner and lock state in `TakeoverControl` and `ManagerComposer`:
    1. Header status badge switches from *"Занято специалистом"* / *"Вы ведёте диалог"* $\rightarrow$ *"ИИ отвечает"*.
    2. Input box unlocks if previously held by another specialist, presenting the Bot Active status and takeover action button.
    3. Escalation history panels and badges clear dynamically.
    4. SWR conversation list filters and previews update across the dashboard without full page reloads.

### 2.3 Media Drawer & Gallery Audio Transcripts
* **File:** `components/dashboard/inbox/gallery/MediaGalleryItem.tsx`
* **Behavior:**
  - Manager and customer voice recordings in the Media Drawer now display sender role badges (`Клиент` / `Менеджер` / `ИИ-Ассистент`).
  - Displays formatted duration, timestamp, and detected language code.
  - When `item.transcription` is present, renders a neat 3-line clamped quote preview snippet (`“...”`) inside the audio card.
  - Provides quick access to preview and file download actions.

### 2.4 Collapsible AI Image Descriptions & Semantic Duplication Guard
* **Files:** `components/dashboard/inbox/media/ImageAttachment.tsx`, `components/dashboard/inbox/MessageBubble.tsx`
* **Behavior:**
  - **Collapsible Description:** AI image analysis descriptions (`metadata.aiDescription`) are now enclosed inside a collapsible accordion (`[✨ Описание от ИИ]`), collapsed by default to keep the chat interface clean and compact.
  - **Deduplication:** Filtered out synthetic backend media tags (`📷 [Фотография: ...]`, `[🎥 Видеозапись: ...]`, `[📄 Документ: ...]`, etc.) and duplicate `aiDescription` / `extractedText` so they are not rendered twice in the message bubble. Actual human captions (e.g. *"Здравствуйте, вот фото чека"*) continue to render properly.

---

## 3. Touched Files & Architecture Summary

| Component / File | Purpose & Changes |
| :--- | :--- |
| `components/dashboard/inbox/MessageBubble.tsx` | Passes metadata transcription to `VoiceMessagePlayer`; filters synthetic bracketed tags and duplicate descriptions from caption area. |
| `components/dashboard/inbox/media/ImageAttachment.tsx` | Replaced static description block with a sleek collapsible `[✨ Описание от ИИ]` accordion. |
| `components/dashboard/inbox/media/VoiceMessagePlayer.tsx` | Conditionally renders Deepgram transcription accordion for manager voice notes when text exists; hides empty accordions. |
| `hooks/useInboxRealtime.ts` | Handles `conversation.updated`, `conversation.takeover`, `conversation.takeover_released` with optimistic cache mutation and Zustand lock state management. |
| `components/dashboard/inbox/TakeoverControl.tsx` | Added reactivity to reset optimistic ownership upon `BOT_ACTIVE` or lock release. |
| `components/dashboard/inbox/ManagerComposer.tsx` | Clears external lock & optimistic state on `BOT_ACTIVE` / `null` lock; maintains strict file size limit (< 400 lines). |
| `components/dashboard/inbox/ConversationThread.tsx` | Clears optimistic takeover state when conversation status transitions to `BOT_ACTIVE`. |
| `components/dashboard/inbox/gallery/MediaGalleryItem.tsx` | Renders transcription text snippet and sender role pills in audio cards in the media gallery drawer. |

---

## 4. Verification & Quality Assurance

- [x] **TypeScript Validation:** `npx tsc --noEmit` runs with 0 errors.
- [x] **Production Build:** `npm run build` completes successfully with all 58 routes compiled.
- [x] **File Size Guard:** All modified files strictly adhere to the < 400 lines architectural rule.
- [x] **Aesthetics & Token Usage:** Pure white/card surfaces, MoonAI Violet accents, and standard Tailwind utilities with zero visual clutter.
- [x] **Localization:** All customer-facing and manager-facing strings resolve via `next-intl` (`dashboard.json`).
