# 012 — Knowledge Base & AI Agent User Management Frontend Plan

> **Document Type:** Frontend System Architecture & Implementation Plan  
> **Backend Contract Reference:** [`dev_docs/backend/042_KNOWLEDGE_BASE_USER_MANAGEMENT_PLAN.md`](file:///c:/Users/Honor/Desktop/tech/web/kvik/kvik/dev_docs/backend/042_KNOWLEDGE_BASE_USER_MANAGEMENT_PLAN.md)  
> **API Specification Reference:** `openapi.json` (`/knowledge-base/*`, `/ai-engine/*`)  
> **Status:** Ready for Implementation  
> **Target Audience:** Frontend Engineers, Fullstack Engineers, Product Lead  

---

## 1. Executive Summary & Goals

During initial onboarding, business information and knowledge sources (documents, notes, websites, 2GIS catalog) are captured to build the AI's baseline context. Post-onboarding, businesses continually evolve: services change, price lists are updated, promotional notes expire, and AI instructions require fine-tuning.

This document defines the **frontend architecture and implementation roadmap** for the Knowledge Base and AI Agent management modules in the dashboard.

### Key Capabilities Delivered
1. **Full Knowledge Lifecycle Management:** Granular CRUD for uploaded files (PDF/DOCX/XLSX/TXT), operational notes & FAQ snippets, website scraping, and 2GIS catalog sync.
2. **Active / Inactive Source Toggling:** Ability to temporarily disable specific price lists or notes from AI vector retrieval without deleting files.
3. **Bulk Operations & Re-indexing:** One-click bulk deletion and single-entry re-indexing for failed or updated documents.
4. **Post-Onboarding Business Profile & Qualification:** Edit working hours, contacts, address, and lead qualification logic directly from Settings without triggering onboarding side effects.
5. **AI Prompt & Tool Transparency:** Live compiled prompt inspector with dynamic variables, autonomous database tool permissions (`search_knowledge_base`, `get_available_slots`, `create_booking`, `escalate_to_human`), and interactive execution simulator.
6. **Semantic Vector Search Testing:** Direct in-browser semantic search tool to verify what chunks the AI retrieves for customer queries.

---

## 2. System Architecture & Request Proxying

All frontend network requests communicate exclusively through the Next.js API catch-all proxy:

```
┌──────────────────────────────┐
│       Browser Client         │
│  (React / SWR / Zustand)     │
└──────────────┬───────────────┘
               │ apiClient (baseURL: "/api")
               ▼
┌──────────────────────────────┐
│   Next.js API Proxy Route    │
│  `app/api/[...proxy]/route.ts`│
│  - Attach Bearer JWT         │
│  - Forward headers & cookies │
└──────────────┬───────────────┘
               │ HTTP Forwarding
               ▼
┌──────────────────────────────┐
│       Backend Gateway        │
│    `/knowledge-base/*`       │
│    `/ai-engine/*`            │
└──────────────────────────────┘
```

- **Authentication & Headers:** `apiClient` in `lib/api/client.ts` automatically attaches access tokens, handles silent 401 refresh, and translates backend i18n error codes.
- **Multipart Uploads:** File uploads (`POST /knowledge-base/documents`) stream binary buffers cleanly through the proxy to the backend and S3/R2 storage.
- **Optimistic UI & Cache Revalidation:** Mutations trigger instant local state updates followed by targeted SWR cache revalidation.

---

## 3. Page Structure & Navigation Breakdown

### 3.1 Navigation Updates (`SettingsNav.tsx`)

The Settings navigation will be updated to provide direct access to the new Knowledge Base hub alongside the enhanced AI Agent center:

| Route | Label (RU) | Icon | Access Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/settings/workspace` | Профиль бизнеса | `Building2` | `OWNER` | General workspace & business identity |
| `/settings/knowledge-base` | **База знаний** | `BookOpen` | `OWNER`, `ADMIN_MANAGER` | **NEW:** Unified knowledge hub (files, notes, scrapers, search test) |
| `/settings/ai-agent` | ИИ-Агент & Промпты | `Bot` | `OWNER`, `ADMIN_MANAGER` | System prompt, tools config, dialogue simulator |
| `/settings/business-context` | Контекст бизнеса | `Sparkles` (L2) | `OWNER`, `ADMIN_MANAGER` | Synthesized Layer 2 JSON editor & regenerator |
| `/settings/channels` | Каналы связи | `MessageCircle` | `OWNER`, `ADMIN_MANAGER` | WhatsApp, Instagram, Telegram integration |
| `/settings/staff` | Команда | `Users` | `OWNER`, `ADMIN_MANAGER` | Staff schedules, specialist roles & RBAC |
| `/settings/account` | Аккаунт | `Shield` | All roles | Password & personal settings |
| `/settings/advanced` | Дополнительно | `SlidersHorizontal` | `OWNER`, `ADMIN_MANAGER` | Developer options & system triggers |

---

## 4. Feature Specifications by View

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             KNOWLEDGE BASE HUB (/settings/knowledge-base)                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
  │
  ├── [1. Overview & Stats Card] ── Total entries, vector chunks, storage usage, status summary
  │
  ├── [2. Tab: Data Sources]
  │     ├── Documents Tab ────── Drag & drop upload, file list, processing status, active toggle, delete
  │     ├── Manual Notes Tab ──── Create FAQ/rules, inline edit modal, re-indexing, active toggle
  │     ├── Website Scraper ──── Crawl URL input, force re-crawl switch, live progress bar, purge data
  │     └── 2GIS Scraper ─────── Branch URL/ID input, catalog sync status, purge data
  │
  ├── [3. Tab: Lead Qualification] ── Questions list, disqualifiers, auto-pass criteria, budget range
  │
  └── [4. Tab: Search Sandbox] ────── Live semantic vector search input, top-k chunks preview, score
```

---

### 4.1 Knowledge Base Hub (`/settings/knowledge-base`)

**Route:** `app/(dashboard)/settings/knowledge-base/page.tsx`  
**Container:** `components/dashboard/settings/knowledge-base/KnowledgeBaseManager.tsx`

#### A. Analytics & Storage Summary Header (`KbStatsHeader.tsx`)
- Displays real-time metrics fetched from `GET /knowledge-base/stats`:
  - Total active knowledge entries count.
  - Total vector chunks generated in pgvector.
  - Storage space consumed (MB/KB formatted).
  - Overall status badges (`COMPLETED`, `PENDING` with animated spinner, `FAILED` with retry CTA).
  - Quick action: **"Тест векторного поиска"** (opens the search tester drawer).

#### B. Sources Management Tabs (`KbSourcesSection.tsx`)
Organized into 4 clear source types:

1. **Documents Manager (`KbDocumentsTab.tsx`):**
   - Drag-and-drop dropzone for PDF, DOCX, XLSX, TXT (up to 10MB).
   - Document table showing: File Name, Size, Upload Date, Processing Status badge, `Active` toggle switch, Re-index button, and Delete button.
   - Bulk selection checkboxes with a floating "Удалить выбранные" bulk delete action (`POST /knowledge-base/entries/bulk-delete`).

2. **Manual Notes & FAQ (`KbNotesTab.tsx`):**
   - Button: **"+ Добавить заметку / FAQ"** opening creation modal.
   - Note cards displaying title, content snippet, created date, `Active` toggle switch.
   - **Inline Edit Modal (`KbNoteEditModal.tsx`):** Edit title and note text -> calls `PUT /knowledge-base/notes/:id` -> auto-triggers vector re-indexing.
   - Delete confirmation dialog.

3. **Website Crawler (`KbWebsiteScraperTab.tsx`):**
   - Input for target website URL (e.g. `https://mysalon.kz`).
   - Toggle switch for "Полная переиндексация" (`forceRecrawl: true`).
   - Trigger button: "Запустить сканирование" -> calls `POST /knowledge-base/scrapers/website`.
   - Real-time crawling progress widget: Pages found vs pages processed, last sync timestamp, and error reporting.
   - Danger button: "Очистить данные сайта" -> calls `DELETE /knowledge-base/scrapers/website`.

4. **2GIS Catalog Scraper (`KbTwoGisScraperTab.tsx`):**
   - Input for 2GIS link or Branch ID.
   - Trigger button: "Синхронизировать каталог" -> calls `POST /knowledge-base/scrapers/2gis`.
   - Real-time catalog progress widget: Items found vs items synced, status badge.
   - Danger button: "Удалить данные 2GIS" -> calls `DELETE /knowledge-base/scrapers/2gis`.

#### C. Lead Qualification Rules Tab (`KbQualificationTab.tsx`)
- Fetches from `GET /knowledge-base/qualification` and updates via `PUT /knowledge-base/qualification`.
- Form sections:
  - **Required Qualification Questions:** Add/remove custom screening questions (e.g. service needed, preferred master).
  - **Disqualification Criteria (Stop-triggers):** List of rules where the bot politely refuses or transfers (e.g. "Запросы на стрижку животных").
  - **Auto-Pass / Priority Conditions:** Criteria that immediately qualify a high-value client.
  - **Budget Range & Urgency Filters:** Numeric inputs for minimum/maximum budget.

#### D. Semantic Vector Search Tester (`KbSearchTesterModal.tsx`)
- Sandbox modal to debug RAG retrieval without sending real messages.
- Input query field (e.g., *"Сколько стоит окрашивание волос?"*).
- Results list rendering matched chunks, source entry title, source type badge, and chunk text snippet.

---

### 4.2 AI Agent & Prompts Center (`/settings/ai-agent`)

**Route:** `app/(dashboard)/settings/ai-agent/page.tsx`  
**Container:** `components/dashboard/settings/ai-agent/AgentConfig.tsx` (Enhanced)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              AI AGENT & PROMPTS CENTER (/settings/ai-agent)                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
  │
  ├── [1. Behavior & Persona Settings] ── Tone of voice, custom instructions, follow-up toggles
  │
  ├── [2. Compiled Prompt Inspector] ──── Full preview of Layer 1-4 prompt sent to LLM + tokens
  │
  ├── [3. Database Tools Control] ────── Toggle search_kb, get_slots, create_booking, escalate
  │
  └── [4. Interactive Dialogue Sandbox] ─ Real-time chat simulation with step-by-step tool logs
```

#### A. Behavior & Custom Instructions
- Textarea for custom business instructions (greeting style, discounts, booking nuances).
- Live manager takeover timeout slider (seconds before escalating unanswered messages).
- Automated follow-up toggles (24h and 72h re-engagement messages).

#### B. Live Compiled System Prompt Inspector (`AiPromptInspectorModal.tsx`)
- Fetches live compiled prompt from `GET /ai-engine/prompt-preview`.
- Visual breakdown:
  - **Layer 1:** Niche rules & static business metadata.
  - **Layer 2:** Synthesized `businessContext` JSON.
  - **Layer 3:** Knowledge base & RAG retrieval guidelines.
  - **Layer 4:** Tool calling schemas & parameters.
  - **Custom Instructions:** Highlighted owner directives.
- Estimated total token counter with badge indicator.
- Copy-to-clipboard button for easy debugging.

#### C. AI Database Tools Toggle Matrix (`AiToolsManager.tsx`)
- Fetches tools list from `GET /ai-engine/tools`.
- Renders card for each autonomous database tool:
  - `search_knowledge_base`: Semantic vector query over active chunks.
  - `get_available_slots`: Live specialist calendar slot calculation.
  - `create_booking`: Direct transactional write to appointments DB.
  - `escalate_to_human`: Transfers chat to manager and halts bot.
- Toggles tool status via `PATCH /ai-engine/tools/:toolName` with instant feedback.

#### D. Enhanced Dialogue & Tool Simulator (`AiSandboxDrawer.tsx`)
- Interactive chat testing widget.
- When sending a test message (`POST /ai-engine/test`), displays:
  - Simulated AI response bubble.
  - Step-by-step tool execution accordion showing tool name, arguments sent, and raw database result.
  - Overall response latency badge (e.g. `840ms`).
  - Total RAG chunks utilized.

---

### 4.3 Business Profile Management (`/settings/workspace` & `/knowledge-base/profile`)

- Form in `WorkspaceForm.tsx` wired to `GET /knowledge-base/profile` and `PUT /knowledge-base/profile`.
- Fields: Business Name, City, Country, Phone, Email, Physical Address, Description, Website, Instagram, Working Hours, Team Size, Timezone.
- Saving automatically triggers background `EXTRACT_BUSINESS_CONTEXT_JOB` without touching onboarding state.

---

## 5. API Layer & Type Definitions

### 5.1 Knowledge Base API (`lib/api/knowledgeBase.ts`)

```typescript
// Core API Interface Functions:
export const knowledgeBaseApi = {
  // Stats
  getStats: () => apiClient.get<KnowledgeBaseStatsDto>('/knowledge-base/stats'),
  
  // Profile
  getProfile: () => apiClient.get<BusinessProfileDto>('/knowledge-base/profile'),
  updateProfile: (data: UpdateBusinessProfileDto) => apiClient.put('/knowledge-base/profile', data),
  
  // Documents
  getDocuments: () => apiClient.get<KnowledgeDocumentDto[]>('/knowledge-base/documents'),
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/knowledge-base/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Manual Notes
  getNotes: () => apiClient.get<ManualNoteDto[]>('/knowledge-base/notes'),
  getNote: (id: string) => apiClient.get<ManualNoteDto>(`/knowledge-base/notes/${id}`),
  createNotes: (notes: string[]) => apiClient.post('/knowledge-base/notes', { notes }),
  updateNote: (id: string, data: { title?: string; note: string }) => apiClient.put(`/knowledge-base/notes/${id}`, data),
  deleteNote: (id: string) => apiClient.delete(`/knowledge-base/notes/${id}`),
  
  // Scrapers
  triggerWebsiteScrape: (websiteUrl: string, forceRecrawl?: boolean) =>
    apiClient.post('/knowledge-base/scrapers/website', { websiteUrl, forceRecrawl }),
  triggerTwoGisScrape: (input: string, forceRecrawl?: boolean) =>
    apiClient.post('/knowledge-base/scrapers/2gis', { input, forceRecrawl }),
  getScrapersStatus: () => apiClient.get<ScrapersStatusDto>('/knowledge-base/scrapers/status'),
  clearScrapedData: (type: 'website' | '2gis') => apiClient.delete(`/knowledge-base/scrapers/${type}`),
  
  // Entries Lifecycle & Bulk Actions
  getEntries: (params?: { limit?: number; offset?: number; type?: string }) =>
    apiClient.get<KnowledgeEntryListDto>('/knowledge-base/entries', { params }),
  updateEntry: (id: string, data: { title?: string; active?: boolean }) =>
    apiClient.patch(`/knowledge-base/entries/${id}`, data),
  deleteEntry: (id: string) => apiClient.delete(`/knowledge-base/entries/${id}`),
  bulkDeleteEntries: (ids: string[]) => apiClient.post('/knowledge-base/entries/bulk-delete', { ids }),
  reindexEntry: (id: string) => apiClient.post(`/knowledge-base/entries/${id}/reindex`),
  
  // Lead Qualification
  getQualification: () => apiClient.get<QualificationRulesDto>('/knowledge-base/qualification'),
  updateQualification: (data: QualificationRulesDto) => apiClient.put('/knowledge-base/qualification', data),
  
  // Search Sandbox
  testSearch: (q: string, k?: number) =>
    apiClient.get<SearchTestResponseDto>('/knowledge-base/search', { params: { q, k } }),
};
```

### 5.2 AI Engine API Extensions (`lib/api/aiEngine.ts`)

```typescript
// Enhanced AI Engine API:
export const aiEngineApi = {
  getConfig: () => apiClient.get<AiConfigDto>('/ai-engine/config'),
  updateConfig: (data: UpdateAiConfigPayload) => apiClient.patch('/ai-engine/config', data),
  getTools: () => apiClient.get<AiToolsResponseDto>('/ai-engine/tools'),
  updateTool: (toolName: string, data: { enabled: boolean; customDescription?: string }) =>
    apiClient.patch(`/ai-engine/tools/${toolName}`, data),
  getPromptPreview: () => apiClient.get<PromptPreviewDto>('/ai-engine/prompt-preview'),
  testMessage: (message: string) => apiClient.post<AiTestResponseDto>('/ai-engine/test', { message }),
};
```

---

## 6. Target File Map

To maintain clean code architecture, every component is split into modular units strictly under **400 lines of code**:

| File Path | Action | Purpose / Responsibilities |
| :--- | :---: | :--- |
| `types/knowledgeBase.ts` | **NEW** | TypeScript interfaces for entries, notes, documents, scrapers, qualification, stats |
| `types/aiEngine.ts` | **MODIFY** | Extended types for tools list, tool toggle, and compiled prompt preview |
| `lib/api/knowledgeBase.ts` | **NEW** | Complete client wrapper for `/knowledge-base/*` endpoints |
| `lib/api/aiEngine.ts` | **MODIFY** | Added `getTools`, `updateTool`, `getPromptPreview` methods |
| `hooks/useKnowledgeBase.ts` | **NEW** | SWR hooks for stats, documents, notes, scrapers, and entries caching |
| `app/(dashboard)/settings/knowledge-base/page.tsx` | **NEW** | Server metadata page for Knowledge Base Hub |
| `components/dashboard/settings/SettingsNav.tsx` | **MODIFY** | Add "База знаний" item pointing to `/settings/knowledge-base` |
| `components/dashboard/settings/knowledge-base/KnowledgeBaseManager.tsx` | **NEW** | Main container with tabs (Источники, Квалификация, Поиск) |
| `components/dashboard/settings/knowledge-base/KbStatsHeader.tsx` | **NEW** | Overview stats cards (entries count, chunks, storage, status) |
| `components/dashboard/settings/knowledge-base/KbDocumentsTab.tsx` | **NEW** | Upload dropzone, files table, active toggle, bulk delete |
| `components/dashboard/settings/knowledge-base/KbNotesTab.tsx` | **NEW** | Operational notes list, create/edit modals, re-indexing |
| `components/dashboard/settings/knowledge-base/KbNoteEditModal.tsx` | **NEW** | Modal to edit manual note content and title |
| `components/dashboard/settings/knowledge-base/KbWebsiteScraperTab.tsx` | **NEW** | Website URL crawl starter, live progress bar, clear data |
| `components/dashboard/settings/knowledge-base/KbTwoGisScraperTab.tsx` | **NEW** | 2GIS catalog sync starter, status card, clear data |
| `components/dashboard/settings/knowledge-base/KbQualificationTab.tsx` | **NEW** | Lead qualification rules editor (questions, disqualifiers, limits) |
| `components/dashboard/settings/knowledge-base/KbSearchTesterModal.tsx` | **NEW** | Direct semantic vector search test dialog with chunk preview |
| `components/dashboard/settings/ai-agent/AgentConfig.tsx` | **MODIFY** | Integrate prompt inspector button, tools manager, enhanced test drawer |
| `components/dashboard/settings/ai-agent/AiToolsManager.tsx` | **NEW** | AI database tools activation cards & schema viewer |
| `components/dashboard/settings/ai-agent/AiPromptInspectorModal.tsx` | **NEW** | Modal displaying compiled Layer 1-4 prompt with token estimation |
| `components/dashboard/settings/ai-agent/AiSandboxDrawer.tsx` | **MODIFY** | Render step-by-step tool execution results, latency, and RAG matches |
| `locales/translation_keys_new.json` | **MODIFY** | Russian translations for all new knowledge base UI keys |

---

## 7. Implementation Checklist

### Phase 1: Types & API Layer
- [x] Create `types/knowledgeBase.ts` with all DTO definitions based on `openapi.json` & backend plan.
- [x] Extend `types/aiEngine.ts` with tool config and prompt preview schemas.
- [x] Create `lib/api/knowledgeBase.ts` with typed methods for all `/knowledge-base/*` endpoints.
- [x] Update `lib/api/aiEngine.ts` with tools and prompt inspection methods.
- [x] Create `hooks/useKnowledgeBase.ts` SWR wrapper for automated caching and optimistic mutations.

### Phase 2: Knowledge Base Hub & Overview Stats
- [x] Create route `app/(dashboard)/settings/knowledge-base/page.tsx`.
- [x] Update `components/dashboard/settings/SettingsNav.tsx` with "База знаний" tab.
- [x] Build `KbStatsHeader.tsx` displaying entry counts, chunk totals, storage bytes, and status summary.
- [x] Build `KnowledgeBaseManager.tsx` tab shell (Источники, Квалификация, Поиск).

### Phase 3: Data Sources Management (Documents, Notes, Scrapers)
- [x] Build `KbDocumentsTab.tsx` with drag-and-drop file upload, active toggle, re-index, and bulk delete.
- [x] Build `KbNotesTab.tsx` and `KbNoteEditModal.tsx` with instant AI embedding on edit/create.
- [x] Build `KbWebsiteScraperTab.tsx` with force-recrawl toggle, live crawling status, and purge option.
- [x] Build `KbTwoGisScraperTab.tsx` with 2GIS sync trigger, live item count, and purge option.

### Phase 4: Lead Qualification & Semantic Search Sandbox
- [x] Build `KbQualificationTab.tsx` for post-onboarding screening rules, disqualifiers, and budget limits.
- [x] Build `KbSearchTesterModal.tsx` for direct vector retrieval debugging with top-k preview and score display.

### Phase 5: AI Tools Matrix & Prompt Inspector
- [x] Build `AiToolsManager.tsx` with toggle switches for `search_knowledge_base`, `get_available_slots`, `create_booking`, `escalate_to_human`.
- [x] Build `AiPromptInspectorModal.tsx` displaying the complete compiled prompt with dynamic variables and token estimates.
- [x] Enhance `AiSandboxDrawer.tsx` to display real-time tool execution logs, parameters, and response latency.

### Phase 6: Translations & QA Validation
- [x] Add all Russian translation keys to `locales/translation_keys_new.json`.
- [x] Run `node scripts/apply-translation-keys.mjs` to merge keys into `locales/ru/*.json`.
- [x] Verify that all components stay under 400 lines of code.
- [x] Test end-to-end user flows (uploading docs, editing notes, running scrapers, toggling tools, and testing AI sandbox).
