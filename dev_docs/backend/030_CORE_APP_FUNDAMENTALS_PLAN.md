# 030 — Core App Fundamentals & Dashboard Architecture Plan

> **Target Audience:** Backend Developers, System Architects  
> **Scope:** Foundational Prisma models, module folder structure, phased feature roadmap, and execution checklist for the Kvik Dashboard & Core App.  
> **Status:** Draft / Active Implementation Blueprint  

---

## 1. Executive Summary

Having established authentication, onboarding, channel connections (WhatsApp, Instagram, Telegram), and the decoupled Knowledge Base RAG pipeline, the system now moves to implementing the **Core Application & Dashboard Engine**.

The core application serves calendar and appointment-driven businesses (Beauty Salons, Aesthetic Clinics, Fitness Studios, Consulting) across four fundamental operational pillars:
1. **Leads & Mini-CRM Pipeline**
2. **Staff & Appointment Booking Engine**
3. **Unified Multi-Channel Inbox & Manager Handoff**
4. **Analytics & Dashboard Overview**

---

## 2. Prisma Database Schema Blueprint

The Prisma schema is refined to support high-performance inbox sorting, real-time schedule calculations, and multi-tenant lead management.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Workspace    │──────<│      Lead       │──────<│     Booking     │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │                         │
         │                         │                         │
         ├─────────────────────────┼─────────────────────────┤
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Channel     │──────<│  Conversation   │       │   StaffMember   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                   │                         │
                                   ▼                         ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │     Message     │       │  Availability   │
                          └─────────────────┘       └─────────────────┘
```

### Key Models & Refinements

1. **`Lead` (Mini-CRM)**
   - Fields: `id`, `workspaceId`, `name`, `phone`, `email`, `status` (`NEW`, `QUALIFIED`, `APPOINTMENT_SET`, `DEAL_WON`, `DEAL_LOST`), `nicheData` (JSON), `sourceChannel`, `lastActivityAt`.
   - Relations: `workspace`, `conversations`, `bookings`.

2. **`Conversation` & `Message` (Unified Inbox)**
   - `Conversation`: `id`, `workspaceId`, `leadId`, `channelId`, `status` (`BOT_ACTIVE`, `MANAGER_INTERCEPTED`, `CLOSED`), `lastMessageAt`, `lastMessagePreview`, `unreadCount`.
   - `Message`: `id`, `conversationId`, `role` (`USER`, `BOT`, `MANAGER`), `content`, `externalMessageId`, `metadata` (JSON), `createdAt`.
   - Indexes: `@@index([workspaceId, lastMessageAt])`, `@@index([leadId])`.

3. **`StaffMember` & `AvailabilityTemplate` / `AvailabilityOverride` (Calendar Resources)**
   - `StaffMember`: `id`, `workspaceId`, `name`, `role`, `specializations` (`String[]`), `phone`, `isActive`, `googleCalendarId`.
   - `AvailabilityTemplate`: `staffId`, `dayOfWeek` (0–6), `startTime` ("09:00"), `endTime` ("18:00"), `slotDuration` (minutes).
   - `AvailabilityOverride`: `staffId`, `date`, `isBlocked` (boolean), `startTime`, `endTime`, `reason`.

4. **`Booking` (Appointments)**
   - Fields: `id`, `workspaceId`, `staffId`, `leadId`, `serviceName`, `price`, `clientName`, `clientPhone`, `startTime`, `endTime`, `durationMinutes`, `status` (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `DECLINED`), `notes`, `googleEventId`.
   - Indexes: `@@index([workspaceId, startTime])`, `@@index([staffId, startTime])`, `@@index([status])`.

---

## 3. Initial Folder & Module Architecture

Modules follow Domain-Driven Design (lite) with strict repository encapsulation:

```
src/
├── modules/
│   ├── leads/                          # Domain 1: Mini-CRM & Lead Pipeline
│   │   ├── leads.module.ts
│   │   ├── leads.controller.ts
│   │   ├── leads.service.ts
│   │   ├── leads.repository.ts
│   │   └── dto/
│   │       ├── create-lead.dto.ts
│   │       ├── update-lead-status.dto.ts
│   │       └── filter-leads.dto.ts
│   │
│   ├── staff/                          # Domain 2: Masters, Specialists & Work Schedules
│   │   ├── staff.module.ts
│   │   ├── staff.controller.ts
│   │   ├── staff.service.ts
│   │   ├── staff.repository.ts
│   │   └── dto/
│   │
│   ├── bookings/                       # Domain 3: Calendar, Appointments & Slot Engine
│   │   ├── bookings.module.ts
│   │   ├── bookings.controller.ts
│   │   ├── bookings.service.ts
│   │   ├── bookings.repository.ts
│   │   ├── services/
│   │   │   └── slot-calculator.service.ts  # Slot availability validation engine
│   │   └── dto/
│   │       ├── create-booking.dto.ts
│   │       ├── reschedule-booking.dto.ts
│   │       └── get-available-slots.dto.ts
│   │
│   ├── conversations/                  # Domain 4: Unified Inbox & Live Chat
│   │   ├── conversations.module.ts
│   │   ├── conversations.controller.ts
│   │   ├── conversations.service.ts
│   │   ├── conversations.repository.ts
│   │   ├── gateways/
│   │   │   └── conversations.gateway.ts    # WebSockets / SSE for live message stream
│   │   └── dto/
│   │       ├── send-manager-message.dto.ts
│   │       └── list-conversations.dto.ts
│   │
│   ├── analytics/                      # Domain 5: Dashboard Overview & KPIs
│   │   ├── analytics.module.ts
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   └── dto/
│   │       └── dashboard-stats.dto.ts
│   │
│   └── ai-engine/                      # Domain 6: AI Orchestrator & Live Overflow
│       ├── ai-engine.module.ts
│       ├── orchestrator.service.ts
│       ├── niche-policy.service.ts
│       ├── slot-validation.service.ts
│       └── live-overflow.service.ts
```

---

## 4. Phased Feature Roadmap (Future Deep Dives)

```
[Phase 1: Leads Domain]
       │
       ▼
