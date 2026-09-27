# 061 — AI Multimodal Conversation Processing: Images, Light Documents & Sheets, Weird Files Policy, Heavy Escalations & Omnichannel Voice Audio Pipeline

> **Document Type:** System Architecture & Technical Implementation Blueprint  
> **Target Audience:** Backend Engineers, AI/Prompt Engineers, Fullstack & Frontend Developers  
> **Status:** 📋 Design & Implementation Specification  
> **Target Backend Modules:** `src/modules/ai/`, `src/modules/ai-engine/`, `src/modules/conversations/`, `src/modules/channels/`, `src/modules/storage/`, `src/modules/knowledge-base/`  
> **Target Frontend Area:** Web Dashboard (`Unified Inbox`, `Message Thread`, `Audio Recorder`, `Chat Bubble Renderer`, `File Uploader`)  
> **Related Docs:** `053_VOICE_MSG_PROCESSING_AND_SENDING_MEDIA_PLAN.md`, `052_HUMAN_ESCALATION_AND_NOTIFICATIONS_PLAN.md`, `045_AI_ENGINE_PROMPT_AND_HISTORY_IMPL_PLAN.md`, `034_AI_ENGINE_DOMAIN_SPEC.md`, `033_UNIFIED_INBOX_DOMAIN_SPEC.md`

---

## 1. Executive Summary & Core Objectives

In real-world customer communication (salons, clinics, fitness, auto services, real estate, consulting), customers constantly send non-text assets:
1. **Visual Media:** Photos of desired haircuts, manicure styles, skin/dental issues, receipts, screenshots of schedules, menus, and price lists.
2. **Light Documents & Spreadsheets:** PDF brochures, registration forms, price sheets in Excel (`.xlsx`), Word documents (`.docx`), or plain CSV.
3. **Voice Notes:** Bilingual voice memos in Russian and Kazakh recorded on phones.
4. **Outbound Staff Audio:** Voice recordings recorded by human managers inside the web dashboard.

### 1.1 Current Architecture Limitations & What We Are Solving
- **Limitation 1 (Inbound Media Blanket Escalation):** Previously, if an incoming message contained an image, PDF, or document, `OrchestratorInboundService` immediately triggered an unconditional P0 human escalation (`EscalationTrigger.MEDIA_ATTACHMENT`) and completely bypassed the AI engine. The AI was blind to images and documents.
- **Limitation 2 (Lack of Smart File Triage & Weird File Escalation):** The system did not differentiate between **processable light files** (which AI should analyze directly), **weird/binary files** (like `.p12`, `.key`, `.exe`, which must be safely escalated to human specialists rather than having the AI converse about certificates), and **oversized/heavy media** (which require human attention).
- **Limitation 3 (Outbound WebM Audio Sent as Raw File):** When a staff member records audio in the web browser (which outputs `audio/webm; codecs=opus`), sending it to Telegram, WhatsApp, or Instagram results in a generic downloadable `.webm` document file instead of a native playable voice memo with an interactive waveform bubble (`sendVoice` on Telegram, PTT voice on WhatsApp).
- **Limitation 4 (Multipart Data Bloat in Multi-Turn History):** Re-sending raw base64 image/document payloads on every subsequent turn of a conversation blows up token costs, spikes latency (+2000ms), and risks context window exhaustion.

