# 049 — Business Intelligence System Security & Robustness Hardening Plan

> **Module:** `src/modules/business-insights/`, `src/queues/`, `src/modules/mail/`, `src/modules/auth/`  
> **Target Audience:** Backend Engineers, Frontend Engineers, Security Auditors  
> **Status:** Architecture Specification & Implementation Blueprint  

---

## 1. Executive Summary & Objective

During the architectural and security review of the Autonomous Business Intelligence & Recommendations System (Doc 048), several critical security vulnerabilities, concurrency gaps, and analytical precision issues were identified:

1. **Tenant Isolation:** REST controller endpoints and WebSocket gateway rooms did not verify caller workspace ownership against the JWT payload.
2. **Idempotency & Concurrency:** 1-Click action application and dismissals lacked status preconditions, allowing duplicate database insertions and redundant queue jobs upon double-clicks.
3. **Template & Quote Sanitization:** Customer verbatim quotes and recommendation titles lacked HTML escaping, exposing emails to formatting breakages.
4. **Clustering & Analytical Accuracy:** Exact-match key normalization fragmented word-order variations in customer requests, and demand trend heatmaps hardcoded standard operating hours rather than querying actual business schedule templates.
5. **Multi-Workspace Context Switching:** Provided full workspace discovery (`GET /auth/workspaces`) and context switching (`POST /auth/switch-workspace`) integration for frontend users.

This document details the exact changes, the frontend API contract updates, and the implementation checklist.

---

## 2. Security & Tenant Isolation Hardening

### 2.1. REST API Tenant Verification & Role Guards
* **Issue:** `BusinessInsightsController` read `workspaceId` from `@Param('workspaceId')` without ensuring `user.workspaceId === workspaceId`.
* **Fix:** 
  1. Apply `RolesGuard` on `BusinessInsightsController` restricting access to `SystemRole.OWNER` and `SystemRole.ADMIN_MANAGER`.
  2. Implement strict workspace ownership validation: if `user.workspaceId !== workspaceId`, throw `ForbiddenException` with code `api.auth.access_denied`.

### 2.2. WebSocket Gateway Handshake Authentication & Room Access Control
* **Issue:** `BusinessInsightsGateway` (`/insights` namespace) allowed unauthenticated client connections and arbitrary `workspace.join` room subscriptions.
* **Fix:**
  1. Validate JWT token during `handleConnection(client: Socket)` from `client.handshake.auth.token` or `client.handshake.headers.authorization`.
  2. Attach authenticated `JwtPayload` to `client.data.user`.
  3. In `handleWorkspaceJoin`, reject join attempts if the requested `workspaceId` does not match `client.data.user.workspaceId`. Disconnect unauthorized sockets.

### 2.3. HTML & Markdown Sanitization
* **Issue:** Raw strings in email and markdown templates could contain unescaped HTML characters (`<`, `>`, `&`, `"`) or Markdown table delimiters (`|`, `\n`).
* **Fix:**
  1. Create a lightweight HTML escape utility `escapeHtml(str)` in `mail/templates/` and wrap all dynamic parameters (`title`, `serviceName`, `quotes`, `businessName`).
  2. Sanitize customer quotes in Markdown tables by replacing pipes `|` and newlines with spaces.

---

## 3. Concurrency, Idempotency & Pipeline Gaps

### 3.1. Recommendation Execution Idempotency
* **Issue:** Applying an already `IMPLEMENTED` recommendation created duplicate `KnowledgeEntry` records and enqueued duplicate embedding jobs.
* **Fix:**
  1. In `BusinessInsightsService.applyRecommendation`, verify `recommendation.status === RecommendationStatus.NEW`.
  2. If status is `IMPLEMENTED`, throw `BadRequestException({ code: 'insights.already_implemented', message: 'Recommendation has already been applied.' })`.
  3. If status is `DISMISSED`, throw `BadRequestException({ code: 'insights.already_dismissed', message: 'Recommendation has been dismissed.' })`.

### 3.2. Recommendation Dismissal Idempotency
* **Issue:** Dismissing an already dismissed card created duplicate `RecommendationDismissal` entries.
* **Fix:** Verify `recommendation.status === RecommendationStatus.NEW` before creating dismissal records.

### 3.3. Token-Sorted Canonical Key Normalization
* **Issue:** `"ламинирование ресниц"` and `"ресницы ламинирование"` produced distinct keys, fragmenting customer demand counts.
* **Fix:** In `SignalsAggregatorService.normalizeKey`, split tokens by whitespace, remove stop words, sort alphabetically, and join with `_` (e.g. `ламинирование_ресниц`).

### 3.4. Dynamic Working Hours Overlay in Demand Trends
* **Issue:** `isWorkingHour` in `getDemandTrends` hardcoded 09:00–18:00.
* **Fix:** Fetch `workspaceScheduleTemplates` for the workspace and dynamically evaluate whether the given hour falls within the business's open hours for each day.

### 3.5. URL & Bootstrap Sanitization
* **Fix:** Strip trailing slashes from `FRONTEND_URL` before generating dashboard deep links in email reports.

---

## 4. Frontend Integration Guide & API Contract

### 4.1. REST Endpoints Overview (No Breaking Route Path Changes)

The existing REST paths are **preserved** for compatibility, with enhanced role and tenant validation:

