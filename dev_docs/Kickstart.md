# Kvik — Kickstart Plan

> **Document:** Frontend Development Kickstart Technical Plan  
> **Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4  
> **Market:** Kazakhstan / CIS  
> **Related Document:** [`Product Architecture.md`](./Product%20Architecture.md)

---

## 📐 Part 1 — Folder Architecture

### Concept

The project is divided into two zones, both within a single Next.js application:

| Domain | Purpose | Type |
|:-------|:--------|:-----|
| `kvik.kz` | Landing Page (public) | SSR, SEO |
| `app.kvik.kz` | Login, Registration, Onboarding, Dashboard | Auth-protected SPA |

Subdomain separation is implemented via **Next.js Middleware** — single deployment, no separate repositories.

---

### Target Folder Structure

```
kvik/
│
├── app/
│   │
│   ├── (marketing)/                     # Group: landing page — kvik.kz/
│   │   ├── layout.tsx                   # Nav + footer
│   │   ├── page.tsx                     # Main page (niche-switcher)
│   │   └── _sections/
│   │       ├── HeroSection.tsx
│   │       ├── NicheSwitcher.tsx        # Niche switcher without page reload
│   │       ├── LiveDemoWidget.tsx       # Interactive demo chat
│   │       ├── RoiCalculator.tsx
│   │       ├── PricingSection.tsx
│   │       └── FaqSection.tsx
│   │
│   ├── (auth)/                          # Group: authentication — app.kvik.kz/login|register
│   │   ├── layout.tsx                   # Minimal layout: centered logo
│   │   ├── login/
│   │   │   └── page.tsx                 # Login form
│   │   └── register/
│   │       └── page.tsx                 # Registration form
│   │
│   ├── (onboarding)/                    # Group: onboarding — app.kvik.kz/onboarding
│   │   ├── layout.tsx                   # Logo + progress bar + "Back" button
│   │   └── onboarding/
│   │       ├── page.tsx                 # Step 0: niche selection or automatic redirect to current step
│   │       └── [niche]/
│   │           └── [step]/
│   │               └── page.tsx         # Dynamic steps by niche
│   │           # Step components (private, prefixed with _):
│   │       └── _steps/
│   │           ├── realty/
│   │           │   ├── Step1KrishaUrl.tsx
│   │           │   ├── Step2ConfirmObjects.tsx
│   │           │   ├── Step3ConnectChannel.tsx
│   │           │   ├── Step4QualifySettings.tsx
│   │           │   ├── Step5Calendar.tsx
│   │           │   └── Step6TestBot.tsx
│   │           ├── auto/
│   │           │   ├── Step1SubSegment.tsx
│   │           │   ├── Step1aKolesaUrl.tsx
│   │           │   ├── Step1bPriceList.tsx
│   │           │   ├── Step2ConnectChannel.tsx
│   │           │   ├── Step3BookingRules.tsx
│   │           │   └── Step4TestBot.tsx
│   │           └── calendar/
│   │               ├── Step1SubVertical.tsx
│   │               ├── Step2ConnectCalendar.tsx
│   │               ├── Step3Messengers.tsx
│   │               └── Step4TestBot.tsx
│   │
│   ├── (dashboard)/                     # Group: dashboard — app.kvik.kz/dashboard
│   │   ├── layout.tsx                   # Sidebar + Topbar layout
│   │   └── dashboard/
│   │       ├── page.tsx                 # Home: key metrics
│   │       ├── inbox/
│   │       │   └── page.tsx            # Unified chat inbox
│   │       ├── leads/
│   │       │   ├── page.tsx            # CRM lead table
│   │       │   └── [id]/page.tsx       # Lead profile card
│   │       ├── analytics/
│   │       │   └── page.tsx
│   │       ├── objects/                 # [realty only]
│   │       │   └── page.tsx
│   │       ├── catalog/                 # [auto only]
│   │       │   └── page.tsx
│   │       ├── schedule/               # [auto / calendar only]
│   │       │   └── page.tsx
│   │       ├── settings/
│   │       │   ├── page.tsx            # Bot / knowledge base
│   │       │   └── team/page.tsx       # Team permissions & access
│   │       └── billing/
│   │           └── page.tsx
│   │
│   ├── api/                             # Next.js Route Handlers (BFF / Proxy)
│   │   ├── auth/
│   │   │   ├── login/route.ts           # POST → backend /auth/login → return { user }, obtain access token
│   │   │   ├── register/route.ts        # POST → backend /auth/register
│   │   │   ├── logout/route.ts          # POST → backend /auth/logout → clear refresh cookie
│   │   │   ├── refresh/route.ts         # POST → backend /auth/refresh → update access token in store
│   │   │   └── me/route.ts              # GET  → backend /auth/me → current user (SSR guard)
│   │   ├── onboarding/
│   │   │   ├── state/route.ts           # GET  → backend getState(workspaceId)
│   │   │   ├── parse-krisha/route.ts    # POST → start async parsing job { jobId }
│   │   │   ├── parse-kolesa/route.ts    # POST → start async parsing job { jobId }
│   │   │   ├── parse-status/route.ts   # GET  → check job status { status, progress, data }
│   │   │   ├── progress/route.ts        # POST → save step progress
│   │   │   └── complete/route.ts        # POST → complete onboarding
│   │   └── [proxy]/
│   │       └── route.ts                # Universal proxy with token injection
│   │
│   ├── globals.css
│   └── layout.tsx                      # Root layout: providers (Zustand, SWR), fonts
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   └── ProgressBar.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── OnboardingProgress.tsx
│   └── shared/
│       ├── NicheIcon.tsx
│       └── ChannelBadge.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts                   # Axios instance (interceptors: inject token, 401 → refresh)
│   │   ├── auth.ts                     # Functions: login(), register(), logout(), getMe()
│   │   ├── onboarding.ts               # getState(), parseKrisha(), checkParseStatus(), updateProgress()
│   │   └── dashboard.ts
│   └── utils/
│       ├── niche.ts                    # getLabel(), getSteps(), getIcon() by niche_profile
│       └── format.ts                   # Formatting KZT amounts, dates
│
├── types/
│   ├── niche.ts                        # NicheProfile, OnboardingStep
│   ├── auth.ts                         # User, AuthResponse, TokenPayload
│   ├── lead.ts                         # Lead, Conversation
│   └── api.ts                          # ApiResponse<T>, ApiError
│
├── hooks/
│   ├── useAuth.ts                      # Current user from Zustand + helpers
│   ├── useOnboarding.ts                # Wizard state + navigation
│   └── useNicheConfig.ts               # Widget/sidebar config by niche_profile
│
├── store/
│   ├── auth.store.ts                   # { user, accessToken, setTokens, clearAuth }
│   └── onboarding.store.ts             # { niche, step, data, actions }
│
├── middleware.ts                        # Auth guard + subdomain routing
│
├── dev_docs/
│   ├── Product Architecture.md
│   └── Kickstart.md
│
└── public/
    └── images/niche/
```

