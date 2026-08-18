# 002 — Unified Frontend & Backend Translation (i18n) Architecture

> **Target:** Frontend & Fullstack Developers  
> **Framework:** Next.js 16 (App Router) + `next-intl` + Axios Interceptor  
> **Status:** Configured and Active  

---

## 1. 🎯 Architectural Overview

The translation architecture strictly separates **UI Presentation Translations** (static labels, buttons, navigation) from **Backend Dynamic Responses** (API errors, validation messages, job statuses).

```
                              ┌─────────────────────────────┐
                              │  Active Locale ('ru'/'en')  │
                              └──────────────┬──────────────┘
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   │                                                   │
                   ▼                                                   ▼
     ┌───────────────────────────┐                       ┌───────────────────────────┐
     │      UI Translations      │                       │    Backend Translations   │
     │   (next-intl Subsystem)   │                       │ (Axios Interceptor Layer) │
     ├───────────────────────────┤                       ├───────────────────────────┤
     │ • Server: getTranslations │                       │ • Request: Accept-Language│
     │ • Client: useTranslations │                       │ • Response: Recursive     │
     │ • Sources: auth.json,     │                       │   code -> message replace │
     │   common.json, etc.       │                       │ • Source: api.json        │
     └─────────────┬─────────────┘                       └─────────────┬─────────────┘
                   │                                                   │
                   └─────────────────────────┬─────────────────────────┘
                                             ▼
                              ┌─────────────────────────────┐
                              │    Unified Localized UI     │
                              └─────────────────────────────┘
```

---

## 2. 📂 Directory & Namespace Structure

All translation files are organized by locale code under `locales/`:

```
locales/
├── ru/
│   ├── api.json         # Backend response codes & server validation errors
│   ├── common.json      # Shared buttons, status badges, loaders ("Save", "Cancel")
│   ├── auth.json        # Login, registration, password reset forms & titles
│   ├── onboarding.json  # Onboarding steps, wizard copy, helper hints
│   └── dashboard.json   # Sidebar items, widget titles, KPI labels
│
├── en/
│   ├── api.json
│   ├── common.json
│   ├── auth.json
│   ├── onboarding.json
│   └── dashboard.json
│
└── kk/                  # Kazakh (ready for expansion)
```

---

## 3. 🌐 Backend Response Translation (Axios Interceptor)

### 3.1 Envelope Contract
The backend emits structured responses:
```typescript
interface I18nPayload {
  code: string;                             // Translation key, e.g. "auth.invalid_credentials" or "raw"
  message: string;                          // English fallback
  isRaw?: boolean;                          // true for external/AI output (bypasses translation)
  params?: Record<string, string | number>; // e.g. { min: 6 }
  errors?: Record<string, I18nPayload>;     // Form field errors map
}
```

### 3.2 Automated Client Interception
In `lib/api/client.ts`:
1. **Request Interceptor:** Automatically appends `Accept-Language: <currentLocale>` to notify the backend of the client preference.
2. **Response Interceptor:** Recursively runs `transformI18nMessages(data)` on both HTTP `2xx` responses and HTTP `4xx/5xx` errors.
3. If `isRaw !== true`, it resolves the `code` against `locales/<locale>/api.json` and updates `.message` in-place before reaching component code or `catch (err)`.

---

## 4. 🖥️ Frontend UI Translation (`next-intl`)

### 4.1 Server Components
```tsx
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard.nav');
  return <h1>{t('inbox')}</h1>;
}
```

### 4.2 Client Components
```tsx
'use client';

import { useTranslations } from 'next-intl';

export function LoginButton() {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common.buttons');

  return (
    <button>
      {t('submit_button')} — {tCommon('continue')}
    </button>
  );
}
```

---

## 5. 🔄 Switching Active Language

When a user switches language (e.g. from Russian to English):

```typescript
import { setCurrentLocale } from '@/lib/i18n/config';

// 1. Sets active locale for Axios requests + updates NEXT_LOCALE cookie
setCurrentLocale('en');

// 2. Reload or router.refresh() to re-render server & client components
window.location.reload();
```

---

## 6. ➕ Adding a New Language (e.g. Kazakh `kk`)

1. **Create locale folder:** `locales/kk/` with `api.json`, `common.json`, `auth.json`, `onboarding.json`, `dashboard.json`.
2. **Register locale code:** Add `'kk'` to `SUPPORTED_LOCALES` in `lib/i18n/config.ts` and `SupportedLocale` in `types/i18n.ts`.
3. **Import API dictionary:** Register `kkApi` in `API_DICTIONARIES` in `lib/i18n/config.ts`.
