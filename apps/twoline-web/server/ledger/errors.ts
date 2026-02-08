export const LedgerServiceErrorCode = {
  NOT_FOUND: "LEDGER_SERVICE_NOT_FOUND",
  INVALID_STATE: "LEDGER_SERVICE_INVALID_STATE",
  APPEND_ONLY_VIOLATION: "LEDGER_SERVICE_APPEND_ONLY_VIOLATION",
  UNBALANCED_POSTINGS: "LEDGER_SERVICE_UNBALANCED_POSTINGS"
} as const;

export class LedgerServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "LedgerServiceError";
  }
}
