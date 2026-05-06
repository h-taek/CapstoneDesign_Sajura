# DB 스키마 설계서

## 1. DBMS

- **MySQL**
- Docker 기반 배포 용이, 복잡한 쿼리 및 JSON 필드 지원, 인덱싱/파티셔닝/슬레이브 복제 가능

---

## 2. 공통 규칙

- PK: `CHAR(36)` UUID 방식
- 테이블명/컬럼명: snake_case 영문
- 날짜/시간: `DATETIME` (UTC 저장)
- 금액: `INT` (원 단위, 소수점 없음)
- 수량: `DECIMAL(10,3)` (g, ml 등 소수점 단위 허용)
- 마이그레이션 도구: Alembic (FastAPI/SQLAlchemy 표준)

---

## 3. 테이블 스키마

### 3.1 users

```sql
CREATE TABLE users (
    user_id     CHAR(36)        NOT NULL,
    email       VARCHAR(255)    NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    name        VARCHAR(50)     NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email)
);
```

### 3.2 refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    token_id    CHAR(36)        NOT NULL,
    user_id     CHAR(36)        NOT NULL,
    token_hash  VARCHAR(255)    NOT NULL,
    expires_at  DATETIME        NOT NULL,
    is_revoked  TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (token_id),
    UNIQUE KEY uq_refresh_tokens_hash (token_hash),
    KEY idx_refresh_tokens_user_id (user_id),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);
```

> `token_hash`: 원문 토큰 대신 해시값 저장. DB 침해 시 토큰 원문 복구 불가.

### 3.3 stores

```sql
CREATE TABLE stores (
    store_id    CHAR(36)        NOT NULL,
    user_id     CHAR(36)        NOT NULL,
    store_name  VARCHAR(100)    NOT NULL,
    business_no VARCHAR(20)     NOT NULL,
    address     VARCHAR(255)    NULL,
    phone       VARCHAR(20)     NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id),
    UNIQUE KEY uq_stores_user_id (user_id),
    UNIQUE KEY uq_stores_business_no (business_no),
    CONSTRAINT fk_stores_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);
