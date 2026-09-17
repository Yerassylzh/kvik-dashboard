# 046 — CRM Lead Lifecycle, Autonomous AI Stage Transitions & Funnel Engine Spec

> **Module:** `src/modules/leads/`, `src/modules/ai-engine/`, `src/modules/bookings/`  
> **Target Audience:** Backend Engineers, AI/Prompt Engineers, Frontend Developers  
> **Status:** Specification & Implementation Blueprint  

---

## 1. Executive Summary & CRM Architecture

The KVIK platform operates as an **autonomous conversational mini-CRM**. Every client engaging across connected messaging channels (WhatsApp, Instagram, Telegram) is registered as a `Lead`.

The core business objective is to automatically shepherd incoming contacts through a high-converting sales funnel:
$$\mathbf{NEW} \longrightarrow \mathbf{QUALIFIED} \longrightarrow \mathbf{APPOINTMENT\_SET} \longrightarrow \mathbf{DEAL\_WON}$$
$$(\text{or } \mathbf{DEAL\_LOST} \text{ upon disqualification / dropped interest})$$

### Core Innovation: Hybrid Driving Model
Stage progression in KVIK is governed by three cooperative actors:
1. **AI Autonomous Agent (Intent & Qualification Engine):** Evaluates dialogue context in real time against workspace qualification rules and executes `update_lead_stage` or `disqualify_lead` tool calls.
2. **Deterministic Tool Actions (Event-Driven):** Direct triggers from appointment actions (`create_booking` $\rightarrow$ `APPOINTMENT_SET`, booking completion $\rightarrow$ `DEAL_WON`).
3. **Manager Overrides (Manual UI Actions):** Staff members can drag-and-drop leads across Kanban columns or update profiles via dashboard endpoints.

---

## 2. Lead Journey & Stage Analysis (All Steps Each Lead Can Take)

```
                       ┌─────────────────────────┐
                       │           NEW           │
                       │   (Inbound First Msg)   │
                       └────────────┬────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               │ [AI Intent Qualification: Pass]         │ [Disqualified / Spam / Ghosted]
               ▼                                         ▼
   ┌───────────────────────┐                  ┌─────────────────────┐
   │       QUALIFIED       │                  │      DEAL_LOST      │
   │ (Needs & Service Met) │                  │ (Documented Reason) │
   └───────────┬───────────┘                  └──────────▲──────────┘
               │                                         │
               │ [Booking Created via create_booking]    │ [Booking Cancelled / No-Show]
               ▼                                         │
   ┌───────────────────────┐                             │
   │    APPOINTMENT_SET    ├─────────────────────────────┘
   │ (Date/Time Confirmed) │
   └───────────┬───────────┘
               │
               │ [Booking Marked COMPLETED / Service Rendered]
               ▼
   ┌───────────────────────┐
   │       DEAL_WON        │
   │  (Payment / Closed)   │
   └───────────────────────┘
```

### 2.1. Stage Definitions & Lifecycle Analysis

| Stage | Description | Entry Criteria | Exit Criteria | Allowed Next Stages |
|---|---|---|---|---|
| **`NEW`** | Fresh inbound inquiry. First contact via WhatsApp/Instagram/Telegram. Identity and intent unconfirmed. | Initial webhook message from a new phone/external ID. | AI identifies specific service interest or lead fails qualification. | `QUALIFIED`, `DEAL_LOST` |
| **`QUALIFIED`** | Client has stated target service, confirmed basic requirements (master preference, budget, car model, symptoms), and is engaged in slot selection. | AI confirms qualification criteria (via rules/prompt) OR manager manually qualifies. | Booking created, customer ghosts follow-ups (72h), or customer declines offer. | `APPOINTMENT_SET`, `DEAL_LOST`, `NEW` (reset) |
| **`APPOINTMENT_SET`** | Appointment scheduled in calendar. Time, date, service, and assigned specialist are confirmed in DB. | `create_booking` tool execution OR manager manually creates booking. | Visit completed, appointment cancelled, or customer fails to show up. | `DEAL_WON`, `DEAL_LOST`, `QUALIFIED` (if rescheduled for future date) |
| **`DEAL_WON`** | Service delivered, visit finished, or payment collected. Successful terminal stage. | Booking status updated to `COMPLETED` OR manager closes deal as won. | Terminal state (or can re-open to `QUALIFIED` for repeat visit booking). | `QUALIFIED` (repeat cycle) |
| **`DEAL_LOST`** | Lead did not convert. Structured reason attached (`DISQUALIFIED`, `PRICE_TOO_HIGH`, `OUT_OF_SERVICE_AREA`, `UNRESPONSIVE`, `CANCELLED`, `COMPETITOR`). | Disqualification policy triggered, follow-up sequence exhausted (3 attempts), or customer cancelled. | Manager can manually reactivate lead to `NEW` or `QUALIFIED`. | `NEW`, `QUALIFIED` |

