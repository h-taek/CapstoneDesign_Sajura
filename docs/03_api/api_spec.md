# API 명세서

## 1. 공통 규약

### 1.1 Base URL

```
/api/
```

버전 관리 없음. 클라이언트와 서버를 동시 배포하므로 Breaking change 시 양쪽 함께 업데이트.

### 1.2 인증 헤더

```
Authorization: Bearer <access_token>
```

- Access Token: JWT, 유효기간 1시간
- Refresh Token: HttpOnly Cookie, 유효기간 30일, Rotation 정책 적용

### 1.3 에러 응답 형식

```json
{
  "error": "ERROR_CODE",
  "message": "사람이 읽을 수 있는 오류 메시지",
  "detail": null,
  "path": "/api/...",
  "timestamp": "2026-05-06T02:00:00Z"
}
```

`detail`은 validation 에러 시 필드별 오류 목록:

```json
"detail": [
  { "field": "business_no", "message": "사업자등록번호 형식이 올바르지 않습니다." }
]
```

### 1.4 HTTP 상태 코드

| 코드 | 의미 | 사용 예시 |
|------|------|-----------|
| `200` | 성공 (조회/수정) | GET, PUT, PATCH 성공 |
| `201` | 생성 성공 | POST로 리소스 생성 시 |
| `204` | 성공 (body 없음) | DELETE 성공, 로그아웃 등 |
| `400` | 잘못된 요청 | validation 실패, 형식 오류 |
| `401` | 인증 실패 | 토큰 없음/만료 |
| `403` | 권한 없음 | 다른 매장 데이터 접근 시도 |
| `404` | 리소스 없음 | 존재하지 않는 ID 조회 |
| `409` | 충돌 | 중복 사업자번호 가입 |
| `422` | 처리 불가 | 비즈니스 로직 오류 (재고 0인데 차감 등) |
| `429` | 요청 과다 | Playwright 자동화 중복 호출 등 |
| `500` | 서버 오류 | 예상치 못한 서버 에러 |
| `503` | 서비스 불가 | AI Server 다운, POS 연동 불가 |

### 1.5 페이지네이션 / 정렬 / 필터

**목록 조회 공통 Query Parameter:**

| 파라미터 | 예시 | 설명 |
|----------|------|------|
| `page` | `?page=1` | 페이지 번호 (1부터 시작) |
| `size` | `?size=20` | 페이지당 항목 수 |
| `sort` | `?sort=created_at` | 정렬 기준 필드 |
| `order` | `?order=desc` | 정렬 방향 (asc / desc) |

필터 파라미터는 각 API마다 개별 정의 (예: `?start_date=`, `?end_date=`, `?menu_id=`).

**목록 응답 공통 구조:**

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "size": 20,
  "total_pages": 5
}
```

---

## 2. 인증 API

### Endpoints

| Method | Path | 설명 | 인증 필요 |
|--------|------|------|-----------|
| `POST` | `/api/auth/register` | 회원가입 (사업자번호 검증 포함) | X |
| `POST` | `/api/auth/login` | 로그인 | X |
| `POST` | `/api/auth/logout` | 로그아웃 | O |
| `POST` | `/api/auth/refresh` | Access Token 재발급 | X (Cookie) |
| `GET` | `/api/auth/me` | 내 정보 조회 | O |
| `PATCH` | `/api/auth/me` | 일반 정보 수정 | O |
| `PATCH` | `/api/auth/password` | 비밀번호 변경 | O |
| `DELETE` | `/api/auth/me` | 회원 탈퇴 | O |

### POST /api/auth/register

```json
// Request
{
  "email": "owner@example.com",
  "password": "string",
  "name": "홍길동",
  "business_no": "123-45-67890",
  "store_name": "길동 카페"
}

// Response 201
{
  "user_id": "uuid",
  "email": "owner@example.com",
  "name": "홍길동",
  "store_name": "길동 카페"
}
```

### POST /api/auth/login

```json
// Request
{
  "email": "owner@example.com",
  "password": "string"
}

// Response 200
{
  "access_token": "jwt_string",
  "token_type": "bearer",
  "expires_in": 3600
}
// Refresh Token은 HttpOnly Cookie로 Set-Cookie
```

### POST /api/auth/logout

```
// Request: Header만 (Authorization: Bearer <token>)
// Response: 204 No Content
```

### POST /api/auth/refresh

```json
// Request: Cookie의 Refresh Token 자동 전송 (body 없음)

