# Phase 4 POS·데이터 적재 — BE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 4 / §4 `pos_be`
> Day: 21~26 (선행: `auth_test`)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M4.B1 | POS 어댑터 (BARO V2) | `app/adapters/pos/baro.py` — POS API 호출 + 매핑 | 샘플 응답 → `sales` 테이블 INSERT |
| M4.B2 | CSV 업로드 엔드포인트 | `POST /api/sales/upload` (multipart + pandas 파싱) — MVP 유일 데이터 경로. **CSV 포맷·필수 컬럼: `spec/03_feature_design/feature_spec.md` §4.4** | 10만 행 업로드 성공 |
| M4.B3 | 이상치 탐지 모듈 (placeholder) | 탐지 함수 시그니처만 존재, 내부는 통과 — 방법론은 Phase 12 hookup | unit test (입력 = 출력) |

## 외부 의존

- AI 팀의 이상치 탐지 방법(IQR/Z-score 등) 미정 — `ai/02_ml_pipeline_open_items.md` §3.2 확정 시 M12.B1에서 실제 로직 반영
- BARO V2 어댑터 조사 완료 전제 (`docs/research/backend/13_pos_adapter.md`) — 미완 시 M3.B6 stub 유지

## 참조

- [feature_spec.md §4 POS·CSV·이상치](../../spec/03_feature_design/feature_spec.md)
- [PROGRESS.md §3 2026-05-17 이상치 탐지 정책 research 이동](../../../PROGRESS.md)

## Phase 통합 종료 조건 (M4)

BE·FE 양쪽 완료 — CSV 업로드 → DB INSERT → 화면 표시 → **데모 시나리오 Step 3 동작**

**데모 시드:** 데모용 매출 CSV 파일 1개(과거 30~60일치, 다양한 메뉴·시간대 포함)
