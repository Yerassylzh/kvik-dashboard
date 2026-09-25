> **⚠️ DEPRECATION NOTICE FOR DEVELOPERS & AI AGENTS**
> **Real Estate (Krisha.kz), Auto Sales (Kolesa.kz), and Auto Repair / Service (СТО) verticals are FULLY DEPRECATED.**
> Market validation revealed that these niches primarily rely on incoming voice phone calls rather than messaging chats, rendering chat-only agents ineffective. Any legacy code, web scrapers, prompt templates, or documentation relating to Krisha.kz, Kolesa.kz, or auto services are obsolete and **MUST NOT BE USED OR IMPLEMENTED**.

---

# Product and System Architecture

**Specialization:** Calendar & Appointment-Based Businesses (Beauty Salons & Spa, Medical & Aesthetic Clinics, Fitness Studios, Consulting & Professional Services)  
**Target Market:** Kazakhstan, CIS, and Regional Central Asian Markets  
**Document Type:** High-Level Product Architecture & Functional Overview  

---

## 1. Executive Summary & Value Proposition

**Kvik** is an autonomous **AI Sales, Booking & Conversational Business Intelligence Platform** built for messaging channels (**WhatsApp Business, Instagram Direct, Telegram**). The platform is purpose-built for service businesses operating on **calendar-driven appointments**.

### Verticalized vs. Horizontal Approach
Unlike horizontal chatbot builders that require manual rule builders and tedious prompt tuning, Kvik provides **ready-to-use workflows designed specifically for appointment-driven businesses**:
- **5-Minute Setup:** Rapidly ingests business knowledge from 2GIS profiles, websites, service price lists, or text notes.
- **Autonomous AI-First Customer Reception:** Handles 24/7 inbound inquiries, audio voice notes, service consultations, real-time schedule checks, and instant booking creation.
- **Intelligent Escalation & Specialist Takeover:** Automatically hands off conversations to human staff when visual media is received or when human help is requested, supported by instant Telegram and dashboard alerts.
- **Automated Lifecycle Follow-Up:** Re-engages cold leads, sends pre-appointment reminders, and drives public 2GIS reviews.
- **Conversational Business Intelligence:** Analyzes past customer conversations to surface lost revenue opportunities and operational recommendations that owners can apply with 1 click.

---

## 2. Target Verticals

Kvik focuses exclusively on appointment-driven businesses where customer acquisition occurs via text messaging:

- **Beauty Salons & Spa:** High-volume inquiries about procedures, pricing, and master availability; requires fast responses to prevent leads from booking elsewhere.
- **Medical & Aesthetic Clinics:** Patient reception overload; requires preliminary triage of symptoms, doctor specialties, and procedure preparation rules before booking.
- **Fitness Studios & Sports Centers:** High drop-off on membership and trial class inquiries; requires interactive scheduling and multi-step follow-ups to convert cold leads.
- **Consulting & Professional Services:** Time lost coordinating discovery calls and explaining initial service packages; requires qualifying client budgets and scheduling consultations.

---

## 3. Product Journey & High-Level Flow

The platform encompasses four integrated stages:

```
[ Landing Page & GTM ]
          │
          ▼
[ Streamlined Onboarding ]
  • Niche Selection → Business Profile → Knowledge Ingestion
  • Catalog Review → Messaging Channel Connection → Qualification Rules
          │ (Direct redirect upon completion)
          ▼
[ Operational Dashboard ]
  • Operations: Unified Inbox, Calendar & Bookings, Clients CRM
  • AI & Growth: Business Insights, Automations & Follow-Up, AI Studio
  • Governance: Team & Specialists, Integrations, Workspace Settings
          │
          ▼
[ Autonomous AI & Backend Engine ]
  • AI-First Loop, Multilingual Voice STT, Smart Escalation & Takeover Lock
  • 5-Tier Availability Hierarchy, Round-Robin Load Balancing, Conversational BI
```

### 3.1 Streamlined Onboarding
The onboarding flow is designed to take less than 5 minutes, moving smoothly from company details to an active dashboard:
1. **Niche Selection:** The business selects its industry (Beauty, Clinic, Fitness, Consulting, or Other Appointment Business) to set up relevant baseline prompts and workflows.
2. **Business Profile:** Captures core company information (name, city, address, phone, website, Instagram, and short description).
3. **Knowledge Hub:** Connects business data using 2GIS profiles, website crawlers, multi-file document uploads (PDF, Excel, Word), or quick operational notes.
4. **Data Preview:** Displays structured categories, parsed services, and extracted prices so the user can verify data accuracy.
5. **Connect Channels:** Connects WhatsApp Business, Instagram Direct, or Telegram (with the option to skip and connect later).
6. **AI Qualification Rules:** Configures the primary questions the AI asks prospects before booking (service desired, master preference, preferred timing, and custom instructions).