// Response 200
{
  "access_token": "new_jwt_string",
  "token_type": "bearer",
  "expires_in": 3600
}
// 새 Refresh Token Set-Cookie (Rotation)
```

### GET /api/auth/me

```json
// Response 200
{
  "user_id": "uuid",
  "email": "owner@example.com",
  "name": "홍길동",
  "store_name": "길동 카페",
  "business_no": "123-45-67890",
  "created_at": "2026-01-01T00:00:00Z"
}
```

### PATCH /api/auth/me

```json
// Request (변경할 필드만)
{
  "name": "홍길동2",
  "store_name": "새 카페"
}
// Response 200: GET /api/auth/me 와 동일 구조
```

### PATCH /api/auth/password

```json
// Request
{
  "current_password": "string",
  "new_password": "string"
}
// Response: 204 No Content
```

### DELETE /api/auth/me

```json
// Request
{
  "password": "string"
}
// Response: 204 No Content
```

---

## 3. 매장/POS API

### Endpoints

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/store` | 내 매장 정보 조회 |
| `PATCH` | `/api/store` | 매장 정보 수정 |
| `GET` | `/api/store/pos` | POS 연동 정보 조회 |
| `POST` | `/api/store/pos` | POS 연동 등록 |
| `PATCH` | `/api/store/pos` | POS 연동 정보 수정 |
| `DELETE` | `/api/store/pos` | POS 연동 해제 |
| `POST` | `/api/store/pos/sync` | POS 데이터 수동 동기화 요청 |
| `GET` | `/api/store/pos/status` | POS 연동 상태 조회 |

> 1계정 1매장 구조이므로 `/api/store/{id}` 대신 `/api/store`로 단순화.

### GET /api/store

```json
// Response 200
{
  "store_id": "uuid",
  "store_name": "길동 카페",
  "business_no": "123-45-67890",
  "address": "서울시 강남구 ...",
  "phone": "02-1234-5678",
  "created_at": "2026-01-01T00:00:00Z"
}
```

### PATCH /api/store

```json
// Request (변경할 필드만)
{
  "store_name": "새 카페",
  "address": "서울시 서초구 ...",
  "phone": "02-9999-8888"
}
// Response 200: GET /api/store 와 동일 구조
```

### GET /api/store/pos

```json
// Response 200
{
  "pos_type": "UNIONPOS",
  "api_key": "***masked***",
  "store_code": "12345",
  "connected_at": "2026-01-01T00:00:00Z"
}
```

### POST /api/store/pos

```json
// Request
{
  "pos_type": "UNIONPOS",
  "api_key": "string",
  "store_code": "12345"
}
// Response 201: GET /api/store/pos 와 동일 구조
```

### PATCH /api/store/pos

```json
// Request (변경할 필드만)
{
  "api_key": "new_string"
}
// Response 200: GET /api/store/pos 와 동일 구조
```

### DELETE /api/store/pos

```
// Response: 204 No Content
```

### POST /api/store/pos/sync

```json
// Request: body 없음
// Response 200
{
  "synced_at": "2026-05-06T02:00:00Z",
  "records_synced": 142
}
```

### GET /api/store/pos/status

```json
// Response 200
{
  "status": "CONNECTED",  // CONNECTED | ERROR | CSV_MODE | DISCONNECTED
  "last_synced_at": "2026-05-06T01:00:00Z",
  "error_message": null
}
```

---

## 4. 메뉴/레시피 API

### Endpoints

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/menus` | 메뉴 목록 조회 |
| `POST` | `/api/menus` | 메뉴 등록 |
| `POST` | `/api/menus/bulk` | 메뉴 일괄 등록 (POS 연동 시) |
| `GET` | `/api/menus/{menu_id}` | 메뉴 상세 조회 |
| `PATCH` | `/api/menus/{menu_id}` | 메뉴 수정 |
| `DELETE` | `/api/menus/{menu_id}` | 메뉴 삭제 |
| `GET` | `/api/menus/{menu_id}/recipe` | 레시피 조회 |
| `PUT` | `/api/menus/{menu_id}/recipe` | 레시피 등록/전체 수정 |
| `DELETE` | `/api/menus/{menu_id}/recipe` | 레시피 삭제 |

### GET /api/menus

```json
// Query: ?page=1&size=20&sort=name&order=asc&category=음료
// Response 200
{
  "items": [
    {
      "menu_id": "uuid",
      "name": "아메리카노",
      "category": "음료",
      "price": 4500,
      "is_active": true
    }
  ],
  "total": 30,
  "page": 1,
  "size": 20,
  "total_pages": 2
}
```

### POST /api/menus

```json
// Request
{
  "name": "아메리카노",
  "category": "음료",
  "price": 4500,
  "is_active": true
}

