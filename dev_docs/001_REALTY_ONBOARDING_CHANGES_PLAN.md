# 001 — Onboarding: Frontend Changes Plan for the New Backend Contract

> **Source:** `backend/004_REALTY_ONBOARDING_FIXES_PREVIEW.md`
> **Goal:** Align frontend with the updated contract; bring REALTY onboarding to a fully completable state (`DONE`).
> **Status:** Implemented. All changes across files (1–6) are made; `tsc --noEmit`, `eslint`, `next build` pass cleanly.

---

## Context (What the Backend Changed)

1. **All POST steps return the full `OnboardingState`** (previously empty body). → Step is taken directly from the mutation response, no redundant `GET /state` needed.
2. **`parsingStatus` is authoritative** — worker explicitly sets `DONE`/`FAILED`. → Completion is detected by status, not by counters.
3. **New endpoints** `POST /step/channel` and `POST /step/qualification`. → Onboarding can be completed all the way to `DONE`; fake in-memory transitions are removed.
4. **`data-preview` unified:** `total` removed, `failedCount` and `error?` added.
5. **`/step/complete` protected:** `400` if called when not on the `COMPLETE_TEST` step.

Lifecycle nuance: after `POST /data-source`, backend keeps `step = DATA_SOURCE` until the worker writes the first record, → **polling is needed on `DATA_SOURCE` as well**, not just on `DATA_PREVIEW`.

---

## Changes by File

### 1. `types/niche.ts`
- `ParsingStatus`: add `'QUEUED'` → `'IDLE' | 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED'`.
- `OnboardingStateResponse`: add `failedCount?: number`, `error?: string`.
- `DataPreviewResponse`: remove `total`; add `failedCount: number`, `error?: string`.
- New DTOs: `ChannelDto { type: 'WHATSAPP'|'INSTAGRAM'|'TELEGRAM'; credentials: Record<string, unknown> }`, `QualificationDto { budgetMin?; budgetMax?; mortgage?; district?; urgency? }`.

### 2. `lib/api/onboarding.ts`
- `submitChannel(dto: ChannelDto)` → `POST /onboarding/step/channel` → `OnboardingStateResponse`.
- `submitQualification(dto: QualificationDto)` → `POST /onboarding/step/qualification` → `OnboardingStateResponse`.
- `submitDataSource` — response type `OnboardingStateResponse & { message?: string }`.

### 3. `store/onboarding.store.ts`
- Wrap in `persist` (localStorage, key `kvik-onboarding`) — so F5 doesn't reset the step.
- `dataPreview`: add `failedCount`, `error?`.
- `setDataPreview` — accept new fields.

### 4. `app/(onboarding)/onboarding/page.tsx`
- Step progression — from POST response (backend returns full state); remove brittle index-based fallback.
- **Polling** trigger on `DATA_SOURCE` **and** `DATA_PREVIEW`; stop when `parsingStatus ∈ {DONE, FAILED}`; poll hits `GET /state` (catches transition `DATA_SOURCE → DATA_PREVIEW`) + `GET /data-preview` for cards.
- Remove silent `catch {}` in polling — display error.
- **Remove fake transitions** `setStepState('QUALIFICATION', 5)` / `('COMPLETE_TEST', 6)` → call real `submitChannel` / `submitQualification`.
- `handleComplete` — call `completeOnboarding()` only on `COMPLETE_TEST`.

### 5. Step Components
- **`StepDataPreview.tsx`:** spinner on `{QUEUED, PROCESSING}`; "completed" on `DONE`; `FAILED` branch (`error` text + "Retry" button); "valid ID, 0 listings" branch (`DONE && totalCount === 0`); use `totalCount`/`entries.length`, not `total`.
- **`StepConnectChannel.tsx`:** pass selected `type` to `onConnect`; "Skip" — still without channel (then we don't submit step, but advance via real response — see task note).
- **`StepQualification.tsx`:** collect real fields (`budgetMin/Max`, `mortgage`, `district`, `urgency`) and pass to `onSubmit`.

### 6. `app/layout.tsx` + new `components/providers/AuthProvider.tsx`
- Client provider `AuthProvider`, performing silent-refresh on mount (`refresh` → `me`), wrapped around `{children}` in server root layout (pattern from local Next docs `05-server-and-client-components`). Eliminates loss of in-memory token on F5 at `/onboarding`.

---

## Implementation Order
1. Types → 2. API functions → 3. Store (persist) → 4. Step components → 5. Onboarding page (flow + polling) → 6. AuthProvider + root layout → 7. Typecheck/build.

## Out of Frontend Scope (Documented, do not implement)
- Real channel adapters (WhatsApp/IG webhooks) — Backend Phase 4; currently `POST /step/channel` only creates `Channel(active:true)`.
- Kolesa/AUTO and calendar onboarding branches — separate task (current flow is tailored for REALTY).
