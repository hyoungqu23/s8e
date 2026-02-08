# CSV — CSV Studio Spec (v1.3.1)

## 1) Objectives
- Perfect portability: users can export/import with no loss.
- Two export modes:
  - Flat CSV (analysis-friendly)
  - Canonical bundle (round-trip, audit-friendly)

## 2) Formats

### 2.1 Flat CSV
- One row per logical transaction (best-effort)
- Columns:
  - occurred_at, posted_at
  - amount (base currency)
  - memo, counterparty
  - template_id, category
  - status flags (voided/superseded)

### 2.2 Canonical bundle (recommended)
Zip containing:
- manifest.json (schema version, base_currency, locale hints)
- accounts.csv
- transactions.csv
- postings.csv
- audit_events.csv (recommended)
- recurring_rules.csv (optional)

Canonical must preserve:
- ids
- posting chains (ORIGINAL/REVERSAL/CORRECTION)
- statuses

## 3) Import pipeline
1) Upload
2) Parse + validate
3) Preview (errors/warnings/dedupe candidates)
4) Commit (atomic)

### Idempotency
- Canonical: importing the same bundle twice must detect duplicates or require explicit force mode.

## 4) Validation & errors
Each error includes:
- error_code
- message_key (i18n)
- suggested_fix

Common error codes:
- CSV_INVALID_DATE
- CSV_INVALID_AMOUNT
- CSV_MISSING_REQUIRED
- CSV_UNBALANCED_POSTINGS
- CSV_CURRENCY_MISMATCH
- CSV_LOCKED_TRANSACTION

## 5) Security
- CSV injection mitigation on export:
  - cells starting with `=`, `+`, `-`, `@` are escaped by default
- Import staging is private; commit only after preview.

## 6) Excel compatibility
- Provide Excel-friendly export (UTF-8 BOM).
- Explain in UI (tooltip) what this option does.
