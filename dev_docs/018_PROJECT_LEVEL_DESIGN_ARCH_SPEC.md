# 018 — Project-Level Frontend Design & Information Architecture Specification

> **Document Type:** Comprehensive Frontend Information Architecture (IA), Layout Taxonomy & UX Strategy  
> **Status:** Specification & Vision Document  
> **Target Audience:** Product Designers, Frontend Engineers, Full-Stack Developers, Technical Leads  
> **Aesthetic Standard:** Modern Minimalist Light SaaS (Linear + Stripe + MoonAI standard)  
> **Primary Business Domain:** Omnichannel AI Operations & Appointment Automation Suite (Salons, Medical/Dental Clinics, Service Studios, SMBs)  

---

## 1. Executive Vision & Architectural Rationale

### 1.1 Context & Current UX Challenges
The Kvik frontend has established strong component primitives, crisp typography (Google Inter), unified color tokens (MoonAI Violet `#7C3AED`, pure white card surfaces, off-white sidebars, fine slate borders), and robust backend API integrations. However, the macro-level information architecture faces several critical user experience challenges:
1. **Navigation Ambiguity & Fragmented Features:** Essential workflows are split across overlapping or ambiguous routes (e.g., *Where do clinic working hours live vs. master shift schedules? Where does Follow-up automation belong vs. AI Studio? Are Channels under Settings or Integrations?*).
2. **Surface Type Confusion:** Lack of a rigid distinction between what belongs in a **full-page view**, a **contextual top tab**, a **slide-over drawer (Sheet)**, an **action modal (Dialog)**, or a **quick popover**.
3. **Cognitive Overload for Non-Technical Operators:** Small business operators (administrators, head doctors, receptionists) must not be forced to navigate nested technical jargon (prompts, RAG chunks, BullMQ queues, webhooks). Everything must map to immediate business outcomes: *"Диалоги"*, *"Записи"*, *"Клиенты"*, *"График"*, *"ИИ-Ассистент"*.
4. **Scattered Settings Experience:** Settings are currently split between `/settings/workspace`, `/settings/channels`, `/settings/account`, `/settings/advanced`, while some workspace configuration lives in `/schedule`, `/team`, and `/integrations`.

---

