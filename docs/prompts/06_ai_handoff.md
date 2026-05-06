# 06_ai 작업 인수인계 프롬프트

> **최종 업데이트**: 2026-05-07
> **기반 문서**: 01~05 일관성 검토 및 수정 완료 후 상태 반영

---

## 이 문서의 목적

`docs/06_ai/ml_pipeline.md`와 `docs/06_ai/model_spec.md`를 작성·보완할 때 필요한 확정 내용을 정리한 문서.
01~05 설계서에서 AI 관련 결정 사항을 모두 추출하여 재정리했으므로, 반드시 이 문서를 읽은 뒤 작업한다.

---

## 프로젝트 개요

**사주라(Sajura)** — 소상공인(카페 등)을 위한 AI 기반 자동발주 및 매출분석 솔루션.

핵심 흐름:
```
POS 판매 데이터 수집
→ AI 수요예측 (메뉴별 1~3일 예상 판매량)
→ 추천발주 자동 생성 (AI Server)
→ 점주 확인/수정/승인
→ Playwright로 쿠팡 장바구니 자동 담기
→ 점주가 쿠팡에서 직접 결제
```

---

## 작업 방식 (반드시 준수)

- AI가 먼저 항목을 제안하고 담당자가 확정
- 확정된 내용은 즉시 문서에 반영
- 제안 시 **추가/제외 추천 항목을 항상 함께 제시**할 것
- 다른 문서와 연관된 내용이 나오면 해당 문서도 함께 업데이트할 것

---

## 01~05 확정 내용 전체 요약

### 1. 배치 스케줄

| 작업 | 실행 주기 | 트리거 |
|------|-----------|--------|
| 수요예측 + 추천발주 | 매일 02:00 | n8n 스케줄 |
| 모델 재학습 | 매주 일요일 02:00 | n8n 스케줄 |

- 스케줄러: **n8n** (APScheduler 미사용, n8n이 오케스트레이션 전담)
- 실패 시: **3회 자동 재시도 → Slack 알림** (개발팀 채널)
- 점주 수동 실행: `POST /api/pipeline/run` → Backend가 AIServerClient 호출

---

### 2. AI Server 구조

- Backend와 AI Server는 **별도 서버로 분리**
- 통신: `http://ai-server:8001` (내부 네트워크, 외부 노출 없음)
- AI Server prefix: `/ai/`

**n8n과 Backend의 역할 분리:**

| 주체 | 역할 |
|------|------|
| n8n | 정기 배치 오케스트레이션, DB 직접 조회/저장, 외부 API 수집, 전처리/정규화, AI Server 호출, 재시도, Slack 알림 |
| Backend (AIServerClient) | 점주/관리자 수동 실행 시 AI Server 호출 보조 |
| AI Server | 모델 연산 전담 (예측, 추천발주, 학습, SHAP) |

---

