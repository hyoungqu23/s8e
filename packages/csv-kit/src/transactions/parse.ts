import { parseCsv } from "../rfc4180/quoting";
import { CSVHeader, type CSVRowError, type RawTransactionRow } from "./schema";

function normalizeHeader(cells: string[]) {
  return cells.map((cell) => cell.trim());
}

function isHeaderExactMatch(header: string[]) {
  if (header.length !== CSVHeader.length) {
    return false;
  }

  return CSVHeader.every((expected, index) => header[index] === expected);
}

function makeHeaderError(row = 1): CSVRowError {
  return {
    row,
    field: "헤더",
    code: "INVALID_HEADER",
    message: `헤더는 정확히 ${CSVHeader.join(",")} 이어야 합니다.`
  };
}

function toRawRow(cells: string[]): RawTransactionRow {
  return {
    accountName: cells[0] ?? "",
    date: cells[1] ?? "",
    description: cells[2] ?? "",
    amount: cells[3] ?? "",
    category: cells[4] ?? null
  };
}

function makeColumnCountError(row: number, expected: number, actual: number): CSVRowError {
  return {
    row,
    field: "헤더",
    code: "INVALID_COLUMN_COUNT",
    message: `${row}행의 컬럼 수가 올바르지 않습니다. expected=${expected}, actual=${actual}`
  };
}

function isEmptyRow(cells: string[]) {
  return cells.every((cell) => cell.trim().length === 0);
}

export function parseTransactionCSV(input: string): { rows: RawTransactionRow[]; errors: CSVRowError[] } {
  const parsed = parseCsv(input);
  if (parsed.length === 0) {
    return {
      rows: [],
      errors: [makeHeaderError()]
    };
  }

  const [headerCells, ...bodyCells] = parsed;
  const normalizedHeader = normalizeHeader(headerCells);
  if (!isHeaderExactMatch(normalizedHeader)) {
    return {
      rows: [],
      errors: [makeHeaderError()]
    };
  }

  const errors: CSVRowError[] = [];
  const rows: RawTransactionRow[] = [];

  bodyCells.forEach((cells, index) => {
    const rowNumber = index + 2;
    if (isEmptyRow(cells)) {
      return;
    }

    if (cells.length !== CSVHeader.length) {
      errors.push(makeColumnCountError(rowNumber, CSVHeader.length, cells.length));
      return;
    }

    rows.push({
      ...toRawRow(cells),
      rowNumber
    });
  });

  return {
    rows,
    errors
  };
}