---

## 🔐 Part 2 — Auth, Tokens, and Axios Proxy

### 2.1 Token Strategy (Aligned with Backend)

The backend uses a **JWT Access + Refresh Token (HttpOnly Cookie)** scheme:

| Token | Expiration | Storage Location | Managed By |
|:------|:-----------|:-----------------|:-----------|
| **Access Token** | 15 min | **Zustand store** (JS in-memory only) | Frontend: injected into each request via Axios interceptor |
| **Refresh Token** | 7 days | **HttpOnly Cookie** (set by backend) | Browser: sent automatically to `/auth/refresh` with `withCredentials: true` |
| **User Info** | — | **Zustand store** | Frontend: populated from `/auth/me` or `/auth/login` response |

> ⚠️ **NEVER store Access Token in `localStorage` or Cookies** — strictly in memory (Zustand). On page reload, the frontend silently calls `/api/auth/refresh` to obtain a fresh access token from the refresh cookie.

### 2.2 Backend Endpoints (Agreed Contract)

```
POST /auth/register   → { user, access_token, expires_in: 900 } + Set-Cookie: refresh_token (HttpOnly)
POST /auth/login      → { user, access_token, expires_in: 900 } + Set-Cookie: refresh_token (HttpOnly)
POST /auth/refresh    → { access_token, expires_in: 900 }  (refresh cookie sent automatically)
POST /auth/logout     → clear refresh_token in DB and remove cookie
GET  /auth/me         → { user }  (requires JWT guard)

Public backend routes (@Public):
  POST /auth/register, /auth/login, /auth/refresh, /auth/logout
  POST /webhooks/whatsapp, /webhooks/instagram
  GET  /health
Everything else requires JWT.
```

