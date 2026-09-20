# 048 — Autonomous Business Intelligence, Insights & Recommendations System

> **Module:** `src/modules/business-insights/`, `src/modules/ai-engine/`, `src/modules/queues/`, `src/modules/knowledge-base/`  
> **Target Audience:** Backend Engineers, AI/Prompt Engineers, Frontend Engineers, Product Owners  
> **Status:** Architecture Blueprint & Implementation Specification  

---

## 1. Executive Summary & Core Philosophy

### 1.1. The Fundamental Problem
In appointment-based small and medium businesses (beauty salons, aesthetic clinics, fitness studios, consulting, auto detailing), **business owners and managers are trapped in day-to-day operations**. They lack the time and analytical tools to read through thousands of customer WhatsApp, Instagram, and Telegram conversations.

Consequently, critical business intelligence is lost:
1. **Hidden Lost Revenue:** 50–70% of inquiries drop off without booking, but owners do not know the exact reasons (pricing resistance, missing payment options like Kaspi Red, unaligned working hours, missing services).
2. **Unmet Demand Blindspots:** Dozens of prospective clients repeatedly ask for services the business does not offer (e.g., "Ламинирование ресниц", "Детский массаж", "Airtouch"), representing ready-to-capture revenue that goes unnoticed.
3. **Operational Bottlenecks:** Opening hours fail to align with real client inquiry peaks (e.g., 30% of requests ask for 19:00–21:00 evening slots when the clinic closes at 18:00).
4. **Knowledge Gaps & Bot Escalations:** Staff members are repeatedly interrupted to answer simple questions (parking, preparation for procedures, contraindications) because the AI lacks this data.

### 1.2. The Solution: Autonomous Conversational Business Intelligence
The **KVIK Business Improvements & Suggestions Engine** turns raw client messaging dialogues into structured, statistically validated, and actionable business recommendations with **1-click execution**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CONVERSATION LAYER (WhatsApp, Instagram, Telegram)                      │
│    Real-time dialogues between clients and AI / human managers.             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Session ended / 24h inactive / Deal resolved)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. TIER 1: EVENT-DRIVEN MICRO-EXTRACTION (BullMQ Worker)                    │
│    Extracts structured micro-signals from dialogue: unmet demands,          │
│    pricing objections, schedule friction, knowledge gaps, sentiment.        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Persisted to conversation_insights)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. TIER 2: STATISTICAL SIGNAL CLUSTERING & AGGREGATION (Nightly Cron)       │
│    Groups similar signals, deduplicates, filters noise/outliers,            │
│    calculates conversion impact and statistical confidence (N ≥ 3 clients). │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Aggregated clusters passed to LLM)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. TIER 3: EXECUTIVE RECOMMENDATION SYNTHESIZER (Gemini 3.1 Flash Lite)          │
│    Generates prioritized recommendations with quantified proof,             │
│    anonymized verbatim quotes, estimated ROI, and 1-click action triggers.   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. PRESENTATION & EXECUTION LAYER (Dashboard Recommendations Center)        │
│    Owner views cards by impact (High/Med/Low) and clicks "Apply" or         │
│    "Dismiss with Feedback" (e.g., Auto-add service, adjust schedule).       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 6 Core Suggestion Archetypes (With Real-World Examples)

Every recommendation produced by the engine belongs to one of 6 battle-tested business archetypes:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   THE 6 SUGGESTION ARCHETYPES                                    │
├──────────────────────────────────────────────────┬───────────────────────────────────────────────┤
│ 1. SERVICE CATALOG & UNMET DEMAND EXPANSION      │ Identifies missing services clients ask for.  │
│ 2. SCHEDULE & CAPACITY OPTIMIZATION              │ Identifies demand peaks outside work hours.   │
│ 3. PRICING, PACKAGING & PAYMENT FRICTION         │ Detects price objections & missing pay terms. │
│ 4. KNOWLEDGE BASE & AI DEFLECTION BLINDSPOTS     │ Uncovers missing FAQs causing escalations.    │
│ 5. STAFF WORKLOAD & SPECIALIST BALANCING         │ Balances overbooked vs idle masters.          │
│ 6. MARKETING & CHANNEL CONVERSION INTELLIGENCE   │ Highlights channel-specific conversion trends.│
└──────────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

### Archetype 1: Service Catalog & Unmet Demand Expansion
* **The Business Scenario:** A beauty salon specializes in haircuts and coloring. Over the past 30 days, 19 clients asked if they offer *ламинирование бровей и ресниц* (eyebrow & eyelash lamination). The AI responded that the service is unavailable, and all 19 leads dropped off (`DEAL_LOST`).
* **Generated Recommendation:**
  * **Title:** *"Высокий спрос на новую услугу: Ламинирование бровей и ресниц"*
  * **Category:** `SERVICE_EXPANSION`
  * **Impact:** `HIGH`
  * **Quantified Evidence:** 19 unique clients inquired in 30 days (13% of all lost leads). Estimated monthly lost bookings: 15–18.
  * **Customer Quotes:**
    * *"Здравствуйте, а ламинирование бровей у вас делают?"* (WhatsApp)
    * *"Подскажите, можно сделать комплекс ламинирование ресниц + окрашивание?"* (Instagram)
  * **1-Click Action Payload:** `ADD_SERVICE_OFFERING` $\rightarrow$ Pre-populates the Knowledge Base modal with service title, typical duration (60 min), and category.

---

### Archetype 2: Schedule & Capacity Optimization
* **The Business Scenario:** A dental clinic operates Monday–Saturday from 09:00 to 18:00. Over 3 weeks, 28 clients in the chat requested evening appointments at 19:00 or 20:00 after their working hours. Unable to accommodate them, 22 of those clients went to competitors.
* **Generated Recommendation:**
  * **Title:** *"Продление рабочего времени в будни до 20:00 (вечерний спрос)"*
  * **Category:** `SCHEDULE_OPTIMIZATION`
  * **Impact:** `HIGH`
  * **Quantified Evidence:** 28 clients requested slots after 18:00 (78% dropped off due to schedule conflict). Thursday and Friday have the highest evening demand.
  * **Customer Quotes:**
    * *"Я работаю до 18:30, есть ли окошко на 19:00 или 19:30?"*
    * *"К сожалению, до 18:00 никак не успеваю, в субботу всё занято. Спасибо, поищу другую клинику."*
  * **1-Click Action Payload:** `UPDATE_SCHEDULE_HOURS` $\rightarrow$ Offers 1-click update to extend working hours for Thursday and Friday to 20:00 in `WorkspaceScheduleTemplate`.

---

### Archetype 3: Pricing Resistance, Packaging & Payment Objections
* **The Business Scenario:** An auto detailing studio quotes 45,000 ₸ for ceramic coating. 38% of qualified leads stop responding immediately after the price is stated. 12 clients explicitly asked if *Kaspi Red* (installment payment) is available.
* **Generated Recommendation:**
  * **Title:** *"Высокий отвал на этапе цены керамики: добавьте рассрочку (Kaspi Red / Рассрочка)"*
  * **Category:** `PRICING_AND_PACKAGING`
  * **Impact:** `HIGH`
  * **Quantified Evidence:** 38% drop-off rate immediately following price disclosure (vs. 14% benchmark for other services). 12 explicit inquiries about installment/Kaspi Red.
  * **Customer Quotes:**
    * *"А в рассрочку через Kaspi Red можно оформить?"*
    * *"45 000 сразу дороговато, есть Kaspi 0-0-12?"*
  * **1-Click Action Payload:** `ADD_KNOWLEDGE_NOTE` $\rightarrow$ Inserts payment terms policy note into Knowledge Base: *"Принимаем Kaspi Red и рассрочку 0-0-12 без переплат"*, updating the AI deal-closing pitch.

---

### Archetype 4: Knowledge Base & FAQ Blindspots (Deflection Killers)
* **The Business Scenario:** A laser cosmetology clinic receives 24 inquiries asking if their procedures are safe during pregnancy or breastfeeding, and whether there is private parking near the clinic. The AI has no info on this and executes `escalate_to_human`, creating a backlog for clinic receptionists.
* **Generated Recommendation:**
  * **Title:** *"Добавьте в базу знаний информацию о противопоказаниях (ГВ/беременность) и парковке"*
  * **Category:** `KNOWLEDGE_GAP`
  * **Impact:** `MEDIUM`
  * **Quantified Evidence:** 24 conversations escalated to manager solely due to missing FAQ info. Average manager response time was 42 minutes, causing 7 clients to abandon chat.
  * **Customer Quotes:**
    * *"Подскажите, при грудном вскармливании можно делать чистку?"*
    * *"У вас есть своя парковка во дворе или где оставить машину?"*
  * **1-Click Action Payload:** `ADD_FAQ_ENTRIES` $\rightarrow$ Auto-drafts 2 QA notes ready for review:
    1. *Противопоказания: Процедуры лазера противопоказаны в период беременности и лактации...*
    2. *Парковка: Бесплатная гостевая парковка со стороны улицы Достык, шлагбаум открывается по звонку.*

---

### Archetype 5: Staff Workload & Specialist Balancing
* **The Business Scenario:** In a barbershop, 65% of all clients specifically ask for Top-Barber "Данияр", whose calendar is fully booked 14 days in advance. Meanwhile, Barber "Алихан" has a 60% idle calendar. Many clients reject booking because Daniyar has no slots today.
* **Generated Recommendation:**
  * **Title:** *"Дисбаланс загрузки мастеров: дефицит слотов у Данияра и недозагрузка Алихана"*
  * **Category:** `STAFF_BALANCING`
  * **Impact:** `MEDIUM`
  * **Quantified Evidence:** 41 clients requested Daniyar but were rejected due to full schedule; only 15% agreed to switch to another master. Alikhan has 24 free hours/week.
  * **Recommendation Action:** Enable AI cross-selling script: *"У Данияра всё занято до конца недели, но мастер Алихан учился у Данияра и работает в той же технике. Есть идеальное время на завтра в 15:00. Записать вас?"*
  * **1-Click Action Payload:** `UPDATE_PROMPT_RULE` $\rightarrow$ Injects dynamic cross-recommendation instruction into AI system prompt.

