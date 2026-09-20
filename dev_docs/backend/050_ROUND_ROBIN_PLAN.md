# 050 — Round Robin & Workload-Balanced Booking System Plan

> **Document Type:** System Architecture & Implementation Blueprint  
> **Target Audience:** Backend Engineers, AI/Prompt Engineers, System Architects  
> **Status:** Active Implementation Roadmap  

---

## 1. Executive Summary & Architectural Questions

### Question 1: Do we currently have a Round Robin system?
* **Current State:** **NO, Round Robin is NOT implemented.**
* **What happens right now:**
  * In the AI engine (`BookingsToolHandler.handleCreateBooking`), if a client books a slot without specifying a specialist name, the code queries all active specialists ordered by creation date (`orderBy: { createdAt: 'asc' }`) and assigns the **very first specialist** who has no conflict (`for (const spec of specialists) { ... break; }`).
  * In the REST API (`POST /bookings`), omitting `staffId` saves the booking with `staffId: null` (unassigned).
  * **Consequence:** The first registered specialist in the workspace receives nearly 100% of generic appointments, causing extreme specialist burnout and workload skew while other specialists sit idle.

---

### Question 2: Is it possible and is it easy to implement such a booking system?
* **Answer:** **YES, it is completely feasible and straightforward.**
* **Why:** The core scheduling primitives already exist in the codebase:
  1. `SlotCalculatorService` computes slot validity across business schedule templates, workspace overrides, staff schedule templates, staff date overrides, and existing booking conflicts.
  2. `BookingsAvailabilityService` aggregates slot availability across all specialists.
  3. A new `RoundRobinAssignmentService` acts as the intelligent selection layer on top of the already validated candidate specialist pool.

---

### Question 3: How does the AI behave with Round Robin?
* **Slot Browsing:** When a client asks for open times (e.g. *"What slots are open on Friday afternoon?"*), AI executes `get_available_slots`. The system aggregates and presents all valid slot windows across all working specialists.
* **Slot Selection & Booking:** When the client agrees to a slot (e.g. *"Book me for Friday at 14:00"*), the AI executes `create_booking(startTime: "...", serviceName: "...", ...)` without `staffName`/`staffId`.
* **Synchronous Round Robin Assignment:** The backend selects the optimal specialist (e.g. Elena) based on load balancing, creates the booking with `staffId: elena.id`, and returns `{ success: true, staffName: "Елена", startTime: "..." }`.
* **Explicit Preference Passthrough:** If the client explicitly requests a master (e.g. *"I want an appointment with Anna"*), the AI provides `staffName: "Anna"` or `staffId: "..."`, which bypasses round robin and books directly with Anna (subject to availability).

---

### Question 4: Can the AI still tell the client which specialist will service them?
* **Answer:** **YES, 100%.**
* Because Round Robin assignment is resolved **synchronously** inside the `create_booking` tool execution:
  * The tool output contains the assigned specialist's name: `staffName: "Елена"`.
  * Gemini receives this output in the conversation tool turn and formulates the natural confirmation:
    > *"Отлично, вы записаны на стрижку на пятницу, 15 сентября, в 14:00 к мастеру Елене!"*

---

### Question 5: Will schedule overriding work in that scenario?
* **Answer:** **YES, seamlessly without any conflict.**
* Round Robin only runs against the **qualified candidate pool** for that exact slot.
* Candidate qualification follows the strict 5-layer hierarchy:
  1. **Workspace Date Override:** If business is closed (`isClosed: true`), pool is empty (0 slots).
  2. **Staff Date Override:** If Specialist A is on vacation / day off (`isBlocked: true`), Specialist A is **excluded** from the candidate pool.
  3. **Staff Weekly Schedule Template:** If Friday is not a working day for Specialist B, Specialist B is **excluded**.
  4. **Workspace Default Schedule:** Used if staff has no individual template configured.
  5. **Booking Conflict Filter:** If Specialist C already has an overlapping appointment at 14:00, Specialist C is **excluded**.
