import { parseCsv } from "../../rfc4180/quoting";
import { FLAT_CSV_HEADERS, type FlatCsvRow } from "./schema";

export function parseFlatCsv(csv: string): FlatCsvRow[] {
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return [];
  }

  const [headerCells, ...dataRows] = rows;
  const headerOrder = headerCells.map((header) => header.trim()) as Array<keyof FlatCsvRow>;
  const missingHeaders = FLAT_CSV_HEADERS.filter((required) => !headerOrder.includes(required));

  if (missingHeaders.length > 0) {
    throw new Error(`CSV_MISSING_REQUIRED:${missingHeaders.join(",")}`);
  }

  return dataRows.map((row) => {
    const record = {} as FlatCsvRow;
    for (const header of FLAT_CSV_HEADERS) {
      const sourceIndex = headerOrder.indexOf(header);
      record[header] = sourceIndex >= 0 ? row[sourceIndex] ?? "" : "";
    }
    return record;
  });
}
