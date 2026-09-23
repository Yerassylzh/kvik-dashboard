# 026 — Automations & Follow-Up Page Redesign Plan

> **Status:** 📋 Planning  
> **Scope:** `components/dashboard/automations/`, `locales/ru/dashboard.json`, `lib/api/followUps.ts`  
> **Reference File:** `FOLLOW_UP_REFACTORING_PLAN.md`

---

## Executive Summary
This document outlines the UX/UI decluttering and refactoring strategy for the Auto Follow-Up & Reminders page (`/automations`). The existing page suffers from visual density, redundant status banners, nested bordered cards, unneeded English technical jargon (`Lead Abandonment`, `Step 1 (+2h)`, `Win-Back`, `1-Click`, `WhatsApp HSM`), and unstructured analytics text.

The redesigned interface aligns with the **Modern Minimalist Light SaaS** design system (`AGENTS.md`), removes redundant elements, and organizes automations according to the customer lifecycle:
1. **До визита (Before visit):** Unresponsive lead recovery + appointment reminders
2. **После визита (After visit):** 2GIS review request + repeat visit recall
3. **Общие правила (Global rules):** Quiet hours (night mode)

Detailed Russian documentation and step-by-step roadmap are available in the root file `FOLLOW_UP_REFACTORING_PLAN.md`.
