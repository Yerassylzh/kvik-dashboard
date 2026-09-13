# 011 — Staff Management, Invitation Flow, RBAC & Takeover Frontend Implementation Plan

> **Document Type:** Frontend System Architecture & Detailed Implementation Plan  
> **Backend Contract Reference:** [`dev_docs/backend/041_STAFF_MANAGEMENT_IMPL_PLAN.md`](file:///c:/Users/Honor/Desktop/tech/web/kvik/kvik/dev_docs/backend/041_STAFF_MANAGEMENT_IMPL_PLAN.md)  
> **Status:** Approved / Ready for Execution  
> **Target Audience:** Frontend Engineers, Fullstack Engineers, QA  

---

## 1. Executive Summary & Architectural Vision

Modern service and calendar-driven businesses rely on teams with diverse operational responsibilities. In our platform, staff members hold a **dual identity**:
1. **A Calendar / Operational Resource (Specialist/Master):** Configurable working schedule templates, slot duration rules, date overrides, specializations, and AI booking slot targets.
2. **An Authenticated Platform User (Employee):** Accesses the web/mobile dashboard, views personal/team schedules, receives real-time alerts, switches between assigned workspaces, and takes over live customer chats from the AI bot with full audit attribution.

This document outlines the end-to-end frontend architecture, page routing, Next.js API proxy handlers, state management, RBAC UI guards, and live chat takeover attribution required to realize the staff management subsystem.

---

## 2. Core User Flows & Lifecycle Architecture

```
+--------------------------------------------------------------------------------------------------+
| 1. INVITATION & CREATION (Admin Console: /settings/staff)                                       |
|    Owner/Manager invites staff member -> specifies systemRole, name, role title, email, phone    |
|    Backend issues single-use token -> Sends transactional invite email with /register-staff link |
+--------------------------------------------------------------------------------------------------+
                                                │
                                                ▼
+--------------------------------------------------------------------------------------------------+
| 2. REGISTRATION & ONBOARDING BYPASS (Public Screen: /register-staff?token=...)                   |
|    Next.js Proxy validates token -> UI displays workspace & inviter context                     |
|    Staff sets secure password -> Submits -> Auto-verifies email -> Receives JWT tokens           |
|    CRITICAL: Bypasses owner business-setup onboarding -> Lands directly in Dashboard            |
+--------------------------------------------------------------------------------------------------+
                                                │
                                                ▼
+--------------------------------------------------------------------------------------------------+
| 3. AUTHENTICATION & MULTI-WORKSPACE CONTEXT (/login, /auth/me)                                   |
|    Universal login recognizes SystemRole (OWNER | ADMIN_MANAGER | SPECIALIST)                     |
|    Header/Sidebar provides instant Workspace Switcher for multi-tenant staff                     |
+--------------------------------------------------------------------------------------------------+
                                                │
                                                ▼
+--------------------------------------------------------------------------------------------------+
| 4. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION GATES                                           |
|    OWNER: Full system access (Billing, Workspace, AI Prompting, Channels, Team)                 |
|    ADMIN_MANAGER: Operational admin (Staff, Channels, AI, Leads, Inbox, Bookings)              |
|    SPECIALIST: Scoped access (Overview, Personal Bookings/Schedule, Inbox, Account)             |
+--------------------------------------------------------------------------------------------------+
                                                │
                                                ▼
+--------------------------------------------------------------------------------------------------+
| 5. LIVE TAKEOVER & MESSAGE ATTRIBUTION (Unified Inbox)                                           |
|    Staff sends reply -> Role: MANAGER + senderStaffId recorded -> Halts AI bot                   |
|    Real-time WebSocket event broadcasts sender identity -> Bubble displays "Name (Role)"         |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. Page & Component Specifications

### 3.1 Staff Registration & Password Setup (`/register-staff`)

- **Route:** `app/(auth)/register-staff/page.tsx`
- **Layout:** Shares the existing glassmorphic authentication container layout (`app/(auth)/layout.tsx`).
- **Access:** Public (Token-guarded).

#### Functional Requirements:
1. **Token Validation on Mount:**
   - Extracts `token` from URL search parameters (`/register-staff?token=xyz123`).
   - If token is missing, displays an invalid invitation state with a CTA button to navigate to `/login`.
   - Calls `validateStaffInviteApi(token)` via the Next.js API proxy route `GET /api/auth/staff-invite?token=...`.
2. **State Handling:**
   - **Loading State:** Smooth skeleton loader matching the auth card dimensions.
   - **Valid State:** Renders invitation welcome card displaying:
     - Workspace name (e.g. *"Aura Beauty Salon"*).
     - Inviter name (e.g. *"Пригласил(а): Елена Владелец"*).
     - Pre-filled email (read-only) and suggested display name / role.
   - **Invalid / Expired State (`400` / `api.auth.invalid_or_expired_invite`):** Shows clear error explanation with a button to request a new invite.
   - **Already Accepted State (`409` / `api.auth.invite_already_accepted`):** Alerts that the account is already active, providing a direct link to `/login`.
3. **Form Submission:**
   - Fields: Password, Password Confirmation, optional Display Name override, optional Phone number.
   - Client-side validation: Password min 6 chars, passwords match.
   - Calls `registerStaffApi(payload)` via `POST /api/auth/register-staff`.
   - On success: Stores tokens, sets user profile in `useAuthStore`, clears any stale onboarding state, and redirects immediately to `/overview` (skipping `/onboarding`).

---

### 3.2 Staff Management Hub (`/settings/staff`)

- **Route:** `app/(dashboard)/settings/staff/page.tsx`
- **Access:** Authenticated (`OWNER` or `ADMIN_MANAGER`). Protected via `RoleGate`.

#### Functional Requirements:
1. **Staff Directory Table / List (`StaffList.tsx`):**
   - Displays all active/inactive staff members in the current workspace.
   - Columns/Card elements:
     - **Specialist Profile:** Avatar (or initials badge), Full Name, Role Title (e.g. "Top Stylist", "Doctor").
     - **System Role Badge:** 
       - `OWNER` (Emerald badge: "Владелец").
       - `ADMIN_MANAGER` (Blue badge: "Управляющий").
       - `SPECIALIST` (Violet/Slate badge: "Специалист").
     - **Contact Details:** Email, Phone number (formatted).
     - **Access Status Badge:**
       - `Активен (В системе)` (Green badge if user account linked).
       - `Приглашение отправлено (Pending)` (Amber badge if invitation token is active).
       - `Без доступа (Только ресурс)` (Muted badge if employee is only a calendar resource).
     - **Specializations:** Compact tags/chips with overflow counter (`+2`).
     - **Quick Actions Menu:**
       - "График и доступность" (Opens `AvailabilityEditor` drawer/modal).
       - "Редактировать профиль" (Opens `StaffEditModal`).
       - "Отправить приглашение повторно" (Only visible if `inviteStatus === 'PENDING'` or unlinked).
       - "Отозвать приглашение" (Only visible if `inviteStatus === 'PENDING'`).
       - "Деактивировать / Удалить" (Destructive action with confirmation modal).
2. **Add & Invite Staff Modal (`StaffInviteModal.tsx`):**
   - Form fields:
     - Full Name (`name`, required).
     - Role Title (`role`, e.g. "Старший косметолог").
     - System Role (`systemRole`: `SPECIALIST` | `ADMIN_MANAGER`, defaults to `SPECIALIST`).
     - Specializations (`specializations`: comma-separated or tag input).
     - Phone Number (`phone`).
     - Email Address (`email`).
     - Checkbox toggle: **"Отправить приглашение для доступа в панель управления"** (`sendInvite: boolean`, defaults to `true` when email is provided).
   - Submits to `POST /api/staff` and automatically refreshes SWR cache.
3. **Edit Staff Profile Modal (`StaffEditModal.tsx`):**
   - Allows updating name, role title, systemRole, phone, email, specializations, and `isActive` toggle.
   - Submits to `PATCH /api/staff/:id`.
4. **Resend / Revoke Invitation Logic:**
   - **Resend:** Calls `POST /api/staff/:id/invite` with optional email override. Shows toast notification on success.
   - **Revoke:** Calls `DELETE /api/staff/:id/invite` to invalidate the pending single-use token.

---

### 3.3 Multi-Workspace Switcher (`WorkspaceSwitcher.tsx`)

- **Placement:** Embedded within Dashboard Sidebar (`app/(dashboard)/layout.tsx`) and Mobile Navigation header.
- **Trigger:** Rendered whenever `user.availableWorkspaces` has 2 or more workspaces, or styled as a clean tenant badge when 1 workspace is active.

#### Functional Requirements:
1. **Dropdown Interface:**
   - Displays active workspace name and current user's role in that workspace.
   - Lists other available workspaces with their respective user role badges.
2. **Workspace Switching Action:**
   - User selects target workspace -> triggers `switchWorkspace(workspaceId)`.
   - Calls `POST /api/auth/switch-workspace`.
   - The backend rotates access/refresh tokens scoped to the new workspace tenant ID.
   - Updates `useAuthStore` with the new workspace profile and re-syncs SWR caches across all active dashboard views.

---

### 3.4 Role-Based Access Control (RBAC) & Navigation Filtering

To ensure security and a focused user experience, UI components and routes dynamically adapt according to `user.role` (`SystemRole`).

#### RBAC Permissions Matrix:

| Route / Capability | `OWNER` | `ADMIN_MANAGER` | `SPECIALIST` |
|---|:---:|:---:|:---:|
| `/overview` (Dashboard Overview) | Full Stats | Full Stats | Personal / Assigned Stats |
| `/inbox` (Unified Messaging) | Full Access | Full Access | Assigned / Team Chats |
| `/leads` (CRM Pipeline) | Full Access | Full Access | Read / Edit Assigned |
| `/bookings` (Calendar & Appointments) | All Masters | All Masters | Personal Calendar |
| `/billing` (Subscription & Invoices) | Full Access | Restricted (Hidden) | Restricted (Hidden) |
| `/settings/workspace` | Full Access | Restricted (Hidden) | Restricted (Hidden) |
| `/settings/staff` (Staff & Schedules) | Full Access | Full Access | Restricted (Hidden) |
| `/settings/channels` (Integrations) | Full Access | Full Access | Restricted (Hidden) |
| `/settings/ai-agent` (AI Prompts) | Full Access | Full Access | Restricted (Hidden) |
| `/settings/business-context` (KB) | Full Access | Full Access | Restricted (Hidden) |
| `/settings/account` (Profile & Pass) | Full Access | Full Access | Full Access |

#### Frontend Guard Architecture:
1. **`RoleGate` Component (`components/auth/RoleGate.tsx`):**
   - Props: `allowedRoles: SystemRole[]`, `fallback?: React.ReactNode`, `children: React.ReactNode`.
   - Inspects `user.role` or `user.staffProfile.systemRole`. If forbidden, renders fallback or redirects to `/overview`.
2. **Dynamic Sidebar & SettingsNav Filtering:**
   - Filters navigation items in `app/(dashboard)/layout.tsx` and `components/dashboard/settings/SettingsNav.tsx` before rendering.

---

### 3.5 Live Takeover & Staff Message Attribution in Inbox

- **Components:** `components/dashboard/inbox/MessageBubble.tsx`, `components/dashboard/inbox/ManagerComposer.tsx`, `components/dashboard/inbox/ConversationThread.tsx`.

#### Functional Requirements:
1. **Message Sender Attribution in Bubbles (`MessageBubble.tsx`):**
   - When `message.role === 'MANAGER'`, inspects `message.senderStaffId` and sender metadata.
   - Displays distinctive staff badge: e.g. **"Анна Смирнова (Топ-стилист)"** or **"Елена (Менеджер)"** alongside timestamp and status checkmarks.
   - Highlights manager takeover visually with amber/indigo accent borders to distinguish human replies from AI automated replies (`role === 'BOT'`).
2. **Active Sender Header in Composer (`ManagerComposer.tsx`):**
   - Displays banner: *"Вы отвечаете как: {staffName || userName} ({roleTitle || 'Менеджер'})"*.
   - Sending a message automatically halts the AI bot and marks conversation as `MANAGER_INTERCEPTED`.
3. **Real-time WebSocket Synchronization (`useInboxRealtime.ts`):**
   - Listens to `conversations:message` events with payload `{ conversationId, message: { senderStaffId, senderName, role, content, ... } }`.
   - Appends message to current active thread without requiring page reload.

---

## 4. API Proxy Layer & Client Endpoints

All client-side HTTP calls to authentication and staff endpoints are routed through Next.js API route proxies to ensure secure HttpOnly cookie forwarding (`refresh_token`) and CORS encapsulation.

### 4.1 Next.js API Proxy Routes

| Route | Method | Backend Target | Purpose | Cookie Handling |
|---|---|---|---|---|
| `app/api/auth/staff-invite/route.ts` | `GET` | `${BACKEND_URL}/auth/staff-invite?token=...` | Validates invite token public query | None |
| `app/api/auth/register-staff/route.ts` | `POST` | `${BACKEND_URL}/auth/register-staff` | Accepts invite, sets password, logs in | Forwards `set-cookie` (`refresh_token`) |
| `app/api/auth/switch-workspace/route.ts` | `POST` | `${BACKEND_URL}/auth/switch-workspace` | Switches active workspace tenant | Forwards rotated `set-cookie` |
| `app/api/[...proxy]/route.ts` | `ALL` | `${BACKEND_URL}/staff/*`, `/conversations/*` | General backend proxy | Passes Bearer token |

---

### 4.2 TypeScript Types & DTO Definitions

#### `types/auth.ts`:
```typescript
export type SystemRole = 'OWNER' | 'ADMIN_MANAGER' | 'SPECIALIST';

export interface StaffProfileSummary {
  id: string;
  name: string;
  role?: string | null;
  systemRole: SystemRole;
  specializations?: string[];
}

export interface AvailableWorkspace {
  workspaceId: string;
  workspaceName: string;
  role: SystemRole;
}

export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  role: SystemRole;
  staffProfile?: StaffProfileSummary | null;
  workspace?: Workspace | null;
  availableWorkspaces?: AvailableWorkspace[];
  createdAt: string;
  updatedAt: string;
}

export interface ValidateStaffInviteResponse {
  valid: boolean;
  email: string;
  staffName: string;
  roleTitle?: string | null;
  systemRole: SystemRole;
  workspaceName: string;
  inviterName: string;
}

export interface RegisterStaffDto {
  token: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface SwitchWorkspaceDto {
  workspaceId: string;
}
```

#### `lib/api/staff.ts`:
```typescript
export type InviteStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'REVOKED';

export interface StaffDto {
  id: string;
  workspaceId: string;
  userId?: string | null;
  name: string;
  role?: string | null;
  systemRole: SystemRole;
  specializations?: string[] | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  hasDashboardAccess: boolean;
  inviteStatus: InviteStatus;
  createdAt: string;
}

export interface CreateStaffPayload {
  name: string;
  role?: string;
  systemRole?: SystemRole;
  specializations?: string[];
  phone?: string;
  email?: string;
  sendInvite?: boolean;
}

export interface UpdateStaffPayload {
  name?: string;
  role?: string;
  systemRole?: SystemRole;
  specializations?: string[];
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface InviteStaffPayload {
  email?: string;
  systemRole?: SystemRole;
}
```

---

## 5. Localization & Translation Strategy

In strict adherence to project standards, the product is **Russian-only**. All UI strings must be resolved using `next-intl` (`useTranslations`) and registered in `locales/translation_keys_new.json` before running `scripts/apply-translation-keys.mjs`.

### Translation Namespace Mapping:

| Dotted Key Prefix | Locale File | Context |
|---|---|---|
| `auth.staff_invite.*` | `locales/ru/auth.json` | Staff registration screen, validations, expired states |
| `dashboard.staff.*` | `locales/ru/dashboard.json` | Staff directory, badges, invite modal, actions |
| `dashboard.workspace_switcher.*` | `locales/ru/dashboard.json` | Multi-workspace dropdown, tenant switching |
| `dashboard.rbac.*` | `locales/ru/dashboard.json` | Role labels (`Владелец`, `Управляющий`, `Специалист`), permission notices |
| `inbox.attribution.*` | `locales/ru/dashboard.json` | Message bubble manager attribution, sender badges |

---

## 6. Implementation Checklist

### Phase 1: Types & API Proxy Layer
- [ ] **1.1 Types Extension:** Update `types/auth.ts` with `SystemRole`, `StaffProfileSummary`, `AvailableWorkspace`, `ValidateStaffInviteResponse`, `RegisterStaffDto`, `SwitchWorkspaceDto`.
- [ ] **1.2 Staff API Types:** Update `lib/api/staff.ts` with `SystemRole`, `InviteStatus`, `CreateStaffPayload.sendInvite`, `InviteStaffPayload`, and new endpoints (`inviteStaff`, `revokeInvite`).
- [ ] **1.3 Conversation API Types:** Update `lib/api/conversations.ts` (`MessageDto.senderStaffId`, `MessageDto.senderName`).
- [ ] **1.4 Next.js Proxy Routes:**
  - [ ] Create `app/api/auth/staff-invite/route.ts` (GET proxy).
  - [ ] Create `app/api/auth/register-staff/route.ts` (POST proxy with `Set-Cookie` support).
  - [ ] Create `app/api/auth/switch-workspace/route.ts` (POST proxy with `Set-Cookie` support).
- [ ] **1.5 API Client Methods:** Add `validateStaffInviteApi`, `registerStaffApi`, `switchWorkspaceApi` to `lib/api/auth.ts`.

---

### Phase 2: State Management & Auth Hook Updates
- [ ] **2.1 Auth Store Updates:** Update `store/auth.store.ts` to hold `activeWorkspaceId`, `systemRole`, and `availableWorkspaces`.
- [ ] **2.2 Auth Hook Onboarding Bypass:** In `hooks/useAuth.ts`, update `login`, `register`, and `checkAuth` logic so `ADMIN_MANAGER` and `SPECIALIST` roles bypass `/onboarding` redirection if already bound to an active workspace.
- [ ] **2.3 Switch Workspace Action:** Add `switchWorkspace(workspaceId)` method to `hooks/useAuth.ts`.
- [ ] **2.4 RBAC Hook:** Create `hooks/useRBAC.ts` providing helpers: `isOwner`, `isAdminOrOwner`, `isSpecialist`, `canAccessSettings()`, `canManageStaff()`.

---

### Phase 3: Staff Public Registration Page
- [ ] **3.1 Page Route:** Create `app/(auth)/register-staff/page.tsx`.
- [ ] **3.2 Registration Form Component:** Create `components/auth/RegisterStaffForm.tsx` with:
  - Token verification skeleton and error views (expired, already accepted, invalid).
  - Workspace and inviter info card.
  - Password and confirm password inputs with visibility toggle.
  - Submission handler routing directly to `/overview` on success.

---

### Phase 4: Staff Management Console in Settings
- [ ] **4.1 Staff List Enhancement:** Refactor `components/dashboard/settings/staff/StaffList.tsx` into modular subcomponents (<400 LOC each):
  - Add search and role filter pills (`Все`, `Специалисты`, `Администраторы`).
  - Render system role badges and access status indicators (`Активен`, `Ожидает принятия`, `Только ресурс`).
  - Render actions menu: Edit Profile, Schedule & Availability, Resend Invite, Revoke Invite, Deactivate.
- [ ] **4.2 Staff Invite / Creation Modal:** Create `components/dashboard/settings/staff/StaffInviteModal.tsx` supporting role selection and auto-invite checkbox.
- [ ] **4.3 Staff Edit Modal:** Create `components/dashboard/settings/staff/StaffEditModal.tsx` for profile adjustments and active state toggling.
- [ ] **4.4 Confirmation Dialogs:** Implement clean confirmation prompts for invitation revocation and staff deactivation.

---

### Phase 5: Navigation, Workspace Switcher & RBAC Guards
- [ ] **5.1 Workspace Switcher Component:** Create `components/dashboard/shared/WorkspaceSwitcher.tsx` and integrate into `app/(dashboard)/layout.tsx`.
- [ ] **5.2 RoleGate Component:** Create `components/auth/RoleGate.tsx`.
- [ ] **5.3 Navigation Guarding:**
  - Update `app/(dashboard)/layout.tsx` to filter sidebar items based on `SystemRole`.
  - Update `components/dashboard/settings/SettingsNav.tsx` to hide restricted settings tabs for `ADMIN_MANAGER` and `SPECIALIST`.
  - Add page-level redirect guards on restricted settings routes (`/settings/workspace`, `/settings/billing`, etc.).

---

### Phase 6: Live Takeover & Message Attribution in Inbox
- [ ] **6.1 Message Bubble Attribution:** Update `components/dashboard/inbox/MessageBubble.tsx` to render staff sender badge and name when `role === 'MANAGER'`.
- [ ] **6.2 Composer Active Staff Identity:** Update `components/dashboard/inbox/ManagerComposer.tsx` to display active responder identity.
- [ ] **6.3 Real-time Socket Event Handling:** Verify and update `hooks/useInboxRealtime.ts` to preserve sender staff metadata when messages arrive via WebSockets.

---

### Phase 7: Translations & Verification
- [ ] **7.1 Translation Keys:** Populate all Russian translation strings in `locales/translation_keys_new.json`.
- [ ] **7.2 Translation Merge:** Execute `node scripts/apply-translation-keys.mjs` and verify clean insertion into `locales/ru/*.json`.
- [ ] **7.3 TypeScript & Build Check:** Execute `npx tsc --noEmit` and `npm run build` to verify clean compilation with zero lint/type errors.

---

## 7. File Action Map

| Target File | Action | Purpose |
|---|---|---|
| `types/auth.ts` | **MODIFY** | Add `SystemRole`, `StaffProfileSummary`, `AvailableWorkspace`, invite DTOs |
| `types/staff.ts` *(or `lib/api/staff.ts`)* | **MODIFY** | Add `InviteStatus`, update `StaffDto`, `CreateStaffPayload`, `InviteStaffPayload` |
| `lib/api/auth.ts` | **MODIFY** | Add `validateStaffInviteApi`, `registerStaffApi`, `switchWorkspaceApi` |
| `lib/api/staff.ts` | **MODIFY** | Add `inviteStaffApi`, `revokeInviteApi` |
| `lib/api/conversations.ts` | **MODIFY** | Add `senderStaffId`, `senderName` to `MessageDto` |
| `app/api/auth/staff-invite/route.ts` | **NEW** | Next.js API route proxy for token validation |
| `app/api/auth/register-staff/route.ts` | **NEW** | Next.js API route proxy for staff registration & cookie forwarding |
| `app/api/auth/switch-workspace/route.ts` | **NEW** | Next.js API route proxy for workspace switching & cookie forwarding |
| `store/auth.store.ts` | **MODIFY** | Support multi-workspace and role state |
| `hooks/useAuth.ts` | **MODIFY** | Support workspace switching and staff onboarding bypass |
| `hooks/useRBAC.ts` | **NEW** | Centralized role-based access control helpers |
| `hooks/useStaff.ts` | **MODIFY** | Add invite, resend, revoke hooks and SWR cache mutations |
| `components/auth/RoleGate.tsx` | **NEW** | Reusable declarative RBAC wrapper component |
| `app/(auth)/register-staff/page.tsx` | **NEW** | Public page for staff invitation acceptance and password creation |
| `components/auth/RegisterStaffForm.tsx` | **NEW** | Interactive registration form with token status card |
| `components/dashboard/shared/WorkspaceSwitcher.tsx` | **NEW** | Tenant switcher dropdown for multi-workspace users |
| `components/dashboard/settings/staff/StaffList.tsx` | **MODIFY** | Refactor table to display role badges, invite status, and actions |
| `components/dashboard/settings/staff/StaffInviteModal.tsx` | **NEW** | Modal for adding staff with optional dashboard invite |
| `components/dashboard/settings/staff/StaffEditModal.tsx` | **NEW** | Modal for modifying staff profile and roles |
| `components/dashboard/settings/SettingsNav.tsx` | **MODIFY** | Filter settings tabs according to user's `SystemRole` |
| `app/(dashboard)/layout.tsx` | **MODIFY** | Integrate `WorkspaceSwitcher` and filter navigation items for staff |
| `components/dashboard/inbox/MessageBubble.tsx` | **MODIFY** | Display staff sender name and role badge on manager takeover |
| `components/dashboard/inbox/ManagerComposer.tsx` | **MODIFY** | Display active staff responder badge |
| `locales/translation_keys_new.json` | **MODIFY** | Add Russian translation strings for all new staff & auth flows |
