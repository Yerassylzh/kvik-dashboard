> **⚠️ DEPRECATION NOTICE FOR DEVELOPERS & AI AGENTS**
> **Real Estate (Krisha.kz), Auto Sales (Kolesa.kz), and Auto Repair / Service (СТО) verticals are FULLY DEPRECATED.**
> Market validation revealed that these niches primarily rely on incoming voice phone calls rather than messaging chats, rendering chat-only agents ineffective. Any existing code, web scrapers, prompt templates, or documentation relating to Krisha.kz, Kolesa.kz, or auto services are obsolete and **MUST NOT BE USED OR IMPLEMENTED**.

---

# Product and System Architecture of the AI SaaS Platform

**Specialization:** Calendar & Appointment-Based Businesses (Beauty Salons, Clinics, Fitness Studios, Consulting, Professional Services)

**Target Market:** Kazakhstan, CIS, and Regional Markets

**Document Type:** Internal Product Specification & System Architecture (_GTM → Onboarding → Dashboard → Technical Architecture_)

---

## 1. Executive Summary and Strategic Framework

We are building a **verticalized AI Sales & Booking Agent for messaging channels** (WhatsApp, Instagram Direct, Telegram) specifically designed for **businesses with calendar-driven appointment booking**.

### Primary Value Proposition

Where horizontal SaaS competitors (_Pleep, Suvvy, Soldee, ai-managers.ru_) offer blank slate builders requiring complex manual prompt engineering, our platform provides **out-of-the-box workflows for calendar businesses**. It ingests knowledge bases from websites, 2GIS, PDFs, or plain text notes in minutes, handles lead qualification, answers FAQ/pricing inquiries, drives automated follow-ups for cold leads, and locks in appointment bookings 24/7.

---

## 2. Target Niche Focus

Our primary focus is exclusively on **appointment-driven service businesses** where initial customer inquiries occur via text (Instagram Direct, WhatsApp, Telegram).

| Vertical                        | Primary Pain Point                                                                                      | AI Agent Objective                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Beauty Salons & Spa**         | High inquiry volume about prices, treatments, and master schedules; slow responses lead to client loss. | Instant 15s FAQ response, price quote, slot matching, and appointment booking.               |
| **Medical & Aesthetic Clinics** | Reception overload during peak hours; requirement for basic qualification before booking.               | Inquiry qualification (symptoms/specialist required), service details, and slot reservation. |
| **Fitness Centers & Studios**   | High drop-off rate on pricing inquiries and trial class scheduling.                                     | Class schedule presentation, pricing, trial session booking, and 24/72h follow-ups.          |
| **Consulting & Coaching**       | Time lost negotiating meeting slots and explaining preliminary scope/pricing.                           | Lead qualification (budget, requirements) and booking introductory strategy calls.           |

---

## 3. Go-To-Market (GTM) Strategy & Validation Model

Our initial growth phase centers on validating market demand and gathering structured client feedback before broadening product scope.

### Phase 1: AI Chat Agents (Current Focus)

- **GTM Channels:** Content marketing (organic video/case studies), Cold Outreach (Cold DM across Instagram/WhatsApp), and Real-Life/Offline direct sales.
- **Core Product:** AI Messaging Agent (WhatsApp, Instagram, Telegram) with internal booking CRM/kanban and 24/72-hour follow-up automation.
- **Validation Goal:** Prove strong retention and ROI for calendar-based SMBs.

### Phase 2: Inbound Voice AI Agents (Future Expansion)

- **Trigger:** Upon positive client feedback, strong retention, and established client demand.
- **Product:** Expanding into **Inbound AI Voice Agents** capable of handling phone calls for booking, rescheduling, and preliminary consultations.

---

## 4. Product Architecture & Flow

The platform spans four integrated layers: **Landing Page → Onboarding → Dashboard → Core AI Engine**.

```
+-----------------------------------------------------------------------+
|                      LANDING PAGE (GTM Focus)                         |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                      ONBOARDING (5 minutes)                           |
|   [1. Business Info] -> [2. Knowledge Ingest] -> [3. Channels & Slots] |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                     DASHBOARD (Calendar Profile)                      |
|         Unified Inbox | Appointment Kanban | Follow-up Config         |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                          CORE AI ENGINE                               |
|       Orchestrator | Slot-Validation | Live Overflow | Follow-up      |
+-----------------------------------------------------------------------+

```

### 4.1 Onboarding Flow (5-Minute Setup)

1. **Step 1: Business Profile & Sub-Vertical Selection:** Select business type (Beauty, Clinic, Fitness, Consulting).
2. **Step 2: Knowledge Base Ingestion:** Paste website URL, 2GIS page link, upload price PDF, or type raw text notes. The AI automatically structures the pricing and service catalog.
3. **Step 3: Messaging Channel Connection:** Connect WhatsApp Business API, Instagram Direct, or Telegram.
4. **Step 4: Booking & Schedule Rules:** Define working hours, service durations, buffer times, and Live Overflow thresholds.
5. **Step 5: Test & Activate:** Run a test dialogue in the browser widget and go live.

---

## 5. Core AI Engine Capabilities

| Feature                           | Description                                                                         | Strategic Benefit                                        |
| --------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Omnichannel Unified Context**   | WhatsApp, Instagram Direct, and Telegram combined into one unified inbox.           | Centralized conversation management.                     |
| **Live Overflow**                 | Assistant takes over conversation if human staff does not reply within $N$ seconds. | Maintains response SLA without displacing human team.    |
| **Multi-Source Knowledge Ingest** | Reads price lists and FAQs from websites, 2GIS, PDFs, and plain text notes.         | Eliminates manual prompt engineering and complex setup.  |
| **Real-time Slot Validation**     | Verifies schedule availability before confirming appointment slots.                 | Eliminates booking collisions and hallucinations.        |
| **Automated Follow-up Engine**    | Scheduled nurturing touches at 24 and 72 hours for unresponsive leads.              | Re-engages cold inquiries automatically.                 |
| **Multilingual Support**          | Automatic language detection and response (Russian, Kazakh, English).               | Native experience for local customer bases.              |
| **No-Code Feedback Loop**         | Flag incorrect responses with comments to train the agent in plain language.        | Rapid accuracy improvements without prompt modification. |

---

## 6. Technical System Architecture

Structured as a **Modular Monolith** designed for scalability and straightforward service extraction.

### Architectural Layers

1. **Presentation Layer:** Next.js Web App for Dashboard, Unified Inbox, and Onboarding Wizard.
2. **Channel Adapters:** WhatsApp API, Instagram Graph API, Telegram API converting payloads to standard message formats.
3. **Core AI Orchestrator:** Intent parsing, slot validation, prompt policy enforcement, follow-up scheduler, and Live Overflow timers.
4. **Integration Layer:** Calendar connectors (Google Calendar, Altegio/YCLIENTS) and CRM sync endpoints.
5. **Data Layer:** Multi-tenant PostgreSQL database storing leads, chat histories, structured knowledge bases, and booking schedules.
