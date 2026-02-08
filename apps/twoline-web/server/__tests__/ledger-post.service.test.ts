import { describe, expect, it } from "vitest";

import type { PostingInput } from "@s8e/ledger-kit";

import { LedgerServiceError, LedgerServiceErrorCode } from "../ledger/errors";
import { InMemoryPostingsRepo } from "../repos/postings.repo";
import { InMemoryTransactionsRepo } from "../repos/transactions.repo";
import { LedgerPostService } from "../services/ledger-post.service";

function makeIdFactory() {
  let index = 1;
  return () => `id-${index++}`;
}

function buildBalancedPostings(amountMinor: number): PostingInput[] {
  return [
    {
      accountCode: "expense:living",
      direction: "DEBIT",
      amountMinor,
      currency: "KRW",
      occurredAt: "2026-02-08"
    },
    {
      accountCode: "asset:cash",
      direction: "CREDIT",
      amountMinor,
      currency: "KRW",
      occurredAt: "2026-02-08"
    }
  ];
}

function sumNetByAccount(postings: Array<{ accountCode: string; direction: "DEBIT" | "CREDIT"; amountMinor: number }>) {
  const totals = new Map<string, number>();
  for (const posting of postings) {
    const sign = posting.direction === "DEBIT" ? 1 : -1;
    const current = totals.get(posting.accountCode) ?? 0;
    totals.set(posting.accountCode, current + sign * posting.amountMinor);
  }
  return totals;
}

function createService() {
  const transactionsRepo = new InMemoryTransactionsRepo();
  const postingsRepo = new InMemoryPostingsRepo((transactionId) => transactionsRepo.getStatus(transactionId));
  const service = new LedgerPostService(transactionsRepo, postingsRepo, makeIdFactory());
  return { service, transactionsRepo, postingsRepo };
}

describe("LedgerPostService append-only flow", () => {
  it("blocks update/delete for posted rows", () => {
    const { service, transactionsRepo, postingsRepo } = createService();
    const draft = service.createDraft({
      householdId: "household-1",
      occurredAt: "2026-02-08",
      memo: "lunch",
      postings: buildBalancedPostings(12_000)
    });

    service.postDraft(draft.id);

    expect(() => transactionsRepo.update(draft.id, { memo: "patched" })).toThrowError(
      /Cannot update posted transaction/
    );
    expect(() => transactionsRepo.delete(draft.id)).toThrowError(/Cannot delete posted transaction/);
    expect(() => postingsRepo.deleteDraftPostings(draft.id)).toThrowError(
      /Cannot delete postings for posted transaction/
    );
  });

  it("deletePosted creates reversal rows instead of deleting the original", () => {
    const { service, transactionsRepo } = createService();
    const draft = service.createDraft({
      householdId: "household-1",
      occurredAt: "2026-02-08",
      memo: "rent",
      postings: buildBalancedPostings(100_000)
    });
    const original = service.postDraft(draft.id);

    const reversal = service.deletePosted(original.transaction.id);

    expect(reversal.transaction.kind).toBe("REVERSAL");
    expect(reversal.transaction.sourceTransactionId).toBe(original.transaction.id);
    expect(transactionsRepo.findById(original.transaction.id)?.status).toBe("POSTED");
    expect(reversal.postings[0].linkedPostingId).toBe(original.postings[0].id);
    expect(reversal.postings[1].linkedPostingId).toBe(original.postings[1].id);

    const totals = sumNetByAccount([...original.postings, ...reversal.postings]);
    expect(totals.get("expense:living")).toBe(0);
    expect(totals.get("asset:cash")).toBe(0);
  });

  it("correctPosted appends reversal + correction and hides superseded original in current view", () => {
    const { service } = createService();
    const draft = service.createDraft({
      householdId: "household-1",
      occurredAt: "2026-02-08",
      memo: "utility",
      postings: buildBalancedPostings(120_000)
    });
    const original = service.postDraft(draft.id);

    const correction = service.correctPosted(original.transaction.id, buildBalancedPostings(100_000));
    const current = service.listCurrentPostedTransactions("household-1");

    expect(correction.reversal.transaction.kind).toBe("REVERSAL");
    expect(correction.correction.transaction.kind).toBe("CORRECTION");
    expect(
      current.some((transaction) => transaction.id === original.transaction.id)
    ).toBe(false);
    expect(
      current.some((transaction) => transaction.id === correction.correction.transaction.id)
    ).toBe(true);
  });

  it("rejects posting unbalanced drafts", () => {
    const { service } = createService();
    const draft = service.createDraft({
      householdId: "household-1",
      occurredAt: "2026-02-08",
      postings: [
        {
          accountCode: "expense:living",
          direction: "DEBIT",
          amountMinor: 10_000,
          currency: "KRW",
          occurredAt: "2026-02-08"
        },
        {
          accountCode: "asset:cash",
          direction: "CREDIT",
          amountMinor: 9_000,
          currency: "KRW",
          occurredAt: "2026-02-08"
        }
      ]
    });

    try {
      service.postDraft(draft.id);
      throw new Error("Expected service.postDraft to fail for unbalanced postings");
    } catch (error) {
      expect(error).toBeInstanceOf(LedgerServiceError);
      if (error instanceof LedgerServiceError) {
        expect(error.code).toBe(LedgerServiceErrorCode.UNBALANCED_POSTINGS);
      }
    }
  });
});
