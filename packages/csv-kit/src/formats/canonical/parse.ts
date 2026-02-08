import { parseCsv } from "../../rfc4180/quoting";
import type {
  CanonicalAccountRow,
  CanonicalAuditEventRow,
  CanonicalBundle,
  CanonicalBundleFile,
  CanonicalPostingRow,
  CanonicalTransactionRow
} from "./bundle";
import type { CanonicalManifest } from "./manifest";

function parseCsvAsObjects<T extends Record<string, string>>(
  fileContent: string,
  requiredHeaders: Array<keyof T>
): T[] {
  const rows = parseCsv(fileContent);
  if (rows.length === 0) {
    return [];
  }

  const [headerCells, ...dataRows] = rows;
  const headers = headerCells.map((header) => header.trim()) as Array<keyof T>;

  for (const requiredHeader of requiredHeaders) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`CSV_MISSING_REQUIRED:${String(requiredHeader)}`);
    }
  }

  return dataRows.map((cells) => {
    const record = {} as T;
    for (const header of headers) {
      const index = headers.indexOf(header);
      record[header] = (cells[index] ?? "") as T[keyof T];
    }
    return record;
  });
}

function findFile(files: CanonicalBundleFile[], path: string) {
  return files.find((file) => file.path === path);
}

export function parseCanonicalBundle(files: CanonicalBundleFile[]): CanonicalBundle {
  const manifestFile = findFile(files, "manifest.json");
  const accountsFile = findFile(files, "accounts.csv");
  const transactionsFile = findFile(files, "transactions.csv");
  const postingsFile = findFile(files, "postings.csv");
  const auditEventsFile = findFile(files, "audit_events.csv");

  if (!manifestFile || !accountsFile || !transactionsFile || !postingsFile) {
    throw new Error("CSV_MISSING_REQUIRED");
  }

  const manifest = JSON.parse(manifestFile.content) as CanonicalManifest;
  const accounts = parseCsvAsObjects<CanonicalAccountRow>(accountsFile.content, [
    "id",
    "household_id",
    "code",
    "name",
    "type"
  ]);
  const transactions = parseCsvAsObjects<CanonicalTransactionRow>(transactionsFile.content, [
    "id",
    "household_id",
    "occurred_at",
    "posted_at",
    "status",
    "memo"
  ]);
  const postings = parseCsvAsObjects<CanonicalPostingRow>(postingsFile.content, [
    "id",
    "transaction_id",
    "account_id",
    "direction",
    "amount_minor",
    "currency",
    "entry_type",
    "linked_posting_id"
  ]);

  const bundle: CanonicalBundle = {
    manifest,
    accounts,
    transactions,
    postings
  };

  if (auditEventsFile) {
    bundle.audit_events = parseCsvAsObjects<CanonicalAuditEventRow>(auditEventsFile.content, [
      "id",
      "transaction_id",
      "event_type",
      "occurred_at"
    ]);
  }

  return bundle;
}
