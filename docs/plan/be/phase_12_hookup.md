# Phase 12 AI hookup — BE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 12 / §4 `n8n_data_hookup`·`ord_be_hookup`
> Day: 38~49 (각 마일스톤은 자기 의존 skeleton 종료 직후 즉시 시작 — 통합된 한 덩어리 작업 아님)
> 선행: `ai_model` 완료(Day 25) + 각 hookup 자리의 skeleton 완료

## 마일스톤

| ID | 마일스톤 | 산출물 | AI 팀 input |
|---|---|---|---|
| M12.B1 (Day 38~) | `n8n_data_hookup` — 전처리 노드 실제 로직 (선행: M8.B2 종료) | 결측 보간 노드 + 이상치 탐지 노드 (n8n GUI 노드 수정) | AI 팀 확정 결과 (결측·이상치 처리 규칙) |
| M12.B2 (Day 42~) | `ord_be_hookup` — 예측 근거 응답 필드 형태 (선행: M9.B1·B2 종료) | `forecast_results` 응답 JSON 스키마 변경 (자연어/표/수치 중 확정 형태) + ForecastService 직렬화 | AI 팀 확정 (예측 근거 산출 방법·출력 형태) |
| M12.B3 (Day 42~) | `ord_be_hookup` — 신뢰도 임계값 값 채움 (선행: M9.B3 종료) | `.env` `FORECAST_LOW_CONFIDENCE_THRESHOLD` 값 + `is_low_confidence` 분기 검증 | AI 팀 확정 (신뢰도 임계값) |
| M12.B4 (Day 49~) | `ord_be_hookup` — 예측 정확도 지표 산식 (선행: M11.B2 종료) | DashboardService 예측 집계 산식 (MAPE/RMSE/MAE 중 확정 지표) | AI 팀 확정 (평가 지표) |
| M12.B5 (각 hookup 직후) | hookup 후 회귀 검증 | phase_09·11 API 응답이 hookup 전후로 호환되는지 통합 테스트 재실행 (응답 스키마 변경 영향 범위 확인) | 기존 시나리오 회귀 통과 |

## 외부 의존

- **AI 팀 `ai_model` 완료(Day 25) 후 4가지 결정 모두 확정** 전제
- skeleton 작업(M8.B2·M9.B1·M9.B3·M11.B2)이 각각 완료된 상태

## 참조

- [HANDOFF.md AI 의존성 4가지](../../../HANDOFF.md)
- [PROGRESS.md §3 2026-05-17 예측 근거·평가 지표 research 위임](../../../PROGRESS.md)

## Phase 통합 종료 조건 (M12)

`ord_fe_hookup` 완료 (Day 49) — AI 결정 4가지 모두 반영
