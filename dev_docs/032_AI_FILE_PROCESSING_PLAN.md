# 032 — AI Multimodal Conversation File Processing & Outbound Voice Pipeline: Frontend Implementation Plan

> **Document Type:** Frontend System Architecture, Technical Implementation Blueprint & Development Checklist  
> **Target Audience:** Frontend Engineers, Fullstack Engineers, UI/UX Developers  
> **Status:** ✅ Implemented  
> **Backend Reference:** `dev_docs/backend/061_AI_CONVERSATION_FILES_PROCESSING.md` (✅ Implemented)  
> **Touches:** `lib/api/conversations.ts`, `components/dashboard/inbox/MessageBubble.tsx`, `components/dashboard/inbox/ConversationThread.tsx`, `components/dashboard/inbox/ManagerComposer.tsx`, `components/dashboard/inbox/media/`, `components/dashboard/inbox/composer/`, `components/dashboard/inbox/gallery/`, `hooks/useConversations.ts`, `hooks/useAudioRecorder.ts`, `locales/translation_keys_new.json`

---

## 1. Executive Summary & Core Objectives

The backend has implemented the **Multimodal Conversation Processing Engine** (`061_AI_CONVERSATION_FILES_PROCESSING.md`), replacing the legacy blanket media escalation with intelligent file triage (Images, Light Docs & Sheets, Weird Binary Files, Heavy Escalations) and an omnichannel voice transcoding pipeline.

### 1.1 Objectives for the Web Dashboard
1. **Multimodal Awareness in Message Bubbles:** Render distinct visual representations for all 4 processing tiers:
   - **Tier 1 (Light Images):** Visual thumbnail with zoom lightbox, "AI проанализировано" badge, and inspectable AI visual description tooltip (`aiDescription`).
   - **Tier 2 (Light Documents & Spreadsheets):** Interactive document card with file-type icon (PDF, XLSX, DOCX, CSV), size, download action, and a collapsible "Извлеченный текст" preview for parsed tabular/markdown text.
   - **Tier 3 (Weird Binary Files — `.p12`, `.key`, `.exe`, `.zip`):** Distinct amber warning card informing the manager that a cryptographic/system file was received and escalated without bot disruption.
   - **Tier 4 (Heavy Files & Videos — >10MB):** Heavy media card with an escalation badge indicating human review is required.
2. **Omnichannel Outbound Voice Dispatch (`isVoice: true`):** Ensure manager browser voice recordings captured via `MediaRecorder` explicitly pass `{ isVoice: true, durationSeconds, mimeType: "audio/webm" }` so the backend `AudioTranscoderService` normalizes them to native waveform voice bubbles (`sendVoice` on Telegram, PTT voice on WhatsApp, audio clips on Instagram).
3. **Refactor Obsolete Handoff Block:** Eliminate the legacy `canHandOffToAi` check in `ConversationThread.tsx` (which previously blocked returning a chat to AI if any media existed). Managers can now safely return dialogues to AI (`BOT_ACTIVE`) after resolving escalations.
4. **Media Gallery & File Actions Hardening:** Support preview and categorization for all document types (spreadsheets, archives, certificates, docs) with download CTAs.

---

## 2. Omnichannel Media & Triage Architecture

```
════════════════════════════════════════════════════════════════════════════════════════════════════════════════
                             FRONTEND MULTIMODAL MESSAGE & TRIAGE PIPELINE
════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  INBOUND MESSAGE (From Lead via WhatsApp / Telegram / Instagram)
             │
             ▼
  Socket.IO / SWR (`message.new` / `GET /conversations/:id/messages`)
             │
             ├─► `metadata.mediaType === 'AUDIO'`
             │     └─► <VoiceMessagePlayer> (Waveform, duration, Deepgram STT transcription accordion)
             │
             ├─► `metadata.aiProcessingTier === 'LIGHT_IMAGE'`
             │     └─► <ImageAttachment> + "AI проанализировано" Badge + Tooltip (`aiDescription`)
             │
             ├─► `metadata.aiProcessingTier === 'LIGHT_PDF' | 'LIGHT_STRUCTURED_DOC'`
             │     └─► <DocumentAttachment> + File Icon (PDF/XLSX/DOCX) + Collapsible <ExtractedTextPreview>
             │
             ├─► `metadata.aiProcessingTier === 'WEIRD_BINARY'` (.p12 / .key / .exe / .zip)
             │     └─► <WeirdFileAlertCard> (Amber badge: "Системный файл передан менеджеру" + Download CTA)
             │
             └─► `metadata.aiProcessingTier === 'HEAVY_ESCALATION'` (Video / >10MB)
                   └─► <HeavyMediaEscalationCard> (Video player or heavy doc card + Escalation tag)

 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  OUTBOUND MANAGER VOICE / MEDIA (From Dashboard Composer)
             │
             ▼
  1. Capture Voice (WebM via `useAudioRecorder`) OR Pick Attachment (<AttachmentPicker>)
             │
             ▼
  2. POST /api/conversations/:id/media/upload (Returns { mediaUrl, fileName, fileSize, mimeType })
             │
             ▼
  3. POST /api/conversations/:id/messages
     Payload: {
       content?: string,
       mediaUrl: string,
       mediaType: "AUDIO" | "IMAGE" | "DOCUMENT" | "VIDEO",
       durationSeconds: 14.5,
       mimeType: "audio/webm",
       fileName: "voice-recording.webm"
     }
════════════════════════════════════════════════════════════════════════════════════════════════════════════════
```

