"""판매 API 스키마 — api_spec §6."""
from __future__ import annotations

from pydantic import BaseModel, Field


class CSVUploadResponse(BaseModel):
    imported: int
    skipped: int
    skipped_reasons: list[str] = Field(default_factory=list)
    anomaly_count: int = 0
    auto_created_menus: int = 0
