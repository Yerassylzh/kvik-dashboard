# 044 — Booking Tool, Business Schedule & Availability Hierarchy System Plan

> **Document Type:** System Architecture & Implementation Blueprint  
> **Target Audience:** Backend Engineers, AI/Prompt Engineers, Fullstack Developers  
> **Status:** Architecture Plan & Implementation Roadmap  

---

## 1. Executive Summary & Questions Addressed

### Question 1: Do we currently save business working hours (exact start/end dates, thresholds, overrides)?
* **Current State:** **NO structured business schedule exists.**
  * In the database (`workspaces` table), `workingHours` is only a freeform text string (`String?`) like `"09:00 - 18:00"` or `"Пн-Пт 10-19"`.
  * There are **no structured daily thresholds** (`startTime`, `endTime`, `isOpen`, `slotDuration`) stored at the business level.
  * There are **no business-level schedule override endpoints** (e.g. clinic closed for public holiday, or reduced hours for the entire business on a specific date).
  * Working hours currently exist **only** as individual `AvailabilityTemplate` records tied to specific `StaffMember` IDs.

### Question 2: Why does the AI say there are no free slots while the calendar is completely empty?
* **Root Cause 1: Zero Default Templates on Staff Creation.** When a staff member is created (`POST /staff`), no `AvailabilityTemplate` records are created in DB. When `SlotCalculatorService` checks `templates.find(t => t.dayOfWeek === dayOfWeek)`, it finds `undefined` and returns `[]` (0 slots).
* **Root Cause 2: No Fallback to Clinic-Wide Schedule.** If a staff member has no custom template, or if no staff members are registered in the workspace, the system does not fall back to clinic default working hours. It immediately returns `0` available slots.
* **Root Cause 3: Direct 0-Slot Propagation to LLM.** `get_available_slots` returns `totalAvailableSlots: 0`, causing Gemini to respond: *"К сожалению, на выбранную дату нет свободных окон"* despite zero bookings in the database.
* **Root Cause 4: Tool Missing Slot Conflict Checks.** `handleCreateBooking` in `AgentToolsService` directly inserts bookings without checking `BookingsRepository.hasConflict` or verifying if the slot is within working hours.

### Question 3: What additional tools should AI have, and how should schedule hierarchy work?
* **Schedule Hierarchy:**
  ```
  [1. Business Date Override] (Holiday/Special Clinic Day)
             │
             ▼
  [2. Staff Date Override] (Vacation, Sick Leave, Custom Shift)
             │
             ▼
  [3. Staff Weekly Template] (Staff individual hours for day of week)
             │
             ▼
  [4. Business Weekly Template] (Default Clinic hours for day of week)
             │
             ▼
  [5. Booking Conflict Subtraction] (Subtract PENDING / CONFIRMED bookings)
  ```
* **AI Tool Suite Additions:**
  1. `get_available_slots` (Enhanced with business fallback + multi-staff aggregation).
  2. `create_booking` (Enhanced with conflict validation and master matching).
  3. `get_business_schedule` (Returns clinic working hours, open/closed days, holidays).
  4. `get_staff_members` (Lists active masters, roles, specialties, and work status).

---

## 2. Architecture Gaps Matrix

| Area | Current Implementation ("As-Is") | Required Target ("To-Be") |
|---|---|---|
| **Business Working Hours** | Unstructured `workspace.workingHours` string. | Structured `WorkspaceScheduleTemplate` (7 days of week, `startTime`, `endTime`, `isOpen`, `slotDuration`). |
| **Business Overrides** | None. | `WorkspaceScheduleOverride` (date, `isClosed`, `startTime`, `endTime`, `reason`). |
| **Staff Schedule Fallback** | Hard fail if staff has no `AvailabilityTemplate`. | Inherits from `WorkspaceScheduleTemplate` by default if custom templates are empty. |
| **Slot Calculation** | Requires `staffId` + explicit staff templates. | Supports both single-staff and multi-staff/general clinic slot generation with 4-level fallback. |
| **AI Tooling** | `get_available_slots`, `create_booking`, `search_knowledge_base`, `escalate_to_human`. | Added `get_business_schedule`, `get_staff_members`; fixed slot generation and pre-validation. |
| **Booking Creation in AI** | Bypasses conflict check and working hour boundary check. | Strictly validates slot availability before DB persistence. |

---

## 3. Database Schema Updates

### 3.1. Prisma Schema Additions (`prisma/schema.prisma`)

```prisma
model WorkspaceScheduleTemplate {
  id           String    @id @default(uuid())
  workspaceId  String
  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  dayOfWeek    Int       // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime    String    // e.g. "09:00"
  endTime      String    // e.g. "19:00"
  isOpen       Boolean   @default(true)
  slotDuration Int       @default(60) // Minutes
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([workspaceId, dayOfWeek])
  @@map("workspace_schedule_templates")
}

model WorkspaceScheduleOverride {
  id          String    @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  date        DateTime  @db.Date
  isClosed    Boolean   @default(true)
  startTime   String?   // e.g. "10:00" (if custom hours)
  endTime     String?   // e.g. "16:00"
  reason      String?   // e.g. "Наурыз Мейрамы", "Санитарный день"
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([workspaceId, date])
  @@map("workspace_schedule_overrides")
}
```