---

### 2.2. Niche-Specific Stage Adaptations

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ BEAUTY & SALONS:                                                                            │
│ NEW ──► QUALIFIED (Service + Master picked) ──► APPOINTMENT_SET ──► DEAL_WON (Visit done)   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ CLINICS & HEALTHCARE:                                                                       │
│ NEW ──► QUALIFIED (Specialist + Symptoms triage) ──► APPOINTMENT_SET ──► DEAL_WON (Attended)│
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ AUTO SERVICES & DETAILING:                                                                  │
│ NEW ──► QUALIFIED (Car Make/Year + Issue details) ──► APPOINTMENT_SET (Bay slot) ──► DEAL_WON│
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ FITNESS & CONSULTING:                                                                       │
│ NEW ──► QUALIFIED (Goals/Format + Schedule) ──► APPOINTMENT_SET (Intro session) ──► DEAL_WON │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3. Default Attendance Policy vs. "Not Attended" (No-Show) Workflow

#### The Business Rule: "Attended by Default"
In real-world service businesses, the overwhelming majority ($>90\%$) of confirmed appointments are fulfilled. Therefore, KVIK adopts an **optimistic attendance model**:
1. **Default State:** When an appointment passes its scheduled `endTime`, the system automatically treats the visit as attended (`BookingStatus = COMPLETED`).
2. **CRM Transition:** The associated Lead automatically advances from `APPOINTMENT_SET` $\longrightarrow$ `DEAL_WON`.
3. **Completed Deal Metric:** The completed appointment increments the customer's total successful visits count and conversion rate.

#### The "Not Attended" (No-Show) Exception:
If a client failed to show up, the manager clicks **"Не пришел" / "Not Attended"** in the frontend calendar or lead card:
1. Calls `POST /bookings/:id/no-show` (or `PATCH /bookings/:id/status` with `status: "NO_SHOW"`).
2. **Booking Status:** Changes from `CONFIRMED` $\longrightarrow$ `NO_SHOW`.
3. **Lead Status:** Advances from `APPOINTMENT_SET` $\longrightarrow$ `DEAL_LOST` with `lossReason = NO_SHOW`.
4. **CRM Penalty Memory:** Increments `Lead.noShowCount` in DB and records a warning in `Lead.nicheData`.
5. **AI Awareness:** On future conversations, Gemini sees `noShowCount: 1` in client memory and politely asks for upfront confirmation or prepayment if policy requires.

---

### 2.4. What Happens When a Returning Client Contacts Again?

A customer who previously booked an appointment (whether completed, cancelled, or lost) will often message the business again. Here is how the system handles returning clients across all 4 layers:

