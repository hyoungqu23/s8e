# AI Agent Governance for streamline: s8e

## Project Context & Operations

이 저장소는 `Turborepo + pnpm workspace + Changesets` 기반 모노레포다.

- 앱: `apps/twoline-web` (Next.js 16, React 19, TypeScript)
- 패키지: `packages/ui`, `packages/i18n`, `packages/ledger-kit`, `packages/csv-kit`, `packages/configs`
- 목표: 앱/패키지 독립 버전 관리, CI 안정성, 태그 기반 배포

Operational Commands:

- 의존성 설치: `pnpm install`
- 개발: `pnpm dev`
- 빌드: `pnpm build`
- 린트: `pnpm lint`
- 타입체크: `pnpm typecheck`
- 테스트: `pnpm test`
- CI 전체 검증: `pnpm run ci`
- changeset 생성: `pnpm changeset`
- 버전/체인지로그 반영: `pnpm version-packages`
- 배포(옵션): `pnpm release`

## Golden Rules

Immutable:

- `main` 브랜치 직접 푸시 금지. PR 머지로만 반영한다.
- 비밀값(토큰/키/비밀번호)을 코드/문서/로그에 절대 커밋하지 않는다.
- 패키지 간 내부 의존성은 `workspace:*`를 사용한다.
- 버전 영향 변경은 반드시 changeset 파일을 포함한다.

Do's:

- 변경 전 영향 범위를 `apps/*`, `packages/*` 단위로 식별한다.
- `pnpm run ci` 통과 후 PR을 생성한다.
- 루트 `pnpm.overrides` 기준으로 핵심 버전 일관성을 유지한다.
- 에이전트 작업 시 관련 고컨텍스트 파일(하위 AGENTS, docs)을 먼저 읽는다.

Don'ts:

- `turbo.json`, `tsconfig`, 릴리즈 워크플로우를 근거 없이 변경하지 않는다.
- `dist`, `.next`, `.turbo`, `node_modules` 산출물을 커밋하지 않는다.
- 릴리즈 브랜치 분기 전략을 임의 도입하지 않는다(기본은 trunk-based).

## Standards & References

- 코딩 규칙: TypeScript 우선, 명확한 네이밍, 불필요한 추상화 금지
- Git 브랜치 규칙: `feature|fix|refactor|chore|docs/<target>/<work-name>`
- PR 제목 규칙: `feature(scope): ...`, `fix(scope): ...` 등
- 배포 규칙: 태그 `<app>@<semver>` 기반 GitHub Actions + Vercel
- 상세 운영 문서: `README.md`

Maintenance Policy:

- 코드/인프라/워크플로우와 AGENTS 규칙이 어긋나면, PR에서 규칙 업데이트를 함께 제안한다.
- 신규 앱/패키지 추가 시 Context Map에 경로를 즉시 추가한다.

## Context Map (Action-Based Routing)

- **[웹 앱 구현/수정 (Next.js)](./apps/twoline-web/AGENTS.md)** — 페이지, 라우팅, UI, 앱 빌드/린트/테스트 작업 시.
- **[UI 컴포넌트 (Shared)](./packages/ui/AGENTS.md)** — 공용 UI, Shadcn/Tailwind 작업 시.
- **[도메인 로직 (Ledger)](./packages/ledger-kit/AGENTS.md)** — 원장 계산, 트랜잭션, 검증 로직 작업 시.
- **[CSV 처리 유틸](./packages/csv-kit/AGENTS.md)** — CSV 파싱/내보내기 로직 작업 시.
- **[i18n/로케일](./packages/i18n/AGENTS.md)** — 다국어 메시지, 로케일 설정 작업 시.
- **[공용 설정 (Lint/TS)](./packages/configs/AGENTS.md)** — 전체 프로젝트 린트/타입/스타일 설정 작업 시.
- **[리포 운영/브랜치/배포 규칙](./README.md)** — 브랜치 전략, PR 규칙, 릴리즈/배포 흐름 확인 시.
- **[CI/CD 워크플로우](./.github/workflows/AGENTS.md)** — CI 실패 분석, 배포 태그/시크릿/워크플로우 수정 시.
