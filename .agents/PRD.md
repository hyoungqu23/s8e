# PRD — TwoLine MVP (v1.3.1)

## 0) Summary

TwoLine is a **shared household ledger** (double-entry by default) designed to make manual input sustainable.

MVP pillars:
1) Trust: immutable ledger (no destructive edits after posting)
2) Speed: Quick Add (paste parsing) + recurring drafts
3) Ownership: CSV Studio (perfect import/export)
4) Collaboration: email-invite shared household with roles

## 1) Goals

### Product goals
- Reduce input abandonment for manual finance tracking.
- Provide audit-safe corrections while preserving a delete-like UX.
- Make data portable: round-trip-safe CSV export/import.

### MVP success signals
- Activation: first POSTED entry within 24h of signup.
- Quick Add adoption: meaningful share of entries created via paste parsing.
- CSV Studio success: export + import without data loss.
- W1 retention: users keep entering transactions after 7 days.

## 2) Non-goals (MVP)
- Multi-currency ledger (base currency chosen at household creation; immutable thereafter).
- Bank sync / open banking.
- Advanced investment accounting beyond base-currency average cost policy.
- Full accounting statements beyond household insights.

## 3) Target users
- Couples/families tracking shared household spending
- Individuals tracking personal + shared flows
- Freelancers needing traceability (not full corporate accounting)

## 4) Core concepts
- Household: shared workspace containing ledger data.
- Member: user belonging to a household with a role.
- Transaction: user-visible logical event, backed by multiple postings.
- Posting: debit/credit line; sum must balance.
- Status: DRAFT → POSTED (immutable). Additional: VOIDED, SUPERSEDED, RECONCILED, CLOSED.

### Base currency
- Stored as `household.base_currency` (ISO 4217), default `KRW`.
- Option A: cannot be changed after creation.

## 5) Requirements

### 5.1 Shared household & access control
- Create household (owner)
- Invite via email link
  - If email not provided: block and show a clear “email required” message.
- Roles: `owner`, `member`
  - Owner can manage invites and lock/unlock (reconcile/close).

### 5.2 Immutable ledger policy (append-only)
- POSTED ledger records cannot be UPDATE/DELETE at DB level.
- Edit flow:
  - generate REVERSAL + CORRECTION (append-only)
- Delete flow (user mental model):
  - show Delete action
  - internally perform VOID (REVERSAL)
  - default lists hide voided items (soft delete UX)
  - Show-voided filter reveals them for audit.
- Undo semantics:
  - Undo creates a correcting event (never removes history).

### 5.3 Quick Add — paste parsing
- No automatic clipboard reading on app entry.
- Parsing triggers only on explicit user action:
  - open Quick Add modal
  - click Paste button
  - paste into Quick Add input
- Parse result fills a DRAFT form; user confirms to POST.
- Failure UX must be friendly:
  - field-level failures + reason codes
  - suggested fixes (CTA)
  - do not block saving if user can fill missing fields.

### 5.4 Recurring (MVP)
- User can mark a template or prior transaction as recurring.
- System generates a DRAFT instance on schedule (monthly is sufficient).
- Never auto-POST recurring items.

### 5.5 CSV Studio (perfect import/export)
- Export modes:
  - Flat CSV (analysis-friendly)
  - Canonical bundle (round-trip, audit-friendly)
- Import pipeline:
  - Upload → parse → validate → preview → commit (atomic)
- Canonical round-trip:
  - export → import → same balances & counts
- Security:
  - CSV injection mitigation on export
- Encoding:
  - Excel-friendly option (UTF-8 BOM)

### 5.6 Dashboard insights (MVP)
- Monthly spend trend (line)
- Category breakdown (pie/bar)
- Cashflow summary (income/expense/net)
- Recurring upcoming drafts list
- Input health widget:
  - days tracked in last 30
  - % entries created via Quick Add
  - CSV import success rate (if used)

## 6) UX requirements
- Mobile-first responsive (mobile/tablet/desktop).
- Input is keyboard-friendly with sensible defaults.
- Errors are always: what happened + how to fix, and localized (ko/en).

## 7) Engineering constraints (repo-aligned)
- Node 20+, pnpm 9+
- Trunk-based + Changesets
- `pnpm run ci` must pass before PR merge
- Deploy via tag `<app>@<semver>` for `twoline-web`

## 8) Acceptance criteria
See: `MVP_AC_CHECKLIST.md`

## 9) Milestones
- M0: ledger-kit invariants + basic forms
- M1: immutable edit/void flows + audit filters
- M2: CSV Studio (canonical + flat) + round-trip tests
- M3: Quick Add + recurring + demo data onboarding
- M4: dashboards + i18n polish
