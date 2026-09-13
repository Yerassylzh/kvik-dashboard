# 040 — Transactional Mail System & Auth Verification Plan

> **Module:** `src/modules/mail/`, `src/modules/auth/`  
> **Status:** Plan & Implementation In Progress  
> **Depends On:** BullMQ, Users, Auth, Prisma  

---

## 1. System Overview

The transactional mail system handles all outgoing system emails for KVIK:
1. **Email Verification OTP:** 6-digit security code sent upon new user registration and upon manual resend request.
2. **Forgot Password / Password Reset OTP:** 6-digit security code sent when a user requests a password reset.
3. **Change Password:** Authenticated user password rotation inside dashboard settings.
4. **Staff Invitations (Future):** Workspace invite links for specialists and managers.

### Core Architecture & Strategy

- **Pluggable Mail Adapters (`IMailAdapter`):**
  - `ResendMailAdapter` — used when `RESEND_API_KEY` is provided (Fastest, modern API).
  - `SmtpMailAdapter` — used when `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are provided (works with any domain mailbox / provider via `nodemailer`).
  - `ConsoleMailAdapter` — fallback for local development & testing. Prints the email subject, recipient, HTML content, and OTP codes directly to logger/console.
- **Asynchronous Queue Dispatching:**
  - Uses BullMQ `mail-queue` for non-blocking email delivery.
  - Endpoints respond in `< 50ms` immediately while the background queue delivers the email.
- **OTP Security & Expiration:**
  - 6-digit numeric codes generated with cryptographic entropy (`crypto.randomInt`).
  - 15-minute TTL expiration.
  - Rate limiting (60-second cooldown between resends).
  - One-time usage (tokens marked used or deleted upon verification).

```
+-------------------------------------------------------------------------------+
|                                CLIENT (Frontend)                              |
+-------------------------------------------------------------------------------+
          | (1. Register / Forgot Password)              | (3. Submit OTP)
          v                                              v
+-------------------+                          +-------------------+
|  AuthController   |                          |  AuthController   |
+-------------------+                          +-------------------+
          |                                              |
          v                                              v
+-------------------+                          +-------------------+
|    AuthService    |                          |    AuthService    |
| (Generate OTP &   |                          | (Validate OTP &   |
| Save Token in DB) |                          | Update User State)|
+-------------------+                          +-------------------+
          |
          v (Add Job)
+------------------------------------+
|  BullMQ Mail Queue ('mail-queue')  |
+------------------------------------+
          |
          v (Process Job)
+------------------------------------+
|           MailProcessor            |
|       (src/modules/mail/)          |
+------------------------------------+
          |
          v
+------------------------------------+
|            MailService             |
|       (Selects Active Adapter)     |
+------------------------------------+
          |
    +-----+--------------------+--------------------+
    |                          |                    |
    v                          v                    v
[ResendAdapter]          [SmtpAdapter]       [ConsoleAdapter]
 (Resend API)            (Nodemailer)          (Local Dev Log)
```

---

## 2. API Endpoints Specification (for Frontend)

### 2.1 Register & Email Verification Flow

#### `POST /auth/register`
> Registers a new business owner and automatically dispatches a 6-digit email verification code.

**Request Body:**
```json
{
  "email": "owner@salon.kz",
  "password": "SecurePassword123!"
}
```

**Response `201`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "owner@salon.kz",
    "isEmailVerified": false
  },
  "workspace": {
    "id": "uuid",
    "name": "owner@salon.kz's Workspace"
  },
  "access_token": "jwt_token...",
  "expires_in": 900,
  "isEmailVerified": false
}
```

---

#### `POST /auth/verify-email`
> Verifies the user's email using the 6-digit code.

**Request Body:**
```json
{
  "email": "owner@salon.kz",
  "code": "482910"
}
```

**Response `200`:**
```json
{
  "code": "auth.email_verified",
  "message": "Email verified successfully"
}
```

**Errors:**
- `400` `auth.invalid_or_expired_code` — Code is wrong or expired (> 15 mins).
- `404` `auth.user_not_found` — User not found.

---

#### `POST /auth/resend-verification`
> Resends a fresh 6-digit verification code with 60-second cooldown protection.

**Request Body:**
```json
{
  "email": "owner@salon.kz"
}
```

**Response `200`:**
```json
{
  "code": "auth.verification_code_sent",
  "message": "Verification code sent to email"
}
```

**Errors:**
- `429` `auth.resend_cooldown` — Please wait before requesting another code.
- `400` `auth.email_already_verified` — Email is already verified.

---

### 2.2 Password Reset Flow (Unauthenticated)

#### `POST /auth/forgot-password`
> Initiates password recovery. Dispatches a 6-digit reset code if the email exists. Always returns a 200 response to prevent user enumeration.

**Request Body:**
```json
{
  "email": "owner@salon.kz"
}
```

**Response `200`:**
```json
{
  "code": "auth.password_reset_code_sent",
  "message": "If an account with this email exists, a password reset code has been sent."
}
```

---

#### `POST /auth/reset-password`
> Sets a new password using the 6-digit reset code.

**Request Body:**
```json
{
  "email": "owner@salon.kz",
  "code": "739104",
  "newPassword": "NewStrongPassword456!"
}
```

**Response `200`:**
```json
{
  "code": "auth.password_reset_success",
  "message": "Password reset successfully. You can now log in."
}
```

**Errors:**
- `400` `auth.invalid_or_expired_code` — Code is invalid, expired, or already used.
- `400` `validation.password` — Password does not meet security constraints.

---