---

### Archetype 6: Marketing & Channel Conversion Intelligence
* **The Business Scenario:** An aesthetic fitness studio gets inquiries from Instagram Direct and WhatsApp. In Instagram Direct, 52% of leads abandon the chat when sent long descriptive texts about gym subscriptions. On WhatsApp, short 2-choice questions convert at 68%.
* **Generated Recommendation:**
  * **Title:** *"Упростите первый шаг в Instagram Direct: переход на пробное занятие вместо длинных прайсов"*
  * **Category:** `MARKETING_INSIGHT`
  * **Impact:** `LOW` (Tactical)
  * **Quantified Evidence:** Instagram conversion rate to trial booking is 18.2% vs. 44.5% on WhatsApp. 70% of Instagram drop-offs occur after receiving multi-tier pricing table.
  * **1-Click Action Payload:** `UPDATE_QUALIFICATION_RULE` $\rightarrow$ Updates Instagram prompt rule to focus strictly on offering the 1st Trial Session for 2,000 ₸ instead of the full price list.

---

## 3. The 3-Tier Data Pipeline: Deep Architecture

Processing business intelligence across thousands of raw conversation messages requires an architecture that is **ultra-low cost**, **asynchronous**, **noise-resistant**, and **zero-latency for live chats**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           3-TIER PROCESSING PIPELINE FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  [Live Inbound Chat] ──► [Chat Ends / 24h Silence / Booking Confirmed / Deal Lost]          │
│                                       │                                                     │
│                                       ▼                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ TIER 1: Real-Time Micro-Extraction Worker (BullMQ: INSIGHTS_QUEUE)                    │  │
│  │ • Input: Last session messages (max 20 turns) + Lead status                           │  │
│  │ • Output: Structured Micro-Signal JSON (unmetNeeds, objections, knowledgeGaps)        │  │
│  │ • Cost: ~300 tokens ($0.00003 USD) per session. Zero LLM latency for live user!       │  │
│  │ • DB Table: conversation_insights                                                     │  │
│  └────────────────────────────────────┬──────────────────────────────────────────────────┘  │
│                                       │                                                     │
│                                       ▼ (Persisted micro-signals)                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ TIER 2: Statistical Signal Clustering & Aggregation (Cron: Nightly 02:00 Almaty)      │  │
│  │ • Groups signals by normalized semantic key & category                                │  │
│  │ • Filters single-occurrence noise: Threshold N ≥ 3 unique clients                     │  │
│  │ • Aggregates lead loss metrics, drop-off rates, channel breakdown                     │  │
│  │ • DB Table: business_signal_clusters                                                  │  │
│  └────────────────────────────────────┬──────────────────────────────────────────────────┘  │
│                                       │                                                     │
│                                       ▼ (Clusters with N ≥ 3 clients)                       │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ TIER 3: Executive Recommendation Synthesizer (Gemini 3.1 Flash Lite)                       │  │
│  │ • Transforms validated clusters + current businessContext into actionable suggestions │  │
│  │ • Generates: Title, Summary, Quantified Evidence, Quotes, ROI, 1-Click Action Payload │  │
│  │ • DB Table: business_recommendations                                                  │  │
│  │ • Real-Time: Emits Socket.IO event insights.recommendation_generated                  │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.1. Tier 1: Real-Time Micro-Extraction Worker

#### Trigger Condition:
The micro-extraction job (`EXTRACT_CONVERSATION_INSIGHTS`) is scheduled on `INSIGHTS_QUEUE` when:
1. Conversation enters 24-hour inactivity boundary.
2. Lead status changes to terminal state (`DEAL_WON` or `DEAL_LOST`).
3. Conversation is closed manually by manager.
4. Follow-up sequence terminates (after Step 3 / 72h).

#### Micro-Extraction System Prompt & Schema:
```text
Ты — аналитический AI-экстрактор данных клиентского сервиса.
Проанализируй диалог между клиентом и компанией и извлеки СТРУКТУРИРОВАННЫЕ СИГНАЛЫ для бизнес-аналитики.

ФОКУСИРУЙСЯ НА:
1. unmetNeeds: Услуги, товары, условия или форматы, которые клиент искал, но которых нет у компании.
2. objections: Причины сомнений или отказа (цена, локация, время, недоверие, конкурент).
3. scheduleFriction: Трудности со временем записи (нет окон вечером/на выходных, долгий срок ожидания).
4. knowledgeGaps: Вопросы клиента, на которые AI/менеджер не смог ответить из-за нехватки информации.
5. sentimentScore: Оценка удовлетворенности клиента (от 1 до 10).
6. verbatimQuotes: До 2 ключевых цитат клиента (на языке оригинала), отражающих суть проблемы/потребности.

ВАЖНО: Если диалог стандартный и не содержит трения, верни пустые массивы. Не выдумывай проблемы, если их не было.
```

#### Micro-Extraction JSON Schema Output:
```json
{
  "unmetNeeds": ["ламинирование ресниц"],
  "objections": [
    {
      "category": "PRICE_TOO_HIGH",
      "detail": "Клиент посчитал 35 000 ₸ за окрашивание слишком высокой ценой",
      "mentionedCompetitor": null
    }
  ],
  "scheduleFriction": {
    "requestedTime": "evening_after_19",
    "requestedDayOfWeek": "friday",
    "conflictReason": "clinic_closes_at_18"
  },
  "knowledgeGaps": [
    "наличие гостевой парковки"
  ],
  "sentimentScore": 6,
  "verbatimQuotes": [
    "А ламинирование ресниц у вас делают?",
    "А парковка у вас есть во дворе?"
  ]
}
```

---

### 3.2. Tier 2: Statistical Signal Clustering & Aggregation Worker

Raw micro-signals cannot be shown directly to users because a single complaint or eccentric query does not warrant a business change. 

Tier 2 aggregates signals over a rolling 7/14/30 day window:
1. **Semantic Normalization:** Converts synonymous raw strings into canonical signal keys:
   * `"ламинирование ресниц"`, `"реснички ламинируете?"`, `"ламинирование бровей и ресниц"` $\longrightarrow$ `unmet_service:eyelash_lamination`
   * `"после 19:00"`, `"вечером в 20:00"`, `"есть запись на 19:30?"` $\longrightarrow$ `schedule_friction:weekday_evening_after_19`
   * `"есть Kaspi Red?"`, `"в рассрочку можно?"`, `"Kaspi 0-0-12"` $\longrightarrow$ `objection:missing_kaspi_red`
2. **Frequency & Volume Gate (Anti-Noise Filter):**
   * A cluster must reach a minimum threshold of **$N \ge 3$ distinct unique clients** (within 30 days) before it is eligible for recommendation synthesis.
   * Single-instance outliers ($N = 1 \text{ or } 2$) remain in the cluster database as pending signals and are never shown to the user.
3. **Correlation with Funnel Loss:**
   * Calculates the exact financial and lead loss impact:
     $$\text{Loss Rate} = \frac{\text{Leads in Cluster with Status DEAL\_LOST}}{\text{Total Leads in Cluster}} \times 100\%$$

---

### 3.3. Tier 3: Executive Recommendation Synthesizer

Once a signal cluster exceeds the significance threshold ($N \ge 3$), the synthesizer worker runs Gemini 3.1 Flash Lite to convert statistical clusters into clear, executive-grade recommendations with embedded 1-click execution payloads.

#### Synthesizer Prompt:
```text
Ты — главный операционный бизнес-консультант для сервисных компаний (салоны, клиники, студии).
На основе агрегированных данных клиентских диалогов сформируй КОНКРЕТНЫЕ, ПРАКТИЧЕСКИЕ РЕКОМЕНДАЦИИ для владельца бизнеса.

ТЕКУЩИЙ КОНТЕКСТ БИЗНЕСА:
- Название: {{businessName}}
- Ниша: {{nicheProfile}} ({{subSegment}})
- Режим работы: {{workingHoursSummary}}
- Текущие услуги: {{servicesSummary}}

ВАЛИДИРОВАННЫЙ КЛАСТЕР СИГНАЛОВ ИЗ ДИАЛОГОВ:
- Категория: {{clusterCategory}}
- Количество уникальных клиентов: {{uniqueClientsCount}}
- Процент потерянных лидов: {{lostPercentage}}%
- Ключевые цитаты клиентов: {{clientQuotes}}

ТРЕБОВАНИЯ К РЕКОМЕНДАЦИИ:
1. Заголовок должен быть четким и указывать конкретное действие (например: "Добавьте в меню услугу: Ламинирование бровей").
2. Обоснуй выгоду в цифрах (сколько клиентов обратилось, сколько лидов теряется).
3. Сформируй готовый actionPayload (готовый текст для базы знаний, параметры расписания или правила для ИИ), чтобы владелец мог применить рекомендацию в 1 клик.
```

---

## 4. Actionable 1-Click Execution Payloads (Closing the Loop)