### 2.3 Auth and Onboarding Flow

```
Registration:
  1. User is on app.kvik.kz/register → enters email + password
  2. POST /api/auth/register → backend creates account (user has no niche yet!)
  3. Backend returns { user, access_token } + Set-Cookie: refresh_token
  4. Frontend stores access_token in Zustand
  5. Automatic redirect → app.kvik.kz/onboarding (since niche is not selected yet)

Existing User Login:
  1. User is on app.kvik.kz/login → enters credentials
  2. POST /api/auth/login → backend returns { user, access_token }
  3. Frontend checks onboarding status via GET /api/onboarding/state ( getState() ):
     - If state === 'DONE' → redirect to /dashboard
     - If state !== 'DONE' → redirect to appropriate /onboarding/... step
```

### 2.4 Axios Client — Interceptors

```ts
// lib/api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

export const apiClient = axios.create({
  baseURL: '/api',            // Everything goes through Next.js proxy
  withCredentials: true,      // Refresh cookie sent automatically to /auth/refresh
})

// Inject access token into every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 → silent refresh → retry
let isRefreshing = false
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
          useAuthStore.getState().setAccessToken(data.access_token)
        } finally {
          isRefreshing = false
        }
      }
      return apiClient(original)
    }
    return Promise.reject(error)
  }
)
```

### 2.5 Next.js Route Handler as BFF Proxy

```ts
// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const res = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: request.headers.get('cookie') ?? '' },
  })
  const data = await res.json()

  const response = NextResponse.json(data, { status: res.status })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) response.headers.set('set-cookie', setCookie)
  return response
}
```

### 2.6 Next.js Middleware — Auth Guard

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''
  const isApp = hostname.startsWith('app.')

  // app.kvik.kz/ → /dashboard
  if (isApp && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || !isApp) {
    return NextResponse.next()
  }

  // Protected paths (/dashboard, /onboarding): check presence of refresh cookie
  const hasRefreshCookie = request.cookies.has('refresh_token')

  if (!hasRefreshCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|images|api).*)'],
}
```

---

## 🧭 Part 3 — Auth Pages and Onboarding

### 3.1 Onboarding State Machine

On the backend, onboarding status is calculated by `getState(workspaceId)`:

```ts
export type OnboardingStepState =
  | 'SELECT_NICHE'           // Niche not selected → /onboarding
  | 'DATA_SOURCE'            // No database connected → /onboarding/[niche]/1 (Krisha/Kolesa parsing)
  | 'CONNECT_CHANNEL'        // No messenger connected → /onboarding/[niche]/3 (WhatsApp/IG)
  | 'QUALIFICATION'          // No AI rules configured → /onboarding/[niche]/4
  | 'COMPLETE'               // Final test bot → /onboarding/[niche]/6
  | 'DONE'                   // Everything filled and bot active → /dashboard
