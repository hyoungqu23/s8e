import {
  correctTransaction,
  validateBalanced,
  voidTransaction,
  type LedgerPosting,
  type PostedTransaction,
  type PostingInput
} from "@s8e/ledger-kit";

import { LedgerServiceError, LedgerServiceErrorCode } from "../ledger/errors";
import type { CreateDraftInput, PostedTransactionAggregate, TransactionRecord } from "../ledger/types";
import { InMemoryPostingsRepo } from "../repos/postings.repo";
import { InMemoryTransactionsRepo } from "../repos/transactions.repo";

type IdFactory = () => string;

type CorrectResult = {
  reversal: PostedTransactionAggregate;
  correction: PostedTransactionAggregate;
};

function defaultIdFactory() {
  return crypto.randomUUID();
}

function toPostingInputs(postings: LedgerPosting[]): PostingInput[] {
  return postings.map((posting) => ({
    accountCode: posting.accountCode,
    amountMinor: posting.amountMinor,
    currency: posting.currency,
    direction: posting.direction,
    occurredAt: posting.occurredAt,
    memo: posting.memo
  }));
}

export class LedgerPostService {
  constructor(
    private readonly transactionsRepo: InMemoryTransactionsRepo,
    private readonly postingsRepo: InMemoryPostingsRepo,
    private readonly idFactory: IdFactory = defaultIdFactory
  ) {}

  createDraft(input: CreateDraftInput): TransactionRecord {
    const transactionId = this.idFactory();
    const chainId = transactionId;
    const transaction: TransactionRecord = {
      id: transactionId,
      householdId: input.householdId,
      chainId,
      kind: "ORIGINAL",
      status: "DRAFT",
      occurredAt: input.occurredAt,
      memo: input.memo,
      source: input.source ?? "MANUAL"
    };

    const postings = input.postings.map((posting) => ({
      ...posting,
      id: this.idFactory(),
      transactionId,
      chainId,
      entryType: "ORIGINAL" as const
    }));

    this.transactionsRepo.create(transaction);
    this.postingsRepo.insertMany(postings);

    return transaction;
  }

  postDraft(draftTransactionId: string): PostedTransactionAggregate {
    const draft = this.transactionsRepo.findById(draftTransactionId);
    if (!draft) {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.NOT_FOUND,
        `Draft transaction not found: ${draftTransactionId}`
      );
    }

    if (draft.status !== "DRAFT") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.INVALID_STATE,
        `Transaction is not a draft: ${draftTransactionId}`
      );
    }

    const postings = this.postingsRepo.listByTransactionId(draftTransactionId);
    const balance = validateBalanced(toPostingInputs(postings));
    if (!balance.ok) {
      throw new LedgerServiceError(LedgerServiceErrorCode.UNBALANCED_POSTINGS, balance.errorCode);
    }

    const posted = this.transactionsRepo.update(draftTransactionId, { status: "POSTED" });
    return { transaction: posted, postings };
  }

  voidPosted(postedTransactionId: string): PostedTransactionAggregate {
    const original = this.getPostedTransaction(postedTransactionId);
    const originalRecord = this.requireTransaction(postedTransactionId);
    const reversal = voidTransaction(original, { idFactory: this.idFactory });

    return this.persistPostedTransaction(reversal, originalRecord.householdId, originalRecord.source);
  }

  deletePosted(postedTransactionId: string): PostedTransactionAggregate {
    return this.voidPosted(postedTransactionId);
  }

  correctPosted(postedTransactionId: string, correctionInputs: PostingInput[]): CorrectResult {
    const original = this.getPostedTransaction(postedTransactionId);
    const originalRecord = this.requireTransaction(postedTransactionId);

    const result = correctTransaction(original, correctionInputs, { idFactory: this.idFactory });
    const reversal = this.persistPostedTransaction(
      result.reversal,
      originalRecord.householdId,
      originalRecord.source
    );
    const correction = this.persistPostedTransaction(
      result.correction,
      originalRecord.householdId,
      originalRecord.source
    );

    return {
      reversal,
      correction
    };
  }

  listCurrentPostedTransactions(householdId: string): TransactionRecord[] {
    const posted = this.transactionsRepo
      .listAll()
      .filter((transaction) => transaction.householdId === householdId && transaction.status === "POSTED");

    const hiddenIds = new Set(
      posted
        .filter((transaction) => transaction.kind === "REVERSAL")
        .map((transaction) => transaction.sourceTransactionId)
        .filter((id): id is string => Boolean(id))
    );

    return posted.filter(
      (transaction) => transaction.kind !== "REVERSAL" && !hiddenIds.has(transaction.id)
    );
  }

  private requireTransaction(transactionId: string): TransactionRecord {
    const transaction = this.transactionsRepo.findById(transactionId);
    if (!transaction) {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.NOT_FOUND,
        `Transaction not found: ${transactionId}`
      );
    }
    return transaction;
  }

  private getPostedTransaction(transactionId: string): PostedTransaction {
    const transaction = this.requireTransaction(transactionId);
    if (transaction.status !== "POSTED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.INVALID_STATE,
        `Transaction is not posted: ${transactionId}`
      );
    }

    return {
      id: transaction.id,
      chainId: transaction.chainId,
      kind: transaction.kind,
      status: "POSTED",
      occurredAt: transaction.occurredAt,
      sourceTransactionId: transaction.sourceTransactionId,
      memo: transaction.memo,
      postings: this.postingsRepo.listByTransactionId(transaction.id)
    };
  }

  private persistPostedTransaction(
    transaction: PostedTransaction,
    householdId: string,
    source: TransactionRecord["source"] = "MANUAL"
  ): PostedTransactionAggregate {
    const record: TransactionRecord = {
      id: transaction.id,
      householdId,
      chainId: transaction.chainId,
      kind: transaction.kind,
      status: "POSTED",
      occurredAt: transaction.occurredAt,
      sourceTransactionId: transaction.sourceTransactionId,
      memo: transaction.memo,
      source
    };

    this.transactionsRepo.create(record);
    this.postingsRepo.insertMany(transaction.postings);

    return {
      transaction: record,
      postings: transaction.postings
    };
  }
}
