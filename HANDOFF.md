# 다음 작업 인수인계

다음 세션에서 수행할 작업의 컨텍스트와 진입점을 정리한다.
작업이 완료되면 이 파일의 해당 항목을 체크하고 `PROGRESS.md`를 업데이트한다.

---

## 다음 작업 목록

| 순서 | 작업 | 상태 |
|------|------|------|
| 1 | `docs/spec/06_ai/` 문서 완성 (ml_pipeline.md, model_spec.md) | ⬜ 예정 |
| 2 | `docs/research/` 문서 작성 | ⬜ 예정 |

---

## 작업 1: spec/06_ai 완성

### 시작 전 반드시 읽는다
- `docs/spec/prompts/06_ai_handoff.md` — 01~05 확정 내용 전체 요약 (AI Server API, DB 스키마, 배치 흐름, 캐싱, 신뢰도 기준 등)

### 작성 대상 파일
- `docs/spec/06_ai/ml_pipeline.md`
- `docs/spec/06_ai/model_spec.md`

### 작업 전 먼저 수정할 불일치 항목

**ml_pipeline.md**

| 항목 | 현재 내용 | 수정 방향 |
|------|----------|----------|
| 파이프라인 3단계 | "→ 알림(점주에게 푸시 발송)" | 앱 내 알림으로 수정 (푸시 미사용) |
| 모니터링 (섹션 10) | "n8n 대시보드 제공" | `pipeline_jobs` 테이블 상태 + Slack 알림으로 수정 |

**model_spec.md**

| 항목 | 현재 내용 | 수정 방향 |
|------|----------|----------|
| 신뢰도 낮음 기준 (섹션 9.4) | "신메뉴 출시 직후 / 특수 행사 등" | MAPE > 20% OR 학습 데이터 30일 미만 OR 결측값 비율 30% 초과 |

### 확정이 필요한 항목 (담당자와 논의 후 작성)

**ml_pipeline.md**
- [ ] 외부 데이터 수집 항목 확정 (경제지표/검색량/SNS — MVP 포함 여부)
- [ ] 결측값 처리 규칙 (보간 방법 및 적용 기준)
- [ ] 이상치 탐지 기준 (IQR vs Z-score)
- [ ] 슬라이딩 윈도우 N 값 (학습에 사용할 최근 데이터 기간)
- [ ] Cold-start 파이프라인 분기 로직
- [ ] 재학습 후 모델 교체 기준 (성능 임계값 기반 자동 교체 여부)

**model_spec.md**
- [ ] 예측 문제 유형 확정: Regression vs Classification
- [ ] 학습/검증/테스트 분리 기준 (날짜 기반 시계열 분리 방식)
- [ ] 평가 지표 및 목표 성능 기준 (MAPE 목표값)
- [ ] LightGBM → DNN 전환 기준
- [ ] SHAP 자연어 변환 템플릿 상세 정의
- [ ] 모델 버전 관리 방식 (저장 위치, 롤백 방법)
- [ ] 재학습 후 배포 승인 기준 (자동 배포 vs 수동 승인)

---

## 작업 2: research 문서 작성

### 목적
spec/06_ai 미확정 항목 및 구현 전 기술 결정을 위한 조사·분석.
조사 결과는 `docs/research/`에 저장하고, 확정된 내용은 해당 spec 문서에 반영한다.

### 저장 위치
`docs/research/` 폴더 내 자유롭게 파일명 지정
(예: `research_ml_model.md`, `research_external_data.md`)

### 조사 권장 항목

| 조사 주제 | 연결되는 미확정 항목 |
|----------|-------------------|
| LightGBM vs DNN 성능 비교 및 전환 기준 | model_spec.md — LightGBM → DNN 전환 기준 |
| 시계열 예측 문제 유형 (Regression vs Classification) | model_spec.md — 예측 문제 유형 |
| 슬라이딩 윈도우 크기 선택 근거 | ml_pipeline.md — 슬라이딩 윈도우 N 값 |
| 날씨·유동인구·행사 외부 데이터 API 수집 가능성 | ml_pipeline.md — 외부 데이터 수집 항목 |
| 이상치 탐지 방법론 (IQR vs Z-score 조건별 적용) | ml_pipeline.md — 이상치 탐지 기준 |
| SHAP 자연어 변환 템플릿 설계 방안 | model_spec.md — SHAP 자연어 변환 템플릿 |
| 모델 버전 관리 방식 (MLflow 등) | model_spec.md — 모델 버전 관리 방식 |

### 작성 후 처리
- 조사 결과로 확정된 사항은 즉시 해당 spec 문서에 반영
- `PROGRESS.md` 섹션 4(문서 수정 이력)에 변경 내용 기록
