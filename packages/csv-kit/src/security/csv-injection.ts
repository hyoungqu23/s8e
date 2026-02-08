const DANGEROUS_PREFIXES = ["=", "+", "-", "@"];

export function sanitizeCsvCell(value: string, enabled = true) {
  if (!enabled) {
    return value;
  }

  if (value.length === 0) {
    return value;
  }

  if (DANGEROUS_PREFIXES.includes(value[0])) {
    return `'${value}`;
  }

  return value;
}
