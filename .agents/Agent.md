# Agent.md — Multi-Agent Build Plan (v1.3.2)

This file is the operating manual for an “AI Agents squad” implementing TwoLine inside
`streamline: s8e`. It converts the docs into ticketable work with strict Definition of Done (DoD).

- Repo: Turborepo + pnpm workspace
- CI gate: `pnpm run ci` (lint/typecheck/test/build)
- App: `apps/twoline-web`
- Packages: `packages/ledger-kit`, `packages/csv-kit`, `packages/i18n`, `packages/ui`

---

## 0) Non-negotiables (must be enforced)

### 0.1 Append-only / immutable ledger
- POSTED ledger rows must never be UPDATE/DELETEd.
- “Edit” = REVERSAL + CORRECTION (new rows).
- “Delete” UX = “VOID” (REVERSAL) + hide by default.

### 0.2 Canonical CSV first
- Canonical export/import must be round-trip safe (balances + counts preserved).
- Flat CSV is a projection for analytics, not the source of truth.

### 0.3 i18n must cover errors
- Every user-visible error must have a message_key and be localized (ko/en).
- Locale is BCP 47 validated.

### 0.4 DoD is code, not prose
A ticket is “done” only when:
- tests pass,
- CI passes,
- acceptance checks are met,
- and PR includes a changeset when behavior changes.

---

## 1) Suggested agent roles

Recommended: 5 agents, each owning a bounded area.

- Agent A — Domain / Ledger (`packages/ledger-kit`)
- Agent B — CSV Studio Core (`packages/csv-kit`)
- Agent C — i18n + UI primitives (`packages/i18n`, `packages/ui`)
- Agent D — App Server / Persistence (`apps/twoline-web/src/server/*`)
- Agent E — App UI / UX (`apps/twoline-web/src/app/*`, `apps/twoline-web/src/features/*`)

---

## 2) Work breakdown structure (tickets)

### Ticket A1 — Ledger core types & invariants
Owner: Agent A  
Inputs: PRD 5.2, DATABASE invariants, TEMPLATES spec  
Scope:
- Posting types (DEBIT/CREDIT, entry_type)
- validateBalanced(postings) invariant
- Minimal transaction builder interfaces (pure)
DoD:
- Unit tests: balanced ok, unbalanced fails
- `pnpm run ci` passes

### Ticket A2 — Void & Correction chain
Owner: Agent A  
Scope:
- void(original) -> reversal postings
- correct(original, newSpec) -> reversal + correction
- Chain metadata helpers
DoD:
- Tests: edit scenario preserves audit trail and yields correct net effect
- No IO / no DB in ledger-kit

### Ticket B1 — Canonical bundle schema + serializer/parser
Owner: Agent B  
Inputs: CSV canonical + DATABASE  
Scope:
- manifest.json schema (version, base_currency)
- accounts/transactions/postings canonical tables
- serialize + parse
DoD:
- Round-trip test: serialize→parse yields identical structures (ids preserved)
- Error codes with message_keys

### Ticket B2 — Canonical validation + dedupe + security
Owner: Agent B  
Scope:
- Validation: required fields, balanced postings, currency match, locked rows rule
- Dedupe: duplicate import detection
- Export security: CSV injection mitigation
DoD:
- Tests for major error_code
- Excel BOM option tests

### Ticket C1 — i18n core (BCP47, resolve, message format)
Owner: Agent C  
Scope:
- BCP47 parser + supported locale resolution (ko/en)
- Message formatting/interpolation
DoD:
- Tests for invalid tags and fallback behavior

### Ticket C2 — UI error conventions
Owner: Agent C  
Scope:
- ErrorText component that renders “what + how to fix”
- Field-level error API contract
- Accessibility basics (aria-describedby, focus)
DoD:
- Works in ko/en via message_key

### Ticket D1 — Persistence model + append-only enforcement
Owner: Agent D  
Scope:
- Repos/services for postings/transactions
- DB-level guard: block UPDATE/DELETE on POSTED
- Service methods: postDraft/voidPosted/correctPosted
DoD:
- Integration test: cannot mutate POSTED rows
- “Delete” creates VOID (reversal rows)

### Ticket D2 — CSV import commit pipeline (atomic)
Owner: Agent D  
Scope:
- Upload → parse → validate → preview → commit (all-or-nothing)
- audit_events logs import sessions
DoD:
- Integration test: invalid blocks commit; valid commits all
- Observability: session id, counts, error codes

### Ticket E1 — Transaction create flow (template-driven)
Owner: Agent E  
Scope:
- Template selector + minimal forms
- Draft save + post
DoD:
- Mobile-first, friendly localized errors
- Create and list a POSTED transaction

### Ticket E2 — Quick Add (paste parsing) MVP
Owner: Agent E  
Scope:
- Quick Add modal with paste input
- Parse fills a DRAFT form
- Failure UX uses reason codes and guidance
DoD:
- Parsing triggers only after explicit action
- At least 10 golden fixtures + expected outputs

### Ticket E3 — CSV Studio UI (import/export)
Owner: Agent E  
Scope:
- Export: Flat vs Canonical, BOM option
- Import: preview errors, commit
DoD:
- User can export and re-import canonical with no loss
- Clear error lists with suggested fixes

---

## 3) Integration order (recommended)

1) A1 → A2 (ledger-kit core)  
2) B1 → B2 (csv-kit canonical + validation)  
3) D1 (append-only server write path)  
4) E1 (template-driven input)  
5) D2 + E3 (CSV Studio end-to-end)  
6) E2 (Quick Add)

---

## 4) Cross-agent coordination rules

- No agent edits another agent’s package without a handoff.
- Shared contracts live in packages:
  - ledger-kit (domain types)
  - csv-kit (csv schemas + error codes)
  - i18n (message keys)
- App orchestrates; packages stay IO-free.

---

## 5) PR rules

Each PR must:
- pass `pnpm run ci`
- include changeset if behavior changes
- contain “How to test”
- reference ticket id (A1, B2, etc.)

---

## 6) Minimal release gate

Before tagging `twoline-web@0.1.0`:
- MVP_AC_CHECKLIST is fully checked
- Canonical CSV round-trip passes in CI
- POSTED immutability enforced at DB level
- ko/en works for critical flows (create/edit/void/import errors)

---

## 7) Open questions (fill before parallelizing too far)

If undecided, freeze related tickets:
- DB choice & auth provider (affects D1/D2)
- Scheduled jobs mechanism for recurring
- Canonical bundle exact column set