* Round Robin ranking is evaluated **only among specialists who are physically working and free** during that specific slot.

---

### Question 6: What if we have two specialists with the same name (e.g., 2 Annas)? How does identification work?
* **Database & REST API:** `staffId` (UUID) is the true, immutable identifier across the entire platform.
* **AI Tooling Bridge:**
  * AI tool declarations (`create_booking`, `get_available_slots`, `reschedule_booking`) support both `staffId` (UUID) and `staffName` (string).
  * When AI calls `get_staff_members`, it receives all specialists with their unique `id`, `name`, `role`, and `specializations`.
  * **Disambiguation Guard:** If the client asks for "Анна" and the workspace has 2 active specialists matching "Анна" ("Анна Смирнова" — стилист and "Анна Иванова" — мастер маникюра), the backend detects the collision (`matched.length > 1`) and returns a structured disambiguation error:
    ```json
    {
      "code": "bookings.ambiguous_staff_name",
      "error": "AMBIGUOUS_STAFF_NAME",
      "message": "В компании несколько специалистов с именем Анна: Анна Смирнова (Стилист) и Анна Иванова (Мастер маникюра). Уточните, к кому записать клиента.",
      "candidates": [
        { "staffId": "uuid-1", "name": "Анна Смирнова", "role": "Стилист" },
        { "staffId": "uuid-2", "name": "Анна Иванова", "role": "Мастер маникюра" }
      ]
    }
    ```
    This prompts Gemini to naturally ask the client to clarify which Anna they wish to see, then Gemini passes the exact `staffId` or full name.

---

### Question 7: Why is "Filter Specialists by Service Specialization" Optional?
* **Default Universal Mode:** In most salons, clinics, and studios, **all specialists are universal** and can perform all standard services (or `specializations: []` is empty). When `matchSpecialization: false` (default), the Round Robin candidate pool includes **all active specialists**.
* **Optional Multi-Profile Filtering:** Only if a business explicitly sets `matchSpecialization: true` in workspace settings AND specifies trade specializations (e.g. Elena = `["Маникюр"]`, Ivan = `["Стрижка"]`), the engine will restrict the candidate pool for a "Стрижка" booking to hair stylists before balancing load. If no specializations match or are configured, it seamlessly falls back to all active specialists.

---

## 2. Load Distribution Strategies

The system supports three configurable assignment algorithms:

```
                  Incoming Booking Request (No Specialist Preferred)
                                          │
                                          ▼
                Filter Specialists by Service Specialization (Optional)
                (If matchSpecialization = true & non-empty; else all)
                                          │
                                          ▼
                 Validate Working Hours & Schedule Overrides (5-tier)
                                          │
                                          ▼
                      Filter Out Existing Slot Conflicts
                                          │
                                          ▼
                          Eligible Candidates Pool (N >= 1)
                                          │
           ┌──────────────────────────────┼──────────────────────────────┐
           ▼                              ▼                              ▼
    [ LEAST_LOADED ]             [ CIRCULAR_ROTATION ]            [ WEIGHTED ]
Least bookings in window      Next specialist in circular    Probability/capacity
(Day/Week) + tiebreaker        rotation counter               based distribution
           │                              │                              │
           └──────────────────────────────┼──────────────────────────────┘
                                          │
                                          ▼
                           Assign Selected Specialist
```

### 1. `LEAST_LOADED` (Recommended Default)
* **Logic:** Finds the candidate with the lowest number of active/confirmed appointments on that target date (or target rolling week).
* **Tie-Breaker:** If two specialists have the same load (e.g. both have 0 bookings), chooses the specialist with the oldest `lastAssignedAt` timestamp (least recently assigned) or earliest `createdAt`.
* **Best For:** Equalizing daily stress and revenue across team members.

