# 057 — Main App Frontend Implementation Guide for Spec 055 (Concierge Onboarding & Impersonation)

> **Target Audience:** Frontend Developers implementing the **Main Client Web App** (`app.kvik.io` / `localhost:3000`)  
> **Source Specs:** `dev_docs/055_SUPERADMIN_AND_CONCIERGE_ONBOARDING_SPEC.md`, `dev_docs/056_EXPLANATION_OF_055_FOR_SUPERADMIN_DASH.md`  
> **Status:** 🎯 Definitive Frontend Implementation Specification  

---

## 1. Executive Summary & Required Additions

To support Concierge Onboarding and Superadmin God-Mode Impersonation, the **Main Client Application** needs **three specific additions**:

```
Main Client Application Additions
├── 1. The Claim Workspace Landing Page (/claim-workspace?token=...)
│   └── Validates claim token, lets client set password, claims workspace, routes to Step 4.
│
├── 2. The Auth Handoff Route (/auth/handoff?token=...&refreshToken=...)
│   └── Ingests impersonation tokens from Superadmin Portal, hydrates session, routes to Onboarding/Dashboard.
│
└── 3. The God-Mode Impersonation Banner (Sticky Top Bar)
    └── Visual indicator shown when user.isSuperAdmin === true with an "Exit to Admin Portal" button.
```

---

### 1.1 The Crucial Distinction: `/auth/handoff` vs `/claim-workspace`

It is vital not to confuse `/auth/handoff` with `/claim-workspace`. They serve completely different actors at completely different stages of the lifecycle:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                     THE TWO ROUTES ARE FOR TWO COMPLETELY DIFFERENT PEOPLE                  │
│                                                                                             │
│  1. /auth/handoff      👉 FOR THE SUPERADMIN (You).                                         │
│                           • Used BEFORE the client ever sees the workspace.                 │
│                           • Ingests Superadmin tokens to prepare knowledge in God-Mode.     │
│                           • Does NOT ask for passwords or transfer ownership.               │
│                                                                                             │
│  2. /claim-workspace   👉 FOR THE CLIENT (Business Owner).                                  │
│                           • Used AFTER the workspace is ready.                              │
│                           • Client sets their password, takes legal ownership of the        │
│                             workspace, and lands on Step 4 (WhatsApp QR Code).              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Side-by-Side Comparison Matrix

| Dimension | `/auth/handoff` (Superadmin Impersonation) | `/claim-workspace` (Client Handover) |
|---|---|---|
| **Who accesses this?** | **Platform Superadmin / Operator (You)** | **The Client (e.g. Salon Owner, Realtor)** |
| **When is it triggered?** | **At the start** (preparation phase) | **At the end** (handover phase) |
| **How do they arrive?** | By clicking *"Impersonate"* in the Admin Dashboard | By clicking the invite link in their **Email** |
| **Does it prompt for password?** | ❌ **No**. Superadmin is already authenticated. | ✅ **Yes**. Client sets a password to create their account. |
| **Workspace Ownership state** | Temporarily owned by **Superadmin**. | Permanently transferred to **Client** (`ownerId = client.id`). |
| **Next action taken** | Run scrapers, upload PDFs, confirm knowledge (Steps 0–3). | Connect WhatsApp QR code / Instagram OAuth (Step 4). |

---

## 2. Feature 1: The Claim Workspace Page (`/claim-workspace`)

### 2.1 Overview & URL Contract
When a superadmin finishes setting up a client's knowledge base (Steps 0–3), the backend emails the client an invitation link:
```
https://app.kvik.io/claim-workspace?token=b4d8a178-54cb-4a57-b088-726e64c399a1
```

The Main App must provide a dedicated public route `/claim-workspace` that extracts the `token` query parameter and guides the user through activation.

---

### 2.2 Component Lifecycle & States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         /claim-workspace?token=...                          │
│                                                                             │
│ 1. ON MOUNT: Call GET /auth/claim-workspace?token=...                       │
│    ├── Loading: Show clean skeleton / spinner                               │
│    ├── Error (400/Expired/Invalid): Show Error View (Invalid Token)         │
│    └── Success (200 OK): Inspect response -> { valid, userExists, ... }     │
│                                                                             │
│ 2. RENDER FORM BASED ON userExists:                                         │
│    ├── IF userExists === false (New Client):                                │
│    │   • Show Workspace / Business Name badge                               │
│    │   • Show Client Email (Read-only / disabled input)                     │
│    │   • Password & Confirm Password inputs                                 │
│    │   • Button: "Activate Workspace & Connect Channels"                    │
│    │                                                                        │
│    └── IF userExists === true (Existing User):                              │
│        • Show "Welcome back! Enter your password to link this workspace"    │
│        • Password input                                                     │
│        • Button: "Claim & Sign In"                                          │
│                                                                             │
│ 3. ON SUBMIT: Call POST /auth/claim-workspace { token, password }           │
│    ├── Save tokens to Auth Store (access_token & refresh_token)             │
│    └── Navigate to /onboarding (or /dashboard)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 API Contracts for Claiming

