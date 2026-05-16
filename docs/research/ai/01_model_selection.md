# AI 모델 선택 — 조사 및 검토

> **목적**: `docs/spec/08_ai/model_spec.md`에 확정 사실로 반영하기 위한 미확정 항목을 조사한다.
> **연결 spec**: `docs/spec/08_ai/model_spec.md`, `docs/spec/08_ai/ml_pipeline.md`
> **상태 표기**: ✅ 확정 / 🟡 검토 중 / 🔵 보조 후보

---

## 1. 베이스라인 비교 — 미확정 단계

> spec 확정분(baseline 1~3단계)은 `docs/spec/08_ai/model_spec.md` 섹션 2 참조.

| 단계 | 모델 | 역할 | 상태 |
|---|---|---|---|
| 4 | LSTM / RNN | baseline 4단계 | 🟡 검토 예정 |
| 5 | TimExer | 외생 변수 통합 참고 아키텍처 | 🟡 검토 예정 |

### 1.1 검토 사항

- LSTM/RNN: POS 시계열 데이터의 장기 의존성 모델링 가능성. LightGBM 대비 성능 향상 폭과 학습 비용 비교 필요.
- TimExer: 외생 변수(날씨·유동인구·캘린더)와 시계열을 동시에 다루는 트랜스포머 아키텍처. 외부 변수 통합 효과성 검증 대상.

### 1.2 조사가 필요한 항목

- 매장 단위 데이터량(일별 판매 수십~수백 건) 기준 LSTM 학습 가능성·과적합 위험
- TimExer 오픈소스 가용성, 학습/추론 비용
- 매장별 모델 vs 통합 모델 구조에서의 적합도

---

## 2. 초기 모델 선정 — 미확정 항목

> spec(`model_spec.md` §3)에 "초기 AI 모델 = XGBoost/LightGBM, ML Server = LightGBM+SHAP" 가정이 사실처럼 적혀 있었으나, 모델 선정 자체가 미확정. spec에서 모델·라이브러리 명시를 모두 추상화하고 본 §2에서 결정 후 역반영.
>
> 베이스라인 비교 후보(이동평균/ARIMA/Prophet/XGBoost/LightGBM/LSTM/TimExer)는 비교 대상 목록으로 spec(`model_spec.md` §2)에 유지.

### 2.1 DNN 도입 여부 및 LightGBM ↔ DNN 전환 기준

> spec(`model_spec.md` §3)에 "PyTorch DNN 기술 스택 포함"이 사실처럼 적혀 있었으나, DNN 도입 자체가 미확정. spec에서 추상 표현으로 정리.

조사 필요:
- DNN 계열(PyTorch DNN, Transformer 변형 등) 도입 여부 자체
- 도입 시 LightGBM이 DNN을 능가/패배하기 시작하는 데이터 규모 임계점
- 자동 전환 vs 수동 평가 후 전환
- 외생 변수 수·계절성 패턴 복잡도에 따른 모델 선택

### 2.2 Regression vs Classification

- 메뉴별 1~3일 수요예측을 회귀(수량 직접 예측)로 풀지, 분류(수량 구간 예측)로 풀지 미정.

조사 필요:
- 추천발주 결정 단위에서 어떤 방식이 더 신뢰 가능한 출력을 주는가
- XAI(SHAP) 해석 용이성 차이

---

## 3. 추가 조사 필요 항목 (spec/08_ai에서 이동)

| 항목 | 연결 spec | 결정 필요 사항 |
|------|----------|----------------|
| 학습/검증/테스트 데이터 분리 기준 | model_spec.md §7 | 날짜 기반 시계열 분리 방식(holdout/walk-forward) |
| 평가 지표 선정(MAPE 사용 여부 포함) 및 목표 성능 | model_spec.md §6, mvp_scope.md §5, feature_spec.md ROI 대시보드 §8.2, feature_spec.md §5.3 | 예측 정확도 측정 지표(MAPE / RMSE / MAE / bias 등) 선정·산식·목표값·신뢰도 낮음 임계값 모두 미정. 결정 후 spec에 "예측 정확도 지표" 추상 표현 자리를 채움 |
| Cold-start 파이프라인 분기 로직 | feature_spec.md §5.4 [2단계], ml_pipeline.md | 정상 경로 vs Cold-start 경로 분기 판정 위치(n8n/AI Server)·유사 매장 매칭 알고리즘·매칭 결과 0개 대응·자체 데이터 전환 트리거. 전략 자체(유사 매장 기반·신뢰도 낮음 배지·자체 데이터 30일 후 전환)는 spec 유지 |
| 예측 근거 산출 방법 및 출력 형태 | model_spec.md §9, ml_pipeline.md §9, feature_spec.md §5·§9·§12, api_spec.md AI Server API, schema.md `forecast_results`, service_design.md AIServerClient, sequence.md | 산출 방법(SHAP·Feature Importance·기타 후보) 및 출력 형태(자연어·표·수치 등) 모두 미확정. 결정 후 spec에 (1) 산출 방법 한 줄, (2) 출력 형태에 따른 DB 컬럼/API 응답 필드/엔드포인트 부활 또는 신규 정의. 자연어 채택 시 변수별 매핑 규칙·임계값별 문장 패턴·예외 처리 별도 정의 |
| 모델 버전 관리 방식 | (신규) | MLflow·W&B·자체 관리 비교 |
| 재학습 후 배포 승인·모델 교체 기준 | ml_pipeline.md §10 | → `02_ml_pipeline_open_items.md` §6에서 통합 결정 (성능 임계값·자동 vs 수동·롤백 절차) |

---

## 4. 신뢰도 낮음 판단 기준 — AI probe 후 확정

> 임계값은 실제 모델 학습·평가 데이터 없이 사전 확정 불가. 모든 정량 기준은 초기 모델 학습·평가(이하 AI probe) 완료 후 spec(`feature_spec.md` §5.3)에 정량 기준으로 역반영한다.
> spec에서는 잠정값을 제거하고 본 §4를 참조하도록 정리 완료.
> **예측 정확도 지표 선정(MAPE 사용 여부 포함)은 본 §3 표에서 별도 결정**. §4.1 잠정 임계값은 "지표 = MAPE" 가정 하의 placeholder이며, §3 결정 후 본 §4 재검토 대상.

### 4.1 잠정 임계값 (probe 전 가설)

| 조건 | 잠정 기준값 |
|---|---|
| MAPE | 20% 초과 |
| 학습 데이터 기간 | 30일 미만 |
| 최근 30일 결측값 비율 | 30% 초과 |

### 4.2 MVP 예측 품질 잠정 목표

| 지표 | MVP 잠정 목표 | 비고 |
|---|---|---|
| MAPE | 30% 이하 | 초기 모델 기준, probe 후 재조정 |

### 4.3 probe 후 확정 절차

1. 초기 LightGBM 모델 학습·검증 (`docs/research/ai/02_ml_pipeline_open_items.md` §1~3 결정 이후)
2. 검증 데이터로 MAPE·결측 비율·학습량별 성능 곡선 측정
3. 임계값 후보 조정 → `feature_spec.md` §5.3 표 부활 + `mvp_scope.md` 예측 품질 기준 부활
4. 동시에 PROGRESS.md §3에 정책 결정 기록

---

## 5. 다음 단계

1. 각 항목별 후보 평가표 작성
2. 매장 데이터 샘플 확보 후 LightGBM vs LSTM 1차 벤치마크
3. 확정된 사항은 즉시 `docs/spec/08_ai/model_spec.md`에 반영하고 본 문서에서 제거
