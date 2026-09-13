# 013 — Knowledge Base, AI Agent & Settings IA Refactoring Plan

> **Document Type:** Frontend Code Audit, UX Refactoring & Information Architecture Redesign  
> **Status:** Approved & Completed  
> **Target Audience:** Frontend Engineers, Product Designers, Technical Leads  

---

## 1. Executive Summary & Problem Statement

Following the initial implementation of the Knowledge Base management system, a comprehensive code audit revealed three areas requiring refactoring:
1. **Hardcoded UI Strings & Missing i18n:** Several component labels, fallback texts, status badges, and `window.confirm` dialogues bypass the Russian localization layer (`next-intl`).
2. **UX & Fragility Issues:** Synchronous native `window.confirm()` calls, lack of client-side file size guards (>10MB), and silent failures on network error without toast feedback.
3. **Information Architecture & "Overloaded Settings":** The Settings section is overloaded with 8 flat horizontal tabs. In enterprise SaaS apps, the Knowledge Base and AI Agent constitute the **core operational intelligence** of the platform and should not be buried alongside basic settings like passwords or dev mode.

---

## 2. Inconsistencies & Code Audit Findings

### 2.1 Untranslated Strings & Hardcoded Text

| Component | Issues & Hardcoded Strings |
| :--- | :--- |
| `KbTwoGisScraperTab.tsx` | Confirmation prompt `"Удалить все импортированные услуги и филиалы из 2GIS?"`, input label `"Ссылка на карточку 2GIS или ID филиала"`, status badges (`"Завершено"`, `"Идет импорт..."`, `"Ошибка"`), label `"Филиал 2GIS:"` |
| `KbWebsiteScraperTab.tsx` | Confirmation prompt `"Удалить все сохраненные страницы..."`, input label `"URL веб-сайта"`, status badges, label `"Целевой сайт:"` |
| `KbDocumentsTab.tsx` | `window.confirm` texts, fallback `"Документ"`, status texts, active labels (`"Включен"` / `"Отключен"`) |
| `KbNotesTab.tsx` & `KbNoteEditModal.tsx` | Confirmation text, button labels (`"Отмена"`, `"Сохранить заметку"`), fallback `"Заметка без названия"`, status badges |
| `KbQualificationTab.tsx` | Empty state text `"Вопросы скрининга не настроены..."`, `"Обязательный"`, `"Добавить"`, `"Бюджетные рамки"`, placeholder `"Не ограничен"` |
| `AiPromptInspectorModal.tsx` | Units label `"токенов"`, labels `"Ниша:"`, `"Дата:"`, loading & empty states |
| `AiToolsManager.tsx` | Fallback custom tool description `"Пользовательский инструмент вызова ИИ"` |

### 2.2 Potential Bugs & UX Risks

1. **Native `window.confirm` Usage:** Disruptive and unstyled. Replaced by clean, glassmorphic `ConfirmDeleteModal` component.
2. **Missing Client-Side File Validation:** Files >10MB or unsupported MIME types caught with instant UI warnings before triggering backend 413 errors.
3. **Missing User Notifications:** Replaced with localized error banners and feedback states.
4. **State Cleanup on Modal Close:** Form states reset on modal close/reopen.

---

## 3. Enterprise-Level Information Architecture (IA) Solution

### How Enterprise Apps (Linear, Stripe, Intercom, Retool) Handle This

In enterprise AI platforms, settings and functional workspaces are split cleanly:
1. **Primary Sidebar Elevation:** The **Knowledge Base & AI Center** is promoted to the **Main Dashboard Sidebar** (`/knowledge-base`) alongside `Входящие`, `Лиды`, and `Записи`.
2. **Unified 4-Layer AI Model:**
   - **Layer 1 & Custom Rules:** Tone of voice, custom business instructions.
   - **Layer 2 (Business Context):** Structured synthesized JSON summary.
   - **Layer 3 (Data Sources):** Documents, Notes, Website crawlers, 2GIS catalog.
   - **Layer 4 (Database Tools & Sandbox):** Autonomous database tools and live execution sandbox.
3. **Categorized Settings Navigation:** The remaining settings are grouped into structured, logical categories:
   - **Организация:** Профиль компании (`/settings/workspace`), Команда & графики (`/settings/staff`).
   - **Интеграции:** Каналы связи (`/settings/channels`).
   - **Безопасность:** Аккаунт & Пароль (`/settings/account`), Дополнительно (`/settings/advanced`).

---

## 4. Refactoring Roadmap & Checklist

- [x] **Phase 1: Localization & String Normalization**
  - Add all missing keys to `locales/translation_keys_new.json`.
  - Run `node scripts/apply-translation-keys.mjs`.
  - Replace all hardcoded strings with `t(...)`.

- [x] **Phase 2: UX Improvements & Glassmorphic Confirmation Modals**
  - Create reusable `ConfirmDeleteModal.tsx`.
  - Add client-side file size & extension validation in dropzone.
  - Add inline error banners and toast feedback on API failures.

- [x] **Phase 3: Component Modularity & Splitting**
  - Extract `KbDocumentRow.tsx`, `KbDropzone.tsx`, `KbNoteCard.tsx`, `KbQuestionItem.tsx`, `KbRuleChipList.tsx`.
  - Keep all files strictly `< 250` lines.

- [x] **Phase 4: Navigation & IA Refinement**
  - Add `/knowledge-base` to main dashboard sidebar (`DashboardLayout`).
  - Consolidate `/settings/knowledge-base`, `/settings/business-context`, and `/settings/ai-agent` with clean cross-navigation.
  - Restructure `SettingsNav.tsx` with clean category visual grouping.
