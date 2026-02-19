import { type CSVRowError, type ParsedTransactionRow, type RawTransactionRow } from "./schema";

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function pushRequiredError(errors: CSVRowError[], row: number, field: CSVRowError["field"]) {
  errors.push({
    row,
    field,
    code: "REQUIRED",
    message: `${field} 값은 필수입니다.`
  });
}

function parseAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCategory(value: string | null | undefined) {
  const normalized = (value ?? "").trim();
  return normalized.length === 0 ? null : normalized;
}

export function normalizeAndValidateRows(rows: RawTransactionRow[]): {
  validRows: ParsedTransactionRow[];
  errors: CSVRowError[];
} {
  const validRows: ParsedTransactionRow[] = [];
  const errors: CSVRowError[] = [];

  for (const [index, rawRow] of rows.entries()) {
    const rowNumber = index + 2;
    const accountName = rawRow.accountName.trim();
    const date = rawRow.date.trim();
    const description = rawRow.description.trim();
    const amountText = rawRow.amount.trim();

    if (!accountName) {
      pushRequiredError(errors, rowNumber, "계정명");
    }
    if (!date) {
      pushRequiredError(errors, rowNumber, "날짜");
    }
    if (!description) {
      pushRequiredError(errors, rowNumber, "내용");
    }
    if (!amountText) {
      pushRequiredError(errors, rowNumber, "금액");
    }

    const amount = amountText ? parseAmount(amountText) : null;
    if (date && !isValidIsoDate(date)) {
      errors.push({
        row: rowNumber,
        field: "날짜",
        code: "INVALID_DATE",
        message: "날짜는 YYYY-MM-DD 형식의 유효한 값이어야 합니다."
      });
    }

    if (amountText && amount === null) {
      errors.push({
        row: rowNumber,
        field: "금액",
        code: "INVALID_AMOUNT",
        message: "금액은 숫자로 변환 가능해야 합니다."
      });
    }

    const hasRowErrors = errors.some((error) => error.row === rowNumber);
    if (hasRowErrors || amount === null) {
      continue;
    }

    validRows.push({
      accountName,
      date,
      description,
      amount,
      category: normalizeCategory(rawRow.category)
    });
  }

  return {
    validRows,
    errors
  };
}