```
Returning Client Inbound Message (Same Phone / Channel)
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Identity Resolution (findOrCreate in LeadsRepository)    │
│    • Matches existing Lead record by phone/workspaceId.     │
│    • Does NOT create duplicate lead or split history.       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Session Partitioning (24h Inactivity Boundary)           │
│    • Inactivity > 24 hours ──► New Session starts.          │
│    • Old dialogue truncated from active LLM prompt.         │
│    • CRM Memory injected: Name, favorite master, notes.     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Context-Aware AI Greeting & Re-Engagement                │
│    • AI recognizes returning customer:                      │
│      "С возвращением, Айдос! Рады снова вас слышать..."     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Dynamic Funnel Lifecycle Progression                     │
│    • If previously DEAL_WON:                                │
│      - AI qualifies new service ──► moves back to QUALIFIED │
│      - AI books new appointment ──► moves to APPOINTMENT_SET│
│      - Visit completed          ──► DEAL_WON (2nd visit!)   │
│    • If client has UPCOMING booking:                        │
│      - AI calls get_client_bookings ──► informs / reschedules│
│    • If previously DEAL_LOST:                               │
│      - AI re-qualifies ──► resurrects lead to QUALIFIED     │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.5. Architectural Decision: Complete Exclusion of Revenue Metrics

> [!IMPORTANT]
> **Frontend & Backend Directive: NO Revenue Calculations**  
> All revenue metrics (`revenueSum`, `estimatedTotal`, `revenueKpi`) are **strictly excluded** from KVIK's CRM and Analytics modules.

#### 1. Why Revenue Tracking is Excluded:
1. **Dynamic & Uncertain Service Pricing:** In service niches (beauty salons, dental clinics, auto detailing, consulting, medical triage), final prices cannot be determined reliably during WhatsApp/Instagram chat. Service costs depend on hair length/density, materials consumed, diagnostic discoveries, technician seniority, and custom add-ons determined during the physical visit.
2. **Separation of Concerns (Conversational Booking CRM vs. POS):** KVIK's core mission is autonomous customer communication, rapid lead qualification, and calendar slot booking. Payments, fiscal checks, and accounting are handled by on-premise point-of-sale systems (Kaspi Pay, 1C, physical POS).
3. **Preventing Erroneous Analytics:** Recording hypothetical or rough price estimates produces misleading financial reports.

#### 2. What Dashboards and Frontend Measure Instead (Operational KPIs):
* **Funnel Conversion Volumes & Rates:** Number and % of leads moving across `NEW` $\longrightarrow$ `QUALIFIED` $\longrightarrow$ `APPOINTMENT_SET` $\longrightarrow$ `DEAL_WON`.
* **Drop-off Rates & Loss Breakdown:** Quantified reasons for loss (`DISQUALIFIED`, `PRICE_TOO_HIGH`, `OUT_OF_SERVICE_AREA`, `UNRESPONSIVE`, `NO_SHOW`).
* **Booking Volume & Attendance:** Confirmed appointments, attended visits, cancellations, and no-shows per specialist and day.
* **AI Deflection Rate:** Percentage of conversations autonomously resolved without manager intervention.

---

## 3. Proposed AI Engine Changes: How AI Decides to Move Leads

To empower Gemini 2.0 Flash with intelligent, safe, and explainable CRM stage transitions, we introduce a **4-tier decision pipeline**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    TIER 1: DETERMINISTIC TOOL HOOKS                          │
│ • create_booking tool called ──────► Auto-transitions Lead to APPOINTMENT_SET│
│ • cancel_booking tool called ──────► Checks rebook intent (QUALIFIED/LOST)   │
├──────────────────────────────────────────────────────────────────────────────┤
│                    TIER 2: EXPLICIT AI AGENT TOOLS                           │
│ • update_lead_stage tool ──────────► AI passes QUALIFIED with extracted facts│
│ • disqualify_lead tool ────────────► AI passes DEAL_LOST with policy reason  │
├──────────────────────────────────────────────────────────────────────────────┤
│                    TIER 3: SYSTEM PROMPT CRM RULES                           │
│ • System prompt instructs AI on criteria for qualification & stage movements │
│ • Prevents hallucinated transitions without verified client data             │
├──────────────────────────────────────────────────────────────────────────────┤
│                    TIER 4: BACKGROUND INTELLIGENCE                           │
│ • FollowUpService: 3 failed attempts (72h) ──► Transitions to DEAL_LOST      │
│ • BookingWatcher: Booking COMPLETED ─────────► Transitions to DEAL_WON       │
│ • ConversationSummarizer: Passive extraction of client preferences to CRM    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.1. Tool 1: `update_lead_stage` (NEW AI Tool)

* **Declaration:**
```typescript
{
  name: 'update_lead_stage',
  description: 'Updates the CRM sales funnel stage of the current lead when their intent, needs, or qualification status change during conversation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      stage: {
        type: Type.STRING,
        description: 'Target funnel stage: "QUALIFIED", "APPOINTMENT_SET", "DEAL_LOST", "NEW".',
      },
      reason: {
        type: Type.STRING,
        description: 'Short explanation of why the stage is being changed (e.g. "Client confirmed service interest in hair coloring and agreed to check Friday slots").',
      },
      extractedFacts: {
        type: Type.OBJECT,
        description: 'Structured customer facts discovered in the conversation to persist into CRM memory.',
        properties: {
          serviceInterest: { type: Type.STRING, description: 'Desired service or problem description' },
          preferredStaffName: { type: Type.STRING, description: 'Preferred master/doctor name if mentioned' },
          preferredDate: { type: Type.STRING, description: 'Preferred day of week or date' },
          preferredTimeOfDay: { type: Type.STRING, description: 'morning | afternoon | evening' },
          budget: { type: Type.NUMBER, description: 'Budget stated by client' },
          notes: { type: Type.STRING, description: 'Important client preferences or constraints' },
        },
      },
    },
    required: ['stage', 'reason'],
  },
}
```

* **Execution Behavior:**
  1. Validates that transition is legal from current status.
  2. Updates `Lead.status` and merges `extractedFacts` into `Lead.nicheData`.
  3. Records audit log in `LeadTimelineEvent` table (`changedBy: "AI"`).
  4. Broadcasts WebSocket event `lead.stage_changed` to connected manager dashboards.

---

### 3.2. Tool 2: `disqualify_lead` (NEW AI Tool)

* **Declaration:**
```typescript
{
  name: 'disqualify_lead',
  description: 'Marks the lead as DEAL_LOST when the inquiry does not fit business qualification criteria, is outside service scope, or client explicitly terminates contact.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'Structured reason category: "DISQUALIFIED_BY_POLICY", "OUT_OF_SERVICE_AREA", "PRICE_TOO_HIGH", "UNSUPPORTED_SERVICE", "CLIENT_DECLINED", "SPAM".',
      },
      explanation: {
        type: Type.STRING,
        description: 'Brief reason to store in CRM audit log (e.g. "Client requested truck diesel repair, but we only service passenger cars").',
      },
    },
    required: ['reason', 'explanation'],
  },
}
```

---

### 3.3. Deterministic Hook: Automatic `create_booking` & `cancel_booking` Transitions

When `AgentToolsService` handles `create_booking`:
```typescript
// Inside handleCreateBooking after booking insertion:
await this.leadsRepository.updateStatus(leadId, workspaceId, LeadStatus.APPOINTMENT_SET);
await this.leadTimelineRepository.create({
  workspaceId,
  leadId,
  previousStatus: currentStatus,
  newStatus: LeadStatus.APPOINTMENT_SET,
  changedBy: 'AI',
  reason: `Booking created for ${serviceName || 'service'} on ${startTime}`,
  metadata: { bookingId: booking.id },
});
```

---

## 4. Database Schema Updates

### 4.1. Prisma Schema Additions (`prisma/schema.prisma`)

```prisma
enum LeadLossReason {
  DISQUALIFIED_BY_POLICY
  OUT_OF_SERVICE_AREA
  PRICE_TOO_HIGH
  UNSUPPORTED_SERVICE
  CLIENT_DECLINED
  UNRESPONSIVE_AFTER_FOLLOWUP
  CANCELLED_WITHOUT_REBOOK
  SPAM
  OTHER
}

