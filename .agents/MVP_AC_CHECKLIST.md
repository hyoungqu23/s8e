# MVP_AC_CHECKLIST — One Page

## A) Immutable ledger
- [x] POSTED rows cannot be UPDATE/DELETE (repo guard + service write path)
- [x] Edit creates REVERSAL + CORRECTION
- [x] Every POSTED transaction balances (debits == credits)

## B) Delete UX (soft delete)
- [x] “Delete” action creates VOID (REVERSAL)
- [x] Default list hides voided
- [x] Filter can show voided (audit view)

## C) Locks
- [x] Reconciled requires un-reconcile before change
- [x] Closed period requires reopen (owner only)

## D) Quick Add parsing
- [x] No clipboard read on app entry
- [x] Parsing only after user action
- [x] Failures show reason + fix action (ko/en)

## E) Recurring
- [x] Generates DRAFT only; never auto-post
- [x] Rule changes affect future only

## F) CSV Studio
- [x] Canonical round-trip preserves balances & counts
- [x] Flat CSV export usable in spreadsheets
- [x] Atomic commit (all or nothing)
- [x] Injection mitigation enabled
- [x] Currency mismatch blocks canonical import with clear message

## G) i18n
- [x] ko/en supported across app, errors, CSV Studio
- [x] Locale is BCP 47; invalid falls back safely

## H) Responsiveness
- [x] Mobile/tablet/desktop usable for primary tasks