| Method | Endpoint | Allowed Roles | Description | Error Codes |
|---|---|---|---|---|
| `GET` | `/workspaces/:workspaceId/recommendations` | `OWNER`, `ADMIN_MANAGER` | List active recommendations with pagination & filters | `401`, `403` |
| `GET` | `/workspaces/:workspaceId/recommendations/summary` | `OWNER`, `ADMIN_MANAGER` | Summary counts for header badge indicators | `401`, `403` |
| `POST` | `/workspaces/:workspaceId/recommendations/:id/apply` | `OWNER`, `ADMIN_MANAGER` | Execute 1-click action | `400` (`insights.already_implemented`), `401`, `403`, `404` |
| `POST` | `/workspaces/:workspaceId/recommendations/:id/dismiss` | `OWNER`, `ADMIN_MANAGER` | Dismiss recommendation with feedback | `400` (`insights.already_dismissed`), `401`, `403`, `404` |
| `GET` | `/workspaces/:workspaceId/recommendations/demand-trends` | `OWNER`, `ADMIN_MANAGER` | Heatmap, unmet services, top objections | `401`, `403` |
| `GET` | `/workspaces/:workspaceId/reports` | `OWNER`, `ADMIN_MANAGER` | Paginated weekly reports history | `401`, `403` |
| `GET` | `/workspaces/:workspaceId/reports/:reportId` | `OWNER`, `ADMIN_MANAGER` | Full weekly report snapshot (Markdown) | `401`, `403`, `404` |
| `GET` | `/workspaces/:workspaceId/reports/:reportId/recommendations` | `OWNER`, `ADMIN_MANAGER` | Recommendations linked to a weekly report | `401`, `403`, `404` |

---

### 4.2. Multi-Workspace Discovery & Switching Endpoints

To support multi-location businesses, agency owners, or staff working across multiple branches:

#### 1. Discover Accessible Workspaces: `GET /auth/workspaces`
* **Auth:** `Bearer <token>`
* **Response `200 OK`:**
```json
[
  {
    "id": "ws-uuid-1",
    "name": "Beauty Salon Almaty Central",
    "businessName": "Beauty Salon Almaty Central",
    "role": "OWNER",
    "isOwner": true,
    "plan": "PRO",
    "isActive": true
  },
  {
    "id": "ws-uuid-2",
    "name": "Beauty Clinic Dostyk",
    "businessName": "Beauty Clinic Dostyk",
    "role": "ADMIN_MANAGER",
    "isOwner": false,
    "plan": "STANDARD",
    "isActive": true
  }
]
```

#### 2. Switch Active Workspace Context: `POST /auth/switch-workspace`
* **Auth:** `Bearer <token>`
* **Request Body:**
```json
{
  "workspaceId": "ws-uuid-2"
}
```
* **Response `200 OK`:**
```json
{
  "workspace": {
    "id": "ws-uuid-2",
    "name": "Beauty Clinic Dostyk"
  },
  "role": "ADMIN_MANAGER",
  "staffProfile": {
    "id": "staff-uuid-1",
    "name": "Aruzhan",
    "role": "Manager",
    "systemRole": "ADMIN_MANAGER"
  },
  "access_token": "eyJhbGciOi...",
  "expires_in": 900
}
```

---

### 4.3. WebSocket `/insights` Connection Contract

Frontend clients connecting to the `/insights` namespace must supply the JWT token in the handshake auth object:

```typescript
import { io } from 'socket.io-client';

const socket = io(`${API_BASE_URL}/insights`, {
  auth: {
    token: `Bearer ${userAccessToken}`,
  },
  transports: ['websocket'],
});

// Join workspace room upon connection
socket.emit('workspace.join', { workspaceId: currentUser.workspaceId });

// Listen for real-time recommendation updates
socket.on('insights.recommendation_applied', (data: { recommendationId: string; status: string }) => {
  console.log('Recommendation updated:', data);
});

// Listen for new weekly report generation
socket.on('insights.weekly_report_ready', (data: { reportId: string; weekLabel: string }) => {
  console.log('New report available:', data);
});
```

---

## 5. Implementation Master Checklist

- [x] **Security & Auth:**
  - [x] Add `RolesGuard` and `@Roles(SystemRole.OWNER, SystemRole.ADMIN_MANAGER)` to `BusinessInsightsController`.
  - [x] Enforce `user.workspaceId === workspaceId` check in all controller endpoints.
  - [x] Add JWT handshake verification and workspace isolation to `BusinessInsightsGateway`.
- [x] **Workspace Switching:**
  - [x] Implement `getUserWorkspaces(userId)` in `AuthService`.
  - [x] Expose `GET /auth/workspaces` in `AuthController`.
  - [x] Verify `POST /auth/switch-workspace` handles both owner and staff roles.
- [x] **Idempotency & Concurrency:**
  - [x] Add status checks (`NEW` only) in `applyRecommendation` and `dismissRecommendation`.
  - [x] Add i18n keys for `insights.already_implemented` and `insights.already_dismissed`.
- [x] **Sanitization:**
  - [x] Add `escapeHtml` utility and sanitize all interpolated fields in `weekly-report.template.ts`.
  - [x] Sanitize Markdown table characters in `weekly-report-markdown.template.ts`.
- [x] **Clustering & Analytical Precision:**
  - [x] Implement token-sorted canonical key normalization in `SignalsAggregatorService.normalizeKey`.
  - [x] Fetch workspace schedule templates in `getDemandTrends` for accurate heatmap overlay.
  - [x] Normalize `FRONTEND_URL` trailing slashes in `WeeklyReportGeneratorService`.
- [x] **Verification:**
  - [x] Run `npm run lint` (0 errors, 0 warnings).
  - [x] Run `npm run build` (Clean NestJS build).
