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

  const rows = bodyCells.filter((cells) => !isEmptyRow(cells)).map((cells) => toRawRow(cells));
  return {
    rows,
    errors: []
  };
}
