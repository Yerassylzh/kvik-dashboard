# 031 — Leads Domain Spec

> **Module:** `src/modules/leads/`  
> **Status:** Implementation Pending  
> **Depends On:** Workspace, Channel (for sourceChannel)  

---

## 1. Purpose

The Leads module is the mini-CRM layer. Every contact who sends a message to any connected channel (WhatsApp, Instagram, Telegram) becomes a `Lead` record. The dashboard lets the manager view, filter, manually update, and track leads through the sales funnel.

---

## 2. Prisma Model Reference

```prisma
model Lead {
  id             String       @id @default(uuid())
  workspaceId    String
  name           String?
  phone          String?
  email          String?
  sourceChannel  ChannelType?        // WHATSAPP | INSTAGRAM | TELEGRAM
  status         LeadStatus          // NEW | QUALIFIED | APPOINTMENT_SET | DEAL_WON | DEAL_LOST
  nicheData      Json?               // niche-specific: service interest, notes, etc.
  lastActivityAt DateTime
  createdAt      DateTime
  updatedAt      DateTime
}
```

---

## 3. API Endpoints

All routes require `Authorization: Bearer <access_token>`. All responses are multi-tenant scoped — the backend resolves `workspaceId` from the JWT automatically.

---

### `GET /leads`
> Paginated list of leads with filtering support. Used for the CRM table/kanban view.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `status` | `LeadStatus` (optional) | Filter by status |
| `sourceChannel` | `ChannelType` (optional) | Filter by channel |
| `search` | `string` (optional) | Search by name or phone |
| `page` | `number` (default: 1) | Page number |
| `limit` | `number` (default: 20, max: 100) | Items per page |
| `sortBy` | `lastActivityAt \| createdAt` (default: `lastActivityAt`) | Sort field |
| `sortOrder` | `asc \| desc` (default: `desc`) | Sort direction |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Анна Смирнова",
      "phone": "+77011234567",
      "email": null,
      "sourceChannel": "WHATSAPP",
      "status": "QUALIFIED",
      "lastActivityAt": "2026-09-10T14:32:00Z",
      "createdAt": "2026-09-01T09:00:00Z"
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 20
}
```

---

### `GET /leads/counts`
> Returns lead counts grouped by status. Used for the Kanban board column headers and dashboard summary widgets.

**Response `200`:**
```json
{
  "NEW": 14,
  "QUALIFIED": 8,
  "APPOINTMENT_SET": 5,
  "DEAL_WON": 22,
  "DEAL_LOST": 3
}
```

---

### `GET /leads/:id`
> Full lead detail with conversation list and booking list.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Анна Смирнова",
  "phone": "+77011234567",
  "email": null,
  "sourceChannel": "WHATSAPP",
  "status": "QUALIFIED",
  "nicheData": { "serviceInterest": "Стрижка + окрашивание" },
  "lastActivityAt": "2026-09-10T14:32:00Z",
  "createdAt": "2026-09-01T09:00:00Z",
  "conversations": [{ "id": "uuid", "channelType": "WHATSAPP", "status": "BOT_ACTIVE", "lastMessageAt": "..." }],
  "bookings": [{ "id": "uuid", "serviceName": "Стрижка", "startTime": "...", "status": "CONFIRMED" }]
}
```

---

### `PATCH /leads/:id/status`
> Update lead status (stage movement). Also used by the AI engine automatically.

**Request Body:**
```json
{
  "status": "APPOINTMENT_SET"
}
```

**Response `200`:**
```json
{ "code": "leads.status_updated", "message": "Lead status updated." }
```

**Errors:** `404` `leads.not_found` | `400` `leads.invalid_status_transition`

---

### `PATCH /leads/:id`
> Update lead profile fields (name, phone, email, nicheData).

**Request Body** (all optional):
```json
{
  "name": "Анна Смирнова",
  "phone": "+77011234567",
  "email": "anna@example.com",
  "nicheData": { "serviceInterest": "Маникюр" }
}
```

**Response `200`:**
```json
{ "code": "leads.updated", "message": "Lead updated." }
```

---

### `DELETE /leads/:id`
> Soft-archive a lead (sets `status = DEAL_LOST` and hides from default list).  
> Hard delete is not exposed for data safety.

**Response `200`:**
```json
{ "code": "leads.archived", "message": "Lead archived." }
```

---

## 4. Files to Create

```
src/modules/leads/
├── leads.module.ts
├── leads.controller.ts
├── leads.service.ts
├── leads.repository.ts
└── dto/
    ├── filter-leads.dto.ts
    ├── update-lead.dto.ts
    └── update-lead-status.dto.ts
```

---

## 5. Implementation Checklist

- [ ] `LeadsRepository` — all queries filter by `workspaceId` first
- [ ] `GET /leads` — apply search (ilike name/phone), status filter, channel filter, pagination, sort
- [ ] `GET /leads/counts` — `groupBy` status query
- [ ] `GET /leads/:id` — include `conversations` (id, channelType, status, lastMessageAt) and `bookings` (id, serviceName, startTime, status)
- [ ] `PATCH /leads/:id/status` — validate valid `LeadStatus` enum value
- [ ] `PATCH /leads/:id` — partial update, do not allow `workspaceId` / `sourceChannel` overwrite
- [ ] `DELETE /leads/:id` — archive (set `DEAL_LOST`), not hard delete
- [ ] All error codes registered in `translation_keys_new.json`
- [ ] `npm run build` passes cleanly
