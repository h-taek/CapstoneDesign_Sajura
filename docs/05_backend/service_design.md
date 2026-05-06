# Backend 서비스 설계서

## 1. 기술 스택

| 라이브러리 | 역할 |
|-----------|------|
| **FastAPI** | HTTP 요청/응답 처리, 라우팅, Swagger 자동 문서화 |
| **SQLAlchemy (async)** | Python 객체로 DB를 조작하는 ORM. 직접 SQL 대신 Python 코드로 쿼리 작성 |
| **aiomysql** | SQLAlchemy가 MySQL과 실제로 통신하는 async 드라이버 |
| **python-jose** | JWT Access Token 생성 및 검증 |
| **passlib (bcrypt)** | 이메일 로그인용 비밀번호 bcrypt 해싱 |
| **Authlib** | Google/카카오 OAuth 2.0 흐름 처리 (인가 URL 생성, 코드 교환, 사용자 정보 조회) |
| **Playwright (async)** | 쿠팡 장바구니 자동 담기 및 단가 조회용 브라우저 자동화 |
| **Alembic** | DB 스키마 변경 이력 관리 및 자동 마이그레이션 |
| **httpx** | AI Server 호출용 async HTTP 클라이언트 |
| **Redis** | 수요예측 결과 캐싱 + Refresh Token 블랙리스트 관리 |

### 외부 운영 도구

| 도구 | 역할 |
|------|------|
| **n8n** | GUI 기반 배치 오케스트레이션 (스케줄 트리거, DB 직접 조회/저장, 외부 API 수집, 데이터 전처리/정규화, AI Server 호출, 재시도, Slack 알림) |

---

## 2. 계층 구조

### 2.1 Controller
- HTTP 요청 수신
- 파라미터 파싱 및 검증
- JSON 응답 직렬화
- 에러 핸들링

### 2.2 Service
- 비즈니스 로직 실행
- 트랜잭션 관리
- 권한 검사
- 캐시 조회 및 무효화
- 외부 서비스 호출 조율 (AIServerClient, Playwright)
- 로깅

### 2.3 Model (Repository)
- ORM 매핑
- DB CRUD
- 쿼리 실행

---

## 3. 서비스 클래스 목록

| 클래스 | 담당 도메인 |
|--------|------------|
| `AuthService` | 로그인, 회원가입, JWT 발급, OAuth 처리 |
| `StoreService` | 매장 정보 CRUD, 온보딩 완료 처리 |
| `PosService` | POS 연동, 동기화, 상태 관리 |
| `MenuService` | 메뉴 CRUD, 레시피 관리 |
| `InventoryService` | 재고 품목, 로트, 폐기, 경고, FIFO 차감 |
| `SaleService` | 판매 데이터 조회, CSV 업로드, POS 판매 저장 |
| `ForecastService` | 저장된 수요예측 결과 조회, 점주/관리자 수동 예측 실행 보조 |
| `OrderService` | 저장된 추천발주 조회, 점주 수정안 저장, 발주 확정, 승인 이력 |
| `AutomationService` | Playwright 쿠팡 장바구니 자동화 |
| `SiteScrapingService` | Playwright 쿠팡 단가 조회 |
| `DashboardService` | 대시보드 집계, ROI, 폐기 현황 |
| `PipelineService` | 파이프라인 실행 이력 조회 및 상태 표시 |
| `DataService` | 데이터 CSV 내보내기, 전체 데이터 삭제 |
| `AIServerClient` | AI Server HTTP 통신 (인프라 레이어) |

> `AIServerClient`는 Service가 아닌 인프라 레이어 클라이언트. ForecastService → AIServerClient 의존성으로 DIP 만족.

---

## 4. 서비스별 주요 메서드

### AuthService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `register` | email, password, name, business_no, store_name | `UserDTO` | 회원가입 + 국세청 검증 (응답에 onboarding_completed: false 포함) |
| `login_with_email` | email, password | `TokenDTO` | 이메일 로그인 |
| `login_with_oauth` | provider, code, state | `TokenDTO` | Google/카카오 OAuth 로그인 |
| `logout` | user_id, refresh_token_hash | `None` | Refresh Token 무효화 |
| `refresh_token` | refresh_token | `TokenDTO` | Access Token 재발급 + Rotation |
| `get_me` | user_id | `UserDTO` | 내 정보 조회 |
| `update_me` | user_id, data | `UserDTO` | 일반 정보 수정 |
| `change_password` | user_id, current_password, new_password | `None` | LOCAL 계정 전용 |
| `delete_account` | user_id, password | `None` | 회원 탈퇴 |

