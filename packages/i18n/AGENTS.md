# Module AGENTS: packages/i18n

## Module Context

`packages/i18n` holds locale messages and internationalization utilities.
It serves as the single source of truth for UI copy.

## Tech Stack & Constraints

- **TypeScript**
- **JSON/Object Dictionaries**: Locale files structure.

Constraints:

- **Keys**: defined in `en` (or default locale) must be present in all other supported locales (check via lint/types if possible).

## Implementation Patterns

- **Locale Structure**: `src/locales/ko.ts`, `src/locales/en.ts`.
- **Usage**:
  ```ts
  // src/index.ts
  export const messages = { ko, en } as const;
  ```

## Testing Strategy

- Typecheck to ensure key consistency.
- `pnpm --filter @s8e/i18n run typecheck`

## Local Golden Rules

Do's:

- Use nested keys for grouping (e.g., `auth.login.title`).
- Treat text as data.

Don'ts:

- Do not hardcode text in components; always move to `i18n`.
