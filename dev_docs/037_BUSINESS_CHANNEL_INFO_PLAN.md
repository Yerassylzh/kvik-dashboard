# 037 — Connected Business Details & Channel Integrations Plan

> **Document Type:** Feature Architecture & Frontend Implementation Plan  
> **Status:** Active / Ready for Implementation  
> **Target Module:** Channel Integrations (`app/(dashboard)/integrations/page.tsx`, `components/dashboard/integrations/*`)  
> **Author:** Frontend Lead & System Architect  

---

## 1. Executive Summary & Goals

The **Channel Integrations** page (`/integrations`) is the central operational hub where businesses connect their communication gateways (WhatsApp Cloud API, Instagram Direct, Telegram Bot) and observe the end-to-end synchronization between their real-world enterprise profile, booking schedule, knowledge base, and AI assistant.

This plan details the architecture and implementation for displaying comprehensive, clean, and beautifully structured **Connected Business Details** alongside rich **Channel Integration Cards** using authoritative backend endpoints.

### Key Objectives:
1. **Rich Business Identity & Verification:** Present business profile information (`businessName`, `nicheProfile`, `subSegment`, `city`, `country`, `businessPhone`, `businessEmail`, `businessAddress`, `websiteUrl`, `instagramUrl`, `timezone`, `teamSize`) fetched via `GET /api/v1/knowledge-base/profile`.
2. **Channel Identity & Technical Metadata:** Display verified Meta profile names, Instagram profile avatars and handles, WhatsApp verified business names, WhatsApp Business Account (WABA) IDs, Phone Number IDs, Code Verification Status, and Quality Ratings (`GREEN`, `YELLOW`, `RED`) from `GET /api/v1/channels`.
3. **Operational Schedule Visibility:** Showcase the configured weekly working schedule templates, operating hours per day, open/closed days, and booking slot duration (minutes) from `GET /api/v1/workspaces/schedule`.
4. **AI Assistant Context Readiness:** Present a snapshot of synced services, price lists, FAQs, and knowledge entries stored in the AI assistant from `GET /api/v1/knowledge-base/entries` and `GET /api/v1/knowledge-base/stats`.
5. **Modern Minimalist Light SaaS Aesthetics:** Adhere strictly to MoonAI/Stripe design rules (pure white card surfaces, `#F8F9FA` backgrounds, ultra-fine borders, MoonAI violet `#7C3AED` accent, `tabular-nums` formatting, zero gradient text or visual clutter).
6. **Modularity & 400 LOC Limits:** Keep all components strictly under 400 lines of code with atomic separation of concerns.
7. **Full Bilingual Localization:** Provide complete Russian (`ru`) and English (`en`) support through `next-intl`.

---

## 2. Backend API Contracts & Data Sourcing

| Endpoint | HTTP Method | Data Provided & UI Usage |
| :--- | :--- | :--- |
| `/api/v1/channels` | `GET` | List of connected channels (`WHATSAPP`, `INSTAGRAM`, `TELEGRAM`) with verified names, external account IDs, WABA IDs, Quality Ratings, Instagram avatars, Telegram usernames, token expiration dates. |
| `/api/v1/knowledge-base/profile` | `GET` | Workspace business profile (company name, niche, sub-segment, phone, email, address, city, country, website, social links, team size, timezone, last update). |
| `/api/v1/workspaces/schedule` | `GET` | Business weekly schedule templates (`dayOfWeek`, `isOpen` / `isWorking`, `startTime`, `endTime`, `slotDuration` / `slotDurationMinutes`) and date overrides. |
| `/api/v1/knowledge-base/entries` | `GET` | Synced knowledge entries, catalog services, manual notes, price lists, and business context items powering the AI engine. |
| `/api/v1/knowledge-base/stats` | `GET` | Summary statistics of indexed chunks, entries by type, vector store status, and AI engine readiness. |

---

## 3. Architecture & Component Decomposition

```
components/dashboard/integrations/
├── IntegrationsPage.tsx               # Main page layout & orchestrator (< 100 LOC)
├── IntegrationsSummaryKpis.tsx        # Top 4 summary KPI metric cards (< 150 LOC)
├── ConnectedBusinessCard.tsx          # Rich business identity, contact, & schedule hero card (< 250 LOC)
├── BusinessSchedulePreview.tsx        # Compact weekly hours visualizer (< 150 LOC)
├── BusinessServicesPreview.tsx        # Synced services & AI context badge list (< 150 LOC)
hooks/
└── useBusinessOverview.ts             # Unified SWR hook for profile, channels, schedule, & KB (< 150 LOC)
components/dashboard/settings/channels/
├── ChannelsManager.tsx                # Channels container & health / disconnect handler (< 250 LOC)
└── ChannelCard.tsx                    # Individual channel card with rich metadata (< 300 LOC)
```

---

## 4. UI / UX Design Specifications

