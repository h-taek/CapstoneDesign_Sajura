"""유동인구(대체) 적재 — M6.A1.

세담터에서 시간대별 유동인구 데이터셋을 확보하지 못해(사용자 확인), 대체로 확보한
세종시 행정동별 **월간** 생활인구·유동인구 리포트(조치원읍_YY_MM.xlsx)를 적재한다.

- 시트 '전년대비 인구 종합분석': 행정동 × (생활인구·유동인구·전년값) — 월간
- 시트 '평균대비 주민인구 및 생활인구 분포': 년월 × 행정동 × 성별 생활인구
- 월 단위 해상도이므로 일별 피처로 쓸 때는 **전월(lag) 값 조인**이 누수-safe —
  당월 값은 월이 끝나야 확정된다. 적용은 M6.A3 피처 설계에서.
- 원본의 증감률 컬럼은 배율 표기(±1.xx)라 혼동 여지가 있어 버리고 원값만 적재.

실행: python AI/data_prep/people_load.py
"""

from __future__ import annotations

import re
import sys

import pandas as pd

from paths import PROCESSED_DIR, RAW_DIR

PEOPLE_RAW_DIR = RAW_DIR / "people"
SHEET_SUMMARY = "전년대비 인구 종합분석"
SHEET_GENDER = "평균대비 주민인구 및 생활인구 분포"


def find_header_row(df: pd.DataFrame, key: str) -> int:
    hits = df.index[df.iloc[:, 0].astype(str).str.strip() == key]
    if hits.empty:
        raise ValueError(f"헤더 행('{key}') 못 찾음")
    return int(hits[0])


def month_from_name(path) -> str:
    m = re.search(r"_(\d{2})_(\d{2})", path.stem)
    if not m:
        raise ValueError(f"파일명에서 년월 파싱 실패: {path.name}")
    return f"20{m.group(1)}-{m.group(2)}"


def load_summary(path, xl: pd.ExcelFile) -> pd.DataFrame | None:
    if SHEET_SUMMARY not in xl.sheet_names:
        return None
    raw = xl.parse(SHEET_SUMMARY, header=None)
    h = find_header_row(raw, "행정동")
    df = raw.iloc[h + 1 :, :7].copy()
    df.columns = ["dong", "living_pop", "floating_pop", "living_pop_prev_y",
                  "_living_yoy", "floating_pop_prev_y", "_floating_yoy"]
    df = df.dropna(subset=["dong"]).drop(columns=["_living_yoy", "_floating_yoy"])
    for c in df.columns[1:]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df.insert(0, "month", month_from_name(path))
    return df


def load_gender(path, xl: pd.ExcelFile) -> pd.DataFrame | None:
    if SHEET_GENDER not in xl.sheet_names:
        return None
    raw = xl.parse(SHEET_GENDER, header=None)
    h = find_header_row(raw, "년월")
    df = raw.iloc[h + 1 :, :4].copy()
    df.columns = ["month_raw", "dong", "gender", "living_pop"]
    df = df.dropna(subset=["dong"])
    df["month"] = df["month_raw"].astype(str).str.strip().str.replace(
        r"^(\d{4})(\d{2})$", r"\1-\2", regex=True)
    df["living_pop"] = pd.to_numeric(df["living_pop"], errors="coerce")
    return df[["month", "dong", "gender", "living_pop"]]


def main() -> int:
    # 한글 파일명은 macOS에서 NFD로 저장돼 NFC 패턴 glob이 안 맞는다 — 확장자로만 매칭
    files = sorted(PEOPLE_RAW_DIR.glob("*.xlsx"))
    if not files:
        print(f"원본 없음: {PEOPLE_RAW_DIR}", file=sys.stderr)
        return 1

    summaries, genders, no_summary = [], [], []
    for f in files:
        xl = pd.ExcelFile(f, engine="openpyxl")
        s = load_summary(f, xl)
        if s is None:
            no_summary.append(f.name)
        else:
            summaries.append(s)
        g = load_gender(f, xl)
        if g is not None:
            genders.append(g)

    summary = pd.concat(summaries, ignore_index=True).sort_values(["month", "dong"])
    gender = pd.concat(genders, ignore_index=True).sort_values(["month", "dong", "gender"])
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    summary.to_csv(PROCESSED_DIR / "population_monthly.csv", index=False)
    gender.to_csv(PROCESSED_DIR / "population_monthly_gender.csv", index=False)

    jcw = summary[summary["dong"] == "조치원읍"]
    print(f"파일 {len(files)}개 → 종합 {len(summary)}행 / 성별 {len(gender)}행")
    if no_summary:
        print(f"⚠️ '{SHEET_SUMMARY}' 시트 없는 파일 {len(no_summary)}개: {no_summary}")
    print(f"\n조치원읍 월별 ({jcw['month'].min()} ~ {jcw['month'].max()}, {len(jcw)}개월):")
    print(jcw[["month", "living_pop", "floating_pop"]].to_string(index=False))
    missing = sorted(set(pd.period_range(jcw["month"].min(), jcw["month"].max(), freq="M")
                         .strftime("%Y-%m")) - set(jcw["month"]))
    if missing:
        print(f"⚠️ 조치원읍 누락 월: {missing}")
    print(f"\n산출: {PROCESSED_DIR / 'population_monthly.csv'} (+ _gender.csv)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