#### A. Validate Token (On Mount)
- **Endpoint:** `GET /auth/claim-workspace?token=${token}`
- **Access:** Public
- **Response (200 OK):**
  ```json
  {
    "valid": true,
    "workspaceId": "ws_salon_123",
    "workspaceName": "Salon Elite",
    "businessName": "Salon Elite Almaty",
    "email": "owner@salonelite.kz",
    "userExists": false
  }
  ```
- **Error Responses (400 Bad Request):**
  - `auth.claim_token_invalid`: Token not found or malformed.
  - `auth.claim_token_expired`: Token expired (7-day window passed).

#### B. Submit Claim (Form Submission)
- **Endpoint:** `POST /auth/claim-workspace`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "token": "b4d8a178-54cb-4a57-b088-726e64c399a1",
    "password": "ClientSecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "usr_client_uuid",
      "email": "owner@salonelite.kz",
      "isEmailVerified": true
    },
    "workspace": {
      "id": "ws_salon_123",
      "name": "Salon Elite"
    },
    "role": "OWNER",
    "tokens": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "eyJhbGciOi..."
    }
  }
  ```

---

### 2.4 Reference Frontend Component Implementation (React / Next.js / Vue)

```tsx
// Example: src/pages/claim-workspace.tsx or src/app/claim-workspace/page.tsx
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

export default function ClaimWorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [claimData, setClaimData] = useState<{
    workspaceName: string;
    businessName: string;
    email: string;
    userExists: boolean;
  } | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (!token) {
      setErrorKey('auth.claim_token_invalid');
      setLoading(false);
      return;
    }

    api.get(`/auth/claim-workspace?token=${token}`)
      .then((res) => {
        setClaimData(res.data);
      })
      .catch((err) => {
        setErrorKey(err.response?.data?.code || 'auth.claim_token_invalid');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!claimData?.userExists && password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/claim-workspace', {
        token,
        password,
      });

      // Save user & tokens into auth store
      setAuth({
        user: res.data.user,
        tokens: res.data.tokens,
        workspace: res.data.workspace,
        role: res.data.role,
      });

      // Navigate to onboarding wizard (derived state will jump to Step 4)
      router.push('/onboarding');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to claim workspace');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Verifying invitation link...</div>;
  }

  if (errorKey) {
    return (
      <div className="error-card">
        <h2>Invitation Link Invalid or Expired</h2>
        <p>This workspace invitation is no longer active. Please contact support or your account manager for a new link.</p>
      </div>
    );
  }

  return (
    <div className="claim-card">
      <div className="badge">AI Assistant Ready</div>
      <h1>Claim your workspace: {claimData?.workspaceName}</h1>
      <p>Your AI assistant knowledge base has been pre-configured. Complete setup to connect WhatsApp or Instagram.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={claimData?.email} disabled />
        </div>

        <div className="form-group">
          <label>{claimData?.userExists ? 'Enter your password' : 'Create a password'}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
          />
        </div>

        {!claimData?.userExists && (
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
            />
          </div>
        )}

        {formError && <div className="error-text">{formError}</div>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Activating...' : 'Activate & Connect Channel'}
        </button>
      </form>
    </div>
  );
}
```

---

## 3. Feature 2: The Auth Handoff Route (`/auth/handoff`)

### 3.1 Why It's Needed
When a Superadmin is in the **Admin Dashboard** (`admin.kvik.io` or port `3001`) and clicks **"Impersonate"** on a workspace:
1. The Admin Dashboard receives scoped tokens (`workspaceId: targetId`, `role: OWNER`).
2. The Admin Dashboard opens the **Main Client App** (`app.kvik.io` or port `3000`) at `/auth/handoff`:
   ```
   https://app.kvik.io/auth/handoff?token=<access_token>&refreshToken=<refresh_token>
   ```
3. The Main App ingests these tokens, writes them to localStorage/cookies, cleans up the browser address bar, and opens the Onboarding Wizard (or Dashboard).

---

### 3.2 Handoff Page Implementation Contract

```tsx
// Example: src/pages/auth/handoff.tsx or src/app/auth/handoff/page.tsx
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

