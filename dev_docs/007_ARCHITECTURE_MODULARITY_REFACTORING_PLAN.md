# 007. Architecture Modularity & Scalability Refactoring Plan

## 1. Executive Summary & Goals

As Kvik prepares for upcoming feature additions (**Interactive Qualification Builder**, **Unified Inbox**, **Calendar Integration with Google & Altegio/YCLIENTS**, **Automated 24/72h Follow-ups**, and **Live Overflow**), the frontend codebase must transition from a rapid-prototype structure into a **clean, modular, debuggable, and scalable architecture**.

### Core Architecture Objectives

1. **Strict Line Count & Responsibility Limits**: Keep every single component under 300 LOC (well below the project max of 400 LOC). Isolate parsing, data transformation, and async side effects from presentation markup.
2. **Atomic UI Component System**: Establish reusable design tokens and UI primitives in `@/components/ui/` (`Button`, `Input`, `Select`, `Textarea`, `Badge`, `SegmentedTabs`, `Modal`) to replace duplicated inline Tailwind classes.
3. **DRY Async & Cross-Window Hooks**: Extract duplicated OAuth window/postMessage/BroadcastChannel listeners and manual `setInterval` polling loops into centralized, reusable React hooks (`useOAuthChannel`, `usePolling`).
4. **100% Translation Compliance**: Eliminate all hardcoded UI strings in Auth and Dashboard views, routing all user-facing text through `next-intl` (`locales/ru/*.json`).
5. **Preservation of Legacy Assets**: Keep `components/**/_legacy/` intact for future reference while ensuring active code contains zero unreferenced dead files.

---

## 2. Architectural Blueprint & Target Directory Structure

```
kvik/
├── app/
│   ├── (auth)/             # Authentication routes (login, register)
│   ├── (dashboard)/        # Main application dashboard (Overview, Inbox, CRM, Settings)
│   ├── (onboarding)/       # Onboarding step wizard & OAuth callbacks
│   └── api/                # BFF proxy and token refresh endpoints
│
├── components/
│   ├── ui/                 # ⭐️ Reusable Design System Primitives
│   │   ├── button.tsx      # Multi-variant button (primary, secondary, outline, ghost, loading)
│   │   ├── input.tsx       # Standardized input with label, error, helperText, and icons
│   │   ├── textarea.tsx    # Textarea with auto-rows, validation borders, and counter
│   │   ├── select.tsx      # Standardized select dropdown
│   │   ├── badge.tsx       # Semantic badges (success, warning, destructive, info)
│   │   ├── tabs.tsx        # Segmented pill controls & filter tabs
│   │   ├── toast/          # Global animated toast notifications
│   │   └── motion/         # Framer Motion transitions (FadeIn, Stagger, etc.)
│   │
│   ├── onboarding/         # Onboarding Step Components (<250 LOC each)
│   │   ├── knowledge/      # 2GIS, Website, Documents, Notes, Preview
│   │   │   ├── KnowledgeEntryCard.tsx      # Pure presentational card
│   │   │   ├── BusinessContextSummary.tsx  # AI summary card
│   │   │   ├── Stage2gis.tsx
│   │   │   ├── StageWebsite.tsx
│   │   │   ├── StageDocuments.tsx
│   │   │   └── StageNotes.tsx
│   │   └── channel/        # WhatsApp, Instagram, Telegram flows & stepper
│   │       ├── WhatsAppFlow.tsx        # Uses useOAuthChannel
│   │       ├── InstagramFlow.tsx       # Uses useOAuthChannel
│   │       ├── TelegramFlow.tsx
│   │       └── OAuthCallbackView.tsx   # Reusable OAuth callback screen
│   │
│   └── dashboard/          # Dashboard Widgets & Views
│
├── hooks/                  # ⭐️ Reusable Hooks Layer
│   ├── useAuth.ts          # Session management & token lifecycle
│   ├── usePolling.ts       # Unified backoff-capable polling hook
│   ├── useOAuthChannel.ts  # Cross-window / BroadcastChannel / popup lifecycle hook
│   └── useOnboardingFlow.ts# Onboarding state machine & action orchestrator
│
├── lib/
│   ├── api/                # Typed REST API clients (auth, channels, onboarding)
│   ├── utils/              # Pure utility functions (zero React dependencies)
│   │   ├── format.ts       # formatBytes, formatPhone, formatCurrency
│   │   ├── knowledge-parser.ts # Extracted pure parsers for KB entries
│   │   └── oauth.ts        # OAuth URL builders & callback resolvers
│   └── i18n/               # i18n configuration & transformers
│
└── store/                  # Zustand global state (auth, onboarding)
```

---

## 3. High-Level Modular Design

### 3.1. Reusable OAuth Hook (`useOAuthChannel`)
Instead of duplicating ~130 lines of `window.addEventListener('message')`, `BroadcastChannel('kvik_auth_channel')`, `window.addEventListener('storage')`, and popup polling in both `WhatsAppFlow.tsx` and `InstagramFlow.tsx`:
- Created `hooks/useOAuthChannel.ts`.
- Encapsulates popup opening, popup close detection, and multi-channel code delivery (postMessage + BroadcastChannel + localStorage).
- Standardized signature:
  ```ts
  const { isWaiting, isConnecting, error, openOAuthPopup } = useOAuthChannel({
    channelType: 'WHATSAPP' | 'INSTAGRAM',
    onSuccess: (channelMetadata) => void,
    onCodeReceived: async (code) => Promise<Channel>,
  });
  ```

### 3.2. Pure Knowledge Parser (`lib/utils/knowledge-parser.ts`)
- Extracted `extractStructuredText()`, `extractServicesList()`, `cleanEntryTitle()`, `formatBytes()`, and `getFileIcon()` from components into a standalone utility file.
- Benefits:
  - Shrinks `KnowledgeEntryCard.tsx` down to ~270 LOC and `StageDocuments.tsx` to ~240 LOC.
  - Zero JSX dependencies, completely unit-testable.

