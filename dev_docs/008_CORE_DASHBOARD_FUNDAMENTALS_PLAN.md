# 008 — Core Dashboard Fundamentals Plan

> **Target Audience:** Frontend & Full-Stack Developers  
> **Scope:** Page architecture, routing strategy, OpenAPI contracts & type generation, endpoint integration specifications, real-time WebSocket protocol, component hierarchy, design system tokens, and phased execution roadmap for the Kvik Dashboard.  
> **Status:** Active Implementation Blueprint  
> **Companions:**  
> - `dev_docs/backend/030_CORE_APP_FUNDAMENTALS_PLAN.md` (Architecture & Foundation)  
> - `dev_docs/backend/031_LEADS_DOMAIN_SPEC.md` (Leads CRM)  
> - `dev_docs/backend/032_STAFF_BOOKINGS_DOMAIN_SPEC.md` (Staff & Bookings)  
> - `dev_docs/backend/033_UNIFIED_INBOX_DOMAIN_SPEC.md` (Unified Inbox & Socket.IO)  
> - `dev_docs/backend/034_AI_ENGINE_DOMAIN_SPEC.md` (AI Orchestrator & Live Overflow)  
> - `dev_docs/backend/035_ANALYTICS_DOMAIN_SPEC.md` (Analytics & Dashboard KPIs)  

---

## 1. Executive Summary

The Kvik Dashboard is a high-velocity, real-time operational hub for business managers across beauty salons, clinics, fitness centers, service providers, and agencies.

The dashboard integrates five operational backend pillars into a unified frontend experience:

| Pillar | Backend Domain | Frontend Route | Key Capabilities |
|---|---|---|---|
| **Analytics Overview** | `src/modules/analytics/` | `/overview` | Real-time KPI cards, conversion funnel, booking trends, channel message distribution, staff workload |
| **Mini-CRM & Leads** | `src/modules/leads/` | `/leads`, `/leads/[leadId]` | Kanban & list pipeline, stage drag-and-drop, lead profiles, channel source tags, soft archive |
| **Unified Inbox** | `src/modules/conversations/` | `/inbox`, `/inbox/[conversationId]` | Multi-channel aggregated inbox (WhatsApp, IG, TG), real-time Socket.IO chat, manager takeover, AI handoff |
| **Bookings & Calendar** | `src/modules/bookings/`, `src/modules/staff/` | `/bookings`, `/bookings/[bookingId]` | Day/week interactive calendar, slot-availability engine, instant booking creation, reschedule, staff availability matrix |
| **AI Orchestrator & Settings** | `src/modules/ai-engine/`, `src/modules/workspaces/` | `/settings/*` | Prompt customization, live overflow threshold, automated follow-ups (24h/72h), interactive AI test playground, staff management |

---

## 2. Design Philosophy & Aesthetic Direction

The dashboard must feel like an elite, modern B2B SaaS platform (Linear, Raycast, Stripe Dashboard, Supabase). It uses an ultra-clean dark/indigo aesthetic with refined glassmorphism, high information density, and smooth micro-animations.

### 2.1. Motion & Physics Principles
All views utilize the existing motion system in `components/ui/motion/`:
- **Route transitions:** `<FadeIn direction="up" distance={20} duration={0.25}>` on page roots.
- **Card grids & list rows:** `<StaggerContainer>` and `<StaggerItem staggerDelay={0.04}>`.
- **Interactive elements:** `<InteractiveCard>` with `scale: 1.01` hover and `scale: 0.99` tap feedback.
- **Loading states:** `<ShimmerSkeleton>` tailored to match final content geometry — zero blank screens or layout shifts.
- **Status & State transitions:** Smooth badge and tab animations with snappy spring physics (`stiffness: 400, damping: 30`).

### 2.2. Information Density & Operator Ergonomics
- **Row height:** Dense tables and lists (36–42px row height) maximizing visible data above the fold.
- **Semantic color system:** Strict usage of CSS custom property tokens and status utility classes defined in `globals.css`.
- **Micro-indicators:** Unread badges, online status indicators, slot availability heat tones, channel badges.
- **Contextual empty states:** Informative empty states that guide the operator toward actionable next steps.