### 3. AI Server API (확정, api_spec.md 기준)

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/ai/forecast/predict` | 수요예측 실행 |
| `POST` | `/ai/orders/recommend` | 추천발주 생성 |
| `POST` | `/ai/forecast/train` | 모델 재학습 |
| `GET` | `/ai/forecast/status` | 작업 상태 조회 (`?job_id=uuid`) |
| `POST` | `/ai/xai/shap` | 상세 SHAP 값 생성 |
| `GET` | `/ai/health` | 헬스체크 |

**`POST /ai/forecast/predict` 입력:**
```json
{
  "store_id": "uuid",
  "target_date": "2026-05-07",
  "store_profile": { "business_type": "카페", "store_size": "SMALL", "operation_type": "HALL" },
  "menus": [...],
  "sales_data": [...],
  "weather_data": [...],
  "foot_traffic_data": [...],
  "search_trend_data": [...],
  "event_data": [...]
}
```

**`POST /ai/forecast/predict` 출력 — XAI 요약 포함:**
```json
{
  "target_date": "2026-05-07",
  "is_low_confidence": false,
  "predictions": [
    {
      "menu_id": "uuid",
      "predicted_quantity": 52,
      "confidence_score": 0.87,
      "explanation_text": "아메리카노 예상 판매량이 높은 주요 이유는 전주 동요일 판매량, 기온, 요일 효과입니다.",
      "top_factors": [
        { "feature": "전주 동요일 판매량", "value": 48, "contribution": 0.41, "direction": "positive" },
        { "feature": "기온", "value": 27.5, "contribution": 0.23, "direction": "positive" },
        { "feature": "요일", "value": "화요일", "contribution": 0.17, "direction": "positive" }
      ]
    }
  ]
}
```

> `explanation_text`와 `top_factors`는 예측 결과와 함께 즉시 반환되어 `forecast_results` 테이블에 저장된다.
> 상세 SHAP 값이 필요할 때는 `POST /ai/xai/shap`을 별도로 호출한다.

**`POST /ai/orders/recommend` 입력:**
```json
{
  "store_id": "uuid",
  "target_date": "2026-05-07",
  "forecast_results": [...],
  "recipes": [...],
  "inventory": [
    { "item_id": "uuid", "current_quantity": 2400.0, "unit": "g",
      "lead_time_days": 2, "safety_stock": 1000.0, "last_price": 28000 }
  ]
}
```

**`POST /ai/orders/recommend` 출력:**
```json
{
  "store_id": "uuid",
  "target_date": "2026-05-07",
  "recommendations": [
    {
      "item_id": "uuid",
      "recommended_quantity": 5000.0,
      "expected_stockout_date": "2026-05-09",
      "lead_time_days": 2,
      "safety_stock": 1000.0,
      "config_status": "USER_CONFIGURED",
      "recommendation_reason": "...",
      "top_factors": [...]
    }
  ]
}
```

`config_status` 값:
- `USER_CONFIGURED`: 리드타임과 안전재고 모두 점주가 직접 설정한 값
- `DEFAULT_USED`: 미설정 값이 있어 시스템 기본값(리드타임 1일, 안전재고 0) 사용

---

### 4. n8n DB 접근 권한 (확정)

n8n_user는 배치 산출물과 실행 이력에만 쓰기 권한을 가진다.

| 권한 | 테이블 |
|------|--------|
| SELECT | `stores`, `menus`, `recipes`, `recipe_ingredients`, `inventory_items`, `inventory_lots`, `sale_records`, `forecast_results`, `order_recommendations`, `order_recommendation_items`, `order_approval_logs` |
| INSERT | `pipeline_jobs`, `forecast_results`, `order_recommendations`, `order_recommendation_items` |
| UPDATE | `pipeline_jobs` |
| DELETE | **없음** |

> n8n은 운영 데이터 원본을 절대 삭제하지 않는다.

---

### 5. 관련 DB 테이블 (확정, schema.md 기준)

**forecast_results**
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
    explanation_text        TEXT            NULL,  -- Top-3 영향 변수 기반 자연어 설명
    top_factors             JSON            NULL,  -- Top-3 영향 변수 목록 및 기여도
    generated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_forecast_store_menu_date (store_id, menu_id, target_date)
);
```

**pipeline_jobs**
```sql
CREATE TABLE pipeline_jobs (
    job_id          CHAR(36)        NOT NULL,
    store_id        CHAR(36)        NOT NULL,
    type            ENUM('FORECAST','TRAIN')                     NOT NULL,
    status          ENUM('QUEUED','RUNNING','DONE','FAILED')     NOT NULL DEFAULT 'QUEUED',
    triggered_by    ENUM('USER','N8N')                           NOT NULL DEFAULT 'USER',
    started_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at     DATETIME        NULL,
    error_message   VARCHAR(500)    NULL
);
```

**order_recommendations**
```sql
CREATE TABLE order_recommendations (
    recommendation_id   CHAR(36)    NOT NULL,
    store_id            CHAR(36)    NOT NULL,
    target_date         DATE        NOT NULL,  -- 추천발주 대상 발주일 (n8n 배치 기준일)
    generated_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### 6. Backend AIServerClient 메서드 (확정, service_design.md 기준)

```
AIServerClient (인프라 레이어 — n8n 배치와 무관, Backend 수동 실행 전용)
  - predict(store_id, target_date, input_data) → PredictionResultDTO
  - recommend_order(store_id, target_date, forecast_results, recipes, inventory) → RecommendationResultDTO
  - train(store_id, training_data) → TrainJobDTO
  - get_job_status(job_id) → JobStatusDTO
  - get_shap(store_id, menu_id, target_date) → ShapDTO
  - health_check() → HealthDTO
