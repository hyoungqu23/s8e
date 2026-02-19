import { describe, expect, it } from "vitest";

import type { LedgerPosting } from "@s8e/ledger-kit";

import type { TransactionRecord } from "../../ledger/types";
import type { PostingRepository, TransactionRepository } from "../ports";
import { InMemoryPostingsRepo } from "../postings.repo";
import { InMemoryTransactionsRepo } from "../transactions.repo";

function createRepositories(): {
  transactionsRepo: TransactionRepository;
  postingsRepo: PostingRepository;
} {
  const transactionsRepo = new InMemoryTransactionsRepo();
  const postingsRepo = new InMemoryPostingsRepo((transactionId) => transactionsRepo.getStatus(transactionId));

  return {
    transactionsRepo,
    postingsRepo
  };
}

function createDraftTransaction(id: string): TransactionRecord {
  return {
    id,
    householdId: "household-demo",
    chainId: id,
    kind: "ORIGINAL",
    status: "DRAFT",
    occurredAt: "2026-02-08",
    memo: "memo",
    source: "MANUAL",
    lockState: "UNLOCKED"
  };
}

function createPosting(id: string, transactionId: string, direction: LedgerPosting["direction"]): LedgerPosting {
  return {
    id,
    transactionId,
    chainId: transactionId,
    entryType: "ORIGINAL",
    accountCode: direction === "DEBIT" ? "expense:living" : "asset:cash",
    direction,
    amountMinor: 10_000,
    currency: "KRW",
    occurredAt: "2026-02-08"
  };
}

describe("in-memory repositories contract", () => {
  it("supports snapshot/restore on transactions repository", () => {
    const { transactionsRepo } = createRepositories();
    const tx = createDraftTransaction("tx-1");
    transactionsRepo.create(tx);

    const snapshot = transactionsRepo.snapshot();
    transactionsRepo.delete(tx.id);
    expect(transactionsRepo.listAll()).toHaveLength(0);

    transactionsRepo.restore(snapshot);
    expect(transactionsRepo.listAll()).toHaveLength(1);
    expect(transactionsRepo.findById(tx.id)?.status).toBe("DRAFT");
  });

  it("prevents mutation of posted transactions and their postings", () => {
    const { transactionsRepo, postingsRepo } = createRepositories();
    const tx = createDraftTransaction("tx-1");
    transactionsRepo.create(tx);
    postingsRepo.insertMany([createPosting("post-1", tx.id, "DEBIT"), createPosting("post-2", tx.id, "CREDIT")]);
    transactionsRepo.update(tx.id, { status: "POSTED" });

    expect(() => transactionsRepo.update(tx.id, { memo: "changed" })).toThrowError(
      /Cannot update posted transaction/
    );
    expect(() => postingsRepo.deleteDraftPostings(tx.id)).toThrowError(
      /Cannot delete postings for posted transaction/
    );
  });

  it("supports snapshot/restore on postings repository", () => {
    const { postingsRepo } = createRepositories();
    postingsRepo.insertMany([createPosting("post-1", "tx-1", "DEBIT"), createPosting("post-2", "tx-1", "CREDIT")]);

    const snapshot = postingsRepo.snapshot();
    postingsRepo.restore([]);
    expect(postingsRepo.listAll()).toHaveLength(0);

    postingsRepo.restore(snapshot);
    expect(postingsRepo.listByTransactionId("tx-1")).toHaveLength(2);
  });
});
