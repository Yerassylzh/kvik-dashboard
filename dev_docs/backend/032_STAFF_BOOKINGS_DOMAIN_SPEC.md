# 032 — Staff & Bookings Domain Spec

> **Modules:** `src/modules/staff/`, `src/modules/bookings/`  
> **Status:** Implementation Pending  
> **Depends On:** Workspace, Lead  

---

## 1. Purpose

Two tightly coupled domains:

- **Staff** — manages the people (masters, specialists, practitioners) who deliver services. Each staff member has a working schedule template and can have date-level overrides (days off, vacations, custom hours).
- **Bookings** — manages individual appointments. The core feature of the calendar dashboard. Includes a pure slot-calculation engine that returns available time windows based on staff working hours minus existing bookings minus overrides.

---

## 2. Prisma Model Reference

```prisma
model StaffMember {
  id               String    // uuid
  workspaceId      String
  name             String
  role             String?              // "Мастер", "Косметолог", "Тренер"
  specializations  String[]             // ["Окрашивание", "Стрижка"]
  phone            String?
  email            String?
  avatarUrl        String?
  isActive         Boolean
  googleCalendarId String?             // for future Google Calendar sync

  availabilityTemplates AvailabilityTemplate[]
  availabilityOverrides AvailabilityOverride[]
  bookings              Booking[]
}

model AvailabilityTemplate {
  staffId      String
  dayOfWeek    Int     // 0=Sun, 1=Mon, ... 6=Sat
  startTime    String  // "09:00"
  endTime      String  // "18:00"
  slotDuration Int     // minutes, e.g. 30 or 60
  // @@unique([staffId, dayOfWeek])
}

model AvailabilityOverride {
  staffId   String
  date      DateTime @db.Date
  isBlocked Boolean  // true = day off, false = custom hours
  startTime String?
  endTime   String?
  reason    String?
}

model Booking {
  id              String
  workspaceId     String
  staffId         String?
  leadId          String?
  serviceName     String?
  price           Decimal?
  clientName      String
  clientPhone     String
  clientEmail     String?
  startTime       DateTime
  endTime         DateTime
  durationMinutes Int
  status          BookingStatus  // PENDING | CONFIRMED | COMPLETED | CANCELLED | DECLINED
  notes           String?
  googleEventId   String?        // for Google Calendar sync
}
```

---

## 3. Staff API Endpoints

### `GET /staff`
> List all staff members of the workspace.

**Query Params:** `isActive` (boolean, optional)

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Мастер Анна",
    "role": "Стилист",
    "specializations": ["Окрашивание", "Стрижка"],
    "phone": "+77011234567",
    "avatarUrl": null,
    "isActive": true
  }
]
```

---

### `POST /staff`
> Create a new staff member.

**Request Body:**
```json
{
  "name": "Мастер Анна",
  "role": "Стилист",
  "specializations": ["Окрашивание", "Стрижка"],
  "phone": "+77011234567"
}
```

**Response `201`:** `{ "id": "uuid", ... }`

---

### `PATCH /staff/:id`
> Update staff profile fields.

**Request Body** (all optional): `name`, `role`, `specializations`, `phone`, `email`, `avatarUrl`, `isActive`

**Response `200`:** `{ "code": "staff.updated", "message": "Staff member updated." }`

---

### `DELETE /staff/:id`
> Deactivate (soft delete) staff member. Sets `isActive = false`.

**Response `200`:** `{ "code": "staff.deactivated", "message": "Staff member deactivated." }`

---

### `GET /staff/:id/schedule`
> Get the staff member's weekly availability template and any overrides for a date range.

**Query Params:** `from` (ISO date), `to` (ISO date)

**Response `200`:**
```json
{
  "templates": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "18:00", "slotDuration": 60 }
  ],
  "overrides": [
    { "date": "2026-09-15", "isBlocked": true, "reason": "Выходной" }
  ]
}
```

---

### `PUT /staff/:id/schedule`
> Replace staff member's weekly schedule template (full replace, not patch).

**Request Body:**
```json
{
  "templates": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "18:00", "slotDuration": 60 },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "18:00", "slotDuration": 60 }
  ]
}
```

**Response `200`:** `{ "code": "staff.schedule_updated", "message": "Schedule updated." }`

---

### `POST /staff/:id/overrides`
> Add a date-level override (day off or custom hours).

**Request Body:**
```json
{
  "date": "2026-09-20",
  "isBlocked": true,
  "reason": "Отпуск"
}
```

**Response `201`:** `{ "code": "staff.override_added", "message": "Override added." }`

---

### `DELETE /staff/:id/overrides/:overrideId`

**Response `200`:** `{ "code": "staff.override_removed", "message": "Override removed." }`

---

## 4. Bookings API Endpoints

### `GET /bookings`
> List bookings for the calendar view. Returns all bookings filtered by date range and optionally by staff.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `from` | ISO datetime | Start of range (required) |
| `to` | ISO datetime | End of range (required) |
| `staffId` | uuid (optional) | Filter by staff member |
| `status` | `BookingStatus` (optional) | Filter by status |

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "staffId": "uuid",
    "staffName": "Мастер Анна",
    "leadId": "uuid",
    "serviceName": "Стрижка",
    "price": "3500.00",
    "clientName": "Айгерим Бекова",
    "clientPhone": "+77019876543",
    "startTime": "2026-09-11T10:00:00Z",
    "endTime": "2026-09-11T11:00:00Z",
    "durationMinutes": 60,
    "status": "CONFIRMED",
    "notes": null
  }
]
```

