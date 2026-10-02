# ANACITY — Architecture & Design Explanation

## 1. Problem Interpretation

Residential communities manage move-in and move-out requests manually — via email, phone, or paper forms. This creates:
- Incomplete requests (missing vehicle info, wrong dates)
- Rule violations (Sunday moves, insufficient notice)
- Slow admin review with no structured context
- No audit trail

**This prototype** replaces that with an AI-guided workflow: a resident describes their move in plain language, an agent collects and validates the request, and an admin makes a final decision with full AI-generated context.

---

## 2. User Journeys

### Resident — Move-In
1. Opens resident portal, selects their profile
2. Starts AI Move-In Assistant
3. Types natural language: "I want to move in next Saturday at 5 PM"
4. Agent extracts date/time, asks for missing info one field at a time
5. Agent validates against community rules (day, time, notice period)
6. If invalid: explains problem, suggests valid alternative
7. If valid: shows structured summary
8. Resident clicks **Confirm & Submit**
9. Request transitions: DRAFT → SUBMITTED → UNDER_REVIEW
10. Resident tracks status on My Requests page

### Resident — Move-Out
Same flow with move-out rules applied (notice period is the key constraint).

### Admin — Move-In/Out Review
1. Opens admin dashboard, sees stats and pending requests
2. Clicks Review on any request
3. Sees: resident info, request details, community rules, AI summary, AI recommendation
4. Chooses: Approve / Request More Information / Reject
5. Status updates, audit log entry created
6. Resident sees updated status immediately

---

## 3. Agent Design

### Intent Detection
The LLM receives a system prompt containing community rules (loaded from DB at runtime). It returns structured JSON with an `intent` field.

### Context
Community configuration is loaded from the database on every API call. Rules are never hardcoded in prompts or agent logic.

### State
Conversation state (collected fields, message history) is stored in the `MoveRequest.conversationState` column as JSON. It survives page refreshes, network errors, and server restarts.

### Tools
The `src/lib/services/agent.service.ts` module exposes named tool functions matching plan §12:
- `getCommunityConfig`, `getMoveRequest`, `createMoveRequest`, `updateMoveRequest`
- `validateMoveRequest`, `getAvailableSlots`, `submitMoveRequest`
- `generateRequestSummary`, `generateAdminRecommendation`
- `requestMoreInformation`, `approveMoveRequest`, `rejectMoveRequest`

These can be exposed as MCP tools without changing the underlying logic.

### Validation
All rule validation is deterministic TypeScript (`src/lib/validation/request.validation.ts`):
- Zod schema for field types
- `detectMissingFields()` — checks required fields
- `validateAgainstCommunityRules()` — checks date, day, time, notice period

The LLM is never asked to validate. It extracts; the application validates.

### Autonomy
The agent:
- CAN: extract data, detect missing fields, validate (deterministically), explain violations, suggest alternatives, generate summaries
- CANNOT: approve/reject requests, update DB directly, change status, override rules

### Human-in-the-Loop
Every request requires:
1. Resident confirmation (Confirm & Submit button)
2. Admin decision (Approve / Reject / More Info)

The LLM's recommendation is displayed as a suggestion, not a decision.

---

## 4. Architecture

```
                ┌─────────────────────┐
                │      RESIDENT       │
                │   Next.js Web UI    │
                └──────────┬──────────┘
                           │ POST /api/agent/chat
                           ↓
                ┌─────────────────────┐
                │  Agent Orchestrator │
                │                     │
                │  1. Load community  │
                │     config (DB)     │
                │  2. Call Groq LLM   │
                │  3. Extract data    │
                │  4. Detect missing  │
                │  5. Validate rules  │
                │  6. Generate summary│
                └──────────┬──────────┘
                           │
           ┌───────────────┼────────────────┐
           │               │                │
           ↓               ↓                ↓
   Community Config   Request Service   Validation
   (DB → JSON)        (status mgmt)     (Zod + rules)
           │               │                │
           └───────────────┼────────────────┘
                           ↓
                      Prisma ORM
                           ↓
                  SQLite / PostgreSQL

                ┌─────────────────────┐
                │       ADMIN         │
                │  Next.js Dashboard  │
                └──────────┬──────────┘
                           │ POST /api/admin/requests/[id]/action
                           ↓
                    Request Service
                    (validated transition)
                           ↓
                      Audit Log
```

---

## 5. Data Model

### Community
Stores the community name and a JSON configuration blob. Config contains move-in and move-out rules (allowed days, hours, notice period). Rules are stored here — never in application code.

### Resident
Name, email, phone, apartment number, community reference.

### MoveRequest
All request data plus:
- `conversationState` — full agent conversation as JSON (state persistence)
- `agentSummary` — LLM-generated summary for admin
- `agentRecommendation` — LLM-generated recommendation (APPROVE/REJECT/REQUEST_MORE_INFORMATION)
- `adminNotes` — admin's message to resident

