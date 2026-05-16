# 모델 설계서

## 1. 모델 목적

- 과거 주문 데이터와 외부 변수 데이터를 기반으로 미래 수요를 예측한다.
- 과거 발주 데이터와 수요 예측을 기반으로 미래 발주를 예측한다.
- 예측 결과의 근거를 점주가 이해할 수 있도록 설명을 제공한다 (산출 방법·출력 형태는 `docs/research/ai/01_model_selection.md` §3 확정).

## 2. 베이스라인 비교 순서

| 순서 | 모델 | 역할 |
|---|---|---|
| 1 | 이동평균 | baseline 1단계 |
| 2 | ARIMA / Prophet | baseline 2단계 |
| 3 | XGBoost / LightGBM | baseline 3단계 |

> baseline 4단계(LSTM/RNN)·5단계(TimExer)는 조사 중. 진행 상황은 `docs/research/ai/01_model_selection.md` §1 참조.

## 3. 초기 모델

- 초기 AI 모델 및 ML Server 사용 라이브러리는 미확정 (`docs/research/ai/01_model_selection.md` §2 확정 — 베이스라인 비교 후보 중 선정).
- DNN 계열(PyTorch 등) 도입 여부 및 모델 간 전환 기준, Regression vs Classification 선택은 조사 중. `docs/research/ai/01_model_selection.md` §2 참조.

## 4. 예측 대상

- 메뉴별 1-3일 예상 수요
- 품목별 권장 발주 수량
- 예상 소진 시점

## 5. 입력 피처

| 피처 그룹 | 항목 |
|---|---|
| 판매 | POS 판매 데이터, 날짜/시간, 매장 ID, 메뉴 ID, 판매 수량 |
| 재고/레시피 | 식자재 ID, 레시피 소모량, 현재 재고, 리드타임 |
| 날씨 | 날씨, 기온, 강수 |
| 캘린더 | 공휴일, 요일, 시간대, 특수일 |
| 지역 | 서울시 유동인구, 주변 행사 정보[조사 중] |
| 기타 외부 변수 | 경제지표[조사 중], 검색량[조사 중], 프로모션[조사 중], SNS 노출도[조사 중] |

## 6. 출력

- 메뉴별 1-3일 예상 수요
- 추천발주 수량
- 예측 근거 (산출 방법·출력 형태는 `docs/research/ai/01_model_selection.md` §3 확정)
- 예측 신뢰도 낮음 경고 배지

## 7. 학습 방식

- n8n을 통해 데이터를 주기적으로 수집한다.
- 배치 학습 방식을 사용한다.
- 주간 단위 정기 재학습을 수행한다.
- 학습 데이터 사용 방식(슬라이딩 윈도우 적용 여부·창 크기 등)은 `docs/research/ai/02_ml_pipeline_open_items.md` §2에서 확정한다.
- 판매 결과 및 폐기 데이터를 모델 업데이트에 반영한다.
- 점주 수정 이력을 재학습에 반영한다.

## 8. 예측 방식

- 사전 배치 계산 후 DB에 저장한다.
- 사용자 요청 시 DB에 저장된 결과를 즉시 반환한다.
- 저장 결과가 없으면 AI Server 직접 호출 후 결과를 저장한다.

## 9. 예측 근거 설계

- 예측 결과의 근거를 점주가 이해할 수 있도록 제공한다.
- 산출 방법 및 출력 형태는 `docs/research/ai/01_model_selection.md` §3 확정.
- 신뢰도 경고 기준은 §5.3 (`feature_spec.md`) 참조.

---

> 미확정 항목(데이터 분리·평가 지표·전환 기준·Regression vs Classification·Cold-start·예측 근거 산출 방법 및 출력 형태)은 `docs/research/ai/01_model_selection.md` §3 참조.
