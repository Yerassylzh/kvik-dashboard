# Product and System Architecture of the AI SaaS Platform

**Specialization:** Real Estate Agencies, Automotive Business, and Appointment-based Services  
**Target Market:** Kazakhstan and CIS  
**Document Type:** Internal Document (Market Analysis, Competitor Breakdown, Product Spec: _Landing → Onboarding → Dashboard → Technical Architecture_)

---

## 1. Executive Summary and Strategic Framework

We are building a **verticalized AI Sales Agent for messaging channels** (WhatsApp, Instagram, Telegram) with two primary niches:

1. **Real Estate Agencies**
2. **Automotive Business** (dealerships + service centers / workshops)

_Secondary vertical:_ Appointment-driven service businesses (clinics, barbershops, beauty salons, and similar appointment-based providers).

### Core Value Proposition

Where horizontal SaaS competitors (_Pleep, Suvvy, Soldee, ai-managers.ru_) offer an empty canvas forcing customers to construct custom logic from scratch, we provide **out-of-the-box vertical workflows** — with deep data connectors for **Krisha.kz** and **Kolesa.kz** — while maintaining a frictionless 5-minute onboarding experience.

### Document Structure

1. Niche Synthesis and Market Analysis
2. Landing Page Architecture
3. Vertical Onboarding Flows
4. Niche-Tailored Dashboard Structure
5. Core AI Engine Capabilities
6. Technical System Architecture

---

## 2. Niche Synthesis in Kazakhstan

Based on operational workflow audits across real estate, automotive, legal, and renovation services:

| Niche                            | Traffic Channels                | Primary Pain Point                                                    | Average Ticket / Commission                    | Priority                                  |
| :------------------------------- | :------------------------------ | :-------------------------------------------------------------------- | :--------------------------------------------- | :---------------------------------------- |
| **Real Estate**                  | Krisha.kz, WhatsApp, Instagram  | Speed-to-lead, managing 10–15 concurrent chat threads                 | 200,000–350,000+ KZT per closed deal           | **Primary**                               |
| **Automotive (Sales + Service)** | Kolesa.kz, Instagram, WhatsApp  | Repetitive FAQ inquiries, schedule conflicts, race for fast responses | From minor repair bill to high-ticket car sale | **Primary**                               |
| **Legal / Consulting**           | Website, WhatsApp, 2GIS         | Senior specialist time wasted on unqualified leads                    | $50–$5,000+                                    | _Out of focus_                            |
| **Home Renovation**              | Instagram (portfolio), WhatsApp | Long sales cycle (weeks), leads go cold without follow-up             | $5,000–$50,000+                                | _Out of focus_ (reusing follow-up engine) |

> **Note:** Legal services and renovation are excluded from initial vertical focus — they do not match the profile of _high-volume repetitive messenger inquiries + classified board/calendar integration_. However, automated nurturing logic is adopted as a universal **Follow-up Engine** across our primary verticals.

### 2.1 Why Real Estate and Automotive are Primary

- **Dominant Classified Marketplaces:** Both verticals possess powerful localized platforms (**Krisha.kz** — 500,000+ active listings; **Kolesa.kz** — 6.5M listings, 250M messages/year), providing concentrated incoming traffic ripe for deep integration.
- **Criticality of Response Speed:** Speed-to-lead directly dictates deal conversion, delivering an easily measurable ROI metric for sales conversations.
- **High Logic Reusability:** Overloaded agents handling 10-15 parallel chats or service desks routing repair requests share similar structural bottlenecks, allowing **70–80% engine reusability** across verticals.

### 2.2 Why Calendar Businesses are Secondary

Clinics and beauty salons represent a large horizontal market with established scheduling infrastructure (YCLIENTS, Altegio), offering quick distribution but lower pricing power and intense competition from horizontal platforms.

---

## 3. Competitive Landscape

### 3.1 CIS and Kazakhstan Competitors

