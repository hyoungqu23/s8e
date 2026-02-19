# Module AGENTS: apps/twoline-web

## Module Context

`twoline-web`는 Next.js App Router 기반 사용자 웹 애플리케이션이다.
공용 패키지(`@s8e/ui`, `@s8e/i18n`, `@s8e/ledger-kit`, `@s8e/csv-kit`)를 소비한다.

## Tech Stack & Constraints

- Next.js 16.x
- React 19.x
- TypeScript 5.x
- Tailwind CSS 4.x
- ESLint 9.x (flat config: 루트 `eslint.config.mjs`)

Constraints:

- 앱 내부 코드에서 패키지 소스 직접 상대경로 import 금지. 반드시 패키지명 import 사용.
- Next 설정 변경 시 빌드/타입체크/라우트 영향도를 함께 검증.

## Implementation Patterns

- 페이지/레이아웃: `app/` 디렉토리(App Router)
- 전역 스타일: `app/globals.css`
- 공용 UI는 `@s8e/ui` 우선 사용, 앱 전용 UI만 로컬에 둔다.
- 앱 전용 문서가 필요하면 `apps/twoline-web/docs/*`에 작성한다.

## Testing Strategy

- 앱 단위 검증: `pnpm --filter @s8e/twoline-web run lint`
- 타입체크: `pnpm --filter @s8e/twoline-web run typecheck`
- 테스트: `pnpm --filter @s8e/twoline-web run test`
- 프로덕션 빌드: `pnpm --filter @s8e/twoline-web run build`

## Local Golden Rules

Do's:

- 라우트/SEO/메타 변경 시 실제 빌드(`next build`)까지 확인한다.
- 패키지 API 변경이 필요하면 앱에서 우회 구현하지 말고 패키지에 반영한다.

Don'ts:

- 앱에서 비즈니스 핵심 로직을 과도하게 중복 구현하지 않는다.
- 민감정보를 클라이언트 번들에 노출하지 않는다.
