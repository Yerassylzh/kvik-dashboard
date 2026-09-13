# 042 — Knowledge Base User Management Plan (Post-Onboarding CRUD, Scrapers, Prompts & AI Tools)

> **Document Type:** Architectural Specification & Implementation Plan  
> **Target Audience:** Frontend Engineers, Backend Engineers, AI Engineers, Product Lead  
> **Scope:** Knowledge Base & Business Info CRUD, Scraping Controls, Vector Re-indexing, AI System Prompts, Tool Calling Access, and Technical Configuration  
> **Status:** Approved & Implemented  

---

## 1. Overview & Business Objectives

During the initial onboarding wizard, business information (business name, niche, contact details, working hours) and knowledge sources (uploaded documents, manual notes, website scraping, 2GIS catalog) are captured to generate the bot's initial AI context, prompt instructions, and vector embeddings.

However, business operations and AI behavior require continuous tuning post-onboarding:
1. **Business Profile Changes:** Contact numbers, working hours, addresses, or service offerings evolve over time.
2. **Knowledge Updates:** Price lists change, promo notes expire, new staff guides or PDFs are added, and obsolete documents must be modified or purged.
3. **Website & Catalog Synchronization:** A company redesigns its website or updates services on 2GIS and requires a full or incremental re-crawl.
4. **AI System Prompts & Persona Tuning:** Owners need to customize how the AI greets clients, what tone of voice it adopts, which specific rules/discounts it applies, and view the exact compiled prompt sent to the LLM.
5. **AI Tool Calling & Tech Context Access:** The AI agent has direct access to operational database tools (`search_knowledge_base`, `get_available_slots`, `create_booking`, `escalate_to_human`). Admins need visibility into these tools, the ability to test them in a sandbox, and control which tools are active.
6. **Selective Control & Tuning:** Owners need the ability to temporarily disable specific knowledge entries (without permanent deletion), re-index failed files, or edit individual notes directly.

---

## 2. The 4-Layer AI Knowledge & Technical Architecture

The AI Assistant does not rely on a single static prompt. Instead, it operates across **4 distinct layers of knowledge, context, and dynamic execution tools**:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    AI AGENT CONTEXT ARCHITECTURE                                 │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
 │  LAYER 1: Static Workspace Identity & Niche Guardrails (Injected in System Prompt Header)      │
 │  • Business Name, City, Niche Profile (BEAUTY / CLINIC / AUTO / REALTY / GENERAL)             │
 │  • Current Date, Day of Week, Timezone, Contact Phone, Working Hours                           │
 └────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                 │
 ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
 │  LAYER 2: Synthesized Business Context JSON (Workspace.businessContext — Injected in Prompt)   │
 │  • LLM-extracted summary aggregated across all active knowledge sources                        │
 │  • Structured keys: description, key_services, pricing_and_packages, booking_policy,          │
 │    lead_qualification_rules, raw_summary                                                       │
 └────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                 │
 ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
 │  LAYER 3: Semantic RAG Vector Store (Dynamic Retrieval via `search_knowledge_base` Tool)        │
 │  • 768-dim embeddings in `knowledge_chunks` (HNSW Cosine Index in pgvector)                   │
 │  • Ingested from: Uploaded Documents (PDF/DOCX/XLSX/TXT), Manual Notes, Scraped Web Pages,     │
 │    2GIS Service Catalog Items                                                                  │
 └────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                 │
 ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
 │  LAYER 4: Real-Time Dynamic Database Tools (Autonomous Tool Calling Execution)                │
 │  • `search_knowledge_base`: Semantic vector query over active chunks                           │
 │  • `get_available_slots`: Live specialist shifts, Google Calendar sync, and free slot calculator│
 │  • `create_booking`: Direct transactional write to Bookings and Leads database                 │
 │  • `escalate_to_human`: Sets MANAGER_INTERCEPTED status, halts bot, triggers live alerts       │
 └────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model & Background Processing

### 3.1 Prisma Schema Reference

```prisma
enum KnowledgeType {
  REALTY_LISTING  // Krisha.kz listing (legacy)
  CAR_LISTING     // Kolesa.kz listing (legacy)
  LOCAL_LISTING   // 2GIS business profile & catalog
  WEBSITE_CONTENT // Scraped website page
  DOCUMENT        // Uploaded PDF / DOCX / XLSX / TXT
  MANUAL_NOTE     // Free-text operational note / FAQ / Qualification
}

enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model KnowledgeEntry {
  id               String           @id @default(uuid())
  workspaceId      String
  workspace        Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  type             KnowledgeType
  title            String?
  externalId       String?
  data             Json
  sourceUrl        String?
  fileKey          String?          // S3 / R2 storage key
  fileMimeType     String?
  fileSize         Int?
  processingStatus ProcessingStatus @default(COMPLETED)
  active           Boolean          @default(true)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  chunks           KnowledgeChunk[]

  @@unique([workspaceId, externalId])
  @@map("knowledge_entries")
}

model KnowledgeChunk {
  id               String                      @id @default(uuid())
  knowledgeEntryId String
  knowledgeEntry   KnowledgeEntry              @relation(fields: [knowledgeEntryId], references: [id], onDelete: Cascade)
  workspaceId      String
  workspace        Workspace                   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  chunkIndex       Int
  content          String                      @db.Text
  tokenCount       Int?
  embedding        Unsupported("vector(768)")?
  metadata         Json?
  createdAt        DateTime                    @default(now())

  @@index([workspaceId])
  @@index([knowledgeEntryId])
  @@map("knowledge_chunks")
}
```

