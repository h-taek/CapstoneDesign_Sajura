# 01~09 문서 일관성 검증 프롬프트

## 이 프롬프트의 목적

`docs/spec/01` ~ `docs/spec/09` 문서들 간의 내용 불일치, 누락, 모순을 검출하고 수정합니다.
단, `docs/spec/08_ai` 문서는 AI 담당자가 인수인계 후 작성할 예정이므로, 작성 완료 전까지는 확정 내용 검증 대상이 아니라 연동 예정 항목으로만 확인합니다.

---

## 검증 대상 파일

```
docs/spec/01_requirements/requirements.md
docs/spec/01_requirements/usecase_spec.md
docs/spec/03_feature_design/feature_list.md
docs/spec/03_feature_design/feature_spec.md
docs/spec/05_api/api_spec.md
docs/spec/06_database/schema.md
docs/spec/06_database/erd.md
docs/spec/07_backend/service_design.md
docs/spec/07_frontend/frontend_design.md
docs/spec/08_ai/ml_pipeline.md              # 작성 예정: AI 담당자 인수인계 후 확정 검증
docs/spec/08_ai/model_spec.md               # 작성 예정: AI 담당자 인수인계 후 확정 검증
docs/spec/04_flow/sequence.md
docs/spec/04_flow/user_flow.md
docs/spec/09_nonfunctional/performance.md
docs/spec/09_nonfunctional/security.md
docs/spec/02_mvp/mvp_scope.md
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

> `docs/spec/08_ai` 작성 완료 전에는 아래 항목을 최종 불일치로 판단하지 말고, AI 담당자에게 전달할 인수인계/작성 확인 항목으로 기록하세요.

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
- [ ] `mvp_scope.md`의 제외 기능이 API, DB, 서비스, AI, 사용자 흐름 문서에서 필수 기능처럼 설명되지 않는지 확인 — **모든 2단계 항목에 `[2단계]` 배지 또는 `> MVP 범위 외` 안내문이 부착되어 있어야 함**
- [ ] `mvp_scope.md`의 단계별 범위가 `user_flow.md`, `sequence.md`의 사용자 흐름 범위와 일치하는지 확인
- [ ] MVP에 포함된 AI/예측 기능 수준이 `ml_pipeline.md`, `model_spec.md`의 구현 난이도와 일정상 충돌하지 않는지 확인
- [ ] MVP 범위 변경 시 영향을 받는 API, DB, 서비스, 화면 흐름, 비기능 문서가 함께 갱신되었는지 확인

#### 15-1. MVP 정책 전환 시 동시 점검 파일 (체크리스트 게이트)

> `mvp_scope.md` 변경 또는 데이터 소스 정책(POS API ↔ CSV) 전환 시, 아래 7개 파일을 동일 PR에서 일괄 갱신해야 한다. 한 파일이라도 누락되면 16차 audit 이후 발생했던 "MVP 데모가 spec상 불가능" 유형의 표류가 재발한다.

- [ ] `01_requirements/requirements.md` §5 — POS/CSV 정책 반영
- [ ] `01_requirements/usecase_spec.md` UC-01 — 기본 흐름·대안 흐름 일치
- [ ] `03_feature_design/feature_spec.md` §1.4 (온보딩) / §4 (POS 연동) / §5 (수요예측 데이터 소스별 동작) / §12 (화면)
- [ ] `04_flow/user_flow.md` §2 텍스트 다이어그램 + §3 온보딩 단계
- [ ] `04_flow/sequence.md` 온보딩·예측 시퀀스
- [ ] `05_api/api_spec.md` 영향받는 endpoint의 [MVP]/[2단계] 라벨
- [ ] `07_backend/service_design.md` 영향받는 Service의 단계 라벨 + §6 호출 흐름

#### 15-2. 단계 라벨링 규칙

- 모든 spec 문서의 기능·메서드·endpoint·화면 구성요소는 `[MVP]` 또는 `[2단계]` 배지 중 하나를 받는다. 라벨 없는 항목은 기본 [MVP]로 간주한다.
- 2단계 섹션 헤더에는 `### X.Y 기능명 [2단계]` 형식 + 바로 아래 `> MVP 범위 외 — mvp_scope.md §4 참조` 안내문을 부착한다.
- 표 내 항목 라벨링은 별도 "단계" 컬럼을 추가한다 (api_spec endpoints 표·service_design 메서드 표 패턴 따름).

### 16. Frontend spec 일관성

