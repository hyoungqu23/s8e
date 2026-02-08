# MVP_AC_CHECKLIST — One Page

## A) Immutable ledger
- [ ] POSTED rows cannot be UPDATE/DELETE (DB-level)
- [ ] Edit creates REVERSAL + CORRECTION
- [ ] Every POSTED transaction balances (debits == credits)

## B) Delete UX (soft delete)
- [ ] “Delete” action creates VOID (REVERSAL)
- [ ] Default list hides voided
- [ ] Filter can show voided (audit view)

## C) Locks
- [ ] Reconciled requires un-reconcile before change
- [ ] Closed period requires reopen (owner only)

## D) Quick Add parsing
- [ ] No clipboard read on app entry
- [ ] Parsing only after user action
- [ ] Failures show reason + fix action (ko/en)

## E) Recurring
- [ ] Generates DRAFT only; never auto-post
- [ ] Rule changes affect future only

## F) CSV Studio
- [ ] Canonical round-trip preserves balances & counts
- [ ] Flat CSV export usable in spreadsheets
- [ ] Atomic commit (all or nothing)
- [ ] Injection mitigation enabled
- [ ] Currency mismatch blocks canonical import with clear message

## G) i18n
- [ ] ko/en supported across app, errors, CSV Studio
- [ ] Locale is BCP 47; invalid falls back safely

## H) Responsiveness
- [ ] Mobile/tablet/desktop usable for primary tasks
