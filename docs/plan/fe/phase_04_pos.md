# Phase 4 POS·데이터 적재 — FE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 4 / §4 `pos_fe`
> Day: 21~25 (선행: `auth_test`)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M4.F1 | POS 연동 설정 화면 | `routes/settings/pos.tsx` (자격증명 수정·연결 테스트) | 테스트 버튼 200 응답 |
| M4.F2 | CSV 업로드 화면 | `routes/sales/upload.tsx` (드래그앤드롭 + 진행률 + 오류 행 표시) | 10만 행 업로드 성공 |
| M4.F3 | 업로드 결과 화면 | 성공·실패 행 수·이상치 감지 결과 표 | 시나리오 3종 통과 |

## 외부 의존

- BE: `pos_be` 완료 (M4.B1~M4.B3)

## 디자인 사전 합의 권장

- 업로드 결과 화면(M4.F3) 이상치 표시 영역은 AI 팀 이상치 탐지 방법(IQR/Z-score 등) 확정 전 디자인 고정 시 phase_12 hookup에서 갈아엎는 비용 발생
- placeholder만 잡아두고 실 표시 디자인은 M12 hookup 시 확정

## 참조

- [frontend_design.md §5 화면 구성](../../spec/07_frontend/frontend_design.md)
- [PROGRESS.md §3 2026-05-16 CSV-only MVP 정책](../../../PROGRESS.md)

## Phase 통합 종료 조건 (M4)

BE·FE 양쪽 완료 — CSV 업로드 → DB INSERT → 화면 표시 → **데모 시나리오 Step 3 동작**
