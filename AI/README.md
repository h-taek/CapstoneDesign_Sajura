# 사주라 AI Server

`docs/spec/05_api/api_spec.md` §8 / `docs/spec/08_ai/` 기반 별도 FastAPI 서버.

## Phase 2 (현재)
- 빈 FastAPI 골격 + `GET /ai/health`만 구현
- 모델·전처리 라이브러리 미포함 (Phase 6 `ai_model` 확정 후 추가)

## 실행
```bash
cd AI
uv sync
uv run uvicorn app.main:app --reload --port 8001
```

## 배포
- 별도 컨테이너(`docker/ai/Dockerfile`)
- be+fe와는 HTTP API로만 연동 (`docs/README.md` §5 브랜치 전략 — `ai` 브랜치는 `main`으로 직접 PR)