---

### `GET /bookings/slots`
> **Core slot engine.** Returns available time slots for a given staff member and date.  
> The algorithm: staff working hours for that `dayOfWeek` minus all existing `PENDING`/`CONFIRMED` bookings minus any overrides.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `staffId` | uuid (required) | Target staff member |
| `date` | ISO date (required) | `2026-09-12` |
| `durationMinutes` | number (required) | Service duration |

**Response `200`:**
```json
{
  "date": "2026-09-12",
  "staffId": "uuid",
  "slots": [
    { "startTime": "09:00", "endTime": "10:00", "available": true },
    { "startTime": "10:00", "endTime": "11:00", "available": false },
    { "startTime": "11:00", "endTime": "12:00", "available": true }
  ]
}
```

---

### `POST /bookings`
> Create a new booking (manual, from dashboard). Validates slot availability before creating.

**Request Body:**
```json
{
  "staffId": "uuid",
  "leadId": "uuid",
  "serviceName": "Стрижка",
  "price": 3500,
  "clientName": "Айгерим Бекова",
  "clientPhone": "+77019876543",
  "startTime": "2026-09-12T09:00:00Z",
  "durationMinutes": 60,
  "notes": "Предпочитает мастера Анну"
}
```

**Response `201`:** `{ "id": "uuid", ... full booking object ... }`  
**Errors:** `409` `bookings.slot_conflict` | `404` `bookings.staff_not_found`

---

### `GET /bookings/:id`
> Full booking detail.

---

### `PATCH /bookings/:id/status`
> Confirm, cancel, complete, or decline a booking.

**Request Body:**
```json
{ "status": "CONFIRMED" }
```

**Response `200`:** `{ "code": "bookings.status_updated", "message": "Booking status updated." }`

---

### `PATCH /bookings/:id/reschedule`
> Move a booking to a new time slot. Re-validates availability.

**Request Body:**
```json
{
  "startTime": "2026-09-13T11:00:00Z",
  "durationMinutes": 60
}
```

**Response `200`:** `{ "code": "bookings.rescheduled", "message": "Booking rescheduled." }`  
**Errors:** `409` `bookings.slot_conflict`

---

## 5. Files to Create

```
src/modules/staff/
├── staff.module.ts
├── staff.controller.ts
├── staff.service.ts
├── staff.repository.ts
└── dto/
    ├── create-staff.dto.ts
    ├── update-staff.dto.ts
    ├── set-schedule.dto.ts
    └── add-override.dto.ts

src/modules/bookings/
├── bookings.module.ts
├── bookings.controller.ts
├── bookings.service.ts
├── bookings.repository.ts
├── services/
│   └── slot-calculator.service.ts
└── dto/
    ├── create-booking.dto.ts
    ├── reschedule-booking.dto.ts
    ├── update-booking-status.dto.ts
    └── get-slots.dto.ts
```

---

## 6. Slot Calculator Logic (High Level)

```
SlotCalculatorService.getAvailableSlots(staffId, date, durationMinutes):

1. Load AvailabilityTemplate for (staffId, dayOfWeek of date)
   → If none: staff doesn't work that day → return []
2. Check AvailabilityOverride for (staffId, date)
   → If isBlocked: return []
   → If custom hours: use override startTime/endTime instead
3. Generate all potential slots from startTime to endTime with slotDuration step
4. Load all bookings for (staffId, date) where status IN [PENDING, CONFIRMED]
5. For each potential slot, check if [slot.start, slot.start + durationMinutes] overlaps any existing booking
6. Return slots array with { startTime, endTime, available: boolean }
```

---

## 7. Implementation Checklist

- [ ] `StaffRepository` — all queries filter by `workspaceId`
- [ ] `GET /staff` — support `isActive` filter
- [ ] `PUT /staff/:id/schedule` — delete all existing templates for staffId, then insert new ones
- [ ] `POST /staff/:id/overrides` — upsert by (staffId, date)
- [ ] `BookingsRepository` — all queries filter by `workspaceId`
- [ ] `GET /bookings` — require `from` + `to`, support staffId + status filters
- [ ] `GET /bookings/slots` — implement `SlotCalculatorService` with overlap check
- [ ] `POST /bookings` — call `SlotCalculatorService` before insert, throw `409` on conflict
- [ ] `PATCH /bookings/:id/reschedule` — re-validate slot, then update
- [ ] All error codes registered in `translation_keys_new.json`
- [ ] `npm run build` passes cleanly
