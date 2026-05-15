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

## 2. 초기 모델 — 미확정 항목

> spec 확정분: XGBoost / LightGBM 계열을 초기 모델로 사용 (`docs/spec/08_ai/model_spec.md` 섹션 3).

### 2.1 LightGBM ↔ PyTorch DNN 전환 기준

- 현재 LightGBM이 초기, PyTorch DNN을 보조 스택으로 포함만 함.
- 전환 기준(데이터량·성능 임계값·외생 변수 수)이 미정.

조사 필요:
- DNN이 LightGBM을 능가하기 시작하는 데이터 규모 임계점
- 자동 전환 vs 수동 평가 후 전환

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
| 평가 지표·목표 성능 | model_spec.md §6 | MAPE 목표값, 부가 지표(RMSE, bias) |
| Cold-start 모델 상세 로직 | feature_spec.md §6.x, ml_pipeline.md | 학습 데이터 부족 매장의 추천 산출 방법 |
| SHAP 자연어 변환 템플릿 | model_spec.md §9.3 | 변수별 자연어 매핑 규칙, 임계값별 문장 패턴 |
| 모델 버전 관리 방식 | (신규) | MLflow·W&B·자체 관리 비교 |
| 재학습 후 배포 승인 기준 | ml_pipeline.md §10 | 성능 임계값 기반 자동 배포 vs 수동 승인 |

---

## 4. 신뢰도 낮음 판단 기준 — spec 보강 후보

> 현재 spec(`model_spec.md` §9.4)은 정성 기준만 있음. HANDOFF에서 정량 기준 전환 지시됨.

검토 중인 정량 기준:
- MAPE > 20%
- 학습 데이터 < 30일
- 결측값 비율 > 30%

조사 후 spec §9.4에 정량 기준으로 반영 예정.

---

## 5. 다음 단계

1. 각 항목별 후보 평가표 작성
2. 매장 데이터 샘플 확보 후 LightGBM vs LSTM 1차 벤치마크
3. 확정된 사항은 즉시 `docs/spec/08_ai/model_spec.md`에 반영하고 본 문서에서 제거
