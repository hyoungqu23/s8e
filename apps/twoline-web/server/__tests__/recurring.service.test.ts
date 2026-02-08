import { describe, expect, it } from "vitest";

import { InMemoryPostingsRepo } from "../repos/postings.repo";
import { InMemoryTransactionsRepo } from "../repos/transactions.repo";
import { LedgerPostService } from "../services/ledger-post.service";
import { RecurringService } from "../services/recurring.service";

function createServices() {
  let sequence = 1;
  const idFactory = () => `id-${sequence++}`;

  const transactionsRepo = new InMemoryTransactionsRepo();
  const postingsRepo = new InMemoryPostingsRepo((transactionId) => transactionsRepo.getStatus(transactionId));
  const ledgerService = new LedgerPostService(transactionsRepo, postingsRepo, idFactory);
  const recurringService = new RecurringService(ledgerService);

  return {
    transactionsRepo,
    postingsRepo,
    recurringService
  };
}

describe("RecurringService", () => {
  it("generates DRAFT transactions only", () => {
    const { recurringService, transactionsRepo } = createServices();
    const rule = recurringService.createRule({
      householdId: "household-demo",
      templateId: "living_spend",
      amountMinor: 10000,
      dayOfMonth: 1,
      startDate: "2026-02-01",
      locale: "ko"
    });

    const generated = recurringService.runDue("2026-02-01");
    expect(generated).toHaveLength(1);
    expect(generated[0].ruleId).toBe(rule.id);
    expect(transactionsRepo.findById(generated[0].draftTransactionId)?.status).toBe("DRAFT");
  });

  it("applies updated rule values only to future generated drafts", () => {
    const { recurringService, postingsRepo } = createServices();
    const rule = recurringService.createRule({
      householdId: "household-demo",
      templateId: "living_spend",
      amountMinor: 10000,
      dayOfMonth: 1,
      startDate: "2026-02-01",
      locale: "ko"
    });

    const firstBatch = recurringService.runDue("2026-02-01");
    recurringService.updateRule(rule.id, {
      amountMinor: 20000,
      effectiveFrom: "2026-03-01"
    });
    const secondBatch = recurringService.runDue("2026-03-01");

    const firstPostings = postingsRepo.listByTransactionId(firstBatch[0].draftTransactionId);
    const secondPostings = postingsRepo.listByTransactionId(secondBatch[0].draftTransactionId);

    expect(firstPostings[0].amountMinor).toBe(10000);
    expect(secondPostings[0].amountMinor).toBe(20000);
  });
});
