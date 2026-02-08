import { sanitizeCsvCell } from "../security/csv-injection";

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function quoteCell(rawValue: string) {
  if (rawValue.includes('"')) {
    return `"${rawValue.replaceAll('"', '""')}"`;
  }

  if (rawValue.includes(",") || rawValue.includes("\n") || rawValue.includes("\r")) {
    return `"${rawValue}"`;
  }

  return rawValue;
}

export function parseCsv(content: string) {
  const normalized = content.replace(/^\uFEFF/, "").trim();
  if (normalized.length === 0) {
    return [];
  }

  return normalized.split(/\r?\n/).map(parseCsvLine);
}

export function serializeCsv(
  headers: string[],
  rows: Array<Record<string, string>>,
  options?: {
    mitigateInjection?: boolean;
  }
) {
  const mitigateInjection = options?.mitigateInjection ?? true;
  const headerLine = headers.map(quoteCell).join(",");
  const body = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header] ?? "";
        const safeValue = sanitizeCsvCell(value, mitigateInjection);
        return quoteCell(safeValue);
      })
      .join(",")
  );

  return [headerLine, ...body].join("\n");
}
