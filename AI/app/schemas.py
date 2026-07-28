"""AI Server 요청/응답 스키마 — api_spec.md §8 정합 (M7.A1).

필드명·구조는 `docs/spec/05_api/api_spec.md` §8을 그대로 따른다(contract-first).
[조사 중] 표기 입력(search_trend_data·event_data)은 Optional.
예측 구간(P10/P90)·예측 근거(top_factors·sentence) 필드는 M6.A7·고도화 확정분 —
spec §8 갱신(docs PR)과 함께 M7.A2에서 응답에 추가한다.
"""
from __future__ import annotations

import datetime as dt

from pydantic import BaseModel, Field


# ── 공통 ──────────────────────────────────────────────────────
class StoreProfile(BaseModel):
    business_type: str
    store_size: str
    operation_type: str


class MenuIn(BaseModel):
    menu_id: str
    name: str
    category: str


class SalesRecord(BaseModel):
    date: dt.date
    menu_id: str
    quantity: int


class WeatherRecord(BaseModel):
    date: dt.date
    temperature: float
    rainfall: float
    humidity: float | None = None


class FootTrafficRecord(BaseModel):
    date: dt.date
    estimated_count: int


class SearchTrendRecord(BaseModel):  # [조사 중]
    date: dt.date
    keyword: str
    score: float


class EventRecord(BaseModel):  # [조사 중]
    date: dt.date
    event_name: str
    distance_km: float


# ── POST /ai/forecast/predict ────────────────────────────────
class PredictRequest(BaseModel):
    store_id: str
    target_date: dt.date
    store_profile: StoreProfile
    menus: list[MenuIn]
    sales_data: list[SalesRecord]
    weather_data: list[WeatherRecord]
    foot_traffic_data: list[FootTrafficRecord] = Field(default_factory=list)
    search_trend_data: list[SearchTrendRecord] = Field(default_factory=list)  # [조사 중]
    event_data: list[EventRecord] = Field(default_factory=list)  # [조사 중]


class MenuPrediction(BaseModel):
    menu_id: str
    predicted_quantity: int
    confidence_score: float
    # 예측 근거 필드(top_factors·sentence — model_spec §9 확정 형태)는 spec §8 갱신과 함께 추가


class PredictResponse(BaseModel):
    target_date: dt.date
    is_low_confidence: bool
    low_confidence_reason: str | None = None  # feature_spec §5.3 reason 코드 6종
    predictions: list[MenuPrediction]


# ── POST /ai/orders/recommend ────────────────────────────────
class ForecastResultIn(BaseModel):
    menu_id: str
    predicted_quantity: int
    confidence_score: float


class RecipeIn(BaseModel):
    menu_id: str
    item_id: str
    quantity_per_menu: float
    unit: str


class InventoryIn(BaseModel):
    item_id: str
    current_quantity: float
    unit: str
    lead_time_days: int
    safety_stock: float
    last_price: int | None = None


class RecommendRequest(BaseModel):
    store_id: str
    target_date: dt.date
    forecast_results: list[ForecastResultIn]
    recipes: list[RecipeIn]
    inventory: list[InventoryIn]


class Recommendation(BaseModel):
    item_id: str
    recommended_quantity: float
    expected_stockout_date: dt.date | None = None
    lead_time_days: int
    safety_stock: float
    config_status: str
    defaults_used: list[str] | None = None
    recommendation_reason: str


class RecommendResponse(BaseModel):
    store_id: str
    target_date: dt.date
    recommendations: list[Recommendation]


# ── POST /ai/forecast/train · GET /ai/forecast/status ───────
class TrainRequest(BaseModel):
    store_id: str
    training_data: list[SalesRecord]


class TrainResponse(BaseModel):
    job_id: str
    status: str  # QUEUED
    started_at: dt.datetime


class JobStatusResponse(BaseModel):
    job_id: str
    type: str  # TRAIN | PREDICT
    status: str  # QUEUED | RUNNING | DONE | FAILED
    started_at: dt.datetime
    finished_at: dt.datetime | None = None
    error_message: str | None = None


# ── GET /ai/health ───────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    last_trained_at: dt.datetime | None = None
