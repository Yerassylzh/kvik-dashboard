# 🐞 Bug Report — Krisha Scraper Not Scoped to `userId` (Fetches Third-Party Listings)

> **Date:** 2026-08-18  
> **Recipient:** Backend developer (parsing / discovery worker)  
> **Related to:** `004_REALTY_ONBOARDING_FIXES_PREVIEW.md` (contract), `003_REALTY_ONBOARDING_FIXES_PLAN.md`  
> **Scope:** Onboarding step `DATA_SOURCE` → `DATA_PREVIEW` (`POST /onboarding/step/data-source`, discovery worker + parser, `GET /onboarding/step/data-preview`)  
> **Priority:** 🔴 High — Knowledge base gets polluted with third-party listings; the AI agent will present properties to clients that do not belong to the user.  
> **Fix Side:** Backend only. The frontend does not distort data — it renders `entries`/counters as-is.  

---

## 1. TL;DR

When importing a Krisha profile, the scraper **ignores the provided `userId`** and crawls entire Krisha categories/search pages. As a result:

1. `entries` contains **third-party listings** belonging to other sellers (the preview shows slugs of categories like `vozmu-v-arendu`, `prombazy`, properties across Almaty/Astana), even though the client has **only 1 listing of their own**.
2. `parsedCount` **exceeds** `totalCount` → The UI displays "**Parsed 220 of 208 listings · 1 with error**" (progress > 100%, meaningless numbers).

Both symptoms stem from a single root cause: **discovery is not scoped to the seller's `userId`**.

---

## 2. What We Observe (Facts)

Screenshot of the "Import and Preview Properties" step for a profile with **only one** active listing:

```
Krisha.kz background auto-parsing in progress...
Parsed 220 of 208 listings · 1 with error
```

- The `entries` list includes properties of **third-party** sellers (rent/sale across various cities) not owned by the client.
- In `data.category`, entries contain **slugs of Krisha sections**: `prombazy` (industrial bases), `vozmu-v-arendu` (the "looking for rent" section — these are requests from people *seeking* rent, not listings for sale or lease at all).

> 🔎 **Clue:** Values like `vozmu-v-arendu` / `prombazy` in `data.category` are slugs of Krisha **category pages**. Their presence indicates that the worker is traversing **category/search pages** rather than the listings page of a specific seller.

---

## 3. Expected Behavior

For a given `userId` (seller/agency ID on Krisha), the scraper should import **only listings of this seller**:

- `entries` contains **exclusively** active listings belonging to the profile of `userId` (for the described client — 1 property).
- `totalCount` = number of the seller's own active listings (or a tight upper bound), so always `parsedCount ≤ totalCount`.
- All `entries[].sourceUrl` are listings from the **exact same** seller (`userId`).
- No third-party sellers exist in the output.

---

## 4. Probable Cause

`totalCount` in the contract is described as an estimate "**from Krisha crawl matrix**" (see `004` §2, §4 "worker starts discovery"; counters in `Workspace.metadata`, `004` §8).

It appears the **discovery** phase constructs a traversal across Krisha **categories/regional search**, rather than navigating the **specific seller's page**. Hence:

- Third-party listings enter the output (category crawl instead of seller crawl);
- `parsedCount` surpasses the `totalCount` estimate (category matrix estimate doesn't match the actual number of collected pages) → "220 of 208".

Most likely, there is **no check/filter on the listing owner** before persisting `KnowledgeEntry`.

---

## 5. Steps to Reproduce

1. `POST /onboarding/step/data-source` with `{ userId: "<Client ID with 1 listing>" }`.
2. Poll `GET /onboarding/step/data-preview`.
3. Observe: `entries` include listings from third-party sellers; `parsedCount > totalCount`.

*(The specific `userId` for testing is with the client; the frontend sends it as-is from the DATA_SOURCE step form.)*

---

## 6. Acceptance Criteria (Definition of Done)

- [ ] Discovery is restricted to the **seller page** for `userId` (own active listings), not category/search.
- [ ] Before saving `KnowledgeEntry`, there is a verification of listing ownership by seller `userId` (e.g. `listing.sellerId === userId`).
- [ ] `totalCount` is computed from the number of the seller's own listings → `parsedCount ≤ totalCount` **always** (no progress > 100%).
- [ ] In output for the test profile with 1 listing, exactly 1 entry is returned; no third-party sellers.
- [ ] `data.category` contains the actual property category, not the crawler section slug (`vozmu-v-arendu`, `prombazy`, etc.).

---

## 7. Questions for Backend (Diagnostic)

1. Which Krisha URL/endpoint does discovery crawl for a given `userId` — **seller page** or **category search**?
2. How is `totalCount` calculated — from the counter on the seller's page or estimated from a category crawl matrix?
3. Is there an ownership filter (`sellerId === userId`) before persisting `KnowledgeEntry`? If not, that is the root cause.
4. Can slugs like `vozmu-v-arendu` / `prombazy` in `data.category` confirm that the data source is category pages?

---

## 8. Impact

- 🔴 **Knowledge base gets polluted with third-party properties** → The AI agent will advise clients on real estate that does not belong to the user (reputational and legal risk).
- 🟠 **Incorrect counters** ("X of Y", progress > 100%) → Distrust in the product on the very first import screen.

---

## 9. What Has Been Done on Frontend (and What Has NOT Been Done)

**Done** (`components/onboarding/StepDataPreview.tsx`) — UI only, without tampering with data:

- Operation tabs (All / Sale / Rent / …) — client-side list filtering; tabs are generated dynamically from `data.operation` of received `entries`.
- Readable cards (photo `mainPhoto`, address, rooms/area/city, price, description) instead of cramped mini-widgets + comfortable scrolling.
- Link **"Open on Krisha ↗"** (`entries[].sourceUrl`) on each card — to make it clearly visible during QA that a listing belongs to a third-party seller.

**NOT done (deliberately):** counters `parsedCount` / `totalCount` / `failedCount` are **not masked or cosmetically doctored** by the frontend — they are displayed exactly as they arrive from the backend. The correct numbers must appear after fixing discovery on the backend (otherwise we would be hiding the symptom of a real bug).
