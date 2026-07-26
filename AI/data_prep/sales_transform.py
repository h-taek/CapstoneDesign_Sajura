"""매출리포트 → canonical 판매 데이터 변환 — M6.A1.

sales_decrypt.py가 복호화한 매출리포트 3개(2025-04-01~2026-04-16)에서
- '상품 주문 합계' → 일별·메뉴별 판매수량 (수요예측 타깃 원천)
- '결제 합계'     → 일별 매출 총계 (검증·보조 지표)
를 뽑아 processed/sales_daily_menu.{csv,parquet} / sales_daily_total.csv로 저장한다.

메뉴명 정규화: 1차 규칙(장식 문구 제거) + EDA(M6.A2 — notebooks/01_eda.ipynb §3) 확정 매핑
① 표기 이형 병합(마라전골→마라 전골) ② 대괄호 사이드 품목([쌈무] 등) 이름 복원·category 사이드
③ 카테고리 표준화는 category_std 컬럼으로 추가 제공(원본 category 보존).
원본명(menu_raw)은 항상 보존한다. 결측 보간·이상치 처리는 하지 않는다(M6.A4, 누수 방지).

실행: python AI/data_prep/sales_transform.py
"""

from __future__ import annotations

import re
import sys

import pandas as pd

from paths import PROCESSED_DIR

DECRYPTED_DIR = PROCESSED_DIR / "sales_decrypted"

# 수요(음식) 항목이 아닌 서비스성 행 — 제외하지 않고 플래그만 단다
SERVICE_ITEM_PATTERN = re.compile(r"배달료|포장비|리뷰|이벤트|서비스")
# 메뉴명 장식: ◤파격sale◢·[꼬소한]·【】 등 괄호 세그먼트
DECOR_PATTERN = re.compile(r"◤[^◢]*◢|\[[^\]]*\]|【[^】]*】|\([^)]*추가[^)]*\)")
# 이름 전체가 대괄호인 배달채널 사이드 품목 — [쌈무]·[파김치]·[공깃밥]
BRACKET_ONLY_PATTERN = re.compile(r"^\[[^\]]*\]$")
# EDA(M6.A2) 확정 — 동일 메뉴 표기 이형 병합
MENU_MERGE_MAP = {"마라전골": "마라 전골"}
# EDA(M6.A2) 확정 — 카테고리 표준화(재개장 후 POS 개편으로 생긴 비일관 흡수).
# 원본 category는 보존하고 category_std로 추가 제공. 화룡점정=볶음밥 마무리 → 식사.
CATEGORY_STD_MAP = {
    "안주류": "안주",
    "식사류": "식사",
    "시원한거": "음료",
    "화룡점정": "식사",
    "사리 및 추가재료": "사이드",
}


def clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [re.sub(r"\s+", "", str(c)) for c in df.columns]
    return df


def clean_menu_name(raw: str) -> str:
    name = DECOR_PATTERN.sub(" ", str(raw))
    name = re.sub(r"\s+", " ", name).strip()
    if not name:  # 이름 전체가 괄호 세그먼트([쌈무] 등)면 괄호만 벗겨 이름을 살린다
        name = re.sub(r"[\[\]【】◤◢]", "", str(raw)).strip()
    return MENU_MERGE_MAP.get(name, name)


def load_menu_sheet(path) -> pd.DataFrame:
    df = clean_columns(pd.read_excel(path, sheet_name="상품 주문 합계", engine="openpyxl"))
    df["기간"] = pd.to_datetime(df["기간"], errors="coerce")
    df["판매건수"] = pd.to_numeric(df["판매건수"], errors="coerce")
    df = df.dropna(subset=["기간", "판매건수"])

    out = pd.DataFrame(
        {
            "date": df["기간"],
            "menu_raw": df["상품명"].map(lambda s: re.sub(r"\s+", " ", str(s)).strip()),
            "category": df["카테고리"],
            "qty": df["판매건수"].astype(int),
            "price": pd.to_numeric(df["상품가격"], errors="coerce"),
            "amount_net": pd.to_numeric(df["실판매금액(할인,옵션포함)"], errors="coerce"),
            "source_file": path.stem,
        }
    )
    out["menu_clean"] = out["menu_raw"].map(clean_menu_name)
    # 대괄호 사이드 품목은 원본 category가 비어 있다 — 사이드로 채운다 (유상 판매라 서비스 아님)
    bracket_side = out["menu_raw"].str.match(BRACKET_ONLY_PATTERN) & out["category"].isna()
    out.loc[bracket_side, "category"] = "사이드"
    out["category_std"] = out["category"].map(lambda c: CATEGORY_STD_MAP.get(c, c))
    out["is_service_item"] = out["menu_raw"].str.contains(SERVICE_ITEM_PATTERN)
    return out


