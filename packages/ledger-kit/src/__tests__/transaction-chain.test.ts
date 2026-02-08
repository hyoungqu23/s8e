import { describe, expect, it } from "vitest";

import { correctTransaction, voidTransaction } from "../index";
import type { PostedTransaction, PostingInput } from "../index";

function makeIdFactory() {
  let index = 1;
  return () => `id-${index++}`;
}

function signedAmount(direction: "DEBIT" | "CREDIT", amountMinor: number) {
  return direction === "DEBIT" ? amountMinor : -amountMinor;
}

function sumByAccount(transactions: PostedTransaction[]) {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    for (const posting of transaction.postings) {
      const current = totals.get(posting.accountCode) ?? 0;
      totals.set(posting.accountCode, current + signedAmount(posting.direction, posting.amountMinor));
    }
  }

  return totals;
}

describe("append-only transaction chain", () => {
  it("voidTransaction creates reversal postings with linked posting ids", () => {
    const original: PostedTransaction = {
      id: "tx-original",
      chainId: "chain-1",
      kind: "ORIGINAL",
      status: "POSTED",
      occurredAt: "2026-02-08",
      postings: [
        {
          id: "p-1",
          transactionId: "tx-original",
          chainId: "chain-1",
          entryType: "ORIGINAL",
          accountCode: "expense:rent",
          direction: "DEBIT",
          amountMinor: 100_000,
          currency: "KRW",
          occurredAt: "2026-02-08"
        },
        {
          id: "p-2",
          transactionId: "tx-original",
          chainId: "chain-1",
          entryType: "ORIGINAL",
          accountCode: "asset:cash",
          direction: "CREDIT",
          amountMinor: 100_000,
          currency: "KRW",
          occurredAt: "2026-02-08"
        }
      ]
    };
    const idFactory = makeIdFactory();

    const reversal = voidTransaction(original, { idFactory });

    expect(reversal.kind).toBe("REVERSAL");
    expect(reversal.postings).toHaveLength(2);
    expect(reversal.postings[0].direction).toBe("CREDIT");
    expect(reversal.postings[0].linkedPostingId).toBe("p-1");
    expect(reversal.postings[1].direction).toBe("DEBIT");
    expect(reversal.postings[1].linkedPostingId).toBe("p-2");
    expect(reversal.sourceTransactionId).toBe("tx-original");
  });

  it("correctTransaction keeps full chain and yields the corrected net effect", () => {
    const original: PostedTransaction = {
      id: "tx-original",
      chainId: "chain-1",
      kind: "ORIGINAL",
      status: "POSTED",
      occurredAt: "2026-02-08",
      postings: [
        {
          id: "p-1",
          transactionId: "tx-original",
          chainId: "chain-1",
          entryType: "ORIGINAL",
          accountCode: "expense:utilities",
          direction: "DEBIT",
          amountMinor: 120_000,
          currency: "KRW",
          occurredAt: "2026-02-08"
        },
        {
          id: "p-2",
          transactionId: "tx-original",
          chainId: "chain-1",
          entryType: "ORIGINAL",
          accountCode: "asset:cash",
          direction: "CREDIT",
          amountMinor: 120_000,
          currency: "KRW",
          occurredAt: "2026-02-08"
        }
      ]
    };
    const correctedInputs: PostingInput[] = [
      {
        accountCode: "expense:utilities",
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
    const idFactory = makeIdFactory();

    const result = correctTransaction(original, correctedInputs, { idFactory });
    const totals = sumByAccount([original, result.reversal, result.correction]);

    expect(result.reversal.kind).toBe("REVERSAL");
    expect(result.correction.kind).toBe("CORRECTION");
    expect(result.reversal.chainId).toBe("chain-1");
    expect(result.correction.chainId).toBe("chain-1");
    expect(totals.get("expense:utilities")).toBe(100_000);
    expect(totals.get("asset:cash")).toBe(-100_000);
  });
});
