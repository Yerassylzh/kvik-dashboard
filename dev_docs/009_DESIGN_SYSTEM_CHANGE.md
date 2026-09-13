# 009 — Enterprise Design System & Layout Architecture

**Status:** APPROVED & ACTIVE  
**Audience:** Frontend Engineers, UI/UX Designers, Product Architects  
**Core Reference:** Dashboard Layout, Viewport Constraints, Skeletons, Scrollbars, Scalable Settings Architecture

---

## 1. Executive Summary & Design Philosophy

Kvik is an enterprise-grade AI operations platform for service businesses. Every interaction, transition, scroll container, and loading state must exhibit high fidelity and deterministic behavior comparable to tier-1 enterprise SaaS (Linear, Stripe, Vercel, Supabase).

### Core Principles

1. **High Information Density & Visual Restraint:** Clean typography, subtle borders, high data density without visual clutter or redundant decorative badges.
2. **Zero Emojis & Strict Vector Iconography:** Casual emojis (💅, 🤖, 🛠, ✨, 📅) are strictly banned across all translations, badges, tooltips, and forms. Use curated Lucide vector SVG icons only.
3. **Skeleton-First Asynchronous Loading:** Never display hardcoded `0`, `0 ₸`, or empty tables while API requests are pending. Every metric, chart, and list must render an animated, pulsing skeleton placeholder.
4. **Universal Sleek Scrollbars:** Default chunky browser scrollbars and nested double horizontal/vertical scroll tracks are eliminated. Scrollbars must use ultra-thin 5px rounded thumbs with zero background track footprint.
5. **Clean Button Contracts:** Button icons are rendered strictly as JSX/SVG elements (`<Plus className="w-3.5 h-3.5" />`). Translation strings must never include text symbols (e.g. `+`, `->`, `*`, `💾`), preventing double icon rendering.
6. **Future-Proof Scalable Settings Hierarchy:** Settings must scale gracefully as new AI features, integration channels, knowledge sources, and workflows are added without creating cramped, rigid forms.

---

## 2. Layout & Viewport Architecture