### AuditLog
Every action: status changes, agent validations, admin views, resident resubmits. Stores actor type (RESIDENT/ADMIN/AGENT/SYSTEM), actor ID, action name, JSON details.

---

## 6. Community Scalability

Community rules are stored as JSON in the database. A different community would have a different row with different config. The agent system prompt is built from this config at runtime:

```typescript
const config = await getCommunityConfig(communityId);  // from DB
const systemPrompt = buildSystemPrompt(type, communityName, config);
```

Adding a new community = inserting a row. No code changes required.

---

## 7. AI vs Deterministic Logic

| Concern | Who handles it | Why |
|---------|---------------|-----|
| "next Saturday" → date | LLM | Natural language understanding |
| Is that date a weekday? | TypeScript | Deterministic, testable |
| Is it within notice period? | TypeScript | Deterministic, testable |
| What time is 5 PM? | LLM | Language parsing |
| Is that within allowed hours? | TypeScript | Rule enforcement |
| Request summary for admin | LLM | Summarisation |
| Should admin approve? | LLM (suggestion) | Context reasoning |
| Actually approving | Admin click + TypeScript | Human decision + validation |

The LLM is a **language interface** — it speaks human. TypeScript is the **rule engine** — it enforces policy.

---

## 8. Guardrails

The agent cannot approve or reject requests because:

1. **No direct DB access** — the LLM returns JSON; the application service layer performs all writes
2. **Status transition table** — `VALID_TRANSITIONS` in `request.service.ts` is a hardcoded map; only defined transitions are allowed
3. **Ownership validation** — every API route validates that the actor has permission
4. **Recommendation ≠ Decision** — `agentRecommendation` is stored as a string and displayed as a suggestion; the admin actions are separate button clicks that call separate endpoints

---

## 9. Assumptions

1. One community per deployment for the prototype (multi-community is architecturally supported)
2. Authentication is simplified to a resident selector dropdown; production requires real identity
3. Admin is any user who accesses `/admin`; production requires RBAC
4. SQLite is adequate for the prototype; Vercel serverless requires Turso or PostgreSQL
5. Groq free tier is sufficient for the demo workload
6. Document upload is out of scope for this prototype

---

## 10. Testing

Tests are in `/tests/`:

| File | Coverage |
|------|---------|
| `validation.test.ts` | Move-in/out rule validation, missing field detection, boundary conditions |
| `status-transitions.test.ts` | All valid/invalid status transitions, admin workflows |
| `admin-workflow.test.ts` | Agent service validation, available slots, notice period |

**36 tests, all passing.** Run with `npm test`.

---

## 11. Failure Recovery

### LLM Failure
- Request state is persisted to DB after every successful turn
- If Groq returns an error, the orchestrator returns a graceful error message
- The conversation can continue from the last saved state
- Duplicate requests are prevented: `requestId` is threaded through the chat

### Database Failure
- All API routes return structured errors
- The UI shows toast notifications for failures
- No false success states are displayed

---

## 12. Limitations

- **Authentication**: prototype uses a dropdown selector; production needs real auth
- **File uploads**: `documents` field exists in schema but upload UI is not built
- **Notifications**: no email/SMS on status changes
- **SQLite**: not suitable for Vercel serverless production
- **Multi-community admin**: single community visible in admin (DB supports multiple)
- **Rate limiting**: no per-user rate limiting on agent endpoints

---

## 13. Production Considerations

| Area | Recommendation |
|------|---------------|
| Database | PostgreSQL via Supabase or Neon; change `@prisma/adapter-libsql` to `@prisma/adapter-pg` |
| Authentication | Clerk or NextAuth with JWT; add `session.userId` to all service calls |
| RBAC | Admin role required for all `/admin` routes and `/api/admin/*` endpoints |
| Rate limiting | Upstash Redis rate limiting on `/api/agent/chat` |
| Observability | Vercel Analytics + structured JSON logging to a log sink |
| Notifications | Resend for email on status changes |
| Document storage | Vercel Blob or S3 for vehicle/ID document uploads |
| Model monitoring | Log every LLM call (input tokens, output, latency) to `AuditLog` |
| Secrets | Environment variables via Vercel dashboard; never in code |

---

## 14. Future Improvements

- **MCP tool exposure**: `src/lib/services/agent.service.ts` tool functions are already structured for MCP; wrapping them in an MCP server is straightforward
- **Calendar integration**: `getAvailableSlots()` could feed a date picker
- **Document verification**: LLM-assisted vehicle registration validation
- **Multi-agent**: separate extraction agent + validation agent + summary agent for higher accuracy
- **Streaming responses**: stream LLM output for better perceived latency
- **Real-time updates**: WebSocket or SSE for live status updates
- **Community portal**: admin can edit community rules via UI (no DB migration needed)