### 3.2 Background Queues & Workers

| Queue Name | Job Name | Functionality |
| :--- | :--- | :--- |
| `document-queue` | `DOCUMENT_PROCESS` | Parses PDF/DOCX/XLSX/TXT, extracts text, chunks into `knowledge_chunks`, generates embeddings via `RagService`. |
| `scraping-queue` | `WEBSITE_SCRAPE` | Recursive BFS web crawler, extracts clean page text, generates entries of type `WEBSITE_CONTENT`. |
| `scraping-queue` | `2GIS_CATALOG_SCRAPE` | Scrapes 2GIS branch services, schedule, pricing, creates `LOCAL_LISTING` entries. |
| `ai-jobs-queue` | `INGEST_MANUAL_NOTE` | Structures free-text notes with Gemini LLM, generates vector embeddings. |
| `ai-jobs-queue` | `EXTRACT_BUSINESS_CONTEXT` | Aggregates all active knowledge entries to generate Layer 2 `Workspace.businessContext` JSON summary. |

---

## 4. Existing Endpoints Review

### 4.1 Knowledge Base Endpoints (`/knowledge-base`)

| Method | Endpoint | Input Payload / Params | Output Response | Queue Triggered |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/knowledge-base/profile` | *None* | `BusinessProfileResponseDto` (`{ code, profile: {...} }`) | *None* |
| `PUT`/`PATCH` | `/knowledge-base/profile` | `UpdateBusinessProfileDto` | `UpdateBusinessProfileResponseDto` (`{ code, message, profile: {...} }`) | `EXTRACT_BUSINESS_CONTEXT` |
| `POST` | `/knowledge-base/documents` | `multipart/form-data`<br>`file: File` (PDF, DOCX, XLSX, TXT ≤10MB) | `{ id, fileName, fileMimeType, fileSize, processingStatus, active, createdAt, updatedAt }` | `DOCUMENT_PROCESS` |
| `GET` | `/knowledge-base/documents` | *None* | `Array<{ id, fileName, fileMimeType, fileSize, processingStatus, active, createdAt, updatedAt }>` | *None* |
| `POST` | `/knowledge-base/notes` | `{ "notes": ["string", ...] }` (1–50 strings) | `{ code: "onboarding.user_note_saved", count: n, notes: [...] }` | `INGEST_MANUAL_NOTE` |
| `GET` | `/knowledge-base/notes` | *None* | `Array<{ id, title, note, processingStatus, active, createdAt, updatedAt }>` | *None* |
| `GET` | `/knowledge-base/notes/:id` | Param: `id` (note UUID) | `ManualNoteResponseDto` (`{ code, note: {...} }`) | *None* |
| `PUT`/`PATCH` | `/knowledge-base/notes/:id` | `UpdateManualNoteDto` | `UpdateManualNoteResponseDto` (`{ code, message, note: {...} }`) | `INGEST_MANUAL_NOTE` |
| `DELETE` | `/knowledge-base/notes/:id` | Param: `id` (note UUID) | `{ code: "knowledge.note_deleted", id: string }` | `EXTRACT_BUSINESS_CONTEXT` |
| `POST` | `/knowledge-base/scrapers/website` | `TriggerWebsiteScrapeDto` (`websiteUrl?`, `forceRecrawl?`) | `{ code, message, type, status, targetUrl, pagesFound, pagesDone, error }` | `WEBSITE_SCRAPE` |
| `POST` | `/knowledge-base/scrapers/2gis` | `TriggerTwoGisScrapeDto` (`input`, `forceRecrawl?`) | `{ code, message, type, status, branchId, itemsFound, itemsDone, error }` | `2GIS_CATALOG_SCRAPE` |
| `GET` | `/knowledge-base/scrapers/status` | *None* | `ScrapersStatusResponseDto` (`{ website: {...}, twoGis: {...} }`) | *None* |
| `DELETE` | `/knowledge-base/scrapers/:type` | Param: `type: "website" \| "2gis"` | `{ code: "knowledge.scraped_data_cleared", type, deletedCount: number }` | `EXTRACT_BUSINESS_CONTEXT` |
| `GET` | `/knowledge-base/entries` | Query: `limit=20`, `offset=0`, `type?` | `KnowledgeEntryListResponseDto` (`{ entries: KnowledgeEntry[], total, limit, offset }`) | *None* |
| `GET` | `/knowledge-base/entries/:id` | Param: `id` (entry UUID) | `KnowledgeEntryResponseDto` (Full KnowledgeEntry) | *None* |
| `PATCH` | `/knowledge-base/entries/:id` | `UpdateKnowledgeEntryDto` (`title?`, `active?`) | `{ code: "knowledge.entry_updated", entry: KnowledgeEntry }` | `EXTRACT_BUSINESS_CONTEXT` |
| `DELETE` | `/knowledge-base/entries/:id` | Param: `id` (entry UUID) | `{ code: "onboarding.knowledge_deleted", id: string }` | `EXTRACT_BUSINESS_CONTEXT` |
| `POST` | `/knowledge-base/entries/bulk-delete` | `BulkDeleteEntriesDto` (`ids: string[]`) | `{ code: "knowledge.bulk_deleted", deletedCount: number }` | `EXTRACT_BUSINESS_CONTEXT` |
| `POST` | `/knowledge-base/entries/:id/reindex` | Param: `id` (entry UUID) | `{ code: "knowledge.entry_reindexing_queued", id, processingStatus: "PENDING" }` | `DOCUMENT_PROCESS` / `INGEST_MANUAL_NOTE` |
| `GET` | `/knowledge-base/qualification` | *None* | `QualificationResponseDto` (`{ qualificationRulesSet, qualificationRules }`) | *None* |
| `PUT` | `/knowledge-base/qualification` | `QualificationDto` | `UpdateQualificationResponseDto` (`{ code, message, data }`) | `EXTRACT_BUSINESS_CONTEXT` |
| `GET` | `/knowledge-base/business-context` | *None* | `Record<string, any> \| null` | *None* |
| `PUT` | `/knowledge-base/business-context` | `UpdateBusinessContextDto` | `{ code: "knowledge.business_context_updated", message, businessContext }` | *None* |
| `POST` | `/knowledge-base/business-context/regenerate` | *None* | `{ code: "knowledge.business_context_regeneration_queued", message }` | `EXTRACT_BUSINESS_CONTEXT` |
| `GET` | `/knowledge-base/search` | Query: `q: string`, `k?: number` | `{ query, k, results: ChunkResult[] }` | *None* |
| `GET` | `/knowledge-base/status/:type` | Param: `type: "website" \| "2gis"` | `{ type, status, targetUrl?/branchId?, pagesFound?/itemsFound?, pagesDone?/itemsDone?, error? }` | *None* |
| `GET` | `/knowledge-base/stats` | *None* | `KnowledgeBaseStatsResponseDto` (`{ totalEntries, countsByType, statusSummary, totalChunks, storageUsageBytes, ... }`) | *None* |

---

### 4.2 AI Engine & Prompts Endpoints (`/ai-engine`)

| Method | Endpoint | Input Payload / Params | Output Response | Functionality |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/ai-engine/config` | *None* | `AiConfigResponseDto` | Returns `nicheProfile`, `systemPromptPreview`, follow-up toggles, `liveOverflowTimeoutSeconds`, `customInstructions`. |
| `PATCH` | `/ai-engine/config` | `UpdateAiConfigDto` (`customInstructions`, follow-up toggles, timeouts) | `{ code: "ai_engine.config_updated", message: string }` | Updates AI behavior and custom prompt additions. |
| `POST` | `/ai-engine/test` | `{ "message": "string" }` | `TestMessageResponseDto` (`response`, `toolCallsCount`, `toolCalls: [...]`, `latencyMs`) | Executes real-time dialogue simulation with actual tools and RAG search. |