### 3.3. Reusable UI Primitive Library (`components/ui/`)
- Built accessible primitives:
  - `<Input label="..." error="..." helperText="..." {...props} />`
  - `<Textarea label="..." rows={3} {...props} />`
  - `<Select label="..." options={[...]} {...props} />`
  - `<Button variant="primary" loading={loading}>Submit</Button>`
  - `<Badge variant="success">Connected</Badge>`
  - `<SegmentedTabs activeTab={tab} onChange={setTab} tabs={[...]} />`

### 3.4. Resilient Polling Hook (`usePolling`)
- Replaced uncoordinated `setInterval`/`setTimeout` loops across `Stage2gis`, `StageWebsite`, and `StageNotes`.
- Provides automatic cleanup on unmount, active condition checks, and error boundaries.

---

## 4. Master Implementation Checklist

### Phase 1: Dead Code Cleanliness & Parser Extraction
- [x] Remove unreferenced file `components/onboarding/knowledge/StageConclusion.tsx` (431 LOC dead duplicate).
- [x] Remove unreferenced file `components/onboarding/knowledge/KnowledgeStepperHeader.tsx` (unused).
- [x] Create `lib/utils/knowledge-parser.ts` and move parsing helpers (`extractStructuredText`, `extractServicesList`, `cleanEntryTitle`, `formatBytes`, `getFileIcon`).
- [x] Refactor `components/onboarding/knowledge/KnowledgeEntryCard.tsx` to import from `lib/utils/knowledge-parser.ts` (reduce to <275 LOC).
- [x] Verify `npm run build` passes with zero errors.

### Phase 2: Design System Primitives (`components/ui/`)
- [x] Create `components/ui/button.tsx` (with variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`, `success`, `loading`).
- [x] Create `components/ui/input.tsx` (with `label`, `error`, `helperText`, `addon`).
- [x] Create `components/ui/textarea.tsx` (with `label`, `error`, `helperText`).
- [x] Create `components/ui/select.tsx` (with `label`, `options`, `error`).
- [x] Create `components/ui/badge.tsx` (with semantic variants: `success`, `warning`, `destructive`, `info`, `muted`, `pulse`).
- [x] Create `components/ui/tabs.tsx` (reusable segmented pill selector).
- [x] Refactor `components/onboarding/StepBusinessProfile.tsx` using new UI primitives.
- [x] Refactor `components/onboarding/StepQualification.tsx` using new UI primitives.
- [x] Refactor `app/(auth)/login/page.tsx` and `app/(auth)/register/page.tsx` using new UI primitives.

### Phase 3: Channel OAuth & Ingestion Hook Abstractions
- [x] Create `hooks/useOAuthChannel.ts` (encapsulating popup lifecycle, postMessage, BroadcastChannel, localStorage synchronization).
- [x] Create `components/onboarding/channel/OAuthCallbackView.tsx` (reusable UI and broadcast logic for callback popups).
- [x] Refactor `components/onboarding/channel/WhatsAppFlow.tsx` to use `useOAuthChannel`.
- [x] Refactor `components/onboarding/channel/InstagramFlow.tsx` to use `useOAuthChannel`.
- [x] Refactor `app/(onboarding)/onboarding/whatsapp-callback/page.tsx` to use `OAuthCallbackView`.
- [x] Refactor `app/(onboarding)/onboarding/instagram-callback/page.tsx` to use `OAuthCallbackView`.
- [x] Create `hooks/usePolling.ts` for declarative polling with safe cleanup.
- [x] Refactor `Stage2gis.tsx`, `StageWebsite.tsx`, and `StageNotes.tsx` to use `usePolling`.

### Phase 4: Page Decomposition & i18n Translation Alignment
- [x] Refactor `app/(auth)/login/page.tsx` to resolve all UI copy from `useTranslations('auth')`.
- [x] Refactor `app/(auth)/register/page.tsx` to resolve all UI copy from `useTranslations('auth')`.
- [x] Refactor `app/(dashboard)/layout.tsx` and `app/(dashboard)/page.tsx` to use `next-intl` translation keys (`useTranslations('dashboard')`).
- [x] Clean up redundant state passing in `app/(onboarding)/onboarding/page.tsx` by delegating step orchestration to `hooks/useOnboardingFlow.ts` (reduced from 363 to 110 LOC).
- [x] Extract `components/onboarding/knowledge/BusinessContextSummary.tsx` from `StepDataPreview.tsx` (reduced from 330 to 269 LOC).
- [x] Execute `npm run build` and verification scripts to verify 100% type safety, zero errors, and all active files <300 LOC.

---

## 5. Verification & Success Criteria

1. **Zero files exceeding 300 LOC** (outside configuration and schema definitions). [VERIFIED: 0 files > 300 LOC, largest is 288 LOC]
2. **Zero TypeScript compilation warnings or lint errors** (`npm run build` exits 0). [VERIFIED: Next.js 16 build exits 0]
3. **Clean Component Hierarchy**: UI primitives in `components/ui/`, pure business functions in `lib/utils/`, hooks in `hooks/`. [VERIFIED]
4. **Preservation**: All files inside `components/onboarding/_legacy/` and `components/dashboard/_legacy/` remain untouched. [VERIFIED]
5. **No Regressions**:
   - Authentication flow (login, register, session refresh) functions smoothly.
   - Onboarding flow (Step 1 through Step 7) advances without errors.
   - WhatsApp, Instagram, and Telegram connections trigger popups and receive credentials reliably.
   - 2GIS, Website, Documents, and Notes ingestion processes correctly.
