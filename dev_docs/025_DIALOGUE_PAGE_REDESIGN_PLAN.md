# 025 — Dialogue Page Redesign & Bug-Fix Plan

> **Status:** 📋 Planning
> **Scope:** `components/dashboard/inbox/`, `hooks/useConversations.ts`, `app/(dashboard)/layout.tsx`
> **Screenshot reference:** User screenshot shows `MANAGER_INTERCEPTED` state with amber "Взять в работу" bar but **no text input**.

---

## Problem Inventory

### Bug 1 — Takeover Renders No Composer Input
**Root cause (confirmed in code):**
In `ManagerComposer.tsx`, the logic at line 158 is:

```ts
// 4. Escalated, but unassigned to current user
if (!isAssignedToMe) {
  // renders amber banner + "Взять в работу" button
  // NOTHING ELSE — no input field
}
```

This means: **before you click "Взять в работу", you can never type anything.** This is correct for the lock model.
BUT the bug is that `isAssignedToMe` is computed from `takenOverByActorId === myActorId`. If the takeover
succeeded but the conversation DTO has not refreshed yet (stale SWR data), `isAssignedToMe` stays `false`
and the user is stuck on the amber banner until a page reload.

**Second issue:** `ConversationThread.tsx` `handleTakeover` at line 53 calls `refresh()`, but `refresh`
only invalidates `useConversationMessages` SWR (messages), **not** the conversation list SWR that holds
`takenOverByActorId`. So after clicking takeover, the composer still sees the stale value.

**Fix:**
- Add optimistic `isOptimisticOwner` local state in `ManagerComposer`. After `handleTakeoverClick` succeeds, set it `true` → immediately render the input without waiting for SWR.
- In `ConversationThread.handleTakeover`, call `mutateConversations()` from the parent hook to also refresh the conversation metadata.

---

### Bug 2 — No "Taken Over By" Attribution
**Current state:** `TakeoverControl.tsx` (line 64 comment) explicitly hides assignee name for all roles — privacy rule.

**Recommendation:** Show name only when viewer is `OWNER` or `ADMIN_MANAGER` (accountability need).
The `assignedStaff` object is already returned in `ConversationDto`. Just conditionally render it in the "Занято" chip.

**Files:** `TakeoverControl.tsx`

---

### Bug 3 — Page-Level Scroll Instead of Message-Area-Only Scroll
**Root cause in `app/(dashboard)/layout.tsx` line 211:**
```tsx
<main className="p-5 sm:p-6 flex-1 overflow-y-auto themed-scroll">
```
The `overflow-y-auto` is on `<main>`, so the entire page content can scroll.
`InboxPage.tsx` uses `h-[calc(100vh-80px)]` as a workaround but the outer `<main>` overrides containment.

**Fix options (choose one):**
- **(a)** Check `pathname === '/inbox'` in layout and conditionally apply `overflow-hidden` vs `overflow-y-auto`.
- **(b)** Remove `overflow-y-auto` from layout `<main>` entirely; each page manages its own scroll. Inbox already does this correctly. Other pages that need scroll must add their own scroll wrapper.

Option (b) is cleaner long-term but requires auditing other pages.

---

### Bug 4 — Message List Not Optimized
**Current implementation:** `ConversationThread.tsx` line 127 renders all messages in a plain `map()`.
`useConversationMessages` fetches `limit: 100` in one shot.

**Problems:**
- 200+ messages → 200+ DOM nodes with media players → lag
- No pagination
- Scroll-to-bottom re-runs on every `messages` change including WS appends, wiping user scroll position

**Pragmatic fix (no virtualizer dependency yet):**
1. Change `getMessages` limit to **last 30**; expose `loadOlderMessages()` with cursor-based reverse pagination (load-on-scroll-to-top).
2. Scroll guard: only auto-scroll to bottom if user was already within 100px of bottom.
3. Reset scroll position to bottom when `conversationId` changes.
4. Add `loading="lazy"` to `<ImageAttachment>` images. Audio elements (`<VoiceMessagePlayer>`) use `React.lazy` + `Suspense`.

**Future (when scale demands):** `@tanstack/react-virtual` with reverse scroll. Discord/Telegram pattern.

---

### Issue 5 — Design Elements That Feel "AI-y"
Current amber manager bubble and amber banner backgrounds are warm and stand out in the cold slate palette.

| Element | File | Current | Problem | Fix |
|---|---|---|---|---|
| Manager message bubble | `MessageBubble.tsx` L69 | `bg-amber-500/10 border-amber-500/30` | Warm amber, feels ad-hoc | → `bg-slate-50 border-slate-200 text-foreground` |
| Unassigned escalation banner | `ManagerComposer.tsx` L161 | `bg-amber-50/70 border-amber-200` amber wash | Gradient-ish wash | → flat `bg-card border border-border` + amber `border-l-4 border-amber-400` accent |
| ConversationThread wrapper | `ConversationThread.tsx` L72 | `bg-card/60` translucent | Shimmer on some displays | → solid `bg-card` |
| Thread header | `ConversationThread.tsx` L74 | `bg-card/80 backdrop-blur-sm` | Glassmorphism on internal panel | → solid `bg-card border-b border-border/60` |
| Message spacing | `ConversationThread.tsx` L127 | `space-y-1` | Too tight | → `space-y-2` |

---

### Issue 6 — Additional Edge Cases