---

## 4. API Endpoints Specification

### 4.1. Business Schedule Management

#### `GET /workspaces/schedule`
* **Description:** Retrieve the 7-day default weekly schedule and active date overrides for the business.
* **Headers:** `Authorization: Bearer <token>`
* **Query Params:** `from` (optional YYYY-MM-DD), `to` (optional YYYY-MM-DD)
* **Response (200 OK):**
```json
{
  "templates": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "19:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "19:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 3, "startTime": "09:00", "endTime": "19:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 4, "startTime": "09:00", "endTime": "19:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 5, "startTime": "09:00", "endTime": "19:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 6, "startTime": "10:00", "endTime": "18:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 0, "startTime": "00:00", "endTime": "00:00", "isOpen": false, "slotDuration": 60 }
  ],
  "overrides": [
    {
      "id": "override-uuid-1",
      "date": "2026-03-22",
      "isClosed": true,
      "startTime": null,
      "endTime": null,
      "reason": "Наурыз Мейрамы"
    }
  ]
}
```

#### `PUT /workspaces/schedule`
* **Description:** Set or replace general 7-day weekly schedule for the business.
* **Roles:** `OWNER`, `ADMIN_MANAGER`
* **Request Body:**
```json
{
  "templates": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "19:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "19:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 3, "startTime": "09:00", "endTime": "19:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 4, "startTime": "09:00", "endTime": "19:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 5, "startTime": "09:00", "endTime": "19:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 6, "startTime": "10:00", "endTime": "18:00", "isOpen": true, "slotDuration": 60 },
    { "dayOfWeek": 0, "startTime": "00:00", "endTime": "00:00", "isOpen": false, "slotDuration": 60 }
  ]
}
```
* **Response (200 OK):**
```json
{
  "code": "workspaces.schedule_updated",
  "message": "Business schedule updated."
}
```

#### `POST /workspaces/schedule/overrides`
* **Description:** Add or update a specific date override for the entire business.
* **Roles:** `OWNER`, `ADMIN_MANAGER`
* **Request Body:**
```json
{
  "date": "2026-10-25",
  "isClosed": true,
  "startTime": null,
  "endTime": null,
  "reason": "День Республики"
}
```
* **Response (201 Created):**
```json
{
  "id": "override-uuid-2",
  "workspaceId": "workspace-uuid",
  "date": "2026-10-25",
  "isClosed": true,
  "startTime": null,
  "endTime": null,
  "reason": "День Республики"
}
```

#### `DELETE /workspaces/schedule/overrides/:id`
* **Description:** Remove a business date override.
* **Roles:** `OWNER`, `ADMIN_MANAGER`
* **Response (200 OK):**
```json
{
  "code": "workspaces.override_removed",
  "message": "Business schedule override removed."
}
```

---

### 4.2. Staff Schedule & Overrides (Existing & Enhanced)

* `GET /staff/:id/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD`
* `PUT /staff/:id/schedule` — sets individual custom templates (if empty, staff inherits clinic schedule).
* `POST /staff/:id/overrides` — sets staff date-specific override (`isBlocked`, custom hours).
* `DELETE /staff/:id/overrides/:overrideId` — removes staff date override.

---

### 4.3. Universal Slot Engine API

#### `GET /bookings/slots`
* **Query Params:**
  * `date` (string, required, e.g. `"2026-09-15"`)
  * `staffId` (UUID, optional — if omitted, calculates across all active staff / clinic)
  * `durationMinutes` (number, optional, default: `60`)
* **Response (200 OK):**
```json
{
  "date": "2026-09-15",
  "dayOfWeek": 2,
  "isBusinessOpen": true,
  "durationMinutes": 60,
  "totalAvailableSlots": 8,
  "slots": [
    { "startTime": "09:00", "endTime": "10:00", "available": true, "staff": [{ "id": "staff-1", "name": "Анна" }] },
    { "startTime": "10:00", "endTime": "11:00", "available": true, "staff": [{ "id": "staff-1", "name": "Анна" }] },
    { "startTime": "11:00", "endTime": "12:00", "available": false, "staff": [] },
    { "startTime": "14:00", "endTime": "15:00", "available": true, "staff": [{ "id": "staff-1", "name": "Анна" }] }
  ]
}
```

---

## 5. AI Tool Declarations & Execution Specs

### 5.1. Tool 1: `get_business_schedule` (NEW)
* **Declaration:**
```typescript
{
  name: 'get_business_schedule',
  description: 'Retrieves general working hours, working days, weekend policies, and public holiday overrides for the business.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: 'Optional date in YYYY-MM-DD format to check specific working status.'
      }
    }
  }
}
```
* **Execution Logic:** Reads `WorkspaceScheduleTemplate` + `WorkspaceScheduleOverride` and returns clear human-readable status + intervals.