> **Note on Onboarding Flow:** There is **no "Test & Activate" step** inside the onboarding wizard. Once qualification rules are saved, the user immediately enters the active dashboard. Interactive testing, sandbox conversations, and simulations take place directly within **AI Studio**, **Dev Messaging**, or the **Unified Inbox**.

---

## 4. Core Capabilities & Platform Features

### 4.1 AI-First Autonomous Responding & Voice Intelligence
- **AI Always Answers by Default:** The AI agent is the primary responder for 100% of incoming inquiries across all connected channels. There is no waiting delay; the AI instantly greets clients, answers inquiries using the business knowledge base, checks calendar openings, and confirms bookings.
- **Multilingual Voice Note Processing:** In our target markets, over 40% of customer inquiries arrive as audio voice messages, frequently mixing Russian and Kazakh (code-switching). The platform automatically transcribes inbound audio voice notes and passes the text directly into the AI engine, allowing the AI to respond seamlessly in text.

### 4.2 Intelligent Human Escalation & Specialist Takeover
When an inquiry exceeds the AI's intended scope, the system seamlessly escalates to human staff:
- **Automatic Escalation Triggers:**
  - **Visual & File Attachments:** When a client sends photos, videos, documents, or stickers, the conversation escalates to human staff so they can review the media.
  - **Explicit Human Request:** When a client asks for a human manager or operator (*"позовите человека"*, *"менеджер"*), the AI yields immediately.
  - **Knowledge Gaps & Complaints:** When the AI encounters an unanswerable question, a policy edge case, or customer dissatisfaction, it safely escalates the conversation.
- **Specialist Takeover Lock:** A manager or specialist can click to take over an escalated conversation from the Unified Inbox. This grants exclusive reply control to that specialist, preventing duplicate responses from other team members. Staff can send text, voice memos, and media attachments. When resolved, the specialist releases the conversation back to the AI.
- **Real-Time Notification Bridge:** High-priority escalations and booking events instantly alert managers through a dedicated **Telegram notification bot** (connected via 1-click deep link) and in-app dashboard alerts.

### 4.3 Conversational Business Intelligence (`/insights`)
In appointment businesses, **50% to 70% of prospective leads drop off mid-conversation without booking**. Because business owners lack the time to read thousands of message logs, they remain unaware of why they are losing revenue.

Kvik's autonomous Business Intelligence system continuously analyzes past conversations to produce prioritized, actionable recommendations:
- **Unmet Service Demand:** Identifies services clients repeatedly ask for that the business does not currently provide (e.g., discovering dozens of requests for a specific cosmetic procedure).
- **Schedule Optimization:** Discovers demand peaks outside existing operating hours (e.g., customers consistently asking for evening slots when the business closes early).
- **Pricing & Payment Friction:** Uncovers drop-offs caused by price sensitivity or missing installment options (such as requests for Kaspi Red).
- **Knowledge Deflection Gaps:** Flags recurring questions (such as parking or preparation policies) that repeatedly trigger human escalations.
- **Staff Workload Balancing:** Highlights imbalances where certain specialists are overbooked while others sit idle.
- **1-Click Execution:** Recommendations are accompanied by quantified proof (lost lead counts, estimated recoverable revenue) and anonymized customer quotes. Owners can apply fixes in 1 click (such as adding a service to the catalog or updating schedule hours).
- **Weekly Executive Snapshots:** Compiles an executive summary every week summarizing operational health and revenue opportunities.

### 4.4 Conversational CRM & Lead Lifecycle
Every customer who messages the business is tracked in an automated mini-CRM:
- **Lifecycle Stages:** Leads progress through clear stages: `New` → `Qualified` → `Appointment Set` → `Won` (or `Lost`).
- **Structured Loss Reasons:** When leads drop off, the system records structured reasons (e.g., price resistance, unresponsive after follow-up, out of service area, no-show) to feed the Business Intelligence engine.
- **Optimistic Attendance Model:** Completed appointment times automatically mark visits as attended and deals as won. If a customer misses their appointment, staff can flag them as a "No-Show" with a single click.
- **Visual Pipeline Kanban:** Receptionists and managers can view customer history, update details, or move leads across Kanban columns manually.

### 4.5 Smart Scheduling & Workload-Balanced Round Robin
- **5-Tier Availability Hierarchy:** Slot calculations strictly follow business priorities:
  1. Business date overrides (holidays and closures)
  2. Staff date overrides (vacations, sick leave, custom shifts)
  3. Staff weekly schedule templates
  4. Business default operating hours
  5. Active booking conflicts and buffer times
