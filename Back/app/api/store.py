"""/api/store — api_spec §3 (MVP)."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import CurrentUserDep, SessionDep
from app.schemas.store import (
    OnboardingCompleteResponse,
    StoreResponse,
    StoreUpdateRequest,
)
from app.services.store_service import StoreService

router = APIRouter(prefix="/api/store", tags=["store"])


def _to_dto(s) -> StoreResponse:
    return StoreResponse(
        store_id=s.store_id, store_name=s.store_name, business_no=s.business_no,
        business_type=s.business_type, store_size=s.store_size.value,
        operation_type=s.operation_type.value, address=s.address, phone=s.phone,
        onboarding_completed=bool(s.onboarding_completed), created_at=s.created_at,
    )


@router.get("", response_model=StoreResponse)
async def get_store(session: SessionDep, current: CurrentUserDep) -> StoreResponse:
    return _to_dto(await StoreService(session).get_store(current.user_id))


@router.patch("", response_model=StoreResponse)
async def update_store(
    payload: StoreUpdateRequest, session: SessionDep, current: CurrentUserDep
) -> StoreResponse:
    store = await StoreService(session).update_store(
        user_id=current.user_id,
        store_name=payload.store_name, business_type=payload.business_type,
        store_size=payload.store_size, operation_type=payload.operation_type,
        address=payload.address, phone=payload.phone,
    )
    return _to_dto(store)


@router.post("/onboarding/complete", response_model=OnboardingCompleteResponse)
async def complete_onboarding(
    session: SessionDep, current: CurrentUserDep
) -> OnboardingCompleteResponse:
    store = await StoreService(session).complete_onboarding(user_id=current.user_id)
    return OnboardingCompleteResponse(
        onboarding_completed=bool(store.onboarding_completed), store_id=store.store_id
    )