### 5.2. Tool 2: `get_staff_members` (NEW)
* **Declaration:**
```typescript
{
  name: 'get_staff_members',
  description: 'Lists active specialists/masters in the company, their roles, and service specializations.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      specialization: {
        type: Type.STRING,
        description: 'Optional service or skill filter (e.g. "Маникюр", "Окрашивание", "Терапевт").'
      }
    }
  }
}
```
* **Execution Logic:** Queries active `StaffMember` records in the workspace, matching specializations if requested.

### 5.3. Tool 3: `get_available_slots` (ENHANCED)
* **Declaration:**
```typescript
{
  name: 'get_available_slots',
  description: 'Retrieves free appointment time slots for a specified date, filtered optionally by master name, specialization, or service duration.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: 'Target date in YYYY-MM-DD format (e.g. "2026-09-15").'
      },
      staffName: {
        type: Type.STRING,
        description: 'Optional name of the preferred staff member/master.'
      },
      durationMinutes: {
        type: Type.INTEGER,
        description: 'Estimated service duration in minutes (default: 60).'
      }
    },
    required: ['date']
  }
}
```
* **Execution Logic with Hierarchy:**
  1. Parse `date` in application timezone (`Asia/Almaty`).
  2. Check `WorkspaceScheduleOverride`: if closed -> return `0` slots with reason.
  3. Fetch active staff members. If no staff members exist -> use `WorkspaceScheduleTemplate` as direct single-calendar fallback.
  4. For each staff member:
     * Check staff `AvailabilityOverride` for that date.
     * If no staff override, check staff `AvailabilityTemplate`.
     * If no staff template, fallback to `WorkspaceScheduleTemplate`.
     * Fetch existing bookings (`PENDING`, `CONFIRMED`) and compute free windows.
  5. Aggregate and return available slot start times (`"09:00"`, `"10:00"`).

### 5.4. Tool 4: `create_booking` (ENHANCED)
* **Execution Logic:**
  1. Validates ISO `startTime` and `durationMinutes`.
  2. Resolves `staffId` (by exact/fuzzy match from `staffName` or assigns available master).
  3. Verifies time slot is within working hours of that day.
  4. Calls `BookingsRepository.hasConflict(staffId, startTime, endTime)` — throws conflict if already booked.
  5. Persists booking in DB with `PENDING` / `CONFIRMED` status.
  6. Returns booking details with formatted date/time.

---

## 6. Default Fallback & Seed Policy

To ensure the AI **never** reports "no slots" for an empty calendar:
1. **Workspace Creation Default:** When a workspace is created, auto-seed 7 `WorkspaceScheduleTemplate` records (Monday–Friday 09:00–18:00 open, Saturday–Sunday 10:00–16:00 or closed).
2. **Staff Inheritance:** When a staff member has 0 `AvailabilityTemplate` records, `SlotCalculatorService` automatically inherits `WorkspaceScheduleTemplate`.
3. **Empty Staff Fallback:** If a business has not yet configured staff members, slot calculation uses the business schedule directly.

---

## 7. Implementation Checklist

- [x] **Phase 1: Database & Repositories**
  - [x] Add `WorkspaceScheduleTemplate` and `WorkspaceScheduleOverride` models to `prisma/schema.prisma`.
  - [x] Remove legacy unstructured `workingHours` string from `Workspace` model and DTOs.
  - [x] Create SQL migration `20260916120000_business_schedule_and_overrides`.
  - [x] Create `WorkspacesScheduleRepository` with CRUD methods for weekly templates and date overrides.
- [x] **Phase 2: Business Schedule Controllers & Services**
  - [x] Implement `GET /workspaces/schedule`, `PUT /workspaces/schedule`.
  - [x] Implement `POST /workspaces/schedule/overrides`, `DELETE /workspaces/schedule/overrides/:id`.
  - [x] Implement `DELETE /staff/:id/schedule` for resetting staff to general business schedule.
  - [x] Auto-seed default business schedule templates when empty.
- [x] **Phase 3: Slot Calculator & Availability Hierarchy**
  - [x] Refactor `SlotCalculatorService.computeSlots` to support 4-tier hierarchy: Business Override -> Staff Override -> Staff Template -> Business Template.
  - [x] Filter out non-specialists (`SystemRole.SPECIALIST` only accepts bookings).
  - [x] Update `BookingsService.getAvailableSlots` to resolve clinic defaults and specialist aggregation.
- [x] **Phase 4: AI Agent Tools & System Prompt**
  - [x] Register `get_business_schedule` and `get_staff_members` in `AGENT_TOOL_DECLARATIONS`.
  - [x] Implement tool handlers in `AgentToolsService` with specialist filtering and booking notice.
  - [x] Fix `handleCreateBooking` to enforce conflict checking, working hour boundaries, and specialist assignment.
  - [x] Update `NichePolicyService` prompt guidelines to instruct AI on how to query staff and business schedules.
  - [x] Update `SlotValidationService` to use `WorkspacesScheduleRepository` and specialist filtering.
- [x] **Phase 5: Verification & Tests**
  - [x] Unit tests for `SlotCalculatorService` (`slot-calculator.service.spec.ts`).
  - [x] Unit tests for `WorkspacesScheduleService` (`workspaces-schedule.service.spec.ts`).
  - [x] Update `translation_keys_new.json` with all new localized error and status codes.