```

---

### 7. 예측 결과 캐싱 (확정, service_design.md 기준)

| 항목 | 내용 |
|------|------|
| 전략 | Cache-Aside (Redis) |
| 캐시 키 | `forecast:{store_id}:{target_date}` |
| TTL | 24시간 |
| 무효화 시점 | 새 예측 실행 시 |

---

### 8. 신뢰도 낮음 판단 기준 (확정)

아래 조건 중 하나라도 해당하면 `is_low_confidence = 1` 처리 및 경고 배지 표시.

| 조건 | 기준 |
|------|------|
| MAPE | 20% 초과 |
| 학습 데이터 기간 | 30일 미만 |
| 최근 30일 결측값 비율 | 30% 초과 |

---

### 9. Cold-start 전략 (확정)

- 신규 매장 (자체 데이터 30일 미만): **유사 매장 데이터** 기반 예측 제공
- 유사 매장 기준: `stores.business_type` + `stores.store_size` + `stores.operation_type` 동일
- Cold-start 예측에는 반드시 "신뢰도 낮음" 경고 배지 표시
- 자체 데이터 30일 축적 후 자체 예측으로 자동 전환

---

### 10. 추천발주 산식 (확정, feature_spec.md 기준)

단위 통일 전처리 (계산 전 필수):

| 단위 그룹 | 기준 단위 |
|----------|-----------|
| 중량 | g (1 kg = 1,000 g) |
| 부피 | ml (1 L = 1,000 ml) |
| 개수 | 개 |

```
일일 소모량 = Σ (메뉴별 일일 예상 판매량 × 레시피 재료 사용량)
발주 필요량 = (일일 소모량 × 리드타임) + 안전재고 - 현재 재고
권장 발주 수량 = max(발주 필요량, 0)
예상 소진 시점 = 오늘 + (현재 재고 / 일일 소모량)
```

리드타임 또는 안전재고 미설정 시: 기본값(리드타임 1일, 안전재고 0) 사용 + `config_status = 'DEFAULT_USED'` 표시

---

### 11. 알림 정책 (확정)

| 알림 대상 | 채널 |
|----------|------|
| 점주 (재고부족, 소비기한 임박 등) | 앱 내 알림 (**푸시 알림 미사용**) |
| 파이프라인 실패 (3회 재시도 후) | **Slack** (개발팀) |

---

### 12. XAI 저장 구조 (확정)

- `forecast_results.explanation_text`: 예측 결과 화면에 표시되는 자연어 설명
- `forecast_results.top_factors`: JSON 형식, Top-3 영향 변수 목록 및 기여도
- 두 필드 모두 `POST /ai/forecast/predict` 응답에서 직접 반환받아 n8n이 저장
- 상세 SHAP 값은 `POST /ai/xai/shap` 별도 호출로 생성

---

### 13. 배치 파이프라인 전체 흐름 (확정)

**야간 예측 배치 (매일 02:00):**

| 단계 | 작업 | 실패 처리 |
|------|------|-----------|
| 1 | n8n → `pipeline_jobs` INSERT (status=RUNNING, triggered_by=N8N) | 3회 재시도 → Slack |
| 2 | n8n → DB에서 판매/메뉴/레시피/재고/설정 데이터 조회 | 3회 재시도 → Slack |
| 3 | n8n → 날씨/유동인구/행사 외부 API 수집 | 3회 재시도 → Slack |
| 4 | n8n → 전처리/정규화 (결측·이상치·단위통일·외부변수 병합) | 3회 재시도 → Slack |
| 5 | n8n → AI Server `POST /ai/forecast/predict` 호출 | 3회 재시도 → Slack |
| 6 | n8n → AI Server `POST /ai/orders/recommend` 호출 | 3회 재시도 → Slack |
| 7 | n8n → `forecast_results` INSERT/UPSERT | 3회 재시도 → Slack |
| 8 | n8n → `order_recommendations` + `order_recommendation_items` INSERT | 3회 재시도 → Slack |
| 9 | n8n → `pipeline_jobs` UPDATE (status=DONE 또는 FAILED) | 로깅만 |

**주간 재학습 배치 (매주 일요일 02:00):**

| 단계 | 작업 | 실패 처리 |
|------|------|-----------|
| 1 | n8n → `pipeline_jobs` INSERT (type=TRAIN, triggered_by=N8N) | 3회 재시도 → Slack |
| 2 | n8n → 판매/예측/점주수정이력/발주확정이력 조회 | 3회 재시도 → Slack |
| 3 | n8n → 학습 데이터 전처리/정규화 | 3회 재시도 → Slack |
| 4 | n8n → AI Server `POST /ai/forecast/train` 호출 | 3회 재시도 → Slack |
| 5 | n8n → AI Server `GET /ai/forecast/status` polling으로 완료 확인 | 3회 재시도 → Slack |
| 6 | n8n → `pipeline_jobs` UPDATE (status=DONE 또는 FAILED) | 로깅만 |

---

## 06_ai 현재 문서의 불일치 항목 (작업 전 먼저 수정)

### ml_pipeline.md

| 항목 | 현재 문서 내용 | 확정된 내용 |
|------|--------------|------------|
| 파이프라인 3단계 | "→ 알림(점주에게 푸시 발송)" | 앱 내 알림 (푸시 미사용) |
| 모니터링 (섹션 10) | "n8n 실행 결과 모니터링 대시보드를 제공한다" | `pipeline_jobs` 테이블 상태 + Slack 알림. 별도 n8n 대시보드 미사용 |
| 입력 데이터 (섹션 4) | 경제지표/검색량/SNS 노출도 "확실하지 않음" | MVP 범위 제외 권장 (확정 필요) |

### model_spec.md

| 항목 | 현재 문서 내용 | 확정된 내용 |
|------|--------------|------------|
| 신뢰도 낮음 기준 (섹션 9.4) | "신메뉴 출시 직후 / 특수 행사 등 미학습 변수" | MAPE > 20% OR 학습 데이터 30일 미만 OR 결측값 비율 30% 초과 |

---

## 06_ai 작업 대상 — 정의 필요한 항목

### ml_pipeline.md

- [ ] 외부 데이터 수집 항목 확정 (경제지표/검색량/SNS: MVP 포함 여부 결정)
- [ ] 결측값 처리 규칙 상세 (보간 방법 및 적용 기준)
- [ ] 이상치 탐지 기준 상세 (IQR vs Z-score 적용 조건)
- [ ] 슬라이딩 윈도우 N 값 확정 (학습에 사용할 최근 데이터 기간)
- [ ] Cold-start 파이프라인 분기 로직 (정상 경로와 분기 조건)
- [ ] 재학습 후 모델 교체 기준 (성능 임계값 기반 자동 교체 여부)

### model_spec.md

- [ ] 예측 문제 유형 확정: **Regression vs Classification**
- [ ] 학습/검증/테스트 분리 기준 (날짜 기반 시계열 분리 방식)
- [ ] 평가 지표 및 목표 성능 기준 (MAPE 목표값 등)
- [ ] LightGBM → DNN 전환 기준 (성능 조건 또는 데이터 규모 조건)
- [ ] SHAP 자연어 변환 템플릿 상세 정의
- [ ] 모델 버전 관리 방식 (저장 위치, 롤백 방법)
- [ ] 재학습 후 배포 승인 기준 (자동 배포 vs 수동 승인)

---

## 참고 — 미확정 항목 (검증 대상 아님)

| 항목 | 위치 | 비고 |
|------|------|------|
| 경제지표/검색량/SNS 데이터 | ml_pipeline.md | MVP 제외 권장 |
| LightGBM → DNN 전환 기준 | model_spec.md | 성능 데이터 확인 후 결정 |
| Regression vs Classification | model_spec.md | 문제 정의 시 확정 필요 |
| 슬라이딩 윈도우 N 값 | ml_pipeline.md | 초기 실험 후 확정 가능 |
