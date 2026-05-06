# 01~05 문서 일관성 검증 프롬프트

## 이 프롬프트의 목적

`docs/01` ~ `docs/05` 문서들 간의 내용 불일치, 누락, 모순을 검출하고 수정합니다.

---

## 검증 대상 파일

```
docs/02_feature_design/feature_spec.md
docs/03_api/api_spec.md
docs/04_database/schema.md
docs/04_database/erd.md
docs/05_backend/service_design.md
```

---

## 검증 방법

아래 체크리스트를 순서대로 수행하세요. 각 항목마다 관련 파일을 직접 읽고 교차 확인하세요.

---

## 체크리스트

### 1. 인증/사용자 관련

- [ ] `feature_spec.md` 소셜 로그인 흐름이 `api_spec.md` endpoint 구조(`/api/auth/login/kakao`, `/api/auth/callback/kakao` 등)와 일치하는지 확인
- [ ] `api_spec.md` 로그인 응답에 `onboarding_completed` 필드가 포함되어 있는지 확인
- [ ] `api_spec.md` `GET /api/auth/me` 응답에 `auth_provider`, `onboarding_completed` 포함 여부 확인
- [ ] `schema.md` `users` 테이블에 `auth_provider ENUM('LOCAL','KAKAO','GOOGLE')`, `social_id`, `password_hash NULL 허용` 반영 여부 확인
- [ ] `schema.md` `users` 테이블 UNIQUE KEY `(auth_provider, social_id)` 존재 여부 확인
- [ ] `service_design.md` 기술 스택에 Firebase SDK 미포함, Authlib 포함 여부 확인

### 2. 매장/온보딩 관련

- [ ] `feature_spec.md` 온보딩 필수 입력 항목(업종, 매장 규모, 운영 형태)이 `schema.md` `stores` 테이블 컬럼(`business_type`, `store_size`, `operation_type`)에 반영되었는지 확인
- [ ] `api_spec.md` `GET /api/store`, `PATCH /api/store` 응답에 `business_type`, `store_size`, `operation_type`, `onboarding_completed` 포함 여부 확인
- [ ] `schema.md` `stores` 테이블에 `onboarding_completed` 컬럼 존재 여부 확인
- [ ] `service_design.md` `StoreService.complete_onboarding` 메서드 존재 여부 확인

### 3. 메뉴/레시피 관련

- [ ] `feature_spec.md` "재고 차감 사용 여부" 기능이 `schema.md` `menus` 테이블의 `use_inventory_deduction` 컬럼에 반영되었는지 확인
- [ ] `api_spec.md` 메뉴 등록/조회 요청/응답에 `use_inventory_deduction` 포함 여부 확인
- [ ] `service_design.md` `MenuService._validate_inventory_deduction` private 메서드 존재 여부 확인
- [ ] `schema.md` `recipe_ingredients` 테이블이 `inventory_items`를 FK로 참조하는지 확인 (재료 = 재고품목)

### 4. 재고 관련

- [ ] `feature_spec.md` FIFO 소비기한 관리(D-3 경고, D-1 긴급) 내용이 `schema.md` `inventory_lots.expiry_date` 컬럼으로 구현 가능한지 확인
- [ ] `api_spec.md` `GET /api/inventory/alerts` 응답의 `alert_status` ENUM 값(`LOW`, `EXPIRED_SOON`, `EMPTY`)이 `schema.md`의 로직과 일치하는지 확인
- [ ] `service_design.md` `InventoryService.deduct_stock` 메서드가 `SaleService.save_pos_sales`에서 호출되는 구조로 명시되어 있는지 확인
- [ ] `schema.md` `disposal_logs` 테이블의 비정규화 컬럼(`item_id`, `store_id`) 의도가 설계서에 주석으로 설명되어 있는지 확인

### 5. 판매 데이터 관련

- [ ] `api_spec.md` `POST /api/sales/upload` 요청이 `multipart/form-data`로 명시되어 있는지 확인
- [ ] `schema.md` `sale_records.source` ENUM 값(`POS`, `CSV`)이 `api_spec.md` `GET /api/sales/{sale_id}` 응답의 `source` 필드와 일치하는지 확인
- [ ] `service_design.md` `SaleService.save_pos_sales`가 `PosService.sync_pos`에서 호출되는 구조로 명시되어 있는지 확인

### 6. 수요예측/발주 관련

