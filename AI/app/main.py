"""AI Server entry — Phase 2 skeleton.

Spec refs:
  - docs/spec/05_api/api_spec.md §8 AI Server 연동 API
  - docs/spec/08_ai/model_spec.md §3 (초기 모델 미확정)
  - docs/plan/plan_gantt.md Phase 2 (3트랙 베이스 — AI Server)

Phase 6(ai_model)/Phase 7(ai_api)에서 /ai/forecast/predict,
/ai/orders/recommend, /ai/forecast/train, /ai/forecast/status 추가.
"""
from __future__ import annotations

from fastapi import FastAPI

from app.api.health import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(title="sajura-ai", version="0.1.0")
    app.include_router(health_router)
    return app


app = create_app()
