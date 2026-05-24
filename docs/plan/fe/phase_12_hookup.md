# Phase 12 AI hookup — FE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 12 / §4 `ord_fe_hookup`
> Day: 46~49 (선행: `ord_fe_skeleton`, `ord_be_hookup`)

## 마일스톤

| ID | 마일스톤 | 산출물 | AI 팀 input |
|---|---|---|---|
| M12.F1 | 예측 근거 UI 구현 | 근거 출력 형태에 맞는 컴포넌트 (자연어 카드 / 표 / 그래프 중 확정 형태) — M9.F2 placeholder 영역 채움 | `ai/01_model_selection.md` §3 출력 형태 |
| M12.F2 | 신뢰도 낮음 배지 임계값 연결 | 응답 `is_low_confidence` + `low_confidence_reason` → 배지 표시 + 사유 툴팁 | `ai/01_model_selection.md` §4 임계값(BE env로 들어옴) |
| M12.F3 | 예측 정확도 차트 단위·산식 반영 | M11.F2 placeholder → 확정 지표(MAPE/RMSE/MAE 등) 단위·축 label 갱신 | `ai/01_model_selection.md` §3 평가 지표 |
| M12.F4 | OpenAPI 타입 재생성 | `pnpm gen:api` — BE 응답 스키마 변경 반영 | M12.B2 응답 스키마 |
| M12.F5 | hookup 후 회귀 검증 | phase_09·11 화면이 hookup 전후로 정상 동작 (Playwright 회귀 시나리오) — 응답 형태 변경 영향 확인 | 회귀 시나리오 통과 |

## 외부 의존

- **BE: `ord_be_hookup` 완료 (M12.B2·M12.B3·M12.B4)** 필수 — FE는 BE 응답 형태 받은 후 진행
- **AI 팀 `ai_model` 완료(Day 25) 후 4가지 결정 모두 확정** 전제

## 디자인 사전 합의 권장

- 근거 UI는 **AI 팀과 출력 형태 합의 후 디자인 확정** — 후기 수정 비용 큼 (HANDOFF AI 의존성 ①)
- ord_be_hookup 응답 스키마 확정 직후 FE 디자인 1회 리뷰

## 참조

- [HANDOFF.md AI 의존성 4가지 + 더미 처리 비용](../../../HANDOFF.md)

## Phase 통합 종료 조건 (M12)

`ord_fe_hookup` 완료 (Day 49) — AI 결정 4가지 모두 반영
