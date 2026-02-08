import { parseBcp47 } from "./bcp47";

export type SupportedLocale = "ko" | "en";

function parseAcceptLanguage(raw: string) {
  return raw
    .split(",")
    .map((segment) => segment.trim().split(";")[0] ?? "")
    .filter(Boolean);
}

function normalizeToSupported(tag: string): SupportedLocale | null {
  const parsed = parseBcp47(tag);
  if (!parsed) {
    return null;
  }

  if (parsed.language === "ko") {
    return "ko";
  }
  if (parsed.language === "en") {
    return "en";
  }

  return null;
}

export function resolveLocale(
  input: string | string[] | undefined,
  fallback: SupportedLocale = "en"
): SupportedLocale {
  const candidates = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? parseAcceptLanguage(input)
      : [];

  for (const candidate of candidates) {
    const resolved = normalizeToSupported(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return fallback;
}
