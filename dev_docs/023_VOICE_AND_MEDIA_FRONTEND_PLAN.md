# 023 — Voice Message Processing & Outbound Media Pipeline: Frontend Integration Plan

> **Document Type:** Frontend System Architecture, Technical Implementation Blueprint & Development Checklist  
> **Target Audience:** Frontend Engineers, Fullstack Engineers  
> **Status:** ✅ Implemented  
> **Backend Reference:** `dev_docs/backend/053_VOICE_MSG_PROCESSING_AND_SENDING_MEDIA_PLAN.md` (✅ Implemented)  
> **Touches:** `components/dashboard/inbox/`, `components/dashboard/inbox/media/`, `components/dashboard/inbox/composer/`, `components/dashboard/inbox/gallery/`, `hooks/`, `lib/api/`, `app/api/[...proxy]/`, `locales/`  

---

## 1. Executive Summary & Core Objectives

Voice messaging and rich media sharing are central to customer workflows across WhatsApp, Instagram, and Telegram in service-oriented businesses (clinics, salons, auto services, consulting). In Kazakhstan and CIS:
- **Over 40% of inbound customer messages are voice notes**, often featuring bilingual speech / code-switching between Russian (`ru`) and Kazakh (`kk`).
- Managers need to review inbound photos, play voice notes with transcripts, send procedure photos, price lists (PDF), explainer videos, and voice memos directly from the dashboard.

The backend team has fully shipped the inbound Deepgram Nova-3 transcription pipeline, storage upload endpoints, and outbound channel dispatchers. This specification defines the frontend architecture, proxy data flows, component modularity, edge-case recovery, and execution checklist for the frontend integration.

---

## 2. Network, Proxy & Storage Delivery Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   UPLOAD & PROXY PIPELINE                                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

 [Browser Composer]
         │
         │  POST /api/conversations/:id/media/upload
         │  (multipart/form-data: file, mediaType, durationSeconds)
         ▼
 [Next.js Route Proxy: app/api/[...proxy]/route.ts]
         │
         │  1. Preserves multipart boundary from 'content-type'
         │  2. Strips 'content-length' so Node fetch computes buffer size accurately
         │  3. Forwards arrayBuffer body to ${BACKEND_URL}/conversations/:id/media/upload
         ▼
 [NestJS Backend: StorageModule & ConversationsController]
         │
         │  1. Validates magic bytes (detects real file type) & enforce size limits
         │  2. Saves to Cloudflare R2 (prod) or ./storage (dev)
         │  3. Returns { mediaUrl, mediaType, mimeType, fileKey, fileName, fileSize, durationSeconds }
         ▼
 [Browser Composer receives 200 OK with CDN mediaUrl]
         │
         │  POST /api/conversations/:id/messages
         │  { content?: caption, mediaUrl, mediaType, fileName, mimeType, fileSize, durationSeconds }
         ▼
 [Message Dispatched to WhatsApp/Telegram/Instagram & Broadcast via Socket.IO]