### 1.2 Core Architectural Objectives
```
════════════════════════════════════════════════════════════════════════════════════════════════════════════════
                                 OMNICHANNEL MULTIMODAL PIPELINE OVERVIEW
════════════════════════════════════════════════════════════════════════════════════════════════════════════════

 ── INBOUND FLOW (Lead → AI / Inbox) ───────────────────────────────────────────────────────────────────────────

   Lead sends message on WhatsApp / Telegram / Instagram (Text, Audio, Image, PDF, Sheet, Doc, or Binary)
                                    │
                                    ▼
   Channel Adapter (Extracts caption, sender, download URL / media ID)
                                    │
                                    ▼
   InboundMediaReceiverService (Downloads binary & persists to Cloudflare R2 / StorageService)
                                    │
                                    ▼
                   ┌───────────────────────────────────┐
                   │ ConversationMediaProcessorService │
                   └─────────────────┬─────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
 ┌────────────────┐         ┌────────────────┐          ┌────────────────┐
 │  VOICE / AUDIO │         │  LIGHT MEDIA   │          │ WEIRD / HEAVY  │
 │  (Deepgram STT)│         │  (AI Multimodal│          │ (Human Escalate│
 └───────┬────────┘         └────────┬───────┘          └────────┬───────┘
         │                           │                           │
         │ Nova-3 Transcript         │ Images (inlineData base64)│ Weird (.p12/.exe/keys)
         │ (ru / kk detection)       │ PDFs (inlineData base64)  │   → Escalate to Human (P0)
         │                           │ Sheets/Docs (Markdown tab)│ Heavy (>10MB / Video):
         │                           │                           │   → Escalate to Human (P0)
         └───────────────────────────┼───────────────────────────┘
                                     │
                                     ▼
                   ┌───────────────────────────────────┐
                   │  GEMINI VERTEX AI AGENT LOOP      │
                   │  (Multimodal reasoning + Tools)   │
                   └─────────────────┬─────────────────┘
                                     │
                                     ├─► Generates concise `aiDescription` & stores in DB
                                     │   (Future turns use pure text; 0 raw binary re-sent!)
                                     │
                                     ▼
                   Auto-reply dispatched back to Lead via OutboundChannelDispatcherService

 ── OUTBOUND FLOW (Staff in Dashboard → Lead) ───────────────────────────────────────────────────────────────────

   Staff records voice in Dashboard (WebM) OR uploads Image/Document
                                    │
                                    ▼
   POST /conversations/:id/media/upload (Validates MIME, stores in R2)
                                    │
                                    ▼
   POST /conversations/:id/messages (dto: { mediaUrl, mediaType: "AUDIO", isVoice: true })
                                    │
                                    ▼
   Audio Transcoder Service (Normalizes WebM → OGG Opus / MP4 AAC)
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
  Telegram Adapter           WhatsApp Adapter           Instagram Adapter
  (sendVoice: native         (type: "audio" PTT:        (type: "audio" clip:
   waveform voice bubble)     voice note player)         native IG audio)
════════════════════════════════════════════════════════════════════════════════════════════════════════════════
```

---

## 2. Inbound File Classification & Triage Policy

Incoming files are categorized into four distinct processing tiers:

| Tier | Category | Allowed MIME / Extensions | Max Size / Limits | System & AI Handling Action |
|---|---|---|---|---|
| **Tier 1** | **Images (Visual Multimodal)** | `image/jpeg`, `image/png`, `image/webp`, `image/heic` | $\le$ 10 MB | **Direct Gemini Multimodal Input (Turn 1) + Semantic Description:**<br>- Fetched from storage, converted to `inlineData` base64 part, fed directly into Gemini 3.5/2.5 Flash.<br>- AI analyzes style, text in image, haircuts, receipts, etc.<br>- Auto-generates concise `aiDescription` for subsequent text-only history turns. |
| **Tier 2** | **Light Documents & Spreadsheets** | - **PDF:** `application/pdf`<br>- **Excel/Sheets:** `.xlsx`, `.xls`, `text/csv`<br>- **Word/Docs:** `.docx`, `text/plain`, `.md` | - PDF: $\le$ 10 MB ($\le$ 15 pages)<br>- Excel/CSV: $\le$ 5 MB<br>- Docs: $\le$ 5 MB | **Multimodal / Structured Text Ingestion:**<br>- PDF fed as `inlineData` (`application/pdf`) to Gemini.<br>- Excel/CSV parsed via `exceljs` into clean Markdown tables.<br>- Word/Docs parsed via `mammoth` into clean text.<br>- Injected into conversation turn for instant reasoning. |
| **Tier 3** | **Weird / Cryptographic / Executable (Escalate to Human)** | `.p12`, `.pfx`, `.cer`, `.crt`, `.key`, `.pem`, `.exe`, `.dll`, `.bat`, `.sh`, `.bin`, `.apk`, `.dmg`, `.iso`, `.zip`, `.rar`, `.7z` | Any size | **Store File & Trigger Immediate Human Escalation (`EscalationTrigger.MEDIA_ATTACHMENT`):**<br>- Binary persisted safely in Storage & PostgreSQL for manager review.<br>- AI is **NOT** invoked on weird files (prevents prompt corruption, security leaks, or confusion).<br>- Alerts notify managers and workspace owner in dashboard without bot chat intervention.<br>- Sets conversation status to `MANAGER_INTERCEPTED`. |
| **Tier 4** | **Heavy Files & Large Media (Escalate to Human)** | - **Videos:** `video/mp4`, `video/quicktime`, etc.<br>- **Oversized PDFs:** > 10 MB or > 15 pages<br>- **Oversized Datasets:** > 5 MB | > 10 MB (or video) | **Trigger Human Escalation (`EscalationTrigger.MEDIA_ATTACHMENT`):**<br>- Marks conversation for human manager review in inbox.<br>- Alerts dashboard via WebSocket without bot chat intervention.<br>- Sets conversation status to `MANAGER_INTERCEPTED`. |