enum StageChangeActor {
  AI
  MANAGER
  SYSTEM
}

model Lead {
  id              String          @id @default(uuid())
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name            String?
  phone           String?
  email           String?
  sourceChannel   ChannelType?
  status          LeadStatus      @default(NEW)
  lossReason      LeadLossReason?
  lossNotes       String?
  assignedStaffId String?
  assignedStaff   StaffMember?    @relation(fields: [assignedStaffId], references: [id], onDelete: SetNull)
  nicheData       Json?           // Structured facts: { serviceInterest, preferredStaff, carModel, notes, etc. }
  score           Int             @default(0) // Engagement / Qualification score (0-100)
  stageChangedAt  DateTime        @default(now())
  lastActivityAt  DateTime        @default(now())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  conversations   Conversation[]
  bookings        Booking[]
  timelineEvents  LeadTimelineEvent[]
  notes           LeadNote[]

  @@index([workspaceId, status])
  @@index([workspaceId, lastActivityAt])
  @@index([workspaceId, assignedStaffId])
  @@map("leads")
}

model LeadTimelineEvent {
  id             String           @id @default(uuid())
  workspaceId    String
  workspace      Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  leadId         String
  lead           Lead             @relation(fields: [leadId], references: [id], onDelete: Cascade)
  previousStatus LeadStatus?
  newStatus      LeadStatus
  changedBy      StageChangeActor @default(SYSTEM)
  changedByUserId String?
  reason         String?
  metadata       Json?
  createdAt      DateTime         @default(now())

  @@index([leadId, createdAt])
  @@index([workspaceId, createdAt])
  @@map("lead_timeline_events")
}