The most distinctive feature of KVIK's recommendation system is **1-Click Execution**. Business owners should not have to manually navigate 5 settings pages to act on a recommendation. Every recommendation includes a strongly typed `actionPayload`.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ACTIONABLE 1-CLICK PAYLOAD TYPES                      │
├─────────────────────────┬───────────────────────────────────────────────────┤
│ 1. ADD_SERVICE_OFFERING │ Adds a new service directly into Knowledge Base.  │
│ 2. UPDATE_SCHEDULE_HOURS│ Extends opening hours for specific weekdays.      │
│ 3. ADD_KNOWLEDGE_NOTE   │ Inserts FAQ / policy note into Knowledge Base.    │
│ 4. UPDATE_PROMPT_RULE   │ Injects specialized sales script into AI prompt.  │
│ 5. DISMISS_WITH_FEEDBACK│ Dismisses and trains engine on owner preferences. │
└─────────────────────────┴───────────────────────────────────────────────────┘
```

### 4.1. Payload Type Definitions

#### 1. `ADD_SERVICE_OFFERING`
```json
{
  "actionType": "ADD_SERVICE_OFFERING",
  "payload": {
    "serviceName": "Ламинирование бровей и ресниц",
    "category": "Брови и ресницы",
    "suggestedPrice": 12000,
    "suggestedDurationMinutes": 60,
    "description": "Комплексное ламинирование и окрашивание ресниц и бровей премиальными составами."
  }
}
```
* **When user clicks "Apply":** Opens the *Add Service* drawer pre-filled with these exact values; on confirmation, writes to `KnowledgeEntry` and updates `businessContext`.

#### 2. `UPDATE_SCHEDULE_HOURS`
```json
{
  "actionType": "UPDATE_SCHEDULE_HOURS",
  "payload": {
    "targetDays": ["THURSDAY", "FRIDAY"],
    "newOpenTime": "09:00",
    "newCloseTime": "20:00",
    "reason": "Extension of evening hours to capture peak demand after 18:00."
  }
}
```
* **When user clicks "Apply":** Directly updates `WorkspaceScheduleTemplate` records for Thursday and Friday via `WorkspacesScheduleService`.

#### 3. `ADD_KNOWLEDGE_NOTE`
```json
{
  "actionType": "ADD_KNOWLEDGE_NOTE",
  "payload": {
    "title": "Условия оплаты и Kaspi Red",
    "content": "В нашем салоне доступна оплата через Kaspi QR, Kaspi Red (рассрочка на 3 месяца) и Kaspi Рассрочка 0-0-12 на все услуги от 20 000 ₸.",
    "isOperationalNote": true
  }
}
```
* **When user clicks "Apply":** Creates a new `KnowledgeEntry` (`type: MANUAL_NOTE`), triggers re-extraction of `businessContext`, and immediately equips the AI with the new payment terms.

#### 4. `UPDATE_PROMPT_RULE`
```json
{
  "actionType": "UPDATE_PROMPT_RULE",
  "payload": {
    "ruleKey": "cross_sell_alternative_master",
    "ruleText": "Если клиент просит запись к мастеру Данияру на ближайшие дни, но свободных окон нет, обязательно предложи мастера Алихана как сертифицированного топ-специалиста с ближайшим свободным окном."
  }
}
```
* **When user clicks "Apply":** Appends rule to `Workspace.qualificationRules` JSON.

---

## 5. Database Architecture & Prisma Schema Additions

To support this pipeline, we introduce 3 new Prisma models into `prisma/schema.prisma`:

```
┌─────────────────────────┐          ┌───────────────────────────┐
│      Conversation       │          │         Workspace         │
└────────────┬────────────┘          └─────────────┬─────────────┘
             │ 1                                   │ 1
             │                                     │
             ▼ *                                   ▼ *
┌─────────────────────────┐          ┌───────────────────────────┐
│   ConversationInsight   │─────────►│  BusinessRecommendation   │
│  (Micro-Signals / Sess) │          │  (Aggregated Actionable)  │
└─────────────────────────┘          └─────────────┬─────────────┘
                                                   │ 1
                                                   ▼ *
                                     ┌───────────────────────────┐
                                     │   RecommendationDismissal │
                                     │  (Owner Feedback Memory)  │
                                     └───────────────────────────┘
```

### 5.1. Prisma Schema Definition

```prisma
enum InsightCategory {
  SERVICE_EXPANSION
  SCHEDULE_OPTIMIZATION
  PRICING_AND_PACKAGING
  KNOWLEDGE_GAP
  STAFF_BALANCING
  MARKETING_INSIGHT
}

enum InsightImpact {
  HIGH
  MEDIUM
  LOW
}

enum RecommendationStatus {
  NEW
  ACCEPTED
  DISMISSED
  IMPLEMENTED
}

enum RecommendationActionType {
  ADD_SERVICE_OFFERING
  UPDATE_SCHEDULE_HOURS
  ADD_KNOWLEDGE_NOTE
  UPDATE_PROMPT_RULE
  MANUAL_ACTION_REQUIRED
}

enum DismissalReasonCode {
  NOT_APPLICABLE_TO_NICHE
  BUSINESS_DECISION_NO
  ALREADY_RESOLVED_OFFLINE
  INCORRECT_EXTRACTION
  OTHER
}

model ConversationInsight {
  id              String       @id @default(uuid())
  workspaceId     String
  workspace       Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  leadId          String?
  lead            Lead?        @relation(fields: [leadId], references: [id], onDelete: SetNull)

  // Extracted Micro-Signals (JSON arrays)
  unmetNeeds      Json?        // string[] (e.g. ["ламинирование ресниц"])
  objections      Json?        // [{ category, detail, mentionedCompetitor }]
  scheduleFriction Json?       // { requestedTime, requestedDayOfWeek, conflictReason }
  knowledgeGaps   Json?        // string[] (e.g. ["парковка", "противопоказания"])
  sentimentScore  Int?         // 1 to 10
  verbatimQuotes  Json?        // string[] of authentic client quotes
  
  sessionEndedAt  DateTime     @default(now())
  createdAt       DateTime     @default(now())

  @@index([workspaceId, createdAt])
  @@index([conversationId])
  @@map("conversation_insights")
}

model BusinessRecommendation {
  id              String                   @id @default(uuid())
  workspaceId     String
  workspace       Workspace                @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  category        InsightCategory
  impact          InsightImpact            @default(MEDIUM)
  status          RecommendationStatus     @default(NEW)
  
  title           String
  executiveSummary String                  @db.Text
  problemDiagnosis String                  @db.Text
  
  // Quantified Evidence
  uniqueClientsCount Int                   @default(0)
  lostLeadsCount   Int                     @default(0)
  lostRevenueScore Int                     @default(0) // 0-100 relative score
  sampleQuotes    Json                     // Array of { quote: string, channel: string, date: string }
  
  // 1-Click Action Specification
  actionType      RecommendationActionType @default(MANUAL_ACTION_REQUIRED)
  actionPayload   Json?                    // Strongly typed action payload for 1-click execution
  
  // Lifecycle tracking
  implementedAt   DateTime?
  dismissedAt     DateTime?
  expiresAt       DateTime?                // Auto-refresh recommendations after 30 days
  createdAt       DateTime                 @default(now())
  updatedAt       DateTime                 @updatedAt

  dismissals      RecommendationDismissal[]

  @@index([workspaceId, status])
  @@index([workspaceId, category])
  @@index([workspaceId, impact])
  @@map("business_recommendations")
}

model RecommendationDismissal {
  id               String               @id @default(uuid())
  workspaceId      String
  workspace        Workspace            @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  recommendationId String
  recommendation   BusinessRecommendation @relation(fields: [recommendationId], references: [id], onDelete: Cascade)
  
  userId           String
  user             User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  reasonCode       DismissalReasonCode
  feedbackNotes    String?
  suppressKey      String?              // Canonical key to suppress future suggestions (e.g. "unmet_service:truck_repair")
  createdAt        DateTime             @default(now())

  @@index([workspaceId, suppressKey])
  @@map("recommendation_dismissals")
}
```

---

## 6. Background Workers & BullMQ Queue Architecture

### 6.1. Queue & Job Names (`src/modules/queues/constants.ts`)

```typescript
export const INSIGHTS_QUEUE = 'insights-queue';

export const EXTRACT_CONVERSATION_INSIGHTS_JOB = 'EXTRACT_CONVERSATION_INSIGHTS';
export const AGGREGATE_WORKSPACE_SIGNALS_JOB   = 'AGGREGATE_WORKSPACE_SIGNALS';
export const GENERATE_RECOMMENDATIONS_JOB      = 'GENERATE_RECOMMENDATIONS';
export const PURGE_EXPIRED_INSIGHTS_JOB        = 'PURGE_EXPIRED_INSIGHTS';
```

### 6.2. BullMQ Job Payloads

```typescript
export interface ExtractConversationInsightsPayload {
  workspaceId: string;
  conversationId: string;
  leadId?: string;
  triggerReason: 'SESSION_BOUNDARY_24H' | 'LEAD_DEAL_LOST' | 'LEAD_DEAL_WON' | 'CONVERSATION_CLOSED';
}

export interface AggregateWorkspaceSignalsPayload {
  workspaceId: string;
  lookbackDays: number; // default: 30
}

export interface GenerateRecommendationsPayload {
  workspaceId: string;
  forceRegenerate?: boolean;
}
```

### 6.3. Job Execution Lifecycle

```
[Conversation Inactivity / Terminal Lead Event]
                    │
                    ▼ (Dispatches BullMQ Job with 5 min debounce)
┌─────────────────────────────────────────────────────────────┐
│ 1. ExtractConversationInsightsWorker                        │
│    • Checks if last messages were already extracted         │
│    • Calls GeminiService.generateJson<MicroSignals>()       │
│    • Persists ConversationInsight in PostgreSQL             │
└─────────────────────────────────────────────────────────────┘