// Response 201
{
  "menu_id": "uuid",
  "name": "아메리카노",
  "category": "음료",
  "price": 4500,
  "is_active": true,
  "created_at": "2026-05-06T00:00:00Z"
}
```

### POST /api/menus/bulk

```json
// Request
{
  "menus": [
    {
      "name": "아메리카노",
      "category": "음료",
      "price": 4500,
      "is_active": true
    }
  ]
}

// Response 201
{
  "created": 12,
  "skipped": 2,
  "skipped_names": ["라떼", "에스프레소"]
}
// skipped: 동일 이름 메뉴가 이미 존재하는 경우
```

### GET /api/menus/{menu_id}

```json
// Response 200
{
  "menu_id": "uuid",
  "name": "아메리카노",
  "category": "음료",
  "price": 4500,
  "is_active": true,
  "created_at": "2026-05-06T00:00:00Z",
  "updated_at": "2026-05-06T00:00:00Z"
}
```

### PATCH /api/menus/{menu_id}

```json
// Request (변경할 필드만)
{
  "price": 5000,
  "is_active": false
}
// Response 200: GET /api/menus/{menu_id} 와 동일 구조
```

### DELETE /api/menus/{menu_id}

```
// Response: 204 No Content
```

### GET /api/menus/{menu_id}/recipe

```json
// Response 200
{
  "menu_id": "uuid",
  "ingredients": [
    {
      "item_id": "uuid",
      "item_name": "원두",
      "quantity": 18.0,
      "unit": "g"
    },
    {
      "item_id": "uuid",
      "item_name": "물",
      "quantity": 200.0,
      "unit": "ml"
    }
  ],
  "updated_at": "2026-05-06T00:00:00Z"
}
```

### PUT /api/menus/{menu_id}/recipe

```json
// Request (전체 재작성)
{
  "ingredients": [
    {
      "item_id": "uuid",
      "quantity": 18.0,
      "unit": "g"
    }
  ]
}
// Response 200: GET /api/menus/{menu_id}/recipe 와 동일 구조
```

### DELETE /api/menus/{menu_id}/recipe

```
// Response: 204 No Content
```

---

## 5. 재고 API

### Endpoints

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/inventory` | 재고 목록 조회 |
| `POST` | `/api/inventory` | 재고 품목 등록 |
| `GET` | `/api/inventory/summary` | 재고 현황 요약 |
| `GET` | `/api/inventory/alerts` | 재고 경고 목록 |
| `GET` | `/api/inventory/{item_id}` | 재고 품목 상세 조회 |
| `PATCH` | `/api/inventory/{item_id}` | 재고 품목 정보 수정 |
| `DELETE` | `/api/inventory/{item_id}` | 재고 품목 삭제 |
| `POST` | `/api/inventory/{item_id}/lots` | 입고 등록 (로트 추가) |
| `GET` | `/api/inventory/{item_id}/lots` | 로트 목록 조회 |
| `POST` | `/api/inventory/{item_id}/dispose` | 폐기 처리 |

### GET /api/inventory

```json
// Query: ?page=1&size=20&sort=name&order=asc&alert=true
// alert=true: 경고 품목만 필터
// Response 200
{
  "items": [
    {
      "item_id": "uuid",
      "name": "원두",
      "unit": "g",
      "total_quantity": 2000.0,
      "alert_status": "NORMAL"  // NORMAL | LOW | EXPIRED_SOON | EMPTY
    }
  ],
  "total": 25,
  "page": 1,
  "size": 20,
  "total_pages": 2
}
```

### POST /api/inventory