model LeadNote {
  id          String    @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  leadId      String
  lead        Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  authorId    String
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  content     String
  isPinned    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([leadId, createdAt])
  @@map("lead_notes")
}
```

---

## 5. Complete API Endpoints Specification

All endpoints require `Authorization: Bearer <access_token>`. All operations are strictly multi-tenant scoped by `workspaceId` extracted from JWT.

---

### 5.1. `GET /leads`
> Paginated list of leads with multi-factor filtering, search, sorting, and tag counts. Used for CRM table and Kanban boards.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `status` | `LeadStatus` | No | — | Filter by stage (`NEW`, `QUALIFIED`, `APPOINTMENT_SET`, `DEAL_WON`, `DEAL_LOST`) |
| `sourceChannel` | `ChannelType` | No | — | Filter by channel (`WHATSAPP`, `INSTAGRAM`, `TELEGRAM`) |
| `assignedStaffId` | `UUID` | No | — | Filter by assigned staff member |
| `lossReason` | `LeadLossReason` | No | — | Filter lost leads by structured reason |
| `search` | `string` | No | — | Case-insensitive search across name, phone, email, notes |
| `fromDate` | `string (ISO)` | No | — | Activity start date |
| `toDate` | `string (ISO)` | No | — | Activity end date |
| `page` | `number` | No | 1 | Page number |
| `limit` | `number` | No | 20 | Page size (max: 100) |
| `sortBy` | `string` | No | `lastActivityAt` | `lastActivityAt` \| `createdAt` \| `stageChangedAt` \| `score` |
| `sortOrder` | `string` | No | `desc` | `asc` \| `desc` |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Айдос Нурланов",
      "phone": "+77015551234",
      "email": "aidos@example.com",
      "sourceChannel": "WHATSAPP",
      "status": "QUALIFIED",
      "lossReason": null,
      "score": 85,
      "assignedStaff": {
        "id": "staff-uuid-1",
        "name": "Анна Смирнова",
        "avatarUrl": "https://s3.kvik.kz/avatars/anna.jpg"
      },
      "nicheData": {
        "serviceInterest": "Сложное окрашивание Airtouch",
        "preferredStaffName": "Анна",
        "budget": 35000,
        "preferredTimeOfDay": "afternoon"
      },
      "lastActivityAt": "2026-09-17T14:30:00.000Z",
      "stageChangedAt": "2026-09-17T14:15:00.000Z",
      "createdAt": "2026-09-17T12:00:00.000Z"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

---

### 5.2. `GET /leads/counts`
> Aggregated counts grouped by stage, conversion rates, and total active lead pipeline value. Used for Kanban column headers.

**Response `200 OK`:**
```json
{
  "counts": {
    "NEW": 24,
    "QUALIFIED": 18,
    "APPOINTMENT_SET": 12,
    "DEAL_WON": 65,
    "DEAL_LOST": 9
  },
  "totalActive": 54,
  "conversionRate": 50.78,
  "lostReasonsBreakdown": {
    "PRICE_TOO_HIGH": 3,
    "UNRESPONSIVE_AFTER_FOLLOWUP": 4,
    "OUT_OF_SERVICE_AREA": 1,
    "CLIENT_DECLINED": 1
  }
}
```

---

### 5.3. `GET /leads/funnel`
> Conversion funnel analytics showing step-by-step conversion percentages, drop-off rates, and average time spent in each stage.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `from` | `string (YYYY-MM-DD)` | No | 30 days ago | Period start date |
| `to` | `string (YYYY-MM-DD)` | No | Today | Period end date |

**Response `200 OK`:**
```json
{
  "period": { "from": "2026-08-18", "to": "2026-09-17" },
  "funnel": [
    {
      "stage": "NEW",
      "count": 120,
      "conversionToNext": 75.0,
      "dropoffRate": 25.0,
      "avgDurationMinutes": 18
    },
    {
      "stage": "QUALIFIED",
      "count": 90,
      "conversionToNext": 66.67,
      "dropoffRate": 33.33,
      "avgDurationMinutes": 142
    },
    {
      "stage": "APPOINTMENT_SET",
      "count": 60,
      "conversionToNext": 83.33,
      "dropoffRate": 16.67,
      "avgDurationMinutes": 1440
    },
    {
      "stage": "DEAL_WON",
      "count": 50,
      "conversionToNext": null,
      "dropoffRate": null,
      "avgDurationMinutes": null
    }
  ],
  "overallConversionRate": 41.67
}
```

---

### 5.4. `GET /leads/:id`
> Complete lead dossier including contact information, CRM facts (`nicheData`), conversations, upcoming bookings, timeline events, and notes.

**Response `200 OK`:**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Айдос Нурланов",
  "phone": "+77015551234",
  "email": "aidos@example.com",
  "sourceChannel": "WHATSAPP",
  "status": "APPOINTMENT_SET",
  "lossReason": null,
  "lossNotes": null,
  "score": 90,
  "assignedStaff": {
    "id": "staff-1",
    "name": "Анна Смирнова"
  },
  "nicheData": {
    "serviceInterest": "Сложное окрашивание",
    "preferredStaffName": "Анна",
    "preferredTimeOfDay": "morning",
    "allergies": "Аллергия на аммиак"
  },
  "conversations": [
    {
      "id": "conv-uuid-1",
      "channelType": "WHATSAPP",
      "status": "BOT_ACTIVE",
      "lastMessagePreview": "Записали вас на пятницу в 14:00 к мастеру Анне!",
      "lastMessageAt": "2026-09-17T14:30:00.000Z"
    }
  ],
  "bookings": [
    {
      "id": "booking-uuid-1",
      "serviceName": "Сложное окрашивание",
      "staffName": "Анна Смирнова",
      "startTime": "2026-09-19T14:00:00.000Z",
      "endTime": "2026-09-19T16:00:00.000Z",
      "status": "CONFIRMED"
    }
  ],
  "recentTimeline": [
    {
      "id": "timeline-1",
      "previousStatus": "QUALIFIED",
      "newStatus": "APPOINTMENT_SET",
      "changedBy": "AI",
      "reason": "AI tool create_booking confirmed slot for 2026-09-19 14:00",
      "createdAt": "2026-09-17T14:30:00.000Z"
    }
  ],
  "notesCount": 2,
  "createdAt": "2026-09-17T12:00:00.000Z",
  "updatedAt": "2026-09-17T14:30:00.000Z"
}
```

