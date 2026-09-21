# 053 — Voice Message Processing (Deepgram) & Outbound Media Pipeline

> **Document Type:** System Architecture & Technical Implementation Blueprint  
> **Target Audience:** Backend Engineers, AI/Prompt Engineers, Fullstack Frontend Developers  
> **Status:** 📋 Design & Implementation Plan  
> **Target Modules:** `src/modules/ai-engine/`, `src/modules/channels/`, `src/modules/conversations/`, `src/modules/storage/`  
> **Related Docs:** `052_HUMAN_ESCALATION_AND_NOTIFICATIONS_PLAN.md`, `034_AI_ENGINE_DOMAIN_SPEC.md`, `033_UNIFIED_INBOX_DOMAIN_SPEC.md`, `029_CHANNEL_MESSAGING_ADAPTERS_FOUNDATION_PLAN.md`

---

## 1. Executive Summary & Core Objectives

Voice messaging and rich media sharing are critical for customer engagement across WhatsApp, Instagram, and Telegram in service-oriented businesses (beauty salons, dental clinics, fitness clubs, auto service, consulting). In Kazakhstan and CIS markets:
- **Over 40% of leads** send voice messages instead of typing text.
- Many voice messages feature **bilingual speech / code-switching** between Russian (`ru`) and Kazakh (`kk`) in the same voice note (e.g., *"Сәлеметсіз бе, подскажите ертеңге стрижкаға бос уақыт бар ма?"*).
- Business specialists and managers must send **photos** (treatment results, hair color examples, interior photos), **documents** (price lists, prep guidelines, contracts), **videos** (procedure explainers), and **voice notes** directly from the web dashboard.

This specification details:
1. **Autonomous Inbound Voice Processing:** Fast, highly accurate speech-to-text (STT) using **Deepgram Nova-3**, automatically transcribing Russian and Kazakh audio, then feeding the transcript into the Gemini 3.1 Flash Lite autonomous conversation loop.
2. **Outbound Multi-Media Pipeline:** Comprehensive system enabling staff to upload, preview, and dispatch photos, voice recordings, videos, and documents across WhatsApp Cloud API, Telegram Bot API, and Instagram Graph API with takeover lock enforcement.
3. **Frontend API Reference & Integration Guide:** A complete, self-contained reference at the bottom of this document for frontend developers to implement rich chat bubbles, media uploads, voice recording, and media galleries.

```
═══════════════════════════════════════════════════════════════════════════════════════════════════
                                    INBOUND VOICE PIPELINE
═══════════════════════════════════════════════════════════════════════════════════════════════════

 Lead Voice Note (WhatsApp / Telegram / Instagram)
        │
        ▼
 Webhook Controller (Validates signature, extracts media ID / download URL)
        │
        ▼
 Channel Adapter (Downloads binary audio stream: OGG/Opus, MP3, AAC, M4A)
        │
        ├─► Persist original audio to Storage (Cloudflare R2 / Local Disk)
        │
        ▼
 Deepgram Nova-3 API (Multilingual STT, detect_language=true, smart_format=true)
        │
        ├─► Transcribed Text (e.g., "Сәлеметсіз бе, хочу записаться на завтра в 14:00")
        ├─► Detected Language ("ru" / "kk"), Confidence, Duration
        │
        ▼
 Conversations Repository (Persists USER Message with audio metadata + transcript)
        │
        ▼
 AI Orchestrator (BOT_ACTIVE) ────────────► Gemini 3.1 Flash Lite (RAG + Booking Tools)
        │                                         │
        ▼                                         ▼
 Socket.IO Dashboard Broadcast           Dispatches AI response back to Lead via Channel

═══════════════════════════════════════════════════════════════════════════════════════════════════
                                    OUTBOUND MEDIA PIPELINE
═══════════════════════════════════════════════════════════════════════════════════════════════════

 Staff in Dashboard (Records voice memo or attaches Photo / Video / PDF document)
        │
        ▼
 POST /conversations/:id/media/upload (Multipart upload, magic-byte validation, R2 storage)
        │
        ├─► Returns { mediaUrl, mediaType, mimeType, fileKey, fileName, size }
        │
        ▼
 POST /conversations/:id/messages (Sends message with takeover lock verification)
        │
        ▼
 Channel Dispatcher (Routes payload based on channel type):
        ├── WhatsApp Cloud API: { type: "image"|"audio"|"video"|"document", link, caption }
        ├── Telegram Bot API:   /sendPhoto, /sendVoice, /sendVideo, /sendDocument
        └── Instagram Graph API: { message: { attachment: { type, payload: { url } } } }
        │
        ▼
 Persist MANAGER Message + Broadcast real-time `message.new` to all staff via WebSocket
```

