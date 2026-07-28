"""모델 ② — 메뉴 비중 분해 (M7.A3, 채택 근거: notebooks/11_menu_decomposition.ipynb).

채택 정의(38차 후속 검증): **최근 28영업일 합산 수량 비중(S1)** — 요일 조건부(S2)·혼합(S3)은
검증 fold 5개 전패로 기각(요일이 바꾸는 것은 총량이지 메뉴 믹스가 아님 — 총량은 모델 ①의 몫).
역할 분담: 모델 ①(V1-t)이 "언제 얼마나", ②는 "무엇을". 매장별로 요청 이력에서 즉석 산출
(stateless) — "공통 분해 모델 없음"(38차 확정)과 정합.
"""
from __future__ import annotations

import pandas as pd

SHARE_WINDOW_OPEN_DAYS = 28  # 11 §판정 — S1 윈도우
MIN_MENU_OPEN_DAYS = 10      # 미만이면 분해 거부(422) — predictor.MIN_OPEN_DAYS와 동일 기준


def _window_days(menu_history: pd.DataFrame) -> list:
    """판매가 있었던 최근 28영업일 날짜 목록."""
    m = menu_history[menu_history["quantity"] > 0]
    return sorted(m["date"].unique())[-SHARE_WINDOW_OPEN_DAYS:]


def menu_shares(menu_history: pd.DataFrame) -> pd.Series:
    """menu_history(date·menu_id·quantity)에서 최근 28영업일 수량 비중 (합=1)."""
    win = menu_history[menu_history["date"].isin(_window_days(menu_history))
                       & (menu_history["quantity"] > 0)]
    qty = win.groupby("menu_id")["quantity"].sum().astype(float)
    return qty / qty.sum()


def qty_per_krw(menu_history: pd.DataFrame, sales_history: pd.DataFrame) -> float:
    """최근 28영업일의 (총 판매 수량 / 총 매출) — 예측 매출 → 총수량 환산 계수."""
    days = _window_days(menu_history)
    qty = float(menu_history[menu_history["date"].isin(days)]["quantity"].sum())
    sales = float(sales_history[sales_history["date"].isin(days)]["total_amount"].sum())
    return qty / sales if sales > 0 else 0.0