[Cron Schedule: Every Night at 02:00 Asia/Almaty]
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AggregateWorkspaceSignalsWorker                          │
│    • Scans conversation_insights for past 30 days           │
│    • Checks dismissed suppression keys from DB              │
│    • Clusters by canonical key; filters clusters with N < 3 │
│    • If eligible clusters exist, enqueues Tier 3 job        │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GenerateRecommendationsWorker                            │
│    • Compiles clusters + businessContext into Gemini prompt │
│    • Calls Gemini 3.1 Flash Lite to synthesize recommendations   │
│    • Upserts BusinessRecommendation records                 │
│    • Emits WebSocket event `insights.recommendation_created`│
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Frontend User Experience: The Recommendations Center

The Frontend Recommendations Center lives in the Dashboard navigation under **"Аналитика и Улучшения" / "Insights & Recommendations"**.

> [!NOTE]
> **"Запустить анализ" — this button is NOT shown to regular business owners.** The entire pipeline is fully automatic (Sunday 06:00 cron + event-driven per-conversation extraction). The manual trigger endpoint (`POST /trigger-analysis`) is an **admin/developer-only tool** accessible only to KVIK platform staff for debugging, testing, and forced refreshes during onboarding demos. It must be hidden behind an internal admin flag in the frontend.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  📊 Бизнес-рекомендации и аналитика спроса                              📅 Обновлено: 22 сен 2026       │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐                     │
│  │ 💡 3 Важных улучшения  │  │ 👥 68 Потенциальных    │  │ 🎯 +18% Возможный      │                     │
│  │    требуют внимания    │  │    клиентов упущено     │  │    прирост конверсии   │                     │
│  └────────────────────────┘  └────────────────────────┘  └────────────────────────┘                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Фильтры: [ Все (6) ] [ Высокий приоритет (3) ] [ Услуги ] [ График ] [ Цены ] [ База знаний ]          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🔴 ВЫСОКИЙ ПРИОРИТЕТ  •  УСЛУГИ                                                       30 дней     │  │
│  │ Высокий спрос на новую услугу: Ламинирование бровей и ресниц                                      │  │
│  │ 19 клиентов искали эту услугу в переписке WhatsApp и Instagram (13% от всех отказов).             │  │
│  │ Потенциальный доход: ~220 000 ₸ / месяц.                                                          │  │
│  │                                                                                                   │  │
│  │ [ 💬 Посмотреть цитаты клиентов (19) ]    [ ➕ Добавить услугу в меню (1 клик) ]   [ Отклонить ]  │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🔴 ВЫСОКИЙ ПРИОРИТЕТ  •  ГРАФИК И СЛОТЫ                                               30 дней     │  │
│  │ Продлите график работы в четверг и пятницу до 20:00 (вечерний спрос)                              │  │
│  │ 28 клиентов запросили слоты после 18:00. Из-за закрытия в 18:00 ушли 22 клиента.                  │  │
│  │                                                                                                   │  │
│  │ [ 💬 Посмотреть цитаты клиентов (28) ]    [ ⏰ Продлить график до 20:00 (1 клик) ]  [ Отклонить ]  │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🟡 СРЕДНИЙ ПРИОРИТЕТ  •  БАЗА ЗНАНИЙ                                                  14 дней     │  │
│  │ Добавьте информацию о гостевой парковке и правилах подготовки                                     │  │
│  │ 24 диалога переведены на живого менеджера только из-за этих двух вопросов.                         │  │
│  │                                                                                                   │  │
│  │ [ 💬 Посмотреть цитаты клиентов (24) ]    [ 📝 Добавить ответ в базу знаний ]      [ Отклонить ]  │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1. "Proof & Evidence" Modal / Drawer
When the user clicks **"Посмотреть цитаты клиентов"**, a slide-over drawer opens showing real, anonymized snippets proving the demand:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💬 Доказательства спроса: Ламинирование бровей и ресниц                     │
│ Всего упоминаний: 19 клиентов за 30 дней                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📱 WhatsApp • 17 сентября, 14:22 • Лид: Айдос (потерян)                     │
│ «Здравствуйте! Девушка просила узнать, делаете ли вы комплекс ламинирование │
│  бровей и окрашивание ресниц? Сколько по времени занимает?»                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📸 Instagram • 15 сентября, 19:05 • Лид: Аружан (потерян)                   │
│ «Добрый вечер, подскажите прайс на ламинирование ресниц пожалуйста»        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📱 WhatsApp • 12 сентября, 11:40 • Лид: Динара (потерян)                    │
│ «А брови ламинируете или только коррекция пинцетом?»                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Complete REST API Specification

All endpoints require `Authorization: Bearer <access_token>` and enforce multi-tenant isolation via workspace token scoping.

---