---

## 2. Why We Must Persist Text & Media Locally (Platform Limitations)

A common architectural question is: *Can we avoid storing messages and media files on our own servers and instead fetch past history and media on-demand from Meta or Telegram APIs?*

**Answer:** **No. We MUST store all messages in our PostgreSQL database and all media files in our storage (Cloudflare R2 / S3 / Local Disk).**

Here is why:

### 2.1 WhatsApp Cloud API (Meta)
1. **No Chat History Retrieval:** Meta WhatsApp Cloud API does **NOT** provide a `GET /messages` or conversation history endpoint. Messages are pushed via webhook events **once** in real time. If our backend does not persist the webhook payload into PostgreSQL immediately, that message is permanently lost.
2. **Ephemeral Media URLs:** When a lead sends a voice note, photo, or document, Meta provides a temporary `media_id`. The download URL returned by `GET https://graph.facebook.com/v21.0/{media_id}` is signed and **expires within a few hours**. If we do not download and store the media file in R2 immediately upon webhook arrival, the file becomes a broken 404 link when a manager opens the chat later.

### 2.2 Telegram Bot API
1. **No Bot Message History:** The Telegram Bot API **does not store or provide chat history to bots**. The MTProto client API used by user accounts has history, but official Bot tokens only receive webhook updates or `getUpdates`. Once an update is acknowledged, Telegram never serves it again.
2. **Temporary File Paths:** Download links obtained via `getFile` (`https://api.telegram.org/file/bot...`) are temporary and will stop working if the user clears chat history or after token expiration.

### 2.3 Instagram Graph API (Direct Messages)
1. **Signed Ephemeral CDNs:** Instagram attachment URLs (`lookaside.fbsbx.com` / `scontent.cdninstagram.com`) are signature-gated and expire after a short duration.
2. **Rate Limits & Latency:** Querying threads on-the-fly via Graph API is heavily rate-limited and introduces 800ms–2000ms latency per page.

### 2.4 AI Engine & Unified Inbox Requirements
- **Sub-Second AI Responses:** The Gemini 3.1 Flash Lite orchestrator requires the last 20 messages in <30ms to generate timely replies. Local database queries make this instantaneous.
- **Unified Full-Text Search & Analytics:** Searching customer history across channels, extracting sales insights, generating weekly reports, and building RAG embeddings require our own structured PostgreSQL database.

---

## 3. Deepgram Speech-to-Text Integration (Inbound Voice Pipeline)

### 3.1 Model Selection & Language Strategy

We integrate Deepgram's latest generation model — **Nova-3** (`model=nova-3`), which provides the lowest Word Error Rate (WER) on noisy, conversational voice notes and native support for low-bitrate audio codecs (OGG Opus, AMR, AAC).

