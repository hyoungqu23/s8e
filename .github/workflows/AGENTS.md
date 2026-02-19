# Module AGENTS: .github/workflows

## Module Context

이 디렉토리는 CI/CD 자동화 정의를 관리한다.

- `ci.yml`: lint/typecheck/test/build 검증
- `changesets.yml`: Version Packages PR 자동화
- `deploy.yml`: 태그 기반 Vercel 프로덕션 배포

## Tech Stack & Constraints

- GitHub Actions
- pnpm 9, Node 22
- Vercel CLI 기반 배포

Constraints:

- 워크플로우 변경 시 최소 1회 로컬 명령(`pnpm run ci`)로 선검증
- 배포 워크플로우는 태그 규칙 `<app>@<semver>`를 유지
- 시크릿 키 이름 호환성을 깨는 리네이밍 금지

## Implementation Patterns

- 설치 단계는 `pnpm install --frozen-lockfile` 우선
- 배포 앱 매핑은 `VERCEL_PROJECT_IDS_JSON` 시크릿 기반
- 앱 디렉토리 예외가 있을 때만 `VERCEL_APP_DIRS_JSON` 사용

## Testing Strategy

- CI 워크플로우 변경 후 로컬 검증: `pnpm run ci`
- 배포 규칙 변경 후 드라이런: 태그 파싱/경로 매핑 로직 리뷰
- 실제 배포는 테스트 태그로 검증

## Local Golden Rules

Do's:

- 실패 로그에서 단계별 원인(설치/빌드/테스트/배포)을 분리해 수정
- 시크릿 누락 시 가이드 문구를 README와 함께 업데이트

Don'ts:

- 앱별 하드코딩을 늘려 유지보수 복잡도를 키우지 않는다
- 성공한 워크플로우를 목적 없이 재구성하지 않는다
