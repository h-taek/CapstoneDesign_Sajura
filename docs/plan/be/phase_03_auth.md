# Phase 3 인증·온보딩 — BE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 3 / §4 `auth_be`·`auth_test`
> Day: 12~21 (선행: `inf`)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M3.B1 | AuthService 구현 | Authlib OAuth(카카오·구글) + python-jose JWT + passlib[bcrypt] | OAuth 흐름 302 redirect + HttpOnly Cookie 발급 |
| M3.B2 | StoreService 구현 | 매장 등록·조회·소프트삭제 + `stores.phone` phonenumbers NATIONAL 정규화 | API 4종 (`POST/GET/PUT/DELETE /api/stores/me`) |
| M3.B3 | 국세청 사업자등록번호 검증 | 외부 API 어댑터 (httpx + tenacity + aiobreaker) | 유효·휴업·말소 분기 |
| M3.B4 | `POST /api/auth/logout-all` | 모든 디바이스 일괄 폐기 (PROGRESS.md §3 2026-05-16 강제 로그아웃) | refresh_token_blacklist Redis 저장 |
| M3.B5 | auth_test BE 측 | API 통합 테스트 (pytest + testcontainers + respx) | 12개 시나리오 통과 |
| M3.B6 | POS stub API (실연동 전 임시) | 자격증명 입력·연결 테스트 엔드포인트 stub (mock 200 응답) — 실연동은 M4.B1 | stub 호출 200 |
| M3.B7 | MenuService (phase_05 M5.B1에서 이동) | 레시피(재료·수량) + 소프트삭제(`deleted_at`) | CRUD + 레시피 연결 테스트 |

## 외부 의존

- FE: `auth_fe` 완료 시 Phase 통합 종료(M3) 가능
- 카카오·구글 OAuth 개발 앱 등록 필요
- POS API 명세 조사 진행 중 (`docs/research/backend/13_pos_adapter.md` 위임) — 실연동은 M4.B1

## 참조

- [feature_spec.md §1.1 OAuth 흐름](../../spec/03_feature_design/feature_spec.md)
- [api_spec.md §2 auth](../../spec/05_api/api_spec.md)
- [sequence.md §2 OAuth](../../spec/04_flow/sequence.md)

## Phase 통합 종료 조건 (M3)

`auth_test` 통과 (BE·FE 양쪽 끝남) → **데모 시나리오 Step 1·2 동작** (로그인 + 온보딩)

**데모 시드:** 카카오·구글 OAuth 데모 앱(만료일 확인), 데모 매장 1건·POS 더미 자격증명·메뉴 5건 등록 fixture