| Parameter | Value | Rationale |
|---|---|---|
| **Model** | `nova-3` | Deepgram's most accurate model for conversational audio and noise resilience. |
| **Language Detection** | `detect_language=true` | Automatically identifies Russian (`ru`), Kazakh (`kk`), or English (`en`) without hardcoded language assumptions. |
| **Formatting** | `smart_format=true` | Automatically formats numbers, times (*"в 3 часа"* → *"в 15:00"*), currency, and dates. |
| **Punctuation** | `punctuate=true` | Adds commas, question marks, and sentence stops for clean LLM ingestion. |
| **Filler Words** | `filler_words=false` | Filters out filler sounds (*"эээ"*, *"нуу"*) to keep prompt context clean. |
| **Encoding / Container** | Auto-detected / Raw Binary Stream | Deepgram container parser handles OGG, OGA, MP3, WAV, WebM, MP4/AAC directly. |

### 3.2 Deepgram API Interaction Contract

We use direct HTTP/2 POST requests with streaming binary buffer payloads to `https://api.deepgram.com/v1/listen`. This avoids writing temp files to disk before transcription and reduces latency to under **600ms**.

#### Request Specification:
```http
POST https://api.deepgram.com/v1/listen?model=nova-3&detect_language=true&smart_format=true&punctuate=true HTTP/1.1
Host: api.deepgram.com
Authorization: Token <DEEPGRAM_API_KEY>
Content-Type: audio/ogg
Content-Length: <audio_buffer_length>

<binary_audio_data>
```

#### Response Structure:
```json
{
  "metadata": {
    "request_id": "a9b1c2d3-e4f5-6789-0123-abcdef456789",
    "duration": 6.84,
    "channels": 1,
    "models": ["nova-3"]
  },
  "results": {
    "channels": [
      {
        "detected_language": "ru",
        "language_confidence": 0.98,
        "alternatives": [
          {
            "transcript": "Здравствуйте! Подскажите, пожалуйста, сколько стоит комплексная чистка лица и есть ли свободное время на пятницу?",
            "confidence": 0.965,
            "words": [
              { "word": "здравствуйте", "start": 0.12, "end": 0.85, "confidence": 0.99 },
              { "word": "подскажите", "start": 0.92, "end": 1.45, "confidence": 0.98 }
            ]
          }
        ]
      }
    ]
  }
}
```

### 3.3 Channel-by-Channel Audio Download Implementation

#### 1. WhatsApp Cloud API (Meta)
1. Inbound webhook arrives with `msg.type === 'audio'`, containing `msg.audio.id` and `msg.audio.mime_type` (typically `audio/ogg; codecs=opus`).
2. Backend queries Meta Graph API:  
   `GET https://graph.facebook.com/v21.0/{msg.audio.id}` with `Authorization: Bearer <accessToken>`.
3. Meta returns a temporary media download URL: `{ "url": "https://lookaside.fbsbx.com/...", "mime_type": "...", "file_size": 45120 }`.
4. Backend downloads the audio bytes via `GET <url>` with the Meta Bearer token.
5. Saves the audio to `StorageService` (`workspaces/{workspaceId}/media/inbound/{uuid}.ogg`).
6. Sends audio buffer to `DeepgramService.transcribe(buffer, mimeType)`.

#### 2. Telegram Bot API
1. Inbound webhook update contains `msg.voice` (for PTT voice notes) or `msg.audio` (for audio files), with `file_id`.
2. Backend queries: `GET https://api.telegram.org/bot{botToken}/getFile?file_id={file_id}`.
3. Telegram returns `{ ok: true, result: { file_path: "voice/file_12.oga", file_size: 32000 } }`.
4. Backend downloads binary stream from `https://api.telegram.org/file/bot{botToken}/{file_path}`.
5. Saves to `StorageService` (`workspaces/{workspaceId}/media/inbound/{uuid}.oga`).
6. Sends audio buffer to `DeepgramService.transcribe(buffer, 'audio/ogg')`.

#### 3. Instagram Graph API (Messenger Platform for IG)
1. Inbound webhook provides `msg.attachments[0].type === 'audio'` with direct CDN link in `payload.url`.
2. Backend downloads the binary stream via HTTP GET.
3. Saves to `StorageService` (`workspaces/{workspaceId}/media/inbound/{uuid}.m4a`).
4. Sends audio buffer to `DeepgramService.transcribe(buffer, 'audio/mp4')`.

