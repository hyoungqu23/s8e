# Module AGENTS: packages/csv-kit

## Module Context

`packages/csv-kit` provides utilities for parsing, validating, and generating CSV data.
Used for bulk data import/export features.

## Tech Stack & Constraints

- **TypeScript**
- **Stream Processing**: If dealing with large files, prioritize streaming over loading entire files into memory.

Constraints:

- **Performance**: Optimize for speed and memory usage.
- **Encoding**: Handle UTF-8 and other common encodings correctly (BOM support).

## Implementation Patterns

- **Parser Interface**:
  ```ts
  export function parseCsv<T>(content: string): T[] { ... }
  ```
- **Validation**: Include schema validation during parsing if possible.

## Testing Strategy

- `pnpm --filter @s8e/csv-kit run test`
- Validation tests with malformed CSV inputs.

## Local Golden Rules

Do's:

- Handle edge cases: Empty lines, quoted values with commas, different line endings (CRLF vs LF).
- Type the output of parsers using Generics.

Don'ts:

- Do not assume perfect input; always validate.
