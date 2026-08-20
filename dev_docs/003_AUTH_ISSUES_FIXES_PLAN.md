# 003 — Auth, Routing & Token Synchronization Fix Plan

> **Goal:** Fix session invalidation, back-button loop to `/login`, and prevent authenticated users from accessing public auth routes.

---

## 📋 Checklist

- [x] **1. Public Auth Route Guards (`proxy.ts`)**
  - [x] Check `refresh_token` cookie when accessing `/login` and `/register`.
  - [x] If authenticated user attempts to access auth pages, redirect them to `/onboarding` (or `/`).

- [x] **2. Client-Side Auth Redirection on Login & Register Pages**
  - [x] In `app/(auth)/login/page.tsx`: Add check to redirect already-authenticated users immediately.
  - [x] In `app/(auth)/register/page.tsx`: Add check to redirect already-authenticated users immediately.

- [x] **3. Replace History Navigation (`router.replace`)**
  - [x] In `app/(auth)/login/page.tsx`: Switch from `router.push()` to `router.replace()` after login.
  - [x] In `app/(auth)/register/page.tsx`: Switch from `router.push()` to `router.replace()` after register.
  - [x] In `app/(onboarding)/onboarding/page.tsx`: Switch from `router.push('/')` to `router.replace('/')` on completion (`step === 'DONE'`).

- [x] **4. Eliminate Destructive Token Rotation in Server Layouts**
  - [x] In `app/(onboarding)/layout.tsx`: Remove `getServerUser()` server-side call that triggers token rotation without writing `Set-Cookie`.
  - [x] In `app/(dashboard)/layout.tsx`: Convert to client-aware component using `useAuthStore` and `useAuth()` so user data is rendered reactively and silent refresh goes through Next.js API route proxy (`/api/auth/refresh`).

- [x] **5. Verification & Testing**
  - [x] Verify build with `npm run build` (Turbopack + TypeScript check passed cleanly).
  - [x] Verified navigation history stack replacement logic & route guards.
