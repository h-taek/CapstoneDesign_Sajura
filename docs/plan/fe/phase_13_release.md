# Phase 13 통합 검증·배포 — FE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 13 / §4 `test_release`
> Day: 49~58 (선행: `auto`, `dash`, `ord_fe_hookup`, `n8n_data_hookup`)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M13.F1 | 데모 시나리오 Step 1~6 E2E | Playwright(Node) Chromium — 로그인 → 온보딩 → CSV 업로드 → 예측 → 발주 → 자동화 | 6단계 모두 통과 |
| M13.F2 | Lighthouse 검증 | Performance·Accessibility·Best Practices·SEO 점수 | 각 90+ 목표 |
| M13.F3 | 번들 사이즈 검증 | Vite 빌드 후 chunk 크기·총 JS·CSS 크기 측정 | 임계값 통과 |
| M13.F4 | PWA 동작 검증 | Service Worker 등록·오프라인 동작·Web Push 수신 | 시나리오 3종 통과 |
| M13.F5 | FE 배포 | Caddy 이미지 자체 빌드(FE dist COPY) + GitHub Actions 8단계 | 운영 도메인 접근 가능 |

## 외부 의존

- 전 Phase 종착 후 진행
- BE M13.B1~M13.B4와 병행

## 참조

- [performance.md §5 FE Sentry release tagging](../../spec/09_nonfunctional/performance.md)
- [frontend_design.md §10 배포·CI](../../spec/07_frontend/frontend_design.md)
- [PROGRESS.md §3 2026-05-16 18차 A-2 FE Sentry](../../../PROGRESS.md)

## Phase 통합 종료 조건 (M13)

`test_release` 완료 — **MVP 릴리스** (전체 종료 Day 58)