### 2. `CIRCULAR` (Strict Round Robin)
* **Logic:** Cycles through the list of eligible specialists in circular rotation ordered by `lastAssignedAt ASC NULLS FIRST`.
* **Best For:** Environments where strict rotation sequence is legally or operationally mandated.

### 3. `WEIGHTED` (Capacity-Based)
* **Logic:** Divides appointment load by specialist capacity weight (`weight: 1` to `weight: 5`). (e.g. Senior Specialist weight 2 gets 2x bookings before Intern weight 1).

---

## 3. Database Schema Changes

### 3.1. Prisma Schema Additions (`prisma/schema.prisma`)

```prisma
enum RoundRobinStrategy {
  LEAST_LOADED
  CIRCULAR
  WEIGHTED
}

model WorkspaceBookingSettings {
  id                    String              @id @default(uuid())
  workspaceId           String              @unique
  workspace             Workspace           @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  roundRobinEnabled     Boolean             @default(true)
  strategy              RoundRobinStrategy  @default(LEAST_LOADED)
  matchSpecialization   Boolean             @default(false)
  considerWeeklyLoad    Boolean             @default(false)
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@map("workspace_booking_settings")
}
```

### 3.2. Modifications to `StaffMember` Model

```prisma
model StaffMember {
  // ... existing fields ...
  roundRobinEnabled     Boolean             @default(true)  // Can exclude owners/admins
  roundRobinWeight      Int                 @default(1)     // Weight multiplier (1-5)
  lastAssignedAt        DateTime?                           // Timestamp of last auto-assignment
  // ... relations ...
}
```

---

## 4. API Endpoints Specification

### 4.1. Workspace Round Robin Settings Management

#### `GET /workspaces/settings/round-robin`
* **Description:** Retrieve the workspace booking distribution settings and participation status of all staff members.
* **Headers:** `Authorization: Bearer <token>`
* **Roles:** `OWNER`, `ADMIN_MANAGER`
* **Response (200 OK):**
```json
{
  "roundRobinEnabled": true,
  "strategy": "LEAST_LOADED",
  "matchSpecialization": false,
  "considerWeeklyLoad": false,
  "staff": [
    {
      "id": "staff-uuid-1",
      "name": "Анна Смирнова",
      "systemRole": "SPECIALIST",
      "specializations": ["Стрижка", "Окрашивание"],
      "roundRobinEnabled": true,
      "roundRobinWeight": 1,
      "lastAssignedAt": "2026-09-19T10:30:00.000Z",
      "activeBookingsToday": 2
    },
    {
      "id": "staff-uuid-2",
      "name": "Елена Васильева",
      "systemRole": "SPECIALIST",
      "specializations": ["Маникюр", "Педикюр"],
      "roundRobinEnabled": true,
      "roundRobinWeight": 1,
      "lastAssignedAt": "2026-09-18T16:00:00.000Z",
      "activeBookingsToday": 0
    }
  ]
}
```

---

#### `PUT /workspaces/settings/round-robin`
* **Description:** Update global round-robin strategy and matching parameters.
* **Headers:** `Authorization: Bearer <token>`
* **Roles:** `OWNER`, `ADMIN_MANAGER`
* **Request Body:**
```json
{
  "roundRobinEnabled": true,
  "strategy": "LEAST_LOADED",
  "matchSpecialization": false,
  "considerWeeklyLoad": false
}
```
* **Response (200 OK):**
```json
{
  "code": "workspaces.round_robin_settings_updated",
  "message": "Round robin settings updated successfully.",
  "settings": {
    "roundRobinEnabled": true,
    "strategy": "LEAST_LOADED",
    "matchSpecialization": false,
    "considerWeeklyLoad": false
  }
}
```

---

### 4.2. Staff Round Robin Configuration

