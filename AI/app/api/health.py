"""AI Server health endpoint — api_spec.md §8 GET /ai/health.

Phase 2 시점에는 모델 미로딩 상태이므로 `model_loaded=false`, `last_trained_at=null`.
실제 모델 로딩·학습 시각은 Phase 6/7 ai_model·ai_api 단계에서 채워 넣는다.
"""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "model_loaded": False,
        "last_trained_at": None,
    }