- [ ] `frontend_design.md` §1 기술 스택이 `docs/research/SUMMARY.md` §11~18과 일치하는지 확인 (중복 정의 없이 참조 관계 유지)
- [ ] `frontend_design.md` §2 인증 정책이 `security.md` §2·`api_spec.md` §2와 일치하는지 확인 (메모리 Access Token / HttpOnly Refresh Cookie / 302 redirect)
- [ ] `frontend_design.md` §3 라우팅 가드가 `user_flow.md`·`feature_spec.md` §12 화면 IA와 일치하는지 확인
- [ ] `frontend_design.md` §5 PWA·Web Push가 `feature_spec.md` §11 알림 정책과 일치하는지 확인 (5분 폴링·VAPID inline)
- [ ] `frontend_design.md` §9 Caddy 자체 빌드가 `service_design.md` §11.1과 일치하는지 확인
- [ ] `frontend_design.md` §11 MVP/2단계 매핑이 `mvp_scope.md` §3·§4와 일치하는지 확인

### 16. 통합 번호/용어/상태값 일관성

- [ ] 01~09 전체 문서에서 동일 개념의 명칭이 일관되는지 확인 (`store`, `inventory_item`, `lot`, `order`, `recommendation`, `pipeline_job` 등)
- [ ] API enum, DB enum, 화면 표시 상태, AI 파이프라인 상태가 같은 의미로 매핑되는지 확인
- [ ] 문서 간 기능 번호, 섹션 번호, 참조 링크가 깨지거나 오래된 파일명을 가리키지 않는지 확인
- [ ] `docs/사주라_기술문서.md`가 01~09 문서의 최신 확정 내용을 요약하는 경우, 해당 요약이 원문과 충돌하지 않는지 확인
- [ ] 변경 후 `docs/README.md`(SSOT 테이블·파일 맵), `docs/spec/prompts/08_ai_handoff.md`(인수인계 규칙)이 01~09 최신 범위와 충돌하지 않는지 확인

---

## 검증 후 처리 방법

불일치 항목 발견 시:
1. 어느 문서가 확정된 내용을 기준으로 삼아야 하는지 판단
2. 기준 우선순위: `feature_spec.md` > `api_spec.md` > `schema.md` > `service_design.md`
3. 하위 문서를 상위 문서 기준에 맞게 수정
4. 수정 후 이 체크리스트에 수정 내용 기록

01~09 전체 검증 시:
1. 요구사항/유스케이스(`docs/spec/01`)를 제품 범위의 최상위 기준으로 삼음
2. 기능 상세(`docs/spec/02`) → API(`docs/spec/03`) → DB(`docs/spec/04`) → Backend(`docs/spec/05`) → Flow(`docs/spec/07`) → 비기능(`docs/spec/08`) → MVP(`docs/spec/09`) 순으로 확정 문서 영향 범위를 추적
3. 단, MVP 포함/제외 여부는 `mvp_scope.md`를 최종 범위 기준으로 삼고, 제외 기능이 다른 문서에서 필수 구현처럼 남아 있으면 수정
4. 보안/성능 요구사항은 `security.md`, `performance.md`를 기준으로 삼되, 실제 구현 가능성은 API/DB/Backend/AI 문서와 교차 확인
5. `docs/spec/08_ai`는 AI 담당자 작성 전까지 수정하지 않고, 필요한 입력/출력/스키마/API 연동 요구사항만 인수인계 항목으로 기록
6. 수정 후 `PROGRESS.md` 섹션 4에 날짜별로 수정 내용과 영향받은 파일을 추가 기록

---

## 알려진 미확정 항목

아래 AI 문서 및 세부 항목은 AI 담당자가 인수인계 후 작성/확정할 예정이므로 작성 완료 전까지 확정 검증에서 제외하세요.
단, 07~09 문서는 01~09 확장 이후 현재 검증 대상에 포함합니다.

| 항목 | 위치 | 비고 |
|------|------|------|
| 경제지표/검색량/SNS 데이터 사용 여부 | ml_pipeline.md | AI 담당자가 확정 예정 |
| LightGBM → DNN 전환 기준 | model_spec.md | AI 담당자가 확정 예정 |
| Regression vs Classification 확정 | model_spec.md | AI 담당자가 확정 예정 |
| 08_ai 문서 전체 | ml_pipeline.md, model_spec.md | 다른 인원이 인수인계 받아 작성 예정. 작성 완료 전까지는 수정하지 않고 연동 요구사항만 기록 |
| 04_flow, 09_nonfunctional, 02_mvp | 해당 파일들 | 2026-05-07 이전 기록: 당시 작업 미시작. 01~09 검증 확장 이후에는 검증 대상에 포함 |
