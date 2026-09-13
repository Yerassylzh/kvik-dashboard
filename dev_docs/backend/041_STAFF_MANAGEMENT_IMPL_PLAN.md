# 041 — Staff Management, Invitation, RBAC & Takeover Implementation Plan

> **Document Type:** Detailed Implementation Plan & Frontend/Backend API Contract  
> **Target Audience:** Frontend Engineers, Backend Engineers, QA  
> **Status:** Approved / In Execution  

---

## 1. Overview & Business Objectives

Staff members have a **dual identity** in the platform:
1. **A Calendar / Business Resource** (Specialist/Master): Configurable working schedule templates, date overrides, specializations, and AI booking slot calculator targets.
2. **An Authenticated Platform User** (Employee): Accesses the web/mobile dashboard, views personal schedule/bookings, receives real-time alerts, and takes over live customer chats from the AI bot.

### Core Lifecycle Flow:
1. **Invitation:** Central Admin (Owner or Manager) creates/invites a staff member in **Settings → Staff**. The backend generates a secure single-use token and sends an invitation email containing a link to `/register-staff?token=...`.
2. **Registration & Auto-Verification:** The staff member opens `/register-staff?token=...`, sets their password, and submits. The backend:
   - Creates/links their `User` account with `isEmailVerified = true` (no OTP code required).
   - Binds the `StaffMember` profile to the `User`.
   - Assigns their role (`ADMIN_MANAGER` or `SPECIALIST`).
   - Issues JWT access/refresh tokens.
   - **Bypasses owner onboarding** so the employee lands directly in their tailored dashboard view.
3. **Universal Login (`/login`):** All users log in via `/login`. The system detects if the user is an `OWNER`, `ADMIN_MANAGER`, or `SPECIALIST`, and populates the JWT token accordingly. If the user works across multiple workspaces, a switcher endpoint is provided.
4. **Live Takeover & Message Attribution:** When staff replies in a chat, the backend stores `senderStaffId`, marks the conversation as `MANAGER_INTERCEPTED` (halting the AI bot), and broadcasts real-time WebSocket events with staff attribution for team audits.

---

## 2. Database Schema Changes (Prisma)

### Updated & New Prisma Models

```prisma
enum SystemRole {
  OWNER
  ADMIN_MANAGER
  SPECIALIST
}

model User {
  id               String      @id @default(uuid())
  email            String      @unique
  passwordHash     String
  refreshTokenHash String?
  isEmailVerified  Boolean     @default(false)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  workspaces       Workspace[]

  emailVerifications EmailVerificationToken[]
  passwordResets     PasswordResetToken[]
  staffProfiles      StaffMember[]
  sentInvites        StaffInvite[]            @relation("InvitedByUser")

  @@map("users")
}

model StaffMember {
  id                   String                 @id @default(uuid())
  workspaceId          String
  workspace            Workspace              @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  userId               String?
  user                 User?                  @relation(fields: [userId], references: [id], onDelete: SetNull)
  name                 String
  role                 String?                // Title e.g. "Top Stylist", "Doctor"
  systemRole           SystemRole             @default(SPECIALIST)
  specializations      String[]
  phone                String?
  email                String?
  avatarUrl            String?
  isActive             Boolean                @default(true)
  googleCalendarId     String?
  createdAt            DateTime               @default(now())
  updatedAt            DateTime               @updatedAt

  availabilityTemplates AvailabilityTemplate[]
  availabilityOverrides AvailabilityOverride[]
  bookings             Booking[]
  sentMessages         Message[]              @relation("StaffSentMessages")
  invites              StaffInvite[]

  @@index([workspaceId])
  @@index([userId])
  @@map("staff_members")
}

model StaffInvite {
  id            String      @id @default(uuid())
  workspaceId   String
  workspace     Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  staffMemberId String
  staffMember   StaffMember @relation(fields: [staffMemberId], references: [id], onDelete: Cascade)
  email         String
  systemRole    SystemRole  @default(SPECIALIST)
  token         String      @unique
  expiresAt     DateTime
  acceptedAt    DateTime?
  invitedById   String
  invitedBy     User        @relation("InvitedByUser", fields: [invitedById], references: [id], onDelete: Cascade)
  createdAt     DateTime    @default(now())

  @@index([workspaceId])
  @@index([staffMemberId])
  @@index([email])
  @@map("staff_invites")
}

model Message {
  id                String       @id @default(uuid())
  conversationId    String
  conversation      Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role              MessageRole  // USER | BOT | MANAGER
  senderStaffId     String?
  senderStaff       StaffMember? @relation("StaffSentMessages", fields: [senderStaffId], references: [id], onDelete: SetNull)
  content           String
  externalMessageId String?
  metadata          Json?
  createdAt         DateTime     @default(now())

  @@index([conversationId, createdAt])
  @@index([senderStaffId])
  @@map("messages")
}
```