### StoreService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `get_store` | user_id | `StoreDTO` | 매장 정보 조회 |
| `update_store` | user_id, data | `StoreDTO` | 매장 정보 수정 (business_type, store_size, operation_type 포함) |
| `complete_onboarding` | store_id | `None` | 온보딩 완료 처리 (onboarding_completed = true) |

### PosService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `get_pos` | store_id | `PosDTO` | POS 연동 정보 조회 |
| `connect_pos` | store_id, pos_type, api_key, store_code | `PosDTO` | POS 연동 등록 |
| `update_pos` | store_id, data | `PosDTO` | POS 연동 정보 수정 |
| `disconnect_pos` | store_id | `None` | POS 연동 해제 |
| `sync_pos` | store_id | `SyncResultDTO` | POS 원본 데이터를 공통 판매 스키마로 변환하고 SaleService.save_pos_sales 호출 |
| `get_pos_status` | store_id | `PosStatusDTO` | 연동 상태 조회 |

### MenuService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `get_menus` | store_id, filters | `PaginatedDTO[MenuDTO]` | 메뉴 목록 조회 |
| `create_menu` | store_id, data | `MenuDTO` | 메뉴 등록 + 삭제되지 않은 메뉴 대상 중복명 검증 + 레시피 저장 |
| `create_menus_bulk` | store_id, menus | `BulkResultDTO` | POS 연동 시 메뉴 일괄 등록 |
| `get_menu` | menu_id | `MenuDTO` | 메뉴 상세 조회 |
| `update_menu` | menu_id, data | `MenuDTO` | 메뉴 수정 |
| `delete_menu` | menu_id | `None` | 메뉴 소프트 삭제 (is_deleted=true, deleted_at 기록) |
| `get_recipe` | menu_id | `RecipeDTO` | 레시피 조회 |
| `upsert_recipe` | menu_id, ingredients | `RecipeDTO` | 레시피 등록/전체 수정 |
| `delete_recipe` | menu_id | `None` | 레시피 삭제 |
| `_validate_inventory_deduction` | use_deduction, ingredients | `None` | 재고 차감 ON + 레시피 미입력 시 경고 (private) |

### InventoryService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `get_items` | store_id, filters | `PaginatedDTO[InventoryItemDTO]` | 재고 목록 조회 |
| `create_item` | store_id, data | `InventoryItemDTO` | 재고 품목 등록 (lead_time_days, safety_stock 선택 입력) |
| `get_item` | item_id | `InventoryItemDTO` | 재고 품목 상세 조회 (inventory_item_sites JOIN → coupang_url, last_price 포함. 미등록 시 null) |
| `update_item` | item_id, data | `InventoryItemDTO` | 재고 품목 수정 (low_stock_threshold, lead_time_days, safety_stock 포함). coupang_url 변경 시 inventory_item_sites 쿠팡 레코드 UPSERT |
| `delete_item` | item_id | `None` | 재고 품목 삭제 |
| `add_lot` | item_id, data | `LotDTO` | 입고 등록 (로트 추가) |
| `get_lots` | item_id | `LotListDTO` | 로트 목록 조회 |
| `update_lot` | item_id, lot_id, data, user_id | `AdjustmentLogDTO` | 기존 로트 수량/소비기한 수정 + 조정 이력 기록 |
| `dispose` | item_id, lot_id, quantity, reason, user_id | `DisposalResultDTO` | 폐기 처리 + 잔여수량 검증 + 폐기 이력 기록 (user_id 포함) |
| `get_alerts` | store_id | `AlertListDTO` | 부족/소비기한 경고 조회 |
| `get_summary` | store_id | `InventorySummaryDTO` | 재고 현황 요약 |
| `deduct_stock` | item_id, quantity | `None` | FIFO 재고 차감 (SaleService 내부 호출용) |