### 2.3. No Perceived AI Generation
- Authentic Russian microcopy for all UI elements, sourced from `locales/ru/dashboard.json`.
- Strict iconography powered by `lucide-react`.
- Clean hierarchy: Headlines at `font-extrabold tracking-tight`, data values at `font-semibold tabular-nums`, secondary meta at `text-muted-foreground text-xs`.

---

## 3. OpenAPI Contract & Automated Type Generation

All frontend types for API requests, response DTOs, and enum definitions are generated automatically from `openapi.json` into `types/api.ts` using `openapi-typescript`.

### 3.1. Type Generation Command
```bash
npx openapi-typescript openapi.json -o types/api.ts
```
*(Added as `npm run gen:types` in `package.json`).*

### 3.2. Direct Usage in API Clients & Hooks
```ts
import type { paths, components } from '@/types/api';

export type LeadDto = components['schemas']['LeadResponseDto'];
export type ConversationDto = components['schemas']['ConversationResponseDto'];
export type BookingDto = components['schemas']['BookingResponseDto'];
export type AnalyticsOverviewDto = components['schemas']['AnalyticsOverviewResponseDto'];
export type StaffDto = components['schemas']['StaffResponseDto'];
export type AiConfigDto = components['schemas']['AiConfigResponseDto'];
```

---

## 4. Routing & Page Architecture

The dashboard uses Next.js App Router nested file-system routing under the `(dashboard)` route group:

```
app/(dashboard)/
├── layout.tsx                          # Dashboard shell: Sidebar + Topbar + Realtime Provider
├── page.tsx                            # Root redirect -> /overview
│
├── overview/
│   └── page.tsx                        # KPI dashboard, funnel chart, recent activity
│
├── inbox/
│   ├── page.tsx                        # Split-pane unified inbox (all conversations)
│   └── [conversationId]/
│       └── page.tsx                    # Direct link / deep link to specific conversation
│
├── leads/
│   ├── page.tsx                        # Kanban pipeline + List CRM view
│   └── [leadId]/
│       └── page.tsx                    # Deep-linkable Lead detail drawer route
│
├── bookings/
│   ├── page.tsx                        # Day/Week calendar grid + upcoming appointments
│   └── [bookingId]/
│       └── page.tsx                    # Deep-linkable Booking detail modal route
│
└── settings/
    ├── page.tsx                        # Redirect -> /settings/workspace
    ├── workspace/
    │   └── page.tsx                    # Business profile, niche, timezone, branding
    ├── channels/
    │   └── page.tsx                    # WhatsApp, Instagram, Telegram channel status & reconnection
    ├── staff/
    │   └── page.tsx                    # Staff team members, working hours & availability matrix
    ├── ai-agent/
    │   └── page.tsx                    # Prompt instructions, live overflow threshold, follow-ups
    └── billing/
        └── page.tsx                    # Subscription plan, message quotas, usage meters
```

---

## 5. Domain & Endpoint Specifications