### 3.4 Transcription Failure & Edge Case Handling

| Scenario | Behavior | Response to Client |
|---|---|---|
| **High Confidence (> 0.60)** | Transcribed text replaces placeholder and is passed directly to AI Engine or Unified Inbox. | Normal AI booking/FAQ answer in the detected language (`ru` or `kk`). |
| **Low Confidence (< 0.40) or Inaudible / Empty Audio** | Audio saved, but transcription flagged as unconfident. | If `BOT_ACTIVE`, the bot replies politely: *"Кешіріңіз, дауыстық хабарлама анық естілмеді. Мәтінмен жаза аласыз ба?"* / *"Извините, не удалось разобрать голосовое сообщение. Пожалуйста, напишите текстом или отправьте запись еще раз."* |
| **Deepgram API Error / Timeout (> 5s)** | Fails gracefully. Message persisted as `🎤 [Голосовое сообщение]`. | Triggers `P2` escalation (`AI_RESPONSE_FAILURE`), alerts specialists via in-app notification to listen manually. |
| **Oversized Audio (> 25MB or > 10 min)** | Skipped from automated transcription. | Escalated to manager with trigger `MEDIA_ATTACHMENT`. |

---

## 4. Outbound Media Channel Dispatch Protocol

When human managers take over a conversation or reply directly, they can send rich media items.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SUPPORTED MEDIA TYPES                                  │
├───────────────┬───────────────────────────────┬────────────┬───────────────────────────┤
│ Media Type    │ Allowed MIME Types            │ Max Size   │ Supported Channels        │
├───────────────┼───────────────────────────────┼────────────┼───────────────────────────┤
│ IMAGE         │ image/jpeg, image/png,        │ 10 MB      │ WhatsApp, Instagram,      │
│               │ image/webp, image/heic        │            │ Telegram                  │
├───────────────┼───────────────────────────────┼────────────┼───────────────────────────┤
│ AUDIO (Voice) │ audio/ogg, audio/mpeg,        │ 25 MB      │ WhatsApp (as PTT voice),  │
│               │ audio/mp4, audio/webm,        │            │ Telegram (as voice note), │
│               │ audio/wav, audio/aac          │            │ Instagram (as voice clip) │
├───────────────┼───────────────────────────────┼────────────┼───────────────────────────┤
│ VIDEO         │ video/mp4, video/quicktime    │ 50 MB      │ WhatsApp, Telegram,       │
│               │                               │            │ Instagram                 │
├───────────────┼───────────────────────────────┼────────────┼───────────────────────────┤
│ DOCUMENT      │ application/pdf, .docx,       │ 25 MB      │ WhatsApp, Telegram,       │
│               │ application/vnd.ms-excel,     │            │ Instagram (as file)       │
│               │ text/plain                    │            │                           │
└───────────────┴───────────────────────────────┴────────────┴───────────────────────────┘
```

### 4.1 Channel Adapter Outbound Multi-Media Protocol

#### 1. WhatsApp Cloud API Dispatch
- **Image:**
  ```json
  {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "77011234567",
    "type": "image",
    "image": { "link": "https://cdn.kvik.kz/media/...", "caption": "Наши работы по окрашиванию" }
  }
  ```
- **Voice Message (PTT):**
  ```json
  {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "77011234567",
    "type": "audio",
    "audio": { "link": "https://cdn.kvik.kz/media/.../voice.ogg" }
  }
  ```
- **Document (PDF, Price List):**
  ```json
  {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "77011234567",
    "type": "document",
    "document": {
      "link": "https://cdn.kvik.kz/media/.../price_list.pdf",
      "caption": "Актуальный прайс-лист на 2026 год",
      "filename": "Прайс-лист_Kvik.pdf"
    }
  }
  ```
- **Video:**
  ```json
  {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "77011234567",
    "type": "video",
    "video": { "link": "https://cdn.kvik.kz/media/.../demo.mp4", "caption": "Видео-обзор процедуры" }
  }
  ```

#### 2. Telegram Bot API Dispatch
- **Photo:** `POST https://api.telegram.org/bot{token}/sendPhoto`  
  `{ "chat_id": "123456789", "photo": "https://cdn.kvik.kz/...", "caption": "Описание..." }`