| Product            | Positioning                    | Pricing                                 | Key Strength                                                                        | Weakness                                                                             |
| :----------------- | :----------------------------- | :-------------------------------------- | :---------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **Pleep**          | Horizontal, B2C services/e-com | 42,380–130,780 KZT/mo + transaction fee | In-chat Kaspi Pay, voice+chat context, built-in CRM                                 | Generic templates for complex verticals; requires manual knowledge base construction |
| **Suvvy AI**       | Horizontal B2B, Enterprise+SMB | Pay-as-you-go, 35–150 KZT/response      | Multi-model architecture, calculations via Excel sheets, CRM funnel management      | High onboarding barrier (webhooks, tokens), lacks localized KZ connectors            |
| **Soldee.kz**      | Horizontal, local (Almaty)     | Estimated MRR $1.5k–$4k, early stage    | Human-like typing cadence simulation, Live-Overflow concept, credit-card-free trial | Lacks deep classified integrations, prone to scheduling hallucinations               |
| **ai-managers.ru** | Horizontal, Russian market     | "1-day rollout"                         | Broad channel coverage (including Avito, VK)                                        | Generic prompts yield generic answers, no industry-specific databases                |

### 3.2 Western Reference Players

| Product       | Vertical                            | Key Strength                                                        | Limitation / CIS Incompatibility                                           |
| :------------ | :---------------------------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------- |
| **Uptail.ai** | Real Estate, WhatsApp               | Property matching, sending floor plans, scheduling showings in-chat | Real-estate only; integrated solely with Western CRMs                      |
| **Gubagoo**   | Automotive Dealerships (Enterprise) | Deep DMS integration, trim/trade-in aware, live agent handoff       | Heavy and expensive Enterprise pricing, inaccessible for local SMBs        |
| **Roof AI**   | Real Estate, Brokerage Websites     | MLS integration, automated personalized matching, routing to agents | Built for website widgets rather than mobile messengers                    |
| **Chatbase**  | Generic no-code chatbot             | Fast bot creation from PDF/site crawls                              | Knowledge retrieval only; lacks transactional logic (scheduling, listings) |

### 3.3 Positioning Matrix & Our White Space

Analyzing along two axes — **Vertical Logic Depth** and **Onboarding Simplicity**:

1. **Horizontal + Simple Onboarding:** _Pleep, Soldee, Chatbase_ — rapid setup, but lacks domain understanding for real estate/auto.
2. **Horizontal + Complex Onboarding:** _Suvvy AI_ — powerful, but demands technical integrators.
3. **Vertical + Heavy/Enterprise:** _Gubagoo, Roof AI_ — deep logic, but inaccessible price point and implementation timeline for CIS SMBs.
4. **Vertical + Simple Onboarding (The White Space):** Our target territory — combining the domain depth of Suvvy/Gubagoo with 5-minute automated onboarding.

---

## 4. Product Architecture

The platform spans four integrated layers: **Landing Page → Onboarding → Dashboard → Core AI Engine**, configurable across vertical profiles (_Real Estate, Automotive, Calendar-based_).

```
+-----------------------------------------------------------------------+
|                       LANDING (Niche Switcher)                        |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                          ONBOARDING (5 minutes)                       |
|      [Branch A: Realty]      [Branch B: Auto]     [Branch C: Calendar]|
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                          DASHBOARD (Niche Profile)                    |
|          Shared Framework + Niche-Specific Configured Widgets         |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                          CORE AI ENGINE                               |
|       Orchestrator | Slot-Validation | Live Overflow | Follow-up      |
+-----------------------------------------------------------------------+
```

### 4.1 Landing Page Architecture

**Core Goal:** Rapidly guide visitors (realtors, auto businesses, clinic owners) to immediate recognition of _“this was built specifically for my business”_ using industry-native vocabulary.

#### Page Structure