```

#### Redirection Rule:
If an authenticated user navigates to `/onboarding`, the frontend queries `GET /api/onboarding/state`:
- If `state === 'DONE'` → instant redirect to `/dashboard`.
- If `state !== 'DONE'` → automatic transition to the corresponding incomplete step (for example, if user is stuck at `CONNECT_CHANNEL`, navigate directly to Step 3 channel connection).

---

### 3.2 Why Krisha / Kolesa Scraping is Handled ASYNCHRONOUSLY (Async Jobs)

#### ❓ What does asynchronous parsing mean and why is it better/faster?

* **Synchronous Approach (BAD):**
  User clicks "Parse Krisha.kz" → Browser makes `POST /api/parse` → Backend begins scraping 50 listings on the spot → Connection hangs for **30–60 seconds** → Browser displays a frozen spinner → High risk of HTTP Timeout (504 Gateway Timeout) on NGINX/Vercel → Loss of user trust.

* **Asynchronous Approach with Queue (CORRECT):**
  1. User enters Krisha/Kolesa URL → clicks button.
  2. `POST /api/onboarding/parse-krisha` immediately (in **50 milliseconds**) returns `202 Accepted` and `{ jobId: "task_9981" }`.
  3. Backend places task in background queue (BullMQ/Redis), where it is safely processed by a background worker with parser.
  4. Frontend displays animated skeleton cards and performs **Polling** (query `GET /api/onboarding/parse-status?jobId=task_9981` every 2 seconds) or receives progress via WebSocket/SSE.
  5. UI immediately displays real-time progress: *"Parsed 12 of 40 listings..."*.
  6. Upon task completion, frontend renders the completed property set.

> **UX Benefit:** The page doesn't hang, web connections don't time out, and the user experiences a live process with an accurate progress bar.

---

## ✅ Implementation Checklist

### Block 1 — Base Setup

- [x] Install dependencies: `zustand`, `axios`, `swr`, `zod`, `clsx`
- [x] Configure `tsconfig.json`: path aliases `@/components`, `@/lib`, `@/types`, `@/store`, `@/hooks`
- [x] Create `.env.local`: `BACKEND_URL`, `NEXT_PUBLIC_APP_DOMAIN`
- [x] Create `.env.example` with descriptions of all variables
- [x] Create base folder structure (placeholder files)
- [x] Create `types/auth.ts`, `types/niche.ts`, `types/lead.ts`, `types/api.ts`

### Block 2 — Dev Environment (Local Subdomain)

- [x] Add to Windows `hosts` file: `127.0.0.1 app.localhost`
- [x] Configure `next.config.ts`: in dev, forward `app.localhost:3000` as `app.*`
- [x] Verify: `http://app.localhost:3000/login` works independently from `http://localhost:3000`

### Block 3 — Auth Store + Axios Client

- [x] `store/auth.store.ts` — `{ user, accessToken, setTokens, setUser, clearAuth }`
- [x] `lib/api/client.ts` — Axios instance, baseURL=`/api`, `withCredentials: true`
- [x] Axios request interceptor: injects `Authorization: Bearer <accessToken>`
- [x] Axios response interceptor: 401 → POST `/api/auth/refresh` → retry original
- [x] "Silent refresh on startup" logic: on root layout mount → if `accessToken` is null → POST `/api/auth/refresh`
- [x] `hooks/useAuth.ts` — `{ user, isLoading, isAuthenticated, logout }`

### Block 4 — Next.js API Routes (Auth & Onboarding BFF)

- [x] `app/api/auth/login/route.ts` — proxies login, forwards Set-Cookie
- [x] `app/api/auth/register/route.ts` — registration without niche
- [x] `app/api/auth/logout/route.ts` — resets cookie
- [x] `app/api/auth/refresh/route.ts` — rotates access token
- [x] `app/api/auth/me/route.ts` — retrieves profile
- [x] `lib/api/onboarding.ts` — functions for all 7 onboarding steps via catch-all proxy
- [x] `app/api/[...proxy]/route.ts` — universal proxy (GET/POST/PUT/DELETE/PATCH)

