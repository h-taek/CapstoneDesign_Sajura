"""StoreService — service_design §4."""
from __future__ import annotations

import phonenumbers
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import errors
from app.models.store import OperationType, Store, StoreSize


def _normalize_phone_kr(raw: str | None) -> str | None:
    if not raw:
        return raw
    try:
        parsed = phonenumbers.parse(raw, "KR")
    except phonenumbers.NumberParseException as exc:
        raise errors.DomainError(
            status_code=400, error_code="VALIDATION_ERROR", message="전화번호 형식이 올바르지 않습니다."
        ) from exc
    if not phonenumbers.is_valid_number(parsed):
        raise errors.DomainError(
            status_code=400, error_code="VALIDATION_ERROR", message="유효하지 않은 전화번호입니다."
        )
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)


class StoreService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_store(self, user_id: str) -> Store:
        store = await self.session.scalar(select(Store).where(Store.user_id == user_id))
        if store is None:
            raise errors.DomainError(
                status_code=404, error_code="NOT_FOUND", message="매장 정보가 없습니다."
            )
        return store

    async def update_store(
        self, *, user_id: str,
        store_name: str | None = None, business_type: str | None = None,
        store_size: str | None = None, operation_type: str | None = None,
        address: str | None = None, phone: str | None = None,
    ) -> Store:
        store = await self.get_store(user_id)
        if store_name is not None:
            store.store_name = store_name
        if business_type is not None:
            store.business_type = business_type
        if store_size is not None:
            store.store_size = StoreSize(store_size)
        if operation_type is not None:
            store.operation_type = OperationType(operation_type)
        if address is not None:
            store.address = address
        if phone is not None:
            store.phone = _normalize_phone_kr(phone)
        await self.session.commit()
        await self.session.refresh(store)
        return store

    async def complete_onboarding(self, *, user_id: str) -> Store:
        store = await self.get_store(user_id)
        if not store.onboarding_completed:
            store.onboarding_completed = True
            await self.session.commit()
            await self.session.refresh(store)
        return store
