# TwoLine — Product & Engineering Docs (v1.3.2)

This folder contains the **product** and **engineering** documentation for the **TwoLine** MVP,
built inside the `streamline: s8e` Turborepo monorepo.

- Date: 2026-02-04
- Scope: MVP (web-first)
- App: `apps/twoline-web`
- Core packages: `packages/ledger-kit`, `packages/csv-kit`, `packages/i18n`, `packages/ui`, `packages/configs`

> This documentation set is Agent-ready:
> - PRD.md: product requirements & acceptance criteria
> - ARCHITECTURE.md: monorepo + runtime architecture + boundaries
> - DATABASE.md: data model (conceptual + key invariants)
> - TEMPLATES.md: transaction templates (JSON spec + catalog)
> - CSV.md: CSV Studio spec (import/export + round-trip + validation)
> - PARSING.md: Quick Add (paste parsing) spec + reason codes + tests

## Repo quick facts (as implemented)

- Monorepo: Turborepo + pnpm workspaces
- Versioning: Changesets (independent), including private apps/packages
- CI: `pnpm run ci` = lint + typecheck + test + build
- Deploy: tag-based, `<app>@<semver>` (e.g. `twoline-web@1.2.3`)

## How docs map to the code

| Doc | Primary code touchpoints |
|---|---|
| PRD.md | `apps/twoline-web`, all packages |
| ARCHITECTURE.md | `turbo.json`, workspace layout, shared libs |
| DATABASE.md | persistence layer in `twoline-web` + domain invariants in `ledger-kit` |
| TEMPLATES.md | `ledger-kit` builders/validators + `twoline-web` UI forms |
| CSV.md | `csv-kit` + `twoline-web` CSV Studio UI |
| PARSING.md | `twoline-web` Quick Add UI + parsing utilities |
| MVP_AC_CHECKLIST.md | release gates / QA |

## Change log
- v1.3.2: Updated docs to match the current `s8e` monorepo setup (app/package names, CI scripts, Changesets workflow, tag deploy).