def load_total_sheet(path) -> pd.DataFrame:
    df = clean_columns(pd.read_excel(path, sheet_name="결제 합계", engine="openpyxl"))
    df["기간"] = pd.to_datetime(df["기간"], errors="coerce")
    df = df.dropna(subset=["기간"])
    return pd.DataFrame(
        {
            "date": df["기간"],
            "total_amount": pd.to_numeric(df["결제금액"], errors="coerce"),
            "tx_count": pd.to_numeric(df["결제건수"], errors="coerce"),
            "source_file": path.stem,
        }
    )


def main() -> int:
    files = sorted(DECRYPTED_DIR.glob("매출리포트-*.xlsx"))
    if not files:
        print(f"복호화본 없음: {DECRYPTED_DIR} — sales_decrypt.py 먼저 실행", file=sys.stderr)
        return 1

    menu = pd.concat([load_menu_sheet(f) for f in files], ignore_index=True)
    total = pd.concat([load_total_sheet(f) for f in files], ignore_index=True)

    # 파일 간 기간 중복 검사 — 같은 날짜가 두 파일에 있으면 이중 집계 위험
    dup_dates = total[total.duplicated(subset=["date"], keep=False)]
    if not dup_dates.empty:
        print(f"⚠️ 파일 간 날짜 중복 {dup_dates['date'].nunique()}일 — 수동 확인 필요")

    menu = menu.sort_values(["date", "menu_raw"]).reset_index(drop=True)
    total = total.sort_values("date").reset_index(drop=True)
    menu.to_csv(PROCESSED_DIR / "sales_daily_menu.csv", index=False)
    menu.to_parquet(PROCESSED_DIR / "sales_daily_menu.parquet", index=False)
    total.to_csv(PROCESSED_DIR / "sales_daily_total.csv", index=False)

    start, end = total["date"].min(), total["date"].max()
    calendar_days = (end - start).days + 1
    open_days = total["date"].nunique()
    print("=== 파일별 기간 ===")
    for f in files:
        t = total[total["source_file"] == f.stem]
        print(f"  {f.stem}: {t['date'].min().date()} ~ {t['date'].max().date()} ({len(t)}영업일)")
    print(f"\n전체: {start.date()} ~ {end.date()} — 캘린더 {calendar_days}일 중 영업일 {open_days}일"
          f" (휴무 추정 {calendar_days - open_days}일)")
    print(f"메뉴-일 행: {len(menu)} / 고유 메뉴 raw {menu['menu_raw'].nunique()}"
          f" → clean {menu['menu_clean'].nunique()} / 서비스성 행 {int(menu['is_service_item'].sum())}")
    print("\n판매량 상위 10 (clean 기준, 서비스 제외):")
    top = (menu[~menu["is_service_item"]].groupby("menu_clean")["qty"].sum()
           .sort_values(ascending=False).head(10))
    print(top.to_string())

    weather_path = PROCESSED_DIR / "weather_daily.parquet"
    if weather_path.exists():
        w = pd.read_parquet(weather_path, columns=["date"])
        covered = w["date"].min() <= start and w["date"].max() >= end
        print(f"\n기상 커버리지: {w['date'].min().date()}~{w['date'].max().date()}"
              f" ⊇ 판매기간 → {'✅ 전체 커버' if covered else '⚠️ 미커버 구간 있음'}")

    print(f"\n산출: {PROCESSED_DIR / 'sales_daily_menu.csv'} (+ .parquet), sales_daily_total.csv")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
