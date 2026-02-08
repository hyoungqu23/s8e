import { withUtf8Bom } from "../../encoding/bom";
import { serializeCsv } from "../../rfc4180/quoting";
import type {
  CanonicalAccountRow,
  CanonicalAuditEventRow,
  CanonicalBundle,
  CanonicalBundleFile,
  CanonicalPostingRow,
  CanonicalTransactionRow
} from "./bundle";

const ACCOUNT_HEADERS: Array<keyof CanonicalAccountRow> = [
  "id",
  "household_id",
  "code",
  "name",
  "type"
];
const TRANSACTION_HEADERS: Array<keyof CanonicalTransactionRow> = [
  "id",
  "household_id",
  "occurred_at",
  "posted_at",
  "status",
  "memo"
];
const POSTING_HEADERS: Array<keyof CanonicalPostingRow> = [
  "id",
  "transaction_id",
  "account_id",
  "direction",
  "amount_minor",
  "currency",
  "entry_type",
  "linked_posting_id"
];
const AUDIT_HEADERS: Array<keyof CanonicalAuditEventRow> = [
  "id",
  "transaction_id",
  "event_type",
  "occurred_at"
];

export function serializeCanonicalBundle(
  bundle: CanonicalBundle,
  options?: {
    excelBom?: boolean;
  }
): CanonicalBundleFile[] {
  const files: CanonicalBundleFile[] = [
    {
      path: "manifest.json",
      content: JSON.stringify(bundle.manifest, null, 2)
    },
    {
      path: "accounts.csv",
      content: withUtf8Bom(
        serializeCsv(
          [...ACCOUNT_HEADERS],
          bundle.accounts.map((row) => row as Record<string, string>)
        ),
        options?.excelBom ?? false
      )
    },
    {
      path: "transactions.csv",
      content: withUtf8Bom(
        serializeCsv(
          [...TRANSACTION_HEADERS],
          bundle.transactions.map((row) => row as Record<string, string>)
        ),
        options?.excelBom ?? false
      )
    },
    {
      path: "postings.csv",
      content: withUtf8Bom(
        serializeCsv(
          [...POSTING_HEADERS],
          bundle.postings.map((row) => row as Record<string, string>)
        ),
        options?.excelBom ?? false
      )
    }
  ];

  if (bundle.audit_events && bundle.audit_events.length > 0) {
    files.push({
      path: "audit_events.csv",
      content: withUtf8Bom(
        serializeCsv(
          [...AUDIT_HEADERS],
          bundle.audit_events.map((row) => row as Record<string, string>)
        ),
        options?.excelBom ?? false
      )
    });
  }

  return files;
}
