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
| M3.F8 | **자체 로그인·회원가입 화면** | `routes/register.tsx` 신설(`POST /api/auth/register` — email·password·name만) + `routes/login.tsx`에 이메일/비밀번호 폼 병치(`POST /api/auth/login`) + `schemas/auth.ts` | 이메일/비밀번호로 회원가입 → 로그인 → 사업자 검증 진입 통과 |
| M3.F9 | **사업자 검증 화면 (온보딩 게이트)** | `routes/verify-business.tsx` 신설(사업자번호 입력·마스크, `POST /api/store/business/verify`) + 가드에 `business_verified` 단계 추가(미검증 → `/verify-business`) + 미등록/휴폐업 메시지 분기 | 미검증 사용자 온보딩 차단 + 검증 성공 시 온보딩 진입 E2E |

> **M3.F8·F9 사유**: BE는 자체 로그인·회원가입 라우터 구현·테스트(auth_test 12) 완료, FE는 OAuth 화면만 노출 상태였음(27차 누락). 사업자 검증은 회원가입에 묶지 않고 **온보딩 진입 전 독립 게이트(`/verify-business`)**로 분리 — 소셜·이메일 계정 공통 적용. 상세 흐름·정책: `feature_spec.md` §1.4, `api_spec.md` §3 `POST /api/store/business/verify`, `security.md` §2.4(마스터 코드).

## 외부 의존

- BE: `auth_be` 완료 (M3.B1~M3.B3) 후 화면 통합 가능

## 참조

- [frontend_design.md §3 인증·라우팅](../../spec/07_frontend/frontend_design.md)
- [PROGRESS.md §3 2026-05-16 18차 A-4 OAuth callback 302 redirect](../../../PROGRESS.md)

## Phase 통합 종료 조건 (M3)

`auth_test` 통과 → **데모 시나리오 Step 1·2 동작** (로그인 + 온보딩)
