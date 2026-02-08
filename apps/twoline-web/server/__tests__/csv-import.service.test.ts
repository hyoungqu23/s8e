import { describe, expect, it } from "vitest";

import { serializeCanonicalBundle, type CanonicalBundle } from "@s8e/csv-kit";

import { InMemoryPostingsRepo } from "../repos/postings.repo";
import { InMemoryTransactionsRepo } from "../repos/transactions.repo";
import { CsvImportService } from "../services/csv-import.service";

function createService() {
  const transactionsRepo = new InMemoryTransactionsRepo();
  const postingsRepo = new InMemoryPostingsRepo((transactionId) => transactionsRepo.getStatus(transactionId));
  const service = new CsvImportService(transactionsRepo, postingsRepo);

  return {
    service,
    transactionsRepo,
    postingsRepo
  };
}

function buildBundle(amountMinorDebit: string, amountMinorCredit: string): CanonicalBundle {
  return {
    manifest: {
      version: "1.0.0",
      base_currency: "KRW",
      locale_hint: "ko"
    },
    accounts: [
      {
        id: "acc-expense",
        household_id: "household-demo",
        code: "expense:living",
        name: "생활비",
        type: "EXPENSE"
      },
      {
        id: "acc-cash",
        household_id: "household-demo",
        code: "asset:cash",
        name: "현금",
        type: "ASSET"
      }
    ],
    transactions: [
      {
        id: "tx-1",
        household_id: "household-demo",
        occurred_at: "2026-02-08",
        posted_at: "2026-02-08",
        status: "POSTED",
        memo: "sample"
      }
    ],
    postings: [
      {
        id: "post-1",
        transaction_id: "tx-1",
        account_id: "acc-expense",
        direction: "DEBIT",
        amount_minor: amountMinorDebit,
        currency: "KRW",
        entry_type: "ORIGINAL",
        linked_posting_id: ""
      },
      {
        id: "post-2",
        transaction_id: "tx-1",
        account_id: "acc-cash",
        direction: "CREDIT",
        amount_minor: amountMinorCredit,
        currency: "KRW",
        entry_type: "ORIGINAL",
        linked_posting_id: ""
      }
    ]
  };
}

describe("CsvImportService", () => {
  it("blocks commit when preview has validation errors", () => {
    const { service, transactionsRepo, postingsRepo } = createService();
    const invalidFiles = serializeCanonicalBundle(buildBundle("10000", "9000"));

    const preview = service.previewCanonical({
      householdId: "household-demo",
      files: invalidFiles
    });

    expect(preview.status).toBe("BLOCKED");
    expect(preview.errors.some((error) => error.error_code === "CSV_UNBALANCED_POSTINGS")).toBe(true);
    expect(() => service.commitCanonical({ sessionId: preview.sessionId })).toThrow(/CSV_IMPORT_BLOCKED/);
    expect(transactionsRepo.listAll()).toHaveLength(0);
    expect(postingsRepo.listAll()).toHaveLength(0);
  });

  it("commits all rows atomically when preview is valid", () => {
    const { service, transactionsRepo, postingsRepo } = createService();
    const validFiles = serializeCanonicalBundle(buildBundle("10000", "10000"));

    const preview = service.previewCanonical({
      householdId: "household-demo",
      files: validFiles
    });

    expect(preview.errors).toHaveLength(0);
    const commit = service.commitCanonical({ sessionId: preview.sessionId });
    expect(commit.status).toBe("COMMITTED");
    expect(transactionsRepo.listAll()).toHaveLength(1);
    expect(postingsRepo.listAll()).toHaveLength(2);
  });

  it("records audit events with session id and error codes", () => {
    const { service } = createService();
    const invalidFiles = serializeCanonicalBundle(buildBundle("10000", "9000"));

    const preview = service.previewCanonical({
      householdId: "household-demo",
      files: invalidFiles
    });

    const events = service.listAuditEvents("household-demo");
    const previewEvent = events.find((event) => event.sessionId === preview.sessionId);

    expect(previewEvent).toBeDefined();
    expect(previewEvent?.eventType).toBe("CSV_IMPORT_PREVIEWED");
    expect(Array.isArray(previewEvent?.payload.errorCodes)).toBe(true);
  });
});