---

## 3. Backend Implementation Architecture

### 3.1. Multimodal Gemini Integration (`src/modules/ai/gemini.service.ts`)

The Vertex AI SDK (`@google/genai`) natively accepts multimodal `Part` objects (`inlineData` with base64 for images and PDFs).

#### Extended Interface for `generateWithTools`:
```ts
export interface MultimodalContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // Base64 encoded binary
  };
}

export interface GenerateWithToolsParams {
  systemInstruction: string;
  userMessage: string;
  userParts?: MultimodalContentPart[]; // Multimodal parts for current user turn
  history?: Array<{
    role: 'user' | 'model';
    text?: string;
    parts?: MultimodalContentPart[];
  }>;
  tools?: import('@google/genai').FunctionDeclaration[];
  executeTool: (
    name: string,
    args: Record<string, any>,
  ) => Promise<Record<string, any>>;
  maxTurns?: number;
}
```

---

### 3.2. Media Triage & Processor Service (`ConversationMediaProcessorService`)

Located at `src/modules/ai-engine/services/conversation-media-processor.service.ts`, handles file analysis, extraction, and semantic captioning:

```ts
export enum FileTriageTier {
  LIGHT_IMAGE = 'LIGHT_IMAGE',
  LIGHT_PDF = 'LIGHT_PDF',
  LIGHT_STRUCTURED_DOC = 'LIGHT_STRUCTURED_DOC', // docx, xlsx, csv, txt
  WEIRD_BINARY = 'WEIRD_BINARY',                 // .p12, .exe, .key, .zip
  HEAVY_ESCALATION = 'HEAVY_ESCALATION',         // video, >10MB doc, giant dataset
}

export interface MediaTriageResult {
  tier: FileTriageTier;
  multimodalParts?: MultimodalContentPart[];
  extractedText?: string;
  requiresHumanEscalation: boolean;
  escalationReason?: string;
}
```

---

### 3.3. Multipart Lifecycle & Zero-Binary Sliding History Optimization

#### The Zero-Binary History Solution:
```
Turn 1: Lead sends Photo/PDF
   │
   ├─► Gemini receives raw multimodal inlineData (Base64)
   ├─► Gemini answers question & calls tools (e.g. checks slots)
   │
   ▼
Persist Semantic Summary in DB (`Message.metadata.aiDescription`)
   e.g.: "[📷 Фото клиента: Стрижка каре, пепельный блонд Airtouch, длина до плеч]"
   │
   ▼
Turn 2, 3, 4... (Subsequent turns in 20-message Sliding Window):
   │
   └─► `ChatSessionManagerService` formats past media turns as 100% PURE TEXT using `aiDescription`
       (ZERO Base64 bytes / ZERO binary buffers are ever re-transmitted!)
```

---

