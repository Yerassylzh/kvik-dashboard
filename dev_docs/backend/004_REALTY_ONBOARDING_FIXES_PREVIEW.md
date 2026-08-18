# 📦 Onboarding — Backend Changes (Frontend Guide)

> **Related to:** `003_REALTY_ONBOARDING_FIXES_PLAN.md` (plan), `001_REALTY_ONBOARDING_PLAN.md` (base onboarding)  
> **Status:** Implemented and compiled (`npm run build` ✅), migration applied.  
> **Target Audience:** Frontend developer — required client-side changes.

---

## 1. TL;DR — Improvements Overview

1. **All POST steps return the full `OnboardingState`** (previously returned empty bodies). → No need for a GET `/state` after every POST; extract step directly from the mutation response.
2. **`parsingStatus` is now authoritative** — worker explicitly sets `DONE` and `FAILED`. → No need to infer completion from numeric counters; no infinite spinners.
3. **2 new endpoints added** — `POST /step/channel` (Step 4) and `POST /step/qualification` (Step 5). → Onboarding can be completed all the way to `DONE`. Fake in-memory transitions can be removed.
4. **`data-preview` unified** with `OnboardingState` (removed duplicate `total`, added `failedCount`/`error`).
5. **Counter race condition resolved** — `parsedCount`/`failedCount` increments are atomic in PostgreSQL (fixed inaccurate progress counters under concurrent scraping).

---

## 2. Unified State Type

Returned by `GET /state` and **all** POST mutation steps:

```typescript
interface OnboardingState {
  step: 'SELECT_NICHE' | 'BUSINESS_PROFILE' | 'DATA_SOURCE' | 'DATA_PREVIEW'
      | 'CONNECT_CHANNEL' | 'QUALIFICATION' | 'COMPLETE_TEST' | 'DONE';
  stepIndex: number;              // 0..7
  completed: boolean;             // true only on DONE

  // Only present on DATA_SOURCE (2) and DATA_PREVIEW (3) steps:
  parsingStatus?: 'IDLE' | 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
  parsedCount?: number;           // successfully parsed listings
  totalCount?: number;            // expected total listings (from Krisha crawl matrix)
  failedCount?: number;           // failed to parse
  error?: string;                 // error text when parsingStatus === 'FAILED'
}
```

> On steps 0, 1, 4, 5, 6, 7 parsing fields are `undefined`.

---

## 3. Complete Endpoint Contract

| Method | Path | Request Body | Response |
|---|---|---|---|
| GET | `/onboarding/state` | — | `OnboardingState` |
| POST | `/onboarding/step/niche` | `{ nicheProfile }` | `OnboardingState` |
| POST | `/onboarding/step/business-profile` | `BusinessProfile` | `OnboardingState` |
| POST | `/onboarding/step/data-source` | `{ userId }` | `OnboardingState & { message }` |
| GET | `/onboarding/step/data-preview` | — | `DataPreview` (see below) |
| POST | `/onboarding/step/data-confirm` | — | `OnboardingState` |
| POST | `/onboarding/step/channel` 🆕 | `{ type, credentials }` | `OnboardingState` |
| POST | `/onboarding/step/qualification` 🆕 | `Qualification` | `OnboardingState` |
| POST | `/onboarding/step/complete` | — | `OnboardingState` |

### `DataPreview` (GET /step/data-preview)
```typescript
{
  entries: KnowledgeEntry[];   // first 20 listings for preview
  parsingStatus: 'IDLE' | 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
  parsedCount: number;
  totalCount: number;
  failedCount: number;
  error?: string;
}
```
> ⚠️ Field `total` is **removed**. Use `totalCount` for total expected count and `entries.length` for currently loaded preview entries.

### New POST Bodies

**`POST /step/channel`** (Step 4):
```typescript
{
  type: 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM';
  credentials: Record<string, unknown>;  // non-empty credentials object
}
```

**`POST /step/qualification`** (Step 5) — all fields optional:
```typescript
{
  budgetMin?: number;
  budgetMax?: number;
  mortgage?: boolean;
  district?: string;
  urgency?: 'low' | 'medium' | 'high';
}
```

---

## 4. Parsing Lifecycle (Polling Guidelines)

```
POST /data-source  →  QUEUED
      (worker starts discovery)  →  PROCESSING
             ├─ all listings processed, some succeeded  →  DONE
             ├─ 0 listings on profile (valid ID)        →  DONE (totalCount = 0)
             └─ discovery failed / all listings failed  →  FAILED (+ error)
```

**Rules for Frontend:**
- Show parsing spinner when `parsingStatus ∈ {QUEUED, PROCESSING}`.
- Progress bar: `parsedCount / totalCount` (when `totalCount > 0`).
- Completion trigger: `parsingStatus ∈ {DONE, FAILED}` — **not** counter comparison.
- On `FAILED`, display `error` message and provide a "Retry" action (`POST /data-source`).
- `totalCount === 0 && parsingStatus === 'DONE'` — valid user ID but no active listings: show empty-state UI, not an error.

---

## 5. Frontend Checklist

- [ ] **Remove GET `/state` after every POST** — consume `OnboardingState` directly from POST responses.
- [ ] **Align status enum** to `IDLE | QUEUED | PROCESSING | DONE | FAILED` (include `QUEUED` and `FAILED`).
- [ ] **Detect parsing completion** via `parsingStatus`, not by checking `parsedCount >= totalCount`.
- [ ] **Handle `FAILED` status** — render error UI + display `error` + provide retry button.
- [ ] **`data-preview` updates:** replace references to `total` with `totalCount` (or `entries.length`).
- [ ] **Remove fake transitions** like `setStepState('QUALIFICATION', 5)` — call real endpoints `/step/channel` and `/step/qualification`.
- [ ] **Add UI for steps 4 & 5** (channel connection, qualification rules).
- [ ] **Polling interval:** continue polling on `DATA_SOURCE`/`DATA_PREVIEW` until `parsingStatus ∈ {DONE, FAILED}`, recommended interval ~2-3 seconds.
- [ ] Persist store + silent-refresh on app boot so refreshing (F5) retains auth token and current step.

---

## 6. `/step/complete` Guard

`POST /step/complete` is **protected**: it returns HTTP `400` if called before completing channel and qualification steps (`getState().step !== 'COMPLETE_TEST'`).

---

## 7. Standard Flow (Happy Path)

```
niche → business-profile → data-source → (poll until DONE)
      → data-confirm → channel → qualification → complete → DONE
```

Every POST mutation returns the latest state containing `step` and `stepIndex`.

---

## 8. Technical Details (Reference)

- `parsingStatus` and counters are stored in `Workspace.metadata` (JSONB) and updated **atomically** via `jsonb_set` in PostgreSQL.
- Qualification rules are stored in `Workspace.qualificationRules` (JSONB) with the `qualificationRulesSet` flag. Migration: `20260818094322_add_qualification_rules`.
- `POST /step/channel` creates a `Channel(active: true)` record.
- OpenAPI / Swagger documentation (`/api` or `/docs`) is updated with all schemas.