1. **Niche-Switcher in Header:** Seamlessly updates headlines, mockups, and case studies across the page without full page reload.
2. **Hero Block:** Pain-first vertical headline + quantified value metric + primary CTA "Start Free Trial" and secondary CTA "View Interactive Demo".
3. **Interactive Demo Chat:** Embedded widget simulating real client dialogs (e.g., qualifying budget and scheduling a property showing).
4. **Pain Points (Problem):** 3 vertical-specific friction points.
5. **Solution (How It Works):** 3 clear steps with real interface screen captures.
6. **Social Proof & Metrics:** Vertical case studies with concrete numbers (_"Cut response time from 40m to 15s"_).
7. **Interactive ROI Calculator:** Computes lost revenue based on current response latency.
8. **Comparison Matrix:** "Generic Bot Builder" vs. "Pre-configured Vertical Engine".
9. **Transparent Pricing:** Tiered cards (Starter / Pro / VIP).
10. **FAQ & Objection Handling:** Explaining bot humanization, hallucination guards, and live takeover.
11. **Final CTA:** Urgency trigger and registration button.

---

### 4.2 Onboarding Flow

**Guiding Principle:** Step 0 selects business type → subsequent steps execute automated data extraction from the primary lead channel (Krisha.kz, Kolesa.kz, or scheduling engine). Goal: **A fully operational assistant in 5 minutes without reading docs**.

#### Step 0 — Business Type Selection

- 🏠 **Real Estate Agency / Realtor**
- 🚗 **Automotive Business** (Dealership or Auto Service Center)
- 📅 **Appointment-based Business** (Clinic, Barbershop, Beauty Salon, Services)

---

#### Branch A — Real Estate

1. **Step 1:** Paste Krisha.kz profile URL → system automatically parses all active listings (pricing, photos, specifications, descriptions).
2. **Step 2:** Review and confirm parsed listings (interactive preview cards).
3. **Step 3:** Connect messaging channel (WhatsApp Business API / Instagram Direct / Telegram).
4. **Step 4:** Configure lead qualification criteria (budget, mortgage pre-approval, target district, urgency).
5. **Step 5:** Connect showings calendar (Google Calendar) and define Live Overflow threshold (_"Take over chat if manager does not respond within N seconds"_).
6. **Step 6:** Execute test dialogue as a prospective buyer → activate assistant.

---

#### Branch B — Automotive

1. **Step 1:** Select sub-segment: _Auto Sales_ (Kolesa.kz URL) or _Auto Service_ (upload service price list + bay capacity).
2. **Step 2:** Connect WhatsApp / Instagram.
3. **Step 3:** Configure real-time scheduling rules and collision prevention.
4. **Step 4:** Test dialogue and launch.

---

#### Branch C — Calendar Businesses

1. **Step 1:** Select sub-vertical (clinic, barbershop, salon, consulting).
2. **Step 2:** Connect calendar platform (Altegio, YCLIENTS, Google Calendar).
3. **Step 3:** Connect messaging channels and enable automated appointment reminders (reducing no-shows).
4. **Step 4:** Test dialogue and launch.

---

### 4.3 Dashboard Framework

The dashboard consists of a **Shared Core Framework** populated with dynamic **Niche Modules** dictated by `niche_profile`.

#### Universal Modules (All Niches)

- **Unified Inbox:** Consolidated omnichannel chat interface with active takeover toggles (_Bot Active / Manager Takeover_).
- **Leads / CRM Table:** Pipeline stages, channel filters, export, and CRM sync (amoCRM, Bitrix24).
- **Analytics:** Speed-to-lead, automated resolution rate, funnel conversions, and Follow-up re-engagement performance.
- **Assistant Configuration:** Knowledge base editor ("dislike + feedback" continuous learning), tone of voice, escalation triggers, multilingual settings (Russian, Kazakh, English).
- **Billing & Payments:** Plan management, usage metrics, Kaspi Pay in-chat checkout.
- **Team Management:** Role-based access and chat distribution.