### SaleService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `get_sales` | store_id, filters | `PaginatedDTO[SaleDTO]` | 판매 내역 목록 조회 |
| `get_sale` | sale_id | `SaleDTO` | 판매 내역 상세 조회 |
| `get_summary` | store_id, start_date, end_date | `SaleSummaryDTO` | 기간별 판매 요약 |
| `get_trends` | store_id, menu_id, group_by, start_date, end_date | `TrendDTO` | 메뉴별 판매 추세 |
| `upload_csv` | store_id, file, column_mapping | `UploadResultDTO` | CSV 업로드 + 파싱 + 저장 |
| `save_pos_sales` | store_id, records | `None` | POS 공통 판매 스키마를 menu_name → menu_id로 매핑 후 판매 데이터 일괄 저장 |

### ForecastService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `get_forecast` | store_id, target_date | `ForecastDTO` | 저장된 예측 결과 조회 |
| `run_forecast` | store_id, target_date | `ForecastDTO` | 점주/관리자 수동 예측 실행 보조 |
| `get_shap` | store_id, menu_id, target_date | `ShapDTO` | 저장된 XAI 설명 조회 또는 AI Server 상세 SHAP 요청 |

### OrderService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `get_recommendations` | store_id | `RecommendationDTO` | 최신 추천발주 조회 (inventory_item_sites JOIN → 품목별 coupang_url 포함) |
| `update_adjustments` | store_id, adjustments | `RecommendationDTO` | 점주 수정안 저장 |
| `approve_order` | store_id, items, note | `OrderDTO` | 발주 확정 + 승인 이력 기록 |
| `get_orders` | store_id, filters | `PaginatedDTO[OrderDTO]` | 발주 내역 목록 조회 |
| `get_order` | order_id | `OrderDTO` | 발주 내역 상세 조회 |
| `get_approval_log` | order_id | `ApprovalLogDTO` | 발주 수정 이력 조회 |

### AutomationService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `automate_coupang` | order_id | `AutomationResultDTO` | 쿠팡 장바구니 자동 담기 실행 |
| `update_order_status` | order_id, result | `None` | 자동화 결과에 따라 발주 상태 업데이트 (내부 호출용) |

### SiteScrapingService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `scrape_price` | item_id, site_id | `PriceDTO` | 품목 단가 단건 조회 |
| `scrape_prices_bulk` | store_id | `None` | 매장 전체 품목 단가 일괄 갱신 (발주 확정 시 호출) |

### DashboardService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `get_dashboard` | store_id | `DashboardDTO` | 전체 요약 집계 |
| `get_roi` | store_id, start_month, end_month | `RoiDTO` | 기간별 ROI 집계 (폐기 비용·폐기율·재고 회전율·MAPE) 및 월별 추세 반환. 재고 회전율 = 기간 내 총 소모량 / 평균 재고 수량. 총 소모량은 `sale_records × recipe_ingredients`로 파생, 평균 재고 수량은 (기간 시작 재고 + 기간 종료 재고) / 2로 근사 (시작 재고 = 종료 재고 + 소모량 + 폐기량 - 입고량으로 역산) |
| `get_waste` | store_id, start_date, end_date | `WasteDTO` | 기간별 폐기 현황 |

### PipelineService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `get_status` | store_id | `PipelineStatusDTO` | 최근 n8n 배치 실행 상태 조회 |
| `run_pipeline` | store_id, type | `PipelineJobDTO` | 점주/관리자 수동 실행 요청 처리 |
| `get_history` | store_id, filters | `PaginatedDTO[PipelineJobDTO]` | n8n 배치 실행 이력 조회 |

### DataService

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `export_data` | store_id, type, start_date, end_date | `CsvStream` | 판매/재고/발주 데이터를 CSV로 내보내기 (type: sales, inventory, orders) |
| `delete_data` | store_id, type | `None` | 매장 데이터 일괄 삭제 (type: ALL, SALES, INVENTORY, ORDERS). 비가역적 작업이므로 confirm 필드 필수 검증 |

### AIServerClient (인프라 레이어)

> Backend의 점주/관리자 수동 실행 보조용 AI Server 클라이언트이다. n8n 정기 배치에서는 n8n이 AI Server API를 직접 호출한다.

| 메서드 | 파라미터 | 반환 | 설명 |
|--------|----------|------|------|
| `predict` | store_id, target_date, input_data | `PredictionResultDTO` | 수요예측 실행 요청 |
| `recommend_order` | store_id, target_date, forecast_results, recipes, inventory | `RecommendationResultDTO` | 추천발주 생성 요청 |
| `train` | store_id, training_data | `TrainJobDTO` | 모델 재학습 요청 |
| `get_job_status` | job_id | `JobStatusDTO` | 작업 상태 조회 |
| `get_shap` | store_id, menu_id, target_date | `ShapDTO` | SHAP 설명 생성 요청 |
| `health_check` | - | `HealthDTO` | AI Server 상태 확인 |

