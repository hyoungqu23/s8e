# CODE_SCAFFOLDING_PLAN — Module & File Tree (v1.3.1)

This doc maps **product docs → code modules** and proposes a concrete file/folder scaffold
for the current `streamline: s8e` monorepo:

- App: `apps/twoline-web`
- Packages: `packages/ledger-kit`, `packages/csv-kit`, `packages/i18n`, `packages/ui`, `packages/configs`

Goal: minimize architectural drift by making each doc section “land” in a predictable module.

---

## 1) High-level mapping (Docs → Code)

| Doc section | Primary owner | Secondary |
|---|---|---|
| PRD 5.1 Shared household & RBAC | twoline-web (server) | i18n, ui |
| PRD 5.2 Immutable ledger policy | ledger-kit (domain) | twoline-web (persistence + orchestration) |
| PRD 5.3 Quick Add parsing | twoline-web (UI + server) | (optional future) parsing-kit |
| PRD 5.4 Recurring | ledger-kit (rules model) | twoline-web (jobs + persistence) |
| PRD 5.5 CSV Studio | csv-kit (formats + validation) | twoline-web (Studio UI + commit pipeline) |
| PRD 5.6 Dashboard | twoline-web (queries, charts) | ledger-kit (computed helpers), ui |
| i18n constraints | i18n | twoline-web, ui |
| AC checklist | tests in app + packages | CI gating |

---

## 2) Proposed repo file tree (MVP scaffold)

### 2.1 `apps/twoline-web`

```
apps/twoline-web/
├─ src/
│  ├─ app/                              # Next.js App Router
│  │  ├─ (public)/
│  │  │  ├─ page.tsx                    # landing (optional)
│  │  │  └─ layout.tsx
│  │  ├─ (authed)/
│  │  │  ├─ layout.tsx                  # auth gate + providers (Query, i18n)
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ ledger/
│  │  │  │  ├─ page.tsx                 # list + filters
│  │  │  │  ├─ new/page.tsx             # create transaction
│  │  │  │  └─ [id]/page.tsx            # detail + audit chain
│  │  │  ├─ csv-studio/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ import/page.tsx
│  │  │  │  └─ export/page.tsx
│  │  │  ├─ recurring/page.tsx
│  │  │  └─ settings/
│  │  │     ├─ household/page.tsx       # base_currency, locale, members
│  │  │     └─ invites/page.tsx
│  │  └─ api/                           # route handlers (only if needed)
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ household/
│  │  ├─ ledger/
│  │  ├─ quick-add/
│  │  │  ├─ QuickAddModal.tsx
│  │  │  ├─ parse.ts
│  │  │  ├─ reason-codes.ts
│  │  │  └─ __tests__/
│  │  ├─ csv-studio/
│  │  ├─ dashboard/
│  │  └─ recurring/
│  ├─ server/
│  │  ├─ db/
│  │  ├─ repos/
│  │  ├─ services/
│  │  ├─ actions/
│  │  ├─ auth/
│  │  └─ jobs/
│  ├─ lib/
│  │  ├─ query/
│  │  ├─ i18n/
│  │  ├─ money/
│  │  ├─ csv/
│  │  └─ telemetry/
│  ├─ messages/
│  │  ├─ ko.json
│  │  └─ en.json
│  └─ styles/globals.css
├─ package.json
└─ next.config.*
```

### 2.2 `packages/ledger-kit`

```
packages/ledger-kit/
├─ src/
│  ├─ money/{amount.ts,currency.ts}
│  ├─ accounts/{types.ts,chart.ts}
│  ├─ postings/{types.ts,validate-balanced.ts,chain.ts}
│  ├─ transactions/{types.ts,builder.ts,void.ts,correct.ts}
│  ├─ recurring/{types.ts,schedule.ts}
│  ├─ templates/{spec.ts,catalog.ts,render.ts}
│  ├─ insights/{rollups.ts,health.ts}
│  └─ errors/{codes.ts,messages.ts}
├─ __tests__/
└─ package.json
```

### 2.3 `packages/csv-kit`

```
packages/csv-kit/
├─ src/
│  ├─ formats/
│  │  ├─ flat/{schema.ts,parse.ts,serialize.ts}
│  │  └─ canonical/{manifest.ts,bundle.ts,parse.ts,serialize.ts}
│  ├─ validate/{errors.ts,dedupe.ts,roundtrip.ts}
│  ├─ security/csv-injection.ts
│  ├─ encoding/bom.ts
│  └─ rfc4180/quoting.ts
├─ __tests__/
└─ package.json
```

### 2.4 `packages/i18n`

```
packages/i18n/
├─ src/
│  ├─ locale/{bcp47.ts,resolve.ts}
│  ├─ messages/{types.ts,format.ts}
│  └─ errors/codes.ts
├─ __tests__/
└─ package.json
```

### 2.5 `packages/ui`

```
packages/ui/
├─ src/
│  ├─ form/{Field.tsx,ErrorText.tsx,helpers.ts,a11y.ts}
│  ├─ feedback/{Toast.tsx,Banner.tsx,Modal.tsx}
│  └─ table/DataTable.tsx
└─ package.json
```

---

## 3) Landing points per doc section

### Immutable ledger (PRD 5.2)
- `ledger-kit/src/postings/validate-balanced.ts`
- `ledger-kit/src/transactions/void.ts`
- `ledger-kit/src/transactions/correct.ts`
- `twoline-web/src/server/services/ledger-post.service.ts`
- `twoline-web/src/server/repos/postings.repo.ts`

### Quick Add (PRD 5.3)
- `twoline-web/src/features/quick-add/*`

### CSV Studio (PRD 5.5)
- `csv-kit/src/formats/*`
- `twoline-web/src/features/csv-studio/*`
- `twoline-web/src/server/services/csv-import.service.ts`

### Recurring (PRD 5.4)
- `ledger-kit/src/recurring/schedule.ts`
- `twoline-web/src/server/jobs/recurring-drafts.job.ts`

### i18n (PRD 6)
- `i18n/src/locale/bcp47.ts`
- `twoline-web/src/messages/{ko,en}.json`

---

## 4) Scaffolding tasks (recommended order)

1) Scaffold `ledger-kit` invariants + tests
2) Implement app persistence repos + posting service (append-only)
3) Templates: UI form → ledger-kit builder
4) Quick Add: paste → parse → draft
5) CSV Studio: canonical export → import preview → commit
6) Recurring drafts: rule → scheduled drafts
7) Dashboard rollups

---

## 5) Turbo alignment

Each app/package must have:
- `build`, `lint`, `typecheck`, `test`

So that `pnpm run ci` remains the single gate and Turbo caching works consistently.
