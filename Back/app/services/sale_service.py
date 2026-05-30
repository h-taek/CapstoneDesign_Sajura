"""SaleService — CSV 업로드 처리 (M4.B2).

핵심 정책:
- 청크 크기 = 1만 행 (메모리 부담 회피)
- 트랜잭션 단위 = 청크 1개 (부분 실패 시 청크 단위 롤백 → 그 이전 청크는 보존)
- UNIQUE(store_id, source, external_sale_id) 위반 행은 자동 skip
- menu_name → menu_id 매핑은 매장 메뉴 캐시 1회 조회 후 in-memory dict 매핑
- auto_create_menus=True 시 미등록 메뉴를 카테고리='자동등록', use_inventory_deduction=False
  로 즉시 생성하여 menu_map 갱신 (feature_spec §2.2 + §4.4 옵션).
- pandas의 sync I/O는 asyncio.to_thread로 워커 스레드에 위임해 이벤트 루프
  블록을 막는다(10만 행 ~12초 동안 다른 요청이 막히지 않게 함).
- auto_create_menus 상한: 업로드당 200개 + 매장 전체 1,000개. 초과 시 그 행은
  매핑 실패로 처리되며 결과에 사유 표시.
- skipped_reasons: 같은 사유(메뉴 매핑 실패/청크내 중복 영수증/DB 중복)는 메뉴명·
  카운트로 그룹 단위로 반환하여 결과 화면 가독성 확보.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from io import BytesIO
from typing import Iterator

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
AUTO_CATEGORY = "자동등록"
AUTO_CREATE_PER_UPLOAD_LIMIT = 200
STORE_MENU_HARD_LIMIT = 1_000


@dataclass
class UploadResult:
    imported: int = 0
    skipped: int = 0
    auto_created_menus: int = 0
    anomaly_count: int = 0
    # 행 단위 사유(adapter 변환 실패 등): "3행: 메뉴명 없음" 형태 그대로.
    _row_reasons: list[str] = field(default_factory=list)
    # 그룹 단위 사유: 메뉴명별 카운트.
    _unmapped_counts: dict[str, int] = field(default_factory=dict)
    _dup_in_chunk_counts: dict[str, int] = field(default_factory=dict)
    _dup_in_db_total: int = 0
    _auto_create_limit_hit: bool = False  # 사용자에게 알릴 안내 한 줄 트리거

    @property
    def skipped_reasons(self) -> list[str]:
        out = list(self._row_reasons)
        if self._unmapped_counts:
            parts = [f"{name} ({cnt}행)" for name, cnt in sorted(self._unmapped_counts.items())]
            out.append(f"매장 메뉴와 매핑 실패: {', '.join(parts)}")
        if self._dup_in_chunk_counts:
            parts = [f"{name} ({cnt}회)" for name, cnt in sorted(self._dup_in_chunk_counts.items())]
            out.append(f"같은 파일 안에서 영수증번호 중복: {', '.join(parts)}")
        if self._dup_in_db_total > 0:
            out.append(f"이미 저장된 영수증번호와 중복: {self._dup_in_db_total}건")
        if self._auto_create_limit_hit:
            out.append(
                "메뉴 자동 등록 상한에 도달했습니다 — "
                f"업로드당 {AUTO_CREATE_PER_UPLOAD_LIMIT}개 또는 매장당 {STORE_MENU_HARD_LIMIT}개 한도. "
                "메뉴 화면에서 정리 후 다시 시도하세요."
            )
        return out


class SaleService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upload_csv(
        self,
        *,
        store_id: str,
        file_bytes: bytes,
        adapter: CSVAdapter,
        auto_create_menus: bool = False,
        anomaly_detector: AnomalyDetector | None = None,
    ) -> UploadResult:
        detector = anomaly_detector or AnomalyDetector()
        result = UploadResult()

        menu_map = await self._load_menu_map(store_id=store_id)
        current_menu_count = len(menu_map)

        # pandas read_csv는 sync I/O. async 핸들러에서 직접 호출하면 이벤트 루프가
        # 행 수 × 파싱시간 동안 막힌다. 워커 스레드에 위임.
        try:
            chunks_iter = await asyncio.to_thread(
                _open_csv_iter, file_bytes, CHUNK_SIZE
            )
        except Exception as exc:
            raise errors.DomainError(
                status_code=422,
                error_code="CSV_PARSE_FAILED",
                message=f"CSV 파싱 실패: {exc}",
            ) from exc

        global_row_index = 0  # CSV 데이터 첫 행이 1
        first_chunk = True

        while True:
            chunk = await asyncio.to_thread(_next_chunk, chunks_iter)
            if chunk is None:
                break

            if first_chunk:
                missing = [c for c in adapter.required_columns() if c not in chunk.columns]
                if missing:
                    raise errors.DomainError(
                        status_code=422,
                        error_code="CSV_MISSING_COLUMNS",
                        message=f"필수 컬럼 누락: {', '.join(missing)}",
                    )
                first_chunk = False

            sales, sale_row_indices, global_row_index = await asyncio.to_thread(
                _normalize_chunk, chunk, adapter, global_row_index, result
            )

            if auto_create_menus:
                created = await self._auto_create_missing_menus(
                    store_id=store_id,
                    sales=sales,
                    menu_map=menu_map,
                    current_menu_count=current_menu_count,
                    result=result,
                )
                result.auto_created_menus += created
                current_menu_count += created

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

    async def _auto_create_missing_menus(
        self,
        *,
        store_id: str,
        sales: list[CommonSale],
        menu_map: dict[str, str],
        current_menu_count: int,
        result: UploadResult,
    ) -> int:
        """청크 안에서 매장 메뉴에 없는 이름들을 한 번에 등록.

        상한:
        - 업로드당 누적 AUTO_CREATE_PER_UPLOAD_LIMIT(200) 개
        - 매장 메뉴 총 STORE_MENU_HARD_LIMIT(1,000) 개 — auto 생성 + 기존 합

        상한 초과로 등록 못 한 메뉴는 menu_map에 안 올리고 그대로 둠 → 그 행은
        `_insert_chunk`에서 자연스럽게 매핑 실패 skip 처리됨.
        """
        first_unit_price: dict[str, int] = {}
        for s in sales:
            if s.menu_name in menu_map:
                continue
            first_unit_price.setdefault(s.menu_name, s.unit_price)

        if not first_unit_price:
            return 0

        per_upload_remaining = AUTO_CREATE_PER_UPLOAD_LIMIT - result.auto_created_menus
        store_remaining = STORE_MENU_HARD_LIMIT - current_menu_count
        budget = max(0, min(per_upload_remaining, store_remaining))

        if budget == 0:
            result._auto_create_limit_hit = True
            return 0

        items = list(first_unit_price.items())
        if len(items) > budget:
            result._auto_create_limit_hit = True
            items = items[:budget]

        new_menus = [
            Menu(
                store_id=store_id,
                name=name,
                category=AUTO_CATEGORY,
                price=price,
                is_active=True,
                use_inventory_deduction=False,
            )
            for name, price in items
        ]
        self.session.add_all(new_menus)
        await self.session.flush()
        for m in new_menus:
            menu_map[m.name] = m.menu_id
        return len(new_menus)

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

        for sale, _row_index in zip(sales, row_indices, strict=True):
            menu_id = menu_map.get(sale.menu_name)
            if menu_id is None:
                result.skipped += 1
                result._unmapped_counts[sale.menu_name] = (
                    result._unmapped_counts.get(sale.menu_name, 0) + 1
                )
                continue

            if sale.external_sale_id is not None:
                key = sale.external_sale_id
                if key in seen_external:
                    result.skipped += 1
                    result._dup_in_chunk_counts[key] = (
                        result._dup_in_chunk_counts.get(key, 0) + 1
                    )
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
            await self.session.commit()  # auto_create_menus 트랜잭션 마무리
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
            result._dup_in_db_total += ignored


# ----------------------------------------------------------------------
# 워커 스레드에서 실행되는 sync 헬퍼들 — 이벤트 루프 보호.
# ----------------------------------------------------------------------


def _open_csv_iter(file_bytes: bytes, chunk_size: int) -> Iterator[pd.DataFrame]:
    return pd.read_csv(
        BytesIO(file_bytes),
        chunksize=chunk_size,
        dtype=str,
        keep_default_na=False,
    )


def _next_chunk(it: Iterator[pd.DataFrame]) -> pd.DataFrame | None:
    try:
        return next(it)
    except StopIteration:
        return None


def _normalize_chunk(
    chunk: pd.DataFrame,
    adapter: CSVAdapter,
    start_row_index: int,
    result: UploadResult,
) -> tuple[list[CommonSale], list[int], int]:
    sales: list[CommonSale] = []
    sale_row_indices: list[int] = []
    idx = start_row_index
    for _, row in chunk.iterrows():
        idx += 1
        normalized = adapter.normalize(row.to_dict(), idx)
        if isinstance(normalized, SkipReason):
            result.skipped += 1
            result._row_reasons.append(normalized.format())
            continue
        sales.append(normalized)
        sale_row_indices.append(idx)
    return sales, sale_row_indices, idx
