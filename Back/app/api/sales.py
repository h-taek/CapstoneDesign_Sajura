"""/api/sales — api_spec §6 (M4.B2)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile, status

from app.adapters.pos.csv_adapter import CSVAdapter
from app.api.deps import CurrentUserDep, SessionDep
from app.core import errors
from app.schemas.sales import CSVUploadResponse
from app.services.sale_service import SaleService
from app.services.store_service import StoreService

router = APIRouter(prefix="/api/sales", tags=["sales"])

# 업로드 크기 상한 — 10만 행 CSV가 평균 5~10 MB 수준. 안전 마진으로 50 MB.
MAX_UPLOAD_BYTES = 50 * 1024 * 1024


@router.post("/upload", response_model=CSVUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_sales_csv(
    session: SessionDep,
    current: CurrentUserDep,
    file: Annotated[UploadFile, File(...)],
    date_column: Annotated[str, Form(...)],
    menu_column: Annotated[str, Form(...)],
    quantity_column: Annotated[str, Form(...)],
    price_column: Annotated[str, Form(...)],
    external_sale_id_column: Annotated[str | None, Form()] = None,
) -> CSVUploadResponse:
    """CSV 업로드 — feature_spec §4.4 + api_spec §6 POST /api/sales/upload."""
    store_id = (await StoreService(session).get_store(current.user_id)).store_id

    file_bytes = await file.read()
    if not file_bytes:
        raise errors.DomainError(
            status_code=422, error_code="EMPTY_FILE", message="빈 파일입니다."
        )
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise errors.DomainError(
            status_code=413,
            error_code="FILE_TOO_LARGE",
            message=f"파일이 너무 큽니다 (최대 {MAX_UPLOAD_BYTES // 1024 // 1024} MB).",
        )

    adapter = CSVAdapter(
        date_column=date_column,
        menu_column=menu_column,
        quantity_column=quantity_column,
        price_column=price_column,
        external_sale_id_column=external_sale_id_column or None,
    )

    result = await SaleService(session).upload_csv(
        store_id=store_id, file_bytes=file_bytes, adapter=adapter
    )
    return CSVUploadResponse(
        imported=result.imported,
        skipped=result.skipped,
        skipped_reasons=result.skipped_reasons,
        anomaly_count=result.anomaly_count,
    )
