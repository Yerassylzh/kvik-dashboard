# Team Page (/team) Redesign & Bug Fixes

## 1. Problem Diagnosis

### Issue A: Staff Logo / Avatar ("The logo of the staff looks too...")
- **Current State:** Avatars in `components/ui/avatar.tsx` rely on high-saturation neon gradients (`bg-gradient-to-tr from-violet-500 to-pink-400`, etc.). For names like "Ерасыл Жасуланов", it renders a harsh fuchsia/magenta circle with bold white text.
- **Root Cause & Violations:**
  - Violates the Modern Minimalist Light SaaS standard (inspired by MoonAI, Linear Light, and Stripe).
  - Violates the **Single Accent Color Rule** (`#7C3AED` / `var(--primary)`) by introducing arbitrary loud gradients.
  - `StaffRow.tsx` and `TeamShiftsTab.tsx` do not pass `src={member.avatarUrl ?? undefined}` to `EntityAvatar`, ignoring uploaded profile photos.
- **Solution:**
  - Replace the cartoonish gradients with an elegant, subtle SaaS palette: soft tinted backgrounds with tone-on-tone text and fine borders (e.g. MoonAI violet tint `bg-primary/10 text-primary border border-primary/20`, neutral slate `bg-slate-100 text-slate-700 border border-slate-200/80`, or subtle pastel tints: slate, violet, emerald, sky, amber, indigo).
  - Add rounded-xl or refined circular shapes with crisp typography and subtle borders.
  - Ensure `EntityAvatar` properly accepts and prioritizes `src={member.avatarUrl}` with graceful fallback.

---

### Issue B: 3-Dots Action Menu Overlay / Clipping Bug
- **Current State:** The 3 vertical dots icon on the right side of the staff widget is misaligned, has a mismatched height (28px vs 32px for the schedule button), different border opacities (`border-border/40` vs `border-border/60`), and when clicked or rendered, gets clipped or overlayed by another design layer.
- **Root Cause & Violations:**
  - The menu dropdown is rendered via a manual `absolute top-9 right-0 z-30` div inside a parent `SectionCard` container configured with `overflow-hidden`.
  - When the dropdown opens (especially with 1 or 2 staff members), the dropdown is clipped by the card's boundary overflow, making it cut off or appear hidden behind card edges.
  - A manual full-screen backdrop (`fixed inset-0 z-20`) was used for click-outside dismissal, which creates layering conflicts and traps clicks.
  - The button itself is unstyled and misaligned with the neighboring "График" button.
- **Solution:**
  - Build a robust Radix UI Dropdown Menu component (`@radix-ui/react-dropdown-menu` with `<DropdownMenu.Portal>`) so the menu floats in the document body at `z-50`, completely immune to any parent `overflow-hidden` or stacking context.
  - Standardize button geometry: equalize heights to 32px (`h-8`), consistent borders (`border-border/80`), matching hover/active states, and keyboard accessibility.
  - Present quick action "График" and the 3-dots action button in a clean, unified actions cluster.

---

### Issue C: Duplicate Header, Redundant CTA Buttons & Nested Card Borders
- **Current State:**
  - `TeamPage.tsx` renders `DashboardPageHeader` with title "Команда и специалисты", description, roster count badge, horizontal tabs, and "+ Добавить специалиста" primary CTA.
  - Directly beneath the header, `StaffList.tsx` renders a `SectionCard` with an identical title "Команда и специалисты", redundant description, and another "+ Добавить сотрудника" CTA button.
  - Two modals (`StaffInviteModal`) were independently instantiated on the same page.
  - `SectionCard` has a hardcoded `max-w-4xl` which artificially constrains the roster width and misaligns it with the full-width header.
  - Inside `SectionCard`, each staff member is another bordered card (`rounded-2xl bg-card border`), creating nested card-inside-card visual clutter.
- **Root Cause & Violations:**
  - Directly violates Anti-AI Rules in `AGENTS.md`:
    - *"Never nest borders within gray bordered cards."*
    - *"Never render duplicate page title banners below the topbar."*
    - *"No paragraph bloat."*
- **Solution:**
  - Remove the redundant `SectionCard` wrapper and duplicate "+ Добавить сотрудника" button from `StaffList.tsx`. The page header already contains the primary CTA "+ Добавить специалиста".
  - Eliminate the duplicate `StaffInviteModal` state.
  - Present the roster as a clean, polished, full-width list of specialist cards (or modern unified table/card surface) with search/filter capabilities.
  - Fix `TeamShiftsTab.tsx` and `TeamVacationsTab.tsx` to eliminate redundant titles and `max-w-4xl` misalignments.

---

### Issue D: Information Hierarchy & Visual Polish in StaffRow
- **Current State:** Staff name, badges, and metadata (phone, email, specializations) are plain and wrap clumsily.
- **Solution:**
  - Polished avatar (with image or refined initials).
  - Bold, crisp specialist name with role pill (`bg-primary/10 text-primary border border-primary/20`) and invite status pill (`bg-emerald-500/10 text-emerald-700` or `bg-amber-500/10 text-amber-700`).
  - Sleek metadata row with muted icons for phone, email, and position.
  - Quick action cluster: `[ (Clock) График ]` + `[ ⋮ ]` with portal dropdown options:
    - Редактировать профиль (Pencil)
    - График и доступность (Calendar)
    - Отправить / Переотправить приглашение (Mail)
    - Отозвать приглашение / Деактивировать (X / Trash - Destructive)

---

## 2. Implementation Checklist

- [x] **1. Refactor Avatar Component (`components/ui/avatar.tsx` & `EntityAvatar.tsx`)**
  - Replace saturated AI gradients with refined, minimalist tone-on-tone SaaS palette.
  - Support `avatarUrl` images with graceful fallback.
  - Polish initials sizing, font weight, borders, and rounded corners.

- [x] **2. Create/Standardize Radix Dropdown Menu Primitive (`components/ui/dropdown-menu.tsx`)**
  - Implement Radix UI Dropdown Menu with `<DropdownMenu.Portal>` to prevent `overflow-hidden` clipping.
  - Smooth animation, keyboard accessibility, outside click dismiss, and automatic collision alignment.

- [x] **3. Redesign StaffRow (`components/dashboard/settings/staff/StaffRow.tsx`)**
  - Wire up Radix DropdownMenu for 3-dots actions.
  - Align heights, borders, and styling of "График" button and 3-dots button.
  - Pass `src={member.avatarUrl}` to `EntityAvatar`.
  - Polish typography, badges, metadata icons, and hover states.

- [x] **4. Redesign StaffList (`components/dashboard/settings/staff/StaffList.tsx`)**
  - Remove duplicate `SectionCard` wrapper, title, subtitle, and duplicate CTA.
  - Remove redundant `StaffInviteModal` instance.
  - Add quick search filter ("Быстрый поиск мастера...") for fast specialist lookups.
  - Remove nested bordered card clutter.

- [x] **5. Harmonize TeamPage & Other Tabs (`TeamPage.tsx`, `TeamShiftsTab.tsx`, `TeamVacationsTab.tsx`)**
  - Remove `max-w-4xl` constraints and redundant title banners.
  - Ensure cohesive, unified Modern Minimalist SaaS appearance across all tabs.

- [x] **6. Quality Verification & Testing**
  - Verify TypeScript compilation (`npm run build`).
  - Verify no visual overlaps, clipping, or styling regressions.
