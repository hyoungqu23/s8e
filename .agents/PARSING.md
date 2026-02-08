# PARSING — Quick Add Paste Parsing (v1.3.1)

## 1) Goal
Convert copied SMS/notification text into a pre-filled draft in ~2 seconds.

## 2) Trigger rule (critical)
No background clipboard reading.
Parsing only happens after explicit user action:
- open Quick Add modal
- click Paste button
- paste into Quick Add input

## 3) Strategy (MVP)
- Deterministic rulesets (regex + heuristics) first
- Optional LLM-assisted parsing behind opt-in (not required for MVP)

## 4) Output model
Parser returns:
- extracted fields (amount, datetime, merchant/memo, in/out)
- confidence score
- reason codes per field

```json
{
  "fields": {
    "occurred_at": { "value": "2026-02-04", "confidence": 0.70, "reason": "OK" },
    "amount":      { "value": 12900, "confidence": 0.95, "reason": "OK" },
    "memo":        { "value": "스타벅스", "confidence": 0.60, "reason": "HEURISTIC_MATCH" }
  },
  "overall_confidence": 0.78
}
```

## 5) Failure UX (must be friendly)
- Never show “unknown error” without guidance.
- Missing/ambiguous fields are highlighted with:
  - what is missing
  - how to fix (CTA)
- Do not block saving if remaining fields can be filled.

Reason codes:
- PARSE_NO_AMOUNT
- PARSE_MULTIPLE_AMOUNTS
- PARSE_NO_DATETIME
- PARSE_AMBIGUOUS_DATETIME
- PARSE_UNSUPPORTED_FORMAT

## 6) Test plan
- Golden test cases for:
  - bank transfers
  - card approvals
  - refunds/cancellations
  - edge cases (multiple amounts)
- Each ruleset ships with unit tests.