```json
// Request
{
  "name": "원두",
  "unit": "g",
  "low_stock_threshold": 500.0
}

// Response 201
{
  "item_id": "uuid",
  "name": "원두",
  "unit": "g",
  "low_stock_threshold": 500.0,
  "total_quantity": 0.0,
  "created_at": "2026-05-06T00:00:00Z"
}
```

### GET /api/inventory/summary

```json
// Response 200
{
  "total_items": 25,
  "low_stock_count": 3,
  "expired_soon_count": 2,
  "empty_count": 1
}
```

### GET /api/inventory/alerts

```json
// Response 200
{
  "items": [
    {
      "item_id": "uuid",
      "name": "원두",
      "alert_status": "EXPIRED_SOON",  // LOW | EXPIRED_SOON | EMPTY
      "alert_message": "D-3: 2026-05-09 소비기한 도래 (원두 3000g)",
      "quantity": 3000.0,
      "expiry_date": "2026-05-09"
    }
  ],
  "total": 3
}
```

### GET /api/inventory/{item_id}

```json
// Response 200
{
  "item_id": "uuid",
  "name": "원두",
  "unit": "g",
  "low_stock_threshold": 500.0,
  "total_quantity": 2000.0,
  "alert_status": "NORMAL",
  "coupang_url": "https://www.coupang.com/...",
  "last_price": 28000,
  "created_at": "2026-05-06T00:00:00Z",
  "updated_at": "2026-05-06T00:00:00Z"
}
```

### PATCH /api/inventory/{item_id}

```json
// Request (변경할 필드만)
{
  "low_stock_threshold": 800.0,
  "coupang_url": "https://www.coupang.com/..."
}
// Response 200: GET /api/inventory/{item_id} 와 동일 구조
```

### DELETE /api/inventory/{item_id}

```
// Response: 204 No Content
```

### POST /api/inventory/{item_id}/lots

```json
// Request
{
  "quantity": 5000.0,
  "received_at": "2026-05-06",
  "expiry_date": "2026-08-06",
  "unit_price": 28000
}

// Response 201
{
  "lot_id": "uuid",
  "item_id": "uuid",
  "quantity": 5000.0,
  "remaining_quantity": 5000.0,
  "received_at": "2026-05-06",
  "expiry_date": "2026-08-06",
  "unit_price": 28000
}
```

### GET /api/inventory/{item_id}/lots

```json
// Response 200
{
  "item_id": "uuid",
  "item_name": "원두",
  "lots": [
    {
      "lot_id": "uuid",
      "quantity": 5000.0,
      "remaining_quantity": 3000.0,
      "received_at": "2026-05-06",
      "expiry_date": "2026-08-06",
      "unit_price": 28000
    }
  ]
}
```

### POST /api/inventory/{item_id}/dispose

```json
// Request
{
  "lot_id": "uuid",
  "quantity": 500.0,
  "reason": "소비기한 만료"
}

// Response 200
{
  "disposed_quantity": 500.0,
  "remaining_quantity": 2500.0,
  "disposed_at": "2026-05-06T10:00:00Z"
}
```

---

## 6. 판매 API

### Endpoints

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/sales` | 판매 내역 목록 조회 |
| `GET` | `/api/sales/summary` | 기간별 판매 요약 |
| `GET` | `/api/sales/trends` | 메뉴별/기간별 판매 추세 |
| `POST` | `/api/sales/upload` | CSV 파일 업로드 (POS 수동 연동 모드) |
| `GET` | `/api/sales/{sale_id}` | 판매 내역 상세 조회 |

### GET /api/sales

```json
// Query: ?page=1&size=20&sort=sold_at&order=desc&start_date=2026-01-01&end_date=2026-01-31&menu_id=uuid
// Response 200
{
  "items": [
    {
      "sale_id": "uuid",
      "menu_id": "uuid",
      "menu_name": "아메리카노",
      "quantity": 3,
      "total_price": 13500,
      "sold_at": "2026-01-15T14:30:00Z"
    }
  ],
  "total": 540,
  "page": 1,
  "size": 20,
  "total_pages": 27
}
```

### GET /api/sales/summary

```json
// Query: ?start_date=2026-01-01&end_date=2026-01-31
// Response 200
{
  "period": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-31"
  },
  "total_revenue": 4500000,
  "total_orders": 1200,
  "avg_daily_revenue": 145161,
  "top_menu": {
    "menu_id": "uuid",
    "menu_name": "아메리카노",
    "quantity": 430
  }
}
```

### GET /api/sales/trends

```json
// Query: ?start_date=2026-01-01&end_date=2026-01-31&group_by=day&menu_id=uuid
// group_by: day | week | month
// Response 200
{
  "menu_id": "uuid",
  "menu_name": "아메리카노",
  "group_by": "day",
  "data": [
    {
      "date": "2026-01-01",
      "quantity": 45,
      "revenue": 202500
    },
    {
      "date": "2026-01-02",
      "quantity": 38,
      "revenue": 171000
    }
  ]
}
```

### POST /api/sales/upload

```
// Request: multipart/form-data
// - file: CSV 파일
// - date_column: "날짜"   (CSV 내 컬럼명 매핑)
// - menu_column: "메뉴명"
// - quantity_column: "수량"
// - price_column: "금액"

