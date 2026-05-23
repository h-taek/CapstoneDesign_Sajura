# Phase 13 통합 검증·배포 — BE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 13 / §4 `test_release`
> Day: 49~58 (선행: `auto`, `dash`, `ord_fe_hookup`, `n8n_data_hookup`)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M13.B1 | API 성능 검증 | k6 또는 Locust 부하 시나리오 → 응답 시간·처리량 측정 | [performance.md](../../spec/09_nonfunctional/performance.md) SLA 통과 |
| M13.B2 | 보안 검증 | Trivy(이미지) + bandit(코드) + pip-audit(의존성) + Caddy 보안 헤더 검증 | High/Critical 0건 |
| M13.B3 | CI/CD 배포 파이프라인 | GitHub Actions 8단계 (lint→test→build→scan→push→deploy) | main 브랜치 push → 운영 배포 통과 |
| M13.B4 | 데모 시나리오 백엔드 측 검증 | Step 1~6 end-to-end API 흐름 통합 테스트 | 6단계 모두 통과 |

## 외부 의존

- 전 Phase 종착 후 진행

## 참조

- [performance.md](../../spec/09_nonfunctional/performance.md)
- [security.md](../../spec/09_nonfunctional/security.md)
- [requirements.md §6.3 CI/CD](../../spec/01_requirements/requirements.md)

## Phase 통합 종료 조건 (M13)

`test_release` 완료 — **MVP 릴리스** (전체 종료 Day 58)
