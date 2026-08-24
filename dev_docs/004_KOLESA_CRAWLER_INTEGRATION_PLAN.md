# 004 — Kolesa Scraper & Onboarding Integration Plan

> **Goal:** Build a robust, niche-aware onboarding system in the frontend that integrates seamlessly with backend scraper engines (Kolesa.kz for Auto Sales & Krisha.kz for Realty) and service-based onboarding flows.  
> **Backend Contract:** `openapi.json`  
> **Status:** Planning phase  

---

## 1. Core Architectural Requirements

1. **Derived State (`GET /onboarding/state`)**:
   - The backend owns the onboarding state machine.
   - On application load or page refresh, call `GET /onboarding/state` to synchronize current progress (`step`, `stepIndex`, `parsingStatus`, `parsedCount`, `totalCount`, `failedCount`, `error`).
   - **Strict Rule:** Do NOT store `step` or `stepIndex` in `localStorage`. Only persist non-sensitive user input drafts if needed. State resolution on mount must strictly originate from `GET /onboarding/state`.

2. **Data Crawl Polling (`DATA_SOURCE` → `DATA_PREVIEW`)**:
   - Step 2 (`POST /onboarding/step/data-source`) sends the profile ID/URL to trigger background scraping.
   - Response returns `DataSourceResponseDto` containing `parsingStatus` (`"QUEUED"`, `"PROCESSING"`).
   - While `parsingStatus` is `"QUEUED"` or `"PROCESSING"`, poll `GET /onboarding/state` (or `GET /onboarding/step/data-preview`) every **2.5 seconds**.
   - As soon as `parsingStatus` changes to `"DONE"`, automatically advance to Step 3 (`DATA_PREVIEW`) cards view.
   - If `parsingStatus` becomes `"FAILED"`, present an error alert and offer a "Retry" / "Edit Profile ID" action.

3. **Niche Input Labels & Localization**:
   - `REALTY` → Step 2 Label: **"Krisha.kz Profile ID / URL"** (Catalog import of property listings).
   - `AUTO_SALES` → Step 2 Label: **"Kolesa.kz Profile ID / URL"** (Catalog import of vehicle inventory).
   - `AUTO_SERVICE` → Step 2 Label: **"2GIS / Instagram Profile or Service Price List URL"** (Service & appointment booking profile — СТО, детейлинг, шиномонтаж).
   - Other service niches (`BEAUTY`, `CLINIC`, `OTHER_CALENDAR`) → **"Business Profile / Booking Service Link"**.

---

## 2. Services & Data Layer

### 2.1 API Service (`lib/api/onboarding.ts`)
Map `openapi.json` definitions directly:
- `getOnboardingState()`: `GET /onboarding/state` → `OnboardingStateResponse`
- `selectNicheStep(nicheProfile)`: `POST /onboarding/step/niche` → `OnboardingStateResponse`
- `submitBusinessProfile(dto)`: `POST /onboarding/step/business-profile` → `OnboardingStateResponse`
- `submitDataSource(dto)`: `POST /onboarding/step/data-source` → `DataSourceResponseDto`
- `getDataPreview()`: `GET /onboarding/step/data-preview` → `DataPreviewResponse`
- `confirmDataPreview()`: `POST /onboarding/step/data-confirm` → `OnboardingStateResponse`
- `submitChannel(dto)`: `POST /onboarding/step/channel` → `OnboardingStateResponse`
- `submitQualification(dto)`: `POST /onboarding/step/qualification` → `OnboardingStateResponse`
- `completeOnboarding()`: `POST /onboarding/step/complete` → `OnboardingStateResponse`

### 2.2 Store Management (`store/onboarding.store.ts`)
- Update Zustand state persistence (`partialize`):
  - **Remove `step` and `stepIndex` from `partialize`** to satisfy the derived state invariant (backend as single source of truth on mount).
  - Retain `nicheProfile`, `businessProfile`, and `dataSourceInput` for draft recovery.
- Generalize `krishaUserId` field to `dataSourceInput` to handle Kolesa.kz, Krisha.kz, and Service profile IDs/URLs.