---

### 4.3 Onboarding Wizard Endpoints (`/onboarding`)

| Method | Endpoint | Input Payload / Params | Output Response |
| :--- | :--- | :--- | :--- |
| `POST`/`PUT` | `/onboarding/step/business-profile` | `{ businessName, city, businessPhone?, businessEmail?, businessAddress?, businessDescription?, websiteUrl?, instagramUrl?, workingHours?, country? }` | `OnboardingStateResponseDto` (wizard step progression) |
| `POST` | `/onboarding/step/website-scraping` | `{ websiteUrl: string }` | `{ code: "onboarding.website_scraping_started", ...status }` |
| `POST` | `/onboarding/step/2gis-scraping` | `{ input: string }` (2GIS URL or Branch ID) | `{ code: "onboarding.2gis_scraping_started", ...status }` |
| `POST` | `/onboarding/step/qualification` | `{ questions[], disqualifiers[], autoPassConditions[], budgetMin?, budgetMax?, mortgage?, district?, urgency? }` | `OnboardingStateResponseDto` |
| `GET` | `/onboarding/step/qualification-rules` | *None* | `{ qualificationRulesSet: boolean, qualificationRules: object \| null }` |

---

## 5. Current Gaps & Technical Pain Points

1. **Business Profile Management is Trapped in Onboarding:**
   - There is no clean `/knowledge-base/profile` endpoint to fetch or update general business info (name, address, hours, contact info, social links) after onboarding. The existing `PUT /onboarding/step/business-profile` returns wizard progress and recalculates onboarding flags.
