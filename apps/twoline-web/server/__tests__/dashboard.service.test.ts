import { describe, expect, it } from "vitest";

import { serializeCanonicalBundle } from "@s8e/csv-kit";
import type { PostingInput } from "@s8e/ledger-kit";

import { InMemoryPostingsRepo } from "../repos/postings.repo";
import { InMemoryTransactionsRepo } from "../repos/transactions.repo";
import { CsvImportService } from "../services/csv-import.service";
import { DashboardService } from "../services/dashboard.service";
import { LedgerPostService } from "../services/ledger-post.service";
import { RecurringService } from "../services/recurring.service";

function createServices() {
  let sequence = 1;
  const idFactory = () => `id-${sequence++}`;

  const transactionsRepo = new InMemoryTransactionsRepo();
  const postingsRepo = new InMemoryPostingsRepo((transactionId) => transactionsRepo.getStatus(transactionId));
  const ledgerService = new LedgerPostService(transactionsRepo, postingsRepo, idFactory);
  const csvService = new CsvImportService(transactionsRepo, postingsRepo);
  const recurringService = new RecurringService(ledgerService);
  const dashboardService = new DashboardService(ledgerService, postingsRepo, recurringService, csvService);

  return {
    ledgerService,
    csvService,
    recurringService,
    dashboardService
  };
}

function createAndPost(
  ledgerService: LedgerPostService,
  input: {
    householdId: string;
    occurredAt: string;
    source: "MANUAL" | "QUICK_ADD" | "RECURRING" | "CSV_IMPORT";
    postings: PostingInput[];
  }
) {
  const draft = ledgerService.createDraft({
    householdId: input.householdId,
    occurredAt: input.occurredAt,
    source: input.source,
    postings: input.postings
  });
  return ledgerService.postDraft(draft.id);
}

describe("DashboardService", () => {
  it("summarizes spend trend, category breakdown, and input health", () => {
    const { dashboardService, ledgerService } = createServices();
    const householdId = "household-demo";

    createAndPost(ledgerService, {
      householdId,
      occurredAt: "2026-02-10",
      source: "QUICK_ADD",
      postings: [
        {
          accountCode: "expense:living",
          direction: "DEBIT",
          amountMinor: 10000,
          currency: "KRW",
          occurredAt: "2026-02-10"
        },
        {
          accountCode: "asset:cash",
          direction: "CREDIT",
          amountMinor: 10000,
          currency: "KRW",
          occurredAt: "2026-02-10"
        }
      ]
    });
    createAndPost(ledgerService, {
      householdId,
      occurredAt: "2026-03-01",
      source: "MANUAL",
      postings: [
        {
          accountCode: "expense:rent",
          direction: "DEBIT",
          amountMinor: 20000,
          currency: "KRW",
          occurredAt: "2026-03-01"
        },
        {
          accountCode: "asset:cash",
          direction: "CREDIT",
          amountMinor: 20000,
          currency: "KRW",
          occurredAt: "2026-03-01"
        }
      ]
    });
    createAndPost(ledgerService, {
      householdId,
      occurredAt: "2026-03-02",
      source: "MANUAL",
      postings: [
        {
          accountCode: "asset:cash",
          direction: "DEBIT",
          amountMinor: 50000,
          currency: "KRW",
          occurredAt: "2026-03-02"
        },
        {
          accountCode: "income:salary",
          direction: "CREDIT",
          amountMinor: 50000,
          currency: "KRW",
          occurredAt: "2026-03-02"
        }
      ]
    });

    const summary = dashboardService.getSummary(householdId, { today: "2026-03-15" });
    const feb = summary.monthlySpendTrend.find((item) => item.month === "2026-02");
    const mar = summary.monthlySpendTrend.find((item) => item.month === "2026-03");

    expect(feb?.amountMinor).toBe(10000);
    expect(mar?.amountMinor).toBe(20000);
    expect(summary.cashflow.incomeMinor).toBe(50000);
    expect(summary.cashflow.expenseMinor).toBe(30000);
    expect(summary.cashflow.netMinor).toBe(20000);
    expect(summary.categoryBreakdown[0]?.category).toBe("rent");
    expect(summary.inputHealth.daysTrackedLast30).toBe(2);
    expect(summary.inputHealth.quickAddRatioPct).toBe(33.3);
    expect(summary.inputHealth.csvImportSuccessRatePct).toBeNull();
  });

  it("includes recurring upcoming and csv import success rate when used", () => {
    const { dashboardService, recurringService, csvService } = createServices();
    const householdId = "household-demo";

    recurringService.createRule({
      householdId,
      templateId: "living_spend",
      amountMinor: 11000,
      dayOfMonth: 20,
      startDate: "2026-03-10",
      locale: "ko"
    });

    const invalidBundleFiles = serializeCanonicalBundle({
      manifest: { version: "1.0.0", base_currency: "KRW" },
      accounts: [
        {
          id: "acc-expense",
          household_id: householdId,
          code: "expense:living",
          name: "생활비",
          type: "EXPENSE"
        },
        {
          id: "acc-cash",
          household_id: householdId,
          code: "asset:cash",
          name: "현금",
          type: "ASSET"
        }
      ],
      transactions: [
        {
          id: "tx-1",
          household_id: householdId,
          occurred_at: "2026-03-10",
          posted_at: "2026-03-10",
          status: "POSTED",
          memo: "invalid"
        }
      ],
      postings: [
        {
          id: "p-1",
          transaction_id: "tx-1",
          account_id: "acc-expense",
          direction: "DEBIT",
          amount_minor: "1000",
          currency: "KRW",
          entry_type: "ORIGINAL",
          linked_posting_id: ""
        },
        {
          id: "p-2",
          transaction_id: "tx-1",
          account_id: "acc-cash",
          direction: "CREDIT",
          amount_minor: "900",
          currency: "KRW",
          entry_type: "ORIGINAL",
          linked_posting_id: ""
        }
      ]
    });
    csvService.previewCanonical({
      householdId,
      files: invalidBundleFiles
    });

    const summary = dashboardService.getSummary(householdId, { today: "2026-03-15" });

    expect(summary.recurringUpcomingDrafts).toHaveLength(1);
    expect(summary.recurringUpcomingDrafts[0].templateId).toBe("living_spend");
    expect(summary.inputHealth.csvImportSuccessRatePct).toBe(0);
  });
});
