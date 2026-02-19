import { describe, expect, it } from "vitest";

import { CSVHeader, normalizeAndValidateRows, parseTransactionCSV } from "./index";

describe("parseTransactionCSV", () => {
  it("헤더가 정확히 일치하면 행을 파싱한다", () => {
    const csv = `${CSVHeader.join(",")}\n현금,2026-01-01,점심,-12000,식비`;
    const result = parseTransactionCSV(csv);

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      {
        accountName: "현금",
        date: "2026-01-01",
        description: "점심",
        amount: "-12000",
        category: "식비"
      }
    ]);
  });

  it("헤더가 다르면 즉시 실패한다", () => {
    const result = parseTransactionCSV("account,date,description,amount,category\n현금,2026-01-01,점심,-12000,식비");

    expect(result.rows).toEqual([]);
    expect(result.errors[0]?.field).toBe("헤더");
    expect(result.errors[0]?.code).toBe("INVALID_HEADER");
  });
});

describe("normalizeAndValidateRows", () => {
  it("정상 행은 validRows로 반환한다", () => {
    const result = normalizeAndValidateRows([
      {
        accountName: "매출",
        date: "2026-01-01",
        description: "서비스 결제",
        amount: "10000",
        category: "수입"
      }
    ]);

    expect(result.errors).toEqual([]);
    expect(result.validRows[0]?.amount).toBe(10000);
  });

  it("날짜 형식 오류를 검출한다", () => {
    const result = normalizeAndValidateRows([
      {
        accountName: "현금",
        date: "2026/01/01",
        description: "점심",
        amount: "-1000",
        category: "식비"
      }
    ]);

    expect(result.errors.some((e) => e.code === "INVALID_DATE")).toBe(true);
  });

  it("실존하지 않는 날짜를 검출한다", () => {
    const result = normalizeAndValidateRows([
      {
        accountName: "현금",
        date: "2026-02-30",
        description: "점심",
        amount: "-1000",
        category: "식비"
      }
    ]);

    expect(result.errors.some((e) => e.code === "INVALID_DATE")).toBe(true);
  });

  it("금액 파싱 오류를 검출한다", () => {
    const result = normalizeAndValidateRows([
      {
        accountName: "현금",
        date: "2026-01-01",
        description: "점심",
        amount: "1,2a0",
        category: "식비"
      }
    ]);

    expect(result.errors.some((e) => e.code === "INVALID_AMOUNT")).toBe(true);
  });

  it("필수값 누락을 검출한다", () => {
    const result = normalizeAndValidateRows([
      {
        accountName: "현금",
        date: "2026-01-01",
        description: "",
        amount: "-1000",
        category: "식비"
      }
    ]);

    expect(result.errors.some((e) => e.field === "내용" && e.code === "REQUIRED")).toBe(true);
  });

  it("카테고리 빈값과 금액 0을 허용한다", () => {
    const result = normalizeAndValidateRows([
      {
        accountName: "현금",
        date: "2026-01-01",
        description: "수수료 정산",
        amount: "0",
        category: ""
      }
    ]);

    expect(result.errors).toEqual([]);
    expect(result.validRows[0]?.category).toBeNull();
    expect(result.validRows[0]?.amount).toBe(0);
  });

  it("중복 행을 그대로 유지한다", () => {
    const rows = [
      {
        accountName: "현금",
        date: "2026-01-01",
        description: "점심",
        amount: "-1000",
        category: "식비"
      },
      {
        accountName: "현금",
        date: "2026-01-01",
        description: "점심",
        amount: "-1000",
        category: "식비"
      }
    ];

    const result = normalizeAndValidateRows(rows);
    expect(result.errors).toEqual([]);
    expect(result.validRows).toHaveLength(2);
  });
});
