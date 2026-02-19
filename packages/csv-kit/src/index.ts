export { withUtf8Bom } from "./encoding/bom";
export {
  type CanonicalAccountRow,
  type CanonicalAuditEventRow,
  type CanonicalBundle,
  type CanonicalBundleFile,
  type CanonicalPostingRow,
  type CanonicalTransactionRow,
} from "./formats/canonical/bundle";
export type { CanonicalManifest } from "./formats/canonical/manifest";
export { parseCanonicalBundle } from "./formats/canonical/parse";
export { serializeCanonicalBundle } from "./formats/canonical/serialize";
export { parseFlatCsv } from "./formats/flat/parse";
export type { FlatCsvRow } from "./formats/flat/schema";
export { serializeFlatCsv } from "./formats/flat/serialize";
export { sanitizeCsvCell } from "./security/csv-injection";
export { buildCanonicalFingerprint, isDuplicateBundleImport } from "./validate/dedupe";
export { CsvErrorCode, validateCanonicalBundle } from "./validate/errors";
export type { CsvValidationError } from "./validate/errors";
export { assertCanonicalRoundTrip } from "./validate/roundtrip";