---

## 5. 트랜잭션 경계

| 서비스.메서드 | 트랜잭션 범위 | 이유 |
|--------------|--------------|------|
| `AuthService.register` | users + stores | 유저 생성 후 매장 생성 실패 시 불일치 방지 |
| `MenuService.create_menu` | menus + recipes + recipe_ingredients | 메뉴 저장 후 레시피 저장 실패 시 레시피 없는 메뉴 방지 |
| `MenuService.upsert_recipe` | recipes + recipe_ingredients 전체 교체 | 기존 재료 삭제 후 새 재료 저장 실패 시 레시피 소실 방지 |
| `MenuService.delete_menu` | menus | 메뉴 삭제 상태와 삭제 시각을 원자적으로 기록 |
| `InventoryService.update_lot` | inventory_lots + inventory_adjustment_logs | 로트 수정과 조정 이력 기록은 원자적으로 처리 |
| `InventoryService.dispose` | inventory_lots + disposal_logs | 수량 차감과 폐기 이력 기록은 원자적으로 처리 |
| `SaleService.upload_csv` | sale_records 일괄 저장 | 중간 실패 시 부분 적재 방지 |
| `SaleService.save_pos_sales` | sale_records + inventory_lots (FIFO 차감) | 판매 저장과 재고 차감이 함께 성공/실패해야 함 |
| `OrderService.approve_order` | orders + order_items + order_approval_logs | 발주 확정과 이력 기록은 원자적으로 처리 |

---

## 6. 서비스 호출 흐름

| 흐름 | 호출 구조 | 설명 |
|------|-----------|------|
| POS 동기화 | `PosService.sync_pos` → POS Adapter → 공통 판매 스키마 → `SaleService.save_pos_sales` | POS 원본 데이터를 표준 판매 데이터로 변환하고 menu_name을 menu_id로 매핑해 저장 |
| 판매 저장 후 재고 차감 | `SaleService.save_pos_sales` → `InventoryService.deduct_stock` | 판매 메뉴의 레시피를 기준으로 재고 로트를 FIFO 차감 |
| n8n 예측/추천발주 워크플로우 | n8n → DB 조회 → 외부 API 수집 → 전처리/정규화 → AI Server `/ai/forecast/predict` → AI Server `/ai/orders/recommend` → DB 저장 | n8n이 배치 실행, DB 직접 조회/저장, 외부 API 수집, 데이터 전처리/정규화, 재시도, 알림을 담당 |
| n8n 재학습 워크플로우 | n8n → DB 조회 → AI Server `/ai/forecast/train` → AI Server `/ai/forecast/status` polling → DB 상태 갱신 | n8n이 주간 재학습 흐름과 재시도를 오케스트레이션 |
| 발주 확정 후 단가 갱신 | `OrderService.approve_order` → `SiteScrapingService.scrape_prices_bulk` | 발주 확정 시 쿠팡 등 연결 사이트의 최신 단가를 일괄 갱신 |
| 초기 단가 자동 조회 | `InventoryService.update_item`(coupang_url 설정 시) → `inventory_item_sites` UPSERT → `SiteScrapingService.scrape_price` | 재고 품목에 coupang_url이 처음 등록될 때 즉시 단가를 조회하여 `inventory_item_sites.last_price`에 저장. 온보딩 초기 재고 등록 시에도 동일하게 적용 |
| 쿠팡 자동 담기 | Frontend `POST /api/orders/{order_id}/automate` → `AutomationService.automate_coupang` → Playwright → `AutomationService.update_order_status` | 발주 확정(`approve_order`)과 독립적인 별도 요청. 점주가 확정 후 명시적으로 자동화 버튼을 눌러야 실행됨. 성공 시 `AUTOMATED`, 실패 시 `MANUAL_REQUIRED` + 수동 URL 안내 |
| 수동 파이프라인 실행 | Frontend `POST /api/pipeline/run` → `PipelineService.run_pipeline` → `pipeline_jobs` 생성 → `AIServerClient.predict` 또는 `AIServerClient.train` 호출 → `pipeline_jobs.status` 갱신 | n8n 정기 배치와 독립적으로 점주/관리자가 직접 예측 또는 재학습을 트리거할 때 사용. 동일 타입 실행 중이면 `PIPELINE_ALREADY_RUNNING` 반환 |