### 3.4. Orchestrator Architecture & Modular Sub-Services

The orchestration layer is decomposed into dedicated, single-responsibility services:

1. **`InboundMediaReceiverService` (`src/modules/ai-engine/services/inbound-media-receiver.service.ts`):**
   - Downloads media bytes from channel adapters (Telegram, WhatsApp, Instagram).
   - Handles storage persistence in Cloudflare R2 / Local storage.
   - For audio: performs Deepgram STT transcription.
   - For visual media / files: runs `ConversationMediaProcessorService.evaluateMedia` for triage and multimodal parts.
2. **`OutboundChannelDispatcherService` (`src/modules/ai-engine/services/outbound-channel-dispatcher.service.ts`):**
   - Handles dispatching text or fallback messages to WhatsApp, Instagram, or Telegram adapters using decrypted credentials.
3. **`OrchestratorInboundService` (`src/modules/ai-engine/services/orchestrator-inbound.service.ts`):**
   - Clean coordinator under 250 lines managing conversation state, escalation guards, and the tool calling loop.

---

### 3.5. System Prompt Updates (`deal-closing-prompt.builder.ts`)

Added explicit guidelines to the AI system prompt regarding attached files and images:

```text
РАБОТА С ФОТОГРАФИЯМИ И ПРИКРЕПЛЕННЫМИ ФАЙЛАМИ:
1. Если клиент прислал фото (пример стрижки, окрашивания, дизайн ногтей, состояние кожи, фото документа или чека):
   Внимательно изучи изображение, подтверди что видишь фото, дай краткий экспертный комментарий по существу и сразу предложи 2 варианта времени для записи на консультацию/процедуру.
2. Если клиент прислал документ или таблицу (PDF, Word, Excel): используй данные из прикрепленного файла для точного ответа на вопрос.
```

---

## 4. Omnichannel Audio Transcoding & Outbound Voice Dispatch

### 4.1. Why WebM Audio Fails Across Messaging Channels
Modern web browsers (Chrome, Edge, Firefox) capture microphone streams via `MediaRecorder` in `audio/webm; codecs=opus`. When sent across messaging APIs:

1. **Telegram Bot API:**
   - Endpoint `POST /sendVoice` **strictly requires an OGG container with Opus audio** (`audio/ogg; codecs=opus`).
   - If Telegram is sent a `.webm` file via `sendVoice`, it returns `400 Bad Request: wrong file identifier/HTTP URL specified`.
   - If fallback `sendAudio` is used, Telegram renders it as a **music file track**, not a voice bubble.
   - If fallback `sendDocument` is used, Telegram renders it as a **downloadable file attachment** named `voice.webm`.
2. **WhatsApp Cloud API:**
   - WhatsApp `type: "audio"` strictly requires `audio/ogg; codecs=opus` for voice notes (with voice memo waveform UI) or `audio/mp4` (`audio/aac`). WebM audio is rejected or delivered as an unplayable attachment.
3. **Instagram Graph API:**
   - Instagram Direct attachment `type: "audio"` requires `audio/mp4`, `audio/aac`, or `audio/m4a`.

### 4.2. Audio Transcoder Service (`src/modules/channels/services/audio-transcoder.service.ts`)

Implemented using `ffmpeg-static` / `fluent-ffmpeg` to normalize audio into channel-compliant containers:

```
                  ┌──────────────────────────────────────────────┐
                  │   Inbound Web Dashboard Audio (audio/webm)   │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                     ┌────────────────────────────────────────┐
                     │         AudioTranscoderService         │
                     └───────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │      OGG / OPUS       │                       │       MP4 / AAC       │
     │  (audio/ogg;          │                       │  (audio/mp4,          │
     │   codecs=opus)        │                       │   audio/aac)          │
     └───────────┬───────────┘                       └───────────┬───────────┘
                 │                                               │
         ┌───────┴───────┐                                       │
         ▼               ▼                                       ▼
    Telegram        WhatsApp                                 Instagram
   (sendVoice:     (type: "audio",                         (type: "audio",
    round bubble    PTT voice memo)                         audio clip)
    with waveform)
```

