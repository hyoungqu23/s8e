export const LedgerErrorCode = {
  EMPTY_POSTINGS: "LEDGER_EMPTY_POSTINGS",
  INVALID_AMOUNT: "LEDGER_INVALID_AMOUNT",
  UNBALANCED_POSTINGS: "LEDGER_UNBALANCED_POSTINGS",
  CURRENCY_MISMATCH: "LEDGER_CURRENCY_MISMATCH"
} as const;

export type LedgerErrorCode = (typeof LedgerErrorCode)[keyof typeof LedgerErrorCode];