Every frontend view is mapped directly to backend REST endpoints and Socket.IO events.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       DASHBOARD APPLICATION                                      │
├─────────────────┬──────────────────┬─────────────────┬───────────────────┬───────────────────────┤
│    /overview    │      /leads      │     /inbox      │     /bookings     │       /settings       │
├─────────────────┼──────────────────┼─────────────────┼───────────────────┼───────────────────────┤
│ GET /analytics/ │ GET /leads       │ GET /conversat- │ GET /bookings     │ GET /workspaces/me    │
│   overview      │ GET /leads/count │   ions          │ GET /bookings/    │ GET /channels         │
│ GET /analytics/ │ GET /leads/:id   │ GET /conversat- │   slots           │ GET /staff            │
│   funnel        │ PATCH /leads/:id │   ions/:id/msgs │ POST /bookings    │ PUT /staff/:id/sched  │
│ GET /analytics/ │   /status        │ POST /conversat-│ PATCH /bookings/  │ GET /ai-engine/config │
│   bookings-by-  │ PATCH /leads/:id │   ions/:id/msgs │   :id/status      │ PATCH /ai-engine/     │
│   day           │ DELETE /leads/:id│ PATCH /conversat│ PATCH /bookings/  │   config              │
│ GET /analytics/ │                  │   ions/:id/stat │   :id/reschedule  │ POST /ai-engine/test  │
│   channels      │                  │ Socket.IO WSS   │                   │                       │
│ GET /analytics/ │                  │   message.new   │                   │                       │
│   staff         │                  │   conv.updated  │                   │                       │
└─────────────────┴──────────────────┴─────────────────┴───────────────────┴───────────────────────┘
```

---

### 5.1. Analytics & Overview Domain (`/overview`)

**Backend Spec Reference:** `dev_docs/backend/035_ANALYTICS_DOMAIN_SPEC.md`

#### Endpoints Integration:
1. `GET /analytics/overview?from={ISO}&to={ISO}`
   - **Purpose:** Top-level KPI stats (Leads summary, Bookings summary, Conversations summary, Revenue estimate).
   - **Frontend Hook:** `useAnalyticsOverview({ from, to })` (SWR with 5-minute auto-refresh).
   - **UI Consumers:** `KpiGrid.tsx`, `StatCard.tsx`, `AiAgentStatusCard.tsx`.
2. `GET /analytics/funnel?from={ISO}&to={ISO}`
   - **Purpose:** Stage-by-stage pipeline conversion rates (`NEW` -> `QUALIFIED` -> `APPOINTMENT_SET` -> `DEAL_WON`).
   - **UI Consumer:** `LeadFunnelChart.tsx` (CSS animated percentage bars with conversion % pill tags).
3. `GET /analytics/bookings-by-day?from={ISO}&to={ISO}`
   - **Purpose:** Daily booking timeline (`date`, `total`, `confirmed`, `cancelled`).
   - **UI Consumer:** `BookingsTrendChart.tsx`.
4. `GET /analytics/channels?from={ISO}&to={ISO}`
   - **Purpose:** Message and conversation volume breakdown by channel (`WHATSAPP`, `INSTAGRAM`, `TELEGRAM`).
   - **UI Consumer:** `ChannelDistributionCard.tsx`.
5. `GET /analytics/staff?from={ISO}&to={ISO}`
   - **Purpose:** Staff workload and revenue generation (`staffId`, `staffName`, `totalBookings`, `completedBookings`, `estimatedRevenue`).
   - **UI Consumer:** `StaffWorkloadTable.tsx`.

---

### 5.2. Mini-CRM & Leads Domain (`/leads`)

**Backend Spec Reference:** `dev_docs/backend/031_LEADS_DOMAIN_SPEC.md`

#### Endpoints Integration:
1. `GET /leads?status=&sourceChannel=&search=&page=1&limit=50&sortBy=lastActivityAt&sortOrder=desc`
   - **Purpose:** Paginated list of leads with server-side filters.
   - **Frontend Hook:** `useLeads(filters)` with search debouncing (300ms).
   - **UI Consumers:** `LeadsKanban.tsx`, `LeadsList.tsx`.
2. `GET /leads/counts`
   - **Purpose:** Counts grouped by stage (`NEW`, `QUALIFIED`, `APPOINTMENT_SET`, `DEAL_WON`, `DEAL_LOST`).
   - **UI Consumers:** Kanban column header badges.
3. `GET /leads/:id`
   - **Purpose:** Full lead dossier, linked conversation history, and past/upcoming bookings.
   - **UI Consumer:** `LeadDetail.tsx` (slide-in side drawer with tabbed history).
4. `PATCH /leads/:id/status`
   - **Payload:** `{ status: LeadStatus }`
   - **Optimistic Behavior:** Immediately moves the card to the target column in the UI; reverts and triggers error toast if rejected.
5. `PATCH /leads/:id`
   - **Payload:** `{ name?, phone?, email?, nicheData? }`
   - **UI Consumer:** In-place editable fields in `LeadDetail.tsx`.
6. `DELETE /leads/:id`
   - **Behavior:** Soft-archives the lead (sets status to `DEAL_LOST`).

---

### 5.3. Unified Inbox & Real-Time Gateway (`/inbox`)

**Backend Spec Reference:** `dev_docs/backend/033_UNIFIED_INBOX_DOMAIN_SPEC.md`

#### Endpoints Integration:
1. `GET /conversations?status=&channelType=&search=&page=1&limit=30`
   - **Purpose:** Inbox thread list ordered by `lastMessageAt DESC`.
   - **Frontend Hook:** `useConversations(filters)` synced with Zustand `inbox.ts` store.
   - **UI Consumer:** `ConversationList.tsx`, `ConversationListItem.tsx`.
2. `GET /conversations/:id`
   - **Purpose:** Thread metadata, channel status, and linked lead info.
3. `GET /conversations/:id/messages?page=1&limit=50`
   - **Purpose:** Paginated chat history (oldest first). Automatically resets `unreadCount` to 0 on the server.
   - **UI Consumer:** `ConversationThread.tsx`, `MessageBubble.tsx`.
4. `POST /conversations/:id/messages`
   - **Payload:** `{ content: string }`
   - **Behavior:** Dispatches outbound message through WhatsApp/IG/TG adapters; automatically transitions conversation to `MANAGER_INTERCEPTED` if it was `BOT_ACTIVE`.
   - **Optimistic Behavior:** Adds pending message bubble immediately; confirms on HTTP 201 response.
5. `PATCH /conversations/:id/status`
   - **Payload:** `{ status: "BOT_ACTIVE" | "MANAGER_INTERCEPTED" | "CLOSED" }`
   - **UI Consumer:** `HandoffToggle.tsx` switch in chat header.
6. `PATCH /conversations/:id/read`
   - **Purpose:** Mark thread read, resetting unread counter.

#### Socket.IO Real-Time Gateway Protocol:
- **Namespace:** `/conversations` (handshake with JWT `auth: { token }`).
- **Room Management:**
  - Client emits `workspace.join { workspaceId }` on mount.
  - Client emits `workspace.leave { workspaceId }` on unmount.
- **Server Broadcast Events:**
  - `message.new` -> `{ conversationId, message: { id, role, content, createdAt } }`: Appends bubble if conversation is active; increments unread counter and updates thread preview in list.
  - `conversation.updated` -> `{ id, status, lastMessageAt, unreadCount }`: Updates status badge and moves thread to top of list.
  - `conversation.new` -> `{ ...fullConversation }`: Inserts new inbound conversation at index 0.

---

### 5.4. Staff & Bookings Calendar Domain (`/bookings`, `/settings/staff`)

**Backend Spec Reference:** `dev_docs/backend/032_STAFF_BOOKINGS_DOMAIN_SPEC.md`

#### Endpoints Integration (Bookings):
1. `GET /bookings?from={ISO}&to={ISO}&staffId=&status=`
   - **Purpose:** Calendar appointments within the selected date range.
   - **Frontend Hook:** `useBookings({ from, to, staffId, status })`.
   - **UI Consumers:** `BookingCalendar.tsx` (day/week interactive grid), `BookingList.tsx`.
2. `GET /bookings/slots?staffId={uuid}&date={YYYY-MM-DD}&durationMinutes={number}`
   - **Purpose:** Slot calculation engine returning `{ slots: [{ startTime, endTime, available }] }`.
   - **Frontend Hook:** `useAvailableSlots({ staffId, date, durationMinutes })`.
   - **UI Consumer:** `CreateBookingModal.tsx`, `RescheduleModal.tsx`.
3. `POST /bookings`
   - **Payload:** `{ staffId?, leadId?, serviceName, price?, clientName, clientPhone, clientEmail?, startTime, durationMinutes, notes? }`
   - **UI Consumer:** `CreateBookingModal.tsx`.
4. `GET /bookings/:id`
   - **Purpose:** Appointment details, staff member info, client contact info.
   - **UI Consumer:** `BookingDetail.tsx`.
5. `PATCH /bookings/:id/status`
   - **Payload:** `{ status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "DECLINED" }`
   - **UI Consumer:** Status action buttons in `BookingDetail.tsx`.
6. `PATCH /bookings/:id/reschedule`
   - **Payload:** `{ startTime, durationMinutes }`
   - **UI Consumer:** `RescheduleBookingModal.tsx`.

#### Endpoints Integration (Staff Management):
1. `GET /staff?isActive=true` -> List active specialists (`StaffSelector.tsx`, `StaffList.tsx`).
2. `POST /staff` -> Add staff member (`StaffForm.tsx`).
3. `PATCH /staff/:id` -> Update profile, role, specializations.
4. `DELETE /staff/:id` -> Deactivate staff member.
5. `GET /staff/:id/schedule?from=&to=` -> Fetch weekly availability templates and overrides.
6. `PUT /staff/:id/schedule` -> Replace weekly schedule (`AvailabilityEditor.tsx`).
7. `POST /staff/:id/overrides` -> Add day off / vacation / custom hours override.
8. `DELETE /staff/:id/overrides/:overrideId` -> Remove override.

---

### 5.5. AI Orchestrator & Live Overflow Domain (`/settings/ai-agent`)

**Backend Spec Reference:** `dev_docs/backend/034_AI_ENGINE_DOMAIN_SPEC.md`

#### Endpoints Integration:
1. `GET /ai-engine/config`
   - **Response:** `{ nicheProfile, systemPromptPreview, followUpEnabled, followUp24hEnabled, followUp72hEnabled, liveOverflowTimeoutSeconds }`
   - **UI Consumer:** `AgentConfig.tsx`.
2. `PATCH /ai-engine/config`
   - **Payload:** `{ followUp24hEnabled?, followUp72hEnabled?, liveOverflowTimeoutSeconds?, customInstructions? }`
   - **UI Consumer:** Settings form in `AgentConfig.tsx`.
3. `POST /ai-engine/test`
   - **Payload:** `{ message: string }`
   - **Response:** `{ response: string, ragChunksUsed: number, latencyMs: number }`
   - **UI Consumer:** `AiSandboxDrawer.tsx` — interactive testing simulator that validates AI responses and knowledge base retrieval in real time.

---

## 6. Client-Side API Clients & Custom Hooks Layer

```
lib/api/
├── auth.ts                   # Auth & session management
├── onboarding.ts             # Onboarding wizard endpoints
├── types.ts                  # Re-exported generated API types
├── analytics.ts              # Overview, Funnel, Daily Bookings, Channels, Staff
├── leads.ts                  # Leads CRUD, Status patch, Counts, Soft-delete
├── conversations.ts          # Conversations list, Messages, Send, Handoff, Mark Read
├── bookings.ts               # Bookings list, Slot calculation, Create, Reschedule, Status
├── staff.ts                  # Staff list, Create, Update, Schedule templates, Overrides
└── aiEngine.ts               # AI Config get/patch, Test simulation runner

