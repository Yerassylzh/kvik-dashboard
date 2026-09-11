# 035 — Analytics & Dashboard Overview Domain Spec

> **Module:** `src/modules/analytics/`  
> **Status:** Implementation Pending — Phase 6  
> **Depends On:** Leads, Bookings, Conversations, Messages  

---

## 1. Purpose

The Analytics module provides aggregated KPI data for the dashboard home screen and reporting views. All metrics are workspace-scoped, computed in real time (no separate data warehouse at this stage), and support a configurable date range.

---

## 2. No New Prisma Models Required

All analytics are derived from existing tables:
- `leads` → pipeline funnel, conversion rates
- `bookings` → revenue estimates, completion rates
- `conversations` → message volume, manager intervention rate
- `messages` → bot vs. manager message ratio

---

## 3. API Endpoints

All routes require `Authorization: Bearer <access_token>`.

---

### `GET /analytics/overview`
> **Main dashboard widget data.** Returns top-level KPIs for the given period. Used for the dashboard home screen summary cards.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `from` | ISO date (required) | Start of period, e.g. `2026-09-01` |
| `to` | ISO date (required) | End of period, e.g. `2026-09-11` |

**Response `200`:**
```json
{
  "period": { "from": "2026-09-01", "to": "2026-09-11" },
  "leads": {
    "total": 142,
    "new": 18,
    "qualified": 32,
    "appointmentSet": 25,
    "dealWon": 20,
    "dealLost": 5
  },
  "bookings": {
    "total": 38,
    "confirmed": 28,
    "completed": 20,
    "cancelled": 6,
    "declined": 4
  },
  "conversations": {
    "total": 89,
    "botHandled": 71,
    "managerIntercepted": 18,
    "avgResponseTimeSeconds": null
  },
  "revenue": {
    "estimatedTotal": "105000.00",
    "currency": "KZT"
  }
}
```

---

### `GET /analytics/funnel`
> Lead pipeline funnel data for the conversion chart.

**Query Params:** `from`, `to` (ISO dates, required)

**Response `200`:**
```json
{
  "stages": [
    { "status": "NEW",             "count": 142, "conversionRate": null },
    { "status": "QUALIFIED",       "count": 55,  "conversionRate": 38.7 },
    { "status": "APPOINTMENT_SET", "count": 25,  "conversionRate": 45.5 },
    { "status": "DEAL_WON",        "count": 20,  "conversionRate": 80.0 }
  ]
}
```

---

### `GET /analytics/bookings-by-day`
> Daily bookings count for a line/bar chart over a date range.

**Query Params:** `from`, `to` (ISO dates, required)

**Response `200`:**
```json
{
  "data": [
    { "date": "2026-09-01", "total": 4, "confirmed": 3, "cancelled": 1 },
    { "date": "2026-09-02", "total": 6, "confirmed": 5, "cancelled": 1 }
  ]
}
```

---

### `GET /analytics/channels`
> Message volume breakdown by channel. Used for the channel distribution pie chart.

**Query Params:** `from`, `to` (ISO dates, required)

**Response `200`:**
```json
{
  "WHATSAPP":  { "conversations": 45, "messages": 312 },
  "INSTAGRAM": { "conversations": 30, "messages": 198 },
  "TELEGRAM":  { "conversations": 14, "messages": 87  }
}
```

---

### `GET /analytics/staff`
> Per-staff booking load for the current period. Used for the staff performance table.

**Query Params:** `from`, `to` (ISO dates, required)

**Response `200`:**
```json
[
  {
    "staffId": "uuid",
    "staffName": "Мастер Анна",
    "totalBookings": 18,
    "completedBookings": 14,
    "cancelledBookings": 2,
    "estimatedRevenue": "63000.00"
  }
]
```

---

## 4. Files to Create

```
src/modules/analytics/
├── analytics.module.ts
├── analytics.controller.ts
├── analytics.service.ts
└── dto/
    ├── analytics-period.dto.ts
    └── analytics-response.dto.ts
```

---

## 5. Implementation Checklist

- [ ] `AnalyticsService` — all queries filter by `workspaceId` and the `from`/`to` date range
- [ ] `GET /analytics/overview` — parallel queries: leads counts, bookings counts, conversation counts, revenue SUM
- [ ] `GET /analytics/funnel` — groupBy status with count, calculate conversionRate as `(nextStageCount / currentCount) * 100`
- [ ] `GET /analytics/bookings-by-day` — groupBy `DATE(startTime)` with status breakdown
- [ ] `GET /analytics/channels` — join conversations → channel → count groupBy channelType + count messages
- [ ] `GET /analytics/staff` — groupBy staffId + join staffName + SUM price for COMPLETED bookings
- [ ] Revenue field: use `bookings.price` (Decimal), sum only COMPLETED or CONFIRMED bookings; label as `estimatedTotal`
- [ ] `from` and `to` params — validate they are valid ISO dates, `to` >= `from`, max range 365 days
- [ ] All response DTOs have explicit `@ApiProperty` decorators (no plugin auto-inference on response DTOs)
- [ ] `npm run build` passes cleanly
