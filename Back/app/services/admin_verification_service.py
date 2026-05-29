"""AdminVerificationService — 사업자 검증 심사 (M3.B9, role=ADMIN 전용).

심사 큐(PENDING) 조회, 업로드 등록증 파일 경로 제공, 승인/반려. 종합 관리도구는 [후속].
"""
from __future__ import annotations

from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core import errors
from app.models.store import BusinessStatus, Store
from app.models.user import User


class AdminVerificationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_pending(self, *, page: int = 1, size: int = 20) -> tuple[list[dict], int]:
        """business_status=PENDING 매장 심사 큐 (가입자 이메일 포함)."""
        base = select(Store, User.email).join(User, User.user_id == Store.user_id).where(
            Store.business_status == BusinessStatus.PENDING
        )
        total = await self.session.scalar(
            select(func.count()).select_from(base.subquery())
        ) or 0
        rows = (
            await self.session.execute(
                base.order_by(Store.updated_at).limit(size).offset((page - 1) * size)
            )
        ).all()
        items = [
            {
                "store_id": s.store_id,
                "user_email": email,
                "business_no": s.business_no,
                "business_status": s.business_status.value,
                "cert_url": f"/api/admin/verifications/{s.store_id}/cert" if s.business_cert_path else None,
                "submitted_at": s.updated_at,
            }
            for s, email in rows
        ]
        return items, int(total)

    async def _get_store(self, store_id: str) -> Store:
        store = await self.session.get(Store, store_id)
        if store is None:
            raise errors.DomainError(
                status_code=404, error_code="NOT_FOUND", message="매장을 찾을 수 없습니다."
            )
        return store

    async def get_cert_path(self, store_id: str) -> Path:
        """업로드된 등록증 파일의 절대 경로 (ADMIN 가드 하에서만 호출)."""
        store = await self._get_store(store_id)
        if not store.business_cert_path:
            raise errors.DomainError(
                status_code=404, error_code="NOT_FOUND", message="등록증 파일이 없습니다."
            )
        path = Path(get_settings().UPLOAD_DIR) / store.business_cert_path
        if not path.is_file():
            raise errors.DomainError(
                status_code=404, error_code="NOT_FOUND", message="등록증 파일이 없습니다."
            )
        return path

    async def approve(self, *, store_id: str, admin_user_id: str) -> Store:
        store = await self._get_store(store_id)
        store.business_status = BusinessStatus.VERIFIED
        store.business_reject_reason = None
        store.business_reviewed_by = admin_user_id
        await self.session.commit()
        await self.session.refresh(store)
        return store

    async def reject(self, *, store_id: str, admin_user_id: str, reason: str) -> Store:
        store = await self._get_store(store_id)
        store.business_status = BusinessStatus.REJECTED
        store.business_reject_reason = reason
        store.business_reviewed_by = admin_user_id
        await self.session.commit()
        await self.session.refresh(store)
        return store
