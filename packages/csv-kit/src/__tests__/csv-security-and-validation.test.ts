import { describe, expect, it } from "vitest";

import {
  CsvErrorCode,
  buildCanonicalFingerprint,
  isDuplicateBundleImport,
  sanitizeCsvCell,
  serializeFlatCsv,
  validateCanonicalBundle
} from "../index";
import type { CanonicalBundle, FlatCsvRow } from "../index";

function makeInvalidBundle(): CanonicalBundle {
  return {
    manifest: {
      version: "1.0.0",
      base_currency: "KRW"
    },
    accounts: [
      {
        id: "acc-expense",
        household_id: "hh-1",
        code: "expense:living",
        name: "생활비",
        type: "EXPENSE"
      }
    ],
    transactions: [
      {
        id: "tx-1",
        household_id: "hh-1",
        occurred_at: "invalid-date",
        posted_at: "2026-02-08",
        status: "POSTED",
        memo: "점심"
      }
    ],
    postings: [
      {
        id: "post-1",
        transaction_id: "tx-1",
        account_id: "acc-expense",
        direction: "DEBIT",
        amount_minor: "12000",
        currency: "USD",
        entry_type: "ORIGINAL",
        linked_posting_id: ""
      },
      {
        id: "post-2",
        transaction_id: "tx-1",
        account_id: "acc-expense",
        direction: "CREDIT",
        amount_minor: "11000",
        currency: "USD",
        entry_type: "ORIGINAL",
        linked_posting_id: ""
      }
    ]
  };
}

describe("csv security and validation", () => {
  it("escapes dangerous formula cells", () => {
    expect(sanitizeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(sanitizeCsvCell("normal-value")).toBe("normal-value");
  });

  it("adds utf-8 bom for excel option in flat export", () => {
    const rows: FlatCsvRow[] = [
      {
        occurred_at: "2026-02-08",
        posted_at: "2026-02-08",
        amount: "12000",
        memo: "=danger",
        counterparty: "",
        template_id: "living_spend",
        category: "living",
        voided: "false",
        superseded: "false"
      }
    ];

    const content = serializeFlatCsv(rows, { excelBom: true });
    expect(content.charCodeAt(0)).toBe(0xfeff);
    expect(content).toContain("'=danger");
  });

  it("detects key canonical validation failures", () => {
    const bundle = makeInvalidBundle();
    const errors = validateCanonicalBundle(bundle, { baseCurrency: "KRW" });
    const codes = new Set(errors.map((error) => error.error_code));

    expect(codes.has(CsvErrorCode.INVALID_DATE)).toBe(true);
    expect(codes.has(CsvErrorCode.UNBALANCED_POSTINGS)).toBe(true);
    expect(codes.has(CsvErrorCode.CURRENCY_MISMATCH)).toBe(true);
  });

  it("detects duplicate imports with stable fingerprint", () => {
    const bundle = makeInvalidBundle();
    const fingerprint = buildCanonicalFingerprint(bundle);
    const registry = new Set<string>([fingerprint]);

    const duplicateCheck = isDuplicateBundleImport(bundle, registry);

    expect(duplicateCheck.isDuplicate).toBe(true);
    expect(duplicateCheck.fingerprint).toBe(fingerprint);
  });
});