2. **Missing Scraper Controls in `/knowledge-base`:**
   - The knowledge base controller provides `GET /knowledge-base/status/:type`, but has **no endpoints to initiate website crawls or 2GIS scrapers**. Users cannot re-sync their website or 2GIS catalog from the dashboard.
3. **No Direct Note Editing (`PUT / PATCH`):**
   - Notes can only be created (`POST /knowledge-base/notes`) or deleted (`DELETE /knowledge-base/entries/:id`). If a user needs to fix a pricing note or update operational rules, they must delete and recreate it.
4. **No Active/Inactive Toggle for Knowledge Entries:**
   - The `active` boolean in `KnowledgeEntry` is not exposed via an endpoint. Users cannot temporarily disable an entry (e.g., seasonal price list or temporary promo) without permanently deleting it and losing uploaded files.
5. **No Bulk Delete Operations:**
   - Deleting multiple scraped pages or old documents requires issuing individual `DELETE` requests per entry.
6. **No Post-Onboarding Lead Qualification Management:**
   - Updating qualification rules is trapped under `/onboarding/step/qualification`. There is no dedicated dashboard endpoint to view/update qualification logic without triggering onboarding state updates.
7. **AI Tool Calling Transparency & Controls:**
   - The 4 agent tools (`search_knowledge_base`, `get_available_slots`, `create_booking`, `escalate_to_human`) are hardcoded. Admins have no UI visibility into tool schemas, no way to test individual tools in isolation, and cannot toggle off specific tools (e.g., disable autonomous booking creation).
8. **Live Prompt Inspection & Variable Preview:**
   - While `GET /ai-engine/config` returns a system prompt preview, there is no interactive debug endpoint showing exact prompt breakdown (Layer 1 headers, Layer 2 JSON, Layer 3 vector search preview, custom instructions, tool declarations).

---

## 6. Proposed Endpoints Specification

```
                    ┌─────────────────────────────────────────────────────────┐
                    │               Knowledge Base Dashboard API              │
                    └─────────────────────────────────────────────────────────┘
                                                 │
      ┌────────────────────────┬─────────────────┼────────────────────────┬────────────────────────┬────────────────────────┐
      ▼                        ▼                 ▼                        ▼                        ▼                        ▼
[Business Profile]     [Manual Notes]   [Scraper Controls]       [Knowledge Entries]      [Qualification Rules]    [AI Prompts & Tools]
• GET /profile         • GET /notes/:id • POST /scrapers/website • PATCH /entries/:id     • GET /qualification     • GET /ai-engine/tools
• PUT /profile         • PUT /notes/:id • POST /scrapers/2gis    • POST /entries/bulk-del • PUT /qualification     • PATCH /ai-engine/tools/:name
                       • DELETE /notes  • GET /scrapers/status   • POST /entries/reindex  • GET /stats             • POST /ai-engine/test
                                        • DELETE /scrapers/:type                                                   • GET /ai-engine/prompt-preview
```

---

### 6.1 Business Profile Management (`/knowledge-base/profile`)

Allows reading and modifying the primary business profile without onboarding state side-effects.

#### `GET /knowledge-base/profile`
- **Summary:** Get current workspace business profile and contact information.
- **Response `200 OK` (`BusinessProfileResponseDto`):**
```json
{
  "code": "knowledge.profile_retrieved",
  "profile": {
    "businessName": "Barber Pro Almaty",
    "nicheProfile": "BEAUTY",
    "subSegment": "barbershop",
    "city": "Almaty",
    "country": "KZ",
    "businessPhone": "+77011112233",
    "businessEmail": "info@barberpro.kz",
    "businessAddress": "Abylai Khan Ave 45",
    "businessDescription": "Premium barbershop and grooming lounge",
    "websiteUrl": "https://barberpro.kz",
    "instagramUrl": "https://instagram.com/barberpro_kz",
    "workingHours": "Mon-Sun 10:00 - 21:00",
    "teamSize": 5,
    "timezone": "Asia/Almaty",
    "updatedAt": "2026-09-10T12:00:00.000Z"
  }
}
```

