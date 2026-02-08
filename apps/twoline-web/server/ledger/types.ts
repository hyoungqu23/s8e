import type { LedgerPosting, PostingInput, TransactionKind } from "@s8e/ledger-kit";

export type HouseholdTransactionStatus = "DRAFT" | "POSTED";

export type TransactionRecord = {
  id: string;
  householdId: string;
  chainId: string;
  kind: TransactionKind;
  status: HouseholdTransactionStatus;
  occurredAt: string;
  sourceTransactionId?: string;
  memo?: string;
};

export type CreateDraftInput = {
  householdId: string;
  occurredAt: string;
  memo?: string;
  postings: PostingInput[];
};

export type PostedTransactionAggregate = {
  transaction: TransactionRecord;
  postings: LedgerPosting[];
};