---

### 5.5. `PATCH /leads/:id/status`
> Manually change lead funnel stage with an audit reason. Emits real-time WebSocket update.

**Request Body:**
```json
{
  "status": "QUALIFIED",
  "reason": "Клиент подтвердил бюджет и перешел к выбору времени записи",
  "lossReason": null
}
```

**Validation & Schema Rules:**
- `status`: Required valid `LeadStatus` enum (`NEW`, `QUALIFIED`, `APPOINTMENT_SET`, `DEAL_WON`, `DEAL_LOST`).
- `reason`: Optional string (max 500 chars).
- `lossReason`: Required **only if** `status === 'DEAL_LOST'`.

**Response `200 OK`:**
```json
{
  "code": "leads.status_updated",
  "message": "Lead stage updated successfully."
}
```

**Errors:**
- `400` `leads.invalid_status_transition` — Attempting an impossible stage skip.
- `400` `leads.loss_reason_required` — Missing `lossReason` when transitioning to `DEAL_LOST`.
- `404` `leads.not_found` — Lead not found.

---

### 5.6. `POST /leads/:id/qualify`
> Forces qualification of a lead with updated structured criteria.

**Request Body:**
```json
{
  "serviceInterest": "Замена тормозных колодок",
  "preferredStaffId": "staff-uuid-2",
  "budget": 25000,
  "notes": "Toyota Camry 70, клиент приедет со своими запчастями"
}
```

