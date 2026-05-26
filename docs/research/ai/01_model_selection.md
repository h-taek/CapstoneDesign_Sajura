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

> 근거: `00_ml_guide_reference.md` PART 3-5 "부스팅이 안 맞을 때의 진단"

사주라 조건에서 DNN 전환 여부를 결정하는 진단 조건표:

| 진단 조건 | 사주라 예상 | 권장 방향 |
|---|---|---|
| 데이터 < 수천 행 | 매장별 가능성 높음 | DNN 과적합 위험 → LightGBM 유지 |
| 순서·시간 의존성 있음 | 판매 시계열 해당 | lag/rolling 피처 추가로 LightGBM에서 처리 |
| AutoML 리더보드에서 NN이 상위권 | 베이스라인 probe 후 확인 | DNN 도입 검토 |
| LightGBM이 리더보드 1~2위 유지 | probe 후 확인 | DNN 도입 보류 |

**결정 프로세스**: AutoGluon `best_quality`로 베이스라인 비교(§1 4단계 probe) → 부스팅이 리더보드 상위면 LightGBM 유지, FT-Transformer·NN_TORCH가 상위면 DNN 검토.

추가 조사 필요:
- 매장별 모델 vs 통합 모델 구조에서 DNN 학습 가능성
- 외생 변수(날씨·유동인구) 통합 시 LSTM/TimExer 효과

### 2.2 Regression vs Classification ✅ 확정

**결론: Regression (수량 직접 예측)**

- 메뉴별 1~3일 수요는 연속 정수값 → 회귀가 자연스럽다.
- 분류(수량 구간 예측)는 구간 경계 정의를 추가로 요구하고, 발주 계산 시 역변환 필요.
- 근거: `00_ml_guide_reference.md` PART 2-3 — 연속 y → `f_regression` / `mutual_info_regression` 경로. PART 4-4 회귀 평가 지표(MAE/MAPE/R²)가 직접 적용 가능.
- spec `model_spec.md` §3에 반영: "Regression 확정"

---

## 3. 추가 조사 필요 항목 (spec/08_ai에서 이동)

| 항목 | 연결 spec | 결정 필요 사항 | 상태 |
|------|----------|----------------|------|
| 학습/검증/테스트 데이터 분리 기준 | model_spec.md §7 | 날짜 기반 시계열 분리 방식(holdout/walk-forward) | ✅ §3.1 확정 |
| 평가 지표 선정(MAPE 사용 여부 포함) 및 목표 성능 | model_spec.md §6, mvp_scope.md §5, feature_spec.md §5.3 | 예측 정확도 측정 지표 선정·산식·목표값·신뢰도 낮음 임계값 | ✅ §3.2 후보 확정 / 목표값 probe 후 |
| Cold-start 파이프라인 분기 로직 | feature_spec.md §5.4 [2단계], ml_pipeline.md | 분기 판정 위치·유사 매장 매칭 알고리즘·결과 0개 대응·전환 트리거 | 🟡 검토 예정 |
| 예측 근거 산출 방법 및 출력 형태 | model_spec.md §9, ml_pipeline.md §9 | 산출 방법 및 출력 형태 | ✅ §3.3 확정 |
| 모델 버전 관리 방식 | (신규) | MLflow·W&B·자체 관리 비교 | 🟡 조사 필요 |
| 재학습 후 배포 승인·모델 교체 기준 | ml_pipeline.md §10 | 성능 임계값·자동 vs 수동·롤백 절차 | → `02_ml_pipeline_open_items.md` §6 |

### 3.1 학습·검증·테스트 분리 방식 ✅ 확정

**결론: Walk-forward CV (TimeSeriesSplit)**

- 사주라는 매장별 단일 시계열이므로, 무작위 K-fold 분할 시 미래 정보가 과거 학습에 새어 들어간다.
- 근거: `00_ml_guide_reference.md` PART 5-2 함정 4번 — "K-fold를 한 개의 긴 시계열에 적용하면 TimeSeriesSplit 필수"
- 구현: `sklearn.model_selection.TimeSeriesSplit(n_splits=5)` 또는 수동 walk-forward
- test set: 가장 최근 N일 hold-out (N은 probe 시 결정, 권장 30~60일)
- spec `model_spec.md` §7에 "Walk-forward CV (TimeSeriesSplit)" 반영

### 3.2 평가 지표 ✅ 후보 확정 (목표값은 probe 후)

**채택 지표 3종: MAE + MAPE + R²**

| 지표 | 산식 | 특징 | 비고 |
|---|---|---|---|
| **MAE** | mean(\|y - ŷ\|) | 절대 오차 평균, 이상치에 덜 민감 | 점주 직관적 이해 가능 |
| **MAPE** | mean(\|y - ŷ\| / y) × 100 | 비율 오차, 메뉴별 규모 차이 무관 | **y=0 시 정의 불가 → 0 판매일 처리 필요** |
| **R²** | 1 − SS_res/SS_tot | 0~1 설명력, baseline 비교 유용 | 음수 가능(baseline보다 나쁘면) |

> 근거: `00_ml_guide_reference.md` PART 4-4 회귀 평가 지표 목록

**MAPE 0 판매일 처리**: y=0인 행 제외하거나 sMAPE(대칭 MAPE)로 대체 — probe 후 결정.
목표값(MAPE XX% 이하 등)은 초기 LightGBM probe 후 `§4.2`에 기록.

### 3.3 예측 근거 산출 방법 ✅ 확정

**결론: LightGBM `gain` + TreeSHAP**

- 1차 스크리닝: `feature_importance(importance_type='gain')` — 손실 감소량 기준 (연속형 편향 없음)
- 최종 해석·보고: `shap.TreeExplainer` (일관성 공리 만족, Lundberg & Lee 2017 NeurIPS)
- 출력 형태: TreeSHAP global summary + 예측 인스턴스별 top-3 기여 피처
- 자연어 변환 여부: probe 후 결정 (출력 형태가 확정되어야 DB 컬럼 부활 가능)

> 근거: `00_ml_guide_reference.md` PART 2-4-7, PART 5-3 함정 11번 (LightGBM `split` 기본값 편향 경고)

**주의**: LightGBM 기본 `importance_type='split'`은 분할 횟수만 셈 → 자주 분할되는 연속형 변수가 과대평가됨. 항상 `importance_type='gain'` 명시.
spec 연동: `shap` 라이브러리를 AI Server 의존성에 추가.

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
