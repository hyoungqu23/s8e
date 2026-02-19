import { normalizeAndValidateRows, parseTransactionCSV, type CSVRowError } from "@s8e/csv-kit";
import { summarizeLedger, toLedgerEntries, type LedgerEntry, type LedgerSummary } from "@s8e/ledger-kit";

export type ImportPolicy = "fail_on_any_error" | "allow_partial";

export type CSVImportResult = {
  parseErrors: CSVRowError[];
  validationErrors: CSVRowError[];
  errors: CSVRowError[];
  entries: LedgerEntry[];
  summary: LedgerSummary;
};

export function runCSVImport(input: string): CSVImportResult {
  const parsed = parseTransactionCSV(input);
  const normalized = normalizeAndValidateRows(parsed.rows);
  const entries = toLedgerEntries(normalized.validRows);
  const summary = summarizeLedger(entries);

  return {
    parseErrors: parsed.errors,
    validationErrors: normalized.errors,
    errors: [...parsed.errors, ...normalized.errors],
    entries,
    summary
  };
}

export function selectEntriesByPolicy(result: CSVImportResult, policy: ImportPolicy): {
  canApply: boolean;
  reasonKey?: string;
  entries: LedgerEntry[];
  summary: LedgerSummary;
} {
  if (policy === "fail_on_any_error" && result.errors.length > 0) {
    return {
      canApply: false,
      reasonKey: "csv.notice.transactionApplyBlocked",
      entries: [],
      summary: summarizeLedger([])
    };
  }

  return {
    canApply: true,
    entries: result.entries,
    summary: summarizeLedger(result.entries)
  };
}