- [ ] `feature_spec.md` 신뢰도 낮음 기준(MAPE 20% 초과 / 학습 30일 미만 / 결측 30% 초과)이 `schema.md` `forecast_results.is_low_confidence`, `low_confidence_reason` 컬럼으로 저장 가능한지 확인
- [ ] `api_spec.md` `GET /api/forecast` 응답의 `is_low_confidence`, `low_confidence_reason` 필드 존재 여부 확인
- [ ] `schema.md` `orders.recommendation_id` NULL 허용으로 정의되어 있는지 확인 (수동 발주 대비)
- [ ] `api_spec.md` `POST /api/orders/{order_id}/automate` 실패 응답에 `manual_guide_url` 포함 여부 확인
- [ ] `api_spec.md` 발주 확정(`POST /api/orders/approve`)과 쿠팡 자동화(`POST /api/orders/{order_id}/automate`)가 **별도 엔드포인트**로 분리되어 있는지 확인 (자동 연결 아님)
- [ ] `service_design.md` 섹션 6 호출 흐름에 쿠팡 자동화가 `approve_order`와 독립적인 별도 흐름으로 명시되어 있는지 확인
- [ ] `schema.md` `order_recommendations.target_date DATE NOT NULL` 컬럼 존재 여부 확인

### 7. 쿠팡 단가/사이트 관련

- [ ] `schema.md` `sites` 테이블과 `inventory_item_sites` 테이블이 존재하는지 확인
- [ ] `api_spec.md` `GET /api/inventory/{item_id}` 응답에 `coupang_url`, `last_price` 필드 포함 여부 확인
- [ ] `api_spec.md`, `schema.md`, `service_design.md`에 `coupang_url`/`last_price`가 `inventory_item_sites` JOIN 결과임이 명시되어 있는지 확인 (`inventory_items` 직접 컬럼 아님)
- [ ] `service_design.md` `SiteScrapingService.scrape_prices_bulk`가 발주 확정 시 호출되는 구조로 명시되어 있는지 확인
- [ ] `service_design.md` 섹션 6에 coupang_url 최초 등록 시 `SiteScrapingService.scrape_price` 즉시 호출하는 흐름이 명시되어 있는지 확인

### 8. 파이프라인 관련

- [ ] `schema.md` `pipeline_jobs.type` ENUM 값(`FORECAST`, `TRAIN`)이 `api_spec.md` `POST /api/pipeline/run` 요청의 `type` 값과 일치하는지 확인
- [ ] `schema.md` `pipeline_jobs.status` ENUM 값(`QUEUED`, `RUNNING`, `DONE`, `FAILED`)이 `api_spec.md` `GET /api/pipeline/history` 응답의 `status` 값과 일치하는지 확인
- [ ] `schema.md` `pipeline_jobs.triggered_by ENUM('USER','N8N')` 컬럼이 존재하는지 확인
- [ ] `service_design.md` 섹션 6에 수동 파이프라인 실행 흐름이 명시되어 있는지 확인 (n8n 정기 배치와 독립)

### 9. 재고/폐기 관련

- [ ] `schema.md` `disposal_logs.user_id CHAR(36) NOT NULL` 컬럼 및 FK 존재 여부 확인
- [ ] `erd.md` Mermaid 다이어그램에 `users ||--o{ disposal_logs` 및 `stores ||--o{ disposal_logs` 관계가 모두 포함되어 있는지 확인
- [ ] `erd.md` 섹션 3 텍스트에 `users (1) ── (N) disposal_logs` 및 `stores (1) ── (N) disposal_logs`가 모두 포함되어 있는지 확인
- [ ] `service_design.md` `InventoryService.dispose` 파라미터에 `user_id`가 포함되어 있는지 확인

### 10. 온보딩/매장 관련

- [ ] `api_spec.md` 매장/POS API 목록에 `POST /api/store/onboarding/complete` 엔드포인트가 존재하는지 확인
- [ ] `feature_spec.md` 1.4 온보딩 출력에 `pos_mode`, `pos_linked`가 없는지 확인 (GET /api/store/pos/status로 대체됨)
- [ ] `service_design.md` `StoreService.complete_onboarding` 메서드가 존재하는지 확인

### 11. 데이터 내보내기/삭제 관련

- [ ] `api_spec.md`에 `GET /api/data/export` 및 `DELETE /api/data` 엔드포인트가 존재하는지 확인
- [ ] `service_design.md`에 `DataService.export_data` 및 `DataService.delete_data` 메서드가 존재하는지 확인

### 12. ERD-Schema 동기화

- [ ] `erd.md` Mermaid 다이어그램의 테이블 수와 `schema.md` CREATE TABLE 수가 일치하는지 확인
- [ ] `erd.md` 관계 구조가 `schema.md` FK 제약조건과 일치하는지 확인 (추가/제거된 FK 반드시 erd에 반영)

### 9. 인증/권한 관련

- [ ] `service_design.md` JWT payload에 `store_id` 포함 여부 명시 확인
- [ ] `service_design.md` 에러 코드 `AUTH_PASSWORD_NOT_ALLOWED`가 소셜 계정 비밀번호 변경 시도에 적용되는지 확인
- [ ] `schema.md` `refresh_tokens.token_hash` 저장 방식(해시값, 원문 미저장)이 `service_design.md`와 일치하는지 확인

### 10. ERD/Schema 일관성