---

## 7. 권한 검사 정책

### 검사 레벨

| 레벨 | 설명 | 적용 위치 |
|------|------|-----------|
| 인증 확인 | Access Token 유효성 검증 | 모든 보호 endpoint |
| 소유권 확인 | 요청 리소스가 자신의 매장 소속인지 검증 | 리소스 조회/수정/삭제 시 |
| 계정 타입 확인 | LOCAL 계정 전용 기능 제한 | `change_password` |

### JWT payload 구조

```json
{
  "sub": "user_id",
  "store_id": "uuid",
  "exp": 1234567890
}
```

> store_id를 payload에 포함하여 매 요청마다 DB 조회 없이 소유권 확인 가능.

### 소유권 확인 방식

```
요청 수신
  → Access Token 디코딩 → store_id 추출
  → 리소스의 store_id == token.store_id 확인
  → 불일치 시 403 FORBIDDEN 반환
```

### DB 계정 접근 정책

DB 직접 접근은 용도별 전용 계정으로 분리한다. 개발자·운영팀의 DB 직접 접근은 VPN 또는 배스천 호스트를 경유한다.

| 계정 | 용도 | 권한 요약 |
|---|---|---|
| `app_user` | Backend 애플리케이션 | SELECT, INSERT, UPDATE, DELETE (DDL 없음) |
| `n8n_user` | n8n 배치 워크플로우 | SELECT(조회), INSERT/UPDATE(배치 산출물), DELETE 없음 |
| `dev_readonly` | 개발자 디버깅·조회 | SELECT (전체 테이블), VPN 경유 필수 |
| `ops_readonly` | 운영팀 모니터링 | SELECT (`pipeline_jobs`, `stores` 집계), VPN 경유 필수 |

**n8n_user 권한 상세**

| 권한 | 테이블 |
|---|---|
| SELECT | `stores`, `menus`, `recipes`, `recipe_ingredients`, `inventory_items`, `inventory_lots`, `sale_records`, `forecast_results`, `order_recommendations`, `order_recommendation_items`, `order_approval_logs` |
| INSERT | `pipeline_jobs`, `forecast_results`, `order_recommendations`, `order_recommendation_items` |
| UPDATE | `pipeline_jobs` |
| DELETE | 없음 |

n8n은 운영 데이터 원본을 삭제하지 않는다. n8n의 쓰기 대상은 배치 산출물과 실행 이력 테이블로 제한한다.

### 리소스별 소유권 확인 대상

| 리소스 | 확인 방법 |
|--------|-----------|
| `menus`, `recipes` | `menus.store_id == token.store_id` |
| `inventory_items`, `inventory_lots` | `inventory_items.store_id == token.store_id` |
| `sale_records` | `sale_records.store_id == token.store_id` |
| `orders`, `order_items` | `orders.store_id == token.store_id` |
| `forecast_results` | `forecast_results.store_id == token.store_id` |
| `pipeline_jobs` | `pipeline_jobs.store_id == token.store_id` |

---

## 8. 에러 코드 체계

### 공통

| 코드 | HTTP | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 토큰 없음 또는 만료 |
| `FORBIDDEN` | 403 | 다른 매장 리소스 접근 시도 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 요청 파라미터 형식 오류 |
| `INTERNAL_SERVER_ERROR` | 500 | 예상치 못한 서버 오류 |
| `SERVICE_UNAVAILABLE` | 503 | AI Server 또는 POS 서버 다운 |
| `TOO_MANY_REQUESTS` | 429 | 요청 과다 |

### 인증 (AUTH_)