#### `PUT /knowledge-base/profile` (and `PATCH`)
- **Summary:** Update business profile details and automatically enqueue business context re-extraction.
- **Request Body (`UpdateBusinessProfileDto`):**
```json
{
  "businessName": "Barber Pro Lounge",
  "city": "Almaty",
  "country": "KZ",
  "businessPhone": "+77011112233",
  "businessEmail": "contact@barberpro.kz",
  "businessAddress": "Abylai Khan Ave 50, Floor 2",
  "businessDescription": "Premium male haircuts, beard trims, and grooming.",
  "websiteUrl": "https://barberpro.kz",
  "instagramUrl": "https://instagram.com/barberpro_kz",
  "workingHours": "Mon-Sun 09:00 - 22:00",
  "teamSize": 6,
  "timezone": "Asia/Almaty"
}
```
- **Response `200 OK` (`UpdateBusinessProfileResponseDto`):**
```json
{
  "code": "knowledge.profile_updated",
  "message": "Business profile updated successfully.",
  "profile": {
    "businessName": "Barber Pro Lounge",
    "nicheProfile": "BEAUTY",
    "subSegment": "barbershop",
    "city": "Almaty",
    "country": "KZ",
    "businessPhone": "+77011112233",
    "businessEmail": "contact@barberpro.kz",
    "businessAddress": "Abylai Khan Ave 50, Floor 2",
    "businessDescription": "Premium male haircuts, beard trims, and grooming.",
    "websiteUrl": "https://barberpro.kz",
    "instagramUrl": "https://instagram.com/barberpro_kz",
    "workingHours": "Mon-Sun 09:00 - 22:00",
    "teamSize": 6,
    "timezone": "Asia/Almaty",
    "updatedAt": "2026-09-13T14:00:00.000Z"
  }
}
```
- **Side Effect:** Dispatches `EXTRACT_BUSINESS_CONTEXT_JOB` to `AI_JOBS_QUEUE`.

---

### 6.2 Manual Notes & FAQ Management

Provides granular CRUD for operational notes and FAQ snippets.

#### `GET /knowledge-base/notes/:id`
- **Summary:** Retrieve a single manual note by ID.
- **Response `200 OK` (`ManualNoteResponseDto`):**
```json
{
  "code": "knowledge.note_retrieved",
  "note": {
    "id": "e458b29c-1234-4567-8901-abcdef123456",
    "title": "Customer Parking Instructions",
    "note": "Parking is free for customers in the backyard with barrier code 4521.",
    "processingStatus": "COMPLETED",
    "active": true,
    "createdAt": "2026-09-08T10:00:00.000Z",
    "updatedAt": "2026-09-08T10:00:00.000Z"
  }
}
```

#### `PUT /knowledge-base/notes/:id` (and `PATCH`)
- **Summary:** Update an existing manual note, re-run AI structuring, and re-embed chunks in pgvector.
- **Request Body (`UpdateManualNoteDto`):**
```json
{
  "note": "Parking is free in the backyard. Barrier code has been updated to 9988.",
  "title": "Customer Parking Instructions"
}
```
- **Response `200 OK` (`UpdateManualNoteResponseDto`):**
```json
{
  "code": "knowledge.note_updated",
  "message": "Note updated and queued for re-indexing.",
  "note": {
    "id": "e458b29c-1234-4567-8901-abcdef123456",
    "title": "Customer Parking Instructions",
    "note": "Parking is free in the backyard. Barrier code has been updated to 9988.",
    "processingStatus": "PENDING",
    "active": true,
    "createdAt": "2026-09-08T10:00:00.000Z",
    "updatedAt": "2026-09-13T14:00:00.000Z"
  }
}
```
- **Side Effect:** Dispatches `INGEST_MANUAL_NOTE_JOB` to `AI_JOBS_QUEUE`.

#### `DELETE /knowledge-base/notes/:id`
- **Summary:** Delete note and cascade vector chunks.
- **Response `200 OK`:**
```json
{
  "code": "knowledge.note_deleted",
  "id": "e458b29c-1234-4567-8901-abcdef123456"
}
```

---

### 6.3 Knowledge Scrapers & Re-Crawling Controls (`/knowledge-base/scrapers`)

Exposes website and 2GIS crawlers directly to dashboard users.

#### `POST /knowledge-base/scrapers/website`
- **Summary:** Trigger full or incremental website crawl.
- **Request Body (`TriggerWebsiteScrapeDto`):**
```json
{
  "websiteUrl": "https://barberpro.kz",
  "forceRecrawl": true
}
```
- **Response `200 OK`:**
```json
{
  "code": "knowledge.website_scraping_started",
  "message": "Website crawling initiated.",
  "type": "website",
  "status": "QUEUED",
  "targetUrl": "https://barberpro.kz",
  "pagesFound": 0,
  "pagesDone": 0,
  "error": null
}
```

#### `POST /knowledge-base/scrapers/2gis`
- **Summary:** Trigger 2GIS catalog & services scraping.
- **Request Body (`TriggerTwoGisScrapeDto`):**
```json
{
  "input": "https://2gis.kz/almaty/firm/70000001018000000",
  "forceRecrawl": true
}
```
- **Response `200 OK`:**
```json
{
  "code": "knowledge.2gis_scraping_started",
  "message": "2GIS catalog scraping initiated.",
  "type": "2gis",
  "status": "QUEUED",
  "branchId": "70000001018000000",
  "itemsFound": 0,
  "itemsDone": 0,
  "error": null
}
```