---

## 3. Data Contracts & TypeScript Types (`lib/api/conversations.ts`)

Update `lib/api/conversations.ts` to mirror the backend 061 specification:

```ts
export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';

export type FileTriageTier =
  | 'LIGHT_IMAGE'
  | 'LIGHT_PDF'
  | 'LIGHT_STRUCTURED_DOC'
  | 'WEIRD_BINARY'
  | 'HEAVY_ESCALATION';

export interface MessageMediaMetadata {
  mediaType?: MediaType;
  mediaUrl?: string;
  fileKey?: string;
  mimeType?: string;
  fileSize?: number;
  fileName?: string;
  durationSeconds?: number;

  // Voice STT Specific (Deepgram Nova-3)
  isVoice?: boolean;
  transcription?: string;
  transcriptionConfidence?: number;
  detectedLanguage?: 'ru' | 'kk' | 'en' | string;
  transcriptionDurationMs?: number;
  transcriptionError?: string;

  // AI Multimodal Processing & Semantic Triage
  aiProcessed?: boolean;
  aiProcessingTier?: FileTriageTier;
  aiDescription?: string;   // Visual/document semantic summary
  extractedText?: string;   // Structured text/markdown tables (from .xlsx / .docx)
  skippedReason?: string;
  escalationReason?: string;

  // Channel Context
  rawType?: string;
  externalMediaId?: string;
}

export interface SendManagerMessageDto {
  content?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  durationSeconds?: number | null;
}
```

---

## 4. Component Architecture & UI Specifications

All new and modified components strictly follow the **Modern Minimalist Light SaaS** design system (pure white cards, MoonAI violet `#7C3AED` accent, ultra-fine borders `border-border/80`, max 400 lines per file).

### 4.1. Message Bubble Rendering Matrix (`MessageBubble.tsx`)

The message bubble delegates media rendering based on `metadata.mediaType` and `metadata.aiProcessingTier`:

| Tier / Type | Metadata Condition | Visual Component | Key Features & Actions |
|---|---|---|---|
| **Voice Memo** | `mediaType === 'AUDIO'` | `<VoiceMessagePlayer>` | • Waveform progress bar & duration (`mm:ss`)<br>• Speed cycle (`1x`, `1.5x`, `2x`)<br>• Expandable Deepgram STT transcript with language pill (`RU`/`KK`)<br>• Download button |
| **Light Image** | `mediaType === 'IMAGE'` && `tier === 'LIGHT_IMAGE'` | `<ImageAttachment>` | • Clean thumbnail (max 320px) with skeleton loader<br>• Fullscreen lightbox zoom modal<br>• "AI проанализировано" badge with hover tooltip showing `aiDescription`<br>• Download action |
| **Light Document / Spreadsheet** | `mediaType === 'DOCUMENT'` && `tier === 'LIGHT_STRUCTURED_DOC' \| 'LIGHT_PDF'` | `<DocumentAttachment>` | • Format icon (PDF = Rose, XLSX = Emerald, DOCX = Sky, CSV = Slate)<br>• File size label (e.g. `2.4 МБ`)<br>• Direct browser preview & download CTA<br>• Collapsible `<ExtractedTextPreview>` accordion if `extractedText` exists |
| **Weird Binary File** | `metadata.aiProcessingTier === 'WEIRD_BINARY'` | `<WeirdFileAlertCard>` | • Amber/Slate warning card<br>• Shield alert icon + "Системный файл (.p12/.exe/ключ) — диалог передан менеджеру"<br>• File size and download button for specialist review |
| **Heavy Escalation** | `metadata.aiProcessingTier === 'HEAVY_ESCALATION'` | `<HeavyMediaEscalationCard>` | • Video player or heavy file container<br>• Orange badge: "Объемный файл (>10MB / видео) — передан специалисту"<br>• Download button |

