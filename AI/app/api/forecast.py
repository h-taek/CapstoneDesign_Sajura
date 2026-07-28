"""수요예측 라우터 — api_spec.md §8 (M7.A1 골격).

- POST /ai/forecast/predict [MVP]  : M7.A2에서 V1-t(모델 카드: notebooks/05) 연결
- POST /ai/forecast/train  [2단계] : 주간 재학습 트리거 — pipeline_jobs 연동은 M7.A5
- GET  /ai/forecast/status [MVP]   : 작업 상태 조회 — M7.A5

골격 단계에서는 계약(스키마)만 OpenAPI로 노출하고 501을 반환한다.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas import (
    JobStatusResponse,
    PredictRequest,
    PredictResponse,
    TrainRequest,
    TrainResponse,
)

router = APIRouter(prefix="/ai/forecast", tags=["forecast"])


@router.post("/predict", response_model=PredictResponse)
async def predict(body: PredictRequest) -> PredictResponse:
    raise HTTPException(status_code=501, detail="M7.A2에서 구현 — 초기 모델 V1-t (model_spec §3)")


@router.post("/train", response_model=TrainResponse)
async def train(body: TrainRequest) -> TrainResponse:
    raise HTTPException(status_code=501, detail="M7.A5에서 구현 — [2단계] 주간 재학습 트리거")


@router.get("/status", response_model=JobStatusResponse)
async def status(job_id: str) -> JobStatusResponse:
    raise HTTPException(status_code=501, detail="M7.A5에서 구현 — pipeline_jobs 상태 조회")
