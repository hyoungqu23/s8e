export type ParsedBcp47 = {
  language: string;
  region?: string;
};

const LANGUAGE_PATTERN = /^[a-z]{2,3}$/i;
const REGION_PATTERN = /^(?:[a-z]{2}|\d{3})$/i;

export function parseBcp47(tag: string): ParsedBcp47 | null {
  const normalized = tag.trim();
  if (!normalized) {
    return null;
  }

  const [language, region] = normalized.split("-");
  if (!LANGUAGE_PATTERN.test(language)) {
    return null;
  }

  if (region && !REGION_PATTERN.test(region)) {
    return null;
  }

  return {
    language: language.toLowerCase(),
    region: region?.toUpperCase()
  };
}

export function isValidBcp47(tag: string) {
  return parseBcp47(tag) !== null;
}
