# streamline: s8e

Turborepo + pnpm workspace 기반 모노레포입니다.

- 앱/패키지 구조: `apps/*`, `packages/*`
- 빌드 오케스트레이션: Turborepo
- 패키지 매니저: pnpm

## 현재 상태

기본 셋업 완료 상태입니다.

- 루트 `pnpm run ci`(= lint/typecheck/test/build) 통과
- Next.js 16.1.6 / React 19.2.4 / TypeScript 5.7.3 / Tailwind CSS 4.1.18 버전 통일

## 프로젝트 구조

```txt
.
├─ apps/
│  └─ twoline-web/            # Next.js App Router 앱
├─ packages/
│  ├─ configs/                # 공용 TS/ESLint/Tailwind 설정
│  ├─ ui/                     # 공용 UI 컴포넌트
│  ├─ i18n/                   # i18n 유틸
│  ├─ ledger-kit/             # 원장/검증 도메인 로직
│  └─ csv-kit/                # CSV 파싱/직렬화
├─ turbo.json
└─ pnpm-workspace.yaml
```

## 요구 사항

- Node.js 20+
- pnpm 9+

## 시작하기

```bash
pnpm install
```

개발 서버 실행:

```bash
pnpm dev
```

## 자주 쓰는 명령어

```bash
pnpm dev         # turbo run dev
pnpm lint        # turbo run lint
pnpm typecheck   # turbo run typecheck
pnpm test        # turbo run test
pnpm build       # turbo run build
pnpm run ci      # turbo run lint typecheck test build
```

> 참고: `pnpm ci`(내장 명령)는 현재 pnpm에서 미구현입니다. 이 레포에서는 `pnpm run ci`를 사용합니다.

## Git 브랜치/병합 플로우

- 기본 브랜치: `main`
- 직접 `main` 푸시 금지, PR 머지만 허용
- 병합 전략: `Squash merge`

브랜치 네이밍 예시:

- `feature/app-twoline-web/home-ledger-summary`
- `fix/pkg-ledger-kit/balance-validation-edge-case`
- `refactor/pkg-ui/button-style-split`
- `chore/repo/upgrade-tailwind-4-1-18`

## 배포

- 앱 배포는 CI/CD 파이프라인에서 수행
- 웹 배포 타깃은 Vercel

## 버전 통일 전략

루트 `package.json`의 `pnpm.overrides`로 핵심 스택 버전을 강제합니다.

- `next`, `react`, `react-dom`
- `typescript`, `tailwindcss`, `eslint`
- `@typescript-eslint/*`

앱/패키지 `package.json`에 범위가 달라도 실제 설치 버전은 overrides 기준으로 통일됩니다.

## 운영 팁

- 새 앱 추가: `apps/<name>` 생성 후 `scripts`(`dev/build/lint/typecheck/test`) 표준화
- 새 패키지 추가: `packages/<name>` 생성 후 `workspace:*`로 내부 의존성 연결
- 캐시 안정성: 환경/설정 파일 변경 시 `turbo.json`의 `globalDependencies`를 함께 업데이트
