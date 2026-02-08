import type { CanonicalBundle } from "../formats/canonical/bundle";
import { parseCanonicalBundle } from "../formats/canonical/parse";
import { serializeCanonicalBundle } from "../formats/canonical/serialize";

export function assertCanonicalRoundTrip(bundle: CanonicalBundle) {
  const files = serializeCanonicalBundle(bundle);
  const reparsed = parseCanonicalBundle(files);

  const originalJson = JSON.stringify(bundle);
  const reparsedJson = JSON.stringify(reparsed);

  if (originalJson !== reparsedJson) {
    throw new Error("CSV_CANONICAL_ROUNDTRIP_FAILED");
  }
}
