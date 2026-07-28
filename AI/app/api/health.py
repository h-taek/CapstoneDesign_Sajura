"""AI Server health endpoint — api_spec.md §8 GET /ai/health.

M7.A1 시점에는 모델 미로딩 상태이므로 `model_loaded=false`, `last_trained_at=null`.
모델 로딩·학습 시각·컴포넌트 상태 확장은 M7.A2(모델 연결)·M7.A6에서 채워 넣는다.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas import HealthResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", model_loaded=False, last_trained_at=None)