```

### 2.1 Next.js Proxy Route Configuration (`app/api/[...proxy]/route.ts`)

The Next.js App Router proxy forwards all `/api/*` requests to the NestJS backend. For high-volume binary uploads (up to 50MB):

1. **Header Normalization:** When proxying `multipart/form-data`, `request.headers` retains the boundary string. However, forwarding the client's `content-length` header alongside an `arrayBuffer()` body can cause Node.js `fetch` socket mismatches. The proxy must strip `content-length` from forwarded headers:
   ```ts
   headers.delete('content-length');
   ```
2. **Route Segment Limits:** App Router route handlers must allow long uploads:
   ```ts
   export const dynamic = 'force-dynamic';
   export const maxDuration = 60; // 60s timeout for large media files
   ```
3. **CORS & Public CDN Delivery:**
   - **Production:** Media files are served from Cloudflare R2 (`STORAGE_PUBLIC_URL_BASE = https://storage.kvik.kz`). The browser loads them directly via standard `<img crossOrigin="anonymous">`, `<audio>`, and `<video>` tags.
   - **Local Development:** When `STORAGE_DRIVER="local"`, backend serves files from `http://localhost:4000/storage/...`. If browser blocks cross-origin media requests, requests are routed through `/api/storage/*` proxying to `${BACKEND_URL}/storage/*`.

---

## 3. Component & Folder Structure (Modularity <= 400 Lines)

To maintain clean separation of concerns and adhere strictly to the rule of **no file exceeding 400 lines**, the media system is organized into dedicated sub-directories:

```
kvik/
├── app/api/[...proxy]/route.ts             # [MODIFY] Strip content-length, support 50MB buffers
├── lib/api/
│   └── conversations.ts                   # [MODIFY] Add media interfaces & upload/gallery methods
├── hooks/
│   ├── useConversations.ts                # [MODIFY] Support media payloads & optimistic updates
│   ├── useAudioRecorder.ts                # [NEW] Browser MediaRecorder capture & duration timer
│   └── useMediaGallery.ts                 # [NEW] SWR hook for GET /conversations/:id/media
├── components/dashboard/inbox/
│   ├── MessageBubble.tsx                  # [MODIFY] Delegate media rendering to media/* components
│   ├── ConversationThread.tsx             # [MODIFY] Add Media Gallery drawer toggle in header
│   ├── ManagerComposer.tsx                # [MODIFY] Integrate voice recording bar & attachment staging
│   ├── media/
│   │   ├── VoiceMessagePlayer.tsx         # [NEW] Waveform player, scrubbing, Deepgram transcript
│   │   ├── ImageAttachment.tsx            # [NEW] Click-to-zoom thumbnail with loading skeleton
│   │   ├── VideoAttachment.tsx            # [NEW] HTML5 video preview with inline playback
│   │   ├── DocumentAttachment.tsx         # [NEW] Document card with file icon, size, download CTA
│   │   └── MediaLightboxModal.tsx         # [NEW] Fullscreen image/video lightbox with zoom & download
│   ├── composer/
│   │   ├── VoiceRecordingBar.tsx          # [NEW] Recording controls (timer, pulsing indicator, cancel/send)
│   │   ├── AttachmentPicker.tsx           # [NEW] Paperclip trigger, MIME/size validation
│   │   └── PendingMediaPreview.tsx        # [NEW] Staged upload thumbnail, progress bar, caption input
│   └── gallery/
│       ├── MediaGallerySheet.tsx          # [NEW] Radix Sheet drawer for conversation media files
│       ├── MediaGalleryItem.tsx           # [NEW] Thumbnail card with timestamp & sender info
│       └── MediaGalleryFilterTabs.tsx     # [NEW] Segmented tabs (All, Photos, Voice, Videos, Docs)
└── locales/
    └── translation_keys_new.json          # [MODIFY] Register all Russian UI translation keys
```

---

## 4. Feature Specifications

### Feature 1 — Inbound Voice Message Player with Deepgram Transcript

**What:** Render customer voice notes with an interactive audio player, duration display, scrubbing, and an expandable bilingual Deepgram transcript accordion.

**Where:** `components/dashboard/inbox/media/VoiceMessagePlayer.tsx` integrated into `MessageBubble.tsx`.

**UI & Interaction Spec:**
- **Player Controls:** Play / Pause toggle with MoonAI violet accent (`#7C3AED`), current playback time + total duration formatted as `mm:ss` (e.g., `00:14 / 00:32`), and a scrubber slider (`<input type="range">` or styled SVG waveform).
- **Speed Toggle:** Quick button cycle: `1.0x` → `1.5x` → `2.0x`.
- **Deepgram Transcript Accordion:**
  - If `metadata.transcription` is present, render a collapsible section below the waveform.
  - Header displays detected language badge: `RU` or `KZ` (`metadata.detectedLanguage`) with confidence percentage (e.g., `96%`).
  - Body displays the punctuated, formatted transcript text.
  - If `transcriptionConfidence < 0.40` or audio was inaudible, show an amber hint: *"Низкая четкость записи"* (Low audio clarity).
- **Audio Singleton:** Use a shared audio manager so playing one voice note automatically pauses any other currently playing message.

---

### Feature 2 — Rich Media Message Bubbles (Images, Videos, Documents)

**What:** Render photos, videos, and document attachments received from leads or sent by specialists.

**Where:** `components/dashboard/inbox/media/` (`ImageAttachment.tsx`, `VideoAttachment.tsx`, `DocumentAttachment.tsx`, `MediaLightboxModal.tsx`).

**UI & Interaction Spec:**
- **Image Attachments (`IMAGE`):**
  - Render a crisp thumbnail (max height 260px, rounded-xl) with `object-cover`.
  - Display subtle hover overlay with expand icon. Clicking opens `MediaLightboxModal`.
  - If caption/text is present, render caption below the image inside the bubble.
  - Include fallback skeleton while loading and error placeholder if image fails to load.
- **Video Attachments (`VIDEO`):**
  - Render an HTML5 `<video>` element with custom play overlay or native controls.
  - Max dimensions constrained to bubble width; shows video duration and file size tag.
- **Document Attachments (`DOCUMENT`):**
  - Render a clean horizontal card: document icon by extension (`.pdf` → red badge, `.xlsx`/`.xls` → green, `.docx` → blue, other → slate).
  - Show original `fileName` (truncated with ellipsis if > 28 chars) and formatted `fileSize` (e.g., `1.8 МБ`).
  - Direct download icon button opening `mediaUrl` in a new tab with `download` attribute.

---

### Feature 3 — Browser Voice Recording in Manager Composer

**What:** Allow specialists to record voice memos in their browser and send them directly to WhatsApp, Telegram, or Instagram leads.

**Where:** `components/dashboard/inbox/composer/VoiceRecordingBar.tsx` and `hooks/useAudioRecorder.ts`.

**UI & Interaction Spec:**
- **Trigger:** Microphone button (`Mic` icon) in `ManagerComposer` next to the send button.
- **Recording Mode:**
  - Input field is replaced by `VoiceRecordingBar`.
  - Pulsing red dot with live elapsed timer (`00:01`, `00:02`...).
  - Dynamic audio level meter (via Web Audio `AnalyserNode`) showing live volume spikes.
  - **Cancel Button (Trash icon):** Discards the recording and releases the microphone stream without sending.
  - **Send Button (Check / Send icon):** Stops recording, exports `audio/webm` or `audio/ogg` Blob, uploads to `POST /conversations/:id/media/upload`, and dispatches message with `mediaType: "AUDIO"`.
- **Browser Compatibility:**
  - Test MIME support hierarchy: `audio/webm;codecs=opus` → `audio/webm` → `audio/ogg;codecs=opus` → `audio/mp4` → default browser audio.
  - Request permission via `navigator.mediaDevices.getUserMedia({ audio: true })`.
  - If user denies permission, show a helpful toast: *"Разрешите доступ к микрофону в настройках браузера"*.

---

### Feature 4 — Outbound File Attachment Picker & Staging

**What:** Allow specialists to attach photos, videos, and documents to outbound messages with an optional text caption.

**Where:** `components/dashboard/inbox/composer/AttachmentPicker.tsx` and `PendingMediaPreview.tsx`.

**UI & Interaction Spec:**
- **Attachment Trigger:** Paperclip icon button (`Paperclip`) in composer toolbar.
- **Supported File Types & Limits (Enforced Client-Side):**
  - Images (`image/jpeg`, `image/png`, `image/webp`, `image/heic`): Max 10MB.
  - Audio (`audio/*`): Max 25MB.
  - Video (`video/mp4`, `video/quicktime`): Max 50MB.
  - Documents (`application/pdf`, `.docx`, `.xlsx`, `.txt`): Max 25MB.
- **Drag & Drop:** Support dropping files directly onto the composer box.
- **Staging Preview Card (`PendingMediaPreview`):**
  - Above the text input, show a staged media card: thumbnail (for images/videos) or file icon + name + size (for documents).
  - Close button (`X`) to remove the attachment before sending.
  - While uploading, show an animated indeterminate progress bar.
  - The text input remains active for typing an optional **caption**.
  - Clicking Send sends both the media item and the caption in one unified request.

---

### Feature 5 — Conversation Media Gallery Drawer (Slide-Over Sheet)

**What:** A slide-over panel displaying all historical media files exchanged in the conversation, categorized into tabs.

**Where:** `components/dashboard/inbox/gallery/MediaGallerySheet.tsx` using Radix `Sheet`.

**UI & Interaction Spec:**
- **Entry Point:** "Медиа" (Media) button with an image/folder icon in the thread header.
- **Layout:** Slide-over from right (`SheetContent side="right"`), width 420px.
- **Category Tabs (`SegmentedTabs`):**
  - `Все` (All)
  - `Фото` (Photos — `IMAGE`)
  - `Голосовые` (Voice — `AUDIO`)
  - `Видео` (Video — `VIDEO`)
  - `Файлы` (Files — `DOCUMENT`)
- **Grid / List View:**
  - Photos/Videos in 3-column thumbnail grid with click-to-lightbox.
  - Audio and documents in clean chronological list with sender name (`Клиент` / `Менеджер`), duration/filesize, and date.
- **Empty State:** Clean minimalist empty message when no files exist for the selected category.

---

### Feature 6 — Real-Time Synchronization & Optimistic UI

**What:** Maintain instantaneous responsiveness when sending media and live synchronization across multiple dashboard sessions.

**Where:** `hooks/useConversations.ts` and `hooks/useInboxRealtime.ts`.

**UI & Interaction Spec:**
- **Optimistic Outbound Messages:** When specialist sends a voice memo or photo, immediately insert a local message into SWR cache (`temp-${Date.now()}`) with status "sending", so the bubble appears instantly.
- **Socket Ingestion (`message.new`):** When inbound or outbound `message.new` arrives with `metadata.mediaType`, SWR cache replaces optimistic message or appends new message seamlessly.
- **Inbox List Preview:** Conversation list item displays rich media preview icon and text (e.g., `🎤 Голосовое сообщение (0:15)` or `📷 Фото: ...`).

---

## 5. TypeScript API Contracts & DTOs

### 5.1 Updates to `lib/api/conversations.ts`

```ts
export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';

export interface MessageMediaMetadata {
  mediaType?: MediaType;
  mediaUrl?: string;
  fileKey?: string;
  mimeType?: string;
  fileSize?: number;
  fileName?: string;
  durationSeconds?: number;
  
  // Voice STT Specific (Inbound)
  isVoice?: boolean;
  transcription?: string;
  transcriptionConfidence?: number;
  detectedLanguage?: 'ru' | 'kk' | 'en' | string;
  transcriptionDurationMs?: number;
  transcriptionError?: string;
  
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

export interface UploadMediaResponse {
  mediaUrl: string;
  mediaType: MediaType;
  mimeType: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  durationSeconds?: number;
}

export interface MediaItemDto {
  messageId: string;
  role: 'USER' | 'MANAGER' | 'BOT';
  senderName?: string;
  mediaType: MediaType;
  mediaUrl: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  caption?: string;
  durationSeconds?: number;
  transcription?: string;
  detectedLanguage?: string;
  createdAt: string;
}

export interface PaginatedMediaResponse {
  data: MediaItemDto[];
  total: number;
  page: number;
  limit: number;
}
```

### 5.2 API Client Methods

```ts
export const conversationsApi = {
  // ... existing methods

  uploadMedia: async (
    conversationId: string,
    file: File | Blob,
    mediaType?: MediaType,
    durationSeconds?: number
  ): Promise<UploadMediaResponse> => {
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : 'recording.webm');
    if (mediaType) formData.append('mediaType', mediaType);
    if (durationSeconds !== undefined) formData.append('durationSeconds', String(durationSeconds));

    const { data } = await apiClient.post<UploadMediaResponse>(
      `/conversations/${conversationId}/media/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return data;
  },

  sendMessage: async (
    id: string,
    payload: string | SendManagerMessageDto
  ): Promise<MessageDto> => {
    const body = typeof payload === 'string' ? { content: payload } : payload;
    const { data } = await apiClient.post<MessageDto>(`/conversations/${id}/messages`, body);
    return data;
  },

  getMediaGallery: async (
    id: string,
    params?: { type?: MediaType; page?: number; limit?: number }
  ): Promise<PaginatedMediaResponse> => {
    const { data } = await apiClient.get<PaginatedMediaResponse>(
      `/conversations/${id}/media`,
      { params }
    );
    return data;
  },
};
```

---

## 6. Edge Cases & Defensive Engineering Matrix

| Edge Case / Failure Scenario | Risk | Frontend Prevention & Mitigation Strategy |
|---|---|---|
| **Microphone permission blocked/denied** | Audio recorder crashes or hangs indefinitely | Wrap `getUserMedia` in try-catch. If `NotAllowedError` or `NotFoundError`, show clear toast: *"Доступ к микрофону заблокирован в настройках браузера"*. Keep text input visible. |
| **Unsupported audio container in Safari/iOS** | Voice recording fails or recorded audio cannot be uploaded | Provide mimeType fallback chain in `useAudioRecorder`: check `MediaRecorder.isTypeSupported` starting from `audio/webm;codecs=opus`, falling back to `audio/mp4` or generic `audio/aac`. |
| **File exceeds backend limit (>50MB video, >10MB photo)** | Backend returns 413, wasting bandwidth and time | Pre-validate file size in `AttachmentPicker` before upload starts. Show immediate warning toast with permitted limits. |
| **Specialist takeover lock (403 during media upload or send)** | Another specialist claimed dialog while user was recording or uploading | Backend returns 403 `conversations.taken_over_by_other`. Composer catches 403, keeps draft safely intact, shows locked banner, and cancels in-flight upload. |
| **Inaudible voice note / Low Deepgram confidence (<0.40)** | Transcript text is empty or garbled | Check `metadata.transcription`. If empty or flagged as unconfident, render audio player with subtitle: *"Не удалось распознать текст"* and preserve full audio playback. |
| **Bilingual Kazakh/Russian voice note** | Manager doesn't know what language was detected | Render language tag pill (`KZ` or `RU`) with confidence next to the transcription header so specialist has full linguistic context. |
| **Broken / expired media link (404 CDN)** | Broken image icon or broken video player in chat history | Add `onError` handlers to `<img>` and `<video>` tags to replace broken elements with a graceful fallback chip: *"Файл недоступен"*. |
| **Simultaneous playback collision** | User clicks play on multiple voice notes at once, causing audio chaos | Implement a module-level `activeAudioElement` singleton. Calling `.play()` on any voice player automatically calls `.pause()` on the currently playing one. |
| **Network disconnect during 40MB file upload** | Upload hangs or leaves composer disabled | Support `AbortController` in `conversationsApi.uploadMedia`. Allow user to click Cancel to abort the network request and retry. |
| **Zero hardcoded Russian text** | Build check or i18n linter failure | All strings sourced strictly through `useTranslations('dashboard.inbox')`. Added to `translation_keys_new.json` and merged via scripts. |

---

## 7. Translation Keys Specification

The following keys will be registered in `locales/translation_keys_new.json` under `dashboard.inbox.*`:

```json
{
  "dashboard.inbox.media_tab_all": "Все",
  "dashboard.inbox.media_tab_photos": "Фото",
  "dashboard.inbox.media_tab_voice": "Голосовые",
  "dashboard.inbox.media_tab_videos": "Видео",
  "dashboard.inbox.media_tab_files": "Файлы",
  "dashboard.inbox.media_gallery_title": "Медиафайлы диалога",
  "dashboard.inbox.media_gallery_empty": "Нет файлов в этой категории",
  "dashboard.inbox.voice_transcription_title": "Транскрипция",
  "dashboard.inbox.voice_transcription_empty": "Не удалось распознать текст",
  "dashboard.inbox.voice_transcription_lang_ru": "Русский",
  "dashboard.inbox.voice_transcription_lang_kk": "Казахский",
  "dashboard.inbox.voice_recording": "Запись голосового сообщения...",
  "dashboard.inbox.voice_cancel": "Отменить запись",
  "dashboard.inbox.voice_send": "Отправить аудио",
  "dashboard.inbox.voice_mic_denied": "Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.",
  "dashboard.inbox.voice_mic_unsupported": "Запись аудио не поддерживается в этом браузере",
  "dashboard.inbox.attach_file": "Прикрепить файл",
  "dashboard.inbox.attach_file_too_large": "Размер файла превышает допустимый лимит",
  "dashboard.inbox.attach_unsupported_format": "Неподдерживаемый формат файла",
  "dashboard.inbox.uploading_media": "Загрузка файла...",
  "dashboard.inbox.caption_placeholder": "Добавьте подпись к файлу...",
  "dashboard.inbox.download_file": "Скачать",
  "dashboard.inbox.media_unavailable": "Медиафайл недоступен"
}
```

---

## 8. Implementation Checklist

### 📦 1. API & Types Layer
- [x] Extend `lib/api/conversations.ts` with `MediaType`, `MessageMediaMetadata`, `SendManagerMessageDto`, `UploadMediaResponse`, `MediaItemDto`, and `PaginatedMediaResponse`.
- [x] Add `conversationsApi.uploadMedia(id, file, mediaType, duration)` with `multipart/form-data`.
- [x] Update `conversationsApi.sendMessage(id, payload)` to accept `string | SendManagerMessageDto`.
- [x] Add `conversationsApi.getMediaGallery(id, params)` for retrieving shared files.
- [x] Update `useConversationMessages` hook in `hooks/useConversations.ts` to support media sending and optimistic rendering with media metadata.

### 🔌 2. Proxy & Upload Pipeline Hardening
- [x] Verify `app/api/[...proxy]/route.ts` deletes `content-length` from forwarded request headers for `arrayBuffer` multipart requests.
- [x] Set `export const dynamic = 'force-dynamic'` and `export const maxDuration = 60` in `app/api/[...proxy]/route.ts`.
- [x] Ensure public CDN and local development storage URLs resolve cleanly without CORS blocks.

### 🔊 3. Audio & Media Display Primitives
- [x] Create `components/dashboard/inbox/media/VoiceMessagePlayer.tsx`:
  - [x] Waveform / progress scrub bar.
  - [x] Play / Pause controls with duration timestamps (`00:00`).
  - [x] Playback speed toggles (`1x`, `1.5x`, `2x`).
  - [x] Collapsible Deepgram transcript accordion with `RU`/`KK` language badge and confidence score.
  - [x] Global single-audio playback coordinator.
- [x] Create `components/dashboard/inbox/media/ImageAttachment.tsx`:
  - [x] Aspect-ratio thumbnail with skeleton loader.
  - [x] Hover zoom overlay and click-to-expand trigger.
- [x] Create `components/dashboard/inbox/media/VideoAttachment.tsx`:
  - [x] HTML5 video player with preview controls and file size badge.
- [x] Create `components/dashboard/inbox/media/DocumentAttachment.tsx`:
  - [x] File type icon, filename truncation, formatted size (`tabular-nums`), and direct download link.
- [x] Create `components/dashboard/inbox/media/MediaLightboxModal.tsx`:
  - [x] Radix Dialog lightbox for high-res photo/video viewing and download.
- [x] Update `components/dashboard/inbox/MessageBubble.tsx`:
  - [x] Detect `message.metadata.mediaType` and delegate to respective media component.
  - [x] Render caption below media if present.

### 🎙️ 4. Composer Voice Recording & Outbound Staging
- [x] Create `hooks/useAudioRecorder.ts`:
  - [x] Safe `getUserMedia` stream handling with MIME type detection.
  - [x] Live elapsed timer and audio analyser volume metering.
  - [x] Blob generation and stream cleanup.
- [x] Create `components/dashboard/inbox/composer/VoiceRecordingBar.tsx`:
  - [x] Live recording timer, pulsing red indicator, volume meter.
  - [x] Discard / Cancel button (trash icon).
  - [x] Stop & Send button.
- [x] Create `components/dashboard/inbox/composer/AttachmentPicker.tsx`:
  - [x] Paperclip icon button triggering hidden `<input type="file">`.
  - [x] Client-side validation: 10MB (image), 25MB (audio/doc), 50MB (video).
- [x] Create `components/dashboard/inbox/composer/PendingMediaPreview.tsx`:
  - [x] Attached media preview card with remove (`X`) button.
  - [x] Upload progress indicator.
  - [x] Optional caption input field.
- [x] Update `components/dashboard/inbox/ManagerComposer.tsx`:
  - [x] Integrate voice recording toggle and media attachment staging.
  - [x] Support sending caption + media in a single outbound request.
  - [x] Catch 403 `conversations.taken_over_by_other` gracefully during upload.

### 🗂️ 5. Media Gallery Drawer (Slide-Over Sheet)
- [x] Create `hooks/useMediaGallery.ts`:
  - [x] SWR hook for `GET /conversations/:id/media` supporting category filtering.
- [x] Create `components/dashboard/inbox/gallery/MediaGallerySheet.tsx`:
  - [x] Radix `Sheet` sliding from right.
  - [x] Category tabs (`All`, `Photos`, `Voice`, `Videos`, `Docs`).
  - [x] Media grid / list with sender name, timestamp, and download actions.
- [x] Update `components/dashboard/inbox/ConversationThread.tsx`:
  - [x] Add "Медиа" button in header next to `TakeoverControl`.

### ⚡ 6. Real-Time Socket & Optimistic UI
- [x] Ensure `hooks/useInboxRealtime.ts` preserves `message.metadata` when appending incoming `message.new` events.
- [x] Verify `ConversationListItem.tsx` displays preview snippets with emoji icons (`🎤`, `📷`, `📄`, `🎥`) properly.

### 🌍 7. Localization & Translation Verification
- [x] Add all new keys to `locales/translation_keys_new.json`.
- [x] Run `node scripts/apply-translation-keys.mjs`.
- [x] Run `node scripts/export-translation-keys.mjs`.
- [x] Verify zero hardcoded Russian strings in any TSX file.

### 🧪 8. Build & Quality Verification
- [x] Run `npm run build` or `next lint` to guarantee zero TypeScript errors.
- [x] Verify file line counts remain strictly <= 400 lines per file.
