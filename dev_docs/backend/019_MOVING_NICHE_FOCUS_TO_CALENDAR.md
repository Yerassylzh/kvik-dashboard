# 019 — Pivot to Calendar-Based Businesses Specification & Frontend Migration Guide

> **Status:** Active Spec & Implementation Guide  
> **Scope:** Calendar & Appointment-Driven Businesses Only (Beauty, Clinics, Fitness, Consulting, Professional Services)  
> **Deprecations:** Real Estate (Krisha.kz), Auto Sales (Kolesa.kz), Auto Service/Repair (СТО)

---

## 1. Overview & Strategic Pivot

The platform now focuses **exclusively on appointment-driven and calendar-based service businesses** where initial customer communications occur via messaging channels (WhatsApp, Instagram Direct, Telegram).

### Active Target Verticals

1. **`BEAUTY`**: Beauty salons, barbershops, nail studios, spas.
2. **`CLINIC`**: Medical centers, dental clinics, cosmetology, aesthetic medicine.
3. **`FITNESS`**: Fitness studios, yoga centers, personal trainers, crossfit gyms.
4. **`CONSULTING`**: Business consulting, legal services, coaching, psychological counseling.
5. **`OTHER_CALENDAR`**: Any service business operating on scheduled appointments/time slots.

### Deprecated Verticals (Obsolete)

- `REALTY` (Krisha.kz property listings)
- `AUTO_SALES` (Kolesa.kz car listings)
- `AUTO_SERVICE` (Kolesa.kz / Auto repair service bays)

---

## 2. Frontend Migration Guide & Endpoint Contract Changes

### Step 0: Niche Selection

- **Endpoint:** `POST /onboarding/step/niche`
- **Request Body:**
  ```json
  {
    "nicheProfile": "BEAUTY" // "BEAUTY" | "CLINIC" | "FITNESS" | "CONSULTING" | "OTHER_CALENDAR"
  }
  ```
- **Frontend Action:**
  - In the UI dropdown / card selector, display only the 5 calendar-based options.
  - Deprecated values (`REALTY`, `AUTO_SALES`, `AUTO_SERVICE`) will return `400 Bad Request` (`api.onboarding.niche_deprecated`).

---

### Step 1: Business Profile

- **Endpoints:** `POST /onboarding/step/business-profile` & `PUT /onboarding/step/business-profile`
- **Request Body:**
  ```json
  {
    "country": "KZ",
    "businessName": "Aura Beauty Studio",
    "city": "Almaty",
    "businessPhone": "+77011234567",
    "businessAddress": "пр. Достык 120",
    "workingHours": "Пн-Вс: 09:00 - 21:00",
    "businessDescription": "Премиальный салон красоты и спа-услуг",
    "websiteUrl": "https://aurabeauty.kz",
    "instagramUrl": "https://instagram.com/aurabeauty"
  }
  ```
- **Frontend Action:** Unchanged. Captures business identity and operating hours for slot calculation.

---

### Step 2: Knowledge Base Ingestion (Data Source)

> [!IMPORTANT]
> **Listing Crawl Deprecation:** Direct listing scraping via user ID (`POST /onboarding/step/data-source`) is **deprecated**. Calendar businesses ingest knowledge via 2GIS, Website scraping, Document upload, or Free-text notes.

Frontend should present these 4 knowledge ingestion options on Step 2:

#### Option A: 2GIS Catalog Scraping (Recommended for Salons/Clinics)

- **Endpoint:** `POST /onboarding/step/2gis-scraping`
- **Request Body:**
  ```json
  {
    "input": "https://2gis.kz/almaty/firm/70000001018612345"
  }
  ```
- **Status Polling:** `GET /onboarding/scraping/status?type=2gis`

#### Option B: Website Scraping (BFS Web Crawler)

- **Endpoint:** `POST /onboarding/step/website-scraping`
- **Request Body:**
  ```json
  {
    "websiteUrl": "https://aurabeauty.kz"
  }
  ```
