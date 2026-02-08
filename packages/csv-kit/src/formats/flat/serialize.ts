import { withUtf8Bom } from "../../encoding/bom";
import { serializeCsv } from "../../rfc4180/quoting";
import { FLAT_CSV_HEADERS, type FlatCsvRow } from "./schema";

export function serializeFlatCsv(
  rows: FlatCsvRow[],
  options?: {
    excelBom?: boolean;
  }
) {
  const content = serializeCsv(
    [...FLAT_CSV_HEADERS],
    rows.map((row) => row as Record<string, string>)
  );

  return withUtf8Bom(content, options?.excelBom ?? false);
}
