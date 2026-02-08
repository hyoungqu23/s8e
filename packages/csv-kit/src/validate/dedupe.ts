import { createHash } from "node:crypto";

import type { CanonicalBundle } from "../formats/canonical/bundle";

export function buildCanonicalFingerprint(bundle: CanonicalBundle) {
  const stablePayload = JSON.stringify({
    manifest: bundle.manifest,
    accountIds: bundle.accounts.map((row) => row.id).sort(),
    transactionIds: bundle.transactions.map((row) => row.id).sort(),
    postingIds: bundle.postings.map((row) => row.id).sort(),
    auditEventIds: (bundle.audit_events ?? []).map((row) => row.id).sort()
  });

  return createHash("sha256").update(stablePayload).digest("hex");
}

export function isDuplicateBundleImport(
  bundle: CanonicalBundle,
  existingFingerprints: Set<string>
) {
  const fingerprint = buildCanonicalFingerprint(bundle);
  return {
    fingerprint,
    isDuplicate: existingFingerprints.has(fingerprint)
  };
}
