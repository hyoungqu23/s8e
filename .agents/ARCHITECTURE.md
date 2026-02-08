# ARCHITECTURE — streamline: s8e × TwoLine (v1.3.1)

## 1) Monorepo topology

```
.
├─ apps/
│  └─ twoline-web/            # Next.js App Router app (TwoLine)
├─ packages/
│  ├─ configs/                # shared TS/ESLint/Tailwind configs
│  ├─ ui/                     # shared UI components (Tailwind v4)
│  ├─ i18n/                   # i18n utilities + message loading
│  ├─ ledger-kit/             # double-entry ledger domain + invariants
│  └─ csv-kit/                # CSV parsing/serialization + validation
├─ turbo.json
├─ pnpm-workspace.yaml
└─ .changeset/
```

### Responsibilities (boundary rules)

- **apps/twoline-web**
  - Only place that knows about: routing, pages, server actions/APIs, persistence, auth, RBAC, deployment.
  - Uses packages as libraries (no business-logic duplication).

- **packages/ledger-kit**
  - Domain primitives: accounts, postings, journal/transaction builders, validation (balanced entries).
  - Policies: immutable ledger events (REVERSAL/CORRECTION), status transitions (DRAFT→POSTED, etc.).
  - No DB, no network, no React.

- **packages/csv-kit**
  - Canonical bundle format + Flat CSV format.
  - Import validation and error codes.
  - Export quoting and injection mitigation.
  - No UI, no DB.

- **packages/i18n**
  - Locale parsing/selection
  - Message dictionaries loader
  - BCP 47 enforcement (`ko`, `en`, optionally region tags like `en-US`).

- **packages/ui**
  - Form primitives, validation error rendering conventions, accessibility helpers.
  - Friendly error patterns used across the app.

- **packages/configs**
  - Shared ESLint/TS/Tailwind presets.

## 2) Versioning and release management (Changesets)

- Independent versioning: each app/package has its own semver.
- `privatePackages.version: true`: private apps/packages also receive version bumps and changelog entries.
- A `.changeset/*.md` is required when a change affects runtime behavior of any app/package.
- Changesets action generates a `Version Packages` PR; merging it updates versions and `CHANGELOG.md`.

### Tag-based deploy

Production deploy uses tags:

- Tag format: `<app>@<semver>`
  - Example: `twoline-web@1.2.3`

## 3) Runtime architecture (web)

- Client: React 19 + Next.js App Router
- Data: TanStack Query (client caching) + server actions/APIs
- Charts: Chart.js
- Styling: Tailwind CSS v4 (shared UI components from `packages/ui`)
- Validation: StandardSchema (types + runtime validation)
- i18n: `packages/i18n` + per-locale message catalogs

### Core append-only rule

Posted ledger rows must not be mutated. All changes are modeled as additional events:

- POSTED entry: immutable (DB-level prevention recommended)
- VOID: reversal postings
- EDIT: reversal + correction postings

## 4) Observability (MVP)

Minimum required:
- structured logs for CSV import sessions
- parsing reason codes & success rate counters
- audit event log for posted/void/edit/reconcile/close actions