// Response 201
{
  "imported": 320,
  "skipped": 5,
  "skipped_reasons": [
    "3행: 메뉴명 없음",
    "17행: 금액 형식 오류"
  ]
}
```

### GET /api/sales/{sale_id}

```json
// Response 200
{
  "sale_id": "uuid",
  "menu_id": "uuid",
  "menu_name": "아메리카노",
  "quantity": 3,
  "unit_price": 4500,
  "total_price": 13500,
  "sold_at": "2026-01-15T14:30:00Z",
  "source": "POS"  // POS | CSV
}
```

---

## 7. 수요예측 / 추천발주 / 발주 API

### Endpoints

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/forecast` | 수요예측 결과 조회 |
| `POST` | `/api/forecast/run` | 수요예측 즉시 실행 요청 |
| `GET` | `/api/orders/recommend` | 추천발주 목록 조회 |
| `PATCH` | `/api/orders/recommend` | 추천발주 수량 수정안 저장 |
| `POST` | `/api/orders/approve` | 발주 확정 |
| `GET` | `/api/orders` | 발주 내역 목록 조회 |
| `GET` | `/api/orders/{order_id}` | 발주 내역 상세 조회 |
| `POST` | `/api/orders/{order_id}/automate` | 쿠팡 장바구니 자동 담기 요청 |
| `GET` | `/api/orders/{order_id}/approval-log` | 발주 수정 이력 조회 |

### GET /api/forecast

```json
// Query: ?target_date=2026-05-07
// Response 200
{
  "target_date": "2026-05-07",
  "generated_at": "2026-05-06T02:00:00Z",
  "is_low_confidence": false,
  "low_confidence_reason": null,
  "items": [
    {
      "menu_id": "uuid",
      "menu_name": "아메리카노",
      "predicted_quantity": 52,
      "confidence_score": 0.87
    }
  ]
}
```

### POST /api/forecast/run

```json
// Request
{
  "target_date": "2026-05-07"
}
// Response 200: GET /api/forecast 와 동일 구조
// 저장된 예측값 없을 때 AI Server 직접 호출 후 반환
```

### GET /api/orders/recommend

```json
// Response 200
{
  "generated_at": "2026-05-06T02:00:00Z",
  "items": [
    {
      "item_id": "uuid",
      "item_name": "원두",
      "unit": "g",
      "recommended_quantity": 5000.0,
      "adjusted_quantity": 5000.0,
      "last_price": 28000,
      "coupang_url": "https://www.coupang.com/..."
    }
  ]
}
```

### PATCH /api/orders/recommend

```json
// Request (점주 수정안)
{
  "adjustments": [
    {
      "item_id": "uuid",
      "adjusted_quantity": 3000.0
    }
  ]
}
// Response 200: GET /api/orders/recommend 와 동일 구조 (adjusted_quantity 반영)
```

### POST /api/orders/approve

```json
// Request
{
  "items": [
    {
      "item_id": "uuid",
      "final_quantity": 3000.0,
      "unit_price": 28000
    }
  ],
  "note": "이번 주 행사로 원두 줄임"
}

// Response 201
{
  "order_id": "uuid",
  "approved_at": "2026-05-06T10:00:00Z",
  "total_estimated_cost": 84000,
  "status": "APPROVED"
}
```

### GET /api/orders

