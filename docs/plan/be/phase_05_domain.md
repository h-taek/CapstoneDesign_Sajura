# Phase 5 메뉴·재고·판매 도메인 — BE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 5 / §4 `dom_be`
> Day: 21~29 (선행: `auth_test`, FE는 Day 29~35)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M5.B1 | MenuService | 레시피(재료·수량) + 소프트삭제(`deleted_at`) | CRUD + 레시피 연결 테스트 |
| M5.B2 | InventoryService | 로트(`inventory_lots`) + FIFO 출고 + 폐기 + 단가 갱신 | FIFO 시나리오 5종 통과 |
| M5.B3 | SaleService 조회 | 일별·메뉴별·시간대별 집계 | 응답 시간 SLA 통과 |
| M5.B4 | ARQ cron_jobs 등록 | 소비기한 일일 점검(매일 02:00) + 단가 갱신 | 1회 트리거 → notifications INSERT |

## 외부 의존

- 후속: M8.B1 `n8n_data_skeleton` deps에 `dom_be` 포함

## 참조

- [service_design.md MenuService·InventoryService·SaleService](../../spec/07_backend/service_design.md)
- [PROGRESS.md §3 2026-05-16 스케줄러 책임 분리 (n8n vs ARQ)](../../../PROGRESS.md)

## Phase 통합 종료 조건 (M5)

`dom_fe` 완료 (Day 35) → **데모 시나리오 Step 2 동작**, n8n 통합 가능