---

## 3. API Contract & Frontend Integration Guide

### 3.1 Authentication & Invitation Endpoints

#### 1. Validate Staff Invitation Token
- **Endpoint:** `GET /auth/staff-invite`
- **Access:** Public
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `token` | string | Yes | The single-use invitation token from the email URL |

- **Success Response (`200 OK`):**
  ```json
  {
    "valid": true,
    "email": "anna.stylist@example.com",
    "staffName": "Anna Petrova",
    "roleTitle": "Top Stylist",
    "systemRole": "SPECIALIST",
    "workspaceName": "Aura Beauty Salon",
    "inviterName": "Elena Owner"
  }
  ```

- **Error Responses:**
  - `400 Bad Request`: `{ "code": "api.auth.invalid_or_expired_invite", "message": "Invalid or expired invitation token.", "isRaw": false }`
  - `409 Conflict`: `{ "code": "api.auth.invite_already_accepted", "message": "This invitation has already been accepted.", "isRaw": false }`

---

#### 2. Register Staff Member (Accept Invitation)
- **Endpoint:** `POST /auth/register-staff`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "token": "d8f43a91c2e64b...",
    "password": "SecurePassword123!",
    "name": "Anna Petrova",
    "phone": "+77011234567"
  }
  ```
  | Field | Type | Required | Validation / Notes |
  |---|---|---|---|
  | `token` | string | Yes | The invitation token |
  | `password` | string | Yes | Min 6 characters |
  | `name` | string | No | Optional display name override |
  | `phone` | string | No | Optional phone number |

- **Success Response (`201 Created`):**
  *Also sets `refresh_token` in HttpOnly Cookie.*
  ```json
  {
    "user": {
      "id": "usr_73fa19b0-1092-4f11-9a77-43b4f6e63281",
      "email": "anna.stylist@example.com",
      "isEmailVerified": true
    },
    "workspace": {
      "id": "ws_11fa19b0-1092-4f11-9a77-43b4f6e63299",
      "name": "Aura Beauty Salon"
    },
    "staffProfile": {
      "id": "staff_82fa19b0-1092-4f11-9a77-43b4f6e63244",
      "name": "Anna Petrova",
      "role": "Top Stylist",
      "systemRole": "SPECIALIST"
    },
    "role": "SPECIALIST",
    "access_token": "eyJhbGciOi...",
    "expires_in": 900
  }
  ```

---

#### 3. Unified Login (`POST /auth/login`)
- **Endpoint:** `POST /auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "anna.stylist@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "user": {
      "id": "usr_73fa19b0-1092-4f11-9a77-43b4f6e63281",
      "email": "anna.stylist@example.com",
      "isEmailVerified": true
    },
    "workspace": {
      "id": "ws_11fa19b0-1092-4f11-9a77-43b4f6e63299",
      "name": "Aura Beauty Salon"
    },
    "role": "SPECIALIST",
    "staffProfile": {
      "id": "staff_82fa19b0-1092-4f11-9a77-43b4f6e63244",
      "name": "Anna Petrova",
      "role": "Top Stylist",
      "systemRole": "SPECIALIST"
    },
    "availableWorkspaces": [
      {
        "workspaceId": "ws_11fa19b0-1092-4f11-9a77-43b4f6e63299",
        "workspaceName": "Aura Beauty Salon",
        "role": "SPECIALIST"
      }
    ],
    "access_token": "eyJhbGciOi...",
    "expires_in": 900
  }
  ```

---

#### 4. Switch Active Workspace Context
- **Endpoint:** `POST /auth/switch-workspace`
- **Access:** Bearer Token
- **Request Body:**
  ```json
  {
    "workspaceId": "ws_22fa19b0-1092-4f11-9a77-43b4f6e63200"
  }
  ```
- **Success Response (`200 OK`):**
  *Returns new access token and rotated refresh token cookie scoped to the selected workspace.*

---

#### 5. Current Profile (`GET /auth/me`)
- **Endpoint:** `GET /auth/me`
- **Access:** Bearer Token
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "usr_73fa19b0-1092-4f11-9a77-43b4f6e63281",
    "email": "anna.stylist@example.com",
    "isEmailVerified": true,
    "role": "SPECIALIST",
    "staffProfile": {
      "id": "staff_82fa19b0-1092-4f11-9a77-43b4f6e63244",
      "name": "Anna Petrova",
      "role": "Top Stylist",
      "systemRole": "SPECIALIST",
      "specializations": ["Coloring", "Haircut"]
    },
    "workspace": {
      "id": "ws_11fa19b0-1092-4f11-9a77-43b4f6e63299",
      "name": "Aura Beauty Salon",
      "nicheProfile": "BEAUTY",
      "plan": "PRO",
      "isActive": true
    },
    "availableWorkspaces": [
      {
        "workspaceId": "ws_11fa19b0-1092-4f11-9a77-43b4f6e63299",
        "workspaceName": "Aura Beauty Salon",
        "role": "SPECIALIST"
      }
    ]
  }
  ```

