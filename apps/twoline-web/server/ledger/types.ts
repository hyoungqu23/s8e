import type { LedgerPosting, PostingInput, TransactionKind } from "@s8e/ledger-kit";

export type HouseholdTransactionStatus = "DRAFT" | "POSTED";
export type TransactionSource = "MANUAL" | "QUICK_ADD" | "RECURRING" | "CSV_IMPORT";

export type TransactionRecord = {
  id: string;
  householdId: string;
  chainId: string;
  kind: TransactionKind;
  status: HouseholdTransactionStatus;
  occurredAt: string;
  sourceTransactionId?: string;
  memo?: string;
  source: TransactionSource;
};

export type CreateDraftInput = {
  householdId: string;
  occurredAt: string;
  memo?: string;
  postings: PostingInput[];
  source?: TransactionSource;
};

export type PostedTransactionAggregate = {
  transaction: TransactionRecord;
  postings: LedgerPosting[];
};