```json
// Query: ?page=1&size=20&sort=approved_at&order=desc
// Response 200
{
  "items": [
    {
      "order_id": "uuid",
      "approved_at": "2026-05-06T10:00:00Z",
      "total_estimated_cost": 84000,
      "status": "APPROVED",  // APPROVED | AUTOMATED | MANUAL_REQUIRED
      "item_count": 3
    }
  ],
  "total": 12,
  "page": 1,
  "size": 20,
  "total_pages": 1
}
```

### GET /api/orders/{order_id}

```json
// Response 200
{
  "order_id": "uuid",
  "approved_at": "2026-05-06T10:00:00Z",
  "status": "AUTOMATED",
  "total_estimated_cost": 84000,
  "note": "이번 주 행사로 원두 줄임",
  "items": [
    {
      "item_id": "uuid",
      "item_name": "원두",
      "final_quantity": 3000.0,
      "unit": "g",
      "unit_price": 28000,
      "subtotal": 84000
    }
  ]
}
```

### POST /api/orders/{order_id}/automate

```json
// Request: body 없음

// Response 200 (성공)
{
  "order_id": "uuid",
  "status": "AUTOMATED",
  "automated_at": "2026-05-06T10:05:00Z",
  "coupang_result": "SUCCESS"
}

// Response 200 (실패 — 재시도 없이 즉시 수동 안내)
{
  "order_id": "uuid",
  "status": "MANUAL_REQUIRED",
  "coupang_result": "FAILED",
  "manual_guide_url": "https://www.coupang.com/..."
}
```

### GET /api/orders/{order_id}/approval-log

```json
// Response 200
{
  "order_id": "uuid",
  "items": [
    {
      "item_id": "uuid",
      "item_name": "원두",
      "recommended_quantity": 5000.0,
      "adjusted_quantity": 3000.0,
      "final_quantity": 3000.0,
      "unit": "g",
      "was_modified": true
    }
  ]
}
```

---

## 8. AI Server 연동 API

> Backend → AI Server 간 내부 호출 API. 외부 클라이언트 직접 호출 불가.
> AI Server는 별도 포트로 분리 운영 (예: `http://ai-server:8001`).
> prefix: `/ai/`

### Endpoints

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/ai/forecast/predict` | 수요예측 실행 요청 |
| `POST` | `/ai/forecast/train` | 모델 재학습 요청 |
| `GET` | `/ai/forecast/status` | 예측/학습 작업 상태 조회 |
| `POST` | `/ai/xai/shap` | SHAP 설명 생성 요청 |
| `GET` | `/ai/health` | AI Server 헬스체크 |

### POST /ai/forecast/predict

```json
// Request
{
  "store_id": "uuid",
  "target_date": "2026-05-07",
  "sales_data": [
    {
      "date": "2026-04-01",
      "menu_id": "uuid",
      "quantity": 45
    }
  ]
}

// Response 200
{
  "target_date": "2026-05-07",
  "is_low_confidence": false,
  "low_confidence_reason": null,
  "predictions": [
    {
      "menu_id": "uuid",
      "predicted_quantity": 52,
      "confidence_score": 0.87
    }
  ]
}
```

### POST /ai/forecast/train

```json
// Request
{
  "store_id": "uuid",
  "training_data": [
    {
      "date": "2026-01-01",
      "menu_id": "uuid",
      "quantity": 45
    }
  ]
}

// Response 200
{
  "job_id": "uuid",
  "status": "QUEUED",
  "started_at": "2026-05-06T02:00:00Z"
}
```

### GET /ai/forecast/status

```json
// Query: ?job_id=uuid
// Response 200
{
  "job_id": "uuid",
  "type": "TRAIN",  // TRAIN | PREDICT
  "status": "RUNNING",  // QUEUED | RUNNING | DONE | FAILED
  "started_at": "2026-05-06T02:00:00Z",
  "finished_at": null,
  "error_message": null
}
```

### POST /ai/xai/shap

```json
// Request
{
  "store_id": "uuid",
  "menu_id": "uuid",
  "target_date": "2026-05-07"
}

