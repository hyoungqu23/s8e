import type { LedgerPosting } from "@s8e/ledger-kit";

import type { HouseholdTransactionStatus, TransactionRecord } from "../ledger/types";

export type TransactionRepository = {
  create(record: TransactionRecord): TransactionRecord;
  findById(transactionId: string): TransactionRecord | undefined;
  listAll(): TransactionRecord[];
  exists(transactionId: string): boolean;
  getStatus(transactionId: string): HouseholdTransactionStatus | undefined;
  update(transactionId: string, patch: Partial<Omit<TransactionRecord, "id">>): TransactionRecord;
  delete(transactionId: string): void;
  snapshot(): TransactionRecord[];
  restore(records: TransactionRecord[]): void;
};

export type PostingRepository = {
  insertMany(postings: LedgerPosting[]): void;
  listByTransactionId(transactionId: string): LedgerPosting[];
  listAll(): LedgerPosting[];
  replaceDraftPostings(transactionId: string, postings: LedgerPosting[]): void;
  deleteDraftPostings(transactionId: string): void;
  snapshot(): LedgerPosting[];
  restore(postings: LedgerPosting[]): void;
};
