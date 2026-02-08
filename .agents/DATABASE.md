# DATABASE — Conceptual Model (v1.3.1)

This doc captures **naming + connectivity** and **invariants**.
Implementation DDL is intentionally deferred until the domain is stable.

## 1) Core entities

- households
- users
- household_memberships
- invites
- accounts (chart of accounts)
- transactions (logical, user-visible)
- postings (debit/credit line items; append-only)
- audit_events
- reconciliation:
  - statement_imports
  - statement_lines
  - reconciliation_links
- periods:
  - accounting_periods (open/closed)
- recurring:
  - recurring_rules
  - recurring_instances
- quick add:
  - text_ingestions
  - parse_attempts

## 2) Connectivity (high level)

```
users 1..* household_memberships *..1 households
households 1..* invites
households 1..* accounts
households 1..* transactions 1..* postings
transactions 0..* audit_events
households 0..* statement_imports 1..* statement_lines
statement_lines 0..1 reconciliation_links 0..1 postings (or transactions)
households 0..* accounting_periods (open/closed)
households 0..* recurring_rules 0..* recurring_instances -> transactions (draft)
households 0..* text_ingestions 0..* parse_attempts -> transactions (draft)
```

## 3) Invariants

### 3.1 Double-entry balance
For every POSTED transaction:
- Sum(debit) == Sum(credit)

### 3.2 Immutability (append-only)
- POSTED postings are never updated/deleted.
- Edits create new postings with entry_type:
  - ORIGINAL / REVERSAL / CORRECTION
- Current vs audit views:
  - current: hides voided/superseded by default
  - audit: shows full chain

### 3.3 Base currency
- households.base_currency is set at creation; cannot change.

### 3.4 Access control
- Every row is scoped to household (directly or indirectly).
- Membership required.

### 3.5 Locks
- Reconciled or closed-period transactions require explicit unlock workflow:
  - un-reconcile event
  - reopen period (owner only)

## 4) Recommended DB enforcement (MVP)
- One write path: server mutations (server actions/APIs).
- DB protections:
  - triggers to block UPDATE/DELETE on POSTED
  - constraints to prevent unbalanced postings for POSTED
  - audit_events append-only