#### `PATCH /staff/:id/round-robin`
* **Description:** Update round-robin participation toggle and weight for a specific specialist.
* **Headers:** `Authorization: Bearer <token>`
* **Roles:** `OWNER`, `ADMIN_MANAGER`
* **Request Body:**
```json
{
  "roundRobinEnabled": true,
  "roundRobinWeight": 2
}
```
* **Response (200 OK):**
```json
{
  "code": "staff.round_robin_updated",
  "message": "Staff round robin parameters updated.",
  "staffId": "staff-uuid-1",
  "roundRobinEnabled": true,
  "roundRobinWeight": 2
}
```

---

### 4.3. Bookings Auto-Assignment Endpoints

#### `POST /bookings` (Enhanced Auto-Assignment)
* **Description:** Create a new appointment booking. If `staffId` is omitted, the system automatically selects the optimal specialist using Round Robin.
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "clientName": "Айгерим Бекова",
  "clientPhone": "+77019876543",
  "clientEmail": "aigerim@example.com",
  "serviceName": "Стрижка женская",
  "startTime": "2026-09-20T14:00:00+05:00",
  "durationMinutes": 60,
  "autoAssign": true,
  "notes": "Первый визит"
}
```
* **Response (201 Created):**
```json
{
  "id": "booking-uuid-99",
  "workspaceId": "workspace-uuid-1",
  "staffId": "staff-uuid-2",
  "staffName": "Елена Васильева",
  "serviceName": "Стрижка женская",
  "clientName": "Айгерим Бекова",
  "clientPhone": "+77019876543",
  "startTime": "2026-09-20T09:00:00.000Z",
  "endTime": "2026-09-20T10:00:00.000Z",
  "durationMinutes": 60,
  "status": "CONFIRMED",
  "notes": "Первый визит"
}
```

---

#### `POST /bookings/preview-assignment`
* **Description:** Query endpoint to preview which specialist will be auto-assigned for a candidate slot and service without persisting a booking record.
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "startTime": "2026-09-20T14:00:00+05:00",
  "durationMinutes": 60,
  "serviceName": "Стрижка женская"
}
```
* **Response (200 OK):**
```json
{
  "assignedSpecialist": {
    "id": "staff-uuid-2",
    "name": "Елена Васильева",
    "bookingsCountForDay": 0,
    "lastAssignedAt": "2026-09-18T16:00:00.000Z"
  },
  "candidateCount": 3,
  "strategyUsed": "LEAST_LOADED"
}
```

---

## 5. AI Engine Tool Integration Specification

### 5.1. Tool Handler Flow (`BookingsToolHandler.handleCreateBooking`)

```typescript
// BookingsToolHandler logic with Disambiguation and Round Robin
async handleCreateBooking(context: ToolExecutionContext, args: Record<string, any>) {
  const { workspaceId, leadId, senderPhone, senderName } = context;
  const startTime = new Date(args.startTime);
  const durationMinutes = Number(args.durationMinutes) || 60;
  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);
  const requestedStaffId = args.staffId ? String(args.staffId).trim() : undefined;
  const requestedStaffName = args.staffName ? String(args.staffName).trim() : undefined;
  const serviceName = args.serviceName ? String(args.serviceName).trim() : undefined;

  // 1. Select specialist via RoundRobinAssignmentService
  const selectionResult = await this.roundRobinService.selectSpecialistForSlot({
    workspaceId,
    startTime,
    endTime,
    durationMinutes,
    serviceName,
    requestedStaffId,
    requestedStaffName,
  });

  if (selectionResult.error) {
    return selectionResult; // Returns structured error or AMBIGUOUS_STAFF_NAME with candidate list
  }

  const assignedStaff = selectionResult.specialist;

  // 2. Persist booking with determined staffId
  const booking = await this.bookingsRepository.create({
    workspaceId,
    leadId,
    staffId: assignedStaff.id,
    serviceName,
    clientName: String(args.clientName || senderName || 'Клиент').trim(),
    clientPhone: String(args.clientPhone || senderPhone || '').trim(),
    startTime,
    endTime,
    durationMinutes,
    notes: args.notes ? String(args.notes).trim() : undefined,
  });

  // 3. Update staff lastAssignedAt for circular/tie-breaker tracking
  await this.staffRepository.updateLastAssigned(assignedStaff.id, new Date());

  return {
    success: true,
    bookingId: booking.id,
    status: booking.status,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    durationMinutes: booking.durationMinutes,
    serviceName: booking.serviceName || 'Услуга',
    staffName: assignedStaff.name,
    clientName: booking.clientName,
    clientPhone: booking.clientPhone,
    message: 'Запись успешно создана и зафиксирована в календаре.',
  };
}
```