### Block 5 — Proxy (previously Middleware)

- [x] `proxy.ts` — migrated from `middleware.ts` (Next.js 16 new standard)
- [x] Redirect `app.kvik.kz/` → `/dashboard`
- [x] Public paths (`/login`, `/register`) — pass through without check
- [x] Protected paths (`/dashboard`, `/onboarding`) — verify `refresh_token` cookie
- [x] If no cookie → redirect `/login?from=<pathname>`

### Block 6 — Auth Pages (UI)

- [x] `app/(auth)/layout.tsx` — glassmorphism layout with logo, glow effects, caption
- [x] `app/(auth)/login/page.tsx` — email+password form, `getOnboardingState()` check after login, redirect to `/dashboard` (DONE) or `/onboarding`
- [x] `app/(auth)/register/page.tsx` — email+password+confirmation form, redirect to `/onboarding`

### Block 7 — Onboarding (UI + Async Parsing Flow + Derived State)

- [x] `app/(onboarding)/layout.tsx` — header with logo and onboarding status
- [x] `app/(onboarding)/onboarding/page.tsx` — unified 7-step wizard via Derived State
- [x] `store/onboarding.store.ts` — Zustand store for all fields across all steps
- [x] **Step 0 (SELECT_NICHE):** three niche cards (Realty, Auto, Calendar)
- [x] **Step 1 (BUSINESS_PROFILE):** business profile form (name, city, phone, description, instagram)
- [x] **Step 2 (DATA_SOURCE):** Krisha User ID input (`POST /onboarding/step/data-source`)
- [x] **Step 3 (DATA_PREVIEW):** Polling `GET /onboarding/step/data-preview` every 2.5s, progress + property grid, `POST /onboarding/step/data-confirm`
- [x] **Step 4 (CONNECT_CHANNEL):** WhatsApp / Instagram cards
- [x] **Step 5 (QUALIFICATION):** qualification rule presets for niche
- [x] **Step 6 (COMPLETE_TEST):** AI test chat (mock), `POST /onboarding/step/complete` → `/dashboard`

### Block 8 — Dashboard (Skeleton)

- [x] `app/(dashboard)/layout.tsx` — Server Component with auth guard (refresh→me), redirect to `/login` on 401
- [x] Sidebar with dynamic navigation by `niche_profile` (different items for Realty/Auto/Calendar)
- [x] Topbar with AI agent activity indicator and subscription plan status
- [x] `app/(dashboard)/dashboard/page.tsx` — KPI cards, token usage plan
- [x] `lib/utils/niche.ts` — `getNicheLabel()`, `getNicheIcon()`, `getNicheNavItems()` by niche
- [x] `lib/utils/format.ts` — `formatKZT()`, `formatDate()`, `formatRelativeTime()`

---

## 📝 All Open Questions CLOSED ✅

| # | Question | Answer / Technical Solution |
|:--|:---------|:----------------------------|
| 1 | **JWT vs Opaque Token** | ✅ **JWT Access (15 min) + Refresh Cookie (7 days)** |
| 2 | **Access Token Storage** | ✅ **Zustand store (in-memory)** — no localStorage / cookies |
| 3 | **Auth & Onboarding Domain** | ✅ **`app.kvik.kz/login`, `/register`, `/onboarding`** |
| 4 | **Krisha / Kolesa Parsing** | ✅ **Async Jobs (BullMQ)**: POST returns `{ jobId }`, frontend polls status |
| 5 | **Re-visiting `/onboarding`** | ✅ **Check via `getState()`**: if `'DONE'` → redirect to `/dashboard`, otherwise resume incomplete step |
| 6 | **Niche upon Registration** | ✅ **Registration without niche**. Niche is selected at Step 0 of onboarding (`SELECT_NICHE`) |
