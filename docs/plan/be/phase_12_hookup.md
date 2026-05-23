# Phase 12 AI hookup — BE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 12 / §4 `n8n_data_hookup`·`ord_be_hookup`
> Day: 33~44 (선행: `ai_model` 완료 + 각 skeleton 완료)

## 마일스톤

| ID | 마일스톤 | 산출물 | AI 팀 input |
|---|---|---|---|
| M12.B1 | `n8n_data_hookup` — 전처리 노드 실제 로직 | 결측 보간 노드 + 이상치 탐지 노드 (n8n GUI 노드 수정) | `ai/02_ml_pipeline_open_items.md` §3 확정 결과 |
| M12.B2 | `ord_be_hookup` — 예측 근거 응답 필드 형태 | `forecast_results` 응답 JSON 스키마 변경 (자연어/표/수치 중 확정 형태) + ForecastService 직렬화 | `ai/01_model_selection.md` §3 (산출 방법·출력 형태) |
| M12.B3 | `ord_be_hookup` — 신뢰도 임계값 값 채움 | `.env` `FORECAST_LOW_CONFIDENCE_THRESHOLD` 값 + `is_low_confidence` 분기 검증 | `ai/01_model_selection.md` §4 임계값 |
| M12.B4 | `ord_be_hookup` — 예측 정확도 지표 산식 | DashboardService 예측 집계 산식 (MAPE/RMSE/MAE 중 확정 지표) | `ai/01_model_selection.md` §3 평가 지표 |

## 외부 의존

- **AI 팀 `ai_model` 완료(Day 25) 후 4가지 결정 모두 확정** 전제
- skeleton 작업(M8.B2·M9.B1·M9.B3·M11.B2)이 각각 완료된 상태

## 참조

- [HANDOFF.md AI 의존성 4가지](../../../HANDOFF.md)
- [PROGRESS.md §3 2026-05-17 예측 근거·평가 지표 research 위임](../../../PROGRESS.md)

## Phase 통합 종료 조건 (M12)

`ord_fe_hookup` 완료 (Day 49) — AI 결정 4가지 모두 반영
