# Module AGENTS: packages/configs

## Module Context

`packages/configs` is the central configuration hub for tools like ESLint, TypeScript, and Tailwind CSS.
Changes here propagate to ALL apps and packages.

## Tech Stack & Constraints

- **ESLint**: Flat config format (`eslint.config.mjs` style exports).
- **TypeScript**: `tsconfig.json` base configuration.
- **Tailwind**: Shared presets.

Constraints:

- **Stability**: Breaking changes here break the entire monorepo.
- **No Side Effects**: Configurations should be static exports.

## Implementation Patterns

- **Exports**:
  - `@s8e/configs/eslint`
  - `@s8e/configs/tsconfig.json` (or similar)
  - `@s8e/configs/tailwind`

## Testing Strategy

- `pnpm run lint` (root level) to verify config validity.
- Visual check of consuming packages after changes.

## Local Golden Rules

Do's:

- Test config changes on one specific package before applying globally.
- Keep strict rules (e.g., `no-explicit-any`) enabled by default.

Don'ts:

- Do not relax rules globally to solve a local issue; use local overrides (`// eslint-disable`) instead.