#### `GET /knowledge-base/scrapers/status`
- **Summary:** Unified scraping status for all configured crawlers.
- **Response `200 OK` (`ScrapersStatusResponseDto`):**
```json
{
  "website": {
    "status": "COMPLETED",
    "targetUrl": "https://barberpro.kz",
    "pagesFound": 14,
    "pagesDone": 14,
    "error": null
  },
  "twoGis": {
    "status": "COMPLETED",
    "branchId": "70000001018000000",
    "itemsFound": 48,
    "itemsDone": 48,
    "error": null
  }
}
```

#### `DELETE /knowledge-base/scrapers/website` & `DELETE /knowledge-base/scrapers/2gis`
- **Summary:** Purge all scraped entries and vector chunks for the specified source type in bulk.
- **Response `200 OK`:**
```json
{
  "code": "knowledge.scraped_data_cleared",
  "type": "website",
  "deletedCount": 14
}
```

---

### 6.4 Knowledge Entries Lifecycle, Active Toggle & Bulk Operations

#### `PATCH /knowledge-base/entries/:id`
- **Summary:** Update entry title or toggle active status.
- **Request Body (`UpdateKnowledgeEntryDto`):**
```json
{
  "title": "Updated Master Haircut & Beard Price List",
  "active": false
}
```
- **Response `200 OK`:**
```json
{
  "code": "knowledge.entry_updated",
  "entry": {
    "id": "entry-uuid",
    "title": "Updated Master Haircut & Beard Price List",
    "active": false,
    "updatedAt": "2026-09-13T14:30:00.000Z"
  }
}
```
- **Behavior:** When `active = false`, the entry's vector chunks are excluded from RAG retrieval queries in `RagService`.

#### `POST /knowledge-base/entries/bulk-delete`
- **Summary:** Delete multiple knowledge entries and their files in a single atomic transaction.
- **Request Body (`BulkDeleteEntriesDto`):**
```json
{
  "ids": [
    "entry-uuid-1",
    "entry-uuid-2",
    "entry-uuid-3"
  ]
}
```
- **Response `200 OK`:**
```json
{
  "code": "knowledge.bulk_deleted",
  "deletedCount": 3
}
```

#### `POST /knowledge-base/entries/:id/reindex`
- **Summary:** Force re-extraction and re-embedding for a specific entry.
- **Response `200 OK`:**
```json
{
  "code": "knowledge.entry_reindexing_queued",
  "id": "entry-uuid",
  "processingStatus": "PENDING"
}
```

---

### 6.5 Lead Qualification Rules Management (`/knowledge-base/qualification`)

#### `GET /knowledge-base/qualification`
- **Summary:** Get configured lead qualification criteria and structured prompt rules.
- **Response `200 OK` (`QualificationResponseDto`):**
```json
{
  "qualificationRulesSet": true,
  "qualificationRules": {
    "questions": [
      { "id": "q1", "field": "service", "question": "What service are you looking for?", "required": true },
      { "id": "q2", "field": "preferred_time", "question": "What date or time works best?", "required": false }
    ],
    "disqualifiers": [
      "Clients looking for pet grooming"
    ],
    "autoPassConditions": [
      "VIP client or urgent booking"
    ],
    "budgetMin": 5000,
    "budgetMax": 50000,
    "mortgage": false,
    "district": "Medeu",
    "urgency": "high"
  }
}
```

#### `PUT /knowledge-base/qualification`
- **Summary:** Update qualification rules, update the `qualification_rules` knowledge entry, re-embed chunks, and re-generate business context.
- **Request Body (`QualificationDto`):** Same schema as during onboarding.
- **Response `200 OK` (`UpdateQualificationResponseDto`):**
```json
{
  "code": "knowledge.qualification_rules_updated",
  "message": "Lead qualification rules updated successfully.",
  "data": {
    "qualificationRulesSet": true,
    "qualificationRules": {
      "questions": [
        { "id": "q1", "field": "service", "question": "What service are you looking for?", "required": true }
      ],
      "disqualifiers": [
        "Clients looking for pet grooming"
      ],
      "autoPassConditions": [
        "VIP client or urgent booking"
      ],
      "budgetMin": 5000,
      "budgetMax": 50000
    }
  }
}
```

---

### 6.6 AI Prompts, System Context & Tool Management (`/ai-engine`)

This section gives users and developers granular visibility and control over what the AI agent knows and what tools it can call.

