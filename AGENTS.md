<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Development Guidelines

## 1. General Implementation Rules

- **Modularity & File Size:** Never exceed 400 lines per file. Split complex views into focused sub-components. Follow DRY principles.
- **Product Context & Specifications:** Reference `dev_docs/` for domain specifications, feature architecture, and business logic.
- **Backend API Contracts:** Treat `openapi.json` as the authoritative source of truth for all backend endpoints, HTTP methods, request payloads, query params, and response DTOs. Always inspect or grep `openapi.json` before writing API integration code or TypeScript types.

---

## 2. Design Aesthetics & Component System (Enterprise Standard)

- **Aesthetic Standard:** Strictly **Modern Minimalist Light SaaS** (inspired by MoonAI, Linear Light, and Stripe).
  - Pure white card surfaces (`bg-card` / `bg-white`), subtle off-white sidebar (`#F8F9FA`), and ultra-fine borders (`border-border/80`).
  - Crisp typography: Google `Inter` font with Cyrillic + Latin support. Deep slate headings (`text-foreground` / `#0F172A`), muted metadata (`text-muted-foreground` / `#64748B`). Use `tabular-nums` for all numbers, dates, prices, and metrics.
- **Anti-AI Rules (Strictly Prohibited):**
  - **No AI visual effects:** Zero gradient text, zero glowing borders, zero `animate-ping` / radar pulse rings.
  - **No paragraph bloat:** Keep page headings concise (20–24px bold) with at most a 1-line subtitle or none.
  - **No visual clutter:** Never nest borders within gray bordered cards. Never render duplicate page title banners below the topbar.
- **Single Accent Color Rule:**
  - Signature brand accent is **MoonAI Violet** (`#7C3AED` / `var(--primary)`).
  - Used **strictly in 5 places**: (1) active nav item tint + icon, (2) primary CTA buttons, (3) active toggle switches, (4) primary badges, (5) focus rings. Everything else is white, slate, or neutral gray.
- **Component Primitives Reuse:**
  - **UI Primitives (`components/ui/*`):** `Button`, `Input`, `Textarea`, `Badge`, `Dialog`, `Sheet`, `Popover`, `Table`, `Card`, `SegmentedTabs`, `Toaster`.
  - **Shared Dashboard Components (`components/dashboard/shared/*`):** `DashboardPageHeader` (underline/pill tabs), `StatCard` (KPI metrics), `SectionCard` (content panels), `StatusBadge` (entity states), `WorkspaceSwitcher`.
  - **Zero Custom CSS Files:** Use standard Tailwind utility classes directly.
  - **Snappy Transitions:** Use `FadeIn.tsx` and `motion` with subtle 0.15s–0.25s durations.

---

## 3. Navigation Architecture

- **Global Sidebar (210px):** Fixed width, exactly **6 core destinations** (`/overview`, `/inbox`, `/calendar`, `/clients`, `/ai-studio`, `/settings`). Active item gets a soft violet tint pill (`bg-primary/10 text-primary font-semibold`).
- **Contextual Top Tabs:** Secondary domain workflows live in horizontal tabs inside `DashboardPageHeader` (2px underline active indicator), never in nested sidebars.

---

## 4. Translation & Localization Rules

The platform supports Russian (`ru`) and English (`en`). `locales/ru/` and `locales/en/` are the sources of truth.

ALL THE TEXTS USED WITHIN THE PLATFORM MUST FOLLOW TRANSLATION SYSTEM:

- **UI String Resolution:** Always resolve strings via `useTranslations('<namespace>')` or `getTranslations('<namespace>')` from `next-intl`. Never hardcode raw text directly in TSX.
- **Adding Keys:** Add new keys with values to `locales/translation_keys_new.json` (or `backend_new_keys.json` for `api.json`).
- **Applying Keys (Execute Twice):** When applying translations, you must execute the script twice — once for Russian and once for English:
  1. `node scripts/apply-translation-keys.mjs ru` (with Russian values in input files)
  2. `node scripts/apply-translation-keys.mjs en` (with English values in input files)
  3. `node scripts/export-translation-keys.mjs`
- **File Access:** Do not manually break JSON structures — prefer merging keys consistently across both locales.

---

## 5. Communication & Language

Use English for development notes, technical comments, and chat explanations. All text rendered to end-users in UI components must follow the localization system (`next-intl`).