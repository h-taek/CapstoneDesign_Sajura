# 사주라 AI Server

`docs/spec/05_api/api_spec.md` §8 / `docs/spec/08_ai/` 기반 별도 FastAPI 서버.

## 현재 상태
- Phase 2: 빈 FastAPI 골격 + `GET /ai/health`
- Phase 6 (진행 중): 데이터 수집(M6.A1) — `data_prep/` 적재 스크립트 + `data/` 산출물
  - 데이터 카탈로그·검증 결과: [`data/README.md`](data/README.md)
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
```

## 배포
- 별도 컨테이너(`docker/ai/Dockerfile`)
- be+fe와는 HTTP API로만 연동 (`docs/README.md` §5 브랜치 전략 — `ai` 브랜치는 `main`으로 직접 PR)
