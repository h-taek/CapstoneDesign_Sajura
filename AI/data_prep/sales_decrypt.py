"""매출리포트 복호화 + 스키마 파악 — M6.A1.

raw/sales/의 암호화된(CDFV2) POS 매출리포트를 복호화해 processed/sales_decrypted/에
저장하고, 시트·컬럼·기간을 덤프한다. canonical schema(일별·메뉴별 판매수량) 변환은
이 덤프로 원본 구조를 확인한 뒤 별도 단계에서 확정한다.

비밀번호: --password 인자 또는 환경변수 SALES_XLSX_PASSWORD, 둘 다 없으면 프롬프트.
복호화 산출물은 gitignore된 processed/ 하위에만 둔다(실매장 데이터 커밋 금지).

실행: SALES_XLSX_PASSWORD='...' python AI/data_prep/sales_decrypt.py
"""

from __future__ import annotations

import argparse
import getpass
import io
import os
import sys

import msoffcrypto
import pandas as pd

from paths import PROCESSED_DIR, RAW_DIR

SALES_RAW_DIR = RAW_DIR / "sales"
OUT_DIR = PROCESSED_DIR / "sales_decrypted"

ZIP_MAGIC = b"PK\x03\x04"  # xlsx(OOXML)
OLE_MAGIC = b"\xd0\xcf\x11\xe0"  # 구형 xls(BIFF) 컨테이너


def decrypt_one(path, password: str) -> tuple[bytes, str]:
    with open(path, "rb") as fh:
        office = msoffcrypto.OfficeFile(fh)
        office.load_key(password=password)
        buf = io.BytesIO()
        office.decrypt(buf)
    payload = buf.getvalue()
    if payload[:4] == ZIP_MAGIC:
        ext = "xlsx"
    elif payload[:4] == OLE_MAGIC:
        ext = "xls"
    else:
        ext = "bin"
    return payload, ext


def dump_schema(path, ext: str) -> None:
    engine = {"xlsx": "openpyxl", "xls": "xlrd"}.get(ext)
    if engine is None:
        print("  알 수 없는 포맷 — pandas 판독 생략")
        return
    sheets = pd.read_excel(path, sheet_name=None, engine=engine)
    for name, df in sheets.items():
        print(f"  시트 '{name}': {df.shape[0]}행 × {df.shape[1]}열")
        print(f"    컬럼: {list(df.columns)}")
        with pd.option_context("display.max_columns", None, "display.width", 200):
            print(df.head(3).to_string(max_colwidth=20))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--password", default=os.environ.get("SALES_XLSX_PASSWORD"))
    args = parser.parse_args()
    password = args.password or getpass.getpass("매출리포트 비밀번호: ")

    files = sorted(SALES_RAW_DIR.glob("매출리포트-*.xlsx"))
    if not files:
        print(f"원본 없음: {SALES_RAW_DIR}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    failed = 0
    for f in files:
        print(f"\n=== {f.name} ===")
        try:
            payload, ext = decrypt_one(f, password)
        except Exception as e:  # msoffcrypto는 오류 타입이 다양 — 사유만 출력
            print(f"  복호화 실패: {e}")
            failed += 1
            continue
        out = OUT_DIR / f"{f.stem}.{ext}"
        out.write_bytes(payload)
        print(f"  복호화 OK → {out.name} ({ext})")
        dump_schema(out, ext)

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