---

### 4.2. New & Updated Media Components (`components/dashboard/inbox/media/`)

```
components/dashboard/inbox/media/
├── VoiceMessagePlayer.tsx         # [EXISTING] Supports playback, scrubbing, transcript accordion
├── ImageAttachment.tsx            # [MODIFY] Add "AI Analyzed" badge & aiDescription tooltip
├── VideoAttachment.tsx            # [EXISTING] HTML5 inline video playback
├── DocumentAttachment.tsx         # [MODIFY] Add ExtractedTextPreview accordion for XLSX/DOCX
├── ExtractedTextPreview.tsx       # [NEW] Collapsible markdown table / text view
├── WeirdFileAlertCard.tsx         # [NEW] Amber warning card for .p12, .key, .exe, .zip
├── HeavyMediaEscalationCard.tsx   # [NEW] Heavy media escalation banner & download
├── AttachmentActions.tsx          # [EXISTING] Open in new tab + Download file utilities
└── MediaLightboxModal.tsx         # [EXISTING] Fullscreen modal for visual media
```

#### Detailed Component Specifications:

1. **`ExtractedTextPreview.tsx` (`< 120 lines`):**
   - Accordion component shown below document card when `metadata.extractedText` is present.
   - Renders formatted markdown/plain-text tables with horizontal scrolling for spreadsheets.
   - Collapsed by default with a subtle toggle button: *"Показать извлеченный текст"* / *"Скрыть"*.

2. **`WeirdFileAlertCard.tsx` (`< 100 lines`):**
   - Rendered when `metadata.aiProcessingTier === 'WEIRD_BINARY'`.
   - Card styling: `bg-amber-500/5 border-amber-500/20 text-foreground`.
   - Header with `ShieldAlert` icon and localized text explaining that the cryptographic/binary file is preserved safely for staff inspection without bot hallucination.

3. **`HeavyMediaEscalationCard.tsx` (`< 120 lines`):**
   - Rendered when `metadata.aiProcessingTier === 'HEAVY_ESCALATION'`.
   - Highlights why human attention was requested (e.g. *"Получено видео"* or *"Файл превышает 10 МБ"*).

---

### 4.3. Composer & Outbound Voice Dispatch (`ManagerComposer.tsx`)

#### 1. Outbound Voice Payload Fix:
Ensure `isVoice: true` is included when dispatching voice memos recorded in the browser:

```ts
const handleSendVoice = async () => {
  if (!conversationId || isBusy) return;
  setIsUploadingMedia(true);

  try {
    const { blob, duration } = await stopRecording();
    if (!blob || blob.size === 0) {
      setIsUploadingMedia(false);
      return;
    }

    // 1. Upload audio recording to storage
    const uploadRes = await conversationsApi.uploadMedia(
      conversationId,
      blob,
      "AUDIO",
      duration
    );

    // 2. Send outbound manager message with isVoice: true
    await onSendMessage({
      mediaUrl: uploadRes.mediaUrl,
      mediaType: "AUDIO",
      isVoice: true, // <── Backend AudioTranscoderService uses this to transcode to OGG Opus / MP4
      durationSeconds: duration,
      fileName: uploadRes.fileName,
      mimeType: uploadRes.mimeType,
      fileSize: uploadRes.fileSize,
    });

    setIsLockedByOther(false);
  } catch (err) {
    toast.error(t("inbox.outbound_media_failed"));
  } finally {
    setIsUploadingMedia(false);
  }
};
```

---

### 4.4. Conversation Handoff Refactoring (`ConversationThread.tsx`)

#### 1. Remove Obsolete Media Handoff Block:
In `ConversationThread.tsx`, remove the legacy check that unconditionally prevented handing conversations back to AI if any media was present:

```ts
// ❌ REMOVE OLD OBSOLETE CHECK:
// const canHandOffToAi = !messages.some((msg) => {
//   const metadata = msg.metadata as MessageMediaMetadata | undefined;
//   return Boolean(metadata?.mediaType && metadata.mediaType !== "AUDIO");
// });

// ✅ REPLACED WITH:
// Managers can return any conversation back to AI whenever they have resolved the human turn.
const canHandOffToAi = true;
```