```
+-----------------------------------------------------------------------------------+
|  VIEWPORT (100vh, overflow-hidden)                                                |
| +----------------------+--------------------------------------------------------+ |
| | SIDEBAR (w-64, 100vh)| MAIN CONTENT CONTAINER (flex-1, h-screen, flex-col)    | |
| |                      | +----------------------------------------------------+ | |
| | - Logo (Kvik.ai)     | | STICKY TOPBAR (h-14, backdrop-blur-md)             | | |
| | - Niche Pill Capsule | +----------------------------------------------------+ | |
| | - Primary Nav Items: | | MAIN SCROLL AREA (flex-1, overflow-y-auto)         | | |
| |   * Обзор (/overview)| |                                                    | | |
| |   * Диалоги (/inbox) | | - Page Header (Title + Breadcrumbs + Primary Action| | |
| |   * Лиды (/leads)    | | - Interactive KPI Grid & Skeletons                 | | |
| |   * Записи (/bookings| | - Data Panels / Charts / Multi-Column Kanban       | | |
| |   * Тариф (/billing) | |                                                    | | |
| |   * Настройки        | |                                                    | | |
| |                      | |                                                    | | |
| | - User Profile (Pin) | |                                                    | | |
| +----------------------+--------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

### 2.1 Sidebar Containment (`h-screen sticky top-0`)
- **Dimensions:** Width `w-64` (256px), Height `h-full` within a `100vh` window.
- **Footer Pinning:** The user profile capsule (avatar, email, role, and logout trigger) is anchored at the bottom inside the viewport.
- **Removed Elements:** The bulky "Tarif" widget is moved out of the sidebar footer and promoted to its own dedicated `/billing` page.
- **Niche Pill:** Clean text badge with `Building2` icon, no gradients or emojis.

### 2.2 Scrollbar Standards (`globals.css`)
- Global scrollbars applied via `*::-webkit-scrollbar` with:
  - Width/Height: `5px`.
  - Track: `transparent`.
  - Thumb: `hsl(var(--border) / 0.8)` with hover `hsl(var(--muted-foreground) / 0.5)` and `rounded-full`.
- Eliminates nested double scrollbars on wide Kanban boards and calendar tables.

---

## 3. Data Loading & Skeleton Protocol

When data fetching is in progress (`isLoading === true`):

| Component Area | Anti-Pattern (Banned) | Required Pattern |
| :--- | :--- | :--- |
| **KPI Stat Cards** | Rendering `0` or `0 ₸` | `<Skeleton className="h-7 w-20 rounded-md" />` |
| **AI Status Rate** | Rendering `0%` / `0 ответов` | `<Skeleton className="h-6 w-14 rounded-md mx-auto" />` |
| **Lead Funnel** | Empty blank container | 4 animated pulsing progress bars with label skeletons |
| **Today's Bookings** | Immediate "На сегодня записей нет" | 3 skeleton card rows with avatar and badge placeholders |
| **Channel Breakdown** | Flat zero bars | 3 skeleton percentage bar rows |
| **Staff Workload** | Empty table | 3 skeleton table rows with column cells |

---

## 4. Button & Iconography Standards

### 4.1 Button Text & Icon Separation
- **Rule:** Never embed raw icons or character glyphs into translation JSON.
  - **INCORRECT:** `"new_booking_btn": "+ Создать запись"` (results in `+ + Создать запись`).
  - **CORRECT:** `"new_booking_btn": "Создать запись"`.
- **Button JSX Pattern:**
  ```tsx
  <Button size="sm" onClick={...} className="gap-1.5 text-xs whitespace-nowrap shrink-0">
    <Plus className="w-3.5 h-3.5 shrink-0" />
    <span>{t("bookings.new_booking_btn")}</span>
  </Button>
  ```
- **Base Classes:** `inline-flex items-center justify-center font-semibold whitespace-nowrap shrink-0`.

---

## 5. Scalable Settings Architecture Plan (Point 4)

### 5.1 The Challenge of Scale
As Kvik evolves, settings expand to include:
1. **Organization & Profile:** Basic business profile, locations, working hours, timezone, multi-branch switching.
2. **AI Intelligence Suite:** Prompt personality, temperature/model switches, Live Overflow rules, multi-step follow-ups.
3. **Knowledge Base & Layer 2 Macro Context:** Business context JSON, document uploads (PDF/DOCX), 2GIS crawlers, website scraping, semantic search testing.
4. **Messaging Channels & Webhooks:** WhatsApp Cloud API, Instagram Graph API, Telegram Bots, custom webhooks.
5. **Team & RBAC:** Staff members, master services, availability schedules, permission tiers.
6. **Developer & Integrations:** API keys, webhook event logs, mock messaging simulator, raw prompt debuggers.

### 5.2 Enterprise Hub & Segmented Tab Architecture

To prevent cramped, rigid 2-column forms where one card holds unrelated inputs, the Settings module will follow a **Two-Tier Hub Architecture**:

```
/settings (Overview Hub / Direct Category Links)
   │
   ├── /settings/workspace        [Общие настройки компании и локации]
   ├── /settings/channels         [Интеграции: WhatsApp / Instagram / Telegram]
   ├── /settings/staff            [Сотрудники, расписание и доступность]
   ├── /settings/ai-agent         [ИИ-Агент: Промпт, Стиль, Live Overflow, Дожимы]
   ├── /settings/business-context [Контекст бизнеса L2: Услуги, Цены, Правила, BullMQ AI]
   └── /settings/advanced         [Инструменты разработчика, Mock-симулятор, Диагностика]
```

### 5.3 Page-Level Visual Layout Standard for Settings
Each domain sub-page follows a unified, full-width structured container:
1. **Page Header:** Title, scope description, and global page actions (e.g. Save / Regenerate).
2. **Segmented Top Tabs (when page has sub-domains):**
   - E.g. in `/settings/ai-agent`: `[ Инструкции и промпт ] [ Правила перехвата ] [ Тестовая песочница ]`
3. **Card-Based Vertical Flow (`SectionCard`):**
   - Max width: `max-w-4xl` for optimal reading line length.
   - Logical chunking into 2-3 focused cards with clear titles and subtitles.
   - Floating / sticky save bar with state feedback (Loading spinner -> Emerald checkmark).

---

## 6. Enterprise Quality Checklist

- [ ] **Zero Emojis:** Verified in `locales/ru/*.json` and all TSX components.
- [ ] **No `0` on Loading:** All metrics and charts render shimmering Skeletons during pending API requests.
- [ ] **Sleek 5px Scrollbars:** Global thin scrollbar styling active without double tracks.
- [ ] **No Double Button Icons:** All buttons have clean single SVG icons and clean translation labels.
- [ ] **Fixed Viewport Sidebar:** Sidebar fits within 100vh with pinned user profile capsule.
- [ ] **Dedicated Billing Page:** `/billing` accessible from primary sidebar.
- [ ] **Modular Code:** Every component is under 400 lines of code.
- [ ] **Compilation Integrity:** `npx tsc --noEmit` and `npm run build` pass with 0 errors.