---

### 3.2 Staff Management Endpoints (`/staff`)

#### 1. List Staff Members
- **Endpoint:** `GET /staff`
- **Access:** Bearer Token (`OWNER` or `ADMIN_MANAGER`)
- **Query Params:** `isActive` (boolean, optional)
- **Success Response (`200 OK`):**
  ```json
  [
    {
      "id": "staff_uuid_1",
      "workspaceId": "ws_uuid",
      "userId": "usr_uuid_123",
      "name": "Anna Petrova",
      "role": "Top Stylist",
      "systemRole": "SPECIALIST",
      "specializations": ["Coloring", "Haircut"],
      "phone": "+77011234567",
      "email": "anna@aura.kz",
      "avatarUrl": null,
      "isActive": true,
      "hasDashboardAccess": true,
      "inviteStatus": "ACCEPTED",
      "createdAt": "2026-09-13T10:00:00.000Z"
    },
    {
      "id": "staff_uuid_2",
      "workspaceId": "ws_uuid",
      "userId": null,
      "name": "Elena V.",
      "role": "Receptionist",
      "systemRole": "ADMIN_MANAGER",
      "specializations": [],
      "phone": "+77019876543",
      "email": "elena@aura.kz",
      "avatarUrl": null,
      "isActive": true,
      "hasDashboardAccess": false,
      "inviteStatus": "PENDING",
      "createdAt": "2026-09-13T11:00:00.000Z"
    }
  ]
  ```

---

#### 2. Create Staff Member (With Optional Auto-Invite)
- **Endpoint:** `POST /staff`
- **Access:** Bearer Token (`OWNER` or `ADMIN_MANAGER`)
- **Request Body:**
  ```json
  {
    "name": "Anna Petrova",
    "role": "Top Stylist",
    "systemRole": "SPECIALIST",
    "specializations": ["Coloring", "Haircut"],
    "phone": "+77011234567",
    "email": "anna@aura.kz",
    "sendInvite": true
  }
  ```
- **Success Response (`201 Created`):** Returns created staff record with `inviteStatus`.

---

#### 3. Send / Resend Invitation
- **Endpoint:** `POST /staff/:id/invite`
- **Access:** Bearer Token (`OWNER` or `ADMIN_MANAGER`)
- **Request Body (Optional overrides):**
  ```json
  {
    "email": "anna@aura.kz",
    "systemRole": "SPECIALIST"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "code": "staff.invite_sent",
    "message": "Invitation email sent to staff member.",
    "expiresAt": "2026-09-20T11:00:00.000Z"
  }
  ```

---

#### 4. Revoke Invitation
- **Endpoint:** `DELETE /staff/:id/invite`
- **Access:** Bearer Token (`OWNER` or `ADMIN_MANAGER`)
- **Success Response (`200 OK`):**
  ```json
  {
    "code": "staff.invite_revoked",
    "message": "Staff invitation revoked."
  }
  ```

---

#### 5. Update Staff Profile
- **Endpoint:** `PATCH /staff/:id`
- **Access:** Bearer Token (`OWNER` or `ADMIN_MANAGER`)
- **Request Body:**
  ```json
  {
    "name": "Anna S. Petrova",
    "role": "Senior Top Stylist",
    "systemRole": "SPECIALIST",
    "specializations": ["Coloring", "Balayage", "AirTouch"],
    "phone": "+77011234567",
    "email": "anna.new@aura.kz",
    "avatarUrl": "https://...",
    "isActive": true
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "code": "staff.updated",
    "message": "Staff member updated."
  }
  ```

---

