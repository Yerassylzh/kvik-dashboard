# 010 — Mail System Frontend Implementation Plan

> **Depends On:** `dev_docs/backend/040_MAIL_SYSTEM_PLAN.md`  
> **Status:** Complete  
> **Scope:** Auth flows, registration gate, forgot password, change password in settings

---

## Overview

The backend has fully implemented the transactional mail system (all ✅ in backend checklist). The frontend has wired up all three flows:

1. **Email Verification Gate** — After registration, block the user from proceeding until they enter the 6-digit OTP sent to their inbox. Works across page refreshes.
2. **Forgot Password (Public)** — Step-by-step: enter email → enter OTP code → set new password. Available from the `/login` page.
3. **Change Password (Dashboard Settings)** — Authenticated flow inside `/settings/account` using the user's current password + new password.

---

## High-Level Changes

### A. Types & API Layer
- Add `isEmailVerified` to the `User` type.
- Add `AuthResponse.isEmailVerified` field.
- Add new API functions: `verifyEmailApi`, `resendVerificationApi`, `forgotPasswordApi`, `resetPasswordApi`, `changePasswordApi`.

### B. Auth Store
- Add `pendingVerificationEmail: string | null` — persisted to `sessionStorage` so a page refresh can resume the verification screen.
- Setter/clearer for the pending email.

### C. Email Verification Screen (Post-Registration Gate)
- After `POST /auth/register` returns `isEmailVerified: false`, store email in session and redirect to `/verify-email`.
- `/verify-email` page: renders a 6-input OTP box, submit button, resend with 60s cooldown timer.
- On success → redirect to `/onboarding`.
- On page load, if user is already authenticated but `user.isEmailVerified === false`, redirect to `/verify-email` instead of `/onboarding`.
- If the backend 403s with `api.auth.email_not_verified` on any onboarding route, redirect to `/verify-email`.

### D. Forgot Password (Public Pages)
- Add a "Забыли пароль?" link to `/login`.
- New route: `/forgot-password` — three-step wizard:
  1. Step 1: Enter email → call `POST /auth/forgot-password`
  2. Step 2: Enter 6-digit OTP code
  3. Step 3: Set new password → call `POST /auth/reset-password` → success → redirect to `/login`
- Uses the same glass-card layout as login/register (re-uses auth layout).

### E. Change Password (Dashboard Settings)
- New settings sub-section: `/settings/account`.
- New nav item "Аккаунт" in `SettingsNav`.
- `ChangePasswordForm` component: current password input + new password input + confirm → calls `POST /auth/change-password`.
- Shows success/error inline.

### F. Translations
- Add all new Russian keys to `locales/translation_keys_new.json`.
- Run `scripts/apply-translation-keys.mjs` to merge into locale files.

---

## Implementation Checklist

- [x] **Types** — Add `isEmailVerified` to `User` and `AuthResponse` in `types/auth.ts`
- [x] **API** — Add `verifyEmailApi`, `resendVerificationApi`, `forgotPasswordApi`, `resetPasswordApi`, `changePasswordApi` to `lib/api/auth.ts`
- [x] **Auth Store** — Add `pendingVerificationEmail` field with sessionStorage persistence
- [x] **useAuth hook** — Update `register` to store `pendingVerificationEmail`; update `checkAuth` to redirect to `/verify-email` if `!isEmailVerified`
- [x] **Verify Email page** — Create `app/(auth)/verify-email/page.tsx` with OTP input and resend logic
- [x] **Forgot Password page** — Create `app/(auth)/forgot-password/page.tsx` with 3-step wizard
- [x] **Login page** — Add "Забыли пароль?" link
- [x] **Register page** — Update to redirect to `/verify-email` when `isEmailVerified: false`
- [x] **Account Settings page** — Create `app/(dashboard)/settings/account/page.tsx`
- [x] **ChangePasswordForm component** — Create `components/dashboard/settings/account/ChangePasswordForm.tsx`
- [x] **SettingsNav** — Add "Аккаунт" nav item pointing to `/settings/account`
- [x] **Translations** — Add all new keys to `translation_keys_new.json` and run merge script

---

## File Map

| File | Action |
|---|---|
| `types/auth.ts` | MODIFY — add `isEmailVerified` |
| `lib/api/auth.ts` | MODIFY — add 5 new API functions |
| `store/auth.store.ts` | MODIFY — add `pendingVerificationEmail` |
| `hooks/useAuth.ts` | MODIFY — update register, checkAuth |
| `app/(auth)/verify-email/page.tsx` | NEW |
| `app/(auth)/forgot-password/page.tsx` | NEW |
| `app/(auth)/login/page.tsx` | MODIFY — add forgot password link |
| `app/(auth)/register/page.tsx` | MODIFY — redirect logic |
| `app/(dashboard)/settings/account/page.tsx` | NEW |
| `components/dashboard/settings/account/ChangePasswordForm.tsx` | NEW |
| `components/dashboard/settings/SettingsNav.tsx` | MODIFY — add Account nav |
| `locales/translation_keys_new.json` | MODIFY — add all keys |