```

### 3.4 pos_connections

```sql
CREATE TABLE pos_connections (
    pos_id          CHAR(36)        NOT NULL,
    store_id        CHAR(36)        NOT NULL,
    pos_type        VARCHAR(50)     NOT NULL,
    api_key         VARCHAR(255)    NOT NULL COMMENT '암호화 저장',
    store_code      VARCHAR(50)     NOT NULL,
    status          ENUM('CONNECTED','ERROR','CSV_MODE','DISCONNECTED') NOT NULL DEFAULT 'DISCONNECTED',
    last_synced_at  DATETIME        NULL,
    error_message   VARCHAR(500)    NULL,
    connected_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pos_id),
    UNIQUE KEY uq_pos_connections_store_id (store_id),
    CONSTRAINT fk_pos_connections_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE CASCADE
);
```

### 3.5 menus

```sql
CREATE TABLE menus (
    menu_id     CHAR(36)        NOT NULL,
    store_id    CHAR(36)        NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    category    VARCHAR(50)     NULL,
    price       INT             NOT NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (menu_id),
    KEY idx_menus_store_id (store_id),
    CONSTRAINT fk_menus_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE CASCADE
);
```

### 3.6 recipes

```sql
CREATE TABLE recipes (
    recipe_id   CHAR(36)        NOT NULL,
    menu_id     CHAR(36)        NOT NULL,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (recipe_id),
    UNIQUE KEY uq_recipes_menu_id (menu_id),
    CONSTRAINT fk_recipes_menu FOREIGN KEY (menu_id) REFERENCES menus (menu_id) ON DELETE CASCADE
);
```

### 3.7 recipe_ingredients

```sql
CREATE TABLE recipe_ingredients (
    id          CHAR(36)        NOT NULL,
    recipe_id   CHAR(36)        NOT NULL,
    item_id     CHAR(36)        NOT NULL,
    quantity    DECIMAL(10,3)   NOT NULL,
    unit        VARCHAR(20)     NOT NULL,
    PRIMARY KEY (id),
    KEY idx_recipe_ingredients_recipe_id (recipe_id),
    KEY idx_recipe_ingredients_item_id (item_id),
    CONSTRAINT fk_recipe_ingredients_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (recipe_id) ON DELETE CASCADE,
    CONSTRAINT fk_recipe_ingredients_item FOREIGN KEY (item_id) REFERENCES inventory_items (item_id)
);
```

### 3.8 inventory_items

```sql
CREATE TABLE inventory_items (
    item_id             CHAR(36)        NOT NULL,
    store_id            CHAR(36)        NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    unit                VARCHAR(20)     NOT NULL,
    low_stock_threshold DECIMAL(10,3)   NOT NULL DEFAULT 0,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id),
    KEY idx_inventory_items_store_id (store_id),
    CONSTRAINT fk_inventory_items_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE CASCADE
);
```

### 3.9 inventory_lots

```sql
CREATE TABLE inventory_lots (
    lot_id              CHAR(36)        NOT NULL,
    item_id             CHAR(36)        NOT NULL,
    quantity            DECIMAL(10,3)   NOT NULL,
    remaining_quantity  DECIMAL(10,3)   NOT NULL,
    unit_price          INT             NOT NULL,
    received_at         DATE            NOT NULL,
    expiry_date         DATE            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lot_id),
    KEY idx_inventory_lots_item_id (item_id),
    KEY idx_inventory_lots_expiry_date (expiry_date),
    CONSTRAINT fk_inventory_lots_item FOREIGN KEY (item_id) REFERENCES inventory_items (item_id) ON DELETE CASCADE
);
```

### 3.10 disposal_logs

```sql
CREATE TABLE disposal_logs (
    disposal_id CHAR(36)        NOT NULL,
    lot_id      CHAR(36)        NOT NULL,
    item_id     CHAR(36)        NOT NULL COMMENT '조회 편의용 비정규화',
    store_id    CHAR(36)        NOT NULL COMMENT '조회 편의용 비정규화',
    quantity    DECIMAL(10,3)   NOT NULL,
    reason      VARCHAR(255)    NULL,
    disposed_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (disposal_id),
    KEY idx_disposal_logs_store_id (store_id),
    KEY idx_disposal_logs_item_id (item_id),
    CONSTRAINT fk_disposal_logs_lot FOREIGN KEY (lot_id) REFERENCES inventory_lots (lot_id),
    CONSTRAINT fk_disposal_logs_item FOREIGN KEY (item_id) REFERENCES inventory_items (item_id),
    CONSTRAINT fk_disposal_logs_store FOREIGN KEY (store_id) REFERENCES stores (store_id)
);
```

### 3.11 sites

```sql
CREATE TABLE sites (
    site_id     CHAR(36)        NOT NULL,
    name        VARCHAR(50)     NOT NULL,
    base_url    VARCHAR(255)    NOT NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (site_id),
    UNIQUE KEY uq_sites_name (name)
);
```

### 3.12 inventory_item_sites

```sql
CREATE TABLE inventory_item_sites (
    id              CHAR(36)        NOT NULL,
    item_id         CHAR(36)        NOT NULL,
    site_id         CHAR(36)        NOT NULL,
    product_url     VARCHAR(500)    NOT NULL,
    last_price      INT             NULL,
    last_scraped_at DATETIME        NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_item_site (item_id, site_id),
    CONSTRAINT fk_item_sites_item FOREIGN KEY (item_id) REFERENCES inventory_items (item_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_sites_site FOREIGN KEY (site_id) REFERENCES sites (site_id)
);
```

### 3.13 sale_records

```sql
CREATE TABLE sale_records (
    sale_id     CHAR(36)        NOT NULL,
    store_id    CHAR(36)        NOT NULL,
    menu_id     CHAR(36)        NOT NULL,
    quantity    INT             NOT NULL,
    unit_price  INT             NOT NULL,
    total_price INT             NOT NULL,
    sold_at     DATETIME        NOT NULL,
    source      ENUM('POS','CSV') NOT NULL DEFAULT 'POS',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sale_id),
    KEY idx_sale_records_store_sold_at (store_id, sold_at),
    KEY idx_sale_records_menu_id (menu_id),
    CONSTRAINT fk_sale_records_store FOREIGN KEY (store_id) REFERENCES stores (store_id),
    CONSTRAINT fk_sale_records_menu FOREIGN KEY (menu_id) REFERENCES menus (menu_id)
);
```

### 3.14 forecast_results

```sql
CREATE TABLE forecast_results (
    forecast_id             CHAR(36)        NOT NULL,
    store_id                CHAR(36)        NOT NULL,
    menu_id                 CHAR(36)        NOT NULL,
    target_date             DATE            NOT NULL,
    predicted_quantity      INT             NOT NULL,
    confidence_score        DECIMAL(4,3)    NOT NULL,
    is_low_confidence       TINYINT(1)      NOT NULL DEFAULT 0,
    low_confidence_reason   VARCHAR(255)    NULL,
    generated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (forecast_id),
    UNIQUE KEY uq_forecast_store_menu_date (store_id, menu_id, target_date),
    CONSTRAINT fk_forecast_results_store FOREIGN KEY (store_id) REFERENCES stores (store_id),
    CONSTRAINT fk_forecast_results_menu FOREIGN KEY (menu_id) REFERENCES menus (menu_id)
);
```

### 3.15 order_recommendations

```sql
CREATE TABLE order_recommendations (
    recommendation_id   CHAR(36)    NOT NULL,
    store_id            CHAR(36)    NOT NULL,
    generated_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (recommendation_id),
    KEY idx_order_recommendations_store_id (store_id),
    CONSTRAINT fk_order_recommendations_store FOREIGN KEY (store_id) REFERENCES stores (store_id)
);
```

### 3.16 order_recommendation_items

```sql
CREATE TABLE order_recommendation_items (
    id                      CHAR(36)        NOT NULL,
    recommendation_id       CHAR(36)        NOT NULL,
    item_id                 CHAR(36)        NOT NULL,
    recommended_quantity    DECIMAL(10,3)   NOT NULL,
    adjusted_quantity       DECIMAL(10,3)   NOT NULL,
    last_price              INT             NULL,
    PRIMARY KEY (id),
    KEY idx_order_rec_items_recommendation_id (recommendation_id),
    CONSTRAINT fk_order_rec_items_recommendation FOREIGN KEY (recommendation_id) REFERENCES order_recommendations (recommendation_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_rec_items_item FOREIGN KEY (item_id) REFERENCES inventory_items (item_id)
);
```

### 3.17 orders

```sql
CREATE TABLE orders (
    order_id                CHAR(36)        NOT NULL,
    store_id                CHAR(36)        NOT NULL,
    recommendation_id       CHAR(36)        NULL COMMENT '수동 발주 시 NULL 허용',
    status                  ENUM('APPROVED','AUTOMATED','MANUAL_REQUIRED') NOT NULL DEFAULT 'APPROVED',
    total_estimated_cost    INT             NOT NULL,
    note                    VARCHAR(500)    NULL,
    approved_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    automated_at            DATETIME        NULL,
    PRIMARY KEY (order_id),
    KEY idx_orders_store_approved_at (store_id, approved_at),
    CONSTRAINT fk_orders_store FOREIGN KEY (store_id) REFERENCES stores (store_id),
    CONSTRAINT fk_orders_recommendation FOREIGN KEY (recommendation_id) REFERENCES order_recommendations (recommendation_id)
);
```

### 3.18 order_items

```sql
CREATE TABLE order_items (
    id              CHAR(36)        NOT NULL,
    order_id        CHAR(36)        NOT NULL,
    item_id         CHAR(36)        NOT NULL,
    final_quantity  DECIMAL(10,3)   NOT NULL,
    unit_price      INT             NOT NULL,
    subtotal        INT             NOT NULL,
    PRIMARY KEY (id),
    KEY idx_order_items_order_id (order_id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_item FOREIGN KEY (item_id) REFERENCES inventory_items (item_id)
);
```

### 3.19 order_approval_logs

```sql
CREATE TABLE order_approval_logs (
    id                      CHAR(36)        NOT NULL,
    order_id                CHAR(36)        NOT NULL,
    item_id                 CHAR(36)        NOT NULL,
    recommended_quantity    DECIMAL(10,3)   NOT NULL,
    adjusted_quantity       DECIMAL(10,3)   NOT NULL,
    final_quantity          DECIMAL(10,3)   NOT NULL,
    was_modified            TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_order_approval_logs_order_id (order_id),
    CONSTRAINT fk_order_approval_logs_order FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_approval_logs_item FOREIGN KEY (item_id) REFERENCES inventory_items (item_id)
);
```

### 3.20 pipeline_jobs

```sql
CREATE TABLE pipeline_jobs (
    job_id          CHAR(36)        NOT NULL,
    store_id        CHAR(36)        NOT NULL,
    type            ENUM('FORECAST','TRAIN') NOT NULL,
    status          ENUM('QUEUED','RUNNING','DONE','FAILED') NOT NULL DEFAULT 'QUEUED',
    started_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at     DATETIME        NULL,
    error_message   VARCHAR(500)    NULL,
    PRIMARY KEY (job_id),
    KEY idx_pipeline_jobs_store_id (store_id),
    KEY idx_pipeline_jobs_status (status),
    CONSTRAINT fk_pipeline_jobs_store FOREIGN KEY (store_id) REFERENCES stores (store_id)
);
```

---

## 4. 인덱스 설계 요약

| 테이블 | 인덱스 | 목적 |
|--------|--------|------|
| `sale_records` | `(store_id, sold_at)` | 기간별 판매 조회 (가장 빈번) |
| `inventory_lots` | `expiry_date` | 소비기한 경고 배치 조회 |
| `forecast_results` | `(store_id, menu_id, target_date)` UNIQUE | 중복 예측 방지 + 빠른 조회 |
| `orders` | `(store_id, approved_at)` | 발주 이력 기간 조회 |
| `pipeline_jobs` | `status` | 실행 중 작업 모니터링 |
| `refresh_tokens` | `token_hash` UNIQUE | 토큰 검증 |

---

## 5. 암호화 대상 컬럼

| 테이블 | 컬럼 | 방식 |
|--------|------|------|
| `users` | `password_hash` | bcrypt |
| `pos_connections` | `api_key` | AES-256 (애플리케이션 레벨) |
| `refresh_tokens` | `token_hash` | SHA-256 |
