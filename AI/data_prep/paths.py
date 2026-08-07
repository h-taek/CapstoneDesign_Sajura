"""data_prep 공통 경로 — AI/data/ 하위 구조의 단일 정의."""

from pathlib import Path

AI_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = AI_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
MANUAL_DIR = DATA_DIR / "manual"
