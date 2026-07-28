# 사주라 AI Server

`docs/spec/05_api/api_spec.md` §8 / `docs/spec/08_ai/` 기반 별도 FastAPI 서버.

## 현재 상태
- Phase 2: 빈 FastAPI 골격 + `GET /ai/health`
- **Phase 6 모델링 마일스톤 전체 완료 (M6.A1~A9 ✅, 38차)** — 다음: ai → main 머지 PR + 담당자 검수 3건
  - 38차 범위 확정: **AI 책임 = 매출 예측(+고도화)** — 메뉴 분해는 공통 모델 없음, 재료 리스트업은 점주 관리
  - 데이터 카탈로그·검증 결과: [`data/README.md`](data/README.md)
  - EDA 보고서(분포·결측·이상치·관계): [`notebooks/01_eda.ipynb`](notebooks/01_eda.ipynb)
  - 피처 1차 선별(keep 14/hold 7/drop 16): [`notebooks/02_features.ipynb`](notebooks/02_features.ipynb) — 정의 SSOT는 `data_prep/features_build.py`
  - 전처리 규칙(보간·이상치·fold 확정): [`notebooks/03_preprocessing.ipynb`](notebooks/03_preprocessing.ipynb) — 규칙 SSOT는 `data_prep/preprocess.py`
  - 베이스라인 비교(12개 후보, 승자 = LGBM 비율 타깃 하이브리드): [`notebooks/04_baselines.ipynb`](notebooks/04_baselines.ipynb)
  - 초기 모델 확정(V1-t 튜닝·모델 카드·평가 지표): [`notebooks/05_model_selection.ipynb`](notebooks/05_model_selection.ipynb)
  - 매출 예측 고도화(다일 선행 계단·P10/P90 구간·expanding 윈도우 확정): [`notebooks/06_enhancement.ipynb`](notebooks/06_enhancement.ipynb)
  - XAI(TreeSHAP top-3 + rule-based 자연어 근거, API 스키마): [`notebooks/07_xai.ipynb`](notebooks/07_xai.ipynb)
  - 신뢰도 경고 기준(트리거 6종·배지율 18%·lift 1.85×): [`notebooks/08_confidence.ipynb`](notebooks/08_confidence.ipynb)
  - DNN probe(AutoGluon-TS — 보류 확정, Chronos cold-start 메모): [`notebooks/09_dnn_probe.ipynb`](notebooks/09_dnn_probe.ipynb) ※ 실행은 별도 `sajura-ag` env(autogluon 격리 — [ml] 미포함)
  - **공개 저장소 데이터 정책**: 실매장 매출 절대액·노트북 실행 출력은 커밋 금지 — 노트북은 출력 제거 상태로 추적하고, 수치·그림은 로컬 재실행으로 전량 재현한다 (원본 데이터는 `data/raw/`·`data/processed/` gitignore)
  - 런타임 의존성과 분리된 `[ml]` extra로 모델링 라이브러리 관리 (Docker 이미지 미포함)

## 실행 — AI Server
```bash
cd AI
uv sync
uv run uvicorn app.main:app --reload --port 8001
```

## 실행 — 모델링 환경 (Phase 6)
```bash
# python 3.12 env (conda 예시 — venv도 무방)
conda create -n sajura-ai python=3.12
conda install -n sajura-ai llvm-openmp   # macOS lightgbm의 libomp 의존
~/miniconda3/envs/sajura-ai/bin/pip install -e "AI[ml]"

# 데이터 적재 (원본은 data/raw/ — data/README.md 참조)
cd AI/data_prep
python weather_load.py    # 기상 CSV 병합 → processed/weather_daily.*
python holidays_gen.py    # 공휴일 2020~2026 → processed/holidays.csv
python sales_decrypt.py   # 매출리포트 복호화 (비밀번호 필요)
python sales_transform.py # 복호화본 → canonical 판매 데이터 + 커버리지 검사
python people_load.py     # 월간 생활·유동인구(조치원읍) → processed/population_monthly.*
python features_build.py  # 일별 피처 테이블(37열) → processed/features_daily.*
python preprocess.py      # (선택) 전처리 규칙 자가 점검 — 학습 시엔 import로 사용

# 노트북 실행 — 커밋본은 출력 제거 상태(매출 비공개 정책), 수치·그림은 실행해서 확인
cd ../notebooks
jupyter nbconvert --to notebook --execute --inplace 01_eda.ipynb 02_features.ipynb 03_preprocessing.ipynb 04_baselines.ipynb 05_model_selection.ipynb 06_enhancement.ipynb 07_xai.ipynb 08_confidence.ipynb
# ⚠️ 실행 후 커밋하려면 출력을 다시 비워야 한다: jupyter nbconvert --clear-output --inplace *.ipynb
```

## 배포
- 별도 컨테이너(`docker/ai/Dockerfile`)
- be+fe와는 HTTP API로만 연동 (`docs/README.md` §5 브랜치 전략 — `ai` 브랜치는 `main`으로 직접 PR)