### 8.1. `GET /workspaces/:workspaceId/recommendations`
> Retrieves paginated business recommendations with category, impact, and status filtering.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `status` | `RecommendationStatus` | No | `NEW` | `NEW`, `ACCEPTED`, `DISMISSED`, `IMPLEMENTED`, `ALL` |
| `category` | `InsightCategory` | No | — | Filter by archetype category |
| `impact` | `InsightImpact` | No | — | `HIGH`, `MEDIUM`, `LOW` |
| `page` | `number` | No | 1 | Page number |
| `limit` | `number` | No | 10 | Items per page (max 50) |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "rec-uuid-1",
      "category": "SERVICE_EXPANSION",
      "impact": "HIGH",
      "status": "NEW",
      "title": "Высокий спрос на новую услугу: Ламинирование бровей и ресниц",
      "executiveSummary": "19 клиентов искали эту услугу в переписке WhatsApp и Instagram (13% от всех отказов).",
      "problemDiagnosis": "Клиенты активно интересуются комплексным ламинированием ресниц. Бот сообщает об отсутствии услуги, в результате чего лиды уходят к конкурентам.",
      "uniqueClientsCount": 19,
      "lostLeadsCount": 19,
      "lostRevenueScore": 85,
      "sampleQuotes": [
        {
          "quote": "Здравствуйте, а ламинирование бровей у вас делают?",
          "channel": "WHATSAPP",
          "date": "2026-09-17T14:22:00.000Z"
        },
        {
          "quote": "Подскажите, можно сделать комплекс ламинирование ресниц + окрашивание?",
          "channel": "INSTAGRAM",
          "date": "2026-09-15T19:05:00.000Z"
        }
      ],
      "actionType": "ADD_SERVICE_OFFERING",
      "actionPayload": {
        "serviceName": "Ламинирование бровей и ресниц",
        "category": "Брови и ресницы",
        "suggestedPrice": 12000,
        "suggestedDurationMinutes": 60,
        "description": "Комплексное ламинирование и уход за бровями и ресницами."
      },
      "createdAt": "2026-09-18T02:00:00.000Z"
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 10
}
```

---

### 8.2. `GET /workspaces/:workspaceId/recommendations/summary`
> Top-level KPI counts for dashboard header badges and alerts.

**Response `200 OK`:**
```json
{
  "totalActive": 6,
  "highImpactCount": 3,
  "mediumImpactCount": 2,
  "lowImpactCount": 1,
  "estimatedLostLeadsTotal": 68,
  "categoryBreakdown": {
    "SERVICE_EXPANSION": 2,
    "SCHEDULE_OPTIMIZATION": 1,
    "PRICING_AND_PACKAGING": 1,
    "KNOWLEDGE_GAP": 1,
    "STAFF_BALANCING": 1
  }
}
```

---

### 8.3. `POST /workspaces/:workspaceId/recommendations/:id/apply`
> Executes the embedded 1-click action payload, applying the changes to the Knowledge Base, Schedule, or Rules.

**Request Body (`ApplyRecommendationDto`):**
```json
{
  "customizedPayload": {
    "serviceName": "Ламинирование бровей и ресниц (Премиум)",
    "suggestedPrice": 14000
  }
}
```

**Response `200 OK`:**
```json
{
  "code": "insights.recommendation_applied",
  "message": "Recommendation successfully applied and changes saved.",
  "recommendationId": "rec-uuid-1",
  "status": "IMPLEMENTED"
}
```

---

### 8.4. `POST /workspaces/:workspaceId/recommendations/:id/dismiss`
> Dismisses the recommendation with structured owner feedback, preventing future spam for unwanted suggestions.

**Request Body (`DismissRecommendationDto`):**
```json
{
  "reasonCode": "BUSINESS_DECISION_NO",
  "feedbackNotes": "Мы принципиально специализируемся только на стрижках и не планируем вводить ресницы.",
  "suppressPermanently": true
}
```

**Response `200 OK`:**
```json
{
  "code": "insights.recommendation_dismissed",
  "message": "Recommendation dismissed and feedback saved.",
  "recommendationId": "rec-uuid-1",
  "status": "DISMISSED"
}
```

---

### 8.5. `GET /workspaces/:workspaceId/recommendations/demand-trends`
> Aggregate chart metrics: top lost reasons, peak inquiry hours vs working hours overlay, and unmet services bar chart.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `from` | `string (YYYY-MM-DD)` | No | 30 days ago | Period start |
| `to` | `string (YYYY-MM-DD)` | No | Today | Period end |

**Response `200 OK`:**
```json
{
  "period": { "from": "2026-08-18", "to": "2026-09-17" },
  "unmetServices": [
    { "service": "Ламинирование бровей/ресниц", "inquiries": 19, "lostLeads": 19 },
    { "service": "Детская стрижка", "inquiries": 11, "lostLeads": 8 },
    { "service": "Выезд мастера на дом", "inquiries": 7, "lostLeads": 7 }
  ],
  "hourlyInquiryDistribution": [
    { "hour": 9, "inquiries": 14, "isWorkingHour": true },
    { "hour": 14, "inquiries": 45, "isWorkingHour": true },
    { "hour": 18, "inquiries": 52, "isWorkingHour": true },
    { "hour": 19, "inquiries": 38, "isWorkingHour": false },
    { "hour": 20, "inquiries": 24, "isWorkingHour": false }
  ],
  "topObjections": [
    { "reason": "PRICE_TOO_HIGH", "count": 26, "percentage": 38.2 },
    { "reason": "NO_EVENING_SLOTS", "count": 22, "percentage": 32.4 },
    { "reason": "NO_PARKING_INFO", "count": 12, "percentage": 17.6 },
    { "reason": "PREFERRED_MASTER_BUSY", "count": 8, "percentage": 11.8 }
  ]
}
```

---

### 8.6. Manual Analysis Trigger (NOT IMPLEMENTED — Future Consideration)

> [!NOTE]
> A manual `POST /trigger-analysis` endpoint is **intentionally NOT implemented** at this stage. The entire pipeline runs fully automatically (event-driven per-conversation extraction + Sunday 06:00 cron). In the future, if KVIK platform admins or the onboarding team need the ability to force a pipeline run for debugging or demo purposes, an admin-only endpoint may be added behind an internal `isKvikPlatformAdmin` role guard.

---

## 9. Edge Cases, Hallucination Prevention & Security

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   EDGE CASE RESOLUTION MATRIX                                    │
├───────────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ SCENARIO                          │ SYSTEM SAFEGUARD & RESOLUTION                                │
├───────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 1. PII & Privacy Leakage          │ All phone numbers, emails, and full names are sanitized from │
│    in Client Quotes               │ `sampleQuotes` before persisting to database.                │
├───────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 2. Single-Outlier Hallucinations  │ Enforce strict threshold: N ≥ 3 distinct unique leads must   │
│    ("One eccentric client asked") │ mention a topic before any recommendation is synthesized.    │
├───────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 3. Dismissed / Unwanted Category  │ `RecommendationDismissal` records persistent suppression keys│
│    (Owner says: "We won't do it") │ (`suppressKey`). Future cron jobs skip suppressed topics.    │
├───────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 4. Multilingual & Translit Mixed  │ Prompts instruct Gemini to normalize Russian, Kazakh, and    │
│    Messages (e.g. "барма", "price")│ translit into standard canonical concepts.                   │
├───────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 5. Spam / Prank Dialogues         │ Conversations with `Lead.score < 20` or flagged as spam are  │
│    Polluting Analytics            │ excluded from the micro-signal aggregation window.           │
├───────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 6. Duplicate Recommendations      │ Before inserting, worker checks for existing `NEW`           │
│    Generated Every Week           │ recommendations with matching `category` and updates counts. │
└───────────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 10. Token Economics & Cost Modeling

KVIK's 3-tier decoupled architecture makes the entire Business Intelligence engine extraordinarily cost-effective:

| Processing Tier | Frequency | Tokens per Operation | Monthly Operations (500 chats) | Monthly Cost (Gemini Flash) |
|---|---|---|---|---|
| **Tier 1: Micro-Extraction** | On dialogue session end | ~350 input / 100 output | ~500 operations | **$0.021 USD** (~11 ₸) |
| **Tier 2: Statistical Aggregation** | Nightly (02:00) | 0 (pure SQL/PostgreSQL) | 30 runs | **$0.000 USD** (Free) |
| **Tier 3: Recommendation Synthesis**| Weekly or on-demand | ~1,500 input / 400 output | 4 runs / month | **$0.002 USD** (~1 ₸) |
| **Total Monthly Cost per Workspace**| — | — | — | **< $0.03 USD / month (~15 ₸)** |

> [!TIP]
> Because raw conversation histories are compressed into lightweight micro-signals immediately at session close, the weekly synthesizer never reads raw messages. It only reads pre-aggregated cluster summaries, keeping monthly LLM costs virtually zero.

---

## 11. Implementation Master Checklist

### Phase 1: Database & Prisma Migrations
- [x] Add `InsightCategory`, `InsightImpact`, `RecommendationStatus`, `RecommendationActionType`, `DismissalReasonCode` enums to `prisma/schema.prisma`.
- [x] Add `ConversationInsight`, `BusinessRecommendation`, `RecommendationDismissal`, `WeeklyInsightReport` models with workspace foreign keys, indexes, and unique constraints.
- [x] Add `weeklyReportEmailEnabled Boolean @default(true)` to `StaffMember`.
- [x] Apply schema changes to PostgreSQL database (`prisma db push` / `prisma migrate`).

### Phase 2: Micro-Extraction Pipeline (Tier 1)
- [x] Create `INSIGHTS_QUEUE` and job constants in `src/queues/constants.ts`.
- [x] Create `ConversationInsightExtractorService` in `src/modules/business-insights/`.
- [x] Implement BullMQ processor `insights.processor.ts` to consume `EXTRACT_CONVERSATION_INSIGHTS_JOB` and `INACTIVITY_INSIGHTS_JOB`.
- [x] Hook event triggers in `OrchestratorService` (24h session inactivity delayed job) and `LeadsService` (`DEAL_WON` / `DEAL_LOST` immediate extraction).
- [x] Implement `OnApplicationBootstrap` backfill scan for orphaned conversations after server reboot.
- [x] Sanitize client quotes against PII (phone numbers, email addresses, full names).

### Phase 3: Aggregation & Synthesis Engine (Tier 2 & 3)
- [x] Create `SignalsAggregatorService` to group micro-signals into canonical clusters with $N \ge 3$ client threshold.
- [x] Create `RecommendationSynthesizerService` with structured Gemini prompt (enterprise executive consulting style) and JSON schema.
- [x] Implement `WeeklyReportGeneratorService` to generate and persist `WeeklyInsightReport` and `BusinessRecommendation` records.
- [x] Register weekly cron job at Sunday 06:00 Asia/Almaty (01:00 UTC) in `business-insights.scheduler.ts`.

### Phase 4: Action Execution & Feedback Loop
- [x] Create `RecommendationActionExecutorService` to handle 1-click execution (`ADD_SERVICE_OFFERING`, `UPDATE_SCHEDULE_HOURS`, `ADD_KNOWLEDGE_NOTE`, `UPDATE_PROMPT_RULE`).
- [x] Enqueue `INGEST_MANUAL_NOTE_JOB` to `AI_JOBS_QUEUE` on 1-click note/service addition for instant RAG vector embedding.
- [x] Auto-resolve matching open schedule recommendations on `workspaces-schedule.service.ts` updates (Gap 3).
- [x] Implement dismissal tracking with `suppressKey` memory to prevent recurring unwanted suggestions.

### Phase 5: REST API, Controller & Real-Time Events
- [x] Create `BusinessInsightsController` and `BusinessInsightsService` in `src/modules/business-insights/`.
- [x] Implement endpoints:
  - `GET /workspaces/:id/insights/recommendations`
  - `GET /workspaces/:id/insights/recommendations/summary`
  - `POST /workspaces/:id/insights/recommendations/:id/apply`
  - `POST /workspaces/:id/insights/recommendations/:id/dismiss`
  - `GET /workspaces/:id/insights/demand-trends`
  - `GET /workspaces/:id/insights/reports`
  - `GET /workspaces/:id/insights/reports/:reportId`
  - `GET /workspaces/:id/insights/reports/:reportId/recommendations`
  - *(Manual trigger endpoint removed — pipeline runs autonomously)*
- [x] Create WebSocket gateway `BusinessInsightsGateway` (`/insights` namespace) for real-time recommendation updates.
- [x] Add i18n translation keys in `translation_keys_new.json`.
- [x] Validate that all date filtering uses `TimeUtil` (`Asia/Almaty` UTC+5).

### Phase 6: Verification & Code Quality
- [x] Verify complete type safety: `npx tsc --noEmit` passes with 0 errors.
- [x] Verify ESLint compliance: `npm run lint` passes with 0 errors and 0 warnings.
- [x] Verify NestJS compilation: `npm run build` succeeds cleanly.

---

## 12. Design Decisions, Open Questions & System Completeness Review

---

### 12.1. Report Cadence: Weekly vs. Monthly

**Decision: Weekly, generated every Sunday at 06:00 Asia/Almaty.**

#### Why Weekly (Not Monthly)

SMB operators in beauty/clinic/consulting niches operate on **7-day operational cycles** — they plan staffing, adjust hours, and respond to demand week by week. Monthly is too slow:

- A service gap that caused 19 lost leads in Week 1 of October still loses leads in Week 4 before a monthly report surfaces it.
- Owners can act on insights within a week (add a FAQ note, adjust Thursday hours, update a price).
- Weekly reports create a natural **Monday morning ritual**: the owner opens the dashboard and sees "What happened last week and what should I fix today?".

Monthly is appropriate for *longitudinal trend analysis* ("How has conversion trended over 90 days?") — that is a separate analytics chart, not the report cadence.

#### Archival: All Weekly Reports Are Immutable & Saved Forever

Every Sunday report is a **frozen snapshot** stored as a `WeeklyInsightReport` DB record. The Markdown content is generated once and stored inline. It is never overwritten or regenerated.

```
Mon–Sat:   Micro-Extraction runs on each completed conversation.
           Raw signals accumulate in `conversation_insights`.

Sunday 04:00 Asia/Almaty:
           AggregateWorkspaceSignalsWorker clusters the past 7 days
           of signals and computes eligible clusters (N ≥ 3).

Sunday 06:00 Asia/Almaty:
           GenerateWeeklyReportWorker runs Gemini to synthesize the report.
           Saves WeeklyInsightReport { markdownContent, periodStart,
           periodEnd, weekLabel } to DB.
           Upserts fresh BusinessRecommendation records linked to the report.
           Emits WebSocket event `insights.weekly_report_ready`.

Monday Morning (Owner Opens Dashboard):
           Notification badge: "Новый недельный отчёт готов".
           Owner views summary card + recommendation list.
           Can browse all past reports from the History archive.
