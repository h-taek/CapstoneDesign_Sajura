# Phase 11 대시보드·알림 — BE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 11 / §4 `dash`
> Day: 42~49 (선행: `ord_be_skeleton`)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M11.B1 | DashboardService — 매출 집계 | 일별·주별·메뉴별 집계 + Redis 캐시 | 응답 시간 SLA 통과 |
| M11.B2 | DashboardService — 예측 집계 | 예측 정확도 지표 placeholder (지표 종류는 M12.B2) | 캐시 키 패턴 정합 |
| M11.B3 | NotificationService | 인앱(`notifications`) + Web Push(pywebpush·VAPID) + Slack + 이메일(fastapi-mail) 4채널 | 4채널 각 1회 발송 통과 |
| M11.B4 | `POST /api/notifications/subscribe` | Web Push 구독 — `push_subscriptions` INSERT | 구독 → Web Push 1회 수신 |

## 외부 의존

- **AI 팀 결정 대기 (Phase 12 hookup)**: 예측 정확도 지표 종류(MAPE? RMSE?) — `ai/01_model_selection.md` §3
- **ROI 대시보드는 `[2단계]`** — MVP 범위 밖

## 참조

- [feature_spec.md §11 대시보드 / §12 알림](../../spec/03_feature_design/feature_spec.md)
- [PROGRESS.md §3 2026-05-16 ROI [2단계] 라벨](../../../PROGRESS.md)

## Phase 통합 종료 조건 (M11)

`dash` 완료 — **데모 시나리오 Step 5 동작**