- **Voice Note:** `POST https://api.telegram.org/bot{token}/sendVoice`  
  `{ "chat_id": "123456789", "voice": "https://cdn.kvik.kz/.../voice.ogg", "caption": "..." }`
- **Document:** `POST https://api.telegram.org/bot{token}/sendDocument`  
  `{ "chat_id": "123456789", "document": "https://cdn.kvik.kz/.../doc.pdf", "caption": "..." }`
- **Video:** `POST https://api.telegram.org/bot{token}/sendVideo`  
  `{ "chat_id": "123456789", "video": "https://cdn.kvik.kz/.../video.mp4", "caption": "..." }`

#### 3. Instagram Graph API Dispatch
- **Attachment Dispatch:** `POST https://graph.facebook.com/v21.0/{pageId}/messages`
  ```json
  {
    "recipient": { "id": "ig_scoped_user_id" },
    "message": {
      "attachment": {
        "type": "image", // "image" | "audio" | "video" | "file"
        "payload": {
          "url": "https://cdn.kvik.kz/media/...",
          "is_reusable": true
        }
      }
    }
  }
  ```

---

## 5. Database Schema & Message Metadata Specification

### 5.1 Prisma `Message.metadata` JSON Schema

`Message.metadata` in PostgreSQL holds the typed media payload:

```ts
export interface MessageMediaMetadata {
  mediaType?: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';
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
```

### 5.2 Snippet Generation for `Conversation.lastMessagePreview`

When a media message arrives or is sent, `Conversation.lastMessagePreview` is automatically formatted for the Inbox list:

| Message Type | Text Content Present? | Preview Output Example |
|---|---|---|
| **Text Only** | Yes | `"Здравствуйте, хочу записаться..."` |
| **Voice Note (Inbound)** | Auto-transcribed | `"🎤 Здравствуйте, подскажите цену..."` |
| **Voice Note (Outbound)** | No caption | `"🎤 Голосовое сообщение (0:15)"` |
| **Image** | With caption | `"📷 Фото: Наши работы по маникюру"` |
| **Image** | No caption | `"📷 Фотография"` |
| **Video** | With/without caption | `"🎥 Видео-обзор"` |
| **Document** | With filename | `"📄 Прайс-лист_2026.pdf"` |

---

## 6. Configuration & Environment Variables

```env
# ─── Deepgram Speech-to-Text ──────────────────────────────────────────────────
DEEPGRAM_API_KEY="dg_live_..."

# ─── Storage & CDN ────────────────────────────────────────────────────────────
# Local development writes to ./storage, Cloudflare R2 used in production
STORAGE_DRIVER="r2" # "local" | "r2"
STORAGE_PUBLIC_URL_BASE="https://storage.kvik.kz" # Base CDN URL for public attachment delivery to WhatsApp/Telegram

# Cloudflare R2 Credentials (already configured in StorageModule)
R2_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
R2_BUCKET="kvik-media-prod"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
```

---

## 7. Translation Keys Specification

Registered in `translation_keys_new.json`:

```json
{
  "conversations.media_uploaded": "Медиафайл успешно загружен",
  "conversations.content_or_media_required": "Необходимо указать текст сообщения или прикрепить файл",
  "conversations.voice_processing_failed": "Не удалось распознать голосовое сообщение",
  "conversations.unsupported_media_type": "Неподдерживаемый формат медиафайла",
  "conversations.media_size_exceeded": "Размер файла превышает допустимый лимит",
  "conversations.outbound_media_failed": "Не удалось доставить медиафайл клиенту",
  "conversations.media_gallery_loaded": "Список медиафайлов загружен",
  "ai_engine.voice_unintelligible_ru": "Извините, не удалось разобрать голосовое сообщение. Пожалуйста, напишите текстом или отправьте аудио еще раз.",
  "ai_engine.voice_unintelligible_kk": "Кешіріңіз, дауыстық хабарлама анық естілмеді. Өтініш, мәтінмен жаза аласыз ба?"
}
```