### 1.2 Core Design Tenets
The design architecture is governed by four non-negotiable principles:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CORE ARCHITECTURAL TENETS                                    │
├───────────────────────────────┬────────────────────────────────┬───────────────────────────────┤
│ 1. Radical Minimalist Clarity │ 2. The "30-Second Rule"        │ 3. 3-Pane Workspace Standard  │
├───────────────────────────────┼────────────────────────────────┼───────────────────────────────┤
│ • Zero visual clutter         │ • Any daily operational task  │ • Left: Selector / Queue List │
│ • No nested multi-box borders │   (reply to client, check      │ • Center: Primary Work Canvas │
│ • 1 primary brand accent:     │   schedule, book slot, review  │ • Right: Slide-over Inspector │
│   MoonAI Violet (#7C3AED)     │   leads) is completed in       │   Drawer (never navigate away │
│ • Pure white & clean slate    │   ≤ 2 clicks / 30 seconds.     │   to view entity details)     │
└───────────────────────────────┴────────────────────────────────┴───────────────────────────────┘
```

---

### 1.3 The Three Mental Spaces
To ensure clean mental modeling for both users and developers, the entire application is divided into **3 distinct mental spaces**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  KVIK FRONTEND MENTAL SPACES                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
   │
   ├── 🟢 1. DAILY OPERATIONS (Front-Desk & Reception Cockpit)
   │      ├── 💬 Входящие (`/inbox`) — Omnichannel chat, live overflow, human takeover
   │      ├── 📅 Календарь (`/calendar`) — Appointments, master daily matrix, slot conflicts
   │      └── 👥 Клиенты и CRM (`/clients`) — Pipeline kanban, customer 360, contact history
   │
   ├── 🟣 2. AI INTELLIGENCE & GROWTH (Autonomous Brain & Automations)
   │      ├── 🧠 ИИ-Студия (`/ai-studio`) — Knowledge base, tone of voice, screening, live sandbox
   │      ├── ⚡ Авто-дожим (`/automations`) — 24h/72h cold recovery, appointment reminders, 2GIS reviews
   │      └── 🔍 Аналитика и Инсайты (`/insights` & `/overview`) — Funnel conversion, drop-off analysis
   │
   └── ⚪ 3. WORKFORCE & GOVERNANCE (Business Infrastructure & Settings)
          ├── 🏢 График и Команда (`/schedule` & `/team`) — Operating hours, specialists, shifts
          ├── 🔌 Интеграции (`/integrations`) — WhatsApp QR, Instagram Direct, Telegram, Google Calendar
          └── ⚙️ Настройки (`/settings`) — Company profile, security, personal account, dev tools
```

---

## 2. Global Shell & Layout Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                GLOBAL SHELL TOPOLOGY                                                 │
├───────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────┤
│  GLOBAL SIDEBAR (210px)       │  MAIN CONTENT WORKSPACE                                                              │
│  Fixed Left Rail              ├──────────────────────────────────────────────────────────────────────────────────────┤
│                               │  GLOBAL HEADER (52px Minimalist Topbar)                                              │
│  🏢 [ Beauty Clinic Alm... ▼] │  [ Breadcrumb / Page Title ]       [ 🔍 Поиск (Cmd+K) ]      [ 🔔 (3) ]  [ ⚙️ ]  [ 👤 ]│
│                               ├──────────────────────────────────────────────────────────────────────────────────────┤
│  ОПЕРАЦИИ                     │  PAGE HEADER & CONTEXTUAL TABS (DashboardPageHeader)                                 │
│  ├── 💬 Входящие          (3) │  Title: "Календарь и записи"                    [ + Новая запись ]  [ Фильтр мастеров ]│
│  ├── 📅 Календарь             │  [ 📅 Матрица дня ]   [ 🗓️ Неделя ]   [ 📋 Список записей ]   [ ⚙️ График филиала ]     │
│  └── 👥 Клиенты и CRM         ├──────────────────────────────────────────────────────────────────────────────────────┤
│                               │                                                                                      │
│  ИИ И РОСТ                    │  3-PANE PRIMARY WORKSPACE CANVAS:                                                    │
│  ├── 🧠 ИИ-Студия             │  ┌──────────────────────┬───────────────────────────────┬──────────────────────────┐ │
│  ├── ⚡ Авто-дожим            │  │ Left Queue / Filter  │ Center Canvas Area            │ Right Inspector Drawer   │ │
│  └── 📊 Аналитика             │  │ (300px)              │ (Flexible flex-1)             │ (380px Slide-Over Sheet) │ │
│                               │  │                      │                               │                          │ │
│  УПРАВЛЕНИЕ                   │  │ • Channel filter     │ • Multi-staff calendar grid   │ • Client 360 Card        │ │
│  ├── 👥 Команда               │  │ • Unread list        │   or Chat message stream      │ • Appointment details    │ │
│  ├── 🔌 Интеграции            │  │ • Quick search       │   or CRM Kanban columns       │ • Live Prompt Inspector  │ │
│  └── ⚙️ Настройки             │  └──────────────────────┴───────────────────────────────┴──────────────────────────┘ │
│                               │                                                                                      │
│  ───────────────────────────  │                                                                                      │
│  ❓ Поддержка (Telegram / Docs)│                                                                                      │
└───────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.1 Global Sidebar (210px Fixed Width)
The sidebar is the persistent vertical backbone of the application. It is strictly **210px wide**, rendered in `#F8F9FA` with ultra-fine border `border-border/70`.

#### Structure & Grouping Rationale:
To avoid both a flat 12-item list and deep confusing submenus, the sidebar features **3 clear functional clusters** with standard, easily recognizable icons and real-time badge counters:

| Functional Cluster | Item | Route | Badge Indicator | Primary User Value |
| :--- | :--- | :--- | :--- | :--- |
| **ОПЕРАЦИИ** | **💬 Входящие** | `/inbox` | Unread count (`getTotalUnread()`) | Realtime client chat, handoff toggle, manager composer |
| *(Daily Cockpit)* | **📅 Календарь** | `/calendar` | Today's pending bookings | Multi-master matrix, day/week views, booking conflicts |
| | **👥 Клиенты** | `/clients` | New leads count | Pipeline kanban, client history, CRM data |
| **ИИ И РОСТ** | **🧠 ИИ-Студия** | `/ai-studio` | — | Knowledge base, persona, qualification rules, sandbox |
| *(Intelligence)* | **⚡ Авто-дожим** | `/automations` | Active sequences count | 24h/72h cold recovery, appointment reminders, 2GIS |
| | **📊 Аналитика** | `/overview` or `/insights` | — | Funnel conversion, revenue attribution, bot SLA |
| **УПРАВЛЕНИЕ** | **👥 Команда** | `/team` | — | Specialists list, roles, individual master shifts |
| *(Governance)* | **🔌 Интеграции** | `/integrations` | Channel status indicator (🔴/🟢) | WhatsApp QR/Cloud, Instagram Direct, Telegram, Cal sync |
| | **⚙️ Настройки** | `/settings` | — | Company profile, permissions, account, security |
| *(Developer Mode)* | **💻 Dev Simulator** | `/dev-messaging` | Active only if `isDevMode === true` | Synthetic message injector for local testing |

#### Sidebar Footer Elements:
1. **Workspace Switcher:** Positioned at the very top of the sidebar below the logo. Allows 1-click branch switching (e.g., *"Алматы Центр"*, *"Астана Левый берег"*).
2. **Help & Support (`❓ Поддержка`):** Triggers a clean modal with direct links to Telegram Technical Support, Docs portal, and Support Email.

---

### 2.2 Global Minimalist Header (52px Topbar)
The topbar (`h-13` / 52px) provides persistent contextual awareness and global utilities without occupying valuable vertical space.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [🏢 Филиал: Алматы Центр]  /  Календарь и записи      [ 🔍 Поиск клиентов, записей... ]        │
│                                                   [ 🔔 (3) ]  [ 🔌 Каналы ]  [ ⚙️ ]  [ 👤 Анна ]│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Header Component Specifications:
1. **Left Area (Contextual Breadcrumbs & Title):**
   - Displays current Workspace name + Active Page label.
   - For `/inbox` or `/ai-studio`, displays live status pills (e.g., `🟢 ИИ-Ассистент активен`, `⚡ WhatsApp подключен`).
2. **Center Area (Global Omni-Search `Cmd + K`):**
   - Universal search input with keyboard shortcut tooltip.
   - Searches across: Client Names, Phone Numbers, Booking IDs, Knowledge Base FAQs.
3. **Right Utility Cluster:**
   - **Notification Bell (`🔔`):** Displays real-time badge. Clicking opens the **Notification Popover Feed** (see Section 5.4).
   - **Channel Status Indicator:** Quick pill indicating connection health of WhatsApp / Instagram.
   - **Settings Gear (`⚙️`):** Quick navigation shortcut to `/settings`.
   - **User Profile Pill & Avatar (`👤`):** Displays user initials, name, and opens a dropdown with: *"Мой профиль"*, *"Сменить пароль"*, *"Выйти из системы"*.

---

### 2.3 Contextual Top Tabs (`DashboardPageHeader`)
Secondary workflows within a domain are organized horizontally inside `DashboardPageHeader` using **2px underline active indicator tabs** (`border-primary text-primary font-semibold`), never in nested sidebars.

- Keeps the visual depth flat and predictable.
- Preserves full horizontal real estate for dense data tables and calendar matrices.
- Header right area is reserved for the primary page CTA button (e.g., `+ Новая запись`, `+ Добавить мастера`, `+ Загрузить прайс-лист`).

---

### 2.4 The Enterprise 3-Pane Layout Pattern
All core operational views (`/inbox`, `/calendar`, `/clients`, `/ai-studio`) implement a standardized **3-Pane Canvas Architecture**:

```
┌───────────────────────────┬──────────────────────────────────────────┬───────────────────────────┐
│ 1. LEFT PANE (Selector)   │ 2. CENTER PANE (Primary Canvas)          │ 3. RIGHT PANE (Inspector) │
│ Width: 280px – 320px      │ Width: Flexible (flex-1)                 │ Width: 380px – 420px      │
├───────────────────────────┼──────────────────────────────────────────┼───────────────────────────┤
│ • Search & Quick Filters  │ • Active Conversation Stream             │ • Slide-Over Sheet        │
│ • Channel filters (WA/IG) │ • Master Calendar Multi-Column Grid      │ • Customer 360 Profile    │
│ • Status tabs (New/Active)│ • CRM Pipeline Kanban Board              │ • Booking & Slot Details  │
│ • Scrollable queue list   │ • Knowledge Articles & Source Manager    │ • Live AI Prompt Sandbox  │
└───────────────────────────┴──────────────────────────────────────────┴───────────────────────────┘
```

---

## 3. Exhaustive Feature-by-Feature Placement Specification

Below is the definitive mapping of every feature, tool, dialog, and configuration in the Kvik platform:

---

### 3.1 💬 Operations: Unified Omnichannel Inbox (`/inbox`)
*Primary Daily Front-Desk Messenger*

```
┌────────────────────────┬──────────────────────────────────────────────┬──────────────────────────┐
│ PANE 1: DIALOG LIST    │ PANE 2: ACTIVE CHAT THREAD                   │ PANE 3: CUSTOMER 360     │
├────────────────────────┼──────────────────────────────────────────────┼──────────────────────────┤
│ [ Все ] [ Бот ] [ Ручн]│ Header: Алина Смирнова (+7 701...) [ WhatsApp]│ Имя: Алина Смирнова      │
│ ────────────────────── │ Status: [ 🤖 Отвечает ИИ ] [ Перехватить ✋ ]│ Статус: Записан          │
│ • Алина С. (12:45)     │                                              │ ──────────────────────── │
│   "Хочу на чистку"     │ [Follow-Up Banner: Авто-напоминание через 2ч]│ История записей:         │
│ • Арман Е. (11:20)     │                                              │ • 21 Сен, 18:00 (Пилинг) │
│   "Сколько стоит?"     │ Message Stream (Bot & Customer bubbles)      │ ──────────────────────── │
│ • Динара К. (09:15)    │ ───────────────────────────────────────────  │ Заметки администратора:  │
│   "Спасибо, буду!"     │ Composer: [ Введите сообщение... ]           │ [ + Добавить заметку ]   │
│                        │ Actions:  [ 📅 Быстрая запись ] [ Шаблоны ]  │ [ 📅 Записать клиента ]  │
└────────────────────────┴──────────────────────────────────────────────┴──────────────────────────┘
```

| Feature / Action | UI Location | Surface Type | Behavior & Details |
| :--- | :--- | :--- | :--- |
| **Conversations List** | `/inbox` (Left Pane) | Static List Panel | Filter by: Channel (WhatsApp, IG, Telegram), Status (Unread, Bot Active, Human Takeover). |
| **Active Chat Stream** | `/inbox` (Center Pane) | Dynamic Canvas | Live Socket.IO message feed, media rendering, audio voice note playback. |
| **Live Handoff Toggle** | Top of Chat Thread | Segmented Toggle Button | Toggle between `🤖 ИИ-Ассистент` and `✋ Менеджер`. Instant bot mute/restore. |
| **Follow-Up Thread Pill**| Top Banner inside Thread | Alert Banner | Shows pending 24h/72h follow-up or reminder; includes 1-click `[ Отменить дожим ]`. |
| **Customer 360 Card** | `/inbox` (Right Pane) | Slide-Over Sheet / Pane | Contact phone, channel username, CRM stage, previous bookings, internal staff notes. |
| **1-Click Quick Booking**| Inside Customer 360 / Composer | Action Modal (`Dialog`) | Opens pre-filled `CreateBookingModal` with client phone and name already populated. |

---

### 3.2 📅 Operations: Calendar & Appointments Suite (`/calendar`)
*Master Appointment Schedule, Shift Grid & Booking Engine*

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Календарь и записи             [ Фильтр: Все мастера ▼ ]    [ + Новая запись ]          │
│ TABS:   [ 📅 Матрица дня ]  [ 🗓️ Неделя ]  [ 📋 Список записей ]  [ 🏢 График филиала ]          │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MATRIX VIEW (Columns = Specialists):                                                            │
│ ┌───────────────┬──────────────────────────┬──────────────────────────┬───────────────────────┐ │
│ │ Время         │ Анна (Косметолог)        │ Елена (Стилист)          │ Айгуль (Массаж)       │ │
│ ├───────────────┼──────────────────────────┼──────────────────────────┼───────────────────────┤ │
│ │ 09:00 - 10:00 │ [ 🟢 Алина С. (Чистка) ] │ ── Перерыв ──            │ [ 🟢 Дамир К. ]       │ │
│ │ 10:00 - 11:30 │ [ Свободное окно ]       │ [ 🟡 Динара (Окраш.) ]   │ [ Свободное окно ]    │ │
│ │ 11:30 - 13:00 │ [ 🔴 Арман (Консультац.)]│ [ 🟡 Динара (продолж.) ] │ [ 🟢 Жанна (SPA) ]    │ │
│ └───────────────┴──────────────────────────┴──────────────────────────┴───────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Feature / Action | UI Location | Surface Type | Behavior & Details |
| :--- | :--- | :--- | :--- |
| **Master Matrix View** | `/calendar` (Tab 1: `Матрица дня`) | Full-width Grid Canvas | Multi-column grid where each column is a specialist. Real-time slot rendering. |
| **Weekly View** | `/calendar` (Tab 2: `Неделя`) | Full-width Grid Canvas | 7-day schedule view for a selected master or whole salon. |
| **List / Table View** | `/calendar` (Tab 3: `Список записей`)| High-Density Table | Paginated table with filters: Date, Master, Service, Status (Confirmed, Cancelled, Completed). |
| **Clinic Operating Hours**| `/calendar` (Tab 4: `График филиала`)| Form & Time Matrix | Operating hours by day of week, lunch breaks, buffer times, holiday closure dates. |
| **Create Booking** | Topbar CTA button `+ Новая запись` | Action Modal (`Dialog`) | Client select/create, service pick, specialist selection, automated slot conflict check. |
| **Appointment Details** | Clicking any booking card | Slide-Over Sheet (`Vaul`) | View client details, change status (`Подтверждена`, `Завершена`, `Отменена`), notes. |
| **Reschedule Booking** | Inside Appointment Details Drawer | Action Modal (`Dialog`) | Interactive date & time picker with real-time availability validation. |

---

### 3.3 👥 Operations: Clients & Leads Mini-CRM (`/clients`)
*Pipeline Funnel, Customer Database & Client Lifecycle*

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: База клиентов и CRM      [ Поиск ]  [ Канал: Все ▼ ]  [ Мастер: Все ▼ ]  [ + Клиент ]   │
│ TABS:   [ 📊 Воронка (Kanban) ]   [ 📋 Таблица клиентов ]   [ 📈 Анализ отказов и конверсии ]    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ KANBAN COLUMNS:                                                                                 │
│ ┌───────────────┬────────────────┬────────────────┬─────────────────┬─────────────────────────┐ │
│ │ 1. Новый (12) │ 2. Квалиф. (8) │ 3. Записан (5) │ 4. Завершен (4) │ 5. Отказ / Потерян (2)  │ │
│ ├───────────────┼────────────────┼────────────────┼─────────────────┼─────────────────────────┤ │
│ │ [ Алина С. ]  │ [ Арман Е. ]   │ [ Динара К. ]  │ [ Сауле М. ]    │ [ Тимур (Дорого) ]      │ │
│ │ [ Берик Ж. ]  │ [ Елена В. ]   │ [ Мадина Т. ]  │ [ Олжас А. ]    │ [ Руслан (Не ответил) ] │ │
│ └───────────────┴────────────────┴────────────────┴─────────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Feature / Action | UI Location | Surface Type | Behavior & Details |
| :--- | :--- | :--- | :--- |
| **Pipeline Kanban** | `/clients` (Tab 1: `Воронка`) | Drag-and-Drop Canvas | 5 standard stages: `NEW`, `QUALIFIED`, `APPOINTMENT_SET`, `DEAL_WON`, `DEAL_LOST`. |
| **High-Density Table** | `/clients` (Tab 2: `Таблица`) | High-Density Table | Searchable client directory with phone, total spent, bookings count, last visit date. |
| **Funnel & Loss Analytics**| `/clients` (Tab 3: `Анализ конверсии`)| Analytics Panel | Stage-by-stage drop-off rates, conversion percentages, loss reason breakdown. |
| **Client 360 Slide-Over**| Clicking any Lead / Client card | Slide-Over Sheet (`Vaul`) | Detailed timeline history, assigned staff, pinned notes, connected bookings, direct WhatsApp link. |
| **Qualify Lead Dialog** | Inside Client 360 or Kanban | Action Modal (`Dialog`) | Confirm service interest, target budget, and specialist assignment. |
| **Disqualify / Loss Dialog**| Inside Client 360 or Kanban | Action Modal (`Dialog`) | Select structured loss reason (`PRICE_TOO_HIGH`, `OUT_OF_SERVICE_AREA`, `UNRESPONSIVE`). |

---

### 3.4 🧠 AI Studio & Knowledge Intelligence (`/ai-studio`)
*The Autonomous Brain Center, Knowledge Ingestion & Live Simulator*

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: ИИ-Студия и База знаний     [ Badge: Gemini 2.0 ]      [ ▶️ Запустить тренажер (Sandbox) ]│
│ TABS:   [ 📚 База знаний ]  [ 🤖 Характер и тон ]  [ ❓ Квалификация ]  [ 🏢 Контекст компании ]  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB CONTENT CANVAS:                                                                             │
│ • Sources Ingest (2GIS Parser, Website Scraper, PDF/Doc Upload, Categorized Notes)             │
│ • Personality & Instructions (Tone of Voice, Greeting, Forbidden topics, Language: RU/KZ/EN)   │
│ • Screening & Lead Rules (Mandatory questions, budget thresholds, disqualification rules)       │
│ • Business Context (Address, USPs, working hours summary, service catalog mapping)              │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Feature / Action | UI Location | Surface Type | Behavior & Details |
| :--- | :--- | :--- | :--- |
| **Knowledge Base Sources**| `/ai-studio` (Tab 1: `База знаний`) | Card Grid & Upload Hub | 2GIS 1-click import, Website crawler, PDF/Doc upload, Categorized notes (Pricing, Promos, Rules). |
| **Persona & Instructions**| `/ai-studio` (Tab 2: `Характер и тон`)| Structured Form Panel | AI assistant tone (Friendly, Expert, Formal), Greeting templates, Multilingual toggle (RU/KZ/EN). |
| **Screening & Rules** | `/ai-studio` (Tab 3: `Квалификация`) | Rule Builder Cards | Mandatory qualification questions, budget filters, automatic handoff conditions. |
| **Company Context** | `/ai-studio` (Tab 4: `Контекст компании`)| Structured Form Panel | Physical branch locations, parking notes, core USPs, payment methods accepted. |
| **Interactive AI Sandbox**| Header CTA `▶️ Запустить тренажер` | Slide-Over Sheet (`Vaul`) | Live chat simulator to test AI responses against real knowledge base, prompt inspector, token counter. |
| **Add Knowledge Note** | Inside Knowledge Base tab | Action Modal (`Dialog`) | Create or edit note with Category (`Общее`, `Прайс-лист`, `Акции`, `Условия`). |

---

### 3.5 ⚡ Automations & Growth Engine (`/automations`)
*Autonomous Lead Re-engagement, Reminders & Review Generation*

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Авто-дожим и сценарии                 [ Активных цепочек: 3 ]    [ + Создать правило ]  │
│ TABS:   [ ⚡ Сценарии и правила ]   [ 📊 Конверсия и статистика ]   [ 📋 Журнал отправки (Logs) ]│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ AUTOMATION CARDS (Rules & Toggles):                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 1. Дожим не ответивших клиентов (24ч / 72ч)                              [ Toggle: ВКЛ 🟢 ] │ │
│ │    • Шаг 1: Через 2 часа — "Вы успели ознакомиться с прайсом?"                              │ │
│ │    • Шаг 2: Через 24 часа — "Остались ли у вас вопросы? Могу подобрать свободное окно"     │ │
│ │    • Режим: [ ИИ-Генерация ответов ]  • Тихие часы: [ 21:30 - 09:00 ]                       │ │
│ ├─────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 2. Напоминания о предстоящей записи                                      [ Toggle: ВКЛ 🟢 ] │ │
│ │    • За 24 часа: Запрос подтверждения с кнопками [ Подтвердить ] / [ Перенести ]            │ │
│ │    • За 2 часа: Напоминание с адресом и схемой проезда                                      │ │
│ ├─────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 3. Сбор отзывов на 2GIS и повторный возврат                              [ Toggle: ВКЛ 🟢 ] │ │
│ │    • Через 2 часа после визита: Просьба оставить отзыв с прямой ссылкой на 2GIS             │ │
│ │    • Через 30 дней: Авто-напоминание о повторной процедуре                                  │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Feature / Action | UI Location | Surface Type | Behavior & Details |
| :--- | :--- | :--- | :--- |
| **Automation Rules & Steps**| `/automations` (Tab 1: `Сценарии`) | Rule Card Canvas | Configure 24h/72h cold recovery, appointment reminders, 2GIS review triggers, quiet hours. |
| **Automation Analytics** | `/automations` (Tab 2: `Конверсия`)| KPI & Funnel Panel | Re-engagement conversion rate, recovered revenue, message volume by channel. |
| **Audit Logs & History** | `/automations` (Tab 3: `Журнал`) | High-Density Table | Paginated event log of all sent, replied, skipped, and cancelled automated messages. |
| **Rule Editor Drawer** | Clicking `Настроить` on any card | Slide-Over Sheet (`Vaul`) | Adjust delays (minutes/hours), quiet hour ranges, 2GIS direct URL, AI template prompts. |
| **Test Simulation Modal**| Inside Rule Editor Drawer | Action Modal (`Dialog`) | Test follow-up generation for a sample contact with prompt preview. |

---

### 3.6 🔍 Business Intelligence & Insights (`/insights` & `/overview`)
*Executive KPI Dashboard, Drop-off Funnels & Conversation Gap Analysis*

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Аналитика и инсайты               [ Период: Последние 30 дней ▼ ]    [ 📥 Экспорт отчета]│
│ TABS:   [ 📈 Сводка KPI ]   [ 🔍 Анализ диалогов ИИ ]   [ 👥 Загрузка мастеров ]                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB CONTENT CANVAS:                                                                             │
│ • Executive KPI Summary (Total Revenue, Appointments Booked, AI Autonomy Rate, Avg SLA)        │
│ • Drop-Off & Loss Reasons (Price objections, schedule mismatch, missing services)               │
│ • Unanswered Questions Gap Detector (Real questions asked by clients that lacked knowledge)     │
│   └── 1-Click Action: [ ➕ Добавить ответ в Базу Знаний ]                                      │
│ • Channel Performance (WhatsApp vs. Instagram Direct vs. Telegram message distribution)        │
│ • Staff Workload & Performance (Appointments completed, revenue generated per specialist)      │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Feature / Action | UI Location | Surface Type | Behavior & Details |
| :--- | :--- | :--- | :--- |
| **Executive KPI Overview**| `/overview` or `/insights` (Tab 1) | KPI Grid & Line Charts | Revenue generated by AI, confirmed bookings count, bot resolution percentage (SLA). |
| **Conversation Gap Analysis**| `/insights` (Tab 2: `Анализ диалогов`)| Card Feed & Insights List | AI detects repeated customer questions not answered by current knowledge base. |
| **1-Click KB Gap Resolve**| Inside Conversation Gap Analysis | Action Modal (`Dialog`) | Instantly creates a Knowledge Base note from an unanswered client question. |
| **Staff Workload Heatmap**| `/insights` (Tab 3: `Мастера`) | High-Density Table & Bars | Compares booking volume, completed deals, and revenue per staff member. |

---

### 3.7 👥 Workforce & Specialists (`/team`)
*Master Staff Roster, Service Assignments & Individual Shifts*

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Команда и специалисты                 [ Всего: 6 мастеров ]      [ + Добавить мастера ] │
│ TABS:   [ 👥 Список мастеров ]   [ 🗓️ Смены и графики мастеров ]   [ 🏖️ Отпуска и больничные ]   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ STAFF ROSTER CARDS / TABLE:                                                                     │
│ • Анна Смирнова (Косметолог) — Чистка, Пилинг, Массаж лица | График: Пн, Ср, Пт [ 🟢 Работает ]│
│ • Елена Васильева (Стилист) — Стрижка, Окрашивание         | График: Вт, Чт, Сб [ 🟢 Работает ]│
│ • Айгуль Мусина (Массажист)  — SPA-комплекс, Общий массаж   | График: Пн-Пт      [ 🏖️ В отпуске ]│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Feature / Action | UI Location | Surface Type | Behavior & Details |
| :--- | :--- | :--- | :--- |
| **Staff Roster Directory**| `/team` (Tab 1: `Список мастеров`)| Card Grid & Table | List of specialists, avatar, phone, assigned services, role (Admin / Specialist), status. |
| **Shift Templates** | `/team` (Tab 2: `Смены и графики`)| Interactive Schedule Grid | Individual master working days, start/end hours, custom lunch breaks per specialist. |
| **Leaves & Vacations** | `/team` (Tab 3: `Отпуска`) | Date Range Overrides List | Set temporary sick leaves, vacations, or emergency days off for specific masters. |
| **Add / Edit Specialist** | Header CTA `+ Добавить мастера` | Slide-Over Sheet (`Vaul`) | Specialist name, phone, role, service assignment multi-select, color tag for calendar. |
| **Round-Robin Assignment**| Inside `/team` settings card | Inline Toggle & Form | Configure automatic round-robin booking distribution between equally qualified masters. |

---

### 3.8 🔌 Channels & Integrations (`/integrations`)
*Direct Omnichannel Connectors & External Synchronization*

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Каналы связи и интеграции                                                               │
│ TABS:   [ 💬 Каналы общения ]   [ 🗓️ Внешние календари ]   [ 🔗 Вебхуки и API ]                  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ CHANNELS CONNECTORS CANVAS:                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 🟢 WhatsApp Cloud API / QR                  [ Номер: +7 701 123 45 67 ]   [ Настроить ⚙️ ]  │ │
│ │    Статус: Активен • Обработано сообщений: 1,420 • Режим: Полный авто-ответ                 │ │
│ ├─────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 🟢 Instagram Direct (Meta API)              [ Аккаунт: @beauty_almaty ]   [ Настроить ⚙️ ]  │ │
│ │    Статус: Подключен • Авто-ответ на Direct и комментарии                                   │ │
│ ├─────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ ⚪ Telegram Bot                             [ Бот: @KvikBeautyBot ]       [ Подключить ➕ ]  │ │
│ │    Статус: Не настроен • Подключение через токен @BotFather                                 │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Feature / Action | UI Location | Surface Type | Behavior & Details |
| :--- | :--- | :--- | :--- |
| **Messaging Channels** | `/integrations` (Tab 1: `Каналы`) | Connector Cards Grid | WhatsApp QR pairing / Cloud API token, Instagram Direct OAuth, Telegram BotFather token. |
| **External Calendars** | `/integrations` (Tab 2: `Календари`)| Connector Cards Grid | Google Calendar 2-way sync, Altegio (YCLIENTS) webhook & slot synchronization. |
| **Webhooks & API Keys**| `/integrations` (Tab 3: `Вебхуки`) | High-Density Config List | Outgoing webhook URLs (e.g. `booking.created`, `lead.stage_changed`), Bearer API keys. |
| **Channel Connect Modal**| Clicking `Подключить` on any card | Action Modal (`Dialog`) | QR scanner dialog or OAuth redirect wizard with step-by-step connection guide. |

---

### 3.9 ⚙️ Settings Hub Restructuring (`/settings`)
*Unified Workspace Governance, Access Control & Personal Security*

To eliminate confusion between `/settings/*`, `/schedule`, and `/team`, the Settings hub is restructured into **4 clean, non-overlapping horizontal tabs**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Настройки системы                                                                       │
│ TABS:   [ 🏢 Профиль компании ]   [ 👥 Права доступа ]   [ 👤 Мой профиль ]   [ ⚙️ Расширенные ] │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB 1: ПРОФИЛЬ КОМПАНИИ (`/settings/workspace`)                                                 │
│ • Название компании / филиала, логотип, телефон филиала                                         │
│ • Часовой пояс (Asia/Almaty), валюта (KZT), основной язык интерфейса (RU)                       │
│ • Адрес филиала, 2GIS ссылка на организацию                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB 2: ПРАВА ДОСТУПА И RBAC (`/settings/staff`)                                                 │
│ • Приглашение администраторов и сотрудников по Email / Ссылке                                   │
│ • Назначение ролей: `Владелец` (Owner), `Администратор` (Manager), `Специалист` (Specialist)   │
│ • Журнал действий сотрудников (Audit Log)                                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB 3: МОЙ ПРОФИЛЬ И БЕЗОПАСНОСТЬ (`/settings/account`)                                         │
│ • Имя пользователя, личный email, телефон                                                       │
│ • Смена пароля, двухфакторная аутентификация (2FA)                                              │
│ • Личные предпочтения уведомлений (звук, всплывающие окна)                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB 4: РАСШИРЕННЫЕ НАСТРОЙКИ (`/settings/advanced`)                                             │
│ • Управление Dev-режимом (Developer Simulation Mode)                                            │
│ • Очистка демо-данных, сброс кэша SWR                                                           │
│ • Экспорт резервной копии базы данных                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.10 🔔 Notifications System (`/notifications` & Header Popover)
*Real-Time Operational Alerts, Human Interventions & System Events*

The notification system utilizes a **2-Tier Surface Strategy**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: HEADER POPOVER FEED (Quick Flyout)                                                      │
│ Trigger: Clicking the bell icon 🔔 in the topbar                                                │
│ Surface: Radix Popover (Width: 360px)                                                           │
│ Content: 5 most recent unread alerts + [ Отметить все прочитанными ] + [ Все уведомления ➔ ]   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 2: FULL NOTIFICATIONS ARCHIVE (`/notifications`)                                           │
│ Surface: Full Dashboard Page with Category Tabs                                                 │
│ Tabs:    [ 📑 Все ]   [ 📅 Записи ]   [ ✋ Требует внимания ]   [ ⚙️ Система ]                   │
│ Content: Paginated searchable history of all appointments, customer handoffs, and sync alerts.  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Notification Event Categories:
1. **Записи (`bookings`):** New booking created by AI, client rescheduled, appointment cancelled.
2. **Требует внимания (`handoff`):** Client asked for human manager, live overflow trigger, angry sentiment detected.
3. **Каналы и Система (`system`):** WhatsApp session expired, 2GIS knowledge base synced, backup completed.

---

## 4. Master Surface Typology Matrix

To ensure absolute consistency across the frontend, every feature is assigned a **strictly defined surface type**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SURFACE DECISION TAXONOMY                                    │
├─────────────────────────┬─────────────────────────────┬─────────────────────────────────────────┤
│ Surface Type            │ Component Primitive         │ When to Use                             │
├─────────────────────────┼─────────────────────────────┼─────────────────────────────────────────┤
│ 1. Full Route Page      │ `app/(dashboard)/*/page.tsx`│ Core functional destination (Inbox,     │
│                         │                             │ Calendar, Clients, AI Studio, Team)     │
├─────────────────────────┼─────────────────────────────┼─────────────────────────────────────────┤
│ 2. Contextual Top Tab   │ `DashboardPageHeader`       │ Sub-domains or alternate views within   │
│                         │ `tabs={[...]}`              │ a single page (e.g. Matrix vs Week)     │
├─────────────────────────┼─────────────────────────────┼─────────────────────────────────────────┤
│ 3. Slide-Over Sheet     │ `Radix Sheet` / `Vaul`      │ Inspecting entity details without       │
│                         │ (Right 380px drawer)        │ losing list context (Client 360, Booking│
│                         │                             │ Inspector, AI Sandbox, Rule Editor)     │
├─────────────────────────┼─────────────────────────────┼─────────────────────────────────────────┤
│ 4. Action Dialog/Modal  │ `Radix Dialog`              │ Focused, high-stakes single actions     │
│                         │ (Center pop-up)             │ (Create Booking, Qualify/Disqualify,    │
│                         │                             │ Add Specialist, Connect Channel QR)     │
├─────────────────────────┼─────────────────────────────┼─────────────────────────────────────────┤
│ 5. Quick Popover / Menu │ `Radix Popover / Dropdown`  │ Ephemeral secondary menus & feeds       │
│                         │ (Floating flyout)           │ (Notification feed, User avatar menu,   │
│                         │                             │ Filter dropdowns, Date range picker)    │
└─────────────────────────┴─────────────────────────────┴─────────────────────────────────────────┘
```

### Complete Surface Decision Matrix:

| Feature / Sub-Feature | Parent Route | Surface Type | Primary Component / File |
| :--- | :--- | :--- | :--- |
| **Unified Omnichannel Inbox** | `/inbox` | Full Page (3-Pane) | `components/dashboard/inbox/InboxPage.tsx` |
| **Customer 360 Profile** | `/inbox` & `/clients` | Slide-Over Sheet | `components/dashboard/leads/LeadDetail.tsx` |
| **Appointment Calendar** | `/calendar` | Full Page (3-Pane) | `components/dashboard/calendar/CalendarPage.tsx` |
| **Master Matrix View** | `/calendar` (Tab 1) | Contextual Tab Canvas| `components/dashboard/calendar/CalendarMatrixView.tsx` |
| **Clinic Operating Hours** | `/calendar` (Tab 4) | Contextual Tab Canvas| `components/dashboard/schedule/SchedulePage.tsx` |
| **Create Booking Modal** | Global / Topbar | Action Modal (`Dialog`)| `components/dashboard/bookings/CreateBookingModal.tsx` |
| **Reschedule Booking Modal**| Inside Appointment Drawer| Action Modal (`Dialog`)| `components/dashboard/bookings/RescheduleModal.tsx` |
| **Leads Kanban Pipeline** | `/clients` (Tab 1) | Contextual Tab Canvas| `components/dashboard/leads/LeadsKanban.tsx` |
| **Leads Directory Table** | `/clients` (Tab 2) | Contextual Tab Canvas| `components/dashboard/leads/LeadsList.tsx` |
| **Lead Disqualify Dialog**| Inside Client 360 | Action Modal (`Dialog`)| `components/dashboard/leads/DisqualifyDialog.tsx` |
| **AI Knowledge Base** | `/ai-studio` (Tab 1) | Contextual Tab Canvas| `components/dashboard/settings/knowledge-base/KnowledgeBaseManager.tsx` |
| **AI Persona & Instructions**| `/ai-studio` (Tab 2) | Contextual Tab Canvas| `components/dashboard/settings/ai-agent/AgentConfig.tsx` |
| **AI Sandbox Simulator** | `/ai-studio` (CTA) | Slide-Over Sheet | `components/dashboard/settings/ai-agent/AiSandboxDrawer.tsx` |
| **Follow-Up Automations Hub**| `/automations` | Full Page (3-Tab) | `components/dashboard/automations/AutomationsPage.tsx` |
| **Automation Rule Editor** | Inside `/automations` | Slide-Over Sheet | `components/dashboard/automations/AutomationEditorDrawer.tsx` |
| **Conversation Insights** | `/insights` | Full Page (3-Tab) | `components/dashboard/insights/InsightsPage.tsx` |
| **1-Click KB Gap Resolve**| Inside `/insights` | Action Modal (`Dialog`)| `components/dashboard/insights/AddFaqModal.tsx` |
| **Team Roster & Shifts** | `/team` | Full Page (3-Tab) | `components/dashboard/team/TeamPage.tsx` |
| **Add Specialist Drawer**| Inside `/team` | Slide-Over Sheet | `components/dashboard/team/AddStaffDrawer.tsx` |
| **Channels & Integrations**| `/integrations` | Full Page (3-Tab) | `components/dashboard/integrations/IntegrationsPage.tsx` |
| **Channel Connect (QR/OAuth)**| Inside `/integrations`| Action Modal (`Dialog`)| `components/dashboard/integrations/ConnectChannelModal.tsx` |
| **Settings Hub** | `/settings` | Full Page (4-Tab) | `components/dashboard/settings/SettingsPage.tsx` |
| **Notifications Feed** | Global Topbar Bell 🔔 | Popover Flyout (360px)| `components/dashboard/notifications/NotificationPopover.tsx` |
| **Notifications Archive** | `/notifications` | Full Page | `components/dashboard/notifications/NotificationsPage.tsx` |
| **Help & Support Dialog** | Sidebar Footer `❓` | Action Modal (`Dialog`)| `components/dashboard/shared/HelpDialog.tsx` |

---

## 5. Role-Based Adaptive Views (RBAC UX)

The user interface automatically simplifies itself based on the logged-in user's role (`OWNER`, `ADMIN_MANAGER`, `SPECIALIST`):

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ROLE-BASED PERMISSION MATRIX                                    │
├───────────────────────────────────┬───────────────────┬───────────────────┬─────────────────────┤
│ Module / Route                    │ 👑 OWNER          │ 👩‍💼 ADMIN_MANAGER  │ 👨‍⚕️ SPECIALIST       │
├───────────────────────────────────┼───────────────────┼───────────────────┼─────────────────────┤
│ `/inbox` (Omnichannel Chat)       │ ✅ Full Access    │ ✅ Full Access    │ 👁️ Read / My Clients│
│ `/calendar` (Master Matrix & Book)│ ✅ Full Access    │ ✅ Full Access    │ 🗓️ My Schedule Only │
│ `/clients` (CRM & Lead Pipeline)  │ ✅ Full Access    │ ✅ Full Access    │ 👁️ Assigned Leads   │
│ `/ai-studio` (Brain & Prompts)    │ ✅ Full Access    │ ✅ Full Access    │ ❌ Hidden & Blocked │
│ `/automations` (Follow-up Rules)  │ ✅ Full Access    │ ✅ Full Access    │ ❌ Hidden & Blocked │
│ `/insights` (Conversation Intel)  │ ✅ Full Access    │ ✅ Full Access    │ ❌ Hidden & Blocked │
│ `/team` (Staff Rosters & Shifts)  │ ✅ Full Access    │ ✅ View / Edit    │ 🗓️ My Shifts Only   │
│ `/integrations` (Channels & Cal)  │ ✅ Full Access    │ 👁️ View Status    │ ❌ Hidden & Blocked │
│ `/settings/workspace`             │ ✅ Full Access    │ ❌ Hidden         │ ❌ Hidden & Blocked │
│ `/settings/account` (My Profile)  │ ✅ Full Access    │ ✅ Full Access    │ ✅ Full Access      │
└───────────────────────────────────┴───────────────────┴───────────────────┴─────────────────────┘
```

- **Specialist (Master / Doctor) Persona:** Sees a hyper-focused workspace containing only **their own calendar for today/week**, **their assigned clients**, and **their personal shift templates / vacation requests**. All complex AI settings, channels, and financial settings are completely hidden.
- **Admin / Manager Persona:** Focuses on real-time daily operations: live inbox conversations, all-master booking matrix, fast manual appointment creation, lead stage updating, and follow-up monitoring.
- **Owner Persona:** Has full executive oversight: revenue attribution, AI efficiency metrics, channel connections, staff salaries/rosters, and company workspace parameters.

---

## 6. Sitemaps & Technical Routing Map

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
│
├── (onboarding)/
│   └── onboarding/page.tsx                       # 5-step guided salon/clinic wizard
│
└── (dashboard)/
    ├── layout.tsx                                # Global Shell: 210px Sidebar + 52px Topbar
    │
    ├── overview/page.tsx                         # Executive KPI summary (Redirects or renders KPI grid)
    │
    ├── inbox/                                    # 3-Pane Omnichannel Live Messenger
    │   ├── page.tsx                              # Chat stream + Customer 360 sheet
    │   └── [conversationId]/page.tsx
    │
    ├── calendar/                                 # Multi-View Calendar & Booking Suite
    │   └── page.tsx                              # Tabs: [Матрица дня, Неделя, Список, График филиала]
    │
    ├── clients/                                  # Leads & Clients Mini-CRM
    │   └── page.tsx                              # Tabs: [Воронка, Таблица, Анализ конверсии]
    │
    ├── ai-studio/                                # AI Brain Center & Knowledge Base
    │   └── page.tsx                              # Tabs: [База знаний, Характер, Квалификация, Контекст]
    │
    ├── automations/                              # Autonomous Growth & Follow-Up Engine
    │   └── page.tsx                              # Tabs: [Сценарии, Конверсия, Журнал]
    │
    ├── insights/                                 # Conversation Intelligence & Gap Detection
    │   └── page.tsx                              # Tabs: [Сводка KPI, Анализ диалогов, Мастера]
    │
    ├── team/                                     # Specialist Roster, Shifts & Vacations
    │   └── page.tsx                              # Tabs: [Список мастеров, Смены, Отпуска]
    │
    ├── integrations/                             # Omnichannel Connectors & External Sync
    │   └── page.tsx                              # Tabs: [Каналы общения, Календари, Вебхуки]
    │
    ├── notifications/                            # Full Notification Archive
    │   └── page.tsx                              # Tabs: [Все, Записи, Внимание, Система]
    │
    ├── dev-messaging/                            # Developer Synthetic Message Simulator
    │   └── page.tsx                              # Dev-only testing environment
    │
    └── settings/                                 # Unified Workspace Governance
        ├── page.tsx                              # Redirects to /settings/workspace
        ├── workspace/page.tsx                    # Company Profile & Branch Details
        ├── staff/page.tsx                        # Team RBAC & Invitations
        ├── account/page.tsx                      # Personal Profile & Security (2FA, Password)
        └── advanced/page.tsx                     # Dev tools, cache reset, backup
```

---

## 7. Summary & Architectural Benefits

| Architectural Area | Before Redesign | With New Design Architecture Specification |
| :--- | :--- | :--- |
| **Sidebar Hierarchy** | Scattered, flat list with unclear boundaries | **3 Structured Functional Clusters** (Operations, AI & Growth, Governance) with exact 210px width. |
| **Page Surface Types** | Arbitrary mixing of modals, pages, and sheets | **Rigid 5-Tier Surface Taxonomy** (Page, Contextual Tab, Drawer Sheet, Action Dialog, Popover). |
| **Calendar & Schedule**| Disconnected working hours and bookings | **Unified `/calendar` Hub** with instant switching between Day Matrix, Week Grid, and Branch Working Hours. |
| **AI Studio & Automations**| Overloaded mega-tab with 6+ sub-pages | **Clean 2-Hub Separation:** `/ai-studio` (Brain/Knowledge) and `/automations` (Autonomous Follow-ups & Reminders). |
| **Settings Hub** | Confusing mix of channels, workspace, and accounts| **Standard 4-Tab Governance Suite** (`/settings/workspace`, `/settings/staff`, `/settings/account`, `/settings/advanced`). |
| **Non-Technical UX** | Complex developer terminology exposed | **Zero-Jargon Business Metaphors** designed for busy salon admins and clinic receptionists. |

---

*Specification authored for Kvik Platform Engineering & UI/UX Architecture.*
