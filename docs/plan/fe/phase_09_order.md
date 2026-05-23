# Phase 9 예측·발주 UI (골격) — FE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 9 / §4 `ord_fe_skeleton`
> Day: 42~46 (선행: `ord_be_skeleton`)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M9.F1 | 수요예측 화면 — 수량 표시 | `routes/forecast/index.tsx` (메뉴별·일자별 수량 + Recharts 라인 차트) | 응답 데이터 차트 표시 |
| M9.F2 | 수요예측 화면 — 근거 영역 placeholder | 근거 카드 자리만 (빈 영역·"준비 중" 또는 hidden) — M12.F1에서 채움 | 빈 영역 UI 정합 |
| M9.F3 | 추천발주 화면 | `routes/orders/recommend.tsx` (추천 수량 표시·수정·승인 버튼) | 시나리오 3종 통과 |
| M9.F4 | 홈 경고 배지 골격 | 배지 컴포넌트 — `is_low_confidence` 응답 받으면 표시 (임계값 placeholder) | 더미 응답으로 배지 1회 표시 |
| M9.F5 | 알림 목록 화면 | `routes/notifications.tsx` (TanStack Query 30s 폴링 — frontend 02·06 결정) | 폴링 동작 확인 |

## 외부 의존

- BE: `ord_be_skeleton` 완료 (M9.B1~M9.B4)
- **AI 팀 결정 대기 (Phase 12 hookup)**: 근거 UI 출력 형태 → M12.F1

## 참조

- [frontend_design.md §5 수요예측·추천발주](../../spec/07_frontend/frontend_design.md)
- [HANDOFF.md AI 의존성 ① 후기 수정 비용 중간~큼](../../../HANDOFF.md)

## Phase 통합 종료 조건 (M9)

`ord_fe_skeleton` 완료 (Day 46) — 예측 수량·발주 화면 동작