---

## 8. Implementation Roadmap & Checklist

- [x] **Phase 1: Deepgram Service & Audio Normalization**
  - Implement `DeepgramService` with `model=nova-3&detect_language=true&smart_format=true`.
  - Add binary audio streaming to avoid local disk writing.
  - Implement language fallbacks and confidence thresholding for Russian and Kazakh.
- [x] **Phase 2: Inbound Channel Adapters Audio Ingestion**
  - Update `WhatsAppMessagingAdapter` to fetch media bytes via Meta Graph API for `audio` messages.
  - Update `TelegramMessagingAdapter` to download voice notes via `bot.getFile`.
  - Update `InstagramMessagingAdapter` to download audio attachment streams.
  - Hook transcription output into `OrchestratorService.handleInboundMessage`.
- [x] **Phase 3: Storage & Public Media Upload Endpoint**
  - Implement `POST /conversations/:id/media/upload` using `@nestjs/platform-express` `FileInterceptor`.
  - Add MIME type and magic-bytes validator (images, audio, video, PDF/docs).
  - Generate public CDN URLs using `STORAGE_PUBLIC_URL_BASE`.
- [x] **Phase 4: Outbound Multi-Media Channel Dispatch**
  - Extend `WhatsAppMessagingAdapter.sendMediaMessage()` for `image`, `audio` (PTT), `video`, `document`.
  - Extend `TelegramMessagingAdapter.sendMediaMessage()` for `sendPhoto`, `sendVoice`, `sendVideo`, `sendDocument`.
  - Extend `InstagramMessagingAdapter.sendMediaMessage()` for attachment payloads.
  - Update `ConversationsService.sendMessage()` to validate media, enforce takeover locks, and broadcast real-time events.
- [x] **Phase 5: Media Gallery & History**
  - Implement `GET /conversations/:id/media` for viewing shared files.
  - Update `Conversation.lastMessagePreview` generator for rich media badges.

---
---

# 9. Frontend Developer Guide & REST / WebSocket API Reference

> **Notice for Frontend Developers:**  
> This section is the standalone specification for the web dashboard. All endpoints require `Authorization: Bearer <JWT_ACCESS_TOKEN>`.

---

### 9.1 REST Endpoints Reference

#### 1. `POST /conversations/:id/media/upload`
Uploads a media asset (photo, audio recording, video, or document) to cloud storage prior to sending.

- **URL:** `/conversations/:id/media/upload`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Roles:** `OWNER`, `ADMIN_MANAGER`, `SPECIALIST`

##### Multipart Form Fields:
| Field | Type | Required | Description |
|---|---|---|---|
| `file` | `Binary` | Yes | The file binary (Image, Audio, Video, PDF, DOCX). Max 50MB. |
| `mediaType` | `String` | No | `IMAGE` \| `AUDIO` \| `VIDEO` \| `DOCUMENT`. Auto-detected by MIME type if omitted. |
| `durationSeconds` | `Number` | No | Audio/video duration in seconds (computed client-side by browser recorder or video element). |

##### Success Response (`200 OK`):
```json
{
  "mediaUrl": "https://storage.kvik.kz/workspaces/8f3a2b10/conversations/4e9b8c7d/e2a1b4-voice.ogg",
  "mediaType": "AUDIO",
  "mimeType": "audio/ogg",
  "fileKey": "workspaces/8f3a2b10/conversations/4e9b8c7d/e2a1b4-voice.ogg",
  "fileName": "voice-recording-2026-09-20.ogg",
  "fileSize": 184520,
  "durationSeconds": 14.5
}
```