### 2.3 Type Definitions (`types/niche.ts`)
- `NicheProfile`: `'REALTY' | 'AUTO_SALES' | 'AUTO_SERVICE' | 'BEAUTY' | 'CLINIC' | 'OTHER_CALENDAR'`
- `ParsingStatus`: `'IDLE' | 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED'`
- `OnboardingStepState`: `'SELECT_NICHE' | 'BUSINESS_PROFILE' | 'DATA_SOURCE' | 'DATA_PREVIEW' | 'CONNECT_CHANNEL' | 'QUALIFICATION' | 'COMPLETE_TEST' | 'DONE'`
- DTO interfaces for all request and response structures matching `openapi.json`.

---

## 3. Frontend Component & UI Design

### 3.1 Step 2: Data Source (`components/onboarding/StepDataSource.tsx`)
- Dynamic header & labels based on `nicheProfile`:
  - **REALTY**: "Krisha.kz Profile ID / URL"
  - **AUTO_SALES**: "Kolesa.kz Profile ID / URL"
  - **AUTO_SERVICE**: "2GIS / Instagram Profile or Service Price List URL"
  - **BEAUTY / CLINIC / OTHER_CALENDAR**: "Business Profile / Service Link"
- Custom helper box explaining where to find the ID/URL for Kolesa, Krisha, or Service profiles.
- Form validation for non-empty input, loading state during initial submit.

### 3.2 Step 3: Data Preview (`components/onboarding/StepDataPreview.tsx`)
- **Active Crawling State (`QUEUED` / `PROCESSING`)**:
  - Animated pulsing progress bar with live counts (`parsedCount` / `totalCount`).
  - Skeleton loaders for cards as data streams in.
- **Completed Crawling State (`DONE`)**:
  - Grid preview of parsed items (showing photos/specs for vehicle catalog in `AUTO_SALES` or property listings in `REALTY`, or service items for service niches).
  - Summary stats bar (Total objects parsed, status badge).
  - "Confirm & Continue" CTA button.
- **Failed State (`FAILED`)**:
  - High-visibility warning alert with `error` message.
  - Action buttons: "Retry Scraping" and "Change Profile URL/ID".

### 3.3 Main Onboarding Flow (`app/(onboarding)/onboarding/page.tsx`)
- Derived state initialization via `useEffect` executing `getOnboardingState()` on load.
- Polling controller:
  - Active interval when `parsingStatus` is `"QUEUED"` or `"PROCESSING"`.
  - Poll interval: **2500ms** (2.5s).
  - Automatic cleanup on unmount or when status transitions to `DONE` / `FAILED`.

---

## 4. Implementation Checklist

- [x] **Data Layer & Store**
  - [x] Remove `step` and `stepIndex` from `partialize` in `store/onboarding.store.ts`.
  - [x] Rename/alias `krishaUserId` to `dataSourceInput`.
  - [x] Verify `lib/api/onboarding.ts` type-safe client methods for all 8 onboarding endpoints.

- [x] **Step 2 (Data Source)**
  - [x] Update `StepDataSource.tsx` to receive `nicheProfile`.
  - [x] Implement conditional input labels & help tooltips:
    - `REALTY` → Krisha.kz Profile ID / URL
    - `AUTO_SALES` → Kolesa.kz Profile ID / URL
    - `AUTO_SERVICE` → 2GIS / Instagram Profile / Price List URL
    - Services → Business Profile Link
  - [x] Update placeholder and helper tooltip text.

- [x] **Step 3 (Data Preview & Polling)**
  - [x] Implement 2.5s polling loop in `page.tsx` for `QUEUED` / `PROCESSING` states.
  - [x] Handle transition from `DATA_SOURCE` to `DATA_PREVIEW` upon scraper response.
  - [x] Render preview cards adaptively for Auto Sales vs Realty vs Service data structures.
  - [x] Provide retry logic on `FAILED` parsing status.

- [x] **Testing & Verification**
  - [x] Test full onboarding flow across different niches (`AUTO_SALES`, `REALTY`, `AUTO_SERVICE`).
  - [x] Verify refresh behavior on each step (Derived State test via `GET /onboarding/state`).
  - [x] Verify `tsc --noEmit` and `next build`.