---

## 5. Channel Inbound Webhook Caption & Metadata Fixes

### 5.1. WhatsApp Inbound Adapter Fix
In `whatsapp-messaging.adapter.ts`, WhatsApp sends caption inside `msg.image.caption`, `msg.document.caption`, or `msg.video.caption`. We update the extractor:

```ts
let text =
  msg.text?.body ||
  msg.image?.caption ||
  msg.document?.caption ||
  msg.video?.caption ||
  undefined;

const fileName = msg.document?.filename || undefined;
```

### 5.2. Telegram Inbound Adapter Fix
In `telegram-messaging.adapter.ts`, ensure `msg.caption` is preserved for photos and documents, and `isVoice: true` is flagged for `msg.voice`.

---

## 6. Database Schema & Message Metadata Specification

`Message.metadata` JSON schema in PostgreSQL:

```ts
export interface MessageMediaMetadata {
  mediaType?: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';
  mediaUrl?: string;
  fileKey?: string;
  mimeType?: string;
  fileSize?: number;
  fileName?: string;
  durationSeconds?: number;

  // Voice STT Specific (Deepgram)
  isVoice?: boolean;
  transcription?: string;
  transcriptionConfidence?: number;
  detectedLanguage?: 'ru' | 'kk' | 'en' | string;
  transcriptionError?: string;

  // AI Multimodal Processing & Semantic History Persistence
  aiProcessed?: boolean;
  aiProcessingTier?: 'LIGHT_IMAGE' | 'LIGHT_PDF' | 'LIGHT_STRUCTURED_DOC' | 'WEIRD_BINARY' | 'HEAVY_ESCALATION';
  aiDescription?: string; // Compact visual/document summary used in future text history turns
  extractedText?: string; // Extracted tabular/text representation (for docx/xlsx)
  skippedReason?: string;
  escalationReason?: string;

  // Channel Context
  rawType?: string;
  externalMediaId?: string;
}
```

---

## 7. Translation Keys Specification

Registered in `translation_keys_new.json`:

```json
{
  "conversations.unsupported_file_skipped": "Файл системного формата получен, диалог передан менеджеру",
  "conversations.heavy_file_escalated": "Получен объемный файл или видео — диалог передан специалисту",
  "conversations.voice_transcoded": "Голосовое сообщение успешно нормализовано для отправки",
  "conversations.voice_transcode_failed": "Не удалось сконвертировать голосовое сообщение",
  "ai_engine.multimodal_image_analyzed": "Изображение успешно обработано AI-ассистентом",
  "ai_engine.multimodal_doc_analyzed": "Документ успешно обработан AI-ассистентом"
}
```

---

## 8. Frontend Developer Guide & UI Specifications

> **Target Audience:** Frontend Developers working on the Unified Inbox and Chat Dashboard.

### 8.1. Voice Recorder Component (Outbound Staff Memos)

#### 1. Recording Constraints & Setup:
```ts
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 48000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});

const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  ? 'audio/webm;codecs=opus'
  : 'audio/mp4';

const mediaRecorder = new MediaRecorder(stream, { mimeType });
```

#### 2. Sending Outbound Voice Note:
When the manager finishes recording and clicks **Send**:
1. Upload binary:
   `POST /conversations/:id/media/upload`  
   `FormData`: `file: blob`, `mediaType: "AUDIO"`, `durationSeconds: 14.2`
2. Send message:
   `POST /conversations/:id/messages`
   ```json
   {
     "mediaUrl": "https://storage.kvik.kz/workspaces/.../voice.ogg",
     "mediaType": "AUDIO",
     "durationSeconds": 14.2,
     "mimeType": "audio/webm",
     "fileName": "voice-recording.webm"
   }
   ```

---

### 8.2. Rich Chat Bubble Renderers in Unified Inbox