##### Error Responses:
- `400 Bad Request`:
  ```json
  { "code": "storage.invalid_file_type", "message": "Unsupported file format." }
  ```
- `413 Payload Too Large`:
  ```json
  { "code": "storage.file_too_large", "message": "File exceeds maximum permitted size of 50MB." }
  ```
- `403 Forbidden`:
  ```json
  { "code": "conversations.taken_over_by_other", "message": "This conversation has been taken over by another specialist. You cannot upload files here." }
  ```

---

#### 2. `POST /conversations/:id/messages`
Sends an outbound message. Supports **text-only**, **media-only**, or **media with caption**. Enforces specialist takeover lock.

- **URL:** `/conversations/:id/messages`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Roles:** `OWNER`, `ADMIN_MANAGER`, `SPECIALIST`

##### Request Body (`SendManagerMessageDto`):
```json
{
  "content": "Здравствуйте! Вот наш актуальный прайс-лист на 2026 год:",
  "mediaUrl": "https://storage.kvik.kz/workspaces/8f3a2b10/conversations/4e9b8c7d/e2a1b4-price.pdf",
  "mediaType": "DOCUMENT",
  "fileName": "Прайс-лист_Kvik_2026.pdf",
  "mimeType": "application/pdf",
  "fileSize": 1048576,
  "durationSeconds": null
}
```

> **Sending Voice Notes:** If sending an audio voice note recorded in the browser, pass `mediaType: "AUDIO"`, `mediaUrl: "..."`, and `durationSeconds: 15`. If `content` is omitted, the backend automatically generates the fallback preview string: `🎤 Голосовое сообщение (0:15)`.

##### Success Response (`201 Created`):
```json
{
  "id": "msg-8f92a1b0-4c3e-4e89-b1d2-0a9b8c7d6e5f",
  "conversationId": "4e9b8c7d",
  "role": "MANAGER",
  "senderStaffId": "staff-uuid-123",
  "content": "Здравствуйте! Вот наш актуальный прайс-лист на 2026 год:",
  "externalMessageId": "wamid.HBgLM...",
  "metadata": {
    "mediaType": "DOCUMENT",
    "mediaUrl": "https://storage.kvik.kz/workspaces/8f3a2b10/conversations/4e9b8c7d/e2a1b4-price.pdf",
    "fileName": "Прайс-лист_Kvik_2026.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1048576,
    "fileKey": "workspaces/8f3a2b10/conversations/4e9b8c7d/e2a1b4-price.pdf"
  },
  "createdAt": "2026-09-20T10:15:30.000Z"
}
```

##### Error Responses:
- `400 Bad Request`:
  ```json
  { "code": "conversations.content_or_media_required", "message": "Either text content or a media attachment must be provided." }
  ```
- `403 Forbidden` (Another specialist has taken over):
  ```json
  { "code": "conversations.taken_over_by_other", "message": "This conversation has been taken over by another specialist. You cannot send messages here." }
  ```
- `502 Bad Gateway` (Channel dispatch failed):
  ```json
  { "code": "conversations.send_failed", "message": "Failed to dispatch outbound media to WhatsApp Cloud API." }
  ```

---

#### 3. `GET /conversations/:id/media`
Retrieves a paginated list of all media items (photos, voice notes, videos, documents) shared in a conversation (both inbound from the client and outbound from staff).

- **URL:** `/conversations/:id/media`
- **Method:** `GET`
- **Query Params:**
  - `type`: `IMAGE` \| `AUDIO` \| `VIDEO` \| `DOCUMENT` (Optional filter)
  - `page`: `number` (Default: `1`)
  - `limit`: `number` (Default: `30`, Max: `100`)