- [ ] `erd.md` Mermaid 다이어그램의 테이블 수(21개)와 `schema.md` CREATE TABLE 수가 일치하는지 확인
- [ ] `erd.md` 관계 구조가 `schema.md` FK 제약 조건과 일치하는지 확인
- [ ] `schema.md` 인덱스 설계 요약 표의 항목이 실제 CREATE TABLE의 KEY 정의와 일치하는지 확인

---

## 검증 후 처리 방법

불일치 항목 발견 시:
1. 어느 문서가 확정된 내용을 기준으로 삼아야 하는지 판단
2. 기준 우선순위: `feature_spec.md` > `api_spec.md` > `schema.md` > `service_design.md`
3. 하위 문서를 상위 문서 기준에 맞게 수정
4. 수정 후 이 체크리스트에 수정 내용 기록

---

## 검증 기록

### 2026-05-07

01~05 전체 비판적 일관성 검토 수행. C-series(기능 정확성) 5건, S-series(구조적 불일치) 6건 발견 및 전부 수정.

**C-series 수정:**
- C-1: `coupang_url`/`last_price`가 `inventory_item_sites` JOIN 결과임을 `api_spec.md`, `schema.md`, `service_design.md` 전체에 명시
- C-2: `disposal_logs`에 `user_id` 컬럼 추가 (`schema.md`), ERD 관계 추가 (`erd.md`), `InventoryService.dispose` 파라미터에 `user_id` 추가 (`service_design.md`)
- C-3: `order_recommendations`에 `target_date DATE NOT NULL` 컬럼 추가 (`schema.md`)
- C-4: 쿠팡 자동화(`POST /api/orders/{order_id}/automate`)가 발주 확정과 독립된 별도 호출임을 `service_design.md` 섹션 6에 명시
- C-5: `DataService` 클래스 및 `export_data`, `delete_data` 메서드 추가 (`service_design.md`)

**S-series 수정:**
- S-1: `erd.md` Mermaid 다이어그램에 `stores ||--o{ disposal_logs` 관계 추가 (섹션 3에는 이미 있었음)
- S-2: `feature_spec.md` 1.4 온보딩 출력에서 `pos_mode`, `pos_linked` 제거 → `GET /api/store/pos/status`로 대체
- S-3: `api_spec.md`에 `POST /api/store/onboarding/complete` 엔드포인트 추가
- S-4: `service_design.md` 섹션 6에 coupang_url 최초 등록 시 즉시 단가 조회 흐름 추가
- S-5: `DashboardService.get_roi` 설명에 재고 회전율 계산 방식 명시 (총 소모량: 판매×레시피 파생, 평균 재고: 시작/종료 역산)
- S-6: `service_design.md` 섹션 6에 수동 파이프라인 실행 흐름 추가

**추가 작업:**
- `docs/prompts/06_ai_handoff.md` 전면 최신화 (AI Server API 추가, forecast_results/pipeline_jobs/order_recommendations 스키마 반영, 배치 흐름 상세화)
- `docs/prompts/writing_rules.md` 신규 작성 (SSOT 테이블, 작업 전/중/후 체크리스트, 연동 수정 맵)
- `CLAUDE.md` 신규 작성 (세션 자동 로드)

### 2026-05-06

- 검증 대상 5개 문서(`feature_spec.md`, `api_spec.md`, `schema.md`, `erd.md`, `service_design.md`)를 체크리스트 기준으로 교차 확인함.
- 수정 1: `docs/03_api/api_spec.md`의 `GET /api/menus`, `GET /api/menus/{menu_id}`, `PATCH /api/menus/{menu_id}` 예시에 `use_inventory_deduction` 필드를 추가하여 `feature_spec.md`의 "재고 차감 사용 여부"와 `schema.md`의 `menus.use_inventory_deduction` 컬럼에 맞춤.
- 수정 2: `docs/05_backend/service_design.md`에 "서비스 호출 흐름" 섹션을 추가하여 `PosService.sync_pos` → `SaleService.save_pos_sales`, `SaleService.save_pos_sales` → `InventoryService.deduct_stock`, `PipelineService.run_forecast_batch` → `OrderService.create_recommendations`, `OrderService.approve_order` → `SiteScrapingService.scrape_prices_bulk` 호출 구조를 명시함.
- 나머지 항목은 현재 문서 간 일관성이 확인됨.

---

## 알려진 미확정 항목 (검증 대상 아님)

아래 항목은 의도적으로 미확정 상태이므로 검증에서 제외하세요.

| 항목 | 위치 | 비고 |
|------|------|------|
| 경제지표/검색량/SNS 데이터 사용 여부 | ml_pipeline.md | AI 담당자가 확정 예정 |
| LightGBM → DNN 전환 기준 | model_spec.md | AI 담당자가 확정 예정 |
| Regression vs Classification 확정 | model_spec.md | AI 담당자가 확정 예정 |
| 07_flow, 08_nonfunctional, 09_mvp | 해당 파일들 | 아직 작업 미시작 |
