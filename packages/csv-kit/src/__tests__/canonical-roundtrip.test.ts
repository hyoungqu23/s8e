import { describe, expect, it } from "vitest";

import {
  assertCanonicalRoundTrip,
  parseCanonicalBundle,
  serializeCanonicalBundle,
  validateCanonicalBundle
} from "../index";
import type { CanonicalBundle } from "../index";

function makeBundle(): CanonicalBundle {
  return {
    manifest: {
      version: "1.0.0",
      base_currency: "KRW",
      locale_hint: "ko"
    },
    accounts: [
      {
        id: "acc-expense",
        household_id: "hh-1",
        code: "expense:living",
        name: "생활비",
        type: "EXPENSE"
      },
      {
        id: "acc-cash",
        household_id: "hh-1",
        code: "asset:cash",
        name: "현금",
        type: "ASSET"
      }
    ],
    transactions: [
      {
        id: "tx-1",
        household_id: "hh-1",
        occurred_at: "2026-02-08",
        posted_at: "2026-02-08",
        status: "POSTED",
        memo: "점심"
      }
    ],
    postings: [
      {
        id: "post-1",
        transaction_id: "tx-1",
        account_id: "acc-expense",
        direction: "DEBIT",
        amount_minor: "12000",
        currency: "KRW",
        entry_type: "ORIGINAL",
        linked_posting_id: ""
      },
      {
        id: "post-2",
        transaction_id: "tx-1",
        account_id: "acc-cash",
        direction: "CREDIT",
        amount_minor: "12000",
        currency: "KRW",
        entry_type: "ORIGINAL",
        linked_posting_id: ""
      }
    ],
    audit_events: [
      {
        id: "audit-1",
        transaction_id: "tx-1",
        event_type: "POSTED",
        occurred_at: "2026-02-08"
      }
    ]
  };
}

describe("canonical bundle", () => {
  it("round-trips without data loss", () => {
    const bundle = makeBundle();
    expect(() => assertCanonicalRoundTrip(bundle)).not.toThrow();
  });

  it("serializes and parses canonical files", () => {
    const bundle = makeBundle();

    const files = serializeCanonicalBundle(bundle);
    const parsed = parseCanonicalBundle(files);

    expect(parsed).toEqual(bundle);
  });

  it("returns no validation errors for a valid bundle", () => {
    const bundle = makeBundle();
    const errors = validateCanonicalBundle(bundle, { baseCurrency: "KRW" });

    expect(errors).toEqual([]);
  });
});