#### 6. Deactivate Staff Member (Soft Delete & Session Invalidation)
- **Endpoint:** `DELETE /staff/:id`
- **Access:** Bearer Token (`OWNER` or `ADMIN_MANAGER`)
- **Success Response (`200 OK`):**
  ```json
  {
    "code": "staff.deactivated",
    "message": "Staff member deactivated."
  }
  ```

---

### 3.3 Unified Inbox & Takeover Attribution

#### Send Manager/Staff Outbound Message
- **Endpoint:** `POST /conversations/:id/messages`
- **Access:** Bearer Token (`OWNER`, `ADMIN_MANAGER`, or `SPECIALIST`)
- **Request Body:**
  ```json
  {
    "content": "Здравствуйте! Я смогу принять вас в 15:00."
  }
  ```
- **Server Behavior:**
  1. Identifies caller from JWT (`user.staffMemberId` or `user.sub`).
  2. Saves message with `role: MANAGER`, `senderStaffId: staffProfileId`.
  3. Transitions conversation status to `MANAGER_INTERCEPTED` (disabling AI responses).
  4. Dispatches outbound message via channel adapter (WhatsApp / Instagram / Telegram).
  5. Emits real-time WebSocket event `conversations:message` with sender information:
     ```json
     {
       "conversationId": "conv_123",
       "message": {
         "id": "msg_456",
         "role": "MANAGER",
         "senderStaffId": "staff_82fa19b0-1092-4f11-9a77-43b4f6e63244",
         "senderName": "Anna Petrova (Top Stylist)",
         "content": "Здравствуйте! Я смогу принять вас в 15:00.",
         "createdAt": "2026-09-13T12:00:00.000Z"
       }
     }
     ```

---

## 4. High-Level Execution Checklist

- [x] **Phase 1: Architecture & Data Model**
  - [x] Create implementation specification document (`dev_docs/041_STAFF_MANAGEMENT_IMPL_PLAN.md`).
  - [ ] Add `SystemRole` enum (`OWNER`, `ADMIN_MANAGER`, `SPECIALIST`) to `prisma/schema.prisma`.
  - [ ] Add `StaffInvite` model and relations to `StaffMember`, `User`, `Workspace`.
  - [ ] Add `senderStaffId` to `Message` model.
  - [ ] Run Prisma migration / schema push and generate Prisma Client.

- [ ] **Phase 2: Mail System & Templates**
  - [ ] Implement `renderStaffInviteTemplate` in `src/modules/mail/templates/staff-invite.template.ts`.
  - [ ] Add `sendStaffInviteEmail` to `MailService`.
  - [ ] Implement `SEND_STAFF_INVITE_EMAIL_JOB` in `MailProcessor`.

- [ ] **Phase 3: Auth & Invitation Workflow**
  - [ ] Update `JwtPayload` in `src/common/types/index.ts`.
  - [ ] Create DTOs: `RegisterStaffDto`, `StaffInviteQueryDto`, `SwitchWorkspaceDto`.
  - [ ] Implement `validateStaffInvite`, `registerStaff`, `switchWorkspace` in `AuthService`.
  - [ ] Update `login` and `getMe` in `AuthService` with multi-workspace and role resolution.
  - [ ] Add endpoints to `AuthController` (`GET /auth/staff-invite`, `POST /auth/register-staff`, `POST /auth/switch-workspace`).

- [ ] **Phase 4: Role-Based Access Control (RBAC)**
  - [ ] Create `@Roles(...)` decorator and `RolesGuard`.
  - [ ] Export decorator and guard in `src/common/`.
  - [ ] Ensure `EmailVerifiedGuard` seamlessly validates invited staff.

- [ ] **Phase 5: Staff Module Updates**
  - [ ] Update `CreateStaffDto`, `UpdateStaffDto`, and add `InviteStaffDto`.
  - [ ] Update `StaffRepository` and `StaffService` with invite lifecycle and role handling.
  - [ ] Add endpoints in `StaffController` (`POST /staff/:id/invite`, `DELETE /staff/:id/invite`).
  - [ ] Apply `@Roles(SystemRole.OWNER, SystemRole.ADMIN_MANAGER)` to staff management endpoints.

- [ ] **Phase 6: Live Takeover Attribution**
  - [ ] Update `ConversationsService.sendMessage` to attach `senderStaffId`.
  - [ ] Broadcast staff sender info in WebSocket events.
  - [ ] Include staff details in `ConversationsRepository` queries.

- [ ] **Phase 7: Translations & Quality Assurance**
  - [ ] Add all staff and invitation translation keys to `translation_keys_new.json`.
  - [ ] Build and verify TypeScript compilation.
  - [ ] Test end-to-end flows.