```

#### Additional Prisma Model: `WeeklyInsightReport`

```prisma
model WeeklyInsightReport {
  id             String    @id @default(uuid())
  workspaceId    String
  workspace      Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  periodStart    DateTime  // Monday 00:00 of that week (Asia/Almaty, stored as UTC)
  periodEnd      DateTime  // Sunday 23:59 of that week (Asia/Almaty, stored as UTC)
  weekLabel      String    // e.g. "Week 38, 2026 (15–21 Sep)"

  markdownContent String   @db.Text  // Pre-rendered Markdown, served directly to frontend

  // Report-level aggregate metrics (denormalized for fast list rendering)
  totalLeadsAnalyzed   Int  @default(0)
  totalInsightsFound   Int  @default(0)
  highImpactCount      Int  @default(0)
  totalLostLeads       Int  @default(0)

  recommendations      BusinessRecommendation[]

  generatedAt    DateTime  @default(now())

  @@unique([workspaceId, periodStart])  // One report per workspace per week — DB-level idempotency
  @@index([workspaceId, generatedAt])
  @@map("weekly_insight_reports")
}
```

> [!NOTE]
> `BusinessRecommendation` gets a new optional FK `weeklyReportId String?` so every recommendation can be traced back to the exact weekly cycle that generated it. Add `weeklyReport WeeklyInsightReport? @relation(fields: [weeklyReportId], references: [id], onDelete: SetNull)`.

---

### 12.2. The 24h Inactivity Detection: Exact BullMQ Mechanism

> [!IMPORTANT]
> **There is NO polling loop. There is NO cron scanning all open conversations.** That would be an O(N) database scan every tick — massively wasteful at scale. The correct pattern is a **single delayed BullMQ job per conversation**, keyed by a deterministic job ID, cancelled by that ID the moment the user replies.

This is the same proven pattern used by the Follow-Up system (doc 047), just serving a different purpose here (triggering insight extraction instead of sending a nudge message).

#### Step-by-Step Mechanism

```
[User sends a message to Bot OR Manager sends a reply]
                    │
                    ▼
OrchestratorService / MessageHandler handles message
                    │
                    ├── Step 1: Cancel existing inactivity job (if any)
                    │      bullMQ.getJob(`inactivity:${conversationId}`)
                    │        .then(job => job?.remove())
                    │      [Idempotent — safe even if no job exists]
                    │
                    └── Step 2: Schedule a NEW delayed job for 24h
                           jobId:   `inactivity:${conversationId}`
                           delay:   24 * 60 * 60 * 1000  // 24h in ms
                           payload: {
                             conversationId,
                             workspaceId,
                             leadId,
                             expectedLastMessageAt: message.createdAt
                           }

[24 Hours Pass With No New User Message]
                    │
                    ▼
BullMQ fires InactivityWorker
                    │
                    ├── Idempotency check:
                    │   Fetch conversation.lastMessageAt from DB.
                    │   If lastMessageAt !== payload.expectedLastMessageAt:
                    │       ← User replied after job was scheduled → DROP JOB silently
                    │
                    └── Confirmed 24h inactivity:
                        → Dispatch EXTRACT_CONVERSATION_INSIGHTS_JOB
                           (triggerReason: 'SESSION_BOUNDARY_24H')
                        → If lead.status is NEW or QUALIFIED:
                           also schedule Follow-Up Step 1 (+2h nudge)
                           via FOLLOW_UP_QUEUE (per doc 047)
```

#### Why This is Resource-Efficient

| Concern | Answer |
|---|---|
| **CPU between messages** | Zero. BullMQ delayed jobs sit in Redis sorted set by fire timestamp. No polling loop. |
| **Cancellation cost** | O(1) Redis `ZREM` operation — one command, no DB scan. |
| **Jobs in Redis at peak** | At most 1 per open conversation. 1,000 active conversations = ~1,000 Redis entries ≈ 1 MB. |
| **DB queries per inactivity** | 1 idempotency read + 1 insight extraction write. Already needed regardless. |
| **Server restart resilience** | On `OnApplicationBootstrap`, scan conversations where `lastMessageAt < now - 24h` AND no `ConversationInsight` exists for that session. Backfill any missing delayed jobs. |

---

### 12.3. Historical Insights UI: Full Specification

The current Recommendations Center (Section 7) only shows **live active recommendations**. The History section is a distinct view.

#### Navigation Structure

```
Dashboard Sidebar
└── 📊 Аналитика и Инсайты
    ├── Текущие рекомендации   ← Live actionable cards (Section 7)
    └── История отчётов        ← Archive of all weekly reports [NEW]
```

#### History List View

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  📋 История недельных отчётов                                                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │ 📅 Неделя 38  (15–21 Сен 2026)                                      [ Открыть отчёт → ] │    │
│  │ 7 инсайтов  •  3 HIGH  •  ✅ 2 применено  •  ❌ 1 отклонено  •  🔵 1 новый             │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │ 📅 Неделя 37  (8–14 Сен 2026)                                       [ Открыть отчёт → ] │    │
│  │ 5 инсайтов  •  2 HIGH  •  ✅ 3 применено  •  ❌ 0 отклонено  •  🔵 0 новых             │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │ 📅 Неделя 36  (1–7 Сен 2026)                                        [ Открыть отчёт → ] │    │
│  │ 3 инсайта  •  1 HIGH  •  ✅ 2 применено  •  ❌ 1 отклонено  •  🔵 0 новых              │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Individual Report Drill-Down View

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ← Назад   📅 Отчёт: Неделя 38 (15–21 Сентября 2026)                                            │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  [Rendered Markdown from markdownContent field]                                                  │
│  142 входящих диалога. 68 лидов потеряно. AI обработал 87% без участия менеджера.               │
│  Топ проблемы: спрос на ламинирование ресниц, нет вечерних слотов по пт.                        │
│                                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Рекомендации из этого отчёта:                                                                   │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │ ✅ ПРИМЕНЕНО  18 сен 2026  •  SERVICE_EXPANSION  •  HIGH                               │     │
│  │ Высокий спрос на услугу: Ламинирование бровей и ресниц                                │     │
│  │ Действие: Услуга добавлена в базу знаний                                               │     │
│  └────────────────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │ ❌ ОТКЛОНЕНО  •  SCHEDULE_OPTIMIZATION  •  HIGH                                        │     │
│  │ Продлите график до 20:00 в четверг и пятницу                                          │     │
│  │ Причина: Уже решено оффлайн — наняли вечернего администратора                         │     │
│  └────────────────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │ 🔵 НОВАЯ (не обработана)  •  KNOWLEDGE_GAP  •  MEDIUM                                  │     │
│  │ Добавьте информацию о парковке и противопоказаниях                                    │     │
│  │                                   [ Применить ]      [ Отклонить ]                    │     │
│  └────────────────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Design Principles for History UI

1. **Recommendations stay actionable from past reports.** A `NEW` recommendation from Week 36 can still be applied in Week 39 — clicking "Apply" executes the same action executor as if it were a current card.
2. **Status badges are live from DB, not frozen.** `BusinessRecommendation.status` is always current. If you apply it today, the Week 36 report view immediately shows ✅.
3. **Markdown rendered from stored string.** The frontend fetches `markdownContent` and renders it with a standard Markdown renderer. No LLM call on page load.

#### New API Endpoints for History

```
GET  /workspaces/:id/reports
     → Paginated list of WeeklyInsightReport (id, weekLabel, periodStart/End, aggregate counts)

GET  /workspaces/:id/reports/:reportId
     → Full report (markdownContent + linked recommendations with current status)

GET  /workspaces/:id/reports/:reportId/recommendations
     → All BusinessRecommendation records linked to this weeklyReportId
