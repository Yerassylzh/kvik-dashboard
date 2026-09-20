# 021 — Round Robin: Frontend Integration Plan

> **Document Type:** Frontend Feature Spec  
> **Depends on:** `dev_docs/backend/050_ROUND_ROBIN_PLAN.md`  
> **Status:** Ready for implementation

---

## 1. Impact Analysis — What Touches the Frontend?

### ✅ Things that are purely backend (no frontend changes needed)

| Area | Why |
|---|---|
| `RoundRobinAssignmentService` core logic | Server-side only |
| AI engine disambiguation (`AMBIGUOUS_STAFF_NAME`) | Handled entirely inside the AI tool loop; Gemini replies in natural language |
| `lastAssignedAt` tracking | Backend atomically updates this; frontend only reads it as display data |
| `POST /bookings` auto-assignment | The booking creation form already supports omitting `staffId`; backend silently assigns — no UI change needed |
| `POST /bookings/preview-assignment` | Not yet in `openapi.json`; low priority — only useful if we add a "dry-run" feature |

---

### ⚠️ Things that DO touch the frontend

Three clear gaps require frontend work:

#### 1. New workspace-level settings UI — Round Robin configuration panel

`GET /workspaces/settings/round-robin` and `PUT /workspaces/settings/round-robin` are live in the backend (confirmed in `openapi.json`). There is **zero UI** for this today. The admin must be able to:

- Toggle global round-robin on/off (`roundRobinEnabled`)
- Choose distribution strategy: `LEAST_LOADED` | `CIRCULAR` | `WEIGHTED`
- Toggle `matchSpecialization` (restrict candidates to matching specialization)
- Toggle `considerWeeklyLoad` (rolling week vs. single day)

This belongs in **`/settings/staff`** (already exists as a page, currently empty — only has a redirect `page.tsx`). We'll build it out as a section card inside that settings page.

#### 2. Per-specialist round-robin controls in the staff list

`PATCH /staff/:id/round-robin` is live. Each staff row needs two new controls (visible only to OWNER / ADMIN_MANAGER):

- `roundRobinEnabled` toggle — whether this specialist participates in auto-assignment
- `roundRobinWeight` (1–5 integer) — only visible/editable when workspace strategy is `WEIGHTED`

The `StaffDto` type also needs three new fields that the backend now returns:
- `roundRobinEnabled: boolean`
- `roundRobinWeight: number`
- `lastAssignedAt: string | null`

#### 3. `activeBookingsToday` display (optional, low-priority)

The `GET /workspaces/settings/round-robin` response includes `activeBookingsToday` per staff member. This is a nice-to-have: we can show a small load indicator next to each specialist in the round-robin settings view.

---

## 2. File-Level Change Plan

### Layer 1 — TypeScript Types (`lib/api/staff.ts`)

#### MODIFY `lib/api/staff.ts`
- Add `roundRobinEnabled`, `roundRobinWeight`, `lastAssignedAt` to `StaffDto`
- Add `UpdateStaffRoundRobinPayload` interface (`{ roundRobinEnabled?: boolean; roundRobinWeight?: number }`)
- Add `staffApi.updateRoundRobin(id, payload)` method calling `PATCH /staff/:id/round-robin`

---

### Layer 2 — Workspace Round Robin API

#### NEW `lib/api/round-robin.ts`
- `RoundRobinSettings` interface (mirrors backend response)
- `RoundRobinStaffEntry` interface (per-staff row from `GET` response)
- `roundRobinApi.getSettings()` → `GET /workspaces/settings/round-robin`
- `roundRobinApi.updateSettings(payload)` → `PUT /workspaces/settings/round-robin`

---

### Layer 3 — React Hook

#### NEW `hooks/useRoundRobin.ts`
- Fetches workspace round-robin settings via SWR / React Query
- Exposes `settings`, `staff` list with load indicators, `updateSettings()`, `isLoading`
- Handles optimistic update on toggle

---

### Layer 4 — Settings Page UI

The current `/settings/staff` page is an empty stub. We'll build it out as:

#### MODIFY `app/(dashboard)/settings/staff/page.tsx`
- Import and render new `StaffSettingsPage` component

#### NEW `components/dashboard/settings/staff/StaffSettingsPage.tsx`
- Two `SectionCard` panels:
  1. **`RoundRobinGlobalCard`** — workspace-level strategy toggles
  2. **`RoundRobinStaffList`** — per-specialist participation toggles

#### NEW `components/dashboard/settings/staff/RoundRobinGlobalCard.tsx`
- Enable/disable toggle
- Strategy radio group (LEAST_LOADED / CIRCULAR / WEIGHTED)
- matchSpecialization toggle
- considerWeeklyLoad toggle
- Save button with loading state

#### NEW `components/dashboard/settings/staff/RoundRobinStaffList.tsx`
- Renders each specialist row with:
  - Name + avatar
  - `roundRobinEnabled` toggle (switch)
  - `roundRobinWeight` selector (1–5) — conditional on strategy being `WEIGHTED`
  - `activeBookingsToday` badge (from settings GET response)
  - `lastAssignedAt` relative timestamp

---

### Layer 5 — Translation Keys

All new UI strings go through the standard flow:
1. Add keys to `locales/translation_keys_new.json`
2. Run `node scripts/apply-translation-keys.mjs`
3. Run `node scripts/export-translation-keys.mjs`

---

## 3. Implementation Checklist

### Phase A — Types & API Client
- [ ] Add `roundRobinEnabled`, `roundRobinWeight`, `lastAssignedAt` to `StaffDto` in `lib/api/staff.ts`
- [ ] Add `UpdateStaffRoundRobinPayload` interface in `lib/api/staff.ts`
- [ ] Add `staffApi.updateRoundRobin(id, payload)` method in `lib/api/staff.ts`
- [ ] Create `lib/api/round-robin.ts` with `RoundRobinSettings`, `RoundRobinStaffEntry` types
- [ ] Add `roundRobinApi.getSettings()` and `roundRobinApi.updateSettings(payload)` in `lib/api/round-robin.ts`

### Phase B — Hook
- [ ] Create `hooks/useRoundRobin.ts` with SWR/query for settings + mutation helpers

### Phase C — Translation Keys
- [ ] Add all new i18n keys to `locales/translation_keys_new.json` (section: `settings.round_robin`)
- [ ] Run apply + export scripts

### Phase D — UI Components
- [ ] Create `RoundRobinGlobalCard.tsx` — global strategy config card
- [ ] Create `RoundRobinStaffList.tsx` — per-specialist toggle list with weight selector
- [ ] Create `StaffSettingsPage.tsx` — assembles both cards under `DashboardPageHeader`
- [ ] Update `app/(dashboard)/settings/staff/page.tsx` to render `StaffSettingsPage`

### Phase E — Verification
- [ ] Confirm `GET /workspaces/settings/round-robin` returns expected shape
- [ ] Toggle round-robin globally → `PUT` fires → optimistic UI updates correctly
- [ ] Toggle individual staff → `PATCH /staff/:id/round-robin` fires → row reflects new state
- [ ] Weight selector only visible when strategy is `WEIGHTED`
- [ ] Only OWNER / ADMIN_MANAGER can see the settings section (RBAC gate via `useRBAC`)

---

## 4. Out of Scope for Now

- `POST /bookings/preview-assignment` UI — not in `openapi.json` yet; skip
- Manual booking form "auto-assign" checkbox — current form works fine; auto-assign is default backend behavior when `staffId` is omitted
- AI disambiguation UI — fully handled server-side, no frontend changes
