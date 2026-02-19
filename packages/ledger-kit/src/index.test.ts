import { describe, expect, it } from "vitest";

import { summarizeLedger, toLedgerEntries, type ParsedTransactionRow } from "./index";

describe("toLedgerEntries", () => {
  it("금액 부호에 따라 direction을 매핑한다", () => {
    const rows: ParsedTransactionRow[] = [
      {
        accountName: "매출",
        date: "2026-01-01",
        description: "서비스 결제",
        amount: 10000,
        category: "수입"
      },
      {
        accountName: "현금",
        date: "2026-01-02",
        description: "점심",
        amount: -12000,
        category: "식비"
      }
    ];

    const entries = toLedgerEntries(rows);
    expect(entries[0]?.direction).toBe("income");
    expect(entries[1]?.direction).toBe("expense");
  });
});

describe("summarizeLedger", () => {
  it("수입/지출/순이익을 정확히 계산한다", () => {
    const entries = toLedgerEntries([
      {
        accountName: "매출",
        date: "2026-01-01",
        description: "서비스 결제",
        amount: 20000,
        category: "수입"
      },
      {
        accountName: "현금",
        date: "2026-01-02",
        description: "점심",
        amount: -5000,
        category: "식비"
      }
    ]);

    const summary = summarizeLedger(entries);
    expect(summary.totalIncome).toBe(20000);
    expect(summary.totalExpense).toBe(5000);
    expect(summary.net).toBe(15000);
    expect(summary.count).toBe(2);
  });

  it("빈 배열 집계는 0으로 반환한다", () => {
    const summary = summarizeLedger([]);
    expect(summary).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      net: 0,
      count: 0
    });
  });

  it("금액 0은 income으로 처리한다", () => {
    const entries = toLedgerEntries([
      {
        accountName: "현금",
        date: "2026-01-01",
        description: "수수료 정산",
        amount: 0,
        category: null
      }
    ]);

    const summary = summarizeLedger(entries);
    expect(entries[0]?.direction).toBe("income");
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpense).toBe(0);
  });
});