| 코드 | HTTP | 설명 |
|------|------|------|
| `AUTH_EMAIL_DUPLICATE` | 409 | 이미 가입된 이메일 |
| `AUTH_INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호 불일치 |
| `AUTH_INVALID_TOKEN` | 401 | 토큰 형식 오류 또는 위조 |
| `AUTH_TOKEN_EXPIRED` | 401 | Access Token 만료 |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Refresh Token 무효 또는 만료 |
| `AUTH_BUSINESS_NO_INVALID` | 400 | 사업자등록번호 형식 오류 |
| `AUTH_BUSINESS_NO_NOT_ACTIVE` | 422 | 휴업/폐업/미등록 사업자 |
| `AUTH_SOCIAL_LOGIN_FAILED` | 400 | OAuth 인가 코드 처리 실패 |
| `AUTH_PASSWORD_NOT_ALLOWED` | 422 | 소셜 계정의 비밀번호 변경 시도 |

### 재고 (INVENTORY_)

| 코드 | HTTP | 설명 |
|------|------|------|
| `INVENTORY_ITEM_DUPLICATE` | 409 | 동일 품목명 중복 등록 |
| `INVENTORY_LOT_NOT_FOUND` | 404 | 존재하지 않는 로트 |
| `INVENTORY_DISPOSE_EXCEEDS` | 422 | 폐기 수량이 잔여 수량 초과 |
| `INVENTORY_EMPTY` | 422 | 재고 0 상태에서 차감 시도 |

### 메뉴 (MENU_)

| 코드 | HTTP | 설명 |
|------|------|------|
| `MENU_NAME_DUPLICATE` | 409 | 동일 매장 내 메뉴명 중복 |
| `MENU_RECIPE_MISSING_WARNING` | 200 | 재고 차감 ON + 레시피 미입력 (경고) |

### POS (POS_)

| 코드 | HTTP | 설명 |
|------|------|------|
| `POS_CONNECTION_FAILED` | 503 | POS 연동 실패 |
| `POS_SYNC_FAILED` | 503 | POS 동기화 실패 |
| `POS_NOT_CONNECTED` | 422 | POS 미연동 상태에서 동기화 시도 |

### 발주/자동화 (ORDER_, AUTOMATION_)

| 코드 | HTTP | 설명 |
|------|------|------|
| `ORDER_NO_RECOMMENDATION` | 404 | 추천발주 데이터 없음 |
| `AUTOMATION_IN_PROGRESS` | 429 | 자동화 이미 진행 중 |
| `AUTOMATION_COUPANG_FAILED` | 200 | 쿠팡 자동화 실패, 수동 안내 포함 (경고) |

### 예측/파이프라인 (FORECAST_, PIPELINE_)

| 코드 | HTTP | 설명 |
|------|------|------|
| `FORECAST_NOT_FOUND` | 404 | 예측 결과 없음 |
| `FORECAST_LOW_CONFIDENCE` | 200 | 신뢰도 낮음 (경고) |
| `PIPELINE_ALREADY_RUNNING` | 429 | 동일 타입 파이프라인 이미 실행 중 |
| `PIPELINE_AI_SERVER_UNAVAILABLE` | 503 | AI Server 응답 없음 |

---

## 9. 캐시 계층 설계 (Redis)

### 캐시 대상 및 전략

| 캐시 키 패턴 | 캐시 대상 | TTL | 무효화 시점 | 전략 |
|-------------|-----------|-----|------------|------|
| `forecast:{store_id}:{target_date}` | 수요예측 결과 | 24시간 | 새 예측 실행 시 | Cache-Aside |
| `recommend:{store_id}` | 최신 추천발주 | 24시간 | 점주 수정 또는 새 추천 생성 시 | Cache-Aside |
| `dashboard:{store_id}` | 대시보드 요약 | 10분 | 자동 만료 | TTL 기반 |
| `inventory_summary:{store_id}` | 재고 현황 요약 | 5분 | 자동 만료 | TTL 기반 |
| `refresh_token_blacklist:{token_hash}` | 무효화된 Refresh Token | 30일 | 로그아웃/탈퇴 시 등록 | Write-Through |

### 전략별 설명

**Cache-Aside (수요예측/추천발주)**
```
읽기: Redis 확인 → MISS면 DB 조회 → Redis 저장 → 반환
쓰기: DB 저장 → Redis 키 삭제 (다음 읽기 때 재적재)
```

**TTL 기반 (대시보드/재고 요약)**
```
저장: Redis에 TTL 설정하여 저장
읽기: TTL 내면 캐시 반환, 만료 후 DB 재조회
```
> 집계 데이터 특성상 10분 이내 오차 허용.

**Write-Through (Refresh Token 블랙리스트)**
```
로그아웃/탈퇴 시: Redis에 token_hash 즉시 등록
토큰 검증 시: Redis 블랙리스트 확인 → 존재하면 401 반환
```
> 로그아웃 즉시 반영 필수이므로 Write-Through 적용.
