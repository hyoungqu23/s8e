# Module AGENTS: packages/ledger-kit

## Module Context

`packages/ledger-kit` contains the core domain logic for ledger management, transactions, and verification.
This is the "Brain" of the business logic, independent of any UI or framework.

## Tech Stack & Constraints

- **TypeScript**: Pure TypeScript, no UI dependencies (React).
- **Zero-Dependency**: Minimize external runtime dependencies to ensure portability.

Constraints:

- **Pure Functions**: Logic should be deterministic and side-effect free where possible.
- **High Precision**: Use accurate number handling (e.g., explicit integer math or specialized libraries) for currency.

## Implementation Patterns

- **Functional Core**:
  ```ts
  export function calculateBalance(transactions: Transaction[]): Balance { ... }
  ```
- **Error Handling**: Use typed result patterns or explicit error classes, avoid throwing generic errors.

## Testing Strategy

- **Unit Tests**: Coverage is critical here. 100% coverage expected for calculation logic.
- `pnpm --filter @s8e/ledger-kit run test`

## Local Golden Rules

Do's:

- Document complex calculation formulas with comments.
- Organize logic by sub-domain (e.g., `transaction/`, `account/`, `validation/`).

Don'ts:

- Do not import `React` or UI-related libraries.
- Do not depend on environment variables directly; pass configuration as arguments.
