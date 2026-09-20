# 020 — Multi-Workspace Context Switching & Business Insights Hardening: Frontend Integration Plan

> **Document Type:** Frontend System Architecture, Vulnerability Integration & Implementation Plan  
> **Backend Specification Reference:** [`dev_docs/backend/049_PROPOSED_SYSTEM_VULNERABILITIES_FIX_PLAN.md`](file:///c:/Users/Honor/Desktop/tech/web/kvik/kvik/dev_docs/backend/049_PROPOSED_SYSTEM_VULNERABILITIES_FIX_PLAN.md)  
> **Frontend Blueprint Reference:** [`dev_docs/019_BUSINESS_INSIGHTS_PLAN.md`](file:///c:/Users/Honor/Desktop/tech/web/kvik/kvik/dev_docs/019_BUSINESS_INSIGHTS_PLAN.md)  
> **Status:** Specification & Execution Blueprint  
> **Target Audience:** Frontend Engineers, Fullstack Engineers, QA  

---

## 1. Executive Summary & Impact Analysis

Backend document [`049_PROPOSED_SYSTEM_VULNERABILITIES_FIX_PLAN.md`](file:///c:/Users/Honor/Desktop/tech/web/kvik/kvik/dev_docs/backend/049_PROPOSED_SYSTEM_VULNERABILITIES_FIX_PLAN.md) hardened the **Autonomous Business Intelligence & Recommendations System** and established the **Multi-Workspace Context Architecture**. 

An audit of the frontend codebase against Doc 049 revealed **5 major integration gaps and vulnerability-mitigation features** that the frontend must implement to stay synchronized with the backend contracts:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND INTEGRATION GAPS & REQUIRED WORK                                   │
├───────────────────────────────┬──────────────────────────────────┬─────────────────────────────────────────┤
│ Backend Area (Doc 049)        │ Current Frontend State           │ Required Frontend Integration           │
├───────────────────────────────┼──────────────────────────────────┼─────────────────────────────────────────┤
│ 1. Workspace Discovery        │ Missing BFF proxy;               │ Create `app/api/auth/workspaces/` proxy;│
│    `GET /auth/workspaces`     │ `WorkspaceSwitcher` reads stale  │ Add `getWorkspacesApi()`; query dynamic │
│                               │ `user.availableWorkspaces`.      │ workspaces list via SWR.                │
├───────────────────────────────┼──────────────────────────────────┼─────────────────────────────────────────┤
│ 2. Workspace Context Switch   │ `useAuth.switchWorkspace` passes │ Update `useAuth` & `useAuthStore` to    │
│    `POST /auth/switch-work-   │ `res.user` (undefined in new     │ consume `{ workspace, role, staff,      │
│    space`                     │ backend DTO), clearing state.    │ access_token }` & re-seed `kvik_role`.  │
├───────────────────────────────┼──────────────────────────────────┼─────────────────────────────────────────┤
│ 3. WebSocket /insights Auth & │ Handshake passes raw token;      │ Pass `Bearer ${token}` in handshake;    │
│    Real-time Applied Events   │ Misses `insights.recommendation_ │ Listen to `insights.recommendation_     │
│                               │ applied` broadcast.              │ applied` to re-sync other active tabs.  │
├───────────────────────────────┼──────────────────────────────────┼─────────────────────────────────────────┤
│ 4. Idempotency 400 Errors     │ UI displays error toast, but     │ In catch blocks, re-sync SWR cache so   │
│    `already_implemented` &    │ does NOT revalidate cache. Card  │ card flips to `IMPLEMENTED`/`DISMISSED` │
│    `already_dismissed`        │ stays looking `NEW`.             │ instead of remaining clickable.         │
├───────────────────────────────┼──────────────────────────────────┼─────────────────────────────────────────┤
│ 5. Markdown Table Formatting  │ Modal renders raw text via       │ Render formatted `MarkdownTable` and    │
│    in Weekly Sunday Reports   │ `whitespace-pre-wrap` div.       │ typography from sanitized backend text. │
└───────────────────────────────┴──────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 2. Feature 1: Multi-Workspace Discovery & Dynamic Context Switching

### 2.1 Backend Contract Review
Doc 049 exposes two critical auth endpoints:

1. **`GET /auth/workspaces`**:
   - **Auth:** `Bearer <token>`
   - **Response DTO (`AccessibleWorkspaceDto[]`):**
     ```typescript
     export interface AccessibleWorkspaceDto {
       id: string;
       name: string;
       businessName: string;
       role: SystemRole; // 'OWNER' | 'ADMIN_MANAGER' | 'SPECIALIST'
       isOwner: boolean;
       plan: 'STARTER' | 'PRO' | 'VIP' | string;
       isActive: boolean;
     }
     ```
2. **`POST /auth/switch-workspace`**:
   - **Auth:** `Bearer <token>`
   - **Request Payload:** `{ workspaceId: string }`
   - **Response DTO (`SwitchWorkspaceResponseDto`):**
     ```typescript
     export interface SwitchWorkspaceResponseDto {
       workspace: {
         id: string;
         name: string;
       };
       role: SystemRole;
       staffProfile?: {
         id: string;
         name: string;
         role?: string | null;
         systemRole: SystemRole;
       } | null;
       access_token: string;
       expires_in: number;
     }
     ```

### 2.2 Next.js BFF Proxy Integration (`app/api/auth/workspaces/route.ts`)
The browser must never communicate with `http://localhost:4000` directly. A dedicated Next.js Route Handler must be added to proxy workspace discovery:

```typescript
// app/api/auth/workspaces/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };

    const authHeader = request.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;

    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) headers['cookie'] = cookieHeader;

    const backendRes = await fetch(`${BACKEND_URL}/auth/workspaces`, {
      method: 'GET',
      headers,
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Workspaces proxy error:', error);
    return NextResponse.json(
      { message: 'Unable to connect to authentication server' },
      { status: 502 }
    );
  }
}
```

### 2.3 API Client & Type Definitions
1. **Types Update (`types/auth.ts`):**
   - Add `AccessibleWorkspaceDto`.
   - Update `SwitchWorkspaceResponseDto` to reflect `{ workspace, role, staffProfile, access_token, expires_in }`.
2. **API Client (`lib/api/auth.ts`):**
   ```typescript
   export async function getAccessibleWorkspacesApi(): Promise<AccessibleWorkspaceDto[]> {
     const { data } = await apiClient.get<AccessibleWorkspaceDto[]>('/auth/workspaces');
     return data;
   }

   export async function switchWorkspaceApi(
     dto: SwitchWorkspaceDto
   ): Promise<SwitchWorkspaceResponseDto> {
     const { data } = await apiClient.post<SwitchWorkspaceResponseDto>(
       '/auth/switch-workspace',
       dto
     );
     return data;
   }
   ```

### 2.4 State Management & Context Switch Hook
In `hooks/useAuth.ts`, the existing `switchWorkspace` implementation incorrectly assumes `res.user`:
```typescript
// Existing bug in hooks/useAuth.ts:
const res = await switchWorkspaceApi(dto);
setAuth(res.user, res.access_token); // res.user is undefined! Wipes user in store!
```

**Required Update:**
1. Update `store/auth.store.ts` to provide `updateWorkspaceContext(workspace, role, staffProfile, accessToken)`.
2. This method preserves existing user metadata (`id`, `email`, `createdAt`), assigns the new `workspace` object and `role`, updates the `kvik_role` cookie for Next.js middleware, sets the new `accessToken`, and updates `localStorage`.
3. In `useAuth.ts`:
   ```typescript
   const switchWorkspace = useCallback(
     async (dto: SwitchWorkspaceDto) => {
       setLoading(true);
       try {
         const res = await switchWorkspaceApi(dto);
         useAuthStore.getState().updateWorkspaceContext({
           workspace: res.workspace,
           role: res.role,
           staffProfile: res.staffProfile,
           accessToken: res.access_token,
         });

         if (typeof window !== 'undefined') {
           // Reload window to purge all in-memory SWR caches (insights, inbox, calendar)
           window.location.reload();
         }
         return res;
       } catch (error) {
         throw error;
       } finally {
         setLoading(false);
       }
     },
     [setLoading]
   );
   ```

### 2.5 Dynamic Workspace Switcher Component (`WorkspaceSwitcher.tsx`)
Update `components/dashboard/shared/WorkspaceSwitcher.tsx`:
- Use `useSWR<AccessibleWorkspaceDto[]>('/auth/workspaces', getAccessibleWorkspacesApi)` to dynamically load available locations/workspaces.
- Match `ws.id === activeWorkspaceId` (instead of legacy `ws.workspaceId`).
- Display active badge if `workspaces.length <= 1`, and interactive dropdown menu when `workspaces.length > 1`.
- Display role badges (`OWNER`, `ADMIN_MANAGER`, `SPECIALIST`) for each workspace.

---

## 3. Feature 2: Real-time WebSocket Security & Event Synchronization

### 3.1 Handshake JWT Authentication
Doc 049 (Section 2.2) enforces that connections to `/insights` namespace validate the JWT token from `client.handshake.auth.token` or authorization headers.

In `hooks/useBusinessInsights.ts`:
```typescript
// Update useInsightsRealtime:
const socket = io(`${socketUrl}/insights`, {
  auth: { 
    token: accessToken?.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}` 
  },
  transports: ['websocket'],
  reconnectionAttempts: 5,
});
```

### 3.2 Listening to `insights.recommendation_applied`
Currently, `useInsightsRealtime` only listens to `insights.recommendation_created` and `insights.weekly_report_ready`. When an owner or manager in another browser tab applies a 1-click recommendation, the backend emits:
```json
// Event: 'insights.recommendation_applied'
{
  "recommendationId": "rec-uuid-123",
  "status": "IMPLEMENTED"
}
```

**Required Integration:**
Register listener for `insights.recommendation_applied`:
```typescript
socket.on('insights.recommendation_applied', (data: { recommendationId: string; status: string }) => {
  // 1. Invalidate recommendation list SWR caches
  mutate((key) => Array.isArray(key) && key[0] === 'insights/recommendations');
  // 2. Invalidate header KPI summary
  mutate(['insights/summary', workspaceId]);
});
```

### 3.3 Strict Room Isolation
Doc 049 automatically terminates sockets if `workspace.join` is requested for a mismatched `workspaceId`. Ensure `socket.emit('workspace.join', { workspaceId })` only fires after `workspaceId` is confirmed and verified against `user.workspace.id`.

---

## 4. Feature 3: Recommendation Idempotency & Error Resilience

### 4.1 Error Codes Specification
Backend Doc 049 introduces idempotency guards preventing duplicate knowledge base insertions and queue jobs:
- `POST /workspaces/:workspaceId/recommendations/:id/apply` throws `400` with code `insights.already_implemented` if already executed.
- `POST /workspaces/:workspaceId/recommendations/:id/dismiss` throws `400` with code `insights.already_dismissed` if already dismissed.

### 4.2 SWR Cache Recovery on Idempotency Conflict
In `hooks/useBusinessInsights.ts`, `applyRecommendation` and `dismissRecommendation` currently catch errors, trigger a toast, and abort without updating the cache. If an action fails because it was already applied in another session, the card remains displayed with `status: 'NEW'` and an active "⚡ Применить в 1 клик" button.

**Required Integration:**
```typescript
try {
  const res = await insightsApi.applyRecommendation(workspaceId, id, payload);
  toast.success(successMsg || t('toasts.apply_success'));
  await Promise.all([
    mutate(),
    globalMutate(['insights/summary', workspaceId]),
  ]);
  return res;
} catch (err: unknown) {
  const error = err as { response?: { data?: { code?: string; message?: string } }; message?: string };
  const errorCode = error?.response?.data?.code;
  const msg = error?.response?.data?.message || error?.message || t('toasts.apply_error');
  toast.error(msg);

  // If server reports already implemented/dismissed, synchronize local state immediately:
  if (errorCode === 'insights.already_implemented' || errorCode === 'insights.already_dismissed') {
    await Promise.all([
      mutate(),
      globalMutate(['insights/summary', workspaceId]),
    ]);
  }
  throw err;
} finally {
  setIsMutating(false);
}
```

### 4.3 UI Optimistic Locking & Double-Click Prevention
1. **Modal Form (`ApplyRecommendationModal.tsx` & `DismissRecommendationModal.tsx`):**
   - Wrap submission in `try / catch`.
   - Disable Cancel & Submit buttons while `isApplying` / `isDismissing` is `true`.
   - Render spinning indicator on submit button.
2. **Recommendation Card Toolbar (`RecommendationCard.tsx`):**
   - Disable `[ ⚡ Применить в 1 клик ]` and `[ Отклонить ]` buttons when the card is in a pending mutating state to eliminate duplicate triggers.

---

## 5. Feature 4: Dynamic Working Hours Overlay in Demand Trends

### 5.1 Backend Logic Hardening
Backend Doc 049 updated `getDemandTrends` to evaluate `isWorkingHour` against real `workspaceScheduleTemplates` instead of the legacy hardcoded 09:00–18:00 window.

### 5.2 Frontend UI Integration
`components/dashboard/insights/charts/HourlyDistributionChart.tsx`:
- The backend already delivers `isWorkingHour: boolean` in `HourlyDistributionItemDto`.
- Verify the chart renders custom schedules accurately (e.g. salons operating 10:00–21:00 or with closed days).
- Ensure the tooltip states the schedule context clearly:
  - Open hour: `"14:00 — 12 запросов (Рабочее время)"` (Primary violet bar)
  - Closed hour: `"21:00 — 8 запросов (Вне рабочих часов)"` (Amber bar)

---

## 6. Feature 5: Structured Markdown & Table Rendering in Weekly Reports

### 6.1 Sanitized Markdown Content
Backend Doc 049 escaped Markdown table delimiter characters (`|`) and newlines in verbatim quotes, ensuring valid Markdown table syntax in `SingleWeeklyReportResponseDto.markdownContent`.

### 6.2 Visual Presentation Upgrade (`WeeklyReportDetailModal.tsx`)
Currently, `WeeklyReportDetailModal.tsx` renders report content via raw text:
```tsx
// Current implementation:
<div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
  {report.markdownContent}
</div>
```

**Required Integration:**
- Replace raw `whitespace-pre-wrap` with structured rendering using `MarkdownTable` (from `components/ui/MarkdownTable.tsx`) or `StructuredMarkdownView` (from `components/onboarding/knowledge/StructuredMarkdownView.tsx`).
- Tables generated in Sunday reports (e.g., *Service Inquiries vs Lost Leads* and *Top Objections Breakdown*) will render with sleek enterprise borders, styled table headers, and tabular figures.

---

## 7. Feature 6: Localization & Error Code Prefix Normalization

### 7.1 Key Normalization in `lib/i18n/config.ts`
Backend Doc 049 throws `ForbiddenException` with code `api.auth.access_denied` or `auth.access_denied`.
In `lib/i18n/config.ts`, `translateKey` navigates `ruApi` using `code.split('.')`. Because `ru/api.json` does not have a root `"api"` property (keys are stored under `"auth"`, `"insights"`, `"workspace"`), any error code starting with `api.` fails to resolve.

**Required Integration:**
```typescript
// lib/i18n/config.ts
export function translateKey(
  code: string,
  params?: Record<string, string | number>,
  locale: SupportedLocale = activeLocale
): string | null {
  if (!code || code === 'raw') return null;

  const dict = API_DICTIONARIES[locale] || API_DICTIONARIES[DEFAULT_LOCALE];
  // Strip optional leading 'api.' prefix so both 'api.auth.access_denied' and 'auth.access_denied' match
  const cleanCode = code.startsWith('api.') ? code.slice(4) : code;
  const keys = cleanCode.split('.');

  let current: unknown = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[k];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current !== 'string') {
    return null;
  }

  let result = current;
  if (params && typeof params === 'object') {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replaceAll(`{${paramKey}}`, String(paramValue));
    }
  }

  return result;
}
```

---

## 8. Master Implementation Checklist

### Phase 1: API Proxy & Type Definitions
- [x] **1.1 Next.js BFF Route:** Create `app/api/auth/workspaces/route.ts` proxying `GET /auth/workspaces` with cookies and `Authorization` headers.
- [x] **1.2 Auth Types:** Define `AccessibleWorkspaceDto` in `types/auth.ts` matching backend contract (`id`, `name`, `businessName`, `role`, `isOwner`, `plan`, `isActive`).
- [x] **1.3 Switch Workspace Types:** Update `SwitchWorkspaceResponseDto` to reflect `{ workspace, role, staffProfile, access_token, expires_in }`.
- [x] **1.4 API Client Methods:** Add `getAccessibleWorkspacesApi()` to `lib/api/auth.ts` and update `switchWorkspaceApi()`.

### Phase 2: State Management & Workspace Switcher Component
- [x] **2.1 Auth Store Context:** Add `updateWorkspaceContext` in `store/auth.store.ts` to update `user.workspace`, `user.role`, `accessToken`, and `kvik_role` cookie without wiping user details.
- [x] **2.2 Auth Hook Update:** Update `switchWorkspace` in `hooks/useAuth.ts` to call `updateWorkspaceContext` and cleanly reload the page.
- [x] **2.3 Dynamic WorkspaceSwitcher:** Update `components/dashboard/shared/WorkspaceSwitcher.tsx` to fetch accessible workspaces via SWR (`/auth/workspaces`), handle loading state, display roles, and trigger context switch.

### Phase 3: WebSocket Hardening & Real-time Synchronization
- [x] **3.1 Handshake Bearer Token:** Update `useInsightsRealtime` in `hooks/useBusinessInsights.ts` to supply `Bearer ${accessToken}` in socket handshake auth.
- [x] **3.2 Recommendation Applied Listener:** Add `socket.on('insights.recommendation_applied', ...)` in `useInsightsRealtime` to invalidate recommendations list and KPI summary upon external updates.
- [x] **3.3 Clean Reconnect:** Ensure socket disconnects and leaves room when `workspaceId` changes.

### Phase 4: Idempotency, Markdown & UI Resilience
- [x] **4.1 Error Recovery in Hook:** In `useBusinessRecommendations` (`applyRecommendation`, `dismissRecommendation`), revalidate recommendations and summary on `insights.already_implemented` or `insights.already_dismissed` errors.
- [x] **4.2 Modal In-Flight State:** Disable action buttons and show loading spinners in `ApplyRecommendationModal.tsx` and `DismissRecommendationModal.tsx`.
- [x] **4.3 Structured Markdown in Reports:** Enhance `WeeklyReportDetailModal.tsx` to render sanitized Markdown tables using `MarkdownTable` instead of raw `whitespace-pre-wrap`.
- [x] **4.4 i18n Prefix Normalization:** Update `translateKey` in `lib/i18n/config.ts` to strip leading `api.` prefixes for robust backend error translations.

### Phase 5: Verification & Quality Assurance
- [x] **5.1 Lint Check:** Run `npm run lint` and verify modified files have 0 errors.
- [x] **5.2 TypeScript Build:** Run `npx tsc --noEmit` with 0 errors (clean build).
- [x] **5.3 End-to-End Walkthrough:**
  - Dynamic workspace discovery via SWR integration.
  - Safe workspace context switching preserving user session.
  - WebSocket Bearer handshake and `insights.recommendation_applied` synchronization.
  - Idempotency error recovery updating recommendation card state.
  - Structured Markdown rendering in weekly reports.
