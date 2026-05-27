# Phase 3 인증·온보딩 — FE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 3 / §4 `auth_fe`·`auth_test`
> Day: 12~21 (선행: `inf`)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M3.F1 | 로그인 화면 | `routes/login.tsx` (카카오·구글 OAuth 버튼 → BE 인가 URL redirect) | OAuth 흐름 302 통과 |
| M3.F2 | OAuth callback 처리 | 첫 진입 시 `POST /api/auth/refresh` 호출 → Zustand 메모리 저장 | Access Token 메모리만 저장(persist 금지) |
| M3.F3 | 온보딩 1스텝 — 매장 기본정보 | React Hook Form + zod 스키마 + phonenumbers 마스크 | 유효성 검증 통과 |
| M3.F4 | 온보딩 2스텝 — POS 연동 | POS 종류 선택 + 자격증명 입력 | 화면 흐름 진행 가능 (BE M3.B6 stub 200 응답) |
| M3.F5 | 온보딩 3스텝 — 메뉴 등록 | 메뉴·레시피 폼 (동적 배열) | 5개 메뉴 등록 통과 |
| M3.F6 | 온보딩 4스텝 — 확인·완료 | 요약 표시 + 제출 → 메인 화면 | end-to-end 1회 통과 |
| M3.F7 | auth_test FE 측 | Playwright E2E (로그인 → 온보딩 4스텝 → 메인) | 시나리오 1회 통과 |
| M3.F8 | **자체 로그인·회원가입 화면** | `routes/register.tsx` 신설 + `routes/login.tsx`에 이메일/비밀번호 폼 + 사업자번호 검증 화면 (`api_spec.md` §2 `POST /api/auth/register`·`POST /api/auth/login` 호출) | 이메일/비밀번호로 회원가입 → 즉시 로그인 → 온보딩 진입 통과 |

> **M3.F8 추가 사유 (29차)**: 본 마일스톤은 Phase 3 dev 통합 검증(E)·dev→main 릴리즈(F) 직후 **곧바로 진행** 예정. BE(`feat/be-auth`)는 `feature_spec.md` §1.2에 따라 자체 로그인·회원가입 9개 라우터 모두 구현·테스트(auth_test 12 케이스) 완료되어 있으나, FE는 OAuth 화면만 노출 상태였음. 27차 phase_03 마일스톤 작성 시 누락된 항목을 명시화.

## 외부 의존

- BE: `auth_be` 완료 (M3.B1~M3.B3) 후 화면 통합 가능

## 참조

- [frontend_design.md §3 인증·라우팅](../../spec/07_frontend/frontend_design.md)
- [PROGRESS.md §3 2026-05-16 18차 A-4 OAuth callback 302 redirect](../../../PROGRESS.md)

## Phase 통합 종료 조건 (M3)

`auth_test` 통과 → **데모 시나리오 Step 1·2 동작** (로그인 + 온보딩)
