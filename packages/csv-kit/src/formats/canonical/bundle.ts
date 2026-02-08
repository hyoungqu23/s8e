import type { CanonicalManifest } from "./manifest";

export type CanonicalAccountRow = {
  id: string;
  household_id: string;
  code: string;
  name: string;
  type: string;
};

export type CanonicalTransactionRow = {
  id: string;
  household_id: string;
  occurred_at: string;
  posted_at: string;
  status: string;
  memo: string;
};

export type CanonicalPostingRow = {
  id: string;
  transaction_id: string;
  account_id: string;
  direction: "DEBIT" | "CREDIT";
  amount_minor: string;
  currency: string;
  entry_type: "ORIGINAL" | "REVERSAL" | "CORRECTION";
  linked_posting_id: string;
};

export type CanonicalAuditEventRow = {
  id: string;
  transaction_id: string;
  event_type: string;
  occurred_at: string;
};

export type CanonicalBundle = {
  manifest: CanonicalManifest;
  accounts: CanonicalAccountRow[];
  transactions: CanonicalTransactionRow[];
  postings: CanonicalPostingRow[];
  audit_events?: CanonicalAuditEventRow[];
};

export type CanonicalBundleFile = {
  path: string;
  content: string;
};
