import type { LedgerPosting } from "@s8e/ledger-kit";

import { LedgerServiceError, LedgerServiceErrorCode } from "../ledger/errors";

type StatusProvider = (transactionId: string) => "DRAFT" | "POSTED" | undefined;

export class InMemoryPostingsRepo {
  private readonly byId = new Map<string, LedgerPosting>();
  private readonly byTransactionId = new Map<string, Set<string>>();

  constructor(private readonly getStatus: StatusProvider) {}

  insertMany(postings: LedgerPosting[]) {
    for (const posting of postings) {
      this.byId.set(posting.id, posting);
      const postingIds = this.byTransactionId.get(posting.transactionId) ?? new Set<string>();
      postingIds.add(posting.id);
      this.byTransactionId.set(posting.transactionId, postingIds);
    }
  }

  listByTransactionId(transactionId: string) {
    const postingIds = this.byTransactionId.get(transactionId);
    if (!postingIds) {
      return [];
    }

    const postings: LedgerPosting[] = [];
    for (const postingId of postingIds) {
      const posting = this.byId.get(postingId);
      if (posting) {
        postings.push(posting);
      }
    }
    return postings;
  }

  replaceDraftPostings(transactionId: string, postings: LedgerPosting[]) {
    const status = this.getStatus(transactionId);
    if (status === "POSTED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.APPEND_ONLY_VIOLATION,
        `Cannot replace postings for posted transaction: ${transactionId}`
      );
    }

    this.deleteDraftPostings(transactionId);
    this.insertMany(postings);
  }

  deleteDraftPostings(transactionId: string) {
    const status = this.getStatus(transactionId);
    if (status === "POSTED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.APPEND_ONLY_VIOLATION,
        `Cannot delete postings for posted transaction: ${transactionId}`
      );
    }

    const postingIds = this.byTransactionId.get(transactionId);
    if (!postingIds) {
      return;
    }

    for (const postingId of postingIds) {
      this.byId.delete(postingId);
    }
    this.byTransactionId.delete(transactionId);
  }
}