// Response 200
{
  "menu_id": "uuid",
  "target_date": "2026-05-07",
  "shap_values": [
    {
      "feature": "요일",
      "value": "화요일",
      "contribution": 0.32
    },
    {
      "feature": "전주 동요일 판매량",
      "value": 48,
      "contribution": 0.41
    }
  ]
}
```

### GET /ai/health

```json
// Response 200
{
  "status": "ok",
  "model_loaded": true,
  "last_trained_at": "2026-05-04T02:00:00Z"
}
// AI Server 다운 시 Backend가 503 반환
```

---

## 9. 대시보드 / 파이프라인 / 데이터 API

### Endpoints

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/dashboard` | 대시보드 전체 요약 데이터 조회 |
| `GET` | `/api/dashboard/roi` | ROI 지표 조회 (월별 폐기 비용) |
| `GET` | `/api/dashboard/waste` | 폐기 현황 조회 |
| `GET` | `/api/pipeline/status` | 파이프라인 최근 실행 상태 조회 |
| `POST` | `/api/pipeline/run` | 파이프라인 수동 실행 요청 |
| `GET` | `/api/pipeline/history` | 파이프라인 실행 이력 목록 |
| `GET` | `/api/data/export` | 데이터 CSV 다운로드 |
| `DELETE` | `/api/data` | 전체 데이터 삭제 요청 |

### GET /api/dashboard

```json
// Response 200
{
  "inventory_summary": {
    "total_items": 25,
    "low_stock_count": 3,
    "expired_soon_count": 2,
    "empty_count": 1
  },
  "sales_summary": {
    "today_revenue": 320000,
    "month_revenue": 4500000,
    "mom_change_rate": 0.08
  },
  "waste_summary": {
    "month_waste_cost": 45000,
    "mom_change_rate": -0.12
  },
  "order_summary": {
    "last_order_at": "2026-05-05T10:00:00Z",
    "pending_alerts": 2
  }
}
```

### GET /api/dashboard/roi

```json
// Query: ?months=6 (최근 N개월)
// Response 200
{
  "data": [
    {
      "month": "2026-01",
      "waste_cost": 52000,
      "mom_change_rate": null
    },
    {
      "month": "2026-02",
      "waste_cost": 48000,
      "mom_change_rate": -0.08
    }
  ]
}
```

### GET /api/dashboard/waste

```json
// Query: ?start_date=2026-01-01&end_date=2026-01-31
// Response 200
{
  "period": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-31"
  },
  "total_waste_cost": 52000,
  "items": [
    {
      "item_id": "uuid",
      "item_name": "원두",
      "disposed_quantity": 500.0,
      "unit": "g",
      "waste_cost": 14000
    }
  ]
}
```

### GET /api/pipeline/status

```json
// Response 200
{
  "forecast_job": {
    "last_run_at": "2026-05-06T02:00:00Z",
    "status": "DONE",
    "error_message": null
  },
  "train_job": {
    "last_run_at": "2026-05-04T02:00:00Z",
    "status": "DONE",
    "error_message": null
  }
}
```

### POST /api/pipeline/run

```json
// Request
{
  "type": "FORECAST"  // FORECAST | TRAIN
}

// Response 200
{
  "job_id": "uuid",
  "type": "FORECAST",
  "status": "QUEUED",
  "queued_at": "2026-05-06T10:00:00Z"
}
```

### GET /api/pipeline/history

```json
// Query: ?page=1&size=20&type=FORECAST
// Response 200
{
  "items": [
    {
      "job_id": "uuid",
      "type": "FORECAST",
      "status": "DONE",  // QUEUED | RUNNING | DONE | FAILED
      "started_at": "2026-05-06T02:00:00Z",
      "finished_at": "2026-05-06T02:03:12Z",
      "error_message": null
    }
  ],
  "total": 30,
  "page": 1,
  "size": 20,
  "total_pages": 2
}
```

### GET /api/data/export

```
// Query: ?type=sales&start_date=2026-01-01&end_date=2026-01-31
// type: sales | inventory | orders
// Response 200
// Content-Type: text/csv
// Content-Disposition: attachment; filename="sales_2026-01-01_2026-01-31.csv"
```

### DELETE /api/data

```json
// Request
{
  "type": "ALL",  // ALL | SALES | INVENTORY | ORDERS
  "confirm": true
}
// Response: 204 No Content
```

---

## 10. 인터페이스 표준

| 항목 | 내용 |
|------|------|
| 프로토콜 | REST API |
| 데이터 형식 | JSON (CSV 다운로드/업로드 제외) |
| 인증 방식 | JWT Bearer Token |
| 문서화 | OpenAPI(Swagger) 자동 문서화 (FastAPI 기본 제공) |