```

---

### 12.4. System Completeness Review & External Factor Analysis

#### 12.4.1. What the Current Plan Covers Well ✅

| Area | Status |
|---|---|
| 6 signal archetypes with real examples | ✅ Complete |
| Anti-noise N≥3 threshold + spam exclusion + PII sanitization | ✅ Complete |
| Dismissed topic suppression (`suppressKey` memory) | ✅ Complete |
| 24h inactivity via BullMQ (this section) | ✅ Complete |
| Weekly archival with immutable Markdown | ✅ Complete |
| Historical UI with per-recommendation status tracking | ✅ Complete |
| 4 typed 1-click action executors | ✅ Complete |
| Cost model (<$0.03/workspace/month) | ✅ Complete |

---

#### 12.4.2. Identified Gaps That Require Resolution Before Implementation ⚠️

**Gap 1 — New Workspace Cold Start**
A fresh business with <3 leads/week has zero signals. The Recommendations Center would be empty for the first 1–3 weeks, making the feature feel broken.
- **Resolution:** Show a static empty-state card: *"Ваши данные накапливаются. Обычно первые инсайты появляются после 20–30 диалогов."* Additionally, pre-seed 2–3 generic niche-based best-practice recommendations from a template library (based on `nicheProfile` only, clearly labeled "Общие рекомендации").

**Gap 2 — Seasonal Demand Spikes (Misinterpretation)**
In December, beauty salon clients flood the chat asking for New Year holiday packages. The system generates `HIGH` recommendations for "Add holiday gift certificate" that are only relevant for 3 weeks.
- **Resolution:** The synthesizer prompt must classify whether a recommendation is seasonal. Seasonal recommendations get `expiresAt = periodEnd + 21 days` instead of the default 30-day TTL. They auto-expire from the active view.

**Gap 3 — Owner Acts Offline Without Marking in System**
Owner extends Thursday hours in a staff group chat but doesn't click "Apply" in KVIK. Next Sunday, the system re-generates the same "Extend Thursday hours" recommendation.
- **Resolution:** On any `PATCH /schedule/templates` update (whether manual UI edit or 1-click apply), call `RecommendationService.autoResolveByCategory(workspaceId, 'SCHEDULE_OPTIMIZATION')` to mark matching open recommendations as `IMPLEMENTED`. This closes the feedback loop even for offline actions.

**Gap 4 — "What's Working" Signal Bias**
Tier 1 only extracts friction signals. Successful conversations (`NEW → DEAL_WON` in <10 messages, high sentiment) generate empty extraction JSON. The weekly report risks feeling entirely negative.
- **Resolution:** The `WeeklyInsightReport` Markdown template must include a **"Что работает хорошо"** section, derived from: avg sentiment ≥8 conversations, sub-10-message booking closes, and services with ≥80% DEAL_WON rate. These are computed from existing analytics tables — no extra LLM call needed.

**Gap 5 — Staff Name Resolution for Archetype 5**
Clients mention masters with nicknames or transliterations ("Dany", "Данечка", "Asel"). These don't cluster into `staff_demand:daniyar` correctly.
- **Resolution:** Tier 1 extraction prompt receives `{{staffMembersList}}` (names + IDs from workspace) as context. Gemini normalizes all name mentions to the canonical staff member name before returning the micro-signal JSON.

---

#### 12.4.3. External Factors Risk Matrix

| Factor | Risk | Mitigation |
|---|---|---|
| **Gemini API unavailable** | Tier 1 extraction fails → no insight for that conversation | BullMQ retry with backoff (3× at 30s, 60s, 120s). Failed jobs go to Dead Letter Queue, re-attempted next morning. |
| **Very low volume** (<10 leads/week) | N≥3 threshold never reached → no recommendations | Lower threshold to N≥2 for workspaces with <50 lifetime leads. Dashboard shows progress: "15/50 диалогов — первые инсайты скоро появятся". |
| **LLM schema drift on model upgrades** | Extraction returns unexpected fields, breaking signal parsing | Validate every Gemini JSON response against a Zod schema. On validation failure: log error, skip record, do NOT crash. Schema-pinned to `GEMINI_MODEL` env var. |
| **Redis/BullMQ failure (server restart)** | Pending inactivity jobs lost | `OnApplicationBootstrap` hook: query conversations with `lastMessageAt < now - 24h` and no `ConversationInsight` for the current session. Backfill missing delayed jobs. |
| **Concurrent Sunday job run** (deploy at 06:01) | Two report generation jobs produce duplicate reports | `@@unique([workspaceId, periodStart])` on `WeeklyInsightReport` is a DB-level guard. Second insert fails silently — BullMQ worker catches the unique constraint error and exits cleanly. |
| **Timezone boundary edge cases** | `periodStart`/`periodEnd` calculated incorrectly for Asia/Almaty | All boundaries computed with `TimeUtil.toStartOfDay(monday)` and `TimeUtil.toEndOfDay(sunday)`. Never use `new Date()` for business period calculations. |
| **PII leakage in quotes** | Client phone numbers or full names appear in `sampleQuotes` stored in DB | Extraction prompt explicitly instructs Gemini to anonymize all quotes before returning them. Post-extraction: regex strip of phone patterns (`+7XXXXXXXXXX`) as a safety net. |

---

#### 12.4.4. Final System Verdict

The system is **architecturally complete and production-viable**. A one-paragraph summary:

> Raw client conversations on WhatsApp, Instagram, and Telegram are passively analyzed after each session closes. A lightweight BullMQ delayed-job (one per conversation, cancelled on reply, zero polling) triggers a ~300-token Gemini extraction that stores structured friction signals. Every Sunday at 06:00, a nightly SQL aggregation clusters those signals, filters noise below 3 unique clients, and a Gemini synthesizer converts validated clusters into a formatted Markdown weekly report and a set of fresh `BusinessRecommendation` records with 1-click execution payloads. All past reports are immutably archived and browsable. Recommendations can be applied or dismissed at any time — even from 3 weeks ago. The entire pipeline costs under $0.03 USD per workspace per month and adds zero latency to the live chat path.

---

## 13. Data Freshness Cadence & Automated Weekly Email Report

---

### 13.1. Data Update Frequency Per Layer

Different parts of the system update at different rates. This must be clearly communicated to the owner in the UI ("last updated" timestamps).

| What the User Sees | Update Frequency | Source | Notes |
|---|---|---|---|
| **Demand Trends charts** (unmet services, hourly inquiry heatmap, top objections) | **Real-time / on-page-load** | Direct query against `conversation_insights` (no cache) | Always reflects the latest extracted signals, including today's conversations. |
| **Recommendation cards** (active list) | **Weekly** (Sunday 06:00) + on `IMPLEMENTED`/`DISMISSED` events | `business_recommendations` table | Status badges update immediately on owner action. The underlying evidence (N counts, quotes) is refreshed each Sunday. |
| **Weekly report** (History archive) | **Once per week**, immutably | `WeeklyInsightReport.markdownContent` | Never re-generated. The Sunday snapshot is permanent. |
| **Summary KPI badges** (header: "3 важных улучшения", "68 потерянных") | **Weekly** | Denormalized fields on `WeeklyInsightReport` | Shown as "as of [last Sunday's date]" to set clear expectations. |

> [!NOTE]
> The dashboard header should show **"Данные обновлены: 22 сен 2026 (в воскресенье)"** rather than a misleading real-time indicator. Demand Trends charts show a separate **"Обновлено сегодня"** badge since they are live.

---

### 13.2. Automated Weekly Email Report to Admins & Managers

#### Concept
Every Monday morning (08:00 Asia/Almaty — after the Sunday 06:00 report is generated and owners are starting their week), KVIK automatically emails the weekly business intelligence report to all admin and manager-level staff in the workspace.

**Recipients:** All `StaffMember` records in the workspace where:
- `systemRole IN ('OWNER', 'ADMIN_MANAGER')`
- `email IS NOT NULL` (staff email, not the workspace owner login email — these can differ)

If a workspace has no staff members with emails configured, the system falls back to the `Workspace.businessEmail` (set during onboarding).

**Format:** High-fidelity, responsive Executive HTML email (inline CSS with Dark Navy / Slate corporate styling, key funnel metrics table, prioritized interventions registry, and direct dashboard deep-link).

---

#### 13.2.1. Email Delivery Architecture & Zero-Bloat Strategy

> [!NOTE]
> **Zero-Bloat Decision:** Rather than introducing heavy headless Chromium / Puppeteer binaries (~170MB+ container footprint and startup overhead) into the production backend, the weekly report is formatted directly as an **Executive HTML Briefing** in `src/modules/mail/templates/weekly-report.template.ts`.
> The full report is stored immutably in PostgreSQL as `markdownContent` on `WeeklyInsightReport`, browsable via the web dashboard with real-time actionable controls. Email adapters (`SmtpMailAdapter`, `ResendMailAdapter`, `ConsoleMailAdapter`) support optional attachments if external file generation is ever required.

---

#### 13.2.2. Email Template: `weekly-report.template.ts`

Add to `src/modules/mail/templates/weekly-report.template.ts`:

```typescript
export interface WeeklyReportEmailParams {
  businessName: string;
  weekLabel: string;           // "Неделя 38 (15–21 Сентября 2026)"
  periodStart: string;         // "15 сен"
  periodEnd: string;           // "21 сен"
  totalLeadsAnalyzed: number;
  totalLostLeads: number;
  highImpactCount: number;
  totalInsightsFound: number;
  topRecommendations: Array<{
    title: string;
    category: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    uniqueClientsCount: number;
  }>;
  dashboardUrl: string;        // Deep link to the weekly report in the dashboard
}

export function renderWeeklyReportEmail(params: WeeklyReportEmailParams): {
  html: string;
  text: string;
} {
  const impactBadge = (impact: string) =>
    impact === 'HIGH' ? '🔴' : impact === 'MEDIUM' ? '🟡' : '🟢';

  const recommendationRows = params.topRecommendations
    .slice(0, 5) // Top 5 in email, full list in PDF attachment
    .map(
      (r) =>
        `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:14px;">
            ${impactBadge(r.impact)} ${r.title}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:right;">
            ${r.uniqueClientsCount} клиентов
          </td>
        </tr>`,
    )
    .join('');

  const html = `
<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;}
  .wrapper{width:100%;background:#f4f5f7;padding:32px 16px;}
  .container{max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06);border:1px solid #e2e8f0;}
  .header{background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:28px 32px;}
  .logo{color:#fff;font-size:22px;font-weight:800;letter-spacing:-.5px;display:block;margin-bottom:4px;}
  .header-sub{color:rgba(255,255,255,.8);font-size:13px;}
  .content{padding:28px 32px;}
  .stat-row{display:flex;gap:12px;margin-bottom:24px;}
  .stat-box{flex:1;background:#f8fafc;border-radius:10px;padding:16px;text-align:center;border:1px solid #e2e8f0;}
  .stat-num{font-size:28px;font-weight:800;color:#059669;margin:0;}
  .stat-label{font-size:12px;color:#64748b;margin-top:4px;}
  .section-title{font-size:15px;font-weight:700;color:#0f172a;margin:0 0 12px;}
  table{width:100%;border-collapse:collapse;}
  .cta{display:block;margin:24px 0 0;background:#059669;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;text-align:center;font-weight:700;font-size:15px;}
  .footer{border-top:1px solid #f1f5f9;padding:18px 32px;text-align:center;font-size:11px;color:#94a3b8;background:#fafbfc;}
</style></head>
<body><div class="wrapper"><div class="container">
  <div class="header">
    <span class="logo">KVIK</span>
    <span class="header-sub">Еженедельный бизнес-отчёт — ${params.weekLabel}</span>
  </div>
  <div class="content">
    <p style="color:#475569;margin:0 0 20px;font-size:15px;">Здравствуйте! Вот краткий итог недели для <strong>${params.businessName}</strong>.</p>
    <div class="stat-row">
      <div class="stat-box"><p class="stat-num">${params.totalLeadsAnalyzed}</p><p class="stat-label">Диалогов проанализировано</p></div>
      <div class="stat-box"><p class="stat-num" style="color:#ef4444;">${params.totalLostLeads}</p><p class="stat-label">Лидов потеряно</p></div>
      <div class="stat-box"><p class="stat-num">${params.totalInsightsFound}</p><p class="stat-label">Инсайтов найдено</p></div>
    </div>
    <p class="section-title">Топ рекомендации недели</p>
    <table><tbody>${recommendationRows}</tbody></table>
    <a href="${params.dashboardUrl}" class="cta">Открыть полный отчёт в дашборде →</a>
    <p style="font-size:12px;color:#94a3b8;margin:16px 0 0;">Полный отчёт также прикреплён к этому письму в формате PDF.</p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} KVIK AI Platform. Это автоматическое письмо, не отвечайте на него.<br>Управление подпиской: <a href="${params.dashboardUrl}/settings/notifications" style="color:#059669;">настройки уведомлений</a></div>
</div></div></body></html>`;

  const text = `KVIK — Еженедельный бизнес-отчёт\n${params.weekLabel}\n\nБизнес: ${params.businessName}\nДиалогов: ${params.totalLeadsAnalyzed} | Потеряно лидов: ${params.totalLostLeads} | Инсайтов: ${params.totalInsightsFound}\n\nТоп рекомендации:\n${params.topRecommendations.slice(0, 5).map((r, i) => `${i + 1}. ${r.title} (${r.uniqueClientsCount} кл.)`).join('\n')}\n\nПолный отчёт: ${params.dashboardUrl}`;

  return { html, text };
}
```

---

#### 13.2.3. `MailService` Extension: `sendWeeklyReportEmail`

Add to `src/modules/mail/mail.service.ts`:

```typescript
import { renderWeeklyReportEmail, WeeklyReportEmailParams } from './templates/weekly-report.template';

