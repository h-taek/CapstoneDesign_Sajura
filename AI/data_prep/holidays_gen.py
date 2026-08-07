"""공휴일 캘린더 생성 — M6.A1.

`holidays` 패키지(KR)로 2020~2026 공휴일을 오프라인 생성하고, 패키지가 누락할 수
있는 선거일·임시공휴일을 수동 보정 리스트로 병합해 processed/holidays.csv로 저장한다.
KASI 특일정보 API는 사용하지 않는다(사용자 결정 — 오프라인 생성).

- 수동 보정 리스트는 2026-07 기준 정리. 2026년 하반기 임시공휴일 신설 여부는
  연말에 재확인 필요(생성 결과 검수 항목).

실행: python AI/data_prep/holidays_gen.py
"""

from __future__ import annotations

import datetime as dt

import holidays as holidays_pkg
import pandas as pd

from paths import PROCESSED_DIR

YEARS = range(2020, 2027)

# 패키지 누락 대비 수동 보정 — 이미 패키지에 있으면 추가하지 않는다
MANUAL_EXTRAS = {
    dt.date(2020, 4, 15): "제21대 국회의원선거",
    dt.date(2020, 8, 17): "임시공휴일(광복절 연휴)",
    dt.date(2022, 3, 9): "제20대 대통령선거",
    dt.date(2022, 6, 1): "제8회 전국동시지방선거",
    dt.date(2023, 10, 2): "임시공휴일(추석 연휴)",
    dt.date(2024, 4, 10): "제22대 국회의원선거",
    dt.date(2024, 10, 1): "임시공휴일(국군의날)",
    dt.date(2025, 1, 27): "임시공휴일(설 연휴)",
    dt.date(2025, 6, 3): "제21대 대통령선거",
    dt.date(2025, 10, 10): "임시공휴일(추석 연휴)",
    dt.date(2026, 6, 3): "제9회 전국동시지방선거",
}


def main() -> int:
    kr = holidays_pkg.KR(years=YEARS)

    rows = [
        {"date": date, "holiday_name": name, "source": "holidays_pkg"}
        for date, name in sorted(kr.items())
    ]
    added, covered = [], []
    for date, name in sorted(MANUAL_EXTRAS.items()):
        if date in kr:
            covered.append(f"{date} {name} (패키지: {kr[date]})")
        else:
            rows.append({"date": date, "holiday_name": name, "source": "manual"})
            added.append(f"{date} {name}")

    df = pd.DataFrame(rows).sort_values("date").reset_index(drop=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(PROCESSED_DIR / "holidays.csv", index=False)

    print(f"공휴일 {len(df)}건 (패키지 {len(kr)} + 수동 보정 {len(added)})")
    print(df.groupby(df["date"].map(lambda d: d.year)).size().rename("건수").to_string())
    if added:
        print("\n수동 보정으로 추가된 항목:")
        print("\n".join(f"  {s}" for s in added))
    if covered:
        print("\n패키지가 이미 포함한 보정 후보:")
        print("\n".join(f"  {s}" for s in covered))
    print(f"\n산출: {PROCESSED_DIR / 'holidays.csv'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
