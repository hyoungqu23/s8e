export type PostingDirection = "DEBIT" | "CREDIT";
export type EntryType = "ORIGINAL" | "REVERSAL" | "CORRECTION";
export type TransactionKind = EntryType;

export type PostingInput = {
  accountCode: string;
  direction: PostingDirection;
  amountMinor: number;
  currency: string;
  occurredAt: string;
  memo?: string;
};

export type LedgerPosting = PostingInput & {
  id: string;
  transactionId: string;
  chainId: string;
  entryType: EntryType;
  linkedPostingId?: string;
};

export type PostedTransaction = {
  id: string;
  chainId: string;
  kind: TransactionKind;
  status: "POSTED";
  occurredAt: string;
  sourceTransactionId?: string;
  memo?: string;
  postings: LedgerPosting[];
};