---

## 5. Media Gallery Sheet Enhancements (`MediaGallerySheet.tsx`)

1. **Document Classification & Icons:**
   - Display distinct badges for Spreadsheets (`.xlsx`, `.csv`), Word Docs (`.docx`), PDFs (`.pdf`), and System Binaries (`.p12`, `.zip`).
2. **Metadata Badges in Gallery Item:**
   - Display "AI Обработано" badge on items where `metadata.aiProcessed === true`.
   - Display transcription preview snippet for voice messages.

---

## 6. Localization & Translation Keys

All user-facing strings are added to `locales/translation_keys_new.json` and merged via translation scripts:

```json
{
  "inbox.ai_processed_badge": "AI проанализировано",
  "inbox.ai_processed_tooltip": "ИИ изучил вложение и учел его в ответе",
  "inbox.extracted_text_toggle_show": "Показать извлеченный текст",
  "inbox.extracted_text_toggle_hide": "Скрыть текст",
  "inbox.weird_file_title": "Системный файл получен",
  "inbox.weird_file_desc": "Файл передан специалисту без вмешательства бота",
  "inbox.heavy_media_title": "Объемное вложение",
  "inbox.heavy_media_desc": "Видео или большой документ передан на проверку сотруднику",
  "inbox.file_type_pdf": "PDF Документ",
  "inbox.file_type_sheet": "Таблица Excel / CSV",
  "inbox.file_type_doc": "Документ Word",
  "inbox.file_type_binary": "Системный файл"
}
```

---

## 7. Implementation Checklist & Step-by-Step Roadmap

### Phase 1: API & TypeScript Layer Updates
- [x] Update `MessageMediaMetadata` and `SendManagerMessageDto` in `lib/api/conversations.ts` with `aiProcessingTier`, `aiProcessed`, `aiDescription`, `extractedText`, `skippedReason`, `escalationReason`, and `isVoice`.
- [x] Update optimistic message creation in `hooks/useConversations.ts` to preserve `isVoice` and metadata properties.

### Phase 2: Media Bubble Components & Visual Tiers
- [x] Create `components/dashboard/inbox/media/ExtractedTextPreview.tsx` for collapsible markdown/tabular previews.
- [x] Create `components/dashboard/inbox/media/WeirdFileAlertCard.tsx` for `.p12`, `.key`, `.exe`, `.zip` triage.
- [x] Create `components/dashboard/inbox/media/HeavyMediaEscalationCard.tsx` for heavy media / video escalations.
- [x] Update `ImageAttachment.tsx` with subtle "AI проанализировано" badge and `aiDescription` tooltip.
- [x] Update `DocumentAttachment.tsx` to integrate `ExtractedTextPreview` for Excel/Word files.
- [x] Update `MessageBubble.tsx` to route message attachments to appropriate tier cards based on `metadata.aiProcessingTier`.

### Phase 3: Outbound Voice Memo Transcoding Integration
- [x] In `ManagerComposer.tsx`, update `handleSendVoice` to pass `isVoice: true` in `onSendMessage`.
- [x] Verify browser `MediaRecorder` audio capture settings (`sampleRate: 48000`, `channelCount: 1`, `echoCancellation: true`).

### Phase 4: Conversation Controls & Handoff Refactoring
- [x] Refactor `ConversationThread.tsx` to remove legacy `canHandOffToAi` restriction on media conversations.
- [x] Verify `HandoffToggle.tsx` and `TakeoverControl.tsx` function smoothly when returning media threads to `BOT_ACTIVE`.

### Phase 5: Media Gallery & Icon Hardening
- [x] Update `MediaGalleryItem.tsx` with dedicated icons and styling for `.xlsx`, `.docx`, `.pdf`, `.zip`, `.p12`.
- [x] Ensure all media gallery items support instant download via `AttachmentActions.tsx`.

### Phase 6: Translations & Quality Assurance
- [x] Add new Russian translation keys to `locales/translation_keys_new.json`.
- [x] Run `node scripts/apply-translation-keys.mjs` and `node scripts/export-translation-keys.mjs`.
- [x] Verify zero TypeScript errors (`npm run build` or `npx tsc --noEmit`).
- [x] Verify all touched files remain strictly under 400 lines and follow Modern Minimalist Light SaaS standards.
