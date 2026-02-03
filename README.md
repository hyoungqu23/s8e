# streamline: s8e

Turborepo + pnpm workspace 기반 모노레포입니다.

- 앱/패키지 구조: `apps/*`, `packages/*`
- 빌드 오케스트레이션: Turborepo
- 패키지 매니저: pnpm
- 버전/체인지로그: Changesets (independent versioning)

## 현재 상태

기본 셋업 완료 상태입니다.

- 루트 `pnpm run ci`(= lint/typecheck/test/build) 통과
- Next.js 16.1.6 / React 19.2.4 / TypeScript 5.7.3 / Tailwind CSS 4.1.18 버전 통일
- private 패키지/앱도 Changesets 버전 업데이트 대상(`privatePackages.version: true`)

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
├─ pnpm-workspace.yaml
└─ .changeset/
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

## Git 브랜치/병합/배포 플로우

이 레포는 **Trunk-based + Changesets**를 기본 운영 규칙으로 사용합니다.

- 기본 브랜치: `main` (소스 오브 트루스)
- 별도 `release` 장기 브랜치 운영하지 않음
- 직접 `main` 푸시 금지, PR 머지만 허용

### 1) 브랜치 생성

기준 브랜치: 항상 `main`

- `feature/<target>/<work-name>`
- `fix/<target>/<work-name>`
- `refactor/<target>/<work-name>`
- `chore/<target>/<work-name>` (선택)
- `docs/<target>/<work-name>` (선택)

`target` 규칙:

- 앱 작업: `app-<app-name>`
- 패키지 작업: `pkg-<package-name>`
- 레포 공통 작업: `repo`

예시:

- `feature/app-twoline-web/home-ledger-summary`
- `fix/pkg-ledger-kit/balance-validation-edge-case`
- `refactor/pkg-ui/button-style-split`
- `chore/repo/upgrade-tailwind-4-1-18`

### 2) 개발/검증

로컬에서 아래를 먼저 통과시킵니다.

```bash
pnpm run ci
```

앱/패키지 동작 변경이 있으면 changeset을 함께 추가합니다.

```bash
pnpm changeset
```

### 3) PR/병합

PR 제목 규칙:

- `feature(scope): ...`
- `fix(scope): ...`
- `refactor(scope): ...`
- `chore(scope): ...`
- `docs(scope): ...`

PR 필수 조건:

- `pnpm run ci` 통과
- 영향 범위(`apps/*`, `packages/*`) 명시
- 버전 영향 시 changeset 포함

병합 규칙:

- **Squash merge** 사용
- `main` 최신 상태로 rebase 후 병합
- 리뷰 1인 이상 승인 권장

### 4) 릴리즈/배포

Changesets Action이 릴리즈 단계를 자동화합니다.

1. 기능 PR들이 `main`에 병합되며 `.changeset/*.md` 누적
2. `changesets.yml`이 자동으로 **Version Packages** PR 생성
3. 해당 PR 머지 시 패키지별 버전 + `CHANGELOG.md` 반영
4. npm publish가 필요하면 `pnpm release` 실행 (옵션)

### 5) 왜 이 플로우를 쓰는가

- 모노레포에서 여러 패키지 변경을 일관되게 추적 가능
- `release` 브랜치 병합 전략(`-X theirs`, 대규모 squash)에서 발생하는 충돌/이력 손실 위험 감소
- 패키지별 semver/CHANGELOG가 자동으로 유지되어 운영 비용이 낮음

## 버전 관리 / 릴리즈 플로우 (Changesets)

### 1) 변경사항 기록

```bash
pnpm changeset
```

- 변경한 패키지/앱 선택
- 버전 bump 타입(`patch`/`minor`/`major`) 선택
- 요약 작성 후 `.changeset/*.md` 생성

### 2) 버전/체인지로그 반영

```bash
pnpm version-packages
```

- 선택된 패키지/앱 `version` 증가
- 각 패키지의 `CHANGELOG.md` 자동 갱신/생성

### 3) 배포(옵션)

```bash
pnpm release
```

- npm publish가 필요한 경우에만 사용
- v1 단계에서는 publish 없이 version/changelog만 운용 가능

## CI

- PR/브랜치 검증: `.github/workflows/ci.yml`
  - install → lint → typecheck → test → build
- Changesets 자동 Version PR: `.github/workflows/changesets.yml`
  - changeset 누적 시 Version Packages PR 생성
  - merge 후 version/changelog 반영 (publish는 옵션)
- 태그 기반 프로덕션 배포: `.github/workflows/deploy.yml`
  - 태그 형식: `<app>@<semver>` (예: `twoline-web@1.2.3`)
  - 필요한 GitHub Secrets:
    - `VERCEL_TOKEN`
    - `VERCEL_ORG_ID`
    - `VERCEL_PROJECT_IDS_JSON` (필수)
    - `VERCEL_APP_DIRS_JSON` (선택, 기본 경로와 다를 때만)

`VERCEL_PROJECT_IDS_JSON` 예시:

```json
{
  "twoline-web": "prj_xxxxxxxxxxxxx",
  "admin-web": "prj_yyyyyyyyyyyyy"
}
```

`VERCEL_APP_DIRS_JSON` 예시(선택):

```json
{
  "admin-web": "apps/admin-dashboard"
}
```

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
