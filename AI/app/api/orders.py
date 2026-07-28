"""추천발주 라우터 — api_spec.md §8 POST /ai/orders/recommend (M7.A1 골격).

⚠️ 38차 AI 산출 범위 재확정(model_spec §3·§4)과의 정합 검토 대기:
기존 계약은 "메뉴별 예측 + 레시피 기반 발주량 산출"을 전제하나, 재확정 범위는
메뉴 분해 공통 모델 없음·재료 리스트업 점주 관리다. M7.A3에서 재설계(축소) 또는
보류를 담당자가 결정하기 전까지 계약 스키마만 노출하고 501을 유지한다.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas import RecommendRequest, RecommendResponse

router = APIRouter(prefix="/ai/orders", tags=["orders"])


@router.post("/recommend", response_model=RecommendResponse)
async def recommend(body: RecommendRequest) -> RecommendResponse:
    raise HTTPException(
        status_code=501,
        detail="M7.A3 재설계 결정 대기 — 38차 AI 산출 범위 재확정(model_spec §4) 참조",
    )
