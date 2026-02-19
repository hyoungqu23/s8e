import type { PostingRepository } from "../repos/ports";
import { CsvImportService } from "./csv-import.service";
import { LedgerPostService } from "./ledger-post.service";
import { RecurringService } from "./recurring.service";

type SummaryOptions = {
  today?: string;
};

type DashboardSummary = {
  monthlySpendTrend: Array<{
    month: string;
    amountMinor: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amountMinor: number;
  }>;
  cashflow: {
    incomeMinor: number;
    expenseMinor: number;
    netMinor: number;
  };
  recurringUpcomingDrafts: Array<{
    ruleId: string;
    templateId: string;
    nextRunDate: string;
    amountMinor: number;
  }>;
  inputHealth: {
    daysTrackedLast30: number;
    quickAddRatioPct: number;
    csvImportSuccessRatePct: number | null;
  };
};

function monthKey(date: string) {
  return date.slice(0, 7);
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthSequence(today: string, count: number) {
  const base = parseDate(today);
  const keys: string[] = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - index, 1));
    keys.push(monthKey(toIsoDate(date)));
  }

  return keys;
}

function toPct(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(1));
}

export class DashboardService {
  constructor(
    private readonly ledgerPostService: LedgerPostService,
    private readonly postingsRepo: PostingRepository,
    private readonly recurringService: RecurringService,
    private readonly csvImportService: CsvImportService
  ) {}

  getSummary(householdId: string, options: SummaryOptions = {}): DashboardSummary {
    const today = options.today ?? toIsoDate(new Date());
    const currentPosted = this.ledgerPostService.listCurrentPostedTransactions(householdId);
    const monthKeys = monthSequence(today, 6);

    const monthlySpendMap = new Map(monthKeys.map((key) => [key, 0]));
    const categoryMap = new Map<string, number>();
    let incomeMinor = 0;
    let expenseMinor = 0;

    const dayBoundary = parseDate(today);
    dayBoundary.setUTCDate(dayBoundary.getUTCDate() - 29);
    const daysTracked = new Set<string>();
    let quickAddCount = 0;

    for (const transaction of currentPosted) {
      const postings = this.postingsRepo.listByTransactionId(transaction.id);
      const currentMonth = monthKey(transaction.occurredAt);

      if (parseDate(transaction.occurredAt) >= dayBoundary) {
        daysTracked.add(transaction.occurredAt);
      }

      if (transaction.source === "QUICK_ADD") {
        quickAddCount += 1;
      }

      for (const posting of postings) {
        if (posting.accountCode.startsWith("expense:") && posting.direction === "DEBIT") {
          expenseMinor += posting.amountMinor;
          if (monthlySpendMap.has(currentMonth)) {
            monthlySpendMap.set(currentMonth, (monthlySpendMap.get(currentMonth) ?? 0) + posting.amountMinor);
          }
          const category = posting.accountCode.split(":")[1] || "etc";
          categoryMap.set(category, (categoryMap.get(category) ?? 0) + posting.amountMinor);
        }

        if (posting.accountCode.startsWith("income:") && posting.direction === "CREDIT") {
          incomeMinor += posting.amountMinor;
        }
      }
    }

    const csvEvents = this.csvImportService.listAuditEvents(householdId);
    const previewCount = csvEvents.filter((event) => event.eventType === "CSV_IMPORT_PREVIEWED").length;
    const commitCount = csvEvents.filter((event) => event.eventType === "CSV_IMPORT_COMMITTED").length;

    return {
      monthlySpendTrend: monthKeys.map((key) => ({
        month: key,
        amountMinor: monthlySpendMap.get(key) ?? 0
      })),
      categoryBreakdown: [...categoryMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([category, amountMinor]) => ({ category, amountMinor })),
      cashflow: {
        incomeMinor,
        expenseMinor,
        netMinor: incomeMinor - expenseMinor
      },
      recurringUpcomingDrafts: this.recurringService
        .listRules(householdId)
        .filter((rule) => rule.active)
        .sort((a, b) => a.nextRunDate.localeCompare(b.nextRunDate))
        .slice(0, 5)
        .map((rule) => ({
          ruleId: rule.id,
          templateId: rule.templateId,
          nextRunDate: rule.nextRunDate,
          amountMinor: rule.amountMinor
        })),
      inputHealth: {
        daysTrackedLast30: daysTracked.size,
        quickAddRatioPct: toPct(quickAddCount, currentPosted.length),
        csvImportSuccessRatePct: previewCount > 0 ? toPct(commitCount, previewCount) : null
      }
    };
  }
}