export default function AuthHandoffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken) {
      router.replace('/auth/login');
      return;
    }

    // 1. Store tokens in auth store / local storage / cookie
    setTokens(accessToken, refreshToken || '');

    // 2. Clean URL immediately to prevent token exposure in history
    window.history.replaceState({}, document.title, window.location.pathname);

    // 3. Hydrate session & determine destination
    api.get('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (meRes) => {
        // 4. Check onboarding progress for the target workspace
        const stateRes = await api.get('/onboarding/state', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (stateRes.data.completed) {
          router.replace('/dashboard');
        } else {
          router.replace('/onboarding');
        }
      })
      .catch(() => {
        router.replace('/auth/login');
      });
  }, [router, searchParams, setTokens]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="spinner mb-2" />
        <p>Switching into workspace session...</p>
      </div>
    </div>
  );
}
```

---

## 4. Feature 3: Superadmin God-Mode Impersonation Banner

When a Superadmin is operating inside the Main Client App via impersonation, they should have clear visual feedback and a one-click way to return to the Admin Portal.

### 4.1 Banner Specification
* **Trigger Condition:** `user.isSuperAdmin === true` (obtained from `GET /auth/me` or decoded JWT payload).
* **Placement:** Fixed sticky bar at the very top of the layout (`z-index: 9999`).
* **Visual Style:** Distinct warning/admin color (e.g., dark slate with amber accent: `#1e293b` with `#f59e0b`).
* **Content:**
  - Label: `⚠️ Superadmin God-Mode: Impersonating [Workspace Name] (Owner Privileges)`
  - Action Button: `"Exit to Admin Portal"`
    - Action: Redirects to `ADMIN_PORTAL_URL` (e.g., `https://admin.kvik.io/workspaces` or `http://localhost:3001/workspaces`).

### 4.2 Banner Component Example

```tsx
// components/GodModeBanner.tsx
import React from 'react';
import { useAuthStore } from '@/stores/auth.store';

export function GodModeBanner() {
  const { user, workspace } = useAuthStore();

  if (!user?.isSuperAdmin) return null;

  const handleExit = () => {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
    window.location.href = `${adminUrl}/workspaces`;
  };

  return (
    <div className="bg-slate-900 text-amber-400 px-4 py-2 text-sm flex items-center justify-between border-b border-amber-500/30 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="font-bold">⚡ SUPERADMIN GOD-MODE:</span>
        <span>
          Operating in <strong>{workspace?.name || 'Client Workspace'}</strong> with full Owner privileges.
        </span>
      </div>
      <button
        onClick={handleExit}
        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1 rounded text-xs transition"
      >
        Exit to Admin Portal ↗
      </button>
    </div>
  );
}
```

---

## 5. Feature 4: Seamless Onboarding State Integration (Step 4 Drop-in)

The backend uses a **Deterministic Derived State Engine** (`GET /onboarding/state`).

### How Onboarding Router Must Behave:
When the client claims their workspace or logs in, the Main App's `/onboarding` page calls `GET /onboarding/state`:

```json
{
  "step": "CONNECT_CHANNEL",
  "stepIndex": 4,
  "completed": false
}
```

#### Important Rule for the Onboarding Wizard:
* **DO NOT** reset or force the user to Step 0 if earlier steps (`nicheProfile`, `businessName`, `knowledgeConfirmed`) are already satisfied in the database.
* The router must inspect `state.step`:
  - `SELECT_NICHE` (Step 0) -> Render Niche selection screen.
  - `BUSINESS_PROFILE` (Step 1) -> Render Business profile form.
  - `DATA_SOURCE` (Step 2) -> Render Scraper & upload inputs.
  - `DATA_PREVIEW` (Step 3) -> Render Parsed data preview & confirm button.
  - `CONNECT_CHANNEL` (Step 4) -> **Render WhatsApp QR Code & Instagram OAuth screen.**
  - `QUALIFICATION` (Step 5) -> Render Lead qualification settings.
  - `DONE` -> Redirect to `/dashboard`.

Because the superadmin already confirmed Step 3, the client seamlessly lands straight on **Step 4 (Connect WhatsApp QR Code)** without ever seeing or having to re-do scrapers or uploads!

---

## 6. Summary Checklist for Main App Frontend Developers

- [ ] **1. Claim Workspace Landing Page (`/claim-workspace`):**
  - [ ] Extract `token` from URL query parameters.
  - [ ] Fetch `GET /auth/claim-workspace?token=${token}` on mount.
  - [ ] Handle invalid / expired token error state.
  - [ ] If `userExists === false`, show password creation form.
  - [ ] If `userExists === true`, show existing user password verification form.
  - [ ] On submit: `POST /auth/claim-workspace` with `{ token, password }`.
  - [ ] Store returned JWT tokens and navigate to `/onboarding`.

- [ ] **2. Auth Handoff Route (`/auth/handoff`):**
  - [ ] Extract `token` & `refreshToken` from query params.
  - [ ] Store tokens into client auth store.
  - [ ] Clean up URL history using `window.history.replaceState`.
  - [ ] Hydrate session via `GET /auth/me` and inspect `GET /onboarding/state`.
  - [ ] Route to `/onboarding` (if not completed) or `/dashboard` (if completed).

- [ ] **3. God-Mode Impersonation Banner:**
  - [ ] Check if `user.isSuperAdmin === true`.
  - [ ] Render sticky top banner indicating active workspace impersonation.
  - [ ] Add "Exit to Admin Portal" button redirecting back to the Superadmin Dashboard.

- [ ] **4. Onboarding Derived State Verification:**
  - [ ] Confirm `/onboarding` reads `GET /onboarding/state` dynamically and mounts the exact `step` returned (`CONNECT_CHANNEL`).