hooks/
├── useAuth.ts                # Session state & tokens
├── useAnalytics.ts           # SWR cached analytics KPIs with date range controls
├── useLeads.ts               # SWR leads list with search debounce & optimistic stage move
├── useConversations.ts       # SWR conversation threads and paginated messages
├── useInboxRealtime.ts       # Socket.IO lifecycle, auto-reconnect, event subscribers
├── useBookings.ts            # SWR bookings list with calendar range filters
├── useSlots.ts               # Dynamic available time slot engine query
├── useStaff.ts               # Staff directory & schedule management hooks
└── useAiEngine.ts            # AI configuration & test dialogue runner
```

---

## 7. Global State Architecture (Zustand)

Global state is strictly reserved for cross-cutting UI state that transcends individual route segments:

```ts
// store/inbox.ts
interface InboxStore {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  unreadCounts: Record<string, number>; // conversationId -> count
  totalUnreadCount: number;             // drives sidebar badge counter
  setUnreadCount: (conversationId: string, count: number) => void;
  filterStatus: 'ALL' | 'BOT_ACTIVE' | 'MANAGER_INTERCEPTED' | 'CLOSED';
  setFilterStatus: (status: InboxStore['filterStatus']) => void;
  filterChannel: 'ALL' | 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM';
  setFilterChannel: (channel: InboxStore['filterChannel']) => void;
}
```

*Note: Domain entity data (leads, bookings, metrics) lives in SWR hook caches — never in global Zustand stores — preventing state desynchronization.*

---

## 8. Shared Component System

```
components/
├── ui/                                # UI Primitives (Design tokens)
│   ├── badge.tsx                      # Badge variants
│   ├── button.tsx                     # Button variants & states
│   ├── input.tsx                      # Form input field
│   ├── select.tsx                     # Select dropdown
│   ├── textarea.tsx                   # Multiline input
│   ├── modal.tsx                      # Centered dialog & slide-in drawer
│   ├── dropdown-menu.tsx              # Action menu kebabs
│   ├── tooltip.tsx                    # Informational hover tooltips
│   ├── avatar.tsx                     # Initials avatar with status indicator dot
│   ├── progress.tsx                   # Linear gradient progress bar
│   ├── skeleton.tsx                   # StatCard, ListRow, Thread, LeadCard skeletons
│   └── motion/                        # FadeIn, StaggerContainer, InteractiveCard
│
└── dashboard/                         # Domain UI components
    ├── shared/
    │   ├── PageHeader.tsx             # H1 + description + action CTA slot
    │   ├── SectionCard.tsx            # Standard titled container card
    │   ├── StatCard.tsx               # KPI metric card (value, delta %, icon)
    │   ├── EmptyState.tsx             # Illustrated empty state with action button
    │   ├── EntityAvatar.tsx           # Avatar wrapper for leads and staff
    │   └── StatusBadge.tsx            # Maps backend status enums -> CSS tokens
    ├── overview/                      # Overview page subcomponents
    ├── inbox/                         # Chat list, thread, bubble, composer, handoff toggle
    ├── leads/                         # Kanban board, columns, lead cards, filter bar
    ├── bookings/                      # Calendar grid, appointment list, slot picker
    └── settings/                      # Workspace, channels, staff availability, AI config