[Phase 2: Staff & Bookings Engine]
       │
       ▼
[Phase 3: Unified Inbox & Manager Outbound]
       │
       ▼
[Phase 4: Real-time Live Overflow & AI Orchestrator]
       │
       ▼
[Phase 5: External Calendar Sync (Google / Altegio)]
       │
       ▼
[Phase 6: Dashboard Analytics & Follow-up Automation]
```

1. **Category A: Lead Pipeline & CRM Management**
   - Kanban board aggregation, stage movement, conversion tracking, customer history.
2. **Category B: Scheduling & Slot Generation Engine**
   - Pure slot calculation algorithms factoring working hours, lunch breaks, service buffers, and appointment collisions.
3. **Category C: Unified Multi-Channel Inbox**
   - Aggregated conversation stream, manager handoff toggle (`BOT_ACTIVE` ↔ `MANAGER_INTERCEPTED`), outbound message dispatch via channel adapters.
4. **Category D: AI Dialogue Orchestration & Live Overflow**
   - Multi-turn conversation state machine, RAG intent routing, real-time slot proposal, automated 24h/72h re-engagement jobs.
5. **Category E: External Calendar & CRM Synchronizers**
   - 2-way Google Calendar event sync, Altegio (YCLIENTS) webhooks, EasyWeek connectors.

---

## 5. Strict Anti-Hallucination Execution Checklist

Use this checklist during every implementation step to ensure consistency, type safety, and architectural compliance.

### Database & Repository Layer
- [ ] **Prisma Scoping**: Every repository method accepts `workspaceId` and filters by it to guarantee multi-tenant security.
- [ ] **No Direct Prisma in Controllers/Services**: Controllers and business services must inject `<Entity>Repository`, never `PrismaService` directly.
- [ ] **Index Verification**: Ensure queries on `[workspaceId, status]`, `[workspaceId, lastMessageAt]`, and `[workspaceId, startTime]` use composite indexes.

### API & DTO Contracts
- [ ] **Translation Envelope**: All API error throws and success responses adhere to `code: string` (e.g., `leads.not_found`), `message: string` (English fallback), and `isRaw: boolean`.
- [ ] **Translation Registry**: Every new translation key is registered in `translation_keys_new.json` as a flat dot-separated pair.
- [ ] **Swagger Decorators**:
  - Do NOT manually add `@ApiProperty` on input DTO fields handled by the Swagger CLI plugin.
  - DO manually add `@ApiProperty({ enum: ... })` for Prisma/TypeScript enums.
  - Keep `@ApiOperation` and `@ApiOkResponse` / `@ApiResponse` on all controller routes.

### Domain Boundaries & Code Quality
- [ ] **Single Responsibility Principle**: Individual service files must remain under 300 lines; split complex algorithms (like slot calculation) into dedicated helper services.
- [ ] **Zero Regressions**: Existing `/onboarding/*`, `/channels/*`, and `/knowledge-base/*` endpoints must continue operating cleanly without breaking changes.
- [ ] **Build Verification**: Run `npm run build` after completing each domain to confirm zero TypeScript compilation errors.
