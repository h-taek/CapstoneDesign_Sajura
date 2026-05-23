# Phase 10 쿠팡 자동화 — BE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 10 / §4 `auto`
> Day: 42~49 (선행: `ord_be_skeleton`)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M10.B1 | AutomationService (Playwright) | 쿠팡 로그인 → 장바구니 담기 → 주문서 작성 자동화 | 더미 계정 1회 실행 |
| M10.B2 | 자격증명 보관 | AES-256-GCM 암호화(`cryptography`) → DB `store_credentials` | 암복호화 unit test |
| M10.B3 | 자동화 결과 로깅 | `automation_logs` 테이블 INSERT + 실패 시 Slack 알림 | 성공·실패 시나리오 각 1회 |

## 외부 의존

- **자격증명 검증 보류** (PROGRESS.md §3 2026-05-16): (E) → (C) 단계적 fallback 검토 필요
- 후속: `test_release` deps

## 참조

- [feature_spec.md §10 쿠팡 자동화](../../spec/03_feature_design/feature_spec.md)
- [security.md §6 결제 — 사주라 미경유·미저장](../../spec/09_nonfunctional/security.md)

## Phase 통합 종료 조건 (M10)

`auto` 완료 — **데모 시나리오 Step 6 동작**
