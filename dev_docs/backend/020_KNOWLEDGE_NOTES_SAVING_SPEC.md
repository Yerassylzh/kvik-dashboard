# Knowledge Notes — Frontend Integration Spec

> **Audience:** Frontend developer  
> **Backend base URL:** `/onboarding` (all endpoints require `Authorization: Bearer <token>`)

---

## Overview

Saving a knowledge note is now **asynchronous**. The API responds immediately after creating the note in the database. The actual AI processing (structuring the note text + generating search embeddings) runs in a background worker and typically completes within **5–15 seconds**.

The frontend must:
1. **POST** the note(s) → receive an immediate `200` response
2. **Poll `GET /onboarding/knowledge-notes`** until every returned note has `processingStatus: "COMPLETED"` (or `"FAILED"`)
3. Show a loading indicator (spinner, skeleton) per note while its status is `PENDING` or `PROCESSING`

---

## Endpoints

### 1. Save notes

```
POST /onboarding/step/knowledge-notes
Content-Type: application/json
Authorization: Bearer <token>
```

**Request body:**
```json
{
  "notes": [
    "We only work in Almaty",
    "50% prepayment required for new clients"
  ]
}
```

| Field | Type | Constraints |
|---|---|---|
| `notes` | `string[]` | 1–50 items, each ≤ 5000 characters, must not be empty |

**Success response — `200 OK`:**
```json
{
  "code": "onboarding.user_note_saved",
  "count": 2,
  "notes": [
    {
      "id": "uuid-of-note-1",
      "note": "We only work in Almaty",
      "processingStatus": "PENDING",
      "createdAt": "2026-09-05T14:21:00.000Z"
    },
    {
      "id": "uuid-of-note-2",
      "note": "50% prepayment required for new clients",
      "processingStatus": "PENDING",
      "createdAt": "2026-09-05T14:21:00.000Z"
    }
  ]
}
```

> **Key point:** The notes appear in the list immediately with `processingStatus: "PENDING"`. They are **not yet searchable** by the AI assistant — the background worker must complete first.

**Error responses:**

| Status | Condition |
|---|---|
| `400` | Validation failed (empty array, item too long, etc.) |
| `401` | Missing or expired token |

---

### 2. List notes (for polling)

```
GET /onboarding/knowledge-notes
Authorization: Bearer <token>
```

**Success response — `200 OK`:**
```json
[
  {
    "id": "uuid-of-note-1",
    "note": "We only work in Almaty",
    "processingStatus": "COMPLETED",
    "createdAt": "2026-09-05T14:21:00.000Z"
  },
  {
    "id": "uuid-of-note-2",
    "note": "50% prepayment required for new clients",
    "processingStatus": "PROCESSING",
    "createdAt": "2026-09-05T14:21:00.000Z"
  }
]
```

**Also available as alias:** `GET /onboarding/step/notes`

---

### 3. Delete a note

```
DELETE /onboarding/step/notes/:id
Authorization: Bearer <token>
```

**Success response — `200 OK`**  
Returns a confirmation object (note is removed from the list).

| Status | Condition |
|---|---|
| `404` | Note not found or belongs to another workspace |
| `401` | Missing or expired token |

---

## processingStatus values

| Value | Meaning | UI suggestion |
|---|---|---|
| `"PENDING"` | Job queued, not started yet | Spinner / skeleton row |
| `"PROCESSING"` | AI is currently working on it | Spinner / skeleton row |
| `"COMPLETED"` | Note is fully indexed and searchable | Normal display |
| `"FAILED"` | AI processing failed (note saved, not searchable) | Error badge + retry option |

---

## Recommended polling logic

```
1. POST /onboarding/step/knowledge-notes  →  get list of { id, processingStatus }
2. If all notes are COMPLETED → stop polling, show success state
3. Otherwise: wait 3 seconds, then GET /onboarding/knowledge-notes
4. Repeat step 2–3 until all are COMPLETED or FAILED (max ~60 s timeout)
```

**Suggested interval:** 3 seconds  
**Suggested max attempts:** 20 (60 seconds total)

> If a note reaches `"FAILED"`, show an error state for that note. The note text is still saved and visible, it just won't be used by the AI assistant. Consider offering a "Retry" button (which can re-POST the same note text).

---

## Sequence diagram

```
Frontend                     Backend                    BullMQ Worker
   |                            |                            |
   |  POST /step/knowledge-notes|                            |
   |--------------------------->|                            |
   |                            | save entry (PENDING)       |
   |                            | enqueue INGEST_MANUAL_NOTE |
   |                            |--------------------------->|
   |  200 { notes: [PENDING] }  |                            |
   |<---------------------------|                            |
   |                            |                            | LLM structuring
   |  GET /knowledge-notes      |                            | + embedding
   |--------------------------->|                            |
   |  [{ status: "PROCESSING" }]|                            |
   |<---------------------------|                            |
   |                            |                            | done → COMPLETED
   |  GET /knowledge-notes      |                            |
   |--------------------------->|                            |
   |  [{ status: "COMPLETED" }] |                            |
   |<---------------------------|                            |
   |  stop polling              |                            |
```

---

## Notes for the developer

- You can submit **multiple notes in one POST** (`notes: ["note 1", "note 2"]`). Each is saved and processed independently; they may complete at different times.
- The `processingStatus` field is new — older cached list responses may not include it. Treat a missing `processingStatus` as `"COMPLETED"` for backwards compatibility.
- There is no WebSocket/SSE push for status changes. Use polling.
- The alias endpoints (`/step/notes`) are identical to the primary ones. Use whichever the existing codebase calls.