##### Success Response (`200 OK`):
```json
{
  "data": [
    {
      "messageId": "msg-uuid-1",
      "role": "USER",
      "senderName": "Айгерим",
      "mediaType": "IMAGE",
      "mediaUrl": "https://storage.kvik.kz/workspaces/.../photo_1.jpg",
      "fileName": "photo_1.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 2048500,
      "caption": "Хочу такой оттенок волос",
      "createdAt": "2026-09-20T09:30:00.000Z"
    },
    {
      "messageId": "msg-uuid-2",
      "role": "USER",
      "senderName": "Айгерим",
      "mediaType": "AUDIO",
      "mediaUrl": "https://storage.kvik.kz/workspaces/.../voice_1.ogg",
      "durationSeconds": 18.2,
      "transcription": "Сәлеметсіз бе, подскажите есть ли свободное время на пятницу?",
      "detectedLanguage": "kk",
      "caption": "🎤 Сәлеметсіз бе, подскажите есть ли свободное время на пятницу?",
      "createdAt": "2026-09-20T09:31:00.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 30
}
```

---

### 9.2 Real-Time WebSocket Events (Socket.IO)

**Namespace:** `/conversations`  
Connect with `Authorization: Bearer <token>` or token query param.

#### Event: `message.new`
Fired when any new message is received from a lead or sent by a specialist/bot.

```ts
socket.on('message.new', (payload: {
  conversationId: string;
  message: {
    id: string;
    conversationId: string;
    role: 'USER' | 'BOT' | 'MANAGER';
    senderStaffId: string | null;
    content: string;
    metadata: {
      mediaType?: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';
      mediaUrl?: string;
      fileName?: string;
      mimeType?: string;
      fileSize?: number;
      durationSeconds?: number;
      isVoice?: boolean;
      transcription?: string;
      detectedLanguage?: string;
    };
    createdAt: string;
  };
}) => {
  // Update chat view immediately
});
```

---

### 9.3 Frontend Implementation Walkthrough

#### 1. Recording Browser Voice Messages
Use standard browser `navigator.mediaDevices.getUserMedia` and `MediaRecorder` (`audio/webm` or `audio/ogg; codecs=opus`):

```js
// 1. Start recording
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
const audioChunks = [];

mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
mediaRecorder.start();

// 2. Stop recording and upload
mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  const formData = new FormData();
  formData.append('file', audioBlob, 'voice-message.webm');
  formData.append('mediaType', 'AUDIO');
  formData.append('durationSeconds', recordedDurationInSeconds);

  // Upload
  const uploadRes = await fetch(`/conversations/${activeConversationId}/media/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(r => r.json());

  // Dispatch message
  await fetch(`/conversations/${activeConversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      mediaUrl: uploadRes.mediaUrl,
      mediaType: 'AUDIO',
      durationSeconds: recordedDurationInSeconds,
      fileName: uploadRes.fileName,
      mimeType: uploadRes.mimeType,
      fileSize: uploadRes.fileSize,
    }),
  });
};
```

#### 2. Rendering Message Bubbles in the Chat UI

In the message component:
- **`metadata.mediaType === 'IMAGE'`**: Render `<img>` with click-to-zoom / lightbox. If `message.content` exists and differs from fallback text, render caption underneath.
- **`metadata.mediaType === 'AUDIO'`**: Render custom waveform audio player with play/pause button, duration label (`0:15`), and an expandable accordion showing the **Deepgram Transcript**:
  ```tsx
  <div className="voice-message-bubble">
    <AudioPlayer src={msg.metadata.mediaUrl} duration={msg.metadata.durationSeconds} />
    {msg.metadata.transcription && (
      <details className="transcription-accordion">
        <summary>Транскрипция ({msg.metadata.detectedLanguage?.toUpperCase() || 'RU'})</summary>
        <p>{msg.metadata.transcription}</p>
      </details>
    )}
  </div>
  ```
- **`metadata.mediaType === 'VIDEO'`**: Render HTML5 `<video controls src={msg.metadata.mediaUrl} />`.
- **`metadata.mediaType === 'DOCUMENT'`**: Render document chip showing file icon, `fileName`, `fileSize`, and a direct download button.