---

## 5. Core AI Engine Capabilities

| Feature                         | Description                                                                               | Strategic Benefit                                                  |
| :------------------------------ | :---------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| **Omnichannel Unified Context** | WhatsApp Business API, Instagram Direct, Telegram in one shared inbox                     | Table-stakes communication hygiene                                 |
| **Live Overflow**               | Assistant takes over conversation if human manager does not reply within N seconds        | Eliminates fear of bot misbehavior while guaranteeing response SLA |
| **Automated Data Connectors**   | Direct ingestion of listings and services from Krisha.kz, Kolesa.kz, or website links     | Eliminates manual knowledge base setup                             |
| **Real-time Slot Validation**   | Validates calendar availability against live schedule before confirming appointment       | Prevents LLM booking hallucinations and double bookings            |
| **Automated Follow-up Engine**  | Scheduled nurturing touches at 24/72 hours for silent leads                               | Reactivates cold inquiries across all verticals                    |
| **In-Chat Kaspi Pay**           | Generates and verifies native payment links directly inside conversations                 | Powerful conversion driver for the Kazakhstan market               |
| **Multilingual Support**        | Automatic language detection and switching across Russian, Kazakh, and English            | Critical local requirement                                         |
| **No-Code Dislike Feedback**    | Refine bot behavior by flagging responses with a comment, avoiding raw prompt engineering | Reduces churn among non-technical business owners                  |
| **Conversational Humanization** | Realistic typing delays and natural cadence                                               | Increases engagement and trust                                     |

---

## 6. Technical System Architecture

Designed as a **Modular Monolith** with clean domain separation, allowing straightforward extraction into microservices as volume scales.

### 6.1 Architectural Layers

| Layer                 | Components                                                                                    | Responsibility                                                                       |
| :-------------------- | :-------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **Presentation**      | Landing (Next.js/SSR), Onboarding Wizard, Dashboard (SPA)                                     | Public and authenticated UIs; adapts views according to `niche_profile`              |
| **Channel Adapters**  | WhatsApp Business API, Instagram Graph API, Telegram Bot API                                  | Normalizes incoming/outgoing payloads into standard internal message schema          |
| **Core AI Engine**    | Orchestrator, Niche Prompt Policy, Slot-Validation Engine, Follow-up Scheduler, Live Overflow | Lead qualification, dialogue generation, scheduling verification, escalation routing |
| **Integration Layer** | Krisha.kz / Kolesa.kz scrapers, Calendar connectors, CRM sync, Kaspi Pay                      | External data sync, listing updates, transaction settlement                          |
| **Data Layer**        | Leads DB, Conversation History, Knowledge Base, Billing DB, Analytics Store                   | Data persistence with strict tenant isolation                                        |
| **Platform Services** | Auth/JWT, Subscriptions, Queues (BullMQ), Observability (Pino, Traces)                        | Cross-cutting infrastructure                                                         |

---

## 7. MVP Roadmap

| Milestone | Scope                                                                                                                                  | Objective                                                        |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **MVP-1** | **Real Estate Vertical:** Onboarding with Krisha.kz scraper, WhatsApp/Instagram connectors, core dashboard (Inbox, Listings, Pipeline) | First paying agencies, validating speed-to-lead hypothesis       |
| **MVP-2** | **Automotive Vertical:** Kolesa.kz scraper + repair bay schedule management, Live Overflow, Slot Validation                            | Expand to second primary vertical, reusing 70–80% of core engine |
| **MVP-3** | **Calendar Vertical:** Altegio/YCLIENTS connectors, Follow-up Scheduler, Kaspi Pay checkout                                            | Scale paying customer base on mature appointment market          |
| **MVP-4** | Continuous feedback tuning ("dislike" feedback loop), Kazakh/English language expansion, advanced vertical analytics                   | Maximize retention and defend market moat                        |
