import { LedgerServiceError, LedgerServiceErrorCode } from "../ledger/errors";
import type { HouseholdTransactionStatus, TransactionRecord } from "../ledger/types";

type UpdatePatch = Partial<Omit<TransactionRecord, "id">>;

export class InMemoryTransactionsRepo {
  private readonly byId = new Map<string, TransactionRecord>();

  create(record: TransactionRecord) {
    this.byId.set(record.id, record);
    return record;
  }

  findById(transactionId: string) {
    return this.byId.get(transactionId);
  }

  listAll() {
    return [...this.byId.values()];
  }

  getStatus(transactionId: string): HouseholdTransactionStatus | undefined {
    return this.byId.get(transactionId)?.status;
  }

  update(transactionId: string, patch: UpdatePatch) {
    const existing = this.byId.get(transactionId);
    if (!existing) {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.NOT_FOUND,
        `Transaction not found: ${transactionId}`
      );
    }

    if (existing.status === "POSTED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.APPEND_ONLY_VIOLATION,
        `Cannot update posted transaction: ${transactionId}`
      );
    }

    const updated = { ...existing, ...patch };
    this.byId.set(transactionId, updated);
    return updated;
  }

  delete(transactionId: string) {
    const existing = this.byId.get(transactionId);
    if (!existing) {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.NOT_FOUND,
        `Transaction not found: ${transactionId}`
      );
    }

    if (existing.status === "POSTED") {
      throw new LedgerServiceError(
        LedgerServiceErrorCode.APPEND_ONLY_VIOLATION,
        `Cannot delete posted transaction: ${transactionId}`
      );
    }

    this.byId.delete(transactionId);
  }
}
