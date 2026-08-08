"""식자재 가격 API 스키마 — 홈 화면 "실시간 최저가 추천"."""
from __future__ import annotations

from pydantic import BaseModel


class IngredientPriceResponse(BaseModel):
    item_name: str
    price: int
    unit: str
    direction: str  # UP | DOWN | SAME
    change_percent: float
    source: str = "KAMIS"
