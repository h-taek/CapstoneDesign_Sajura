"""기상 데이터 적재 — M6.A1.

세종시 AWS 관측소 일별 CSV(기상자료개방포털 다운로드본, CP949)를 병합·정규화해
processed/weather_daily.{csv,parquet}로 저장하고 적재 요약을 출력한다.

- 원본: AI/data/raw/weather/20XX년도_세종특별자치시_일별_기상데이터.csv (2020~2026)
- 관측소: 세종고운(494)·세종금남(496)·세종연서(611)·세종전의(629)
  조치원읍 최근접은 세종연서(611) — 피처 조인 기본 관측소.
- 날씨 API는 사용하지 않는다(사용자 결정). 기간 부족 시 동일 경로 추가 다운로드.

실행: python AI/data_prep/weather_load.py
"""

from __future__ import annotations

import sys

import pandas as pd

from paths import PROCESSED_DIR, RAW_DIR

WEATHER_RAW_DIR = RAW_DIR / "weather"

# 조치원읍 최근접 관측소 (연서면이 조치원 바로 인접)
PRIMARY_STATION_ID = 611

COLUMN_MAP = {
    "지점": "station_id",
    "지점명": "station_name",
    "일시": "date",
    "평균기온(°C)": "temp_avg",
    "최저기온(°C)": "temp_min",
    "최고기온(°C)": "temp_max",
    "일강수량(mm)": "precip_mm",
    "평균 풍속(m/s)": "wind_avg",
    "최대 순간 풍속(m/s)": "wind_max_inst",
}
# 극값 발생 시각·풍향 컬럼은 수요예측 피처로 쓰지 않아 제외한다.


def load_one(path) -> pd.DataFrame:
    for encoding in ("cp949", "utf-8-sig"):
        try:
            df = pd.read_csv(path, encoding=encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise UnicodeDecodeError("cp949/utf-8-sig", b"", 0, 1, f"인코딩 판별 실패: {path}")

    missing_cols = [c for c in COLUMN_MAP if c not in df.columns]
    if missing_cols:
        raise ValueError(f"{path.name}: 예상 컬럼 없음 {missing_cols} — 원본 형식 변경 여부 확인")

    df = df[list(COLUMN_MAP)].rename(columns=COLUMN_MAP)
    df["date"] = pd.to_datetime(df["date"], format="%Y-%m-%d")
    return df


def summarize(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for (sid, name), g in df.groupby(["station_id", "station_name"]):
        expected = (g["date"].max() - g["date"].min()).days + 1
        rows.append(
            {
                "station": f"{name}({sid})",
                "rows": len(g),
                "start": g["date"].min().date(),
                "end": g["date"].max().date(),
                "missing_dates": expected - g["date"].nunique(),
                "na_temp_avg": int(g["temp_avg"].isna().sum()),
                "na_precip": int(g["precip_mm"].isna().sum()),
            }
        )
    return pd.DataFrame(rows)


def main() -> int:
    files = sorted(WEATHER_RAW_DIR.glob("*.csv"))
    if not files:
        print(f"원본 CSV 없음: {WEATHER_RAW_DIR}", file=sys.stderr)
        return 1

    df = pd.concat([load_one(f) for f in files], ignore_index=True)
    df = df.drop_duplicates(subset=["station_id", "date"]).sort_values(["station_id", "date"])

    # 결측 보간은 하지 않는다 — 보간 규칙은 M6.A4에서 train 구간 기준으로 확정(누수 방지).
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(PROCESSED_DIR / "weather_daily.csv", index=False)
    df.to_parquet(PROCESSED_DIR / "weather_daily.parquet", index=False)

    print(f"파일 {len(files)}개 → {len(df)}행 적재")
    print(summarize(df).to_string(index=False))
    primary = df[df["station_id"] == PRIMARY_STATION_ID]
    print(
        f"\n기본 관측소 세종연서({PRIMARY_STATION_ID}): "
        f"{primary['date'].min().date()} ~ {primary['date'].max().date()} {len(primary)}행"
    )
    print(f"산출: {PROCESSED_DIR / 'weather_daily.csv'} (+ .parquet)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
