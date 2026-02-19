import {
  correctTransaction,
  validateBalanced,
  voidTransaction,
  type LedgerPosting,
  type PostedTransaction,
  type PostingInput
} from "@s8e/ledger-kit";

import { LedgerServiceError, LedgerServiceErrorCode } from "../ledger/errors";
import type {
  CreateDraftInput,
  HouseholdRole,
  PostedTransactionAggregate,
  TransactionRecord
} from "../ledger/types";
import type { PostingRepository, TransactionRepository } from "../repos/ports";

type IdFactory = () => string;

type CorrectResult = {
  reversal: PostedTransactionAggregate;
  correction: PostedTransactionAggregate;
};

type ListPostedOptions = {
  includeVoided?: boolean;
};

type ListedPostedTransaction = TransactionRecord & {
  isVoided: boolean;
  isSuperseded: boolean;
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
  private readonly lockStates = new Map<string, TransactionRecord["lockState"]>();

  constructor(
    private readonly transactionsRepo: TransactionRepository,
    private readonly postingsRepo: PostingRepository,
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
      source: input.source ?? "MANUAL",
      lockState: "UNLOCKED"
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
    this.logAudit("POSTED", posted);
    return { transaction: posted, postings };
  }

  voidPosted(postedTransactionId: string): PostedTransactionAggregate {
    const original = this.getPostedTransaction(postedTransactionId);
    const originalRecord = this.requireTransaction(postedTransactionId);
    this.assertUnlocked(originalRecord);
    const reversal = voidTransaction(original, { idFactory: this.idFactory });
    const persisted = this.persistPostedTransaction(reversal, originalRecord.householdId, originalRecord.source);
    this.logAudit("VOIDED", persisted.transaction);
    return persisted;
  }

  deletePosted(postedTransactionId: string): PostedTransactionAggregate {
    return this.voidPosted(postedTransactionId);
  }

  correctPosted(postedTransactionId: string, correctionInputs: PostingInput[]): CorrectResult {
    const original = this.getPostedTransaction(postedTransactionId);
    const originalRecord = this.requireTransaction(postedTransactionId);
    this.assertUnlocked(originalRecord);

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
    this.logAudit("CORRECTED", correction.transaction);

    return {
      reversal,
      correction
    };
  }

  reconcilePosted(postedTransactionId: string): TransactionRecord {
    const transaction = this.requireTransaction(postedTransactionId);
    if (transaction.status !== "POSTED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.INVALID_STATE,
        `Transaction is not posted: ${postedTransactionId}`
      );
    }
    const currentLockState = this.getLockState(transaction.id);
    if (currentLockState === "CLOSED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.CLOSED_LOCKED,
        `Transaction is in closed period: ${postedTransactionId}`
      );
    }
    const updated = this.withLockState(transaction, "RECONCILED");
    this.logAudit("RECONCILED", updated);
    return updated;
  }

  unreconcilePosted(postedTransactionId: string): TransactionRecord {
    const transaction = this.requireTransaction(postedTransactionId);
    if (transaction.status !== "POSTED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.INVALID_STATE,
        `Transaction is not posted: ${postedTransactionId}`
      );
    }
    if (this.getLockState(transaction.id) !== "RECONCILED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.INVALID_STATE,
        `Transaction is not reconciled: ${postedTransactionId}`
      );
    }
    const updated = this.withLockState(transaction, "UNLOCKED");
    this.logAudit("UNRECONCILED", updated);
    return updated;
  }

  closePosted(postedTransactionId: string, actorRole: HouseholdRole): TransactionRecord {
    if (actorRole !== "owner") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.OWNER_REQUIRED,
        "Only owner can close period"
      );
    }

    const transaction = this.requireTransaction(postedTransactionId);
    if (transaction.status !== "POSTED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.INVALID_STATE,
        `Transaction is not posted: ${postedTransactionId}`
      );
    }

    const updated = this.withLockState(transaction, "CLOSED");
    this.logAudit("CLOSED", updated);
    return updated;
  }

  reopenPosted(postedTransactionId: string, actorRole: HouseholdRole): TransactionRecord {
    if (actorRole !== "owner") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.OWNER_REQUIRED,
        "Only owner can reopen period"
      );
    }

    const transaction = this.requireTransaction(postedTransactionId);
    if (transaction.status !== "POSTED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.INVALID_STATE,
        `Transaction is not posted: ${postedTransactionId}`
      );
    }
    if (this.getLockState(transaction.id) !== "CLOSED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.INVALID_STATE,
        `Transaction is not closed: ${postedTransactionId}`
      );
    }
    const updated = this.withLockState(transaction, "UNLOCKED");
    this.logAudit("REOPENED", updated);
    return updated;
  }

  listCurrentPostedTransactions(householdId: string): TransactionRecord[] {
    return this.listPostedTransactions(householdId).map((transaction) => ({
      id: transaction.id,
      householdId: transaction.householdId,
      chainId: transaction.chainId,
      kind: transaction.kind,
      status: transaction.status,
      occurredAt: transaction.occurredAt,
      sourceTransactionId: transaction.sourceTransactionId,
      memo: transaction.memo,
      source: transaction.source,
      lockState: transaction.lockState
    }));
  }

  listPostedTransactions(householdId: string, options: ListPostedOptions = {}): ListedPostedTransaction[] {
    const posted = this.transactionsRepo
      .listAll()
      .filter((transaction) => transaction.householdId === householdId && transaction.status === "POSTED");

    const voidedIds = new Set(
      posted
        .filter((transaction) => transaction.kind === "REVERSAL")
        .map((transaction) => transaction.sourceTransactionId)
        .filter((id): id is string => Boolean(id))
    );
    const supersededIds = new Set(
      posted
        .filter((transaction) => transaction.kind === "CORRECTION")
        .map((transaction) => transaction.sourceTransactionId)
        .filter((id): id is string => Boolean(id))
    );

    const normalized = posted
      .map((transaction) => ({
        ...transaction,
        lockState: this.getLockState(transaction.id),
        isVoided: voidedIds.has(transaction.id),
        isSuperseded: supersededIds.has(transaction.id)
      }))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    if (options.includeVoided) {
      return normalized;
    }

    return normalized.filter(
      (transaction) =>
        transaction.kind !== "REVERSAL" && !transaction.isVoided && !transaction.isSuperseded
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
      source,
      lockState: "UNLOCKED"
    };

    this.transactionsRepo.create(record);
    this.postingsRepo.insertMany(transaction.postings);

    return {
      transaction: record,
      postings: transaction.postings
    };
  }

  private assertUnlocked(transaction: TransactionRecord) {
    const lockState = this.getLockState(transaction.id);
    if (lockState === "RECONCILED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.RECONCILED_LOCKED,
        `Transaction must be unreconciled first: ${transaction.id}`
      );
    }

    if (lockState === "CLOSED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.CLOSED_LOCKED,
        `Transaction must be reopened first: ${transaction.id}`
      );
    }
  }

  private withLockState(transaction: TransactionRecord, lockState: TransactionRecord["lockState"]) {
    this.lockStates.set(transaction.id, lockState);
    return {
      ...transaction,
      lockState
    };
  }

  private getLockState(transactionId: string): TransactionRecord["lockState"] {
    return this.lockStates.get(transactionId) ?? "UNLOCKED";
  }

  private logAudit(eventType: string, transaction: TransactionRecord) {
    console.info(
      JSON.stringify({
        scope: "ledger",
        eventType,
        transactionId: transaction.id,
        householdId: transaction.householdId,
        chainId: transaction.chainId,
        kind: transaction.kind,
        lockState: transaction.lockState
      })
    );
  }
}