```

---

## 9. Status Token Mappings (`globals.css`)

All entity status badges reference CSS utility classes configured with high-contrast accessibility:

| Domain | Value | Utility Class | Visual Presentation |
|---|---|---|---|
| **Lead** | `NEW` | `.status-new` | Ice Blue fill / text |
| | `QUALIFIED` | `.status-qualified` | Amber Gold fill / text |
| | `APPOINTMENT_SET` | `.status-appointment` | Purple Violet fill / text |
| | `DEAL_WON` | `.status-won` | Emerald Green fill / text |
| | `DEAL_LOST` | `.status-lost` | Coral Red fill / text |
| **Booking** | `PENDING` | `.status-pending` | Amber Gold fill / text |
| | `CONFIRMED` | `.status-confirmed` | Indigo Blue fill / text |
| | `COMPLETED` | `.status-completed` | Emerald Green fill / text |
| | `CANCELLED` | `.status-cancelled` | Coral Red fill / text |
| | `DECLINED` | `.status-declined` | Muted Red fill / text |
| **Conversation** | `BOT_ACTIVE` | `.status-bot-active` | Cyan / AI Sparkle fill |
| | `MANAGER_INTERCEPTED` | `.status-intercepted` | Orange Amber fill |
| | `CLOSED` | `.status-closed` | Muted Slate fill |

---

## 10. Localization Architecture (`locales/ru/dashboard.json`)

All UI strings are strictly Russian and resolved via `useTranslations('dashboard')` or `getTranslations('dashboard')`.

Key namespaces:
- `dashboard.nav.*`: Navigation item labels.
- `dashboard.overview.*`: Metric titles, chart headers, summary labels.
- `dashboard.leads.*`: Kanban stages, lead fields, stage change alerts.
- `dashboard.inbox.*`: Filter tabs, message roles, handoff switch, live overflow alerts.
- `dashboard.bookings.*`: Calendar controls, slot labels, status actions, conflict alerts.
- `dashboard.settings.*`: Profile, team schedules, prompt editors, billing meters.
- `dashboard.status.*`: Display text for all backend status enums.
- `dashboard.empty.*`: Empty state explanations and action CTA labels.

---

## 11. Concise Phased Execution Roadmap

```
Phase 0: Foundation & Routing Migration  ──►  Phase 1: Analytics Overview
                   │                                      │
                   ▼                                      ▼