async sendWeeklyReportEmail(
  recipients: string[],          // All admin/manager emails for this workspace
  params: WeeklyReportEmailParams,
  pdfBuffer: Buffer,             // Pre-generated PDF attachment
): Promise<void> {
  const { html, text } = renderWeeklyReportEmail(params);
  const weekSafe = params.weekLabel.replace(/[^a-z0-9]/gi, '_');

  await this.sendMail({
    to: recipients,
    subject: `📊 Недельный отчёт KVIK: ${params.weekLabel} — ${params.businessName}`,
    html,
    text,
    attachments: [
      {
        filename: `kvik_report_${weekSafe}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
```

> [!NOTE]
> The `attachments` field must be added to the `SendMailOptions` interface in `src/modules/mail/adapters/mail-adapter.interface.ts`, and both `ResendMailAdapter` and `SmtpMailAdapter` updated to pass attachments through to their respective APIs.

---

#### 13.2.4. PDF Generator Service

Create `src/modules/business-insights/weekly-report-pdf.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { marked } from 'marked';

@Injectable()
export class WeeklyReportPdfService {
  private readonly logger = new Logger(WeeklyReportPdfService.name);

  async generatePdf(markdownContent: string, weekLabel: string): Promise<Buffer> {
    // Lazy-import puppeteer to avoid startup cost
    const puppeteer = await import('puppeteer-core');
    const chromiumPath = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';

    const browser = await puppeteer.launch({
      executablePath: chromiumPath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      const bodyHtml = marked(markdownContent) as string;

      await page.setContent(`
        <!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 color: #1e293b; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 8px; }
          h2 { color: #0f172a; margin-top: 32px; }
          h3 { color: #334155; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th { background: #f8fafc; padding: 10px; text-align: left; border: 1px solid #e2e8f0; }
          td { padding: 10px; border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg,#10b981,#059669);
                    color: white; padding: 24px 32px; border-radius: 8px;
                    margin-bottom: 32px; }
          blockquote { border-left: 4px solid #059669; margin: 0; padding: 12px 16px;
                       background: #f0fdf4; border-radius: 0 8px 8px 0; }
        </style></head>
        <body>
          <div class="header">
            <h2 style="color:white;margin:0;">KVIK — Еженедельный Бизнес-Отчёт</h2>
            <p style="color:rgba(255,255,255,.8);margin:4px 0 0;">${weekLabel}</p>
          </div>
          ${bodyHtml}
        </body></html>
      `, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        printBackground: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
```

---

#### 13.2.5. `GenerateWeeklyReportWorker` — Email Dispatch Step

After generating and saving the `WeeklyInsightReport`, the worker continues:

```typescript
// After saving WeeklyInsightReport to DB:

// 1. Collect admin/manager recipients for this workspace
const adminStaff = await this.staffRepository.findMany(workspaceId, {
  systemRole: { in: ['OWNER', 'ADMIN_MANAGER'] },
  email: { not: null },
});

const recipients = adminStaff
  .map((s) => s.email!)
  .filter(Boolean);

// Fallback: workspace businessEmail if no staff emails configured
if (recipients.length === 0 && workspace.businessEmail) {
  recipients.push(workspace.businessEmail);
}

if (recipients.length === 0) {
  this.logger.warn(`[WeeklyReport] No email recipients for workspace ${workspaceId} — skipping email.`);
  return;
}

// 2. Generate PDF
const pdfBuffer = await this.weeklyReportPdfService.generatePdf(
  report.markdownContent,
  report.weekLabel,
);

// 3. Build email params
const emailParams: WeeklyReportEmailParams = {
  businessName: workspace.businessName ?? workspace.name,
  weekLabel: report.weekLabel,
  periodStart: TimeUtil.formatDate(report.periodStart, 'D MMM'),
  periodEnd: TimeUtil.formatDate(report.periodEnd, 'D MMM YYYY'),
  totalLeadsAnalyzed: report.totalLeadsAnalyzed,
  totalLostLeads: report.totalLostLeads,
  highImpactCount: report.highImpactCount,
  totalInsightsFound: report.totalInsightsFound,
  topRecommendations: topRecs.map((r) => ({
    title: r.title,
    category: r.category,
    impact: r.impact,
    uniqueClientsCount: r.uniqueClientsCount,
  })),
  dashboardUrl: `${this.config.get('FRONTEND_URL')}/dashboard/reports/${report.id}`,
};

// 4. Queue email dispatch via existing mail-queue (non-blocking)
await this.mailQueue.add(
  SEND_WEEKLY_REPORT_EMAIL_JOB,
  { workspaceId, recipients, emailParams, pdfBuffer: pdfBuffer.toString('base64') },
  { attempts: 3, backoff: { type: 'exponential', delay: 30000 } },
);
```

> [!IMPORTANT]
> The PDF buffer is serialized to base64 for BullMQ/Redis storage. Keep in mind a typical weekly report PDF is ~200–400 KB. At 100 workspaces, that's ~40 MB in Redis during the Sunday email dispatch window — acceptable and transient (jobs removed after completion).

---

#### 13.2.6. Opt-Out: Email Notification Settings

Staff members must be able to opt out of weekly email reports without changing their account. Add a workspace-scoped notification preference:

```prisma
// Add to StaffMember model:
weeklyReportEmailEnabled  Boolean  @default(true)
```

When filtering recipients:
```typescript
const adminStaff = await this.staffRepository.findMany(workspaceId, {
  systemRole: { in: ['OWNER', 'ADMIN_MANAGER'] },
  email: { not: null },
  weeklyReportEmailEnabled: true,   // ← respect opt-out
});
```

Frontend: Settings → Notifications → toggle "Получать еженедельный отчёт по email".

---

#### 13.2.7. New Queue Jobs & Updated Checklist Additions

```typescript
// Add to src/modules/queues/constants.ts:
export const SEND_WEEKLY_REPORT_EMAIL_JOB = 'SEND_WEEKLY_REPORT_EMAIL';
export const GENERATE_WEEKLY_REPORT_JOB   = 'GENERATE_WEEKLY_REPORT';
```

**New cron schedule (add to `queues.scheduler.ts`):**
```typescript
// Sunday 06:00 Asia/Almaty = Sunday 01:00 UTC
@Cron('0 1 * * 0', { timeZone: 'UTC' })
async scheduleWeeklyReports() {
  // Query all active workspaces (isActive: true)
  // For each: enqueue GENERATE_WEEKLY_REPORT_JOB
  // Stagger by workspaceIndex * 5s to avoid thundering herd
}
```

**Implementation checklist additions:**
- [x] Create `weekly-report.template.ts` in `src/modules/mail/templates/` with high-impact corporate executive styling
- [x] Extend `SendMailOptions` interface with optional `attachments` field in `mail-adapter.interface.ts`
- [x] Update `ResendMailAdapter`, `SmtpMailAdapter`, and `ConsoleMailAdapter` to support `attachments`
- [x] Add `sendWeeklyReportEmail` method to `MailService`
- [x] Add `weeklyReportEmailEnabled Boolean @default(true)` to `StaffMember` Prisma model
- [x] Add `SEND_WEEKLY_REPORT_EMAIL_JOB` and `GENERATE_WEEKLY_REPORT_JOB` to `INSIGHTS_QUEUE` in `src/queues/constants.ts`
- [x] Register Sunday 06:00 Asia/Almaty scheduler via BullMQ v5 in `business-insights.scheduler.ts`
- [x] Add `FRONTEND_URL` environment handling for executive report deep-links
- [x] Add i18n keys to `translation_keys_new.json` (`insights.weekly_report_email_sent`, etc.)
- [ ] (Frontend) Add `weeklyReportEmailEnabled` toggle to Staff Settings → Notifications