#### `GET /ai-engine/tools`
- **Summary:** Lists all tools declared for the AI assistant, their JSON schemas, descriptions, and current enable/disable status.
- **Response `200 OK`:**
```json
{
  "tools": [
    {
      "name": "search_knowledge_base",
      "description": "Searches the business knowledge base using semantic vector search.",
      "enabled": true,
      "parameters": { "type": "OBJECT", "required": ["query"], "properties": { "query": { "type": "STRING" } } }
    },
    {
      "name": "get_available_slots",
      "description": "Retrieves free appointment slots for a specified date and specialist.",
      "enabled": true,
      "parameters": { "type": "OBJECT", "required": ["date"], "properties": { "date": { "type": "STRING" }, "staffName": { "type": "STRING" } } }
    },
    {
      "name": "create_booking",
      "description": "Creates a confirmed appointment booking in the database.",
      "enabled": true,
      "parameters": { "type": "OBJECT", "required": ["startTime", "clientName", "clientPhone"], "properties": { ... } }
    },
    {
      "name": "escalate_to_human",
      "description": "Transfers the conversation to a human manager/operator.",
      "enabled": true,
      "parameters": { "type": "OBJECT", "required": ["reason"], "properties": { "reason": { "type": "STRING" } } }
    }
  ]
}
```

#### `PATCH /ai-engine/tools/:toolName`
- **Summary:** Toggle or configure specific tool calling permissions (e.g., disable auto-booking creation for consultation-only modes).
- **Request Body (`UpdateToolConfigDto`):**
```json
{
  "enabled": false,
  "customDescription": "Optional customized tool prompt instruction"
}
```
- **Response `200 OK`:**
```json
{
  "code": "ai_engine.tool_updated",
  "name": "create_booking",
  "enabled": false
}
```

#### `GET /ai-engine/prompt-preview`
- **Summary:** Returns a complete, live compiled system instruction string with all current dynamic variables, Layer 2 businessContext JSON, niche guidelines, active custom instructions, and tool usage rules.
- **Response `200 OK`:**
```json
{
  "nicheProfile": "BEAUTY",
  "todayStr": "2026-09-13",
  "dayOfWeek": "Воскресенье",
  "businessContext": {
    "company_name": "Barber Pro Lounge",
    "key_services": ["Мужская стрижка - 8000 ₸", "Оформление бороды - 4000 ₸"],
    "booking_policy": "Предоплата 50% для новых клиентов."
  },
  "customInstructions": "Всегда обращайся на «Вы». Если клиент спрашивает про скидки, предлагай 10% на первый визит.",
  "compiledSystemPrompt": "Ты — интеллектуальный виртуальный ассистент компании \"Barber Pro Lounge\"...\n\nДанные о компании:\n{\n  \"company_name\": \"Barber Pro Lounge\",\n  ...\n}\n\nОсобые инструкции владельца:\nВсегда обращайся на «Вы»...\n\nПРАВИЛА РАБОТЫ И ИСПОЛЬЗОВАНИЯ ИНСТРУМЕНТОВ (TOOLS):\n1. ...",
  "totalPromptTokensEstimate": 650
}
```

#### `POST /ai-engine/test` (Dialogue & Tool Execution Simulator Sandbox)
- **Summary:** Simulates a user message, runs autonomous tool execution, and returns step-by-step tool calls, returned tool data, RAG chunks, AI response text, and execution latency.
- **Request Body (`TestMessageDto`):**
```json
{
  "message": "Здравствуйте! Сколько стоит стрижка и есть ли свободное время на завтра?"
}
```
- **Response `200 OK`:**
```json
{
  "response": "Здравствуйте! Мужская стрижка у нас стоит 8 000 ₸. На завтра (14 сентября) есть свободные окошки: 11:00, 14:30 и 17:00. В какое время вам удобно записаться?",
  "toolCallsCount": 2,
  "toolCalls": [
    {
      "name": "search_knowledge_base",
      "args": { "query": "стоимость мужской стрижки" },
      "result": { "matches": ["Мужская стрижка: 8000 ₸, включает мытье головы и укладку."] }
    },
    {
      "name": "get_available_slots",
      "args": { "date": "2026-09-14", "durationMinutes": 60 },
      "result": { "slots": ["2026-09-14T11:00:00+05:00", "2026-09-14T14:30:00+05:00", "2026-09-14T17:00:00+05:00"] }
    }
  ],
  "latencyMs": 840
}
```

---

### 6.7 Knowledge Base Analytics & Overview (`/knowledge-base/stats`)

#### `GET /knowledge-base/stats`
- **Summary:** Aggregate metrics for the dashboard Knowledge Base overview tab.
- **Response `200 OK`:**
```json
{
  "totalEntries": 65,
  "countsByType": {
    "DOCUMENT": 3,
    "MANUAL_NOTE": 8,
    "WEBSITE_CONTENT": 14,
    "LOCAL_LISTING": 40
  },
  "statusSummary": {
    "COMPLETED": 64,
    "PENDING": 1,
    "FAILED": 0
  },
  "totalChunks": 218,
  "storageUsageBytes": 4829100,
  "lastIndexedAt": "2026-09-13T12:30:00.000Z",
  "businessContextAvailable": true,
  "aiEngineStatus": {
    "toolsActive": 4,
    "customInstructionsConfigured": true,
    "followUpActive": true
  }
}
```

