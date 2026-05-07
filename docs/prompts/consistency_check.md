# 01~09 문서 일관성 검증 프롬프트

## 이 프롬프트의 목적

`docs/01` ~ `docs/09` 문서들 간의 내용 불일치, 누락, 모순을 검출하고 수정합니다.
단, `docs/06_ai` 문서는 AI 담당자가 인수인계 후 작성할 예정이므로, 작성 완료 전까지는 확정 내용 검증 대상이 아니라 연동 예정 항목으로만 확인합니다.

---

## 검증 대상 파일

```
docs/01_requirements/requirements.md
docs/01_requirements/usecase_spec.md
docs/02_feature_design/feature_list.md
docs/02_feature_design/feature_spec.md
docs/03_api/api_spec.md
docs/04_database/schema.md
docs/04_database/erd.md
docs/05_backend/service_design.md
docs/06_ai/ml_pipeline.md              # 작성 예정: AI 담당자 인수인계 후 확정 검증
docs/06_ai/model_spec.md               # 작성 예정: AI 담당자 인수인계 후 확정 검증
docs/07_flow/sequence.md
docs/07_flow/user_flow.md
docs/08_nonfunctional/performance.md
docs/08_nonfunctional/security.md
docs/09_mvp/mvp_scope.md
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

### 11. 요구사항-기능 설계 일관성

- [ ] `requirements.md`의 기능 요구사항이 `feature_list.md`와 `feature_spec.md`에 누락 없이 반영되어 있는지 확인
- [ ] `usecase_spec.md`의 액터, 선행 조건, 기본 흐름, 예외 흐름이 `feature_spec.md`의 기능 흐름과 충돌하지 않는지 확인
- [ ] `requirements.md`의 비기능 요구사항이 `security.md`, `performance.md`에 분리되어 반영되어 있는지 확인
- [ ] `feature_list.md`의 기능 ID/명칭/범위가 `feature_spec.md`, `api_spec.md`, `service_design.md`의 모듈 구분과 일치하는지 확인
- [ ] 요구사항에서 제외 또는 보류된 항목이 `mvp_scope.md`의 MVP 제외 범위와 충돌하지 않는지 확인

### 12. API-화면/사용자 흐름 일관성

- [ ] `user_flow.md`의 주요 사용자 흐름마다 필요한 API가 `api_spec.md`에 존재하는지 확인
- [ ] `sequence.md`의 호출 순서가 `api_spec.md`의 엔드포인트, 요청/응답, 인증 요구사항과 일치하는지 확인
- [ ] `sequence.md`의 서비스 호출이 `service_design.md`의 서비스 메서드 및 호출 흐름과 일치하는지 확인
- [ ] `user_flow.md`에서 표시되는 상태값, 경고, 성공/실패 메시지가 `api_spec.md` 응답 필드 및 에러 코드로 표현 가능한지 확인
- [ ] 로그인, 온보딩, POS 연동, 판매 업로드, 재고 차감, 발주 확정, 쿠팡 자동화 흐름이 01~07 문서 전체에서 같은 순서와 책임으로 설명되는지 확인

### 13. AI/수요예측 설계 일관성

> `docs/06_ai` 작성 완료 전에는 아래 항목을 최종 불일치로 판단하지 말고, AI 담당자에게 전달할 인수인계/작성 확인 항목으로 기록하세요.

- [ ] `feature_spec.md`의 수요예측/발주 추천 기능이 `ml_pipeline.md`, `model_spec.md`의 입력, 출력, 학습/추론 흐름과 일치하는지 확인
- [ ] `api_spec.md`의 `GET /api/forecast`, `POST /api/pipeline/run`, `GET /api/pipeline/history` 요청/응답이 `ml_pipeline.md`의 파이프라인 입출력과 일치하는지 확인
- [ ] `schema.md`의 `forecast_results`, `pipeline_jobs`, `order_recommendations` 컬럼이 `ml_pipeline.md`, `model_spec.md`에서 필요한 데이터를 저장하기에 충분한지 확인
- [ ] `model_spec.md`의 모델 선택, 신뢰도 산정, 저신뢰 사유가 `feature_spec.md`, `api_spec.md`, `schema.md`의 저신뢰 기준과 충돌하지 않는지 확인
- [ ] `ml_pipeline.md`의 배치/수동 실행 구분이 `service_design.md`의 파이프라인 실행 흐름 및 n8n 연동 설명과 일치하는지 확인

### 14. 비기능 요구사항 일관성

- [ ] `security.md`의 인증, JWT, refresh token, 권한 정책이 `api_spec.md`, `schema.md`, `service_design.md`의 인증 설계와 일치하는지 확인
- [ ] `security.md`의 개인정보/데이터 삭제/내보내기 정책이 `api_spec.md`의 `GET /api/data/export`, `DELETE /api/data` 및 `service_design.md`의 `DataService`와 일치하는지 확인
- [ ] `performance.md`의 응답 시간, 배치 처리 시간, 대용량 처리 기준이 `api_spec.md`, `service_design.md`, `ml_pipeline.md`의 처리 방식과 충돌하지 않는지 확인
- [ ] `performance.md`에서 요구하는 인덱스, 캐싱, 비동기 처리 전략이 `schema.md`의 인덱스와 `service_design.md`의 구현 전략에 반영되어 있는지 확인
- [ ] 보안 또는 성능 요구사항 중 MVP에서 제외되는 항목이 있다면 `mvp_scope.md`에 명시되어 있는지 확인

### 15. MVP 범위 일관성

- [ ] `mvp_scope.md`의 포함 기능이 `requirements.md`, `feature_list.md`, `feature_spec.md`, `api_spec.md`, `service_design.md`에 모두 구현 대상으로 남아 있는지 확인
- [ ] `mvp_scope.md`의 제외 기능이 API, DB, 서비스, AI, 사용자 흐름 문서에서 필수 기능처럼 설명되지 않는지 확인
- [ ] `mvp_scope.md`의 단계별 범위가 `user_flow.md`, `sequence.md`의 사용자 흐름 범위와 일치하는지 확인
- [ ] MVP에 포함된 AI/예측 기능 수준이 `ml_pipeline.md`, `model_spec.md`의 구현 난이도와 일정상 충돌하지 않는지 확인
- [ ] MVP 범위 변경 시 영향을 받는 API, DB, 서비스, 화면 흐름, 비기능 문서가 함께 갱신되었는지 확인

### 16. 통합 번호/용어/상태값 일관성

- [ ] 01~09 전체 문서에서 동일 개념의 명칭이 일관되는지 확인 (`store`, `inventory_item`, `lot`, `order`, `recommendation`, `pipeline_job` 등)
- [ ] API enum, DB enum, 화면 표시 상태, AI 파이프라인 상태가 같은 의미로 매핑되는지 확인
- [ ] 문서 간 기능 번호, 섹션 번호, 참조 링크가 깨지거나 오래된 파일명을 가리키지 않는지 확인
- [ ] `docs/사주라_기술문서.md`가 01~09 문서의 최신 확정 내용을 요약하는 경우, 해당 요약이 원문과 충돌하지 않는지 확인
- [ ] 변경 후 `docs/prompts/writing_rules.md`, `docs/prompts/06_ai_handoff.md`에 남은 SSOT/인수인계 규칙이 01~09 최신 범위와 충돌하지 않는지 확인

---

## 검증 후 처리 방법

불일치 항목 발견 시:
1. 어느 문서가 확정된 내용을 기준으로 삼아야 하는지 판단
2. 기준 우선순위: `feature_spec.md` > `api_spec.md` > `schema.md` > `service_design.md`
3. 하위 문서를 상위 문서 기준에 맞게 수정
4. 수정 후 이 체크리스트에 수정 내용 기록

01~09 전체 검증 시:
1. 요구사항/유스케이스(`docs/01`)를 제품 범위의 최상위 기준으로 삼음
2. 기능 상세(`docs/02`) → API(`docs/03`) → DB(`docs/04`) → Backend(`docs/05`) → Flow(`docs/07`) → 비기능(`docs/08`) → MVP(`docs/09`) 순으로 확정 문서 영향 범위를 추적
3. 단, MVP 포함/제외 여부는 `mvp_scope.md`를 최종 범위 기준으로 삼고, 제외 기능이 다른 문서에서 필수 구현처럼 남아 있으면 수정
4. 보안/성능 요구사항은 `security.md`, `performance.md`를 기준으로 삼되, 실제 구현 가능성은 API/DB/Backend/AI 문서와 교차 확인
5. `docs/06_ai`는 AI 담당자 작성 전까지 수정하지 않고, 필요한 입력/출력/스키마/API 연동 요구사항만 인수인계 항목으로 기록
6. 수정 후 기존 검증 기록 아래에 날짜별로 수정 내용과 영향을 받은 파일을 추가 기록

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

### 2026-05-07 (5차)

01~09 전체 일관성 검증 수행 (06_ai 제외). 37개 세부 항목 검토, 불일치 4건 수정.

**수정 내용:**
- E-1 (erd.md): Mermaid 다이어그램에서 `inventory_items ||--o{ recipe_ingredients : "1:N"` 중복 선언 제거. `recipe_ingredients }o--|| inventory_items : "N:1"`(FK 방향)으로 단일 표현으로 정리.
- E-2 (sequence.md 섹션 2): 소셜 로그인 이후 사업자번호 검증 단계에서 존재하지 않는 `POST /api/auth/register` 호출 제거. 사업자번호+매장 정보를 `PATCH /api/store` 단일 호출로 통합 (서버 측에서 국세청 API 검증 수행).
- E-3 (sequence.md 섹션 2): POS 연동 엔드포인트 `POST /api/store/pos/link` → `POST /api/store/pos`로 수정 (api_spec.md 기준).
- E-4 (sequence.md 섹션 4): 추천발주 엔드포인트명 `GET /api/orders/recommendations` → `GET /api/orders/recommend`, `PATCH /api/orders/recommendations/{id}` → `PATCH /api/orders/recommend`으로 수정 (api_spec.md 기준).
- E-5 (api_spec.md, service_design.md): "데이터 내보내기·삭제(GDPR 대응)"가 mvp_scope.md 섹션 4에서 MVP 제외(2단계)로 분류되어 있으나 api_spec.md와 service_design.md에는 구현 대상으로 포함되어 있었음. 두 파일의 해당 섹션에 "MVP 제외 — 2단계 구현 예정" 주석 추가.

**주의 사항(⚠️):**
- `alert_status` 계산 기준(LOW 판단 임계치 등)이 service_design.md에 명시되지 않음 — 구현 시 `InventoryService.get_alerts` 메서드 설명에 추가 권장.
- sequence.md 섹션 7(소비기한 배치) 트리거 주체가 모호함 — 06_ai 인수인계 시 배치 분리 여부 확인 필요.

### 2026-05-07 (4차)

09_mvp 작성 수행 (`mvp_scope.md` 전면 재작성).

**mvp_scope.md 작성 내용:**
- 섹션 1 MVP 목표: 핵심 흐름(데이터 적재→예측→발주 추천→점주 승인→쿠팡 자동화) end-to-end 완성 목표 정의
- 섹션 2 1차 검증 업종: 주점 확정 (보유 POS 데이터 기반 CSV 업로드 방식)
- 섹션 3 MVP 포함 기능: 프로토타입·MVP 비교 표 (n8n 수동 트리거→자동 스케줄 전환, 앱 내 알림 MVP 추가)
- 섹션 4 MVP 제외 기능: POS API 연동, 주간 재학습 배치, ROI 대시보드, Cold-start, 다중 업종, GDPR 데이터 삭제 내보내기 유예
- 섹션 5 고도화 로드맵: 2단계·3단계 주요 기능 정의
- 섹션 6 데모 시나리오: 신규 점주 온보딩→당일 발주까지 Step 1~6 표 (확인 포인트 포함)
- 섹션 7 MVP 성공 기준: 기능 완성(5개 항목), 예측 품질(MAPE 30% 이하), 성능(API 200ms/캐시 300ms) 정의
- 섹션 8 데이터 확보 방식: 보유 주점 POS 데이터 CSV 변환 업로드, 30일 이상 데이터 확보 목표, 신뢰도 낮음 배지 예고
- 섹션 9 역할 분담: Frontend(정동욱·이민욱·임형택), AI Modeling(정동욱·이민욱·서창현), Backend(서창현·임형택), 파트 간 공유 책임 명시

### 2026-05-07 (3차)

08_nonfunctional 전체 작성 수행 (`security.md`, `performance.md`).

**security.md 수정:**
- 섹션 2 인증: Firebase 기준 제거 → Google·카카오 모두 Authlib OAuth 2.0 기준으로 재작성
- 섹션 2.3 토큰 정책 추가: Access Token·Refresh Token 역할·저장 위치·만료·Rotation·로그아웃 정책 명시
- 섹션 3.1 개인정보 수집 항목 추가: 필수 수집·이용 중 수집·미수집·보유 기간 정의
- 섹션 4.1 암호화 적용 대상 추가: AES-256(`pos_connections.api_key`), SHA-256(`refresh_tokens.token_hash`), 비적용 항목 이유 명시
- 섹션 5 접근 통제 전면 재작성: 레이어 1(사용자 단 — store_id 검증, RBAC 추후 확장)·레이어 2(DB·인프라 단 — app_user/n8n_user/dev_readonly/ops_readonly 계정 분리, VPN 경유) 분리 명시
- 섹션 5.3 감사 로그 대상 추가: order_approval_logs, disposal_logs, inventory_lots, pipeline_jobs

**performance.md 수정:**
- 섹션 1.1 API별 목표 응답 시간 추가: 일반 API 200ms / 예측 캐시 hit 300ms / 캐시 miss 5초 / Playwright 30초
- 섹션 1.2 동시 사용자·매장 수 기준 추가: MVP 50개 매장·20명 동시 접속, 단계별 확장 목표 정의
- 섹션 2.2 캐싱: Redis TTL 기반 캐싱 언급 추가, 상세는 service_design.md 섹션 9 참조 처리
- 섹션 2.4 배치 처리 SLA 추가: 예측 배치 3시간 내, 재학습 배치 4시간 내, 실패 시 처리 정책 명시
- 섹션 2.5 Playwright 타임아웃 추가: 품목당 10초·전체 30초, 재시도 없음 (feature_spec.md 7.2 기준)
- 성능 리스크 표: Playwright 항목 재시도 정책 수정

### 2026-05-07 (2차)

07_flow 전체 작성 수행 (`user_flow.md`, `sequence.md`).

**user_flow.md 수정:**
- 섹션 2 핵심 사용 흐름: POS 연동 성공/실패 분기, 쿠팡 자동화 전체/부분/전체 실패 분기 추가
- 섹션 3 온보딩 흐름: Firebase 기준 제거 → Authlib OAuth 2.0 기준으로 재작성, 사업자등록번호 국세청 API 검증 단계 추가, POS 실패 → CSV 임시 모드 분기 추가
- 섹션 5·6: 신규 입고(로트 추가)·수정 사유 보강, 재고 차감 경고·소프트 삭제 내용 추가
- 신규 섹션 9~15 추가: 화면 IA, 대시보드/ROI 조회, 소비기한 관리, 알림 수신, 쿠팡 자동화 실패 분기, 리드타임/안전재고 설정, 설정 관리

**sequence.md 수정:**
- 섹션 2 회원가입 시퀀스: Firebase 기준 전면 재작성 → Authlib OAuth 2.0 기준, 사업자번호 검증, POS 실패 분기, `POST /api/store/onboarding/complete` 호출 포함
- 섹션 3 수요예측: n8n 배치 주도 역할 명시, 캐시 없음 시 Backend 단건 호출 분기 추가
- 섹션 4 발주요청: 발주 확정(`POST /api/orders/approve`)과 쿠팡 자동화(`POST /api/orders/{order_id}/automate`) 별도 엔드포인트 분리 명시, 전체/부분/전체 실패 분기 추가
- 신규 섹션 5~8 추가: 야간 배치 파이프라인 (n8n 주도), 재고 자동 차감 FIFO, 소비기한 배치·알림, Refresh Token 갱신

### 2026-05-06

- 검증 대상 5개 문서(`feature_spec.md`, `api_spec.md`, `schema.md`, `erd.md`, `service_design.md`)를 체크리스트 기준으로 교차 확인함.
- 수정 1: `docs/03_api/api_spec.md`의 `GET /api/menus`, `GET /api/menus/{menu_id}`, `PATCH /api/menus/{menu_id}` 예시에 `use_inventory_deduction` 필드를 추가하여 `feature_spec.md`의 "재고 차감 사용 여부"와 `schema.md`의 `menus.use_inventory_deduction` 컬럼에 맞춤.
- 수정 2: `docs/05_backend/service_design.md`에 "서비스 호출 흐름" 섹션을 추가하여 `PosService.sync_pos` → `SaleService.save_pos_sales`, `SaleService.save_pos_sales` → `InventoryService.deduct_stock`, `PipelineService.run_forecast_batch` → `OrderService.create_recommendations`, `OrderService.approve_order` → `SiteScrapingService.scrape_prices_bulk` 호출 구조를 명시함.
- 나머지 항목은 현재 문서 간 일관성이 확인됨.

---

## 알려진 미확정 항목

아래 AI 문서 및 세부 항목은 AI 담당자가 인수인계 후 작성/확정할 예정이므로 작성 완료 전까지 확정 검증에서 제외하세요.
단, 07~09 문서는 01~09 확장 이후 현재 검증 대상에 포함합니다.

| 항목 | 위치 | 비고 |
|------|------|------|
| 경제지표/검색량/SNS 데이터 사용 여부 | ml_pipeline.md | AI 담당자가 확정 예정 |
| LightGBM → DNN 전환 기준 | model_spec.md | AI 담당자가 확정 예정 |
| Regression vs Classification 확정 | model_spec.md | AI 담당자가 확정 예정 |
| 06_ai 문서 전체 | ml_pipeline.md, model_spec.md | 다른 인원이 인수인계 받아 작성 예정. 작성 완료 전까지는 수정하지 않고 연동 요구사항만 기록 |
| 07_flow, 08_nonfunctional, 09_mvp | 해당 파일들 | 2026-05-07 이전 기록: 당시 작업 미시작. 01~09 검증 확장 이후에는 검증 대상에 포함 |