| # | Edge Case | File | Fix |
|---|---|---|---|
| 6a | WS reconnect race — SWR cache stale on reconnect | `useConversations.ts` | Add `revalidateOnReconnect: true` |
| 6b | stale `takenOverByActorId` after takeover click | `ConversationThread.tsx` | Call `mutateConversations()` after takeover (not just messages mutate) |
| 6c | User loses scroll position on new WS message | `ConversationThread.tsx` | "Pinned to bottom" guard (only auto-scroll if within 100px of bottom) |
| 6d | Conversation switch causes scroll jump | `ConversationThread.tsx` | Reset scroll to top on `conversationId` change; scroll to bottom after load |
| 6e | No loading skeleton on conversation switch | `ConversationThread.tsx` | Add 3-4 ghost bubbles during `isLoading` state |
| 6f | CLOSED status change via WS not reflected in composer | `useInboxRealtime.ts` / `ConversationThread.tsx` | WS `conversation.status_changed` event should mutate active conversation in store |

---

## File-by-File Change Map

### `app/(dashboard)/layout.tsx` — L211
- Change `overflow-y-auto` handling so `/inbox` route is `overflow-hidden`
- Decision required: option (a) pathname check, or option (b) full removal

### `components/dashboard/inbox/InboxPage.tsx`
- L43: Keep `h-[calc(100vh-80px)]`, add explicit `overflow-hidden`

### `components/dashboard/inbox/ConversationThread.tsx`
- L33-37: Scroll `useEffect` — add pinned-to-bottom guard
- L53-66: `handleTakeover` — add `mutateConversations` call
- L72: `bg-card/60` → `bg-card`
- L74: `bg-card/80 backdrop-blur-sm` → `bg-card`
- L127: `space-y-1` → `space-y-2`
- L127: Add `key={conversationId}` or `useEffect` on conversationId to reset scroll
- NEW: Add skeleton loader during `isLoading`

### `components/dashboard/inbox/ManagerComposer.tsx`
- L50: Add `isOptimisticOwner` state
- L91-98: After takeover success, set `isOptimisticOwner = true`
- L158: Include `isOptimisticOwner` in the `isAssignedToMe` check
- L161: Flatten amber banner — remove `bg-amber-50/70`, use flat card + `border-l-4 border-amber-400`

### `components/dashboard/inbox/TakeoverControl.tsx`
- L92-98: Read `systemRole` from auth store; show `assignedStaff?.name` in locked chip for OWNER/ADMIN_MANAGER

### `components/dashboard/inbox/MessageBubble.tsx`
- L69: Manager bubble `bg-amber-500/10 border-amber-500/30` → `bg-slate-50 border-slate-200`

### `hooks/useConversations.ts`
- L68-74: Add `revalidateOnReconnect: true` to `useConversationMessages` SWR config
- L70: Change `limit: 100` to `limit: 30`; add `loadOlderMessages()` helper
- L43: Add `revalidateOnReconnect: true` to `useConversations` SWR config

---

## Self-Checklist (Execute in Order)

```
[ ] 1. SCROLL FIX — layout.tsx
      - Choose option (a) or (b) for overflow-y handling on inbox route
      - Verify page body no longer scrolls when messages overflow

[ ] 2. SCROLL BEHAVIOR — ConversationThread.tsx
      - Add pinned-to-bottom guard (only auto-scroll if ≤100px from bottom)
      - Reset scroll on conversationId change

[ ] 3. TAKEOVER COMPOSER UNLOCK — ManagerComposer.tsx
      - Add isOptimisticOwner local state
      - On successful takeover click → set true → show input immediately
      - Also fix: ConversationThread.handleTakeover must call mutateConversations()

[ ] 4. ASSIGNEE ATTRIBUTION — TakeoverControl.tsx
      - Read systemRole from useAuthStore
      - If OWNER/ADMIN_MANAGER and isTakenByOther: show assignedStaff?.name in chip

[ ] 5. DESIGN CLEANUP — multiple files
      - MessageBubble: manager bubble amber → slate-50/slate-200
      - ConversationThread: remove bg opacity translucency from wrapper and header
      - ManagerComposer unassigned banner: amber wash → flat card + left border accent
      - message space-y-1 → space-y-2

[ ] 6. LOADING SKELETON — ConversationThread.tsx
      - Add 3-4 ghost bubbles (alternating left/right) during isLoading state

[ ] 7. SWR HARDENING — useConversations.ts
      - revalidateOnReconnect: true on both useConversations and useConversationMessages
      - Change message limit 100 → 30; prepare loadOlderMessages()

[ ] 8. TRANSLATION KEYS — if any new UI strings added
      - node scripts/apply-translation-keys.mjs
      - node scripts/export-translation-keys.mjs
```

---

## Open Design Decisions (Answer Before Implementation)

1. **Manager bubble color:** Amber → Slate-50 proposed. Alternative: use `bg-primary/10` (same as bot) so both non-user roles are symmetric. Preference?

2. **Assignee name visibility:** Show name to OWNER/ADMIN_MANAGER only (recommended), or always hide per current privacy rule?

3. **Message pagination:** Load last 30 + reverse scroll for older (recommended), or keep 100 flat + add virtualizer later?

4. **Layout scroll fix approach:** Option (a) pathname check per-route, or option (b) remove from layout and let pages own their scroll?