Phase 2: Leads Pipeline & Mini-CRM       ──►  Phase 3: Unified Inbox & Realtime
                   │                                      │
                   ▼                                      ▼
Phase 4: AI Engine & Live Overflow       ──►  Phase 5: Bookings & Staff Calendar
                   │
                   ▼
Phase 6: Settings, Quotas & Polish
```

### Phase 0: Foundation, Routing & Types (Current)
- [x] Install `lucide-react` & generate API types via `npx openapi-typescript openapi.json -o types/api.ts`
- [x] Move legacy demo components into `components/dashboard/_legacy/`
- [x] Create core UI primitives: `modal.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `avatar.tsx`, `progress.tsx`, `skeleton.tsx`
- [x] Create shared dashboard components: `PageHeader.tsx`, `SectionCard.tsx`, `StatCard.tsx`, `EmptyState.tsx`, `EntityAvatar.tsx`, `StatusBadge.tsx`
- [x] Scaffold all route segment pages under `app/(dashboard)/` (`overview`, `inbox`, `leads`, `bookings`, `settings/*`)
- [x] Add status tokens to `globals.css` and configure `dashboard` translation keys

### Phase 1: Analytics Overview Integration
- [ ] Implement `lib/api/analytics.ts` and `hooks/useAnalytics.ts`
- [ ] Connect `GET /analytics/overview` to `KpiGrid.tsx` and `StatCard.tsx`
- [ ] Connect `GET /analytics/funnel` to `LeadFunnelChart.tsx`
- [ ] Connect `GET /analytics/bookings-by-day` and `GET /analytics/channels`
- [ ] Connect `GET /analytics/staff` to `StaffWorkloadTable.tsx`
- [ ] Add date-range picker filter (Today / 7 Days / 30 Days / Custom)