- **Status Polling:** `GET /onboarding/scraping/status?type=website`

#### Option C: Upload Documents (PDF / DOCX / XLSX / TXT Price Lists)

- **Endpoint:** `POST /onboarding/step/knowledge-documents` (multipart/form-data with field `file`)
- **List Uploaded Files:** `GET /onboarding/knowledge-documents`

#### Option D: Manual Operational Notes

- **Endpoint:** `POST /onboarding/step/knowledge-notes`
- **Request Body:**
  ```json
  {
    "note": "Мастер Анна работает по чётным дням. Предоплата 2000 тг обязательна для процедур дольше 2 часов."
  }
  ```

---

### Step 3: Data Preview & Confirmation

- **Endpoints:**
  - `GET /onboarding/step/data-preview` (Quick preview of top items + parsing progress)
  - `GET /onboarding/knowledge-entries` (Full paginated list of scraped services, price items, documents, and notes)
  - `GET /onboarding/business-context` (AI-extracted Layer 2 summary: services, prices, team summary, booking rules)
  - `POST /onboarding/step/data-confirm` (User confirms knowledge base is correct)

---

### Step 4: Connect Messaging Channels

- **Endpoint:** `POST /onboarding/step/channel`
- **Supported Channels:** `WHATSAPP`, `INSTAGRAM`, `TELEGRAM`

---

### Step 5: Appointment Lead Qualification Rules

- **Endpoint:** `POST /onboarding/step/qualification` (or `POST /onboarding/step/qualification-rules`)
- **Request Body:**
  ```json
  {
    "questions": [
      "Какая услуга или процедура вас интересует?",
      "К какому мастеру/специалисту хотите записаться?",
      "На какую дату и примерное время вам удобно?"
    ],
    "customInstructions": "Всегда уточняй необходимость предварительной консультации перед сложным окрашиванием."
  }
  ```

---

### Step 6: Test Dialogue & Activation

- **Endpoints:**
  - `POST /onboarding/step/complete` (Sets `isActive = true`, completes onboarding)
  - `GET /onboarding/state` (Returns `{ step: "DONE", completed: true }`)

---

## 3. Backend Implementation Checklist

- [ ] **Archive Legacy Scrapers**: Move `krisha` and `kolesa` integration packages to `src/modules/integrations/_legacy/` so they are kept for future reference without active bindings.
- [ ] **Unlink Legacy Modules**: Remove `KrishaIntegrationModule` and `KolesaIntegrationModule` from `AppModule`, `OnboardingModule`, and `QueuesModule`.
- [ ] **Update BullMQ Processor**: Remove Krisha/Kolesa job handlers from active worker execution in `ParsingProcessor`.
- [ ] **Update Niche Enums & DTOs**:
  - Add `FITNESS` and `CONSULTING` to `NicheProfile` enum in Prisma and `src/common/types/index.ts`.
  - Restrict `SelectNicheDto` to calendar niches only (`BEAUTY`, `CLINIC`, `FITNESS`, `CONSULTING`, `OTHER_CALENDAR`).
  - Add validation guard in `OnboardingService.selectNiche` rejecting deprecated niches.
- [ ] **Deprecate `submitDataSource`**: Soft-disable `submitDataSource` with a descriptive error message directing users to 2GIS/Website/Docs/Notes.
- [ ] **Update 2GIS Allowed Niches**: Update `start2GisScraping` guard to allow only active calendar niches (remove `AUTO_SERVICE`).
- [ ] **Update AI Business Context Prompt**: Update `ExtractBusinessContextService` prompt template to reflect appointment businesses (Beauty, Clinics, Fitness, Consulting).
- [ ] **Update Database Seeder**: Rewrite `prisma/seed.ts` to seed an appointment/beauty studio workspace with staff and calendar-oriented knowledge entries.
- [ ] **Add Translation Keys**: Add new i18n keys for deprecated niche/data-source messages to `translation_keys_new.json`.
- [ ] **Compile & Verify**: Run `npm run build` and ensure all TypeScript files compile cleanly.