- **Workload-Balanced Round Robin:** When a customer requests an appointment without specifying a preference (e.g., *"Book me for Friday at 3 PM"*), the system balances appointments evenly across available, qualified specialists to prevent employee burnout.
- **Specialist Disambiguation:** If a client requests a common name shared by multiple specialists, the AI prompts the customer to clarify before confirming the slot.

### 4.6 Follow-Up Automation & Customer Retention
- **Three-Step Inactive Recovery:** Automatically nurtures leads who stop responding before booking:
  - *1st Touch (+2 hours):* Gentle contextual inquiry offering assistance.
  - *2nd Touch (+20 hours):* Proposes open time slots before communication windows close.
  - *3rd Touch (+48 hours):* Final re-engagement touch utilizing interactive channel templates.
  - *Auto-Disqualification (72 hours):* Moves permanently silent leads to the lost column to keep the CRM clean.
- **Channel Policy Compliance & Quiet Hours:** Follow-ups adhere strictly to messaging policies (free-form messages within active 24-hour windows and approved templates beyond 24 hours on WhatsApp). Messages are silenced during night hours (21:30 – 09:00) and sent the next morning.
- **Pre-Appointment Reminders:** Automated reminders sent 24 hours and 2 hours before the visit.
- **Post-Visit Review Booster & Win-Back:** Sends a direct 1-click link to leave a 2GIS review 2 hours after a visit, and triggers 30-day win-back messages for recurring services.

### 4.7 Multi-Source Knowledge Base & AI Studio
- **Centralized Knowledge Ingestion:** Aggregates operational information from 2GIS, company websites, uploaded files, and operational notes.
- **AI Persona & Instructions:** Business owners customize the AI's tone of voice, greeting messages, screening questions, and business rules.
- **Dynamic AI Tool Suite:** The AI assistant uses dynamic tools to query knowledge, look up live calendar slots, create bookings, and escalate conversations.

---

## 5. Dashboard Organization & User Experience

The web dashboard is organized into three clean functional areas accessible via a fixed sidebar:

1. **Daily Operations:**
   - **Unified Inbox (`/inbox`):** Omnichannel messaging stream with real-time updates, voice note playback, media attachments, and specialist takeover controls.
   - **Calendar (`/calendar`):** Daily matrix and weekly schedules across all specialists with conflict detection and fast manual booking.
   - **Clients & CRM (`/clients`):** Lead pipeline Kanban board, contact profiles, and conversation history.
2. **AI & Growth:**
   - **Business Insights (`/insights`):** Actionable recommendations derived from customer dialogues, demand trends, and 1-click actions.
   - **Automations (`/automations`):** Configuration for inactive lead follow-ups, appointment reminders, night mode, and review requests.
   - **AI Studio (`/ai-studio`):** Knowledge base manager, system prompt settings, qualification questions, and interactive testing sandbox.
3. **Governance & Settings:**
   - **Team (`/team`):** Specialist profiles, working shifts, and role permissions.
   - **Integrations (`/integrations`):** Channel connections for WhatsApp, Instagram, Telegram, and calendar synchronization.
   - **Settings (`/settings`):** Workspace details, Telegram notification recipient setup, and account management.

---

## 6. High-Level Technical System Architecture

Kvik is constructed as a **modular monolith** optimized for scalability, real-time messaging, and multi-tenant isolation:

```
┌────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                   │
│   Next.js Web Application | Modern Minimalist SaaS UI  │
│   Real-time WebSockets | Multi-Tenant Client State     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 APPLICATION SERVICE LAYER              │
│   NestJS Modular Monolith                              │
│   • Core Domains: Workspaces, Auth & RBAC, Staff       │
│   • Operations: Inbox, Bookings, Leads CRM             │
│   • Automation: Follow-Up Engine, Notifications        │
│   • Intelligence: AI Orchestrator, Business Insights   │
│   • Background Processing: Redis & BullMQ Queues       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             EXTERNAL SERVICES & DATA LAYER             │
│   • AI & NLP: Google Gemini, Deepgram Speech-to-Text   │
│   • Channels: Meta WhatsApp API, Instagram Graph API,  │
│     Telegram Bot API                                   │
│   • Storage: Cloudflare R2 / S3 (Audio & Media)        │
│   • Database: PostgreSQL with pgvector (Embeddings)    │
└────────────────────────────────────────────────────────┘
```

- **Data Privacy & Multi-Tenancy:** Data is strictly isolated by workspace. Specialists only see appointments and conversations assigned to them, while administrators manage operations across their locations.
- **Asynchronous Processing:** Long-running tasks (audio transcription, knowledge base vector indexing, follow-up scheduling, and dialogue signal mining) run asynchronously via background job queues to keep the user interface fast and responsive.
- **Media & Message Persistence:** All conversations and media files are stored securely in dedicated cloud storage and database records, ensuring full message history is retained regardless of external channel API limits.