---

## 7. AI & Vector Pipeline Synchronization

When any knowledge source is added, modified, or deleted:

```
                  ┌──────────────────────────────────────────────┐
                  │          Knowledge Mutation Event            │
                  │ (Note Edit / Doc Upload / Scraping / Profile)│
                  └──────────────────────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [Vector Store Update]                           [Business Context Sync]
     • Chunk text content                            • BullMQ AI Job:
     • Generate 768-dim embeddings                   • EXTRACT_BUSINESS_CONTEXT
     • Upsert into `knowledge_chunks`                • Aggregates active entries
     • Link to `knowledge_entries.id`                • Overwrites `Workspace.businessContext`
```

1. **RAG Search Filter:** `RagService` matches only active chunks (`active: true` on parent `KnowledgeEntry`).
2. **Auto-Debounce on Context Re-extraction:** When bulk operations occur, `EXTRACT_BUSINESS_CONTEXT_JOB` is debounced with BullMQ job IDs to prevent duplicate LLM calls within a 10-second window.

---

## 8. Translation Keys & i18n Envelope

All response payloads adhere to the project's translation guidelines:

```json
{
  "code": "knowledge.note_updated",
  "message": "Note updated and queued for re-indexing."
}
```

New keys to register in `translation_keys_new.json`:
- `"knowledge.profile_updated": "Профиль бизнеса успешно обновлен"`
- `"knowledge.note_updated": "Заметка успешно обновлена и отправлена на индексацию"`
- `"knowledge.note_deleted": "Заметка успешно удалена"`
- `"knowledge.scraped_data_cleared": "Данные скрейпинга успешно очищены"`
- `"knowledge.entry_updated": "Элемент базы знаний успешно обновлен"`
- `"knowledge.bulk_deleted": "Выбранные элементы базы знаний успешно удалены"`
- `"knowledge.entry_reindexing_queued": "Элемент отправлен на повторную индексацию"`
- `"knowledge.qualification_rules_updated": "Правила квалификации лидов успешно сохранены"`
- `"ai_engine.tool_updated": "Настройки инструмента ИИ успешно сохранены"`

---

## 9. Implementation Checklist for Review

- [x] **Phase 1: Business Profile Endpoints**
  - [x] Implement `GET /knowledge-base/profile` in `KnowledgeBaseController`
  - [x] Implement `PUT /knowledge-base/profile` (and `PATCH`) in `KnowledgeBaseController`
  - [x] Connect profile updates to automatic `businessContext` re-extraction

- [x] **Phase 2: Manual Notes & FAQ Granular CRUD**
  - [x] Implement `GET /knowledge-base/notes/:id`
  - [x] Implement `PUT /knowledge-base/notes/:id` with text re-chunking and `INGEST_MANUAL_NOTE_JOB`
  - [x] Implement `DELETE /knowledge-base/notes/:id` alias / dedicated handler

- [x] **Phase 3: Scraper Management from Dashboard**
  - [x] Implement `POST /knowledge-base/scrapers/website` with optional force recrawl flag
  - [x] Implement `POST /knowledge-base/scrapers/2gis` with branch ID resolution
  - [x] Implement `GET /knowledge-base/scrapers/status` returning unified status for all crawlers
  - [x] Implement `DELETE /knowledge-base/scrapers/:type` for bulk cleanup of scraped entries

- [x] **Phase 4: Knowledge Entries Lifecycle & Bulk Operations**
  - [x] Implement `PATCH /knowledge-base/entries/:id` (title edit & `active` status toggle)
  - [x] Update `RagService.retrieve()` to filter by `active: true`
  - [x] Implement `POST /knowledge-base/entries/bulk-delete`
  - [x] Implement `POST /knowledge-base/entries/:id/reindex`

- [x] **Phase 5: Lead Qualification Management**
  - [x] Implement `GET /knowledge-base/qualification`
  - [x] Implement `PUT /knowledge-base/qualification` with markdown generation, chunking & vector sync

- [x] **Phase 6: AI Prompts, System Context & Tool Management**
  - [x] Implement `GET /ai-engine/tools` (list tools, schemas, descriptions, enable status)
  - [x] Implement `PATCH /ai-engine/tools/:toolName` (toggle tool activation per workspace)
  - [x] Implement `GET /ai-engine/prompt-preview` (compiled prompt inspector with live context variables)
  - [x] Enhance `POST /ai-engine/test` to return detailed tool call results and latency diagnostics

- [x] **Phase 7: Knowledge Base Analytics & Overview**
  - [x] Implement `GET /knowledge-base/stats` aggregating counts, statuses, chunk counts, and storage metrics

- [x] **Phase 8: DTOs, Swagger Docs & Translation Keys**
  - [x] Define input/output DTOs with JSDoc comments for Swagger auto-generation
  - [x] Append new keys to `translation_keys_new.json`
  - [x] Verify test suite and OpenAPI schema generation