### 4.1. Top-Level Summary KPIs (`IntegrationsSummaryKpis.tsx`)
- **Connected Channels:** e.g., `2 / 3 Channels Active` (Status: Emerald badge when channels are active).
- **Meta & WhatsApp Status:** e.g., `WABA Verified • High Quality` or `Setup Required`.
- **Operating Schedule:** e.g., `Mon–Sat 09:00–19:00 • 60m Slots`.
- **AI Knowledge Sync:** e.g., `X Services & Rules Synced`.

### 4.2. Connected Business Profile Hero (`ConnectedBusinessCard.tsx`)
1. **Header Row:**
   - Entity monogram / avatar with verified badge.
   - Company name in bold slate (`text-foreground text-base sm:text-lg`).
   - Category tags: `Niche Profile` (e.g. `BEAUTY`), `Sub-segment` (e.g. `Barbershop`), `Location` (`Almaty, KZ`), `Timezone` (`Asia/Almaty`).
   - Business description summary.
2. **Operational Metadata Grid (3 Responsive Columns):**
   - **Column 1 — Contact & Web Presence:**
     - Clickable phone link (`tel:` with Phone icon).
     - Clickable email link (`mailto:` with Mail icon).
     - Physical location address (with MapPin icon).
     - Website link with external open icon.
     - Instagram profile link.
   - **Column 2 — Operating Schedule & Slot Duration:**
     - Today's open/closed indicator badge.
     - Weekly schedule summary pill list (Mon through Sun).
     - Slot booking duration (`slotDurationMinutes` e.g., 60 min).
   - **Column 3 — AI Assistant Readiness & Scale:**
     - Team size badge (`teamSize` specialists).
     - Knowledge base sync badge.
     - Last updated timestamp formatted with `tabular-nums`.
3. **Quick Action Bar:**
   - Button to Edit Business Settings (`/settings/workspace`).
   - Button to Manage Knowledge Base & Services (`/knowledge-base`).

### 4.3. Enhanced Messaging Channel Cards (`ChannelCard.tsx`)
- **Instagram Direct:**
  - Account profile picture (`profilePictureUrl`) with Instagram badge overlay.
  - Verified Name (`name` or `pageName`) and `@username` handle.
  - Account ID (`instagramId`) with mono styling.
  - Token expiration badge (warning if $\le 7$ days, critical if expired).
  - One-click Health Check and Disconnect/Reconnect flows.
- **WhatsApp Cloud API:**
  - Phone number in `tabular-nums` formatting (`displayPhoneNumber`).
  - Verified Business Name (`verifiedName`).
  - WhatsApp Business Account ID (`wabaId`) and Phone Number ID (`phoneNumberId`).
  - Quality Rating Badge:
    - `GREEN` $\rightarrow$ Emerald pill ("High Quality / Высокое качество").
    - `YELLOW` $\rightarrow$ Amber pill ("Medium Quality / Среднее качество").
    - `RED` $\rightarrow$ Rose pill ("Low Quality / Низкое качество").
  - Verification Status: `VERIFIED` pill.
- **Telegram Bot:**
  - Telegram bot icon, Bot name (`botFirstName`), `@botUsername`, Bot ID, and quick link to `https://t.me/<botUsername>`.

---

## 5. Technical Implementation Steps

1. **Types Update (`types/channels.ts` & `types/knowledgeBase.ts`):**
   - Extend `WhatsAppChannelMetadata` with `qualityRating` and `codeVerificationStatus`.
   - Ensure `InstagramChannelMetadata` has `profilePictureUrl`, `name`, `igUsername`, `instagramId`.
   - Ensure `BusinessProfileDto` has all fields aligned with backend DTOs.

2. **Unified Data Hook (`hooks/useBusinessOverview.ts`):**
   - Create SWR-driven hook that concurrently fetches `/knowledge-base/profile`, `/channels`, `/workspaces/schedule`, and `/knowledge-base/entries`.
   - Provide refresh and mutation capabilities.

3. **Sub-Components Creation:**
   - Implement `IntegrationsSummaryKpis.tsx`.
   - Implement `BusinessSchedulePreview.tsx`.
   - Implement `BusinessServicesPreview.tsx`.
   - Implement `ConnectedBusinessCard.tsx`.

4. **Enhance `ChannelCard.tsx` & `ChannelsManager.tsx`:**
   - Add rich visual badges (Quality rating, WABA ID, Instagram profile avatar, Telegram bot link, Token expiry countdown).

5. **Assemble `IntegrationsPage.tsx`:**
   - Integrate the hero card, KPI cards, and channel cards into a clean dashboard layout.

6. **Localization & Scripts:**
   - Add all new Russian and English keys to `locales/translation_keys_new.json`.
   - Run `node scripts/apply-translation-keys.mjs ru`.
   - Run `node scripts/apply-translation-keys.mjs en`.
   - Run `node scripts/export-translation-keys.mjs`.

7. **Verification & Quality Checks:**
   - Verify line limits using `node scripts/verify-loc.mjs`.
   - Verify zero lint/type errors.