### 2.3 Change Password Flow (Authenticated)

#### `POST /auth/change-password`
> Authenticated endpoint for changing password from dashboard settings.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewStrongPassword456!"
}
```

**Response `200`:**
```json
{
  "code": "auth.password_changed",
  "message": "Password updated successfully."
}
```

**Errors:**
- `400` `auth.invalid_current_password` — Current password does not match.

---

## 3. Database Schema Changes (`prisma/schema.prisma`)

```prisma
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

  @@map("users")
}

model EmailVerificationToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  email     String
  code      String
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([email, code])
  @@index([userId])
  @@map("email_verification_tokens")
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, code])
  @@map("password_reset_tokens")
}
```

---

## 4. Implementation Checklist

- [x] **Phase 1: Dependencies & Configuration**
  - [x] Install `nodemailer` and `@types/nodemailer`, `resend`
  - [x] Add `MAIL_QUEUE` constant to `src/queues/constants.ts`
  - [x] Update `prisma/schema.prisma` with `isEmailVerified`, `EmailVerificationToken`, `PasswordResetToken`
  - [x] Run `npx prisma generate` and `npx prisma db push`
- [x] **Phase 2: Mail Module Core (`src/modules/mail/`)**
  - [x] Create `mail-adapter.interface.ts`
  - [x] Create `resend.adapter.ts`
  - [x] Create `smtp.adapter.ts`
  - [x] Create `console.adapter.ts`
  - [x] Create HTML templates: `verify-email.template.ts`, `reset-password.template.ts`
  - [x] Create `mail.service.ts` with active adapter resolution
  - [x] Create `mail.processor.ts` (BullMQ worker)
  - [x] Create `mail.module.ts` and register in `app.module.ts`
- [x] **Phase 3: Auth DTOs & Validation**
  - [x] Create `verify-email.dto.ts`
  - [x] Create `resend-verification.dto.ts`
  - [x] Create `forgot-password.dto.ts`
  - [x] Create `reset-password.dto.ts`
  - [x] Create `change-password.dto.ts`
- [x] **Phase 4: Auth Service & Controller Implementation**
  - [x] Update `register` method to create verification token and queue email
  - [x] Implement `verifyEmail(dto)`
  - [x] Implement `resendVerification(dto)`
  - [x] Implement `forgotPassword(dto)`
  - [x] Implement `resetPassword(dto)`
  - [x] Implement `changePassword(userId, dto)`
  - [x] Add Swagger decorators and endpoints to `auth.controller.ts`
  - [x] Update `getMe` to return `isEmailVerified`
- [x] **Phase 5: Translations & Build Validation**
  - [x] Add translation keys to `translation_keys_new.json`
  - [x] Verify `npm run build` passes cleanly with 0 TypeScript errors
- [x] **Phase 6: Email Verification Gate (Onboarding Hard Block)**
  - [x] Create `src/common/guards/email-verified.guard.ts`
  - [x] Export guard from `src/common/guards/index.ts`
  - [x] Add `EmailVerifiedGuard` to `OnboardingModule` providers
  - [x] Apply `@UseGuards(EmailVerifiedGuard)` to `OnboardingController`
  - [x] Add `api.auth.email_not_verified` translation key
  - [x] Verify `npm run build` passes cleanly with 0 TypeScript errors

---

## 5. Email Verification Gate — Onboarding Access Control

### Decision: Hard Gate

Users **cannot access any onboarding route** until their email is verified. This is a hard gate, not a banner/soft-gate.

**Rationale:**
- Onboarding connects real WhatsApp/Instagram channels and loads live business data — unverified throwaway accounts should never reach this stage.
- The 5-minute onboarding flow is short enough that the "verify email first" step is low friction.
- Keeps the data model clean: every active workspace is always owned by a verified identity.

### How it Works

```
[User Registers]
      │
      ▼
[JWT issued, isEmailVerified=false]
      │
      ├──► GET /auth/me     ✅ accessible (shows isEmailVerified: false)
      ├──► POST /auth/verify-email    ✅ accessible (public)
      ├──► POST /auth/resend-verification ✅ accessible (public)
      │
      └──► ANY /onboarding/* ──► EmailVerifiedGuard checks DB
                                       │
                             isEmailVerified = false?
                                       │
                                       ▼
                             403 Forbidden
                             { code: "api.auth.email_not_verified",
                               message: "Please verify your email..." }

[User submits 6-digit code → POST /auth/verify-email]
      │
      ▼
[isEmailVerified=true in DB]
      │
      └──► ANY /onboarding/* ──► EmailVerifiedGuard → PASS ✅
```

### Guard Location

```
src/common/guards/email-verified.guard.ts
```

The guard does a **single DB lookup** (`UsersService.findById`) to read the live `isEmailVerified` value — always accurate regardless of token age. This is acceptable because onboarding routes are not called in tight loops.

### Frontend Contract

After `POST /auth/register`, the frontend receives `user.isEmailVerified: false` in the response.

The frontend **must**:
1. Show an "Enter your 6-digit verification code" screen.
2. Only redirect to `/onboarding` after `POST /auth/verify-email` returns `200`.
3. If the user navigates directly to `/onboarding` with an unverified token, the backend will return `403` with `code: "api.auth.email_not_verified"` — the frontend should redirect back to the verification screen.

### Error Response for Unverified Access

```json
HTTP 403 Forbidden
{
  "code": "api.auth.email_not_verified",
  "message": "Please verify your email address before proceeding. Check your inbox for the 6-digit code.",
  "isRaw": false
}
```

