"""KAMIS(한국농수산식품유통공사) 농산물 가격정보 오픈API 어댑터.

홈 화면 "실시간 최저가 추천" — 식당에서 자주 쓰는 식자재 소매가 조회.
키 미설정 또는 KAMIS_API_STUB_MODE=true 시 샘플 데이터 반환 (nts.py와 동일 패턴).
실 연동은 action=dailySalesList (일별 소매가격정보) 사용 — https://www.kamis.or.kr Open-API #6.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

import httpx
from aiobreaker import CircuitBreaker
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import get_settings


class PriceDirection(str, Enum):
    UP = "UP"
    DOWN = "DOWN"
    SAME = "SAME"


@dataclass
class IngredientPrice:
    item_name: str
    price: int
    unit: str
    direction: PriceDirection
    change_percent: float


# 식당에서 자주 쓰는 식자재 위주 — 실 연동 시 KAMIS 품목코드로 교체 필요.
_STUB_ITEMS = [
    IngredientPrice("양파", 1980, "1kg", PriceDirection.DOWN, -3.2),
    IngredientPrice("대파", 2450, "1kg", PriceDirection.UP, 5.1),
    IngredientPrice("배추", 3200, "1포기", PriceDirection.SAME, 0.0),
    IngredientPrice("돼지고기(삼겹살)", 21500, "1kg", PriceDirection.DOWN, -1.8),
    IngredientPrice("계란", 6980, "30구", PriceDirection.UP, 2.4),
]

_breaker = CircuitBreaker(fail_max=5, timeout_duration=30)


@_breaker
@retry(
    retry=retry_if_exception_type((httpx.HTTPError,)),
    wait=wait_exponential(multiplier=0.5, max=5),
    stop=stop_after_attempt(3),
    reraise=True,
)
async def _call_kamis(item_code: str) -> dict:
    s = get_settings()
    params = {
        "action": "dailySalesList",
        "p_cert_key": s.KAMIS_API_CERT_KEY,
        "p_cert_id": s.KAMIS_API_CERT_ID,
        "p_returntype": "json",
        "p_item_code": item_code,
    }
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.get(s.KAMIS_API_BASE_URL, params=params)
    r.raise_for_status()
    return r.json()


def _parse_direction(raw: str) -> PriceDirection:
    return {"0": PriceDirection.DOWN, "1": PriceDirection.UP, "2": PriceDirection.SAME}.get(
        raw, PriceDirection.SAME
    )


async def get_ingredient_prices() -> list[IngredientPrice]:
    s = get_settings()
    if s.KAMIS_API_STUB_MODE or not s.KAMIS_API_CERT_KEY:
        return _STUB_ITEMS

    results: list[IngredientPrice] = []
    for stub in _STUB_ITEMS:  # 실 연동 전환 시 stub 목록의 이름을 실제 품목코드 매핑으로 교체
        try:
            payload = await _call_kamis(item_code="")
        except httpx.HTTPError:
            results.append(stub)  # 개별 품목 실패 시 샘플 값으로 대체(전체 응답 실패 방지)
            continue
        rows = (payload.get("price") or {}).get("item") or []
        if not rows:
            results.append(stub)
            continue
        row = rows[0]
        try:
            price = int(str(row.get("dpr1", "0")).replace(",", ""))
        except ValueError:
            results.append(stub)
            continue
        results.append(
            IngredientPrice(
                item_name=row.get("item_name") or stub.item_name,
                price=price,
                unit=row.get("unit") or stub.unit,
                direction=_parse_direction(str(row.get("direction", "2"))),
                change_percent=float(row.get("value") or 0.0),
            )
        )
    return results