---

## 6. High-Level Implementation Checklist

Follow this strict step-by-step checklist during implementation:

### Phase 1: Database & Workspace Settings
- [x] Add `RoundRobinStrategy` enum and `WorkspaceBookingSettings` model to `prisma/schema.prisma`.
- [x] Add `roundRobinEnabled`, `roundRobinWeight`, and `lastAssignedAt` fields to `StaffMember` model in `prisma/schema.prisma`.
- [x] Run `npx prisma generate` / `npx prisma db push` to synchronize Prisma Client and database.

### Phase 2: Round Robin Engine Core Service
- [x] Create `RoundRobinAssignmentService` in `src/modules/bookings/services/round-robin-assignment.service.ts`.
- [x] Implement candidate discovery:
  - Disambiguation check for `requestedStaffName` (return candidates if multiple match).
  - Validation if `requestedStaffId` is provided.
  - Query all active `SPECIALIST` staff with `roundRobinEnabled === true`.
  - Filter by `specializations` if `serviceName` is provided and `matchSpecialization === true`.
  - Run each candidate through `SlotCalculatorService` to verify effective working hours, overrides, and slot conflicts.
- [x] Implement `LEAST_LOADED` algorithm (count bookings for target date/range, score by weight, tie-break by `lastAssignedAt ASC`).
- [x] Implement `CIRCULAR` algorithm (sort candidates by `lastAssignedAt ASC NULLS FIRST`, pick first).
- [x] Add unit tests in `src/modules/bookings/services/round-robin-assignment.service.spec.ts` testing multi-staff balancing, overrides exclusion, and tie-breakers.

### Phase 3: Bookings & Staff Module Integration
- [x] Inject `RoundRobinAssignmentService` into `BookingsService` and `BookingsToolHandler`.
- [x] Update `BookingsService.create`: if `dto.staffId` is missing, call `RoundRobinAssignmentService.selectSpecialistForSlot`.
- [x] Add `previewAssignment` method and endpoint (`POST /bookings/preview-assignment`).
- [x] Add `GET /workspaces/settings/round-robin` and `PUT /workspaces/settings/round-robin` in `WorkspacesController`.
- [x] Add `PATCH /staff/:id/round-robin` in `StaffController`.

### Phase 4: AI Engine Tool Handler Verification
- [x] Update `AGENT_TOOL_DECLARATIONS` to include `staffId` in `create_booking`, `get_available_slots`, and `reschedule_booking`.
- [x] Verify `BookingsToolHandler.handleCreateBooking` invokes `RoundRobinAssignmentService`.
- [x] Verify `staffName` is returned in tool result and reflected accurately in conversation responses.
- [x] Ensure `lastAssignedAt` updates atomically upon successful booking creation.

### Phase 5: End-to-End Verification & Translation Keys
- [x] Add translation keys for round-robin errors and success responses in `translation_keys_new.json`.
- [x] Test scenario: 3 Specialists (A, B, C) where Specialist A has a date override (day off). Verify generic booking goes to B or C.
- [x] Test scenario: 2 Specialists (A with 2 bookings, B with 0 bookings). Verify generic booking goes to B.
- [x] Test scenario: Client explicitly asks for Specialist A. Verify booking goes to A regardless of B's lower load.
- [x] Test scenario: 2 Annas collision triggers disambiguation message.

