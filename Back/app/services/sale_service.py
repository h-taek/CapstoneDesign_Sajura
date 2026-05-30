"""SaleService — CSV 업로드 처리 (M4.B2).

핵심 정책:
- 청크 크기 = 1만 행 (메모리 부담 회피)
- 트랜잭션 단위 = 청크 1개 (부분 실패 시 청크 단위 롤백 → 그 이전 청크는 보존)
- UNIQUE(store_id, source, external_sale_id) 위반 행은 자동 skip
- menu_name → menu_id 매핑은 매장 메뉴 캐시 1회 조회 후 in-memory dict 매핑
"""
from __future__ import annotations

from dataclasses import dataclass, field
from io import BytesIO
from typing import IO

import pandas as pd
from sqlalchemy import select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.pos.csv_adapter import CSVAdapter, CommonSale, SkipReason
from app.core import errors
from app.models.menu import Menu
from app.models.sale_record import SaleRecord, SaleSource
from app.services.anomaly_detector import AnomalyDetector

CHUNK_SIZE = 10_000


@dataclass
class UploadResult:
    imported: int = 0
    skipped: int = 0
    skipped_reasons: list[str] = field(default_factory=list)
    anomaly_count: int = 0


class SaleService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upload_csv(
        self,
        *,
        store_id: str,
        file_bytes: bytes,
        adapter: CSVAdapter,
        anomaly_detector: AnomalyDetector | None = None,
    ) -> UploadResult:
        detector = anomaly_detector or AnomalyDetector()
        result = UploadResult()

        menu_map = await self._load_menu_map(store_id=store_id)

        try:
            chunks = pd.read_csv(
                BytesIO(file_bytes),
                chunksize=CHUNK_SIZE,
                dtype=str,
                keep_default_na=False,
            )
        except Exception as exc:
            raise errors.DomainError(
                status_code=422,
                error_code="CSV_PARSE_FAILED",
                message=f"CSV 파싱 실패: {exc}",
            ) from exc

        global_row_index = 0  # CSV 데이터 첫 행이 1
        first_chunk = True

        for chunk in chunks:
            if first_chunk:
                missing = [c for c in adapter.required_columns() if c not in chunk.columns]
                if missing:
                    raise errors.DomainError(
                        status_code=422,
                        error_code="CSV_MISSING_COLUMNS",
                        message=f"필수 컬럼 누락: {', '.join(missing)}",
                    )
                first_chunk = False

            sales: list[CommonSale] = []
            sale_row_indices: list[int] = []

            for _, row in chunk.iterrows():
                global_row_index += 1
                normalized = adapter.normalize(row.to_dict(), global_row_index)
                if isinstance(normalized, SkipReason):
                    result.skipped += 1
                    result.skipped_reasons.append(normalized.format())
                    continue
                sales.append(normalized)
                sale_row_indices.append(global_row_index)

            anomalies = detector.detect(sales)
            result.anomaly_count += len(anomalies)

            await self._insert_chunk(
                store_id=store_id,
                sales=sales,
                row_indices=sale_row_indices,
                menu_map=menu_map,
                result=result,
            )

        return result

    async def _load_menu_map(self, *, store_id: str) -> dict[str, str]:
        rows = (
            await self.session.scalars(
                select(Menu).where(Menu.store_id == store_id, Menu.is_deleted.is_(False))
            )
        ).all()
        return {m.name: m.menu_id for m in rows}

    async def _insert_chunk(
        self,
        *,
        store_id: str,
        sales: list[CommonSale],
        row_indices: list[int],
        menu_map: dict[str, str],
        result: UploadResult,
    ) -> None:
        rows_to_insert: list[dict] = []
        seen_external: set[str] = set()  # 같은 청크 내 중복 external_sale_id 미리 차단

        for sale, row_index in zip(sales, row_indices, strict=True):
            menu_id = menu_map.get(sale.menu_name)
            if menu_id is None:
                result.skipped += 1
                result.skipped_reasons.append(f"{row_index}행: 매장 메뉴와 매핑 실패")
                continue

            if sale.external_sale_id is not None:
                key = sale.external_sale_id
                if key in seen_external:
                    result.skipped += 1
                    result.skipped_reasons.append(f"{row_index}행: 중복 영수증번호")
                    continue
                seen_external.add(key)

            rows_to_insert.append({
                "store_id": store_id,
                "menu_id": menu_id,
                "external_sale_id": sale.external_sale_id,
                "quantity": sale.quantity,
                "unit_price": sale.unit_price,
                "total_price": sale.total_price,
                "sold_at": sale.sold_at,
                "source": SaleSource.CSV.value,
            })

        if not rows_to_insert:
            return

        # MySQL INSERT IGNORE — UNIQUE(store_id, source, external_sale_id)
        # 위반(과거 청크/과거 업로드와의 중복)은 자동 skip. 본 insert는
        # 청크 단위 트랜잭션이며, 청크 내 매핑 실패는 위에서 이미 제외.
        stmt = mysql_insert(SaleRecord).prefix_with("IGNORE").values(rows_to_insert)
        res = await self.session.execute(stmt)
        await self.session.commit()

        inserted = res.rowcount if res.rowcount is not None else len(rows_to_insert)
        ignored = len(rows_to_insert) - inserted
        result.imported += inserted
        if ignored > 0:
            result.skipped += ignored
            result.skipped_reasons.append(f"DB 중복(외부 영수증번호 기존 존재): {ignored}건")
