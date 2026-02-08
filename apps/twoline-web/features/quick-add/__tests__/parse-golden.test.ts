import { describe, expect, it } from "vitest";

import { parseQuickAddText } from "../parse";
import { QuickAddReasonCode } from "../reason-codes";

const CURRENT_YEAR = new Date().getUTCFullYear();

describe("parseQuickAddText golden fixtures", () => {
  it("parses bank transfer notification", () => {
    const result = parseQuickAddText("2026-02-08 출금 15,000원 우리은행");
    expect(result.fields.amount.value).toBe(15000);
    expect(result.fields.occurred_at.value).toBe("2026-02-08");
    expect(result.fields.direction.value).toBe("OUT");
  });

  it("parses card approval text", () => {
    const result = parseQuickAddText("카드승인 2026.02.07 스타벅스 12,900원");
    expect(result.fields.amount.value).toBe(12900);
    expect(result.fields.occurred_at.value).toBe("2026-02-07");
  });

  it("parses refund as incoming", () => {
    const result = parseQuickAddText("2026-02-05 환불 27,000원 입금");
    expect(result.fields.amount.value).toBe(27000);
    expect(result.fields.direction.value).toBe("IN");
  });

  it("parses english payment message", () => {
    const result = parseQuickAddText("2026/02/06 payment approved KRW 31000");
    expect(result.fields.amount.value).toBe(31000);
    expect(result.fields.occurred_at.value).toBe("2026-02-06");
  });

  it("handles short date with heuristic year", () => {
    const result = parseQuickAddText("02/04 10:11 결제 8900원");
    expect(result.fields.occurred_at.value).toBe(`${CURRENT_YEAR}-02-04`);
    expect(result.fields.occurred_at.reason).toBe(QuickAddReasonCode.HEURISTIC_MATCH);
  });

  it("returns PARSE_NO_AMOUNT when amount is missing", () => {
    const result = parseQuickAddText("2026-02-08 스타벅스 결제");
    expect(result.fields.amount.reason).toBe(QuickAddReasonCode.PARSE_NO_AMOUNT);
    expect(result.blockingReasons).toContain(QuickAddReasonCode.PARSE_NO_AMOUNT);
  });

  it("returns PARSE_MULTIPLE_AMOUNTS when multiple amounts are found", () => {
    const result = parseQuickAddText("2026-02-08 결제 12,000원 취소 8,000원");
    expect(result.fields.amount.reason).toBe(QuickAddReasonCode.PARSE_MULTIPLE_AMOUNTS);
  });

  it("returns PARSE_NO_DATETIME when date is missing", () => {
    const result = parseQuickAddText("카드승인 9,900원");
    expect(result.fields.occurred_at.reason).toBe(QuickAddReasonCode.PARSE_NO_DATETIME);
    expect(result.blockingReasons).toContain(QuickAddReasonCode.PARSE_NO_DATETIME);
  });

  it("returns PARSE_AMBIGUOUS_DATETIME when dates are conflicting", () => {
    const result = parseQuickAddText("2026-02-01 또는 2026-02-02 결제 5,000원");
    expect(result.fields.occurred_at.reason).toBe(QuickAddReasonCode.PARSE_AMBIGUOUS_DATETIME);
  });

  it("returns unsupported format for empty input", () => {
    const result = parseQuickAddText("");
    expect(result.blockingReasons).toContain(QuickAddReasonCode.PARSE_UNSUPPORTED_FORMAT);
  });
});