### Phase 2: Leads Pipeline & Mini-CRM Integration
- [ ] Implement `lib/api/leads.ts` and `hooks/useLeads.ts`
- [ ] Connect `GET /leads` and `GET /leads/counts` to `LeadsKanban.tsx` and `LeadsList.tsx`
- [ ] Connect `PATCH /leads/:id/status` with optimistic stage drag-and-drop
- [ ] Connect `GET /leads/:id` and `PATCH /leads/:id` to `LeadDetail.tsx` slide-in drawer
- [ ] Implement soft archive via `DELETE /leads/:id`

### Phase 3: Unified Inbox & Real-Time Chat Integration
- [ ] Implement `lib/api/conversations.ts` and `hooks/useConversations.ts`
- [ ] Connect `GET /conversations` to `ConversationList.tsx` with unread indicators
- [ ] Connect `GET /conversations/:id/messages` to `ConversationThread.tsx` with auto mark-as-read
- [ ] Connect `POST /conversations/:id/messages` in `ManagerComposer.tsx` with optimistic dispatch
- [ ] Connect `PATCH /conversations/:id/status` in `HandoffToggle.tsx`
- [ ] Implement `hooks/useInboxRealtime.ts` (Socket.IO client for `message.new` and `conversation.updated`)

### Phase 4: AI Orchestrator & Live Overflow Integration
- [ ] Implement `lib/api/aiEngine.ts` and `hooks/useAiEngine.ts`
- [ ] Connect `GET /ai-engine/config` and `PATCH /ai-engine/config` in `AgentConfig.tsx`
- [ ] Connect `POST /ai-engine/test` to `AiSandboxDrawer.tsx` with latency & RAG chunk display
- [ ] Add Live Overflow alert banner when bot resumes after manager inactivity timeout

### Phase 5: Bookings & Staff Calendar Integration
- [ ] Implement `lib/api/bookings.ts`, `lib/api/staff.ts`, `hooks/useBookings.ts`, `hooks/useStaff.ts`
- [ ] Connect `GET /bookings` to `BookingCalendar.tsx` (day/week grid) and `BookingList.tsx`
- [ ] Connect `GET /bookings/slots` to `CreateBookingModal.tsx` slot engine selector
- [ ] Connect `POST /bookings`, `PATCH /bookings/:id/status`, and `PATCH /bookings/:id/reschedule`
- [ ] Connect `GET /staff`, `POST /staff`, and `PUT /staff/:id/schedule` in `AvailabilityEditor.tsx`

### Phase 6: Settings, Quotas & Final Verification
- [ ] Connect `/settings/workspace` to workspace profile endpoints
- [ ] Connect `/settings/channels` to channel status & OAuth reconnection workflows
- [ ] Connect `/settings/billing` to subscription details and message quota progress bars
- [ ] Run full end-to-end lint, typecheck, and build verification

---

## 12. Quality & Anti-Pattern Checklist

- [ ] **No Hardcoded Strings:** Every UI label is sourced via `useTranslations('dashboard')`.
- [ ] **No Hardcoded Hex Colors:** Colors map to CSS variables or semantic status utility classes in `globals.css`.
- [ ] **Single H1 per Route:** Every route segment has exactly one `<h1>` inside `PageHeader.tsx`.
- [ ] **Component LOC Ceiling:** No component file exceeds 300 lines of code; decompose sub-views early.
- [ ] **Shimmer Loading:** Every async data container displays `<ShimmerSkeleton>` prior to resolution.
- [ ] **Clean Subscriptions:** Socket.IO event listeners and timers cleanly detach on component unmount.