The frontend must render typed chat bubbles based on `message.metadata.mediaType` and `message.metadata.aiProcessingTier`:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND CHAT BUBBLE TYPES                                     │
├───────────────────┬──────────────────────────────────────────┬───────────────────────────────────┤
│ Message Type      │ Metadata Condition                       │ Render UI Component               │
├───────────────────┼──────────────────────────────────────────┼───────────────────────────────────┤
│ **Voice Note**    │ `mediaType === 'AUDIO'`                  │ • Custom Waveform Player          │
│                   │                                          │ • Play/Pause toggle + Seek bar    │
│                   │                                          │ • Duration label (e.g. `0:14`)    │
│                   │                                          │ • Expandable STT Deepgram text    │
│                   │                                          │   accordion (if transcription)    │
├───────────────────┼──────────────────────────────────────────┼───────────────────────────────────┤
│ **Photo / Image** │ `mediaType === 'IMAGE'`                  │ • Image thumbnail (max 320px)     │
│                   │                                          │ • Lightbox modal on click (zoom)  │
│                   │                                          │ • Download button + Caption text  │
│                   │                                          │ • "AI Analyzed" subtle badge      │
├───────────────────┼──────────────────────────────────────────┼───────────────────────────────────┤
│ **Light Doc /**   │ `mediaType === 'DOCUMENT'` &&            │ • Document Icon (PDF/Word/Excel)  │
│ **Spreadsheet**   │ `tier !== 'WEIRD_BINARY'`                │ • File name & size (e.g. `1.8 MB`)│
│                   │                                          │ • Download link                   │
│                   │                                          │ • Caption or extracted preview    │
├───────────────────┼──────────────────────────────────────────┼───────────────────────────────────┤
│ **Skipped / Weird**│ `metadata.aiProcessingTier ===`         │ • Gray/Amber Warning Card         │
│ **(.p12 / .exe)** │ `'WEIRD_BINARY'`                         │ • Badge: "Системный файл (.p12)   │
│                   │                                          │   — передан специалисту"          │
│                   │                                          │ • Download button for manager     │
├───────────────────┼──────────────────────────────────────────┼───────────────────────────────────┤
│ **Escalated**     │ `metadata.aiProcessingTier ===`          │ • Orange Badge: "Передано         │
│ **Heavy Media**   │ `'HEAVY_ESCALATION'`                     │   специалисту (видео / >10MB)"    │
│                   │                                          │ • Video player or heavy doc card  │
└───────────────────┴──────────────────────────────────────────┴───────────────────────────────────┘
```

---

## 9. Implementation Master Checklist (Strict Zero-Hallucination Guardrails)

Follow this checklist strictly during backend and frontend implementation to ensure zero regressions:

### Phase 1: Inbound Webhook Media & Caption Fixes
- [x] Update `WhatsAppMessagingAdapter.parseIncomingWebhook` to capture `msg.image.caption`, `msg.document.caption`, and `msg.video.caption`.
- [x] Update `TelegramMessagingAdapter.parseIncomingWebhook` to preserve `msg.caption` and set `isVoice: true` for `msg.voice`.
- [x] Update `InstagramMessagingAdapter.parseIncomingWebhook` to parse media attachments with complete metadata.

### Phase 2: Media Processor & Smart Triage Service
- [x] Create `ConversationMediaProcessorService` (`src/modules/ai-engine/services/conversation-media-processor.service.ts`).
- [x] Implement MIME and magic-byte classifier for Tier 1 (Images), Tier 2 (PDF, XLSX, DOCX), Tier 3 (Weird `.p12`, `.key`, `.exe` $\rightarrow$ Escalation), and Tier 4 (Heavy >10MB / Videos $\rightarrow$ Escalation).
- [x] Implement text/table extractors using `mammoth` (DOCX) and `exceljs` (XLSX/CSV).
- [x] Implement semantic caption generator (`generateSemanticDescription`) to create compact visual summaries for DB persistence.
- [x] Add unit tests for `ConversationMediaProcessorService` covering all 4 tiers.

### Phase 3: Gemini Multimodal Service & Zero-Binary History
- [x] Update `GeminiService.generateWithTools` to support `userParts?: MultimodalContentPart[]` with `inlineData` (base64) for Turn 1 image and PDF processing.
- [x] Update `ChatSessionManagerService` to format past media messages using `aiDescription` / transcript, guaranteeing **zero raw binary buffers** are re-sent in multi-turn history.
- [x] Update `deal-closing-prompt.builder.ts` with explicit guidelines on reasoning over customer photos and documents.
- [x] Verify that existing tools (`get_available_slots`, `create_booking`, `search_knowledge_base`, `escalate_to_human`, `update_lead_stage`) execute flawlessly during multimodal turns.

### Phase 4: Inbound Orchestrator Refactoring & Modular Services
- [x] Create `InboundMediaReceiverService` to isolate binary downloading and media extraction.
- [x] Create `OutboundChannelDispatcherService` to isolate channel dispatch logic.
- [x] In `OrchestratorInboundService`, replace unconditional blanket escalation with smart triage:
  - Tier 1 & 2 $\rightarrow$ Proceed to multimodal Gemini loop.
  - Tier 3 (`.p12` / weird binary) $\rightarrow$ Save file, trigger immediate human escalation (`EscalationTrigger.MEDIA_ATTACHMENT`), notify managers in dashboard without bot chat intervention.
  - Tier 4 (Heavy / Video) $\rightarrow$ Save file, trigger immediate human escalation (`EscalationTrigger.MEDIA_ATTACHMENT`), notify managers in dashboard without bot chat intervention.
- [x] Ensure existing Deepgram STT voice pipeline remains 100% active and unimpacted for voice notes.

### Phase 5: Audio Transcoding & Omnichannel Outbound Voice Dispatch
- [x] Create `AudioTranscoderService` (`src/modules/channels/services/audio-transcoder.service.ts`) using `ffmpeg-static` / `fluent-ffmpeg`.
- [x] Implement `toOggOpus()` (for Telegram `sendVoice` and WhatsApp PTT) and `toMp4Aac()` (for Instagram).
- [x] Update `TelegramMessagingAdapter.sendMediaMessage()`:
  - If `mediaType === 'AUDIO'` and `isVoice === true`, transcode to `.ogg` Opus and call Telegram Bot API `sendVoice`.
- [x] Update `WhatsAppMessagingAdapter.sendMediaMessage()`:
  - Ensure voice messages are dispatched as compliant audio streams.
- [x] Update `InstagramMessagingAdapter.sendMediaMessage()`:
  - Ensure voice messages are dispatched as compliant audio attachments.

### Phase 6: Frontend Dashboard & Unified Inbox UI
- [ ] Frontend: Configure browser audio recorder to capture clean voice audio and pass `isVoice: true` + `durationSeconds`.
- [ ] Frontend: Implement custom waveform audio player with Deepgram transcript accordion.
- [ ] Frontend: Implement image lightbox modal and document preview cards.
- [ ] Frontend: Add warning badges for weird files (`.p12`) and escalated media items.

### Phase 7: Verification & Regression Testing
- [x] Test sending a haircut photo from Telegram bot $\rightarrow$ verify AI analyzes the image, recommends service, offers booking slots, and writes `aiDescription` into message metadata.
- [x] Test subsequent conversation turn after image $\rightarrow$ verify sliding window contains pure text summary (`[📷 Фото: ...]`) and does not re-upload base64 bytes.
- [x] Test sending a PDF price list from WhatsApp $\rightarrow$ verify AI reads the PDF content and answers price questions.
- [x] Test sending a `.p12` certificate file $\rightarrow$ verify backend stores file safely, immediately escalates to human manager (`MANAGER_INTERCEPTED`), and alerts dashboard without bot chat intervention.
- [x] Test sending a 25MB video $\rightarrow$ verify conversation is escalated to human manager (`MANAGER_INTERCEPTED`).
- [x] Test recording voice memo in dashboard and sending to Telegram $\rightarrow$ verify Telegram receives native voice bubble with waveform (`sendVoice`), NOT a `.webm` file!
- [x] Run full test suite (`npm run test`) to guarantee zero regressions across all modules (29 test suites, 161 tests passed).
