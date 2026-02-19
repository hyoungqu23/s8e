import { describe, expect, it } from "vitest";

import { runCSVImport, selectEntriesByPolicy } from "./runCSVImport";

describe("runCSVImport", () => {
  it("정상 CSV를 파싱/검증하고 요약을 반환한다", () => {
    const input = [
      "계정명,날짜,내용,금액,카테고리",
      "매출,2026-01-01,서비스 결제,10000,수입",
      "현금,2026-01-02,점심,-5000,식비"
    ].join("\n");

    const result = runCSVImport(input);
    expect(result.errors).toHaveLength(0);
    expect(result.summary.count).toBe(2);
    expect(result.summary.totalIncome).toBe(10000);
    expect(result.summary.totalExpense).toBe(5000);
  });

  it("오류가 있을 때 전체 실패 정책은 반영 불가", () => {
    const input = ["계정명,날짜,내용,금액,카테고리", "현금,2026/01/01,점심,-5000,식비"].join("\n");
    const result = runCSVImport(input);
    const decision = selectEntriesByPolicy(result, "fail_on_any_error");

    expect(result.errors.length).toBeGreaterThan(0);
    expect(decision.canApply).toBe(false);
  });

  it("오류가 있어도 부분 반영 정책은 유효 행을 반영 가능", () => {
    const input = [
      "계정명,날짜,내용,금액,카테고리",
      "매출,2026-01-01,서비스 결제,10000,수입",
      "현금,2026/01/02,점심,-5000,식비"
    ].join("\n");
    const result = runCSVImport(input);
    const decision = selectEntriesByPolicy(result, "allow_partial");

    expect(result.errors.length).toBeGreaterThan(0);
    expect(decision.canApply).toBe(true);
    expect(decision.summary.count).toBe(1);
  });
});
