# 024 — Overview Dashboard Redesign & Readability Refactor

> **Status:** ✅ Implemented
> **Touches:** `components/dashboard/overview/*`, `locales/translation_keys_new.json`
> **Reference Design:** Modern Minimalist Light SaaS (Linear / Stripe / MoonAI Enterprise Standard)

---

## 1. Overview & Objectives

The `/overview` dashboard is the primary landing view for business owners and operators using Kvik.ai. While all backend API endpoints are functional and wired up, the initial UI suffered from:
1. **Double Metric Stacking:** 7 isolated stat boxes stacked in 2 layers consuming 40% of viewport height without context.
2. **AI-Like Elements:** Gimmicky badges like "Онлайн 24/7" and full-width nested gray boxes.
3. **Candy Box Containers:** Giant tinted pastel banners in the channel distribution card (`bg-emerald-500/10`, `pink`, `sky`) violating the clean slate/white design system.
4. **Low-Readability Rainbow Funnel:** Multi-color thick bars with artificial 4% minimum widths for zero-value steps.
5. **Empty State & Table Asymmetry:** Blank white void for bookings and unstyled dashes in staff workload.

### Key Goals:
- **100% Data Preservation:** Keep every single metric and backend data point intact (AI bot vs manager counts, conversion rate, channels, funnel stages, bookings, staff analytics).
- **Remove "Online 24/7" Badge:** Eliminate the AI-like gimmick as requested.
- **Unified Telemetry & KPI Flow:** Compact, sleek AI operational strip + crisp 4-column KPI cards.
- **Linear/Stripe Minimalist Aesthetics:** Clean cards, subtle borders (`border-border/80`), `tabular-nums` for all numbers, zero nested tinted candy boxes.
- **High Information Density & Visual Balance:** Purposeful empty states, multi-segment channel distribution bar, and refined step-by-step sales funnel.

---

## 2. Implementation Checklist

- [x] **Step 1: Localization & Strings Update**
  - [x] Add necessary Russian translation keys to `locales/translation_keys_new.json` (traffic share, empty state prompt, channel headers).
  - [x] Run `node scripts/apply-translation-keys.mjs` and `node scripts/export-translation-keys.mjs`.

- [x] **Step 2: AI Operational Strip (`AiAgentStatusCard.tsx`)**
  - [x] Remove "Онлайн 24/7" badge.
  - [x] Remove "Тестовый диалог" button as requested.
  - [x] Eliminate nested gray card boxes (`bg-muted/40`).
  - [x] Refactor into a sleek, single-row high-density operational banner:
    - Left: Bot icon + "ИИ-Ассистент" + active description.
    - Right: Telemetry pills for Automation Rate (`X%`), Bot Answers (`N`), and Intercepts (`N`, highlighted if > 0).

- [x] **Step 3: KPI Metrics Grid (`KpiGrid.tsx`)**
  - [x] Standardize typography and spacing on 4 core KPI cards.
  - [x] Enforce `tabular-nums` and uniform brand violet icon styling with helpful sublabels.

- [x] **Step 4: Refined Conversion Funnel (`LeadFunnelChart.tsx`)**
  - [x] Remove multi-color rainbow bars.
  - [x] Implement Linear-style monochromatic/violet progression bars.
  - [x] Fix zero-value rendering (no artificial 4% stubs on 0 counts).
  - [x] Display step-to-step dropoff and conversion percentages clearly.

- [x] **Step 5: Today's Bookings Card (`TodayBookings.tsx`)**
  - [x] Polish appointment rows with formatted time, client avatar, service, and status badge.
  - [x] Upgrade empty state: purposeful icon, explanatory text, and quick action to open calendar.

- [x] **Step 6: Minimalist Channel Distribution (`ChannelDistributionCard.tsx`)**
  - [x] Remove the 3 pastel candy boxes (`bg-emerald-500/10`, `pink`, `sky`).
  - [x] Add an elegant multi-segment traffic proportion bar at top.
  - [x] Render clean list rows with official brand icons, proper Russian grammar, and `tabular-nums`.

- [x] **Step 7: Staff Workload Table (`StaffWorkloadTable.tsx`)**
  - [x] Remove unpredictable "Доходимость" column as requested.
  - [x] Keep strictly verifiable metrics: **Специалист**, **Всего записей**, and **Выполнено**.
  - [x] Update description to "Распределение записей по специалистам".
  - [x] Refine table column alignments and padding.

- [x] **Step 8: Page Assembly & Layout Spacing (`OverviewPage.tsx`)**
  - [x] Integrate clean header with smooth period selector pills.
  - [x] Ensure balanced vertical rhythm and responsive grid layout.

- [x] **Step 9: Quality Verification**
  - [x] Run `npx tsc --noEmit` to verify type safety.
  - [x] Verify ESLint passes cleanly on overview components without errors or warnings.