**Response `200 OK`:**
```json
{
  "code": "leads.qualified",
  "message": "Lead successfully qualified."
}
```

---

### 5.7. `POST /leads/:id/disqualify`
> Disqualifies lead and transitions directly to `DEAL_LOST` with structured reason code and explanation.

**Request Body:**
```json
{
  "lossReason": "PRICE_TOO_HIGH",
  "lossNotes": "Клиент посчитал стоимость услуги выше ожидаемой, скидку не запросил."
}
```

**Response `200 OK`:**
```json
{
  "code": "leads.disqualified",
  "message": "Lead marked as lost."
}
```

---

### 5.8. `PATCH /leads/:id`
> Partial update of lead contact details, assigned staff, and niche-specific custom data (`nicheData`).

**Request Body:**
```json
{
  "name": "Айдос Нурланов",
  "email": "aidos@example.com",
  "phone": "+77015551234",
  "assignedStaffId": "staff-uuid-1",
  "score": 95,
  "nicheData": {
    "vehicle": "Camry 70",
    "licensePlate": "010AAA01",
    "vipClient": true
  }
}
```

**Response `200 OK`:**
```json
{
  "code": "leads.updated",
  "message": "Lead details updated."
}
```

---

### 5.9. `GET /leads/:id/timeline`
> Paginated historical audit log of all stage transitions, AI actions, bookings, and manager interventions for this lead.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | `number` | No | 1 | Page number |
| `limit` | `number` | No | 30 | Items per page |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "event-1",
      "previousStatus": "QUALIFIED",
      "newStatus": "APPOINTMENT_SET",
      "changedBy": "AI",
      "reason": "Appointment booked for 2026-09-19 14:00 with Anna",
      "metadata": {
        "bookingId": "booking-uuid-1",
        "serviceName": "Сложное окрашивание",
        "staffName": "Анна"
      },
      "createdAt": "2026-09-17T14:30:00.000Z"
    },
    {
      "id": "event-2",
      "previousStatus": "NEW",
      "newStatus": "QUALIFIED",
      "changedBy": "AI",
      "reason": "AI qualified lead: identified service Airtouch, budget 35k",
      "metadata": {
        "toolName": "update_lead_stage"
      },
      "createdAt": "2026-09-17T14:15:00.000Z"
    },
    {
      "id": "event-3",
      "previousStatus": null,
      "newStatus": "NEW",
      "changedBy": "SYSTEM",
      "reason": "Inbound message received via WHATSAPP",
      "metadata": null,
      "createdAt": "2026-09-17T12:00:00.000Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 30
}
```

---

### 5.10. `POST /leads/:id/notes` & `DELETE /leads/:id/notes/:noteId`
> Manage manager internal notes pinned to the lead's profile.

* **`POST /leads/:id/notes` Request Body:**
```json
{
  "content": "Клиент просил позвонить за 1 час до визита для открытия шлагбаума.",
  "isPinned": true
}
```
* **Response `201 Created`:**
```json
{
  "id": "note-uuid-1",
  "content": "Клиент просил позвонить за 1 час до визита для открытия шлагбаума.",
  "isPinned": true,
  "author": {
    "id": "user-uuid",
    "name": "Менеджер Асель"
  },
  "createdAt": "2026-09-17T14:40:00.000Z"
}
```

---

### 5.11. `POST /bookings/:id/no-show`
> Marks an appointment as "Not Attended" (No-Show) from the frontend calendar or CRM view.
> Overrides the default "Attended" assumption: changes booking status to `NO_SHOW`, moves the associated lead to `DEAL_LOST` (`lossReason = NO_SHOW`), and increments `noShowCount` in the client's CRM profile.

**Request Body** (optional notes):
```json
{
  "reason": "Клиент не пришел и не отвечал на звонки администратора",
  "chargeFee": false
}
```

**Response `200 OK`:**
```json
{
  "code": "bookings.marked_no_show",
  "message": "Booking marked as not attended.",
  "booking": {
    "id": "booking-uuid-1",
    "status": "NO_SHOW",
    "startTime": "2026-09-17T14:00:00.000Z"
  },
  "lead": {
    "id": "lead-uuid-1",
    "status": "DEAL_LOST",
    "lossReason": "NO_SHOW",
    "noShowCount": 1
  }
}
```

---

## 6. Real-Time WebSocket Events

Whenever a lead changes stage or updates profile, the backend emits WebSocket events to the workspace room:

```typescript
// Room: workspace_{workspaceId}
this.conversationsGateway.server.to(`workspace_${workspaceId}`).emit('lead.stage_changed', {
  leadId: lead.id,
  previousStatus: prevStatus,
  newStatus: newStatus,
  changedBy: 'AI' | 'MANAGER' | 'SYSTEM',
  reason: '...',
  stageChangedAt: new Date().toISOString(),
});
```

---

## 7. Translation Keys Matrix (`translation_keys_new.json`)

```json
{
  "leads.status_updated": "Статус лида успешно обновлен",
  "leads.updated": "Данные лида обновлены",
  "leads.archived": "Лид отправлен в архив",
  "leads.qualified": "Лид успешно квалифицирован",
  "leads.disqualified": "Лид дисквалифицирован и переведен в проигранные",
  "leads.note_created": "Заметка успешно добавлена",
  "leads.note_deleted": "Заметка удалена",
  "leads.not_found": "Лид не найден",
  "leads.invalid_status_transition": "Недопустимый переход между этапами воронки",
  "leads.loss_reason_required": "Для закрытия лида необходимо указать причину отказа",
  "leads.note_not_found": "Заметка не найдена"
}
```

---

## 8. Implementation Checklist

- [ ] **Phase 1: Prisma Schema & Migration**
  - [ ] Add `LeadLossReason`, `StageChangeActor` enums.
  - [ ] Add `LeadTimelineEvent` and `LeadNote` models.
  - [ ] Add `lossReason`, `lossNotes`, `assignedStaffId`, `score`, `stageChangedAt` to `Lead` model.
  - [ ] Run `npx prisma migrate dev --name crm_lead_lifecycle_and_timeline`.
- [ ] **Phase 2: Repositories & Data Layer**
  - [ ] Create `LeadTimelineRepository` and `LeadNotesRepository`.
  - [ ] Update `LeadsRepository` with funnel analytics aggregation queries and status audit transitions.
- [ ] **Phase 3: AI Engine Stage Tools & Orchestrator Hooks**
  - [ ] Add `update_lead_stage` and `disqualify_lead` declarations in `agent-tools.declarations.ts`.
  - [ ] Implement `CrmToolHandler` for autonomous stage changes and CRM fact extraction.
  - [ ] Hook `create_booking` and `cancel_booking` handlers to auto-transition lead status.
- [ ] **Phase 4: Controllers & REST API**
  - [ ] Implement `GET /leads/funnel` analytics endpoint.
  - [ ] Implement `POST /leads/:id/qualify` and `POST /leads/:id/disqualify`.
  - [ ] Implement `GET /leads/:id/timeline` and `POST /leads/:id/notes`.
  - [ ] Update `PATCH /leads/:id/status` with audit logging and transition validation.
- [ ] **Phase 5: WebSocket & Real-Time Sync**
  - [ ] Add `emitLeadStageChanged` and `emitLeadUpdated` to `ConversationsGateway`.
- [ ] **Phase 6: Verification & Translations**
  - [ ] Append new translation keys to `translation_keys_new.json`.
  - [ ] Unit tests for stage transitions and funnel calculations.
  - [ ] Clean build via `npm run build`.
