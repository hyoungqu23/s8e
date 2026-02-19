# Module AGENTS: packages/ui

## Module Context

`packages/ui` is the shared design system library.
It provides consistent, reusable React components to all applications (e.g., `twoline-web`).

## Tech Stack & Constraints

- **React 19.x**: Components must be compatible with React 19 features (e.g., `use` hook, Actions).
- **Tailwind CSS 4.x**: Styling is done exclusively via utility classes.
- **TypeScript**: Strict type definitions for all component props.

Constraints:

- **No Domain Logic**: UI components must remain purely presentational. Do not import business logic or state management libraries.
- **Client Components**: If using hooks (`useState`, `useEffect`), explicitly mark with `"use client"`.
- **Barrel Exports**: Use `src/index.ts` to export public components.

## Implementation Patterns

- **Component Structure**:

  ```tsx
  // src/components/Button.tsx
  import React from 'react';

  export interface ButtonProps { ... }

  export function Button({ ... }: ButtonProps) {
    return <button className="...">...</button>;
  }
  ```

- **Storybook-like isolation**: (If applicable in future) Build components to be viewable in isolation.

## Testing Strategy

- `pnpm --filter @s8e/ui run test`
- `pnpm --filter @s8e/ui run lint` (ESLint)
- `pnpm --filter @s8e/ui run typecheck`

## Local Golden Rules

Do's:

- Use `cn()` (clsx + tailwind-merge) for conditional class names.
- Define explicit interfaces for all props (`Props` or `ComponentProps`).
- Forward refs where applicable for maximum flexibility.

Don'ts:

- Do not hardcode colors; use Tailwind theme tokens.
- Do not create "one-off" variations that deviate from the design system without discussion.
