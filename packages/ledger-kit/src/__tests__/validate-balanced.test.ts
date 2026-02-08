import { describe, expect, it } from "vitest";

import { LedgerErrorCode, validateBalanced } from "../index";
import type { PostingInput } from "../index";

describe("validateBalanced", () => {
  it("returns ok=true when debit and credit are balanced", () => {
    const postings: PostingInput[] = [
      {
        accountCode: "expense:rent",
        direction: "DEBIT",
        amountMinor: 100_000,
        currency: "KRW",
        occurredAt: "2026-02-08"
      },
      {
        accountCode: "asset:cash",
        direction: "CREDIT",
        amountMinor: 100_000,
        currency: "KRW",
        occurredAt: "2026-02-08"
      }
    ];

    const result = validateBalanced(postings);
    expect(result.ok).toBe(true);
  });

  it("returns unbalanced error code when totals differ", () => {
    const postings: PostingInput[] = [
      {
        accountCode: "expense:rent",
        direction: "DEBIT",
        amountMinor: 100_000,
        currency: "KRW",
        occurredAt: "2026-02-08"
      },
      {
        accountCode: "asset:cash",
        direction: "CREDIT",
        amountMinor: 90_000,
        currency: "KRW",
        occurredAt: "2026-02-08"
      }
    ];

    const result = validateBalanced(postings);
    expect(result).toEqual({
      ok: false,
      errorCode: LedgerErrorCode.UNBALANCED_POSTINGS,
      debitTotal: 100_000,
      creditTotal: 90_000
    });
  });
});
